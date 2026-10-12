import fs from "fs";
import path from "path";
import type { TrackedArticle } from "./types";
export type { TrackedArticle };

const DEMO_SITE = "https://demo.wp-post.com";
const DEMO_CONTACT_URL = `${DEMO_SITE}/contact-us/`;

const DEMO_PAGE_BY_SLUG: Record<string, string> = {
  "wrongful-termination": `${DEMO_SITE}/wrongful-termination/`,
  "sexual-harassment": `${DEMO_SITE}/sexual-harassment/`,
  "work-retaliation": `${DEMO_SITE}/california-retaliation-lawyer/`,
  "whistleblowing-laws": `${DEMO_SITE}/california-retaliation-lawyer/`,
  "disability-discrimination": `${DEMO_SITE}/california-disability-discrimination-lawyer/`,
  "pregnancy-discrimination": `${DEMO_SITE}/california-pregnancy-discrimination-lawyer/`,
};

/** Turns a previous-project URL into a page on this site, or the contact page. */
export function demoUrlForSlug(slug: string): string {
  return DEMO_PAGE_BY_SLUG[slug] || DEMO_CONTACT_URL;
}

function onThisSite(article: TrackedArticle): TrackedArticle | null {
  if (!article?.slug || !article.url) return null;
  if (!article.url.includes("atoyanlaw.com")) return article;
  const url = demoUrlForSlug(article.slug);
  if (url.endsWith("/contact-us/") && article.isHub !== true && article.slug !== "contact-us") {
    return null;
  }
  return { ...article, url };
}

/**
 * Pre-seeded authentic Atoyan Law Firm practice area hub pages and live location pages.
 * Verified directly against atoyanlaw.com.
 */
export const CORE_ATOYAN_HUB_PAGES: TrackedArticle[] = [
  {
    slug: "overtime-pay",
    title: "Overtime Pay & Wage Law in California",
    keyword: "Overtime Pay Violations",
    category: "overtime",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/overtime-pay/",
    isHub: true,
  },
  {
    slug: "work-retaliation",
    title: "Workplace Retaliation Lawyer in California",
    keyword: "Workplace Retaliation",
    category: "workplace_retaliation",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/work-retaliation/",
    isHub: true,
  },
  {
    slug: "wrongful-termination",
    title: "Wrongful Termination Attorney in California",
    keyword: "Wrongful Termination",
    category: "wrongful_termination",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/wrongful-termination/",
    isHub: true,
  },
  {
    slug: "sexual-harassment",
    title: "Sexual Harassment Lawyer California",
    keyword: "Sexual Harassment",
    category: "sexual_harassment",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/sexual-harassment/",
    isHub: true,
  },
  {
    slug: "hostile-work-environment",
    title: "Hostile Work Environment Attorney California",
    keyword: "Hostile Work Environment",
    category: "sexual_harassment",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/hostile-work-environment/",
    isHub: true,
  },
  {
    slug: "race-discrimination",
    title: "Race Discrimination Lawyer in California",
    keyword: "Race Discrimination",
    category: "race_discrimination",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/race-discrimination/",
    isHub: true,
  },
  {
    slug: "disability-discrimination",
    title: "Disability Discrimination & Accommodation Attorney",
    keyword: "Disability Discrimination",
    category: "disability",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/disability-discrimination/",
    isHub: true,
  },
  {
    slug: "family-and-medical-leave",
    title: "Family and Medical Leave (FMLA / CFRA) Lawyer",
    keyword: "Family and Medical Leave",
    category: "family_medical_leave",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/family-and-medical-leave/",
    isHub: true,
  },
  {
    slug: "meal-and-rest-break-violations",
    title: "Meal and Rest Break Violations Attorney",
    keyword: "Meal and Rest Break Violations",
    category: "meal_breaks",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/meal-and-rest-break-violations/",
    isHub: true,
  },
  {
    slug: "unpaid-wages",
    title: "Unpaid Wages & Wage Theft Lawyer California",
    keyword: "Unpaid Wages",
    category: "wage_theft",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/unpaid-wages/",
    isHub: true,
  },
  {
    slug: "wage-hour-violations",
    title: "Wage & Hour Violations Attorney California",
    keyword: "Wage and Hour Violations",
    category: "wage_theft",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/wage-hour-violations/",
    isHub: true,
  },
  {
    slug: "pregnancy-discrimination",
    title: "Pregnancy Discrimination & PDL Rights Lawyer",
    keyword: "Pregnancy Discrimination",
    category: "pregnancy_discrimination",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/pregnancy-discrimination/",
    isHub: true,
  },
  {
    slug: "whistleblowing-laws",
    title: "California Whistleblower Protections Attorney",
    keyword: "Whistleblower Retaliation",
    category: "workplace_retaliation",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/whistleblowing-laws/",
    isHub: true,
  },
  {
    slug: "what-is-employment-discrimination",
    title: "What is Employment Discrimination in California?",
    keyword: "Employment Discrimination",
    category: "discrimination",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/what-is-employment-discrimination/",
    isHub: true,
  },
  {
    slug: "breach-of-contract",
    title: "Employment Breach of Contract Attorney",
    keyword: "Breach of Employment Contract",
    category: "contract",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/breach-of-contract/",
    isHub: true,
  },
  {
    slug: "age-discrimination",
    title: "Age Discrimination in Employment Lawyer",
    keyword: "Age Discrimination",
    category: "age_discrimination",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/age-discrimination/",
    isHub: true,
  },
  {
    slug: "gender-discrimination",
    title: "Gender Discrimination & Equal Pay Attorney",
    keyword: "Gender Discrimination",
    category: "gender_discrimination",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/gender-discrimination/",
    isHub: true,
  },
  {
    slug: "unlawful-vs-wrongful-termination",
    title: "Unlawful vs. Wrongful Termination in California",
    keyword: "Unlawful Termination",
    category: "wrongful_termination",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/unlawful-vs-wrongful-termination/",
    isHub: true,
  },
];

