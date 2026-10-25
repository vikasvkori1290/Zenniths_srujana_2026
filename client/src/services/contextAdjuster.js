import calendarData from '../data/calendar.js';

/**
 * Clamp individual multiplier within [0.6, 1.6]
 */
export function clampMultiplier(val) {
  const num = Number(val);
  if (isNaN(num)) return 1.0;
  return Math.min(1.6, Math.max(0.6, Math.round(num * 100) / 100));
}

/**
 * Clamp overlapping combined multiplier capped at 1.8
 */
export function clampOverlap(val) {
  const num = Number(val);
  if (isNaN(num)) return 1.0;
  return Math.min(1.8, Math.max(0.6, Math.round(num * 100) / 100));
}

/**
 * Retrieve cumulative retained cash before a specific due date:
 * Returns { base, low, high }
 */
export function getRetainedCashBeforeDueDate(
  dueDateStr,
  timeline = [],
  todayRetainedCash = 1500
) {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    return {
      base: todayRetainedCash,
      low: Math.round(todayRetainedCash * 0.8),
      high: Math.round(todayRetainedCash * 1.2),
    };
  }

  const match = timeline.find((t) => t.date === dueDateStr);
  if (match) {
    return {
      base: match.cumRetainedBase ?? match.cumRetained ?? todayRetainedCash,
      low: match.cumRetainedLow ?? Math.round((match.cumRetainedBase || todayRetainedCash) * 0.8),
      high: match.cumRetainedHigh ?? Math.round((match.cumRetainedBase || todayRetainedCash) * 1.2),
    };
  }

  const targetTime = new Date(dueDateStr).getTime();
  const priorDays = timeline.filter((t) => new Date(t.date).getTime() <= targetTime);
  if (priorDays.length > 0) {
    const last = priorDays[priorDays.length - 1];
    return {
      base: last.cumRetainedBase ?? last.cumRetained ?? todayRetainedCash,
      low: last.cumRetainedLow ?? Math.round((last.cumRetainedBase || todayRetainedCash) * 0.8),
      high: last.cumRetainedHigh ?? Math.round((last.cumRetainedBase || todayRetainedCash) * 1.2),
    };
  }

  return {
    base: todayRetainedCash,
    low: Math.round(todayRetainedCash * 0.8),
    high: Math.round(todayRetainedCash * 1.2),
  };
}

/**
 * Sanitize and clamp LLM adjustment objects.
 * On malformed or empty responses, falls back safely to 1.0 multipliers
 * with warning "Context adjustment unavailable".
 */
export function sanitizeAdjustments(rawAdjustments, calendarEvents = calendarData) {
  if (!Array.isArray(rawAdjustments) || rawAdjustments.length === 0) {
    return {
      unavailable: true,
      adjustments: (calendarEvents || []).map((e) => ({
        event: e.name || 'Seasonal Event',
        window_start: e.start || '',
        window_end: e.end || '',
        multiplier: { low: 1.0, base: 1.0, high: 1.0 },
        confidence: 'low',
        reason: 'Context adjustment unavailable',
      })),
    };
  }

  const sanitized = rawAdjustments.map((item) => {
    let low = clampMultiplier(item?.multiplier?.low ?? 1.0);
    let base = clampMultiplier(item?.multiplier?.base ?? 1.0);
    let high = clampMultiplier(item?.multiplier?.high ?? 1.0);

    // Enforce low <= base <= high
    if (low > base) low = base;
    if (high < base) high = base;

    return {
      event: item?.event || item?.name || 'Upcoming Event',
      window_start: item?.window_start || item?.start || '',
      window_end: item?.window_end || item?.end || '',
      multiplier: {
        low: Math.round(low * 100) / 100,
        base: Math.round(base * 100) / 100,
        high: Math.round(high * 100) / 100,
      },
      confidence: ['low', 'medium', 'high'].includes(item?.confidence)
        ? item.confidence
        : 'medium',
      reason:
        typeof item?.reason === 'string' && item.reason.trim()
          ? item.reason.trim()
          : 'Context adjustment based on local festival or seasonal trading pattern.',
    };
  });

  return {
    unavailable: false,
    adjustments: sanitized,
  };
}

/**
 * Compute Multiplier for a specific date:
 * If windows overlap, multiply them, then cap the total at 1.8.
 * If toggle is OFF, returns 1.0 for all bounds.
 */
export function getMultipliersForDate(
  dateStr,
  adjustments = [],
  isFestivalAdjustmentOn = true
) {
  if (!isFestivalAdjustmentOn || !Array.isArray(adjustments) || adjustments.length === 0) {
    return {
      low: 1.0,
      base: 1.0,
      high: 1.0,
      activeEvents: [],
      isAdjusted: false,
    };
  }

  const matching = adjustments.filter((adj) => {
    if (!adj.window_start || !adj.window_end) return false;
    return dateStr >= adj.window_start && dateStr <= adj.window_end;
  });

  if (matching.length === 0) {
    return {
      low: 1.0,
      base: 1.0,
      high: 1.0,
      activeEvents: [],
      isAdjusted: false,
    };
  }

  // Multiply overlapping windows
  let rawLow = 1.0;
  let rawBase = 1.0;
  let rawHigh = 1.0;

  for (const m of matching) {
    rawLow *= Number(m.multiplier?.low ?? 1.0);
    rawBase *= Number(m.multiplier?.base ?? 1.0);
    rawHigh *= Number(m.multiplier?.high ?? 1.0);
  }

  // Cap combined total at 1.8 and floor at 0.6
  let low = clampOverlap(rawLow);
  let base = clampOverlap(rawBase);
  let high = clampOverlap(rawHigh);

  if (low > base) low = base;
  if (high < base) high = base;

  const nonNeutralMatching = matching.filter(
    (m) =>
      Number(m.multiplier?.base ?? 1.0) !== 1.0 ||
      Number(m.multiplier?.low ?? 1.0) !== 1.0 ||
      Number(m.multiplier?.high ?? 1.0) !== 1.0
  );

  return {
    low: Math.round(low * 100) / 100,
    base: Math.round(base * 100) / 100,
    high: Math.round(high * 100) / 100,
    activeEvents: nonNeutralMatching.map((m) => m.event),
    isAdjusted: base !== 1.0 || low !== 1.0 || high !== 1.0,
  };
}

