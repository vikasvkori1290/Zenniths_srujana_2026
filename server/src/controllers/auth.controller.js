import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import { isDbConnected } from '../config/db.js';
import { sendOtpEmail } from '../services/email.service.js';

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
  inMemoryUsers.set('vikas kori', finsafeUser);
  inMemoryUsers.set('vikas', finsafeUser);
  inMemoryUsers.set('demo', finsafeUser);
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
        message: 'Please provide both email/username and password',
      });
    }

    const normalizedInput = inputVal.toLowerCase();
    const digitsOnly = inputVal.replace(/\D/g, '');

    if (isDbConnected()) {
      // Flexible lookup: match email or name
      const orConditions = [
        { email: normalizedInput },
        { email: new RegExp(`^${normalizedInput}$`, 'i') },
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
          message: 'Invalid email, username, or password',
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email, username, or password',
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
          message: 'Invalid email, username, or password',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email, username, or password',
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
 * Update password for authenticated merchant
 * POST /api/v1/auth/update-password
 */
export const updatePassword = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    if (isDbConnected()) {
      let user = null;
      try {
        if (userId && userId !== 'user-demo-1') {
          user = await User.findById(userId);
        }
      } catch (e) {}

      if (!user && req.user?.email) {
        user = await User.findOne({ email: req.user.email.toLowerCase() });
      }

      if (user) {
        if (currentPassword) {
          const isMatch = await bcrypt.compare(currentPassword, user.password);
          if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password does not match' });
          }
        }
        user.password = newPassword;
        await user.save();
        return res.status(200).json({ success: true, message: 'Password updated successfully' });
      }
    }

    // In-memory or demo user fallback
    let targetUser = null;
    for (const [, u] of inMemoryUsers) {
      if (u.id === userId || u._id === userId || (req.user?.email && u.email === req.user.email)) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser) {
      targetUser = inMemoryUsers.get('demo@finsafe.com');
    }

    if (targetUser) {
      if (currentPassword && targetUser.password) {
        const isMatch = await bcrypt.compare(currentPassword, targetUser.password);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Current password does not match' });
        }
      }
      targetUser.password = await bcrypt.hash(newPassword, 10);
      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    }

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('[Update Password Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update password' });
  }
};

/**
 * Reset / Forgot password by identifier
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { identifier, newPassword } = req.body;

    if (!identifier || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email/Username and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const normalized = identifier.toLowerCase().trim();

    if (isDbConnected()) {
      let user = await User.findOne({
        $or: [
          { email: normalized },
          { name: { $regex: new RegExp(`^${identifier.trim()}$`, 'i') } },
        ],
      });

      if (user) {
        user.password = newPassword;
        await user.save();
        const token = generateToken(user);
        return res.status(200).json({
          success: true,
          message: 'Password reset successfully',
          token,
          user,
        });
      }
    }

    // Check in-memory demo users or create demo entry
    let demoMatch = inMemoryUsers.get(normalized);
    if (!demoMatch) {
      for (const u of inMemoryUsers.values()) {
        const uEmail = (u.email || '').toLowerCase();
        const uName = (u.name || '').toLowerCase();
        if (uEmail === normalized || uName === normalized) {
          demoMatch = u;
          break;
        }
      }
    }

    // Also match if user entered demo, demo@finsafe.com, or vikas
    if (!demoMatch && (normalized.includes('demo') || normalized.includes('vikas'))) {
      demoMatch = inMemoryUsers.get('demo@finsafe.com');
    }

    if (demoMatch) {
      demoMatch.password = await bcrypt.hash(newPassword, 10);
      const token = generateToken(demoMatch);
      const safeUser = { ...demoMatch };
      delete safeUser.password;

      return res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        token,
        user: safeUser,
      });
    }

    return res.status(404).json({
      success: false,
      message: 'No registered merchant found with that email or username',
    });
  } catch (err) {
    console.error('[Forgot Password Error]:', err);
    return res.status(500).json({ success: false, message: 'Password reset failed' });
  }
};

// In-memory stores for OTPs and pending registrations
const pendingRegistrations = new Map();
const inMemoryOtpStore = new Map();

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email || '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${'*'.repeat(Math.max(1, user.length - 2))}${user[user.length - 1]}@${domain}`;
};

/**
 * Step 1: Send OTP for Password Reset to user's registered email
 * POST /api/v1/auth/forgot-password/send-otp
 */
