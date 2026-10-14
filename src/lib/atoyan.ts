import { decomposeKeyword } from "./keyword-utils";
import { stripCopiedClasses } from "./seo-linking";
import type {
  AtoyanLegalContent,
  AtoyanFaq,
  AcfPersonalInjuryGroup,
  TestimonialReviewItem,
} from "./types";

export const ATOYAN_PARENT_PAGE_ID = 750; // /practice-areas/employment-law/
export const ATOYAN_TEMPLATE = "templates/labor-law.php";
export const ATOYAN_REFERENCE_PAGE_ID = 3898;
export const ATOYAN_BANNER_ATTACHMENT_ID = 3899;
export const ATOYAN_TESTIMONIALS_BG_ATTACHMENT_ID = 72;
export const ATOYAN_CTA_BG_ATTACHMENT_ID = 383;

export const ATOYAN_PHONE = "(323) 968-0000";
export const ATOYAN_TOLL_FREE = "(323) 203-4805";
export const ATOYAN_PHONE_LINK = "tel:3239680000";
export const ATOYAN_CONTACT_URL = "https://demo.wp-post.com/contact-us/";

/** Fades the hero photo in the browser. The uploaded file stays at full brightness. */
export const HERO_TITLE_PHOTO_STYLE =
  `<style id="wp-post-hero-photo">.wd-page-title{background-color:#ffffff!important}.wd-page-title .wd-page-title-bg img{opacity:.68}</style>`;

/**
 * Cloned sidebar practice area page IDs from Page 3933.
 * Preserves the exact 27 employment law cross-links on WoodMart Law.
 */
export const ATOYAN_DEFAULT_SIDEBAR_IDS: number[] = [
  1590, 770, 791, 808, 821, 838, 852, 872, 888, 908, 925, 951, 970, 1070, 1090, 1044,
  1622, 3720, 3278, 3266, 3271, 3739, 3789, 3831, 3752, 3780, 3878,
];

export const ATOYAN_TESTIMONIALS_BG_IMAGE =
  "https://www.atoyanlaw.com/wp-content/uploads/2025/01/reviews-s1-bg.2311141957550.jpg";
export const ATOYAN_TESTIMONIALS_HEADING = "Testimonials";
export const ATOYAN_TESTIMONIALS_SUB_HEADING = "Hear from Our Former Clients";

export const ATOYAN_TESTIMONIALS_REVIEWS: TestimonialReviewItem[] = [
  {
    title: "\"I recommend WoodMart Law with your legal concerns.\"",
    description:
      "I just had a consultation with attorny Angela Atoyan. I am very satisfied with her professionalism. I am really and highly recommending to hire her as your attorney. Thank you",
    name: "-  Hak H.",
  },
  {
    title: "\"Thanks WoodMart Law\"",
    description:
      "The legal team at Atoyan Employment law took my case almost from the first call. I had asked other firms but never got an answer, not even to reject my case. Great communication was a constant experience with WoodMart Law.",
    name: "- Edgar P.",
  },
  {
    title:
      "\"Angela Atoyan and her professional staff helped us a ton with the employement questions and related topics.\"",
    description:
      "They are always supportive, efficient, and a pleasure to work with manager and also paralegals. Their professionalism and collaborative spirit truly make a difference. Highly recommended!!!",
    name: "- Karen A.",
  },
  {
    title: "\"I really felt like they had my best interests in mind.\"",
    description:
      "Communication was excellent they kept me updated without me ever having to chase them down. They answered all my questions and walked me through everything so I never felt overwhelmed.",
    name: "- Edgar A.",
  },
  {
    title: "\"I highly recommend this firm for your legal services.\"",
    description:
      "I had excellent experience with the team. HUGE THANKS for helping me when i needed it the most. RECOMMEND 100%",
    name: "- Yuri M.",
  },
  {
    title: "\"I highly recommend WoodMart Law for your legal concerns and services!\"",
    description:
      "I am empressed by their work responsibility. Every time i called they answered all my questions, help me with every problem that the accident caused.\r\n100% reccommended",
    name: "- George A.",
  },
  {
    title: "\"Highly recommend Atoyan law for a smooth process.\"",
    description:
      "Atoyan law has a very responsible team. Angela helped me apply for a family reunion. Everything was done on time and perfectly and they answered my phone call immediately.",
    name: "- Lusine K.",
  },
  {
    title: "\"I would recommend this office to everyone.\"",
    description:
      "I had a great experience working with WoodMart Law. The team was very knowledgeable, caring, and professional throughout the entire process. I highly recommend WoodMart Law to anyone in need of legal assistance.",
    name: "- Maria K.",
  },
];

export const ATOYAN_TESTIMONIALS_BUTTON = {
  title: "View All Testimonials",
  url: "https://www.atoyanlaw.com/testimonials/",
  target: "",
};

export const ATOYAN_CONTACT_FORM_HEADING = "Contact Us for Your Consultation";
export const ATOYAN_CONTACT_FORM_SHORTCODE = '[contact-form-7 id="2701763" title="Home page"]';

export const ATOYAN_CTA_BG_IMAGE =
  "https://www.atoyanlaw.com/wp-content/uploads/2025/01/cta-s3-bg3.2402081138550.jpg";
export const ATOYAN_CTA_HEADING = "Get The Representation You Deserve";
export const ATOYAN_CTA_CONTENT =
  "Backed by our experience and skill we fight every case as if our client is our close family member, and our attorneys offer personalized, face-to-face service. Contact us today to get started with your consultation.";
export const ATOYAN_CTA_BUTTON = {
  title: "Contact Us",
  url: "/contact/",
  target: "",
};

/**
 * A call to action written as a normal paragraph. It is not a heading.
 */
