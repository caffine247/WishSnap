import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image, Share } from 'react-native';
import { getWishlistItems, deleteWishlistItem } from '../services/wishlist';
import { createShareLink } from '../services/shareService';
import { useAuth } from '../context/AuthContext';

export default function WishlistScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    const data = await getWishlistItems(user.uid);
    setItems(data);
  }

  async function handleDelete(id) {
    Alert.alert('Remove item?', 'This will remove it from the wishlist.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await deleteWishlistItem(id);
          loadItems();
        }
      },
    ]);
  }

  async function handleShare() {
    setSharing(true);
    try {
      const url = await createShareLink(user.uid, filter);
      const occasionLabel = filter === 'All' ? 'Wish List' : `${filter} Wish List`;
      await Share.share({
        message: `Check out our ${occasionLabel}! 🎁\n${url}`,
        url,
      });
    } catch (e) {
      Alert.alert('Could not create share link', e.message);
    } finally {
      setSharing(false);
    }
  }

  const filtered = filter === 'All' ? items : items.filter((i) => i.occasion === filter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎁 Wishlist</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {['All', 'Christmas', 'Birthday'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && { color: '#fff' }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No items yet!</Text>
          <Text style={styles.emptySubtext}>Tap the camera tab to snap your first wish.</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare} disabled={sharing}>
            <Text style={styles.shareButtonText}>
              {sharing ? 'Creating link...' : `🔗  Share ${filter === 'All' ? 'List' : filter + ' List'}`}
            </Text>
          </TouchableOpacity>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {item.imageUri && <Image source={{ uri: item.imageUri }} style={styles.cardImage} />}
                <View style={styles.cardBody}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardCategory}>{item.category} · {item.occasion === 'Christmas' ? '🎄' : '🎂'} {item.occasion}</Text>
                  {item.price ? (
                    <Text style={styles.cardPrice}>${item.price.toFixed(2)} · {item.retailer}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  logoutText: { color: '#E8335A', fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#E8335A' },
  filterActive: { backgroundColor: '#E8335A' },
  filterText: { color: '#E8335A', fontWeight: '600', fontSize: 13 },
  shareButton: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E8335A', borderRadius: 12, padding: 12, alignItems: 'center' },
  shareButtonText: { color: '#E8335A', fontWeight: '700', fontSize: 15 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 20, fontWeight: '700', color: '#333' },
  emptySubtext: { fontSize: 14, color: '#888', marginTop: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  cardImage: { width: 72, height: 72, resizeMode: 'cover' },
  cardBody: { flex: 1, padding: 12 },
  cardName: { fontSize: 16, fontWeight: '700' },
  cardCategory: { fontSize: 13, color: '#888', marginTop: 2, textTransform: 'capitalize' },
  deleteBtn: { padding: 16, color: '#ccc', fontSize: 18 },
  cardPrice: { fontSize: 13, color: '#2e7d32', fontWeight: '700', marginTop: 2 },
});
