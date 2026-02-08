import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin
if (getApps().length === 0) {
  console.log('🔥 Initializing Firebase Admin for webhooks...');
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  console.log('✅ Firebase Admin initialized');
}

const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(req: NextRequest) {
  console.log('\n🔔 ==========================================');
  console.log('🔔 WEBHOOK RECEIVED');
  console.log('🔔 Time:', new Date().toISOString());
  console.log('🔔 ==========================================\n');

  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('❌ No Stripe signature');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      console.log('✅ Signature verified');
      console.log('📦 Event type:', event.type);
    } catch (err: any) {
      console.error('❌ Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log('\n💳 CHECKOUT COMPLETED');
      console.log('Session ID:', session.id);
      console.log('Client Reference ID:', session.client_reference_id);

      const userId = session.client_reference_id;

      if (!userId) {
        console.error('❌ No client_reference_id found!');
        return NextResponse.json({ error: 'No user ID' }, { status: 400 });
      }

      console.log('👤 User ID:', userId);

      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      if (!subscriptionId) {
        console.error('❌ No subscription ID');
        return NextResponse.json({ error: 'No subscription' }, { status: 400 });
      }

      console.log('🔍 Fetching subscription...');
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const interval = subscription.items.data[0]?.price?.recurring?.interval;
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

      console.log('📅 Plan:', interval);
      console.log('📅 Status:', subscription.status);

      // Update Firestore
      console.log('💾 Updating Firestore...');
      const userRef = db.collection('users').doc(userId);

      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        console.error('❌ User not found:', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      console.log('✅ User found:', userDoc.data()?.email);

      await userRef.update({
        isPremium: true,
        plan: 'premium', // 🔥 CRITICAL: Required for limits.ts to apply premium limits
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: subscription.status,
        subscriptionPlan: interval === 'year' ? 'yearly' : 'monthly',
        currentPeriodEnd: currentPeriodEnd,
        updatedAt: new Date(),
      });

      console.log('\n✅ ==========================================');
      console.log('✅ USER UPGRADED TO PREMIUM!');
      console.log('✅ User:', userId);
      console.log('✅ Email:', userDoc.data()?.email);
      console.log('✅ Plan:', interval);
      console.log('✅ ==========================================\n');

      return NextResponse.json({ success: true, userId });
    }

    // Handle other events...
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const usersSnapshot = await db
        .collection('users')
        .where('stripeSubscriptionId', '==', subscription.id)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        await userDoc.ref.update({
          isPremium: ['active', 'trialing'].includes(subscription.status),
          subscriptionStatus: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          updatedAt: new Date(),
        });
        console.log('✅ Updated subscription');
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const usersSnapshot = await db
        .collection('users')
        .where('stripeSubscriptionId', '==', subscription.id)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        await usersSnapshot.docs[0].ref.update({
          isPremium: false,
          subscriptionStatus: 'canceled',
          updatedAt: new Date(),
        });
        console.log('✅ Subscription canceled');
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('\n❌ WEBHOOK ERROR:', error.message);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