export function formatCalloutBox(
  mainText: string,
  linkCtaText = "Call (323) 968-0000 or contact us online",
): string {
  return `<p>${mainText} <a href="${ATOYAN_PHONE_LINK}">${ATOYAN_PHONE}</a> or <a href="${ATOYAN_CONTACT_URL}">${linkCtaText}</a> to schedule a free consultation with WoodMart Law.</p>`;
}

/**
 * Strips all HTML markup, promotional CTA blocks, tables, and attributes from FAQ text,
 * producing clean, compliant plain text for Schema.org JSON-LD FAQPage markup.
 *
 * Requirements:
 * - NO HTML tags (<p>, <table>, <h2>, <a>, <span>, etc.)
 * - NO double quotes or escaped quotes (\" in JSON)
 * - NO promotional attorney CTA blocks inside Schema answers
 * - Clean plain-text formatting for tables and lists
 * - Normalizes whitespace and entities
 */
export function cleanFaqTextForSchema(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  let text = raw;

  // 1. Strip the attorney CTA block (e.g., Talk to a ... Lawyer) and any trailing contact CTA
  text = text.replace(/<h[1-6][\s\S]*?(?:talk-to-|Talk to a)[\s\S]*$/i, "");
  text = text.replace(/If you believe your workplace rights were violated[\s\S]*?(?:807-0077|atoyanlaw\.com\/contact)[\s\S]*$/gi, "");
  text = text.replace(/Contact WoodMart Law at \(888\) 807-0077[\s\S]*$/i, "");

  // Tag stripping regex that safely ignores '>' inside quoted attributes (e.g., Tailwind [&>p]:mt-2)
  const HTML_TAG_REGEX = /<(?:"[^"]*"|'[^']*'|[^"'>])+>/g;

  // 2. Convert HTML tables into readable text lines
  text = text.replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) => {
    const rows = [];
    const rowRegex = /<tr[\s\S]*?<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowContent = rowMatch[0];
      const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      const cells = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        const cellText = cellMatch[1]
          .replace(HTML_TAG_REGEX, " ")
          .replace(/&nbsp;/gi, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (cellText) cells.push(cellText);
      }
      if (cells.length > 0) {
        const joined = cells.join(" - ");
        // Skip pure header rows like "Claim type - Where to file - Deadline"
        if (!/^(?:claim type|type of claim)\s*-\s*where to file/i.test(joined)) {
          rows.push(cells.join(": "));
        }
      }
    }
    return rows.length > 0 ? " " + rows.join("; ") + ". " : " ";
  });

  // 3. Format list items so sentences don't run together
  text = text.replace(/<\/li>/gi, ". ");

  // 4. Format block ends and line breaks
  text = text.replace(/<br\s*\/?>/gi, " ");
  text = text.replace(/<\/(?:p|div|h[1-6]|ul|ol|table|section|article|blockquote)>/gi, " ");

  // 5. Strip all remaining HTML tags using quote-aware tag regex
  text = text.replace(HTML_TAG_REGEX, " ");

  // 6. Decode HTML entities
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "'")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&mdash;|&#8212;/gi, ", ")
    .replace(/&ndash;|&#8211;/gi, "-")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));

  // 7. Strip long em/en dashes (David rule: "No em dashes")
  text = text.replace(/\s*[—–]\s*/g, ", ");

  // 8. Replace double quotes with single quotes (Client feedback: "can't have \"")
  text = text.replace(/["“”]/g, "'");

  // 9. Normalize whitespace and punctuation
  text = text
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/([.,;:])\1+/g, "$1")
    .replace(/\.\s*\./g, ".")
    .trim();

  return text;
}

/**
 * Generates valid Schema.org FAQPage JSON-LD snippet for high SEO rich snippet rankings.
 * All HTML tags, attributes, tables, and CTA blocks are stripped from Schema text,
 * guaranteeing 100% clean, unescaped, compliant Schema.org JSON-LD output.
 */
export function generateFaqSchemaJsonLd(faqs: AtoyanFaq[]): string {
  if (!faqs || faqs.length === 0) return "";

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: cleanFaqTextForSchema(f.question),
      acceptedAnswer: {
        "@type": "Answer",
        text: cleanFaqTextForSchema(f.answer),
      },
    })),
  };

  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Generates an authentic, zero-script, zero-inline-style interactive HTML accordion matching
 * Easy Accordion (.sp-ea-one .sp-easy-accordion) loaded on atoyanlaw.com.
 *
 * CRITICAL REQUIREMENTS (Client David):
 * 1. Strictly maintain zero raw <style> tags and zero <script> tags.
 * 2. Uses the exact HTML classes and markup recognized by ea-style.css and the site-wide
 *    footer toggle script (wp-content-autopilot-accordion-js / handleAccordionToggle).
 * 3. Formats all 8-10 California employment legal FAQs with statutory depth.
 * 4. Ensures the 10th/final FAQ includes David's exact localized CTA block with phone (323) 968-0000
 *    and contact link.
 */
