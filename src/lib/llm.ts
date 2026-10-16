import { buildLinkingCatalogForLlm, trackPublishedArticle } from "./article-tracker";
import { decomposeKeyword, extractCityFromText } from "./keyword-utils";
import { getTopicPromptBlueprint, getTopicEnrichmentModules } from "./topic-prompt-blueprints";
import { injectInternalLinks, formatHowDoContentWithLinks, formatCompensationContentWithLinks, rewriteLegacyProjectLinks } from "./seo-linking";
import {
  generateAtoyanSimulated,
  buildStatutoryDeadlineTableHtml,
  buildIndustryScenarios,
  buildEvidentiaryDeepDive,
  buildCorporateDefensePlaybook,
  buildDamagesAndRemediesAnalysis,
  buildAdministrativeRoadmap,
} from "./llm-simulated";
import type { Settings, AtoyanLegalContent, AtoyanFaq } from "./types";
import { resolveDefaultAccordionShortcode, ATOYAN_PHONE, ATOYAN_TOLL_FREE } from "./atoyan";
import { defaultArticleRules, formatArticleRules, type ArticleRules } from "./article-prompt";
import { colorContentLinks, coverRequiredPoints, keepOnlySavedLinks, questionHeadingText, separateStackedHeadings, shapeArticleHtml, shortenIntro } from "./article-enforce";
import { countSubstantiveWords, calculateWordAudit, limitHtmlToWordCount } from "./word-counter";
export { countSubstantiveWords, calculateWordAudit };

export interface ArticleResult {
  title: string;
  body: string;
  provider: string;
  model: string;
}

