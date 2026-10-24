import EKhataCustomer from '../models/ekhata.model.js';
import { FixedExpense, UpcomingExpense } from '../models/expense.model.js';
import DailyIncome from '../models/dailyIncome.model.js';
import { isDbConnected } from '../config/db.js';

/**
 * Get comprehensive financial overview from MongoDB
 * GET /api/v1/finance/summary
 */
export const getFinanceSummary = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({
        success: true,
        isDbConnected: false,
        message: 'Running in offline/local storage mode. MongoDB Atlas connection available via MONGO_URI in .env.',
      });
    }

    const [ekhata, fixed, upcoming, income] = await Promise.all([
      EKhataCustomer.find().sort({ idNumber: 1 }),
      FixedExpense.find().sort({ dueDay: 1 }),
      UpcomingExpense.find().sort({ dueDate: 1 }),
      DailyIncome.find().sort({ createdAt: -1 }).limit(50),
    ]);

    return res.status(200).json({
      success: true,
      isDbConnected: true,
      data: {
        ekhata,
        fixedExpenses: fixed,
        upcomingExpenses: upcoming,
        dailyIncome: income,
      },
    });
  } catch (err) {
    console.error('[Finance Summary Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Sync or Save eKhata Customer to MongoDB
 * POST /api/v1/finance/ekhata
 */
export const saveEKhataCustomer = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({ success: true, offline: true, message: 'Saved to local buffer' });
    }

    const { idNumber, name, totalAmount, dueDate, phone, history, status } = req.body;

    const customer = await EKhataCustomer.findOneAndUpdate(
      { idNumber },
      {
        name,
        totalAmount: Number(totalAmount) || 0,
        dueDate: dueDate || 'Not Specified',
        phone: phone || '',
        status: status || 'Pending',
        history: history || [],
        lastUpdated: 'Today at ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, customer });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Sync or Save Monthly Fixed Expense to MongoDB
 * POST /api/v1/finance/fixed-expense
 */
export const saveFixedExpense = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({ success: true, offline: true });
    }

    const { title, amount, category, dueDay, status, receiptName, notes } = req.body;

    const expense = await FixedExpense.create({
      title,
      amount: Number(amount) || 0,
      category: category || 'Rent',
      dueDay: Number(dueDay) || 1,
      status: status || 'Pending',
      receiptName: receiptName || null,
      notes: notes || 'Monthly recurring commitment',
    });

    return res.status(201).json({ success: true, expense });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Sync or Save Upcoming Scheduled Payable to MongoDB
 * POST /api/v1/finance/upcoming-expense
 */
export const saveUpcomingExpense = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({ success: true, offline: true });
    }

    const { title, payee, amount, dueDate, urgency, category } = req.body;

    const expense = await UpcomingExpense.create({
      title,
      payee: payee || 'Vendor',
      amount: Number(amount) || 0,
      dueDate,
      urgency: urgency || 'Medium',
      category: category || 'Supplier Dues',
      status: 'Upcoming',
    });

    return res.status(201).json({ success: true, expense });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
