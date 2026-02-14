import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { stripe } from '../../../../lib/stripe';
import { getFirestoreAdmin } from '../../../../lib/firebase-admin';

/**
 * Toggle Stripe subscription auto-renewal (cancel_at_period_end).
 * Expects JSON body: { userId: string, autoRenew: boolean }
 */
export async function POST(req: Request) {
  try {
    const { userId, autoRenew } = await req.json();

    if (!userId || typeof autoRenew !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid userId/autoRenew' },
        { status: 400 }
      );
    }

    const db = getFirestoreAdmin();
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data() as any;
    const subscriptionId = userData?.stripeSubscriptionId as
      | string
      | undefined;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription for user' },
        { status: 400 }
      );
    }

    const updated = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: !autoRenew,
    });

    const periodEndRaw = (updated as any).current_period_end;
    const periodEndSec =
      typeof periodEndRaw === 'number' && Number.isFinite(periodEndRaw)
        ? Math.floor(periodEndRaw)
        : null;

    await userRef.set(
      {
        subscriptionStatus: updated.status,
        cancelAtPeriodEnd: updated.cancel_at_period_end ?? false,
        currentPeriodEnd: periodEndSec
          ? new Timestamp(periodEndSec, 0)
          : userData.currentPeriodEnd ?? null,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      subscriptionStatus: updated.status,
      cancelAtPeriodEnd: updated.cancel_at_period_end ?? false,
    });
  } catch (error) {
    console.error('[STRIPE_TOGGLE_RENEWAL]', error);
    return NextResponse.json(
      { error: 'Failed to toggle auto-renewal' },
      { status: 500 }
    );
  }
}

