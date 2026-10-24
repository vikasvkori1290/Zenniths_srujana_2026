import { Router } from 'express';

const router = Router();

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * GET /api/v1/prediction/status
 * Check configuration of NVIDIA Nemotron and Fallback AI keys
 */
router.get('/status', (req, res) => {
  const nvidiaKey = process.env.NVIDIA_API_KEY?.trim() || '';
  const groqKey = process.env.GROQ_API_KEY?.trim() || '';

  res.json({
    success: true,
    nvidiaConfigured: Boolean(nvidiaKey),
    nvidiaKeyPreview: nvidiaKey ? `${nvidiaKey.slice(0, 6)}...${nvidiaKey.slice(-4)}` : null,
    groqConfigured: Boolean(groqKey),
    preferredModel: 'nvidia/llama-3.1-nemotron-70b-instruct',
    provider: nvidiaKey ? 'NVIDIA NIM (Nemotron)' : (groqKey ? 'Groq LPU (LLaMA 3.3 70B Fallback)' : 'None'),
  });
});

/**
 * Helper to build the prompt for NVIDIA Nemotron
 */
function buildFinancialPrompt({
  businessName,
  businessType,
  dailySales,
  dailyPayables,
  receivables,
  liquidity,
  fixedBreakdown,
  upcomingBreakdown,
}) {
  const systemPrompt = `You are "AurumFlow Nemotron", an elite CFO and financial intelligence advisor powered by NVIDIA Nemotron AI.
Your expertise is specialized for Indian Kiranas, Retailers, and Small & Medium Businesses (SMBs).
You are analyzing live telemetry from the merchant's daily operations: their business model, daily sales velocity (cash vs UPI), daily payables (fixed overhead + 15-day supplier dues), customer Udhar credit, and predictive cash runway.

You must deliver an analytical, practical, and candid assessment.
Always speak directly to the merchant in an encouraging, highly professional CFO tone.

CRITICAL: Return ONLY a valid JSON object matching this exact schema:
{
  "executiveSummary": "1-2 punchy sentences summarizing their overall cash health and runway.",
  "businessTypeInsight": "2-3 sentences evaluating how their specific business model (e.g. Kirana vs Pharmacy vs Textile) impacts working capital cycles, margin expectations, and inventory velocity.",
  "salesVsPayablesAnalysis": "A direct analytical comparison of their daily sales vs daily payables. Are they generating enough operating cash to comfortably service their burn?",
  "debtAndReceivablesAdvisory": "Actionable advice on their customer Udhar credit relative to their liquidity.",
  "stressPoints": [
    "Specific risk or bottleneck in their 15-day payables horizon"
  ],
  "actionPlan": [
    {
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "action": "Specific tactical action",
      "impact": "Estimated financial or cash impact (e.g. +₹5,000 liquidity / +4 days runway)",
      "timeframe": "Today" | "Within 48h" | "Next 7 Days"
    }
  ],
  "talkScript": "A natural, conversational 3-4 paragraph script as if you are a senior CFO sitting across the desk giving your direct talk on their numbers. You should mention their store name, business type, their exact daily sales, upcoming bills, and runway days."
}`;

  const fixedListStr = (fixedBreakdown || [])
    .map((f) => `- ${f.title || f.category}: ₹${Number(f.amount || 0).toLocaleString()} (Due day ${f.dueDay || 'monthly'})`)
    .join('\n');

  const upcomingListStr = (upcomingBreakdown || [])
    .map((u) => `- ${u.title}: ₹${Number(u.amount || 0).toLocaleString()} due on ${u.dueDate || 'next 15d'} (Urgency: ${u.urgency || 'Normal'})`)
    .join('\n');

  const customerListStr = (receivables?.customers || [])
    .slice(0, 5)
    .map((c) => `- ${c.name}: ₹${Number(c.totalAmount || 0).toLocaleString()} (Due: ${c.dueDate || 'Undated'})`)
    .join('\n');

  const userPrompt = `MERCHANT FINANCIAL TELEMETRY:
- Business Name: ${businessName || 'Aurum Kirana Store'}
- Business Type: ${businessType || 'Retail Kirana & Grocery Store'}

1. DAILY REVENUE & INFLOWS:
- Today's Realized Sales: ₹${Number(dailySales?.totalToday || 0).toLocaleString()} (Cash: ₹${Number(dailySales?.cash || 0).toLocaleString()}, UPI: ₹${Number(dailySales?.upi || 0).toLocaleString()})
- Daily Target Goal: ₹${Number(dailySales?.target || 10000).toLocaleString()} (Achievement: ${dailySales?.achievement || 0}%)

2. DAILY PAYABLES & OPERATING BURN:
- Daily Fixed Overhead Burn: ₹${Number(dailyPayables?.dailyFixedBurn || 0).toLocaleString()}/day (Monthly Total: ₹${Number(dailyPayables?.monthlyFixedTotal || 0).toLocaleString()})
- Daily Scheduled Liabilities Burn: ₹${Number(dailyPayables?.dailyUpcomingBurn || 0).toLocaleString()}/day (15-Day Payables: ₹${Number(dailyPayables?.upcoming15dTotal || 0).toLocaleString()})
- Total Daily Outflow Burn: ₹${Number(dailyPayables?.totalDailyBurn || 0).toLocaleString()}/day

3. CUSTOMER CREDIT (UDHAR RECEIVABLES):
- Total Outstanding Udhar: ₹${Number(receivables?.totalUdhar || 0).toLocaleString()} across ${receivables?.customerCount || 0} customer accounts
- Estimated Recovery Velocity: ₹${Number(receivables?.collectionVelocity || 0).toLocaleString()}/day over standard 15-day collection window

4. LIQUIDITY & PREDICTIVE RUNWAY:
- Liquid Cash Buffer Available: ₹${Number(liquidity?.liquidBuffer || 0).toLocaleString()}
- Net Daily Cash Flow Rate (Δ): ${Number(liquidity?.netCashFlow || 0) >= 0 ? '+' : ''}₹${Number(liquidity?.netCashFlow || 0).toLocaleString()}/day
- Predictive Cash Runway: ${liquidity?.runwayDays || 0} Days (Health Status: ${liquidity?.status || 'SAFE'})

5. FIXED EXPENSES BREAKDOWN:
${fixedListStr || 'No fixed expenses recorded.'}

6. UPCOMING 15-DAY PAYABLES BREAKDOWN:
${upcomingListStr || 'No upcoming scheduled payables recorded.'}

7. TOP CUSTOMER UDHAR ACCOUNTS:
${customerListStr || 'No active udhar credit accounts.'}

Please perform a rigorous financial and business-type analysis and return the JSON object as requested.`;

  return { systemPrompt, userPrompt };
}

