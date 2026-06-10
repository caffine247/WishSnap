import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) return Alert.alert('Please fill in all fields');
    if (isRegistering && !firstName.trim()) return Alert.alert('Please enter your first name');
    setLoading(true);
    try {
      if (isRegistering) {
        await register(email.trim(), password, firstName.trim(), lastName.trim());
      } else {
        await login(email.trim(), password);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setIsRegistering(!isRegistering);
    setFirstName('');
    setLastName('');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🎁</Text>
        <Text style={styles.appName}>WishSnap</Text>
        <Text style={styles.subtitle}>Snap it. Save it. Gift it.</Text>

        {isRegistering && (
          <View style={styles.nameRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="First name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Last name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? '...' : isRegistering ? 'Create Account' : 'Log In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={switchMode}>
          <Text style={styles.toggle}>
            {isRegistering ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  logo: { fontSize: 56, textAlign: 'center', marginBottom: 4 },
  appName: { fontSize: 36, fontWeight: '800', textAlign: 'center', color: '#E8335A', marginBottom: 4 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#888', marginBottom: 40 },
  nameRow: { flexDirection: 'row', gap: 10 },
  input: { borderWidth: 1.5, borderColor: '#eee', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16, backgroundColor: '#fafafa' },
  button: { backgroundColor: '#E8335A', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toggle: { textAlign: 'center', marginTop: 20, color: '#E8335A', fontSize: 14 },
});
