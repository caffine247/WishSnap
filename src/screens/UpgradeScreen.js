import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FREE_LIMITS } from '../hooks/usePlan';

const FEATURES = [
  { label: 'Children', free: `${FREE_LIMITS.children}`, premium: 'Unlimited', family: 'Unlimited' },
  { label: 'Items per list', free: `${FREE_LIMITS.itemsPerChild}`, premium: 'Unlimited', family: 'Unlimited' },
  { label: 'AI item ID', free: true, premium: true, family: true },
  { label: 'Live prices', free: true, premium: true, family: true },
  { label: 'Shareable links', free: true, premium: true, family: true },
  { label: 'Custom lists', free: false, premium: true, family: true },
  { label: 'Price drop alerts', free: false, premium: true, family: true },
  { label: 'Family sharing', free: false, premium: false, family: true },
  { label: 'Up to 5 members', free: false, premium: false, family: true },
];

export default function UpgradeScreen({ navigation }) {
  const [tab, setTab] = useState('family'); // 'premium' | 'family'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.emoji}>⭐</Text>
      <Text style={styles.title}>Go Premium</Text>
      <Text style={styles.subtitle}>More kids, more lists, more magic</Text>

      {/* Plan toggle */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleOption, tab === 'premium' && styles.toggleActive]}
          onPress={() => setTab('premium')}
        >
          <Text style={[styles.toggleText, tab === 'premium' && styles.toggleActiveText]}>Premium</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleOption, tab === 'family' && styles.toggleActive]}
          onPress={() => setTab('family')}
        >
          <Text style={[styles.toggleText, tab === 'family' && styles.toggleActiveText]}>Family</Text>
          <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>Popular</Text></View>
        </TouchableOpacity>
      </View>

      {/* Price card */}
      {tab === 'premium' ? (
        <View style={styles.priceCard}>
          <Text style={styles.price}>$2.99</Text>
          <Text style={styles.priceUnit}>/month</Text>
          <Text style={styles.priceOr}>or</Text>
          <Text style={styles.priceYear}>$14.99 / year</Text>
          <Text style={styles.priceSave}>Save 58%</Text>
        </View>
      ) : (
        <View style={[styles.priceCard, { backgroundColor: '#fff5f7' }]}>
          <Text style={styles.price}>$4.99</Text>
          <Text style={styles.priceUnit}>/month</Text>
          <Text style={styles.priceOr}>or</Text>
          <Text style={styles.priceYear}>$24.99 / year</Text>
          <Text style={styles.priceSave}>Save 58%</Text>
        </View>
      )}

      {/* Feature comparison table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCol, { flex: 2 }]} />
          <Text style={[styles.tableCol, styles.tableHeaderText]}>Free</Text>
          <Text style={[styles.tableCol, styles.tableHeaderText, { color: '#E8335A' }]}>
            {tab === 'premium' ? 'Premium' : 'Family'}
          </Text>
        </View>
        {FEATURES.map((f, i) => {
          const planVal = tab === 'premium' ? f.premium : f.family;
          return (
            <View key={i} style={[styles.tableRow, i % 2 === 0 && { backgroundColor: '#fafafa' }]}>
              <Text style={[styles.tableCol, { flex: 2, fontSize: 14, color: '#333' }]}>{f.label}</Text>
              <Text style={[styles.tableCol, styles.tableCheck]}>
                {f.free === true ? '✓' : f.free === false ? '—' : f.free}
              </Text>
              <Text style={[styles.tableCol, styles.tableCheck, { color: '#E8335A' }]}>
                {planVal === true ? '✓' : planVal === false ? '—' : planVal}
              </Text>
            </View>
          );
        })}
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.upgradeButton} onPress={() => {}}>
        <Text style={styles.upgradeButtonText}>
          Start Free Trial — 7 Days Free
        </Text>
      </TouchableOpacity>
      <Text style={styles.legal}>
        Cancel anytime. Payment charged to your App Store account.
        Renews automatically unless cancelled.
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
  subtitle: { fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 20 },

  toggle: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 14, padding: 4, marginBottom: 20, width: '100%' },
  toggleOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 11, gap: 6 },
  toggleActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  toggleText: { fontSize: 15, fontWeight: '600', color: '#888' },
  toggleActiveText: { color: '#111', fontWeight: '700' },
  popularBadge: { backgroundColor: '#E8335A', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  popularBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  priceCard: { flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap', justifyContent: 'center', backgroundColor: '#f9f9f9', borderRadius: 16, padding: 20, marginBottom: 24, width: '100%' },
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
