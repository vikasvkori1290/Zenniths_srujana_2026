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
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onLoginSuccess }) {
  const { login, register, demoLogin, forgotPassword, resetPassword, loading, authError, setAuthError } = useAuth();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot Password flow states
  const [forgotStep, setForgotStep] = useState(1); // 1: request OTP, 2: verify OTP & reset
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [maskedContact, setMaskedContact] = useState('');
  const [hintOtp, setHintOtp] = useState('');
  const [resetSuccess, setResetSuccess] = useState(null);

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
    const res = await login(loginEmail.trim(), loginPassword);
    if (res.success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const res = await register(registerData);
    if (res.success && onLoginSuccess) {
      localStorage.setItem('finsafe_first_time_setup', 'true');
      localStorage.removeItem('finsafe_onboarding_completed');
      onLoginSuccess();
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setAuthError('Please enter your registered email or mobile number.');
      return;
    }
    setAuthError(null);
    setResetSuccess(null);
    const res = await forgotPassword(forgotIdentifier.trim());
    if (res.success) {
      setMaskedContact(res.data.maskedContact || forgotIdentifier.trim());
      setHintOtp(res.data.otp || '');
      setForgotStep(2);
      setResetSuccess(res.data.message || 'Verification code sent!');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetOtp.trim()) {
      setAuthError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setAuthError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthError('Passwords do not match. Please verify.');
      return;
    }

    setAuthError(null);
    const res = await resetPassword({
      identifier: forgotIdentifier.trim(),
      otp: resetOtp.trim(),
      newPassword,
    });

    if (res.success) {
      setResetSuccess('Password reset successfully! Redirecting...');
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          setActiveTab('login');
          setLoginEmail(forgotIdentifier.trim());
          setLoginPassword(newPassword);
          setForgotStep(1);
          setResetSuccess(null);
        }
      }, 900);
    }
  };

  const handleQuickDemo = async () => {
    const res = await demoLogin();
    if (res.success && onLoginSuccess) {
      onLoginSuccess();
    }
  };


  return (
    <div className="min-h-[85dvh] flex items-center justify-center p-3 sm:p-4 font-['Plus_Jakarta_Sans']">
      <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-200/90 shadow-2xl p-4 sm:p-8 space-y-5 sm:space-y-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-300/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-300/60 mb-1 sm:mb-2">
            <div className="w-6 h-6 rounded-lg bg-linear-to-br from-yellow-300 via-amber-400 to-amber-500 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-3.5 h-3.5 text-black stroke-[2.5]" />
            </div>
            <span className="text-xs font-black tracking-tight text-black font-['Outfit']">
              FIN<span className="text-amber-600">SAFE</span>
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-1.5 py-0.2 rounded">
              Predictive Cash
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-black font-['Outfit'] tracking-tight">
            {activeTab === 'login'
              ? 'Merchant Portal Sign In'
              : activeTab === 'register'
              ? 'Register New Merchant'
              : 'Reset Account Password'}
          </h1>
          <p className="text-xs text-neutral-500">
            {activeTab === 'login'
              ? 'Access your smart voice ledger, predictive cash runway, and upcoming liabilities.'
              : activeTab === 'register'
              ? 'Empower your business with voice-powered accounting and AI cash forecasting.'
              : 'Verify your account with a 6-digit OTP to set a new password.'}
          </p>
        </div>

        {/* 1-Click Instant Demo Login Banner (Login view only) */}
        {activeTab === 'login' && (
          <div className="p-3 sm:p-3.5 rounded-2xl bg-linear-to-r from-amber-50 via-yellow-50 to-amber-100/70 border border-amber-300 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-black text-yellow-300 flex items-center justify-center shrink-0 shadow-xs">
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
                className="gold-button-gradient w-full sm:w-auto px-4 py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-black text-black border border-yellow-400 shadow-xs hover:scale-102 transition-transform cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>Instant Enter</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Switcher / Navigation */}
        {activeTab !== 'forgot' ? (
          <div className="flex items-center p-1 rounded-2xl bg-neutral-100 border border-neutral-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setAuthError(null);
                setResetSuccess(null);
              }}
              className={`flex-1 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
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
                setResetSuccess(null);
              }}
              className={`flex-1 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                activeTab === 'register'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-neutral-500 hover:text-black'
              }`}
            >
              Create Account
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setAuthError(null);
                setResetSuccess(null);
              }}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-neutral-600 hover:text-black transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
              Step {forgotStep} of 2
            </span>
          </div>
        )}

        {/* Error Alert */}
        {authError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Success Alert */}
        {resetSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resetSuccess}</span>
          </div>
        )}

        {/* Login Form */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Email, Phone Number, or Name
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-3" />
                <input
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                  placeholder="member@clubhub.com or mobile number"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 min-h-[44px] rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-neutral-700 block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('forgot');
                    setAuthError(null);
                    setResetSuccess(null);
                    if (loginEmail && !forgotIdentifier) {
                      setForgotIdentifier(loginEmail);
                    }
                  }}
                  className="text-[11px] font-semibold text-amber-600 hover:text-amber-800 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-11 py-2.5 min-h-[44px] rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center absolute right-0 top-0 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-2.5 min-h-[48px] rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-sm sm:text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : activeTab === 'forgot' ? (
          /* Forgot Password Multi-Step Business Logic Flow */
          forgotStep === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Registered Email or Phone Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-3" />
                  <input
                    type="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    required
                    placeholder="e.g. member@clubhub.com or 9876543210"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 min-h-[44px] rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1.5">
                  We'll verify your registered account and generate a 6-digit verification code.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-2.5 min-h-[48px] rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-sm sm:text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>{loading ? 'Verifying Account...' : 'Send Verification OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                <div className="font-bold flex items-center justify-between">
                  <span>Verification Code Sent</span>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setAuthError(null);
                    }}
                    className="text-[11px] text-amber-700 underline font-semibold cursor-pointer"
                  >
                    Change Account
                  </button>
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  Sent to: <span className="font-semibold text-black">{maskedContact}</span>
                </div>
                {hintOtp && (
                  <div className="mt-2 pt-2 border-t border-amber-200/80 flex items-center justify-between">
                    <span className="text-[10px] text-amber-800 font-medium">Sandbox Code:</span>
                    <button
                      type="button"
                      onClick={() => setResetOtp(hintOtp)}
                      className="text-[11px] font-black font-mono tracking-wider bg-black text-yellow-300 px-2 py-0.5 rounded cursor-pointer hover:bg-neutral-800"
                    >
                      {hintOtp}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="e.g. 123456"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-9 pr-3 py-2.5 sm:py-2 min-h-[44px] rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black font-mono tracking-widest focus:border-yellow-400 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-11 py-2.5 sm:py-2 min-h-[44px] rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center absolute right-0 top-0 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 sm:py-2 min-h-[44px] rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-[11px] font-semibold text-neutral-600 hover:text-black cursor-pointer underline"
                >
                  Resend Code
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-2.5 min-h-[48px] rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-sm sm:text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 mt-2"
              >
                <span>{loading ? 'Updating Password...' : 'Save Password & Enter Dashboard'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Merchant Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g., Rajesh Patel"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 sm:py-2 min-h-[44px] rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Business Name *
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3.5 sm:top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Patel Stores"
                    value={registerData.businessName}
                    onChange={(e) => setRegisterData({ ...registerData, businessName: e.target.value })}
                    className="w-full pl-8 pr-2.5 py-2.5 sm:py-2 min-h-[44px] rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
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
                  className="w-full px-2.5 py-2.5 sm:py-2 min-h-[44px] rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none font-medium"
                >
                  <option value="Retail">Retail Store</option>
                  <option value="Kirana">Kirana / Groceries</option>
                  <option value="Sweets">Sweets & Bakery</option>
                  <option value="Hardware">Hardware, Paints & Electricals</option>
                  <option value="Stationery">Books & Stationery</option>
                  <option value="Garments">Garments & Apparel</option>
                  <option value="Pharmacy">Retail Pharmacy</option>
                  <option value="Wholesale">Wholesale Trading</option>
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
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="you@business.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 sm:py-2 min-h-[44px] rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Password (min 6 chars) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Create a password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full pl-9 pr-11 py-2.5 sm:py-2 min-h-[44px] rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center absolute right-0 top-0 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-2.5 min-h-[48px] rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-sm sm:text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 mt-2"
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
