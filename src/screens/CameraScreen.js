import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Alert,
  ActivityIndicator, ScrollView, TextInput
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { identifyItemFromPhoto } from '../services/openai';
import { fetchAllPrices } from '../services/priceService';
import { addWishlistItem } from '../services/wishlist';
import { getChildren } from '../services/childrenService';
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

const PRICE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function compressImageForAI(uri) {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 512 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return manipulated.base64;
}

async function getCachedPrices(searchQuery) {
  try {
    const raw = await AsyncStorage.getItem(`prices:${searchQuery}`);
    if (!raw) return null;
    const { prices, cachedAt } = JSON.parse(raw);
    if (Date.now() - cachedAt > PRICE_CACHE_TTL_MS) return null;
    return prices;
  } catch {
    return null;
  }
}

async function cachePrices(searchQuery, prices) {
  try {
    await AsyncStorage.setItem(`prices:${searchQuery}`, JSON.stringify({ prices, cachedAt: Date.now() }));
  } catch {}
}

export default function CameraScreen({ navigation }) {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [identified, setIdentified] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [correctedName, setCorrectedName] = useState('');
  const [result, setResult] = useState(null);
  const [prices, setPrices] = useState({});
  const [priceCached, setPriceCached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [occasion, setOccasion] = useState('Christmas');
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    getChildren(user.uid).then((data) => {
      setChildren(data);
      if (data.length > 0) setSelectedChild(data[0]);
    });
  }, []);

  function reset() {
    setImage(null);
    setIdentified(null);
    setConfirmed(false);
    setCorrecting(false);
    setCorrectedName('');
    setResult(null);
    setPrices({});
    setPriceCached(false);
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed to access photos');
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!picked.canceled) {
      const uri = picked.assets[0].uri;
      setImage(uri);
      const base64 = await compressImageForAI(uri);
      analyzeImage(base64);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed to use camera');
    const picked = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!picked.canceled) {
      const uri = picked.assets[0].uri;
      setImage(uri);
      const base64 = await compressImageForAI(uri);
      analyzeImage(base64);
    }
  }

  async function analyzeImage(base64) {
    setLoading(true);
    setIdentified(null);
    setConfirmed(false);
    setResult(null);
    setPrices({});
    setPriceCached(false);
    try {
      const data = await identifyItemFromPhoto(base64);
      setIdentified(data);
      setCorrectedName(data.name);
    } catch (e) {
      Alert.alert('Could not identify item', e.message || 'Try a clearer photo with the item more visible.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmItem(finalResult) {
    setResult(finalResult);
    setConfirmed(true);

    // Check cache first, fall back to API
    const cached = await getCachedPrices(finalResult.searchQuery);
    if (cached) {
      setPrices(cached);
      setPriceCached(true);
    } else {
      lookupPrice(finalResult.searchQuery);
    }
  }

  function handleConfirm() {
    confirmItem({ ...identified });
  }

  function handleCorrect() {
    setCorrecting(true);
  }

  function handleApplyCorrection() {
    if (!correctedName.trim()) return;
    setCorrecting(false);
    confirmItem({
      ...identified,
      name: correctedName.trim(),
      searchQuery: correctedName.trim(),
    });
  }

  async function lookupPrice(searchQuery) {
    setLoadingPrice(true);
    setPriceCached(false);
    try {
      const all = await fetchAllPrices(searchQuery);
      setPrices(all);
      await cachePrices(searchQuery, all);
    } catch (e) {
      console.log('Price fetch error:', e.message);
    } finally {
      setLoadingPrice(false);
    }
  }

  async function saveToWishlist() {
    if (!result) return;
    if (children.length > 0 && !selectedChild) return Alert.alert('Please select a child');
    const preferredRetailer = (await AsyncStorage.getItem('preferredRetailer')) || 'Amazon';
    const bestPrice = prices[preferredRetailer] || prices.Amazon || prices.Walmart || prices.Target || null;
    await addWishlistItem(user.uid, {
      name: result.name,
      category: result.category,
      searchQuery: result.searchQuery,
      occasion,
      imageUri: image,
      price: bestPrice?.price || null,
      currency: bestPrice?.currency || null,
      retailer: bestPrice?.retailer || null,
      priceDate: bestPrice?.priceDate || null,
      productUrl: bestPrice?.productUrl || null,
      childId: selectedChild?.id || null,
      childName: selectedChild?.name || null,
      childColor: selectedChild?.color || null,
    });
    const childLabel = selectedChild ? `${selectedChild.name}'s` : 'your';
    Alert.alert('Added!', `${result.name} added to ${childLabel} ${occasion} list.`);
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

      {/* Confidence confirmation step */}
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

      {/* Result card after confirmation */}
      {result && confirmed && (
        <View style={styles.resultCard}>
          <Text style={styles.itemName}>{result.name}</Text>
          <Text style={styles.itemCategory}>{result.category}</Text>

          {children.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>For which child?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {children.map((child) => (
                    <TouchableOpacity
                      key={child.id}
                      style={[styles.childChip, selectedChild?.id === child.id && { backgroundColor: child.color, borderColor: child.color }]}
                      onPress={() => setSelectedChild(child)}
                    >
                      <View style={[styles.chipAvatar, { backgroundColor: selectedChild?.id === child.id ? '#fff3' : child.color }]}>
                        <Text style={styles.chipAvatarText}>{child.name[0].toUpperCase()}</Text>
                      </View>
                      <Text style={[styles.chipName, selectedChild?.id === child.id && { color: '#fff' }]}>{child.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
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

          <View style={styles.pricesHeader}>
            <Text style={styles.sectionLabel}>Prices &amp; deals:</Text>
            {priceCached && <Text style={styles.cachedLabel}>cached</Text>}
            {!loadingPrice && !priceCached && (
              <TouchableOpacity onPress={() => lookupPrice(result.searchQuery)}>
                <Text style={styles.refreshLabel}>🔄 refresh</Text>
              </TouchableOpacity>
            )}
          </View>

          {RETAILERS.map((r) => {
            const p = prices[r.name];
            return (
              <TouchableOpacity
                key={r.name}
                style={styles.retailerButton}
                onPress={() => navigation.navigate('Deals', { retailer: r, query: result.searchQuery })}
              >
                <Text style={styles.retailerText}>{r.name}</Text>
                {loadingPrice ? (
                  <ActivityIndicator size="small" color="#aaa" />
                ) : p ? (
                  <Text style={styles.retailerPrice}>${p.price.toFixed(2)}</Text>
                ) : (
                  <Text style={styles.retailerNoPrice}>See deals →</Text>
                )}
              </TouchableOpacity>
            );
          })}
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
  pricesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 8 },
  cachedLabel: { fontSize: 11, color: '#aaa', fontStyle: 'italic', marginBottom: 4 },
  refreshLabel: { fontSize: 12, color: '#E8335A', fontWeight: '600', marginBottom: 4 },
  occasionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  occasionButton: { flex: 1, borderWidth: 2, borderColor: '#E8335A', borderRadius: 10, padding: 10, alignItems: 'center' },
  occasionActive: { backgroundColor: '#E8335A' },
  occasionText: { color: '#E8335A', fontWeight: '600' },
  saveButton: { backgroundColor: '#E8335A', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  retailerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 8 },
  retailerText: { fontSize: 15, color: '#333', fontWeight: '600' },
  retailerPrice: { fontSize: 16, fontWeight: '800', color: '#2e7d32' },
  retailerNoPrice: { fontSize: 13, color: '#aaa' },
  childChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  chipAvatar: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  chipAvatarText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  chipName: { fontSize: 14, fontWeight: '600', color: '#333' },
});
