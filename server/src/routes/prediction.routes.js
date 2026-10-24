import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CALENDAR_PATH = path.join(__dirname, '../data/calendar.json');

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// In-memory cache for Context Adjuster: key -> { timestamp, data }
const contextAdjusterCache = new Map();

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

  const userPrompt = `MERCHANT FINANCIAL TELEMETRY (RETAINED CASH & TIMELINE MODEL):
- Business Name: ${businessName || 'Aurum Kirana Store'}
- Business Type: ${businessType || 'Retail Kirana & Grocery Store'}

1. SALES & RETAINED CASH:
- Today's Gross Sales: ₹${Number(dailySales?.totalToday || 0).toLocaleString()} (Cash: ₹${Number(dailySales?.cash || 0).toLocaleString()}, UPI: ₹${Number(dailySales?.upi || 0).toLocaleString()})
- Gross Margin %: ${dailySales?.grossMarginPct || 25}% (Cost of restocking: ${(100 - (dailySales?.grossMarginPct || 25))}% of sales)
- Daily Running Costs: ₹${Number(dailySales?.dailyRunningCost || 500).toLocaleString()}/day (excluding Rent/EMI)
- Daily Retained Cash: ₹${Number(dailySales?.retainedCashPerDay || 1500).toLocaleString()}/day ((Sales × Margin) - Daily Running Costs)
- NOTE: The owner keeps ONLY retained cash (₹${dailySales?.retainedCashPerDay || 1500}/d), NOT gross sales! Never treat gross sales as spendable cash.

2. TIMELINE DUES & SCHEDULED OBLIGATIONS:
- Rent, EMI, and vendor payments are discrete timeline events (NOT amortized daily to prevent double-counting).
- 15-Day Scheduled Obligations Total: ₹${Number(dailyPayables?.duesWithin15Days || dailyPayables?.upcoming15dTotal || 0).toLocaleString()}

3. CUSTOMER CREDIT (UDHAR RECEIVABLES - EXPECTED ONLY):
- Total Outstanding Udhar: ₹${Number(receivables?.totalUdhar || 0).toLocaleString()} across ${receivables?.customerCount || 0} customer accounts
- IMPORTANT: This is EXPECTED future recovery, NEVER counted as immediate cash in hand!

4. LIQUIDITY & TIMELINE STATUS:
- Received Cash in Hand (Certain): ₹${Number(liquidity?.receivedCashInHand || liquidity?.liquidBuffer || 0).toLocaleString()}
- Safety Buffer: ₹${Number(liquidity?.safetyBuffer || 1500).toLocaleString()} (3 days of daily running costs)
- Cash Horizon Status: ${liquidity?.status || 'SAFE'}
- Timeline Forecast: ${liquidity?.headlineMetric || 'No Shortfall in 60 Days'}

5. FIXED EXPENSES BREAKDOWN (Timeline Dates):
${fixedListStr || 'No fixed expenses recorded.'}

6. UPCOMING 15-DAY PAYABLES BREAKDOWN:
${upcomingListStr || 'No upcoming scheduled payables recorded.'}

7. TOP CUSTOMER UDHAR ACCOUNTS:
${customerListStr || 'No active udhar credit accounts.'}

Please perform a rigorous financial and business-type analysis using RETAINED CASH and return the JSON object as requested.`;


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

/**
 * Clamp multiplier values between 0.6 and 1.6 with low <= base <= high
 */
export function clampMultipliersList(adjustments = []) {
  if (!Array.isArray(adjustments)) return [];
  return adjustments.map((adj) => {
    let low = Number(adj?.multiplier?.low ?? 1.0);
    let base = Number(adj?.multiplier?.base ?? 1.0);
    let high = Number(adj?.multiplier?.high ?? 1.0);

    low = Math.min(1.6, Math.max(0.6, isNaN(low) ? 1.0 : low));
    base = Math.min(1.6, Math.max(0.6, isNaN(base) ? 1.0 : base));
    high = Math.min(1.6, Math.max(0.6, isNaN(high) ? 1.0 : high));

    if (low > base) low = base;
    if (high < base) high = base;

    return {
      event: adj?.event || 'Upcoming Event',
      window_start: adj?.window_start || '',
      window_end: adj?.window_end || '',
      multiplier: {
        low: Math.round(low * 100) / 100,
        base: Math.round(base * 100) / 100,
        high: Math.round(high * 100) / 100,
      },
      confidence: ['low', 'medium', 'high'].includes(adj?.confidence) ? adj.confidence : 'medium',
      reason:
        typeof adj?.reason === 'string' && adj.reason.trim()
          ? adj.reason.trim()
          : 'Context adjustment based on local seasonal event pattern.',
    };
  });
}

