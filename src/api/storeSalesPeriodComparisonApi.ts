import { apiRequest } from './apiClient';

export type PeriodComparisonType = 'month_vs_month' | 'week_vs_week' | 'today_vs_yesterday';

export interface StoreSalesPeriodComparisonQueryParams {
  period?: PeriodComparisonType;
  branch_code?: string;
}

export interface StoreSalesPeriodComparisonItem {
  branch_code: number | string;
  branch_name: string;
  current_net_sales: number;
  previous_net_sales: number;
  growth_pct: number;
  growth_amount: number;
}

export interface StoreSalesPeriodComparisonMeta {
  period: string;
  current_range: [string, string];
  previous_range: [string, string];
  financial_year?: string;
  branch_code?: string[];
}

export interface StoreSalesPeriodComparisonTotals {
  total_current_net_sales: number;
  total_previous_net_sales: number;
  total_growth_amount: number;
  total_growth_pct: number;
  total_stores: number;
  growing_stores: number;
  declining_stores: number;
  top_gainer: { branch_name: string; growth_pct: number; amount: number } | null;
  top_decliner: { branch_name: string; growth_pct: number; amount: number } | null;
}

export interface StoreSalesPeriodComparisonResult {
  data: StoreSalesPeriodComparisonItem[];
  meta: StoreSalesPeriodComparisonMeta | null;
  totals: StoreSalesPeriodComparisonTotals;
  isLive: boolean;
  error?: string;
  message?: string;
}

/**
 * Fetches Store-wise sales period comparison from the API.
 * Endpoint: `store-sales-period-comparison?period=month_vs_month&branch_code=5080,5010,5047`
 */
export async function fetchStoreSalesPeriodComparison(
  params: StoreSalesPeriodComparisonQueryParams = {}
): Promise<StoreSalesPeriodComparisonResult> {
  const period = params.period || 'month_vs_month';
  const queryObj: Record<string, string> = {
    period,
  };

  if (params.branch_code && params.branch_code.trim().length > 0) {
    queryObj.branch_code = params.branch_code.trim();
  }

  const queryParams = new URLSearchParams(queryObj).toString();
  const endpoint = `store-sales-period-comparison?${queryParams}`;

  try {
    const res = await apiRequest<any>(endpoint, { method: 'GET' });
    const rawItems = extractComparisonData(res);
    const meta = extractMeta(res, period);
    const totals = computeTotals(rawItems);

    return {
      data: rawItems,
      meta,
      totals,
      isLive: true,
      message: res?.message || 'Store-wise sales period comparison fetched successfully',
    };
  } catch (err: any) {
    console.warn('Store sales period comparison API failed:', err.message);
    return {
      data: [],
      meta: null,
      totals: {
        total_current_net_sales: 0,
        total_previous_net_sales: 0,
        total_growth_amount: 0,
        total_growth_pct: 0,
        total_stores: 0,
        growing_stores: 0,
        declining_stores: 0,
        top_gainer: null,
        top_decliner: null,
      },
      isLive: false,
      error: err.message || 'Failed to fetch sales period comparison data',
    };
  }
}

/**
 * Normalizes raw items array from diverse response shapes.
 */
function extractComparisonData(res: any): StoreSalesPeriodComparisonItem[] {
  if (!res) return [];
  const rawList = Array.isArray(res.data)
    ? res.data
    : Array.isArray(res)
    ? res
    : Array.isArray(res.records)
    ? res.records
    : Array.isArray(res.comparison)
    ? res.comparison
    : [];

  return rawList.map((item: any) => {
    const currentSales = Number(item.current_net_sales !== undefined ? item.current_net_sales : item.current_sales || 0);
    const prevSales = Number(item.previous_net_sales !== undefined ? item.previous_net_sales : item.previous_sales || 0);
    const growthAmount = currentSales - prevSales;

    let growthPct = Number(item.growth_pct);
    if (isNaN(growthPct)) {
      if (prevSales === 0) {
        growthPct = currentSales > 0 ? 100 : 0;
      } else {
        growthPct = Number(((growthAmount / prevSales) * 100).toFixed(2));
      }
    }

    return {
      branch_code: item.branch_code || item.store_code || '',
      branch_name: String(item.branch_name || item.store_name || `Store ${item.branch_code || ''}`),
      current_net_sales: currentSales,
      previous_net_sales: prevSales,
      growth_pct: growthPct,
      growth_amount: growthAmount,
    };
  });
}

/**
 * Helper to generate fallback date ranges for standard periods if API doesn't send meta.
 */
export function generateFallbackRanges(period: PeriodComparisonType): { current: [string, string]; previous: [string, string] } {
  const now = new Date();
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  if (period === 'today_vs_yesterday') {
    const today = formatDate(now);
    const yestDate = new Date(now);
    yestDate.setDate(now.getDate() - 1);
    const yesterday = formatDate(yestDate);
    return { current: [today, today], previous: [yesterday, yesterday] };
  }

  if (period === 'week_vs_week') {
    const dayOfWeek = now.getDay(); // 0 is Sun
    const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const curMon = new Date(now);
    curMon.setDate(now.getDate() + distanceToMon);
    
    const prevMon = new Date(curMon);
    prevMon.setDate(curMon.getDate() - 7);
    const prevSun = new Date(curMon);
    prevSun.setDate(curMon.getDate() - 1);

    return {
      current: [formatDate(curMon), formatDate(now)],
      previous: [formatDate(prevMon), formatDate(prevSun)],
    };
  }

  // month_vs_month default
  const curStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    current: [formatDate(curStart), formatDate(now)],
    previous: [formatDate(prevStart), formatDate(prevEnd)],
  };
}

