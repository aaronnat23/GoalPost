// API Route: Internal Link Suggestions Listing
// GET /api/links?draftId=...

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/utils/response";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get("draftId");
    const includeDismissed = searchParams.get("includeDismissed") === "true";

    if (!draftId) {
      return apiError("draftId is required", 400);
    }

    const suggestions = await prisma.internalLinkSuggestion.findMany({
      where: {
        fromDraftId: draftId,
        ...(includeDismissed ? {} : { dismissed: false }),
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
        toDraft: {
          select: {
            id: true,
            title: true,
            status: true,
            projectId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse({ suggestions });
  } catch (error: any) {
    console.error("Error fetching link suggestions:", error);
    return apiError(error.message || "Failed to fetch link suggestions", 500);
  }
}
