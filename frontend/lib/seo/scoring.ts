// SEO Scoring Utility
// Calculates SEO score (0-100) and generates on-page checklist

export interface SEOChecklistItem {
  category: string;
  label: string;
  status: "pass" | "warning" | "fail";
  score: number;
  message: string;
}

export interface SEOAnalysisResult {
  score: number;
  checklist: SEOChecklistItem[];
  summary: {
    passed: number;
    warnings: number;
    failed: number;
  };
}

interface BriefData {
  headings?: any[];
  entities?: any[];
  faq?: any[];
  recommendedWordCount?: number;
}

export function calculateSEOScore(
  markdown: string,
  html: string,
  title?: string,
  brief?: BriefData
): SEOAnalysisResult {
  const checklist: SEOChecklistItem[] = [];
  let totalScore = 0;
  let maxScore = 0;

  // 1. Title Check (10 points)
  maxScore += 10;
  if (title && title.length > 0) {
    if (title.length >= 30 && title.length <= 60) {
      checklist.push({
        category: "Metadata",
        label: "Title Length",
        status: "pass",
        score: 10,
        message: `Title is ${title.length} characters (optimal: 30-60)`,
      });
      totalScore += 10;
    } else if (title.length > 0) {
      checklist.push({
        category: "Metadata",
        label: "Title Length",
        status: "warning",
        score: 5,
        message: `Title is ${title.length} characters (recommended: 30-60)`,
      });
      totalScore += 5;
    }
  } else {
    checklist.push({
      category: "Metadata",
      label: "Title",
      status: "fail",
      score: 0,
      message: "No title provided",
    });
  }

  // 2. Word Count (15 points)
  maxScore += 15;
  const wordCount = markdown
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const recommendedWordCount = brief?.recommendedWordCount || 1000;

  if (wordCount >= recommendedWordCount * 0.8) {
    checklist.push({
      category: "Content",
      label: "Word Count",
      status: "pass",
      score: 15,
      message: `${wordCount} words (target: ${recommendedWordCount})`,
    });
    totalScore += 15;
  } else if (wordCount >= recommendedWordCount * 0.5) {
    checklist.push({
      category: "Content",
      label: "Word Count",
      status: "warning",
      score: 8,
      message: `${wordCount} words (target: ${recommendedWordCount})`,
    });
    totalScore += 8;
  } else {
    checklist.push({
      category: "Content",
      label: "Word Count",
      status: "fail",
      score: 0,
      message: `Only ${wordCount} words (target: ${recommendedWordCount})`,
    });
  }

  // 3. Heading Structure (15 points)
  maxScore += 15;
  const h1Match = markdown.match(/^#\s+.+$/gm);
  const h2Match = markdown.match(/^##\s+.+$/gm);
  const h3Match = markdown.match(/^###\s+.+$/gm);

  const h1Count = h1Match ? h1Match.length : 0;
  const h2Count = h2Match ? h2Match.length : 0;
  const h3Count = h3Match ? h3Match.length : 0;

  if (h1Count === 1 && h2Count >= 3) {
    checklist.push({
      category: "Structure",
      label: "Heading Hierarchy",
      status: "pass",
      score: 15,
      message: `Good structure: 1 H1, ${h2Count} H2s, ${h3Count} H3s`,
    });
    totalScore += 15;
  } else if (h1Count >= 1 && h2Count >= 1) {
    checklist.push({
      category: "Structure",
      label: "Heading Hierarchy",
      status: "warning",
      score: 8,
      message: `${h1Count} H1, ${h2Count} H2s - consider adding more H2s`,
    });
    totalScore += 8;
  } else {
    checklist.push({
      category: "Structure",
      label: "Heading Hierarchy",
      status: "fail",
      score: 0,
      message: "Missing proper heading structure",
    });
  }

  // 4. Readability (10 points)
  maxScore += 10;
  const sentences = markdown.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgWordsPerSentence =
    sentences.length > 0 ? wordCount / sentences.length : 0;

  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
    checklist.push({
      category: "Readability",
      label: "Sentence Length",
      status: "pass",
      score: 10,
      message: `Avg ${avgWordsPerSentence.toFixed(1)} words/sentence (optimal: 10-20)`,
    });
    totalScore += 10;
  } else if (avgWordsPerSentence > 0) {
    checklist.push({
      category: "Readability",
      label: "Sentence Length",
      status: "warning",
      score: 5,
      message: `Avg ${avgWordsPerSentence.toFixed(1)} words/sentence`,
    });
    totalScore += 5;
  } else {
    checklist.push({
      category: "Readability",
      label: "Sentence Length",
      status: "fail",
      score: 0,
      message: "No sentences detected",
    });
  }

  // 5. Paragraph Structure (10 points)
  maxScore += 10;
  const paragraphs = markdown
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0 && !p.startsWith("#"));
  const avgWordsPerParagraph =
    paragraphs.length > 0 ? wordCount / paragraphs.length : 0;

  if (paragraphs.length >= 5 && avgWordsPerParagraph <= 150) {
    checklist.push({
      category: "Readability",
      label: "Paragraph Structure",
      status: "pass",
      score: 10,
      message: `${paragraphs.length} paragraphs, avg ${avgWordsPerParagraph.toFixed(0)} words`,
    });
    totalScore += 10;
  } else if (paragraphs.length >= 3) {
    checklist.push({
      category: "Readability",
      label: "Paragraph Structure",
      status: "warning",
      score: 5,
      message: `${paragraphs.length} paragraphs - consider breaking up longer ones`,
    });
    totalScore += 5;
  } else {
    checklist.push({
      category: "Readability",
      label: "Paragraph Structure",
      status: "fail",
      score: 0,
      message: "Too few paragraphs",
    });
  }

  // 6. Internal Links (10 points)
  maxScore += 10;
  const internalLinks = markdown.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
  const linkCount = internalLinks.length;

  if (linkCount >= 3) {
    checklist.push({
      category: "Links",
      label: "Internal Links",
      status: "pass",
      score: 10,
      message: `${linkCount} internal links`,
    });
    totalScore += 10;
  } else if (linkCount >= 1) {
    checklist.push({
      category: "Links",
      label: "Internal Links",
      status: "warning",
      score: 5,
      message: `${linkCount} links - add more for better SEO`,
    });
    totalScore += 5;
  } else {
    checklist.push({
      category: "Links",
      label: "Internal Links",
      status: "fail",
      score: 0,
      message: "No internal links found",
    });
  }

  // 7. Entity Coverage (15 points)
  maxScore += 15;
  if (brief?.entities && Array.isArray(brief.entities) && brief.entities.length > 0) {
    const entitiesCovered = brief.entities.filter((entity: any) => {
      const entityText = typeof entity === "string" ? entity : entity.term || entity.name;
      return markdown.toLowerCase().includes(entityText.toLowerCase());
    });
    const coverage = (entitiesCovered.length / brief.entities.length) * 100;

    if (coverage >= 80) {
      checklist.push({
        category: "Content",
        label: "Entity Coverage",
        status: "pass",
        score: 15,
        message: `${entitiesCovered.length}/${brief.entities.length} entities covered (${coverage.toFixed(0)}%)`,
      });
      totalScore += 15;
    } else if (coverage >= 50) {
      checklist.push({
        category: "Content",
        label: "Entity Coverage",
        status: "warning",
        score: 8,
        message: `${entitiesCovered.length}/${brief.entities.length} entities covered (${coverage.toFixed(0)}%)`,
      });
      totalScore += 8;
    } else {
      checklist.push({
        category: "Content",
        label: "Entity Coverage",
        status: "fail",
        score: 0,
        message: `Only ${entitiesCovered.length}/${brief.entities.length} entities covered`,
      });
    }
  }

  // 8. FAQ Section (10 points)
  maxScore += 10;
  const hasFAQHeading = markdown.toLowerCase().includes("faq") ||
                        markdown.toLowerCase().includes("frequently asked questions");

  if (brief?.faq && Array.isArray(brief.faq) && brief.faq.length > 0) {
    if (hasFAQHeading) {
      checklist.push({
        category: "Content",
        label: "FAQ Section",
        status: "pass",
        score: 10,
        message: `FAQ section included with ${brief.faq.length} questions`,
      });
      totalScore += 10;
    } else {
      checklist.push({
        category: "Content",
        label: "FAQ Section",
        status: "warning",
        score: 5,
        message: "Brief has FAQs but not clearly marked in content",
      });
      totalScore += 5;
    }
  } else {
    checklist.push({
      category: "Content",
      label: "FAQ Section",
      status: "warning",
      score: 5,
      message: "No FAQs in brief",
    });
    totalScore += 5;
  }

  // 9. Images/Media (5 points)
  maxScore += 5;
  const imageCount = (markdown.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []).length;

  if (imageCount >= 2) {
    checklist.push({
      category: "Media",
      label: "Images",
      status: "pass",
      score: 5,
      message: `${imageCount} images included`,
    });
    totalScore += 5;
  } else if (imageCount === 1) {
    checklist.push({
      category: "Media",
      label: "Images",
      status: "warning",
      score: 3,
      message: "1 image - consider adding more",
    });
    totalScore += 3;
  } else {
    checklist.push({
      category: "Media",
      label: "Images",
      status: "warning",
      score: 0,
      message: "No images found",
    });
  }

  // Calculate final score
  const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Count summary
  const summary = {
    passed: checklist.filter((item) => item.status === "pass").length,
    warnings: checklist.filter((item) => item.status === "warning").length,
    failed: checklist.filter((item) => item.status === "fail").length,
  };

  return {
    score: finalScore,
    checklist,
    summary,
  };
}

// API endpoint to calculate SEO score
export async function scoreDraft(draftId: string, brief?: BriefData) {
  // This would be called from an API route
  // For now, it's a utility function
  return {
    draftId,
    timestamp: new Date().toISOString(),
  };
}
