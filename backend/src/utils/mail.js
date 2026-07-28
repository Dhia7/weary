const axios = require('axios');
const nodemailer = require('nodemailer');

function hasMailTransport() {
  if (process.env.RESEND_API_KEY) return true;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return true;
  return false;
}

function getFromAddress() {
  return (
    process.env.MAIL_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.SMTP_USER ||
    'Wear <onboarding@resend.dev>'
  );
}

async function sendViaResend({ to, subject, html, text }) {
  await axios.post(
    'https://api.resend.com/emails',
    {
      from: getFromAddress(),
      to: [to],
      subject,
      html: html || undefined,
      text: text || undefined,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

let smtpTransporter;

function getSmtpTransporter() {
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return smtpTransporter;
}

async function sendViaSmtp({ to, subject, html, text }) {
  const transporter = getSmtpTransporter();
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}

async function sendEmail({ to, subject, html, text }) {
  if (process.env.RESEND_API_KEY) {
    await sendViaResend({ to, subject, html, text });
    return;
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    await sendViaSmtp({ to, subject, html, text });
    return;
  }
  throw new Error('No email transport configured (set RESEND_API_KEY or SMTP_*)');
}

async function sendVerificationEmail(to, verifyUrl, firstName) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const subject = 'Verify your Wear account';
  const text = `${greeting}\n\nVerify your email by opening this link:\n${verifyUrl}\n\nIf you did not create an account, you can ignore this email.`;
  const html = `<p>${greeting}</p><p>Verify your email by clicking below:</p><p><a href="${verifyUrl}">Verify email</a></p><p style="word-break:break-all">${verifyUrl}</p><p>If you did not create an account, you can ignore this email.</p>`;
  await sendEmail({ to, subject, text, html });
}

async function sendPasswordResetEmail(to, resetUrl, firstName) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const subject = 'Reset your Wear password';
  const text = `${greeting}\n\nReset your password by opening this link (valid for 10 minutes):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html = `<p>${greeting}</p><p>Reset your password by clicking below (link valid for 10 minutes):</p><p><a href="${resetUrl}">Reset password</a></p><p style="word-break:break-all">${resetUrl}</p><p>If you did not request this, you can ignore this email.</p>`;
  await sendEmail({ to, subject, text, html });
}

function getAdminNotifyEmail() {
  return process.env.ADMIN_NOTIFY_EMAIL || process.env.MAIL_FROM || process.env.SMTP_USER;
}

async function sendContactNotificationEmail({ name, email, subject, message }) {
  const adminEmail = getAdminNotifyEmail();
  if (!adminEmail) {
    console.warn('Contact notification skipped: no ADMIN_NOTIFY_EMAIL configured');
    return;
  }

  const emailSubject = `[Wear Contact] ${subject}`;
  const text = `New contact message from ${name} (${email})\n\nSubject: ${subject}\n\n${message}`;
  const html = `
    <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <hr />
    <p style="white-space:pre-wrap">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
  `;

  await sendEmail({ to: adminEmail, subject: emailSubject, text, html });
}

async function sendContactConfirmationEmail({ name, email, subject }) {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const emailSubject = 'We received your message — Wear';
  const text = `${greeting}\n\nThank you for contacting Wear. We have received your message regarding "${subject}".\n\nOur team will get back to you at ${email} as soon as possible.\n\nIf you did not send this message, you can ignore this email.`;
  const html = `
    <p>${greeting}</p>
    <p>Thank you for contacting <strong>Wear</strong>. We have received your message regarding <strong>${subject.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong>.</p>
    <p>Our team will get back to you at <a href="mailto:${email}">${email}</a> as soon as possible.</p>
    <p>If you did not send this message, you can ignore this email.</p>
  `;

  await sendEmail({ to: email, subject: emailSubject, text, html });
}

module.exports = {
  hasMailTransport,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendContactNotificationEmail,
  sendContactConfirmationEmail,
};