export const sendForgotPasswordOtp = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Email or username is required' });
    }

    const normalized = identifier.toLowerCase().trim();
    let targetUser = null;

    if (isDbConnected()) {
      targetUser = await User.findOne({
        $or: [
          { email: normalized },
          { name: { $regex: new RegExp(`^${identifier.trim()}$`, 'i') } },
        ],
      });
    }

    if (!targetUser) {
      let demoMatch = inMemoryUsers.get(normalized);
      if (!demoMatch) {
        for (const u of inMemoryUsers.values()) {
          const uEmail = (u.email || '').toLowerCase();
          const uName = (u.name || '').toLowerCase();
          if (uEmail === normalized || uName === normalized) {
            demoMatch = u;
            break;
          }
        }
      }
      if (!demoMatch && (normalized.includes('demo') || normalized.includes('vikas'))) {
        demoMatch = inMemoryUsers.get('demo@finsafe.com');
      }
      targetUser = demoMatch;
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'No merchant account registered with this email or username',
      });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (targetUser.save) {
      targetUser.resetPasswordOtp = otp;
      targetUser.resetPasswordExpires = expires;
      await targetUser.save();
    } else {
      inMemoryOtpStore.set(targetUser.email.toLowerCase(), { otp, expires: expires.getTime() });
    }

    console.log(`[AUTH OTP] Password Reset OTP for ${targetUser.email}: ${otp}`);

    // Dispatch real email via Nodemailer if SMTP configured
    sendOtpEmail({
      to: targetUser.email,
      otp,
      type: 'reset',
    }).catch((err) => console.error('[AUTH OTP EMAIL ERROR]:', err));

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${maskEmail(targetUser.email)}`,
      maskedEmail: maskEmail(targetUser.email),
      email: targetUser.email,
    });
  } catch (err) {
    console.error('[Send Reset OTP Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to send verification OTP' });
  }
};

/**
 * Step 2: Verify the OTP sent to user's email
 * POST /api/v1/auth/forgot-password/verify-otp
 */
export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ success: false, message: 'Identifier and OTP code are required' });
    }

    const normalized = identifier.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({
        $or: [
          { email: normalized },
          { name: { $regex: new RegExp(`^${identifier.trim()}$`, 'i') } },
        ],
      });
    }

    if (user && user.resetPasswordOtp) {
      if (user.resetPasswordExpires && new Date() > user.resetPasswordExpires) {
        return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
      }
      if (user.resetPasswordOtp !== cleanOtp) {
        return res.status(400).json({ success: false, message: 'Incorrect verification code. Please check and try again.' });
      }
      return res.status(200).json({ success: true, message: 'OTP verified successfully' });
    }

    // In-memory demo fallback
    const memEntry = inMemoryOtpStore.get(normalized) || inMemoryOtpStore.get('demo@finsafe.com');
    if (memEntry) {
      if (Date.now() > memEntry.expires) {
        return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
      }
      if (memEntry.otp !== cleanOtp) {
        return res.status(400).json({ success: false, message: 'Incorrect verification code. Please check and try again.' });
      }
      return res.status(200).json({ success: true, message: 'OTP verified successfully' });
    }

    return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
  } catch (err) {
    console.error('[Verify Reset OTP Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

/**
 * Step 3: Set new password ONLY after OTP has been verified
 * POST /api/v1/auth/forgot-password/reset
 */
export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Identifier, OTP code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const normalized = identifier.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    if (isDbConnected()) {
      const user = await User.findOne({
        $or: [
          { email: normalized },
          { name: { $regex: new RegExp(`^${identifier.trim()}$`, 'i') } },
        ],
      });

      if (user) {
        if (!user.resetPasswordOtp || user.resetPasswordOtp !== cleanOtp) {
          return res.status(400).json({ success: false, message: 'Invalid verification code' });
        }
        if (user.resetPasswordExpires && new Date() > user.resetPasswordExpires) {
          return res.status(400).json({ success: false, message: 'Verification code has expired' });
        }

        user.password = newPassword;
        user.resetPasswordOtp = null;
        user.resetPasswordExpires = null;
        await user.save();

        const token = generateToken(user);
        return res.status(200).json({
          success: true,
          message: 'Password reset successfully',
          token,
          user,
        });
      }
    }

    // Demo user fallback
    let demoMatch = inMemoryUsers.get(normalized) || inMemoryUsers.get('demo@finsafe.com');
    const memEntry = inMemoryOtpStore.get(normalized) || inMemoryOtpStore.get('demo@finsafe.com');

    if (demoMatch && memEntry && memEntry.otp === cleanOtp) {
      demoMatch.password = await bcrypt.hash(newPassword, 10);
      inMemoryOtpStore.delete(normalized);
      const token = generateToken(demoMatch);
      const safeUser = { ...demoMatch };
      delete safeUser.password;
      return res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        token,
        user: safeUser,
      });
    }

    return res.status(400).json({ success: false, message: 'Verification failed. Please restart password reset.' });
  } catch (err) {
    console.error('[Reset Password With OTP Error]:', err);
    return res.status(500).json({ success: false, message: 'Password reset failed' });
  }
};

/**
 * Registration Step 1: Send OTP to verify new merchant email
 * POST /api/v1/auth/register/send-otp
 */
export const sendRegisterOtp = async (req, res) => {
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
          message: 'An account with this email already exists. Please sign in or reset your password.',
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    pendingRegistrations.set(normalizedEmail, {
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password,
        businessName: businessName?.trim() || 'My Business Store',
        businessType: businessType || 'Retail',
        dailyGoal: Number(dailyGoal) || 20000,
        phone: phone?.trim() || '+91 98765 43210',
      },
      otp,
      expires,
    });

    console.log(`[AUTH OTP] Registration OTP for ${normalizedEmail}: ${otp}`);

    // Dispatch real email via Nodemailer if SMTP configured
    sendOtpEmail({
      to: normalizedEmail,
      otp,
      type: 'registration',
    }).catch((err) => console.error('[AUTH OTP EMAIL ERROR]:', err));

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${maskEmail(normalizedEmail)}`,
      maskedEmail: maskEmail(normalizedEmail),
      email: normalizedEmail,
    });
  } catch (err) {
    console.error('[Send Register OTP Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to send registration OTP' });
  }
};

