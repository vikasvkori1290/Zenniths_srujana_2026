import React from 'react';

export function CategoryBadge({ category }) {
  const styles = {
    Development: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Design: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
    Marketing: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Research: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    General: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  const currentStyle = styles[category] || styles.General;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${currentStyle}`}>
      {category}
    </span>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    Completed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    'In Progress': 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    Backlog: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  const dots = {
    Completed: 'bg-emerald-400',
    'In Progress': 'bg-indigo-400 animate-pulse',
    Backlog: 'bg-slate-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.Backlog}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || dots.Backlog}`} />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const colors = {
    Urgent: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    High: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Medium: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    Low: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${colors[priority] || colors.Medium}`}>
      {priority}
    </span>
  );
}
