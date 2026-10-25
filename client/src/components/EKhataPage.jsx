import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Loader2,
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
  VolumeX,
  Radio,
  Settings2,
  Zap,
  Check,
  ExternalLink,
  Cpu,
  UserCheck,
  Edit3,
  MinusCircle,
  XCircle,
  X,
  Phone,
  CreditCard,
  Send,
  UserPlus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { parseLocalSmartIntent, parseWithGroqAI, checkGroqStatus } from '../services/voiceParser';
import { useBodyScrollLock } from '../services/useBodyScrollLock';
import { speechService } from '../services/speechSynthesis';
import { syncEKhataListToDb, loadUserDataFromDb } from '../services/api';
import { deduplicateEKhataCustomers } from '../services/expenseSync';

function WhatsAppIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export default function EKhataPage() {
  // Customer Khata Ledger
  const [khataList, setKhataList] = useState(() => {
    const saved = localStorage.getItem('aurum_ekhata_data') || localStorage.getItem('aurum_ekhata_customers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return deduplicateEKhataCustomers(parsed);
        }
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  // Groq Connectivity State
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('ekhata_groq_key') || '');
  const [backendGroqStatus, setBackendGroqStatus] = useState(null);

  // Voice recognition & Voice-To-Speech synthesis states
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [lastExtracted, setLastExtracted] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
  const [manualText, setManualText] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editTab, setEditTab] = useState('TXN'); // 'TXN' or 'DETAILS'

  // Voice Engine & Audible Voice-To-Speech Settings
  const [voiceLanguage, setVoiceLanguage] = useState(() => localStorage.getItem('aurum_voice_lang') || 'en-IN'); // 'en-IN', 'hi-IN', 'kn-IN'
  const [isSpeechOutputEnabled, setIsSpeechOutputEnabled] = useState(() => speechService.getIsEnabled());
  const [isSpeechSpeaking, setIsSpeechSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  // Transaction states for simple New Transaction modal
  const [newTxType, setNewTxType] = useState('ADD'); // 'ADD' or 'PAY'
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxNote, setNewTxNote] = useState('');

  // Add New Customer Modal states
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  // Expandable customer leaderboard dropdown state
  const [expandedCustomerIds, setExpandedCustomerIds] = useState(new Set());

  const toggleCustomerDropdown = (id) => {
    setExpandedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Lock body scroll when any modal is open in eKhata
  useBodyScrollLock(Boolean(selectedCustomerHistory || editingCustomer || isAddCustomerModalOpen));
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    amount: '',
    dueDate: '30 November',
    note: 'Initial credit balance',
    notifyImmediately: false,
  });
  const [isDictatingCustomer, setIsDictatingCustomer] = useState(false);

  const recognitionRef = useRef(null);
  const modalRecognitionRef = useRef(null);
  const khataListRef = useRef(khataList);
  const isListeningRef = useRef(false);
  const isHoldingRef = useRef(false);
  const holdStartTimeRef = useRef(0);
  const accumulatedTranscriptRef = useRef('');
  const hasParsedThisSessionRef = useRef(false);

  // Keep khataListRef synchronized without causing recognition re-initialization
  useEffect(() => {
    khataListRef.current = khataList;
  }, [khataList]);

  // Persist Voice Settings
  useEffect(() => {
    localStorage.setItem('aurum_voice_lang', voiceLanguage);
  }, [voiceLanguage]);

  // Listen to Audible Speech Synthesis events
  useEffect(() => {
    const handleSpeaking = () => setIsSpeechSpeaking(true);
    const handleEnded = () => setIsSpeechSpeaking(false);
    const handleToggle = () => setIsSpeechOutputEnabled(speechService.getIsEnabled());

    window.addEventListener('aurum_tts_speaking', handleSpeaking);
    window.addEventListener('aurum_tts_ended', handleEnded);
    window.addEventListener('aurum_tts_toggle_updated', handleToggle);

    return () => {
      window.removeEventListener('aurum_tts_speaking', handleSpeaking);
      window.removeEventListener('aurum_tts_ended', handleEnded);
      window.removeEventListener('aurum_tts_toggle_updated', handleToggle);
    };
  }, []);

  // Check backend Groq status on mount
  useEffect(() => {
    checkGroqStatus().then((status) => {
      setBackendGroqStatus(status);
    });
  }, []);

  const isInitialMountRef = useRef(true);
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  // On mount: ALWAYS ensure fresh eKhata data is fetched from MongoDB Atlas
  useEffect(() => {
    let isCancelled = false;
    async function loadDb() {
      setIsLoadingDb(true);
      const data = await loadUserDataFromDb();
      if (!isCancelled && data && Array.isArray(data.ekhata)) {
        setKhataList(deduplicateEKhataCustomers(data.ekhata));
      }
      if (!isCancelled) setIsLoadingDb(false);
    }
    loadDb();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Listen to external updates (e.g. from MongoDB Atlas load or other tabs)
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('aurum_ekhata_data') || localStorage.getItem('aurum_ekhata_customers');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const clean = deduplicateEKhataCustomers(parsed);
            setKhataList((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(clean)) return prev;
              return clean;
            });
          }
        }
      } catch (e) {}
    };

    window.addEventListener('aurum_ekhata_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('aurum_ekhata_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Sync state to localStorage and MongoDB Atlas
  useEffect(() => {
    if (isLoadingDb || isInitialMountRef.current) {
      if (!isLoadingDb) isInitialMountRef.current = false;
      return;
    }
    const cleanList = deduplicateEKhataCustomers(khataList);
    const serialized = JSON.stringify(cleanList);
    if (localStorage.getItem('aurum_ekhata_data') !== serialized) {
      localStorage.setItem('aurum_ekhata_data', serialized);
      localStorage.setItem('aurum_ekhata_customers', serialized);
      window.dispatchEvent(new Event('aurum_ekhata_updated'));
      window.dispatchEvent(new Event('storage'));
    }
    syncEKhataListToDb(cleanList).catch(() => {});
  }, [khataList, isLoadingDb]);

  useEffect(() => {
    localStorage.setItem('ekhata_groq_key', groqKey);
  }, [groqKey]);

  // Fuzzy & Phonetic Name Similarity for Indian SMB Voice Transcripts
  const fuzzyNameScore = (nameA, nameB) => {
    if (!nameA || !nameB) return 0;
    const a = nameA.toLowerCase().trim();
    const b = nameB.toLowerCase().trim();
    if (a === b) return 1.0;
    if (a.includes(b) || b.includes(a)) return 0.88;

    // Transliteration backbone: sh->s, ee->i, oo->u, v->w, ph->f, th->t, strip vowels
    const backbone = (s) =>
      s
        .replace(/sh/g, 's')
        .replace(/ee/g, 'i')
        .replace(/oo/g, 'u')
        .replace(/v/g, 'w')
        .replace(/ph/g, 'f')
        .replace(/th/g, 't')
        .replace(/[aeiou]/g, '');

    if (backbone(a) === backbone(b) && backbone(a).length >= 2) return 0.95;

    // Levenshtein
    const lenA = a.length;
    const lenB = b.length;
    const dp = Array.from({ length: lenA + 1 }, () => Array(lenB + 1).fill(0));
    for (let i = 0; i <= lenA; i++) dp[i][0] = i;
    for (let j = 0; j <= lenB; j++) dp[0][j] = j;

    for (let i = 1; i <= lenA; i++) {
      for (let j = 1; j <= lenB; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }

    const dist = dp[lenA][lenB];
    return 1 - dist / Math.max(lenA, lenB);
  };

  // Native Web Speech API recognition (Simple, fast, reliable parsing)
  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceLanguage || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        hasParsedThisSessionRef.current = false;
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentSpoken = (final + interim).trim();
        accumulatedTranscriptRef.current = currentSpoken;
        if (currentSpoken) {
          setLiveTranscript(currentSpoken);
          setVoiceTranscript(`"${currentSpoken}"`);
          setManualText(currentSpoken);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition warning:', event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
        if (!hasParsedThisSessionRef.current && accumulatedTranscriptRef.current && accumulatedTranscriptRef.current.trim()) {
          const textToParse = accumulatedTranscriptRef.current.trim();
          hasParsedThisSessionRef.current = true;
          accumulatedTranscriptRef.current = '';
          handleExecuteVoiceCommand(textToParse);
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition init error:', err);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [voiceLanguage]);

  // Push-to-Talk Hold Handlers (Listen while holding, parse immediately upon release)
  const handleHoldStart = (e) => {
    if (isProcessing) return;
    isHoldingRef.current = true;
    holdStartTimeRef.current = Date.now();
    hasParsedThisSessionRef.current = false;
    accumulatedTranscriptRef.current = '';
    setLiveTranscript('');

    if (!recognitionRef.current) {
      showFeedback('Speech Recognition is supported in Chrome, Edge, and Safari.', 'warning');
      return;
    }

    try {
      if (!isListeningRef.current) {
        recognitionRef.current.lang = voiceLanguage || 'en-IN';
        recognitionRef.current.start();
      }
    } catch (err) {
      console.warn('Recognition start error:', err);
    }
  };

  const handleHoldEnd = (e) => {
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;

    // Small delay to capture trailing words before stopping
    setTimeout(() => {
      if (recognitionRef.current && isListeningRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      } else if (!hasParsedThisSessionRef.current && accumulatedTranscriptRef.current && accumulatedTranscriptRef.current.trim()) {
        const textToParse = accumulatedTranscriptRef.current.trim();
        hasParsedThisSessionRef.current = true;
        accumulatedTranscriptRef.current = '';
        handleExecuteVoiceCommand(textToParse);
      }
    }, 180);
  };

  // Click/Tap toggle handler for 1-tap mic operation
  const handleClickMic = () => {
    if (isProcessing) return;

    if (!recognitionRef.current) {
      showFeedback('Speech Recognition is supported in Chrome, Edge, and Safari.', 'warning');
      return;
    }

    if (isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    } else {
      accumulatedTranscriptRef.current = '';
      hasParsedThisSessionRef.current = false;
      setLiveTranscript('');
      try {
        recognitionRef.current.lang = voiceLanguage || 'en-IN';
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const handleClickMicRef = useRef(handleClickMic);
  handleClickMicRef.current = handleClickMic;

  // Keyboard shortcut for mic on/off (Spacebar or Alt+M or Ctrl+M or 'M')
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Alt+M, Ctrl+M, or Meta+M shortcut (works globally anywhere)
      if ((e.altKey || e.ctrlKey || e.metaKey) && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        if (handleClickMicRef.current) handleClickMicRef.current();
        return;
      }

      // Check if typing inside input, textarea, or contentEditable
      const activeEl = document.activeElement;
      const tag = activeEl?.tagName?.toLowerCase();
      const isTyping =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        activeEl?.isContentEditable;

      // 2. Spacebar or 'm'/'M' key (works when not actively typing in an input field)
      if (!isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.code === 'Space' || e.key === ' ' || e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          if (handleClickMicRef.current) handleClickMicRef.current();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleSpeechOutput = () => {
    const next = !isSpeechOutputEnabled;
    speechService.setIsEnabled(next);
    setIsSpeechOutputEnabled(next);
    if (!next) {
      speechService.stop();
    } else {
      speechService.speak('Voice speech feedback enabled.', { lang: voiceLanguage });
    }
  };

  const showFeedback = (msg, type = 'success', actionLink = null) => {
    setFeedbackMessage({ text: msg, type, actionLink });
    setTimeout(() => setFeedbackMessage(null), 6000);
  };

  // Main Execution with Groq Voice CRUD Pipeline (Context-Aware with currentCustomers)
  const handleExecuteVoiceCommand = async (rawText) => {
    if (!rawText || !rawText.trim()) return;
    setIsProcessing(true);

    try {
      const parsed = await parseWithGroqAI({
        text: rawText,
        apiKey: groqKey,
        currentCustomers: khataListRef.current || khataList,
      });

      if (!parsed || (!parsed.name && parsed.targetId === null && parsed.targetId === undefined)) {
        setLastExtracted(null);
        showFeedback(
          `Could not identify customer name or ID from: "${rawText}". Please mention the person name or ID number!`,
          'error'
        );
        return;
      }

      setLastExtracted(parsed);
      handleVoiceCrudOperation(parsed, rawText);
    } catch (err) {
      console.error('Voice execution error:', err);
      showFeedback(`Processing error: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // FULL VOICE CRUD OPERATOR (Supports Customer Names, ID Numbers, & Phonetic Fuzzy Matches)
  const handleVoiceCrudOperation = (parsed, rawText) => {
    const { action, targetId, name, newName, amount, dueDate, isCompleteRemove, engine } = parsed;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = `Today at ${timestamp}`;
    const engineLabel = engine || 'Groq AI';

    setKhataList((prevList) => {
      // Find existing customer by targetId, name, or phonetic fuzzy match
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

      // 3. Exact name match (case-insensitive + trimmed)
      if (existingIndex === -1 && name) {
        const targetClean = name.trim().toLowerCase();
        existingIndex = prevList.findIndex(
          (c) => c.name && c.name.trim().toLowerCase() === targetClean
        );
      }

      // 4. Phonetic & Fuzzy similarity match (e.g. Nitish vs Nitesh, Vikas vs Vikash, Rahul vs Rahul Sharma)
      if (existingIndex === -1 && name && name.length >= 3) {
        let bestScore = 0;
        let bestIdx = -1;
        for (let i = 0; i < prevList.length; i++) {
          const score = fuzzyNameScore(prevList[i].name, name);
          if (score > bestScore && score >= 0.72) {
            bestScore = score;
            bestIdx = i;
          }
        }
        if (bestIdx !== -1) {
          existingIndex = bestIdx;
        }
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
        speechService.speakCrudConfirmation({
          action: 'DELETE',
          name: existing.name,
          lang: voiceLanguage,
        });
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
        speechService.speakCrudConfirmation({
          action: 'RENAME',
          oldName: existing.name,
          newName,
          lang: voiceLanguage,
        });
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
        speechService.speakCrudConfirmation({
          action: 'SUBTRACT',
          name: existing.name,
          amount: deductVal,
          totalAmount: newTotal,
          lang: voiceLanguage,
        });
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
        speechService.speakCrudConfirmation({
          action: 'SETTLE',
          name: existing.name,
          lang: voiceLanguage,
        });
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
        speechService.speakCrudConfirmation({
          action: 'UPDATE_DUE_DATE',
          name: existing.name,
          dueDate,
          totalAmount: existing.totalAmount,
          lang: voiceLanguage,
        });
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
        speechService.speakCrudConfirmation({
          action: 'ADD',
          name: existing.name,
          amount: addVal,
          totalAmount: updatedTotal,
          dueDate: newDueDate,
          lang: voiceLanguage,
        });
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
        speechService.speakCrudConfirmation({
          action: 'ADD',
          name: customerName,
          amount: addVal,
          totalAmount: addVal,
          dueDate: dueDate || 'Not Specified',
          lang: voiceLanguage,
        });
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
    const cust = khataList.find((c) => c.id === id);
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
    if (cust) {
      speechService.speakCrudConfirmation({
        action: 'SETTLE',
        name: cust.name,
        lang: voiceLanguage,
      });
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete ${name}'s Khata record?`)) {
      setKhataList((prev) => prev.filter((c) => c.id !== id));
      showFeedback(`Removed ${name} from Khata`, 'warning');
      speechService.speakCrudConfirmation({
        action: 'DELETE',
        name,
        lang: voiceLanguage,
      });
    }
  };


  const normalizeSpokenNumbers = (str) => {
    if (!str) return '';
    const wordMap = {
      zero: '0',
      one: '1',
      two: '2',
      three: '3',
      four: '4',
      five: '5',
      six: '6',
      seven: '7',
      eight: '8',
      nine: '9',
    };
    let result = str.toLowerCase();
    Object.keys(wordMap).forEach((word) => {
      result = result.replace(new RegExp(`\\b${word}\\b`, 'g'), wordMap[word]);
    });
    return result;
  };

  const cleanPhoneNumber = (rawPhone) => {
    if (!rawPhone || rawPhone === 'Not Added') return '';
    const digits = rawPhone.replace(/[^0-9]/g, '');
    if (digits.length === 10) return `91${digits}`; // Prepend 91 for 10-digit Indian numbers
    if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`;
    return digits;
  };

  const sendWhatsAppMessage = (customer) => {
    const cleanPhone = cleanPhoneNumber(customer.phone);
    if (!cleanPhone) {
      showFeedback(`Please add a valid phone number for ${customer.name}.`, 'error');
      return;
    }

    // Read merchant UPI ID & store name from profile
    let merchantUpi = 'vikas.kori@okhdfcbank';
    let storeName = 'FinSafe / Zenniths Enterprise';
    try {
      const savedProfile = localStorage.getItem('aurum_profile_info');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.upiId) merchantUpi = parsed.upiId;
        if (parsed.businessName) storeName = parsed.businessName;
      }
    } catch (e) {}

    const messageText = `Namaste ${customer.name} ji, 🙏

This is a payment due reminder from *${storeName}*.

📋 *eKhata Outstanding Balance Details*:
• *Customer Name*: ${customer.name}
• *Customer ID*: #${customer.idNumber}
• *Total Due Amount*: ₹${Number(customer.totalAmount).toLocaleString('en-IN')}
• *Due Date*: ${customer.dueDate || 'Immediate'}
• *Payment Status*: Pending

💳 *Easy Payment via UPI*:
• *Merchant UPI ID*: *${merchantUpi}*
• *Pay via GPay / PhonePe / Paytm*: Send ₹${customer.totalAmount} to *${merchantUpi}*
• *Direct UPI Link*: upi://pay?pa=${merchantUpi}&pn=${encodeURIComponent(storeName)}&am=${customer.totalAmount}&cu=INR

Kindly clear your pending balance at your earliest convenience. Once paid, please reply with the payment confirmation.

Thank you for your business! 🙏
*- ${storeName} / eKhata Ledger*`;

    const encoded = encodeURIComponent(messageText);

    // Direct WhatsApp desktop / mobile app protocol
    const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;
    // Universal web link fallback (only opened when user clicks fallback link)
    const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;

    // Direct app trigger via hidden anchor targeting WhatsApp application directly
    const a = document.createElement('a');
    a.href = appUrl;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
    }, 500);

    showFeedback(
      `🚀 Fetching WhatsApp application for ${customer.name} with UPI: ${merchantUpi}!`,
      'success',
      { url: webUrl, label: 'Open in WhatsApp Web' }
    );
  };

  const handleWhatsAppNotify = (customer) => {
    const clean = cleanPhoneNumber(customer.phone);
    if (!clean) {
      setEditingCustomer({
        ...customer,
        _sendWhatsAppAfterSave: true,
      });
      showFeedback(`Please add a phone number for ${customer.name} to send WhatsApp reminder.`, 'warning');
      return;
    }
    sendWhatsAppMessage(customer);
  };

  const handleSaveCustomer = (e) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name.trim()) return;

    const rawPhone = (editingCustomer.phone || '').trim();
    const phoneDigits = rawPhone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length !== 10) {
      showFeedback('Mobile number must be exactly 10 digits.', 'error');
      return;
    }

    const dateStr = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const updatedPhone = phoneDigits;
    const updatedDueDate = editingCustomer.dueDate?.trim() || 'Not Specified';
    const updatedAmount = Number(editingCustomer.totalAmount) || 0;

    const updatedCustomer = {
      ...editingCustomer,
      name: editingCustomer.name.trim(),
      phone: updatedPhone,
      dueDate: updatedDueDate,
      totalAmount: updatedAmount,
      status: updatedAmount === 0 ? 'Settled' : 'Pending',
      lastUpdated: dateStr,
      history: [
        {
          amount: 0,
          date: dateStr,
          note: `Customer details updated (Phone: ${updatedPhone}, Due: ${updatedDueDate})`,
        },
        ...editingCustomer.history,
      ],
    };

    setKhataList((prev) =>
      prev.map((c) => (c.id === editingCustomer.id ? updatedCustomer : c))
    );

    const shouldSend = editingCustomer._sendWhatsAppAfterSave;
    setEditingCustomer(null);
    showFeedback(`Updated details for ${updatedCustomer.name}!`, 'success');

    if (shouldSend) {
      sendWhatsAppMessage(updatedCustomer);
    }
  };

  // Simple New Transaction handler
  const handleSaveSimpleTransaction = (e) => {
    if (e) e.preventDefault();
    if (!editingCustomer) return;

    const val = Number(newTxAmount);
    if (!val || val <= 0) {
      showFeedback('Please enter a valid transaction amount greater than ₹0.', 'error');
      return;
    }

    const isCredit = newTxType === 'ADD';
    const updatedTotal = isCredit
      ? editingCustomer.totalAmount + val
      : Math.max(0, editingCustomer.totalAmount - val);

    const dateStr = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const noteText = newTxNote.trim() || (isCredit ? `+₹${val} credit added` : `-₹${val} payment received`);

    const newHistoryEntry = {
      amount: isCredit ? val : -val,
      date: dateStr,
      note: noteText,
    };

    const updatedCustomer = {
      ...editingCustomer,
      totalAmount: updatedTotal,
      status: updatedTotal === 0 ? 'Settled' : 'Pending',
      lastUpdated: dateStr,
      history: [newHistoryEntry, ...(editingCustomer.history || [])],
    };

    setKhataList((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );

    setEditingCustomer(null);
    setNewTxAmount('');
    setNewTxNote('');
    showFeedback(
      `Recorded ${isCredit ? `+₹${val}` : `-₹${val}`} transaction for ${updatedCustomer.name}! New Total Due: ₹${updatedTotal.toLocaleString()}`,
      'success'
    );
  };

  // Voice dictation for Add Customer modal (Whisper Turbo & Web Speech supported)
  const handleDictateNewCustomer = async () => {
    const processTranscriptText = (rawTranscript) => {
      const normalized = normalizeSpokenNumbers(rawTranscript);
      showFeedback(`🎙️ Heard: "${rawTranscript}"`, 'info');

      // 1. Extract phone number (standard 10 digits)
      let phoneFound = '';
      const phoneMatch = normalized.match(/(?:\+?91[\s-]?)?([6-9]\d{9})/);
      if (phoneMatch) {
        phoneFound = phoneMatch[1];
      } else {
        const spacedDigits = normalized.match(/\b(?:\d[\s-]?){10}\b/);
        if (spacedDigits) {
          const clean = spacedDigits[0].replace(/[\s-]/g, '');
          phoneFound = clean.slice(0, 10);
        }
      }

      // 2. Extract amount
      let amountFound = '';
      const amountMatch = normalized.match(/(?:rs\.?|rupees|amount|₹|balance)?\s*(\d+)\s*(?:rs\.?|rupees)?/i);
      if (amountMatch) {
        amountFound = amountMatch[1];
      }

      // 3. Extract due date
      let dueFound = '';
      const dueMatch = normalized.match(/(?:due\s*(?:date)?|on|by|before)\s*(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|nov|dec|jan|feb|mar|apr|may|jun|jul|aug|sep|oct))/i);
      if (dueMatch) {
        dueFound = dueMatch[1];
      } else if (normalized.includes('tomorrow')) {
        dueFound = 'Tomorrow';
      } else if (normalized.includes('next week')) {
        dueFound = 'Next Week';
      }

      // 4. Extract customer name
      let nameFound = '';
      const nameMatch = normalized.match(/(?:customer|name|to|for|person|add)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);
      if (nameMatch) {
        nameFound = nameMatch[1].replace(/(?:phone|mobile|amount|due|date|rupees|rs|number|tomorrow)/gi, '').trim();
      } else {
        const words = rawTranscript.split(' ').filter((w) => !['add', 'new', 'customer', 'rs', 'rupees', 'due'].includes(w.toLowerCase()));
        if (words.length > 0 && isNaN(words[0])) {
          nameFound = words[0];
        }
      }

      const formattedName = nameFound ? nameFound.charAt(0).toUpperCase() + nameFound.slice(1) : '';

      setNewCustomerForm((prev) => ({
        ...prev,
        name: formattedName || prev.name,
        phone: phoneFound || prev.phone,
        amount: amountFound || prev.amount,
        dueDate: dueFound || prev.dueDate,
        note: `Voice created: "${rawTranscript}"`,
      }));

      showFeedback(`✅ Auto-filled from voice: "${rawTranscript}"! You can edit details manually and click Create.`, 'success');
      speechService.speak(
        `Recorded customer ${formattedName || 'details'} with ${amountFound || 0} rupees.`,
        { lang: voiceLanguage }
      );
    };

    if (isDictatingCustomer) {
      if (modalRecognitionRef.current) {
        try {
          modalRecognitionRef.current.stop();
        } catch (e) {}
      }
      setIsDictatingCustomer(false);
      return;
    }

    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    if (!SpeechRecognition) {
      showFeedback('Voice dictation is supported in Chrome, Edge, and Safari.', 'warning');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = voiceLanguage || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsDictatingCustomer(true);
        showFeedback('🎙️ Listening... Say e.g. "Customer Ramesh, phone 9876543210, amount 500, due 30 November"', 'info');
      };

      recognition.onresult = (event) => {
        setIsDictatingCustomer(false);
        if (event.results && event.results[0] && event.results[0][0]) {
          processTranscriptText(event.results[0][0].transcript);
        }
      };

      recognition.onerror = () => {
        setIsDictatingCustomer(false);
        showFeedback('Voice listening stopped. You can also enter details manually.', 'warning');
      };

      recognition.onend = () => {
        setIsDictatingCustomer(false);
      };

      modalRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsDictatingCustomer(false);
      showFeedback('Could not access microphone. Please check browser mic permissions.', 'error');
    }
  };

  // Create new customer manually / via voice
  const handleCreateNewCustomer = (e) => {
    e.preventDefault();
    const cleanName = newCustomerForm.name.trim();
    if (!cleanName) {
      showFeedback('Customer name is required.', 'error');
      return;
    }

    const rawPhone = (newCustomerForm.phone || '').trim();
    const phoneDigits = rawPhone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length !== 10) {
      showFeedback('Mobile number must be exactly 10 digits.', 'error');
      return;
    }

    const amountVal = Number(newCustomerForm.amount) || 0;
    const dateStr = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const shouldNotify = newCustomerForm.notifyImmediately;

    // Check if customer already exists by normalized name (case-insensitive + trimmed)
    const existingIndex = khataList.findIndex(
      (c) => c.name && c.name.trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (existingIndex !== -1) {
      const existing = khataList[existingIndex];
      const updatedTotal = existing.totalAmount + amountVal;
      const updatedList = [...khataList];
      const newDueDate = newCustomerForm.dueDate?.trim() && newCustomerForm.dueDate.trim() !== 'Not Specified'
        ? newCustomerForm.dueDate.trim()
        : existing.dueDate;
      const newPhone = phoneDigits;

      const updatedCustomer = {
        ...existing,
        totalAmount: updatedTotal,
        dueDate: newDueDate,
        phone: newPhone,
        status: updatedTotal === 0 ? 'Settled' : 'Pending',
        lastUpdated: dateStr,
        history: amountVal !== 0 ? [
          {
            amount: amountVal,
            date: dateStr,
            note: newCustomerForm.note.trim() || `Added ₹${amountVal} via Customer Form`,
          },
          ...(existing.history || []),
        ] : existing.history,
      };

      updatedList[existingIndex] = updatedCustomer;
      setKhataList(deduplicateEKhataCustomers(updatedList));
      setIsAddCustomerModalOpen(false);

      setNewCustomerForm({
        name: '',
        phone: '',
        amount: '',
        dueDate: '30 November',
        note: 'Initial credit balance',
        notifyImmediately: false,
      });

      showFeedback(`Customer #${existing.idNumber} (${existing.name}) already exists! Added ₹${amountVal.toLocaleString()} (New Balance: ₹${updatedTotal.toLocaleString()}).`, 'success');

      if (shouldNotify && updatedCustomer.phone && updatedCustomer.phone !== 'Not Added') {
        setTimeout(() => sendWhatsAppMessage(updatedCustomer), 300);
      }
      return;
    }

    const maxId = khataList.reduce((max, c) => Math.max(max, c.idNumber || 0), 0);
    const assignedIdNumber = maxId + 1;

    const newCustomer = {
      id: `cust-${Date.now()}`,
      idNumber: assignedIdNumber,
      name: cleanName,
      phone: phoneDigits,
      dueDate: newCustomerForm.dueDate.trim() || 'Not Specified',
      totalAmount: amountVal,
      status: amountVal === 0 ? 'Settled' : 'Pending',
      lastUpdated: dateStr,
      history: [
        {
          amount: amountVal,
          date: dateStr,
          note: newCustomerForm.note.trim() || 'Initial customer creation',
        },
      ],
    };

    setKhataList(deduplicateEKhataCustomers([newCustomer, ...khataList]));
    setIsAddCustomerModalOpen(false);

    setNewCustomerForm({
      name: '',
      phone: '',
      amount: '',
      dueDate: '30 November',
      note: 'Initial credit balance',
      notifyImmediately: false,
    });

    showFeedback(`✅ Successfully created Customer #${assignedIdNumber} (${newCustomer.name}) with ₹${amountVal.toLocaleString()} due!`, 'success');

    if (shouldNotify && newCustomer.phone && newCustomer.phone !== 'Not Added') {
      setTimeout(() => sendWhatsAppMessage(newCustomer), 300);
    }
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
  const totalTransactionsCount = khataList.reduce((acc, c) => acc + (c.history ? c.history.length : 0), 0);

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
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-300 flex items-center space-x-1.5 shadow-xs">
                <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                <span>⚡ AI Voice CRUD Active</span>
                <Check className="w-3 h-3 text-emerald-600" />
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-black font-['Outfit'] mt-1 tracking-tight">
              Customer Credit Ledger (e-Khata)
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Smart Voice Ledger: <strong>Add Amount</strong>, <strong>Remove/Subtract Amount</strong>, <strong>Rename Customer</strong>, or <strong>Delete Entry</strong>.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:space-x-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Total Outstanding
              </span>
              <div className="text-xl sm:text-2xl font-black text-black font-['Outfit']">
                ₹{totalOutstanding.toLocaleString()}
              </div>
            </div>

            <div className="flex-1 sm:flex-initial p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 block">
                Active Khata
              </span>
              <div className="text-xl sm:text-2xl font-black text-black font-['Outfit']">
                {khataList.filter((k) => k.totalAmount > 0).length}
              </div>
            </div>
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
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{feedbackMessage.text}</span>
            </div>
            {feedbackMessage.actionLink && (
              <a
                href={feedbackMessage.actionLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shrink-0 ml-3 transition-colors shadow-xs"
              >
                <span>{feedbackMessage.actionLink.label}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* COMPACT & MINIMAL VOICE CRUD MIC BAR */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {/* Minimal Round Mic Button */}
            <button
              type="button"
              onMouseDown={handleHoldStart}
              onMouseUp={handleHoldEnd}
              onMouseLeave={handleHoldEnd}
              onTouchStart={handleHoldStart}
              onTouchEnd={handleHoldEnd}
              onTouchCancel={handleHoldEnd}
              onClick={handleClickMic}
              onContextMenu={(e) => e.preventDefault()}
              disabled={isProcessing}
              className={`relative w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer focus:outline-none select-none ${
                isListening
                  ? 'bg-yellow-400 text-black scale-105 shadow-md shadow-yellow-400/50 ring-2 ring-yellow-300'
                  : isProcessing
                  ? 'bg-neutral-800 text-amber-400 cursor-not-allowed opacity-80'
                  : 'bg-neutral-800 text-yellow-300 hover:text-yellow-200 hover:bg-neutral-700 hover:scale-105 border border-yellow-400/40'
              }`}
              title="Hold to speak (or tap to toggle). Shortcut: Spacebar or Alt+M"
              aria-label="Voice microphone (Shortcut: Space or Alt+M)"
            >
              {isListening && (
                <span className="absolute -inset-1 rounded-full bg-yellow-400/30 animate-ping pointer-events-none" />
              )}
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
              ) : (
                <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse text-black' : 'text-yellow-300'}`} />
              )}
            </button>

            {/* Status / Instructions / Live transcript */}
            <div className="min-w-0 flex-1">
              {isListening ? (
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <span className="text-xs font-bold text-yellow-300">
                      Listening... Release or tap when done
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-yellow-400 text-black border border-yellow-500 animate-pulse">
                      Space / Alt+M to stop
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300 font-mono truncate">
                    {liveTranscript ? `"${liveTranscript}"` : 'Listening for your voice...'}
                  </p>
                </div>
              ) : isProcessing ? (
                <div className="flex items-center space-x-1.5 text-xs text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                  <span className="font-semibold">Parsing voice command with AI...</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">Hold or tap mic to speak</span>
                    <span className="text-[10px] text-neutral-400 hidden md:inline">· Voice CRUD</span>
                    <span
                      className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-neutral-800 text-yellow-300 border border-neutral-700 shadow-2xs"
                      title="Shortcut key: Press Space or Alt+M to toggle mic ON/OFF"
                    >
                      <span className="text-neutral-400">Shortcut:</span>
                      <kbd className="text-white bg-neutral-900 px-1 py-0.2 rounded border border-neutral-700">Space</kbd>
                      <span>/</span>
                      <kbd className="text-white bg-neutral-900 px-1 py-0.2 rounded border border-neutral-700">Alt+M</kbd>
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate">
                    e.g. &ldquo;Add 500 to Ramesh&rdquo; · &ldquo;Remove 200 from ID 1&rdquo; · &ldquo;Delete Nitish&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Transcript / Last Action Badge */}
          {voiceTranscript && (
            <div className="flex items-center space-x-2 bg-neutral-950/80 border border-neutral-800 px-3 py-1.5 rounded-xl text-xs max-w-full sm:max-w-md shrink-0">
              <span className="text-[10px] font-bold uppercase text-amber-400 shrink-0">Heard:</span>
              <span className="font-mono text-white text-[11px] truncate max-w-40 sm:max-w-50">
                {voiceTranscript}
              </span>
              {lastExtracted && lastExtracted.action && (lastExtracted.name || lastExtracted.targetId) && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] shrink-0">
                  ✓ {lastExtracted.action} {lastExtracted.name || `#${lastExtracted.targetId}`} {lastExtracted.amount ? `₹${lastExtracted.amount}` : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* CUSTOMER LEDGER & LEADERBOARD SECTION */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
          {/* Professional Header with Total Transactions & Customer Count */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/70">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-black font-['Outfit'] tracking-tight">
                Customer Credit Leaderboard
              </h3>
              <span className="text-[10px] font-black text-black bg-yellow-300 px-2 py-0.5 rounded-full border border-yellow-400 shadow-2xs">
                {filteredList.length} Customers
              </span>
              <span className="text-[10px] font-extrabold text-amber-950 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs flex items-center space-x-1">
                <span>📋</span>
                <span>Total Transactions: {totalTransactionsCount}</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                <input
                  type="text"
                  placeholder="Search customer, ID, or due date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 sm:py-1.5 rounded-xl bg-white border border-neutral-200 text-sm sm:text-xs text-black focus:border-yellow-400 outline-none"
                />
              </div>

              {/* + Add Customer Button */}
              <button
                type="button"
                onClick={() => setIsAddCustomerModalOpen(true)}
                className="gold-button-gradient px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold text-black border border-yellow-400 flex items-center justify-center space-x-1.5 shrink-0 shadow-xs cursor-pointer hover:scale-[1.02] transition-transform min-h-11 sm:min-h-0"
                title="Add New Customer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Add Customer</span>
                <span className="p-0.5 rounded bg-black/10">
                  <Mic className="w-3 h-3 text-black" />
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Stacked Card View (< md) with Dropdown Button */}
          <div className="block md:hidden p-3 sm:p-4 space-y-2.5">
            {filteredList.length === 0 ? (
              <div className="py-10 text-center text-neutral-400 text-xs bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200 p-4">
                No Khata records found. Tap the microphone above or the yellow + button to record an entry!
              </div>
            ) : (
              filteredList.map((customer) => {
                const isExpanded = expandedCustomerIds.has(customer.id);
                return (
                  <div
                    key={customer.id}
                    className="p-3.5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2.5 transition-all"
                  >
                    {/* Clean Main Display: Only Necessary Info (No Mobile Number!) */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-black text-yellow-300 flex items-center justify-center font-black text-xs border border-yellow-400 shrink-0">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-black text-sm truncate">{customer.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-black font-mono bg-yellow-300 text-black border border-yellow-400 shrink-0">
                              #{customer.idNumber}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <div className="text-right">
                          <div className="font-mono text-sm font-black text-neutral-900">
                            <span className="text-amber-600 mr-0.5">₹</span>
                            <span className={customer.totalAmount > 0 ? 'text-black font-extrabold' : 'text-neutral-400'}>
                              {customer.totalAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border shrink-0 ${
                            customer.totalAmount === 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {customer.totalAmount === 0 ? 'Settled' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar: Settle, Notify, Delete visible + Details dropdown button */}
                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-neutral-100">
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleWhatsAppNotify(customer)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center space-x-1 transition-all shadow-2xs cursor-pointer"
                          title={`Send WhatsApp reminder to ${customer.name}`}
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Notify</span>
                        </button>

                        {customer.totalAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSettle(customer.id)}
                            className="px-2 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                            title="Mark settled"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Settle</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(customer.id, customer.name)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete customer"
                          aria-label="Delete customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Dropdown Button for Other Details */}
                      <button
                        type="button"
                        onClick={() => toggleCustomerDropdown(customer.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center space-x-1 transition-all cursor-pointer ${
                          isExpanded
                            ? 'bg-black text-yellow-300 border-black'
                            : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                        }`}
                      >
                        <span className="text-[11px]">{isExpanded ? 'Less' : 'Details'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Expandable Details Drawer for Other Details */}
                    {isExpanded && (
                      <div className="pt-2.5 border-t border-neutral-100 space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-xs text-neutral-600 bg-neutral-50/70 p-2 rounded-xl">
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-[11px] font-medium">Due: <strong>{customer.dueDate || 'Not Specified'}</strong></span>
                          </div>
                          <span className="text-[10px] text-neutral-400">{customer.lastUpdated}</span>
                        </div>

                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer({ ...customer });
                              setEditTab('TXN');
                              setNewTxType('ADD');
                              setNewTxAmount('');
                              setNewTxNote('');
                            }}
                            className="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer shadow-2xs"
                            style={{
                              backgroundColor: '#3D2E18',
                              color: '#F9DEBF',
                            }}
                            title={`Edit ${customer.name} & Transactions`}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Customer & Txns</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedCustomerHistory(customer)}
                            className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                            title="Audit History"
                            aria-label="Audit History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop/Tablet Table View (md and up) with Dropdown Button */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/70 text-neutral-600 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3.5 px-4 w-16"># ID</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Total Amount Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Transactions</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-neutral-400">
                      No Khata records found. Tap the microphone above to record an entry!
                    </td>
                  </tr>
                ) : (
                  filteredList.map((customer) => {
                    const isExpanded = expandedCustomerIds.has(customer.id);
                    return (
                      <React.Fragment key={customer.id}>
                        {/* Primary Row: Essential Info Only (NO Mobile Number!) */}
                        <tr className={`hover:bg-neutral-50/80 transition-colors group ${isExpanded ? 'bg-amber-50/20' : ''}`}>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black font-mono bg-yellow-300 text-black border border-yellow-400 shadow-2xs">
                              #{customer.idNumber}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-black text-yellow-300 flex items-center justify-center font-bold text-xs border border-yellow-400 shrink-0">
                                {customer.name.charAt(0)}
                              </div>
                              <span className="font-bold text-black text-sm group-hover:text-amber-700 transition-colors">
                                {customer.name}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-mono text-sm font-black text-neutral-900 flex items-center">
                              <span className="text-amber-600 mr-0.5">₹</span>
                              <span className={customer.totalAmount > 0 ? 'text-black font-extrabold' : 'text-neutral-400'}>
                                {customer.totalAmount.toLocaleString()}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                                customer.totalAmount === 0
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              {customer.totalAmount === 0 ? 'Settled' : 'Pending'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-semibold text-[11px] border border-neutral-200">
                              {customer.history?.length || 0} txns
                            </span>
                          </td>

                          {/* Actions Column: Settle, Notify, Delete visible + Details dropdown for other details */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* WhatsApp Notify Button */}
                              <button
                                type="button"
                                onClick={() => handleWhatsAppNotify(customer)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center space-x-1 transition-all shadow-2xs cursor-pointer"
                                title={`Send WhatsApp reminder to ${customer.name}`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Notify</span>
                              </button>

                              {/* Settle Button */}
                              {customer.totalAmount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleSettle(customer.id)}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                                  title="Mark as settled"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Settle</span>
                                </button>
                              )}

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleDelete(customer.id, customer.name)}
                                className="p-1.5 rounded-xl hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete customer"
                                aria-label="Delete customer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Details Toggle Button */}
                              <button
                                type="button"
                                onClick={() => toggleCustomerDropdown(customer.id)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center space-x-1 transition-all cursor-pointer ${
                                  isExpanded
                                    ? 'bg-black text-yellow-300 border-black shadow-xs'
                                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200 hover:text-black'
                                }`}
                                title="View other customer details"
                              >
                                <span>{isExpanded ? 'Less' : 'Details'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Details Row for Other Details */}
                        {isExpanded && (
                          <tr className="bg-amber-50/40 border-b border-amber-200/60 animate-in fade-in duration-150">
                            <td colSpan="6" className="py-3 px-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-amber-200/80 shadow-2xs">
                                <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
                                  <div className="flex items-center space-x-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Due Date: <strong className="text-black">{customer.dueDate || 'Not Specified'}</strong></span>
                                  </div>
                                  <span className="text-neutral-300">•</span>
                                  <div className="text-[11px] text-neutral-500">
                                    Last Active: <span className="font-medium text-neutral-700">{customer.lastUpdated}</span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  {/* Edit Customer & Transactions Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCustomer({ ...customer });
                                      setEditTab('TXN');
                                      setNewTxType('ADD');
                                      setNewTxAmount('');
                                      setNewTxNote('');
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                                    style={{
                                      backgroundColor: '#3D2E18',
                                      color: '#F9DEBF',
                                    }}
                                    title={`Edit ${customer.name} & Transactions`}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit Customer & Txns</span>
                                  </button>

                                  {/* View Audit Logs Button */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCustomerHistory(customer)}
                                    className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                                    title="View Audit Logs"
                                  >
                                    <History className="w-3.5 h-3.5 text-neutral-500" />
                                    <span>Audit Trail</span>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>



        {/* CUSTOMER HISTORY AUDIT MODAL (Responsive Bottom Sheet on Mobile) */}
        {selectedCustomerHistory && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white border border-neutral-200 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto">
              {/* Mobile Drag Handle */}
              <div className="sm:hidden w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-2" />

              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-black text-yellow-300 flex items-center justify-center font-bold text-sm border-2 border-yellow-400 shrink-0">
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
                  className="p-2 min-w-11 min-h-11 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-black cursor-pointer"
                  aria-label="Close modal"
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
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 min-h-11 flex items-center justify-center cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SINGLE EDIT MODAL (SIMPLE NEW TRANSACTION & CUSTOMER DETAILS) (Responsive Bottom Sheet on Mobile) */}
        {editingCustomer && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div
              className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 border max-h-[90dvh] overflow-y-auto"
              style={{ borderColor: '#F9DEBF' }}
            >
              {/* Mobile Drag Handle */}
              <div className="sm:hidden w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-2" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: '#F9DEBF' }}>
                <div className="flex items-center space-x-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0"
                    style={{ backgroundColor: '#3D2E18', color: '#F9DEBF' }}
                  >
                    {editingCustomer.name ? editingCustomer.name.charAt(0) : 'C'}
                  </div>
                  <div>
                    <h3 className="font-black font-['Outfit'] text-base" style={{ color: '#3D2E18' }}>
                      {editingCustomer.name} (ID #{editingCustomer.idNumber})
                    </h3>
                    <p className="text-xs font-medium" style={{ color: '#8A91A0' }}>
                      Current Total Due: <strong className="font-mono font-bold" style={{ color: '#3D2E18' }}>₹{Number(editingCustomer.totalAmount || 0).toLocaleString()}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="p-2 min-w-11 min-h-11 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                  style={{ color: '#8A91A0' }}
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Two Clean Tabs: 1. New Transaction / 2. Customer Details */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditTab('TXN')}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs min-h-11 sm:min-h-0"
                  style={{
                    backgroundColor: editTab === 'TXN' ? '#3D2E18' : 'transparent',
                    color: editTab === 'TXN' ? '#F9DEBF' : '#8A91A0',
                  }}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>New Transaction</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab('DETAILS')}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs min-h-11 sm:min-h-0"
                  style={{
                    backgroundColor: editTab === 'DETAILS' ? '#3D2E18' : 'transparent',
                    color: editTab === 'DETAILS' ? '#F9DEBF' : '#8A91A0',
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Customer Details</span>
                </button>
              </div>

              {/* TAB 1: SIMPLE NEW TRANSACTION */}
              {editTab === 'TXN' && (
                <form onSubmit={handleSaveSimpleTransaction} className="space-y-4">
                  {/* Current Balance Banner */}
                  <div
                    className="p-3 rounded-2xl border flex items-center justify-between"
                    style={{
                      backgroundColor: '#F9DEBF',
                      borderColor: '#3D2E18',
                    }}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#3D2E18' }}>
                      Current Due Balance
                    </span>
                    <span className="text-lg font-black font-mono" style={{ color: '#3D2E18' }}>
                      {formatRupee(editingCustomer.balance || 0)}
                    </span>
                  </div>

                  {/* Toggle: Add Credit vs Payment Received */}
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-neutral-100">
                    <button
                      type="button"
                      onClick={() => setNewTxType('ADD')}
                      className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs min-h-11"
                      style={{
                        backgroundColor: newTxType === 'ADD' ? '#3D2E18' : 'transparent',
                        color: newTxType === 'ADD' ? '#F9DEBF' : '#8A91A0',
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>+ Add Credit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTxType('PAY')}
                      className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs min-h-11"
                      style={{
                        backgroundColor: newTxType === 'PAY' ? '#3D2E18' : 'transparent',
                        color: newTxType === 'PAY' ? '#F9DEBF' : '#8A91A0',
                      }}
                    >
                      <MinusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>- Payment Received</span>
                    </button>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#3D2E18' }}>
                      Amount (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 font-mono text-base font-bold" style={{ color: '#3D2E18' }}>
                        ₹
                      </span>
                      <input
                        type="number"
                        required
                        min="1"
                        autoFocus
                        placeholder="0"
                        value={newTxAmount}
                        onChange={(e) => setNewTxAmount(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl text-base font-mono font-bold outline-none border transition-all min-h-11"
                        style={{
                          borderColor: '#3D2E18',
                          color: '#3D2E18',
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Amount Chips */}
                  <div>
                    <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: '#8A91A0' }}>
                      Quick Select:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[50, 100, 200, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setNewTxAmount(String(amt))}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer min-h-9"
                          style={{
                            backgroundColor: Number(newTxAmount) === amt ? '#3D2E18' : '#F9DEBF',
                            color: Number(newTxAmount) === amt ? '#F9DEBF' : '#3D2E18',
                            borderColor: '#3D2E18',
                          }}
                        >
                          ₹{amt}
                        </button>
                      ))}
                      {newTxType === 'PAY' && editingCustomer.totalAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => setNewTxAmount(String(editingCustomer.totalAmount))}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer min-h-9"
                          style={{
                            backgroundColor: Number(newTxAmount) === editingCustomer.totalAmount ? '#3D2E18' : '#F9DEBF',
                            color: Number(newTxAmount) === editingCustomer.totalAmount ? '#F9DEBF' : '#3D2E18',
                            borderColor: '#3D2E18',
                          }}
                        >
                          Full Due (₹{editingCustomer.totalAmount})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Note / Description */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#3D2E18' }}>
                      Note (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder={newTxType === 'ADD' ? 'e.g. Groceries credit, supplies' : 'e.g. Cash received / UPI'}
                      value={newTxNote}
                      onChange={(e) => setNewTxNote(e.target.value)}
                      className="w-full px-3 py-2.5 sm:py-2 rounded-xl text-base sm:text-xs outline-none border transition-all min-h-11 sm:min-h-0"
                      style={{
                        borderColor: '#8A91A0',
                        color: '#3D2E18',
                      }}
                    />
                  </div>

                  {/* Projected New Balance */}
                  {newTxAmount && Number(newTxAmount) > 0 && (
                    <div
                      className="p-3 rounded-xl border flex items-center justify-between text-xs font-medium"
                      style={{
                        backgroundColor: '#F9DEBF',
                        borderColor: '#3D2E18',
                        color: '#3D2E18',
                      }}
                    >
                      <span>New Balance after this txn:</span>
                      <span className="font-mono font-black text-sm">
                        ₹{(newTxType === 'ADD'
                          ? editingCustomer.totalAmount + Number(newTxAmount)
                          : Math.max(0, editingCustomer.totalAmount - Number(newTxAmount))
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="pt-2 border-t flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2" style={{ borderColor: '#F9DEBF' }}>
                    <button
                      type="button"
                      onClick={() => setEditingCustomer(null)}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-11 flex items-center justify-center"
                      style={{ color: '#8A91A0' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer hover:opacity-90 flex items-center justify-center space-x-1.5 min-h-11"
                      style={{
                        backgroundColor: '#3D2E18',
                        color: '#F9DEBF',
                      }}
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Save Transaction</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: CUSTOMER CONTACT DETAILS */}
              {editTab === 'DETAILS' && (
                <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold uppercase tracking-wider mb-1" style={{ color: '#3D2E18' }}>
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCustomer.name}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                      className="w-full px-3 py-2.5 sm:py-2 rounded-xl text-black font-semibold text-base sm:text-xs outline-none border transition-all min-h-11 sm:min-h-0"
                      style={{ borderColor: '#3D2E18' }}
                      placeholder="Customer Name"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold uppercase tracking-wider text-[11px]" style={{ color: '#3D2E18' }}>
                        Mobile Number (10 Digits) *
                      </label>
                      <span className={`text-[11px] font-mono font-bold ${
                        (editingCustomer.phone || '').replace(/\D/g, '').length === 10
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`}>
                        {(editingCustomer.phone || '').replace(/\D/g, '').length}/10 digits
                      </span>
                    </div>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-3.5 sm:top-2.5" style={{ color: '#8A91A0' }} />
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        required
                        value={editingCustomer.phone === 'Not Added' ? '' : editingCustomer.phone.replace(/\D/g, '').slice(0, 10)}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setEditingCustomer({ ...editingCustomer, phone: digitsOnly });
                        }}
                        className="w-full pl-8 pr-3 py-2.5 sm:py-2 rounded-xl text-black font-mono text-base sm:text-xs outline-none border transition-all min-h-11 sm:min-h-0"
                        style={{ borderColor: '#3D2E18' }}
                        placeholder="10-digit mobile number (e.g. 9876543210)"
                      />
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: '#8A91A0' }}>
                      Standard 10-digit Indian mobile number for WhatsApp payment reminders.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider mb-1" style={{ color: '#3D2E18' }}>
                      Promised Due Date
                    </label>
                    <input
                      type="text"
                      value={editingCustomer.dueDate || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, dueDate: e.target.value })}
                      className="w-full px-3 py-2.5 sm:py-2 rounded-xl text-black text-base sm:text-xs outline-none border transition-all min-h-11 sm:min-h-0"
                      style={{ borderColor: '#8A91A0' }}
                      placeholder="e.g. 30 November"
                    />
                  </div>

                  <div className="pt-3 border-t flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2" style={{ borderColor: '#F9DEBF' }}>
                    {editingCustomer.phone && editingCustomer.phone !== 'Not Added' && (
                      <button
                        type="button"
                        onClick={() => {
                          sendWhatsAppMessage(editingCustomer);
                          setEditingCustomer(null);
                        }}
                        className="w-full sm:w-auto px-3 py-2.5 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer transition-colors min-h-11 sm:min-h-0"
                        style={{
                          backgroundColor: '#F9DEBF',
                          borderColor: '#3D2E18',
                          color: '#3D2E18',
                        }}
                        title="Fetch WhatsApp with Due & UPI Details"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                        <span>Fetch WhatsApp</span>
                      </button>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:ml-auto">
                      <button
                        type="button"
                        onClick={() => setEditingCustomer(null)}
                        className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-11 flex items-center justify-center"
                        style={{ color: '#8A91A0' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all hover:opacity-90 min-h-11 flex items-center justify-center"
                        style={{
                          backgroundColor: '#3D2E18',
                          color: '#F9DEBF',
                        }}
                      >
                        Save Customer Details
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* 3. ADD NEW CUSTOMER MODAL (MANUAL + VOICE DICTATION) (Responsive Bottom Sheet on Mobile) */}
        {isAddCustomerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white border border-neutral-200 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto">
              {/* Mobile Drag Handle */}
              <div className="sm:hidden w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-2" />

              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-yellow-300 text-black flex items-center justify-center font-bold shadow-sm border border-yellow-400 shrink-0">
                    <UserPlus className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black font-['Outfit'] text-base">
                      Add New Customer
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Enter details manually or dictate with voice
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddCustomerModalOpen(false)}
                  className="p-2 min-w-11 min-h-11 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-black cursor-pointer"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              {/* VOICE DICTATION BANNER */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-amber-950 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Auto-Fill with Voice</span>
                  </span>
                  <p className="text-[10px] text-amber-800 leading-tight">
                    Tap mic and say: <em>"Customer Ramesh, phone 9876543210, amount 500, due 25 Nov"</em>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDictateNewCustomer}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center space-x-1 min-h-11 w-full sm:w-auto ${
                    isDictatingCustomer
                      ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                      : 'bg-yellow-300 hover:bg-yellow-400 text-black border-yellow-400'
                  }`}
                  title="Speak Customer Details"
                >
                  <Mic className="w-4 h-4 text-black" />
                  <span className="text-xs font-bold text-black">{isDictatingCustomer ? 'Listening...' : 'Dictate'}</span>
                </button>
              </div>

              <form onSubmit={handleCreateNewCustomer} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newCustomerForm.name}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-black font-semibold text-base sm:text-xs focus:border-yellow-400 outline-none min-h-11 sm:min-h-0"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-neutral-700 font-bold text-xs">
                      Mobile Number (10 Digits) *
                    </label>
                    <span className={`text-[11px] font-mono font-bold ${
                      (newCustomerForm.phone || '').replace(/\D/g, '').length === 10
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}>
                      {(newCustomerForm.phone || '').replace(/\D/g, '').length}/10 digits
                    </span>
                  </div>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3.5 sm:top-2.5" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      placeholder="10-digit mobile number (e.g. 9876543210)"
                      value={newCustomerForm.phone.replace(/\D/g, '').slice(0, 10)}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setNewCustomerForm({ ...newCustomerForm, phone: digitsOnly });
                      }}
                      className="w-full pl-8 pr-3 py-2.5 sm:py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-black font-mono text-base sm:text-xs focus:border-yellow-400 outline-none min-h-11 sm:min-h-0"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Enter standard 10-digit mobile number without +91 or prefix.
                  </p>
                </div>

                {/* Quick Presets for Due Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-neutral-700 font-bold">
                      Initial Due Amount (₹)
                    </label>
                    <div className="flex items-center space-x-1">
                      {[100, 250, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setNewCustomerForm({ ...newCustomerForm, amount: String(amt) })}
                          className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-[10px] font-mono text-neutral-700 cursor-pointer min-h-8 sm:min-h-0"
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={newCustomerForm.amount}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, amount: e.target.value })
                    }
                    className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-black font-mono font-bold text-base sm:text-xs focus:border-yellow-400 outline-none min-h-11 sm:min-h-0"
                  />
                </div>

                {/* Quick Presets for Due Date */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-neutral-700 font-bold">
                      Due Date
                    </label>
                    <div className="flex flex-wrap items-center gap-1">
                      {['Tomorrow', '30 November', '7 Days', '15 Days'].map((dt) => (
                        <button
                          key={dt}
                          type="button"
                          onClick={() => setNewCustomerForm({ ...newCustomerForm, dueDate: dt })}
                          className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-[10px] text-neutral-700 cursor-pointer min-h-8 sm:min-h-0"
                        >
                          {dt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 30 November"
                    value={newCustomerForm.dueDate}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, dueDate: e.target.value })
                    }
                    className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-black text-base sm:text-xs focus:border-yellow-400 outline-none min-h-11 sm:min-h-0"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1">
                    Initial Note / Reason (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Groceries opening balance"
                    value={newCustomerForm.note}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, note: e.target.value })
                    }
                    className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-black text-base sm:text-xs focus:border-yellow-400 outline-none min-h-11 sm:min-h-0"
                  />
                </div>

                {/* Notify Immediately Checkbox */}
                <label className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCustomerForm.notifyImmediately || false}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, notifyImmediately: e.target.checked })
                    }
                    className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500 shrink-0"
                  />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-emerald-950 block">
                      Fetch WhatsApp reminder immediately upon creation
                    </span>
                    <span className="text-emerald-700 text-[10px]">
                      Opens WhatsApp directly with pre-filled due details and your merchant UPI ID.
                    </span>
                  </div>
                </label>

                <div className="pt-2 border-t border-neutral-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCustomerModalOpen(false)}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-semibold hover:bg-neutral-200 cursor-pointer min-h-11 flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto gold-button-gradient px-5 py-2.5 sm:py-2 rounded-xl text-black text-xs font-bold border border-yellow-400 shadow-sm cursor-pointer min-h-11 flex items-center justify-center"
                  >
                    Create Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Floating Voice Ledger Thumb Button (Mobile & Tablet) */}
        <div className="lg:hidden fixed bottom-20 right-4 z-40 select-none">
          <button
            type="button"
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
            onTouchCancel={handleHoldEnd}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer border-2 select-none ${
              isListening
                ? 'bg-yellow-400 text-black border-black scale-110 animate-pulse'
                : 'bg-black text-yellow-300 border-yellow-400 hover:scale-105'
            }`}
            title="Hold continuously to speak voice ledger command"
            aria-label="Voice ledger recorder"
          >
            <Mic className={`w-6 h-6 ${isListening ? 'animate-pulse text-black' : 'text-yellow-300'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
