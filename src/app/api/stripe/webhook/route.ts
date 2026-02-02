import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/admin';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === 'checkout.session.completed') {
        if (!session?.metadata?.userId) {
            return new NextResponse('User id is required', { status: 400 });
        }

        // subscription info
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        await adminDb.collection('users').doc(session.metadata.userId).update({
            stripeCustomerId: session.customer as string,
            plan: 'premium',
            subscriptionStatus: 'active',
            // We might want to update limits here immediately, but limits logic calculates based on plan dynamically.
            // So changing 'plan' to 'premium' is enough for the logic to switch to Premium limits.
        });
    }

    if (event.type === 'invoice.payment_succeeded') {
        // Continue subscription
    }

    // Handle cancellations etc. (customer.subscription.deleted)
    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        // We need to find the user with this customer ID
        const usersSnap = await adminDb.collection('users').where('stripeCustomerId', '==', subscription.customer).limit(1).get();
        if (!usersSnap.empty) {
            const userDoc = usersSnap.docs[0];
            await userDoc.ref.update({
                plan: 'free',
                subscriptionStatus: 'canceled'
            });
        }
    }

    return new NextResponse(null, { status: 200 });
}
