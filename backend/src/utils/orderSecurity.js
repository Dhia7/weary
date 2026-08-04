/**
 * Normalize phone for comparison / blocklist (digits only).
 * Tunisia: strip leading 216 so local 8-digit matches +216…
 */
function normalizePhone(phone) {
	if (!phone || typeof phone !== 'string') return null;
	let digits = phone.replace(/\D/g, '');
	if (digits.length < 8) return null;
	if (digits.startsWith('216') && digits.length >= 11) {
		digits = digits.slice(3);
	}
	// Also handle 00216
	if (digits.startsWith('00216') && digits.length >= 13) {
		digits = digits.slice(5);
	}
	return digits;
}

function normalizeEmail(email) {
	if (!email || typeof email !== 'string') return null;
	const trimmed = email.trim().toLowerCase();
	if (!trimmed || !trimmed.includes('@')) return null;
	return trimmed;
}

const CANCEL_REASONS = [
	'refused_at_delivery',
	'unreachable',
	'admin_rejected',
	'timeout',
	'outbid',
	'replaced',
	'other'
];

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function defaultVerificationExpiresAt(fromDate = new Date()) {
	return new Date(fromDate.getTime() + VERIFICATION_TTL_MS);
}

module.exports = {
	normalizePhone,
	normalizeEmail,
	CANCEL_REASONS,
	VERIFICATION_TTL_MS,
	defaultVerificationExpiresAt
};