const GEMINI_MODELS = (process.env.GEMINI_MODEL ?? "gemini-2.5-flash,gemini-2.0-flash")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const OPENAI_MODELS = (process.env.OPENAI_MODEL ?? "gpt-4o,o3-mini,chatgpt-4o-latest")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function cleanApiKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim().replace(/^["'\s]+|["'\s]+$/g, "");
  return cleaned.length > 5 ? cleaned : undefined;
}

const SITE_SYSTEM_PROMPT = `
You write California employment law practice pages for this website.
Use a clear, direct voice for workers. Do not write as Atoyan Law, David Atoyan, or any previous client, and do not link to atoyanlaw.com.

PAGE RULES:

1. TITLE & DECOMPOSITION FORMULA:
   Hero title MUST follow this exact formula without keyword repetition or phrase doubling:
   "[City] [Topic] Employment Lawyers - [Subtopic/Action]"
   Examples:
   - "Burbank Wrongful Termination Employment Lawyers - Unlawful Firing"
   - "Glendale Race Discrimination Employment Lawyers - Workplace Bias"
   - "Burbank Sexual Harassment Employment Lawyers - Hostile Work Environment"
   - "Burbank Wage Theft Employment Lawyers - Unpaid Wages & Overtime"
   - "Visalia Meal and Rest Break Employment Lawyers - Labor Violations"
   - "Pasadena Disability Discrimination Employment Lawyers - Failure to Accommodate"
   - "Burbank Medical and Family Leave Employment Lawyers - CFRA Violations"
   - "Glendale Workplace Retaliation Employment Lawyers - Whistleblower Protection"
   NEVER double phrases like "Glendale Glendale Wrongful Termination Lawyer Lawyer". Isolate City and Topic cleanly.

2. CONVERSATIONAL, WORKER-FIRST TONE:
   Write in a clear, empathetic voice for California workers:
   - Use conversational, question-based H2/H3 subheadings written as direct questions that anxious California workers ask:
     e.g., "What is overtime under California law?", "When should a Burbank employee receive time-and-a-half pay?", "Can an employer require me to work overtime without paying me?", "What if my employer asks me to work off the clock?", "What if my employer says I am salaried?", "Can undocumented workers recover unpaid overtime?", "What if I was forced to quit?".
   - Include concrete arithmetic calculations and numbers for wage, overtime, meal/rest break, and waiting time scenarios:
     * $25.00/hour regular rate -> $37.50/hour overtime (1.5x), $50.00/hour double time (2.0x).
     * Off-the-clock cumulative math: 20 minutes/day off the clock unpaid = 1.5 hours/week = $3,600+ per year in stolen wages.
     * Labor Code § 226.7 break premiums: 1 hour regular rate per missed meal or rest break = $25 to $50/day = up to $11,000+ per year.
     * Labor Code § 203 waiting time penalties: up to 30 days of full wages = e.g., 30 days × 8 hours × $25/hr = $6,000 in statutory penalties on top of unpaid wages.
   - Explicitly highlight California Labor Code § 1171.5 protections for undocumented workers: all California workers have full legal rights and remedies under labor and civil rights statutes regardless of immigration status. Threats to report to ICE or contact immigration authorities violate Labor Code § 244 and constitute criminal extortion and actionable retaliation.

3. THREE UNIQUE CONTENT SECTIONS (ACF TABS 2, 4, 6):
   - 1ST: SERVICES CONTENT (Tab 2 - servicesContent):
     Must be MINIMUM 2,200 to 3,500+ pure words of deep, high-authority California employment legal analysis ("strictly huge content").
     The services section needs at least 2,200 words of pure substantive text (excluding HTML tags and callout boxes).
     Structure with:
       * Short punchy paragraphs (1-3 sentences max). No dense walls of text.
       * 14 direct question-based subheadings formatted with <h2 class="h2dav"> and <h3 class="h3dav">.
       * Each of the 14 question sections MUST contain 3 to 5 substantial paragraphs (160-200 words per heading) to guarantee 2,200+ total words.
       * Bold key phrases for readability (e.g. <strong>That timeline matters.</strong>, <strong>First</strong>, <strong>Second</strong>).
       * Bullet lists (<ul><li>...</li></ul>) and numbered lists (<ol><li>...</li></ol>).
       * 3 topic-specific callout boxes (Early, Mid, and Closing) using this styling:
         <p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><strong>[Text with phone (323) 968-0000 and contact link]</strong></p>
       * California statutory depth (FEHA Gov Code § 12940, CRD, Labor Code §§ 98.6, 201-203, 226, 226.7, 244, 510, 512, 1102.5, 1171.5, SB 497 90-day presumption, CROWN Act SB 188, case law).

     MANDATORY 7-SECTION LEGAL LITIGATION FRAMEWORK:
     * SECTION 1: STATUTORY FRAMEWORK & DEFINITIONS UNDER CALIFORNIA LAW
       Heading: <h2 class="h2dav">Understanding [Topic] Under California Law: Rights, Definitions, and Statutory Protections</h2>
       Detail FEHA Gov Code § 12940, protected classes, strict supervisor liability vs coworker negligence under Gov Code § 12940(j), Labor Code protections.
       Include Early Callout Box:
       <p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><strong>If your employer has subjected you to [topic] in [City], speak with a [City] [Topic] lawyer. <a href="/contact/">Contact the firm</a> for a free, confidential case evaluation.</strong></p>

     * SECTION 2: WORKPLACE MANIFESTATIONS & UNLAWFUL CONDUCT IN [CITY]
       Heading: <h2 class="h2dav">Common Forms of [Topic] in California Workplaces</h2>
       Subheadings with <h3 class="h3dav"> for Direct vs Disparate Impact, Adverse Actions, Hostile Work Environment standards.
       Include <ul> bullet list with 6-8 real-world workplace scenarios specific to the industry in [City] (entertainment, logistics, healthcare, tech, retail, hospitality).

     * SECTION 3: EMPLOYER PRETEXT, SHAM INVESTIGATIONS & PAPER TRAILS
       Heading: <h2 class="h2dav">How California Employers Mask [Topic]: Pretext, Paper Trails, and Sham HR Investigations</h2>
       Detail McDonnell Douglas / Guz v. Bechtel National burden-shifting, bogus write-ups right after complaints, sudden restructuring/RIFs, HR bias.
       Include Mid Callout Box:
       <p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><strong>Facing sudden write-ups, bogus disciplinary reviews, or employer retaliation in [City]? You have legal rights under California law. Our [City] [Topic] Lawyers are prepared to hold them accountable. <a href="tel:3239680000">Call (323) 968-0000</a> for an immediate consultation.</strong></p>

     * SECTION 4: WORKPLACE RETALIATION & CALIFORNIA'S STATUTORY 90-DAY PRESUMPTION
       Heading: <h2 class="h2dav">Workplace Retaliation Under California Law: Labor Code § 1102.5 & Senate Bill 497</h2>
       Analyze Labor Code § 1102.5, § 98.6, and SB 497's 90-day rebuttable presumption of retaliation. Contrast California's Lawson standard with federal law.

     * SECTION 5: EVIDENTIARY BLUEPRINT: HOW TO DOCUMENT & PROVE YOUR CASE
       Heading: <h2 class="h2dav">How to Document and Prove a [Topic] Claim in California</h2>
       Subheadings with <h3 class="h3dav"> on Documentary Evidence, Digital Communications, Comparator Evidence, and Journaling.
       Preserve emails, texts, Slack/Teams, paystubs. Caution regarding California Penal Code § 632 two-party consent wiretapping.

     * SECTION 6: ADMINISTRATIVE FILINGS & CRITICAL STATUTES OF LIMITATIONS
       Heading: <h2 class="h2dav">California Civil Rights Department (CRD), EEOC Filings, and Deadlines</h2>
       Explain Gov Code § 12960 administrative exhaustion with CRD, immediate Right-to-Sue, 3-year CRD filing deadline (Gov Code § 12960(e)), and 1 year to sue in Superior Court. Labor Commissioner / DLSE wage claim deadlines.

     * SECTION 7: RECOVERABLE DAMAGES AND FINANCIAL COMPENSATION
       Heading: <h2 class="h2dav">What Compensation and Financial Damages Can You Recover in California?</h2>
       Subheadings with <h3 class="h3dav"> covering Economic Damages, Non-Economic Damages, Punitive Damages (Civil Code § 3294), Statutory Attorneys' Fees (Gov Code § 12965(b)), and statutory penalties.
       Include Closing Callout Box:
       <p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><strong>[Topic] is an unacceptable violation of California labor protections. Don’t face your employer alone. <a href="/contact/">Contact a [City] [Topic] lawyer</a> to review the compensation you may be owed.</strong></p>

   - 2ND: HOW DO SECTION (Tab 4 - howDoHeading & howDoContent):
     Unique heading (e.g., "How Can a [City] [Topic] Lawyer Help?") and actionable guidance.
     Format with diagnostic questions including internal link:
     e.g., "Did the employer retaliate after the employee complained?"

   - 3RD: COMPENSATION SECTION (Tab 6 - compensationHeading & compensationIntro):
     Unique heading (e.g., "What Results and Compensation Can I Expect from a California [Topic] Claim?")
     Paragraph 1: Employee rights regarding this topic. Link only to pages on this website, never to atoyanlaw.com.
     Paragraph 2: Impact statement and topic-tailored CTA with phone <a href="tel:3239680000">(323) 968-0000</a>.
     Conclude with firm contact link:
     "If you believe your workplace rights were violated in [City], a lawyer can help you evaluate your claim. <a href="/contact/">Contact</a> the firm to discuss what happened and learn what options may be available to you."

4. 10-QUESTION HIGH-INTENT GOOGLE SEARCH FAQ STRUCTURE (MANDATORY):
   You MUST generate EXACTLY 10 practical, multi-paragraph FAQs for [Topic] in [City], strictly adhering to this searcher progression:
   1. What Qualifies as [Topic] in [City], California?
   2. What Are Common Examples of [Topic] at Work?
   3. Can I Sue My Employer for [Topic] in [City]?
   4. Can My Employer Fire Me for Reporting [Topic]? (or for [Topic]?)
   5. Can My Employer Retaliate Against Me for Reporting [Topic]? (Must cite Labor Code § 1102.5, § 98.6, and SB 497's 90-day statutory presumption)
   6. What Evidence Do I Need for a Workplace [Topic] Case? (Must include 7-step actionable checklist and EDD unemployment benefits with link to edd.ca.gov)
   7. Can I Have a [Topic] Case If My Coworker Violated My Rights Instead of My Boss?
   8. Do I Have to Report [Topic] to HR Before I Can Sue?
   9. How Long Do I Have to File a [Topic] Claim in California? (MUST include the responsive comparison table comparing FEHA 3 years, EEOC 300 days, Tameny 2 years, Written Contract 4 years, Oral Contract 2 years, Whistleblower § 1102.5 3 years, Wage Theft 3-4 years, Workers' Comp § 132a 1 year, and links to calcivilrights.ca.gov and leginfo.legislature.ca.gov)
   10. How Much Is a [Topic] Case Worth in California? (MUST conclude with a localized lawyer CTA that links to this site's /contact/ page. Do not name Atoyan Law or link to atoyanlaw.com.)

   Every FAQ answer MUST contain 2-3 substantive paragraphs of plain HTML.
   Use <p>, <ul>, <ol>, and <li> with no class attributes. Do not paste Tailwind classes.

5. DYNAMIC EASY ACCORDION & FAQS:
   Set "accordionShortcode" to "" (empty string) in your JSON output.
   DO NOT reuse old or hardcoded accordion IDs. The system dynamically renders and embeds native Easy Accordion HTML.

6. SEO METADATA:
   Yoast title (< 60 chars), meta description (< 160 chars), focus keyword, clean URL slug.

OUTPUT MUST BE VALID JSON with this exact schema:
{
  "keyword": "string",
  "city": "string",
  "slug": "string",
  "heroTitle": "string ([City] [Topic] Employment Lawyers - [Subtopic])",
  "servicesHeading": "string",
  "servicesSubHeading": "string",
  "servicesContent": "string (MINIMUM 2,200 pure words HTML formatted across 14 question headings <h2 class=\"h2dav\">Question?</h2> with 3-5 substantial paragraphs each, excluding callout boxes and HTML tags)",
  "howDoHeading": "string",
  "howDoContent": "string",
  "compensationHeading": "string",
  "compensationIntro": "string (Rights intro and topic CTA with (323) 968-0000)",
  "accordionShortcode": "string (leave empty \"\" for dynamic creation)",
  "faqs": [
    {
      "question": "string",
      "answer": "string (2-3 paragraphs; FAQ 9 must contain deadline table, FAQ 10 must end with Talk to a [City] [Topic] Lawyer CTA block)"
    }
  ],
  "yoastTitle": "string",
  "yoastMetaDesc": "string",
  "yoastFocusKw": "string"
}
`;

/**
 * Extracts city from keyword or defaults to California.
 * Utilizes the comprehensive 200+ California cities catalog and dynamic location fallback.
 */
export function extractCity(keyword: string): string {
  return extractCityFromText(keyword);
}

// countSubstantiveWords and calculateWordAudit are imported & re-exported from ./word-counter

/**
 * Enforces attorney David Atoyan's strict 2,200+ pure word requirement on servicesContent.
 * If the generated HTML contains fewer than 2,200 words, it automatically appends
 * deep California employment litigation modules to guarantee compliance.
 */
export function enforceMinimumServicesWordCount(
  servicesHtml: string,
  topic: string,
  city: string,
  minWords = 2200,
): string {
  let enriched = servicesHtml || "";
  let words = countSubstantiveWords(enriched);

  if (words >= minWords) {
    return enriched;
  }

  console.log(`[Atoyan LLM] servicesContent has ${words} words (< ${minWords} target). Auto-enriching with California legal modules...`);

  const decomposed = decomposeKeyword(topic, city);
  const topicKey = decomposed.topicKey;
  const cleanTopic = decomposed.cleanTopic;
  const resolvedCity = decomposed.city || city;

  // 1. Topic-bespoke modules first (guarantees 100% unique practice area coverage)
  const topicModules = getTopicEnrichmentModules(topicKey, cleanTopic, resolvedCity);
  for (const mod of topicModules) {
    if (words >= minWords) break;
    const h2Match = mod.match(/<h2[^>]*>(.*?)<\/h2>/i);
    const heading = h2Match ? h2Match[1].replace(/<[^>]+>/g, "").trim().toLowerCase() : "";
    if (heading && enriched.toLowerCase().includes(heading.slice(0, 30))) {
      continue;
    }
    enriched = enriched.trim() + "\n\n" + mod;
    words = countSubstantiveWords(enriched);
  }

  // 2. If still under target, append contextualized damages & industry modules
  if (words < minWords) {
    const fallbackModules = [
      buildDamagesAndRemediesAnalysis(cleanTopic, resolvedCity),
      buildAdministrativeRoadmap(cleanTopic, resolvedCity),
      buildIndustryScenarios(cleanTopic, resolvedCity),
    ];

    for (const mod of fallbackModules) {
      if (words >= minWords) break;
      const h2Match = mod.match(/<h2[^>]*>(.*?)<\/h2>/i);
      const heading = h2Match ? h2Match[1].replace(/<[^>]+>/g, "").trim().toLowerCase() : "";
      if (heading && enriched.toLowerCase().includes(heading.slice(0, 30))) {
        continue;
      }
      enriched = enriched.trim() + "\n\n" + mod;
      words = countSubstantiveWords(enriched);
    }
  }

  console.log(`[Atoyan LLM] servicesContent enriched to ${words} words (Target: ${minWords}+).`);
  return enriched;
}

/**
 * Puts each saved Settings link in its own later paragraph.
 * The opening paragraph stays free of those links.
 */
function ensureSavedLinks(html: string, links: { keyword: string; url: string }[]): string {
  let out = html || "";
  const saved = links
    .map((link) => ({ phrase: link.keyword.trim(), url: link.url.trim() }))
    .filter((link) => link.phrase && link.url);

  saved.forEach((link, index) => {
    const escaped = link.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`<a\\b[^>]*>([^<]*\\b${escaped}\\b[^<]*)</a>`, "gi"), "$1");
    const parts = out.split(/(<p\b[^>]*>[\s\S]*?<\/p>)/gi);
    const paragraphIndexes = parts
      .map((part, partIndex) => (/^<p\b/i.test(part) ? partIndex : -1))
      .filter((partIndex) => partIndex >= 0)
      .slice(1);
    const slot = paragraphIndexes[Math.min(index * 2, Math.max(0, paragraphIndexes.length - 1))];
    const sentence = /consult/i.test(link.phrase)
      ? `You can request a <a href="${link.url}">${link.phrase}</a> before you decide on the next step.`
      : `A <a href="${link.url}">${link.phrase}</a> claim can come from the same events.`;
    if (slot === undefined) {
      out = `${out}\n<p>${sentence}</p>`;
      return;
    }
    const searchFrom = paragraphIndexes.slice(paragraphIndexes.indexOf(slot));
    let placed = false;
    for (const partIndex of searchFrom) {
      const plain = parts[partIndex].replace(/<[^>]+>/g, " ");
      if (!new RegExp(`\\b${escaped}\\b`, "i").test(plain)) continue;
      parts[partIndex] = parts[partIndex].replace(
        new RegExp(`\\b(${escaped})\\b`, "i"),
        `<a href="${link.url}">$1</a>`,
      );
      placed = true;
      break;
    }
    if (!placed) {
      parts[slot] = `${parts[slot]}\n<p>${sentence}</p>`;
    }
    out = parts.join("");
  });
  return out;
}

