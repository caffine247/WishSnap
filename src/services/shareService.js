import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { getWishlistItems } from './wishlist';

function generateToken() {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

export async function createShareLink(userId, occasion) {
  const items = await getWishlistItems(userId);
  const filtered = occasion === 'All' ? items : items.filter((i) => i.occasion === occasion);

  const shareData = {
    userId,
    occasion,
    createdAt: serverTimestamp(),
    token: generateToken(),
    items: filtered.map((i) => ({
      name: i.name,
      category: i.category,
      occasion: i.occasion,
      price: i.price || null,
      currency: i.currency || null,
      retailer: i.retailer || null,
      imageUri: i.imageUri || null,
    })),
  };

  const ref = await addDoc(collection(db, 'shares'), shareData);
  return `https://wishsnap-ba0a9.web.app/share.html?token=${shareData.token}`;
}
