// Background job worker for exports
import prisma from '@/lib/db/prisma';
import { uploadFile, generateExportKey } from '@/lib/storage/s3';
import { generateDocx, sanitizeFilename } from '@/lib/export/docx';
import { marked } from 'marked';
import crypto from 'crypto';

interface ExportJobPayload {
  draftId: string;
  format: 'MD' | 'HTML' | 'DOCX';
  orgId: string;
  projectId: string;
}

export async function processExportJob(jobId: string, payload: ExportJobPayload) {
  try {
    // Update job status to RUNNING
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    const { draftId, format, orgId, projectId } = payload;

    // Get draft
    const draft = await prisma.contentDraft.findUnique({
      where: { id: draftId },
      include: {
        brief: {
          include: {
            targetKeyword: true,
          },
        },
      },
    });

    if (!draft) {
      throw new Error('Draft not found');
    }

    let content: Buffer | string;
    let contentType: string;
    let fileExtension: string;

    switch (format) {
      case 'MD':
        content = draft.mdBody || '';
        contentType = 'text/markdown';
        fileExtension = 'md';
        break;

      case 'HTML':
        content = draft.htmlBody || marked(draft.mdBody || '');
        contentType = 'text/html';
        fileExtension = 'html';
        break;

      case 'DOCX':
        content = await generateDocx(
          draft.title || 'Untitled',
          draft.mdBody || '',
          {
            author: 'SEO Platform',
            keywords: draft.brief?.targetKeyword ? [draft.brief.targetKeyword.term] : [],
          }
        );
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileExtension = 'docx';
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Generate S3 key
    const key = generateExportKey(orgId, projectId, draftId, fileExtension);

    // Upload to S3
    const url = await uploadFile(key, content, contentType);

    // Calculate checksum
    const checksum = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');

    // Save export record
    const exportBundle = await prisma.exportBundle.create({
      data: {
        projectId,
        draftId,
        format,
        url,
        checksum,
      },
    });

    // Update job as complete
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'DONE',
        finishedAt: new Date(),
        result: {
          exportId: exportBundle.id,
          url,
          format,
        },
      },
    });

    return exportBundle;
  } catch (error) {
    // Mark job as failed
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
}
