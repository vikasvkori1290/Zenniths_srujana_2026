import express from 'express';
import {
  getFinanceSummary,
  saveEKhataCustomer,
  syncEKhataList,
  deleteEKhataCustomer,
  getFixedExpenses,
  syncFixedExpenses,
  syncUpcomingExpenses,
  getDailyIncome,
  syncDailyIncome,
  saveCashflowSettings,
} from '../controllers/finance.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Strict security: require valid JWT authentication on all finance endpoints
router.use(requireAuth);

// 1. Finance Overview for logged-in user
router.get('/summary', getFinanceSummary);

// 2. eKhata Customer Operations
router.post('/ekhata', saveEKhataCustomer);
router.post('/ekhata/sync', syncEKhataList);
router.delete('/ekhata/:idNumber', deleteEKhataCustomer);

// 3. Fixed Monthly Expenses Operations
router.get('/fixed-expense', getFixedExpenses);
router.post('/fixed-expense/sync', syncFixedExpenses);

// 4. Upcoming Scheduled Payables Operations
router.post('/upcoming-expense/sync', syncUpcomingExpenses);

// 5. Daily Income Operations
router.get('/income', getDailyIncome);
router.post('/income/sync', syncDailyIncome);

// 6. Store Financial Settings
router.post('/settings', saveCashflowSettings);

export default router;
