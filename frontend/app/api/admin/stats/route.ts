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

    // Get 7 days ago date
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch all statistics in parallel
    const [
      totalUsers,
      totalOrgs,
      totalCreditsData,
      activeProjects,
      failedJobs,
      signups7d,
      purchases7d,
      drafts7d,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total orgs
      prisma.org.count(),

      // Total credits issued and spent
      prisma.creditTxn.aggregate({
        _sum: {
          delta: true,
        },
      }),

      // Active projects
      prisma.project.count(),

      // Failed jobs
      prisma.job.count({
        where: {
          status: 'FAILED',
        },
      }),

      // Signups in last 7 days
      prisma.user.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),

      // Purchases in last 7 days
      prisma.creditTxn.count({
        where: {
          reason: 'PURCHASE',
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),

      // Drafts generated in last 7 days
      prisma.contentDraft.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
    ]);

    // Calculate total credits issued vs spent
    const allTxns = await prisma.creditTxn.findMany({
      select: {
        delta: true,
        reason: true,
      },
    });

    const totalCreditsIssued = allTxns
      .filter(t => t.delta > 0)
      .reduce((sum, t) => sum + t.delta, 0);

    const totalCreditsSpent = Math.abs(
      allTxns
        .filter(t => t.delta < 0)
        .reduce((sum, t) => sum + t.delta, 0)
    );

    const stats = {
      totalUsers,
      totalOrgs,
      totalCreditsIssued,
      totalCreditsSpent,
      activeProjects,
      failedJobs,
      recentActivity: {
        signups7d,
        purchases7d,
        draftsGenerated7d: drafts7d,
      },
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
