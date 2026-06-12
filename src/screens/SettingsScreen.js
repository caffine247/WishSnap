import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Alert, ScrollView, Modal, Clipboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../hooks/usePlan';

const RETAILERS = ['Amazon', 'Walmart', 'Target'];

export default function SettingsScreen({ navigation }) {
  const { user, profile, logout, saveUserProfile, startFamily, joinFamilyByCode, leaveCurrentFamily } = useAuth();
  const { plan, isFamily } = usePlan();
  const [selectedRetailer, setSelectedRetailer] = useState('Amazon');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [saving, setSaving] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joiningFamily, setJoiningFamily] = useState(false);
  const [startingFamily, setStartingFamily] = useState(false);

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

  async function handleStartFamily() {
    Alert.alert(
      'Create a Family Account',
      'This upgrades you to the Family plan and generates a join code you can share with your partner.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create Family', onPress: async () => {
          setStartingFamily(true);
          try {
            await startFamily();
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setStartingFamily(false);
          }
        }},
      ]
    );
  }

  async function handleJoinFamily() {
    if (!joinCode.trim()) return;
    setJoiningFamily(true);
    try {
      await joinFamilyByCode(joinCode);
      setJoinCode('');
      Alert.alert('Joined!', 'You are now sharing wishlists with your family.');
    } catch (e) {
      Alert.alert('Could not join', e.message);
    } finally {
      setJoiningFamily(false);
    }
  }

  async function handleLeaveFamily() {
    Alert.alert(
      'Leave Family?',
      profile?.familyRole === 'owner'
        ? 'Leaving will remove your family account. Members will lose access.'
        : 'You will no longer see shared wishlists.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: async () => {
          try {
            await leaveCurrentFamily();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        }},
      ]
    );
  }

  function copyCode() {
    Clipboard.setString(profile.joinCode);
    Alert.alert('Copied!', `Join code ${profile.joinCode} copied to clipboard.`);
  }

  const displayName = profile?.displayName || profile?.firstName || user?.email || 'You';
  const initials = profile
    ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || '?'
    : (user?.email?.[0] || '?').toUpperCase();

  const planLabel = plan === 'family' ? 'Family' : plan === 'premium' ? 'Premium' : 'Free';
  const planColor = plan === 'free' ? '#aaa' : '#E8335A';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.title}>Profile & Settings</Text>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={[styles.planBadge, { backgroundColor: plan === 'free' ? '#f0f0f0' : '#fff0f3' }]}>
            <Text style={[styles.planBadgeText, { color: planColor }]}>{planLabel}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={openEdit}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Upgrade banner for free users */}
      {plan === 'free' && (
        <TouchableOpacity style={styles.upgradeBanner} onPress={() => navigation.navigate('Upgrade')}>
          <Text style={styles.upgradeBannerTitle}>Upgrade to Premium or Family</Text>
          <Text style={styles.upgradeBannerSub}>Unlimited kids, custom lists & family sharing →</Text>
        </TouchableOpacity>
      )}

      {/* Account details */}
      <Text style={styles.sectionLabel}>Account</Text>
      <View style={styles.infoCard}>
        <Row label="First name" value={profile?.firstName || '—'} />
        <Divider />
        <Row label="Last name" value={profile?.lastName || '—'} />
        <Divider />
        <Row label="Email" value={user?.email || '—'} />
        <Divider />
        <Row label="Plan" value={planLabel} valueColor={planColor} />
        <Divider />
        <Row label="Member since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'} />
      </View>

      {/* Family section */}
      <Text style={styles.sectionLabel}>Family</Text>
      {isFamily ? (
        <View style={styles.infoCard}>
          {profile?.familyRole === 'owner' && profile?.joinCode ? (
            <>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Your join code</Text>
                <TouchableOpacity onPress={copyCode} style={styles.codeBox}>
                  <Text style={styles.codeText}>{profile.joinCode}</Text>
                  <Text style={styles.codeCopy}>Copy</Text>
                </TouchableOpacity>
              </View>
              <Divider />
              <Text style={styles.familyHint}>
                Share this code with your partner. They enter it in their app under Family to join your shared wishlist.
              </Text>
            </>
          ) : (
            <Row label="Status" value="Member" />
          )}
          <Divider />
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveFamily}>
            <Text style={styles.leaveButtonText}>Leave Family</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.infoCard}>
          <Text style={styles.familyHint}>
            Share wishlists with your partner. One person creates the family, the other joins with the code.
          </Text>
          <Divider />
          {/* Join with code */}
          <View style={styles.joinRow}>
            <TextInput
              style={styles.joinInput}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              placeholder="Enter join code"
              autoCapitalize="characters"
              maxLength={6}
            />
            <TouchableOpacity
              style={[styles.joinButton, (!joinCode.trim() || joiningFamily) && { opacity: 0.5 }]}
              onPress={handleJoinFamily}
              disabled={!joinCode.trim() || joiningFamily}
            >
              <Text style={styles.joinButtonText}>{joiningFamily ? 'Joining...' : 'Join'}</Text>
            </TouchableOpacity>
          </View>
          <Divider />
          <TouchableOpacity
            style={[styles.createFamilyButton, startingFamily && { opacity: 0.6 }]}
            onPress={handleStartFamily}
            disabled={startingFamily}
          >
            <Text style={styles.createFamilyText}>{startingFamily ? 'Creating...' : '+ Create a Family Account'}</Text>
          </TouchableOpacity>
        </View>
      )}

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

