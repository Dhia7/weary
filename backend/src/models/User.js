const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  // Authentication fields
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Please enter a valid email address'
      }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [6],
        msg: 'Password must be at least 6 characters long'
      }
    }
  },
  
  // Profile information
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: {
        args: [2, 50],
        msg: 'First name must be between 2 and 50 characters'
      }
    }
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: {
        args: [2, 50],
        msg: 'Last name must be between 2 and 50 characters'
      }
    }
  },
  
  // Contact information
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: {
        args: /^[\+]?[1-9][\d]{0,15}$/,
        msg: 'Please enter a valid phone number'
      }
    }
  },
  
  // Account status and verification
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emailVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Password reset
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Account preferences (stored as JSON)
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      newsletter: true,
      marketingEmails: true,
      sizePreference: 'M',
      favoriteCategories: []
    }
  },
  
  // Account status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  // Admin role
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Two-factor authentication
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  twoFactorSecret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  backupCodes: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  
  // Timestamps
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeSave: async (user) => {
      // Only hash the password if it has been modified
      if (user.changed('password')) {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        user.password = hashedPassword;
      }
    }
  }
});

// Instance method to check password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if account is locked
User.prototype.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Virtual for full name
User.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Static method to handle failed login attempts
User.handleFailedLogin = async function(userId) {
  const user = await this.findByPk(userId);
  if (!user) return;
  
  // If account is already locked, extend lock time
  if (user.isLocked()) {
    user.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  } else {
    user.loginAttempts += 1;
    
    // Lock account after 5 failed attempts
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    }
  }
  
  await user.save();
};

// Static method to reset login attempts
User.resetLoginAttempts = async function(userId) {
  await this.update({
    loginAttempts: 0,
    lockUntil: null,
    lastLogin: new Date()
  }, {
    where: { id: userId }
  });
};

module.exports = User;
