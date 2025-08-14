const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const config = require('../config/config');
const logger = require('../services/logger');
const { asyncHandler } = require('../middlewares/errorHandler');

class AuthController {
  // Register new user
  register = asyncHandler(async (req, res) => {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmailOrUsername(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName
    });

    await user.save();

    // Generate tokens
    const accessToken = this.generateAccessToken(user.getAuthTokenData());
    const refreshToken = this.generateRefreshToken(user.getAuthTokenData());

    // Store refresh token
    user.refreshTokens.push({
      token: refreshToken
    });
    await user.save();

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: config.JWT_EXPIRE
        }
      }
    });
  });

  // Login user
  login = asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;

    // Find user by email or username
    const user = await User.findByEmailOrUsername(identifier).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.getAuthTokenData());
    const refreshToken = this.generateRefreshToken(user.getAuthTokenData());

    // Store refresh token
    user.refreshTokens.push({
      token: refreshToken
    });
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          lastLogin: user.lastLogin,
          isEmailVerified: user.isEmailVerified
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: config.JWT_EXPIRE
        }
      }
    });
  });

  // Refresh access token
  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Check if refresh token exists in user's token list
      const tokenExists = user.refreshTokens.some(token => token.token === refreshToken);
      if (!tokenExists) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new access token
      const newAccessToken = this.generateAccessToken(user.getAuthTokenData());

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          expiresIn: config.JWT_EXPIRE
        }
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  });

  // Logout user
  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const user = req.user;

    if (refreshToken && user) {
      // Remove the specific refresh token
      user.refreshTokens = user.refreshTokens.filter(token => token.token !== refreshToken);
      await user.save();
    }

    logger.info(`User logged out: ${user?.email || 'unknown'}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  });

  // Logout from all devices
  logoutAll = asyncHandler(async (req, res) => {
    const user = req.user;

    // Clear all refresh tokens
    user.refreshTokens = [];
    await user.save();

    logger.info(`User logged out from all devices: ${user.email}`);

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  });

  // Get current user profile
  getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          profile: user.profile,
          preferences: user.preferences,
          subscription: user.subscription,
          lastLogin: user.lastLogin,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  });

  // Change password
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Clear all refresh tokens to force re-login on all devices
    user.refreshTokens = [];
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });
  });

  // Request password reset
  requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // TODO: Send email with reset link
    // In a real application, you would send an email here
    logger.info(`Password reset requested for: ${user.email}`);

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
      // For development/testing only - remove in production
      ...(config.NODE_ENV === 'development' && { resetToken })
    });
  });

  // Reset password
  resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Hash token to compare with stored version
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // Clear all sessions

    await user.save();

    logger.info(`Password reset completed for: ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  });

  // Verify email (placeholder - would require email service)
  verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;

    // TODO: Implement email verification logic
    res.json({
      success: true,
      message: 'Email verification endpoint - implementation pending'
    });
  });

  // Generate access token
  generateAccessToken(payload) {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE
    });
  }

  // Generate refresh token
  generateRefreshToken(payload) {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRE
    });
  }
}

module.exports = new AuthController();