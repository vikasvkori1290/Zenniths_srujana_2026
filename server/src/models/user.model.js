import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Merchant name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    businessName: {
      type: String,
      default: 'Aurum Retail & Wholesale Hub',
      trim: true,
    },
    businessType: {
      type: String,
      default: 'Retail',
      trim: true,
    },
    dailyGoal: {
      type: Number,
      default: 20000,
    },
    phone: {
      type: String,
      default: '+91 98765 43210',
    },
    role: {
      type: String,
      enum: ['merchant', 'admin'],
      default: 'merchant',
    },
    upiId: {
      type: String,
      default: '',
      trim: true,
    },
    resetPasswordOtp: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    cashflowSettings: {

      openingCash: { type: Number, default: 40000 },
      grossMarginPct: { type: Number, default: 25 },
      dailyRunningCost: { type: Number, default: 500 },
      openingDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
      ownerTargetDailySales: { type: Number, default: 10000 },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Exclude password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
