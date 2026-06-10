import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  Image, Share, ScrollView, Modal
} from 'react-native';
import { getWishlistItems, deleteWishlistItem, moveWishlistItem } from '../services/wishlist';
import { getChildren } from '../services/childrenService';
import { createShareLink } from '../services/shareService';
import { useAuth } from '../context/AuthContext';

export default function WishlistScreen({ navigation }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [filter, setFilter] = useState('All');
  const [sharing, setSharing] = useState(false);
  const [menuItem, setMenuItem] = useState(null); // item currently showing menu

  useFocusEffect(useCallback(() => { loadChildren(); }, []));
  useEffect(() => { loadItems(); }, [selectedChild]);

  async function loadChildren() {
    const data = await getChildren(user.uid);
    setChildren(data);
    setSelectedChild(data.length > 0 ? data[0] : null);
  }

  async function loadItems() {
    const data = await getWishlistItems(user.uid, selectedChild?.id || null);
    setItems(data);
  }

  async function handleDelete(item) {
    Alert.alert(
      'Remove item?',
      `Remove "${item.name}" from the wishlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => {
          await deleteWishlistItem(item.id);
          setMenuItem(null);
          loadItems();
        }},
      ]
    );
  }

  async function handleMove(item, targetChild) {
    await moveWishlistItem(item.id, targetChild);
    setMenuItem(null);
    loadItems();
  }

  async function handleShare() {
    setSharing(true);
    try {
      const url = await createShareLink(user.uid, filter, selectedChild);
      const childLabel = selectedChild ? `${selectedChild.name}'s` : 'Our';
      const occasionLabel = filter === 'All' ? 'Wish List' : `${filter} Wish List`;
      await Share.share({ message: `Check out ${childLabel} ${occasionLabel}! 🎁\n${url}`, url });
    } catch (e) {
      Alert.alert('Could not create share link', e.message);
    } finally {
      setSharing(false);
    }
  }

  const filtered = filter === 'All' ? items : items.filter((i) => i.occasion === filter);
  const otherChildren = children.filter((c) => c.id !== selectedChild?.id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎁 Wishlist</Text>
      </View>

      {/* Child selector */}
      {children.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
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
        </ScrollView>
      )}

      {/* Occasion filter */}
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
          <Text style={styles.emptyText}>
            {children.length === 0 ? 'Add a child first!' : 'No items yet!'}
          </Text>
          <Text style={styles.emptySubtext}>
            {children.length === 0
              ? 'Go to the Children tab to add your kids.'
              : 'Tap the camera tab to snap your first wish.'}
          </Text>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare} disabled={sharing}>
            <Text style={styles.shareButtonText}>
              {sharing ? 'Creating link...' : `🔗  Share ${selectedChild ? selectedChild.name + "'s " : ''}${filter === 'All' ? 'List' : filter + ' List'}`}
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
                <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuItem(item)}>
                  <Text style={styles.menuBtnText}>•••</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}

      {/* Action sheet */}
      <Modal visible={!!menuItem} transparent animationType="slide" onRequestClose={() => setMenuItem(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuItem(null)}>
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHandle} />
            <Text style={styles.actionSheetTitle} numberOfLines={1}>{menuItem?.name}</Text>

            {otherChildren.length > 0 && (
              <>
                <Text style={styles.actionSheetSection}>Move to</Text>
                {otherChildren.map((child) => (
                  <TouchableOpacity
                    key={child.id}
                    style={styles.actionItem}
                    onPress={() => handleMove(menuItem, child)}
                  >
                    <View style={[styles.actionAvatar, { backgroundColor: child.color }]}>
                      <Text style={styles.actionAvatarText}>{child.name[0].toUpperCase()}</Text>
                    </View>
                    <Text style={styles.actionItemText}>{child.name}'s list</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            <TouchableOpacity style={styles.actionItemDestructive} onPress={() => handleDelete(menuItem)}>
              <Text style={styles.actionItemDestructiveText}>🗑  Remove item</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCancel} onPress={() => setMenuItem(null)}>
              <Text style={styles.actionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  logoutText: { color: '#E8335A', fontSize: 14 },
  childScroll: { marginBottom: 10 },
  childChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  chipAvatar: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  chipAvatarText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  chipName: { fontSize: 14, fontWeight: '600', color: '#333' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#E8335A' },
  filterActive: { backgroundColor: '#E8335A' },
  filterText: { color: '#E8335A', fontWeight: '600', fontSize: 13 },
  shareButton: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E8335A', borderRadius: 12, padding: 12, alignItems: 'center' },
  shareButtonText: { color: '#E8335A', fontWeight: '700', fontSize: 15 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 20, fontWeight: '700', color: '#333' },
  emptySubtext: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  cardImage: { width: 72, height: 72, resizeMode: 'cover' },
  cardBody: { flex: 1, padding: 12 },
  cardName: { fontSize: 16, fontWeight: '700' },
  cardCategory: { fontSize: 13, color: '#888', marginTop: 2, textTransform: 'capitalize' },
  cardPrice: { fontSize: 13, color: '#2e7d32', fontWeight: '700', marginTop: 2 },
  menuBtn: { padding: 16 },
  menuBtnText: { color: '#aaa', fontSize: 16, letterSpacing: 1 },

  // Action sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  actionSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  actionSheetHandle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  actionSheetTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 16, textAlign: 'center' },
  actionSheetSection: { fontSize: 12, fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#f9f9f9', borderRadius: 12, marginBottom: 8 },
  actionAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  actionAvatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  actionItemText: { fontSize: 16, fontWeight: '600', color: '#333' },
  actionItemDestructive: { padding: 14, backgroundColor: '#fff0f0', borderRadius: 12, alignItems: 'center', marginTop: 4, marginBottom: 8 },
  actionItemDestructiveText: { fontSize: 16, fontWeight: '600', color: '#E8335A' },
  actionCancel: { padding: 14, alignItems: 'center' },
  actionCancelText: { fontSize: 16, color: '#888', fontWeight: '600' },
});