/**
 * Validates and normalizes parsed LLM output, falling back to guaranteed high-quality defaults for any missing fields.
 */
function validateAndNormalizeAtoyanContent(
  raw: unknown,
  keyword: string,
  city: string,
  rules: ArticleRules = defaultArticleRules(),
): AtoyanLegalContent {
  const decomposed = decomposeKeyword(keyword, city);
  const resolvedCity = decomposed.city;
  const cleanTopic = decomposed.cleanTopic;
  const sim = generateAtoyanSimulated(keyword, resolvedCity);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return sim;
  }

  const obj = raw as Record<string, unknown>;

  const faqs: AtoyanFaq[] =
    Array.isArray(obj.faqs) && obj.faqs.length > 0
      ? obj.faqs
          .filter((f) => f && typeof f === "object")
          .map((f) => {
            const item = f as Record<string, unknown>;
            return {
              question: String(item.question || "").trim(),
              answer: String(item.answer || "").trim(),
            };
          })
          .filter((f) => f.question && f.answer)
      : sim.faqs;

  const finalFaqs = faqs.length > 0 ? faqs : sim.faqs;

  const validatedCity = decomposed.isArticle
    ? "California"
    : typeof obj.city === "string" && obj.city && obj.city.toLowerCase() !== "california"
    ? obj.city
    : resolvedCity;

  // Enforce canonical slug from decomposed keyword to eliminate collisions & malformed URLs
  let finalSlug = decomposed.slug;

  let rawServices = typeof obj.servicesContent === "string" && obj.servicesContent ? obj.servicesContent : sim.servicesContent;
  rawServices = shapeArticleHtml(rawServices, rules);

  // Pad only when the draft is shorter than Settings. A long draft is cut to the Settings length.
  if (countSubstantiveWords(rawServices) < rules.wordCount) {
    rawServices = enforceMinimumServicesWordCount(rawServices, cleanTopic, validatedCity, rules.wordCount);
  }
  rawServices = limitHtmlToWordCount(rawServices, rules.wordCount);

  // Guarantee internal SEO linking on services content
  let linkedServices = ensureSavedLinks(
    injectInternalLinks(rawServices, {
      currentSlug: finalSlug,
      city: validatedCity,
      maxLinks: rules.maxLinks,
      extraLinks: rules.keywordLinks,
      linksOnly: rules.linksOnly,
    }),
    rules.keywordLinks,
  );
  if (rules.linksOnly) linkedServices = keepOnlySavedLinks(linkedServices, rules.keywordLinks);

  // Built-in how-do links are skipped when Settings says to use only the saved links.
  let finalHowDoContent = typeof obj.howDoContent === "string" && obj.howDoContent ? obj.howDoContent : sim.howDoContent;
  if (!rules.linksOnly && (!finalHowDoContent.includes("<a href=") || !finalHowDoContent.includes("retaliat"))) {
    finalHowDoContent = formatHowDoContentWithLinks({
      topic: cleanTopic,
      city: validatedCity,
      currentSlug: finalSlug,
    });
  }
  finalHowDoContent = shapeArticleHtml(finalHowDoContent, rules);

  // Guarantee Compensation Section has clean editorial intro and contact link (no raw HTML accordions)
  let rawCompIntro = typeof obj.compensationIntro === "string" && obj.compensationIntro ? obj.compensationIntro : sim.compensationIntro;
  let finalCompIntro = rawCompIntro
    .replace(/<div\s+id=["']sp-ea-[\s\S]*$/i, "")
    .replace(/<div\s+class=["'][^"']*sp-easy-accordion[\s\S]*$/i, "")
    .replace(/\[sp_easyaccordion\s+id=["']?\d+["']?\]/gi, "")
    .trim();

  finalCompIntro = shapeArticleHtml(finalCompIntro, rules);
  if (!rules.linksOnly && !finalCompIntro.includes('href="/contact/"') && !finalCompIntro.includes('href="https://demo.wp-post.com/contact-us/"')) {
    finalCompIntro = finalCompIntro + " If you believe your rights were violated in " + resolvedCity + ', <a href="/contact/">contact the firm</a> to discuss what happened.';
  }

  // Guarantee Question 9 contains David Atoyan's statutory deadline comparison table
  if (finalFaqs.length >= 9) {
    const q9 = finalFaqs[8];
    if (!q9.answer.includes("<table")) {
      q9.answer = q9.answer.trim() + "\n\n" + buildStatutoryDeadlineTableHtml(validatedCity);
    }
  }

  // Guarantee final FAQ item contains David Atoyan's localized attorney CTA block
  if (finalFaqs.length > 0) {
    const lastFaq = finalFaqs[finalFaqs.length - 1];
    if (!lastFaq.answer.includes("Talk to a") && !lastFaq.answer.includes("807-0077")) {
      const citySlug = validatedCity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const topicSlug = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const ctaHeading = decomposed.isArticle
        ? `Talk to a California ${cleanTopic} Lawyer`
        : `Talk to a ${validatedCity} ${cleanTopic} Lawyer`;
      const ctaBlock = `\r\n<h2 id="talk-to-a-${citySlug}-${topicSlug}-lawyer">${ctaHeading}</h2>\r\n<p>If you believe your workplace rights were violated, time limits apply under California law. <a href="/contact/">Contact the firm</a> for a free, confidential case evaluation.</p>`;
      lastFaq.answer = lastFaq.answer.trim() + ctaBlock;
    }
  }

  linkedServices = shortenIntro(linkedServices);
  linkedServices = coverRequiredPoints(linkedServices, rules);
  linkedServices = ensureSavedLinks(linkedServices, rules.keywordLinks);
  if (rules.linksOnly) linkedServices = keepOnlySavedLinks(linkedServices, rules.keywordLinks);
  linkedServices = separateStackedHeadings(linkedServices);
  finalHowDoContent = separateStackedHeadings(finalHowDoContent);
  finalCompIntro = separateStackedHeadings(finalCompIntro);

  const extraWords = countSubstantiveWords(finalHowDoContent) + countSubstantiveWords(finalCompIntro);
  if (countSubstantiveWords(linkedServices) + extraWords > rules.wordCount) {
    linkedServices = limitHtmlToWordCount(linkedServices, Math.max(350, rules.wordCount - extraWords));
    linkedServices = ensureSavedLinks(linkedServices, rules.keywordLinks);
    if (rules.linksOnly) linkedServices = keepOnlySavedLinks(linkedServices, rules.keywordLinks);
    linkedServices = separateStackedHeadings(linkedServices);
  }

  let finalHeroTitle = decomposed.isArticle
    ? decomposed.heroTitle
    : typeof obj.heroTitle === "string" &&
      obj.heroTitle.trim() &&
      obj.heroTitle.toLowerCase().includes(validatedCity.toLowerCase())
    ? obj.heroTitle.trim()
    : decomposed.heroTitle;

  let finalServicesHeading = decomposed.isArticle
    ? decomposed.heroTitle
    : typeof obj.servicesHeading === "string" && obj.servicesHeading.trim()
    ? obj.servicesHeading.trim()
    : `${validatedCity} ${cleanTopic} Lawyer`;

  let finalYoastTitle = decomposed.yoastTitle;
  if (/primary keyword/i.test(rules.titleRule)) {
    const firm = /woodmart law/i.test(rules.titleRule) ? " | WoodMart Law" : "";
    finalHeroTitle = keyword;
    finalServicesHeading = keyword;
    finalYoastTitle = `${keyword}${firm}`;
  }
  let finalYoastFocusKw = decomposed.yoastFocusKw;

  const result: AtoyanLegalContent = {
    keyword: typeof obj.keyword === "string" && obj.keyword ? obj.keyword : keyword,
    city: validatedCity,
    slug: finalSlug,
    heroTitle: finalHeroTitle,
    servicesHeading: finalServicesHeading,
    servicesSubHeading:
      /two or three sentences|short transition/i.test(rules.introRule)
        ? ""
        : typeof obj.servicesSubHeading === "string" && obj.servicesSubHeading
        ? obj.servicesSubHeading
        : sim.servicesSubHeading,
    servicesContent: colorContentLinks(rewriteLegacyProjectLinks(linkedServices)),
    howDoHeading: (/question/i.test(rules.headingRule) ? questionHeadingText : (value: string) => value)(
      typeof obj.howDoHeading === "string" && obj.howDoHeading
        ? obj.howDoHeading
        : sim.howDoHeading,
    ),
    howDoContent: colorContentLinks(rewriteLegacyProjectLinks(finalHowDoContent)),
    compensationHeading: (/question/i.test(rules.headingRule) ? questionHeadingText : (value: string) => value)(
      typeof obj.compensationHeading === "string" && obj.compensationHeading
        ? obj.compensationHeading
        : sim.compensationHeading,
    ),
    compensationIntro: colorContentLinks(rewriteLegacyProjectLinks(finalCompIntro)),
    faqs: finalFaqs.map((faq) => ({
      ...faq,
      answer: rewriteLegacyProjectLinks(faq.answer || ""),
    })),
    yoastTitle: finalYoastTitle,
    yoastMetaDesc: (() => {
      const fromModel =
        typeof obj.yoastMetaDesc === "string"
          ? rewriteLegacyProjectLinks(obj.yoastMetaDesc).trim()
          : "";
      const mentionsOldFirm = /atoyan|807-0077|747\)\s*888/i.test(fromModel);
      return fromModel.length >= 80 && !mentionsOldFirm ? fromModel : decomposed.yoastMetaDesc;
    })(),
    yoastFocusKw: finalYoastFocusKw,
    accordionShortcode:
      typeof obj.accordionShortcode === "string" && obj.accordionShortcode
        ? obj.accordionShortcode
        : sim.accordionShortcode,
  };

  // Dynamically record in article tracker for future cross-linking
  trackPublishedArticle({
    slug: result.slug,
    title: result.heroTitle,
    keyword: result.keyword,
    city: result.city,
    category: keyword.toLowerCase(),
    url: "https://demo.wp-post.com/" + result.slug + "/",
    publishedAt: new Date().toISOString(),
  });

  return result;
}

/**
 * The Settings prompt is the voice. The site prompt only supplies page structure and the JSON schema.
 */
export function buildActiveSystemPrompt(
  customDirectives?: string,
  chatContext?: string,
  rules: ArticleRules = defaultArticleRules(),
): string {
  const voice = customDirectives?.trim();
  let prompt = `${formatArticleRules(rules)}\n\n${SITE_SYSTEM_PROMPT.trim()}`;

  if (voice && !prompt.includes(voice)) {
    prompt = `${voice}\n\nFollow the firm name, phone, and tone above. Follow the article generation rules for length, headlines, style, sources, and links. Use the rules below only for page structure and JSON shape. Do not mention Atoyan Law, David Atoyan, or atoyanlaw.com.\n\n${prompt}`;
  }

  if (chatContext && chatContext.trim()) {
    prompt += `\n\nCLIENT CHATGPT CONVERSATION CONTEXT & SPECIAL CASE NOTES:\n${chatContext.trim()}\n\nIntegrate the above discussion into the legal analysis while strictly maintaining the required JSON schema and approximately ${rules.wordCount} words.`;
  }

  return prompt;
}

/**
 * Builds the exhaustive user prompt mandating the 7 California litigation sections and 8-10 FAQs.
 */
function buildLegalPrompt(
  keyword: string,
  city: string,
  linkCatalog: string,
  chatContext?: string,
  rules: ArticleRules = defaultArticleRules(),
): string {
  const decomposed = decomposeKeyword(keyword, city);
  const resolvedCity = decomposed.city;
  const cleanTopic = decomposed.cleanTopic;
  const topicKey = decomposed.topicKey;
  const citySlug = resolvedCity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const topicSlug = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const blueprint = getTopicPromptBlueprint(topicKey, cleanTopic, resolvedCity);

  const customContextDirective = chatContext && chatContext.trim()
    ? `

CRITICAL ATTORNEY DIRECTIVE & CUSTOM PROMPT OVERRIDE:
The attorney has provided specific prompt instructions, tone guidelines, and questions:
"""
${chatContext.trim()}
"""
You MUST strictly follow the attorney's tone and structure above:
1. Use direct, bold question-based headings formatted as <h2 class="h2dav">Question?</h2> incorporating the exact questions and topics requested in the attorney's prompt.
2. Maintain short, simple sentences in active voice with NO em dashes (replace with commas or hyphens).
3. Weave in the requested local statistics, agency figures, and California statutory citations naturally.
4. Distribute the comprehensive ~${rules.wordCount}-word analysis across the 3 WordPress ACF content sections:
   - servicesContent: Main substantive discussion (questions 1 through 10-12 as <h2 class="h2dav">).
   - howDoHeading: "Why should you speak with a ${resolvedCity} ${cleanTopic} lawyer?"
   - howDoContent: Practical guidance and bullet points on when workers should speak with a lawyer.
   - compensationHeading: "Contact the firm for a free consultation"
   - compensationIntro: Concluding rights summary and consultation call to action.
   - faqs: 8-10 direct search-intent FAQs.
`
    : "";

  const sectionCount = Math.max(4, Math.min(blueprint.questions.length, Math.round(rules.wordCount / 200)));
  const questionDirectives = blueprint.questions.slice(0, sectionCount).map((q) => {
    let callout = "";
    if (q.questionNumber === 1) {
      callout = `
- Include Early Callout Box:
${blueprint.earlyCtaText}`;
    } else if (q.questionNumber === 6) {
      callout = `
- Include Mid Callout Box:
${blueprint.midCtaText}`;
    } else if (q.questionNumber === 13) {
      callout = `
- Include Closing Callout Box:
${blueprint.closingCtaText}`;
    }
    return `QUESTION ${q.questionNumber}: <h2 class="h2dav">${q.heading}</h2>
- ${q.instructions}${callout}`;
  }).join("\n\n");

  const faqDirectives = blueprint.faqs.map((f, i) => `${i + 1}. ${f.question} (${f.focus})`).join("\n");

  return `${formatArticleRules(rules)}

${linkCatalog}${customContextDirective}

CRITICAL REQUIREMENT: servicesContent MUST be approximately ${rules.wordCount} words of exhaustive legal analysis for "${cleanTopic}" in ${resolvedCity}.
Tone must be clear and direct for workers, with question-based headings (<h2 class="h2dav">), short active-voice sentences, no em dashes, concrete arithmetic examples ($25/hr -> $37.50 overtime, $3,600/yr off-the-clock, $11,000/yr break premiums, $6,000 waiting time penalties), and California Labor Code § 1171.5 undocumented worker protections. Do not mention Atoyan Law or David Atoyan.
DO NOT generate a short generic summary. Use question-based headings formatted with <h2 class="h2dav"> matching the topics below:

PAGE LENGTH:
HARD LIMIT: servicesContent must be about ${rules.wordCount} words and must not exceed ${Math.round(rules.wordCount * 1.1)} words.
Write only the ${sectionCount} sections below. Do not add extra sections.
You MUST use these exact phrases in the article body: ${rules.keywordLinks.map((link) => link.keyword).filter(Boolean).join(", ") || "(none)"}.
Follow the article generation rules above for headings, sentence style, and what to leave out.
Cover the question sections below in that style:

${questionDirectives}

MANDATORY 10-QUESTION HIGH-INTENT GOOGLE SEARCH FAQ STRUCTURE:
You MUST generate EXACTLY 10 practical, multi-paragraph FAQs for "${cleanTopic}" in ${resolvedCity}, covering this exact searcher progression:
${faqDirectives}

Every answer MUST contain 2-3 substantive paragraphs citing California Civil Rights Department (CRD), California Labor Code, and EEOC regulations.
The 10th FAQ answer MUST conclude with this localized CTA. Do not name Atoyan Law or link to atoyanlaw.com:
<h2 id="talk-to-a-${citySlug}-${topicSlug}-lawyer">Talk to a ${resolvedCity} ${cleanTopic} Lawyer</h2>
<p>If you believe your workplace rights were violated, time limits apply under California law. <a href="/contact/">Contact the firm</a> for a free, confidential case evaluation.</p>

Output strictly valid JSON matching the schema.`;
}

async function generateAtoyanOpenAI(
  keyword: string,
  city: string,
  apiKey: string,
  systemPrompt?: string,
  chatContext?: string,
  rules: ArticleRules = defaultArticleRules(),
): Promise<AtoyanLegalContent> {
  const safeSlug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const linkCatalog = buildLinkingCatalogForLlm({ category: keyword, city, currentSlug: safeSlug });
  const prompt = buildLegalPrompt(keyword, city, linkCatalog, chatContext, rules);
  const activePrompt = buildActiveSystemPrompt(systemPrompt, chatContext, rules);

  for (const model of OPENAI_MODELS) {
    try {
      console.log(`[Atoyan LLM] Calling OpenAI (${model}) for "${keyword}" in ${city}...`);
      const isReasoningModel = model.startsWith("o1") || model.startsWith("o3");
      const requestBody: Record<string, unknown> = {
        model,
        messages: [
          { role: "system", content: activePrompt },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      };

      if (isReasoningModel) {
        requestBody.max_completion_tokens = 16000;
      } else {
        requestBody.max_tokens = 16000;
        requestBody.temperature = 0.65;
      }

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(120_000),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(`[Atoyan LLM] OpenAI (${model}) returned HTTP ${res.status}:`, errBody.slice(0, 500));
        continue;
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (
          parsed &&
          typeof parsed === "object" &&
          typeof parsed.servicesContent === "string" &&
          parsed.servicesContent.trim().length > 500
        ) {
          console.log(`[Atoyan LLM] Generated ${countSubstantiveWords(parsed.servicesContent)} words (${parsed.servicesContent.length} chars) via OpenAI (${model})`);
          return validateAndNormalizeAtoyanContent(parsed, keyword, city, rules);
        } else {
          console.warn(`[Atoyan LLM] OpenAI (${model}) response missing servicesContent or length <= 500`);
        }
      }
    } catch (err) {
      console.error(`[Atoyan LLM] OpenAI (${model}) request exception:`, err);
    }
  }

  throw new Error("OpenAI generation failed across all configured models");
}

/**
 * Generates California employment legal content using Gemini structured output.
 */
async function generateAtoyanGemini(
  keyword: string,
  city: string,
  apiKey: string,
  systemPrompt?: string,
  chatContext?: string,
  rules: ArticleRules = defaultArticleRules(),
): Promise<AtoyanLegalContent> {
  const safeSlug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const linkCatalog = buildLinkingCatalogForLlm({ category: keyword, city, currentSlug: safeSlug });
  const prompt = buildLegalPrompt(keyword, city, linkCatalog, chatContext, rules);
  const activePrompt = buildActiveSystemPrompt(systemPrompt, chatContext, rules);

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[Atoyan LLM] Calling Gemini (${model}) for "${keyword}" in ${city}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: activePrompt }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.65,
            maxOutputTokens: 16000,
          },
        }),
        signal: AbortSignal.timeout(120_000),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(`[Atoyan LLM] Gemini (${model}) returned HTTP ${res.status}:`, errBody.slice(0, 500));
        continue;
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (
          parsed &&
          typeof parsed === "object" &&
          typeof parsed.servicesContent === "string" &&
          parsed.servicesContent.trim().length > 500
        ) {
          console.log(`[Atoyan LLM] Generated ${countSubstantiveWords(parsed.servicesContent)} words (${parsed.servicesContent.length} chars) via Gemini (${model})`);
          return validateAndNormalizeAtoyanContent(parsed, keyword, city, rules);
        } else {
          console.warn(`[Atoyan LLM] Gemini (${model}) response missing servicesContent or length <= 500`);
        }
      }
    } catch (err) {
      console.error(`[Atoyan LLM] Gemini (${model}) request exception:`, err);
    }
  }

  throw new Error("Gemini generation failed across all configured models");
}

