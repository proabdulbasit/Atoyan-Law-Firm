/**
 * Utility for substantive (reader-visible) word counting and quality criteria audit.
 * Strips HTML tags, script/style blocks, and HTML entities to evaluate true substantive depth.
 */

export interface AtoyanSectionCriteria {
  actual: number;
  target: number;
  passed: boolean;
  label: string;
}

export interface AtoyanWordAudit {
  servicesWords: number;
  howDoWords: number;
  compensationWords: number;
  faqWords: number;
  totalWords: number;
  meetsServicesCriteria: boolean; // Strict David Atoyan requirement: >= 2,200 pure words in Tab 2
  servicesDeficit: number; // Words needed to reach 2,200
  meetsTotalCriteria: boolean; // >= 3,500 total package words
  criteriaBreakdown: {
    services: AtoyanSectionCriteria;
    howDo: AtoyanSectionCriteria;
    compensation: AtoyanSectionCriteria;
    faq: AtoyanSectionCriteria;
    total: AtoyanSectionCriteria;
  };
}

/**
 * Strips all HTML tags, script/style blocks, and entity codes, returning pure visible words.
 */
/**
 * Keeps whole paragraphs and headings until the visible word count reaches the target.
 * Used when Settings asks for a shorter article than the model wrote.
 */
export function limitHtmlToWordCount(html: string, maxWords: number): string {
  if (!html || maxWords < 1) return html || "";
  if (countSubstantiveWords(html) <= Math.round(maxWords * 1.1)) return html;

  const parts = html.split(/(<\/p>|<\/h[1-6]>|<\/li>|<\/ul>|<\/ol>)/i);
  const chunks: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const piece = parts[i];
    const next = parts[i + 1];
    if (next && /^<\//i.test(next)) {
      chunks.push(piece + next);
      i++;
    } else if (piece) {
      chunks.push(piece);
    }
  }

  let out = "";
  let words = 0;
  for (const chunk of chunks) {
    const chunkWords = countSubstantiveWords(chunk);
    if (words > 80 && words + chunkWords > maxWords) break;
    out += chunk;
    words += chunkWords;
    if (words >= maxWords) break;
  }
  return out.trim() || html;
}

export function countSubstantiveWords(html: string): number {
  if (!html || typeof html !== "string") return 0;
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(/\s+/).length : 0;
}

/**
 * Calculates a complete substantive word audit across all 3 ACF tabs and the FAQ accordion.
 */
export function calculateWordAudit(content: {
  servicesContent?: string;
  howDoContent?: string;
  compensationIntro?: string;
  compensationContent?: string;
  faqs?: Array<{ question: string; answer: string }>;
}, targets?: { services?: number }): AtoyanWordAudit {
  const servicesWords = countSubstantiveWords(content.servicesContent || "");
  const howDoWords = countSubstantiveWords(content.howDoContent || "");
  const compRaw = content.compensationIntro || content.compensationContent || "";
  const compensationWords = countSubstantiveWords(compRaw);

  const faqText = (content.faqs || [])
    .map((f) => `${f.question} ${f.answer}`)
    .join(" ");
  const faqWords = countSubstantiveWords(faqText);

  const totalWords = servicesWords + howDoWords + compensationWords + faqWords;

  const SERVICES_TARGET = targets?.services && targets.services >= 300 ? targets.services : 2200;
  const HOW_DO_TARGET = 150;
  const COMPENSATION_TARGET = 150;
  const FAQ_TARGET = 1000;
  const TOTAL_TARGET = SERVICES_TARGET + HOW_DO_TARGET + COMPENSATION_TARGET + FAQ_TARGET;

  const meetsServicesCriteria = servicesWords >= SERVICES_TARGET;
  const servicesDeficit = Math.max(0, SERVICES_TARGET - servicesWords);
  const meetsTotalCriteria = totalWords >= TOTAL_TARGET;

  return {
    servicesWords,
    howDoWords,
    compensationWords,
    faqWords,
    totalWords,
    meetsServicesCriteria,
    servicesDeficit,
    meetsTotalCriteria,
    criteriaBreakdown: {
      services: {
        actual: servicesWords,
        target: SERVICES_TARGET,
        passed: meetsServicesCriteria,
        label: "Tab 2 Services Content",
      },
      howDo: {
        actual: howDoWords,
        target: HOW_DO_TARGET,
        passed: howDoWords >= HOW_DO_TARGET,
        label: "Tab 4 How Do Section",
      },
      compensation: {
        actual: compensationWords,
        target: COMPENSATION_TARGET,
        passed: compensationWords >= COMPENSATION_TARGET,
        label: "Tab 6 Compensation & Remedies",
      },
      faq: {
        actual: faqWords,
        target: FAQ_TARGET,
        passed: faqWords >= FAQ_TARGET,
        label: "FAQ 10-Question Accordion",
      },
      total: {
        actual: totalWords,
        target: TOTAL_TARGET,
        passed: meetsTotalCriteria,
        label: "Total Substantive Words",
      },
    },
  };
}
