import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { apiRequest } from '../api/apiClient';

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  activeUsers: number;
  runRate: number;
}

export const DashboardScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 148520,
    totalOrders: 1240,
    activeUsers: 84,
    runRate: 94.2,
  });
  const [recentTransactions, setRecentTransactions] = useState([
    { id: 'TX-9021', store: 'Main Branch Store', amount: '$420.50', status: 'COMPLETED', time: '10 mins ago' },
    { id: 'TX-9022', store: 'Downtown Kiosk', amount: '$85.00', status: 'COMPLETED', time: '25 mins ago' },
    { id: 'TX-9023', store: 'Northside Hub', amount: '$1,250.00', status: 'PENDING', time: '1 hour ago' },
    { id: 'TX-9024', store: 'Express Outlet', amount: '$64.20', status: 'COMPLETED', time: '2 hours ago' },
  ]);

  const loadDashboardData = async () => {
    try {
      const res = await apiRequest<any>('/dashboard/overview');
      if (res) {
        setStats({
          totalSales: res.totalSales || stats.totalSales,
          totalOrders: res.totalOrders || stats.totalOrders,
          activeUsers: res.activeUsers || stats.activeUsers,
          runRate: res.runRate || stats.runRate,
        });
      }
    } catch (err) {
      // Retain mock data if backend call fails
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <View style={styles.container}>
      <Header title="Dashboard" subtitle="Overview & Key Metrics" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Sales"
            value={`$${stats.totalSales.toLocaleString()}`}
            change="14.8%"
            isPositive={true}
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders.toLocaleString()}
            change="8.2%"
            isPositive={true}
          />
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            title="Active Users"
            value={stats.activeUsers.toString()}
            change="3.1%"
            isPositive={true}
          />
          <StatCard
            title="Run Rate %"
            value={`${stats.runRate}%`}
            change="1.4%"
            isPositive={false}
          />
        </View>

        <Card style={styles.actionCard}>
          <Text style={styles.cardHeader}>System Performance Matrix</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>API Response Speed</Text>
            <Badge label="24ms (Fast)" variant="success" />
          </View>
          <View style={styles.divider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>POS Terminal Sync</Text>
            <Badge label="100% Online" variant="success" />
          </View>
          <View style={styles.divider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Database Engine</Text>
            <Badge label="Prisma / PostgreSQL" variant="info" />
          </View>
        </Card>

        <Card>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.cardHeader}>Live POS Feed</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={styles.refreshText}>↻ Refresh</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.map((item) => (
            <View key={item.id} style={styles.txRow}>
              <View style={styles.txInfo}>
                <Text style={styles.txId}>{item.id}</Text>
                <Text style={styles.txStore}>{item.store} • {item.time}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>{item.amount}</Text>
                <Badge
                  label={item.status}
                  variant={item.status === 'COMPLETED' ? 'success' : 'warning'}
                />
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionCard: {
    marginTop: 4,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  txInfo: {
    flex: 1,
  },
  txId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  txStore: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
});
