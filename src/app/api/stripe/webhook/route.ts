import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// Initialize Stripe
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
      console.error('❌ No Stripe signature found in headers');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    console.log('✅ Signature found');

    // Verify webhook signature
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      console.log('✅ Webhook signature verified');
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log('📦 Event type:', event.type);
    console.log('📦 Event ID:', event.id);

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log('\n💳 ==========================================');
      console.log('💳 CHECKOUT SESSION COMPLETED');
      console.log('💳 ==========================================');
      console.log('Session ID:', session.id);
      console.log('Payment Status:', session.payment_status);
      console.log('Customer:', session.customer);
      console.log('Subscription:', session.subscription);
      console.log('Client Reference ID:', session.client_reference_id);
      console.log('Amount Total:', session.amount_total);

      const userId = session.client_reference_id;

      if (!userId) {
        console.error('❌ No client_reference_id in session');
        console.error('Session metadata:', JSON.stringify(session.metadata));
        return NextResponse.json({ error: 'No user ID provided' }, { status: 400 });
      }

      console.log('👤 User ID:', userId);

      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      if (!subscriptionId) {
        console.error('❌ No subscription ID in session');
        return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
      }

      console.log('🔍 Fetching subscription from Stripe...');
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const interval = subscription.items.data[0]?.price?.recurring?.interval;
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

      console.log('📅 Subscription interval:', interval);
      console.log('📅 Status:', subscription.status);
      console.log('📅 Current period end:', currentPeriodEnd.toISOString());

      // Check if user exists
      console.log('🔍 Checking Firestore for user...');
      
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        console.error('❌ User document not found:', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      console.log('✅ User found:', userDoc.data()?.email);

      // Update user with premium fields
      console.log('💾 Updating Firestore...');

      const updateData = {
        isPremium: true,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: subscription.status,
        subscriptionPlan: interval === 'year' ? 'yearly' : 'monthly',
        currentPeriodEnd: currentPeriodEnd,
        updatedAt: new Date(),
      };

      await userRef.update(updateData);

      console.log('\n✅ ==========================================');
      console.log('✅ SUCCESS! USER UPGRADED TO PREMIUM');
      console.log('✅ ==========================================');
      console.log('User ID:', userId);
      console.log('Email:', userDoc.data()?.email);
      console.log('Plan:', interval === 'year' ? 'yearly' : 'monthly');
      console.log('Expires:', currentPeriodEnd.toISOString());
      console.log('✅ ==========================================\n');

      return NextResponse.json({ 
        received: true, 
        success: true,
        userId,
        plan: updateData.subscriptionPlan
      });
    }

    // Handle subscription updated
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('🔄 Subscription updated:', subscription.id);

      const usersSnapshot = await db
        .collection('users')
        .where('stripeSubscriptionId', '==', subscription.id)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        const isPremium = ['active', 'trialing'].includes(subscription.status);

        await userDoc.ref.update({
          isPremium,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          updatedAt: new Date(),
        });

        console.log(`✅ Updated user ${userDoc.id}: ${subscription.status}`);
      }
    }

    // Handle subscription deleted
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('❌ Subscription canceled:', subscription.id);

      const usersSnapshot = await db
        .collection('users')
        .where('stripeSubscriptionId', '==', subscription.id)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];

        await userDoc.ref.update({
          isPremium: false,
          subscriptionStatus: 'canceled',
          updatedAt: new Date(),
        });

        console.log(`❌ User ${userDoc.id} downgraded to free`);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('\n❌ ==========================================');
    console.error('❌ WEBHOOK ERROR');
    console.error('❌ ==========================================');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('❌ ==========================================\n');

    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    );
  }
}
