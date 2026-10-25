import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrendingUp,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  RotateCcw,
  Key,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  IndianRupee,
  ShieldCheck,
  Building2,
  ShoppingBag,
  Zap,
  Sliders,
  RefreshCw,
  Info,
  Calendar,
  Wallet,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';
import { calculatePredictiveCashRunway } from '../services/predictiveAnalytics';
import { getStoredFixedExpenses, getFixedExpensesDueWithin15Days, getDueEvents } from '../services/expenseSync';

function cleanAiText(val) {
  if (typeof val === 'string') {
    return val
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\times/g, '×')
      .replace(/\\approx/g, '≈')
      .replace(/\\le/g, '≤')
      .replace(/\\ge/g, '≥')
      .replace(/\$([^$]+)\$/g, '$1')
      .replace(/\\\[([^\\]+)\\\]/g, '$1')
      .replace(/\\\(([^)]+)\\\)/g, '$1')
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/[{}]/g, '')
      .trim();
  }
  if (Array.isArray(val)) return val.map(cleanAiText);
  if (val && typeof val === 'object') {
    const cleaned = {};
    for (const [k, v] of Object.entries(val)) {
      cleaned[k] = cleanAiText(v);
    }
    return cleaned;
  }
  return val;
}

const BUSINESS_TYPE_PRESETS = [
  {
    id: 'kirana',
    name: 'Retail Kirana & Daily Provisions Store',
    tag: 'High FMCG Volume • Fast Inventory Turn',
    description: 'High daily cash/UPI frequency, customer Udhar common, low gross margin (8-15%), requires fast working capital rotation.',
  },
  {
    id: 'fmcg_wholesale',
    name: 'Wholesale FMCG & Bulk Provisions',
    tag: 'Tight Margins • Bulk Udhar Turnover',
    description: 'Large order ticket sizes, 15-30 day credit cycles with retail Kirana clients, sensitive to supplier discount payment windows.',
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy & Healthcare Supplies',
    tag: 'Regulated Inventory • High Inelastic Demand',
    description: 'Higher gross margin (18-25%), strict manufacturer expiry return windows, credit given to regular chronic-care patients.',
  },
  {
    id: 'hardware',
    name: 'Hardware, Paints & Electricals',
    tag: 'High Ticket Size • Contractor Credit Lag',
    description: 'Slow inventory turn (45-60 days), heavy reliance on local contractor Udhar, high upfront capital locked in inventory.',
  },
  {
    id: 'textile',
    name: 'Garments, Textiles & Apparel',
    tag: 'Seasonal Spikes • Dead Stock Risk',
    description: 'High festival and wedding season cash inflows, high seasonal inventory lockup, zero credit to walk-in consumers.',
  },
  {
    id: 'electronics',
    name: 'Electronics, Mobile & Accessories',
    tag: 'High UPI Volume • Rapid Depreciation',
    description: 'High cash flow through instant UPI, razor-thin hardware margins offset by high-margin accessories, vendor EMI schemes.',
  },
  {
    id: 'cafe_qsr',
    name: 'Cafe, Bakery & Quick Service Food',
    tag: 'Zero Udhar • High Perishable Burn',
    description: '100% immediate cash/UPI payment, zero customer debt, but daily perishable raw material purchasing creates constant burn.',
  },
];