export function generateNativeEasyAccordionHtml(
  faqs: AtoyanFaq[] = [],
  city = "California",
  topic = "Employment Law",
  customUniqId?: string,
): string {
  if (!faqs || faqs.length === 0) return "";

  const decomposed = decomposeKeyword(topic, city);
  const resolvedCity = decomposed.city || city || "California";
  const cleanTopic = decomposed.cleanTopic || topic || "Employment Law";

  const uniqueId =
    customUniqId ||
    `dynamic_${Math.floor(1000 + Math.random() * 9000)}`;

  const citySlug = resolvedCity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const topicSlug = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const itemsHtml = faqs.map((faq, index) => {
    const isFirst = index === 0;
    const isLast = index === faqs.length - 1;
    const headerId = `ea-header-${uniqueId}${index}`;
    const collapseId = `collapse${uniqueId}${index}`;
    const escapedQuestion = faq.question.replace(/<[^>]+>/g, "").trim();

    // Format answer into clean paragraphs if not already wrapped
    let answerHtml = faq.answer.trim();
    if (!answerHtml.includes("<p>") && !answerHtml.includes("<p ")) {
      answerHtml = answerHtml
        .split(/\n\n+/)
        .map((p) => `<p>${p.trim()}</p>`)
        .join("\r\n");
    }

    // Ensure 10th/last FAQ item concludes with localized Atoyan attorney CTA
    if (isLast && !answerHtml.includes("Talk to a") && !answerHtml.includes("807-0077")) {
      const ctaBlock = `\r\n<h2 id="talk-to-a-${citySlug}-${topicSlug}-lawyer">Talk to a ${resolvedCity} ${cleanTopic} Lawyer</h2>\r\n<p>If you believe your workplace rights were violated, time limits apply under California law. <strong>Contact WoodMart Law at (323) 968-0000</strong> or through the online form at <a href="https://demo.wp-post.com/contact-us/" target="_blank" rel="noopener">demo.wp-post.com</a> for a free, confidential case evaluation.</p>`;
      answerHtml += ctaBlock;
    }

    if (isFirst) {
      return `  <div class="ea-card ea-expand sp-ea-single">
    <h3 class="ea-header">
      <a id="${headerId}" class="" role="button" tabindex="0" href="#" data-sptoggle="spcollapse" data-sptarget="#${collapseId}" aria-expanded="true" aria-controls="${collapseId}">
        <i class="ea-expand-icon eap-icon-ea-expand-minus" aria-hidden="true" role="presentation">−</i>
        ${escapedQuestion}
      </a>
    </h3>
    <div id="${collapseId}" class="sp-collapse spcollapse show" role="region" aria-labelledby="${headerId}" data-parent="#sp-ea-${uniqueId}" style="display: block;">
      <div class="ea-body">
        ${answerHtml}
      </div>
    </div>
  </div>`;
    }

    return `  <div class="ea-card sp-ea-single">
    <h3 class="ea-header">
      <a id="${headerId}" class="collapsed" role="button" tabindex="0" href="#" data-sptoggle="spcollapse" data-sptarget="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
        <i class="ea-expand-icon eap-icon-ea-expand-plus" aria-hidden="true" role="presentation">+</i>
        ${escapedQuestion}
      </a>
    </h3>
    <div id="${collapseId}" class="sp-collapse spcollapse" role="region" aria-labelledby="${headerId}" data-parent="#sp-ea-${uniqueId}" style="display: none;">
      <div class="ea-body">
        ${answerHtml}
      </div>
    </div>
  </div>`;
  }).join("\r\n");

  return `<div id="sp-ea-${uniqueId}" class="sp-easy-accordion-wrap sp-ea-one sp-easy-accordion">\r\n${itemsHtml}\r\n</div>`;
}

/**
 * Generates an interactive, responsive HTML accordion matching Easy Accordion / theme styling,
 * or the native shortcode if FAQs are empty.
 */
export function generateEasyAccordionHtml(
  faqs: AtoyanFaq[] = [],
  shortcodeId: number | string = 3932,
  city = "California",
  topic = "Employment Law",
): string {
  if (faqs && faqs.length > 0) {
    return generateNativeEasyAccordionHtml(faqs, city, topic, shortcodeId ? String(shortcodeId) : undefined);
  }
  return `[sp_easyaccordion id="${shortcodeId}"]`;
}

/**
 * Formats the services content, injecting the editorial illustration <img> tag at the top left.
 */
export function buildServicesContent(
  rawServicesHtml: string,
  servicesImageUrl?: string,
  imageAltText?: string,
  attachmentId?: number,
): string {
  const cleanHtml = (rawServicesHtml || "").trim();
  if (!servicesImageUrl) return cleanHtml;

  const wpClass = attachmentId ? `wp-image-${attachmentId}` : "wp-image-3936";
  const imgTag = `<img src="${servicesImageUrl}" alt="${imageAltText || "California Employment Law Legal Representation"}" width="600" height="400" class="alignleft size-full ${wpClass}" />\r\n`;

  // Prepend image if not already present
  if (cleanHtml.includes("<img") && cleanHtml.includes(servicesImageUrl)) {
    return cleanHtml;
  }

  // Inject image directly after the primary </h2> heading (or </h1>/<h3> fallback)
  // Per client requirement: <h2 class="h2dav">...</h2> <img src="..." ... />
  const h2CloseRegex = /<\/h2>/i;
  const h2Match = cleanHtml.match(h2CloseRegex);
  if (h2Match && h2Match.index !== undefined) {
    const insertPos = h2Match.index + h2Match[0].length;
    return `${cleanHtml.slice(0, insertPos)} ${imgTag}${cleanHtml.slice(insertPos).trimStart()}`;
  }

  const anyHCloseRegex = /<\/(h[1-3])>/i;
  const anyHMatch = cleanHtml.match(anyHCloseRegex);
  if (anyHMatch && anyHMatch.index !== undefined) {
    const insertPos = anyHMatch.index + anyHMatch[0].length;
    return `${cleanHtml.slice(0, insertPos)} ${imgTag}${cleanHtml.slice(insertPos).trimStart()}`;
  }

  return `${imgTag}${cleanHtml}`;
}

const DEMO_DIRECTIONS_BLOCK_ID = "36967";
const DEMO_TESTIMONIALS_BLOCK_ID = "36972";

export interface DemoBodyImage {
  url: string;
  id?: number;
  width?: number;
  height?: number;
  alt?: string;
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtmlText(value).replace(/"/g, "&quot;");
}

function stripInlineImages(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, "");
}

function splitAtFirstSubheading(html: string): { intro: string; rest: string } {
  const match = html.match(/<h[23]\b/i);
  if (!match || match.index === undefined) return { intro: html.trim(), rest: "" };
  return {
    intro: html.slice(0, match.index).trim(),
    rest: html.slice(match.index).trim(),
  };
}

