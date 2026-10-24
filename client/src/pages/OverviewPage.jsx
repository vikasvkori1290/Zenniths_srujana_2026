import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  CreditCard,
  Wallet,
  Clock,
  ArrowRight,
  BookOpen,
  Calendar,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFixedExpensesDueWithin15Days } from '../services/expenseSync';

export default function OverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load live data from localStorage / synced stores
  const [profile] = useState(() => {
    const saved = localStorage.getItem('aurum_profile_info');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      name: user?.name || 'Vikas Kori',
      businessName: user?.businessName || 'Zenniths Enterprise',
      dailyGoal: 20000,
    };
  });

  const [todayIncome] = useState(() => {
    const saved = localStorage.getItem('aurum_today_income');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: '1', amount: 8400 },
      { id: '2', amount: 6250 },
      { id: '3', amount: 420 },
      { id: '4', amount: 3380 },
    ];
  });

  const [fixedExpenses] = useState(() => {
    const saved = localStorage.getItem('aurum_fixed_expenses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: '1', amount: 22000, dueDay: 5 },
      { id: '2', amount: 14500, dueDay: 10 },
      { id: '3', amount: 4800, dueDay: 18 },
      { id: '4', amount: 6500, dueDay: 7 },
      { id: '5', amount: 1800, dueDay: 22 },
    ];
  });

  const [upcomingExpenses] = useState(() => {
    const saved = localStorage.getItem('aurum_upcoming_expenses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: '1', amount: 12500 },
      { id: '2', amount: 7800 },
      { id: '3', amount: 3200 },
      { id: '4', amount: 2450 },
    ];
  });

  const [eKhataCustomers] = useState(() => {
    const saved = localStorage.getItem('aurum_ekhata_customers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'c1', totalAmount: 4200 },
      { id: 'c2', totalAmount: 1850 },
      { id: 'c3', totalAmount: 6400 },
      { id: 'c4', totalAmount: 950 },
      { id: 'c5', totalAmount: 7700 },
    ];
  });

  const totalIncome = todayIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalFixed = fixedExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const fixedDue15 = getFixedExpensesDueWithin15Days(fixedExpenses);
  const totalUpcoming15 =
    upcomingExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) +
    fixedDue15.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalUdhar = eKhataCustomers.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
  const goalPercent = Math.min(Math.round((totalIncome / (profile.dailyGoal || 20000)) * 100), 100);

  // Core navigation modules
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
      submetric: `${upcomingExpenses.length + fixedDue15.length} dues scheduled`,
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
      metric: `₹${totalIncome.toLocaleString()}`,
      submetric: `${goalPercent}% of daily goal`,
    },
    {
      title: 'Monthly Fixed Commitments',
      path: '/fixed-expenses',
      tag: 'Recurring',
      tagColor: 'bg-neutral-100 text-neutral-800 border-neutral-300',
      description: 'Commercial store rent, machinery EMIs, operator salaries, BESCOM electricity, and receipt uploads.',
      icon: CreditCard,
      accent: 'neutral',
      metric: `₹${totalFixed.toLocaleString()}`,
      submetric: `${fixedExpenses.length} regular commitments`,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-['Plus_Jakarta_Sans']">
      {/* Top Welcome / Header Banner */}
      <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 border border-yellow-400/40 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                Executive Cash Flow Hub
              </span>
              <span className="text-xs font-semibold text-neutral-500">•</span>
              <span className="text-xs font-semibold text-neutral-600 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>MongoDB Atlas & Groq AI Connected</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-black font-['Outfit'] mt-2 tracking-tight">
              Welcome back, {user?.name || profile.name}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-xl">
              Real-time predictive liquidity radar for{' '}
              <strong className="text-black">{user?.businessName || profile.businessName}</strong>. 
              Navigate to any dedicated financial module below.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/profile"
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-700 bg-white border border-neutral-200 hover:border-yellow-400 hover:text-black transition-all flex items-center space-x-1.5 shadow-2xs"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Merchant Profile</span>
            </Link>
            <Link
              to="/ekhata"
              className="gold-button-gradient px-4 py-2 rounded-xl text-xs font-black text-black border border-yellow-400 transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span>Open eKhata</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Main Summary KPI Cards */}
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
              ₹{totalIncome.toLocaleString()}
            </span>
            <div className="flex items-center justify-between text-[11px] mt-1 text-emerald-700 font-semibold">
              <span>{goalPercent}% of daily target</span>
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
              <span>{eKhataCustomers.length} customer debts</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Dedicated Pages Launchpad Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-black font-['Outfit'] tracking-tight">
              Dedicated Financial Modules
            </h2>
            <p className="text-xs text-neutral-500">
              Click any module to open its dedicated page with deep analytics, forms, and workflows.
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
    </div>
  );
}
