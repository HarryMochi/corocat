import { NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe';
import { getFirestoreAdmin } from '../../../../lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const { userId, plan, resubscribe } = await req.json();

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const db = getFirestoreAdmin();
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return new NextResponse("User not found", { status: 404 });
        }

        const userData = userDoc.data();

        const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
        if (!priceId) {
            console.error('[STRIPE_CHECKOUT] STRIPE_PREMIUM_PRICE_ID is not set');
            return new NextResponse('Server misconfiguration: missing price ID', { status: 500 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL;
        const isResubscribe = !!resubscribe;

        const session = await stripe.checkout.sessions.create({
            // <-- Remove payment_method_types entirely for automatic methods
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${appUrl}/learn?success=true&session_id={CHECKOUT_SESSION_ID}&resubscribe=${isResubscribe ? '1' : '0'}`,
            cancel_url: `${appUrl}/?canceled=true`,
            customer_email: userData?.email ?? undefined,
            client_reference_id: userId,
            metadata: {
                userId,
                resubscribe: isResubscribe ? 'true' : 'false',
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('[STRIPE_CHECKOUT]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
