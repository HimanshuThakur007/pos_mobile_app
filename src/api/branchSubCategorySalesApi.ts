import { apiRequest } from './apiClient';

export interface BranchSubCategorySalesQueryParams {
  from_date?: string;
  to_date?: string;
  branch_code?: string;
}

export interface BranchSubCategorySalesItem {
  branch_code: string;
  branch_name: string;
  department: string;
  category: string;
  sub_category: string;
  total_qty: number;
  sales_amount: number;
  discount: number;
}

export interface BranchSubCategorySalesTotals {
  total_sales_amount: number;
  total_qty: number;
  total_discount: number;
  total_records: number;
  total_sub_categories: number;
  total_categories: number;
  top_category: string;
  top_category_amount: number;
  top_sub_category: string;
  top_sub_category_amount: number;
}

export interface BranchSubCategorySalesResult {
  data: BranchSubCategorySalesItem[];
  totals?: BranchSubCategorySalesTotals;
  isLive: boolean;
  error?: string;
  message?: string;
}

/**
 * Fetches store-wise sub category sales data from API (`store-sub-category-sales`).
 * Optimized for large datasets (lakhs of rows).
 * Does NOT set hardcoded default mock data if live API fails.
 */
export async function fetchBranchSubCategorySales(
  params: BranchSubCategorySalesQueryParams = {}
): Promise<BranchSubCategorySalesResult> {
  const queryObj: Record<string, string> = {};

  if (params.from_date) queryObj.from_date = String(params.from_date);
  if (params.to_date) queryObj.to_date = String(params.to_date);
  if (params.branch_code) queryObj.branch_code = String(params.branch_code);

  const queryParams = new URLSearchParams(queryObj).toString();
  const endpoint = `store-sub-category-sales${queryParams ? `?${queryParams}` : ''}`;

  try {
    const res = await apiRequest<any>(endpoint, { method: 'GET' });
    const rawData = extractSubCategoryArray(res);
    const totals = calculateTotals(rawData);

    return {
      data: rawData,
      totals,
      isLive: true,
      message: res?.message || 'Store-wise sub category sales fetched successfully',
    };
  } catch (getErr: any) {
    console.warn('GET store-sub-category-sales failed, trying POST fallback:', getErr.message);

    try {
      const payload: any = {};
      if (params.from_date) payload.from_date = params.from_date;
      if (params.to_date) payload.to_date = params.to_date;
      if (params.branch_code) payload.branch_code = params.branch_code;

      const postRes = await apiRequest<any>('store-sub-category-sales', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const rawData = extractSubCategoryArray(postRes);
      const totals = calculateTotals(rawData);

      return {
        data: rawData,
        totals,
        isLive: true,
        message: postRes?.message || 'Store-wise sub category sales fetched successfully',
      };
    } catch (postErr: any) {
      console.error('Both GET and POST store-sub-category-sales failed:', postErr.message);
      return {
        data: [],
        isLive: false,
        error: postErr.message || getErr.message || 'Failed to fetch store sub-category sales data',
      };
    }
  }
}

/**
 * Normalizes sub category sales array from various response shapes.
 */
function extractSubCategoryArray(res: any): BranchSubCategorySalesItem[] {
  if (!res) return [];
  const payload = res.data !== undefined ? res.data : res;

  if (Array.isArray(payload)) {
    return payload.map(normalizeSubCategoryItem);
  }
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) return payload.data.map(normalizeSubCategoryItem);
    if (Array.isArray(payload.sub_categories)) return payload.sub_categories.map(normalizeSubCategoryItem);
    if (Array.isArray(payload.records)) return payload.records.map(normalizeSubCategoryItem);
  }

  return [];
}

/**
 * Normalizes a single sub-category sales item into standard types.
 */
function normalizeSubCategoryItem(item: any): BranchSubCategorySalesItem {
  return {
    branch_code: String(item.branch_code || item.store_code || ''),
    branch_name: String(item.branch_name || item.store_name || `Store ${item.branch_code || ''}`),
    department: String(item.department || item.dept || 'OTHER').toUpperCase(),
    category: String(item.category || item.cat || 'GENERAL').toUpperCase(),
    sub_category: String(item.sub_category || item.sub_cat || 'GENERAL').toUpperCase(),
    total_qty: Number(item.total_qty || item.qty || 0),
    sales_amount: Number(item.sales_amount || item.amount || item.net_sales || 0),
    discount: Number(item.discount || item.disc || 0),
  };
}

/**
 * Computes aggregated summary totals for sub-category sales.
 */
function calculateTotals(items: BranchSubCategorySalesItem[]): BranchSubCategorySalesTotals {
  let total_sales_amount = 0;
  let total_qty = 0;
  let total_discount = 0;

  const categoryMap: Record<string, number> = {};
  const subCategoryMap: Record<string, number> = {};

  items.forEach((item) => {
    const amt = item.sales_amount;
    total_sales_amount += amt;
    total_qty += item.total_qty;
    total_discount += item.discount;

    const cat = item.category;
    const subCat = item.sub_category;

    categoryMap[cat] = (categoryMap[cat] || 0) + amt;
    subCategoryMap[subCat] = (subCategoryMap[subCat] || 0) + amt;
  });

  let top_category = 'None';
  let top_category_amount = 0;
  Object.entries(categoryMap).forEach(([cat, amt]) => {
    if (amt > top_category_amount) {
      top_category_amount = amt;
      top_category = cat;
    }
  });

  let top_sub_category = 'None';
  let top_sub_category_amount = 0;
  Object.entries(subCategoryMap).forEach(([subCat, amt]) => {
    if (amt > top_sub_category_amount) {
      top_sub_category_amount = amt;
      top_sub_category = subCat;
    }
  });

  return {
    total_sales_amount,
    total_qty,
    total_discount,
    total_records: items.length,
    total_sub_categories: Object.keys(subCategoryMap).length,
    total_categories: Object.keys(categoryMap).length,
    top_category,
    top_category_amount,
    top_sub_category,
    top_sub_category_amount,
  };
}
