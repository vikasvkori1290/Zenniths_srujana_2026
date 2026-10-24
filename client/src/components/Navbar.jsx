import React from 'react';
import { Layers, Database, Server, ExternalLink, RefreshCw, Cpu } from 'lucide-react';

export default function Navbar({ health, onRefreshHealth, isRefreshing }) {
  const isServerOnline = health?.data?.status === 'healthy';
  const isDbOnline = health?.data?.database?.connected;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                MERN Stack
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Vite + Tailwind v4 + Express + MongoDB
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Server Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline text-slate-400">Server:</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isServerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className={isServerOnline ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                {isServerOnline ? 'Online (5000)' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Database Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline text-slate-400">Database:</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isDbOnline ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span className={isDbOnline ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                {isDbOnline ? 'Connected' : 'Fallback / Mock'}
              </span>
            </div>
          </div>

          {/* Refresh Action */}
          <button
            onClick={onRefreshHealth}
            disabled={isRefreshing}
            title="Refresh System Health"
            className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 transition-all duration-150 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
