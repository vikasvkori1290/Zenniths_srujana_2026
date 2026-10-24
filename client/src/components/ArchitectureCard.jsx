import React, { useState } from 'react';
import { Folder, FileCode, CheckCircle2, Terminal, Copy, Check } from 'lucide-react';

export default function ArchitectureCard() {
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const folderStructure = [
    {
      name: 'client/',
      desc: 'React 19 + Vite 6 + Tailwind CSS v4',
      badge: 'Frontend',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      files: [
        'vite.config.js (Tailwind v4 plugin & /api proxy)',
        'src/components/ (Modern modular UI components)',
        'src/services/api.js (REST API integration)',
        'src/index.css (@import "tailwindcss" & theme tokens)',
      ],
    },
    {
      name: 'server/',
      desc: 'Express.js + Mongoose + Node.js (ESM)',
      badge: 'Backend API',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      files: [
        'src/server.js (HTTP server & graceful shutdown)',
        'src/config/db.js (MongoDB connection with retry)',
        'src/models/item.model.js (Mongoose Schema & validation)',
        'src/routes/ (Modular /api/v1 routing architecture)',
        'src/middleware/ (Helmet, CORS & error handling)',
      ],
    },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Project Architecture</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Clean Separation of Concerns
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Engineered for scalability, enterprise standards, and seamless local developer experience.
          </p>
        </div>

        {/* Quick run command snippet */}
        <div className="flex items-center gap-2 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <code className="text-xs text-slate-300 font-mono">npm run dev</code>
          <button
            onClick={() => copyToClipboard('npm run dev', 'runDev')}
            className="text-slate-500 hover:text-white transition-colors ml-1"
            title="Copy command"
          >
            {copiedKey === 'runDev' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {folderStructure.map((folder, idx) => (
          <div
            key={idx}
            className="rounded-xl p-5 bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-indigo-400" />
                  <span className="font-bold text-white font-mono text-sm">{folder.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${folder.badgeColor}`}>
                  {folder.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">{folder.desc}</p>

              <ul className="space-y-2">
                {folder.files.map((file, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2 text-xs text-slate-300">
                    <FileCode className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                    <span>{file}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Configured & Verified
              </span>
              <span className="font-mono text-slate-400">ES Modules</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