/**
 * Pre-seeded location-specific practice area pages live on atoyanlaw.com.
 */
export const CORE_ATOYAN_LOCATION_PAGES: TrackedArticle[] = [
  {
    slug: "burbank-wrongful-termination-lawyer",
    title: "Burbank Wrongful Termination Lawyer",
    keyword: "Burbank Wrongful Termination Lawyer",
    city: "Burbank",
    category: "wrongful_termination",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/burbank-wrongful-termination-lawyer/",
  },
  {
    slug: "visalia-overtime-violation-lawyer",
    title: "Visalia Overtime Violation Lawyer",
    keyword: "Visalia Overtime Violations",
    city: "Visalia",
    category: "overtime",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/visalia-overtime-violation-lawyer/",
  },
  {
    slug: "visalia-pregnancy-discrimination-lawyer",
    title: "Visalia Pregnancy Discrimination Lawyer",
    keyword: "Visalia Pregnancy Discrimination",
    city: "Visalia",
    category: "pregnancy_discrimination",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/visalia-pregnancy-discrimination-lawyer/",
  },
  {
    slug: "visalia-wrongful-termination-attorney",
    title: "Visalia Wrongful Termination Attorney",
    keyword: "Visalia Wrongful Termination Attorney",
    city: "Visalia",
    category: "wrongful_termination",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/visalia-wrongful-termination-attorney/",
  },
  {
    slug: "visalia-sexual-harassment-lawyer",
    title: "Visalia Sexual Harassment Lawyer",
    keyword: "Visalia Sexual Harassment",
    city: "Visalia",
    category: "sexual_harassment",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/visalia-sexual-harassment-lawyer/",
  },
  {
    slug: "visalia-workplace-discrimination",
    title: "Visalia Workplace Discrimination Lawyer",
    keyword: "Visalia Workplace Discrimination",
    city: "Visalia",
    category: "discrimination",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/visalia-workplace-discrimination/",
  },
  {
    slug: "visalia-family-medical-leave",
    title: "Visalia Family & Medical Leave Lawyer",
    keyword: "Visalia Family and Medical Leave",
    city: "Visalia",
    category: "family_medical_leave",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/visalia-family-medical-leave/",
  },
  {
    slug: "visalia-unpaid-wages",
    title: "Visalia Unpaid Wages Lawyer",
    keyword: "Visalia Unpaid Wages",
    city: "Visalia",
    category: "wage_theft",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/visalia-unpaid-wages/",
  },
  {
    slug: "visalia-work-retaliation-lawyer",
    title: "Visalia Work Retaliation Lawyer",
    keyword: "Visalia Work Retaliation",
    city: "Visalia",
    category: "workplace_retaliation",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/visalia-work-retaliation-lawyer/",
  },
  {
    slug: "visalia-wage-and-hour-violations",
    title: "Visalia Wage & Hour Violations Attorney",
    keyword: "Visalia Wage and Hour Violations",
    city: "Visalia",
    category: "wage_theft",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/visalia-wage-and-hour-violations/",
  },
  {
    slug: "visalia-gender-discrimination",
    title: "Visalia Gender Discrimination Lawyer",
    keyword: "Visalia Gender Discrimination",
    city: "Visalia",
    category: "gender_discrimination",
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/visalia-gender-discrimination/",
  },
];

