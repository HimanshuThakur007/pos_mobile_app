import {
  HourlyReportRow,
  TotalSalesPeriodRow,
  StoreReportRow,
  ProductCategoryReportRow,
  ReportSummaryMetrics,
} from '../types/salesReport';

export const SUMMARY_METRICS_DATA: ReportSummaryMetrics = {
  totalNetSales: 1693000.0,
  netSalesGrowth: 14.8,
  totalOrders: 2813,
  ordersGrowth: 8.5,
  aov: 601.84,
  aovGrowth: 3.2,
  peakVelocity: 248000.0,
  peakWindow: '02:00 PM - 03:00 PM',
  peakGrowth: 27.1,
};

export const HOURLY_SALES_REPORT_DATA: HourlyReportRow[] = [
  { hourRange: '08:00 AM - 09:00 AM', grossSales: 44200.0, discounts: 2200.0, netSales: 42000.0, ordersCount: 85, aov: 494.11, targetRevenue: 40000.0, variancePercent: 5.0, isPeak: false },
  { hourRange: '09:00 AM - 10:00 AM', grossSales: 71500.0, discounts: 3500.0, netSales: 68000.0, ordersCount: 120, aov: 566.66, targetRevenue: 60000.0, variancePercent: 13.3, isPeak: false },
  { hourRange: '10:00 AM - 11:00 AM', grossSales: 99800.0, discounts: 4800.0, netSales: 95000.0, ordersCount: 165, aov: 575.75, targetRevenue: 85000.0, variancePercent: 11.7, isPeak: false },
  { hourRange: '11:00 AM - 12:00 PM', grossSales: 149000.0, discounts: 7000.0, netSales: 142000.0, ordersCount: 240, aov: 591.66, targetRevenue: 120000.0, variancePercent: 18.3, isPeak: false },
  { hourRange: '12:00 PM - 01:00 PM', grossSales: 194000.0, discounts: 9000.0, netSales: 185000.0, ordersCount: 310, aov: 596.77, targetRevenue: 160000.0, variancePercent: 15.6, isPeak: false },
  { hourRange: '01:00 PM - 02:00 PM', grossSales: 225000.0, discounts: 11000.0, netSales: 214000.0, ordersCount: 355, aov: 602.81, targetRevenue: 180000.0, variancePercent: 18.8, isPeak: false },
  { hourRange: '02:00 PM - 03:00 PM', grossSales: 261000.0, discounts: 13000.0, netSales: 248000.0, ordersCount: 398, aov: 623.11, targetRevenue: 195000.0, variancePercent: 27.1, isPeak: true },
  { hourRange: '03:00 PM - 04:00 PM', grossSales: 208000.0, discounts: 10000.0, netSales: 198000.0, ordersCount: 320, aov: 618.75, targetRevenue: 180000.0, variancePercent: 10.0, isPeak: false },
  { hourRange: '04:00 PM - 05:00 PM', grossSales: 172000.0, discounts: 8000.0, netSales: 164000.0, ordersCount: 275, aov: 596.36, targetRevenue: 160000.0, variancePercent: 2.5, isPeak: false },
  { hourRange: '05:00 PM - 06:00 PM', grossSales: 211000.0, discounts: 10000.0, netSales: 201000.0, ordersCount: 330, aov: 609.09, targetRevenue: 175000.0, variancePercent: 14.8, isPeak: false },
  { hourRange: '06:00 PM - 07:00 PM', grossSales: 244000.0, discounts: 12000.0, netSales: 232000.0, ordersCount: 380, aov: 610.52, targetRevenue: 190000.0, variancePercent: 22.1, isPeak: true },
  { hourRange: '07:00 PM - 08:00 PM', grossSales: 184500.0, discounts: 9000.0, netSales: 175500.0, ordersCount: 290, aov: 605.17, targetRevenue: 150000.0, variancePercent: 17.0, isPeak: false },
  { hourRange: '08:00 PM - 09:00 PM', grossSales: 129000.0, discounts: 6000.0, netSales: 123000.0, ordersCount: 205, aov: 600.00, targetRevenue: 110000.0, variancePercent: 11.8, isPeak: false },
  { hourRange: '09:00 PM - 10:00 PM', grossSales: 85000.0, discounts: 4000.0, netSales: 81000.0, ordersCount: 140, aov: 578.57, targetRevenue: 80000.0, variancePercent: 1.25, isPeak: false },
];

