import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Mic,
  Bot,
  Zap,
  Store,
  Layers,
  ChevronRight,
  Clock,
  Coins,
} from 'lucide-react';

export default function HowItWorksStoryModal({ isOpen, onClose, onDemoLogin, demoLoading }) {
  const [currentChapter, setCurrentChapter] = useState(0);

  if (!isOpen) return null;

  const chapters = [
    {
      id: 'profile',
      badge: 'Chapter 1: The Merchant Profile',
      title: 'Meet Nitish Kumar & Nivika Sweets',
      subtitle: 'Understanding the baseline financial numbers that keep the sweet shop running.',
      icon: Store,
      iconColor: 'text-amber-500 bg-amber-50 border-amber-200',
      content: (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            <strong className="text-black font-semibold">Nitish Kumar</strong> operates{' '}
            <strong className="text-amber-700 font-semibold">Nivika Sweets & Bakery</strong>, a busy retail
            sweet shop in Karnataka. Every morning at 6:00 AM, fresh milk, mawa, and dry fruits arrive for daily
            preparation.
          </p>

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-0.5">
                Base Working Cash
              </span>
              <span className="text-base sm:text-lg font-black text-black font-['Outfit']">
                ₹25,000
              </span>
              <p className="text-[10.5px] text-neutral-500 mt-0.5">
                Minimum liquid capital in his current bank account
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-0.5">
                Daily Sales Target
              </span>
              <span className="text-base sm:text-lg font-black text-black font-['Outfit']">
                ₹20,000
              </span>
              <p className="text-[10.5px] text-neutral-500 mt-0.5">
                Counter sales from sweets, savories & snacks
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-0.5">
                Profit Margin / Day
              </span>
              <span className="text-base sm:text-lg font-black text-black font-['Outfit']">
                30% (₹6,000)
              </span>
              <p className="text-[10.5px] text-neutral-500 mt-0.5">
                ₹6,000 gross profit per day after direct ingredient costs
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block mb-0.5">
                Safety Buffer
              </span>
              <span className="text-base sm:text-lg font-black text-black font-['Outfit']">
                ₹1,500
              </span>
              <p className="text-[10.5px] text-neutral-500 mt-0.5">
                Non-negotiable cash cushion so operations never stall
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>The Problem:</strong> Like 85% of small business owners, Nitish struggles to know if money in
              his account is safe to spend or if it belongs to tomorrow&apos;s supplier delivery.
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'normal-khata',
      badge: 'Chapter 2: The Khata (Credit) Dilemma',
      title: 'Normal Safe Days: Smart Stock Protection',
      subtitle: 'Why spending all customer Khata collections causes sudden inventory bankruptcies.',
      icon: ShieldCheck,
      iconColor: 'text-emerald-500 bg-emerald-50 border-emerald-200',
      content: (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Local caterers and sweet lovers take festival orders on credit (Khata). Today, a caterer settles{' '}
            <strong className="text-black font-semibold">₹10,000</strong> of past dues via UPI.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Ordinary Accounting Apps</span>
              </div>
              <p className="text-[11.5px] text-rose-950">
                They add the full <strong>+₹10,000</strong> straight to cash. Nitish thinks he has plenty of spare cash,
                takes a personal drawing, and 2 days later has no money left to purchase sugar and dry fruits!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>FinSafe Intelligent Engine</span>
              </div>
              <p className="text-[11.5px] text-emerald-950">
                FinSafe recognizes his 30% margin: only <strong>+₹3,000</strong> is added to spendable runway.
                The remaining <strong>₹7,000</strong> is automatically preserved for stock replenishment with zero
                future surprises!
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900 flex items-center justify-between">
            <span className="font-semibold">When Buffer is Safe (≥ ₹1,500):</span>
            <span className="font-bold bg-white px-2 py-0.5 rounded-lg border border-amber-300 text-[11px]">
              Only Gross Margin (+30%) Credited to Spendable Curve
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'low-buffer',
      badge: 'Chapter 3: The Crisis on Low Buffer Days',
      title: 'What Happens When Cash Dips Below Buffer?',
      subtitle: 'Dynamic Khata relief & instant shortfall protection in real time.',
      icon: ShieldAlert,
      iconColor: 'text-rose-500 bg-rose-50 border-rose-200',
      content: (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            One Thursday, Nitish faces a bulk raw milk invoice of{' '}
            <strong className="text-black font-semibold">₹28,000</strong> due tomorrow. His bank balance would drop
            to just <strong className="text-rose-600">₹500</strong>, severely breaching his{' '}
            <strong className="text-purple-700">₹1,500 Safety Buffer</strong> (a ₹1,000 shortfall!).
          </p>

          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Low Buffer Warning Triggered!
              </span>
              <span className="px-2 py-0.5 bg-rose-600 text-white font-bold rounded-lg text-[10px]">
                Arrange ₹1,000
              </span>
            </div>
            <p className="text-[11.5px] text-rose-900">
              The 15-day timeline marker turns <strong>RED</strong>. FinSafe knows that if Nitish defaults on the milk
              supplier, the sweet shop cannot open the next morning.
            </p>
          </div>

          {/* FinSafe dynamic intervention */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
              How FinSafe Solves The Crisis:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                <span className="text-xs font-bold text-black flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  1. Dynamic Khata Buffer Relief
                </span>
                <p className="text-[11px] text-neutral-600">
                  Because buffer is breached, FinSafe temporarily calculates the <strong>full ₹10,000</strong> Khata
                  amount into liquid runway to cover the milk invoice and protect the buffer.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                <span className="text-xs font-bold text-black flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  2. Smart Restock Rescheduling
                </span>
                <p className="text-[11px] text-neutral-600">
                  The ₹7,000 stock deduction is safely postponed to Day 6 or 7, when future weekend sales recover the
                  account safely above ₹1,500.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'ai-notifications',
      badge: 'Chapter 4: AI Advisor & Morning Push Alerts',
      title: 'Autonomous Shortfall Guidance Before 8:00 AM',
      subtitle: 'NVIDIA NIM & Groq AI generate an exact action plan so he never scrambles.',
      icon: Bot,
      iconColor: 'text-indigo-500 bg-indigo-50 border-indigo-200',
      content: (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Nitish doesn&apos;t have to stare at spreadsheets. Every morning at{' '}
            <strong className="text-black font-semibold">8:00 AM</strong>, FinSafe evaluates tomorrow&apos;s dues and
            fires a mobile push notification.
          </p>

          <div className="p-3.5 rounded-2xl bg-neutral-900 text-white space-y-2 border border-neutral-800 shadow-md">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-bold text-yellow-300">
                <Bot className="w-4 h-4 text-yellow-300" />
                AI Cash Shortfall Advisory
              </span>
              <span className="text-[10px] text-neutral-400">Powered by Groq & NVIDIA</span>
            </div>
            <p className="text-xs text-neutral-200 italic leading-relaxed">
              &quot;Nitish, you have a ₹28,000 milk invoice due tomorrow with a ₹1,000 shortfall against your ₹1,500
              buffer. <strong>Recommended Action:</strong> Call Ramesh Caterer who has ₹4,000 pending Khata due today,
              or split supplier payment into ₹20,000 tomorrow and ₹8,000 on Saturday.&quot;
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <span className="text-[11px] font-bold text-neutral-800 block">24h Advance</span>
              <span className="text-[10px] text-neutral-500">Notifies day before due</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
              <Coins className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span className="text-[11px] font-bold text-neutral-800 block">Khata Priority</span>
              <span className="text-[10px] text-neutral-500">Targets easiest debt to collect</span>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
              <Zap className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <span className="text-[11px] font-bold text-neutral-800 block">0.4s Groq LPU</span>
              <span className="text-[10px] text-neutral-500">Instant AI generation</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'app-tour',
      badge: 'Chapter 5: Full Suite of Merchant Tools',
      title: 'Everything FinSafe Was Built To Do',
      subtitle: 'From hands-free voice logging to interactive 15-day financial simulations.',
      icon: Sparkles,
      iconColor: 'text-amber-500 bg-amber-50 border-amber-200',
      content: (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            FinSafe was specifically engineered around how local Indian merchants actually operate on the ground:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-black">Voice Ledger (Multilingual)</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Speak in Hindi, Kannada, Telugu, or English (&quot;दूध वाले को 2000 दिया&quot;). The ledger logs it
                  instantly hands-free while serving sweets.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-black">15-Day Predictive Runway</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Live color-coded curve (Green/Yellow/Red) showing exact account trajectory with safety buffer lines.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-black">Restock & Bill Calendar</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Visual calendar indicating which days are safe for inventory purchases and which have high supplier
                  obligations.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 mt-0.5">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-black">What-If Scenario Simulator</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Test decisions (&quot;Can I buy a new ₹20,000 display freezer this Tuesday?&quot;) before committing
                  real capital.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-linear-to-r from-amber-500 via-yellow-400 to-amber-500 text-black shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">Ready to Experience It?</span>
              <p className="text-[11px] font-medium text-neutral-900">
                Log in right now as Nitish Kumar with 1 click to test all live predictions.
              </p>
            </div>
            {onDemoLogin && (
              <button
                type="button"
                disabled={demoLoading}
                onClick={() => {
                  onClose();
                  onDemoLogin();
                }}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-xs shrink-0 shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 fill-yellow-300" />
                <span>{demoLoading ? 'Logging In...' : 'Launch Demo'}</span>
              </button>
            )}
          </div>
        </div>
      ),
    },
  ];

  const active = chapters[currentChapter];
  const IconComponent = active.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Decorative accent */}
        <div className="h-1.5 w-full bg-linear-to-r from-amber-400 via-yellow-300 to-amber-500" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${active.iconColor}`}>
              <IconComponent className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {active.badge}
                </span>
                <span className="text-[10px] text-neutral-400 font-bold">
                  {currentChapter + 1} of {chapters.length}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-black font-['Outfit'] tracking-tight mt-0.5">
                {active.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-black cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chapter Tabs / Progress Pill Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-1 border-b border-neutral-100 bg-neutral-50/50 flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
          {chapters.map((ch, idx) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setCurrentChapter(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center space-x-1.5 ${
                currentChapter === idx
                  ? 'bg-black text-yellow-300 shadow-xs'
                  : 'text-neutral-500 hover:text-black hover:bg-white'
              }`}
            >
              <span>{idx + 1}.</span>
              <span className="hidden sm:inline">{ch.title.split(':')[0]}</span>
              <span className="sm:hidden">{ch.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-xs font-medium text-neutral-500 -mt-1">{active.subtitle}</p>
          {active.content}
        </div>

        {/* Modal Footer Navigation */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
          <button
            type="button"
            disabled={currentChapter === 0}
            onClick={() => setCurrentChapter((prev) => Math.max(0, prev - 1))}
            className="px-3.5 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-1.5">
            {chapters.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  currentChapter === i ? 'w-6 bg-amber-500' : 'w-2 bg-neutral-300'
                }`}
              />
            ))}
          </div>

          {currentChapter < chapters.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentChapter((prev) => Math.min(chapters.length - 1, prev + 1))}
              className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-xs cursor-pointer flex items-center space-x-1 shadow-xs"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : onDemoLogin ? (
            <button
              type="button"
              disabled={demoLoading}
              onClick={() => {
                onClose();
                onDemoLogin();
              }}
              className="px-4 py-2 rounded-xl bg-linear-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-extrabold text-xs cursor-pointer flex items-center space-x-1.5 shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>{demoLoading ? 'Logging In...' : 'Log In As Nitish'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-xs cursor-pointer"
            >
              Got It!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
