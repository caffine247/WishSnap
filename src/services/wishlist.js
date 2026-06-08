import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

export async function addWishlistItem(userId, item) {
  return addDoc(collection(db, 'wishlists'), {
    userId,
    ...item,
    createdAt: serverTimestamp(),
  });
}

export async function getWishlistItems(userId) {
  const q = query(collection(db, 'wishlists'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteWishlistItem(itemId) {
  return deleteDoc(doc(db, 'wishlists', itemId));
}
