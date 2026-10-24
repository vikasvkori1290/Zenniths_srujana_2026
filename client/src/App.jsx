import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import ItemCard from './components/ItemCard';
import ItemModal from './components/ItemModal';
import ArchitectureCard from './components/ArchitectureCard';
import ApiConsole from './components/ApiConsole';
import {
  getHealthStatus,
  getItems,
  createItem,
  updateItem,
  deleteItem,
} from './services/api';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Database,
  Activity,
  Layers,
  ArrowUpRight,
  Code2,
  Terminal,
} from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState(null);
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadHealth = useCallback(async () => {
    setIsRefreshingHealth(true);
    try {
      const data = await getHealthStatus();
      setHealth(data);
    } catch {
      // Handled in api client
    } finally {
      setIsRefreshingHealth(false);
    }
  }, []);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getItems({
        category: selectedCategory,
        status: selectedStatus,
        search: searchQuery,
      });
      setItems(res.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load items', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, searchQuery]);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, [loadHealth]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleCreateOrUpdate = async (itemData) => {
    if (editingItem) {
      await updateItem(editingItem._id, itemData);
      showToast('Item updated successfully!');
    } else {
      await createItem(itemData);
      showToast('Item created successfully!');
    }
    loadItems();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await deleteItem(id);
        showToast('Item deleted successfully!');
        loadItems();
      } catch (err) {
        showToast(err.message || 'Failed to delete item', 'error');
      }
    }
  };

  const categories = ['All', 'Development', 'Design', 'Marketing', 'Research'];
  const statuses = ['All', 'In Progress', 'Completed', 'Backlog'];

  const isServerHealthy = health?.data?.status === 'healthy';
  const isDbConnected = health?.data?.database?.connected;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] radial-gradient-bg pointer-events-none -z-0" />

      {/* Top Navbar */}
      <Navbar
        health={health}
        onRefreshHealth={loadHealth}
        isRefreshing={isRefreshingHealth}
      />

      {/* Notification Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium flex items-center gap-2.5 backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-800'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
            }`}
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full z-10 space-y-10">
        {/* Hero Section */}
        <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden border border-slate-800/80 bg-gradient-to-b from-slate-900/90 via-slate-900/40 to-slate-950/80 shadow-2xl">
          {/* Subtle decorative grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            {/* Tech Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" /> React 19 + Vite 6
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                Tailwind CSS v4
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Express API + Node.js
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                MongoDB Mongoose
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
              Production-Grade{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                MERN Stack
              </span>{' '}
              Architecture
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal mb-8">
              A high-performance boilerplate with clear client & server separation, Tailwind CSS v4 styling,
              live REST API endpoints, and automatic database fallback mode.
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Server Status</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isServerHealthy ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />
                  <span className="font-bold text-sm text-white">
                    {isServerHealthy ? 'Operational' : 'Unavailable'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Database Mode</span>
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-bold text-sm text-white">
                    {isDbConnected ? 'MongoDB Live' : 'Fallback Store'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Active Resources</span>
                <span className="font-bold text-base text-white">{items.length} items</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Backend Uptime</span>
                <span className="font-bold text-base text-white font-mono">
                  {health?.data?.uptime || 'N/A'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>Create Resource Item</span>
              </button>

              <a
                href="#api-console"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center gap-2 transition-all"
              >
                <Code2 className="w-4 h-4 text-slate-400" />
                <span>Test REST Endpoints</span>
              </a>
            </div>
          </div>
        </div>

        {/* Resources & CRUD Section */}
        <section className="space-y-6">
          {/* Section Header & Search/Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Database Resource Management</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Full CRUD operations synchronized in real-time with Express and MongoDB.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    Status: {status}
                  </option>
                ))}
              </select>

              {/* New Item Trigger */}
              <button
                onClick={() => {
                  setEditingItem(null);
                  setModalOpen(true);
                }}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                title="Add Item"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Item</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-48 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse p-5"
                />
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <ItemCard
                  key={item._id}
                  item={item}
                  onEdit={(it) => {
                    setEditingItem(it);
                    setModalOpen(true);
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-12 text-center border border-dashed border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">No Resource Items Found</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
                No items match your active filter criteria. Clear filters or create a new resource.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedStatus('All');
                  setSearchQuery('');
                  setEditingItem(null);
                  setModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20"
              >
                Create First Item
              </button>
            </div>
          )}
        </section>

        {/* Project Architecture Overview */}
        <section>
          <ArchitectureCard />
        </section>

        {/* Interactive API Explorer */}
        <section id="api-console">
          <ApiConsole />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-8 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-slate-400 font-medium">Enterprise MERN Stack Boilerplate</span>
            <span>•</span>
            <span>Client & Server Separation</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Client: <code className="text-slate-300">port 5173</code></span>
            <span>Server: <code className="text-slate-300">port 5000</code></span>
            <span>Styling: <code className="text-indigo-400">Tailwind CSS v4</code></span>
          </div>
        </div>
      </footer>

      {/* Item Modal (Create / Edit) */}
      <ItemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleCreateOrUpdate}
        itemToEdit={editingItem}
      />
    </div>
  );
}
