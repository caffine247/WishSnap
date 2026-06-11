import { useAuth } from '../context/AuthContext';

export const FREE_LIMITS = {
  children: 1,
  itemsPerChild: 10,
};

export function usePlan() {
  const { profile } = useAuth();
  const isPremium = profile?.plan === 'premium';

  function canAddChild(currentCount) {
    if (isPremium) return true;
    return currentCount < FREE_LIMITS.children;
  }

  function canAddItem(currentCount) {
    if (isPremium) return true;
    return currentCount < FREE_LIMITS.itemsPerChild;
  }

  return { isPremium, canAddChild, canAddItem, FREE_LIMITS };
}
