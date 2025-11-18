import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { orgId, credits, reason } = body;

    if (!orgId || !credits || credits <= 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Grant credits in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update wallet
      const wallet = await tx.creditWallet.upsert({
        where: { orgId },
        create: {
          orgId,
          balance: credits,
          lifetimeSpent: 0,
        },
        update: {
          balance: {
            increment: credits,
          },
        },
      });

      // Create transaction record
      const txn = await tx.creditTxn.create({
        data: {
          orgId,
          delta: credits,
          reason: 'ADMIN_GRANT',
          metadata: {
            grantedBy: user.email,
            grantReason: reason || 'Manual admin grant',
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          orgId,
          action: 'CREDITS_GRANTED',
          target: `org:${orgId}`,
          meta: {
            credits,
            reason,
            grantedBy: user.email,
          },
        },
      });

      return { wallet, txn };
    });

    return NextResponse.json({
      success: true,
      balance: result.wallet.balance,
      transaction: result.txn,
    });
  } catch (error) {
    console.error('Error granting credits:', error);
    return NextResponse.json(
      { error: 'Failed to grant credits' },
      { status: 500 }
    );
  }
}
