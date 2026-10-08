import { apiRequest } from './apiClient';

export interface BranchPaymentModeQueryParams {
  from_date?: string;
  to_date?: string;
  branch_code?: string;
}

export interface BranchPaymentModeItem {
  branch_code: string;
  branch_name: string;
  mode: string;
  txn_count: number;
  amount: number;
}

export interface BranchPaymentModeTotals {
  total_amount: number;
  total_txns: number;
  top_mode: string;
  top_mode_amount: number;
  cash_amount: number;
  card_amount: number;
  upi_amount: number;
  other_amount: number;
}

export interface BranchPaymentModeResult {
  data: BranchPaymentModeItem[];
  totals?: BranchPaymentModeTotals;
  isLive: boolean;
  error?: string;
  message?: string;
}

/**
 * Fetches store-wise payment mode split from API (`store-payment-mode`).
 * Does NOT set hardcoded default mock data if live API fails.
 */
export async function fetchBranchPaymentModes(
  params: BranchPaymentModeQueryParams = {}
): Promise<BranchPaymentModeResult> {
  const queryObj: Record<string, string> = {};

  if (params.from_date) queryObj.from_date = String(params.from_date);
  if (params.to_date) queryObj.to_date = String(params.to_date);
  if (params.branch_code) queryObj.branch_code = String(params.branch_code);

  const queryParams = new URLSearchParams(queryObj).toString();
  const endpoint = `store-payment-mode${queryParams ? `?${queryParams}` : ''}`;

  try {
    const res = await apiRequest<any>(endpoint, { method: 'GET' });
    const rawData = extractPaymentModeArray(res);
    const totals = calculateTotals(rawData);

    return {
      data: rawData,
      totals,
      isLive: true,
      message: res?.message || 'Store-wise payment mode split fetched successfully',
    };
  } catch (getErr: any) {
    console.warn('GET store-payment-mode failed, trying POST fallback:', getErr.message);

    try {
      const payload: any = {};
      if (params.from_date) payload.from_date = params.from_date;
      if (params.to_date) payload.to_date = params.to_date;
      if (params.branch_code) payload.branch_code = params.branch_code;

      const postRes = await apiRequest<any>('store-payment-mode', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const rawData = extractPaymentModeArray(postRes);
      const totals = calculateTotals(rawData);

      return {
        data: rawData,
        totals,
        isLive: true,
        message: postRes?.message || 'Store-wise payment mode split fetched successfully',
      };
    } catch (postErr: any) {
      console.error('Both GET and POST store-payment-mode failed:', postErr.message);
      return {
        data: [],
        isLive: false,
        error: postErr.message || getErr.message || 'Failed to fetch store payment mode split data',
      };
    }
  }
}

/**
 * Normalizes payment mode array from various response shapes.
 */
function extractPaymentModeArray(res: any): BranchPaymentModeItem[] {
  if (!res) return [];
  const payload = res.data !== undefined ? res.data : res;

  if (Array.isArray(payload)) {
    return payload.map(normalizePaymentModeItem);
  }
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) return payload.data.map(normalizePaymentModeItem);
    if (Array.isArray(payload.payment_modes)) return payload.payment_modes.map(normalizePaymentModeItem);
    if (Array.isArray(payload.records)) return payload.records.map(normalizePaymentModeItem);
  }

  return [];
}

/**
 * Normalizes a single payment mode item into standard types.
 */
function normalizePaymentModeItem(item: any): BranchPaymentModeItem {
  return {
    branch_code: String(item.branch_code || item.store_code || ''),
    branch_name: String(item.branch_name || item.store_name || `Store ${item.branch_code || ''}`),
    mode: String(item.mode || item.payment_mode || 'cash').toLowerCase(),
    txn_count: Number(item.txn_count || item.txns || item.bill_count || 0),
    amount: Number(item.amount || item.total_amount || 0),
  };
}

/**
 * Computes aggregated summary totals for payment modes.
 */
function calculateTotals(items: BranchPaymentModeItem[]): BranchPaymentModeTotals {
  let total_amount = 0;
  let total_txns = 0;
  let cash_amount = 0;
  let card_amount = 0;
  let upi_amount = 0;
  let other_amount = 0;

  const modeMap: Record<string, number> = {};

  items.forEach((item) => {
    const amt = item.amount;
    const txns = item.txn_count;
    total_amount += amt;
    total_txns += txns;

    const m = item.mode.toLowerCase();
    modeMap[m] = (modeMap[m] || 0) + amt;

    if (m.includes('cash')) cash_amount += amt;
    else if (m.includes('card')) card_amount += amt;
    else if (m.includes('upi') || m.includes('qr') || m.includes('online') || m.includes('paytm')) upi_amount += amt;
    else other_amount += amt;
  });

  let top_mode = 'None';
  let top_mode_amount = 0;

  Object.entries(modeMap).forEach(([mode, amt]) => {
    if (amt > top_mode_amount) {
      top_mode_amount = amt;
      top_mode = mode.toUpperCase();
    }
  });

  return {
    total_amount,
    total_txns,
    top_mode,
    top_mode_amount,
    cash_amount,
    card_amount,
    upi_amount,
    other_amount,
  };
}
