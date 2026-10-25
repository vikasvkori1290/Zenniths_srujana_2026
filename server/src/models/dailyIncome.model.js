import mongoose from 'mongoose';

const dailyIncomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      index: true,
    },
    entryId: {
      type: String,
      trim: true,
    },
    date: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
      index: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    mode: {
      type: String,
      default: 'Cash',
      trim: true,
    },
    time: {
      type: String,
      default: () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    },
    category: {
      type: String,
      default: 'In-Store Retail',
    },
    isConfirmed: {
      type: Boolean,
      default: true,
    },
    unconfirmed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

dailyIncomeSchema.index({ userId: 1, date: -1 });

const DailyIncome = mongoose.model('DailyIncome', dailyIncomeSchema);
export default DailyIncome;
