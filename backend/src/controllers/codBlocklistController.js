const CodBlocklist = require('../models/CodBlocklist');

const listCodBlocklist = async (req, res) => {
	try {
		const page = Math.max(1, parseInt(req.query.page, 10) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
		const offset = (page - 1) * limit;

		const { rows, count } = await CodBlocklist.findAndCountAll({
			order: [['createdAt', 'DESC']],
			limit,
			offset
		});

		res.json({
			success: true,
			data: {
				entries: rows,
				pagination: {
					page,
					limit,
					total: count,
					totalPages: Math.ceil(count / limit) || 1
				}
			}
		});
	} catch (error) {
		console.error('List COD blocklist error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

const removeCodBlocklistEntry = async (req, res) => {
	try {
		const { id } = req.params;
		const entry = await CodBlocklist.findByPk(id);
		if (!entry) {
			return res.status(404).json({ success: false, message: 'Blocklist entry not found' });
		}
		await entry.destroy();
		res.json({ success: true, message: 'Removed from COD blocklist' });
	} catch (error) {
		console.error('Remove COD blocklist error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

module.exports = {
	listCodBlocklist,
	removeCodBlocklistEntry
};
