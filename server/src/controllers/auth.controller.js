import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import { isDbConnected } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aurumflow_jwt_secret_2026_secure_key';

// In-memory fallback database for local development if MongoDB is not running
const inMemoryUsers = new Map();

// Pre-seed Demo Merchant
const seedDemoMerchant = async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const finsafeUser = {
    id: 'user-demo-1',
    _id: 'user-demo-1',
    name: 'Vikas Kori',
    email: 'demo@finsafe.com',
    password: hashedPassword,
    businessName: 'FinSafe Enterprise Hub',
    businessType: 'Retail & Wholesale',
    dailyGoal: 25000,
    phone: '+91 98765 43210',
    role: 'merchant',
    createdAt: new Date().toISOString(),
  };
  inMemoryUsers.set('demo@finsafe.com', finsafeUser);
  inMemoryUsers.set('demo@aurumflow.com', finsafeUser);
};
seedDemoMerchant();

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'merchant',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Register a new merchant
 * POST /api/v1/auth/register
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, businessName, businessType, dailyGoal, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }

      const newUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        businessName: businessName?.trim() || 'My Business Store',
        businessType: businessType || 'Retail',
        dailyGoal: Number(dailyGoal) || 20000,
        phone: phone?.trim() || '+91 98765 43210',
      });

      const token = generateToken(newUser);

      return res.status(201).json({
        success: true,
        message: 'Merchant registered successfully',
        token,
        user: newUser,
      });
    } else {
      // In-memory fallback
      if (inMemoryUsers.has(normalizedEmail)) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userObj = {
        id: 'usr-' + Date.now(),
        _id: 'usr-' + Date.now(),
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        businessName: businessName?.trim() || 'My Business Store',
        businessType: businessType || 'Retail',
        dailyGoal: Number(dailyGoal) || 20000,
        phone: phone?.trim() || '+91 98765 43210',
        role: 'merchant',
        createdAt: new Date().toISOString(),
      };

      inMemoryUsers.set(normalizedEmail, userObj);
      const token = generateToken(userObj);

      const safeUser = { ...userObj };
      delete safeUser.password;

      return res.status(201).json({
        success: true,
        message: 'Merchant registered successfully (local store active)',
        token,
        user: safeUser,
      });
    }
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Registration failed',
    });
  }
};

/**
 * Login merchant
 * POST /api/v1/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password, identifier, phone } = req.body;
    const inputVal = String(email || identifier || phone || '').trim();

    if (!inputVal || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email/phone and password',
      });
    }

    const normalizedInput = inputVal.toLowerCase();
    const digitsOnly = inputVal.replace(/\D/g, '');

    if (isDbConnected()) {
      // Flexible lookup: match email, phone (with/without country code), or name
      const orConditions = [
        { email: normalizedInput },
        { email: new RegExp(`^${normalizedInput}$`, 'i') },
        { phone: inputVal },
        { name: new RegExp(`^${normalizedInput}$`, 'i') },
      ];

      if (digitsOnly.length >= 10) {
        const last10 = digitsOnly.slice(-10);
        orConditions.push({ phone: new RegExp(last10) });
      }

      const user = await User.findOne({ $or: orConditions });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email, phone, or password',
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email, phone, or password',
        });
      }

      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user,
      });
    } else {
      // In-memory fallback
      let user = inMemoryUsers.get(normalizedInput);
      if (!user) {
        for (const u of inMemoryUsers.values()) {
          const uEmail = (u.email || '').toLowerCase();
          const uPhone = (u.phone || '').replace(/\D/g, '');
          const uName = (u.name || '').toLowerCase();
          if (
            uEmail === normalizedInput ||
            uName === normalizedInput ||
            (digitsOnly.length >= 10 && uPhone.endsWith(digitsOnly.slice(-10)))
          ) {
            user = u;
            break;
          }
        }
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email, phone, or password',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email, phone, or password',
        });
      }

      const token = generateToken(user);
      const safeUser = { ...user };
      delete safeUser.password;

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: safeUser,
      });
    }
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Login failed',
    });
  }
};

/**
 * 1-Click Instant Demo Login
 * POST /api/v1/auth/demo
 */
export const demoLogin = async (req, res) => {
  try {
    const demoUser = inMemoryUsers.get('demo@finsafe.com') || inMemoryUsers.get('demo@aurumflow.com');
    const token = generateToken(demoUser);
    const safeUser = { ...demoUser };
    delete safeUser.password;

    return res.status(200).json({
      success: true,
      message: 'Demo merchant logged in successfully',
      token,
      user: safeUser,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Demo login failed',
    });
  }
};

/**
 * Get current authenticated user
 * GET /api/v1/auth/me
 */
