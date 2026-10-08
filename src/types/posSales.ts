export interface Store {
  id: string;
  code: string;
  name: string;
  city: string;
  region: string;
  zone: 'North Zone' | 'West Zone' | 'South Zone' | 'East Zone';
  channel: 'In-Store POS' | 'Omnichannel / Click & Collect' | 'Express Kiosk';
  sqft: number;
  spsf: number;
  gmroi: number;
  targetRevenue: number;
  currentRevenue: number;
  eomForecast: number;
  grossMarginPercent: number;
  discountLeakagePercent: number;
  footfallConversion: number;
  ordersCount: number;
  aov: number;
  ipt: number;
  activeTerminals: number;
  totalTerminals: number;
  peakHour: string;
  status: 'Exceeding' | 'On Target' | 'Below Target';
}

export interface HourlySalesPoint {
  hour: string;
  actual: number;
  target: number;
  orders: number;
}

export interface POSTransaction {
  id: string;
  terminalId: string;
  storeName: string;
  cashier: string;
  itemsCount: number;
  amount: number;
  paymentMethod: string;
  timestamp: string;
  status: 'Completed' | 'Refunded' | 'Pending';
}

export interface CategorySales {
  name: string;
  revenue: number;
  sharePercent: number;
  growth: number;
  grossMargin: number;
}

export interface PaymentMethodShare {
  method: string;
  amount: number;
  sharePercent: number;
  count: number;
  color: string;
}

export interface TopSellingItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  marginPercent: number;
}

export interface ExecutiveSummaryMetrics {
  totalRevenueToday: number;
  revenueTarget: number;
  revenueGrowthVsYesterday: number;
  eomTarget: number;
  eomForecast: number;
  gmroi: number;
  averageSpsf: number;
  discountLeakage: number;
  totalOrdersToday: number;
  ordersGrowthVsYesterday: number;
  averageOrderValue: number;
  itemsPerTransaction: number;
  activeTerminalsCount: number;
  totalTerminalsCount: number;
  peakHourRange: string;
  peakHourRevenue: number;
}
