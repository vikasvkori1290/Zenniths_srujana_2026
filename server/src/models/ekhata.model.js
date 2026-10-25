import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    date: { type: String, default: () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
    note: { type: String, default: 'Credit transaction' },
    type: { type: String, enum: ['ADD', 'REDUCE'], default: 'ADD' },
  },
  { _id: false }
);

const ekhataCustomerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    idNumber: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueDate: {
      type: String,
      default: 'Not Specified',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Settled'],
      default: 'Pending',
    },
    lastUpdated: {
      type: String,
      default: () => 'Today at ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    },
    history: [transactionSchema],
  },
  {
    timestamps: true,
  }
);

ekhataCustomerSchema.index({ userId: 1, idNumber: 1 });
ekhataCustomerSchema.index({ userId: 1, name: 1 });

const EKhataCustomer = mongoose.model('EKhataCustomer', ekhataCustomerSchema);
export default EKhataCustomer;