/**
 * Domain-specific rule generator when LLM is unavailable or offline
 */
export function generateDomainAdjustments(businessType, events = []) {
  const bType = (businessType || 'kirana').toLowerCase();
  const isSweets = bType.includes('sweet') || bType.includes('bakery') || bType.includes('mithai');
  const isHardware = bType.includes('hardware') || bType.includes('paint') || bType.includes('electrical');
  const isStationery = bType.includes('stationer') || bType.includes('book');

  return events.map((ev) => {
    const name = ev.name || ev.event || '';
    const start = ev.start || ev.window_start;
    const end = ev.end || ev.window_end;

    if (isSweets) {
      if (name.includes('Diwali Pre-Festival') || name.includes('Dhanteras')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.35, base: 1.55, high: 1.6 },
          confidence: 'high',
          reason: 'Diwali gifting rush creates surge in orders for sweet boxes and confections.',
        };
      }
      if (name.includes('Diwali / Deepavali')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.25, base: 1.45, high: 1.6 },
          confidence: 'high',
          reason: 'Peak festival days with non-stop counter sales for fresh traditional sweets.',
        };
      }
      if (name.includes('Post-Diwali Slump')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 0.6, base: 0.7, high: 0.8 },
          confidence: 'high',
          reason: 'Sharp drop in sweet consumption as households finish gifted festival sweets.',
        };
      }
      if (name.includes('Wedding')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.2, base: 1.35, high: 1.5 },
          confidence: 'high',
          reason: 'Wedding season drives large catering and bulk sweet box orders.',
        };
      }
      if (name.includes('Christmas')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.25, base: 1.4, high: 1.55 },
          confidence: 'high',
          reason: 'Holiday season sparks surging sales for plum cakes, baked cookies, and confections.',
        };
      }
      if (name.includes('New Year')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.2, base: 1.35, high: 1.5 },
          confidence: 'high',
          reason: 'New Year celebrations trigger high demand for party desserts and cakes.',
        };
      }
      if (name.includes('Sankranti') || name.includes('Pongal')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.2, base: 1.35, high: 1.5 },
          confidence: 'high',
          reason: 'Traditional sesame sweets and jaggery delicacies experience seasonal harvest peak.',
        };
      }
      if (name.includes('School')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.0, base: 1.0, high: 1.05 },
          confidence: 'low',
          reason: 'School stationery restock is irrelevant to sweet and bakery shop sales.',
        };
      }
      if (name.includes('Monsoon') || name.includes('Rain')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 0.8, base: 0.9, high: 0.95 },
          confidence: 'medium',
          reason: 'Heavy rain spells reduce walk-in customer footfall to confectionery shops.',
        };
      }
    } else if (isHardware) {
      if (name.includes('Diwali Pre-Festival') || name.includes('Dhanteras')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 0.95, base: 1.1, high: 1.2 },
          confidence: 'medium',
          reason: 'Pre-festival home repainting and minor lighting upgrades provide a slight lift to hardware retail.',
        };
      }
      if (name.includes('Diwali / Deepavali')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 0.65, base: 0.7, high: 0.8 },
          confidence: 'high',
          reason: 'Construction workers and contractors halt site work for festive holidays, dropping trade sales.',
        };
      }
      if (name.includes('Monsoon') || name.includes('Rain')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 0.6, base: 0.7, high: 0.8 },
          confidence: 'high',
          reason: 'Heavy monsoon rains stall exterior painting, masonry, and active construction sites.',
        };
      }
      if (name.includes('School') || name.includes('Wedding')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.0, base: 1.0, high: 1.0 },
          confidence: 'low',
          reason: 'This event has no operational relevance to hardware, paints, and electrical stores.',
        };
      }
    } else if (isStationery) {
      if (name.includes('School Mid-Term')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.3, base: 1.45, high: 1.6 },
          confidence: 'high',
          reason: 'School term resumption triggers a rush for notebooks, pens, and student supplies.',
        };
      }
      if (name.includes('Diwali / Deepavali')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 0.65, base: 0.7, high: 0.8 },
          confidence: 'high',
          reason: 'Schools, coaching classes, and offices are closed during the Deepavali break.',
        };
      }
    } else {
      // Default: Kirana / Retail Provisions Store
      if (name.includes('Diwali Pre-Festival') || name.includes('Dhanteras')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.15, base: 1.3, high: 1.45 },
          confidence: 'high',
          reason: 'Households stock up heavily on grocery provisions, edible oil, dry fruits, and puja essentials.',
        };
      }
      if (name.includes('Diwali / Deepavali')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.05, base: 1.15, high: 1.25 },
          confidence: 'high',
          reason: 'Morning milk, dairy, and pooja supply sales spike before neighborhood stores close early.',
        };
      }
      if (name.includes('Post-Diwali Slump')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 0.7, base: 0.8, high: 0.9 },
          confidence: 'high',
          reason: 'Households consume pantry inventories stocked before the festival, slowing grocery purchases.',
        };
      }
      if (name.includes('Chhath Puja')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.05, base: 1.15, high: 1.25 },
          confidence: 'medium',
          reason: 'Puja offerings increase purchases of seasonal produce, wheat flour, and sugarcane.',
        };
      }
      if (name.includes('Karthika Masa') || name.includes('Deepotsava')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.1, base: 1.2, high: 1.3 },
          confidence: 'high',
          reason: 'Deepotsava temple visits lift demand for sesame oil, wicks, camphor, and coconuts.',
        };
      }
      if (name.includes('Wedding')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.1, base: 1.2, high: 1.3 },
          confidence: 'high',
          reason: 'Family wedding celebrations drive bulk provisions and wholesale kitchen ingredient demand.',
        };
      }
      if (name.includes('Monsoon') || name.includes('Rain')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 0.75, base: 0.85, high: 0.95 },
          confidence: 'medium',
          reason: 'Rainy spells temporarily dampen walk-in footfall at neighborhood kirana counters.',
        };
      }
      if (name.includes('New Year')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.1, base: 1.2, high: 1.35 },
          confidence: 'high',
          reason: 'Party snacks, beverages, and celebration goods experience brisk neighborhood turnover.',
        };
      }
      if (name.includes('Sankranti') || name.includes('Pongal')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.15, base: 1.25, high: 1.4 },
          confidence: 'high',
          reason: 'Harvest festival drives peak demand for jaggery, sesame seeds, and new grain stocks.',
        };
      }
      if (name.includes('School')) {
        return {
          event: name,
          window_start: start,
          window_end: end,
          multiplier: { low: 1.0, base: 1.0, high: 1.05 },
          confidence: 'low',
          reason: 'School reopening has minimal effect on regular grocery provisions turnover.',
        };
      }
    }

    return {
      event: name,
      window_start: start,
      window_end: end,
      multiplier: { low: 1.0, base: 1.0, high: 1.0 },
      confidence: 'low',
      reason: `Event has normal baseline trading activity for ${businessType || 'this shop'}.`,
    };
  });
}

