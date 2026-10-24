import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Search,
  Plus,
  Calendar,
  User,
  IndianRupee,
  History,
  CheckCircle2,
  Trash2,
  ArrowUpRight,
  TrendingUp,
  Clock,
  AlertCircle,
  Volume2,
  Settings2,
  Zap,
  Key,
  Check,
  ExternalLink,
  Cpu,
  UserCheck,
  Edit3,
  MinusCircle,
  XCircle,
} from 'lucide-react';
import { parseLocalSmartIntent, parseWithGroqAI, checkGroqStatus } from '../services/voiceParser';

export default function EKhataPage() {
  // Customer Khata Ledger
  const [khataList, setKhataList] = useState(() => {
    const saved = localStorage.getItem('aurum_ekhata_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => ({
            ...item,
            idNumber: item.idNumber !== undefined && item.idNumber !== null ? item.idNumber : idx + 1,
          }));
        }
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'cust-1',
        idNumber: 1,
        name: 'Nitish',
        totalAmount: 240,
        dueDate: '30 November',
        phone: '+91 98765 43210',
        status: 'Pending',
        lastUpdated: 'Today at 04:36 PM',
        history: [
          { amount: 150, date: 'Today at 04:15 PM', note: 'Initial Khata balance' },
          { amount: 20, date: 'Today at 04:26 PM', note: 'Added ₹20 via voice' },
          { amount: 70, date: 'Today at 04:36 PM', note: 'Added ₹70 via voice' },
        ],
      },
      {
        id: 'cust-2',
        idNumber: 2,
        name: 'Rahul Sharma',
        totalAmount: 420,
        dueDate: '28 November',
        phone: '+91 91234 56789',
        status: 'Pending',
        lastUpdated: 'Yesterday at 06:30 PM',
        history: [
          { amount: 420, date: 'Yesterday at 06:30 PM', note: 'Supplies credit' },
        ],
      },
    ];
  });

  // Groq API Key & Backend Connectivity State
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('ekhata_groq_key') || '');
  const [backendGroqStatus, setBackendGroqStatus] = useState(null);
  const [isGroqModalOpen, setIsGroqModalOpen] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState('');

  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [lastExtracted, setLastExtracted] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
  const [manualText, setManualText] = useState('');

  const recognitionRef = useRef(null);

  // Check backend Groq status on mount
  useEffect(() => {
    checkGroqStatus().then((status) => {
      setBackendGroqStatus(status);
    });
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('aurum_ekhata_data', JSON.stringify(khataList));
  }, [khataList]);

  useEffect(() => {
    localStorage.setItem('ekhata_groq_key', groqKey);
  }, [groqKey]);

  // Setup Web Speech API for voice listening
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Indian English / Hinglish speech

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('Listening... Speak any CRUD command (Add, Remove, Rename, Delete)');
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(`"${transcript}"`);
        await handleExecuteVoiceCommand(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        showFeedback(`Mic status: ${event.error}. You can also type or use test prompts below!`, 'warning');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [groqKey]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showFeedback('Web Speech is not supported in this browser. Please use the quick prompt buttons or text bar!', 'warning');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const showFeedback = (msg, type = 'success') => {
    setFeedbackMessage({ text: msg, type });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // Main Execution with Groq Voice CRUD Pipeline
  const handleExecuteVoiceCommand = async (rawText) => {
    if (!rawText || !rawText.trim()) return;
    setIsProcessing(true);

    try {
      const parsed = await parseWithGroqAI({ text: rawText, apiKey: groqKey });
      setLastExtracted(parsed);

      if (!parsed || (!parsed.name && parsed.targetId === null && parsed.targetId === undefined)) {
        showFeedback(
          `Could not identify customer name or ID from: "${rawText}". Please mention the person name or ID number!`,
          'error'
        );
        return;
      }

      handleVoiceCrudOperation(parsed, rawText);
    } catch (err) {
      console.error('Voice execution error:', err);
      showFeedback(`Processing error: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // FULL VOICE CRUD OPERATOR (Supports Customer Names & ID Numbers)
  const handleVoiceCrudOperation = (parsed, rawText) => {
    const { action, targetId, name, newName, amount, dueDate, isCompleteRemove, engine } = parsed;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = `Today at ${timestamp}`;
    const engineLabel = engine || 'Groq AI';

    setKhataList((prevList) => {
      // Find existing customer by targetId or name
      let existingIndex = -1;

      // 1. Direct ID match
      if (targetId !== null && targetId !== undefined) {
        existingIndex = prevList.findIndex(
          (c) => c.idNumber === targetId || String(c.idNumber) === String(targetId)
        );
      }

      // 2. Check if name is formatted as "ID 1", "ID number 2", "customer #3", "#2"
      if (existingIndex === -1 && name) {
        const idInName = name.match(/(?:id\s*(?:number)?|customer\s*#?|#)\s*(\d+)/i) || name.match(/^(\d+)$/);
        if (idInName) {
          const num = parseInt(idInName[1], 10);
          existingIndex = prevList.findIndex((c) => c.idNumber === num);
        }
      }

      // 3. Exact name match (case-insensitive)
      if (existingIndex === -1 && name) {
        existingIndex = prevList.findIndex(
          (c) => c.name.toLowerCase() === name.toLowerCase()
        );
      }

      // 4. Partial name match
      if (existingIndex === -1 && name && name.length >= 3) {
        existingIndex = prevList.findIndex(
          (c) => c.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.name.toLowerCase())
        );
      }

      const existing = existingIndex !== -1 ? prevList[existingIndex] : null;
      const displayTarget = existing
        ? `#${existing.idNumber} (${existing.name})`
        : (targetId ? `ID #${targetId}` : `"${name}"`);

      // 1. DELETE / COMPLETE REMOVE
      if (action === 'DELETE' || isCompleteRemove) {
        if (!existing) {
          showFeedback(`Customer ${displayTarget} was not found in the list to remove.`, 'error');
          return prevList;
        }
        showFeedback(`🗑️ [${engineLabel}] Completely removed ${displayTarget} from the list.`, 'warning');
        return prevList.filter((c) => c.id !== existing.id);
      }

      // 2. RENAME
      if (action === 'RENAME') {
        if (!existing) {
          showFeedback(`Customer ${displayTarget} was not found in the ledger to rename.`, 'error');
          return prevList;
        }
        if (!newName) {
          showFeedback(`Could not detect the new name to rename ${displayTarget} to.`, 'error');
          return prevList;
        }
        const updatedList = [...prevList];
        updatedList[existingIndex] = {
          ...existing,
          name: newName,
          lastUpdated: dateStr,
          history: [
            {
              amount: 0,
              date: dateStr,
              note: `Renamed from "${existing.name}" to "${newName}" via voice`,
            },
            ...existing.history,
          ],
        };
        showFeedback(`✏️ [${engineLabel}] Renamed #${existing.idNumber} to "${newName}".`, 'success');
        return updatedList;
      }

      // 3. SUBTRACT / REMOVE AMOUNT
      if (action === 'SUBTRACT') {
        if (!existing) {
          showFeedback(`Customer ${displayTarget} not found in ledger to deduct amount from.`, 'error');
          return prevList;
        }
        const deductVal = amount || 0;
        const newTotal = Math.max(0, existing.totalAmount - deductVal);
        const isSettled = newTotal === 0;

        const updatedList = [...prevList];
        updatedList[existingIndex] = {
          ...existing,
          totalAmount: newTotal,
          status: isSettled ? 'Settled' : 'Pending',
          lastUpdated: dateStr,
          history: [
            {
              amount: -deductVal,
              date: dateStr,
              note: `-₹${deductVal} removed via voice (${rawText})`,
            },
            ...existing.history,
          ],
        };
        showFeedback(
          `📉 [${engineLabel}] Deducted ₹${deductVal} from ${displayTarget}. New Total Due: ₹${newTotal}${isSettled ? ' (Marked Settled)' : ''}`,
          'success'
        );
        return updatedList;
      }

      // 4. SETTLE
      if (action === 'SETTLE') {
        if (!existing) {
          showFeedback(`Customer ${displayTarget} not found in ledger.`, 'error');
          return prevList;
        }
        const updatedList = [...prevList];
        updatedList[existingIndex] = {
          ...existing,
          totalAmount: 0,
          status: 'Settled',
          lastUpdated: dateStr,
          history: [
            {
              amount: -existing.totalAmount,
              date: dateStr,
              note: `Account settled in full via voice (${rawText})`,
            },
            ...existing.history,
          ],
        };
        showFeedback(`✅ [${engineLabel}] Settled account in full for ${displayTarget}.`, 'success');
        return updatedList;
      }

      // 5. UPDATE_DUE_DATE (Only Date is Added or Edited; Amount remains completely unchanged)
      // Triggered when user says "add 31 november to id number 2" or "set due date 30 november to id 1"
      if (
        action === 'UPDATE_DUE_DATE' ||
        (dueDate && dueDate !== 'Not Specified' && (amount === null || amount === 0))
      ) {
        if (!existing) {
          showFeedback(`Customer ${displayTarget} not found in ledger to set due date.`, 'error');
          return prevList;
        }
        const updatedList = [...prevList];
        const prevDate = existing.dueDate;
        updatedList[existingIndex] = {
          ...existing,
          dueDate: dueDate || existing.dueDate,
          lastUpdated: dateStr,
          history: [
            {
              amount: 0,
              date: dateStr,
              note: `Due date ${prevDate === 'Not Specified' ? 'set to' : 'changed to'} ${dueDate} via voice`,
            },
            ...existing.history,
          ],
        };
        showFeedback(
          `📅 [${engineLabel}] ${prevDate === 'Not Specified' ? 'Added due date' : 'Updated due date for'} ${displayTarget} to ${dueDate}. Total Due remains ₹${existing.totalAmount.toLocaleString()}.`,
          'success'
        );
        return updatedList;
      }

      // 6. ADD / CREATE (Add amount to existing customer or create new customer)
      const addVal = amount || 0;
      if (existing) {
        const updatedTotal = existing.totalAmount + addVal;
        const updatedList = [...prevList];
        const newDueDate = dueDate && dueDate !== 'Not Specified' ? dueDate : existing.dueDate;
        updatedList[existingIndex] = {
          ...existing,
          totalAmount: updatedTotal,
          dueDate: newDueDate,
          lastUpdated: dateStr,
          status: updatedTotal > 0 ? 'Pending' : existing.status,
          history: [
            {
              amount: addVal,
              date: dateStr,
              note: `+₹${addVal} added via voice (${rawText})`,
            },
            ...existing.history,
          ],
        };
        showFeedback(
          `⚡ [${engineLabel}] Added ₹${addVal} to ${displayTarget}. New Total: ₹${updatedTotal.toLocaleString()}${newDueDate && newDueDate !== 'Not Specified' ? ` (Due: ${newDueDate})` : ''}`,
          'success'
        );
        return updatedList;
      } else {
        // Calculate next ID number
        const maxId = prevList.reduce((max, c) => Math.max(max, c.idNumber || 0), 0);
        const assignedIdNumber = targetId || (maxId + 1);
        const customerName = (name && !name.toLowerCase().startsWith('id ')) ? name : `Customer #${assignedIdNumber}`;

        const newCustomer = {
          id: `cust-${Date.now()}`,
          idNumber: assignedIdNumber,
          name: customerName,
          totalAmount: addVal,
          dueDate: dueDate || 'Not Specified',
          phone: 'Not Added',
          status: addVal === 0 ? 'Settled' : 'Pending',
          lastUpdated: dateStr,
          history: [
            {
              amount: addVal,
              date: dateStr,
              note: `Initial entry via voice: ₹${addVal}`,
            },
          ],
        };
        showFeedback(
          `⚡ [${engineLabel}] Created ID #${assignedIdNumber} (${customerName}) with ₹${addVal} (Due: ${dueDate || 'Not Specified'})`,
          'success'
        );
        return [newCustomer, ...prevList];
      }
    });
  };

  const handleQuickCommand = async (cmd) => {
    setVoiceTranscript(`"${cmd}"`);
    await handleExecuteVoiceCommand(cmd);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    const textToProcess = manualText;
    setVoiceTranscript(`"${textToProcess}"`);
    setManualText('');
    await handleExecuteVoiceCommand(textToProcess);
  };

  const handleSettle = (id) => {
    setKhataList((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              totalAmount: 0,
              status: 'Settled',
              lastUpdated: 'Just now',
              history: [
                {
                  amount: -c.totalAmount,
                  date: 'Just now',
                  note: 'Khata settled & marked paid in full',
                },
                ...c.history,
              ],
            }
          : c
      )
    );
    showFeedback('Khata settled in full!', 'success');
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete ${name}'s Khata record?`)) {
      setKhataList((prev) => prev.filter((c) => c.id !== id));
      showFeedback(`Removed ${name} from Khata`, 'warning');
    }
  };

  const handleSaveGroqKey = () => {
    setGroqKey(tempKeyInput.trim());
    setIsGroqModalOpen(false);
    showFeedback(
      tempKeyInput.trim()
        ? 'Groq API Key saved! Now powered by Groq LPU'
        : 'Using server/.env Groq configuration',
      'success'
    );
  };

  const isGroqActive = Boolean(
    (backendGroqStatus && backendGroqStatus.active) ||
    (groqKey && groqKey.trim())
  );

  const filteredList = khataList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dueDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(c.idNumber) === searchQuery.trim() ||
      `#${c.idNumber}` === searchQuery.trim().toLowerCase()
  );

  const totalOutstanding = khataList.reduce((acc, c) => acc + c.totalAmount, 0);

  return (
    <div className="w-full bg-white text-neutral-900 min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans']">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-[11px] font-black uppercase tracking-wider text-black bg-yellow-300 px-2 py-0.5 rounded border border-yellow-400">
                Voice CRUD eKhata
              </span>
              <button
                onClick={() => {
                  setTempKeyInput(groqKey || (backendGroqStatus?.keyPreview ? 'server-configured' : ''));
                  setIsGroqModalOpen(true);
                }}
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center space-x-1.5 cursor-pointer transition-all shadow-xs ${
                  isGroqActive
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
                }`}
                title="Groq LPU Status & Settings"
              >
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>
                  {isGroqActive
                    ? `⚡ Groq LPU Active (${backendGroqStatus?.model || 'gpt-oss-120b'})`
                    : 'Configure Groq (Free)'}
                </span>
                {isGroqActive && <Check className="w-3 h-3 text-emerald-600" />}
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-black font-['Outfit'] mt-1 tracking-tight">
              Customer Credit Ledger (e-Khata)
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              100% Voice CRUD with Groq: <strong>Add Amount</strong>, <strong>Remove/Subtract Amount</strong>, <strong>Rename Person</strong>, or <strong>Delete Totally</strong>.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Total Outstanding
              </span>
              <div className="text-2xl font-black text-black font-['Outfit']">
                ₹{totalOutstanding.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                Active Khata
              </span>
              <div className="text-2xl font-black text-black font-['Outfit']">
                {khataList.filter((k) => k.totalAmount > 0).length}
              </div>
            </div>

            <button
              onClick={() => {
                setTempKeyInput(groqKey);
                setIsGroqModalOpen(true);
              }}
              className="p-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 hover:text-black transition-colors"
              title="Groq Key Settings"
            >
              <Key className="w-5 h-5 text-amber-600" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMessage && (
          <div
            className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn ${
              feedbackMessage.type === 'success'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : feedbackMessage.type === 'warning'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-neutral-100 border-neutral-300 text-neutral-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{feedbackMessage.text}</span>
            </div>
          </div>
        )}

        {/* COMPACT VOICE CRUD COMMAND BAR (Very Small Mic) */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/90 shadow-sm space-y-2.5">
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
            {/* Very Small Mic Button */}
            <div className="relative shrink-0">
              {isListening && (
                <div className="absolute -inset-1 rounded-full bg-yellow-400 opacity-70 animate-ping"></div>
              )}
              <button
                type="button"
                onClick={toggleListening}
                className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                  isListening
                    ? 'bg-yellow-400 text-black scale-105 border-2 border-black'
                    : 'bg-black text-yellow-300 hover:bg-neutral-800 border border-yellow-400/80 hover:scale-105'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Tap to speak voice CRUD command'}
              >
                <Mic className={`w-3.5 h-3.5 ${isListening ? 'animate-pulse text-black' : 'text-yellow-300'}`} />
              </button>
            </div>

            {/* Input field */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={
                  isListening
                    ? 'Listening... say e.g. "remove 20rs from nitish" or "change name from nitish to vikas"'
                    : 'Say: "add 20rs to nitish" / "remove 20rs from nitish" / "change name from nitish to vikas" / "delete nitish"'
                }
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className={`w-full pl-3.5 pr-20 py-2 rounded-xl bg-white border text-xs focus:border-yellow-400 outline-none text-black placeholder:text-neutral-400 shadow-sm ${
                  isListening ? 'border-amber-400 bg-amber-50/30' : 'border-neutral-200'
                }`}
              />
              {isListening && (
                <span className="absolute right-3 top-2.5 flex items-center space-x-1 text-[10px] font-bold text-amber-600 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Listening</span>
                </span>
              )}
            </div>

            {/* Execute Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="gold-button-gradient px-4 py-2 rounded-xl text-xs font-bold text-black border border-yellow-400/80 cursor-pointer shadow-sm shrink-0 flex items-center space-x-1"
            >
              {isProcessing ? (
                <span>Executing Groq...</span>
              ) : (
                <>
                  <Zap className="w-3 h-3 text-black fill-black" />
                  <span>Execute Voice CRUD</span>
                </>
              )}
            </button>
          </form>

          {/* Transcript & Extracted CRUD Action Indicator */}
          {voiceTranscript && (
            <div className="px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-800 flex flex-wrap items-center justify-between gap-2 shadow-inner">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase text-neutral-400">Heard:</span>
                <span className="font-mono text-xs font-medium text-neutral-800">{voiceTranscript}</span>
              </div>

              {lastExtracted && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-black text-yellow-300 font-bold uppercase text-[10px]">
                    Action: {lastExtracted.action}
                  </span>
                  {lastExtracted.targetId && (
                    <span className="px-2 py-0.5 rounded bg-yellow-400 text-black font-black font-mono text-[10px]">
                      ID #{lastExtracted.targetId}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                    👤 {lastExtracted.name}
                  </span>
                  {lastExtracted.newName && (
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold">
                      &rarr; New Name: {lastExtracted.newName}
                    </span>
                  )}
                  {lastExtracted.amount !== null && (
                    <span className={`px-2 py-0.5 rounded font-bold font-mono ${
                      lastExtracted.action === 'SUBTRACT'
                        ? 'bg-rose-100 text-rose-900'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {lastExtracted.action === 'SUBTRACT' ? '-' : '+'}₹{lastExtracted.amount}
                    </span>
                  )}
                  {lastExtracted.dueDate && lastExtracted.dueDate !== 'Not Specified' && (
                    <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 font-bold">
                      📅 {lastExtracted.dueDate}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded bg-yellow-300 text-black font-bold text-[10px] flex items-center space-x-1">
                    <Zap className="w-2.5 h-2.5 fill-black" />
                    <span>{lastExtracted.engine || 'Groq AI'} ({lastExtracted.latencyMs || 140}ms)</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Direct 1-Click Test Prompts for Each Voice CRUD Operation */}
          <div className="pt-1">
            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1.5">
              1-Click Voice CRUD Test Chips:
            </span>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {/* 1. Add by ID */}
              <button
                type="button"
                onClick={() => handleQuickCommand('add 20rs to id number 1')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-semibold transition-all shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3 h-3 text-emerald-600" />
                <span>"add 20rs to id number 1"</span>
              </button>

              {/* 2. Add / Edit Due Date to ID without changing amount */}
              <button
                type="button"
                onClick={() => handleQuickCommand('add 31 november to id number 2')}
                className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-900 font-semibold transition-all shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <Calendar className="w-3 h-3 text-sky-600" />
                <span>"add 31 november to id number 2"</span>
              </button>

              {/* 3. Add to Name */}
              <button
                type="button"
                onClick={() => handleQuickCommand('add 20rs to nitish')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-semibold transition-all shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3 h-3 text-emerald-600" />
                <span>"add 20rs to nitish"</span>
              </button>

              {/* 4. Subtract from ID */}
              <button
                type="button"
                onClick={() => handleQuickCommand('remove 20rs from id number 1')}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold transition-all shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <MinusCircle className="w-3 h-3 text-amber-600" />
                <span>"remove 20rs from id number 1"</span>
              </button>

              {/* 5. Rename Person */}
              <button
                type="button"
                onClick={() => handleQuickCommand('change name from nitish to vikas')}
                className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-900 font-semibold transition-all shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <Edit3 className="w-3 h-3 text-purple-600" />
                <span>"change name from nitish to vikas"</span>
              </button>

              {/* 6. Complete Remove */}
              <button
                type="button"
                onClick={() => handleQuickCommand('remove the complete number from nitish remove the person totally from the list')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 font-semibold transition-all shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <XCircle className="w-3 h-3 text-rose-600" />
                <span>"remove nitish totally from list"</span>
              </button>
            </div>
          </div>
        </div>

        {/* CUSTOMER LEDGER TABLE */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/50">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-black font-['Outfit']">
                Customer Ledger Table
              </h3>
              <span className="text-[10px] font-bold text-black bg-yellow-300 px-2 py-0.5 rounded-full border border-yellow-400">
                {filteredList.length} Customers
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by customer or due date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs text-black focus:border-yellow-400 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/70 text-neutral-600 font-semibold uppercase text-[10px] tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4 w-16"># ID</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Total Amount Due</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-neutral-400">
                      No Khata records found. Tap the small microphone above to record an entry!
                    </td>
                  </tr>
                ) : (
                  filteredList.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-neutral-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black font-mono bg-yellow-300 text-black border border-yellow-400 shadow-xs">
                          #{customer.idNumber}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-black text-yellow-300 flex items-center justify-center font-bold text-xs border border-yellow-400">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-black group-hover:text-amber-600 transition-colors">
                              {customer.name}
                            </span>
                            <span className="block text-[10px] text-neutral-500 font-mono">
                              ID: #{customer.idNumber} &bull; {customer.history.length} transactions
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-sm font-black text-neutral-900 flex items-center">
                          <span className="text-amber-600 mr-0.5">₹</span>
                          <span className={customer.totalAmount > 0 ? 'text-black font-extrabold' : 'text-neutral-400'}>
                            {customer.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5 font-medium text-neutral-700">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          <span>{customer.dueDate}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                            customer.totalAmount === 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {customer.totalAmount === 0 ? 'Settled' : 'Pending'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-neutral-600 text-[11px]">
                        {customer.lastUpdated}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedCustomerHistory(customer)}
                            className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black transition-colors"
                            title="View Audit Logs"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {customer.totalAmount > 0 && (
                            <button
                              onClick={() => handleSettle(customer.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                              title="Mark as fully settled"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Settle</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(customer.id, customer.name)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors"
                            title="Delete customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* GROQ CONFIGURATION MODAL */}
        {isGroqModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-sm">
                    <Zap className="w-5 h-5 fill-black" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black font-['Outfit'] text-base">
                      Groq Cloud AI (Voice CRUD)
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Powered by Groq LPUs for sub-200ms voice CRUD operations
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGroqModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-black"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {backendGroqStatus && backendGroqStatus.active && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between">
                    <div>
                      <span className="font-bold block">✓ Connected to Server (.env)</span>
                      <span className="text-[10px] text-emerald-700">Key: {backendGroqStatus.keyPreview}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold text-[10px]">Active</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-neutral-700 font-bold">
                      Override Groq API Key (Optional)
                    </label>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-600 hover:underline flex items-center space-x-0.5 text-[11px] font-semibold"
                    >
                      <span>Get Free Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="password"
                    placeholder="gsk_..."
                    value={tempKeyInput}
                    onChange={(e) => setTempKeyInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-black font-mono text-xs focus:border-yellow-400 outline-none"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Groq provides a 100% free tier with 30 requests/min and near-instant (&lt;200ms) execution speed.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  <strong>⚡ Voice CRUD Capabilities:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li><strong>Add</strong>: "add 20rs to nitish due 30 nov"</li>
                    <li><strong>Subtract</strong>: "remove 20rs from nitish"</li>
                    <li><strong>Rename</strong>: "change name from nitish to vikas"</li>
                    <li><strong>Delete</strong>: "remove nitish totally from the list"</li>
                  </ul>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 flex justify-end space-x-2">
                <button
                  onClick={() => setIsGroqModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-semibold hover:bg-neutral-200"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveGroqKey}
                  className="gold-button-gradient px-4 py-2 rounded-xl text-black text-xs font-bold border border-yellow-400 shadow-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMER HISTORY AUDIT MODAL */}
        {selectedCustomerHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-black text-yellow-300 flex items-center justify-center font-bold text-sm border-2 border-yellow-400">
                    {selectedCustomerHistory.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-black font-['Outfit'] text-base">
                      {selectedCustomerHistory.name}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Total Due: <strong className="text-black font-mono">₹{selectedCustomerHistory.totalAmount}</strong> • Due: {selectedCustomerHistory.dueDate}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomerHistory(null)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-black"
                >
                  ✕
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                  Transaction Audit History
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedCustomerHistory.history.map((h, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium text-black block">{h.note}</span>
                        <span className="text-[10px] text-neutral-600">{h.date}</span>
                      </div>
                      <span className={`font-mono font-bold text-sm ${h.amount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {h.amount > 0 ? `+₹${h.amount}` : `₹${h.amount}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 flex justify-end">
                <button
                  onClick={() => setSelectedCustomerHistory(null)}
                  className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
