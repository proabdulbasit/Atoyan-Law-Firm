import { demoUrlForSlug, getAllTrackedArticles, type TrackedArticle } from "./article-tracker";
import { decomposeKeyword } from "./keyword-utils";

export interface ContextualCtaOptions {
  topic: string;
  city: string;
  position: "early" | "mid" | "closing";
  phoneLink?: string;
  phoneDisplay?: string;
}

const DEMO_SITE = "https://demo.wp-post.com";
const DEMO_CONTACT_URL = `${DEMO_SITE}/contact-us/`;
const DEMO_PHONE = "(323) 968-0000";
const DEMO_PHONE_LINK = "tel:3239680000";

/** Drops Tailwind classes pasted in from the previous site's editor. */
export function stripCopiedClasses(html: string): string {
  if (!html || !html.includes("class=")) return html;
  return html.replace(/\sclass="([^"]*)"/gi, (match, value: string) => {
    const copied =
      value.includes("[&+p]") ||
      value.includes("[&amp;+p]") ||
      value.includes("[&_strong") ||
      value.includes("[&amp;_strong") ||
      value.includes("prose-p:") ||
      value.includes("[&>p]") ||
      value.includes("[&amp;>p]") ||
      value.includes("text-box-trim") ||
      value.includes("text-super-primary") ||
      value.includes("marker:text-secondary") ||
      value.includes("has-inline-images") ||
      value.includes("reset interactable");
    return copied ? "" : match;
  });
}

/**
 * Removes call-to-action links and phone numbers that still point at the first project.
 */
