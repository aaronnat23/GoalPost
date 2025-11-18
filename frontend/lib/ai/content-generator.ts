// Content Generation Utilities
// Generate outlines and drafts using AI

import { AIProvider, AIMessage } from "./provider";

export interface OutlineSection {
  heading: string;
  level: number; // 1 = H1, 2 = H2, 3 = H3
  subheadings?: OutlineSection[];
}

export interface BriefData {
  targetKeyword?: { term: string };
  headings?: any[];
  entities?: any[];
  faq?: any[];
  internalLinks?: any[];
  externalRefs?: any[];
  recommendedWordCount?: number;
}

export interface ProjectSettings {
  tone?: string;
  targetAudience?: string;
  brandGuidelines?: any;
}

// Generate outline from brief
export async function generateOutline(
  provider: AIProvider,
  brief: BriefData,
  projectSettings?: ProjectSettings
): Promise<OutlineSection[]> {
  const keyword = brief.targetKeyword?.term || "topic";
  const tone = projectSettings?.tone || "NEUTRAL";
  const audience = projectSettings?.targetAudience || "general readers";
  const wordCount = brief.recommendedWordCount || 1500;

  // Extract entities
  const entities =
    brief.entities
      ?.map((e: any) => (typeof e === "string" ? e : e.term || e.name))
      .join(", ") || "";

  // Extract suggested headings from brief
  const briefHeadings =
    brief.headings
      ?.map((h: any) => (typeof h === "string" ? h : h.text || h.title))
      .join("\n- ") || "";

  const systemMessage = `You are an expert SEO content strategist. Create detailed article outlines that are comprehensive, well-structured, and optimized for search engines.`;

  const userMessage = `Create a detailed outline for an article about "${keyword}".

Requirements:
- Target keyword: ${keyword}
- Tone: ${tone.toLowerCase()}
- Target audience: ${audience}
- Target word count: ${wordCount} words
${entities ? `- Must cover these entities/topics: ${entities}` : ""}
${briefHeadings ? `\n- Suggested headings from research:\n- ${briefHeadings}` : ""}

${brief.faq && Array.isArray(brief.faq) && brief.faq.length > 0 ? `\nInclude an FAQ section addressing:\n${brief.faq.map((faq: any) => `- ${typeof faq === "string" ? faq : faq.question}`).join("\n")}` : ""}

Format the outline as a hierarchical structure using this format:
# Main Title (H1)
## Introduction (H2)
## Main Section 1 (H2)
### Subsection 1.1 (H3)
### Subsection 1.2 (H3)
## Main Section 2 (H2)
### Subsection 2.1 (H3)
## FAQ (if applicable) (H2)
## Conclusion (H2)

Ensure the outline is comprehensive, logical, and covers all important aspects of the topic.`;

  const messages: AIMessage[] = [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];

  const outlineText = await provider.generateText(messages, {
    maxTokens: 2000,
    temperature: 0.7,
  });

  // Parse outline text into structured format
  const outline = parseOutlineText(outlineText);
  return outline;
}

// Parse outline text into structured outline
function parseOutlineText(text: string): OutlineSection[] {
  const lines = text.split("\n").filter((line) => line.trim());
  const outline: OutlineSection[] = [];
  const stack: { section: OutlineSection; level: number }[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length;
    const heading = match[2].trim();

    const section: OutlineSection = { heading, level };

    // Find parent
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      outline.push(section);
    } else {
      const parent = stack[stack.length - 1].section;
      if (!parent.subheadings) parent.subheadings = [];
      parent.subheadings.push(section);
    }

    stack.push({ section, level });
  }

  return outline;
}

