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

    // Update partner opt-in to active
    const updated = await prisma.partnerOptin.update({
      where: { id },
      data: { active: true },
    });

    // Log the approval action
    await prisma.activityLog.create({
      data: {
        actorId: user.id,
        orgId: updated.orgId,
        action: 'PARTNER_APPROVED',
        target: `partner:${id}`,
        meta: {
          approvedBy: user.email,
          approvedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true, partner: updated });
  } catch (error) {
    console.error('Error approving partner:', error);
    return NextResponse.json(
      { error: 'Failed to approve partner' },
      { status: 500 }
    );
  }
}
