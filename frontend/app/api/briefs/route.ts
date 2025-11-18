// API Route: Content Briefs
// POST /api/briefs - Create new brief
// GET /api/briefs - List briefs with filters

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/utils/response";

// GET /api/briefs - List briefs
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const clusterId = searchParams.get("clusterId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get user's orgs (getCurrentUser already includes org relations)
    const orgIds = [
      ...user.ownedOrgs.map((o) => o.id),
      ...user.orgMemberships.map((m) => m.org.id),
    ];

    // Build query
    const where: any = {
      project: {
        orgId: { in: orgIds },
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (clusterId) {
      where.clusterId = clusterId;
    }

    const [briefs, total] = await Promise.all([
      prisma.contentBrief.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          cluster: { select: { id: true, label: true } },
          targetKeyword: { select: { id: true, term: true } },
          drafts: { select: { id: true, status: true, version: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.contentBrief.count({ where }),
    ]);

    return apiResponse({
      briefs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error("Error fetching briefs:", error);
    return apiError(error.message || "Failed to fetch briefs", 500);
  }
}

// POST /api/briefs - Create new brief
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();
    const {
      projectId,
      clusterId,
      targetKeywordId,
      headings = [],
      entities = [],
      faq = [],
      internalLinks = [],
      externalRefs = [],
      recommendedWordCount,
    } = body;

    if (!projectId) {
      return apiError("Project ID is required", 400);
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        org: {
          OR: [
            { ownerUserId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
      },
    });

    if (!project) {
      return apiError("Project not found or access denied", 404);
    }

    // Create brief
    const brief = await prisma.contentBrief.create({
      data: {
        projectId,
        clusterId,
        targetKeywordId,
        headings,
        entities,
        faq,
        internalLinks,
        externalRefs,
        recommendedWordCount,
      },
      include: {
        project: { select: { id: true, name: true } },
        cluster: { select: { id: true, label: true } },
        targetKeyword: { select: { id: true, term: true } },
      },
    });

    return apiResponse(brief, 201);
  } catch (error: any) {
    console.error("Error creating brief:", error);
    return apiError(error.message || "Failed to create brief", 500);
  }
}
