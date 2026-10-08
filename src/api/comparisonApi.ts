import { apiRequest, getStoredUser } from './apiClient';

export interface BillComparisonItem {
  branch_code?: string;
  branch_name?: string;
  store_name?: string;
  date?: string;
  bill_date?: string;
  desktop_app_count?: number;
  pos_count?: number;
  central_count?: number;
  erp_count?: number;
  total_bills?: number;
  pos_bill_count?: number;
  total_amount?: number;
  pos_total_amount?: number;
  matched_count?: number;
  discrepancy_count?: number;
  fy_code?: string;
  status?: string;
  [key: string]: any;
}

export interface BillComparisonResult {
  data: BillComparisonItem[];
  isLive: boolean;
  error?: string;
}

export interface ErpPosSummary {
  matched: number;
  mismatched: number;
  missing_in_erp: number;
  missing_in_pos: number;
}

export interface ErpPosComparisonItem {
  branch_code?: string;
  branch_name?: string;
  store_name?: string;
  invoice_no?: string;
  erp_invoice_no?: string;
  pos_qty?: number;
  erp_qty?: number;
  qty_diff?: number;
  pos_amount?: number;
  erp_amount?: number;
  amount_diff?: number;
  date?: string;
  from_date?: string;
  to_date?: string;
  erp_bill_count?: number;
  pos_bill_count?: number;
  bill_count_diff?: number;
  erp_total_amount?: number;
  pos_total_amount?: number;
  difference_amount?: number;
  variance?: number;
  category?: 'MATCHED' | 'MISMATCHED' | 'MISSING_IN_ERP' | 'MISSING_IN_POS';
  status?: string;
  [key: string]: any;
}

export interface ErpPosComparisonResult {
  data: ErpPosComparisonItem[];
  summary?: ErpPosSummary;
  isLive: boolean;
  error?: string;
}

export interface BranchItem {
  branch_code: string;
  branch_name: string;
  city?: string;
  state?: string;
  status?: string;
  [key: string]: any;
}

export interface BranchListResult {
  data: BranchItem[];
  isLive: boolean;
  error?: string;
}

/**
 * Fetches Bill Comparison Store-Date Summary.
 * Endpoint: `pos/bill-comparison/store-date-summary?from=YYYY-MM-DD&to=YYYY-MM-DD&fy_code=20262027`
 */
export async function fetchBillComparison(params: {
  from: string;
  to: string;
  fy_code?: string;
}): Promise<BillComparisonResult> {
  const queryObj: Record<string, string> = {
    from: params.from,
    to: params.to,
  };
  if (params.fy_code) {
    queryObj.fy_code = params.fy_code;
  }

  const queryParams = new URLSearchParams(queryObj).toString();
  const endpoint = `pos/bill-comparison/store-date-summary${queryParams ? `?${queryParams}` : ''}`;

  try {
    const res = await apiRequest<any>(endpoint, { method: 'GET' });
    const data = extractArrayPayload(res);
    return { data, isLive: true };
  } catch (err: any) {
    console.warn('Bill Comparison API failed:', err.message);
    return {
      data: [],
      isLive: false,
      error: err.message || 'Failed to fetch Bill Comparison summary',
    };
  }
}

/**
 * Fetches ERP vs POS Comparison data.
 * Endpoint: `erp-pos-comparison?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD&branch_code=5095,5087`
 */
export async function fetchErpPosComparison(params: {
  from_date: string;
  to_date: string;
  branch_code?: string;
}): Promise<ErpPosComparisonResult> {
  let branchCode = params.branch_code;
  if (!branchCode) {
    const storedUser = await getStoredUser();
    branchCode = storedUser?.branchCode || '5010';
  }

  const queryObj: Record<string, string> = {
    from_date: params.from_date,
    to_date: params.to_date,
    branch_code: branchCode,
  };

  const queryParams = new URLSearchParams(queryObj).toString();
  const endpoint = `erp-pos-comparison${queryParams ? `?${queryParams}` : ''}`;

  try {
    const res = await apiRequest<any>(endpoint, { method: 'GET' });
    const data = extractArrayPayload(res);
    const summary = res.summary || (res.data && res.data.summary) || undefined;
    return { data, summary, isLive: true };
  } catch (err: any) {
    console.warn('ERP-POS Comparison API failed:', err.message);
    return {
      data: [],
      isLive: false,
      error: err.message || 'Failed to fetch ERP-POS Comparison data',
    };
  }
}

/**
 * Fetches the list of branches for ERP-POS Comparison filtering.
 * Endpoint: `/branches`
 */
export async function fetchBranches(): Promise<BranchListResult> {
  try {
    const res = await apiRequest<any>('branches', { method: 'GET' });
    const rawData = extractArrayPayload(res);

    const formattedBranches: BranchItem[] = rawData.map((item: any) => ({
      branch_code: String(item.branch_code || item.code || item.id || ''),
      branch_name: String(item.branch_name || item.name || item.title || `Store ${item.branch_code || item.code}`),
      city: item.city || '',
      state: item.state || '',
      status: item.status || 'ACTIVE',
    })).filter((b: BranchItem) => b.branch_code.length > 0);

    return { data: formattedBranches, isLive: true };
  } catch (err: any) {
    console.warn('Fetch branches API failed:', err.message);
    return {
      data: [
        { branch_code: '5010', branch_name: 'Store 5010 - NOIDA DLF MOI', city: 'Noida' },
        { branch_code: '5095', branch_name: 'Store 5095 - Delhi NCR', city: 'Delhi' },
        { branch_code: '5087', branch_name: 'Store 5087 - Mumbai Central', city: 'Mumbai' },
        { branch_code: '5003', branch_name: 'Store 5003 - Bangalore East', city: 'Bangalore' },
        { branch_code: '5012', branch_name: 'Store 5012 - Hyderabad Prime', city: 'Hyderabad' },
      ],
      isLive: false,
      error: err.message || 'Failed to load branch list',
    };
  }
}

/**
 * Helper to safely extract array payloads from diverse API response structures.
 */
function extractArrayPayload(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;

  const payload = res.data !== undefined ? res.data : res;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    // Specific handler for ERP-POS Comparison API response structure
    const combined: any[] = [];
    if (Array.isArray(payload.mismatched)) {
      combined.push(...payload.mismatched.map((i: any) => ({ ...i, category: 'MISMATCHED', status: i.status || 'MISMATCHED' })));
    }
    if (Array.isArray(payload.missing_in_erp)) {
      combined.push(...payload.missing_in_erp.map((i: any) => ({ ...i, category: 'MISSING_IN_ERP', status: i.status || 'MISSING_IN_ERP' })));
    }
    if (Array.isArray(payload.missing_in_pos)) {
      combined.push(...payload.missing_in_pos.map((i: any) => ({ ...i, category: 'MISSING_IN_POS', status: i.status || 'MISSING_IN_POS' })));
    }
    if (Array.isArray(payload.matched)) {
      combined.push(...payload.matched.map((i: any) => ({ ...i, category: 'MATCHED', status: i.status || 'MATCHED' })));
    }
    if (combined.length > 0) return combined;

    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.records)) return payload.records;
    if (Array.isArray(payload.summary) && typeof payload.summary !== 'object') return payload.summary;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.results)) return payload.results;
    if (Array.isArray(payload.comparison)) return payload.comparison;
    if (Array.isArray(payload.branches)) return payload.branches;
  }
  return [];
}