/**
 * Baseline sales by day-of-week from shop's own history:
 * Falls back to current daily sales if under 14 days of data.
 */
export function getBaselineSalesForDate(
  dateObj,
  history = [],
  currentDailySales = 8000
) {
  if (!Array.isArray(history) || history.length < 14) {
    return Number(currentDailySales || 8000);
  }

  const targetDay = dateObj.getDay(); // 0 = Sun .. 6 = Sat
  const dayRecords = history.filter((h) => {
    const d = new Date(h.date);
    return !isNaN(d.getTime()) && d.getDay() === targetDay && Number(h.sales || h.amount) > 0;
  });

  if (dayRecords.length === 0) {
    return Number(currentDailySales || 8000);
  }

  const total = dayRecords.reduce((sum, r) => sum + Number(r.sales || r.amount), 0);
  return Math.round(total / dayRecords.length);
}

/**
 * Calculate Adjusted Sales & Retained Cash for a day:
 * 1. adj_sales = baseline_sales * multiplier
 * 2. retained_cash = (adj_sales * gross_margin_pct) - daily_running_cost
 * (Never treat adj_sales as spendable cash)
 */
export function calculateAdjustedRetainedCash({
  baselineSales = 8000,
  multiplier = 1.0,
  grossMarginPct = 25,
  dailyRunningCost = 500,
}) {
  const boundedMultiplier = clampOverlap(multiplier);
  const adjSales = Math.round(baselineSales * boundedMultiplier);
  const marginFraction = Number(grossMarginPct || 0) / 100;
  const runningCost = Number(dailyRunningCost || 0);

  const grossProfit = Math.round(adjSales * marginFraction);
  const retainedCash = grossProfit - runningCost;

  return {
    baselineSales,
    multiplier: boundedMultiplier,
    adjSales,
    grossProfit,
    dailyRunningCost: runningCost,
    retainedCash,
  };
}

/**
 * Domain-specific rule generator when LLM is unavailable or offline
 */
export function generateDomainAdjustments(businessType = 'kirana', events = calendarData) {
  const bType = (businessType || 'kirana').toLowerCase();
  const isSweets = bType.includes('sweet') || bType.includes('bakery') || bType.includes('mithai');
  const isHardware = bType.includes('hardware') || bType.includes('paint') || bType.includes('electrical');
  const isStationery = bType.includes('stationer') || bType.includes('book');

  return (events || []).map((ev) => {
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
 * Cache key generator per (business_type, city, month)
 */
export function getContextCacheKey(businessType = 'kirana', city = 'Bengaluru') {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const cleanBType = (businessType || 'kirana').toLowerCase().trim();
  const cleanCity = (city || 'Bengaluru').toLowerCase().trim();
  return `aurum_context_adjustments_${cleanBType}_${cleanCity}_${currentMonth}`;
}

/**
 * Fetch Context Adjustments with 24-hour daily cache per (business_type, city, month)
 */
export async function fetchContextAdjustments({
  businessType = 'kirana',
  city = 'Bengaluru',
  state = 'Karnataka',
  forceRefresh = false,
}) {
  const cacheKey = getContextCacheKey(businessType, city);

  // Check LocalStorage cache
  if (!forceRefresh && typeof window !== 'undefined') {
    const cachedStr = localStorage.getItem(cacheKey);
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr);
        // Refresh daily at most (24 hours)
        if (cached?.timestamp && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
          return {
            adjustments: cached.adjustments || [],
            cached: true,
            unavailable: !!cached.unavailable,
            meta: cached.meta || { businessType, city },
          };
        }
      } catch (e) {
        console.warn('Failed parsing context adjustments cache', e);
      }
    }
  }

  // Call Server endpoint
  try {
    const res = await fetch('/api/v1/prediction/context-adjuster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessType,
        city,
        state,
        events: calendarData,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const sanitized = sanitizeAdjustments(data.adjustments, calendarData);

      const toStore = {
        timestamp: Date.now(),
        adjustments: sanitized.adjustments,
        unavailable: sanitized.unavailable || !!data.unavailable,
        meta: data.meta || { businessType, city },
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify(toStore));
      }

      return {
        adjustments: sanitized.adjustments,
        cached: false,
        unavailable: toStore.unavailable,
        meta: toStore.meta,
      };
    }
  } catch (err) {
    console.warn('[Context Adjuster Fetch Exception]:', err.message);
  }

  // Fallback: Safe 1.0 adjustments with "Context adjustment unavailable"
  const safeFallback = sanitizeAdjustments(null, calendarData);
  return {
    adjustments: safeFallback.adjustments,
    cached: false,
    unavailable: true,
    meta: { businessType, city, provider: 'Safe 1.0 Fallback' },
  };
}
