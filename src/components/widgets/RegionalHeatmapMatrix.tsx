import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { Store } from '../../types/posSales';

interface RegionalHeatmapMatrixProps {
  stores: Store[];
}

export const RegionalHeatmapMatrix: React.FC<RegionalHeatmapMatrixProps> = ({ stores }) => {
  return (
    <Card>
      <Text style={styles.title}>Regional Store Audit Matrix</Text>
      <Text style={styles.subtitle}>SPSF, GMROI, Footfall & Attainment Telemetry</Text>

      {stores.map((store) => {
        const isExceeding = store.status === 'Exceeding';
        const isOnTarget = store.status === 'On Target';
        const attainment = ((store.currentRevenue / store.targetRevenue) * 100).toFixed(0);

        return (
          <View key={store.id} style={styles.storeCard}>
            <View style={styles.storeHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.storeName} numberOfLines={1} ellipsizeMode="tail">
                  {store.name}
                </Text>
                <Text style={styles.storeLoc} numberOfLines={1} ellipsizeMode="tail">
                  {store.city} • {store.zone}
                </Text>
              </View>
              <Badge
                label={`${attainment}% (${store.status})`}
                variant={isExceeding ? 'success' : isOnTarget ? 'info' : 'danger'}
                showDot
              />
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricCell}>
                <Text style={styles.cellLabel}>Revenue</Text>
                <Text style={styles.cellVal} numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit>
                  ₹{store.currentRevenue.toLocaleString()}
                </Text>
              </View>

              <View style={styles.metricCell}>
                <Text style={styles.cellLabel}>Target</Text>
                <Text style={styles.cellVal} numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit>
                  ₹{store.targetRevenue.toLocaleString()}
                </Text>
              </View>

              <View style={styles.metricCell}>
                <Text style={styles.cellLabel}>GMROI</Text>
                <Text style={styles.cellVal} numberOfLines={1} ellipsizeMode="tail">
                  {store.gmroi}x
                </Text>
              </View>

              <View style={styles.metricCell}>
                <Text style={styles.cellLabel}>SPSF</Text>
                <Text style={styles.cellVal} numberOfLines={1} ellipsizeMode="tail">
                  ₹{store.spsf.toFixed(0)}/sqft
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 12,
    marginTop: 2,
  },
  storeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  storeName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  storeLoc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metricCell: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cellLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  cellVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
});
