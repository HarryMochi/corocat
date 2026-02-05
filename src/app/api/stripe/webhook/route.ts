import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripeServer } from '../../../../lib/stripe-server';
import { getFirestoreAdmin } from '../../../../lib/firebase-admin';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  console.log('🔔 ============================================');
  console.log('🔔 WEBHOOK RECEIVED AT:', new Date().toISOString());
  console.log('🔔 ============================================');
  
  const body = await req.text();
  const stripe = getStripeServer();
  const signature = headers().get('stripe-signature');

  console.log('📝 Signature present:', signature ? '✅ YES' : '❌ NO');

  if (!signature) {
    console.error('❌ ERROR: No stripe-signature header found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('✅ Webhook signature verified successfully');
    console.log('📦 Event type:', event.type);
    console.log('📦 Event ID:', event.id);
  } catch (err: any) {
    console.error('❌ ============================================');
    console.error('❌ WEBHOOK SIGNATURE VERIFICATION FAILED');
    console.error('❌ Error:', err.message);
    console.error('❌ ============================================');
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const db = getFirestoreAdmin();

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('💳 ============================================');
      console.log('💳 CHECKOUT SESSION COMPLETED');
      console.log('💳 ============================================');
      console.log('Session ID:', session.id);
      console.log('Customer:', session.customer);
      console.log('Subscription:', session.subscription);
      console.log('Client Reference ID:', session.client_reference_id);
      console.log('Amount Total:', session.amount_total);
      console.log('Payment Status:', session.payment_status);

      const userId = session.client_reference_id;

      if (!userId) {
        console.error('❌ ============================================');
        console.error('❌ CRITICAL ERROR: No client_reference_id found!');
        console.error('❌ This means the user ID was not passed to Stripe');
        console.error('❌ Check your payment link includes client_reference_id');
        console.error('❌ ============================================');
        return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
      }

      console.log('👤 ============================================');
      console.log('👤 USER ID EXTRACTED:', userId);
      console.log('👤 ============================================');

      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      if (!subscriptionId) {
        console.error('❌ No subscription ID found in session');
        console.error('This might be a one-time payment instead of subscription');
        return NextResponse.json({ error: 'Missing subscription' }, { status: 400 });
      }

      console.log('🔍 Fetching subscription details from Stripe...');
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      const interval = subscription.items.data[0]?.price?.recurring?.interval;
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

      console.log('📅 ============================================');
      console.log('📅 SUBSCRIPTION DETAILS');
      console.log('📅 ============================================');
      console.log('Interval:', interval);
      console.log('Status:', subscription.status);
      console.log('Current period end:', currentPeriodEnd.toISOString());
      console.log('Plan:', interval === 'year' ? 'yearly' : 'monthly');

      // Check if user exists in Firestore
      console.log('🔍 ============================================');
      console.log('🔍 CHECKING FIRESTORE FOR USER...');
      console.log('🔍 ============================================');
      
      const userRef = db.collection('users').doc(userId);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        console.error('❌ ============================================');
        console.error('❌ CRITICAL ERROR: User document does NOT exist');
        console.error('❌ User ID:', userId);
        console.error('❌ Make sure user is created during signup');
        console.error('❌ ============================================');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userData = userSnap.data();
      console.log('✅ ============================================');
      console.log('✅ USER FOUND IN FIRESTORE');
      console.log('✅ ============================================');
      console.log('Email:', userData?.email);
      console.log('Display Name:', userData?.displayName);
      console.log('Current isPremium:', userData?.isPremium || false);

      // Update Firestore with premium status
      console.log('💾 ============================================');
      console.log('💾 UPDATING FIRESTORE...');
      console.log('💾 ============================================');
      
      await userRef.update({
        isPremium: true,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: subscription.status,
        subscriptionPlan: interval === 'year' ? 'yearly' : 'monthly',
        currentPeriodEnd: currentPeriodEnd,
        updatedAt: new Date(),
      });

      console.log('✅ ============================================');
      console.log('✅ ✅ ✅ SUCCESS! USER UPGRADED TO PREMIUM ✅ ✅ ✅');
      console.log('✅ ============================================');
      console.log('User ID:', userId);
      console.log('Email:', userData?.email);
      console.log('Plan:', interval === 'year' ? 'yearly' : 'monthly');
      console.log('isPremium: true');
      console.log('Expires:', currentPeriodEnd.toISOString());
      console.log('✅ ============================================');

      return NextResponse.json({ 
        received: true, 
        updated: true,
        userId: userId,
        plan: interval === 'year' ? 'yearly' : 'monthly'
      });
    }

    // Handle subscription updates
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

    // Handle subscription cancellation
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
    console.error('❌ ============================================');
    console.error('❌ ERROR PROCESSING WEBHOOK');
    console.error('❌ ============================================');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('❌ ============================================');
    
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}
