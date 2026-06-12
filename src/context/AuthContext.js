import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getProfile, createProfile, updateProfile as saveProfile } from '../services/profileService';
import { createFamily, joinFamily, leaveFamily } from '../services/familyService';

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

  // The UID whose data pool we read/write — owner's UID for family members, own UID otherwise
  const effectiveUserId = profile?.familyOwnerId || user?.uid;

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

  const startFamily = async () => {
    if (!user) return;
    const { familyId, joinCode } = await createFamily(user.uid);
    const updates = { plan: 'family', familyId, familyRole: 'owner', joinCode };
    await saveProfile(user.uid, updates);
    setProfile((prev) => ({ ...prev, ...updates }));
    return joinCode;
  };

  const joinFamilyByCode = async (code) => {
    if (!user) return;
    const { familyId, familyOwnerId } = await joinFamily(code, user.uid);
    const updates = { plan: 'family', familyId, familyRole: 'member', familyOwnerId };
    await saveProfile(user.uid, updates);
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const leaveCurrentFamily = async () => {
    if (!user || !profile?.familyId) return;
    await leaveFamily(profile.familyId, user.uid);
    const updates = { plan: 'free', familyId: null, familyRole: null, familyOwnerId: null, joinCode: null };
    await saveProfile(user.uid, updates);
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      effectiveUserId,
      login, register, logout,
      refreshProfile, saveUserProfile,
      startFamily, joinFamilyByCode, leaveCurrentFamily,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
