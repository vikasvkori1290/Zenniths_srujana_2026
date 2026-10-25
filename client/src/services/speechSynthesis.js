/**
 * AurumFlow eKhata Voice-To-Speech & Speech Synthesis Service
 * Provides audible spoken confirmations, hands-free voice feedback,
 * and ledger account read-aloud capabilities for Indian merchants.
 */

class SpeechService {
  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.isEnabled = true; // User preference for TTS feedback
    this.cachedVoices = [];

    if (this.isSupported) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }

      // Check stored preference
      const saved = localStorage.getItem('aurum_tts_enabled');
      if (saved !== null) {
        this.isEnabled = saved === 'true';
      }
    }
  }

  loadVoices() {
    if (!this.isSupported) return;
    this.cachedVoices = window.speechSynthesis.getVoices();
  }

  setIsEnabled(enabled) {
    this.isEnabled = Boolean(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aurum_tts_enabled', String(this.isEnabled));
      window.dispatchEvent(new Event('aurum_tts_toggle_updated'));
    }
    if (!this.isEnabled) {
      this.stop();
    }
  }

  getIsEnabled() {
    return this.isEnabled;
  }

  /**
   * Find the most natural voice based on preferred language code
   */
  findVoice(langCode = 'en-IN') {
    if (!this.isSupported) return null;
    if (this.cachedVoices.length === 0) {
      this.loadVoices();
    }

    const voices = this.cachedVoices;
    const cleanLang = langCode.toLowerCase().replace('_', '-');

    // 1. Direct match for exact Indian accent/language
    let match = voices.find(
      (v) =>
        v.lang.toLowerCase().replace('_', '-') === cleanLang ||
        (cleanLang.includes('in') && v.lang.toLowerCase().includes('in'))
    );

    // 2. Hindi match
    if (!match && cleanLang.startsWith('hi')) {
      match = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.includes('हिन्दी')
      );
    }

    // 3. Indian English match (Google English (India), Microsoft Ravi / Heera)
    if (!match && (cleanLang.includes('en') || cleanLang.includes('in'))) {
      match = voices.find(
        (v) =>
          v.name.toLowerCase().includes('india') ||
          v.lang.toLowerCase() === 'en-in' ||
          v.name.toLowerCase().includes('ravi') ||
          v.name.toLowerCase().includes('heera')
      );
    }

    // 4. Fallback to default voice or first English voice
    if (!match) {
      match = voices.find((v) => v.default) || voices.find((v) => v.lang.startsWith('en')) || voices[0];
    }

    return match || null;
  }

  /**
   * Speak arbitrary text with audible natural pacing
   */
  speak(text, { lang = 'en-IN', rate = 1.0, pitch = 1.0, force = false } = {}) {
    if (!this.isSupported || (!this.isEnabled && !force)) return;
    if (!text || !text.trim()) return;

    this.stop();

    try {
      const cleanText = text
        .replace(/₹\s*(\d+)/g, '$1 rupees')
        .replace(/Rs\.?\s*(\d+)/gi, '$1 rupees')
        .replace(/#/g, 'number ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voice = this.findVoice(lang);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = lang;
      }

      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.currentUtterance = utterance;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('aurum_tts_speaking', { detail: { text: cleanText } }));
        }
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('aurum_tts_ended'));
        }
      };

      utterance.onerror = (e) => {
        console.warn('[SpeechSynthesis Error]:', e);
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('aurum_tts_ended'));
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[SpeechSynthesis Exception]:', err);
    }
  }

  stop() {
    if (!this.isSupported) return;
    try {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('aurum_tts_ended'));
      }
    } catch (e) {}
  }

  /**
   * Speak confirmation of a CRUD action executed in eKhata
   */
  speakCrudConfirmation({ action, name, amount, totalAmount, dueDate, oldName, newName, lang = 'en-IN' }) {
    if (!this.isEnabled) return;

    let message = '';
    const person = name || 'Customer';

    switch (action?.toUpperCase()) {
      case 'ADD':
        message = amount
          ? `Added ${amount} rupees credit for ${person}. New balance is ${totalAmount || amount} rupees.`
          : `Updated credit for ${person}. Balance is ${totalAmount || 0} rupees.`;
        if (dueDate && dueDate !== 'Not Specified') {
          message += ` Due on ${dueDate}.`;
        }
        break;

      case 'SUBTRACT':
        message = amount
          ? `Received payment of ${amount} rupees from ${person}. Remaining balance is ${totalAmount || 0} rupees.`
          : `Recorded payment for ${person}. Balance is ${totalAmount || 0} rupees.`;
        break;

      case 'SETTLE':
        message = `Account for ${person} has been completely settled. Balance is now zero rupees.`;
        break;

      case 'RENAME':
        message = `Customer ${oldName || person} has been renamed to ${newName || name}.`;
        break;

      case 'UPDATE_DUE_DATE':
        message = `Due date for ${person} has been updated to ${dueDate || 'Not Specified'}.`;
        break;

      case 'DELETE':
        message = `Account for ${person} has been removed from your credit ledger.`;
        break;

      default:
        message = `Updated ledger account for ${person}. Current balance is ${totalAmount || 0} rupees.`;
        break;
    }

    this.speak(message, { lang });
  }

  /**
   * Speak summary for a single customer
   */
  speakCustomerSummary(customer, lang = 'en-IN') {
    if (!customer) return;
    const name = customer.name || `Customer ID ${customer.idNumber}`;
    const amount = Number(customer.totalAmount || 0);
    const due = customer.dueDate && customer.dueDate !== 'Not Specified' ? `due on ${customer.dueDate}` : 'no due date specified';
    const text = amount > 0
      ? `${name}, account number ${customer.idNumber}. Total credit balance is ${amount} rupees, ${due}.`
      : `${name}, account number ${customer.idNumber}. Account is completely settled with zero balance.`;
    this.speak(text, { lang, force: true });
  }

  /**
   * Speak overview of the entire eKhata ledger
   */
  speakLedgerOverview(customers = [], lang = 'en-IN') {
    if (!Array.isArray(customers) || customers.length === 0) {
      this.speak('Your credit ledger has no active customer accounts.', { lang, force: true });
      return;
    }
    const total = customers.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0);
    const count = customers.length;
    const text = `You have ${count} customer accounts in e-Khata, with a total outstanding credit balance of ${total.toLocaleString()} rupees.`;
    this.speak(text, { lang, force: true });
  }
}

export const speechService = new SpeechService();
export default speechService;
