import fs from "fs";
import path from "path";
import type { TrackedArticle } from "./types";
export type { TrackedArticle };

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

  // 1. Seed Core Hubs
  for (const a of CORE_ATOYAN_HUB_PAGES) {
    articleMap.set(a.slug, a);
  }

  // 2. Seed Location Pages
  for (const a of CORE_ATOYAN_LOCATION_PAGES) {
    articleMap.set(a.slug, a);
  }

  // 3. Load dynamically tracked articles from local disk
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      const fileData = fs.readFileSync(LOCAL_STORE_PATH, "utf8");
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item?.slug && item?.url) {
            articleMap.set(item.slug, item);
          }
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
  lines.push("### LIVE ATOYAN LAW FIRM INTERNAL LINK CATALOG (USE FOR SEO LINKING):");
  lines.push("You MUST contextually weave 3 to 5+ of these exact live links into `servicesContent`, 1-2 into `howDoContent`, and `/contact/` into `compensationIntro`. DO NOT link to the current page itself.");
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
