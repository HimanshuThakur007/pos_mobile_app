import { apiRequest } from './apiClient';

export interface BranchWiseSalesItem {
  rank: number;
  branch_code: string;
  branch_name: string;
  city?: string;
  state?: string;
  sales_amount: number;
  net_sales: number;
  discount: number;
  tax: number;
  taxable_amount: number;
  tax_amount: number;
  sgst: number;
  cgst: number;
  igst: number;
  bill_count: number;
  total_bills: number;
  total_qty: number;
  avg_bill_value: number;
  return_bill_count: number;
  return_qty: number;
  return_amount: number;
  return_discount: number;
  return_tax: number;
  target_sales?: number;
  achievement_pct?: number;
  growth_pct?: number;
  status?: string;
  [key: string]: any;
}

export interface BranchWiseSalesTotals {
  total_stores: number;
  total_bills: number;
  total_qty: number;
  sales_amount: number;
  total_discount: number;
  total_tax: number;
  taxable_amount: number;
  return_bills: number;
  return_qty: number;
  return_amount: number;
  net_sales: number;
}

export interface BranchWiseSalesMeta {
  from_date?: string;
  to_date?: string;
  financial_year?: string;
  branch_code?: string[] | string;
  ranking_by?: string;
}

export interface BranchWiseSalesQueryParams {
  from_date: string;
  to_date: string;
  branch_code?: string;
}

export interface BranchWiseSalesResult {
  data: BranchWiseSalesItem[];
  totals?: BranchWiseSalesTotals;
  meta?: BranchWiseSalesMeta;
  isLive: boolean;
  error?: string;
}

/**
 * Fetches Store/Branch Sales Ranking data from live API endpoint.
 * Endpoint: `store-sales-ranking?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD&branch_code=5080,5010,5047`
 * Strictly queries backend without mock data fallbacks.
 */
export async function fetchBranchWiseSales(
  params: BranchWiseSalesQueryParams
): Promise<BranchWiseSalesResult> {
  const queryObj: Record<string, string> = {
    from_date: params.from_date,
    to_date: params.to_date,
  };

  if (params.branch_code && params.branch_code.trim() !== '') {
    queryObj.branch_code = params.branch_code.trim();
  }

  const queryParams = new URLSearchParams(queryObj).toString();
  const endpoint = `store-sales-ranking${queryParams ? `?${queryParams}` : ''}`;

  try {
    const res = await apiRequest<any>(endpoint, { method: 'GET' });
    const rawArray = extractArrayPayload(res);
    const data = normalizeBranchSalesItems(rawArray);
    const totals = extractTotalsPayload(res, data);
    const meta = extractMetaPayload(res);

    return { data, totals, meta, isLive: true };
  } catch (err: any) {
    console.error('Store sales ranking API request failed:', err.message);
    return {
      data: [],
      isLive: false,
      error: err.message || 'Failed to fetch store sales ranking data from API.',
    };
  }
}

/**
 * Helper to extract array payload from diverse backend response structures.
 */
function extractArrayPayload(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  const payload = res.data !== undefined ? res.data : res;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.ranking)) return payload.ranking;
    if (Array.isArray(payload.rankings)) return payload.rankings;
    if (Array.isArray(payload.stores)) return payload.stores;
    if (Array.isArray(payload.branches)) return payload.branches;
    if (Array.isArray(payload.sales)) return payload.sales;
    if (Array.isArray(payload.report)) return payload.report;
  }
  return [];
}

/**
 * Helper to extract or construct totals payload.
 */
function extractTotalsPayload(res: any, data: BranchWiseSalesItem[]): BranchWiseSalesTotals {
  const rawTotals = res?.totals || res?.data?.totals;
  if (rawTotals && typeof rawTotals === 'object') {
    return {
      total_stores: Number(rawTotals.total_stores ?? data.length),
      total_bills: Number(rawTotals.total_bills ?? rawTotals.bill_count ?? 0),
      total_qty: Number(rawTotals.total_qty ?? rawTotals.total_units ?? 0),
      sales_amount: Number(rawTotals.sales_amount ?? 0),
      total_discount: Number(rawTotals.total_discount ?? rawTotals.discount ?? 0),
      total_tax: Number(rawTotals.total_tax ?? rawTotals.tax ?? 0),
      taxable_amount: Number(rawTotals.taxable_amount ?? 0),
      return_bills: Number(rawTotals.return_bills ?? rawTotals.return_bill_count ?? 0),
      return_qty: Number(rawTotals.return_qty ?? 0),
      return_amount: Number(rawTotals.return_amount ?? 0),
      net_sales: Number(rawTotals.net_sales ?? rawTotals.sales_amount ?? 0),
    };
  }

  // Fallback computation from data items if backend totals is missing
  let totalBills = 0;
  let totalQty = 0;
  let salesAmount = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let taxableAmount = 0;
  let returnBills = 0;
  let returnQty = 0;
  let returnAmount = 0;
  let netSales = 0;

  data.forEach((item) => {
    totalBills += item.bill_count || 0;
    totalQty += item.total_qty || 0;
    salesAmount += item.sales_amount || 0;
    totalDiscount += item.discount || 0;
    totalTax += item.tax || 0;
    taxableAmount += item.taxable_amount || 0;
    returnBills += item.return_bill_count || 0;
    returnQty += item.return_qty || 0;
    returnAmount += item.return_amount || 0;
    netSales += item.net_sales || 0;
  });

  return {
    total_stores: data.length,
    total_bills: totalBills,
    total_qty: totalQty,
    sales_amount: salesAmount,
    total_discount: totalDiscount,
    total_tax: totalTax,
    taxable_amount: taxableAmount,
    return_bills: returnBills,
    return_qty: returnQty,
    return_amount: returnAmount,
    net_sales: netSales,
  };
}

