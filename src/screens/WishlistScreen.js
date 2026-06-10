import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  Image, Share, ScrollView, Modal, Linking, Platform,
} from 'react-native';
import { getWishlistItems, deleteWishlistItem, moveWishlistItem, updateWishlistItem } from '../services/wishlist';
import { fetchAllPrices } from '../services/priceService';
import { getChildren } from '../services/childrenService';
import { createShareLink } from '../services/shareService';
import { useAuth } from '../context/AuthContext';

const RETAILERS = [
  { name: 'Amazon', color: '#FF9900', searchUrl: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}` },
  { name: 'Walmart', color: '#0071CE', searchUrl: (q) => `https://www.walmart.com/search?q=${encodeURIComponent(q)}` },
  { name: 'Target', color: '#CC0000', searchUrl: (q) => `https://www.target.com/s?searchTerm=${encodeURIComponent(q)}` },
];

export default function WishlistScreen({ navigation }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [filter, setFilter] = useState('All');
  const [sharing, setSharing] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [menuItem, setMenuItem] = useState(null);
  const [refreshingPrice, setRefreshingPrice] = useState(false);

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
          setDetailItem(null);
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

  async function handleRefreshPrice(item) {
    if (!item.searchQuery) return Alert.alert('No search query saved for this item');
    setRefreshingPrice(true);
    try {
      const prices = await fetchAllPrices(item.searchQuery);
      const best = prices.Amazon || prices.Walmart || prices.Target || null;
      if (!best) {
        Alert.alert('No price found', 'Could not find a price for this item right now.');
        return;
      }
      await updateWishlistItem(item.id, {
        price: best.price,
        currency: best.currency,
        retailer: best.retailer,
        priceDate: best.priceDate,
        productUrl: best.productUrl,
      });
      const updated = { ...item, ...best };
      setDetailItem(updated);
      setItems((prev) => prev.map((i) => i.id === item.id ? updated : i));
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setRefreshingPrice(false);
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
                <TouchableOpacity style={styles.cardMain} onPress={() => setDetailItem(item)} activeOpacity={0.75}>
                  {item.imageUri
                    ? <Image source={{ uri: item.imageUri }} style={styles.cardImage} />
                    : <View style={styles.cardImagePlaceholder}><Text style={{ fontSize: 28 }}>🎁</Text></View>
                  }
                  <View style={styles.cardBody}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardCategory}>{item.category} · {item.occasion === 'Christmas' ? '🎄' : '🎂'} {item.occasion}</Text>
                    {item.price != null ? (
                      <Text style={styles.cardPrice}>${parseFloat(item.price).toFixed(2)}{item.retailer ? ` · ${item.retailer}` : ''}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuItem(item)}>
                    <Text style={styles.menuBtnText}>•••</Text>
                  </TouchableOpacity>
                </TouchableOpacity>

                {item.searchQuery ? (
                  <View style={styles.retailerRow}>
                    {RETAILERS.map((r) => (
                      <TouchableOpacity
                        key={r.name}
                        style={[styles.retailerChip, { borderColor: r.color }]}
                        onPress={() => Linking.openURL(r.searchUrl(item.searchQuery))}
                      >
                        <Text style={[styles.retailerChipText, { color: r.color }]}>{r.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>
            )}
          />
        </>
      )}

      {/* Item detail modal */}
      <Modal visible={!!detailItem} transparent animationType="slide" onRequestClose={() => setDetailItem(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDetailItem(null)}>
          <View style={styles.detailSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.actionSheetHandle} />

            {detailItem?.imageUri && (
              <Image source={{ uri: detailItem.imageUri }} style={styles.detailImage} />
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.detailName}>{detailItem?.name}</Text>

              <View style={styles.detailBadgeRow}>
                {detailItem?.category ? (
                  <View style={styles.detailBadge}>
                    <Text style={styles.detailBadgeText}>{detailItem.category}</Text>
                  </View>
                ) : null}
                <View style={[styles.detailBadge, { backgroundColor: '#fff8e1' }]}>
                  <Text style={[styles.detailBadgeText, { color: '#e65100' }]}>
                    {detailItem?.occasion === 'Christmas' ? '🎄' : '🎂'} {detailItem?.occasion}
                  </Text>
                </View>
              </View>

              {detailItem?.childName ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Child</Text>
                  <Text style={styles.detailValue}>{detailItem.childName}</Text>
                </View>
              ) : null}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price</Text>
                {detailItem?.price != null ? (
                  <Text style={[styles.detailValue, { color: '#2e7d32', fontWeight: '800' }]}>
                    ${parseFloat(detailItem.price).toFixed(2)}
                    {detailItem.retailer ? `  ·  ${detailItem.retailer}` : ''}
                  </Text>
                ) : (
                  <Text style={[styles.detailValue, { color: '#aaa' }]}>Not available</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.refreshButton, refreshingPrice && { opacity: 0.6 }]}
                onPress={() => handleRefreshPrice(detailItem)}
                disabled={refreshingPrice}
              >
                <Text style={styles.refreshButtonText}>
                  {refreshingPrice ? '⏳  Looking up prices...' : '🔄  Refresh price'}
                </Text>
              </TouchableOpacity>

              {detailItem?.priceDate ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Price checked</Text>
                  <Text style={styles.detailValue}>
                    {new Date(detailItem.priceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
              ) : null}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Added</Text>
                <Text style={styles.detailValue}>
                  {detailItem?.createdAt?.seconds
                    ? new Date(detailItem.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </Text>
              </View>

              {detailItem?.productUrl ? (
                <TouchableOpacity style={styles.detailLinkButton} onPress={() => Linking.openURL(detailItem.productUrl)}>
                  <Text style={styles.detailLinkText}>View on {detailItem.retailer || 'retailer'} →</Text>
                </TouchableOpacity>
              ) : null}

              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={styles.detailManageButton}
                  onPress={() => { setDetailItem(null); setTimeout(() => setMenuItem(detailItem), 300); }}
                >
                  <Text style={styles.detailManageText}>Move / Remove</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailCloseButton} onPress={() => setDetailItem(null)}>
                  <Text style={styles.detailCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Action sheet */}
      <Modal visible={!!menuItem} transparent animationType="slide" onRequestClose={() => setMenuItem(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuItem(null)}>
          <View style={styles.actionSheet} onStartShouldSetResponder={() => true}>
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
  card: { backgroundColor: '#f9f9f9', borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  cardMain: { flexDirection: 'row', alignItems: 'center' },
  cardImage: { width: 72, height: 72, resizeMode: 'cover' },
  cardImagePlaceholder: { width: 72, height: 72, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1, padding: 12 },
  cardName: { fontSize: 16, fontWeight: '700' },
  cardCategory: { fontSize: 13, color: '#888', marginTop: 2, textTransform: 'capitalize' },
  cardPrice: { fontSize: 13, color: '#2e7d32', fontWeight: '700', marginTop: 2 },
  menuBtn: { padding: 16 },
  menuBtnText: { color: '#aaa', fontSize: 16, letterSpacing: 1 },
  retailerRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  retailerChip: { flex: 1, borderWidth: 1.5, borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  retailerChipText: { fontSize: 12, fontWeight: '700' },

  // Shared modal overlay
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  actionSheetHandle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },

  // Detail sheet
  detailSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '85%' },
  detailImage: { width: '100%', height: 220, borderRadius: 14, resizeMode: 'cover', marginBottom: 16 },
  detailName: { fontSize: 24, fontWeight: '800', color: '#111', marginBottom: 10 },
  detailBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  detailBadge: { backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  detailBadgeText: { fontSize: 13, fontWeight: '600', color: '#555', textTransform: 'capitalize' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  detailLabel: { fontSize: 15, color: '#888' },
  detailValue: { fontSize: 15, color: '#111', fontWeight: '500' },
  refreshButton: { marginTop: 10, backgroundColor: '#f0f0f0', borderRadius: 12, padding: 12, alignItems: 'center' },
  refreshButtonText: { color: '#555', fontWeight: '600', fontSize: 14 },
  detailLinkButton: { marginTop: 16, backgroundColor: '#f0f7ff', borderRadius: 12, padding: 14, alignItems: 'center' },
  detailLinkText: { color: '#1565c0', fontWeight: '700', fontSize: 15 },
  detailActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  detailManageButton: { flex: 1, borderWidth: 1.5, borderColor: '#E8335A', borderRadius: 12, padding: 14, alignItems: 'center' },
  detailManageText: { color: '#E8335A', fontWeight: '700', fontSize: 14 },
  detailCloseButton: { flex: 1, backgroundColor: '#E8335A', borderRadius: 12, padding: 14, alignItems: 'center' },
  detailCloseText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Action sheet
  actionSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
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