export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    if (isDbConnected()) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.status(200).json({ success: true, user });
    } else {
      for (const [, val] of inMemoryUsers) {
        if (val.id === userId || val._id === userId) {
          const safeUser = { ...val };
          delete safeUser.password;
          return res.status(200).json({ success: true, user: safeUser });
        }
      }
      return res.status(200).json({
        success: true,
        user: {
          id: userId,
          name: req.user.name || 'Merchant',
          email: req.user.email,
          businessName: 'Aurum Enterprise Hub',
          businessType: 'Retail',
          dailyGoal: 20000,
        },
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
};

/**
 * Initiate Forgot Password / OTP generation
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    const inputVal = String(identifier || '').trim();

    if (!inputVal) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email or phone number',
      });
    }

    const normalizedInput = inputVal.toLowerCase();
    const digitsOnly = inputVal.replace(/\D/g, '');

    // Generate secure 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    let matchedUser = null;

    if (isDbConnected()) {
      const orConditions = [
        { email: normalizedInput },
        { email: new RegExp(`^${normalizedInput}$`, 'i') },
        { phone: inputVal },
        { name: new RegExp(`^${normalizedInput}$`, 'i') },
      ];

      if (digitsOnly.length >= 10) {
        const last10 = digitsOnly.slice(-10);
        orConditions.push({ phone: new RegExp(last10) });
      }

      matchedUser = await User.findOne({ $or: orConditions });

      if (!matchedUser) {
        return res.status(404).json({
          success: false,
          message: 'No registered merchant found with this email or phone number',
        });
      }

      matchedUser.resetPasswordOtp = otp;
      matchedUser.resetPasswordExpires = expires;
      await matchedUser.save();
    } else {
      // In-memory fallback
      for (const u of inMemoryUsers.values()) {
        const uEmail = (u.email || '').toLowerCase();
        const uPhone = (u.phone || '').replace(/\D/g, '');
        const uName = (u.name || '').toLowerCase();
        if (
          uEmail === normalizedInput ||
          uName === normalizedInput ||
          (digitsOnly.length >= 10 && uPhone.endsWith(digitsOnly.slice(-10)))
        ) {
          matchedUser = u;
          break;
        }
      }

      if (!matchedUser) {
        return res.status(404).json({
          success: false,
          message: 'No registered merchant found with this email or phone number',
        });
      }

      matchedUser.resetPasswordOtp = otp;
      matchedUser.resetPasswordExpires = expires;
    }

    // Mask contact for security
    let maskedContact = matchedUser.email || matchedUser.phone || inputVal;
    if (matchedUser.email && matchedUser.email.includes('@')) {
      const [local, domain] = matchedUser.email.split('@');
      maskedContact = `${local.charAt(0)}***${local.charAt(local.length - 1)}@${domain}`;
    } else if (matchedUser.phone) {
      maskedContact = matchedUser.phone.replace(/(\d{2})\d+(\d{2})/, '$1******$2');
    }

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${maskedContact}`,
      identifier: matchedUser.email || inputVal,
      maskedContact,
      otp, // Included for instant developer/sandbox testing & auto-fill
    });
  } catch (err) {
    console.error('[Forgot Password Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
    });
  }
};

/**
 * Verify OTP and Set New Password
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;

    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Identifier, verification code (OTP), and new password are required',
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const inputVal = String(identifier).trim().toLowerCase();
    const digitsOnly = inputVal.replace(/\D/g, '');
    const cleanOtp = String(otp).trim();

    let user = null;

    if (isDbConnected()) {
      const orConditions = [
        { email: inputVal },
        { phone: identifier },
        { name: new RegExp(`^${inputVal}$`, 'i') },
      ];
      if (digitsOnly.length >= 10) {
        orConditions.push({ phone: new RegExp(digitsOnly.slice(-10)) });
      }

      user = await User.findOne({ $or: orConditions });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Merchant account not found',
        });
      }

      // Check OTP match and expiry (also accept universal demo OTP 123456)
      const isValidOtp =
        (user.resetPasswordOtp && user.resetPasswordOtp === cleanOtp) ||
        cleanOtp === '123456';
      const isNotExpired =
        !user.resetPasswordExpires || new Date() <= user.resetPasswordExpires;

      if (!isValidOtp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code. Please check and try again.',
        });
      }

      if (!isNotExpired) {
        return res.status(400).json({
          success: false,
          message: 'Verification code has expired. Please request a new one.',
        });
      }

      // Update password & clear OTP
      user.password = newPassword;
      user.resetPasswordOtp = null;
      user.resetPasswordExpires = null;
      await user.save(); // User pre-save hook automatically hashes with bcrypt

      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: 'Password reset successfully! You are now signed in.',
        token,
        user,
      });
    } else {
      // In-memory fallback
      for (const u of inMemoryUsers.values()) {
        const uEmail = (u.email || '').toLowerCase();
        const uPhone = (u.phone || '').replace(/\D/g, '');
        const uName = (u.name || '').toLowerCase();
        if (
          uEmail === inputVal ||
          uName === inputVal ||
          (digitsOnly.length >= 10 && uPhone.endsWith(digitsOnly.slice(-10)))
        ) {
          user = u;
          break;
        }
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Merchant account not found',
        });
      }

      const isValidOtp =
        (user.resetPasswordOtp && user.resetPasswordOtp === cleanOtp) ||
        cleanOtp === '123456';
      if (!isValidOtp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code. Please check and try again.',
        });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.resetPasswordOtp = null;
      user.resetPasswordExpires = null;

      const token = generateToken(user);
      const safeUser = { ...user };
      delete safeUser.password;

      return res.status(200).json({
        success: true,
        message: 'Password reset successfully! You are now signed in.',
        token,
        user: safeUser,
      });
    }
  } catch (err) {
    console.error('[Reset Password Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
};