// Generate draft from outline
export async function generateDraft(
  provider: AIProvider,
  brief: BriefData,
  outline: OutlineSection[],
  projectSettings?: ProjectSettings
): Promise<string> {
  const keyword = brief.targetKeyword?.term || "topic";
  const tone = projectSettings?.tone || "NEUTRAL";
  const audience = projectSettings?.targetAudience || "general readers";
  const wordCount = brief.recommendedWordCount || 1500;

  // Extract entities
  const entities =
    brief.entities
      ?.map((e: any) => (typeof e === "string" ? e : e.term || e.name))
      .join(", ") || "";

  // Format outline for prompt
  const outlineText = formatOutlineForPrompt(outline);

  // Extract internal link suggestions
  const internalLinks =
    brief.internalLinks
      ?.map((link: any) => `- ${link.text || link.title}: ${link.url}`)
      .join("\n") || "";

  // Extract external references
  const externalRefs =
    brief.externalRefs
      ?.map((ref: any) => `- ${ref.title || ref.url}`)
      .join("\n") || "";

  const systemMessage = `You are an expert SEO content writer. Write high-quality, engaging articles that are optimized for search engines while providing genuine value to readers.

Writing guidelines:
- Write in a ${tone.toLowerCase()} tone
- Target audience: ${audience}
- Use clear, concise language
- Include relevant examples and explanations
- Structure content with proper headings
- Naturally incorporate key entities and topics
- Write in markdown format`;

  const userMessage = `Write a comprehensive article about "${keyword}" following this outline:

${outlineText}

Requirements:
- Target word count: ${wordCount} words
- Focus keyword: ${keyword}
${entities ? `- Naturally incorporate these topics: ${entities}` : ""}
${internalLinks ? `\n- Include these internal links where relevant:\n${internalLinks}` : ""}
${externalRefs ? `\n- Reference these sources where appropriate:\n${externalRefs}` : ""}

Content guidelines:
- Write engaging, informative content that provides real value
- Use a ${tone.toLowerCase()} tone appropriate for ${audience}
- Include practical examples and actionable advice
- Ensure smooth transitions between sections
- Start with a compelling introduction
- End with a strong conclusion that summarizes key points
- Use markdown formatting (headings, lists, bold, links)

Write the full article now in markdown format:`;

  const messages: AIMessage[] = [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];

  const draft = await provider.generateText(messages, {
    maxTokens: Math.ceil(wordCount * 2), // Rough token estimate
    temperature: 0.7,
  });

  return draft;
}

// Format outline for prompt
function formatOutlineForPrompt(
  outline: OutlineSection[],
  indent: string = ""
): string {
  let text = "";
  for (const section of outline) {
    const prefix = "#".repeat(section.level);
    text += `${indent}${prefix} ${section.heading}\n`;
    if (section.subheadings) {
      text += formatOutlineForPrompt(section.subheadings, indent);
    }
  }
  return text;
}

// Generate brief from keyword (simpler template-based approach for MVP)
export async function generateBriefFromKeyword(
  provider: AIProvider,
  keyword: string,
  projectSettings?: ProjectSettings
): Promise<Partial<BriefData>> {
  const systemMessage = `You are an SEO research assistant. Analyze keywords and suggest comprehensive content briefs.`;

  const userMessage = `Analyze the keyword "${keyword}" and provide a content brief.

Include:
1. Suggested H2 and H3 headings (at least 5 H2s)
2. Key entities/topics to cover (at least 8)
3. FAQ questions (at least 5)
4. Recommended word count
5. External reference suggestions

Format your response as JSON:
{
  "headings": ["heading1", "heading2", ...],
  "entities": ["entity1", "entity2", ...],
  "faq": ["question1?", "question2?", ...],
  "recommendedWordCount": 1500,
  "externalRefs": [{"title": "ref title", "url": "optional"}]
}`;

  const messages: AIMessage[] = [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];

  const response = await provider.generateText(messages, {
    maxTokens: 2000,
    temperature: 0.7,
  });

  try {
    // Extract JSON from response (it might be wrapped in markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const brief = JSON.parse(jsonMatch[0]);
      return brief;
    }
  } catch (error) {
    console.error("Error parsing AI response:", error);
  }

  // Fallback: return empty brief
  return {
    headings: [],
    entities: [],
    faq: [],
    recommendedWordCount: 1500,
    externalRefs: [],
  };
}