/**
 * WoodMart pages on the demo site follow the published Wrongful Termination page:
 * a left-aligned body image, the shared directions block, article sections,
 * an Easy Accordion, then the shared testimonials block.
 * The header photo is the featured image, not an image in the body.
 */
export interface DemoPageLayout {
  imageAlign?: "left" | "right" | "center";
  textAlign?: "left" | "right" | "center";
  directionsBelowImage?: boolean;
  besideImageWords?: number;
}

function htmlWordCount(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

/** Moves opening paragraphs up beside the photo until the word count fills that column. */
function fillBesideImage(intro: string, rest: string, target: number): { intro: string; rest: string } {
  const goal = Math.max(40, target || 0);
  if (htmlWordCount(intro) >= goal) return { intro, rest };
  const blocks = rest.split(/(?=<h[1-6]\b|<p\b)/i);
  const kept: string[] = [];
  const left: string[] = [];
  let words = htmlWordCount(intro);
  let filling = true;
  for (const block of blocks) {
    if (!filling) {
      left.push(block);
      continue;
    }
    kept.push(block);
    words += htmlWordCount(block);
    const trimmed = block.trim();
    const isHeading = /^<h[1-6]\b/i.test(trimmed);
    const hasLink = /<a\b/i.test(trimmed);
    if (hasLink) {
      kept.pop();
      words -= htmlWordCount(block);
      left.push(block);
      continue;
    }
    if (words >= goal && !isHeading) filling = false;
  }
  return {
    intro: [intro, ...kept].filter((part) => part && part.trim()).join("\n"),
    rest: left.join(""),
  };
}

function imageAlignClass(align: "left" | "right" | "center"): string {
  if (align === "right") return "alignright";
  if (align === "center") return "aligncenter";
  return "alignleft";
}

export function buildDemoPageContent(
  content: AtoyanLegalContent,
  bodyImage?: DemoBodyImage,
  accordionShortcode?: string,
  layout?: DemoPageLayout,
): string {
  const imageAlign = layout?.imageAlign || "left";
  const textAlign = layout?.textAlign || "left";
  const directionsBelowImage = layout?.directionsBelowImage !== false;
  const besideImageWords = layout?.besideImageWords ?? 120;
  const services = stripInlineImages(content.servicesContent || "");
  const split = splitAtFirstSubheading(services);
  const filled = fillBesideImage(split.intro, split.rest, besideImageWords);
  const intro = filled.intro;
  const rest = filled.rest;
  const heading = escapeHtmlText(content.servicesHeading || content.heroTitle);
  const subheading = content.servicesSubHeading
    ? `<p><strong>${escapeHtmlText(content.servicesSubHeading)}</strong></p>`
    : "";
  const image = bodyImage?.url
    ? `<img src="${escapeAttr(bodyImage.url)}" alt="${escapeAttr(bodyImage.alt || content.heroTitle)}" width="${bodyImage.width || 400}" height="${bodyImage.height || 267}" class="${imageAlignClass(imageAlign)} size-medium${bodyImage.id ? ` wp-image-${bodyImage.id}` : ""}" />`
    : "";
  const introHtml = textAlign === "left" ? intro : `<div style="text-align:${textAlign}">${intro}</div>`;
  const directionsClear = directionsBelowImage ? `<div style="clear:both"></div>\n` : "";
  const compensation = stripInlineImages(content.compensationIntro || "").replace(
    /\[sp_easyaccordion\s+id=["']?\d+["']?\]/gi,
    "",
  );
  const howDo = stripInlineImages(content.howDoContent || "").replace(
    /\[sp_easyaccordion\s+id=["']?\d+["']?\]/gi,
    "",
  );
  const shortcode = accordionShortcode?.match(/\[sp_easyaccordion\s+id=["']?\d+["']?\]/i)?.[0] || "";
  const faqHeading = `10 Most Asked Questions About ${escapeHtmlText(content.keyword || "This Topic")}`;
  const visibleFaqs = (content.faqs || [])
    .map((faq) => {
      const answer = /<p[\s>]/i.test(faq.answer) ? faq.answer : `<p>${faq.answer}</p>`;
      return `<h3>${escapeHtmlText(faq.question)}</h3>\n${answer}`;
    })
    .join("\n");
  const faqs = shortcode
    ? `<h2>${faqHeading}</h2>\n${shortcode}`
    : visibleFaqs
      ? `<h2>${faqHeading}</h2>\n${visibleFaqs}`
      : "";

  return stripCopiedClasses([
    HERO_TITLE_PHOTO_STYLE,
    `<p><h2>${heading}</h2>\n${image}${subheading}\n${introHtml}`.trim(),
    `${directionsClear}<!-- add -->\n[html_block id="${DEMO_DIRECTIONS_BLOCK_ID}"]\n<!-- // -->`,
    rest,
    content.howDoHeading ? `<h2>${escapeHtmlText(content.howDoHeading)}</h2>` : "",
    howDo,
    content.compensationHeading ? `<h2>${escapeHtmlText(content.compensationHeading)}</h2>` : "",
    compensation,
    faqs,
    `<!-- testimonials -->\n[html_block id="${DEMO_TESTIMONIALS_BLOCK_ID}"]\n<!--//testimonials -->`,
  ]
    .filter((part) => part && part.trim())
    .join("\n\n"));
}

/**
 * Themes without templates/labor-law.php only print the normal page body.
 * This stacks the same ACF sections Atoyan's template renders.
 */
export function buildVisiblePageContent(
  content: AtoyanLegalContent,
  servicesImageUrl?: string,
  bannerImageUrl?: string,
): string {
  const services = buildServicesContent(
    content.servicesContent,
    servicesImageUrl,
    content.heroTitle,
  );
  const compensation = buildCompensationSection(
    content.compensationIntro,
    content.faqs,
    content.city,
    content.keyword,
    content.accordionShortcode,
  ).replace(/\[sp_easyaccordion\s+id=["']?\d+["']?\]/gi, "");

  const faqs = (content.faqs || [])
    .map((faq) => {
      const answer = /<p[\s>]/i.test(faq.answer) ? faq.answer : `<p>${faq.answer}</p>`;
      return `<h3>${faq.question}</h3>\n${answer}`;
    })
    .join("\n");

  return [
    bannerImageUrl
      ? `<p><img src="${bannerImageUrl}" alt="${content.heroTitle}" /></p>`
      : "",
    content.servicesHeading ? `<h2>${content.servicesHeading}</h2>` : "",
    content.servicesSubHeading ? `<p><strong>${content.servicesSubHeading}</strong></p>` : "",
    services,
    content.howDoHeading ? `<h2>${content.howDoHeading}</h2>` : "",
    content.howDoContent,
    content.compensationHeading ? `<h2>${content.compensationHeading}</h2>` : "",
    compensation,
    faqs ? `<h2>Frequently Asked Questions</h2>\n${faqs}` : "",
  ]
    .filter((part) => part && part.trim())
    .join("\n\n");
}

/**
 * Maps practice area keywords and cities to existing Easy Accordion IDs on atoyanlaw.com.
 */
export function resolveDefaultAccordionShortcode(keyword: string, city = "California"): string {
  const kw = (keyword + " " + city).toLowerCase();

  // San Pedro specific
  if (kw.includes("san pedro")) {
    if (kw.includes("race") || kw.includes("racial") || kw.includes("ethnic") || kw.includes("national origin") || kw.includes("color")) {
      return '[sp_easyaccordion id="3531"]'; // Ethnic & National Origin Discrimination Attorney in San Pedro
    }
    if (kw.includes("sick") || kw.includes("time off") || kw.includes("pto") || kw.includes("paid sick")) {
      return '[sp_easyaccordion id="3515"]'; // Paid Sick Time Off rights and attorneys in San Pedro
    }
    if (kw.includes("overtime")) {
      return '[sp_easyaccordion id="3504"]'; // Overtime Compensation Attorney in San Pedro
    }
    if (kw.includes("harass") || kw.includes("sexual")) {
      return '[sp_easyaccordion id="3464"]'; // San Pedro Sexual Harassment Lawyer
    }
    if (kw.includes("wrongful") || kw.includes("termination") || kw.includes("firing") || kw.includes("fired")) {
      return '[sp_easyaccordion id="3421"]'; // Wrongful Termination Lawyer San Pedro CA
    }
    if (kw.includes("wage") || kw.includes("theft") || kw.includes("unpaid") || kw.includes("pay")) {
      return '[sp_easyaccordion id="3971"]'; // Unpaid Wages Employment Attorney San Pedro
    }
    return '[sp_easyaccordion id="3960"]'; // Employment Attorney San Pedro, CA
  }

  // Visalia specific
  if (kw.includes("visalia")) {
    if (kw.includes("meal") || kw.includes("rest break") || kw.includes("lunch") || kw.includes("break")) {
      return '[sp_easyaccordion id="4119"]'; // Visalia Meal and Rest Break Violations
    }
    if (kw.includes("gender") || kw.includes("sex") || kw.includes("women") || kw.includes("equal pay")) {
      return '[sp_easyaccordion id="3873"]'; // Visalia Gender Discrimination Lawyer
    }
    if (kw.includes("leave") || kw.includes("fmla") || kw.includes("cfra") || kw.includes("medical leave") || kw.includes("family")) {
      return '[sp_easyaccordion id="3788"]'; // Visalia Family and Medical Leave Lawyer
    }
    if (kw.includes("overtime")) {
      return '[sp_easyaccordion id="3719"]'; // overtime violations in Visalia
    }
    if (kw.includes("wage") || kw.includes("unpaid") || kw.includes("hour claims") || kw.includes("claims")) {
      return '[sp_easyaccordion id="3779"]'; // Visalia Wage and Hour Claims Attorney
    }
    if (kw.includes("theft") || kw.includes("unpaid wages")) {
      return '[sp_easyaccordion id="3830"]'; // Visalia Unpaid Wages Lawyer
    }
    if (kw.includes("discrim") || kw.includes("bias")) {
      return '[sp_easyaccordion id="3738"]'; // Frequently Asked Questions About Workplace Discrimination in Visalia
    }
  }

  // Fresno specific
  if (kw.includes("fresno")) {
    if (kw.includes("meal") || kw.includes("rest break") || kw.includes("lunch") || kw.includes("break")) {
      return '[sp_easyaccordion id="4095"]'; // Fresno Meal and Rest Break Violations
    }
    if (kw.includes("wage") || kw.includes("theft") || kw.includes("unpaid") || kw.includes("minimum wage")) {
      return '[sp_easyaccordion id="4086"]'; // Fresno Wage Theft Attorney
    }
    if (kw.includes("whistleblower") || kw.includes("retaliat")) {
      return '[sp_easyaccordion id="3646"]'; // What is whistleblower retaliation in Fresno, California?
    }
    if (kw.includes("overtime")) {
      return '[sp_easyaccordion id="3619"]'; // Fresno Overtime Violation lawyer
    }
    if (kw.includes("harass") || kw.includes("hostile")) {
      return '[sp_easyaccordion id="3446"]'; // Fresno Workplace Harassment Lawyer
    }
    if (kw.includes("lgbt") || kw.includes("queer") || kw.includes("trans")) {
      return '[sp_easyaccordion id="3239"]'; // LGBTQ Discrimination Attorney in Fresno, California
    }
  }

  // Bakersfield specific
  if (kw.includes("bakersfield")) {
    if (kw.includes("wage") || kw.includes("hour") || kw.includes("unpaid") || kw.includes("theft") || kw.includes("overtime")) {
      return '[sp_easyaccordion id="3405"]'; // Bakersfield Wage and Hour Violations Lawyer
    }
    if (kw.includes("lgbt") || kw.includes("queer") || kw.includes("trans")) {
      return '[sp_easyaccordion id="3312"]'; // LGBTQ Discrimination Bakersfield
    }
  }

  // Los Angeles specific
  if (kw.includes("los angeles")) {
    if (kw.includes("race") || kw.includes("ethnic") || kw.includes("national origin") || kw.includes("color")) {
      return '[sp_easyaccordion id="3549"]'; // Ethnic and National Origin Discrimination in Los Angeles
    }
  }

  // Burbank specific
  if (kw.includes("burbank")) {
    if (kw.includes("race") || kw.includes("racial") || kw.includes("ethnic") || kw.includes("national origin") || kw.includes("color")) {
      return '[sp_easyaccordion id="4355"]'; // Burbank Race Discrimination Attorney
    }
    if (kw.includes("hostile") || kw.includes("harassment") || kw.includes("environment")) {
      return '[sp_easyaccordion id="4200"]'; // Burbank Hostile Work Environment Lawyer
    }
    if (kw.includes("wrongful") || kw.includes("termination") || kw.includes("firing") || kw.includes("fired")) {
      return '[sp_easyaccordion id="4176"]'; // Burbank Wrongful Termination Lawyer
    }
    if (kw.includes("wage") || kw.includes("theft") || kw.includes("unpaid") || kw.includes("pay") || kw.includes("overtime")) {
      return '[sp_easyaccordion id="4167"]'; // Burbank Wage Theft Attorney
    }
    if (kw.includes("disability") || kw.includes("medical condition") || kw.includes("accommodation")) {
      return '[sp_easyaccordion id="3894"]'; // Burbank Disability Discrimination Lawyer
    }
    if (kw.includes("gender") || kw.includes("sex") || kw.includes("women") || kw.includes("pregnancy")) {
      return '[sp_easyaccordion id="3877"]'; // Burbank Gender Discrimination Lawyer
    }
  }

  // General Topic Matching across all 45 live posts
  if (kw.includes("race") || kw.includes("racial") || kw.includes("color") || kw.includes("ethnic") || kw.includes("national origin") || kw.includes("ancestry")) {
    return '[sp_easyaccordion id="4355"]'; // Burbank Race Discrimination Attorney
  }
  if (kw.includes("hostile") || kw.includes("toxic") || kw.includes("work environment")) {
    return '[sp_easyaccordion id="4200"]'; // Burbank Hostile Work Environment Lawyer
  }
  if (kw.includes("meal") || kw.includes("rest break") || kw.includes("lunch") || kw.includes("break")) {
    return '[sp_easyaccordion id="4119"]'; // Visalia Meal and Rest Break Violations
  }
  if (kw.includes("wage") || kw.includes("theft") || kw.includes("unpaid") || kw.includes("minimum wage") || kw.includes("off the clock")) {
    return '[sp_easyaccordion id="4167"]'; // Burbank Wage Theft Attorney
  }
  if (kw.includes("overtime")) {
    return '[sp_easyaccordion id="3719"]'; // overtime violations in Visalia
  }
  if (kw.includes("disability") || kw.includes("accommodation") || kw.includes("medical condition") || kw.includes("interactive process")) {
    return '[sp_easyaccordion id="3894"]'; // Burbank Disability Discrimination Lawyer
  }
  if (kw.includes("gender") || kw.includes("sex") || kw.includes("pregnancy") || kw.includes("pay equity")) {
    return '[sp_easyaccordion id="3877"]'; // Burbank Gender Discrimination Lawyer
  }
  if (kw.includes("maternity") || kw.includes("paternity")) {
    return '[sp_easyaccordion id="3356"]'; // Maternity Leave
  }
  if (kw.includes("sexual harassment") || kw.includes("quid pro quo")) {
    return '[sp_easyaccordion id="3464"]'; // San Pedro Sexual Harassment Lawyer
  }
  if (kw.includes("leave") || kw.includes("fmla") || kw.includes("cfra") || kw.includes("family")) {
    return '[sp_easyaccordion id="3788"]'; // Visalia Family and Medical Leave Lawyer
  }
  if (kw.includes("whistleblower")) {
    return '[sp_easyaccordion id="3646"]'; // What is whistleblower retaliation in Fresno, California?
  }
  if (kw.includes("retaliat")) {
    return '[sp_easyaccordion id="3740"]'; // What is workplace retaliation?
  }
  if (kw.includes("adverse")) {
    return '[sp_easyaccordion id="3932"]'; // What is an Adverse Employment Action?
  }
  if (kw.includes("evict") || kw.includes("landlord")) {
    return '[sp_easyaccordion id="3348"]'; // Landlord Eviction
  }
  if (kw.includes("tenant")) {
    return '[sp_easyaccordion id="3344"]'; // Tenant Harassment & Intimidation
  }
  if (kw.includes("sue") || kw.includes("on my own")) {
    return '[sp_easyaccordion id="3828"]'; // How Can I Sue My Employer on My Own in California?
  }
  if (kw.includes("wrongful") || kw.includes("termination") || kw.includes("firing") || kw.includes("fired")) {
    return '[sp_easyaccordion id="4176"]'; // Wrongful Termination Lawyer
  }

  // Default firm-wide fallback if no topic matches
  return '[sp_easyaccordion id="3932"]';
}

/**
 * Builds the clean compensation section containing:
 * 1. Legal compensation explanation and employee rights
 * 2. Topic-specific CTA linking to phone (747) 888-0077 and consultation
 * 3. Native Easy Accordion shortcode [sp_easyaccordion id="..."]
 *
 * CRITICAL CLIENT REQUIREMENT:
 * Absolutely NO inline <style> CSS, NO <script> JavaScript, and NO JSON-LD schema
 * inside this ACF field.
 */
export function buildCompensationSection(
  compensationIntro: string,
  faqs: AtoyanFaq[] = [],
  city = "California",
  keyword = "Employment Law",
  accordionShortcode?: string,
): string {
  const decomposed = decomposeKeyword(keyword, city);
  const resolvedCity = decomposed.city || city || "California";
  const cleanTopic = decomposed.cleanTopic || keyword || "Employment Law";
  let shortcode = (accordionShortcode || "").trim();
  if (shortcode && !shortcode.startsWith("[")) {
    shortcode = `[sp_easyaccordion id="${shortcode}"]`;
  }

  if (!shortcode) {
    const match = compensationIntro.match(/\[sp_easyaccordion\s+id=["']?(\d+)["']?\]/i);
    if (match) {
      shortcode = match[0];
    } else {
      const htmlIdMatch = compensationIntro.match(/sp-ea-(\d+)/i);
      if (htmlIdMatch) {
        shortcode = `[sp_easyaccordion id="${htmlIdMatch[1]}"]`;
      } else {
        shortcode = resolveDefaultAccordionShortcode(keyword, city);
      }
    }
  }

  // Strip any raw HTML accordion blocks (<div id="sp-ea-..." or <div class="...sp-easy-accordion...")
  // and existing shortcodes so compensation_content strictly retains only the clean legal editorial intro
  let cleanIntro = compensationIntro
    .replace(/<div\s+id=["']sp-ea-[\s\S]*$/i, "")
    .replace(/<div\s+class=["'][^"']*sp-easy-accordion[\s\S]*$/i, "")
    .replace(/\[sp_easyaccordion\s+id=["']?\d+["']?\]/gi, "")
    .trim();

  // If cleanIntro is missing or very short, construct high-authority legal rights overview
  if (!cleanIntro || cleanIntro.length < 50) {
    const kw = keyword.toLowerCase();
    let harmText = "experienced illegal workplace violations";
    let lawText = "California's employment laws are designed to protect employees from suffering career and financial harm";
    let claimText = "your workplace rights were violated";

    if (kw.includes("overtime") || kw.includes("wage") || kw.includes("theft") || kw.includes("unpaid")) {
      harmText = "worked the hours, California law may require your employer to pay you for them. And if those hours qualify as overtime, the employer may owe more than your normal hourly rate";
      lawText = "California's overtime laws are designed to protect employees from losing wages because they worked longer hours";
      claimText = "you were denied overtime pay or earned wages";
    } else if (kw.includes("wrongful") || kw.includes("termination") || kw.includes("firing")) {
      harmText = "were fired or pressured into resigning, California law may require your employer to compensate you for lost income, emotional distress, and statutory penalties";
      lawText = "California's wrongful termination laws are designed to protect employees from unlawful retaliation and discrimination";
      claimText = "you were wrongfully terminated";
    } else if (kw.includes("sexual") || kw.includes("quid pro quo")) {
      harmText = "experienced unwanted sexual advances, quid pro quo demands, or hostile sexual misconduct, California law holds employers strictly liable for supervisor misconduct and failure to protect workers";
      lawText = "California's Fair Employment and Housing Act (FEHA § 12940(j)) and the Silenced No More Act strictly protect workers from sexual harassment";
      claimText = "you experienced sexual harassment";
    } else if (kw.includes("workplace harassment") || kw.includes("harass") || kw.includes("hostile")) {
      harmText = "endured discriminatory hostility, offensive slurs, or an abusive work environment based on a protected category, California law holds employers accountable for failure to maintain a safe workplace";
      lawText = "California's Fair Employment and Housing Act (FEHA § 12940(j) & (k)) strictly protects employees from unlawful harassment and hostility";
      claimText = "you experienced workplace harassment";
    } else if (kw.includes("retaliat") || kw.includes("whistleblow")) {
      harmText = "faced adverse action after asserting your rights or reporting misconduct, California law provides strong protections against retaliation";
      lawText = "California Labor Code § 1102.5 and related statutes prohibit retaliating against workers who engage in protected activities";
      claimText = "you experienced illegal retaliation";
    } else if (kw.includes("disability") || kw.includes("medical") || kw.includes("leave")) {
      harmText = "were denied reasonable accommodation or penalized for taking protected medical leave, California law protects your health and employment rights";
      lawText = "California's CFRA, FMLA, and FEHA disability provisions protect workers requiring accommodations or leave";
      claimText = "your accommodation or medical leave rights were violated";
    }

    let adviceText = "Do not assume that workplace mistreatment has to be accepted in silence. California employment laws provide extensive protections that hold employers legally and financially accountable.";
    let claimType = "employment law claim";

    if (kw.includes("overtime") || kw.includes("wage") || kw.includes("theft") || kw.includes("unpaid")) {
      adviceText = "Do not assume that an employer's payroll system is always correct. Do not assume that being salaried automatically means you are exempt. And do not assume that a manager's instruction to work off the clock makes the work unpaid.";
      claimType = "wage and hour claim";
    } else if (kw.includes("sexual") || kw.includes("quid pro quo")) {
      adviceText = "Do not assume that verbal conduct without physical contact is permissible under California law. Do not believe HR when they claim a supervisor's behavior was merely personal, and remember that non-disclosure agreements cannot silence your right to disclose sexual harassment under the Silenced No More Act.";
      claimType = "sexual harassment claim";
    } else if (kw.includes("workplace harassment") || kw.includes("harass") || kw.includes("hostile")) {
      adviceText = "Do not assume that severe or pervasive hostility is just office politics. Do not accept management's excuse that offensive conduct was isolated, and know that California law strictly holds employers liable when they fail to take immediate and effective corrective action.";
      claimType = "workplace harassment claim";
    } else if (kw.includes("wrongful") || kw.includes("termination") || kw.includes("firing")) {
      adviceText = "Do not assume that because California is an at-will state an employer can fire you for illegal reasons. Do not sign a severance agreement or release of claims before having an attorney review whether your termination was retaliatory or discriminatory.";
      claimType = "wrongful termination claim";
    } else if (kw.includes("retaliat") || kw.includes("whistleblow")) {
      adviceText = "Do not assume that an employer can disguise retaliation as a restructuring, demotion, or bad performance review. California Labor Code § 1102.5 places the burden on employers to prove by clear and convincing evidence that adverse actions were not retaliatory.";
      claimType = "retaliation claim";
    } else if (kw.includes("disability") || kw.includes("medical") || kw.includes("leave")) {
      adviceText = "Do not assume that an employer can reject accommodations without engaging in a timely, good-faith interactive process. Under FEHA and CFRA, employers must explore reasonable alternatives to preserve your employment.";
      claimType = "disability discrimination claim";
    }

    cleanIntro = `<p>If you ${harmText}.</p>\r\n\r\n<p>${adviceText}</p>\r\n\r\n<p>${lawText}.</p>\r\n\r\n<p>If you believe ${claimText} in ${city}, WoodMart Law can help you understand your rights and evaluate your potential ${claimType}. <a href="/contact/">Contact</a> the firm to discuss what happened and learn what options may be available to you.</p>`;
  } else if (!cleanIntro.includes('href="/contact/"') && !cleanIntro.includes('href="https://demo.wp-post.com/contact-us/"')) {
    cleanIntro = `${cleanIntro}\r\n\r\n<p>If you believe your rights were violated in ${city}, WoodMart Law can help you understand your rights and evaluate your potential claim. <a href="/contact/">Contact</a> the firm to discuss what happened and learn what options may be available to you.</p>`;
  }

  // Return compensation intro followed by the standard Easy Accordion shortcode
  // [sp_easyaccordion id="..."] as required for WordPress templates/labor-law.php
  if (shortcode) {
    return `${cleanIntro}\r\n\r\n${shortcode}`;
  }
  return cleanIntro;
}

/**
 * Constructs the exact SCF / ACF `personal_injury_group` payload for WordPress REST API.
 */
export function buildAcfPersonalInjuryGroup(
  content: AtoyanLegalContent,
  bannerImageUrl: string,
  servicesImageUrl: string,
  servicesAttachmentId?: number,
  bannerAttachmentId?: number,
  baseGroup?: Partial<AcfPersonalInjuryGroup>,
): AcfPersonalInjuryGroup {
  const fullServicesContent = buildServicesContent(
    content.servicesContent,
    servicesImageUrl,
    content.heroTitle,
    servicesAttachmentId,
  );

  const fullCompensationContent = buildCompensationSection(
    content.compensationIntro,
    content.faqs,
    content.city,
    content.keyword,
    content.accordionShortcode,
  );

  return {
    personal_injury_image: bannerAttachmentId || ATOYAN_BANNER_ATTACHMENT_ID,
    personal_injury_title: content.heroTitle,
    _personal_injury_services_heading: content.servicesHeading,
    _personal_injury_services_sub_heading: content.servicesSubHeading,
    _personal_injury_services_content: stripCopiedClasses(fullServicesContent),
    _personal_injury_services_Sidebar:
      baseGroup?._personal_injury_services_Sidebar || ATOYAN_DEFAULT_SIDEBAR_IDS,
    testimonials_reviews_bg_image: ATOYAN_TESTIMONIALS_BG_ATTACHMENT_ID,
    testimonials_reviews_heading:
      baseGroup?.testimonials_reviews_heading || ATOYAN_TESTIMONIALS_HEADING,
    testimonials_reviews_sub_heading:
      baseGroup?.testimonials_reviews_sub_heading || ATOYAN_TESTIMONIALS_SUB_HEADING,
    testimonials_reviews_repet:
      baseGroup?.testimonials_reviews_repet || ATOYAN_TESTIMONIALS_REVIEWS,
    testimonials_reviews_button:
      baseGroup?.testimonials_reviews_button || ATOYAN_TESTIMONIALS_BUTTON,
    how_do_heading: content.howDoHeading,
    how_do_content: stripCopiedClasses(content.howDoContent),
    how_do_contact_form_heading:
      baseGroup?.how_do_contact_form_heading || ATOYAN_CONTACT_FORM_HEADING,
    how_do_contact_form_shortcode:
      baseGroup?.how_do_contact_form_shortcode || ATOYAN_CONTACT_FORM_SHORTCODE,
    cta_bg_image: ATOYAN_CTA_BG_ATTACHMENT_ID,
    cta_heading: baseGroup?.cta_heading || ATOYAN_CTA_HEADING,
    cta_content: baseGroup?.cta_content || ATOYAN_CTA_CONTENT,
    cta_button: baseGroup?.cta_button || ATOYAN_CTA_BUTTON,
    compensation_heading: content.compensationHeading,
    compensation_content: stripCopiedClasses(fullCompensationContent),
  };
}

/**
 * Dual-write postmeta dictionary for fallback persistence in case REST fields bypass ACF hooks.
 */
export function buildPostmetaDictionary(
  content: AtoyanLegalContent,
  bannerImageUrl: string,
  servicesImageUrl: string,
): Record<string, string> {
  return {
    _personal_injury_group: "field_678c8a98fc64a",
    personal_injury_group_personal_injury_image: bannerImageUrl,
    personal_injury_group_personal_injury_title: content.heroTitle,
    personal_injury_group__personal_injury_services_heading: content.servicesHeading,
    personal_injury_group__personal_injury_services_sub_heading: content.servicesSubHeading,
    personal_injury_group_how_do_heading: content.howDoHeading,
    personal_injury_group_how_do_content: content.howDoContent,
    personal_injury_group_compensation_heading: content.compensationHeading,
    _yoast_wpseo_title: content.yoastTitle,
    _yoast_wpseo_metadesc: content.yoastMetaDesc,
    _yoast_wpseo_focuskw: content.yoastFocusKw,
  };
}
