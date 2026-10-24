import React, { useState } from 'react';
import { Play, Code, Check, Copy } from 'lucide-react';

export default function ApiConsole() {
  const [endpoint, setEndpoint] = useState('/api/v1/health');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [timeMs, setTimeMs] = useState(null);
  const [copied, setCopied] = useState(false);

  const testEndpoint = async () => {
    try {
      setLoading(true);
      const start = performance.now();
      const res = await fetch(endpoint);
      const duration = Math.round(performance.now() - start);
      const data = await res.json();
      setStatus(res.status);
      setTimeMs(duration);
      setResponse(data);
    } catch (err) {
      setStatus(500);
      setResponse({ error: err.message, note: 'Is the backend server running on port 5000?' });
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Interactive API Explorer</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Test backend REST endpoints directly with live JSON responses and latency inspection.
          </p>
        </div>

        {/* Quick selector buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {['/api/v1/health', '/api/v1/items', '/'].map((ep) => (
            <button
              key={ep}
              onClick={() => setEndpoint(ep)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                endpoint === ep
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {ep}
            </button>
          ))}
        </div>
      </div>

      {/* Request input bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1 flex items-center bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5">
          <span className="text-xs font-bold font-mono text-emerald-400 mr-3">GET</span>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="w-full bg-transparent text-sm text-white font-mono outline-none"
            placeholder="/api/v1/items"
          />
        </div>
        <button
          onClick={testEndpoint}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
        >
          <Play className={`w-4 h-4 fill-current ${loading ? 'animate-pulse' : ''}`} />
          <span>{loading ? 'Sending...' : 'Send Request'}</span>
        </button>
      </div>

      {/* Response Box */}
      {response && (
        <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden mt-4">
          <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Status:</span>
              <span
                className={`font-semibold font-mono px-2 py-0.5 rounded ${
                  status >= 200 && status < 300
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {status} {status === 200 ? 'OK' : ''}
              </span>
              {timeMs !== null && (
                <span className="text-slate-500 font-mono">Duration: {timeMs}ms</span>
              )}
            </div>

            <button
              onClick={copyResponse}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-72 leading-relaxed">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
