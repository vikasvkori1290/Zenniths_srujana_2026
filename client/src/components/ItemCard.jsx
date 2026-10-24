import React from 'react';
import { Calendar, Trash2, Edit3, Tag } from 'lucide-react';
import { StatusBadge, PriorityBadge, CategoryBadge } from './StatusBadge';

export default function ItemCard({ item, onEdit, onDelete }) {
  const formattedDate = new Date(item.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="glass-panel-interactive rounded-xl p-5 flex flex-col justify-between group relative overflow-hidden">
      {/* Top row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={item.category} />
            <PriorityBadge priority={item.priority} />
          </div>
          <StatusBadge status={item.status} />
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-white tracking-tight mb-2 group-hover:text-indigo-300 transition-colors">
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-400 line-clamp-3 mb-4 leading-relaxed font-normal">
          {item.description || 'No description provided.'}
        </p>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {item.tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50"
              >
                <Tag className="w-2.5 h-2.5 text-slate-500" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom row / metadata & actions */}
      <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors"
            title="Edit item"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item._id)}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
            title="Delete item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
