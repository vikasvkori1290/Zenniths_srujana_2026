import mongoose from 'mongoose';

const dailyIncomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
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
    time: {
      type: String,
      default: () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    },
    mode: {
      type: String,
      default: 'Cash / Transfer',
      trim: true,
    },
  },
  { timestamps: true }
);

const DailyIncome = mongoose.model('DailyIncome', dailyIncomeSchema);
export default DailyIncome;
