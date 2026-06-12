import { db } from './firebase';
import {
  collection, addDoc, getDocs, query, where, updateDoc, doc, getDoc, serverTimestamp,
} from 'firebase/firestore';

function generateJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function createFamily(userId) {
  const joinCode = generateJoinCode();
  const ref = await addDoc(collection(db, 'families'), {
    createdBy: userId,
    members: [userId],
    joinCode,
    createdAt: serverTimestamp(),
  });
  return { familyId: ref.id, joinCode };
}

export async function joinFamily(joinCode, userId) {
  const q = query(collection(db, 'families'), where('joinCode', '==', joinCode.trim().toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Invalid join code. Check the code and try again.');
  const familyDoc = snap.docs[0];
  const family = familyDoc.data();
  if (family.members.includes(userId)) throw new Error('You are already in this family.');
  await updateDoc(doc(db, 'families', familyDoc.id), {
    members: [...family.members, userId],
  });
  return { familyId: familyDoc.id, familyOwnerId: family.createdBy };
}

export async function getFamily(familyId) {
  const snap = await getDoc(doc(db, 'families', familyId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function leaveFamily(familyId, userId) {
  const ref = doc(db, 'families', familyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const members = snap.data().members.filter((m) => m !== userId);
  await updateDoc(ref, { members });
}
