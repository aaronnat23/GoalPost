import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const draftId = searchParams.get('draftId');
    const limit = parseInt(searchParams.get('limit') || '50');

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

    // Build filter
    const where: any = {
      project: {
        orgId: org.id,
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (draftId) {
      where.draftId = draftId;
    }

    // Fetch exports
    const exports = await prisma.exportBundle.findMany({
      where,
      include: {
        draft: {
          select: {
            id: true,
            title: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ exports });
  } catch (error) {
    console.error('Error fetching export history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export history' },
      { status: 500 }
    );
  }
}
