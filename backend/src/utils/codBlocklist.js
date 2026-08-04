const { Op } = require('sequelize');
const CodBlocklist = require('../models/CodBlocklist');
const { normalizePhone, normalizeEmail } = require('./orderSecurity');

async function isCodBlocked({ phone, email }) {
	const normalizedPhone = normalizePhone(phone);
	const normalizedEmail = normalizeEmail(email);
	if (!normalizedPhone && !normalizedEmail) return false;

	const or = [];
	if (normalizedPhone) or.push({ phone: normalizedPhone });
	if (normalizedEmail) or.push({ email: normalizedEmail });

	const hit = await CodBlocklist.findOne({ where: { [Op.or]: or } });
	return Boolean(hit);
}

async function blockCodContacts({ phone, email, reason, orderId }) {
	const normalizedPhone = normalizePhone(phone);
	const normalizedEmail = normalizeEmail(email);
	const reasonValue = reason || 'refused_at_delivery';

	if (normalizedPhone) {
		const existing = await CodBlocklist.findOne({ where: { phone: normalizedPhone } });
		if (existing) {
			existing.reason = reasonValue;
			existing.orderId = orderId || existing.orderId;
			await existing.save();
		} else {
			await CodBlocklist.create({
				phone: normalizedPhone,
				email: normalizedEmail,
				reason: reasonValue,
				orderId: orderId || null
			});
		}
	}

	if (normalizedEmail) {
		const existingEmail = await CodBlocklist.findOne({ where: { email: normalizedEmail } });
		if (existingEmail) {
			existingEmail.reason = reasonValue;
			existingEmail.orderId = orderId || existingEmail.orderId;
			if (normalizedPhone && !existingEmail.phone) existingEmail.phone = normalizedPhone;
			await existingEmail.save();
		} else if (!normalizedPhone) {
			await CodBlocklist.create({
				phone: null,
				email: normalizedEmail,
				reason: reasonValue,
				orderId: orderId || null
			});
		}
	}
}

module.exports = {
	isCodBlocked,
	blockCodContacts
};
