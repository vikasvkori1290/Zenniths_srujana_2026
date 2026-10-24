import React, { useState } from 'react';
import {
  TrendingUp,
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  Zap,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onLoginSuccess }) {
  const { login, register, demoLogin, loading, authError, setAuthError } = useAuth();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    businessType: 'Retail',
    dailyGoal: 20000,
    phone: '',
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const res = await login(loginEmail, loginPassword);
    if (res.success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const res = await register(registerData);
    if (res.success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handleQuickDemo = async () => {
    const res = await demoLogin();
    if (res.success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 font-['Plus_Jakarta_Sans']">
      <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-200/90 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-300/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-300/60 mb-2">
            <div className="w-6 h-6 rounded-lg bg-linear-to-br from-yellow-300 via-amber-400 to-amber-500 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-3.5 h-3.5 text-black stroke-[2.5]" />
            </div>
            <span className="text-xs font-black tracking-tight text-black font-['Outfit']">
              AURUM<span className="text-amber-600">FLOW</span>
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-1.5 py-0.2 rounded">
              Predictive Cash
            </span>
          </div>

          <h1 className="text-2xl font-black text-black font-['Outfit'] tracking-tight">
            {activeTab === 'login' ? 'Merchant Portal Sign In' : 'Register New Merchant'}
          </h1>
          <p className="text-xs text-neutral-500">
            {activeTab === 'login'
              ? 'Access your smart voice ledger, predictive cash runway, and upcoming liabilities.'
              : 'Empower your business with voice-powered accounting and AI cash forecasting.'}
          </p>
        </div>

        {/* 1-Click Instant Demo Login Banner */}
        <div className="p-3.5 rounded-2xl bg-linear-to-r from-amber-50 via-yellow-50 to-amber-100/70 border border-amber-300 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-black text-yellow-300 flex items-center justify-center shadow-xs">
                <Zap className="w-4 h-4 fill-yellow-300" />
              </div>
              <div>
                <span className="text-xs font-bold text-black block">1-Click Instant Demo</span>
                <span className="text-[10px] text-neutral-600 block">Vikas Kori (Enterprise Hub)</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={loading}
              className="gold-button-gradient px-3 py-1.5 rounded-xl text-xs font-black text-black border border-yellow-400 shadow-xs hover:scale-105 transition-transform cursor-pointer flex items-center space-x-1"
            >
              <span>Instant Enter</span>
              <ArrowRight className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-neutral-100 border border-neutral-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setAuthError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-black shadow-xs'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setAuthError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-black shadow-xs'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Login Form */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Merchant Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="demo@aurumflow.com or your email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Merchant Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g., Rajesh Patel"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Business Name *
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Patel Stores"
                    value={registerData.businessName}
                    onChange={(e) => setRegisterData({ ...registerData, businessName: e.target.value })}
                    className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Business Type
                </label>
                <select
                  value={registerData.businessType}
                  onChange={(e) => setRegisterData({ ...registerData, businessType: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black focus:border-yellow-400 focus:bg-white outline-none font-medium"
                >
                  <option value="Retail">Retail Store</option>
                  <option value="Wholesale">Wholesale Trading</option>
                  <option value="Kirana">Kirana / Groceries</option>
                  <option value="Services">Services / Agency</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="you@business.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Password (min 6 chars) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Create a password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full pl-9 pr-9 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 mt-2"
            >
              <span>{loading ? 'Creating Account...' : 'Complete Merchant Registration'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Security Footer */}
        <div className="pt-4 border-t border-neutral-100 flex items-center justify-center space-x-2 text-[11px] text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-bit encrypted authentication & localized cash ledger</span>
        </div>
      </div>
    </div>
  );
}
