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
  X,
  Phone,
  CreditCard,
  Send,
  UserPlus,
} from 'lucide-react';
import { parseLocalSmartIntent, parseWithGroqAI, checkGroqStatus } from '../services/voiceParser';

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
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [transactionCustomer, setTransactionCustomer] = useState(null);

  // Transaction states for simple New Transaction modal
  const [newTxType, setNewTxType] = useState('ADD'); // 'ADD' or 'PAY'
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxNote, setNewTxNote] = useState('');

  // Add New Customer Modal states
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
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

  const showFeedback = (msg, type = 'success', actionLink = null) => {
    setFeedbackMessage({ text: msg, type, actionLink });
    setTimeout(() => setFeedbackMessage(null), 6000);
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
    let storeName = 'AURUMFLOW / Zenniths Enterprise';
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

    const dateStr = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const updatedPhone = editingCustomer.phone?.trim() || 'Not Added';
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
    if (!transactionCustomer) return;

    const val = Number(newTxAmount);
    if (!val || val <= 0) {
      showFeedback('Please enter a valid transaction amount greater than ₹0.', 'error');
      return;
    }

    const isCredit = newTxType === 'ADD';
    const updatedTotal = isCredit
      ? transactionCustomer.totalAmount + val
      : Math.max(0, transactionCustomer.totalAmount - val);

    const dateStr = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const noteText = newTxNote.trim() || (isCredit ? `+₹${val} credit added` : `-₹${val} payment received`);

    const newHistoryEntry = {
      amount: isCredit ? val : -val,
      date: dateStr,
      note: noteText,
    };

    const updatedCustomer = {
      ...transactionCustomer,
      totalAmount: updatedTotal,
      status: updatedTotal === 0 ? 'Settled' : 'Pending',
      lastUpdated: dateStr,
      history: [newHistoryEntry, ...(transactionCustomer.history || [])],
    };

    setKhataList((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );

    setTransactionCustomer(null);
    setNewTxAmount('');
    setNewTxNote('');
    showFeedback(
      `Recorded ${isCredit ? `+₹${val}` : `-₹${val}`} transaction for ${updatedCustomer.name}! New Total Due: ₹${updatedTotal.toLocaleString()}`,
      'success'
    );
  };

  // Voice dictation for Add Customer modal
  const handleDictateNewCustomer = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showFeedback('Voice dictation requires Web Speech API support in your browser (Chrome/Edge recommended).', 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsDictatingCustomer(true);
      showFeedback('🎙️ Listening... Say e.g. "Customer Ramesh, phone 9876543210, amount 500, due 30 November"', 'info');
    };

    recognition.onresult = (event) => {
      setIsDictatingCustomer(false);
      const rawTranscript = event.results[0][0].transcript;
      const normalized = normalizeSpokenNumbers(rawTranscript);
      showFeedback(`🎙️ Heard: "${rawTranscript}"`, 'info');

      // 1. Extract phone number (e.g. 9876543210 or +91 98765 43210 or 10 digits in sequence)
      let phoneFound = '';
      const phoneMatch = normalized.match(/(?:\+?91[\s-]?)?([6-9]\d{9})/);
      if (phoneMatch) {
        phoneFound = `+91 ${phoneMatch[1]}`;
      } else {
        const spacedDigits = normalized.match(/\b(?:\d[\s-]?){10}\b/);
        if (spacedDigits) {
          const clean = spacedDigits[0].replace(/[\s-]/g, '');
          phoneFound = `+91 ${clean}`;
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

      setNewCustomerForm((prev) => ({
        ...prev,
        name: nameFound ? nameFound.charAt(0).toUpperCase() + nameFound.slice(1) : prev.name,
        phone: phoneFound || prev.phone,
        amount: amountFound || prev.amount,
        dueDate: dueFound || prev.dueDate,
        note: `Voice created: "${rawTranscript}"`,
      }));

      showFeedback(`✅ Auto-filled from voice: "${rawTranscript}"! You can edit details manually and click Create.`, 'success');
    };

    recognition.onerror = () => {
      setIsDictatingCustomer(false);
      showFeedback('Voice listening stopped. You can also enter details manually.', 'warning');
    };

    recognition.onend = () => {
      setIsDictatingCustomer(false);
    };

    recognition.start();
  };

  // Create new customer manually / via voice
  const handleCreateNewCustomer = (e) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim()) {
      showFeedback('Customer name is required.', 'error');
      return;
    }

    const maxId = khataList.reduce((max, c) => Math.max(max, c.idNumber || 0), 0);
    const assignedIdNumber = maxId + 1;
    const amountVal = Number(newCustomerForm.amount) || 0;
    const dateStr = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newCustomer = {
      id: `cust-${Date.now()}`,
      idNumber: assignedIdNumber,
      name: newCustomerForm.name.trim(),
      phone: newCustomerForm.phone.trim() || 'Not Added',
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

    setKhataList([newCustomer, ...khataList]);
    setIsAddCustomerModalOpen(false);

    const shouldNotify = newCustomerForm.notifyImmediately;

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

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search customer or due date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs text-black focus:border-yellow-400 outline-none"
                />
              </div>

              {/* + Add Customer Button (Manually with Voice) */}
              <button
                type="button"
                onClick={() => setIsAddCustomerModalOpen(true)}
                className="gold-button-gradient px-3.5 py-1.5 rounded-xl text-xs font-bold text-black border border-yellow-400 flex items-center space-x-1.5 shrink-0 shadow-xs cursor-pointer hover:scale-[1.02] transition-transform"
                title="Add New Customer Manually or Dictate via Voice"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden xs:inline">+ Add Customer</span>
                <span className="p-0.5 rounded bg-black/10">
                  <Mic className="w-3 h-3 text-black" />
                </span>
              </button>
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
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-black group-hover:text-amber-600 transition-colors">
                                {customer.name}
                              </span>
                              <button
                                onClick={() => setEditingCustomer(customer)}
                                className="p-0.5 rounded text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                                title="Edit Customer Details (Phone, Name, Due Date)"
                              >
                                <Edit3 className="w-3 h-3 text-neutral-500" />
                              </button>
                            </div>
                            <div className="flex items-center space-x-1.5 text-[10px] text-neutral-500 font-mono mt-0.5">
                              <span>ID: #{customer.idNumber}</span>
                              <span>&bull;</span>
                              <span className="flex items-center space-x-1">
                                <Phone className="w-2.5 h-2.5 text-neutral-400" />
                                {customer.phone && customer.phone !== 'Not Added' ? (
                                  <span className="text-neutral-700 font-semibold">{customer.phone}</span>
                                ) : (
                                  <button
                                    onClick={() => setEditingCustomer(customer)}
                                    className="text-amber-600 hover:underline font-bold cursor-pointer"
                                  >
                                    + Add Phone
                                  </button>
                                )}
                              </span>
                              <span>&bull;</span>
                              <span>{customer.history.length} txns</span>
                            </div>
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
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* WhatsApp Due Notification Button */}
                          <button
                            onClick={() => handleWhatsAppNotify(customer)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center space-x-1.5 transition-all shadow-2xs group/btn cursor-pointer"
                            title={`Fetch WhatsApp application for ${customer.name}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 group-hover/btn:scale-110 transition-transform" />
                            <span>Notify</span>
                          </button>

                          {/* + Add New Transaction Button (Direct 1-Click Action) */}
                          <button
                            onClick={() => {
                              setTransactionCustomer(customer);
                              setNewTxType('ADD');
                              setNewTxAmount('');
                              setNewTxNote('');
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs hover:opacity-90"
                            style={{
                              backgroundColor: '#3D2E18',
                              color: '#F9DEBF',
                            }}
                            title={`Add New Transaction for ${customer.name}`}
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                            <span>+ Txn</span>
                          </button>

                          {/* Edit Customer Details Button */}
                          <button
                            onClick={() => {
                              setEditingCustomer({ ...customer });
                            }}
                            className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black transition-colors cursor-pointer"
                            title="Edit Customer Details (Phone, Name, Due Date)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* View Audit Logs Button */}
                          <button
                            onClick={() => setSelectedCustomerHistory(customer)}
                            className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black transition-colors cursor-pointer"
                            title="View Audit Logs"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Settle Button */}
                          {customer.totalAmount > 0 && (
                            <button
                              onClick={() => handleSettle(customer.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                              title="Mark as fully settled"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Settle</span>
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(customer.id, customer.name)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
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

        {/* 1. SIMPLE NEW TRANSACTION MODAL (#3D2E18, #F9DEBF, #8A91A0) */}
        {transactionCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border"
              style={{ borderColor: '#F9DEBF' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: '#F9DEBF' }}>
                <div className="flex items-center space-x-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs"
                    style={{ backgroundColor: '#3D2E18', color: '#F9DEBF' }}
                  >
                    {transactionCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black font-['Outfit'] text-base" style={{ color: '#3D2E18' }}>
                      New Transaction
                    </h3>
                    <p className="text-xs font-medium" style={{ color: '#8A91A0' }}>
                      {transactionCustomer.name} (ID #{transactionCustomer.idNumber})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTransactionCustomer(null)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                  style={{ color: '#8A91A0' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Balance Pill */}
              <div
                className="p-3 rounded-2xl border flex items-center justify-between"
                style={{
                  backgroundColor: '#F9DEBF',
                  borderColor: '#3D2E18',
                }}
              >
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#3D2E18' }}>
                  Current Due Amount
                </span>
                <span className="text-lg font-black font-mono" style={{ color: '#3D2E18' }}>
                  ₹{Number(transactionCustomer.totalAmount || 0).toLocaleString()}
                </span>
              </div>

              {/* Transaction Form */}
              <form onSubmit={handleSaveSimpleTransaction} className="space-y-4">
                {/* Toggle: Add Credit vs Payment Received */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-neutral-100">
                  <button
                    type="button"
                    onClick={() => setNewTxType('ADD')}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
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
                    className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
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
                    <span className="absolute left-3.5 top-2.5 font-mono text-base font-bold" style={{ color: '#3D2E18' }}>
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
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl text-lg font-mono font-bold outline-none border transition-all"
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
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer"
                        style={{
                          backgroundColor: Number(newTxAmount) === amt ? '#3D2E18' : '#F9DEBF',
                          color: Number(newTxAmount) === amt ? '#F9DEBF' : '#3D2E18',
                          borderColor: '#3D2E18',
                        }}
                      >
                        ₹{amt}
                      </button>
                    ))}
                    {newTxType === 'PAY' && transactionCustomer.totalAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => setNewTxAmount(String(transactionCustomer.totalAmount))}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer"
                        style={{
                          backgroundColor: Number(newTxAmount) === transactionCustomer.totalAmount ? '#3D2E18' : '#F9DEBF',
                          color: Number(newTxAmount) === transactionCustomer.totalAmount ? '#F9DEBF' : '#3D2E18',
                          borderColor: '#3D2E18',
                        }}
                      >
                        Full Due (₹{transactionCustomer.totalAmount})
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
                    placeholder={newTxType === 'ADD' ? 'e.g. Rice, oil, groceries credit' : 'e.g. Cash received / UPI'}
                    value={newTxNote}
                    onChange={(e) => setNewTxNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none border transition-all"
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
                        ? transactionCustomer.totalAmount + Number(newTxAmount)
                        : Math.max(0, transactionCustomer.totalAmount - Number(newTxAmount))
                      ).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Buttons */}
                <div className="pt-2 border-t flex items-center justify-end space-x-2" style={{ borderColor: '#F9DEBF' }}>
                  <button
                    type="button"
                    onClick={() => setTransactionCustomer(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    style={{ color: '#8A91A0' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer hover:opacity-90 flex items-center space-x-1.5"
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
            </div>
          </div>
        )}

        {/* 2. SIMPLE EDIT CUSTOMER DETAILS MODAL (#3D2E18, #F9DEBF, #8A91A0) */}
        {editingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border"
              style={{ borderColor: '#F9DEBF' }}
            >
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: '#F9DEBF' }}>
                <div className="flex items-center space-x-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs"
                    style={{ backgroundColor: '#3D2E18', color: '#F9DEBF' }}
                  >
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black font-['Outfit'] text-base" style={{ color: '#3D2E18' }}>
                      Edit Customer Details
                    </h3>
                    <p className="text-xs font-medium" style={{ color: '#8A91A0' }}>
                      Customer #{editingCustomer.idNumber} • Total Due: ₹{editingCustomer.totalAmount}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                  style={{ color: '#8A91A0' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editingCustomer._sendWhatsAppAfterSave && (
                <div
                  className="p-3 rounded-xl border text-xs flex items-center space-x-2"
                  style={{
                    backgroundColor: '#F9DEBF',
                    borderColor: '#3D2E18',
                    color: '#3D2E18',
                  }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#3D2E18' }} />
                  <span>
                    Add a phone number below to immediately send the WhatsApp due reminder!
                  </span>
                </div>
              )}

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
                    className="w-full px-3 py-2 rounded-xl text-black font-semibold text-xs outline-none border transition-all"
                    style={{ borderColor: '#3D2E18' }}
                    placeholder="Customer Name"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1" style={{ color: '#3D2E18' }}>
                    WhatsApp / Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5" style={{ color: '#8A91A0' }} />
                    <input
                      type="text"
                      required
                      value={editingCustomer.phone === 'Not Added' ? '' : editingCustomer.phone}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-black font-mono text-xs outline-none border transition-all"
                      style={{ borderColor: '#3D2E18' }}
                      placeholder="e.g. +91 98765 43210 or 9876543210"
                    />
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: '#8A91A0' }}>
                    Required for 1-tap WhatsApp payment reminders.
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
                    className="w-full px-3 py-2 rounded-xl text-black text-xs outline-none border transition-all"
                    style={{ borderColor: '#8A91A0' }}
                    placeholder="e.g. 30 November"
                  />
                </div>

                <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: '#F9DEBF' }}>
                  {editingCustomer.phone && editingCustomer.phone !== 'Not Added' && (
                    <button
                      type="button"
                      onClick={() => {
                        sendWhatsAppMessage(editingCustomer);
                        setEditingCustomer(null);
                      }}
                      className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
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

                  <div className="flex items-center space-x-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setEditingCustomer(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      style={{ color: '#8A91A0' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all hover:opacity-90"
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
            </div>
          </div>
        )}

        {/* 3. ADD NEW CUSTOMER MODAL (MANUAL + VOICE DICTATION) */}
        {isAddCustomerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-yellow-300 text-black flex items-center justify-center font-bold shadow-sm border border-yellow-400">
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
                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-black cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* VOICE DICTATION BANNER */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-3">
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
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs shrink-0 flex items-center space-x-1 ${
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
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-black font-semibold text-xs focus:border-yellow-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1">
                    WhatsApp / Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 98765 43210 or 9876543210"
                      value={newCustomerForm.phone}
                      onChange={(e) =>
                        setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })
                      }
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-black font-mono text-xs focus:border-yellow-400 outline-none"
                    />
                  </div>
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
                          className="px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-[10px] font-mono text-neutral-700 cursor-pointer"
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
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-black font-mono font-bold text-xs focus:border-yellow-400 outline-none"
                  />
                </div>

                {/* Quick Presets for Due Date */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-neutral-700 font-bold">
                      Due Date
                    </label>
                    <div className="flex items-center space-x-1">
                      {['Tomorrow', '30 November', '7 Days', '15 Days'].map((dt) => (
                        <button
                          key={dt}
                          type="button"
                          onClick={() => setNewCustomerForm({ ...newCustomerForm, dueDate: dt })}
                          className="px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-[10px] text-neutral-700 cursor-pointer"
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
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-black text-xs focus:border-yellow-400 outline-none"
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
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-black text-xs focus:border-yellow-400 outline-none"
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
                    className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500"
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

                <div className="pt-2 border-t border-neutral-200 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCustomerModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-semibold hover:bg-neutral-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gold-button-gradient px-5 py-2 rounded-xl text-black text-xs font-bold border border-yellow-400 shadow-sm cursor-pointer"
                  >
                    Create Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
