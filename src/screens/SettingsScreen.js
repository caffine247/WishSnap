import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RETAILERS = ['Amazon', 'Walmart', 'Target'];

export default function SettingsScreen() {
  const [selectedRetailer, setSelectedRetailer] = useState('Amazon');

  useEffect(() => {
    AsyncStorage.getItem('preferredRetailer').then((val) => {
      if (val) setSelectedRetailer(val);
    });
  }, []);

  async function selectRetailer(retailer) {
    setSelectedRetailer(retailer);
    await AsyncStorage.setItem('preferredRetailer', retailer);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionLabel}>Preferred Retailer for Price Lookup</Text>
      {RETAILERS.map((r) => (
        <TouchableOpacity
          key={r}
          style={[styles.option, selectedRetailer === r && styles.optionActive]}
          onPress={() => selectRetailer(r)}
        >
          <Text style={[styles.optionText, selectedRetailer === r && styles.optionTextActive]}>
            {r}
          </Text>
          {selectedRetailer === r && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>
      ))}
      <Text style={styles.hint}>
        When you snap a photo, WishSnap will look up the current price from this retailer.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 32, marginTop: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderWidth: 1.5, borderColor: '#eee', borderRadius: 12, marginBottom: 10 },
  optionActive: { borderColor: '#E8335A', backgroundColor: '#fff5f7' },
  optionText: { fontSize: 16, color: '#333' },
  optionTextActive: { color: '#E8335A', fontWeight: '700' },
  check: { color: '#E8335A', fontSize: 18, fontWeight: '700' },
  hint: { marginTop: 20, fontSize: 13, color: '#aaa', lineHeight: 20 },
});