function Row({ label, value, valueColor }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor && { color: valueColor, fontWeight: '700' }]}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '800', padding: 24, paddingBottom: 16, marginTop: 8 },

  profileCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 16, backgroundColor: '#f9f9f9', borderRadius: 16, padding: 16, gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8335A', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#111' },
  profileEmail: { fontSize: 13, color: '#888', marginTop: 2 },
  planBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  planBadgeText: { fontSize: 11, fontWeight: '700' },
  editButton: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E8335A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  editButtonText: { color: '#E8335A', fontWeight: '700', fontSize: 13 },

  upgradeBanner: { marginHorizontal: 24, marginBottom: 24, backgroundColor: '#fff0f3', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#E8335A' },
  upgradeBannerTitle: { fontSize: 15, fontWeight: '800', color: '#E8335A' },
  upgradeBannerSub: { fontSize: 13, color: '#E8335A', opacity: 0.8, marginTop: 3 },

  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 24, marginBottom: 10 },
  infoCard: { marginHorizontal: 24, marginBottom: 28, borderWidth: 1.5, borderColor: '#eee', borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#fff' },
  rowLabel: { fontSize: 15, color: '#555' },
  rowValue: { fontSize: 15, color: '#111', fontWeight: '500', maxWidth: '55%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 14 },

  // Family
  familyHint: { fontSize: 13, color: '#888', padding: 14, lineHeight: 20 },
  codeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff0f3', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  codeText: { fontSize: 18, fontWeight: '800', color: '#E8335A', letterSpacing: 3 },
  codeCopy: { fontSize: 12, color: '#E8335A', fontWeight: '600' },
  joinRow: { flexDirection: 'row', padding: 14, gap: 10, alignItems: 'center' },
  joinInput: { flex: 1, borderWidth: 1.5, borderColor: '#eee', borderRadius: 10, padding: 12, fontSize: 18, fontWeight: '700', letterSpacing: 3, textAlign: 'center', backgroundColor: '#fafafa' },
  joinButton: { backgroundColor: '#E8335A', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12 },
  joinButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  createFamilyButton: { padding: 14, alignItems: 'center' },
  createFamilyText: { color: '#E8335A', fontWeight: '700', fontSize: 15 },
  leaveButton: { padding: 14, alignItems: 'center' },
  leaveButtonText: { color: '#E8335A', fontSize: 14, fontWeight: '600' },

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
