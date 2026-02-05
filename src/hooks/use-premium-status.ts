'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { UserSubscription } from '../types/subscription';

interface PremiumStatusReturn {
  isPremium: boolean;
  subscription: UserSubscription | null;
  loading: boolean;
}

export function usePremiumStatus(): PremiumStatusReturn {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsPremium(false);
      setSubscription(null);
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const userRef = doc(db, 'users', user.uid);

    // Real-time listener for instant updates
    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          
          // Check if subscription is active and not expired
          const isActive = data.isPremium === true;
          const currentPeriodEnd = data.currentPeriodEnd?.toDate();
          const isNotExpired = !currentPeriodEnd || currentPeriodEnd > new Date();
          
          const subscriptionData: UserSubscription = {
            isPremium: data.isPremium || false,
            stripeCustomerId: data.stripeCustomerId || null,
            stripeSubscriptionId: data.stripeSubscriptionId || null,
            subscriptionStatus: data.subscriptionStatus || null,
            subscriptionPlan: data.subscriptionPlan || null,
            currentPeriodEnd: currentPeriodEnd || null,
          };
          
          setIsPremium(isActive && isNotExpired);
          setSubscription(subscriptionData);
        } else {
          setIsPremium(false);
          setSubscription(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to user subscription:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { isPremium, subscription, loading };
}