/**
 * Extracts meta information safely from the response with resilient date extraction.
 */
function extractMeta(res: any, defaultPeriod: PeriodComparisonType): StoreSalesPeriodComparisonMeta {
  const m = res?.meta || res?.header || res?.info || res;

  let current_range: [string, string] = ['', ''];
  let previous_range: [string, string] = ['', ''];

  if (m) {
    if (Array.isArray(m.current_range) && m.current_range.length >= 2) {
      current_range = [String(m.current_range[0]), String(m.current_range[1])];
    } else if (m.current_start && m.current_end) {
      current_range = [String(m.current_start), String(m.current_end)];
    } else if (m.current_date_range && Array.isArray(m.current_date_range)) {
      current_range = [String(m.current_date_range[0]), String(m.current_date_range[1])];
    }

    if (Array.isArray(m.previous_range) && m.previous_range.length >= 2) {
      previous_range = [String(m.previous_range[0]), String(m.previous_range[1])];
    } else if (m.previous_start && m.previous_end) {
      previous_range = [String(m.previous_start), String(m.previous_end)];
    } else if (m.previous_date_range && Array.isArray(m.previous_date_range)) {
      previous_range = [String(m.previous_date_range[0]), String(m.previous_date_range[1])];
    }
  }

  // Fallback if missing or empty date ranges
  if (!current_range[0] || !current_range[1] || !previous_range[0] || !previous_range[1]) {
    const fallback = generateFallbackRanges(defaultPeriod);
    if (!current_range[0] || !current_range[1]) current_range = fallback.current;
    if (!previous_range[0] || !previous_range[1]) previous_range = fallback.previous;
  }

  return {
    period: m?.period || defaultPeriod,
    current_range,
    previous_range,
    financial_year: m?.financial_year ? String(m.financial_year) : undefined,
    branch_code: Array.isArray(m?.branch_code) ? m.branch_code.map(String) : undefined,
  };
}

/**
 * Format string date like YYYY-MM-DD into "DD MMM YYYY"
 */
export function formatFullDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const cleanStr = String(dateStr).split('T')[0].trim();
  const parts = cleanStr.split('-');
  if (parts.length !== 3) return cleanStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (monthIdx < 0 || monthIdx > 11 || isNaN(day)) return cleanStr;
  return `${day} ${months[monthIdx]} ${year}`;
}

/**
 * Format range tuple [start, end] into display string "DD MMM YYYY – DD MMM YYYY"
 */
export function formatDateRangeText(range?: [string, string]): string {
  if (!range || (!range[0] && !range[1])) return '—';
  if (range[0] === range[1]) return formatFullDate(range[0]);
  return `${formatFullDate(range[0])} – ${formatFullDate(range[1])}`;
}

/**
 * Computes aggregated summary metrics and highlights.
 */
function computeTotals(items: StoreSalesPeriodComparisonItem[]): StoreSalesPeriodComparisonTotals {
  let total_current_net_sales = 0;
  let total_previous_net_sales = 0;
  let growing_stores = 0;
  let declining_stores = 0;

  items.forEach((item) => {
    total_current_net_sales += item.current_net_sales;
    total_previous_net_sales += item.previous_net_sales;

    if (item.growth_pct > 0) {
      growing_stores += 1;
    } else if (item.growth_pct < 0) {
      declining_stores += 1;
    }
  });

  const total_growth_amount = total_current_net_sales - total_previous_net_sales;
  let total_growth_pct = 0;
  if (total_previous_net_sales > 0) {
    total_growth_pct = Number(((total_growth_amount / total_previous_net_sales) * 100).toFixed(2));
  } else if (total_current_net_sales > 0) {
    total_growth_pct = 100;
  }

  let top_gainer: { branch_name: string; growth_pct: number; amount: number } | null = null;
  let top_decliner: { branch_name: string; growth_pct: number; amount: number } | null = null;

  if (items.length > 0) {
    const sortedByGrowth = [...items].sort((a, b) => b.growth_pct - a.growth_pct);
    const highest = sortedByGrowth[0];
    const lowest = sortedByGrowth[sortedByGrowth.length - 1];

    if (highest && highest.growth_pct > 0) {
      top_gainer = {
        branch_name: highest.branch_name,
        growth_pct: highest.growth_pct,
        amount: highest.growth_amount,
      };
    }

    if (lowest && lowest.growth_pct < 0) {
      top_decliner = {
        branch_name: lowest.branch_name,
        growth_pct: lowest.growth_pct,
        amount: lowest.growth_amount,
      };
    }
  }

  return {
    total_current_net_sales,
    total_previous_net_sales,
    total_growth_amount,
    total_growth_pct,
    total_stores: items.length,
    growing_stores,
    declining_stores,
    top_gainer,
    top_decliner,
  };
}

