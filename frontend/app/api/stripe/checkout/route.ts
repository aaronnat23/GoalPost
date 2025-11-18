import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { createCheckoutSession } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID required' }, { status: 400 });
    }

    // Get package details
    const creditPackage = await prisma.creditPackage.findUnique({
      where: { id: packageId },
    });

    if (!creditPackage || !creditPackage.isActive) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    // Get user's org
    const org = await prisma.org.findFirst({
      where: {
        OR: [
          { ownerUserId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get or create Stripe price ID (in production, these would be pre-created in Stripe)
    const stripePriceId = (creditPackage as any).stripePriceId || 'price_test_' + packageId;

    // Create checkout session
    const baseUrl = request.headers.get('origin') || 'http://localhost:3000';
    const session = await createCheckoutSession({
      packageId: stripePriceId,
      orgId: org.id,
      userId: user.id,
      successUrl: `${baseUrl}/dashboard/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/dashboard/credits?canceled=true`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