export { generateAtoyanSimulated } from "./llm-simulated";

/**
 * Main legal content generation function with automatic provider hierarchy.
 */
export async function generateAtoyanContent(params: {
  keyword: string;
  city?: string;
  openaiKey?: string;
  geminiKey?: string;
  provider?: "openai" | "gemini" | "simulator";
  systemPrompt?: string;
  chatContext?: string;
  article?: ArticleRules;
}): Promise<AtoyanLegalContent> {
  const { keyword, systemPrompt, chatContext } = params;
  const city = params.city || extractCity(keyword);
  const rules = params.article || defaultArticleRules();

  // If simulator is explicitly chosen in settings, return simulated
  if (params.provider === "simulator") {
    console.log(`[Atoyan LLM] Simulator explicitly selected for "${keyword}"`);
    return validateAndNormalizeAtoyanContent(generateAtoyanSimulated(keyword, city), keyword, city, rules);
  }

  // Prioritize client-provided API keys (from Settings modal) over server environment keys
  const openaiKey = cleanApiKey(params.openaiKey || process.env.OPENAI_API_KEY);
  const geminiKey = cleanApiKey(params.geminiKey || process.env.GEMINI_API_KEY);

  let preferredProvider: "openai" | "gemini" = params.provider === "gemini" ? "gemini" : "openai";
  if (openaiKey && !geminiKey) preferredProvider = "openai";
  else if (geminiKey && !openaiKey) preferredProvider = "gemini";

  // Attempt 1: Preferred Provider
  if (preferredProvider === "openai" && openaiKey) {
    try {
      return await generateAtoyanOpenAI(keyword, city, openaiKey, systemPrompt, chatContext, rules);
    } catch (e) {
      console.warn("[Atoyan LLM] Primary OpenAI attempt failed, falling back to Gemini / simulated:", e);
    }
  }

  if (preferredProvider === "gemini" && geminiKey) {
    try {
      return await generateAtoyanGemini(keyword, city, geminiKey, systemPrompt, chatContext, rules);
    } catch (e) {
      console.warn("[Atoyan LLM] Primary Gemini attempt failed, falling back to OpenAI / simulated:", e);
    }
  }

  // Attempt 2: Secondary Provider Fallback
  if (openaiKey && preferredProvider !== "openai") {
    try {
      return await generateAtoyanOpenAI(keyword, city, openaiKey, systemPrompt, chatContext, rules);
    } catch (e) {
      console.warn("[Atoyan LLM] Fallback OpenAI attempt failed:", e);
    }
  }

  if (geminiKey && preferredProvider !== "gemini") {
    try {
      return await generateAtoyanGemini(keyword, city, geminiKey, systemPrompt, chatContext, rules);
    } catch (e) {
      console.warn("[Atoyan LLM] Fallback Gemini attempt failed:", e);
    }
  }

  // Attempt 3: Last resort offline simulator
  console.warn(`[Atoyan LLM] No AI API succeeded for "${keyword}" in ${city}. Using offline simulator as emergency fallback.`);
  return validateAndNormalizeAtoyanContent(generateAtoyanSimulated(keyword, city), keyword, city, rules);
}

