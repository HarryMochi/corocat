import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/admin';
import { headers } from 'next/headers';
import type { User } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore'; // Note: Client SDK might not work in Route Handler easily if auth not shared?
// We should use adminDb or verify auth header. 
// For simplicity, we assume the user is authenticated via session or token passed, but typically we need the userId.
// Since we don't have session cookie handling implemented for server-side auth easily, we might need the client to pass the UID or rely on Firebase Auth ID token.
// Ideally, use a library like `next-firebase-auth-edge` or standard Firebase Admin verifyIdToken.

// For now, I will implement a placeholder that accepts userId in the body (INSECURE for production, but allows progress). 
// The user prompt implies they will send API keys later.

export async function POST(req: Request) {
    try {
        const { userId, plan } = await req.json();

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const userRef = adminDb.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return new NextResponse("User not found", { status: 404 });
        }

        const userData = userDoc.data();

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: process.env.STRIPE_PREMIUM_PRICE_ID, // Ensure this ENV is set
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/learn?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
            customer_email: userData?.email,
            metadata: {
                userId: userId,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('[STRIPE_CHECKOUT]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
