import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  TrendingUp,
  BookOpen,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  ChevronDown,
  LogIn,
  CreditCard,
  Menu,
  X,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function FinanceHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Income', path: '/income' },
    { name: 'Fixed Expenses', path: '/fixed-expenses' },
    { name: 'Prediction', path: '/prediction', isAi: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xl border-b border-neutral-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] font-['Plus_Jakarta_Sans']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2.5 cursor-pointer group">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-yellow-300 via-amber-400 to-amber-500 flex items-center justify-center shadow-xs border border-yellow-400/40 group-hover:scale-105 transition-transform">
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
          </Link>
        </div>

        {/* Center / Navigation Sections (Desktop) */}
        <nav className="hidden lg:flex items-center space-x-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) =>
                link.isAi
                  ? `px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all shadow-2xs ${
                      isActive
                        ? 'bg-emerald-600 text-white border border-emerald-700 shadow-md ring-2 ring-emerald-400/40'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`
                  : `px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-neutral-100 text-black border border-neutral-300 shadow-2xs'
                        : 'text-neutral-500 hover:text-black hover:bg-neutral-50'
                    }`
              }
            >
              {link.isAi && <Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{link.name}</span>
              {link.isAi && (
                <span className="text-[9px] font-black bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded-md">
                  NVIDIA
                </span>
              )}
            </NavLink>
          ))}

          {/* eKhata Special Pill NavLink */}
          <NavLink
            to="/ekhata"
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center space-x-2 transition-all shadow-xs ${
                isActive
                  ? 'bg-black text-yellow-300 border border-black shadow-md'
                  : 'bg-yellow-300 hover:bg-yellow-400 text-black border border-yellow-400'
              }`
            }
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>eKhata</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          </NavLink>
        </nav>


        {/* Right Info / User context */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden xl:flex items-center space-x-1.5 text-neutral-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Voice Ledger Active</span>
          </div>

          {isAuthenticated ? (
            /* User Avatar & Dropdown */
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                title={`${user?.name || 'Merchant'} • ${user?.businessName || 'Store'}`}
                className={`min-h-[44px] min-w-[44px] px-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs ${
                  location.pathname === '/profile' || isDropdownOpen
                    ? 'bg-black text-yellow-300 ring-2 ring-yellow-400 shadow-md'
                    : 'bg-black text-yellow-300 border-2 border-yellow-400 hover:scale-102'
                }`}
              >
                <span>{initials}</span>
                <ChevronDown className="w-3.5 h-3.5 text-yellow-400" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-neutral-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
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
                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-black flex items-center space-x-2"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Profile & Overview</span>
                    </Link>
                    <Link
                      to="/income"
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-black flex items-center space-x-2"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Today's Income</span>
                    </Link>
                    <Link
                      to="/fixed-expenses"
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-black flex items-center space-x-2"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Monthly Fixed Expenses</span>
                    </Link>
                    <Link
                      to="/prediction"
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full text-left px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/80 flex items-center space-x-2 rounded-lg my-0.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Nemotron AI Prediction</span>
                    </Link>
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
            <Link
              to="/login"
              className="gold-button-gradient min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs text-black border border-yellow-400 shadow-2xs flex items-center space-x-1.5 hover:scale-105 transition-transform"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile menu hamburger toggle button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden min-h-[44px] min-w-[44px] p-2 rounded-xl text-neutral-700 hover:bg-neutral-100 border border-neutral-200 flex items-center justify-center cursor-pointer"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Top Collapse for More items) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white/98 backdrop-blur-xl px-4 py-3 space-y-1 animate-in fade-in slide-in-from-top-2 shadow-lg">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `min-h-[44px] flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-neutral-100 text-black border border-neutral-300'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
          <NavLink
            to="/fixed-expenses"
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `min-h-[44px] flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-neutral-100 text-black border border-neutral-300'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
              }`
            }
          >
            Fixed Expenses
          </NavLink>
          <NavLink
            to="/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className="min-h-[44px] flex items-center px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-600 hover:text-black hover:bg-neutral-50"
          >
            Profile & Overview
          </NavLink>
          <NavLink
            to="/ekhata"
            onClick={() => setIsMobileMenuOpen(false)}
            className="min-h-[44px] flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-black bg-yellow-300 text-black border border-yellow-400 text-center shadow-xs"
          >
            eKhata Smart Ledger
          </NavLink>
        </div>
      )}
    </header>

    {/* Sticky Bottom Navigation Bar for Mobile and Tablet (< 1024px) */}
    {/* Cleanly placed outside <header> so fixed bottom-0 attaches to the viewport */}
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-neutral-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1 items-center">
        {/* 1. Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full transition-all py-1 cursor-pointer min-h-[44px] ${
              isActive ? 'text-black font-extrabold' : 'text-neutral-400 hover:text-neutral-700'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-9 h-7 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-amber-100 text-amber-900 border border-amber-300' : ''
                }`}
              >
                <TrendingUp className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">Home</span>
            </>
          )}
        </NavLink>

        {/* 2. Income */}
        <NavLink
          to="/income"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full transition-all py-1 cursor-pointer min-h-[44px] ${
              isActive ? 'text-black font-extrabold' : 'text-neutral-400 hover:text-neutral-700'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-9 h-7 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : ''
                }`}
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">Income</span>
            </>
          )}
        </NavLink>

        {/* 3. eKhata (Special Gold Highlighted Center Tab) */}
        <NavLink
          to="/ekhata"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full transition-all py-1 cursor-pointer min-h-[44px] ${
              isActive ? 'text-black font-extrabold' : 'text-neutral-600'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-10 h-8 rounded-xl flex items-center justify-center transition-all shadow-xs border ${
                  isActive
                    ? 'bg-black text-yellow-300 border-black ring-2 ring-yellow-400'
                    : 'bg-yellow-300 text-black border-yellow-400'
                }`}
              >
                <BookOpen className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[10px] mt-0.5 font-bold tracking-tight">eKhata</span>
            </>
          )}
        </NavLink>

        {/* 4. Prediction */}
        <NavLink
          to="/prediction"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full transition-all py-1 cursor-pointer min-h-[44px] ${
              isActive ? 'text-black font-extrabold' : 'text-neutral-400 hover:text-neutral-700'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-9 h-7 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-purple-100 text-purple-900 border border-purple-300' : ''
                }`}
              >
                <Sparkles className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">AI CFO</span>
            </>
          )}
        </NavLink>

        {/* 5. Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full transition-all py-1 cursor-pointer min-h-[44px] ${
              isActive ? 'text-black font-extrabold' : 'text-neutral-400 hover:text-neutral-700'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-9 h-7 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-neutral-100 text-black border border-neutral-300' : ''
                }`}
              >
                <UserIcon className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">Profile</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  </>
);
}
