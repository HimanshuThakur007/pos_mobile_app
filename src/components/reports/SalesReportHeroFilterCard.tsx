import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { UnifiedTopFilterBar } from '../common/UnifiedTopFilterBar';

interface SalesReportHeroFilterCardProps {
  isLiveApi?: boolean;
  activeBranchCode: string;
  onToggleFilters: () => void;
  onRefreshData: () => void;
  onExportCSV: () => void;
  fromDate: string;
  toDate: string;
}

export const SalesReportHeroFilterCard: React.FC<SalesReportHeroFilterCardProps> = ({
  activeBranchCode,
  onToggleFilters,
  onRefreshData,
  onExportCSV,
  fromDate,
  toDate,
}) => {
  return (
    <View style={styles.container}>
      {/* Unified Top Filter Action Bar */}
      <UnifiedTopFilterBar
        fromDate={fromDate}
        toDate={toDate}
        extraPills={[{ icon: Building2, label: `Store #${activeBranchCode}` }]}
        onToggleFilters={onToggleFilters}
        onRefreshData={onRefreshData}
        onExportCSV={onExportCSV}
        showExport={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
});
