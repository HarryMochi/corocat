import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Timestamp } from 'firebase-admin/firestore';
import { getStripeServer } from '../../../../lib/stripe-server';
import { getFirestoreAdmin } from '../../../../lib/firebase-admin';
// @ts-ignore
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const stripe = getStripeServer();
  const headerList = await headers();
  const signature = headerList.get('stripe-signature');

  if (!signature) {
    console.error('No stripe-signature header found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const db = getFirestoreAdmin();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);

        const userId = session.client_reference_id ?? (session.metadata?.userId as string | undefined);

        if (!userId) {
          console.error('No client_reference_id or metadata.userId found in checkout session');
          return NextResponse.json(
            { error: 'Missing user ID' },
            { status: 400 }
          );
        }

        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (!subscriptionId) {
          console.error('No subscription ID found in session');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const sub = subscription as unknown as {
          items: Stripe.Subscription['items'];
          current_period_end?: number;
          cancel_at_period_end?: boolean;
        };
        const interval = sub.items.data[0]?.price?.recurring?.interval;
        const periodEndRaw = sub.current_period_end;
        let periodEndSec =
          typeof periodEndRaw === 'number' && Number.isFinite(periodEndRaw)
            ? Math.floor(periodEndRaw)
            : null;
        const isResubscribe = session.metadata?.resubscribe === 'true';
        if (periodEndSec && isResubscribe) {
          periodEndSec += 30 * 24 * 60 * 60;
        }

        const userRef = db.collection('users').doc(userId);
        await userRef.set(
          {
            isPremium: true,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: subscription.status,
            subscriptionPlan: interval === 'year' ? 'yearly' : 'monthly',
            currentPeriodEnd: periodEndSec ? new Timestamp(periodEndSec, 0) : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );

        console.log(`User ${userId} upgraded to premium (${interval})`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription & {
          current_period_end?: number;
          cancel_at_period_end?: boolean;
        };
        console.log('Subscription updated:', subscription.id);

        const usersSnapshot = await db
          .collection('users')
          .where('stripeSubscriptionId', '==', subscription.id)
          .limit(1)
          .get();

        if (usersSnapshot.empty) {
          console.error('No user found with subscription ID:', subscription.id);
          break;
        }

        const userDoc = usersSnapshot.docs[0];
        const isPremium = ['active', 'trialing'].includes(subscription.status);
        const periodEndRaw = subscription.current_period_end;
        const periodEndSec =
          typeof periodEndRaw === 'number' && Number.isFinite(periodEndRaw)
            ? Math.floor(periodEndRaw)
            : null;

        await userDoc.ref.update({
          isPremium,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: periodEndSec ? new Timestamp(periodEndSec, 0) : null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
          updatedAt: Timestamp.now(),
        });

        console.log(`Updated user ${userDoc.id}: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', subscription.id);

        const usersSnapshot = await db
          .collection('users')
          .where('stripeSubscriptionId', '==', subscription.id)
          .limit(1)
          .get();

        if (usersSnapshot.empty) {
          console.error(' No user found with subscription ID:', subscription.id);
          break;
        }

        const userDoc = usersSnapshot.docs[0];

        await userDoc.ref.update({
          isPremium: false,
          subscriptionStatus: 'canceled',
          cancelAtPeriodEnd: false,
          updatedAt: Timestamp.now(),
        });

        console.log(`User ${userDoc.id} downgraded to free`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string;
        };
        console.log(`Payment succeeded for invoice ${invoice.id}`);
        
        const subId = invoice.subscription;
        if (subId) {
          const subIdStr = typeof subId === 'string' ? subId : (subId as { id: string }).id;
          const subscription = await stripe.subscriptions.retrieve(subIdStr);
          const subRetrieved = subscription as unknown as {
            id: string;
            current_period_end?: number;
            cancel_at_period_end?: boolean;
          };

          const usersSnapshot = await db
            .collection('users')
            .where('stripeSubscriptionId', '==', subRetrieved.id)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            const periodEndRaw = subRetrieved.current_period_end;
            const periodEndSec =
              typeof periodEndRaw === 'number' && Number.isFinite(periodEndRaw)
                ? Math.floor(periodEndRaw)
                : null;
            await userDoc.ref.update({
              isPremium: true,
              subscriptionStatus: 'active',
              currentPeriodEnd: periodEndSec ? new Timestamp(periodEndSec, 0) : null,
              cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
              updatedAt: Timestamp.now(),
            });
            console.log(`Renewed subscription for user ${userDoc.id}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
        console.log(`Payment failed for invoice ${invoice.id}`);

        const failSubId = invoice.subscription;
        if (failSubId) {
          const failSubIdStr = typeof failSubId === 'string' ? failSubId : (failSubId as { id: string }).id;
          const usersSnapshot = await db
            .collection('users')
            .where('stripeSubscriptionId', '==', failSubIdStr)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            await userDoc.ref.update({
              subscriptionStatus: 'past_due',
              updatedAt: Timestamp.now(),
            });
            console.log(`Marked user ${userDoc.id} as past_due`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
