import { fetchErpPosComparison, ErpPosComparisonItem, ErpPosSummary, BranchItem, fetchBranches } from './comparisonApi';
import { fetchBillComparison, BillComparisonItem } from './comparisonApi';
import { fetchBranchPaymentModes, BranchPaymentModeTotals, BranchPaymentModeItem } from './branchPaymentModeApi';
import { fetchBranchWiseSales, BranchWiseSalesItem, BranchWiseSalesTotals } from './branchSalesApi';

export interface StoreSyncHealth {
  branch_code: string;
  branch_name: string;
  matched_invoices: number;
  mismatched_invoices: number;
  missing_in_erp: number;
  missing_in_pos: number;
  total_invoices: number;
  sync_health_pct: number;
  variance_amount: number;
  net_sales: number;
  tender_collected: number;
  tender_variance: number;
  status: 'PERFECT' | 'WARNING' | 'CRITICAL';
}

export interface PipelineBillParity {
  desktop_count: number;
  central_count: number;
  erp_count: number;
  desktop_to_central_loss: number;
  central_to_erp_loss: number;
  parity_health_pct: number;
}

export interface TenderReconciliationSummary {
  cash_amount: number;
  card_amount: number;
  upi_amount: number;
  other_amount: number;
  total_tender_collected: number;
  net_sales_recorded: number;
  tender_difference: number; // tender_collected - net_sales
  is_balanced: boolean;
}

export interface ConsolidatedReconciliationData {
  syncHealthPct: number;
  totalAuditedSales: number;
  totalVarianceAmount: number;
  totalInvoicesAudited: number;
  matchedInvoicesCount: number;
  mismatchedInvoicesCount: number;
  missingInErpCount: number;
  missingInPosCount: number;
  discrepantStoresCount: number;
  totalStoresCount: number;
  pipeline: PipelineBillParity;
  tender: TenderReconciliationSummary;
  discrepantRecords: ErpPosComparisonItem[];
  storeHealthLeaderboard: StoreSyncHealth[];
  isLive: boolean;
  errorMessage?: string;
}

export interface ReconciliationQueryParams {
  from_date: string;
  to_date: string;
  branch_code?: string;
}

/**
 * Fetches and consolidates all reconciliation streams across ERP sync, Bill pipeline, and Tender balancing.
 */
