import { apiRequest } from './apiClient';
import { SaleReportQueryParams, SaleReportSummaryRow, SaleReportItemRow } from '../types/salesReport';

export interface SalesReportSummaryResult {
  data: SaleReportSummaryRow[];
  isLive: boolean;
  error?: string;
}

export interface SalesReportItemsResult {
  header?: SaleReportSummaryRow;
  items: SaleReportItemRow[];
  payments?: any[];
  error?: string;
}

/**
 * Fetches the Sales Report Summary from the central POS API (`sale-report/summary`).
 * Matches desktop-pos logic by attempting GET first with query params, and falling back to POST.
 */
export async function fetchSalesReportSummary(
  params: SaleReportQueryParams = {}
): Promise<SalesReportSummaryResult> {
  const queryObj: Record<string, string> = {};

  if (params.branch_code) queryObj.branch_code = String(params.branch_code);
  if (params.from_date) queryObj.from_date = String(params.from_date);
  if (params.to_date) queryObj.to_date = String(params.to_date);
  if (params.cashier_id !== undefined) queryObj.cashier_id = String(params.cashier_id);
  if (params.invoice_from !== undefined && params.invoice_from !== '') {
    queryObj.invoice_from = String(params.invoice_from);
  }
  if (params.invoice_to !== undefined && params.invoice_to !== '') {
    queryObj.invoice_to = String(params.invoice_to);
  }
  if (params.invoice_no && params.invoice_no.trim()) {
    queryObj.invoice_no = params.invoice_no.trim();
  }

  const queryParams = new URLSearchParams(queryObj).toString();
  const getEndpoint = `sale-report/summary${queryParams ? `?${queryParams}` : ''}`;

  try {
    const res = await apiRequest<any>(getEndpoint, { method: 'GET' });
    const parsedData = extractSummaryArray(res);
    return { data: parsedData, isLive: true };
  } catch (getErr: any) {
    console.warn('GET sale-report/summary failed, trying POST fallback:', getErr.message);

    try {
      const payload: any = {
        branch_code: params.branch_code || '',
        from_date: params.from_date || '',
        to_date: params.to_date || '',
        cashier_id: params.cashier_id || '',
      };
      if (params.invoice_from !== undefined && params.invoice_from !== '') {
        payload.invoice_from = Number(params.invoice_from);
      }
      if (params.invoice_to !== undefined && params.invoice_to !== '') {
        payload.invoice_to = Number(params.invoice_to);
      }
      if (params.invoice_no && params.invoice_no.trim()) {
        payload.invoice_no = params.invoice_no.trim();
      }

      const postRes = await apiRequest<any>('sale-report/summary', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const parsedData = extractSummaryArray(postRes);
      return { data: parsedData, isLive: true };
    } catch (postErr: any) {
      console.error('Both GET and POST sale-report/summary failed:', postErr.message);
      return {
        data: [],
        isLive: false,
        error: postErr.message || getErr.message || 'Failed to fetch sales report',
      };
    }
  }
}

/**
 * Extracts sale summary rows array from various API response shapes.
 */
function extractSummaryArray(res: any): SaleReportSummaryRow[] {
  if (!res) return [];
  const payload = res.data !== undefined ? res.data : res;

  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.sales)) return payload.sales;
    if (Array.isArray(payload.report)) return payload.report;
    if (Array.isArray(payload.summary)) return payload.summary;
  }

  return [];
}

/**
 * Fetches detailed line items for a specific invoice (`sale-report/{invoice_no}/items`).
 * Matches desktop-pos API.
 */
export async function fetchSalesReportItems(
  invoiceNo: string,
  branchCode?: string
): Promise<SalesReportItemsResult> {
  if (!invoiceNo) {
    return { items: [], error: 'Invalid invoice number' };
  }

  const queryParams = new URLSearchParams();
  if (branchCode) {
    queryParams.append('branch_code', branchCode);
  }

  const endpoint = `sale-report/${encodeURIComponent(invoiceNo)}/items${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  try {
    const res = await apiRequest<any>(endpoint, { method: 'GET' });
    const payload = res.data !== undefined ? res.data : res;

    let items: SaleReportItemRow[] = [];
    let header: SaleReportSummaryRow | undefined = undefined;
    let payments: any[] = [];

    if (Array.isArray(payload)) {
      items = payload;
    } else if (payload && typeof payload === 'object') {
      if (payload.header) header = payload.header;
      if (Array.isArray(payload.items)) items = payload.items;
      else if (Array.isArray(payload.data)) items = payload.data;

      if (Array.isArray(payload.payments)) payments = payload.payments;
    }

    return { header, items, payments };
  } catch (err: any) {
    console.error(`Error fetching items for invoice ${invoiceNo}:`, err.message);
    return { items: [], error: err.message || 'Failed to load invoice item details' };
  }
}
