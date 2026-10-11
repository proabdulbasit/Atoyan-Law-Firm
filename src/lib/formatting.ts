import type { Settings, FormattedArticle } from "./types";

/**
 * The whole product lives here. Every rule maps 1:1 to a step David already
 * does by hand, and every rule reads from `settings` — nothing is hardcoded,
 * so changing heading class or CTA text is a Settings edit, not a code
 * change.
 */
export function formatArticle(raw: string, settings: Settings): FormattedArticle {
  let text = raw;

  // 1. Strip long dashes (em/en dash), for clean typography.
  const dashMatches = text.match(/[—–]/g);
  const dashesStripped = dashMatches?.length ?? 0;
  text = text.replace(/\s*[—–]\s*/g, ", ");

  // 2. Strip stray HTML the model may have emitted.
  const hadHtml = /<[a-z][\s\S]*>/i.test(text);
  text = text.replace(/<[^>]+>/g, "");

  // 3. Split into blocks, detect "Section:" lines as headings, wrap in his class.
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  let headingsWrapped = 0;
  const withHeadings = blocks.map((block) => {
    const m = /^(?:Section:|#+\s*)(.+)$/.exec(block.split("\n")[0]);
    if (m) {
      headingsWrapped++;
      const heading = m[1].trim();
      const rest = block.split("\n").slice(1).join("\n").trim();
      return `<h3 class="${settings.heading_class}">${heading}</h3>${rest ? `\n<p>${rest}</p>` : ""}`;
    }
    return `<p>${block}</p>`;
  });

  // 4. Insert the CTA shortcode after N paragraphs (configurable).
  let ctaInserted = false;
  const out: string[] = [];
  let pCount = 0;
  for (const block of withHeadings) {
    out.push(block);
    if (block.startsWith("<p>")) {
      pCount++;
      if (pCount === settings.cta_after_paragraph && !ctaInserted) {
        out.push(settings.cta_shortcode);
        ctaInserted = true;
      }
    }
  }
  if (!ctaInserted) out.push(settings.cta_shortcode);

  let formatted = out.join("\n\n");

  // 5. Auto-link keywords to his dictionary — first occurrence only, matching
  //    his "I find the word and switch it" description, and never re-linking
  //    text already inside an anchor tag.
  let linksInserted = 0;
  for (const { keyword, url } of settings.keyword_links) {
    if (!keyword.trim()) continue;
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<!<a[^>]*>)\\b(${escaped})\\b(?!</a>)`, "i");
    if (re.test(formatted)) {
      formatted = formatted.replace(re, (match) => {
        linksInserted++;
        return `<a href="${url}">${match}</a>`;
      });
    }
  }

  return {
    raw,
    formatted,
    headings_wrapped: headingsWrapped,
    links_inserted: linksInserted,
    cta_inserted: ctaInserted,
    dashes_stripped: dashesStripped,
    html_stripped: hadHtml,
  };
}
