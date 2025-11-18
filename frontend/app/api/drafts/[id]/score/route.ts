// API Route: Calculate SEO Score for Draft
// POST /api/drafts/:id/score - Calculate and update SEO score

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/utils/response";
import { calculateSEOScore } from "@/lib/seo/scoring";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("Unauthorized", 401);
    }

    // Get draft with brief
    const draft = await prisma.contentDraft.findFirst({
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
        brief: {
          select: {
            headings: true,
            entities: true,
            faq: true,
            recommendedWordCount: true,
          },
        },
      },
    });

    if (!draft) {
      return apiError("Draft not found or access denied", 404);
    }

    if (!draft.mdBody) {
      return apiError("Draft has no content to score", 400);
    }

    // Calculate SEO score
    const analysis = calculateSEOScore(
      draft.mdBody,
      draft.htmlBody || "",
      draft.title || "",
      draft.brief || undefined
    );

    // Update draft with score and checklist
    const updatedDraft = await prisma.contentDraft.update({
      where: { id: params.id },
      data: {
        seoScore: analysis.score,
        onpageChecklist: {
          checklist: analysis.checklist,
          summary: analysis.summary,
          lastCalculated: new Date().toISOString(),
        },
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

    return apiResponse({
      draft: updatedDraft,
      analysis,
    });
  } catch (error: any) {
    console.error("Error calculating SEO score:", error);
    return apiError(error.message || "Failed to calculate SEO score", 500);
  }
}
