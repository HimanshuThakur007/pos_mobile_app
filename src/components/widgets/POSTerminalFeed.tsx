import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { POSTransaction } from '../../types/posSales';

interface POSTerminalFeedProps {
  transactions: POSTransaction[];
}

export const POSTerminalFeed: React.FC<POSTerminalFeedProps> = ({ transactions }) => {
  return (
    <Card>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live POS Terminal Feed</Text>
          <Text style={styles.subtitle}>Real-time sales register receipts</Text>
        </View>
        <Badge label="LIVE TICKER" variant="success" showDot />
      </View>

      {transactions.map((tx) => (
        <View key={tx.id} style={styles.txRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{tx.cashier.charAt(0)}</Text>
          </View>

          <View style={styles.leftCol}>
            <Text style={styles.txId}>{tx.cashier}</Text>
            <Text style={styles.txSub}>{tx.storeName} • {tx.paymentMethod}</Text>
          </View>

          <View style={styles.rightCol}>
            <Text style={styles.amount}>₹{tx.amount.toFixed(2)}</Text>
            <Text style={styles.time}>{tx.timestamp}</Text>
          </View>
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#2563eb',
    fontWeight: '800',
    fontSize: 13,
  },
  leftCol: {
    flex: 1,
  },
  txId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  txSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16a34a',
  },
  time: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
});
