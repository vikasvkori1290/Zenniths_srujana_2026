import { Router } from 'express';

const router = Router();

// GET /api/groq/status - Verify Groq connectivity
router.get('/status', (req, res) => {
  const isKeyConfigured = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim());
  res.json({
    success: true,
    active: isKeyConfigured,
    model: 'openai/gpt-oss-120b',
    provider: 'Groq Cloud LPU AI',
    keyPreview: isKeyConfigured ? `${process.env.GROQ_API_KEY.slice(0, 7)}...${process.env.GROQ_API_KEY.slice(-4)}` : null,
  });
});

function normalizeSpokenTranscript(text) {
  if (!text) return '';
  let str = text;
  // Speech-to-text number homophones after ID / customer / number / # / no
  str = str.replace(/\b(id\s*(?:number)?|customer\s*#?|number|#|no\.?)\s*(?:to|too|two|do)\b/gi, '$1 2');
  str = str.replace(/\b(id\s*(?:number)?|customer\s*#?|number|#|no\.?)\s*(?:one|won|ek)\b/gi, '$1 1');
  str = str.replace(/\b(id\s*(?:number)?|customer\s*#?|number|#|no\.?)\s*(?:three|tree|teen)\b/gi, '$1 3');
  str = str.replace(/\b(id\s*(?:number)?|customer\s*#?|number|#|no\.?)\s*(?:four|fore|for|chaar)\b/gi, '$1 4');
  str = str.replace(/\b(id\s*(?:number)?|customer\s*#?|number|#|no\.?)\s*(?:five|paanch)\b/gi, '$1 5');
  str = str.replace(/\b(id\s*(?:number)?|customer\s*#?|number|#|no\.?)\s*(?:six|chhah)\b/gi, '$1 6');
  str = str.replace(/\b(id\s*(?:number)?|customer\s*#?|number|#|no\.?)\s*(?:seven|saat)\b/gi, '$1 7');
  str = str.replace(/\b(id\s*(?:number)?|customer\s*#?|number|#|no\.?)\s*(?:eight|ate|aath)\b/gi, '$1 8');
  str = str.replace(/\b(id\s*(?:number)?|customer\s*#?|number|#|no\.?)\s*(?:nine|nau)\b/gi, '$1 9');
  str = str.replace(/\b(id\s*(?:number)?|customer\s*#?|number|#|no\.?)\s*(?:ten|tin|das)\b/gi, '$1 10');
  return str;
}

// POST /api/groq/parse-voice - Intelligent Voice CRUD Engine
router.post('/parse-voice', async (req, res) => {
  const startTime = Date.now();
  try {
    const { text, apiKey, currentCustomers } = req.body;
    const keyToUse = apiKey || process.env.GROQ_API_KEY;

    if (!keyToUse) {
      return res.status(400).json({
        success: false,
        error: 'Groq API Key is required. Please provide it in request or set GROQ_API_KEY in server/.env.',
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Spoken text prompt is required.',
      });
    }

    const normalizedText = normalizeSpokenTranscript(text.trim());
    const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    let currentCustomersSummary = 'No customers currently in the ledger.';
    if (Array.isArray(currentCustomers) && currentCustomers.length > 0) {
      currentCustomersSummary = currentCustomers
        .map(
          (c) =>
            `- ID #${c.idNumber}: Name "${c.name}", Total Due: ₹${c.totalAmount || 0}, Due Date: "${c.dueDate || 'Not Specified'}"`
        )
        .join('\n');
    }

    const systemPrompt = `You are a precision Voice CRUD engine for an Indian small business credit ledger (e-Khata).
Today's date is: ${todayStr}.
Analyze any spoken customer command (English, Hindi, Hinglish, informal slang, word digits, or shorthand).

CURRENT LEDGER CUSTOMERS DATABASE:
${currentCustomersSummary}

RULES FOR MATCHING CUSTOMERS:
- Match against the database above: If the spoken command refers to an existing customer by their ID (e.g. "ID 2", "ID to", "customer 1"), or by their Name (e.g. "Nitish", "Nitesh", "Vikas", including spelling/phonetic variations like Nitish/Nitesh, Vikas/Vikash), resolve to that EXACT customer and output their "targetId" and ledger "name".
- If the customer is new and not in the ledger database, set "targetId": null and "name": "New Person Name".

HINDI / HINGLISH INTENT RULES:
- "ADD": Giving credit or recording money owed (e.g. "add 20rs to nitish", "nitish ko 20 rupay do", "nitish ne 50 ka samaan liya", "id 1 ko 100 chadhaye", "likho 200 vikas ke khate mein").
- "SUBTRACT": Deducting payment received (e.g. "remove 20rs from nitish", "nitish paid 30", "nitish ne 50 de diye", "nitish ne 20 rupay jama karwaye / jama kiye", "id 1 se 100 mile", "50 rupay kam karo / ghatao").
- "DELETE": Completely removing customer (e.g. "delete id 2", "nitish ko list se hata do", "remove nitish totally", "naam kaat do").
- "RENAME": Setting or changing a name (e.g. "the customer name of ID 2 is Nitesh", "set name of ID 2 as Rahul", "change name from nitish to vikas", "id 2 ka naam Nitesh likh do").
- "UPDATE_DUE_DATE": Setting or updating due date (e.g. "add 31 november to id number 2", "tarikh 30 november kar do", "nitish 15 december ko dega"). When no currency amount is mentioned, amount MUST be null!
- "SETTLE": Clearing full account (e.g. "settle id 1", "nitish ka hisaab barabar kar do", "hisaab chukta", "mark paid").

Respond STRICTLY with valid JSON only, without markdown fences or additional text:
{
  "action": "ADD" | "SUBTRACT" | "DELETE" | "RENAME" | "UPDATE_DUE_DATE" | "SETTLE",
  "targetId": integer or null,
  "name": "Target Person Name if mentioned, or 'ID ' + targetId",
  "newName": "New Person Name (ONLY if action is RENAME, otherwise null)",
  "amount": numeric number or null (e.g. 20, 50, 500; MUST BE NULL if only date is specified)",
  "dueDate": "formatted date string like '31 November' or null",
  "isCompleteRemove": true/false,
  "explanation": "Brief description of action"
}`;

    const modelCandidates = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
    let lastError = null;
    let parsedContent = null;
    let modelUsed = 'openai/gpt-oss-120b';

    for (const model of modelCandidates) {
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${keyToUse}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: normalizedText },
            ],
            temperature: 0.1,
          }),
        });

        if (groqResponse.ok) {
          const data = await groqResponse.json();
          const rawMessage = data.choices[0].message.content;
          const cleanJsonStr = rawMessage.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
          const obj = JSON.parse(cleanJsonStr);

          // Capitalize names
          const cap = (s) => (s ? s.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : null);

          // Clean names to prevent "Id Null", "Null", etc.
          const cleanName = (val) => {
            if (!val) return null;
            const str = String(val).trim();
            if (/^(null|undefined|none|id\s*null|id\s*undefined)$/i.test(str)) return null;
            return cap(str);
          };

          // Extract targetId (as integer if present)
          let targetId = null;
          if (obj.targetId !== undefined && obj.targetId !== null) {
            targetId = parseInt(obj.targetId, 10);
            if (isNaN(targetId)) targetId = null;
          }

          // Fallback regex to capture targetId from normalizedText if Groq omitted it
          if (targetId === null) {
            const rx = normalizedText.match(/(?:id\s*(?:number)?|customer\s*#?|number|#)\s*(\d+)/i);
            if (rx) targetId = parseInt(rx[1], 10);
          }

          const rawName = cleanName(obj.name || obj.accountHolder || obj.person || obj.customer);
          const name = rawName || (targetId ? `ID ${targetId}` : null);
          const newName = cleanName(obj.newName || obj.new_name);

          parsedContent = {
            action: (obj.action || 'ADD').toUpperCase(),
            targetId,
            name,
            newName,
            amount: obj.amount !== null && obj.amount !== undefined ? Number(obj.amount) : null,
            dueDate: obj.dueDate || obj.due_date || null,
            isCompleteRemove: Boolean(obj.isCompleteRemove || obj.is_complete_remove),
            explanation: obj.explanation || null,
          };
          modelUsed = model;
          break;
        } else {
          const errData = await groqResponse.json().catch(() => ({}));
          lastError = errData.error?.message || `Groq status ${groqResponse.status}`;
        }
      } catch (e) {
        lastError = e.message;
      }
    }

    if (!parsedContent) {
      return res.status(500).json({
        success: false,
        error: lastError || 'Failed to parse voice CRUD command with Groq models',
      });
    }

    const latencyMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      data: {
        ...parsedContent,
        engine: `Groq AI (${modelUsed})`,
        latencyMs,
      },
    });
  } catch (error) {
    console.error('Groq route error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while processing with Groq',
    });
  }
});

export default router;
