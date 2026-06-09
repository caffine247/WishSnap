import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Alert,
  ActivityIndicator, ScrollView, TextInput
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { identifyItemFromPhoto } from '../services/openai';
import { fetchPrice } from '../services/priceService';
import { addWishlistItem } from '../services/wishlist';
import { useAuth } from '../context/AuthContext';

const RETAILERS = [
  { name: 'Amazon', url: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}` },
  { name: 'Walmart', url: (q) => `https://www.walmart.com/search?q=${encodeURIComponent(q)}` },
  { name: 'Target', url: (q) => `https://www.target.com/s?searchTerm=${encodeURIComponent(q)}` },
];

const CONFIDENCE_MESSAGES = {
  high: "I'm pretty confident this is",
  medium: "I think this might be",
  low: "I'm not totally sure, but this could be",
};

export default function CameraScreen({ navigation }) {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [identified, setIdentified] = useState(null);   // raw AI result
  const [confirmed, setConfirmed] = useState(false);     // user confirmed item
  const [correcting, setCorrecting] = useState(false);   // user is editing name
  const [correctedName, setCorrectedName] = useState('');
  const [result, setResult] = useState(null);            // confirmed result
  const [priceInfo, setPriceInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [occasion, setOccasion] = useState('Christmas');

  function reset() {
    setImage(null);
    setIdentified(null);
    setConfirmed(false);
    setCorrecting(false);
    setCorrectedName('');
    setResult(null);
    setPriceInfo(null);
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed to access photos');
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, base64: true });
    if (!picked.canceled) { setImage(picked.assets[0].uri); analyzeImage(picked.assets[0].base64); }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed to use camera');
    const picked = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!picked.canceled) { setImage(picked.assets[0].uri); analyzeImage(picked.assets[0].base64); }
  }

  async function analyzeImage(base64) {
    setLoading(true);
    setIdentified(null);
    setConfirmed(false);
    setResult(null);
    setPriceInfo(null);
    try {
      const data = await identifyItemFromPhoto(base64);
      setIdentified(data);
      setCorrectedName(data.name);
    } catch (e) {
      console.log('Vision error:', e.message);
      Alert.alert('Could not identify item', e.message || 'Try a clearer photo with the item more visible.');
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    const finalResult = { ...identified, name: identified.name };
    setResult(finalResult);
    setConfirmed(true);
    lookupPrice(finalResult.searchQuery);
  }

  function handleCorrect() {
    setCorrecting(true);
  }

  function handleApplyCorrection() {
    if (!correctedName.trim()) return;
    const finalResult = {
      ...identified,
      name: correctedName.trim(),
      searchQuery: correctedName.trim(),
    };
    setResult(finalResult);
    setConfirmed(true);
    setCorrecting(false);
    lookupPrice(finalResult.searchQuery);
  }

  async function lookupPrice(searchQuery) {
    setLoadingPrice(true);
    try {
      const retailer = (await AsyncStorage.getItem('preferredRetailer')) || 'Amazon';
      const price = await fetchPrice(searchQuery, retailer);
      setPriceInfo(price);
    } catch (e) {
      console.log('Price fetch error:', e.message);
    } finally {
      setLoadingPrice(false);
    }
  }

  async function saveToWishlist() {
    if (!result) return;
    await addWishlistItem(user.uid, {
      name: result.name,
      category: result.category,
      searchQuery: result.searchQuery,
      occasion,
      imageUri: image,
      price: priceInfo?.price || null,
      currency: priceInfo?.currency || null,
      retailer: priceInfo?.retailer || null,
      priceDate: priceInfo?.priceDate || null,
      productUrl: priceInfo?.productUrl || null,
    });
    Alert.alert('Added!', `${result.name} added to your ${occasion} list.`);
    reset();
    navigation.navigate('Wishlist');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Snap a Wish</Text>
      <Text style={styles.subtitle}>Take a photo of your child holding the item they want</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.snapButton} onPress={takePhoto}>
          <Text style={styles.snapButtonText}>📷  Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.snapButton, styles.secondaryButton]} onPress={pickImage}>
          <Text style={[styles.snapButtonText, { color: '#E8335A' }]}>🖼  Choose Photo</Text>
        </TouchableOpacity>
      </View>

      {image && <Image source={{ uri: image }} style={styles.preview} />}

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#E8335A" />
          <Text style={styles.loadingText}>Identifying item with AI...</Text>
        </View>
      )}

      {/* ── Confidence confirmation step ── */}
      {identified && !confirmed && !loading && (
        <View style={styles.confirmCard}>
          <Text style={styles.confidenceEmoji}>
            {identified.confidence === 'high' ? '🎯' : identified.confidence === 'medium' ? '🤔' : '❓'}
          </Text>
          <Text style={styles.confidenceMessage}>
            {CONFIDENCE_MESSAGES[identified.confidence] || "I think this is"}
          </Text>
          <Text style={styles.confidenceName}>{identified.name}</Text>
          <Text style={styles.confidenceCategory}>{identified.category}</Text>

          {correcting ? (
            <View style={styles.correctRow}>
              <TextInput
                style={styles.correctInput}
                value={correctedName}
                onChangeText={setCorrectedName}
                placeholder="Enter the correct item name"
                autoFocus
              />
              <TouchableOpacity style={styles.applyButton} onPress={handleApplyCorrection}>
                <Text style={styles.applyButtonText}>✓</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.confirmYes} onPress={handleConfirm}>
                <Text style={styles.confirmYesText}>✓  Yes, that's it!</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmNo} onPress={handleCorrect}>
                <Text style={styles.confirmNoText}>✏️  Correct it</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── Full result card after confirmation ── */}
      {result && confirmed && (
        <View style={styles.resultCard}>
          <Text style={styles.itemName}>{result.name}</Text>
          <Text style={styles.itemCategory}>{result.category}</Text>

          {loadingPrice && (
            <View style={styles.priceLoading}>
              <ActivityIndicator size="small" color="#E8335A" />
              <Text style={styles.priceLoadingText}>Looking up price...</Text>
            </View>
          )}

          {priceInfo && !loadingPrice && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceAmount}>${priceInfo.price.toFixed(2)}</Text>
              <Text style={styles.priceRetailer}>on {priceInfo.retailer}</Text>
            </View>
          )}

          {!priceInfo && !loadingPrice && (
            <Text style={styles.noPriceText}>Price unavailable — check retailers below</Text>
          )}

          <Text style={styles.sectionLabel}>Add to list:</Text>
          <View style={styles.occasionRow}>
            {['Christmas', 'Birthday'].map((o) => (
              <TouchableOpacity
                key={o}
                style={[styles.occasionButton, occasion === o && styles.occasionActive]}
                onPress={() => setOccasion(o)}
              >
                <Text style={[styles.occasionText, occasion === o && { color: '#fff' }]}>
                  {o === 'Christmas' ? '🎄' : '🎂'} {o}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveToWishlist}>
            <Text style={styles.saveButtonText}>Add to Wishlist</Text>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Search for deals:</Text>
          {RETAILERS.map((r) => (
            <TouchableOpacity
              key={r.name}
              style={styles.retailerButton}
              onPress={() => navigation.navigate('Deals', { retailer: r, query: result.searchQuery })}
            >
              <Text style={styles.retailerText}>Search {r.name} →</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  snapButton: { flex: 1, backgroundColor: '#E8335A', borderRadius: 12, padding: 16, alignItems: 'center' },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#E8335A' },
  snapButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  preview: { width: '100%', height: 260, borderRadius: 16, marginBottom: 20, resizeMode: 'cover' },
  loadingBox: { alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#888', fontSize: 14 },

  // Confidence card
  confirmCard: { backgroundColor: '#fff8f9', borderWidth: 1.5, borderColor: '#f5c0cc', borderRadius: 16, padding: 20, alignItems: 'center' },
  confidenceEmoji: { fontSize: 36, marginBottom: 8 },
  confidenceMessage: { fontSize: 14, color: '#888', marginBottom: 4 },
  confidenceName: { fontSize: 24, fontWeight: '800', color: '#222', textAlign: 'center', marginBottom: 4 },
  confidenceCategory: { fontSize: 13, color: '#aaa', textTransform: 'capitalize', marginBottom: 20 },
  confirmButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  confirmYes: { flex: 1, backgroundColor: '#E8335A', borderRadius: 12, padding: 14, alignItems: 'center' },
  confirmYesText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  confirmNo: { flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E8335A', borderRadius: 12, padding: 14, alignItems: 'center' },
  confirmNoText: { color: '#E8335A', fontWeight: '700', fontSize: 15 },
  correctRow: { flexDirection: 'row', gap: 8, width: '100%' },
  correctInput: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15 },
  applyButton: { backgroundColor: '#E8335A', borderRadius: 10, padding: 12, width: 44, alignItems: 'center' },
  applyButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // Result card
  resultCard: { backgroundColor: '#f9f9f9', borderRadius: 16, padding: 20 },
  itemName: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  itemCategory: { fontSize: 14, color: '#888', marginBottom: 12, textTransform: 'capitalize' },
  priceLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  priceLoadingText: { color: '#888', fontSize: 13 },
  priceBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 6, backgroundColor: '#e8f5e9', borderRadius: 10, padding: 10, marginBottom: 12 },
  priceAmount: { fontSize: 22, fontWeight: '800', color: '#2e7d32' },
  priceRetailer: { fontSize: 13, color: '#555' },
  noPriceText: { fontSize: 13, color: '#aaa', marginBottom: 12, fontStyle: 'italic' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 8 },
  occasionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  occasionButton: { flex: 1, borderWidth: 2, borderColor: '#E8335A', borderRadius: 10, padding: 10, alignItems: 'center' },
  occasionActive: { backgroundColor: '#E8335A' },
  occasionText: { color: '#E8335A', fontWeight: '600' },
  saveButton: { backgroundColor: '#E8335A', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  retailerButton: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 8 },
  retailerText: { fontSize: 15, color: '#333' },
});
