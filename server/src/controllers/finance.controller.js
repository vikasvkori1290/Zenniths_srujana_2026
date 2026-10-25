import EKhataCustomer from '../models/ekhata.model.js';
import { FixedExpense, UpcomingExpense } from '../models/expense.model.js';
import DailyIncome from '../models/dailyIncome.model.js';
import User from '../models/user.model.js';
import { isDbConnected } from '../config/db.js';

// Helper to get userId from req.user
const getUserId = (req) => req.user?.id || req.user?._id || null;

/**
 * Get comprehensive financial overview from MongoDB for the authenticated user
 * GET /api/v1/finance/summary
 */
export const getFinanceSummary = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!isDbConnected()) {
      return res.status(200).json({
        success: true,
        isDbConnected: false,
        message: 'Running in offline/local storage mode.',
        data: {
          ekhata: [],
          fixedExpenses: [],
          upcomingExpenses: [],
          dailyIncome: [],
          cashflowSettings: null,
        },
      });
    }

    if (!userId) {
      return res.status(200).json({
        success: true,
        isDbConnected: true,
        data: {
          ekhata: [],
          fixedExpenses: [],
          upcomingExpenses: [],
          dailyIncome: [],
          cashflowSettings: null,
        },
      });
    }

    const [ekhata, fixed, upcoming, income, userRecord] = await Promise.all([
      EKhataCustomer.find({ userId }).sort({ idNumber: 1 }),
      FixedExpense.find({ userId }).sort({ dueDay: 1 }),
      UpcomingExpense.find({ userId }).sort({ dueDate: 1 }),
      DailyIncome.find({ userId }).sort({ date: -1, createdAt: -1 }).limit(100),
      User.findById(userId).select('-password'),
    ]);

    // Deduplicate fixed expenses returned from DB
    const seenFixed = new Set();
    const cleanDbFixed = [];
    for (const f of fixed) {
      const key = `${f.title?.trim().toLowerCase()}__${f.dueDay}__${f.amount}`;
      if (!seenFixed.has(key)) {
        seenFixed.add(key);
        cleanDbFixed.push(f);
      }
    }

    // Deduplicate upcoming expenses returned from DB
    const seenUpcoming = new Set();
    const cleanDbUpcoming = [];
    for (const u of upcoming) {
      const key = `${u.title?.trim().toLowerCase()}__${u.dueDate}__${u.amount}`;
      if (!seenUpcoming.has(key)) {
        seenUpcoming.add(key);
        cleanDbUpcoming.push(u);
      }
    }

    // Deduplicate eKhata returned from DB
    const seenKhata = new Map();
    const cleanDbKhata = [];
    for (const c of ekhata) {
      const normName = c.name?.trim().toLowerCase();
      if (normName && seenKhata.has(normName)) {
        continue;
      }
      if (normName) seenKhata.set(normName, true);
      cleanDbKhata.push(c);
    }

    // Deduplicate daily income returned from DB
    const seenIncome = new Set();
    const cleanDbIncome = [];
    for (const i of income) {
      const key = `${i.date}__${i.time}__${i.amount}__${i.source?.trim().toLowerCase()}`;
      if (!seenIncome.has(key)) {
        seenIncome.add(key);
        cleanDbIncome.push(i);
      }
    }

    return res.status(200).json({
      success: true,
      isDbConnected: true,
      data: {
        ekhata: cleanDbKhata.map((c, idx) => ({
          id: c.clientId || `khata-${c.idNumber || idx + 1}`,
          idNumber: Number(c.idNumber) || idx + 1,
          name: c.name,
          phone: c.phone || '',
          totalAmount: c.totalAmount || 0,
          dueDate: c.dueDate || 'Not Specified',
          status: c.status || 'Pending',
          lastUpdated: c.lastUpdated,
          history: c.history || [],
        })),
        fixedExpenses: cleanDbFixed.map((f) => ({
          id: f.clientId || `fix-${f._id}`,
          title: f.title,
          amount: f.amount,
          category: f.category,
          dueDay: f.dueDay,
          status: f.status,
          receiptName: f.receiptName,
          notes: f.notes,
        })),
        upcomingExpenses: cleanDbUpcoming.map((u) => ({
          id: u.clientId || `up-${u._id}`,
          title: u.title,
          payee: u.payee,
          amount: u.amount,
          dueDate: u.dueDate,
          urgency: u.urgency,
          category: u.category,
          status: u.status,
        })),
        dailyIncome: cleanDbIncome.map((i, idx) => ({
          id: i.entryId || `inc-${i._id || idx + 1}`,
          date: i.date,
          source: i.source,
          amount: i.amount,
          mode: i.mode,
          time: i.time,
          category: i.category,
          isConfirmed: i.isConfirmed,
          unconfirmed: i.unconfirmed,
        })),
        cashflowSettings: userRecord?.cashflowSettings || null,
        userProfile: userRecord || null,
      },
    });
  } catch (err) {
    console.error('[Finance Summary Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Save or Update single eKhata Customer to MongoDB
 * POST /api/v1/finance/ekhata
 */
export const saveEKhataCustomer = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!isDbConnected() || !userId) {
      return res.status(200).json({ success: true, offline: true });
    }

    const { id, idNumber, name, totalAmount, dueDate, phone, history, status } = req.body;

    const num = Number(idNumber) || 1;

    const customer = await EKhataCustomer.findOneAndUpdate(
      { userId, idNumber: num },
      {
        userId,
        clientId: id || `khata-${num}`,
        name: name?.trim() || 'Customer',
        totalAmount: Number(totalAmount) || 0,
        dueDate: dueDate || 'Not Specified',
        phone: phone || '',
        status: status || 'Pending',
        history: Array.isArray(history) ? history : [],
        lastUpdated: 'Today at ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, customer });
  } catch (err) {
    console.error('[Save eKhata Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Bulk Sync entire eKhata Customer List to MongoDB
 * POST /api/v1/finance/ekhata/sync
 */
export const syncEKhataList = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!isDbConnected() || !userId) {
      return res.status(200).json({ success: true, offline: true });
    }

    const { customers } = req.body;
    if (!Array.isArray(customers)) {
      return res.status(400).json({ success: false, message: 'customers array required' });
    }

    // Replace all records for this user to keep exact state
    await EKhataCustomer.deleteMany({ userId });

    if (customers.length > 0) {
      const seenNames = new Map();
      const seenIds = new Set();
      const cleanDocs = [];

      for (const c of customers) {
        if (!c) continue;
        const normName = String(c.name || '').trim().toLowerCase();
        const id = c.id || c.clientId;

        if (normName && seenNames.has(normName)) {
          const existing = seenNames.get(normName);
          if (c.totalAmount && Number(c.totalAmount) > existing.totalAmount) {
            existing.totalAmount = Number(c.totalAmount);
          }
          if (Array.isArray(c.history)) {
            const hSet = new Set((existing.history || []).map((h) => `${h.date}_${h.amount}_${h.note}`));
            for (const h of c.history) {
              const k = `${h.date}_${h.amount}_${h.note}`;
              if (!hSet.has(k)) {
                hSet.add(k);
                existing.history.push(h);
              }
            }
          }
          continue;
        }

        if (id && seenIds.has(id)) continue;
        if (id) seenIds.add(id);

        const doc = {
          userId,
          clientId: id || `khata-${cleanDocs.length + 1}`,
          idNumber: cleanDocs.length + 1,
          name: c.name?.trim() || `Customer #${cleanDocs.length + 1}`,
          phone: c.phone || '',
          totalAmount: Number(c.totalAmount) || 0,
          dueDate: c.dueDate || 'Not Specified',
          status: c.status || (Number(c.totalAmount) === 0 ? 'Settled' : 'Pending'),
          lastUpdated: c.lastUpdated || 'Today',
          history: Array.isArray(c.history) ? [...c.history] : [],
        };
        if (normName) seenNames.set(normName, doc);
        cleanDocs.push(doc);
      }

      if (cleanDocs.length > 0) {
        await EKhataCustomer.insertMany(cleanDocs);
      }
      return res.status(200).json({ success: true, count: cleanDocs.length });
    }

    return res.status(200).json({ success: true, count: 0 });
  } catch (err) {
    console.error('[Sync eKhata Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete eKhata Customer from MongoDB
 * DELETE /api/v1/finance/ekhata/:idNumber
 */
export const deleteEKhataCustomer = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!isDbConnected() || !userId) {
      return res.status(200).json({ success: true, offline: true });
    }

    const { idNumber } = req.params;
    await EKhataCustomer.deleteOne({ userId, idNumber: Number(idNumber) });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Bulk Sync Monthly Fixed Expenses to MongoDB
 * POST /api/v1/finance/fixed-expense/sync
 */
export const syncFixedExpenses = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!isDbConnected() || !userId) {
      return res.status(200).json({ success: true, offline: true });
    }

    const { expenses } = req.body;
    if (!Array.isArray(expenses)) {
      return res.status(400).json({ success: false, message: 'expenses array required' });
    }

    // Deduplicate incoming array by id and composite (title + dueDay + amount)
    const seenIds = new Set();
    const seenComposite = new Set();
    const cleanExpenses = [];

    for (const e of expenses) {
      if (!e) continue;
      const id = e.id || e.clientId;
      const titleNorm = String(e.title || '').trim().toLowerCase();
      const dueDay = Number(e.dueDay) || 1;
      const amount = Number(e.amount) || 0;
      const compositeKey = `${titleNorm}__${dueDay}__${amount}`;

      if (id && seenIds.has(id)) continue;
      if (compositeKey && seenComposite.has(compositeKey)) continue;

      if (id) seenIds.add(id);
      seenComposite.add(compositeKey);
      cleanExpenses.push(e);
    }

    await FixedExpense.deleteMany({ userId });

    if (cleanExpenses.length > 0) {
      const docs = cleanExpenses.map((e, idx) => ({
        userId,
        clientId: e.id || `fix-${idx + 1}`,
        title: e.title?.trim() || 'Monthly Expense',
        amount: Number(e.amount) || 0,
        category: e.category || 'Utilities',
        dueDay: Math.min(31, Math.max(1, Number(e.dueDay) || 1)),
        status: e.status || 'Pending',
        receiptName: e.receiptName || null,
        notes: e.notes || 'Monthly recurring commitment',
      }));
      await FixedExpense.insertMany(docs);
    }

    return res.status(200).json({ success: true, count: cleanExpenses.length });
  } catch (err) {
    console.error('[Sync Fixed Expenses Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Bulk Sync Upcoming Scheduled Payables to MongoDB
 * POST /api/v1/finance/upcoming-expense/sync
 */
export const syncUpcomingExpenses = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!isDbConnected() || !userId) {
      return res.status(200).json({ success: true, offline: true });
    }

    const { expenses } = req.body;
    if (!Array.isArray(expenses)) {
      return res.status(400).json({ success: false, message: 'expenses array required' });
    }

    // Deduplicate incoming array by id and composite (title + dueDate + amount)
    const seenIds = new Set();
    const seenComposite = new Set();
    const cleanExpenses = [];

    for (const u of expenses) {
      if (!u) continue;
      const id = u.id || u.clientId;
      const titleNorm = String(u.title || '').trim().toLowerCase();
      const dueDate = String(u.dueDate || '').trim();
      const amount = Number(u.amount) || 0;
      const compositeKey = `${titleNorm}__${dueDate}__${amount}`;

      if (id && seenIds.has(id)) continue;
      if (compositeKey && seenComposite.has(compositeKey)) continue;

      if (id) seenIds.add(id);
      seenComposite.add(compositeKey);
      cleanExpenses.push(u);
    }

    await UpcomingExpense.deleteMany({ userId });

    if (cleanExpenses.length > 0) {
      const docs = cleanExpenses.map((e, idx) => ({
        userId,
        clientId: e.id || `up-${idx + 1}`,
        title: e.title?.trim() || 'Payable',
        payee: e.payee || 'Vendor',
        amount: Number(e.amount) || 0,
        dueDate: e.dueDate || new Date().toISOString().split('T')[0],
        urgency: e.urgency || 'Medium',
        category: e.category || 'Supplier Dues',
        status: e.status || 'Upcoming',
      }));
      await UpcomingExpense.insertMany(docs);
    }

    return res.status(200).json({ success: true, count: cleanExpenses.length });
  } catch (err) {
    console.error('[Sync Upcoming Expenses Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Bulk Sync Daily Income Records to MongoDB
 * POST /api/v1/finance/income/sync
 */
export const syncDailyIncome = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!isDbConnected() || !userId) {
      return res.status(200).json({ success: true, offline: true });
    }

    const { records } = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'records array required' });
    }

    await DailyIncome.deleteMany({ userId });

    if (records.length > 0) {
      const seenIncome = new Set();
      const docs = [];

      for (const r of records) {
        if (!r) continue;
        const key = `${r.date}__${r.time}__${r.amount}__${String(r.source || '').trim().toLowerCase()}`;
        if (!seenIncome.has(key)) {
          seenIncome.add(key);
          docs.push({
            userId,
            entryId: r.id || `inc-${docs.length + 1}`,
            date: r.date || new Date().toISOString().split('T')[0],
            source: r.source?.trim() || 'Daily Sales',
            amount: Number(r.amount) || 0,
            mode: r.mode || 'Cash',
            time: r.time || '12:00 PM',
            category: r.category || 'In-Store Retail',
            isConfirmed: r.isConfirmed !== false,
            unconfirmed: r.unconfirmed === true,
          });
        }
      }

      if (docs.length > 0) {
        await DailyIncome.insertMany(docs);
      }
      return res.status(200).json({ success: true, count: docs.length });
    }

    return res.status(200).json({ success: true, count: 0 });
  } catch (err) {
    console.error('[Sync Income Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Save Store Cashflow Settings onto User document in MongoDB
 * POST /api/v1/finance/settings
 */
export const saveCashflowSettings = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!isDbConnected() || !userId) {
      return res.status(200).json({ success: true, offline: true });
    }

    const { openingCash, grossMarginPct, dailyRunningCost, ownerTargetDailySales, openingDate, dailyGoal, upiId } = req.body;

    const updateFields = {
      cashflowSettings: {
        openingCash: Number(openingCash) || 0,
        grossMarginPct: Number(grossMarginPct) || 25,
        dailyRunningCost: Number(dailyRunningCost) || 0,
        ownerTargetDailySales: Number(ownerTargetDailySales) || 10000,
        openingDate: openingDate || new Date().toISOString().split('T')[0],
      },
    };

    if (dailyGoal !== undefined) updateFields.dailyGoal = Number(dailyGoal);
    if (upiId !== undefined) updateFields.upiId = upiId.trim();

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true }).select('-password');
    return res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('[Save Settings Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Fixed Expenses directly from MongoDB for the current user
 * GET /api/v1/finance/fixed-expense
 */
export const getFixedExpenses = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!isDbConnected() || !userId) {
      return res.status(200).json({ success: true, offline: true, fixedExpenses: [] });
    }

    const fixed = await FixedExpense.find({ userId }).sort({ dueDay: 1 });
    const seen = new Set();
    const clean = [];
    for (const f of fixed) {
      const key = `${f.title?.trim().toLowerCase()}__${f.dueDay}__${f.amount}`;
      if (!seen.has(key)) {
        seen.add(key);
        clean.push({
          id: f.clientId || `fix-${f._id}`,
          title: f.title,
          amount: f.amount,
          category: f.category,
          dueDay: f.dueDay,
          status: f.status,
          receiptName: f.receiptName,
          notes: f.notes,
        });
      }
    }
    return res.status(200).json({ success: true, fixedExpenses: clean });
  } catch (err) {
    console.error('[Get Fixed Expenses Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Daily Income History directly from MongoDB for the current user
 * GET /api/v1/finance/income
 */
export const getDailyIncome = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!isDbConnected() || !userId) {
      return res.status(200).json({ success: true, offline: true, dailyIncome: [] });
    }

    const income = await DailyIncome.find({ userId }).sort({ date: -1, createdAt: -1 });
    const seen = new Set();
    const clean = [];
    for (const i of income) {
      const key = `${i.entryId || i._id}`;
      if (!seen.has(key)) {
        seen.add(key);
        clean.push({
          id: i.entryId || `inc-${i._id}`,
          date: i.date,
          source: i.source,
          amount: i.amount,
          mode: i.mode,
          time: i.time,
          category: i.category,
          isConfirmed: i.isConfirmed,
          unconfirmed: i.unconfirmed,
        });
      }
    }
    return res.status(200).json({ success: true, dailyIncome: clean });
  } catch (err) {
    console.error('[Get Daily Income Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
