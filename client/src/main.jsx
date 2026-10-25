import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';

// Seed User's Exact Custom Numbers into localStorage
if (localStorage.getItem('aurum_user_dataset') !== 'v40k_10k_fixed30k') {
  localStorage.setItem('aurum_user_dataset', 'v40k_10k_fixed30k');
  
  // 1. Today's Income (Total 8k: 5k cash + 3k UPI)
  localStorage.setItem(
    'aurum_today_income',
    JSON.stringify([
      {
        id: 'inc-1',
        source: 'Counter Cash Sales',
        amount: 5000,
        mode: 'Cash',
        time: '11:00 AM',
        category: 'In-Store Retail',
      },
      {
        id: 'inc-2',
        source: 'UPI QR Payment (PhonePe / GPay)',
        amount: 3000,
        mode: 'UPI',
        time: '02:30 PM',
        category: 'Digital Collections',
      },
    ])
  );

  // 2. Monthly Fixed Expenses (Rent 10k, EMI 10k, Salaries 7k, Utilities 3k = 30k total)
  localStorage.setItem(
    'aurum_fixed_expenses',
    JSON.stringify([
      {
        id: 'fix-1',
        title: 'Commercial Store & Warehouse Rent',
        amount: 10000,
        category: 'Rent',
        dueDay: 5,
        status: 'Paid',
        receiptName: 'Rent_Receipt_Oct2026.pdf',
        notes: 'Paid to Landlord via NEFT transaction',
      },
      {
        id: 'fix-2',
        title: 'Business Equipment & Machinery EMI',
        amount: 10000,
        category: 'EMI',
        dueDay: 10,
        status: 'Paid',
        receiptName: 'HDFC_EMI_Schedule.pdf',
        notes: 'Auto-debited from primary current account',
      },
      {
        id: 'fix-3',
        title: 'Staff Salary & Operating Stipend',
        amount: 7000,
        category: 'Salaries',
        dueDay: 7,
        status: 'Paid',
        receiptName: 'Salary_Voucher.pdf',
        notes: 'Monthly operating staff payout',
      },
      {
        id: 'fix-4',
        title: 'Commercial Electricity & Utility Bill',
        amount: 3000,
        category: 'Utilities',
        dueDay: 18,
        status: 'Pending',
        receiptName: null,
        notes: 'BESCOM commercial meter connection',
      },
    ])
  );

  // 3. Merchant Profile & Target (10k daily target)
  localStorage.setItem(
    'aurum_profile_info',
    JSON.stringify({
      name: 'Vikas Kori',
      initials: 'VK',
      businessName: 'Zenniths Enterprise',
      phone: '+91 98765 12900',
      email: 'vikas.kori@zenniths.com',
      upiId: 'vikas.kori@okhdfcbank',
      role: 'Owner & Primary Operator',
      currency: '₹',
      dailyGoal: 10000,
      joinedDate: 'January 2026',
    })
  );

  // 4. Default seed for customer receivables if not already populated
  const existingKhata = localStorage.getItem('aurum_ekhata_data');
  if (!existingKhata || existingKhata === '[]') {
    const seed = [
      {
        id: 'cust-1',
        idNumber: 1,
        name: 'Nitish',
        totalAmount: 240,
        dueDate: '29 October',
        phone: '+91 98765 43210',
        status: 'Pending',
        lastUpdated: 'Today at 04:36 PM',
        history: [
          { amount: 150, date: 'Today at 04:15 PM', note: 'Initial Khata balance' },
          { amount: 20, date: 'Today at 04:26 PM', note: 'Added ₹20 via voice' },
          { amount: 70, date: 'Today at 04:36 PM', note: 'Added ₹70 via voice' },
        ],
      },
      {
        id: 'cust-2',
        idNumber: 2,
        name: 'Rahul Sharma',
        totalAmount: 420,
        dueDate: 'Undated / On-Demand',
        phone: '+91 91234 56789',
        status: 'Pending',
        lastUpdated: 'Yesterday at 06:30 PM',
        history: [
          { amount: 420, date: 'Yesterday at 06:30 PM', note: 'Supplies credit' },
        ],
      },
      {
        id: 'cust-3',
        idNumber: 3,
        name: 'Priya Stores',
        totalAmount: 850,
        dueDate: '5 November',
        phone: '+91 98111 22334',
        status: 'Pending',
        lastUpdated: '2 days ago',
        history: [
          { amount: 850, date: '2 days ago', note: 'Provisions ledger credit' },
        ],
      },
    ];
    localStorage.setItem('aurum_ekhata_data', JSON.stringify(seed));
    localStorage.setItem('aurum_ekhata_customers', JSON.stringify(seed));
  }
  if (!localStorage.getItem('aurum_upcoming_expenses')) {
    localStorage.setItem('aurum_upcoming_expenses', JSON.stringify([]));
  }

  // 5. Cash-Flow Onboarding Parameters: Margin 25%, Running Costs ₹500/day, Buffer ₹1,500
  localStorage.setItem(
    'aurum_cashflow_settings',
    JSON.stringify({
      openingCash: 40000,
      grossMarginPct: 25,
      dailyRunningCost: 500,
      safetyBuffer: 1500,
    })
  );
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
