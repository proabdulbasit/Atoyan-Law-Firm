import type { ArticleRules } from "./article-prompt";

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/$/, "").toLowerCase();
}

/** Removes em dashes and en dashes from visible article text. */
export function stripDashes(html: string): string {
  return (html || "")
    .replace(/&mdash;|&#8212;/gi, ", ")
    .replace(/&ndash;|&#8211;/gi, "-")
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s*–\s*/g, "-");
}

/**
 * When Settings says to use only the saved links, drop every other http link.
 * Phone links stay. A repeated saved URL is kept once.
 */
export function keepOnlySavedLinks(html: string, links: { keyword: string; url: string }[]): string {
  const allowed = new Set(links.map((link) => normalizeUrl(link.url)).filter(Boolean));
  const seen = new Set<string>();
  return (html || "").replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (full, href: string, inner: string) => {
    if (/^tel:/i.test(href)) return full;
    const key = normalizeUrl(href);
    if (!allowed.has(key) || seen.has(key)) return inner;
    seen.add(key);
    return full;
  });
}

/**
 * A heading needs a paragraph under it.
 * Two questions in a row read as one block, so a short sentence goes between them.
 */
export function separateStackedHeadings(html: string): string {
  const filler =
    "<p>The answer turns on the facts of the job and what the employer did after the worker spoke up.</p>";
  let out = (html || "").replace(/(<\/h[1-6]>)\s*(?=<h[1-6]\b)/gi, `$1\n${filler}\n`);
  if (/<\/h[1-6]>\s*$/i.test(out.trim())) out = `${out.trim()}\n${filler}\n`;
  return out;
}

/** Turns bullet lists into short paragraphs when Settings bans excessive lists. */
export function listsToParagraphs(html: string): string {
  return (html || "").replace(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_full, _tag: string, inner: string) => {
    const items = [...inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((match) => {
      const text = match[1].replace(/^\s*<p\b[^>]*>/i, "").replace(/<\/p>\s*$/i, "").trim();
      return text ? `<p>${text}</p>` : "";
    });
    return items.filter(Boolean).join("\n");
  });
}

function toQuestion(plain: string): string {
  let text = plain.replace(/\s+/g, " ").trim().replace(/[.]$/, "");
  text = text.replace(/^\d+\.\s*/, "");
  if (!text || text.endsWith("?")) return text;
  if (/^how\b/i.test(text) && !/^how (do|does|can|did|should|will|could|would)\b/i.test(text)) {
    text = text.replace(/^how\b/i, "How do");
  }
  if (!/^(how|what|when|where|why|who|can|do|does|did|is|are|should|will)\b/i.test(text)) {
    text = `What should you know about ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  }
  return `${text}?`;
}

/** Makes section headings questions when Settings asks for question headings. */
export function questionHeadings(html: string): string {
  return (html || "").replace(/<(h[23])\b([^>]*)>([\s\S]*?)<\/\1>/gi, (_full, tag: string, attrs: string, inner: string) => {
    const plain = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!plain || plain.endsWith("?")) return `<${tag}${attrs}>${plain || inner}</${tag}>`;
    return `<${tag}${attrs}>${toQuestion(plain)}</${tag}>`;
  });
}

export function questionHeadingText(heading: string): string {
  const plain = heading.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return heading;
  return toQuestion(plain);
}

/**
 * Keeps the callout, then two or three sentences, before the first section heading.
 */
export function shortenIntro(html: string): string {
  const source = html || "";
  const match = source.match(/<h[23]\b/i);
  if (!match || match.index === undefined) return source;
  const head = source.slice(0, match.index);
  const rest = source.slice(match.index);
  const callouts: string[] = [];
  const prose = head.replace(/<p\b[^>]*txt-hlt[\s\S]*?<\/p>/gi, (paragraph) => {
    callouts.push(paragraph);
    return " ";
  });
  const text = prose.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const sentences = text.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.trim().length > 0);
  const kept: string[] = [];
  let words = 0;
  for (const sentence of sentences) {
    const count = sentence.trim().split(/\s+/).length;
    if (count > 28) continue;
    if (kept.length >= 3 || words + count > 60) break;
    kept.push(sentence.trim());
    words += count;
  }
  const intro = kept.length ? `<p>${kept.join(" ")}</p>` : "";
  return [...callouts, intro, rest].filter((part) => part && part.trim()).join("\n");
}

/** Makes article links blue so a heading link does not disappear into the heading color. */
export function colorContentLinks(html: string): string {
  return (html || "").replace(/<a\b([^>]*\bhref=["']https?:[^"']+["'][^>]*)>/gi, (full, attrs: string) => {
    if (/\bstyle=/i.test(attrs)) {
      return full.replace(/\bstyle=(["'])([\s\S]*?)\1/i, (_m, q: string, css: string) => {
        const next = /color\s*:/i.test(css) ? css : `${css};color:#1a3d97;text-decoration:underline`;
        return `style=${q}${next}${q}`;
      });
    }
    return `<a${attrs} style="color:#1a3d97;text-decoration:underline">`;
  });
}
export function calloutsToNormalText(html: string): string {
  return (html || "").replace(/<p\b[^>]*\btxt-hlt\b[^>]*>([\s\S]*?)<\/p>/gi, (_full, inner: string) => {
    const text = String(inner).replace(/<\/?strong>/gi, "").trim();
    return `<p>${text}</p>`;
  });
}

export function shapeArticleHtml(html: string, rules: ArticleRules): string {
  let out = calloutsToNormalText(stripDashes(html));
  if (/excessive bullet/i.test(rules.bannedRule)) out = listsToParagraphs(out);
  if (/question/i.test(rules.headingRule)) out = questionHeadings(out);
  if (/two or three sentences|short transition/i.test(rules.introRule)) out = shortenIntro(out);
  if (rules.linksOnly) out = keepOnlySavedLinks(out, rules.keywordLinks);
  return out;
}

const AUTHORITY_SENTENCE =
  "California workers can take a retaliation claim to the Civil Rights Department, the Labor Commissioner, or the DLSE, and the deadline to act is short.";

const READER_SENTENCE =
  "A lawyer can look at whether the punishment was illegal, how much money may be owed, what evidence matters, what the employer may argue, and how long you have to act.";

/** Adds one short sentence when the article never covers the Settings authority or reader points. */
export function coverRequiredPoints(html: string, rules: ArticleRules): string {
  const text = (html || "").replace(/<[^>]+>/g, " ").toLowerCase();
  const additions: string[] = [];
  const needsAuthority =
    /civil rights department|labor commissioner|dlse/i.test(rules.authorityRule) &&
    !(/civil rights department/.test(text) && /labor commissioner|dlse/.test(text));
  const needsReader =
    /money|evidence|deadline|lawyer/i.test(rules.readerRule) &&
    !(/money/.test(text) && /evidence/.test(text) && /deadline|how long/.test(text) && /lawyer/.test(text));
  if (needsAuthority) additions.push(AUTHORITY_SENTENCE);
  if (needsReader) additions.push(READER_SENTENCE);
  if (!additions.length) return html || "";
  const block = `<p>${additions.join(" ")}</p>\n`;
  const heading = (html || "").match(/<\/h[23]>/i);
  if (heading && heading.index !== undefined) {
    const at = heading.index + heading[0].length;
    return `${html.slice(0, at)}\n${block}${html.slice(at)}`;
  }
  return `${html || ""}\n${block}`;
}
