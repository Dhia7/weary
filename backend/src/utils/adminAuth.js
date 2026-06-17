const User = require('../models/User');

const verifyAdminPassword = async (req) => {
  const { password } = req.body;

  if (!password) {
    return {
      valid: false,
      status: 400,
      message: 'Password is required to confirm this action'
    };
  }

  const adminUser = await User.findByPk(req.user.userId);
  if (!adminUser) {
    return {
      valid: false,
      status: 404,
      message: 'Admin user not found'
    };
  }

  const isPasswordValid = await adminUser.comparePassword(password);
  if (!isPasswordValid) {
    return {
      valid: false,
      status: 400,
      message: 'Password is incorrect. Please enter your current password to confirm this action.'
    };
  }

  return { valid: true };
};

module.exports = {
  verifyAdminPassword
};
