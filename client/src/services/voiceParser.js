import { API_BASE } from './api';

// Intelligent Voice CRUD Parsing Service for eKhata
// Handles: ADD, SUBTRACT, DELETE (COMPLETE REMOVE), RENAME, UPDATE_DUE_DATE, SETTLE
// Powered by Groq Cloud LPU AI with Smart Local NLP fallback

const NUMBER_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000,
  // Hindi / Hinglish numerals
  ek: 1, do: 2, teen: 3, chaar: 4, paanch: 5, chhah: 6, saat: 7, aath: 8, nau: 9, das: 10,
  bees: 20, tees: 30, chaalis: 40, pachaas: 50, sau: 100, hazar: 1000, hazaar: 1000,
};

export function wordsToNumber(text) {
  const words = text.toLowerCase().replace(/[-]/g, ' ').split(/\s+/);
  let total = 0;
  let current = 0;

  for (const word of words) {
    if (NUMBER_WORDS[word] !== undefined) {
      const val = NUMBER_WORDS[word];
      if (val === 100) {
        current = (current === 0 ? 1 : current) * 100;
      } else if (val === 1000) {
        total += (current === 0 ? 1 : current) * 1000;
        current = 0;
      } else {
        current += val;
      }
    }
  }
  return total + current;
}

export function resolveRelativeDate(dateStr) {
  if (!dateStr) return 'Not Specified';
  const clean = dateStr.toLowerCase().trim();
  const now = new Date();

  if (clean === 'today' || clean === 'aaj') {
    return now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  }
  if (clean === 'tomorrow' || clean === 'kal') {
    const tm = new Date();
    tm.setDate(now.getDate() + 1);
    return tm.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  }
  if (clean === 'day after tomorrow' || clean === 'parso') {
    const tm = new Date();
    tm.setDate(now.getDate() + 2);
    return tm.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  }
  if (clean === 'next week' || clean === 'agle hafte') {
    const tm = new Date();
    tm.setDate(now.getDate() + 7);
    return tm.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  }
  if (clean === 'end of month' || clean === 'month end') {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return end.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  }

  return clean
    .split(' ')
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

// Local Smart Heuristic CRUD Parser (Offline Fallback)
export function parseLocalSmartIntent(rawText) {
  if (!rawText) return null;
  const original = rawText.trim();
  const lower = original.toLowerCase();

  let action = 'ADD';
  let targetId = null;
  let name = null;
  let newName = null;
  let amount = null;
  let dueDate = 'Not Specified';
  let isCompleteRemove = false;

  // Extract targetId if mentioned (e.g. "id number 2", "id 1", "customer #3", "number 2")
  const idMatch = lower.match(/(?:id\s*(?:number)?|customer\s*#?|number|#)\s*(\d+)/i);
  if (idMatch) {
    targetId = parseInt(idMatch[1], 10);
    name = `ID ${targetId}`;
  }

  // 1. Check RENAME: "change name from X to Y", "rename X to Y", "change name of id number 1 to Vikas"
  const renameIdMatch = lower.match(/(?:change\s+name\s+(?:of|for)?\s*(?:id\s*(?:number)?|#)\s*(\d+)\s+to)\s+([a-zA-Z]+)/i);
  if (renameIdMatch) {
    targetId = parseInt(renameIdMatch[1], 10);
    return {
      action: 'RENAME',
      targetId,
      name: `ID ${targetId}`,
      newName: capitalize(renameIdMatch[2]),
      amount: null,
      dueDate: null,
      isCompleteRemove: false,
      engine: 'Smart Local NLP (Fallback)',
      isGroq: false,
    };
  }

  const renameMatch = lower.match(/(?:change\s+name\s+from|rename|update\s+name\s+from)\s+([a-zA-Z]+)\s+to\s+([a-zA-Z]+)/i);
  if (renameMatch) {
    return {
      action: 'RENAME',
      targetId: null,
      name: capitalize(renameMatch[1]),
      newName: capitalize(renameMatch[2]),
      amount: null,
      dueDate: null,
      isCompleteRemove: false,
      engine: 'Smart Local NLP (Fallback)',
      isGroq: false,
    };
  }

  // 2. Check DELETE (Complete Remove): "remove complete number from X", "remove id 2 totally", "delete id number 2"
  if (
    lower.includes('complete number') ||
    lower.includes('totally') ||
    lower.includes('completely remove') ||
    lower.match(/\b(delete|remove)\s+(?:the\s+complete\s+number\s+from\s+)?(?:id\s*(?:number)?\s*\d+|[a-zA-Z]+)(?:\s+from\s+the\s+list|\s+totally|\s+completely)?$/i)
  ) {
    const delMatch = lower.match(/(?:delete|remove|clear)\s+(?:the\s+complete\s+number\s+from\s+)?(?:id\s*(?:number)?\s*(\d+)|([a-zA-Z]+))/i);
    if (delMatch) {
      const parsedId = delMatch[1] ? parseInt(delMatch[1], 10) : targetId;
      const parsedName = delMatch[2] ? capitalize(delMatch[2]) : (parsedId ? `ID ${parsedId}` : null);
      if (parsedName && !['The', 'A', 'Complete', 'Number'].includes(parsedName)) {
        return {
          action: 'DELETE',
          targetId: parsedId || null,
          name: parsedName,
          newName: null,
          amount: null,
          dueDate: null,
          isCompleteRemove: true,
          engine: 'Smart Local NLP (Fallback)',
          isGroq: false,
        };
      }
    }
  }

  // 3. Check DATE-ONLY COMMAND (e.g. "add 31 november to id number 2", "add 30 november to id 1", "set due date 15 december to nitish")
  const monthPattern = /(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)/i;
  const dateOnlyAddMatch = lower.match(/(?:add|set|update|change)\s+(\d{1,2}(?:st|nd|rd|th)?\s+[a-zA-Z]+|\b[a-zA-Z]+\s+\d{1,2}(?:st|nd|rd|th)?\b|tomorrow|today|kal|aaj|parso|next\s+week)\s+(?:to|for|in|of)\s+(?:id\s*(?:number)?\s*(\d+)|([a-zA-Z\s]+))/i);
  
  if (dateOnlyAddMatch && (monthPattern.test(dateOnlyAddMatch[1]) || ['tomorrow', 'today', 'kal', 'aaj', 'parso', 'next week'].includes(dateOnlyAddMatch[1].toLowerCase()))) {
    const dStr = dateOnlyAddMatch[1].trim();
    const idVal = dateOnlyAddMatch[2] ? parseInt(dateOnlyAddMatch[2], 10) : targetId;
    const nVal = dateOnlyAddMatch[3] ? capitalize(dateOnlyAddMatch[3]) : (idVal ? `ID ${idVal}` : name);
    return {
      action: 'UPDATE_DUE_DATE',
      targetId: idVal || null,
      name: nVal,
      newName: null,
      amount: null,
      dueDate: resolveRelativeDate(dStr),
      isCompleteRemove: false,
      engine: 'Smart Local NLP (Fallback)',
      isGroq: false,
    };
  }

  // 4. Check SUBTRACT: "remove 20rs from nitish", "subtract 50 from rahul", "nitish paid 30", "remove 20rs from id number 1"
  if (
    lower.includes('remove') ||
    lower.includes('subtract') ||
    lower.includes('deduct') ||
    lower.includes('minus') ||
    lower.includes('paid') ||
    lower.includes('ghatao') ||
    lower.includes('de diye')
  ) {
    action = 'SUBTRACT';
  }

  // Extract amount (excluding pure dates like "31 november")
  const unitRegex = /(?:rs\.?|inr|₹|rupees?|rupay?|bucks?)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:rs\.?|inr|₹|rupees?|rupay?|bucks?|\/-|k\b)/i;
  const unitMatch = lower.match(unitRegex);

  if (unitMatch) {
    const rawVal = unitMatch[1] || unitMatch[2];
    amount = lower.includes(rawVal + 'k') ? parseFloat(rawVal) * 1000 : parseFloat(rawVal);
  } else {
    // Only parse numbers if not part of a date like "31 november"
    const isDateNumber = lower.match(new RegExp(`(\\d{1,2})\\s+${monthPattern.source}`, 'i'));
    const wordsNum = wordsToNumber(lower);
    if (wordsNum > 0) {
      amount = wordsNum;
    } else {
      const numMatch = lower.match(/\b(\d+(?:\.\d+)?)\b/);
      if (numMatch && (!isDateNumber || isDateNumber[1] !== numMatch[1])) {
        amount = parseFloat(numMatch[1]);
      }
    }
  }

  // Extract due date if present
  const dueDatePatterns = [
    /(?:which\s+)?(?:due\s*(?:date)?(?:\s*is|\s*on|\s*:)?)\s*([a-zA-Z0-9\s,]+?)(?:\s+for|\s+to|\s+in|\s*$)/i,
    /(?:by|till|before|tak|tarikh)\s+([a-zA-Z0-9\s,]+?)(?:\s+for|\s+to|\s+in|\s*$)/i,
    new RegExp(`(\\d{1,2}(?:st|nd|rd|th)?\\s+${monthPattern.source}(?:\\s+\\d{4})?)`, 'i'),
  ];

  for (const pat of dueDatePatterns) {
    const m = lower.match(pat);
    if (m && m[1]) {
      const candidate = m[1].trim();
      if (!['khata', 'nitish', 'account', 'number', 'id'].includes(candidate)) {
        dueDate = resolveRelativeDate(candidate);
        break;
      }
    }
  }

  // If action was ADD but no currency amount was specified and a due date was found:
  if (action === 'ADD' && (amount === null || amount === 0) && dueDate && dueDate !== 'Not Specified') {
    action = 'UPDATE_DUE_DATE';
  }

  // Extract target person name if not already ID
  if (!name || name.startsWith('ID ')) {
    const namePatterns = [
      /(?:to|for|against|in|from)\s+([a-zA-Z\s]+?)(?:'s)?(?:\s+khata|\s+account|\s+tab|\s+ledger|\s+which|\s+due|\s+whose|$)/i,
      /(?:to|for|from)\s+([a-zA-Z]+)(?:\s+whose|\s+which|\s+due|$|\s+amount)/i,
      /([a-zA-Z]+)\s+(?:ko|ka|ke\s+khate|se)\b/i,
      /([a-zA-Z]+)\s+khata\b/i,
    ];

    for (const pat of namePatterns) {
      const m = lower.match(pat);
      if (m && m[1]) {
        const cleaned = m[1].trim().replace(/\b(the|a|an|add|put|give|take|credit|debit|his|her|my|remove|subtract|id|number)\b/gi, '').trim();
        if (cleaned.length >= 2 && !['khata', 'rupees', 'rupay', 'due', 'date'].includes(cleaned.toLowerCase())) {
          name = capitalize(cleaned);
          break;
        }
      }
    }
  }

  if (!name && targetId) {
    name = `ID ${targetId}`;
  }

  return {
    action,
    targetId,
    name,
    newName,
    amount,
    dueDate,
    isCompleteRemove,
    engine: 'Smart Local NLP (Fallback)',
    isGroq: false,
  };
}

function capitalize(s) {
  if (!s) return null;
  return s
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Check if Groq backend service has active key
export async function checkGroqStatus() {
  try {
    const res = await fetch(`${API_BASE}/groq/status`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    // ignore
  }
  return { active: false };
}

// PRIMARY: Groq Cloud LPU AI Engine (Free & Ultra-Fast Voice CRUD)
export async function parseWithGroqAI({ text, apiKey }) {
  // 1. Try Backend Proxy endpoint first
  try {
    const backendRes = await fetch(`${API_BASE}/groq/parse-voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, apiKey }),
    });

    if (backendRes.ok) {
      const backendData = await backendRes.json();
      if (backendData.success && backendData.data) {
        return {
          ...backendData.data,
          isGroq: true,
        };
      }
    }
  } catch (err) {
    // Continue to direct browser call if backend unreachable
  }

  // 2. Direct Browser Call to Groq Cloud API if client key provided
  if (apiKey && apiKey.trim()) {
    const startTime = Date.now();
    try {
      const prompt = `You are a precision Voice CRUD engine for an Indian small business credit ledger (e-Khata).
Analyze: "${text}"
Customers can be identified by NAME or by ID NUMBER (e.g. "id number 1", "id 2").
CRITICAL RULE: If the user says "add <date> to id <number>" or "add <date> to <name>" (such as "add 31 november to id number 2") and NO money/rupees is specified, action is strictly "UPDATE_DUE_DATE", amount is null, and dueDate is the specified date.

Respond STRICTLY with valid JSON only:
{
  "action": "ADD" | "SUBTRACT" | "DELETE" | "RENAME" | "UPDATE_DUE_DATE" | "SETTLE",
  "targetId": integer or null,
  "name": "Target Person Name if mentioned, or 'ID ' + targetId",
  "newName": "New Person Name (ONLY if action is RENAME, otherwise null)",
  "amount": number or null,
  "dueDate": "formatted date or null",
  "isCompleteRemove": true/false
}`;

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        }),
      });

      if (groqRes.ok) {
        const data = await groqRes.json();
        const rawJson = data.choices?.[0]?.message?.content;
        if (rawJson) {
          const clean = rawJson.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(clean);
          let targetId = null;
          if (parsed.targetId !== undefined && parsed.targetId !== null) {
            targetId = parseInt(parsed.targetId, 10);
            if (isNaN(targetId)) targetId = null;
          }
          return {
            action: (parsed.action || 'ADD').toUpperCase(),
            targetId,
            name: capitalize(parsed.name || parsed.accountHolder || parsed.person) || (targetId ? `ID ${targetId}` : null),
            newName: capitalize(parsed.newName || parsed.new_name),
            amount: parsed.amount !== null && parsed.amount !== undefined ? Number(parsed.amount) : null,
            dueDate: parsed.dueDate || parsed.due_date || 'Not Specified',
            isCompleteRemove: Boolean(parsed.isCompleteRemove || parsed.is_complete_remove),
            engine: 'Groq Cloud LPU (openai/gpt-oss-120b)',
            latencyMs: Date.now() - startTime,
            isGroq: true,
          };
        }
      }
    } catch (directErr) {
      console.warn('Groq direct fetch failed:', directErr);
    }
  }

  // 3. Fallback to Local Smart NLP Engine
  return parseLocalSmartIntent(text);
}
