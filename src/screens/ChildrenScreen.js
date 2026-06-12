import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  TextInput, Alert, Modal, ScrollView, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getChildren, addChild, deleteChild } from '../services/childrenService';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../hooks/usePlan';

const COLORS = ['#E8335A', '#4A90E2', '#7B68EE', '#FF9500', '#34C759', '#FF6B6B', '#5AC8FA', '#FF2D55'];

function getAge(birthday) {
  if (!birthday) return null;
  const today = new Date();
  const dob = new Date(birthday);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function getDaysUntilBirthday(birthday) {
  if (!birthday) return null;
  const today = new Date();
  const dob = new Date(birthday);
  const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next - today) / (1000 * 60 * 60 * 24));
}

function formatBirthday(birthday) {
  if (!birthday) return null;
  return new Date(birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export default function ChildrenScreen({ navigation }) {
  const { user, effectiveUserId } = useAuth();
  const { canAddChild, FREE_LIMITS, isPaid } = usePlan();
  const [children, setChildren] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [birthday, setBirthday] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => { loadChildren(); }, []);

  async function loadChildren() {
    const data = await getChildren(effectiveUserId);
    setChildren(data);
  }

  async function handleAdd() {
    if (!name.trim()) return Alert.alert('Please enter a name');
    await addChild(effectiveUserId, {
      name: name.trim(),
      color: selectedColor,
      birthday: birthday ? birthday.toISOString() : null,
    });
    setName('');
    setSelectedColor(COLORS[0]);
    setBirthday(null);
    setShowDatePicker(false);
    setModalVisible(false);
    loadChildren();
  }

  async function handleDelete(child) {
    Alert.alert(`Remove ${child.name}?`, "Their wishlist items will remain but won't be linked to this profile.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await deleteChild(effectiveUserId, child.id); loadChildren(); } },
    ]);
  }

  function closeModal() {
    setName('');
    setSelectedColor(COLORS[0]);
    setBirthday(null);
    setShowDatePicker(false);
    setModalVisible(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👶 Children</Text>
      <Text style={styles.subtitle}>Add a profile for each child to organize their wishlists.</Text>

      {children.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No children added yet</Text>
          <Text style={styles.emptySubtext}>Tap the button below to add your first child.</Text>
        </View>
      ) : (
        <FlatList
          data={children}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24 }}
          renderItem={({ item }) => {
            const age = getAge(item.birthday);
            const daysUntil = getDaysUntilBirthday(item.birthday);
            const isSoon = daysUntil !== null && daysUntil <= 30;
            return (
              <View style={styles.childCard}>
                <View style={[styles.avatar, { backgroundColor: item.color }]}>
                  <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
                </View>
                <View style={styles.childInfo}>
                  <View style={styles.childNameRow}>
                    <Text style={styles.childName}>{item.name}</Text>
                    {isSoon && (
                      <View style={styles.birthdayBadge}>
                        <Text style={styles.birthdayBadgeText}>🎂 {daysUntil === 0 ? 'Today!' : `in ${daysUntil}d`}</Text>
                      </View>
                    )}
                  </View>
                  {item.birthday ? (
                    <Text style={styles.childMeta}>
                      {formatBirthday(item.birthday)}{age !== null ? ` · Age ${age}` : ''}
                    </Text>
                  ) : (
                    <Text style={styles.childMetaMuted}>No birthday set</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {!isPaid && (
        <TouchableOpacity style={styles.upgradeBanner} onPress={() => navigation.navigate('Upgrade')}>
          <Text style={styles.upgradeBannerText}>⭐  Free plan: {FREE_LIMITS.children} child · {FREE_LIMITS.itemsPerChild} items — Upgrade for unlimited</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          if (!canAddChild(children.length)) {
            navigation.navigate('Upgrade');
          } else {
            setModalVisible(true);
          }
        }}
      >
        <Text style={styles.addButtonText}>+ Add Child</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalCard} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Add a Child</Text>

            <TextInput
              style={styles.input}
              placeholder="Child's name"
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <Text style={styles.colorLabel}>Birthday:</Text>
            <TouchableOpacity style={styles.birthdayButton} onPress={() => setShowDatePicker(!showDatePicker)}>
              <Text style={styles.birthdayButtonText}>
                {birthday ? birthday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select birthday (optional)'}
              </Text>
              <Text style={styles.birthdayButtonIcon}>📅</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={birthday || new Date(2018, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(_, date) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (date) setBirthday(date);
                }}
              />
            )}

            {birthday && (
              <TouchableOpacity onPress={() => setBirthday(null)} style={styles.clearBirthday}>
                <Text style={styles.clearBirthdayText}>✕  Clear birthday</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.colorLabel, { marginTop: 16 }]}>Pick an avatar color:</Text>
            <View style={styles.colorRow}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotSelected]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>

            <View style={[styles.avatarPreview, { backgroundColor: selectedColor }]}>
              <Text style={styles.avatarPreviewText}>{name ? name[0].toUpperCase() : '?'}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
                <Text style={styles.saveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 24 },
  title: { fontSize: 28, fontWeight: '800', paddingHorizontal: 24, marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', paddingHorizontal: 24, marginBottom: 24 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#333' },
  emptySubtext: { fontSize: 14, color: '#888', marginTop: 8 },
  childCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 14, padding: 12, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  childInfo: { flex: 1 },
  childNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  childName: { fontSize: 17, fontWeight: '600' },
  childMeta: { fontSize: 13, color: '#888', marginTop: 2 },
  childMetaMuted: { fontSize: 13, color: '#ccc', marginTop: 2 },
  birthdayBadge: { backgroundColor: '#fff3e0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  birthdayBadgeText: { fontSize: 11, fontWeight: '700', color: '#e65100' },
  deleteBtn: { color: '#ccc', fontSize: 18, padding: 8 },
  upgradeBanner: { marginHorizontal: 24, marginBottom: 8, backgroundColor: '#fff5f7', borderRadius: 10, padding: 10 },
  upgradeBannerText: { fontSize: 12, color: '#E8335A', fontWeight: '600', textAlign: 'center' },
  addButton: { margin: 24, backgroundColor: '#E8335A', borderRadius: 14, padding: 16, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  input: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16 },
  colorLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 10 },
  birthdayButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 14, marginBottom: 8 },
  birthdayButtonText: { fontSize: 15, color: '#555' },
  birthdayButtonIcon: { fontSize: 18 },
  clearBirthday: { marginBottom: 8 },
  clearBirthdayText: { fontSize: 13, color: '#aaa', textAlign: 'right' },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: '#222' },
  avatarPreview: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20 },
  avatarPreviewText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelButtonText: { color: '#555', fontWeight: '600', fontSize: 15 },
  saveButton: { flex: 1, backgroundColor: '#E8335A', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