export function rewriteLegacyProjectLinks(html: string): string {
  if (!html) return html;
  const rewritten = html
    .replace(/https?:\/\/(?:www\.)?atoyanlaw\.com\/practice-areas\/employment-law\/([a-z0-9-]+)\/?/gi, (_, slug: string) => demoUrlForSlug(slug))
    .replace(/https?:\/\/(?:www\.)?atoyanlaw\.com[^"'<\s]*/gi, DEMO_CONTACT_URL)
    .replace(/tel:8888070077/g, DEMO_PHONE_LINK)
    .replace(/tel:747888-?0077/g, DEMO_PHONE_LINK)
    .replace(/\(888\) 807-0077/g, DEMO_PHONE)
    .replace(/\bAtoyan Law Firm\b/g, "WP Post Project")
    .replace(/\bAtoyan Law\b/g, "WP Post Project")
    .replace(/\bDavid Atoyan\b/g, "the firm")
    .replace(/\(747\) 888-0077/g, DEMO_PHONE);
  return stripCopiedClasses(rewritten);
}

function siteCallout(message: string): string {
  return `<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>${message} <a href="${DEMO_CONTACT_URL}">Get a free consultation</a> or call <a href="${DEMO_PHONE_LINK}">${DEMO_PHONE}</a>.</strong></em></p>`;
}

/**
 * Callout for this site: free consultation, the demo phone, and the contact page.
 */
export function generateContextualCta(opts: ContextualCtaOptions): string {
  const { topic, city, position } = opts;
  const decomposed = decomposeKeyword(topic, city);
  const resolvedCity = decomposed.city;
  const cleanTopic = decomposed.cleanTopic;

  if (position === "early") {
    return siteCallout(`Need help with ${cleanTopic.toLowerCase()} in ${resolvedCity}? WP Post Project is ready to answer right now.`);
  }
  if (position === "mid") {
    return siteCallout(`WP Post Project gives comprehensive legal support for ${cleanTopic.toLowerCase()} matters in ${resolvedCity}.`);
  }
  return siteCallout(`Talk with WP Post Project about your ${cleanTopic.toLowerCase()} concern in ${resolvedCity}.`);
}

interface LinkingTarget {
  pattern: RegExp;
  url: string;
  anchorText: string;
  priority: number;
}

/**
 * Builds prioritized linking rules mapping natural conversational anchor phrases
 * to live WP Post Project hub pages and location-specific pages.
 */
export function buildLinkingTargets(currentSlug: string, city: string): LinkingTarget[] {
  const tracked = getAllTrackedArticles().filter((a) => a.slug !== currentSlug);
  const targets: LinkingTarget[] = [];

  // Helper to find URL by category or slug
  const findUrl = (category: string, preferCity = false): string => {
    if (preferCity && city) {
      const cityMatch = tracked.find(
        (a) => a.category === category && a.city?.toLowerCase() === city.toLowerCase()
      );
      if (cityMatch) return cityMatch.url;
    }
    const hub = tracked.find((a) => a.category === category && a.isHub);
    if (hub) return hub.url;
    const anyMatch = tracked.find((a) => a.category === category);
    return anyMatch && !anyMatch.url.includes("atoyanlaw.com") ? anyMatch.url : DEMO_CONTACT_URL;
  };

  // 1. Overtime Pay
  targets.push({
    pattern: /\b(not properly paid for overtime|unpaid overtime pay|overtime pay|overtime violation[s]?)\b/i,
    url: findUrl("overtime", true),
    anchorText: "not properly paid for overtime",
    priority: 10,
  });

  // 2. Workplace Retaliation
  targets.push({
    pattern: /\b(retaliation claim[s]?|workplace retaliation|retaliated against|employer retaliate[d]?)\b/i,
    url: findUrl("workplace_retaliation", true),
    anchorText: "retaliation claim",
    priority: 10,
  });

  // 3. Wrongful Termination
  targets.push({
    pattern: /\b(terminate their employment|wrongful termination lawyer|wrongful termination attorney|wrongfully terminated|unlawful termination)\b/i,
    url: findUrl("wrongful_termination", true),
    anchorText: "terminate their employment",
    priority: 10,
  });

  // 4. Sexual Harassment
  targets.push({
    pattern: /\b(sexual harassment lawyer|sexual harassment|hostile work environment)\b/i,
    url: findUrl("sexual_harassment", true),
    anchorText: "sexual harassment",
    priority: 9,
  });

  // 5. Race Discrimination
  targets.push({
    pattern: /\b(race discrimination lawyer|race discrimination|racial discrimination|racial harassment)\b/i,
    url: findUrl("race_discrimination", true),
    anchorText: "race discrimination",
    priority: 9,
  });

  // 6. Disability Discrimination
  targets.push({
    pattern: /\b(disability discrimination lawyer|disability discrimination|reasonable accommodation[s]?)\b/i,
    url: findUrl("disability", true),
    anchorText: "disability discrimination",
    priority: 9,
  });

  // 7. Meal and Rest Break Violations
  targets.push({
    pattern: /\b(meal and rest break violation[s]?|meal and rest breaks|missed meal break[s]?|missed break[s]?)\b/i,
    url: findUrl("meal_breaks", true),
    anchorText: "meal and rest break violations",
    priority: 8,
  });

  // 8. Wage Theft & Unpaid Wages
  targets.push({
    pattern: /\b(unpaid wages|wage theft|wage and hour violation[s]?)\b/i,
    url: findUrl("wage_theft", true),
    anchorText: "unpaid wages",
    priority: 8,
  });

  // 9. Family & Medical Leave
  targets.push({
    pattern: /\b(family and medical leave|cfra leave|fmla leave|medical leave)\b/i,
    url: findUrl("family_medical_leave", true),
    anchorText: "family and medical leave",
    priority: 8,
  });

  // 10. Whistleblower Protections
  targets.push({
    pattern: /\b(whistleblower retaliation|whistleblowing laws|whistleblower)\b/i,
    url: findUrl("workplace_retaliation", true),
    anchorText: "whistleblower retaliation",
    priority: 7,
  });

  // 11. Pregnancy Discrimination
  targets.push({
    pattern: /\b(pregnancy discrimination|maternity leave|pregnancy disability leave)\b/i,
    url: findUrl("pregnancy_discrimination", true),
    anchorText: "pregnancy discrimination",
    priority: 7,
  });

  return targets;
}

/**
 * Injects SEO internal links into HTML content without touching existing links, headings, or tag attributes.
 * Guarantees maximum SEO authority while strictly preventing self-linking or over-linking.
 */
export function injectInternalLinks(
  html: string,
  params: {
    currentSlug: string;
    city: string;
    maxLinks?: number;
  }
): string {
  const { currentSlug, city, maxLinks = 6 } = params;
  if (!html) return "";

  const targets = buildLinkingTargets(currentSlug, city);
  const usedUrls = new Set<string>();

  // Extract existing links to avoid duplicates
  const existingMatches = html.matchAll(/href=["']([^"']+)["']/gi);
  for (const m of existingMatches) {
    usedUrls.add(m[1].toLowerCase().replace(/\/$/, ""));
  }

  // Split HTML into tags and text chunks
  // Matches: <tag ...> or text
  const tokens = html.split(/(<[^>]+>)/g);
  let insideAnchor = false;
  let insideHeading = false;
  let insideCallout = false;
  let linksCount = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.startsWith("<")) {
      const tagLower = token.toLowerCase();
      if (tagLower.startsWith("<a ") || tagLower === "<a>") {
        insideAnchor = true;
      } else if (tagLower.startsWith("</a")) {
        insideAnchor = false;
      } else if (tagLower.includes("txt-hlt") || tagLower.includes("bg-bx")) {
        insideCallout = true;
      } else if (insideCallout && tagLower.startsWith("</p")) {
        insideCallout = false;
      } else if (/^<(h[1-6]|strong\s+class="h[1-6]|button)/.test(tagLower)) {
        insideHeading = true;
      } else if (/^<\/(h[1-6]|button)/.test(tagLower)) {
        insideHeading = false;
      }
      continue;
    }

    // Process text tokens only - skip headings, anchors, and callout boxes
    if (insideAnchor || insideHeading || insideCallout || linksCount >= maxLinks || !token.trim()) {
      continue;
    }

    // Attempt to match and replace targets in this text chunk
    for (const target of targets) {
      if (linksCount >= maxLinks) break;
      const cleanTargetUrl = target.url.replace(/\/$/, "").toLowerCase();
      if (usedUrls.has(cleanTargetUrl)) continue;

      const match = target.pattern.exec(token);
      if (match && match.index !== undefined) {
        const matchedText = match[0];
        const before = token.slice(0, match.index);
        const after = token.slice(match.index + matchedText.length);

        tokens[i] = `${before}<a href="${target.url}">${matchedText}</a>${after}`;
        usedUrls.add(cleanTargetUrl);
        linksCount++;
        break; // Advance to next text token to avoid double linking within same chunk
      }
    }
  }

  return rewriteLegacyProjectLinks(tokens.join(""));
}

/**
 * Formats Tab 4 "How Do I Know If I Have a Personal Injury Case" content
 * with strategic question-based internal linking matching David's exact phrasing.
 */
export function formatHowDoContentWithLinks(params: {
  topic: string;
  city: string;
  currentSlug: string;
}): string {
  const { topic, city, currentSlug } = params;
  const decomposed = decomposeKeyword(topic, city);
  const resolvedCity = decomposed.city;
  const cleanTopic = decomposed.cleanTopic;
  const lower = cleanTopic.toLowerCase();

  // Pick appropriate related internal link for the diagnostic question
  let retaliationUrl = `${DEMO_SITE}/california-retaliation-lawyer/`;
  const all = getAllTrackedArticles();
  const retMatch = all.find((a) => a.category === "workplace_retaliation" && a.city?.toLowerCase() === city.toLowerCase());
  if (retMatch && retMatch.slug !== currentSlug) {
    retaliationUrl = retMatch.url;
  }

  let coreQuestion = "How many hours did I work?";
  let diagnosticQuestions = `Was the employee exempt? What was the employee's regular rate? Was all working time recorded? Were meal periods actually taken? Did the employee work before or after the scheduled shift? Were bonuses or commissions paid? Did the employee work a seventh consecutive day? Did the <a href="${retaliationUrl}">employer retaliate after the employee complained?</a>`;

  if (lower.includes("wrongful") || lower.includes("termination") || lower.includes("fired")) {
    coreQuestion = "Was my termination illegal?";
    diagnosticQuestions = `Was the firing tied to a protected category like disability, race, gender, or age? Did the termination happen shortly after reporting harassment or requesting medical leave? Did the employer create false disciplinary write-ups to justify the discharge? Did the <a href="${retaliationUrl}">employer retaliate after the employee reported illegal conduct?</a>`;
  } else if (lower.includes("sexual") || lower.includes("quid pro quo") || lower.includes("sex harassment")) {
    coreQuestion = "Does this conduct qualify as actionable sexual harassment?";
    diagnosticQuestions = `Was the misconduct sexual in nature or gender-based? Did a supervisor condition job benefits on sexual favors? Were inappropriate messages, advances, or touching preserved? Did the <a href="${retaliationUrl}">employer retaliate after the employee reported the sexual harassment?</a>`;
  } else if (lower.includes("workplace harassment") || lower.includes("harass") || lower.includes("hostile")) {
    coreQuestion = "Does this conduct meet the California legal standard for actionable workplace harassment?";
    diagnosticQuestions = `Was the hostile conduct tied to a protected category like race, disability, religion, age, or sexual orientation? Was the behavior severe or pervasive enough to alter working conditions under FEHA § 12940(j)? Did management fail to take immediate corrective action under § 12940(k)? Did the <a href="${retaliationUrl}">employer retaliate after the employee opposed the hostile environment?</a>`;
  } else if (lower.includes("race") || lower.includes("racial")) {
    coreQuestion = "Was I treated differently because of my race or background?";
    diagnosticQuestions = `Were coworkers outside your protected group given better shifts or promotions? Did discipline escalate after you opposed racial jokes or remarks? Did the company violate the CROWN Act regarding natural hair or cultural traits? Did the <a href="${retaliationUrl}">employer retaliate after the employee complained of racial bias?</a>`;
  } else if (lower.includes("disability") || lower.includes("accommodation")) {
    coreQuestion = "Did my employer fail to accommodate my medical condition?";
    diagnosticQuestions = `Did the employer receive written medical restrictions from a doctor? Did the employer participate in a timely, good-faith interactive process? Could the essential job duties be performed with a reasonable accommodation? Did the <a href="${retaliationUrl}">employer retaliate after the employee requested accommodation?</a>`;
  } else if (lower.includes("whistleblower") || lower.includes("retaliat")) {
    coreQuestion = "Did my employer retaliate against me for reporting unlawful conduct?";
    diagnosticQuestions = `Did the employee reasonably believe the employer was violating state or federal law? Did the adverse action happen within 90 days of the report under Labor Code § 98.6 / SB 497? Did the employer fabricate pretextual performance excuses? Did the <a href="${retaliationUrl}">employer retaliate after the employee contacted authorities or HR?</a>`;
  } else if (lower.includes("leave") || lower.includes("cfra") || lower.includes("fmla")) {
    coreQuestion = "Was I wrongfully denied job-protected family or medical leave?";
    diagnosticQuestions = `Did the employee qualify under CFRA (Gov Code § 12945.2) or FMLA? Was the employee reinstated to the same or comparable position upon return? Did the employer count protected medical leave as unexcused absences? Did the <a href="${retaliationUrl}">employer retaliate after the employee requested leave?</a>`;
  }

  return `<p><b>${cleanTopic} cases can become complicated quickly.</b></p>
<p>The central question may seem simple: &ldquo;<b>${coreQuestion}</b>&rdquo;</p>
<p>But a proper legal analysis may require additional questions.</p>
<p>${diagnosticQuestions}</p>
<p>These details can significantly affect the outcome.</p>
<p>An attorney can examine the circumstances, identify potential violations, calculate possible compensation and damages, and discuss available legal options.</p>`;
}

/**
 * Formats Tab 6 "Compensation" content with employee rights, firm contact link, and native shortcode.
 */
export function formatCompensationContentWithLinks(params: {
  topic: string;
  city: string;
  accordionShortcode: string;
}): string {
  const { topic, city, accordionShortcode } = params;
  const decomposed = decomposeKeyword(topic, city);
  const resolvedCity = decomposed.city;
  const cleanTopic = decomposed.cleanTopic;
  const lower = cleanTopic.toLowerCase();

  let lawFocus = "California's employment laws";
  if (lower.includes("overtime") || lower.includes("wage") || lower.includes("break")) {
    lawFocus = "California's overtime and wage laws";
  } else if (lower.includes("wrongful") || lower.includes("termination")) {
    lawFocus = "California's wrongful termination and public policy laws";
  } else if (lower.includes("harass") || lower.includes("sexual")) {
    lawFocus = "California's Fair Employment and Housing Act (FEHA)";
  } else if (lower.includes("disability")) {
    lawFocus = "California's disability accommodation and civil rights laws";
  }

  return `<p>If you suffered workplace violations, California law may require your employer to compensate you for all damages, lost wages, and statutory penalties. And if those violations were willful, the employer may be liable for substantial interest and attorney fees.</p>
<p>Do not assume that an employer's internal explanation is always accurate. Do not assume that being salaried automatically makes you exempt from wage laws. And do not assume that a manager's verbal instructions override statutory employee protections.</p>
<p>${lawFocus} are designed to protect workers from suffering career and financial harm.</p>
<p>If you believe your workplace rights were violated in ${resolvedCity}, WP Post Project can help you evaluate your claim. <a href="/contact/">Contact</a> the firm to discuss what happened and learn what options may be available to you.</p>
\r\n${accordionShortcode}`;
}
