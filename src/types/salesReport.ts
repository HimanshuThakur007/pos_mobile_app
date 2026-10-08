export interface SaleReportQueryParams {
  branch_code?: string;
  from_date?: string; // YYYY-MM-DD
  to_date?: string; // YYYY-MM-DD
  cashier_id?: string;
  invoice_from?: number | string;
  invoice_to?: number | string;
  invoice_no?: string;
}

export interface SaleReportSummaryRow {
  invoice_no?: string;
  bill_no?: string;
  erp_invoice_no?: string;
  pos_bill_saved_at?: string;
  created_at?: string;
  branch_code?: string;
  branch_name?: string;
  branch_address?: string;
  user_id?: string;
  cashier_id?: string;
  cashier_name?: string;
  terminal_code?: string;
  doc_type?: string | number;
  doc_type_name?: string;
  total_qty?: number | string;
  sku_count?: number | string;
  taxable_amount?: number | string;
  total_discount?: number | string;
  round_off?: number | string;
  total_cgst?: number | string;
  total_sgst?: number | string;
  total_igst?: number | string;
  tax_amount?: number | string;
  total_amount?: number | string;
  net_amount?: number | string;
  grand_total?: number | string;
  print_status?: string;
  print_count?: number | string;
  sync_status?: string | number;
  cn_status?: string | number;
  ref_invoice_no?: string;
  cash_amount?: number | string;
  card_amount?: number | string;
  upi_amount?: number | string;
  credit_amount?: number | string;
  cheque_amount?: number | string;
  customer_name?: string;
  customer_mobile?: string;
  customer_gstin?: string;
  company_name?: string;
  gst_address?: string;
}

export interface SaleReportItemRow {
  item_code?: string;
  itemCode?: string;
  ItemCode?: string;
  sku_code?: string;
  item_name?: string;
  itemName?: string;
  print_desc?: string;
  printDesc?: string;
  description?: string;
  qty?: number | string;
  quantity?: number | string;
  total_qty?: number | string;
  mrp?: number | string;
  gross_price?: number | string;
  unit_price?: number | string;
  price?: number | string;
  discount?: number | string;
  discount_amount?: number | string;
  disc?: number | string;
  taxable_amount?: number | string;
  taxable?: number | string;
  cgst_amount?: number | string;
  sgst_amount?: number | string;
  igst_amount?: number | string;
  tax_amount?: number | string;
  tax_percent?: number | string;
  tax_rate?: number | string;
  gst_percent?: number | string;
  gst_rate?: number | string;
  subtotal?: number | string;
  total_amount?: number | string;
  net_amount?: number | string;
  hsn_code?: string;
}

export interface HourlyReportRow {
  hourRange: string;
  grossSales: number;
  discounts: number;
  netSales: number;
  ordersCount: number;
  aov: number;
  targetRevenue: number;
  variancePercent: number;
  isPeak: boolean;
}

export interface TotalSalesPeriodRow {
  period: 'Today (Live)' | 'Yesterday' | 'Week-to-Date (WTD)' | 'Month-to-Date (MTD)' | 'Year-to-Date (YTD)';
  grossSales: number;
  discounts: number;
  returnsAmount: number;
  netSales: number;
  ordersCount: number;
  unitsSold: number;
  aov: number;
  growthPercent: number;
}

export interface StoreReportRow {
  storeCode: string;
  storeName: string;
  city: string;
  region: string;
  grossSales: number;
  returnsAmount: number;
  netSales: number;
  ordersCount: number;
  aov: number;
  marginPercent: number;
  cashierCount: number;
  status: 'Exceeding' | 'On Target' | 'Below Target';
}

export interface ProductCategoryReportRow {
  category: string;
  skusCount: number;
  unitsSold: number;
  grossSales: number;
  discounts: number;
  netSales: number;
  sharePercent: number;
}

export interface ReportSummaryMetrics {
  totalNetSales: number;
  netSalesGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  aov: number;
  aovGrowth: number;
  peakVelocity: number;
  peakWindow: string;
  peakGrowth: number;
}
