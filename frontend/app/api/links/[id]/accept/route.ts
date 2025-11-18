// API Route: Accept Internal Link Suggestion
// POST /api/links/:id/accept - Marks suggestion as accepted and injects markdown link

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiResponse } from "@/lib/utils/response";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("Unauthorized", 401);
    }

    const suggestion = await prisma.internalLinkSuggestion.findFirst({
      where: {
        id: params.id,
        fromDraft: {
          project: {
            org: {
              OR: [
                { ownerUserId: user.id },
                { members: { some: { userId: user.id } } },
              ],
            },
          },
        },
      },
      include: {
        fromDraft: {
          select: {
            id: true,
            mdBody: true,
          },
        },
        toDraft: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!suggestion) {
      return apiError("Suggestion not found", 404);
    }

    if (suggestion.accepted) {
      return apiResponse({ message: "Suggestion already accepted", suggestion });
    }

    const anchorText = suggestion.anchorText || suggestion.toDraft?.title || "Read more";
    const targetPath = `/dashboard/content/drafts/${suggestion.toDraftId}`;
    const linkMarkdown = `[${anchorText}](${targetPath})`;
    const insertion = `\n\n> Internal link idea: ${linkMarkdown}`;
    const updatedBody = `${suggestion.fromDraft.mdBody || ""}${insertion}`.trimEnd() + "\n";

    const newWordCount = updatedBody
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

    const [updatedSuggestion, updatedDraft] = await prisma.$transaction([
      prisma.internalLinkSuggestion.update({
        where: { id: suggestion.id },
        data: { accepted: true },
      }),
      prisma.contentDraft.update({
        where: { id: suggestion.fromDraftId },
        data: {
          mdBody: updatedBody,
          wordCount: newWordCount,
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
          exports: {
            orderBy: { createdAt: "desc" },
          },
        },
      }),
    ]);

    return apiResponse({ suggestion: updatedSuggestion, draft: updatedDraft });
  } catch (error: any) {
    console.error("Error accepting link suggestion:", error);
    return apiError(error.message || "Failed to accept link suggestion", 500);
  }
}
