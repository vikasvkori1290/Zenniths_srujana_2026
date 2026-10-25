import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Phone,
  MessageCircle,
  X,
  Send,
  ArrowRight,
  ShieldAlert,
  Wallet,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { sendMobileNotification, isCapacitorNative } from '../services/mobileNotificationService';

export default function TomorrowBillNotificationModal({
  isOpen,
  onClose,
  alertData,
  onTriggerNotification,
}) {
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen || !alertData) return null;

  const {
    isSufficient,
    totalDueTomorrow = 0,
    currentCash = 0,
    safetyBuffer = 1500,
    shortfall = 0,
    primaryDueTitle = 'Scheduled Due',
    tomorrowDues = [],
    notificationTitle = '',
    notificationBody = '',
    quickSummary = '',
    actionSteps = [],
    contingencyAdvice = '',
  } = alertData;

  const handleSendTestNotification = async () => {
    setIsSending(true);
    setSentSuccess(false);
    try {
      if (onTriggerNotification) {
        await onTriggerNotification();
      } else {
        await sendMobileNotification({
          title: notificationTitle,
          body: notificationBody,
          id: Math.floor(Math.random() * 9000) + 1000,
          extra: alertData,
        });
      }
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 3000);
    } catch (e) {
      console.warn('Failed to send test notification', e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-neutral-900 border border-neutral-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          className={`p-4 sm:p-5 flex items-center justify-between border-b ${
            isSufficient
              ? 'bg-emerald-950/40 border-emerald-500/30'
              : 'bg-amber-950/50 border-amber-500/30'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${
                isSufficient
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
              }`}
            >
              {isSufficient ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-sm sm:text-base font-['Outfit']">
                  {isSufficient ? "Tomorrow's Bill Covered" : "Tomorrow's Bill Alert"}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isSufficient
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {isSufficient ? 'Safe Cash' : 'Shortage'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                <span>Due Tomorrow: ₹{Number(totalDueTomorrow).toLocaleString('en-IN')}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Mobile Push Notification Preview Box */}
          <div className="p-3.5 rounded-2xl bg-black/60 border border-neutral-700/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1.5 font-semibold text-neutral-300">
                <Bell className="w-3.5 h-3.5 text-yellow-400" />
                <span>Mobile Notification Sent</span>
              </span>
              <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                {isCapacitorNative() ? 'Capacitor Android Push' : 'Web / App Alert'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700 text-left space-y-1">
              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                <span>{notificationTitle}</span>
              </div>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                {notificationBody}
              </p>
            </div>

            {/* Test Trigger Button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-neutral-500 italic">
                Test how it appears on your phone
              </span>
              <button
                onClick={handleSendTestNotification}
                disabled={isSending}
                className="px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-[11px] flex items-center space-x-1.5 cursor-pointer transition-all disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>{isSending ? 'Sending...' : sentSuccess ? '✓ Delivered!' : 'Test Notification'}</span>
              </button>
            </div>
          </div>

          {/* Dues Breakdown Summary */}
          <div className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 space-y-2.5">
            <div className="flex items-center justify-between text-neutral-300 font-semibold">
              <span>Payables Due Tomorrow ({tomorrowDues.length}):</span>
              <span className="font-mono font-bold text-white">
                ₹{Number(totalDueTomorrow).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-1 divide-y divide-neutral-700/40">
              {tomorrowDues.map((d, i) => (
                <div key={i} className="pt-1 first:pt-0 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-300">• {d.title} ({d.category})</span>
                  <span className="font-mono text-neutral-200 font-bold">₹{Number(d.amount).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-neutral-700 flex items-center justify-between text-[11px] text-neutral-400">
              <span>Current Cash Balance:</span>
              <span className="font-mono font-bold text-neutral-200">
                ₹{Number(currentCash).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Safety Buffer Requirement:</span>
              <span className="font-mono font-bold text-amber-400">
                ₹{Number(safetyBuffer).toLocaleString('en-IN')}
              </span>
            </div>

            <div
              className={`pt-2 border-t flex items-center justify-between font-bold ${
                isSufficient
                  ? 'border-emerald-500/30 text-emerald-400'
                  : 'border-rose-500/30 text-rose-400'
              }`}
            >
              <span>{isSufficient ? 'Remaining Cushion Above Buffer:' : 'Shortfall to Arrange:'}</span>
              <span className="font-mono text-sm">
                {isSufficient
                  ? `+₹${(currentCash - totalDueTomorrow - safetyBuffer).toLocaleString('en-IN')}`
                  : `₹${Number(shortfall).toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>

          {/* LLM Money Arrangement Advisory (When Shortfall Exists) */}
          {!isSufficient && (
            <div className="p-4 rounded-2xl bg-linear-to-b from-amber-950/40 to-neutral-900 border border-amber-400/40 space-y-3">
              <div className="flex items-center space-x-2 text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-xs uppercase tracking-wider">
                  AI Money Arrangement Plan
                </span>
              </div>

              {quickSummary && (
                <p className="text-[11px] text-neutral-300 italic">
                  "{quickSummary}"
                </p>
              )}

              {/* Action Steps */}
              {actionSteps?.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Recommended Action Steps:
                  </span>
                  <div className="space-y-1.5">
                    {actionSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-black/40 border border-amber-500/20 text-[11px] text-neutral-200 flex items-start space-x-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="leading-snug">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contingency fallback */}
              {contingencyAdvice && (
                <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700 text-[10px] text-neutral-400 flex items-center justify-between">
                  <span>
                    <strong className="text-neutral-300">Backup Option:</strong> {contingencyAdvice}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Sufficient Cash Guidance */}
          {isSufficient && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-emerald-300">
              <div className="flex items-center space-x-2 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Everything Safe for Tomorrow</span>
              </div>
              <p className="text-[11px] text-neutral-300">
                Your current cash balance comfortably covers tomorrow's bill without dipping into your emergency buffer. No special collection or money arrangement needed.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            Dismiss
          </button>

          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center space-x-2 cursor-pointer shadow-md transition-all ${
              isSufficient
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                : 'bg-yellow-400 hover:bg-yellow-300 text-black'
            }`}
          >
            <span>{isSufficient ? 'Understood' : 'Take Action on Khata'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
