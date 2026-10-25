import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Building2,
  Phone,
  Mail,
  CreditCard,
  Edit3,
  CheckCircle2,
  AlertCircle,
  X,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Sliders,
  Store,
  Target,
  Briefcase,
  ArrowRight,
} from 'lucide-react';
import FirstTimeOnboardingModal from '../components/FirstTimeOnboardingModal';
import { useAuth } from '../context/AuthContext';
import { useBodyScrollLock } from '../services/useBodyScrollLock';

const DEFAULT_DEMO_UPI = 'demo.store@okhdfcbank';

// Dynamically compute avatar letter or initial from user name
export const getAvatarLetter = (name) => {
  if (!name || typeof name !== 'string') return 'M';
  const clean = name.trim();
  if (!clean) return 'M';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    // Single word name -> single letter (e.g. "nitish" -> "N")
    return parts[0].charAt(0).toUpperCase();
  }
  // Two or more words -> initials (e.g. "Vikas Kori" -> "VK")
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export default function ProfilePage() {
  const { user, logout, updatePassword } = useAuth();
  const navigate = useNavigate();

  // Load and sanitize profile data
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('aurum_profile_info');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleanPhone = (parsed.phone || user?.phone || '9198765432').replace(/\D/g, '').slice(0, 10);
        return {
          ...parsed,
          phone: cleanPhone || '9198765432',
          businessType: parsed.businessType || user?.businessType || 'Retail Store / General',
          upiId: parsed.upiId || user?.upiId || DEFAULT_DEMO_UPI,
        };
      } catch (e) {}
    }
    const cleanUserPhone = (user?.phone || '9198765432').replace(/\D/g, '').slice(0, 10);
    return {
      name: user?.name || 'nitish',
      initials: user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'N',
      businessName: user?.businessName || 'nn',
      businessType: user?.businessType || 'Retail Store / General',
      phone: cleanUserPhone || '9198765432',
      email: user?.email || 'nin46642@gmail.com',
      upiId: user?.upiId || DEFAULT_DEMO_UPI,
      role: 'Owner & Primary Operator',
      currency: '₹',
      dailyGoal: user?.dailyGoal || 20000,
      joinedDate: 'October 2026',
    };
  });

  // Modal states: 'personal' or 'store'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'store'
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [tempUpi, setTempUpi] = useState(profile.upiId || DEFAULT_DEMO_UPI);
  const [profileForm, setProfileForm] = useState(profile);
  const [toastMessage, setToastMessage] = useState(null);

  // Update Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  // Body scroll lock for modals
  useBodyScrollLock(isEditModalOpen || isUpiModalOpen);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync if auth user updates
  useEffect(() => {
    if (user) {
      setProfile((prev) => {
        const cleanPhone = (user.phone || prev.phone || '9198765432').replace(/\D/g, '').slice(0, 10);
        return {
          ...prev,
          name: user.name || prev.name,
          businessName: user.businessName || prev.businessName,
          businessType: user.businessType || prev.businessType,
          email: user.email || prev.email,
          phone: cleanPhone,
          upiId: user.upiId || prev.upiId || DEFAULT_DEMO_UPI,
        };
      });
    }
  }, [user]);

  // Open modal for personal details
  const handleOpenPersonalEdit = () => {
    setProfileForm(profile);
    setActiveTab('personal');
    setIsEditModalOpen(true);
  };

  // Open modal for store details
  const handleOpenStoreEdit = () => {
    setProfileForm(profile);
    setActiveTab('store');
    setIsEditModalOpen(true);
  };

  // Save personal details form
  const handleSavePersonal = (e) => {
    e.preventDefault();
    const cleanPhone = (profileForm.phone || '').replace(/\D/g, '').slice(0, 10);
    if (cleanPhone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number.');
      return;
    }

    const updated = {
      ...profile,
      name: profileForm.name.trim(),
      phone: cleanPhone,
      email: profileForm.email.trim(),
      initials: getAvatarLetter(profileForm.name),
    };

    setProfile(updated);
    localStorage.setItem('aurum_profile_info', JSON.stringify(updated));

    try {
      const u = JSON.parse(localStorage.getItem('aurum_auth_user') || '{}');
      u.name = updated.name;
      u.phone = updated.phone;
      u.email = updated.email;
      localStorage.setItem('aurum_auth_user', JSON.stringify(u));
    } catch (err) {}

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('aurum_profile_updated'));
    setIsEditModalOpen(false);
    showToast('Personal details updated successfully!');
  };

  // Save store details form
  const handleSaveStore = (e) => {
    e.preventDefault();
    const updated = {
      ...profile,
      businessName: profileForm.businessName.trim(),
      businessType: profileForm.businessType || 'Retail Store / General',
      dailyGoal: Number(profileForm.dailyGoal) || 20000,
      upiId: (profileForm.upiId || '').trim() || DEFAULT_DEMO_UPI,
    };

    setProfile(updated);
    localStorage.setItem('aurum_profile_info', JSON.stringify(updated));

    if (updated.businessType) {
      localStorage.setItem('aurum_business_type', updated.businessType);
      try {
        const u = JSON.parse(localStorage.getItem('aurum_auth_user') || '{}');
        u.businessType = updated.businessType;
        u.businessName = updated.businessName;
        u.dailyGoal = updated.dailyGoal;
        u.upiId = updated.upiId;
        localStorage.setItem('aurum_auth_user', JSON.stringify(u));
      } catch (err) {}
      window.dispatchEvent(new Event('aurum_business_type_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    setIsEditModalOpen(false);
    showToast('Store details updated successfully!');
  };

  // Save UPI only
  const handleSaveUpiOnly = (e) => {
    e.preventDefault();
    const cleaned = (tempUpi || '').trim() || DEFAULT_DEMO_UPI;
    const updated = { ...profile, upiId: cleaned };
    setProfile(updated);
    setProfileForm(updated);
    localStorage.setItem('aurum_profile_info', JSON.stringify(updated));
    try {
      const u = JSON.parse(localStorage.getItem('aurum_auth_user') || '{}');
      u.upiId = cleaned;
      localStorage.setItem('aurum_auth_user', JSON.stringify(u));
    } catch (err) {}
    setIsUpiModalOpen(false);
    showToast(`Merchant UPI ID saved: ${cleaned}`);
  };

  // Handle password update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match. Please re-check.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setPasswordLoading(true);
    const res = await updatePassword(currentPassword, newPassword);
    setPasswordLoading(false);

    if (res.success) {
      setPasswordSuccess('Password updated successfully! Keep your credentials safe.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Account password updated successfully!');
    } else {
      setPasswordError(res.error || 'Failed to update password. Please check your current password.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Password strength meter
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

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="w-full h-full max-h-[calc(100vh-64px)] overflow-hidden bg-neutral-50/70 text-neutral-900 font-['Plus_Jakarta_Sans'] flex flex-col justify-between p-3 sm:p-4 lg:p-5 select-none">
      <FirstTimeOnboardingModal />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className="px-5 py-3 rounded-2xl bg-black text-yellow-300 border border-yellow-400 shadow-2xl text-xs font-bold flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto w-full h-full flex flex-col justify-between gap-3 sm:gap-3.5 overflow-hidden">
        {/* ========================================================= */}
        {/* 1. PERSONAL PROFILE SECTION (TOP - STICKY AT TOP)         */}
        {/* ========================================================= */}
        <div className="glass-panel-gold rounded-2xl p-3 sm:p-4 border border-yellow-400/40 shadow-xs relative overflow-hidden shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 relative z-10">
            <div className="flex flex-row items-center gap-3 sm:gap-4">
              {/* Personal Avatar Letter / Initial */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-black text-yellow-300 font-black text-lg sm:text-xl flex items-center justify-center border-2 border-yellow-400 shadow-xs">
                {getAvatarLetter(profile.name)}
              </div>

              {/* Personal Details (No PRO or KYC badges) */}
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-black text-black font-['Outfit'] tracking-tight truncate">
                  {profile.name}
                </h1>

                <p className="text-[11px] sm:text-xs font-semibold text-neutral-600 mt-0.5 truncate">
                  {profile.role || 'Owner & Primary Operator'}
                </p>

                {/* Personal Contact Details */}
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-neutral-700">
                  {/* Personal Mobile Number */}
                  <span className="flex items-center space-x-1.5 bg-white/95 border border-neutral-300/80 px-2 py-0.5 rounded-lg font-mono font-semibold">
                    <Phone className="w-3 h-3 text-neutral-500 shrink-0" />
                    <span>+91 {profile.phone}</span>
                  </span>

                  {/* Personal Email Address */}
                  <span className="flex items-center space-x-1.5 bg-white/95 border border-neutral-300/80 px-2 py-0.5 rounded-lg font-medium">
                    <Mail className="w-3 h-3 text-neutral-500 shrink-0" />
                    <span className="truncate max-w-[220px]">{profile.email}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons (Edit Personal Details link) */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-amber-300/40">
              <button
                type="button"
                onClick={handleOpenPersonalEdit}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold text-black bg-yellow-300 hover:bg-yellow-400 border border-yellow-400 transition-all flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer min-h-9"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Personal Details</span>
              </button>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('finsafe_open_setup_wizard'))}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-all flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer min-h-9"
                title="Configure store financial parameters & fixed commitments"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-800" />
                <span>Financial Wizard</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer min-h-9"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. EQUAL-WIDTH 50/50 GRID:                                */}
        {/*    (A) STORE IDENTITY & DETAILS | (B) UPDATE PASSWORD     */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 flex-1 items-stretch min-h-0 overflow-hidden">
          {/* ------------------------------------------------------- */}
          {/* CARD A: STORE IDENTITY & DETAILS (EQUAL 50% WIDTH)      */}
          {/* ------------------------------------------------------- */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-neutral-200/90 shadow-2xs flex flex-col justify-start overflow-hidden">
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100 min-h-[42px]">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900">
                  <Store className="w-3.5 h-3.5 text-amber-900" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-black font-['Outfit']">Store Identity & Details</h2>
                  <p className="text-[10px] text-neutral-500">Commercial trade profile and settlement credentials.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenStoreEdit}
                className="min-h-8 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3 h-3 text-amber-700" />
                <span>Modify Store</span>
              </button>
            </div>

            {/* Grid of Store Details - 3 Rows matching Password card exactly */}
            <div className="space-y-2 mt-2.5">
              {/* Row 1: Store Name & Shop Category (2 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2 sm:p-2.5 rounded-xl bg-neutral-50/90 border border-neutral-200/80">
                  <div className="flex items-center space-x-1.5 text-neutral-400 mb-0.5">
                    <Building2 className="w-3 h-3 text-amber-600" />
                    <span className="text-[9px] uppercase font-bold tracking-wider">Store / Business Name</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-black block truncate">{profile.businessName}</span>
                </div>

                <div className="p-2 sm:p-2.5 rounded-xl bg-neutral-50/90 border border-neutral-200/80">
                  <div className="flex items-center space-x-1.5 text-neutral-400 mb-0.5">
                    <Briefcase className="w-3 h-3 text-amber-600" />
                    <span className="text-[9px] uppercase font-bold tracking-wider">Shop Model / Category</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-amber-900 block font-['Outfit'] truncate">{profile.businessType}</span>
                </div>
              </div>

              {/* Row 2: Daily Sales Target Goal */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-neutral-50/90 border border-neutral-200/80">
                <div className="flex items-center space-x-1.5 text-neutral-400 mb-0.5">
                  <Target className="w-3 h-3 text-amber-600" />
                  <span className="text-[9px] uppercase font-bold tracking-wider">Daily Sales Target Goal</span>
                </div>
                <span className="text-sm sm:text-base font-black text-black block font-['Outfit']">
                  ₹{Number(profile.dailyGoal || 20000).toLocaleString()} / day
                </span>
              </div>

              {/* Row 3: Settlement UPI ID */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-neutral-50/90 border border-neutral-200/80">
                <div className="flex items-center space-x-1.5 text-neutral-400 mb-0.5">
                  <CreditCard className="w-3 h-3 text-amber-600" />
                  <span className="text-[9px] uppercase font-bold tracking-wider">Settlement UPI ID</span>
                </div>
                <span className="text-xs sm:text-sm font-mono font-bold text-black block truncate">
                  {profile.upiId || DEFAULT_DEMO_UPI}
                </span>
              </div>
            </div>

            {/* Row 4: Action Button - Full Width, perfectly aligned with Save New Password button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setTempUpi(profile.upiId || DEFAULT_DEMO_UPI);
                  setIsUpiModalOpen(true);
                }}
                className="w-full py-2 min-h-9 rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 border border-yellow-400 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs transition-all"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Update Settlement UPI ID</span>
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------- */}
          {/* CARD B: UPDATE PASSWORD (EQUAL 50% WIDTH)               */}
          {/* ------------------------------------------------------- */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-neutral-200/90 shadow-2xs flex flex-col justify-start overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100 min-h-[42px]">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-yellow-100 border border-yellow-300 flex items-center justify-center text-black">
                    <KeyRound className="w-3.5 h-3.5 text-black" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-black font-['Outfit']">Update Password</h2>
                    <p className="text-[10px] text-neutral-500">Secure your store ledger and credentials.</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  <span>Encrypted</span>
                </span>
              </div>

              {/* Feedback Banners */}
              {passwordError && (
                <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {/* Password Form - 3 Rows matching Store Details card exactly */}
              <form onSubmit={handlePasswordSubmit} className="mt-2.5 space-y-2 text-xs font-semibold">
                {/* Row 1: Current Password */}
                <div>
                  <label className="block text-neutral-700 mb-0.5 text-[11px]">Current Password *</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-8 pr-9 py-1.5 min-h-8 rounded-lg bg-neutral-50 border border-neutral-300/80 text-xs text-black focus:border-amber-400 focus:bg-white outline-hidden transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="min-w-8 min-h-8 flex items-center justify-center absolute right-0 top-0 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Row 2: New Password */}
                <div>
                  <label className="block text-neutral-700 mb-0.5 text-[11px]">New Password (min 6 chars) *</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Create strong new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-8 pr-9 py-1.5 min-h-8 rounded-lg bg-neutral-50 border border-neutral-300/80 text-xs text-black focus:border-amber-400 focus:bg-white outline-hidden transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="min-w-8 min-h-8 flex items-center justify-center absolute right-0 top-0 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-1 space-y-0.5">
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="text-neutral-500 font-medium">Strength:</span>
                        <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                      </div>
                      <div className="h-1 w-full bg-neutral-200 rounded-full overflow-hidden flex gap-1">
                        <div className={`h-full flex-1 ${strength.score >= 1 ? strength.color : 'bg-neutral-200'}`} />
                        <div className={`h-full flex-1 ${strength.score >= 2 ? strength.color : 'bg-neutral-200'}`} />
                        <div className={`h-full flex-1 ${strength.score >= 3 ? strength.color : 'bg-neutral-200'}`} />
                        <div className={`h-full flex-1 ${strength.score >= 4 ? strength.color : 'bg-neutral-200'}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Row 3: Confirm New Password */}
                <div>
                  <label className="block text-neutral-700 mb-0.5 text-[11px]">Confirm New Password *</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Re-type new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-8 pr-9 py-1.5 min-h-8 rounded-lg bg-neutral-50 border border-neutral-300/80 text-xs text-black focus:border-amber-400 focus:bg-white outline-hidden transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="min-w-8 min-h-8 flex items-center justify-center absolute right-0 top-0 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Row 4: Action Button - Full Width, perfectly aligned with Update Settlement UPI button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full py-2 min-h-9 rounded-xl bg-black hover:bg-neutral-800 text-yellow-300 border border-yellow-400 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-all"
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Save New Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: REGISTRATION-STYLE PROFILE & STORE UPDATER         */}
      {/* Distinct Personal Details vs Store Details Tabs           */}
      {/* ========================================================= */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 w-full max-w-xl max-h-[92dvh] overflow-y-auto overscroll-contain border border-neutral-200 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-yellow-300 border border-yellow-400 flex items-center justify-center text-black shadow-xs">
                  {activeTab === 'personal' ? (
                    <User className="w-5 h-5 text-black" />
                  ) : (
                    <Store className="w-5 h-5 text-black" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-black font-['Outfit']">
                    {activeTab === 'personal' ? 'Update Personal Details' : 'Update Store Details'}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {activeTab === 'personal'
                      ? 'Operator identity, contact mobile number, and email.'
                      : 'Store name, business type, daily target goal, and UPI.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="min-w-10 min-h-10 flex items-center justify-center text-neutral-400 hover:text-black rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Segmented Switcher for Two Distinct Views */}
            <div className="flex rounded-xl bg-neutral-100 p-1 mt-4">
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'personal'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-500 hover:text-black'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Personal Details</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('store')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'store'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-500 hover:text-black'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Store Details</span>
              </button>
            </div>

            {/* VIEW 1: PERSONAL DETAILS FORM */}
            {activeTab === 'personal' && (
              <form onSubmit={handleSavePersonal} className="mt-4 space-y-4 text-xs font-semibold animate-in fade-in duration-200">
                {/* Operator Full Name */}
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Operator Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 min-h-[42px] rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* Mobile Number: strictly digits only, max 10 digits */}
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Personal Mobile Number (10 digits) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                    <span className="absolute left-8 top-2.5 text-neutral-500 font-mono text-xs">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9198765432"
                      value={profileForm.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setProfileForm({ ...profileForm, phone: digits });
                      }}
                      className="w-full pl-16 pr-3 py-2.5 min-h-[42px] rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs font-mono font-bold text-black focus:border-yellow-400 focus:bg-white outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    {profileForm.phone ? `${profileForm.phone.length}/10 digits entered` : 'Numbers only, strictly 10 digits'}
                  </span>
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Personal Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="name@business.com"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 min-h-[42px] rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Want to update store parameters?</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('store')}
                    className="text-amber-800 font-bold hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <span>Switch to Store Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-neutral-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 min-h-11 rounded-xl text-neutral-600 hover:text-black font-semibold flex items-center justify-center cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gold-button-gradient px-5 py-2.5 min-h-11 rounded-xl text-xs font-bold text-black border border-yellow-400 shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer hover:scale-102 transition-transform"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Personal Details</span>
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 2: STORE DETAILS FORM */}
            {activeTab === 'store' && (
              <form onSubmit={handleSaveStore} className="mt-4 space-y-4 text-xs font-semibold animate-in fade-in duration-200">
                {/* Business / Store Name */}
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Business / Store Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Store / Enterprise Name"
                      value={profileForm.businessName}
                      onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 min-h-[42px] rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* Shop Model / Industry Type */}
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Shop Model / Industry Type
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                    <select
                      value={profileForm.businessType || 'Retail Store / General'}
                      onChange={(e) => setProfileForm({ ...profileForm, businessType: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 min-h-[42px] rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs text-black focus:border-yellow-400 focus:bg-white outline-none font-medium cursor-pointer"
                    >
                      <option value="Retail Store / General">Retail Store & Supermarket</option>
                      <option value="Kirana / Groceries">Kirana / Provision Store</option>
                      <option value="Hardware, Paints & Electricals">Hardware, Electricals & Paint</option>
                      <option value="Sweets & Bakery">Sweets, Bakery & Cafe</option>
                      <option value="Retail Pharmacy">Pharmacy & Healthcare</option>
                      <option value="Garments & Apparel">Garments & Apparel</option>
                      <option value="Books & Stationery">Books & Stationery</option>
                      <option value="Wholesale Trading">Wholesale & Distribution</option>
                      <option value="Services / Agency">Services, Tech & Agency</option>
                      <option value="Manufacturing">Manufacturing & Fabrication</option>
                      <option value="Other Business">Other Business</option>
                    </select>
                  </div>
                </div>

                {/* Daily Target Goal */}
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Daily Sales Target (₹)
                  </label>
                  <div className="relative">
                    <Target className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      placeholder="Daily target in ₹"
                      value={profileForm.dailyGoal || 20000}
                      onChange={(e) => setProfileForm({ ...profileForm, dailyGoal: Number(e.target.value) })}
                      className="w-full pl-9 pr-3 py-2.5 min-h-[42px] rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs font-mono font-bold text-black focus:border-yellow-400 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* Settlement UPI ID */}
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Settlement UPI ID
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder={DEFAULT_DEMO_UPI}
                      value={profileForm.upiId}
                      onChange={(e) => setProfileForm({ ...profileForm, upiId: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 min-h-[42px] rounded-xl bg-neutral-50 border border-neutral-200 text-sm sm:text-xs font-mono font-semibold text-black focus:border-yellow-400 focus:bg-white outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    Default demo ID or your bank UPI VPA address
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Want to update personal details?</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('personal')}
                    className="text-amber-800 font-bold hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <span>Switch to Personal Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-neutral-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 min-h-11 rounded-xl text-neutral-600 hover:text-black font-semibold flex items-center justify-center cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gold-button-gradient px-5 py-2.5 min-h-11 rounded-xl text-xs font-bold text-black border border-yellow-400 shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer hover:scale-102 transition-transform"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Store Details</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT UPI ID                                        */}
      {/* ========================================================= */}
      {isUpiModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsUpiModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-sm max-h-[90dvh] overflow-y-auto overscroll-contain border border-neutral-200 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-black text-black font-['Outfit']">Edit Merchant UPI ID</h3>
                <p className="text-[11px] text-neutral-500">Auto-links customer QR codes to your account.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsUpiModalOpen(false)}
                className="min-w-10 min-h-10 flex items-center justify-center text-neutral-400 hover:text-black rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpiOnly} className="mt-4 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-neutral-700 mb-1">UPI VPA Address *</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder={DEFAULT_DEMO_UPI}
                    value={tempUpi}
                    onChange={(e) => setTempUpi(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 min-h-11 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-sm sm:text-xs font-mono text-black font-semibold"
                  />
                </div>
              </div>

              {/* Quick Demo ID button */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-500">Need a placeholder?</span>
                <button
                  type="button"
                  onClick={() => setTempUpi(DEFAULT_DEMO_UPI)}
                  className="text-amber-800 font-bold hover:underline cursor-pointer"
                >
                  Use Demo ID
                </button>
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => setIsUpiModalOpen(false)}
                  className="px-4 py-2.5 min-h-11 rounded-xl text-neutral-600 hover:text-black font-semibold flex items-center justify-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-button-gradient px-5 py-2.5 min-h-11 rounded-xl text-xs font-bold text-black border border-yellow-400 shadow-sm flex items-center justify-center cursor-pointer"
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