const LOCAL_STORE_PATH = path.join(process.cwd(), "data/published-articles.json");

let runtimeArticlesCache: TrackedArticle[] | null = null;

/**
 * Loads all tracked articles, combining pre-seeded core hub articles, location pages,
 * and dynamically recorded published articles from local disk.
 */
export function getAllTrackedArticles(): TrackedArticle[] {
  if (runtimeArticlesCache) {
    return runtimeArticlesCache;
  }

  const articleMap = new Map<string, TrackedArticle>();

  for (const a of CORE_ATOYAN_HUB_PAGES) {
    const local = onThisSite(a);
    if (local) articleMap.set(local.slug, local);
  }

  // Location pages from the first project are not on this site, so they are not linked.

  // Load pages recorded for this site. Drop any saved link that still points at the first project
  // unless it maps to a real page here.
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      const fileData = fs.readFileSync(LOCAL_STORE_PATH, "utf8");
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const local = onThisSite(item);
          if (local) articleMap.set(local.slug, local);
        }
      }
    }
  } catch (err) {
    console.warn("Could not read local published articles file:", err);
  }

  runtimeArticlesCache = Array.from(articleMap.values());
  return runtimeArticlesCache;
}

/**
 * Records a newly generated / published practice area article into the tracked catalog.
 * Writes to both runtime cache and persistent local disk storage.
 */
export function trackPublishedArticle(article: TrackedArticle): TrackedArticle {
  const all = getAllTrackedArticles();
  const existingIdx = all.findIndex((a) => a.slug === article.slug);

  if (existingIdx >= 0) {
    all[existingIdx] = { ...all[existingIdx], ...article };
  } else {
    all.push(article);
  }

  runtimeArticlesCache = all;

  // Persist to disk
  try {
    const dir = path.dirname(LOCAL_STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(all, null, 2), "utf8");
  } catch (err) {
    console.warn("Could not write to local published articles store:", err);
  }

  return article;
}

/**
 * Finds the most relevant sister articles and hub articles to link into a new post,
 * excluding the current post's own slug to prevent self-linking.
 */
export function findRelevantArticlesForTopic(params: {
  category: string;
  city?: string;
  currentSlug: string;
}): {
  hubArticles: TrackedArticle[];
  sisterArticles: TrackedArticle[];
  cityArticles: TrackedArticle[];
} {
  const { category, city, currentSlug } = params;
  const all = getAllTrackedArticles().filter((a) => a.slug !== currentSlug);

  const hubArticles = all.filter((a) => a.isHub);
  const sisterArticles = all.filter((a) => !a.isHub && a.category === category);
  const cityArticles = city
    ? all.filter((a) => !a.isHub && a.city?.toLowerCase() === city.toLowerCase())
    : [];

  return { hubArticles, sisterArticles, cityArticles };
}

/**
 * Builds a markdown-formatted internal linking catalog for the LLM prompt.
 * Gives the LLM the exact live URLs and natural anchor texts to use for maximum SEO authority.
 */
export function buildLinkingCatalogForLlm(params: {
  category: string;
  city: string;
  currentSlug: string;
}): string {
  const { category, city, currentSlug } = params;
  const { hubArticles, cityArticles, sisterArticles } = findRelevantArticlesForTopic({
    category,
    city,
    currentSlug,
  });

  const lines: string[] = [];
  lines.push("### INTERNAL LINKS ON DEMO.WP-POST.COM:");
  lines.push("Link only to the pages below or to https://demo.wp-post.com/contact-us/. Never link to atoyanlaw.com or any other law firm. Do not link to the current page itself.");
  lines.push("");
  lines.push("#### Priority Hub & Practice Area Pages:");

  for (const h of hubArticles.slice(0, 12)) {
    lines.push(`- URL: \`${h.url}\` | Topic: ${h.title} | Suggested Anchor Texts: "${h.keyword.toLowerCase()}", "${h.slug.replace(/-/g, " ")}"`);
  }

  if (cityArticles.length > 0) {
    lines.push("");
    lines.push(`#### Priority Localized Articles for ${city}:`);
    for (const c of cityArticles.slice(0, 5)) {
      lines.push(`- URL: \`${c.url}\` | Topic: ${c.title} | Anchor Text: "${c.keyword.toLowerCase()}"`);
    }
  }

  if (sisterArticles.length > 0) {
    lines.push("");
    lines.push("#### Related Practice Area Articles:");
    for (const s of sisterArticles.slice(0, 5)) {
      lines.push(`- URL: \`${s.url}\` | Topic: ${s.title}`);
    }
  }

  return lines.join("\n");
}
