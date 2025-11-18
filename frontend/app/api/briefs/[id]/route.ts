// API Route: Single Content Brief
// GET /api/briefs/:id - Get single brief
// PATCH /api/briefs/:id - Update brief
// DELETE /api/briefs/:id - Delete brief

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/utils/response";

// GET /api/briefs/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("PATCH /api/briefs/:id params", params);
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("Unauthorized", 401);
    }

    const brief = await prisma.contentBrief.findFirst({
      where: {
        id: params.id,
        project: {
          org: {
            OR: [
              { ownerUserId: user.id },
              { members: { some: { userId: user.id } } },
            ],
          },
        },
      },
      include: {
        project: { select: { id: true, name: true } },
        cluster: { select: { id: true, label: true } },
        targetKeyword: {
          select: {
            id: true,
            term: true,
            searchVolume: true,
            difficulty: true,
          },
        },
        drafts: {
          select: {
            id: true,
            version: true,
            status: true,
            seoScore: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!brief) {
      return apiError("Brief not found", 404);
    }

    return apiResponse(brief);
  } catch (error: any) {
    console.error("Error fetching brief:", error);
    return apiError(error.message || "Failed to fetch brief", 500);
  }
}

// PATCH /api/briefs/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();
    const resolvedId = params?.id || body?.id;

    if (!resolvedId) {
      return apiError("Brief ID is required", 400);
    }

    const {
      headings,
      entities,
      faq,
      internalLinks,
      externalRefs,
      recommendedWordCount,
      targetKeywordId,
      clusterId,
    } = body;

    // Verify access
    const existingBrief = await prisma.contentBrief.findFirst({
      where: {
        id: resolvedId,
        project: {
          org: {
            OR: [
              { ownerUserId: user.id },
              { members: { some: { userId: user.id } } },
            ],
          },
        },
      },
    });

    if (!existingBrief) {
      return apiError("Brief not found or access denied", 404);
    }

    // Build update data
    const updateData: any = {};
    if (headings !== undefined) updateData.headings = headings;
    if (entities !== undefined) updateData.entities = entities;
    if (faq !== undefined) updateData.faq = faq;
    if (internalLinks !== undefined) updateData.internalLinks = internalLinks;
    if (externalRefs !== undefined) updateData.externalRefs = externalRefs;
    if (recommendedWordCount !== undefined)
      updateData.recommendedWordCount = recommendedWordCount;
    if (targetKeywordId !== undefined)
      updateData.targetKeywordId = targetKeywordId;
    if (clusterId !== undefined) updateData.clusterId = clusterId;

    const brief = await prisma.contentBrief.update({
      where: { id: resolvedId },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        cluster: { select: { id: true, label: true } },
        targetKeyword: { select: { id: true, term: true } },
      },
    });

    return apiResponse(brief);
  } catch (error: any) {
    console.error("Error updating brief:", error);
    return apiError(error.message || "Failed to update brief", 500);
  }
}

// DELETE /api/briefs/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!params?.id) {
      return apiError("Brief ID is required", 400);
    }

    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("Unauthorized", 401);
    }

    // Verify access
    const brief = await prisma.contentBrief.findFirst({
      where: {
        id: params.id,
        project: {
          org: {
            OR: [
              { ownerUserId: user.id },
              { members: { some: { userId: user.id } } },
            ],
          },
        },
      },
    });

    if (!brief) {
      return apiError("Brief not found or access denied", 404);
    }

    await prisma.contentBrief.delete({
      where: { id: params.id },
    });

    return apiResponse({ message: "Brief deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting brief:", error);
    return apiError(error.message || "Failed to delete brief", 500);
  }
}
