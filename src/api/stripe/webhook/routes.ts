import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripeServer } from '@/lib/stripe-server';
import { getFirestoreAdmin } from '@/lib/firebase-admin';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const stripe = getStripeServer();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    console.error('❌ No stripe-signature header found');
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
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
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
        console.log('💳 Checkout session completed:', session.id);

        const userId = session.client_reference_id;

        if (!userId) {
          console.error('⚠️ No client_reference_id found in checkout session');
          return NextResponse.json(
            { error: 'Missing user ID' },
            { status: 400 }
          );
        }

        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (!subscriptionId) {
          console.error('⚠️ No subscription ID found in session');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const interval = subscription.items.data[0]?.price?.recurring?.interval;
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

        const userRef = db.collection('users').doc(userId);
        await userRef.update({
          isPremium: true,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: subscription.status,
          subscriptionPlan: interval === 'year' ? 'yearly' : 'monthly',
          currentPeriodEnd: currentPeriodEnd,
          updatedAt: new Date(),
        });

        console.log(`✅ User ${userId} upgraded to premium (${interval})`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('🔄 Subscription updated:', subscription.id);

        const usersSnapshot = await db
          .collection('users')
          .where('stripeSubscriptionId', '==', subscription.id)
          .limit(1)
          .get();

        if (usersSnapshot.empty) {
          console.error('⚠️ No user found with subscription ID:', subscription.id);
          break;
        }

        const userDoc = usersSnapshot.docs[0];
        const isPremium = ['active', 'trialing'].includes(subscription.status);
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

        await userDoc.ref.update({
          isPremium,
          subscriptionStatus: subscription.status,
          currentPeriodEnd,
          updatedAt: new Date(),
        });

        console.log(`🔄 Updated user ${userDoc.id}: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('❌ Subscription deleted:', subscription.id);

        const usersSnapshot = await db
          .collection('users')
          .where('stripeSubscriptionId', '==', subscription.id)
          .limit(1)
          .get();

        if (usersSnapshot.empty) {
          console.error('⚠️ No user found with subscription ID:', subscription.id);
          break;
        }

        const userDoc = usersSnapshot.docs[0];

        await userDoc.ref.update({
          isPremium: false,
          subscriptionStatus: 'canceled',
          updatedAt: new Date(),
        });

        console.log(`❌ User ${userDoc.id} downgraded to free`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`💰 Payment succeeded for invoice ${invoice.id}`);
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );

          const usersSnapshot = await db
            .collection('users')
            .where('stripeSubscriptionId', '==', subscription.id)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            await userDoc.ref.update({
              isPremium: true,
              subscriptionStatus: 'active',
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              updatedAt: new Date(),
            });
            console.log(`✅ Renewed subscription for user ${userDoc.id}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`⚠️ Payment failed for invoice ${invoice.id}`);

        if (invoice.subscription) {
          const usersSnapshot = await db
            .collection('users')
            .where('stripeSubscriptionId', '==', invoice.subscription as string)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            await userDoc.ref.update({
              subscriptionStatus: 'past_due',
              updatedAt: new Date(),
            });
            console.log(`⚠️ Marked user ${userDoc.id} as past_due`);
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
