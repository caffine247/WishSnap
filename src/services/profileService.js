import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export async function getProfile(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? snap.data() : null;
}

export async function createProfile(userId, data) {
  return setDoc(doc(db, 'users', userId), data, { merge: true });
}

export async function updateProfile(userId, data) {
  return updateDoc(doc(db, 'users', userId), data);
}
