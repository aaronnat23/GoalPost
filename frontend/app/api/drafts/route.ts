// API Route: Content Drafts
// POST /api/drafts - Create new draft
// GET /api/drafts - List drafts with filters

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/utils/response";

// GET /api/drafts - List drafts
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const briefId = searchParams.get("briefId");
    const status = searchParams.get("status");
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

    if (briefId) {
      where.briefId = briefId;
    }

    if (status) {
      where.status = status;
    }

    const [drafts, total] = await Promise.all([
      prisma.contentDraft.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          brief: {
            select: {
              id: true,
              targetKeyword: { select: { term: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.contentDraft.count({ where }),
    ]);

    return apiResponse({
      drafts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error("Error fetching drafts:", error);
    return apiError(error.message || "Failed to fetch drafts", 500);
  }
}

// POST /api/drafts - Create new draft
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();
    const {
      projectId,
      briefId,
      title,
      mdBody,
      htmlBody,
      status = "DRAFT",
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

    // Calculate word count
    const wordCount = mdBody
      ? mdBody.split(/\s+/).filter((w: string) => w.length > 0).length
      : 0;

    // Create draft
    const draft = await prisma.contentDraft.create({
      data: {
        projectId,
        briefId,
        title,
        mdBody,
        htmlBody,
        wordCount,
        status,
        version: 1,
      },
      include: {
        project: { select: { id: true, name: true } },
        brief: {
          select: {
            id: true,
            targetKeyword: { select: { term: true } },
          },
        },
      },
    });

    return apiResponse(draft, 201);
  } catch (error: any) {
    console.error("Error creating draft:", error);
    return apiError(error.message || "Failed to create draft", 500);
  }
}
