import express from 'express';
import {
  getFinanceSummary,
  saveEKhataCustomer,
  saveFixedExpense,
  saveUpcomingExpense,
} from '../controllers/finance.controller.js';

const router = express.Router();

router.get('/summary', getFinanceSummary);
router.post('/ekhata', saveEKhataCustomer);
router.post('/fixed-expense', saveFixedExpense);
router.post('/upcoming-expense', saveUpcomingExpense);

export default router;
