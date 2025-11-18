import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe/server';
import prisma from '@/lib/db/prisma';
import Stripe from 'stripe';

// Disable body parsing for webhook
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = await constructWebhookEvent(body, signature);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        console.log('PaymentIntent succeeded:', event.data.object.id);
        break;

      case 'payment_intent.payment_failed':
        console.log('PaymentIntent failed:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { metadata, amount_total, client_reference_id } = session;

  if (!metadata || !client_reference_id) {
    console.error('Missing metadata or client_reference_id in session');
    return;
  }

  const orgId = client_reference_id;
  const packageId = metadata.packageId;

  try {
    // Get package details
    const creditPackage = await prisma.creditPackage.findUnique({
      where: { id: packageId },
    });

    if (!creditPackage) {
      console.error('Credit package not found:', packageId);
      return;
    }

    // Update wallet balance
    await prisma.$transaction(async (tx) => {
      // Update wallet
      await tx.creditWallet.upsert({
        where: { orgId },
        create: {
          orgId,
          balance: creditPackage.creditsAmount,
          lifetimeSpent: 0,
        },
        update: {
          balance: {
            increment: creditPackage.creditsAmount,
          },
        },
      });

      // Create transaction record
      await tx.creditTxn.create({
        data: {
          orgId,
          delta: creditPackage.creditsAmount,
          reason: 'PURCHASE',
          refId: session.id,
          metadata: {
            packageId: creditPackage.id,
            packageName: creditPackage.name,
            amountPaid: amount_total ? amount_total / 100 : 0,
            currency: 'USD',
            stripeSessionId: session.id,
          },
        },
      });

      // Log activity
      if (metadata.userId) {
        await tx.activityLog.create({
          data: {
            actorId: metadata.userId,
            orgId,
            action: 'CREDITS_PURCHASED',
            target: `package:${packageId}`,
            meta: {
              credits: creditPackage.creditsAmount,
              amount: amount_total ? amount_total / 100 : 0,
              stripeSessionId: session.id,
            },
          },
        });
      }
    });

    console.log(`Credits added: ${creditPackage.creditsAmount} to org ${orgId}`);
  } catch (error) {
    console.error('Error processing checkout session:', error);
    throw error;
  }
}
