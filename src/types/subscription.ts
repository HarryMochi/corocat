export interface UserSubscription {
  isPremium: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
  subscriptionPlan: 'monthly' | 'yearly' | null;
  currentPeriodEnd: Date | null;
}
