import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Target,
  Briefcase,
  KeyRound,
  RefreshCw,
  Sparkles,
  BookOpen,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onLoginSuccess }) {
  const {
    login,
    register,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    resetPasswordWithOtp,
    sendRegisterOtp,
    verifyRegisterOtp,
    loading,
    authError,
    setAuthError,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password modal state (3 Steps: IDENTIFIER -> OTP -> NEW_PASSWORD)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetStep, setResetStep] = useState('IDENTIFIER'); // 'IDENTIFIER' | 'OTP' | 'NEW_PASSWORD'
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetMaskedEmail, setResetMaskedEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetOtpPreview, setResetOtpPreview] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Register with OTP modal state
  const [isRegisterOtpOpen, setIsRegisterOtpOpen] = useState(false);
  const [registerOtp, setRegisterOtp] = useState('');
  const [registerMaskedEmail, setRegisterMaskedEmail] = useState('');
  const [registerOtpPreview, setRegisterOtpPreview] = useState('');
  const [registerOtpError, setRegisterOtpError] = useState(null);
  const [registerOtpLoading, setRegisterOtpLoading] = useState(false);

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
  });

  const [demoLoading, setDemoLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const res = await login(loginEmail.trim(), loginPassword);
    if (res.success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handleDemoLogin = async () => {
    setAuthError(null);
    setDemoLoading(true);
    const demoEmail = 'nin46642@gmail.com';
    const demoPassword = '123456';
    setLoginEmail(demoEmail);
    setLoginPassword(demoPassword);
    try {
      const res = await login(demoEmail, demoPassword);
      if (res.success && onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setAuthError('Demo login failed. Please try again.');
    } finally {
      setDemoLoading(false);
    }
  };

  // Registration Step 1: Send OTP to email first
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setRegisterOtpError(null);

    if (registerData.password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    const res = await sendRegisterOtp(registerData);
    if (res.success) {
      setRegisterMaskedEmail(res.maskedEmail || registerData.email);
      setRegisterOtpPreview(res.otpPreview || '');
      setRegisterOtp('');
      setIsRegisterOtpOpen(true);
    }
  };

  // Registration Step 2: Verify OTP and finalize store setup
  const handleVerifyRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterOtpError(null);

    if (!registerOtp.trim() || registerOtp.trim().length < 6) {
      setRegisterOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setRegisterOtpLoading(true);
    const res = await verifyRegisterOtp(registerData.email, registerOtp.trim());
    setRegisterOtpLoading(false);

    if (res.success) {
      setIsRegisterOtpOpen(false);
      localStorage.setItem('finsafe_first_time_setup', 'true');
      localStorage.removeItem('finsafe_onboarding_completed');
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } else {
      setRegisterOtpError(res.error || 'Incorrect verification code. Please try again.');
    }
  };

  const handleResendRegisterOtp = async () => {
    setRegisterOtpError(null);
    const res = await sendRegisterOtp(registerData);
    if (res.success) {
      setRegisterOtpPreview(res.otpPreview || '');
      setRegisterOtpError(null);
    }
  };

  // Open Forgot Password Modal
  const handleOpenForgotPassword = () => {
    setResetStep('IDENTIFIER');
    setResetIdentifier(loginEmail || '');
    setResetMaskedEmail('');
    setResetOtp('');
    setResetOtpPreview('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetError(null);
    setResetSuccess(null);
    setIsForgotPasswordOpen(true);
  };

  // Step 1: Send OTP to registered email
  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    const cleanId = resetIdentifier.trim();
    if (!cleanId) {
      setResetError('Please enter your email or username.');
      return;
    }

    setResetLoading(true);
    const res = await sendPasswordResetOtp(cleanId);
    setResetLoading(false);

    if (res.success) {
      setResetMaskedEmail(res.maskedEmail || cleanId);
      setResetOtpPreview(res.otpPreview || '');
      setResetStep('OTP');
      setResetSuccess(res.message || 'Verification code sent to your email.');
    } else {
      setResetError(res.error || 'No registered account found with that email or username.');
    }
  };

  // Step 2: Verify OTP code
  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    const cleanOtp = resetOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setResetError('Please enter the 6-digit verification code.');
      return;
    }

    setResetLoading(true);
    const res = await verifyPasswordResetOtp(resetIdentifier.trim(), cleanOtp);
    setResetLoading(false);

    if (res.success) {
      setResetStep('NEW_PASSWORD');
      setResetSuccess('Code verified! Enter your new password below.');
    } else {
      setResetError(res.error || 'Incorrect or expired verification code.');
    }
  };

  // Step 3: Set new password only after OTP is confirmed
  const handleResetFinalPassword = async (e) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (resetNewPassword.length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    const res = await resetPasswordWithOtp(resetIdentifier.trim(), resetOtp.trim(), resetNewPassword);
    setResetLoading(false);

    if (res.success) {
      setResetSuccess('Password reset successfully! Logging you in...');
      setTimeout(() => {
        setIsForgotPasswordOpen(false);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }, 1000);
    } else {
      setResetError(res.error || 'Failed to reset password. Please try again.');
    }
  };


  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-neutral-200', text: '' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500', text: 'text-blue-600' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const pwdStrength = getPasswordStrength(registerData.password);

  return (
    <div className="h-full w-full flex items-center justify-center p-2 sm:p-4 font-['Plus_Jakarta_Sans'] overflow-hidden">
      <div
        className={`w-full ${
          activeTab === 'register' ? 'max-w-xl p-4 sm:p-6' : 'max-w-md p-4 sm:p-7'
        } bg-white rounded-3xl border border-neutral-200/90 shadow-2xl space-y-3.5 sm:space-y-4 relative max-h-[94vh] overflow-x-hidden overflow-y-auto transition-all duration-300 scrollbar-none [&::-webkit-scrollbar]:hidden`}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-300/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-2xl bg-amber-50 border border-amber-300/60 mb-0.5">
            <div className="w-5 h-5 rounded-lg bg-linear-to-br from-yellow-300 via-amber-400 to-amber-500 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-3 h-3 text-black stroke-[2.5]" />
            </div>
            <span className="text-xs font-black tracking-tight text-black font-['Outfit']">
              FIN<span className="text-amber-600">SAFE</span>
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-1.5 py-0.2 rounded">
              Predictive Cash
            </span>
            <Link
              to="/how-it-works"
              className="text-[10px] font-bold text-amber-950 bg-amber-200/90 hover:bg-amber-300 px-2 py-0.5 rounded-full flex items-center space-x-1 cursor-pointer transition-colors ml-1 shadow-2xs"
              title="Click to read Nitish's story: base cash, profit, low buffer, and how the app works"
            >
              <BookOpen className="w-2.5 h-2.5 text-amber-950" />
              <span>How It Works</span>
            </Link>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-black font-['Outfit'] tracking-tight">
            {activeTab === 'login' ? 'Merchant Portal Sign In' : 'Create Merchant Account'}
          </h1>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {activeTab === 'login'
              ? 'Access your smart voice ledger, predictive cash runway, and upcoming liabilities.'
              : 'Set up your merchant credentials and business profile to get started.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-neutral-100 border border-neutral-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setAuthError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center ${
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
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center ${
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
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center space-x-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* ===================== TAB 1: SIGN IN ===================== */}
        {activeTab === 'login' ? (
          <form
            key="login"
            onSubmit={handleLoginSubmit}
            className="space-y-3.5 animate-in fade-in slide-in-from-left-3 duration-300 fill-mode-forwards"
          >
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Email or Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-3" />
                <input
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                  placeholder="Email or Username"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 min-h-11 rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-neutral-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgotPassword}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
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
                  className="w-full pl-9 pr-11 py-2.5 min-h-11 rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="min-w-11 min-h-11 flex items-center justify-center absolute right-0 top-0 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full py-3 sm:py-2.5 min-h-11.5 rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-sm sm:text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 mt-2"
            >
              <span>{loading && !demoLoading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="relative flex items-center justify-center pt-1.5">
              <div className="border-t border-neutral-200 w-full"></div>
              <span className="bg-white px-2.5 text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                Or Quick Access & Story
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading || demoLoading}
                onClick={handleDemoLogin}
                className="w-full py-2.5 sm:py-2 min-h-11 rounded-xl bg-amber-50 hover:bg-amber-100/90 border border-amber-300 text-amber-950 font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                title="1-Click Demo Login as Nitish Kumar (nin46642@gmail.com)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-300 shrink-0" />
                <span>
                  {demoLoading ? 'Logging In...' : 'Demo Login'}
                </span>
              </button>

              <Link
                to="/how-it-works"
                className="w-full py-2.5 sm:py-2 min-h-11 rounded-xl bg-neutral-900 hover:bg-black text-yellow-300 border border-neutral-800 font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                title="See how FinSafe works: Nitish's daily profit, base cash, low buffer rules & features"
              >
                <BookOpen className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                <span>How It Works (Story)</span>
              </Link>
            </div>
          </form>
        ) : (
          /* ===================== TAB 2: CREATE ACCOUNT (PROFESSIONAL REGISTERING PAGE) ===================== */
          <form
            key="register"
            onSubmit={handleRegisterSubmit}
            className="space-y-3.5 animate-in fade-in slide-in-from-right-3 duration-300 fill-mode-forwards"
          >
            {/* Section 1: Merchant & Business Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Merchant Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 sm:py-2 min-h-10.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Business / Store Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Business / Store Name"
                    value={registerData.businessName}
                    onChange={(e) => setRegisterData({ ...registerData, businessName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 sm:py-2 min-h-10.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Industry & Daily Target */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Industry / Business Type
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                  <select
                    value={registerData.businessType}
                    onChange={(e) => setRegisterData({ ...registerData, businessType: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 sm:py-2 min-h-10.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none font-medium cursor-pointer"
                  >
                    <option value="Retail">Retail Store & Supermarket</option>
                    <option value="Kirana">Kirana / Provision Store</option>
                    <option value="Hardware">Hardware, Electricals & Paint</option>
                    <option value="Sweets">Sweets, Bakery & Cafe</option>
                    <option value="Pharmacy">Pharmacy & Healthcare</option>
                    <option value="Garments">Garments & Apparel</option>
                    <option value="Stationery">Books & Stationery</option>
                    <option value="Wholesale">Wholesale & Distribution</option>
                    <option value="Services">Services, Tech & Agency</option>
                    <option value="Manufacturing">Manufacturing & Fabrication</option>
                    <option value="Other">Other Business</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Daily Sales Target (₹)
                </label>
                <div className="relative">
                  <Target className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    placeholder="Daily sales target in ₹"
                    value={registerData.dailyGoal}
                    onChange={(e) => setRegisterData({ ...registerData, dailyGoal: Number(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2.5 sm:py-2 min-h-10.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Official Business Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@business.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 sm:py-2 min-h-10.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-700">
                    Password (min 6 chars) *
                  </label>
                  {registerData.password && (
                    <span className={`text-[10px] font-bold ${pwdStrength.text}`}>
                      {pwdStrength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Create password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full pl-9 pr-11 py-2.5 sm:py-2 min-h-10.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="min-w-10.5 min-h-10.5 flex items-center justify-center absolute right-0 top-0 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Password strength meter */}
                {registerData.password && (
                  <div className="mt-1.5 flex items-center space-x-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          step <= pwdStrength.score ? pwdStrength.color : 'bg-neutral-200'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-2.5 min-h-11.5 rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-sm sm:text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 mt-2"
            >
              <span>{loading ? 'Setting up Merchant Portal...' : 'Create Merchant Account'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <p className="text-center text-[11px] text-neutral-500">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setAuthError(null);
                }}
                className="text-amber-700 font-bold hover:underline cursor-pointer"
              >
                Sign In to existing account
              </button>
            </p>
          </form>
        )}

        {/* Security Footnote */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-center space-x-1.5 text-[11px] text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>256-bit encrypted merchant authentication & smart cash ledger</span>
        </div>
      </div>

      {/* ===================== FORGOT PASSWORD MODAL (3 STEPS) ===================== */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl p-5 sm:p-7 max-w-md w-full relative space-y-4 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-black text-yellow-300 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black font-['Outfit'] tracking-tight">
                    {resetStep === 'IDENTIFIER' && 'Reset Password (Step 1/3)'}
                    {resetStep === 'OTP' && 'Verify Email Code (Step 2/3)'}
                    {resetStep === 'NEW_PASSWORD' && 'Create New Password (Step 3/3)'}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {resetStep === 'IDENTIFIER' && 'Enter your registered email or username'}
                    {resetStep === 'OTP' && `Code sent to ${resetMaskedEmail || 'your email'}`}
                    {resetStep === 'NEW_PASSWORD' && 'Choose a strong new password for your account'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-black cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error & Success Alerts */}
            {resetError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {/* STEP 1: Enter Identifier */}
            {resetStep === 'IDENTIFIER' && (
              <form onSubmit={handleSendResetOtp} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Registered Email or Username *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. nin46642@gmail.com or nitishkumar"
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 sm:py-2 min-h-10.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                    />
                  </div>
                  <span className="text-[10.5px] text-neutral-400 block mt-1">
                    We will send a 6-digit security OTP to your registered email address.
                  </span>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>{resetLoading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Enter & Verify OTP */}
            {resetStep === 'OTP' && (
              <form onSubmit={handleVerifyResetOtp} className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-700" />
                    <span>Check your email</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    A 6-digit verification code has been dispatched to <strong>{resetMaskedEmail}</strong>. Enter it below to proceed to password reset.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Enter 6-Digit OTP *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    placeholder="123456"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full text-center tracking-[0.35em] font-mono font-black text-lg sm:text-xl py-2.5 min-h-11.5 rounded-xl bg-neutral-50 border border-neutral-300 text-black focus:border-yellow-400 focus:bg-white outline-none"
                  />
                  <div className="flex items-center justify-between mt-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setResetStep('IDENTIFIER')}
                      className="text-neutral-500 hover:text-black flex items-center space-x-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Change Email</span>
                    </button>
                    <button
                      type="button"
                      disabled={resetLoading}
                      onClick={handleSendResetOtp}
                      className="text-amber-700 font-bold hover:underline cursor-pointer flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Resend OTP</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading || resetOtp.length < 6}
                    className="flex-1 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    <span>{resetLoading ? 'Verifying...' : 'Verify OTP Code'}</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Set New Password (ONLY after OTP is verified!) */}
            {resetStep === 'NEW_PASSWORD' && (
              <form onSubmit={handleResetFinalPassword} className="space-y-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>OTP verified for <strong>{resetMaskedEmail}</strong>. Create your new password.</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    New Password (min 6 chars) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoFocus
                      placeholder="Enter new password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="w-full pl-9 pr-11 py-2.5 sm:py-2 min-h-10.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="min-w-10.5 min-h-10.5 flex items-center justify-center absolute right-0 top-0 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      {showResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Confirm new password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 sm:py-2 min-h-10.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>{resetLoading ? 'Updating...' : 'Reset & Sign In'}</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===================== REGISTRATION OTP VERIFICATION MODAL ===================== */}
      {isRegisterOtpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl p-5 sm:p-7 max-w-md w-full relative space-y-4 animate-in zoom-in-95 duration-200 font-['Plus_Jakarta_Sans']">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-yellow-300 via-amber-400 to-amber-500 flex items-center justify-center text-black shadow-xs font-bold">
                  <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black font-['Outfit'] tracking-tight">
                    Verify Your Email
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Enter the code sent to {registerMaskedEmail}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOtpOpen(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-black cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {registerOtpError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{registerOtpError}</span>
              </div>
            )}

            {/* Explanation card */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs space-y-1.5">
              <div className="font-bold flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Security verification for new merchants</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                To keep your smart ledger and store cash-flow data secure, enter the 6-digit verification code sent to <strong>{registerMaskedEmail}</strong>.
              </p>
            </div>

            <form onSubmit={handleVerifyRegisterSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  6-Digit Verification Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  placeholder="123456"
                  value={registerOtp}
                  onChange={(e) => setRegisterOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full text-center tracking-[0.35em] font-mono font-black text-lg sm:text-xl py-2.5 min-h-11.5 rounded-xl bg-neutral-50 border border-neutral-300 text-black focus:border-yellow-400 focus:bg-white outline-none"
                />
                <div className="flex items-center justify-between mt-2 text-[11px]">
                  <span className="text-neutral-400">Code expires in 10 minutes</span>
                  <button
                    type="button"
                    disabled={registerOtpLoading}
                    onClick={handleResendRegisterOtp}
                    className="text-amber-700 font-bold hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend Code</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegisterOtpOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer min-h-10.5"
                >
                  Edit Details
                </button>
                <button
                  type="submit"
                  disabled={registerOtpLoading || registerOtp.length < 6}
                  className="flex-1 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50 min-h-10.5"
                >
                  <span>{registerOtpLoading ? 'Verifying...' : 'Verify & Launch Store'}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
