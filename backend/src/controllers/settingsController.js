const User = require('../models/User');
const ShopSetting = require('../models/ShopSetting');
const { sequelize } = require('../config/database');

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
];
const SESSION_TIMEOUTS = [30, 60, 120, 480];
const PASSWORD_LENGTHS = [6, 8, 12];

function defaultSettings() {
  return {
    siteName: 'Swisia',
    siteUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    contactEmail: process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || '',
    timezone: 'UTC',
    requireAdmin2FA: true,
    sessionTimeoutMinutes: 30,
    passwordMinLength: 6,
    notifyNewUsers: true,
    notifyOrders: true,
    notifySystemAlerts: true,
  };
}

function sanitizeSettings(input) {
  const base = defaultSettings();
  const source = input && typeof input === 'object' ? input : {};
  const siteName = String(source.siteName ?? base.siteName).trim().slice(0, 80);
  const siteUrl = String(source.siteUrl ?? base.siteUrl).trim();
  const contactEmail = String(source.contactEmail ?? base.contactEmail).trim().toLowerCase();
  const timezone = TIMEZONES.includes(source.timezone) ? source.timezone : base.timezone;
  const sessionTimeoutMinutes = SESSION_TIMEOUTS.includes(Number(source.sessionTimeoutMinutes))
    ? Number(source.sessionTimeoutMinutes)
    : base.sessionTimeoutMinutes;
  const passwordMinLength = PASSWORD_LENGTHS.includes(Number(source.passwordMinLength))
    ? Number(source.passwordMinLength)
    : base.passwordMinLength;

  if (!siteName) {
    return { error: 'Site name is required' };
  }
  if (!/^https?:\/\/.+/i.test(siteUrl)) {
    return { error: 'Site URL must start with http:// or https://' };
  }
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { error: 'Contact email is not valid' };
  }

  return {
    settings: {
      siteName,
      siteUrl,
      contactEmail,
      timezone,
      requireAdmin2FA: source.requireAdmin2FA !== false,
      sessionTimeoutMinutes,
      passwordMinLength,
      notifyNewUsers: source.notifyNewUsers !== false,
      notifyOrders: source.notifyOrders !== false,
      notifySystemAlerts: source.notifySystemAlerts !== false,
    },
  };
}

async function readSettings() {
  const row = await ShopSetting.findByPk(1);
  return { ...defaultSettings(), ...(row?.data || {}) };
}

async function getSettings(req, res) {
  try {
    const settings = await readSettings();
    const totalUsers = await User.count();
    let databaseSize = 'Unknown';
    try {
      const [rows] = await sequelize.query(
        'SELECT pg_size_pretty(pg_database_size(current_database())) AS size'
      );
      databaseSize = rows?.[0]?.size || 'Unknown';
    } catch {
      databaseSize = 'Unknown';
    }

    res.json({
      success: true,
      data: {
        settings,
        stats: {
          databaseType: 'PostgreSQL',
          connected: true,
          totalUsers,
          databaseSize,
        },
      },
    });
  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({ success: false, message: 'Could not load settings' });
  }
}

async function updateSettings(req, res) {
  try {
    const parsed = sanitizeSettings(req.body);
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const [row] = await ShopSetting.findOrCreate({
      where: { id: 1 },
      defaults: { id: 1, data: parsed.settings },
    });
    row.data = parsed.settings;
    row.changed('data', true);
    await row.save();

    res.json({
      success: true,
      message: 'Settings saved',
      data: { settings: parsed.settings },
    });
  } catch (error) {
    console.error('Update admin settings error:', error);
    res.status(500).json({ success: false, message: 'Could not save settings' });
  }
}

module.exports = {
  defaultSettings,
  readSettings,
  getSettings,
  updateSettings,
};
