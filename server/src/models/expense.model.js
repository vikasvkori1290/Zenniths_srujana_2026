import mongoose from 'mongoose';

// 1. Monthly Fixed Expense Schema (Rent, EMI, Salaries, Utilities)
const fixedExpenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      index: true,
    },
    clientId: {
      type: String,
      trim: true,
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
      default: 'Rent',
      trim: true,
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
      default: 'Pending',
      trim: true,
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

fixedExpenseSchema.index({ userId: 1, dueDay: 1 });

// 2. Upcoming Scheduled Payable Schema (15-day supplier dues, taxes, invoices)
const upcomingExpenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      index: true,
    },
    clientId: {
      type: String,
      trim: true,
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
      index: true,
    },
    urgency: {
      type: String,
      default: 'Medium',
      trim: true,
    },
    category: {
      type: String,
      default: 'Supplier Dues',
      trim: true,
    },
    status: {
      type: String,
      default: 'Upcoming',
      trim: true,
    },
  },
  { timestamps: true }
);

upcomingExpenseSchema.index({ userId: 1, dueDate: 1 });

export const FixedExpense = mongoose.model('FixedExpense', fixedExpenseSchema);
export const UpcomingExpense = mongoose.model('UpcomingExpense', upcomingExpenseSchema);
