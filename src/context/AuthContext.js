import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getProfile, createProfile, updateProfile as saveProfile } from '../services/profileService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const p = await getProfile(u.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const register = async (email, password, firstName, lastName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const displayName = [firstName, lastName].filter(Boolean).join(' ');
    await firebaseUpdateProfile(cred.user, { displayName });
    const profileData = {
      firstName: firstName || '',
      lastName: lastName || '',
      displayName,
      email,
      plan: 'free',
      createdAt: new Date().toISOString(),
    };
    await createProfile(cred.user.uid, profileData);
    setProfile(profileData);
    return cred;
  };

  const logout = () => signOut(auth);

  const refreshProfile = async () => {
    if (user) {
      const p = await getProfile(user.uid);
      setProfile(p);
    }
  };

  const saveUserProfile = async (data) => {
    if (!user) return;
    await saveProfile(user.uid, data);
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const firstName = data.firstName ?? profile?.firstName ?? '';
      const lastName = data.lastName ?? profile?.lastName ?? '';
      const displayName = [firstName, lastName].filter(Boolean).join(' ');
      await firebaseUpdateProfile(user, { displayName });
      data.displayName = displayName;
    }
    setProfile((prev) => ({ ...prev, ...data }));
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, refreshProfile, saveUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
