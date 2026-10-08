import { apiRequest } from "./apiClient";

export interface TopSellingItemsQueryParams {
  from_date?: string;
  to_date?: string;
  branch_code?: string;
}

export interface TopSellingItem {
  branch_code: string;
  branch_name: string;
  rank: number;
  item_code: string;
  item_name: string;
  total_qty: number;
  sales_amount: number;
}

export interface TopSellingItemsTotals {
  total_sales_amount: number;
  total_qty: number;
  total_items: number;
  total_stores: number;
  top_item_name: string;
  top_item_amount: number;
}

export interface TopSellingItemsResult {
  data: TopSellingItem[];
  totals?: TopSellingItemsTotals;
  isLive: boolean;
  error?: string;
  message?: string;
}

/**
 * Fetches store-wise top selling items from API (`store-top-selling-items`).
 * `limit` is hardcoded to 10 and `order_by` is hardcoded to 'amount' per user specification.
 * Does NOT set hardcoded default mock data if live API fails.
 */
export async function fetchTopSellingItems(
  params: TopSellingItemsQueryParams = {},
): Promise<TopSellingItemsResult> {
  const queryObj: Record<string, string> = {
    limit: "10",
    order_by: "amount",
  };

  if (params.from_date) queryObj.from_date = String(params.from_date);
  if (params.to_date) queryObj.to_date = String(params.to_date);
  if (params.branch_code) queryObj.branch_code = String(params.branch_code);

  const queryParams = new URLSearchParams(queryObj).toString();
  const endpoint = `store-top-selling-items${queryParams ? `?${queryParams}` : ""}`;

  try {
    const res = await apiRequest<any>(endpoint, { method: "GET" });
    const rawData = extractTopSellingItemsArray(res);
    const totals = calculateTotals(rawData);

    return {
      data: rawData,
      totals,
      isLive: true,
      message:
        res?.message || "Store-wise top selling items fetched successfully",
    };
  } catch (getErr: any) {
    console.warn(
      "GET store-top-selling-items failed, trying POST fallback:",
      getErr.message,
    );

    try {
      const payload: any = {
        limit: 10,
        order_by: "amount",
      };
      if (params.from_date) payload.from_date = params.from_date;
      if (params.to_date) payload.to_date = params.to_date;
      if (params.branch_code) payload.branch_code = params.branch_code;

      const postRes = await apiRequest<any>("store-top-selling-items", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const rawData = extractTopSellingItemsArray(postRes);
      const totals = calculateTotals(rawData);

      return {
        data: rawData,
        totals,
        isLive: true,
        message:
          postRes?.message ||
          "Store-wise top selling items fetched successfully",
      };
    } catch (postErr: any) {
      console.error(
        "Both GET and POST store-top-selling-items failed:",
        postErr.message,
      );
      return {
        data: [],
        isLive: false,
        error:
          postErr.message ||
          getErr.message ||
          "Failed to fetch store top selling items data",
      };
    }
  }
}

/**
 * Normalizes top selling items array from API responses.
 */
function extractTopSellingItemsArray(res: any): TopSellingItem[] {
  if (!res) return [];
  const payload = res.data !== undefined ? res.data : res;

  if (Array.isArray(payload)) {
    return payload.map(normalizeTopSellingItem);
  }
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data))
      return payload.data.map(normalizeTopSellingItem);
    if (Array.isArray(payload.items))
      return payload.items.map(normalizeTopSellingItem);
    if (Array.isArray(payload.records))
      return payload.records.map(normalizeTopSellingItem);
  }

  return [];
}

/**
 * Normalizes a single top selling item entry into strong types.
 */
function normalizeTopSellingItem(item: any, idx: number): TopSellingItem {
  return {
    branch_code: String(item.branch_code || item.store_code || ""),
    branch_name: String(
      item.branch_name || item.store_name || `Store ${item.branch_code || ""}`,
    ),
    rank: Number(item.rank || item.position || idx + 1),
    item_code: String(item.item_code || item.sku || item.code || ""),
    item_name: String(item.item_name || item.name || item.item_code || "Item"),
    total_qty: Number(item.total_qty || item.qty || 0),
    sales_amount: Number(
      item.sales_amount || item.amount || item.net_sales || 0,
    ),
  };
}

/**
 * Computes aggregated summary totals for top selling items.
 */
function calculateTotals(items: TopSellingItem[]): TopSellingItemsTotals {
  let total_sales_amount = 0;
  let total_qty = 0;
  const storeSet = new Set<string>();
  const itemMap: Record<string, { name: string; amount: number }> = {};

  items.forEach((item) => {
    total_sales_amount += item.sales_amount;
    total_qty += item.total_qty;
    if (item.branch_code) storeSet.add(item.branch_code);

    const code = item.item_code || item.item_name;
    if (!itemMap[code]) {
      itemMap[code] = { name: item.item_name || item.item_code, amount: 0 };
    }
    itemMap[code].amount += item.sales_amount;
  });

  let top_item_name = "None";
  let top_item_amount = 0;

  Object.values(itemMap).forEach((val) => {
    if (val.amount > top_item_amount) {
      top_item_amount = val.amount;
      top_item_name = val.name;
    }
  });

  return {
    total_sales_amount,
    total_qty,
    total_items: Object.keys(itemMap).length,
    total_stores: storeSet.size,
    top_item_name,
    top_item_amount,
  };
}
