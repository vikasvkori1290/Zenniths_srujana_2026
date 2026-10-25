import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp,
  Store,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Sparkles,
  Bot,
  Calendar,
  Mic,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coins,
  Layers,
  ChevronRight,
  Lock,
  User,
  Sliders,
  DollarSign,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HowItWorksPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'safe-buffer' | 'low-buffer' | 'ai-advisory' | 'tools'
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState(null);

  const handleLaunchDemo = async () => {
    setDemoError(null);
    setDemoLoading(true);
    const demoEmail = 'nin46642@gmail.com';
    const demoPassword = '123456';
    try {
      const res = await login(demoEmail, demoPassword);
      if (res.success) {
        navigate('/');
      } else {
        setDemoError(res.error || 'Failed to authenticate demo user.');
      }
    } catch (err) {
      setDemoError('Could not log in to demo account. Please check your connection.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-20 selection:bg-amber-300 selection:text-black font-['Plus_Jakarta_Sans']">
      {/* Top Banner Navigation */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate(isAuthenticated ? '/' : '/login')}
              className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-600 hover:text-black cursor-pointer transition-colors flex items-center space-x-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-linear-to-br from-yellow-300 via-amber-400 to-amber-500 flex items-center justify-center shadow-xs">
                <TrendingUp className="w-4 h-4 text-black stroke-[2.5]" />
              </div>
              <span className="text-base font-black tracking-tight text-black font-['Outfit']">
                FIN<span className="text-amber-600">SAFE</span>
              </span>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full ml-1">
                How It Works: Nitish&apos;s Story
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={demoLoading}
                onClick={handleLaunchDemo}
                className="px-4 py-2 rounded-xl bg-linear-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 fill-black" />
                <span>{demoLoading ? 'Launching Demo...' : '1-Click Demo Login'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white border-b border-neutral-200 py-10 sm:py-14 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-200/25 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-4">
            <Store className="w-3.5 h-3.5 text-amber-600" />
            <span>Case Study & Architecture Specification</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight font-['Outfit'] max-w-3xl leading-tight">
            The Story of Nitish Kumar: <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-600 via-yellow-600 to-amber-700">
              Predictive Cash Runway in Action
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-neutral-600 max-w-2xl leading-relaxed">
            See exactly how FinSafe handles daily sales, calculates gross margins, protects stock reserves, and
            intervenes dynamically when an upcoming liability threatens the cash buffer.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                Base Working Cash
              </span>
              <span className="text-2xl sm:text-3xl font-black text-black font-['Outfit']">
                ₹25,000
              </span>
              <p className="text-[11.5px] text-neutral-600 mt-1">
                Liquid capital in his current bank account
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                Daily Sales Target
              </span>
              <span className="text-2xl sm:text-3xl font-black text-black font-['Outfit']">
                ₹20,000
              </span>
              <p className="text-[11.5px] text-neutral-600 mt-1">
                Average counter sales per day
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block mb-1">
                Profit Margin / Day
              </span>
              <span className="text-2xl sm:text-3xl font-black text-black font-['Outfit']">
                30% (₹6,000)
              </span>
              <p className="text-[11.5px] text-neutral-600 mt-1">
                Gross margin after raw materials & milk
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 block mb-1">
                Safety Buffer
              </span>
              <span className="text-2xl sm:text-3xl font-black text-black font-['Outfit']">
                ₹1,500
              </span>
              <p className="text-[11.5px] text-neutral-600 mt-1">
                Non-negotiable operational reserve
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-neutral-200 pb-3 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'overview'
                ? 'bg-black text-yellow-300 shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>1. Nitish & Nivika Sweets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('safe-buffer')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'safe-buffer'
                ? 'bg-black text-yellow-300 shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>2. Normal Safe Days (Khata Rules)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('low-buffer')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'low-buffer'
                ? 'bg-black text-yellow-300 shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>3. Low Buffer Crisis & Dynamic Relief</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai-advisory')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'ai-advisory'
                ? 'bg-black text-yellow-300 shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-white'
            }`}
          >
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>4. 8:00 AM AI Push Notifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'tools'
                ? 'bg-black text-yellow-300 shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>5. Complete Toolset</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="pt-6 space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center font-black text-lg">
                  N
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-black font-['Outfit']">
                    Nitish Kumar • Nivika Sweets & Bakery
                  </h2>
                  <p className="text-xs text-neutral-500 font-medium">
                    Demo Account: <code className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">nin46642@gmail.com</code> • Karnataka, India
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-base text-neutral-700 leading-relaxed mb-6">
                Nitish wakes up at 5:00 AM every day to oversee the preparation of fresh gulab jamuns, pedas, kaju katli,
                and savory snacks. His business brings in roughly <strong>₹20,000 in gross revenue each day</strong>.
                However, running a fresh food business means purchasing milk, mawa, ghee, sugar, and gas cylinders on
                strict supplier credit cycles.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center space-x-2 font-bold text-xs text-neutral-800 mb-2">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>The ₹25,000 Base Cash</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Nitish maintains a base balance of ₹25,000 in his primary current account. This acts as the anchor
                    for FinSafe&apos;s 15-day and 60-day predictive timeline.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center space-x-2 font-bold text-xs text-neutral-800 mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>30% Gross Profit Margin</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Out of every ₹100 earned, ₹70 goes into ingredients (milk, ghee, sugar) and running costs.
                    His net gross profit is ₹30 per ₹100, which equals <strong>₹6,000/day</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center space-x-2 font-bold text-xs text-neutral-800 mb-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>₹1,500 Safety Buffer</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    The absolute red line. If projected cash dips below ₹1,500 on any upcoming day, FinSafe raises an
                    immediate alert because an unexpected gas cylinder or delivery failure could shut the store.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-linear-to-r from-amber-50 to-yellow-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-black">Why standard accounting fails Nitish</h4>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Traditional apps show historical sales, not tomorrow&apos;s liquidity. FinSafe forecasts where his
                    cash will be in 15 days so he never bounces a supplier check.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('safe-buffer')}
                  className="px-4 py-2.5 rounded-xl bg-black text-yellow-300 font-bold text-xs shrink-0 flex items-center space-x-1 cursor-pointer hover:bg-neutral-800"
                >
                  <span>Next: How Khata is Handled</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Safe Buffer Days & Khata */}
        {activeTab === 'safe-buffer' && (
          <div className="pt-6 space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Condition: Account Balance &gt;= ₹1,500 Safety Buffer</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-black font-['Outfit']">
                Normal Safe Days: Preventing Inventory Bankruptcy
              </h2>

              <p className="text-sm sm:text-base text-neutral-700 leading-relaxed mt-2 mb-6">
                Caterers and local sweet lovers frequently purchase bulk festival boxes on credit (Khata / Udhar).
                Today, a customer pays back <strong className="text-black font-semibold">₹10,000</strong> via UPI.
                Here is how FinSafe treats that money differently from every other app:
              </p>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-rose-50/60 border border-rose-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Ordinary Khata & Accounting Apps
                    </span>
                    <span className="text-[10px] bg-rose-200/80 text-rose-900 font-bold px-2 py-0.5 rounded">
                      Dangerous
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-rose-200 text-sm font-bold text-rose-950 font-mono">
                    Cash Credited: +₹10,000 (Full Amount)
                  </div>
                  <p className="text-xs text-rose-900 leading-relaxed">
                    The app tells Nitish his spendable cash jumped by ₹10,000. Believing he has surplus profits, he
                    takes a personal drawing. Two days later, his mawa supplier arrives for ₹7,000 payment and Nitish
                    has no money left to restock!
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-emerald-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      FinSafe Stock-Reserve Algorithm
                    </span>
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded">
                      Safe & Sustainable
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 text-sm font-bold text-emerald-950 font-mono flex items-center justify-between">
                    <span>Spendable Profit: +₹3,000 (30%)</span>
                    <span className="text-[11px] text-emerald-700 font-normal">Stock Ring-Fenced: ₹7,000</span>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Because Nitish&apos;s runway is safely above the ₹1,500 buffer, FinSafe credits{' '}
                    <strong>only the 30% profit margin (+₹3,000)</strong> to his spendable cash curve.
                    The remaining 70% (₹7,000) is automatically ring-fenced for ingredient replenishment with{' '}
                    <strong>NO future restock deductions scheduled</strong>!
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-neutral-700">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Summary Rule:</strong> When Buffer is safe, customer collections only count for profit,
                    safeguarding the business from inventory starvation.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('low-buffer')}
                  className="px-4 py-2 rounded-xl bg-black text-yellow-300 font-bold text-xs shrink-0 flex items-center space-x-1 cursor-pointer hover:bg-neutral-800"
                >
                  <span>Next: Low Buffer Crisis</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Low Buffer Days */}
        {activeTab === 'low-buffer' && (
          <div className="pt-6 space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold mb-3">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>Condition: Projected Balance &lt; ₹1,500 Safety Buffer</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-black font-['Outfit']">
                What If Nitish Faces a Low Buffer Day?
              </h2>

              <p className="text-sm sm:text-base text-neutral-700 leading-relaxed mt-2 mb-6">
                Suppose one Thursday, Nitish faces a massive dairy supplier invoice of{' '}
                <strong className="text-black font-semibold">₹28,000</strong> due tomorrow. His current bank balance
                would drop to <strong className="text-rose-600 font-bold">₹500</strong>, severely breaching his{' '}
                <strong className="text-purple-700 font-bold">₹1,500 Safety Buffer</strong> (a ₹1,000 shortfall!).
              </p>

              {/* The 3-Step Dynamic Intervention */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold text-xs mb-3 shadow-2xs">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-black mb-1">Dynamic Khata Relief</h4>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    FinSafe detects the ₹1,000 breach. Instead of withholding the 70% stock portion, it temporarily
                    credits the <strong>FULL ₹10,000 Khata collection</strong> into liquid runway to cover the milk
                    invoice and protect the buffer.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-300">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs mb-3 shadow-2xs">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-black mb-1">Smart Restock Rescheduling</h4>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    The ₹7,000 stock deduction is safely deferred to Day 6 or Day 7, when future weekend sales recover
                    the account safely above ₹1,500. No supplier bill bounces.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-300">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-xs mb-3 shadow-2xs">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-black mb-1">Visual Risk Indicator</h4>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    In the 15-day timeline, marker colors switch from yellow to <strong>RED</strong> with an explicit
                    badge: <span className="bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">Arrange ₹1,000</span>.
                  </p>
                </div>
              </div>

              {/* Interactive Timeline Mockup */}
              <div className="mt-6 p-4 rounded-2xl bg-neutral-900 text-white">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-bold text-yellow-300 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    Timeline Simulation (Tomorrow: Day 2)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                    Risk Detected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700">
                    <span className="text-neutral-400 block text-[10px]">Balance Before Due</span>
                    <span className="text-base font-bold text-white">₹28,500</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700">
                    <span className="text-neutral-400 block text-[10px]">Due Tomorrow (Milk)</span>
                    <span className="text-base font-bold text-rose-400">-₹28,000</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-800 border border-rose-500/50">
                    <span className="text-neutral-400 block text-[10px]">After Due vs Buffer (₹1,500)</span>
                    <span className="text-base font-bold text-rose-300">₹500 (Gap: ₹1,000)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('ai-advisory')}
                  className="px-4 py-2 rounded-xl bg-black text-yellow-300 font-bold text-xs shrink-0 flex items-center space-x-1 cursor-pointer hover:bg-neutral-800"
                >
                  <span>Next: 8:00 AM AI Alerts</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: AI Push Notification */}
        {activeTab === 'ai-advisory' && (
          <div className="pt-6 space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold mb-3">
                <Bot className="w-3.5 h-3.5 text-indigo-600" />
                <span>NVIDIA NIM & Groq AI Engine</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-black font-['Outfit']">
                Autonomous 8:00 AM Push Notifications
              </h2>

              <p className="text-sm sm:text-base text-neutral-700 leading-relaxed mt-2 mb-6">
                Nitish doesn&apos;t have time to stare at financial graphs while making sweets. Every morning at{' '}
                <strong>8:00 AM</strong>, FinSafe evaluates tomorrow&apos;s bills against his runway.
                If a shortfall is detected, it generates an instant recovery strategy.
              </p>

              {/* Mobile Notification Mockup */}
              <div className="max-w-xl mx-auto p-4 sm:p-5 rounded-3xl bg-neutral-900 text-white shadow-xl border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-neutral-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-yellow-300 text-black flex items-center justify-center font-bold text-xs">
                      FS
                    </div>
                    <span className="font-bold text-yellow-300">FinSafe Morning Alert</span>
                    <span className="text-[10px] text-neutral-400">• Just now</span>
                  </div>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                    Action Required
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    ⚠️ Bill Due Tomorrow: ₹28,000 (Shortfall: ₹1,000)
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed font-sans pt-1">
                    Your projected balance will drop to ₹500, dipping below your ₹1,500 safety buffer.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-800/80 border border-neutral-700 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-yellow-300 font-bold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 fill-yellow-300" />
                      AI Arrangement Plan (0.4s Groq LPU)
                    </span>
                    <span className="text-neutral-400">Step-by-Step</span>
                  </div>
                  <ul className="text-xs text-neutral-200 space-y-1.5 list-disc list-inside">
                    <li>
                      <strong>Call Customer Ramesh:</strong> ₹4,000 pending Khata is due today. Recovering this fully clears your gap.
                    </li>
                    <li>
                      <strong>Split Milk Invoice:</strong> Pay ₹20,000 tomorrow and schedule the remaining ₹8,000 for Saturday when counter sales peak.
                    </li>
                    <li>
                      <strong>Defer Restock:</strong> Supplier packaging delivery (₹3,000) can be postponed by 4 days without affecting store operations.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('tools')}
                  className="px-4 py-2 rounded-xl bg-black text-yellow-300 font-bold text-xs shrink-0 flex items-center space-x-1 cursor-pointer hover:bg-neutral-800"
                >
                  <span>Next: Complete Toolset</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Complete Toolset */}
        {activeTab === 'tools' && (
          <div className="pt-6 space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Feature Tour</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-black font-['Outfit']">
                Everything FinSafe Was Built To Do
              </h2>

              <p className="text-sm sm:text-base text-neutral-700 leading-relaxed mt-2 mb-6">
                Designed specifically for local Indian retail merchants who need intuitive, zero-overhead financial
                protection without complex bookkeeping jargon.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-black">Multilingual Hands-Free Voice Ledger</h4>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      Speak naturally in Hindi, Kannada, Telugu, or English (&quot;दूध वाले को 2000 दिया&quot;).
                      The ledger records it instantly so Nitish never touches sticky screens with mawa on his hands.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-black">15-Day Predictive Runway</h4>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      Color-coded daily trajectory (Green/Yellow/Red) showing exact bank balance, planned dues,
                      and how much spare cash is actually safe to spend.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-black">Smart Restock & Bill Calendar</h4>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      Visual calendar showing which dates have heavy supplier liabilities and which dates are safest
                      for major ingredient purchases.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center shrink-0">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-black">What-If Scenario Simulator</h4>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      Simulate financial decisions beforehand (&quot;What if sales drop 20% during rain?&quot; or
                      &quot;Can I buy a new display counter this week?&quot;).
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom CTA Card */}
              <div className="mt-8 p-6 rounded-3xl bg-linear-to-r from-amber-500 via-yellow-400 to-amber-500 text-black shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black font-['Outfit']">Experience It Live Right Now</h3>
                  <p className="text-xs font-medium text-neutral-900 mt-1">
                    Log in as Nitish Kumar with 1 click to test the voice ledger, cash curve, and live predictions.
                  </p>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <button
                    type="button"
                    disabled={demoLoading}
                    onClick={handleLaunchDemo}
                    className="px-5 py-3 rounded-2xl bg-black hover:bg-neutral-800 text-yellow-300 font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 fill-yellow-300" />
                    <span>{demoLoading ? 'Logging in...' : 'Launch Demo Account'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(isAuthenticated ? '/' : '/login')}
                    className="px-4 py-3 rounded-2xl bg-white/90 hover:bg-white text-black font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    {isAuthenticated ? 'Go to Dashboard' : 'Back to Login'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
