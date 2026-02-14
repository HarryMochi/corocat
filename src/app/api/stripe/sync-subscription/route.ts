import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { stripe } from '../../../../lib/stripe';
import { getFirestoreAdmin } from '../../../../lib/firebase-admin';


export async function POST(req: Request) {
  try {
    const { sessionId, userId, resubscribe: resubscribeParam } = await req.json();

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Missing sessionId or userId' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.json(
        { error: 'Checkout not completed' },
        { status: 400 }
      );
    }

    const sessionUserId = session.client_reference_id ?? (session.metadata?.userId as string);
    const isResubscribe = session.metadata?.resubscribe === 'true' || resubscribeParam === true || resubscribeParam === '1';
    if (sessionUserId !== userId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    const subFromSession = session.subscription;
    const subscriptionId = typeof subFromSession === 'string' ? subFromSession : (subFromSession as { id: string })?.id;
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'No subscription in session' },
        { status: 400 }
      );
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const sub = subscription as unknown as {
      items: typeof subscription.items;
      current_period_end?: number;
      cancel_at_period_end?: boolean;
    };
    const interval = sub.items.data[0]?.price?.recurring?.interval ?? 'month';
    const periodEndRaw = sub.current_period_end;
    let periodEndSeconds =
      typeof periodEndRaw === 'number' && Number.isFinite(periodEndRaw)
        ? Math.floor(periodEndRaw)
        : null;
    if (periodEndSeconds && isResubscribe) {
      periodEndSeconds += 30 * 24 * 60 * 60;
    }

    const customerId = typeof session.customer === 'string'
      ? session.customer
      : (session.customer as { id?: string })?.id ?? null;

    const db = getFirestoreAdmin();
    const userRef = db.collection('users').doc(userId);

    await userRef.set(
      {
        isPremium: true,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: subscription.status,
        subscriptionPlan: interval === 'year' ? 'yearly' : 'monthly',
        currentPeriodEnd: periodEndSeconds ? new Timestamp(periodEndSeconds, 0) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[STRIPE_SYNC]', error);
    return NextResponse.json(
      { error: 'Failed to sync subscription' },
      { status: 500 }
    );
  }
}
