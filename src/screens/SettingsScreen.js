import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Alert, ScrollView, Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

const RETAILERS = ['Amazon', 'Walmart', 'Target'];

export default function SettingsScreen() {
  const { user, profile, logout, saveUserProfile } = useAuth();
  const [selectedRetailer, setSelectedRetailer] = useState('Amazon');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('preferredRetailer').then((val) => {
      if (val) setSelectedRetailer(val);
    });
  }, []);

  async function selectRetailer(retailer) {
    setSelectedRetailer(retailer);
    await AsyncStorage.setItem('preferredRetailer', retailer);
  }

  function openEdit() {
    setEditFirst(profile?.firstName || '');
    setEditLast(profile?.lastName || '');
    setEditModalVisible(true);
  }

  async function handleSave() {
    if (!editFirst.trim()) return Alert.alert('First name is required');
    setSaving(true);
    try {
      await saveUserProfile({ firstName: editFirst.trim(), lastName: editLast.trim() });
      setEditModalVisible(false);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  const displayName = profile?.displayName || profile?.firstName || user?.email || 'You';
  const initials = profile
    ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || '?'
    : (user?.email?.[0] || '?').toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.title}>⚙️ Profile & Settings</Text>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={openEdit}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Account details */}
      <Text style={styles.sectionLabel}>Account</Text>
      <View style={styles.infoCard}>
        <Row label="First name" value={profile?.firstName || '—'} />
        <Divider />
        <Row label="Last name" value={profile?.lastName || '—'} />
        <Divider />
        <Row label="Email" value={user?.email || '—'} />
        <Divider />
        <Row label="Member since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'} />
      </View>

      {/* Retailer preference */}
      <Text style={styles.sectionLabel}>Preferred Retailer for Price Lookup</Text>
      {RETAILERS.map((r) => (
        <TouchableOpacity
          key={r}
          style={[styles.option, selectedRetailer === r && styles.optionActive]}
          onPress={() => selectRetailer(r)}
        >
          <Text style={[styles.optionText, selectedRetailer === r && styles.optionTextActive]}>{r}</Text>
          {selectedRetailer === r && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>
      ))}
      <Text style={styles.hint}>WishSnap looks up the current price from this retailer when you snap a photo.</Text>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

      {/* Edit profile modal */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>First name</Text>
            <TextInput
              style={styles.input}
              value={editFirst}
              onChangeText={setEditFirst}
              placeholder="First name"
              autoCapitalize="words"
              autoFocus
            />

            <Text style={styles.inputLabel}>Last name</Text>
            <TextInput
              style={styles.input}
              value={editLast}
              onChangeText={setEditLast}
              placeholder="Last name (optional)"
              autoCapitalize="words"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '800', padding: 24, paddingBottom: 16, marginTop: 8 },

  // Profile card
  profileCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 28, backgroundColor: '#f9f9f9', borderRadius: 16, padding: 16, gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8335A', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#111' },
  profileEmail: { fontSize: 13, color: '#888', marginTop: 2 },
  editButton: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E8335A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  editButtonText: { color: '#E8335A', fontWeight: '700', fontSize: 13 },

  // Info card
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 24, marginBottom: 10 },
  infoCard: { marginHorizontal: 24, marginBottom: 28, borderWidth: 1.5, borderColor: '#eee', borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: '#fff' },
  rowLabel: { fontSize: 15, color: '#555' },
  rowValue: { fontSize: 15, color: '#111', fontWeight: '500', maxWidth: '55%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 14 },

  // Retailer picker
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderWidth: 1.5, borderColor: '#eee', borderRadius: 12, marginBottom: 10, marginHorizontal: 24 },
  optionActive: { borderColor: '#E8335A', backgroundColor: '#fff5f7' },
  optionText: { fontSize: 16, color: '#333' },
  optionTextActive: { color: '#E8335A', fontWeight: '700' },
  check: { color: '#E8335A', fontSize: 18, fontWeight: '700' },
  hint: { marginHorizontal: 24, marginTop: 4, marginBottom: 28, fontSize: 13, color: '#aaa', lineHeight: 20 },

  logoutButton: { marginHorizontal: 24, borderWidth: 1.5, borderColor: '#E8335A', borderRadius: 14, padding: 16, alignItems: 'center' },
  logoutButtonText: { color: '#E8335A', fontSize: 16, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#eee', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16, backgroundColor: '#fafafa' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelButton: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelButtonText: { color: '#555', fontWeight: '600', fontSize: 15 },
  saveButton: { flex: 1, backgroundColor: '#E8335A', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