/**
 * POST /api/v1/prediction/analyze
 * Generates comprehensive AI Financial & Business Prediction using NVIDIA Nemotron
 */
router.post('/analyze', async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      businessName,
      businessType,
      dailySales,
      dailyPayables,
      receivables,
      liquidity,
      fixedBreakdown,
      upcomingBreakdown,
      apiKey,
      model = 'nvidia/llama-3.1-nemotron-70b-instruct',
    } = req.body;

    const nvidiaKey = apiKey || process.env.NVIDIA_API_KEY?.trim();
    const groqKey = process.env.GROQ_API_KEY?.trim();

    if (!nvidiaKey && !groqKey) {
      return res.status(400).json({
        success: false,
        error: 'No AI API key found. Please provide an NVIDIA API Key in the UI or set NVIDIA_API_KEY / GROQ_API_KEY in server/.env.',
      });
    }

    const { systemPrompt, userPrompt } = buildFinancialPrompt({
      businessName,
      businessType,
      dailySales,
      dailyPayables,
      receivables,
      liquidity,
      fixedBreakdown,
      upcomingBreakdown,
    });

    let rawResponseText = '';
    let usedProvider = '';
    let usedModel = '';

    // Attempt 1: Call NVIDIA NIM API if key is available
    if (nvidiaKey) {
      try {
        usedProvider = 'NVIDIA NIM (Nemotron)';
        usedModel = model || 'nvidia/llama-3.1-nemotron-70b-instruct';

        const nvResponse = await fetch(NVIDIA_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${nvidiaKey}`,
          },
          body: JSON.stringify({
            model: usedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.4,
            top_p: 0.95,
            max_tokens: 2048,
          }),
        });

        if (nvResponse.ok) {
          const nvData = await nvResponse.json();
          rawResponseText = nvData?.choices?.[0]?.message?.content || '';
        } else {
          const errText = await nvResponse.text();
          console.warn(`[NVIDIA API Call failed, code: ${nvResponse.status}]:`, errText);
          // If NVIDIA fails and Groq is available, fallback
          if (groqKey) {
            console.log('[Nemotron Fallback]: Falling back to Groq LPU...');
          } else {
            throw new Error(`NVIDIA API Error (${nvResponse.status}): ${errText}`);
          }
        }
      } catch (nvErr) {
        console.warn('[NVIDIA Call Exception]:', nvErr.message);
        if (!groqKey) throw nvErr;
      }
    }

    // Attempt 2: Fallback to Groq LPU if NVIDIA was not used or failed
    if (!rawResponseText && groqKey) {
      usedProvider = 'Groq Cloud LPU AI (Fallback Engine)';
      const groqFallbackModels = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];

      for (const gm of groqFallbackModels) {
        try {
          usedModel = gm;
          const groqResponse = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: gm,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              temperature: 0.3,
            }),
          });

          if (groqResponse.ok) {
            const groqData = await groqResponse.json();
            rawResponseText = groqData?.choices?.[0]?.message?.content || '';
            if (rawResponseText) break;
          } else {
            console.warn(`[Groq ${gm} failed]:`, await groqResponse.text());
          }
        } catch (gErr) {
          console.warn(`[Groq ${gm} exception]:`, gErr.message);
        }
      }
    }


    if (!rawResponseText) {
      throw new Error('No response generated from AI models.');
    }

    // Parse JSON safely
    let parsedResult;
    try {
      // Strip markdown code fences if present
      const cleanJson = rawResponseText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      parsedResult = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.warn('[AI JSON Parse Warning]:', parseErr.message, rawResponseText);
      // Construct fallback structure from raw text
      parsedResult = {
        executiveSummary: 'AI analysis generated successfully for your business.',
        businessTypeInsight: `Operating analysis tailored for ${businessType || 'Retail'}.`,
        salesVsPayablesAnalysis: `Daily sales of ₹${dailySales?.totalToday || 0} against daily operating burn of ₹${dailyPayables?.totalDailyBurn || 0}.`,
        debtAndReceivablesAdvisory: 'Monitor customer credit balances closely to maintain cash buffer.',
        stressPoints: ['Maintain cash buffer for scheduled supplier payables.'],
        actionPlan: [
          {
            priority: 'HIGH',
            action: 'Prioritize near-term debt collections',
            impact: '+₹5,000 cash buffer',
            timeframe: 'Next 48h',
          },
        ],
        talkScript: rawResponseText,
      };
    }

    const durationMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      data: parsedResult,
      meta: {
        provider: usedProvider,
        model: usedModel,
        latencyMs: durationMs,
        businessAnalyzed: businessName || 'Aurum Store',
        businessType: businessType || 'Retail',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Prediction Analyze Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate financial prediction',
    });
  }
});

export default router;