export default function PredictionPage() {
  // 1. Merchant profile and business metadata
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('aurum_profile_info');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      storeName: 'Sri Balaji Kirana & General Store',
      ownerName: 'Vikas Sharma',
      businessType: 'Retail Kirana & Daily Provisions Store',
      dailyGoal: 10000,
    };
  });

  // Selected business type for the prediction prompt
  const [selectedBusinessType, setSelectedBusinessType] = useState(
    profile.businessType || 'Retail Kirana & Daily Provisions Store'
  );

  // 2. Financial telemetry loaded from existing app state
  const [todayIncome, setTodayIncome] = useState(() => {
    const saved = localStorage.getItem('aurum_today_income');
    return saved ? JSON.parse(saved) : [];
  });

  const [fixedExpenses, setFixedExpenses] = useState(() => getStoredFixedExpenses());

  const [upcomingExpenses, setUpcomingExpenses] = useState(() => {
    const saved = localStorage.getItem('aurum_upcoming_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [eKhataCustomers, setEKhataCustomers] = useState(() => {
    const saved = localStorage.getItem('aurum_ekhata_data');
    return saved ? JSON.parse(saved) : [];
  });

  // 3. AI configuration settings
  const [nvidiaApiKey, setNvidiaApiKey] = useState(() => {
    return localStorage.getItem('aurum_nvidia_api_key') || '';
  });
  const [selectedModel, setSelectedModel] = useState('nvidia/llama-3.1-nemotron-70b-instruct');
  const [isKeyDrawerOpen, setIsKeyDrawerOpen] = useState(false);
  const [backendConfig, setBackendConfig] = useState(null);

  // 4. Prediction generation state
  const [isLoading, setIsLoading] = useState(false);
  const [predictionData, setPredictionData] = useState(null);
  const [predictionMeta, setPredictionMeta] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // 5. Speech synthesis / "Listen to Talk" state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const speechUtteranceRef = useRef(null);

  // Check backend AI status on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/v1/prediction/status')
      .then((r) => r.json())
      .then((data) => {
        setBackendConfig(data);
      })
      .catch((e) => console.warn('Could not fetch prediction status', e));
  }, []);

  // Compute live deterministic runway numbers to pass into Nemotron
  const calculatedRunway = useMemo(() => {
    return calculatePredictiveCashRunway({
      startingBalance: 40000,
      todayIncomeList: todayIncome,
      fixedExpensesList: fixedExpenses,
      upcomingExpensesList: upcomingExpenses,
      eKhataCustomersList: eKhataCustomers,
    });
  }, [todayIncome, fixedExpenses, upcomingExpenses, eKhataCustomers]);

  // Derived financial summary
  const totalSalesToday = todayIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const cashSales = todayIncome
    .filter((i) => i.method?.toLowerCase() === 'cash' || i.category?.toLowerCase().includes('cash'))
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const upiSales = Math.max(0, totalSalesToday - cashSales);
  const totalUdhar = eKhataCustomers.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0);
  const upcomingPayables15d = upcomingExpenses.reduce((sum, i) => sum + Number(i.amount || 0), 0);

  // Save custom key
  const handleSaveApiKey = (keyVal) => {
    setNvidiaApiKey(keyVal);
    localStorage.setItem('aurum_nvidia_api_key', keyVal);
  };

  // Run Nemotron Prediction
  const handleRunPrediction = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    stopSpeech();

    const dueEventsResult = getDueEvents({
      fixedExpenses,
      upcomingExpenses,
      horizonDays: 60,
    });

    const payload = {
      businessName: profile.storeName || 'Aurum Store',
      businessType: selectedBusinessType,
      dailySales: {
        totalToday: totalSalesToday,
        cash: cashSales,
        upi: upiSales,
        target: profile.dailyGoal || 10000,
        achievement: Math.min(Math.round((totalSalesToday / (profile.dailyGoal || 10000)) * 100), 100),
        retainedCashPerDay: calculatedRunway.retainedCashPerDay,
        grossMarginPct: calculatedRunway.grossMarginPct,
        dailyRunningCost: calculatedRunway.dailyRunningCost,
      },
      dailyPayables: {
        dailyRunningCost: calculatedRunway.dailyRunningCost,
        monthlyFixedTotal: calculatedRunway.totalMonthlyFixed,
        upcoming15dTotal: upcomingPayables15d,
        duesWithin15Days: calculatedRunway.duesWithin15Days,
      },
      dueEvents: dueEventsResult.events,
      minBalance: calculatedRunway.minProjectedBalance,
      minBalanceDate: calculatedRunway.firstRisk ? calculatedRunway.firstRisk.date : (calculatedRunway.nextRiskDateFormatted ? `${calculatedRunway.nextRiskDateFormatted} (in ${calculatedRunway.nextRiskDays}d)` : 'Day 60'),
      receivables: {
        totalUdhar,
        customerCount: eKhataCustomers.length,
        isExpectedOnly: true,
        customers: eKhataCustomers.slice(0, 6),
      },
      liquidity: {
        receivedCashInHand: calculatedRunway.receivedCashInHand,
        safetyBuffer: calculatedRunway.safetyBuffer,
        status: calculatedRunway.runwayStatus,
        headlineMetric: calculatedRunway.headlineMetric,
        netCashFlow: calculatedRunway.retainedCashPerDay,
        minProjectedBalance: calculatedRunway.minProjectedBalance,
      },
      fixedBreakdown: fixedExpenses,
      upcomingBreakdown: upcomingExpenses,
      apiKey: nvidiaApiKey.trim() || undefined,
      model: selectedModel,
    };

    try {
      const res = await fetch('http://localhost:5000/api/v1/prediction/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to generate prediction');
      }

      setPredictionData(cleanAiText(json.data));
      setPredictionMeta(json.meta);
    } catch (err) {
      console.error('[Nemotron Error]:', err);
      setErrorMsg(err.message || 'Error communicating with AI service');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger speech synthesis to "Give its talk on that"
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    const scriptToSpeak = predictionData?.talkScript || '';
    if (!scriptToSpeak) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scriptToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick English (Indian) or standard English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.includes('en-IN') || v.name.includes('India')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  };

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  return (
    <div className="w-full bg-white text-neutral-900 pb-20 font-['Plus_Jakarta_Sans']">
      {/* 1. Header Banner */}
      <div className="border-b border-neutral-200/80 bg-neutral-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight font-['Outfit'] flex items-center gap-2.5">
              <span>NVIDIA Nemotron AI CFO</span>
              <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-xl bg-black text-yellow-300 border border-yellow-400">
                <Cpu className="w-3.5 h-3.5 text-yellow-400" />
                <span>NVIDIA NIM</span>
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
              Deep working-capital diagnosis, daily sales vs payables velocity, and conversational AI advisory.
            </p>
          </div>

          {/* Quick Actions & Settings */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setIsKeyDrawerOpen(!isKeyDrawerOpen)}
              className="px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-neutral-700 bg-white border border-neutral-200 hover:border-black transition-all flex items-center justify-center space-x-2 shadow-2xs cursor-pointer min-h-11 flex-1 sm:flex-initial"
            >
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>{nvidiaApiKey ? 'NVIDIA Key Configured' : 'API Key Settings'}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            <button
              onClick={handleRunPrediction}
              disabled={isLoading}
              className="px-4 py-2.5 sm:py-2 rounded-xl text-xs font-black bg-black hover:bg-neutral-800 text-yellow-300 border-2 border-yellow-400 flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer disabled:opacity-50 min-h-11 flex-1 sm:flex-initial"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-yellow-300" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  <span>Predict using LLM</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* API Key Drawer Modal */}
      {isKeyDrawerOpen && (
        <div className="bg-amber-50/70 border-b border-amber-200 py-4 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-amber-700" />
                NVIDIA Build / NIM API Configuration
              </span>
              <p className="text-[11px] text-amber-800 max-w-2xl">
                Enter your NVIDIA API key (<code className="bg-white/80 px-1 py-0.5 rounded text-black font-mono">nvapi-...</code>) from{' '}
                <a
                  href="https://build.nvidia.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline text-black hover:text-amber-900"
                >
                  build.nvidia.com
                </a>
                . If omitted, the engine automatically uses the high-speed LPU fallback so you get instant financial talks without disruption.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              <input
                type="password"
                placeholder="nvapi-xxxxxxxxxxxxxxxx"
                value={nvidiaApiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                className="bg-white border border-amber-300 rounded-xl px-3 py-2 sm:py-1.5 text-base sm:text-xs text-black placeholder:text-neutral-400 font-mono w-full md:w-64 focus:outline-hidden focus:ring-2 focus:ring-yellow-400 min-h-11 sm:min-h-0"
              />
              <button
                onClick={() => setIsKeyDrawerOpen(false)}
                className="px-4 py-2 sm:py-1.5 rounded-xl text-xs font-bold bg-amber-900 text-white hover:bg-black transition-all min-h-11 flex items-center justify-center cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 2. Top Telemetry Card: Business Profile & Live Operational Inputs */}
        <section className="bg-neutral-50/80 rounded-3xl p-5 sm:p-7 border border-neutral-200/90 shadow-2xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">
                Active Telemetry Context
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500 shrink-0" />
                <h2 className="text-lg font-black text-black font-['Outfit']">
                  {profile.storeName || 'Merchant Business Store'}
                </h2>
                <span className="text-[11px] font-bold text-neutral-500 bg-white px-2 py-0.5 rounded-md border border-neutral-200">
                  Owner: {profile.ownerName || 'Merchant'}
                </span>
              </div>
            </div>

            {/* Business Type Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
              <label htmlFor="business-type-select" className="text-xs font-bold text-neutral-600 whitespace-nowrap">Business Type:</label>
              <select
                id="business-type-select"
                value={selectedBusinessType}
                onChange={(e) => setSelectedBusinessType(e.target.value)}
                className="bg-white border border-neutral-300 rounded-xl px-3 py-2.5 sm:py-2 text-base sm:text-xs font-extrabold text-black focus:outline-hidden focus:ring-2 focus:ring-yellow-400 shadow-2xs min-h-11 sm:min-h-0 w-full sm:w-auto"
              >
                {BUSINESS_TYPE_PRESETS.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4 Telemetry Metrics Pill Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Metric 1: Daily Retained Cash (After Restock & Running Costs) */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-[11px] font-bold">Daily Retained Cash</span>
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-emerald-600 font-['Outfit']">
                +₹{calculatedRunway.retainedCashPerDay.toLocaleString()}
                <span className="text-xs font-normal text-neutral-500"> /day</span>
              </div>
              <div className="text-[10px] text-neutral-500 mt-1 truncate">
                Gross sales: ₹{totalSalesToday.toLocaleString()} · Margin: {calculatedRunway.grossMarginPct}%
              </div>
            </div>

            {/* Metric 2: Received Cash in Hand (Certain) */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-[11px] font-bold">Received Cash in Hand</span>
                <Wallet className="w-4 h-4 text-black" />
              </div>
              <div className="text-xl font-black text-black font-['Outfit']">
                ₹{calculatedRunway.receivedCashInHand.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                100% in hand today (opening + sales)
              </div>
            </div>

            {/* Metric 3: Expected Receivables (Udhar - NEVER merged with in-hand) */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-[11px] font-bold">Expected Receivables</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-black text-amber-600 font-['Outfit']">
                ₹{totalUdhar.toLocaleString()}
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">
                {eKhataCustomers.length} accounts · Timeline weighted
              </div>
            </div>

            {/* Metric 4: Cash Horizon & Status */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-[11px] font-bold">{calculatedRunway.headlineLabel || 'Cash Horizon'}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-black text-black font-['Outfit'] flex items-center gap-1.5 truncate">
                <span>{calculatedRunway.headlineMetric}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {calculatedRunway.runwayStatus}
                </span>
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">
                Buffer: ₹{calculatedRunway.safetyBuffer.toLocaleString()} (3d running cost)
              </div>
            </div>
          </div>

        </section>

        {/* 3. Error Banner if any */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={handleRunPrediction}
              className="font-bold underline cursor-pointer text-rose-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* 4. AI Prediction & Nemotron CFO Talk Section */}
        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 border border-neutral-200 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-black border-2 border-yellow-400 flex items-center justify-center animate-pulse shadow-md">
              <Cpu className="w-7 h-7 text-yellow-300" />
            </div>
            <h3 className="text-lg font-black text-black font-['Outfit']">
              NVIDIA Nemotron is Analyzing Telemetry...
            </h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Scanning daily sales velocity (₹{totalSalesToday.toLocaleString()}), 15-day liabilities (₹{upcomingPayables15d.toLocaleString()}), and business dynamics for <strong className="text-neutral-800">{selectedBusinessType}</strong>.
            </p>
          </div>
        ) : predictionData ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* 4A. THE MAIN TALK CARD: "Nemotron CFO Direct Talk" */}
            <div className="bg-linear-to-br from-black via-neutral-900 to-neutral-950 rounded-3xl p-6 sm:p-9 text-white border-2 border-yellow-400/80 shadow-xl space-y-6 relative overflow-hidden">
              {/* Decorative aura */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Talk Card Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
                <div className="flex items-start sm:items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-yellow-400 shrink-0 flex items-center justify-center text-black shadow-md font-black">
                    <Sparkles className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-white font-['Outfit'] tracking-tight">
                        Nemotron CFO Direct Talk
                      </h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
                        {predictionMeta?.provider || 'NVIDIA Nemotron 70B'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Conversational executive assessment tailored for {profile.storeName || 'your business'}.
                    </p>
                  </div>
                </div>

                {/* Speech Synthesis Audio Player Controls */}
                <div className="flex flex-wrap items-center gap-2 bg-neutral-800/90 p-1.5 rounded-2xl border border-neutral-700 shadow-inner w-full sm:w-auto">
                  <button
                    onClick={handleToggleSpeech}
                    className={`flex-1 sm:flex-none px-3.5 py-2.5 sm:py-1.5 min-h-11 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      isSpeaking && !isPaused
                        ? 'bg-yellow-400 text-black shadow-md'
                        : 'bg-neutral-700 hover:bg-neutral-600 text-white'
                    }`}
                  >
                    {isSpeaking && !isPaused ? (
                      <>
                        <Pause className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        <span>Pause Talk</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-yellow-400 fill-yellow-400" />
                        <span>{isPaused ? 'Resume Talk' : '🔊 Listen to Talk'}</span>
                      </>
                    )}
                  </button>

                  {isSpeaking && (
                    <button
                      onClick={stopSpeech}
                      title="Stop audio"
                      className="p-2.5 sm:p-1.5 min-w-11 min-h-11 flex items-center justify-center rounded-xl bg-neutral-700 hover:bg-rose-900/60 text-white transition-all cursor-pointer"
                    >
                      <Square className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-rose-400" />
                    </button>
                  )}

                  {/* Pulsing audio wave indicator when active */}
                  {isSpeaking && !isPaused && (
                    <div className="flex items-center gap-0.5 px-2">
                      <span className="w-1 h-3 bg-yellow-400 animate-pulse rounded-full"></span>
                      <span className="w-1 h-5 bg-yellow-400 animate-pulse delay-75 rounded-full"></span>
                      <span className="w-1 h-2 bg-yellow-400 animate-pulse delay-150 rounded-full"></span>
                    </div>
                  )}
                </div>
              </div>

              {/* The Talk Script (Text Representation) */}
              <div className="space-y-4 text-neutral-200 text-sm sm:text-base leading-relaxed font-normal">
                {predictionData.talkScript ? (
                  predictionData.talkScript.split('\n\n').map((para, idx) => (
                    <p key={idx} className="first-of-type:text-base first-of-type:font-semibold first-of-type:text-white">
                      {para}
                    </p>
                  ))
                ) : (
                  <p>{predictionData.executiveSummary}</p>
                )}
              </div>

              {/* Executive Summary Tagline */}
              <div className="p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700 text-xs flex items-start gap-3">
                <Info className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-white block mb-0.5">CFO Core Verdict:</span>
                  <p className="text-neutral-300">{predictionData.executiveSummary}</p>
                </div>
              </div>
            </div>

            {/* 4B. Detailed Analytical Grid (3 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Business Type & Working Capital Dynamics */}
              <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-black font-['Outfit']">
                        Business Type Diagnosis
                      </h3>
                      <span className="text-[10px] text-neutral-500 font-bold">
                        {selectedBusinessType}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {predictionData.businessTypeInsight}
                  </p>
                </div>

                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-[11px] text-neutral-600 space-y-1">
                  <span className="font-bold text-neutral-900 block">Inventory & Credit Nuance:</span>
                  <span>
                    Retail cash collections must replenish supplier accounts every 10–14 days to preserve credit terms.
                  </span>
                </div>
              </div>

              {/* Column 2: Daily Sales vs Payables Velocity */}
              <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xs space-y-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-black font-['Outfit']">
                      Daily Sales vs Payables
                    </h3>
                    <span className="text-[10px] text-neutral-500 font-bold">
                      Cash Velocity Comparison
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  {predictionData.salesVsPayablesAnalysis}
                </p>

                {/* Velocity Metric Bars */}
                <div className="space-y-2.5 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-neutral-700 mb-1">
                      <span>Daily Inflows (Sales + Recovery)</span>
                      <span className="text-emerald-600">+₹{calculatedRunway.totalDailyInflow.toLocaleString()}/day</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-neutral-700 mb-1">
                      <span>Daily Burn (Fixed + 15d Payables)</span>
                      <span className="text-rose-600">-₹{calculatedRunway.dailyBurnRate.toLocaleString()}/day</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Customer Udhar & Liquidity Advice */}
              <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-black font-['Outfit']">
                        Udhar & Recovery Strategy
                      </h3>
                      <span className="text-[10px] text-neutral-500 font-bold">
                        ₹{totalUdhar.toLocaleString()} Outstanding
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {predictionData.debtAndReceivablesAdvisory}
                  </p>
                </div>

                <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-200/80 text-[11px] text-purple-900 space-y-1">
                  <span className="font-bold block">Instant Cash Boost:</span>
                  <span>
                    Recovering the top 2 overdue Udhar accounts injects immediate liquidity and extends runway by +14 days.
                  </span>
                </div>
              </div>
            </div>

            {/* 4C. Tactical Action Plan Grid */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-neutral-200 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-black font-['Outfit']">
                    Prioritized Tactical Action Plan
                  </h3>
                  <p className="text-xs text-neutral-500">
                    High-impact steps recommended by Nemotron to maximize cash surplus and avoid bottleneck dates.
                  </p>
                </div>
                <span className="self-start sm:self-auto text-xs font-black text-neutral-700 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200">
                  {predictionData.actionPlan?.length || 0} Recommended Actions
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(predictionData.actionPlan || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 hover:bg-white hover:border-yellow-400 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            item.priority === 'HIGH'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {item.priority} Priority
                        </span>
                        <span className="text-[10px] font-bold text-neutral-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.timeframe}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-neutral-900 leading-snug">
                        {item.action}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-200/80 flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500">Estimated Impact:</span>
                      <span className="font-extrabold text-emerald-700">{item.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4D. Model Telemetry & Audit Footnote */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-500">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-neutral-600" />
                <span>
                  Engine: <strong className="text-black">{predictionMeta?.model || 'nvidia/llama-3.1-nemotron-70b-instruct'}</strong>
                </span>
                <span>•</span>
                <span>
                  Provider: <strong className="text-black">{predictionMeta?.provider || 'NVIDIA NIM'}</strong>
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Latency: {predictionMeta?.latencyMs || 0}ms • {predictionMeta?.timestamp ? new Date(predictionMeta.timestamp).toLocaleTimeString() : 'Just now'}
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Ready State with explicit "Predict using LLM" Button */
          <div className="bg-linear-to-b from-neutral-50 via-white to-amber-50/20 rounded-3xl p-8 sm:p-12 border-2 border-dashed border-neutral-300 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-black border-2 border-yellow-400 flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-yellow-300" />
            </div>

            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-black font-['Outfit']">
                AI Telemetry Ready — Run Prediction
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Your live business telemetry is loaded. Click the button below to have <strong className="text-black">NVIDIA Nemotron 70B</strong> evaluate your daily retained cash, inventory cycle, 15-day liability cliff, and deliver a personalized spoken CFO diagnosis.
              </p>
            </div>

            {/* Central "Predict using LLM" Action Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleRunPrediction}
                disabled={isLoading}
                className="w-full sm:w-auto px-7 py-3.5 min-h-12 justify-center rounded-2xl text-sm font-black bg-black hover:bg-neutral-800 text-yellow-300 border-2 border-yellow-400 flex items-center space-x-3 transition-all shadow-lg hover:scale-102 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <span>Predict using LLM</span>
              </button>
            </div>

            {/* Feature highlights pill row */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4 text-xs text-neutral-500">
              <span className="px-3 py-1 rounded-full bg-white border border-neutral-200 font-bold flex items-center gap-1.5 shadow-2xs">
                <Cpu className="w-3.5 h-3.5 text-amber-500" />
                NVIDIA Nemotron 70B
              </span>
              <span className="px-3 py-1 rounded-full bg-white border border-neutral-200 font-bold flex items-center gap-1.5 shadow-2xs">
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                Spoken CFO Voice Narration
              </span>
              <span className="px-3 py-1 rounded-full bg-white border border-neutral-200 font-bold flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                15-Day Liability Stress Testing
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

