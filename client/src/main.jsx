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

  // 4. Upcoming liabilities & customer udhar cleared for user to add manually
  localStorage.setItem('aurum_upcoming_expenses', JSON.stringify([]));
  localStorage.setItem('aurum_ekhata_data', JSON.stringify([]));
  localStorage.setItem('aurum_ekhata_customers', JSON.stringify([]));
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
