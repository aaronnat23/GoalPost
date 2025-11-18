// API Route: Generate Draft from Brief
// POST /api/briefs/:id/generate-draft - Generate AI draft with credit deduction

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/utils/response";
import { getDefaultProvider } from "@/lib/ai/provider";
import { generateDraft, generateOutline } from "@/lib/ai/content-generator";
import { deductCredits, getActionCost, checkCredits } from "@/lib/credits/manager";
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

    const body = await request.json();
    const { outline, autoScore = true } = body;

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

    const wordCount = brief.recommendedWordCount || 1500;

    // Calculate credit costs
    const draftCost = await getActionCost("DRAFT", Math.ceil(wordCount / 1000));
    const scoreCost = autoScore ? await getActionCost("SEO_SCORE", 1) : 0;
    const totalCost = draftCost + scoreCost;

    // Check credits
    const hasCredits = await checkCredits(brief.project.orgId, totalCost);

    if (!hasCredits) {
      return apiError(
        `Insufficient credits. Required: ${totalCost} credits (${draftCost} for draft${autoScore ? ` + ${scoreCost} for SEO score` : ""}).`,
        402
      );
    }

    // Generate draft using AI
    const provider = getDefaultProvider();

    const briefData = {
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

    // If no outline provided, generate one first
    let outlineToUse = outline;
    if (!outlineToUse) {
      outlineToUse = await generateOutline(provider, briefData, projectSettings);
    }

    // Generate the draft
    const mdBody = await generateDraft(
      provider,
      briefData,
      outlineToUse,
      projectSettings
    );

    // Calculate word count
    const actualWordCount = mdBody
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

    // Generate title from first H1 or keyword
    const h1Match = mdBody.match(/^#\s+(.+)$/m);
    const title = h1Match
      ? h1Match[1]
      : brief.targetKeyword?.term || "Untitled Draft";

    // Calculate SEO score if requested
    let seoScore = null;
    let onpageChecklist = null;

    if (autoScore) {
      const analysis = calculateSEOScore(mdBody, "", title, briefData);
      seoScore = analysis.score;
      onpageChecklist = {
        checklist: analysis.checklist,
        summary: analysis.summary,
        lastCalculated: new Date().toISOString(),
      };
    }

    // Create draft in database
    const draft = await prisma.contentDraft.create({
      data: {
        projectId: brief.projectId,
        briefId: brief.id,
        title,
        mdBody,
        wordCount: actualWordCount,
        status: "DRAFT",
        seoScore,
        onpageChecklist,
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

    // Deduct credits
    await deductCredits(
      brief.project.orgId,
      totalCost,
      "Draft generation" + (autoScore ? " with SEO score" : ""),
      draft.id,
      {
        briefId: brief.id,
        draftId: draft.id,
        keyword: brief.targetKeyword?.term,
        wordCount: actualWordCount,
        draftCost,
        scoreCost,
      }
    );

    return apiResponse({
      draft,
      cost: totalCost,
      breakdown: {
        draft: draftCost,
        seoScore: scoreCost,
      },
      message: `Draft generated successfully. ${totalCost} credits deducted.`,
    });
  } catch (error: any) {
    console.error("Error generating draft:", error);

    if (error.name === "InsufficientCreditsError") {
      return apiError(error.message, 402);
    }

    return apiError(error.message || "Failed to generate draft", 500);
  }
}