/**
 * Registration Step 2: Verify OTP and finalize merchant account creation in MongoDB
 * POST /api/v1/auth/register/verify-otp
 */
export const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const pending = pendingRegistrations.get(normalizedEmail);
    if (!pending) {
      return res.status(400).json({
        success: false,
        message: 'Registration session expired or not found. Please fill in the registration form again.',
      });
    }

    if (Date.now() > pending.expires) {
      pendingRegistrations.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    if (pending.otp !== cleanOtp) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect verification code. Please check your email and try again.',
      });
    }

    // OTP is valid! Create the user in MongoDB Atlas
    const registrationData = pending.data;
    pendingRegistrations.delete(normalizedEmail);

    if (isDbConnected()) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists' });
      }

      const newUser = await User.create({
        name: registrationData.name,
        email: normalizedEmail,
        password: registrationData.password,
        businessName: registrationData.businessName,
        businessType: registrationData.businessType,
        dailyGoal: registrationData.dailyGoal,
        phone: registrationData.phone,
      });

      const token = generateToken(newUser);
      return res.status(201).json({
        success: true,
        message: 'Merchant account verified and registered successfully',
        token,
        user: newUser,
      });
    } else {
      // In-memory fallback
      const hashedPassword = await bcrypt.hash(registrationData.password, 10);
      const newUser = {
        id: `user-${Date.now()}`,
        _id: `user-${Date.now()}`,
        name: registrationData.name,
        email: normalizedEmail,
        password: hashedPassword,
        businessName: registrationData.businessName,
        businessType: registrationData.businessType,
        dailyGoal: registrationData.dailyGoal,
        phone: registrationData.phone,
        role: 'merchant',
        createdAt: new Date().toISOString(),
      };
      inMemoryUsers.set(normalizedEmail, newUser);
      const token = generateToken(newUser);
      const safeUser = { ...newUser };
      delete safeUser.password;
      return res.status(201).json({
        success: true,
        message: 'Merchant account verified and registered successfully',
        token,
        user: safeUser,
      });
    }
  } catch (err) {
    console.error('[Verify Register OTP Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify registration code' });
  }
};