/**
 * Helper to extract meta object.
 */
function extractMetaPayload(res: any): BranchWiseSalesMeta | undefined {
  const meta = res?.meta || res?.data?.meta;
  if (meta && typeof meta === 'object') {
    return {
      from_date: meta.from_date,
      to_date: meta.to_date,
      financial_year: meta.financial_year,
      branch_code: meta.branch_code,
      ranking_by: meta.ranking_by,
    };
  }
  return undefined;
}

/**
 * Normalizes API response items into BranchWiseSalesItem structure.
 */
function normalizeBranchSalesItems(items: any[]): BranchWiseSalesItem[] {
  const normalized = items.map((item, index) => {
    const branchCode = String(
      item.branch_code || item.code || item.store_code || item.id || ''
    );
    const branchName = String(
      item.branch_name || item.store_name || item.name || item.title || `Branch ${branchCode}`
    );

    const netSales = Number(
      item.net_sales ?? item.total_sales ?? item.sales_amount ?? item.sales ?? item.amount ?? 0
    );
    const salesAmount = Number(
      item.sales_amount ?? item.gross_sales ?? netSales
    );

    const billCount = Number(
      item.bill_count ?? item.total_bills ?? item.orders_count ?? item.invoices_count ?? 0
    );
    const totalQty = Number(
      item.total_qty ?? item.total_units ?? item.units_sold ?? item.item_count ?? item.qty ?? 0
    );

    const discount = Number(item.discount ?? item.total_discount ?? 0);
    const tax = Number(item.tax ?? item.tax_amount ?? item.total_tax ?? 0);
    const taxableAmount = Number(
      item.taxable_amount ?? (salesAmount - discount > 0 ? salesAmount - discount : salesAmount)
    );
    const taxAmount = Number(item.tax_amount ?? tax);

    const sgst = Number(item.sgst ?? 0);
    const cgst = Number(item.cgst ?? 0);
    const igst = Number(item.igst ?? 0);

    const returnBillCount = Number(item.return_bill_count ?? item.return_bills ?? 0);
    const returnQty = Number(item.return_qty ?? 0);
    const returnAmount = Number(item.return_amount ?? 0);
    const returnDiscount = Number(item.return_discount ?? 0);
    const returnTax = Number(item.return_tax ?? 0);

    const calculatedAov = billCount > 0 ? Math.round((netSales / billCount) * 100) / 100 : 0;
    const avgBillValue = Number(item.avg_bill_value ?? item.aov ?? calculatedAov);

    const rank = Number(item.rank || index + 1);

    return {
      rank,
      branch_code: branchCode,
      branch_name: branchName,
      city: item.city || item.location || '',
      state: item.state || '',
      sales_amount: salesAmount,
      net_sales: netSales,
      discount,
      tax,
      taxable_amount: taxableAmount,
      tax_amount: taxAmount,
      sgst,
      cgst,
      igst,
      bill_count: billCount,
      total_bills: billCount,
      total_qty: totalQty,
      avg_bill_value: avgBillValue,
      return_bill_count: returnBillCount,
      return_qty: returnQty,
      return_amount: returnAmount,
      return_discount: returnDiscount,
      return_tax: returnTax,
      target_sales: Number(item.target_sales ?? netSales),
      achievement_pct: Number(item.achievement_pct ?? 100),
      growth_pct: Number(item.growth_pct ?? 0),
      status: item.status,
    };
  });

  normalized.sort((a, b) => (a.rank && b.rank ? a.rank - b.rank : b.net_sales - a.net_sales));
  normalized.forEach((item, idx) => {
    if (!item.rank) {
      item.rank = idx + 1;
    }
  });

  return normalized;
}
