import { useAuth } from '../context/AuthContext';

export const FREE_LIMITS = {
  children: 1,
  itemsPerChild: 10,
};

export function usePlan() {
  const { profile } = useAuth();
  const plan = profile?.plan || 'free';
  const isPremium = plan === 'premium';
  const isFamily = plan === 'family';
  const isPaid = isPremium || isFamily;

  function canAddChild(currentCount) {
    return isPaid || currentCount < FREE_LIMITS.children;
  }

  function canAddItem(currentCount) {
    return isPaid || currentCount < FREE_LIMITS.itemsPerChild;
  }

  function canUseCustomLists() {
    return isPaid;
  }

  function canInviteFamily() {
    return isFamily;
  }

  return { plan, isPremium, isFamily, isPaid, canAddChild, canAddItem, canUseCustomLists, canInviteFamily, FREE_LIMITS };
}