// -----------------------------------------------------------------------------
// LEGACY COMPATIBILITY FUNCTIONS (for standard article generation)
// -----------------------------------------------------------------------------

export async function activeProvider(settings?: Settings): Promise<string> {
  const openaiKey = cleanApiKey(settings?.openai_api_key || process.env.OPENAI_API_KEY);
  const geminiKey = cleanApiKey(settings?.gemini_api_key || process.env.GEMINI_API_KEY);

  if (settings?.llm_provider === "openai" && openaiKey) return "openai";
  if (settings?.llm_provider === "gemini" && geminiKey) return "gemini";
  if (openaiKey) return "openai";
  if (geminiKey) return "gemini";
  return "simulator";
}

export async function generateArticle(title: string, settings: Settings): Promise<ArticleResult> {
  const provider = await activeProvider(settings);
  const city = extractCity(title);
  try {
    const atoyan = await generateAtoyanContent({
      keyword: title,
      city,
      openaiKey: settings.openai_api_key,
      geminiKey: settings.gemini_api_key,
      provider: provider as "openai" | "gemini" | "simulator",
    });

    return {
      title,
      body: `${atoyan.servicesContent}\n\n${atoyan.howDoContent}\n\n${atoyan.compensationIntro}`,
      provider,
      model: provider === "openai" ? "chatgpt-4o-latest" : provider === "gemini" ? "gemini-2.5-flash" : "deterministic",
    };
  } catch {
    const sim = generateAtoyanSimulated(title, city);
    return {
      title,
      body: `${sim.servicesContent}\n\n${sim.howDoContent}\n\n${sim.compensationIntro}`,
      provider: "simulator",
      model: "deterministic-v1",
    };
  }
}
