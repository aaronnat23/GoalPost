import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;

    // Get partner info before deletion for logging
    const partner = await prisma.partnerOptin.findUnique({
      where: { id },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Log the rejection action
    await prisma.activityLog.create({
      data: {
        actorId: user.id,
        orgId: partner.orgId,
        action: 'PARTNER_REJECTED',
        target: `partner:${id}`,
        meta: {
          rejectedBy: user.email,
          rejectedAt: new Date().toISOString(),
          domainsRequested: partner.domainsAllowed,
        },
      },
    });

    // Delete the partner opt-in request
    await prisma.partnerOptin.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting partner:', error);
    return NextResponse.json(
      { error: 'Failed to reject partner' },
      { status: 500 }
    );
  }
}
