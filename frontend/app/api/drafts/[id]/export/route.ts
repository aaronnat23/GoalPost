// API Route: Export Draft Content
// POST /api/drafts/:id/export - Generate Markdown or HTML bundle and record history

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { apiResponse, apiError } from "@/lib/utils/response";
import { ExportFormat } from "@prisma/client";
import { createExportBundle } from "@/lib/content/export";
import { prisma } from "@/lib/db/prisma";

const EXPORT_MIME: Record<ExportFormat, string> = {
  MD: "text/markdown",
  HTML: "text/html",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

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
    const formatInput: string = body?.format || "MD";
    const format = formatInput.toUpperCase() as ExportFormat;

    if (!Object.values(ExportFormat).includes(format)) {
      return apiError("Invalid export format", 400);
    }

    const canAccess = await prisma.contentDraft.findFirst({
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
      select: { id: true },
    });

    if (!canAccess) {
      return apiError("Draft not found or access denied", 404);
    }

    const result = await createExportBundle({ draftId: canAccess.id, format });

    return apiResponse(result, 201);
  } catch (error: any) {
    console.error("Error exporting draft:", error);
    return apiError(error.message || "Failed to export draft", 500);
  }
}
