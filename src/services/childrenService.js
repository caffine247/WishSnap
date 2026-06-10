import { db } from './firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';

export async function getChildren(userId) {
  const snap = await getDocs(collection(db, 'users', userId, 'children'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addChild(userId, { name, color }) {
  return addDoc(collection(db, 'users', userId, 'children'), {
    name,
    color,
    createdAt: serverTimestamp(),
  });
}

export async function deleteChild(userId, childId) {
  return deleteDoc(doc(db, 'users', userId, 'children', childId));
}
