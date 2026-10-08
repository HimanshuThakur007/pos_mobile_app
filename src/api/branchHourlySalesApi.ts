import { apiRequest } from './apiClient';

export interface BranchHourlySalesQueryParams {
  from_date?: string;
  to_date?: string;
  branch_code?: string;
}

export interface BranchHourlySalesItem {
  branch_code: string;
  branch_name: string;
  hour: number;
  hour_label: string;
  bill_count: number;
  sales_amount: number;
  return_amount: number;
  net_sales: number;
}

export interface BranchHourlySalesTotals {
  total_net_sales: number;
  total_sales_amount: number;
  total_return_amount: number;
  total_bill_count: number;
  peak_hour_label: string;
  peak_hour_net_sales: number;
}

export interface BranchHourlySalesResult {
  data: BranchHourlySalesItem[];
  totals?: BranchHourlySalesTotals;
  isLive: boolean;
  error?: string;
  message?: string;
}

/**
 * Fetches store-wise hourly sales data from API (`store-hourly-sales`).
 * Does NOT set hardcoded default mock data if live API fails.
 */
export async function fetchBranchHourlySales(
  params: BranchHourlySalesQueryParams = {}
): Promise<BranchHourlySalesResult> {
  const queryObj: Record<string, string> = {};

  if (params.from_date) queryObj.from_date = String(params.from_date);
  if (params.to_date) queryObj.to_date = String(params.to_date);
  if (params.branch_code) queryObj.branch_code = String(params.branch_code);

  const queryParams = new URLSearchParams(queryObj).toString();
  const endpoint = `store-hourly-sales${queryParams ? `?${queryParams}` : ''}`;

  try {
    const res = await apiRequest<any>(endpoint, { method: 'GET' });
    const rawData = extractHourlySalesArray(res);
    const totals = calculateTotals(rawData);

    return {
      data: rawData,
      totals,
      isLive: true,
      message: res?.message || 'Store-wise hourly sales fetched successfully',
    };
  } catch (getErr: any) {
    console.warn('GET store-hourly-sales failed, trying POST fallback:', getErr.message);

    try {
      const payload: any = {};
      if (params.from_date) payload.from_date = params.from_date;
      if (params.to_date) payload.to_date = params.to_date;
      if (params.branch_code) payload.branch_code = params.branch_code;

      const postRes = await apiRequest<any>('store-hourly-sales', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const rawData = extractHourlySalesArray(postRes);
      const totals = calculateTotals(rawData);

      return {
        data: rawData,
        totals,
        isLive: true,
        message: postRes?.message || 'Store-wise hourly sales fetched successfully',
      };
    } catch (postErr: any) {
      console.error('Both GET and POST store-hourly-sales failed:', postErr.message);
      return {
        data: [],
        isLive: false,
        error: postErr.message || getErr.message || 'Failed to fetch store hourly sales data',
      };
    }
  }
}

/**
 * Normalizes hourly sales array from various response structures.
 */
function extractHourlySalesArray(res: any): BranchHourlySalesItem[] {
  if (!res) return [];
  const payload = res.data !== undefined ? res.data : res;

  if (Array.isArray(payload)) {
    return payload.map(normalizeHourlyItem);
  }
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) return payload.data.map(normalizeHourlyItem);
    if (Array.isArray(payload.hourly)) return payload.hourly.map(normalizeHourlyItem);
    if (Array.isArray(payload.records)) return payload.records.map(normalizeHourlyItem);
  }

  return [];
}

/**
 * Normalizes a single hourly sales record item into standard types.
 */
function normalizeHourlyItem(item: any): BranchHourlySalesItem {
  const hNum = Number(item.hour !== undefined ? item.hour : 0);
  const hStart = String(hNum).padStart(2, '0');
  const hEnd = String((hNum + 1) % 24).padStart(2, '0');
  const defaultLabel = `${hStart}:00-${hEnd}:00`;

  return {
    branch_code: String(item.branch_code || item.store_code || ''),
    branch_name: String(item.branch_name || item.store_name || `Store ${item.branch_code || ''}`),
    hour: hNum,
    hour_label: String(item.hour_label || item.hour_range || defaultLabel),
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
 * Computes aggregated summary totals for hourly sales.
 */
function calculateTotals(items: BranchHourlySalesItem[]): BranchHourlySalesTotals {
  let total_net_sales = 0;
  let total_sales_amount = 0;
  let total_return_amount = 0;
  let total_bill_count = 0;

  const hourMap: Record<string, number> = {};

  items.forEach((item) => {
    total_net_sales += item.net_sales;
    total_sales_amount += item.sales_amount;
    total_return_amount += item.return_amount;
    total_bill_count += item.bill_count;

    const label = item.hour_label || `${item.hour}:00`;
    hourMap[label] = (hourMap[label] || 0) + item.net_sales;
  });

  let peak_hour_label = 'None';
  let peak_hour_net_sales = 0;

  Object.entries(hourMap).forEach(([label, netVal]) => {
    if (netVal > peak_hour_net_sales) {
      peak_hour_net_sales = netVal;
      peak_hour_label = label;
    }
  });

  return {
    total_net_sales,
    total_sales_amount,
    total_return_amount,
    total_bill_count,
    peak_hour_label,
    peak_hour_net_sales,
  };
}
