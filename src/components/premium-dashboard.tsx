'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Crown, Zap, Award, Calendar, Star } from 'lucide-react';
import { usePremiumStatus } from '../hooks/use-premium-status';

export function PremiumDashboard() {
  const { isPremium, subscriptionDetails, loading } = usePremiumStatus();
  const [resubscribeDialogOpen, setResubscribeDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-muted rounded mb-4 w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return null; // Don't show anything to free users
  }

  const expiryDate = subscriptionDetails?.currentPeriodEnd 
    ? new Date(subscriptionDetails.currentPeriodEnd).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'N/A';

  const planName = subscriptionDetails?.plan === 'yearly' ? 'Yearly' : 'Monthly';
  const cancelAtPeriodEnd = subscriptionDetails?.cancelAtPeriodEnd ?? false;

  const daysUntilExpiry = subscriptionDetails?.currentPeriodEnd
    ? Math.ceil((new Date(subscriptionDetails.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="w-full bg-gradient-to-br from-primary/5 via-accent/5 to-background p-6 rounded-2xl border border-primary/10 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-full">
          <Crown className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Premium Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">Welcome to your enhanced learning experience</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Subscription Plan */}
        <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Subscription Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{planName}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {subscriptionDetails?.status === 'active' ? 'Active' : subscriptionDetails?.status}
            </p>
          </CardContent>
        </Card>

        {/* Renewal / Access Date */}
        <Card className="border-accent/20 bg-gradient-to-br from-background to-accent/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              {cancelAtPeriodEnd ? 'Access until' : 'Next Renewal'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{daysUntilExpiry} days</div>
            <p className="text-xs text-muted-foreground mt-1">{expiryDate}</p>
          </CardContent>
        </Card>

        {/* Premium Features */}
        <Card className="border-green-500/20 bg-gradient-to-br from-background to-green-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" />
              Premium Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Unlocked</div>
            <p className="text-xs text-muted-foreground mt-1">All features active</p>
          </CardContent>
        </Card>
      </div>

      {/* Premium Benefits */}
      <div className="bg-background/50 rounded-xl p-4 border border-border/50">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          Your Premium Benefits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            10 courses per hour
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            20 total whiteboards
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            Enhanced profile page
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            Faster generation
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            Priority support
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            Gradient username
          </div>
        </div>
      </div>

      {/* Renewal Notice & Resubscribe */}
      {cancelAtPeriodEnd && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-3">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            ⚠️ Auto-renewal is off. Your subscription will end on {expiryDate}. You will not be charged.
          </p>
          <Button
            size="sm"
            onClick={() => setResubscribeDialogOpen(true)}
          >
            Resubscribe
          </Button>
          <Dialog open={resubscribeDialogOpen} onOpenChange={setResubscribeDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Resubscribe</DialogTitle>
                <DialogDescription>
                  You can resubscribe at the end of your membership.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