export async function fetchConsolidatedReconciliation(
  params: ReconciliationQueryParams
): Promise<ConsolidatedReconciliationData> {
  try {
    // 1. Fetch ERP vs POS Comparison data
    const erpPosPromise = fetchErpPosComparison({
      from_date: params.from_date,
      to_date: params.to_date,
      branch_code: params.branch_code,
    });

    // 2. Fetch Store-Date Bill Parity
    const billCompPromise = fetchBillComparison({
      from: params.from_date,
      to: params.to_date,
    });

    // 3. Fetch Payment Modes
    const paymentPromise = fetchBranchPaymentModes({
      from_date: params.from_date,
      to_date: params.to_date,
      branch_code: params.branch_code,
    });

    // 4. Fetch Branch Sales Ranking & Totals
    const salesPromise = fetchBranchWiseSales({
      from_date: params.from_date,
      to_date: params.to_date,
      branch_code: params.branch_code,
    });

    const [erpPosRes, billCompRes, paymentRes, salesRes] = await Promise.all([
      erpPosPromise,
      billCompPromise,
      paymentPromise,
      salesPromise,
    ]);

    // Compute ERP vs POS metrics
    const erpItems = erpPosRes.data || [];
    let matchedCount = 0;
    let mismatchedCount = 0;
    let missingInErpCount = 0;
    let missingInPosCount = 0;
    let totalVarianceAmt = 0;

    const storeHealthMap = new Map<string, StoreSyncHealth>();

    erpItems.forEach((item) => {
      const bCode = String(item.branch_code || '5010');
      const bName = String(item.branch_name || item.store_name || `Store ${bCode}`);

      if (!storeHealthMap.has(bCode)) {
        storeHealthMap.set(bCode, {
          branch_code: bCode,
          branch_name: bName,
          matched_invoices: 0,
          mismatched_invoices: 0,
          missing_in_erp: 0,
          missing_in_pos: 0,
          total_invoices: 0,
          sync_health_pct: 100,
          variance_amount: 0,
          net_sales: 0,
          tender_collected: 0,
          tender_variance: 0,
          status: 'PERFECT',
        });
      }

      const store = storeHealthMap.get(bCode)!;
      store.total_invoices += 1;

      const cat = String(item.category || item.status || '').toUpperCase();
      const posAmt = Number(item.pos_amount ?? item.pos_total_amount ?? 0);
      const erpAmt = Number(item.erp_amount ?? item.erp_total_amount ?? 0);
      const diff = Math.abs(Number(item.amount_diff ?? (posAmt - erpAmt)));

      if (cat === 'MATCHED' || (!item.category && posAmt > 0 && posAmt === erpAmt)) {
        matchedCount += 1;
        store.matched_invoices += 1;
      } else if (cat === 'MISSING_IN_ERP' || (posAmt > 0 && erpAmt === 0)) {
        missingInErpCount += 1;
        store.missing_in_erp += 1;
        totalVarianceAmt += posAmt;
        store.variance_amount += posAmt;
      } else if (cat === 'MISSING_IN_POS' || (erpAmt > 0 && posAmt === 0)) {
        missingInPosCount += 1;
        store.missing_in_pos += 1;
        totalVarianceAmt += erpAmt;
        store.variance_amount += erpAmt;
      } else {
        mismatchedCount += 1;
        store.mismatched_invoices += 1;
        totalVarianceAmt += diff;
        store.variance_amount += diff;
      }
    });

    // If summary is available in API response, respect API numbers
    if (erpPosRes.summary) {
      if (erpPosRes.summary.matched !== undefined) matchedCount = erpPosRes.summary.matched;
      if (erpPosRes.summary.mismatched !== undefined) mismatchedCount = erpPosRes.summary.mismatched;
      if (erpPosRes.summary.missing_in_erp !== undefined) missingInErpCount = erpPosRes.summary.missing_in_erp;
      if (erpPosRes.summary.missing_in_pos !== undefined) missingInPosCount = erpPosRes.summary.missing_in_pos;
    }

    const totalInvoices = matchedCount + mismatchedCount + missingInErpCount + missingInPosCount;
    const overallSyncPct = totalInvoices > 0
      ? Math.round((matchedCount / totalInvoices) * 1000) / 10
      : 100;

    // Filter active discrepancies (mismatched or missing)
    const discrepantRecords = erpItems.filter((item) => {
      const cat = String(item.category || item.status || '').toUpperCase();
      return cat === 'MISMATCHED' || cat === 'MISSING_IN_ERP' || cat === 'MISSING_IN_POS';
    });

    // Process Bill Pipeline data
    const billItems = billCompRes.data || [];
    let totDesktop = 0;
    let totCentral = 0;
    let totErp = 0;

    billItems.forEach((b) => {
      totDesktop += Number(b.desktop_app_count || b.pos_count || 0);
      totCentral += Number(b.central_count || b.pos_bill_count || b.total_bills || 0);
      totErp += Number(b.erp_count || 0);
    });

    const pipeline: PipelineBillParity = {
      desktop_count: totDesktop,
      central_count: totCentral,
      erp_count: totErp,
      desktop_to_central_loss: Math.max(0, totDesktop - totCentral),
      central_to_erp_loss: Math.max(0, totCentral - totErp),
      parity_health_pct: totCentral > 0 && totErp > 0
        ? Math.round((Math.min(totCentral, totErp) / Math.max(totCentral, totErp)) * 1000) / 10
        : 100,
    };

    // Process Tender & Payment balancing
    const pTotals: BranchPaymentModeTotals = paymentRes.totals || {
      total_amount: 0,
      total_txns: 0,
      top_mode: 'CASH',
      top_mode_amount: 0,
      cash_amount: 0,
      card_amount: 0,
      upi_amount: 0,
      other_amount: 0,
    };

    const totalAuditedSales = salesRes.totals?.net_sales || pTotals.total_amount || 0;
    const totalTender = pTotals.total_amount;
    const tenderDiff = totalTender - totalAuditedSales;

    const tender: TenderReconciliationSummary = {
      cash_amount: pTotals.cash_amount || 0,
      card_amount: pTotals.card_amount || 0,
      upi_amount: pTotals.upi_amount || 0,
      other_amount: pTotals.other_amount || 0,
      total_tender_collected: totalTender,
      net_sales_recorded: totalAuditedSales,
      tender_difference: tenderDiff,
      is_balanced: Math.abs(tenderDiff) < 10,
    };

    // Merge sales into store leaderboard
    if (salesRes.data && Array.isArray(salesRes.data)) {
      salesRes.data.forEach((s) => {
        const bCode = s.branch_code;
        if (!storeHealthMap.has(bCode)) {
          storeHealthMap.set(bCode, {
            branch_code: bCode,
            branch_name: s.branch_name || `Store ${bCode}`,
            matched_invoices: s.bill_count || 0,
            mismatched_invoices: 0,
            missing_in_erp: 0,
            missing_in_pos: 0,
            total_invoices: s.bill_count || 0,
            sync_health_pct: 100,
            variance_amount: 0,
            net_sales: s.net_sales || 0,
            tender_collected: s.net_sales || 0,
            tender_variance: 0,
            status: 'PERFECT',
          });
        } else {
          const st = storeHealthMap.get(bCode)!;
          st.net_sales = s.net_sales || 0;
        }
      });
    }

    // Merge payment modes into store leaderboard
    if (paymentRes.data && Array.isArray(paymentRes.data)) {
      paymentRes.data.forEach((p) => {
        const bCode = p.branch_code;
        const st = storeHealthMap.get(bCode);
        if (st) {
          st.tender_collected += p.amount || 0;
        }
      });
    }

    // Compute health and status per store
    let discrepantStores = 0;
    storeHealthMap.forEach((st) => {
      st.tender_variance = (st.tender_collected || st.net_sales) - st.net_sales;
      if (st.total_invoices > 0) {
        st.sync_health_pct = Math.round((st.matched_invoices / st.total_invoices) * 1000) / 10;
      } else {
        st.sync_health_pct = 100;
      }

      if (st.missing_in_erp > 0 || st.missing_in_pos > 0 || st.variance_amount > 5000) {
        st.status = 'CRITICAL';
        discrepantStores += 1;
      } else if (st.mismatched_invoices > 0 || Math.abs(st.tender_variance) > 500) {
        st.status = 'WARNING';
        discrepantStores += 1;
      } else {
        st.status = 'PERFECT';
      }
    });

    const storeHealthLeaderboard = Array.from(storeHealthMap.values());
    // Sort so critical/warning stores appear first, then by net sales
    storeHealthLeaderboard.sort((a, b) => {
      const score = (s: StoreSyncHealth) => (s.status === 'CRITICAL' ? 3 : s.status === 'WARNING' ? 2 : 1);
      if (score(b) !== score(a)) return score(b) - score(a);
      return b.variance_amount - a.variance_amount || b.net_sales - a.net_sales;
    });

    return {
      syncHealthPct: overallSyncPct,
      totalAuditedSales,
      totalVarianceAmount: totalVarianceAmt,
      totalInvoicesAudited: totalInvoices,
      matchedInvoicesCount: matchedCount,
      mismatchedInvoicesCount: mismatchedCount,
      missingInErpCount: missingInErpCount,
      missingInPosCount: missingInPosCount,
      discrepantStoresCount: discrepantStores,
      totalStoresCount: storeHealthMap.size || 1,
      pipeline,
      tender,
      discrepantRecords,
      storeHealthLeaderboard,
      isLive: erpPosRes.isLive || salesRes.isLive,
    };
  } catch (err: any) {
    console.error('fetchConsolidatedReconciliation error:', err.message);
    return {
      syncHealthPct: 100,
      totalAuditedSales: 0,
      totalVarianceAmount: 0,
      totalInvoicesAudited: 0,
      matchedInvoicesCount: 0,
      mismatchedInvoicesCount: 0,
      missingInErpCount: 0,
      missingInPosCount: 0,
      discrepantStoresCount: 0,
      totalStoresCount: 0,
      pipeline: { desktop_count: 0, central_count: 0, erp_count: 0, desktop_to_central_loss: 0, central_to_erp_loss: 0, parity_health_pct: 100 },
      tender: { cash_amount: 0, card_amount: 0, upi_amount: 0, other_amount: 0, total_tender_collected: 0, net_sales_recorded: 0, tender_difference: 0, is_balanced: true },
      discrepantRecords: [],
      storeHealthLeaderboard: [],
      isLive: false,
      errorMessage: err.message || 'Failed to load reconciliation data',
    };
  }
}
