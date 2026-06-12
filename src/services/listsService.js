import { db } from './firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc, query, where, serverTimestamp, updateDoc,
} from 'firebase/firestore';

export async function getLists(userId) {
  const q = query(collection(db, 'lists'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createList(userId, { name, childId = null, childName = null }) {
  return addDoc(collection(db, 'lists'), {
    userId,
    name,
    childId,
    childName,
    createdAt: serverTimestamp(),
  });
}

export async function updateList(listId, data) {
  return updateDoc(doc(db, 'lists', listId), data);
}

export async function deleteList(listId) {
  return deleteDoc(doc(db, 'lists', listId));
}