/**
 * GET /api/v1/prediction/calendar
 * Returns static festival & seasonal events calendar for the next 90 days
 */
router.get('/calendar', (req, res) => {
  try {
    if (fs.existsSync(CALENDAR_PATH)) {
      const data = JSON.parse(fs.readFileSync(CALENDAR_PATH, 'utf-8'));
      return res.json({ success: true, events: data });
    }
    return res.status(404).json({ success: false, error: 'Calendar file not found' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/prediction/context-adjuster
 * LLM-based Festival & Context Sales Adjuster
 * Clamps multipliers to [0.6, 1.6], falls back to 1.0 on failure/timeout
 * Caches responses per (business_type, city, month) refreshed daily at most
 */
router.post('/context-adjuster', async (req, res) => {
  try {
    const {
      businessType = 'kirana',
      city = 'Bengaluru',
      state = 'Karnataka',
      events: customEvents,
      apiKey,
      model = 'nvidia/llama-3.1-nemotron-70b-instruct',
    } = req.body;

    // Load calendar events
    let events = customEvents;
    if (!Array.isArray(events) || events.length === 0) {
      if (fs.existsSync(CALENDAR_PATH)) {
        events = JSON.parse(fs.readFileSync(CALENDAR_PATH, 'utf-8'));
      } else {
        events = [];
      }
    }

    // Cache key: (business_type, city, month)
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const cacheKey = `${businessType.toLowerCase().trim()}_${city.toLowerCase().trim()}_${currentMonth}`;
    const cached = contextAdjusterCache.get(cacheKey);

    // Refresh daily at most (24 hours)
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return res.json({
        success: true,
        cached: true,
        adjustments: cached.adjustments,
        meta: cached.meta,
      });
    }

    // System prompt per exact specifications
    const systemPrompt = `You adjust small-shop sales forecasts for Indian businesses. You receive business_type, city, and a list of upcoming events. For each event, return a pre-event ramp window and a post-event slump window. Use only the events given. If an event is irrelevant to this business type, return base 1.0. Multipliers must be between 0.6 and 1.6, with low <= base <= high. Give one plain sentence as the reason. If unsure, return 1.0 with confidence 'low'. Return JSON only.`;

    const userPrompt = JSON.stringify({
      business_type: businessType,
      city,
      state,
      upcoming_events: events.map((e) => ({
        name: e.name,
        start: e.start,
        end: e.end,
        region: e.region,
      })),
    });

    const nvidiaKey = apiKey || process.env.NVIDIA_API_KEY?.trim();
    const groqKey = process.env.GROQ_API_KEY?.trim();

    let rawResponseText = '';
    let usedProvider = '';

    // Attempt 1: Call NVIDIA Nemotron (temperature 0, JSON mode)
    if (nvidiaKey) {
      try {
        const nvResp = await fetch(NVIDIA_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${nvidiaKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0,
            response_format: { type: 'json_object' },
            max_tokens: 2048,
          }),
        });

        if (nvResp.ok) {
          const nvData = await nvResp.json();
          rawResponseText = nvData?.choices?.[0]?.message?.content || '';
          usedProvider = 'NVIDIA NIM (Nemotron)';
        }
      } catch (err) {
        console.warn('[Context Adjuster NVIDIA failed]:', err.message);
      }
    }

    // Attempt 2: Fallback to Groq if NVIDIA was unavailable or failed
    if (!rawResponseText && groqKey) {
      try {
        const groqResp = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0,
            response_format: { type: 'json_object' },
          }),
        });

        if (groqResp.ok) {
          const groqData = await groqResp.json();
          rawResponseText = groqData?.choices?.[0]?.message?.content || '';
          usedProvider = 'Groq Cloud LPU AI';
        }
      } catch (err) {
        console.warn('[Context Adjuster Groq failed]:', err.message);
      }
    }

    let parsedAdjustments = null;
    if (rawResponseText) {
      try {
        const clean = rawResponseText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed?.adjustments)) {
          parsedAdjustments = parsed.adjustments;
        }
      } catch (e) {
        console.warn('[Context Adjuster Parse Warning]:', e.message);
      }
    }

    // If neither LLM returned valid adjustments, use domain-specific rule generator
    if (!parsedAdjustments || parsedAdjustments.length === 0) {
      parsedAdjustments = generateDomainAdjustments(businessType, events);
      usedProvider = usedProvider || 'AurumFlow Bounded Domain Engine';
    }

    // Clamping step: enforce 0.6 - 1.6 and low <= base <= high
    const clampedAdjustments = clampMultipliersList(parsedAdjustments);

    const meta = {
      provider: usedProvider,
      businessType,
      city,
      cacheKey,
      cachedAt: new Date().toISOString(),
    };

    // Cache result
    contextAdjusterCache.set(cacheKey, {
      timestamp: Date.now(),
      adjustments: clampedAdjustments,
      meta,
    });

    return res.json({
      success: true,
      cached: false,
      adjustments: clampedAdjustments,
      meta,
    });
  } catch (err) {
    console.error('[Context Adjuster Route Error]:', err);
    // On failure or timeout: fallback to 1.0 for every date and show "Context adjustment unavailable"
    return res.json({
      success: true,
      unavailable: true,
      warning: 'Context adjustment unavailable',
      adjustments: (req.body?.events || []).map((e) => ({
        event: e.name || 'Event',
        window_start: e.start || '',
        window_end: e.end || '',
        multiplier: { low: 1.0, base: 1.0, high: 1.0 },
        confidence: 'low',
        reason: 'Context adjustment unavailable',
      })),
    });
  }
});

export default router;
