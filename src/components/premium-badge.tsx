'use client';

import { usePremiumStatus } from '../hooks/use-premium-status';
import { Crown } from 'lucide-react';

export function PremiumBadge() {
  const { isPremium, loading } = usePremiumStatus();

  if (loading || !isPremium) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
      <Crown className="w-3 h-3" />
      PREMIUM
    </div>
  );
}
