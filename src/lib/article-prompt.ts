/**
 * Article rules the client can edit in Settings.
 * These control length, headlines, style, sources, and links.
 * The short firm-name box does not.
 */

export const DEFAULT_ARTICLE_WORD_COUNT = 2200;
export const DEFAULT_MAX_INTERNAL_LINKS = 6;

export const DEFAULT_ARTICLE_TITLE_RULE =
  "A strong SEO title built around the primary keyword.";

export const DEFAULT_ARTICLE_INTRO_RULE =
  "A short transition introduction immediately after the title.";

export const DEFAULT_ARTICLE_HEADING_RULE =
  "Bold, question-based headings such as How Can a [City] [Topic] Lawyer Help You Recover Your Pay? Use the page's own city and topic. Choose questions around actual search intent, including long-tail and local keywords.";

export const DEFAULT_ARTICLE_WRITING_RULE =
  "Short sentences and straightforward paragraphs. Active voice. Natural, human legal writing rather than generic SEO language.";

export const DEFAULT_ARTICLE_BANNED_RULE =
  "No em dashes. No canned AI-style headings, excessive bullet lists, repetitive conclusions, or artificial keyword stuffing. Original wording. Research sources for facts and law, but do not copy their language.";

export const DEFAULT_ARTICLE_RESEARCH_RULE =
  "For each topic, first research the current law and the competing pages for SEO purposes, but use that research only behind the scenes. Do not name, promote, quote, or link to competing law firms in the finished article.";

export const DEFAULT_ARTICLE_READER_RULE =
  "A client-focused perspective. The article should answer what an employee actually wants to know: whether something illegal happened, how much money may be owed, what evidence matters, what the employer might argue, how long the worker has to act, and what a lawyer can do.";

export const DEFAULT_ARTICLE_COMPETITOR_RULE =
  "No competitor law-firm links or promotional references.";

export const DEFAULT_ARTICLE_AUTHORITY_RULE =
  "For legal authority, prioritize California statutes, California courts, the California Civil Rights Department, the Labor Commissioner, DLSE, federal agencies, and reliable government statistics. Include current statutes, regulations, cases, enforcement information, and statistics when relevant.";

export interface ArticleRules {
  wordCount: number;
  maxLinks: number;
  linksOnly: boolean;
  titleRule: string;
  introRule: string;
  headingRule: string;
  writingRule: string;
  bannedRule: string;
  researchRule: string;
  readerRule: string;
  competitorRule: string;
  authorityRule: string;
  keywordLinks: { keyword: string; url: string }[];
}

export function defaultArticleRules(): ArticleRules {
  return {
    wordCount: DEFAULT_ARTICLE_WORD_COUNT,
    maxLinks: DEFAULT_MAX_INTERNAL_LINKS,
    linksOnly: false,
    titleRule: DEFAULT_ARTICLE_TITLE_RULE,
    introRule: DEFAULT_ARTICLE_INTRO_RULE,
    headingRule: DEFAULT_ARTICLE_HEADING_RULE,
    writingRule: DEFAULT_ARTICLE_WRITING_RULE,
    bannedRule: DEFAULT_ARTICLE_BANNED_RULE,
    researchRule: DEFAULT_ARTICLE_RESEARCH_RULE,
    readerRule: DEFAULT_ARTICLE_READER_RULE,
    competitorRule: DEFAULT_ARTICLE_COMPETITOR_RULE,
    authorityRule: DEFAULT_ARTICLE_AUTHORITY_RULE,
    keywordLinks: [],
  };
}

export function articleRulesFromSettings(settings?: {
  article_word_count?: number;
  max_internal_links?: number;
  links_only?: boolean;
  article_title_rule?: string;
  article_intro_rule?: string;
  article_heading_rule?: string;
  article_writing_rule?: string;
  article_banned_rule?: string;
  article_research_rule?: string;
  article_reader_rule?: string;
  article_competitor_rule?: string;
  article_authority_rule?: string;
  keyword_links?: { keyword: string; url: string }[];
} | null): ArticleRules {
  const base = defaultArticleRules();
  if (!settings) return base;
  const wordCount = Number(settings.article_word_count);
  const maxLinks = Number(settings.max_internal_links);
  return {
    wordCount: Number.isFinite(wordCount) && wordCount >= 300 ? wordCount : base.wordCount,
    maxLinks: Number.isFinite(maxLinks) && maxLinks >= 0 ? maxLinks : base.maxLinks,
    linksOnly: settings.links_only === true,
    titleRule: settings.article_title_rule?.trim() || base.titleRule,
    introRule: settings.article_intro_rule?.trim() || base.introRule,
    headingRule: settings.article_heading_rule?.trim() || base.headingRule,
    writingRule: settings.article_writing_rule?.trim() || base.writingRule,
    bannedRule: settings.article_banned_rule?.trim() || base.bannedRule,
    researchRule: settings.article_research_rule?.trim() || base.researchRule,
    readerRule: settings.article_reader_rule?.trim() || base.readerRule,
    competitorRule: settings.article_competitor_rule?.trim() || base.competitorRule,
    authorityRule: settings.article_authority_rule?.trim() || base.authorityRule,
    keywordLinks: (settings.keyword_links || []).filter((link) => link.keyword.trim() && link.url.trim()),
  };
}

export function formatArticleRules(rules: ArticleRules): string {
  const savedLinks = rules.keywordLinks
    .map((link) => `- Anchor: "${link.keyword.trim()}" → ${link.url.trim()}`)
    .join("\n");

  return `ARTICLE GENERATION RULES (edit these in Settings → Article generation):
- Length: approximately ${rules.wordCount} words unless a later client note asks for a different length. If an older instruction asks for 2,200–3,500 words, use ${rules.wordCount} instead.
- Title: ${rules.titleRule}
- Introduction: ${rules.introRule}
- Headings: ${rules.headingRule}
- Writing style: ${rules.writingRule}
- Do not: ${rules.bannedRule}
- Research: ${rules.researchRule}
- Reader: ${rules.readerRule}
- Competitors: ${rules.competitorRule}
- Legal authority: ${rules.authorityRule}
- Internal links: add at most ${rules.maxLinks} links.
${rules.linksOnly ? "Use only the saved links below. Do not add links from the older built-in list." : "Saved links below come first. Keep any older built-in anchors until they are replaced."}
${savedLinks || "- No extra saved links yet."}`;
}
