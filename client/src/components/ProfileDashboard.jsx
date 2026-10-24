import React, { useState, useEffect } from 'react';
import {
  User,
  IndianRupee,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Building2,
  CreditCard,
  TrendingUp,
  Send,
  UploadCloud,
  Check,
  X,
  FileText,
  Phone,
  Mail,
  ShieldCheck,
  Receipt,
  Sparkles,
  Layers,
  ArrowRight,
  DollarSign,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

export default function ProfileDashboard({ setActivePage }) {
  // ----------------------------------------------------
  // 1. User Profile Details State
  // ----------------------------------------------------
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('aurum_profile_info');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          upiId: parsed.upiId || 'vikas.kori@okhdfcbank',
        };
      } catch (e) {}
    }
    return {
      name: 'Vikas Kori',
      initials: 'VK',
      businessName: 'Zenniths Enterprise',
      phone: '+91 98765 12900',
      email: 'vikas.kori@zenniths.com',
      upiId: 'vikas.kori@okhdfcbank',
      role: 'Owner & Primary Operator',
      currency: '₹',
      dailyGoal: 20000,
      joinedDate: 'January 2026',
    };
  });

  // ----------------------------------------------------
  // 2. Today's Income State
  // ----------------------------------------------------
  const [todayIncome, setTodayIncome] = useState(() => {
    const saved = localStorage.getItem('aurum_today_income');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'inc-1',
        source: 'Counter Cash Sales',
        amount: 8400,
        mode: 'Cash',
        time: '10:30 AM',
        category: 'In-Store Retail',
      },
      {
        id: 'inc-2',
        source: 'UPI QR Payment (PhonePe / GPay)',
        amount: 6250,
        mode: 'UPI',
        time: '01:15 PM',
        category: 'Digital Collections',
      },
      {
        id: 'inc-3',
        source: 'Khata Repayment (Rahul Sharma)',
        amount: 420,
        mode: 'UPI',
        time: '03:45 PM',
        category: 'eKhata Received',
      },
      {
        id: 'inc-4',
        source: 'Wholesale Supply Order #108',
        amount: 3380,
        mode: 'Bank Transfer',
        time: '05:10 PM',
        category: 'B2B Client Invoice',
      },
    ];
  });

  // ----------------------------------------------------
  // 3. Monthly Fixed Expenses State (Rent, EMI, etc.)
  // ----------------------------------------------------
  const [fixedExpenses, setFixedExpenses] = useState(() => {
    const saved = localStorage.getItem('aurum_fixed_expenses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'fix-1',
        title: 'Commercial Store & Warehouse Rent',
        amount: 22000,
        category: 'Rent',
        dueDay: 5,
        status: 'Paid',
        receiptName: 'Rent_Receipt_Oct2026.pdf',
        notes: 'Paid to Landlord via NEFT transaction',
      },
      {
        id: 'fix-2',
        title: 'Business Equipment & Machinery EMI',
        amount: 14500,
        category: 'EMI',
        dueDay: 10,
        status: 'Paid',
        receiptName: 'HDFC_EMI_Schedule.pdf',
        notes: 'Auto-debited from primary current account',
      },
      {
        id: 'fix-3',
        title: 'Commercial Electricity & Utility Bill',
        amount: 4800,
        category: 'Utilities',
        dueDay: 18,
        status: 'Pending',
        receiptName: null,
        notes: 'BESCOM commercial meter connection',
      },
      {
        id: 'fix-4',
        title: 'Assistant Operator Salary & Stipend',
        amount: 6500,
        category: 'Salaries',
        dueDay: 7,
        status: 'Paid',
        receiptName: 'Salary_Voucher.pdf',
        notes: 'Monthly operating staff payout',
      },
      {
        id: 'fix-5',
        title: 'High-speed Fiber & Cloud Subscriptions',
        amount: 1800,
        category: 'Subscriptions',
        dueDay: 22,
        status: 'Pending',
        receiptName: null,
        notes: 'Airtel Office Broadband + Invoicing SaaS',
      },
    ];
  });

  // ----------------------------------------------------
  // 4. Upcoming Expenses State (Just below Fixed Expenses)
  // ----------------------------------------------------
  const [upcomingExpenses, setUpcomingExpenses] = useState(() => {
    const saved = localStorage.getItem('aurum_upcoming_expenses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'up-1',
        title: 'Raw Material Inventory Batch #42',
        payee: 'Apex Distributors India',
        amount: 12500,
        dueDate: '2026-10-28',
        urgency: 'High',
        category: 'Supplier Dues',
        status: 'Upcoming',
      },
      {
        id: 'up-2',
        title: 'Quarterly GST Filing & Accounting Fees',
        payee: 'Chartered Accountant Services',
        amount: 7800,
        dueDate: '2026-10-31',
        urgency: 'Urgent',
        category: 'Taxes & Compliance',
        status: 'Upcoming',
      },
      {
        id: 'up-3',
        title: 'Commercial Insurance Policy Installment',
        payee: 'ICICI Lombard General Insurance',
        amount: 3200,
        dueDate: '2026-11-04',
        urgency: 'Medium',
        category: 'Insurance',
        status: 'Upcoming',
      },
      {
        id: 'up-4',
        title: 'Packaging Box & Bubble Wrap Bulk Order',
        payee: 'EcoPack India Supplies',
        amount: 2450,
        dueDate: '2026-11-09',
        urgency: 'Low',
        category: 'Packaging',
        status: 'Upcoming',
      },
    ];
  });

  // ----------------------------------------------------
  // 5. Cash to Receive / Receivables State
  // ----------------------------------------------------
  const [otherReceivables, setOtherReceivables] = useState(() => {
    const saved = localStorage.getItem('aurum_other_receivables');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'rec-1',
        debtor: 'Krypton Creative Studio',
        amount: 8500,
        phone: '+91 98800 11223',
        dueDate: '2026-10-27',
        reason: 'Custom display fixtures & design shipment',
        type: 'Client Invoice',
        status: 'Due Soon',
      },
      {
        id: 'rec-2',
        debtor: 'Subhash Trading Co.',
        amount: 5600,
        phone: '+91 97411 44556',
        dueDate: '2026-10-25',
        reason: 'Consignment wholesale balance',
        type: 'Wholesale Udhar',
        status: 'Overdue',
      },
      {
        id: 'rec-3',
        debtor: 'Mahesh Hardware (Vendor Advance)',
        amount: 2000,
        phone: '+91 94488 99001',
        dueDate: '2026-11-02',
        reason: 'Refund of excess advance on canceled parts',
        type: 'Advance Refund',
        status: 'Pending',
      },
    ];
  });

  // Load eKhata customer credits to show total cash to receive
  const [eKhataCustomers, setEKhataCustomers] = useState([]);

  useEffect(() => {
    const savedKhata = localStorage.getItem('aurum_ekhata_data');
    if (savedKhata) {
      try {
        const parsed = JSON.parse(savedKhata);
        if (Array.isArray(parsed)) {
          setEKhataCustomers(parsed.filter((c) => Number(c.totalAmount) > 0));
        }
      } catch (e) {}
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('aurum_profile_info', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('aurum_today_income', JSON.stringify(todayIncome));
  }, [todayIncome]);

  useEffect(() => {
    localStorage.setItem('aurum_fixed_expenses', JSON.stringify(fixedExpenses));
  }, [fixedExpenses]);

  useEffect(() => {
    localStorage.setItem('aurum_upcoming_expenses', JSON.stringify(upcomingExpenses));
  }, [upcomingExpenses]);

  useEffect(() => {
    localStorage.setItem('aurum_other_receivables', JSON.stringify(otherReceivables));
  }, [otherReceivables]);

  // ----------------------------------------------------
  // Calculated Financial Metrics
  // ----------------------------------------------------
  const totalTodayIncome = todayIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalMonthlyFixed = fixedExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalUpcoming = upcomingExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const eKhataTotalReceivable = eKhataCustomers.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
  const otherTotalReceivable = otherReceivables.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalCashToReceive = eKhataTotalReceivable + otherTotalReceivable;

  const goalPercentage = Math.min(Math.round((totalTodayIncome / (profile.dailyGoal || 20000)) * 100), 100);

  // ----------------------------------------------------
  // Modal States
  // ----------------------------------------------------
  const [modalType, setModalType] = useState(null); // 'income', 'fixed', 'upcoming', 'receivable', 'profile', 'upi'
  const [tempUpi, setTempUpi] = useState(profile.upiId || 'vikas.kori@okhdfcbank');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Forms
  const [incomeForm, setIncomeForm] = useState({
    source: '',
    amount: '',
    mode: 'Cash',
    category: 'Counter Sales',
  });

  const [fixedForm, setFixedForm] = useState({
    title: '',
    amount: '',
    category: 'Rent',
    dueDay: 5,
    notes: '',
    receiptName: '',
  });

  const [upcomingForm, setUpcomingForm] = useState({
    title: '',
    payee: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    urgency: 'Medium',
    category: 'Supplier Bill',
  });

  const [receivableForm, setReceivableForm] = useState({
    debtor: '',
    amount: '',
    phone: '',
    dueDate: new Date().toISOString().split('T')[0],
    reason: '',
    type: 'Customer Udhar',
  });

  const [profileForm, setProfileForm] = useState(profile);

  // Handlers
  const handleAddIncome = (e) => {
    e.preventDefault();
    if (!incomeForm.source || !incomeForm.amount) return;

    const newItem = {
      id: 'inc-' + Date.now(),
      source: incomeForm.source.trim(),
      amount: Number(incomeForm.amount),
      mode: incomeForm.mode,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: incomeForm.category,
    };

    setTodayIncome([newItem, ...todayIncome]);
    setIncomeForm({ source: '', amount: '', mode: 'Cash', category: 'Counter Sales' });
    setModalType(null);
    showToast(`Added ₹${newItem.amount.toLocaleString()} to Today's Income!`);
  };

  const handleDeleteIncome = (id) => {
    setTodayIncome(todayIncome.filter((i) => i.id !== id));
    showToast('Income entry removed.');
  };

  const handleAddFixedExpense = (e) => {
    e.preventDefault();
    if (!fixedForm.title || !fixedForm.amount) return;

    const newItem = {
      id: 'fix-' + Date.now(),
      title: fixedForm.title.trim(),
      amount: Number(fixedForm.amount),
      category: fixedForm.category,
      dueDay: Number(fixedForm.dueDay) || 1,
      status: 'Pending',
      receiptName: fixedForm.receiptName || null,
      notes: fixedForm.notes.trim() || 'Scheduled recurring fixed expense',
    };

    setFixedExpenses([...fixedExpenses, newItem]);
    setFixedForm({ title: '', amount: '', category: 'Rent', dueDay: 5, notes: '', receiptName: '' });
    setModalType(null);
    showToast(`Added monthly fixed expense: ${newItem.title}`);
  };

  const handleToggleFixedStatus = (id) => {
    setFixedExpenses(
      fixedExpenses.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'Paid' ? 'Pending' : 'Paid' }
          : item
      )
    );
    showToast('Monthly expense status updated.');
  };

  const handleDeleteFixedExpense = (id) => {
    setFixedExpenses(fixedExpenses.filter((i) => i.id !== id));
    showToast('Fixed expense removed.');
  };

  const handleAddUpcomingExpense = (e) => {
    e.preventDefault();
    if (!upcomingForm.title || !upcomingForm.amount) return;

    const newItem = {
      id: 'up-' + Date.now(),
      title: upcomingForm.title.trim(),
      payee: upcomingForm.payee.trim() || 'Vendor',
      amount: Number(upcomingForm.amount),
      dueDate: upcomingForm.dueDate,
      urgency: upcomingForm.urgency,
      category: upcomingForm.category,
      status: 'Upcoming',
    };

    setUpcomingExpenses([...upcomingExpenses, newItem]);
    setUpcomingForm({
      title: '',
      payee: '',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      urgency: 'Medium',
      category: 'Supplier Bill',
    });
    setModalType(null);
    showToast(`Scheduled upcoming expense: ${newItem.title}`);
  };

  const handleDeleteUpcoming = (id) => {
    setUpcomingExpenses(upcomingExpenses.filter((i) => i.id !== id));
    showToast('Upcoming expense removed.');
  };

  const handleAddReceivable = (e) => {
    e.preventDefault();
    if (!receivableForm.debtor || !receivableForm.amount) return;

    const newItem = {
      id: 'rec-' + Date.now(),
      debtor: receivableForm.debtor.trim(),
      amount: Number(receivableForm.amount),
      phone: receivableForm.phone.trim() || '+91 99000 00000',
      dueDate: receivableForm.dueDate,
      reason: receivableForm.reason.trim() || 'General credit receivable',
      type: receivableForm.type,
      status: 'Due Soon',
    };

    setOtherReceivables([...otherReceivables, newItem]);
    setReceivableForm({
      debtor: '',
      amount: '',
      phone: '',
      dueDate: new Date().toISOString().split('T')[0],
      reason: '',
      type: 'Customer Udhar',
    });
    setModalType(null);
    showToast(`Added receivable of ₹${newItem.amount.toLocaleString()} from ${newItem.debtor}`);
  };

  const handleMarkReceivableCollected = (receivable) => {
    // 1. Remove from receivables
    setOtherReceivables(otherReceivables.filter((r) => r.id !== receivable.id));

    // 2. Add directly to Today's Income
    const incomeEntry = {
      id: 'inc-' + Date.now(),
      source: `Received from ${receivable.debtor}`,
      amount: Number(receivable.amount),
      mode: 'UPI',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'Receivable Collected',
    };
    setTodayIncome([incomeEntry, ...todayIncome]);

    showToast(`Received ₹${receivable.amount.toLocaleString()} from ${receivable.debtor} and credited to Today's Income!`);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfile(profileForm);
    setModalType(null);
    showToast('Profile information updated successfully!');
  };

  const handleSaveUpiOnly = (e) => {
    e.preventDefault();
    const cleaned = (tempUpi || '').trim();
    if (!cleaned) return;
    const updated = { ...profile, upiId: cleaned };
    setProfile(updated);
    setProfileForm(updated);
    localStorage.setItem('aurum_profile_info', JSON.stringify(updated));
    setModalType(null);
    showToast(`Merchant UPI ID updated to ${cleaned}!`);
  };

  return (
    <div className="w-full bg-white text-neutral-900 pb-20 selection:bg-amber-300 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className="px-5 py-3 rounded-2xl bg-black text-yellow-300 border border-yellow-400 shadow-2xl text-xs font-bold flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-neutral-200/80 bg-neutral-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-neutral-500">
            <span className="font-semibold text-neutral-800">Home</span>
            <span>/</span>
            <span className="text-black font-bold">Profile Dashboard</span>
            <span className="bg-yellow-100 text-yellow-800 font-bold px-2 py-0.5 rounded-full text-[10px] border border-yellow-300">
              Merchant Financial Overview
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActivePage('ekhata')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-neutral-700 bg-white border border-neutral-200 hover:border-yellow-400 hover:text-black transition-all flex items-center space-x-1.5 shadow-xs"
            >
              <span>Switch to eKhata</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setProfileForm(profile);
                setModalType('profile');
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-black bg-yellow-300 hover:bg-yellow-400 border border-yellow-400 transition-all flex items-center space-x-1.5 shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ========================================================= */}
        {/* USER PROFILE HEADER CARD                                 */}
        {/* ========================================================= */}
        <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 border border-yellow-400/40 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            {/* Avatar & User Details */}
            <div className="flex items-center space-x-4 sm:space-x-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black text-yellow-300 font-black text-xl sm:text-2xl flex items-center justify-center border-2 border-yellow-400 shadow-md">
                {profile.initials || 'VK'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-black text-black font-['Outfit'] tracking-tight">
                    {profile.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-black text-yellow-300 text-[10px] font-bold tracking-wider uppercase">
                    PRO
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-neutral-700 mt-0.5 flex items-center space-x-2">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>{profile.businessName}</span>
                  <span className="text-neutral-400">•</span>
                  <span className="text-neutral-500">{profile.role}</span>
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-neutral-600">
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-neutral-400" />
                    <span>{profile.phone}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-neutral-400" />
                    <span>{profile.email}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTempUpi(profile.upiId || 'vikas.kori@okhdfcbank');
                      setModalType('upi');
                    }}
                    className="flex items-center space-x-1.5 font-semibold px-2.5 py-1 rounded-lg border font-mono transition-colors cursor-pointer group shadow-2xs"
                    style={{
                      backgroundColor: '#F9DEBF',
                      borderColor: '#3D2E18',
                      color: '#3D2E18',
                    }}
                    title="Click to edit Merchant UPI ID"
                  >
                    <CreditCard className="w-3.5 h-3.5" style={{ color: '#3D2E18' }} />
                    <span>UPI: {profile.upiId || 'vikas.kori@okhdfcbank'}</span>
                    <span className="text-[10px] font-sans underline font-bold ml-1 opacity-70 group-hover:opacity-100">
                      Edit
                    </span>
                  </button>
                  <span className="flex items-center space-x-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" />
                    <span>KYC Verified</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Balance Cards Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/95 rounded-2xl p-3 sm:p-4 border border-yellow-300/60 shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">
                  Today's Income
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-600 font-['Outfit'] block mt-0.5">
                  ₹{totalTodayIncome.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  {goalPercentage}% of daily goal
                </span>
              </div>

              <div className="bg-white/95 rounded-2xl p-3 sm:p-4 border border-neutral-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">
                  Monthly Fixed
                </span>
                <span className="text-base sm:text-lg font-black text-neutral-900 font-['Outfit'] block mt-0.5">
                  ₹{totalMonthlyFixed.toLocaleString()}
                </span>
                <span className="text-[10px] text-neutral-500 font-medium block mt-1">
                  {fixedExpenses.length} regular commitments
                </span>
              </div>

              <div className="bg-white/95 rounded-2xl p-3 sm:p-4 border border-neutral-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">
                  Upcoming Due
                </span>
                <span className="text-base sm:text-lg font-black text-amber-700 font-['Outfit'] block mt-0.5">
                  ₹{totalUpcoming.toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-600 font-medium block mt-1">
                  Due in next 15 days
                </span>
              </div>

              <div className="bg-white/95 rounded-2xl p-3 sm:p-4 border border-neutral-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">
                  Cash to Receive
                </span>
                <span className="text-base sm:text-lg font-black text-blue-600 font-['Outfit'] block mt-0.5">
                  ₹{totalCashToReceive.toLocaleString()}
                </span>
                <span className="text-[10px] text-blue-600 font-medium block mt-1">
                  From {otherReceivables.length + eKhataCustomers.length} entities
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 1. TODAY'S INCOME SECTION (HIGHLIGHTED & EMPHASIZED)       */}
        {/* ========================================================= */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-100 gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-black font-['Outfit'] tracking-tight">
                  Today's Income
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Live Daily Revenue
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Real-time record of all sales, payments received, and credit collections for today.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Today</span>
                <span className="text-xl font-black text-emerald-600 font-['Outfit']">
                  ₹{totalTodayIncome.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setModalType('income')}
                className="gold-button-gradient px-4 py-2 rounded-xl text-xs font-bold text-black border border-yellow-400 flex items-center space-x-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Add Today's Income</span>
              </button>
            </div>
          </div>

          {/* Progress towards Daily Target */}
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-black">Daily Income Target:</span>
                <span className="text-xs font-extrabold text-neutral-800">
                  ₹{(profile.dailyGoal || 20000).toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {goalPercentage}% Achieved
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Remaining to hit target: ₹{Math.max(0, (profile.dailyGoal || 20000) - totalTodayIncome).toLocaleString()}
              </p>
            </div>

            <div className="w-full sm:w-64">
              <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${goalPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Today's Income Entries List */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {todayIncome.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 hover:border-yellow-400/80 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.time}</span>
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-black leading-snug line-clamp-1 mb-1">
                      {item.source}
                    </h4>
                    <span className="text-[11px] font-semibold text-neutral-500">
                      via <strong className="text-neutral-800">{item.mode}</strong>
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-200/60 flex items-center justify-between">
                    <span className="text-base font-black text-emerald-600 font-['Outfit']">
                      +₹{Number(item.amount).toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDeleteIncome(item.id)}
                      className="p-1 rounded-md text-neutral-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {todayIncome.length === 0 && (
              <div className="text-center py-8 border border-dashed border-neutral-200 rounded-2xl">
                <p className="text-xs text-neutral-500">No income entries recorded for today yet.</p>
                <button
                  onClick={() => setModalType('income')}
                  className="mt-2 text-xs font-bold text-amber-600 hover:underline"
                >
                  + Add First Income Entry
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. MONTHLY FIXED EXPENSES (RENT, EMI, UTILITIES, ETC.)    */}
        {/* ========================================================= */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-100 gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-black font-['Outfit'] tracking-tight">
                  Monthly Fixed Expenses
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Rent, EMI, Utilities
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Mandatory monthly recurring outlays, rent agreements, loan EMIs, and utility commitments.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Monthly Total</span>
                <span className="text-xl font-black text-neutral-900 font-['Outfit']">
                  ₹{totalMonthlyFixed.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setModalType('fixed')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 transition-all flex items-center space-x-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Add Fixed Expense</span>
              </button>
            </div>
          </div>

          {/* Fixed Expense Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fixedExpenses.map((expense) => (
              <div
                key={expense.id}
                className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 hover:border-neutral-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white border border-neutral-200 text-neutral-800">
                      {expense.category}
                    </span>
                    <button
                      onClick={() => handleToggleFixedStatus(expense.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        expense.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {expense.status === 'Paid' ? '✓ Paid for Oct' : '● Due on ' + expense.dueDay + 'th'}
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-black mt-1 mb-1">
                    {expense.title}
                  </h3>
                  <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                    {expense.notes}
                  </p>

                  {/* Document / Receipt Upload indicator */}
                  {expense.receiptName ? (
                    <div className="mt-3 flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/70">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span className="truncate">{expense.receiptName}</span>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center space-x-1 text-[11px] text-neutral-400">
                      <UploadCloud className="w-3 h-3" />
                      <span>No document uploaded</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Monthly Amount</span>
                    <span className="text-base font-black text-black font-['Outfit']">
                      ₹{Number(expense.amount).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleToggleFixedStatus(expense.id)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700"
                    >
                      {expense.status === 'Paid' ? 'Mark Due' : 'Mark Paid'}
                    </button>
                    <button
                      onClick={() => handleDeleteFixedExpense(expense.id)}
                      className="p-1 rounded-md text-neutral-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. UPCOMING EXPENSES (JUST BELOW MONTHLY FIXED EXPENSES)   */}
        {/* ========================================================= */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-100 gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-black font-['Outfit'] tracking-tight">
                  Upcoming Expenses & Scheduled Payables
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  Near-term Liabilities
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Vendor dues, raw material purchases, tax deadlines, and one-off upcoming bills due soon.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Upcoming Dues</span>
                <span className="text-xl font-black text-rose-600 font-['Outfit']">
                  ₹{totalUpcoming.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setModalType('upcoming')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 transition-all flex items-center space-x-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Schedule Upcoming Expense</span>
              </button>
            </div>
          </div>

          {/* Table / Cards of Upcoming Expenses */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px] tracking-wider bg-neutral-50/50">
                  <th className="py-3 px-4">Expense / Purpose</th>
                  <th className="py-3 px-4">Payee / Vendor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4 text-right">Amount Due</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {upcomingExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors group">
                    <td className="py-3.5 px-4 font-bold text-black">
                      {item.title}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600 font-medium">
                      {item.payee}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-semibold text-[10px] border border-neutral-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-700 font-semibold font-mono">
                      {item.dueDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.urgency === 'Urgent'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : item.urgency === 'High'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                        }`}
                      >
                        {item.urgency}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-rose-600 font-['Outfit'] text-sm">
                      ₹{Number(item.amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteUpcoming(item.id)}
                        className="p-1 rounded hover:bg-rose-50 text-neutral-300 hover:text-rose-500 transition-colors"
                        title="Remove expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. CASH TO RECEIVE (CUSTOMER UDHAR & PENDING INFLOWS)     */}
        {/* ========================================================= */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-100 gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
                  <Wallet className="w-4 h-4" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-black font-['Outfit'] tracking-tight">
                  Cash to Receive (Pending Receivables)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                  Total Receivables: ₹{totalCashToReceive.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Money owed to you by customers, wholesale clients, and other parties. Click "Mark Received" to credit directly to Today's Income.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setModalType('receivable')}
                className="gold-button-gradient px-4 py-2 rounded-xl text-xs font-bold text-black border border-yellow-400 flex items-center space-x-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Add Receivable</span>
              </button>
            </div>
          </div>

          {/* eKhata Synchronized Section */}
          {eKhataCustomers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                    eKhata Customer Credit Ledger ({eKhataCustomers.length})
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-400">
                    (Auto-synced from eKhata voice ledger)
                  </span>
                </div>
                <button
                  onClick={() => setActivePage('ekhata')}
                  className="text-xs font-bold text-amber-600 hover:underline flex items-center space-x-1"
                >
                  <span>Open eKhata Page</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {eKhataCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-black">{cust.name}</h4>
                      <p className="text-[11px] text-neutral-500">{cust.phone || 'No phone'} • Due: {cust.dueDate || 'End of month'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-blue-700 font-['Outfit'] block">
                        ₹{Number(cust.totalAmount).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.2 rounded">
                        Pending Udhar
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Receivables List */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide block">
              Direct & Client Receivables ({otherReceivables.length})
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherReceivables.map((rec) => (
                <div
                  key={rec.id}
                  className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 hover:border-blue-400/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-800">
                        {rec.type}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          rec.status === 'Overdue'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-black mb-1">{rec.debtor}</h4>
                    <p className="text-[11px] text-neutral-500 mb-2 leading-relaxed">
                      {rec.reason}
                    </p>
                    <p className="text-[10px] font-semibold text-neutral-400 flex items-center space-x-2">
                      <span>Phone: {rec.phone}</span>
                      <span>•</span>
                      <span>Due: {rec.dueDate}</span>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Amount to Collect</span>
                      <span className="text-base font-black text-blue-600 font-['Outfit']">
                        ₹{Number(rec.amount).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleMarkReceivableCollected(rec)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1 shadow-sm transition-all"
                      title="Collect and add directly to Today's Income"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Mark Received</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* 1. Add Today's Income Modal */}
      {modalType === 'income' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
              <h3 className="text-base font-black text-black font-['Outfit']">
                Record Today's Income Entry
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddIncome} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                  Income Source / Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter Cash Sales, Client Advance"
                  value={incomeForm.source}
                  onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none focus:border-yellow-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 5000"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-bold text-black focus:outline-none focus:border-yellow-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={incomeForm.mode}
                    onChange={(e) => setIncomeForm({ ...incomeForm, mode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Category
                  </label>
                  <select
                    value={incomeForm.category}
                    onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none"
                  >
                    <option value="In-Store Retail">In-Store Retail</option>
                    <option value="Digital Collections">Digital Collections</option>
                    <option value="B2B Client Invoice">B2B Client Invoice</option>
                    <option value="Services">Services</option>
                    <option value="Other Revenue">Other Revenue</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-button-gradient px-5 py-2 rounded-xl text-xs font-bold text-black border border-yellow-400"
                >
                  Add Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Fixed Expense Modal */}
      {modalType === 'fixed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
              <h3 className="text-base font-black text-black font-['Outfit']">
                Add Monthly Fixed Expense
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFixedExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shop Rent, Equipment Loan EMI"
                  value={fixedForm.title}
                  onChange={(e) => setFixedForm({ ...fixedForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none focus:border-yellow-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 15000"
                    value={fixedForm.amount}
                    onChange={(e) => setFixedForm({ ...fixedForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-bold text-black focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Recurring Due Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Day (1-31)"
                    value={fixedForm.dueDay}
                    onChange={(e) => setFixedForm({ ...fixedForm, dueDay: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                  Category
                </label>
                <select
                  value={fixedForm.category}
                  onChange={(e) => setFixedForm({ ...fixedForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none"
                >
                  <option value="Rent">Rent (Shop / Warehouse)</option>
                  <option value="EMI">Loan / Machinery EMI</option>
                  <option value="Utilities">Utilities (Electricity / Water)</option>
                  <option value="Salaries">Staff Salaries</option>
                  <option value="Subscriptions">Software / Internet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                  Upload Document / Receipt (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rent_Agreement_2026.pdf"
                  value={fixedForm.receiptName}
                  onChange={(e) => setFixedForm({ ...fixedForm, receiptName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none placeholder:text-neutral-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                  Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="Bank account or payment instructions..."
                  value={fixedForm.notes}
                  onChange={(e) => setFixedForm({ ...fixedForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-yellow-300 hover:bg-yellow-400 border border-yellow-400"
                >
                  Save Fixed Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Upcoming Expense Modal */}
      {modalType === 'upcoming' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
              <h3 className="text-base font-black text-black font-['Outfit']">
                Schedule Upcoming Expense
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUpcomingExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raw Material Batch #43, GST Payment"
                  value={upcomingForm.title}
                  onChange={(e) => setUpcomingForm({ ...upcomingForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Payee / Vendor
                  </label>
                  <input
                    type="text"
                    placeholder="Vendor Name"
                    value={upcomingForm.payee}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, payee: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Amount"
                    value={upcomingForm.amount}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-bold text-black focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={upcomingForm.dueDate}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Urgency
                  </label>
                  <select
                    value={upcomingForm.urgency}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, urgency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-rose-300 hover:bg-rose-400 border border-rose-400"
                >
                  Schedule Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Receivable Modal */}
      {modalType === 'receivable' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
              <h3 className="text-base font-black text-black font-['Outfit']">
                Add Cash to Receive (Receivable)
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddReceivable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                  Debtor / Customer / Entity Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Traders, Nitish"
                  value={receivableForm.debtor}
                  onChange={(e) => setReceivableForm({ ...receivableForm, debtor: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Amount to Receive (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 7500"
                    value={receivableForm.amount}
                    onChange={(e) => setReceivableForm({ ...receivableForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-bold text-black focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 ..."
                    value={receivableForm.phone}
                    onChange={(e) => setReceivableForm({ ...receivableForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Promised Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={receivableForm.dueDate}
                    onChange={(e) => setReceivableForm({ ...receivableForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Type
                  </label>
                  <select
                    value={receivableForm.type}
                    onChange={(e) => setReceivableForm({ ...receivableForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none"
                  >
                    <option value="Customer Udhar">Customer Udhar / Khata</option>
                    <option value="Client Invoice">Client Invoice</option>
                    <option value="Advance Return">Advance Refund</option>
                    <option value="Personal Loan">Personal Loan Return</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                  Reason / Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="Details of supplies, goods, or invoice numbers..."
                  value={receivableForm.reason}
                  onChange={(e) => setReceivableForm({ ...receivableForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-blue-300 hover:bg-blue-400 border border-blue-400"
                >
                  Save Receivable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Profile Modal */}
      {modalType === 'profile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
              <h3 className="text-base font-black text-black font-['Outfit']">
                Edit User Profile Details
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                  Business / Store Name
                </label>
                <input
                  type="text"
                  value={profileForm.businessName}
                  onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-black focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#3D2E18' }}>
                  Merchant UPI ID
                </label>
                <div className="relative">
                  <CreditCard className="w-3.5 h-3.5 absolute left-3 top-3" style={{ color: '#8A91A0' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. vikas.kori@okhdfcbank"
                    value={profileForm.upiId || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, upiId: e.target.value.trim() })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-mono font-bold outline-none border transition-all"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#F9DEBF',
                      color: '#3D2E18',
                    }}
                  />
                </div>
                <p className="text-[11px] mt-1" style={{ color: '#8A91A0' }}>
                  Mentioned in WhatsApp reminders for customer payments.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                  Daily Income Target (₹)
                </label>
                <input
                  type="number"
                  min="100"
                  value={profileForm.dailyGoal}
                  onChange={(e) => setProfileForm({ ...profileForm, dailyGoal: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-bold text-black focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-opacity hover:opacity-90 shadow-sm"
                  style={{
                    backgroundColor: '#3D2E18',
                    color: '#F9DEBF',
                  }}
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Simple Edit UPI ID Modal (#3D2E18, #F9DEBF, #8A91A0) */}
      {modalType === 'upi' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border"
            style={{ borderColor: '#F9DEBF' }}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b" style={{ borderColor: '#F9DEBF' }}>
              <div className="flex items-center space-x-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-xs"
                  style={{ backgroundColor: '#3D2E18', color: '#F9DEBF' }}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black font-['Outfit']" style={{ color: '#3D2E18' }}>
                    Edit Merchant UPI ID
                  </h3>
                  <p className="text-[11px]" style={{ color: '#8A91A0' }}>
                    Used for WhatsApp payment reminders & QR receipts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                style={{ color: '#8A91A0' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpiOnly} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: '#3D2E18' }}>
                  Merchant UPI ID (VPA) *
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3.5 top-3" style={{ color: '#8A91A0' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. vikas.kori@okhdfcbank"
                    value={tempUpi}
                    onChange={(e) => setTempUpi(e.target.value.trim())}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm font-mono font-bold outline-none border transition-all"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#3D2E18',
                      color: '#3D2E18',
                    }}
                    autoFocus
                  />
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: '#8A91A0' }}>
                  Customers will receive direct 1-tap payment links on WhatsApp with this UPI ID.
                </p>
              </div>

              <div className="pt-3 border-t flex items-center justify-end space-x-2" style={{ borderColor: '#F9DEBF' }}>
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  style={{ color: '#8A91A0' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all hover:opacity-90 shadow-sm"
                  style={{
                    backgroundColor: '#3D2E18',
                    color: '#F9DEBF',
                  }}
                >
                  Save UPI ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
