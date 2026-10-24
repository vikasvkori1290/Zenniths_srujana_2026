import React, { useState } from 'react';
import {
  TrendingUp,
  BookOpen,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  Building2,
  ChevronDown,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FinanceHeader({ activePage, setActivePage }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'VK';

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setActivePage('login');
  };

  return (
    <header className="sticky top-0 z-50 w-full h-16 bg-white/95 backdrop-blur-xl border-b border-neutral-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] font-['Plus_Jakarta_Sans']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center space-x-6">
          <div
            onClick={() => setActivePage('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-yellow-300 via-amber-400 to-amber-500 flex items-center justify-center shadow-sm border border-yellow-400/40 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-black font-['Outfit']">
                AURUM<span className="text-amber-500">FLOW</span>
              </span>
              <span className="hidden sm:inline-block text-[9px] font-bold text-neutral-600 bg-neutral-100 ml-2 px-1.5 py-0.5 rounded border border-neutral-200">
                Predictive Cash
              </span>
            </div>
          </div>
        </div>

        {/* Center / Navigation Sections */}
        <nav className="flex items-center space-x-2">
          {/* Dashboard / Overview button */}
          <button
            onClick={() => setActivePage('dashboard')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activePage === 'dashboard'
                ? 'bg-neutral-100 text-black border border-neutral-300 font-bold'
                : 'text-neutral-500 hover:text-black hover:bg-neutral-50'
            }`}
          >
            Overview
          </button>

          {/* eKhata Button */}
          <button
            onClick={() => setActivePage('ekhata')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center space-x-2 transition-all cursor-pointer shadow-sm ${
              activePage === 'ekhata'
                ? 'bg-black text-yellow-300 border border-black shadow-md'
                : 'bg-yellow-300 hover:bg-yellow-400 text-black border border-yellow-400'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>eKhata</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          </button>
        </nav>

        {/* Right Info / User context */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden sm:flex items-center space-x-1.5 text-neutral-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Voice Ledger Active</span>
          </div>

          {isAuthenticated ? (
            /* User Avatar & Dropdown */
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                title={`${user?.name || 'Merchant'} • ${user?.businessName || 'Store'}`}
                className={`h-9 px-2.5 rounded-xl font-black text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm ${
                  activePage === 'profile' || isDropdownOpen
                    ? 'bg-black text-yellow-300 ring-2 ring-yellow-400 shadow-md'
                    : 'bg-black text-yellow-300 border-2 border-yellow-400 hover:scale-102'
                }`}
              >
                <span>{initials}</span>
                <ChevronDown className="w-3 h-3 text-yellow-400" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-neutral-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 font-['Plus_Jakarta_Sans']">
                  <div className="px-3.5 py-2 border-b border-neutral-100">
                    <span className="font-bold text-xs text-black block truncate">
                      {user?.name || 'Merchant'}
                    </span>
                    <span className="text-[10px] text-neutral-400 block truncate">
                      {user?.businessName || 'Aurum Store'}
                    </span>
                    <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      {user?.businessType || 'Retail'}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActivePage('profile');
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-black flex items-center space-x-2 cursor-pointer"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Profile & Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Sign In Button */
            <button
              onClick={() => setActivePage('login')}
              className="gold-button-gradient px-3.5 py-1.5 rounded-xl font-bold text-xs text-black border border-yellow-400 shadow-xs flex items-center space-x-1 hover:scale-105 transition-transform cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
