import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all partner opt-in requests with org details
    const requests = await prisma.partnerOptin.findMany({
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response
    const formattedRequests = requests.map(req => ({
      id: req.id,
      orgId: req.orgId,
      orgName: req.org.name,
      domainsAllowed: req.domainsAllowed,
      rules: req.rules as Record<string, any>,
      active: req.active,
      createdAt: req.createdAt.toISOString(),
    }));

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error('Error fetching partner requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partner requests' },
      { status: 500 }
    );
  }
}
