'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { UserSubscription } from '../types/subscription';

interface PremiumStatusReturn {
  isPremium: boolean;
  subscription: UserSubscription | null;
  subscriptionDetails: {
    plan: UserSubscription['subscriptionPlan'];
    status: UserSubscription['subscriptionStatus'];
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  loading: boolean;
}

export function usePremiumStatus(): PremiumStatusReturn {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [usernameStyleKey, setUsernameStyleKey] = useState<string | null>(
    null
  );
  const [avatarEffectKey, setAvatarEffectKey] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    if (!user) {
      setIsPremium(false);
      setSubscription(null);
      setLoading(false);
      setUsernameStyleKey('none');
      setAvatarEffectKey('none');
      return;
    }

    const db = getFirestore();
    const userRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;


          let currentPeriodEnd: Date | null = data.currentPeriodEnd?.toDate
            ? data.currentPeriodEnd.toDate()
            : null;


          if (
            !currentPeriodEnd &&
            (data.subscriptionStatus === 'active' ||
              data.subscriptionStatus === 'trialing')
          ) {
            const base =
              data.updatedAt?.toDate && typeof data.updatedAt.toDate === 'function'
                ? data.updatedAt.toDate()
                : new Date();
            const approx = new Date(base.getTime());
            if (data.subscriptionPlan === 'yearly') {
              approx.setFullYear(approx.getFullYear() + 1);
            } else {
              // default to monthly
              approx.setMonth(approx.getMonth() + 1);
            }
            currentPeriodEnd = approx;
          }

          const isNotExpired =
            !currentPeriodEnd || currentPeriodEnd > new Date();

          const isStripeActive =
            data.subscriptionStatus === 'active' ||
            data.subscriptionStatus === 'trialing';

          const isActive =
            (data.isPremium === true || isStripeActive) && isNotExpired;

          const subscriptionData: UserSubscription = {
            isPremium: data.isPremium || false,
            stripeCustomerId: data.stripeCustomerId || null,
            stripeSubscriptionId: data.stripeSubscriptionId || null,
            subscriptionStatus: data.subscriptionStatus || null,
            subscriptionPlan: data.subscriptionPlan || null,
            currentPeriodEnd,
            cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
          };

          setIsPremium(isActive);
          setSubscription(subscriptionData);
          setUsernameStyleKey(data.usernameStyleKey || 'none');
          setAvatarEffectKey(data.avatarEffectKey || 'none');
        } else {
          setIsPremium(false);
          setSubscription(null);
          setUsernameStyleKey('none');
          setAvatarEffectKey('none');
        }

        setLoading(false);
      },
      (error) => {
        console.error('Error listening to subscription:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return {
    isPremium,
    subscription,
    subscriptionDetails: subscription
      ? {
          plan: subscription.subscriptionPlan,
          status: subscription.subscriptionStatus,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: !!subscription.cancelAtPeriodEnd,
        }
      : null,
    loading,
    // Visual customization keys for the signed-in user
    usernameStyleKey,
    avatarEffectKey,
  };
}

