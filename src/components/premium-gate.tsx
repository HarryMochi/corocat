'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

import { usePremiumStatus } from '../hooks/use-premium-status';
import { Button } from './ui/button';

interface PremiumGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function PremiumGate({ children, fallback }: PremiumGateProps) {
  const router = useRouter();
  const { isPremium, loading } = usePremiumStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!isPremium) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="rounded-2xl border-2 border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 p-8 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <Lock className="h-8 w-8 text-yellow-600" />
        </div>

        <h3 className="mb-2 text-xl font-bold">Premium Feature</h3>

        <p className="mx-auto mb-6 max-w-md text-gray-600">
          Upgrade to Premium to unlock this feature and many more!
        </p>

        <Button
          onClick={() => router.push('/#pricing')}
          className="bg-gradient-to-r from-yellow-400 to-orange-500"
        >
          Upgrade to Premium
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
