import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FREE_LIMITS } from '../hooks/usePlan';

const FEATURES = [
  { label: `${FREE_LIMITS.children} child profile`, free: true, premium: 'Unlimited children' },
  { label: `${FREE_LIMITS.itemsPerChild} items per wishlist`, free: true, premium: 'Unlimited items' },
  { label: 'AI item identification', free: true, premium: true },
  { label: 'Live price lookup', free: true, premium: true },
  { label: 'Shareable links', free: true, premium: true },
  { label: 'Price drop alerts', free: false, premium: true },
];

export default function UpgradeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.emoji}>⭐</Text>
      <Text style={styles.title}>Upgrade to Premium</Text>
      <Text style={styles.subtitle}>Everything you need for the whole family</Text>

      {/* Price */}
      <View style={styles.priceCard}>
        <Text style={styles.price}>$2.99</Text>
        <Text style={styles.priceUnit}>/month</Text>
        <Text style={styles.priceOr}>or</Text>
        <Text style={styles.priceYear}>$14.99 / year</Text>
        <Text style={styles.priceSave}>Save 58%</Text>
      </View>

      {/* Feature comparison */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCol, { flex: 2 }]} />
          <Text style={[styles.tableCol, styles.tableHeaderText]}>Free</Text>
          <Text style={[styles.tableCol, styles.tableHeaderText, { color: '#E8335A' }]}>Premium</Text>
        </View>
        {FEATURES.map((f, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 0 && { backgroundColor: '#fafafa' }]}>
            <Text style={[styles.tableCol, { flex: 2, fontSize: 14, color: '#333' }]}>{f.label}</Text>
            <Text style={[styles.tableCol, styles.tableCheck]}>
              {f.free === true ? '✓' : '—'}
            </Text>
            <Text style={[styles.tableCol, styles.tableCheck, { color: '#E8335A' }]}>
              {f.premium === true ? '✓' : typeof f.premium === 'string' ? f.premium : '—'}
            </Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.upgradeButton} onPress={() => {}}>
        <Text style={styles.upgradeButtonText}>Start Free Trial — 7 Days Free</Text>
      </TouchableOpacity>
      <Text style={styles.legal}>
        Cancel anytime. Payment will be charged to your App Store account.
        Subscription automatically renews unless cancelled.
      </Text>

      <TouchableOpacity style={styles.restoreButton} onPress={() => {}}>
        <Text style={styles.restoreButtonText}>Restore Purchase</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60, alignItems: 'center' },
  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  closeBtnText: { fontSize: 20, color: '#aaa' },
  emoji: { fontSize: 52, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#111', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 24 },

  priceCard: { flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap', justifyContent: 'center', backgroundColor: '#fff5f7', borderRadius: 16, padding: 20, marginBottom: 28, width: '100%' },
  price: { fontSize: 36, fontWeight: '800', color: '#E8335A' },
  priceUnit: { fontSize: 16, color: '#888' },
  priceOr: { fontSize: 14, color: '#aaa', marginHorizontal: 8 },
  priceYear: { fontSize: 18, fontWeight: '700', color: '#333' },
  priceSave: { fontSize: 12, fontWeight: '700', color: '#2e7d32', backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 4 },

  table: { width: '100%', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#eee', marginBottom: 24 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', paddingVertical: 10, paddingHorizontal: 12 },
  tableHeaderText: { fontSize: 13, fontWeight: '700', color: '#555', textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12 },
  tableCol: { flex: 1, textAlign: 'center' },
  tableCheck: { fontSize: 15, fontWeight: '700', color: '#555', textAlign: 'center' },

  upgradeButton: { backgroundColor: '#E8335A', borderRadius: 14, padding: 18, alignItems: 'center', width: '100%', marginBottom: 12 },
  upgradeButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  legal: { fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 16, marginBottom: 16 },
  restoreButton: { padding: 10 },
  restoreButtonText: { color: '#aaa', fontSize: 13 },
});
