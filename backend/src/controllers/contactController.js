const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

require('../models/associations');
const { ContactMessage, User } = require('../models/associations');
const { verifyAdminPassword } = require('../utils/adminAuth');
const { hasMailTransport, sendContactNotificationEmail, sendContactConfirmationEmail } = require('../utils/mail');

const submitContactMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, email, subject, message } = req.body;
    const userId = req.user?.userId || null;

    const contactMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      userId,
      status: 'new',
    });

    let confirmationEmailSent = false;

    if (hasMailTransport()) {
      try {
        await sendContactNotificationEmail({
          name: contactMessage.name,
          email: contactMessage.email,
          subject: contactMessage.subject,
          message: contactMessage.message,
        });
      } catch (mailError) {
        console.error('Contact notification email failed:', mailError);
      }

      try {
        await sendContactConfirmationEmail({
          name: contactMessage.name,
          email: contactMessage.email,
          subject: contactMessage.subject,
        });
        confirmationEmailSent = true;
      } catch (mailError) {
        console.error('Contact confirmation email failed:', mailError);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        id: contactMessage.id,
        email: contactMessage.email,
        confirmationEmailSent,
      },
      message: `We received your message and will contact you at ${contactMessage.email}.`,
    });
  } catch (error) {
    console.error('Submit contact message error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const listMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const { status, q } = req.query;

    const where = {};
    if (status) where.status = status;

    if (q) {
      const searchTerm = q.trim();
      where[Op.or] = [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { email: { [Op.iLike]: `%${searchTerm}%` } },
        { subject: { [Op.iLike]: `%${searchTerm}%` } },
      ];
    }

    const { count, rows } = await ContactMessage.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'email', 'firstName', 'lastName'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        messages: rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalMessages: count,
          perPage: limit,
        },
      },
    });
  } catch (error) {
    console.error('List contact messages error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMessageById = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await ContactMessage.findByPk(id, {
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'email', 'firstName', 'lastName'],
          required: false,
        },
      ],
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.status === 'new') {
      await message.update({ status: 'read' });
      await message.reload({
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'email', 'firstName', 'lastName'],
            required: false,
          },
        ],
      });
    }

    res.json({ success: true, data: { message: message.toJSON() } });
  } catch (error) {
    console.error('Get contact message error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['new', 'read', 'archived'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: new, read, archived',
      });
    }

    const message = await ContactMessage.findByPk(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    await message.update({ status });

    await message.reload({
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'email', 'firstName', 'lastName'],
          required: false,
        },
      ],
    });

    res.json({ success: true, data: { message: message.toJSON() } });
  } catch (error) {
    console.error('Update contact message status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const passwordCheck = await verifyAdminPassword(req);
    if (!passwordCheck.valid) {
      return res.status(passwordCheck.status).json({
        success: false,
        message: passwordCheck.message,
      });
    }

    const message = await ContactMessage.findByPk(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    await message.destroy();

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Delete contact message error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const bulkDeleteMessages = async (req, res) => {
  try {
    const { messageIds } = req.body;

    const passwordCheck = await verifyAdminPassword(req);
    if (!passwordCheck.valid) {
      return res.status(passwordCheck.status).json({
        success: false,
        message: passwordCheck.message,
      });
    }

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No messages selected for deletion',
      });
    }

    const uniqueIds = [...new Set(messageIds.map((id) => String(id).trim()).filter(Boolean))];
    const deleted = [];
    const skipped = [];

    for (const messageId of uniqueIds) {
      const message = await ContactMessage.findByPk(messageId);
      if (message) {
        await message.destroy();
        deleted.push({ id: messageId });
      } else {
        skipped.push({ id: messageId, reason: 'Message not found' });
      }
    }

    res.json({
      success: true,
      message: `Deleted ${deleted.length} message(s)${skipped.length ? `, skipped ${skipped.length}` : ''}`,
      data: { deleted, skipped },
    });
  } catch (error) {
    console.error('Bulk delete contact messages error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const bulkUpdateMessageStatus = async (req, res) => {
  try {
    const { messageIds, status } = req.body;

    const allowedStatuses = ['read', 'archived'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: read, archived',
      });
    }

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No messages selected',
      });
    }

    const uniqueIds = [...new Set(messageIds.map((id) => String(id).trim()).filter(Boolean))];
    const updated = [];
    const skipped = [];

    for (const messageId of uniqueIds) {
      const message = await ContactMessage.findByPk(messageId);
      if (message) {
        await message.update({ status });
        updated.push({ id: messageId });
      } else {
        skipped.push({ id: messageId, reason: 'Message not found' });
      }
    }

    res.json({
      success: true,
      message: `Updated ${updated.length} message(s)${skipped.length ? `, skipped ${skipped.length}` : ''}`,
      data: { updated, skipped },
    });
  } catch (error) {
    console.error('Bulk update contact message status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const countNewMessages = async (req, res) => {
  try {
    const newMessages = await ContactMessage.findAll({
      where: { status: 'new' },
      attributes: ['id'],
      order: [['createdAt', 'DESC']],
    });

    const messageIds = newMessages.map((m) => m.id);
    const count = messageIds.length;

    res.json({ success: true, data: { count, messageIds } });
  } catch (error) {
    console.error('Count new messages error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  submitContactMessage,
  listMessages,
  getMessageById,
  updateMessageStatus,
  deleteMessage,
  bulkDeleteMessages,
  bulkUpdateMessageStatus,
  countNewMessages,
};
