// API Route: Generate Outline from Brief
// POST /api/briefs/:id/generate-outline - Generate AI outline

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/utils/response";
import { getDefaultProvider } from "@/lib/ai/provider";
import { generateOutline } from "@/lib/ai/content-generator";
import { deductCredits, getActionCost, checkCredits } from "@/lib/credits/manager";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("Unauthorized", 401);
    }

    // Get brief with project and settings
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
        project: {
          include: {
            org: true,
            settings: true,
          },
        },
        targetKeyword: true,
      },
    });

    if (!brief) {
      return apiError("Brief not found or access denied", 404);
    }

    // Check credit cost
    const cost = await getActionCost("OUTLINE", 1);
    const hasCredits = await checkCredits(brief.project.orgId, cost);

    if (!hasCredits) {
      return apiError(
        `Insufficient credits. Required: ${cost} credits for outline generation.`,
        402
      );
    }

    // Generate outline using AI
    const provider = getDefaultProvider();

    const outlineData = {
      targetKeyword: brief.targetKeyword,
      headings: brief.headings,
      entities: brief.entities,
      faq: brief.faq,
      internalLinks: brief.internalLinks,
      externalRefs: brief.externalRefs,
      recommendedWordCount: brief.recommendedWordCount,
    };

    const projectSettings = brief.project.settings
      ? {
          tone: brief.project.settings.tone,
          targetAudience: brief.project.settings.targetAudience,
          brandGuidelines: brief.project.settings.brandGuidelines,
        }
      : undefined;

    const outline = await generateOutline(provider, outlineData, projectSettings);

    // Deduct credits
    await deductCredits(
      brief.project.orgId,
      cost,
      "Outline generation",
      brief.id,
      {
        briefId: brief.id,
        keyword: brief.targetKeyword?.term,
      }
    );

    return apiResponse({
      outline,
      cost,
      message: `Outline generated successfully. ${cost} credits deducted.`,
    });
  } catch (error: any) {
    console.error("Error generating outline:", error);

    if (error.name === "InsufficientCreditsError") {
      return apiError(error.message, 402);
    }

    return apiError(error.message || "Failed to generate outline", 500);
  }
}
