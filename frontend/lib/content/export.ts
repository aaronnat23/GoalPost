import { prisma } from '@/lib/db/prisma'
import { ExportFormat } from '@prisma/client'
import crypto from 'crypto'
import { marked } from 'marked'

const EXPORT_MIME: Record<ExportFormat, string> = {
  MD: 'text/markdown',
  HTML: 'text/html',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

interface ExportOptions {
  draftId: string
  format: ExportFormat
  actorUserId?: string
}

export async function createExportBundle({ draftId, format }: ExportOptions) {
  const draft = await prisma.contentDraft.findUnique({
    where: { id: draftId },
    include: {
      project: { select: { id: true, name: true } },
    },
  })

  if (!draft || !draft.mdBody) {
    throw new Error('Draft not found or missing markdown body')
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const baseSlug = (draft.title || draft.id || 'draft')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'draft'
  const filename = `${baseSlug}-v${draft.version}-${timestamp}.${format.toLowerCase()}`

  let fileContents = draft.mdBody
  let htmlBody = draft.htmlBody || null

  if (format === 'HTML') {
    htmlBody = marked.parse(draft.mdBody)
    fileContents = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<title>${draft.title || 'Draft'}</title>\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n</head>\n<body>\n${htmlBody}\n</body>\n</html>`
  }

  if (format === 'DOCX') {
    fileContents = draft.mdBody
  }

  const mimeType = EXPORT_MIME[format]
  const checksum = crypto.createHash('sha256').update(fileContents).digest('hex')
  const dataUrl = `data:${mimeType};base64,${Buffer.from(fileContents).toString('base64')}`

  const bundle = await prisma.exportBundle.create({
    data: {
      projectId: draft.projectId,
      draftId: draft.id,
      format,
      url: dataUrl,
      checksum,
    },
  })

  if (format === 'HTML' && htmlBody) {
    await prisma.contentDraft.update({
      where: { id: draft.id },
      data: { htmlBody },
    })
  }

  return {
    bundle,
    download: {
      filename,
      mimeType,
      content: fileContents,
    },
  }
}
