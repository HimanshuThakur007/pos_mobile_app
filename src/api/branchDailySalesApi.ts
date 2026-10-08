import { apiRequest } from './apiClient';

export interface BranchDailySalesQueryParams {
  from_date?: string;
  to_date?: string;
  branch_code?: string;
}

export interface BranchDailySalesItem {
  branch_code: string;
  branch_name: string;
  date: string;
  bill_count: number;
  sales_amount: number;
  return_amount: number;
  net_sales: number;
}

export interface BranchDailySalesTotals {
  total_net_sales: number;
  total_sales_amount: number;
  total_return_amount: number;
  total_bill_count: number;
  total_days: number;
  avg_daily_sales: number;
}

export interface BranchDailySalesResult {
  data: BranchDailySalesItem[];
  totals?: BranchDailySalesTotals;
  isLive: boolean;
  error?: string;
  message?: string;
}

/**
 * Fetches store-wise daily sales trend data from API (`store-daily-sales-trend`).
 * Does NOT set hardcoded default mock data if live API fails.
 */
export async function fetchBranchDailySalesTrends(
  params: BranchDailySalesQueryParams = {}
): Promise<BranchDailySalesResult> {
  const queryObj: Record<string, string> = {};

  if (params.from_date) queryObj.from_date = String(params.from_date);
  if (params.to_date) queryObj.to_date = String(params.to_date);
  if (params.branch_code) queryObj.branch_code = String(params.branch_code);

  const queryParams = new URLSearchParams(queryObj).toString();
  const endpoint = `store-daily-sales-trend${queryParams ? `?${queryParams}` : ''}`;

  try {
    const res = await apiRequest<any>(endpoint, { method: 'GET' });
    const rawData = extractDailySalesArray(res);
    const totals = calculateTotals(rawData);

    return {
      data: rawData,
      totals,
      isLive: true,
      message: res?.message || 'Store-wise daily sales trend fetched successfully',
    };
  } catch (getErr: any) {
    console.warn('GET store-daily-sales-trend failed, trying POST fallback:', getErr.message);

    try {
      const payload: any = {};
      if (params.from_date) payload.from_date = params.from_date;
      if (params.to_date) payload.to_date = params.to_date;
      if (params.branch_code) payload.branch_code = params.branch_code;

      const postRes = await apiRequest<any>('store-daily-sales-trend', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const rawData = extractDailySalesArray(postRes);
      const totals = calculateTotals(rawData);

      return {
        data: rawData,
        totals,
        isLive: true,
        message: postRes?.message || 'Store-wise daily sales trend fetched successfully',
      };
    } catch (postErr: any) {
      console.error('Both GET and POST store-daily-sales-trend failed:', postErr.message);
      return {
        data: [],
        isLive: false,
        error: postErr.message || getErr.message || 'Failed to fetch store daily sales trend',
      };
    }
  }
}

/**
 * Normalizes daily sales array from various response structures.
 */
function extractDailySalesArray(res: any): BranchDailySalesItem[] {
  if (!res) return [];
  const payload = res.data !== undefined ? res.data : res;

  if (Array.isArray(payload)) {
    return payload.map(normalizeDailyItem);
  }
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) return payload.data.map(normalizeDailyItem);
    if (Array.isArray(payload.trend)) return payload.trend.map(normalizeDailyItem);
    if (Array.isArray(payload.records)) return payload.records.map(normalizeDailyItem);
  }

  return [];
}

/**
 * Normalizes a single daily sales record item into standard types.
 */
function normalizeDailyItem(item: any): BranchDailySalesItem {
  return {
    branch_code: String(item.branch_code || item.store_code || ''),
    branch_name: String(item.branch_name || item.store_name || `Store ${item.branch_code || ''}`),
    date: String(item.date || item.bill_date || ''),
    bill_count: Number(item.bill_count || item.total_bills || 0),
    sales_amount: Number(item.sales_amount || item.gross_sales || 0),
    return_amount: Number(item.return_amount || item.returns || 0),
    net_sales: Number(
      item.net_sales !== undefined
        ? item.net_sales
        : Number(item.sales_amount || 0) - Number(item.return_amount || 0)
    ),
  };
}

/**
 * Computes aggregated summary totals for daily sales trends.
 */
function calculateTotals(items: BranchDailySalesItem[]): BranchDailySalesTotals {
  let total_net_sales = 0;
  let total_sales_amount = 0;
  let total_return_amount = 0;
  let total_bill_count = 0;

  const uniqueDates = new Set<string>();

  items.forEach((item) => {
    total_net_sales += item.net_sales;
    total_sales_amount += item.sales_amount;
    total_return_amount += item.return_amount;
    total_bill_count += item.bill_count;
    if (item.date) uniqueDates.add(item.date);
  });

  const total_days = uniqueDates.size || 1;
  const avg_daily_sales = total_days > 0 ? total_net_sales / total_days : 0;

  return {
    total_net_sales,
    total_sales_amount,
    total_return_amount,
    total_bill_count,
    total_days,
    avg_daily_sales,
  };
}
