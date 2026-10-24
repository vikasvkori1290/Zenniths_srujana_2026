import mongoose from 'mongoose';

// 1. Monthly Fixed Expense Schema (Rent, EMI, Salaries, Utilities)
const fixedExpenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ['Rent', 'EMI', 'Utilities', 'Salaries', 'Subscriptions', 'Insurance', 'Other'],
      default: 'Rent',
    },
    dueDay: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
      default: 5,
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Pending',
    },
    receiptName: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: 'Monthly recurring commitment',
      trim: true,
    },
  },
  { timestamps: true }
);

// 2. Upcoming Scheduled Payable Schema (15-day supplier dues, taxes, invoices)
const upcomingExpenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    payee: {
      type: String,
      default: 'Vendor',
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    urgency: {
      type: String,
      enum: ['Urgent', 'High', 'Medium', 'Low'],
      default: 'Medium',
    },
    category: {
      type: String,
      default: 'Supplier Dues',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Paid'],
      default: 'Upcoming',
    },
  },
  { timestamps: true }
);

export const FixedExpense = mongoose.model('FixedExpense', fixedExpenseSchema);
export const UpcomingExpense = mongoose.model('UpcomingExpense', upcomingExpenseSchema);
