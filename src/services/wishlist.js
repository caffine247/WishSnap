import { db } from './firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc, query, where, serverTimestamp,
} from 'firebase/firestore';

export async function addWishlistItem(userId, item) {
  return addDoc(collection(db, 'wishlists'), {
    userId,
    ...item,
    createdAt: serverTimestamp(),
  });
}

export async function getWishlistItems(userId, childId = null) {
  const constraints = [where('userId', '==', userId)];
  if (childId) constraints.push(where('childId', '==', childId));
  const q = query(collection(db, 'wishlists'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteWishlistItem(itemId) {
  return deleteDoc(doc(db, 'wishlists', itemId));
}
