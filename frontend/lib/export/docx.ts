// Docx exporter using docx library
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { marked } from 'marked';

export async function generateDocx(
  title: string,
  markdown: string,
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string[];
  }
): Promise<Buffer> {
  // Parse markdown to extract structure
  const tokens = marked.lexer(markdown);
  const paragraphs: Paragraph[] = [];

  // Add title
  if (title) {
    paragraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
      })
    );
  }

  // Convert markdown tokens to docx paragraphs
  for (const token of tokens) {
    if (token.type === 'heading') {
      const level = token.depth === 1 ? HeadingLevel.HEADING_1
                  : token.depth === 2 ? HeadingLevel.HEADING_2
                  : token.depth === 3 ? HeadingLevel.HEADING_3
                  : HeadingLevel.HEADING_4;

      paragraphs.push(
        new Paragraph({
          text: token.text,
          heading: level,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (token.type === 'paragraph') {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(token.text)],
          spacing: { after: 120 },
        })
      );
    } else if (token.type === 'list') {
      // Handle lists
      for (const item of token.items) {
        paragraphs.push(
          new Paragraph({
            text: `• ${item.text}`,
            spacing: { after: 60 },
          })
        );
      }
    } else if (token.type === 'code') {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: token.text,
              font: 'Courier New',
              size: 20,
            }),
          ],
          spacing: { before: 120, after: 120 },
        })
      );
    }
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
    creator: metadata?.author || 'SEO Platform',
    title: title,
    subject: metadata?.subject,
    keywords: metadata?.keywords?.join(', '),
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

export function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}
