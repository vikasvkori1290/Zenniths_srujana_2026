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

// POST /api/groq/parse-voice - Intelligent Voice CRUD Engine
router.post('/parse-voice', async (req, res) => {
  const startTime = Date.now();
  try {
    const { text, apiKey } = req.body;
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

    const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const systemPrompt = `You are a precision Voice CRUD engine for an Indian small business credit ledger (e-Khata).
Today's date is: ${todayStr}.
Analyze any spoken customer command (English, Hindi, Hinglish, informal slang, word digits, or shorthand).

Customers in the ledger can be identified either by their NAME (e.g. "Nitish", "Vikas") OR by their ID NUMBER (e.g. "id number 1", "id 2", "customer 3", "id number 2", "number 2").

Identify the exact CRUD intent:
1. "ADD": Add money/credit to a person or ID number (e.g. "add 20rs to nitish", "add 20rs to id number 1", "add 50 to id 2", "id number 1 ko 20 rupay do", "create account for vikas with 200").
2. "SUBTRACT": Deduct or remove partial money from a person or ID number (e.g. "remove 20rs from id number 1", "subtract 50 from id 2", "nitish paid 30", "deduct 40rs from sunil").
3. "DELETE": Completely remove a person or ID number from the list (e.g. "delete id number 2", "remove id 1 from list", "completely remove nitish", "remove nitish from the list", "delete rahul").
4. "RENAME": Change or update a person's name (e.g. "change name of id number 1 to Vikas", "change name from nitish to vikas", "rename id 2 to Rahul").
5. "UPDATE_DUE_DATE": Set, edit, or add payment due date without changing the balance/amount (e.g. "add 31 november to id number 2", "add 30 november to id 1", "set due date 30 november to id 2", "change due date of nitish to 15 december", "id number 2 ka date 31 november kar do"). 
CRITICAL RULE FOR "UPDATE_DUE_DATE": If the user says "add <date> to id <number>" or "add <date> to <name>" (such as "add 31 november to id number 2") and NO money/rupees amount is mentioned, the action is strictly "UPDATE_DUE_DATE", "amount" MUST BE null, and "dueDate" MUST be the specified date.
6. "SETTLE": Settle or clear full account (e.g. "settle id number 1", "settle nitish khata", "mark id 2 as paid").

Respond STRICTLY with valid JSON only, without markdown fences or additional text:
{
  "action": "ADD" | "SUBTRACT" | "DELETE" | "RENAME" | "UPDATE_DUE_DATE" | "SETTLE",
  "targetId": integer or null (e.g. 1, 2 if user mentions "id number 1", "id 2", etc.),
  "name": "Target Person Name if mentioned, or 'ID ' + targetId (e.g. 'Nitish' or 'ID 2')",
  "newName": "New Person Name (ONLY if action is RENAME, otherwise null)",
  "amount": numeric number or null (e.g. 20, 50, 500; MUST BE NULL if only date is specified like 'add 31 november to id number 2')",
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
              { role: 'user', content: text },
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

          // Extract targetId (as integer if present)
          let targetId = null;
          if (obj.targetId !== undefined && obj.targetId !== null) {
            targetId = parseInt(obj.targetId, 10);
            if (isNaN(targetId)) targetId = null;
          }

          parsedContent = {
            action: (obj.action || 'ADD').toUpperCase(),
            targetId,
            name: cap(obj.name || obj.accountHolder || obj.person || obj.customer) || (targetId ? `ID ${targetId}` : null),
            newName: cap(obj.newName || obj.new_name),
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
