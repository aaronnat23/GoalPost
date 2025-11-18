// API Route: Single Content Draft
// GET /api/drafts/:id - Get single draft
// PATCH /api/drafts/:id - Update draft
// DELETE /api/drafts/:id - Delete draft

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/utils/response";

type DraftRouteParams = { id: string };

async function resolveParams(
  params: DraftRouteParams | Promise<DraftRouteParams>
): Promise<DraftRouteParams> {
  return await params;
}

// GET /api/drafts/:id
export async function GET(
  request: NextRequest,
  context: { params: DraftRouteParams | Promise<DraftRouteParams> }
) {
  try {
    const { id } = await resolveParams(context.params);

    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("Unauthorized", 401);
    }

    const draft = await prisma.contentDraft.findFirst({
      where: {
        id,
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
        brief: {
          select: {
            id: true,
            targetKeyword: { select: { term: true } },
            headings: true,
            entities: true,
            faq: true,
            internalLinks: true,
            externalRefs: true,
            recommendedWordCount: true,
          },
        },
        calendarItems: {
          select: {
            id: true,
            startAt: true,
            status: true,
          },
        },
        exports: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!draft) {
      return apiError("Draft not found", 404);
    }

    return apiResponse(draft);
  } catch (error: any) {
    console.error("Error fetching draft:", error);
    return apiError(error.message || "Failed to fetch draft", 500);
  }
}

// PATCH /api/drafts/:id
export async function PATCH(
  request: NextRequest,
  context: { params: DraftRouteParams | Promise<DraftRouteParams> }
) {
  try {
    const { id } = await resolveParams(context.params);

    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();
    const {
      title,
      mdBody,
      htmlBody,
      status,
      seoScore,
      onpageChecklist,
      scheduledFor,
    } = body;

    // Verify access
    const existingDraft = await prisma.contentDraft.findFirst({
      where: {
        id,
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

    if (!existingDraft) {
      return apiError("Draft not found or access denied", 404);
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (mdBody !== undefined) {
      updateData.mdBody = mdBody;
      updateData.wordCount = mdBody
        .split(/\s+/)
        .filter((w: string) => w.length > 0).length;
    }
    if (htmlBody !== undefined) updateData.htmlBody = htmlBody;
    if (status !== undefined) updateData.status = status;
    if (seoScore !== undefined) updateData.seoScore = seoScore;
    if (onpageChecklist !== undefined)
      updateData.onpageChecklist = onpageChecklist;
    if (scheduledFor !== undefined) updateData.scheduledFor = scheduledFor;

    const draft = await prisma.contentDraft.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        brief: {
          select: {
            id: true,
            targetKeyword: { select: { term: true } },
          },
        },
        exports: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return apiResponse(draft);
  } catch (error: any) {
    console.error("Error updating draft:", error);
    return apiError(error.message || "Failed to update draft", 500);
  }
}

// DELETE /api/drafts/:id
export async function DELETE(
  request: NextRequest,
  context: { params: DraftRouteParams | Promise<DraftRouteParams> }
) {
  try {
    const { id } = await resolveParams(context.params);

    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("Unauthorized", 401);
    }

    // Verify access
    const draft = await prisma.contentDraft.findFirst({
      where: {
        id,
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

    if (!draft) {
      return apiError("Draft not found or access denied", 404);
    }

    await prisma.contentDraft.delete({
      where: { id },
    });

    return apiResponse({ message: "Draft deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting draft:", error);
    return apiError(error.message || "Failed to delete draft", 500);
  }
}
