import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Building2,
  Phone,
  Mail,
  CreditCard,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  X,
  TrendingUp,
  Calendar,
  Wallet,
  ArrowRight,
  LogOut,
  Sparkles,
  Zap,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFixedExpensesDueWithin15Days } from '../services/expenseSync';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      name: user?.name || 'Vikas Kori',
      initials: 'VK',
      businessName: user?.businessName || 'Zenniths Enterprise',
      phone: user?.phone || '+91 98765 12900',
      email: user?.email || 'vikas.kori@zenniths.com',
      upiId: 'vikas.kori@okhdfcbank',
      role: 'Owner & Primary Operator',
      currency: '₹',
      dailyGoal: 10000,
      joinedDate: 'January 2026',
    };
  });

  const [todayIncome] = useState(() => {
    const saved = localStorage.getItem('aurum_today_income');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [{ amount: 5000 }, { amount: 3000 }];
  });

  const [fixedExpenses] = useState(() => {
    const saved = localStorage.getItem('aurum_fixed_expenses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { amount: 10000, dueDay: 5 },
      { amount: 10000, dueDay: 10 },
      { amount: 7000, dueDay: 7 },
      { amount: 3000, dueDay: 18 },
    ];
  });

  const [upcomingExpenses] = useState(() => {
    const saved = localStorage.getItem('aurum_upcoming_expenses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [eKhataCustomers] = useState(() => {
    const saved = localStorage.getItem('aurum_ekhata_customers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [tempUpi, setTempUpi] = useState(profile.upiId || 'vikas.kori@okhdfcbank');
  const [profileForm, setProfileForm] = useState(profile);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totalTodayIncome = todayIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalMonthlyFixed = fixedExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const fixedDueWithin15 = getFixedExpensesDueWithin15Days(fixedExpenses);
  const totalUpcoming15 =
    upcomingExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) +
    fixedDueWithin15.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalUdhar = eKhataCustomers.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
  const goalPercentage = Math.min(Math.round((totalTodayIncome / (profile.dailyGoal || 20000)) * 100), 100);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfile(profileForm);
    localStorage.setItem('aurum_profile_info', JSON.stringify(profileForm));
    setIsEditProfileOpen(false);
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
    setIsUpiModalOpen(false);
    showToast(`Merchant UPI ID updated to ${cleaned}!`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dedicated Financial Modules navigation data
  const navigationHubs = [
    {
      title: 'Predictive Cash Runway',
      path: '/#runway',
      tag: 'AI Forecast',
      tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
      description: 'Dynamic burn rate engine, 23-day runway prediction, and What-If Udhar recovery simulator.',
      icon: TrendingUp,
      accent: 'amber',
      metric: '23 Days Safe',
      submetric: 'Burn: ₹1,653/day',
    },
    {
      title: 'Upcoming Payables (15d)',
      path: '/#payables',
      tag: 'Liabilities',
      tagColor: 'bg-rose-100 text-rose-800 border-rose-300',
      description: 'Scheduled vendor dues, tax filings, and auto-synced monthly fixed obligations due in next 15 days.',
      icon: Calendar,
      accent: 'rose',
      metric: `₹${totalUpcoming15.toLocaleString()}`,
      submetric: `${upcomingExpenses.length + fixedDueWithin15.length} dues scheduled`,
    },
    {
      title: 'Customer Receivables (Udhar)',
      path: '/#receivables',
      tag: 'Cash Inflow',
      tagColor: 'bg-blue-100 text-blue-800 border-blue-300',
      description: 'Customer credit ledger with near-term and undated udhar, 1-click settlement crediting Today’s Income.',
      icon: Wallet,
      accent: 'blue',
      metric: `₹${totalUdhar.toLocaleString()}`,
      submetric: `${eKhataCustomers.length} debtor accounts`,
    },
    {
      title: 'eKhata Smart Voice Ledger',
      path: '/ekhata',
      tag: 'AI Voice',
      tagColor: 'bg-yellow-200 text-black border-yellow-400',
      description: 'Multilingual Groq AI voice parsing (Hindi, Kannada, Tamil, English), customer #ID tags, and payment logs.',
      icon: BookOpen,
      accent: 'yellow',
      metric: 'Voice Ledger',
      submetric: 'Whisper Groq AI Active',
    },
    {
      title: "Today's Live Income",
      path: '/income',
      tag: 'Daily Revenue',
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'Real-time sales collection tracking across Cash, UPI QR, bank transfers, and daily target progress.',
      icon: ArrowUpRight,
      accent: 'emerald',
      metric: `₹${totalTodayIncome.toLocaleString()}`,
      submetric: `${goalPercentage}% of daily goal`,
    },
    {
      title: 'Monthly Fixed Commitments',
      path: '/fixed-expenses',
      tag: 'Recurring',
      tagColor: 'bg-neutral-100 text-neutral-800 border-neutral-300',
      description: 'Commercial store rent, machinery EMIs, operator salaries, BESCOM electricity, and receipt uploads.',
      icon: CreditCard,
      accent: 'neutral',
      metric: `₹${totalMonthlyFixed.toLocaleString()}`,
      submetric: `${fixedExpenses.length} regular commitments`,
    },
  ];

  return (
    <div className="w-full bg-white text-neutral-900 pb-20 font-['Plus_Jakarta_Sans']">
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
            <Link to="/" className="font-semibold text-neutral-700 hover:text-black transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-black font-bold">Profile & Financial Overview</span>
            <span className="bg-yellow-100 text-yellow-800 font-bold px-2 py-0.5 rounded-full text-[10px] border border-yellow-300">
              Executive Overview & Settings
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setProfileForm(profile);
                setIsEditProfileOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-black bg-yellow-300 hover:bg-yellow-400 border border-yellow-400 transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* ========================================================= */}
        {/* 1. USER PROFILE HEADER CARD                               */}
        {/* ========================================================= */}
        <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 border border-yellow-400/40 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center space-x-5">
              <div className="w-20 h-20 rounded-2xl bg-black text-yellow-300 font-black text-2xl flex items-center justify-center border-2 border-yellow-400 shadow-md">
                {profile.initials || 'VK'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-black text-black font-['Outfit'] tracking-tight">
                    {profile.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-black text-yellow-300 text-[10px] font-bold tracking-wider uppercase">
                    PRO
                  </span>
                </div>
                <p className="text-sm font-semibold text-neutral-700 mt-0.5 flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>{profile.businessName}</span>
                  <span className="text-neutral-400">•</span>
                  <span className="text-neutral-500">{profile.role}</span>
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-neutral-600">
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{profile.phone}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{profile.email}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTempUpi(profile.upiId || 'vikas.kori@okhdfcbank');
                      setIsUpiModalOpen(true);
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
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>KYC Verified</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                to="/ekhata"
                className="gold-button-gradient px-4 py-2.5 rounded-xl text-xs font-black text-black border border-yellow-400 transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>Open eKhata</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. EXECUTIVE OVERVIEW: 4 KEY FINANCIAL METRICS           */}
        {/* ========================================================= */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-black font-['Outfit'] tracking-tight">
                Executive Cash Flow Overview
              </h2>
              <p className="text-xs text-neutral-500">
                High-level operational liquidity radar and commitment summary.
              </p>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>MongoDB Atlas & Groq AI Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Today's Income */}
            <Link
              to="/income"
              className="bg-white rounded-2xl p-5 border border-neutral-200/90 hover:border-emerald-400 hover:shadow-md transition-all group block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-500">
                  Today's Live Income
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-emerald-600 font-['Outfit']">
                  ₹{totalTodayIncome.toLocaleString()}
                </span>
                <div className="flex items-center justify-between text-[11px] mt-1 text-emerald-700 font-semibold">
                  <span>{goalPercentage}% of daily target</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </div>
            </Link>

            {/* KPI 2: Cash Runway */}
            <Link
              to="/#runway"
              className="bg-white rounded-2xl p-5 border border-neutral-200/90 hover:border-amber-400 hover:shadow-md transition-all group block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-500">
                  Predictive Runway
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-black font-['Outfit']">
                  23 Days
                </span>
                <div className="flex items-center justify-between text-[11px] mt-1 text-neutral-500 font-medium">
                  <span>Burn: ₹1,653/day</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </div>
            </Link>

            {/* KPI 3: Upcoming Payables (15d) */}
            <Link
              to="/#payables"
              className="bg-white rounded-2xl p-5 border border-neutral-200/90 hover:border-rose-400 hover:shadow-md transition-all group block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-500">
                  Upcoming Payables (15d)
                </span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-rose-600 font-['Outfit']">
                  ₹{totalUpcoming15.toLocaleString()}
                </span>
                <div className="flex items-center justify-between text-[11px] mt-1 text-neutral-500 font-medium">
                  <span>Fixed + Supplier dues</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </div>
            </Link>

            {/* KPI 4: Cash to Receive (Udhar) */}
            <Link
              to="/#receivables"
              className="bg-white rounded-2xl p-5 border border-neutral-200/90 hover:border-blue-400 hover:shadow-md transition-all group block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-500">
                  Customer Udhar to Collect
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-blue-600 font-['Outfit']">
                  ₹{totalUdhar.toLocaleString()}
                </span>
                <div className="flex items-center justify-between text-[11px] mt-1 text-blue-600 font-semibold">
                  <span>{eKhataCustomers.length} debtor accounts</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. DEDICATED FINANCIAL MODULES LAUNCHPAD                 */}
        {/* ========================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-black font-['Outfit'] tracking-tight">
                Dedicated Financial Modules
              </h2>
              <p className="text-xs text-neutral-500">
                Direct access to all individual financial tools and operating pages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {navigationHubs.map((hub) => {
              const Icon = hub.icon;
              return (
                <Link
                  key={hub.path}
                  to={hub.path}
                  className="bg-white rounded-3xl p-6 border border-neutral-200/80 hover:border-yellow-400 hover:shadow-lg transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center border border-neutral-200 text-black group-hover:bg-yellow-300 group-hover:border-yellow-400 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${hub.tagColor}`}>
                        {hub.tag}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-black font-['Outfit'] group-hover:text-amber-600 transition-colors">
                      {hub.title}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      {hub.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black text-black font-['Outfit'] block">
                        {hub.metric}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium">
                        {hub.submetric}
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-neutral-50 group-hover:bg-black group-hover:text-yellow-300 flex items-center justify-center transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. BUSINESS SETTINGS & GSTIN VERIFICATION                */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div>
              <h2 className="text-lg font-black text-black font-['Outfit']">Business Settings & Verification</h2>
              <p className="text-xs text-neutral-500">Essential tax, banking, and daily goal preferences.</p>
            </div>
            <button
              onClick={() => {
                setProfileForm(profile);
                setIsEditProfileOpen(true);
              }}
              className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
            >
              Modify Details
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">GSTIN Identification</span>
              <span className="font-mono font-bold text-black text-sm block">29AABCK1290P1Z4</span>
              <span className="text-[11px] text-emerald-700 mt-1 block">Active & Verified with GSTN</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Daily Inflow Target Goal</span>
              <span className="font-extrabold text-black text-sm block">₹{(profile.dailyGoal || 20000).toLocaleString()} / day</span>
              <span className="text-[11px] text-neutral-500 mt-1 block">Used for progress velocity tracker</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Primary Settlement Account</span>
              <span className="font-mono font-bold text-black text-sm block">{profile.upiId || 'vikas.kori@okhdfcbank'}</span>
              <span className="text-[11px] text-neutral-500 mt-1 block">Auto-generates Dynamic UPI QR codes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-neutral-200 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-black text-black font-['Outfit']">Edit Merchant Profile</h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-neutral-400 hover:text-black p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-neutral-600 mb-1">Full Operator Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Business / Store Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.businessName}
                  onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Daily Target Goal (₹)</label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={profileForm.dailyGoal || 20000}
                  onChange={(e) => setProfileForm({ ...profileForm, dailyGoal: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-xs font-mono font-bold"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-button-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-black border border-yellow-400 shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit UPI Modal */}
      {isUpiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-neutral-200 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-black text-black font-['Outfit']">Edit Merchant UPI ID</h3>
              <button
                onClick={() => setIsUpiModalOpen(false)}
                className="text-neutral-400 hover:text-black p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpiOnly} className="mt-4 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-neutral-600 mb-1">UPI VPA Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. yourname@okaxis"
                  value={tempUpi}
                  onChange={(e) => setTempUpi(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsUpiModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-button-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-black border border-yellow-400 shadow-sm cursor-pointer"
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