export const TOTAL_SALES_PERIOD_DATA: TotalSalesPeriodRow[] = [
  { period: 'Today (Live)', grossSales: 1825000.0, discounts: 107500.0, returnsAmount: 24500.0, netSales: 1693000.0, ordersCount: 2813, unitsSold: 8157, aov: 601.84, growthPercent: 14.8 },
  { period: 'Yesterday', grossSales: 1589000.0, discounts: 92000.0, returnsAmount: 22000.0, netSales: 1475000.0, ordersCount: 2510, unitsSold: 7280, aov: 587.64, growthPercent: 8.2 },
  { period: 'Week-to-Date (WTD)', grossSales: 9450000.0, discounts: 540000.0, returnsAmount: 132000.0, netSales: 8778000.0, ordersCount: 14920, unitsSold: 43268, aov: 588.33, growthPercent: 12.1 },
  { period: 'Month-to-Date (MTD)', grossSales: 38200000.0, discounts: 2150000.0, returnsAmount: 510000.0, netSales: 35540000.0, ordersCount: 59800, unitsSold: 173420, aov: 594.31, growthPercent: 16.5 },
  { period: 'Year-to-Date (YTD)', grossSales: 284500000.0, discounts: 16200000.0, returnsAmount: 3800000.0, netSales: 264500000.0, ordersCount: 442500, unitsSold: 1283250, aov: 597.73, growthPercent: 19.4 },
];

export const STORE_SALES_REPORT_DATA: StoreReportRow[] = [
  { storeCode: 'STR-101', storeName: 'DLF Mall of India', city: 'Noida (Delhi NCR)', region: 'North India', grossSales: 552000.0, returnsAmount: 8200.0, netSales: 524800.0, ordersCount: 842, aov: 623.28, marginPercent: 44.8, cashierCount: 12, status: 'Exceeding' },
  { storeCode: 'STR-102', storeName: 'Phoenix Palladium Mall', city: 'Lower Parel, Mumbai', region: 'West India', grossSales: 412000.0, returnsAmount: 6500.0, netSales: 391500.0, ordersCount: 610, aov: 641.80, marginPercent: 42.5, cashierCount: 9, status: 'On Target' },
  { storeCode: 'STR-103', storeName: 'UB City Galleria', city: 'Vittal Mallya, Bengaluru', region: 'South India', grossSales: 298000.0, returnsAmount: 3800.0, netSales: 284200.0, ordersCount: 512, aov: 555.07, marginPercent: 39.2, cashierCount: 7, status: 'Below Target' },
  { storeCode: 'STR-104', storeName: 'Express Avenue Mall', city: 'Royapettah, Chennai', region: 'South India', grossSales: 312000.0, returnsAmount: 4200.0, netSales: 298000.0, ordersCount: 480, aov: 620.83, marginPercent: 46.1, cashierCount: 8, status: 'Exceeding' },
  { storeCode: 'STR-105', storeName: 'Quest Mall', city: 'Park Circus, Kolkata', region: 'East India', grossSales: 231000.0, returnsAmount: 3100.0, netSales: 219000.0, ordersCount: 390, aov: 561.53, marginPercent: 41.0, cashierCount: 6, status: 'On Target' },
];

export const CATEGORY_PRODUCT_REPORT_DATA: ProductCategoryReportRow[] = [
  { category: 'Ethnic Wear & Apparel', skusCount: 145, unitsSold: 3512, grossSales: 785000.0, discounts: 43000.0, netSales: 742000.0, sharePercent: 43.8 },
  { category: 'Electronics & Gadgets', skusCount: 88, unitsSold: 1840, grossSales: 514000.0, discounts: 25000.0, netSales: 489000.0, sharePercent: 28.9 },
  { category: 'Home & Kitchenware Accessories', skusCount: 112, unitsSold: 1920, grossSales: 328000.0, discounts: 18000.0, netSales: 310000.0, sharePercent: 18.3 },
  { category: 'FMCG & Gourmet Spices', skusCount: 65, unitsSold: 885, grossSales: 184000.0, discounts: 7500.0, netSales: 176500.0, sharePercent: 10.4 },
];
