import { apiRequest } from './apiClient';

export interface BranchDiscountOfferQueryParams {
  from_date?: string;
  to_date?: string;
  branch_code?: string;
}

export interface BranchDiscountOfferItem {
  branch_code: string;
  branch_name: string;
  bill_count: number;
  sales_amount: number;
  line_discount: number;
  coupon_discount: number;
  scheme_value: number;
  total_discount: number;
  offer_qty: number;
  discount_pct_of_sales: number;
}

export interface BranchDiscountOfferTotals {
  total_sales_amount: number;
  total_discount: number;
  total_line_discount: number;
  total_coupon_discount: number;
  total_scheme_value: number;
  total_offer_qty: number;
  total_bill_count: number;
  total_stores: number;
  overall_discount_pct: number;
  top_discount_store: string;
  top_discount_amount: number;
}

export interface BranchDiscountOfferResult {
  data: BranchDiscountOfferItem[];
  totals?: BranchDiscountOfferTotals;
  isLive: boolean;
  error?: string;
  message?: string;
}

/**
 * Fetches store-wise discount & offer analysis from API (`store-discount-offer-analysis`).
 * Does NOT set hardcoded default mock data if live API fails.
 */
export async function fetchBranchDiscountOffer(
  params: BranchDiscountOfferQueryParams = {}
): Promise<BranchDiscountOfferResult> {
  const queryObj: Record<string, string> = {};

  if (params.from_date) queryObj.from_date = String(params.from_date);
  if (params.to_date) queryObj.to_date = String(params.to_date);
  if (params.branch_code) queryObj.branch_code = String(params.branch_code);

  const queryParams = new URLSearchParams(queryObj).toString();
  const endpoint = `store-discount-offer-analysis${queryParams ? `?${queryParams}` : ''}`;

  try {
    const res = await apiRequest<any>(endpoint, { method: 'GET' });
    const rawData = extractDiscountOfferArray(res);
    const totals = calculateTotals(rawData);

    return {
      data: rawData,
      totals,
      isLive: true,
      message: res?.message || 'Store-wise discount / offer analysis fetched successfully',
    };
  } catch (getErr: any) {
    console.warn('GET store-discount-offer-analysis failed, trying POST fallback:', getErr.message);

    try {
      const payload: any = {};
      if (params.from_date) payload.from_date = params.from_date;
      if (params.to_date) payload.to_date = params.to_date;
      if (params.branch_code) payload.branch_code = params.branch_code;

      const postRes = await apiRequest<any>('store-discount-offer-analysis', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const rawData = extractDiscountOfferArray(postRes);
      const totals = calculateTotals(rawData);

      return {
        data: rawData,
        totals,
        isLive: true,
        message: postRes?.message || 'Store-wise discount / offer analysis fetched successfully',
      };
    } catch (postErr: any) {
      console.error('Both GET and POST store-discount-offer-analysis failed:', postErr.message);
      return {
        data: [],
        isLive: false,
        error: postErr.message || getErr.message || 'Failed to fetch store discount offer analysis data',
      };
    }
  }
}

/**
 * Normalizes discount & offer analysis array from API responses.
 */
function extractDiscountOfferArray(res: any): BranchDiscountOfferItem[] {
  if (!res) return [];
  const payload = res.data !== undefined ? res.data : res;

  if (Array.isArray(payload)) {
    return payload.map(normalizeDiscountOfferItem);
  }
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) return payload.data.map(normalizeDiscountOfferItem);
    if (Array.isArray(payload.offers)) return payload.offers.map(normalizeDiscountOfferItem);
    if (Array.isArray(payload.records)) return payload.records.map(normalizeDiscountOfferItem);
  }

  return [];
}

/**
 * Normalizes a single discount offer analysis item into strong types.
 */
function normalizeDiscountOfferItem(item: any): BranchDiscountOfferItem {
  const salesAmt = Number(item.sales_amount || item.amount || item.net_sales || 0);
  const totalDisc = Number(item.total_discount || item.discount || 0);

  let discPct = Number(item.discount_pct_of_sales || item.discount_pct || 0);
  if (discPct === 0 && salesAmt > 0 && totalDisc > 0) {
    discPct = (totalDisc / salesAmt) * 100;
  }

  return {
    branch_code: String(item.branch_code || item.store_code || ''),
    branch_name: String(item.branch_name || item.store_name || `Store ${item.branch_code || ''}`),
    bill_count: Number(item.bill_count || item.bills || 0),
    sales_amount: salesAmt,
    line_discount: Number(item.line_discount || 0),
    coupon_discount: Number(item.coupon_discount || 0),
    scheme_value: Number(item.scheme_value || 0),
    total_discount: totalDisc,
    offer_qty: Number(item.offer_qty || item.qty || 0),
    discount_pct_of_sales: Number(discPct.toFixed(2)),
  };
}

/**
 * Computes aggregated summary totals for discount offer analysis.
 */
function calculateTotals(items: BranchDiscountOfferItem[]): BranchDiscountOfferTotals {
  let total_sales_amount = 0;
  let total_discount = 0;
  let total_line_discount = 0;
  let total_coupon_discount = 0;
  let total_scheme_value = 0;
  let total_offer_qty = 0;
  let total_bill_count = 0;
  const storeSet = new Set<string>();

  let top_discount_store = 'None';
  let top_discount_amount = 0;

  items.forEach((item) => {
    total_sales_amount += item.sales_amount;
    total_discount += item.total_discount;
    total_line_discount += item.line_discount;
    total_coupon_discount += item.coupon_discount;
    total_scheme_value += item.scheme_value;
    total_offer_qty += item.offer_qty;
    total_bill_count += item.bill_count;

    if (item.branch_code) storeSet.add(item.branch_code);

    if (item.total_discount > top_discount_amount) {
      top_discount_amount = item.total_discount;
      top_discount_store = item.branch_name;
    }
  });

  const overall_discount_pct =
    total_sales_amount > 0 ? (total_discount / total_sales_amount) * 100 : 0;

  return {
    total_sales_amount,
    total_discount,
    total_line_discount,
    total_coupon_discount,
    total_scheme_value,
    total_offer_qty,
    total_bill_count,
    total_stores: storeSet.size,
    overall_discount_pct: Number(overall_discount_pct.toFixed(2)),
    top_discount_store,
    top_discount_amount,
  };
}
