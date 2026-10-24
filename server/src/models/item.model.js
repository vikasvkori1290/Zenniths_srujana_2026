import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters long'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: true,
      enum: ['Development', 'Design', 'Marketing', 'Research', 'General'],
      default: 'Development',
    },
    status: {
      type: String,
      enum: ['Backlog', 'In Progress', 'Completed'],
      default: 'In Progress',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Helpful index for sorting and filtering
itemSchema.index({ status: 1, createdAt: -1 });

export const Item = mongoose.model('Item', itemSchema);
