import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { identifyItemFromPhoto } from '../services/openai';
import { addWishlistItem } from '../services/wishlist';
import { useAuth } from '../context/AuthContext';

const RETAILERS = [
  { name: 'Amazon', url: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}` },
  { name: 'Walmart', url: (q) => `https://www.walmart.com/search?q=${encodeURIComponent(q)}` },
  { name: 'Target', url: (q) => `https://www.target.com/s?searchTerm=${encodeURIComponent(q)}` },
];

export default function CameraScreen({ navigation }) {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [occasion, setOccasion] = useState('Christmas');

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed to access photos');

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });

    if (!picked.canceled) {
      setImage(picked.assets[0].uri);
      analyzeImage(picked.assets[0].base64);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed to use camera');

    const picked = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
    });

    if (!picked.canceled) {
      setImage(picked.assets[0].uri);
      analyzeImage(picked.assets[0].base64);
    }
  }

  async function analyzeImage(base64) {
    setLoading(true);
    setResult(null);
    try {
      const identified = await identifyItemFromPhoto(base64);
      setResult(identified);
    } catch (e) {
      console.log('Vision error:', e.message);
      Alert.alert('Could not identify item', e.message || 'Try a clearer photo with the item more visible.');
    } finally {
      setLoading(false);
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
    });
    Alert.alert('Added!', `${result.name} added to your ${occasion} list.`);
    setImage(null);
    setResult(null);
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

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.itemName}>{result.name}</Text>
          <Text style={styles.itemCategory}>{result.category}</Text>

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
  resultCard: { backgroundColor: '#f9f9f9', borderRadius: 16, padding: 20 },
  itemName: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  itemCategory: { fontSize: 14, color: '#888', marginBottom: 16, textTransform: 'capitalize' },
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
