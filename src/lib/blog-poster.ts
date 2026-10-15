import sharp from "sharp";
import type { Settings } from "./types";
import { articleRulesFromSettings } from "./article-prompt";
import { generateAtoyanImages } from "./imagen";
import { uploadMediaToWordPress, updateYoastSeo } from "./wordpress";
import { colorContentLinks } from "./article-enforce";

export interface BlogPostContent {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyphrase: string;
  contentHtml: string;
  excerpt: string;
  categories: string[];
}

export interface BlogGeneratedImage {
  filename: string;
  altText: string;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  dataUrl?: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function plainWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function defaultCategories(topic: string): string[] {
  const lower = topic.toLowerCase();
  const cats = ["Employment Law"];
  if (/pregnan/.test(lower)) cats.push("Pregnancy Discrimination");
  else if (/sexual harassment|harassment/.test(lower)) cats.push("Sexual Harassment");
  else if (/wrongful|termination|fired/.test(lower)) cats.push("Wrongful Termination");
  else if (/retaliat/.test(lower)) cats.push("Retaliation");
  else if (/disability/.test(lower)) cats.push("Disability Discrimination");
  else if (/discriminat|lgbtq|race|age|gender/.test(lower)) cats.push("Discrimination");
  else cats.push("Workplace Rights");
  return cats;
}

/** Offline blog draft when OpenAI or Gemini is unavailable. */
export function simulateBlogPost(topic: string, wordTarget = 700): BlogPostContent {
  const title = topic.trim();
  const clean = title.replace(/\s*\|\s*WoodMart Law\s*$/i, "").trim() || "California Employment Law Guide";
  const slug = slugify(clean);
  const categories = defaultCategories(clean);
  const metaTitle = /woodmart law/i.test(title) ? clean : `${clean} | WoodMart Law`;
  const metaDescription = `${clean}: worker rights, proof, and deadlines under California law. WoodMart Law can help. Call (323) 968-0000.`;
  const goal = Math.max(450, Math.min(wordTarget || 700, 900));

  const sections = [
    {
      h: `What does ${clean} mean for California workers?`,
      p: `<p>${escapeHtml(clean)} affects real jobs, pay, and careers. California FEHA and related Labor Code rules give workers tools when an employer crosses the line. This guide explains the basics in plain language.</p><p>Workers often want a clear answer to one question first: was the treatment illegal under California law, or was it merely unfair.</p>`,
    },
    {
      h: "What facts usually matter in this kind of case?",
      p: `<p>Dates, emails, write-ups, witness names, and medical or HR notes often decide the next step. Keep copies of what you already have. Do not take confidential files that do not belong to you.</p><p>A short timeline helps. Write down when the problem started, who you told, and what the employer said next. Compare that timeline with any sudden change in reviews, hours, or duties.</p>`,
    },
    {
      h: "How does California law protect the worker?",
      p: `<p>California Civil Rights Department claims, Labor Commissioner filings, and court cases each have their own clocks. Missing a deadline can close the claim. A lawyer can match the facts to the right forum.</p><p>Federal agencies may also matter when the workplace is large enough. The state rules often give broader coverage for smaller employers. The right path depends on the facts, not on one generic form letter.</p>`,
    },
    {
      h: "What evidence helps prove the claim?",
      p: `<p>Positive reviews before the complaint, inconsistent reasons for discipline, and messages that show bias or retaliation can all matter. Comparator evidence, meaning how other workers were treated for similar conduct, can also help.</p><p>California workers should not guess about deadlines. The Civil Rights Department, the Labor Commissioner, and the courts each apply different clocks. Early notes and documents make those choices clearer.</p>`,
    },
    {
      h: "What should you do before you talk to a lawyer?",
      p: `<p>Save pay stubs, performance reviews, and messages about the dispute. Note any leave request, complaint, or accommodation ask that came before the discipline or firing.</p><p>WoodMart Law can review what happened and explain the options. Call (323) 968-0000 or use the contact page for a free consultation.</p>`,
    },
  ];

  let html = "";
  for (const section of sections) {
    const next = `${html}\n\n<h2>${escapeHtml(section.h)}</h2>\n${section.p}`.trim();
    html = next;
    if (plainWords(html) >= goal) break;
  }

  return {
    title: clean,
    slug,
    metaTitle,
    metaDescription: metaDescription.slice(0, 155),
    focusKeyphrase: clean,
    contentHtml: colorContentLinks(html),
    excerpt: `A practical overview of ${clean.toLowerCase()} for California workers, including evidence, deadlines, and next steps.`,
    categories,
  };
}

async function tryOpenAiBlog(topic: string, wordCount: number, apiKey?: string): Promise<BlogPostContent | null> {
  const key = apiKey?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write WoodMart Law blog posts for California employment workers. Return JSON only with keys: title, metaTitle, metaDescription, focusKeyphrase, contentHtml, excerpt, categories (string array). contentHtml must use h2 and p tags only. No em dashes. About the requested word count. Firm phone (323) 968-0000. Do not name competitor firms.",
          },
          {
            role: "user",
            content: `Topic: ${topic}\nTarget words: ${wordCount}\nMeta title should include WoodMart Law when natural.`,
          },
        ],
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content;
    if (!text) return null;
    const parsed = JSON.parse(text) as Partial<BlogPostContent>;
    const title = String(parsed.title || topic).trim();
    return {
      title,
      slug: slugify(title),
      metaTitle: String(parsed.metaTitle || `${title} | WoodMart Law`).trim(),
      metaDescription: String(parsed.metaDescription || "").trim().slice(0, 160),
      focusKeyphrase: String(parsed.focusKeyphrase || title).trim(),
      contentHtml: colorContentLinks(String(parsed.contentHtml || "")),
      excerpt: String(parsed.excerpt || "").trim(),
      categories:
        Array.isArray(parsed.categories) && parsed.categories.length
          ? parsed.categories.map((c) => String(c).trim()).filter(Boolean)
          : defaultCategories(title),
    };
  } catch {
    return null;
  }
}

export async function generateBlogPost(params: {
  topic: string;
  settings?: Settings;
  categories?: string[];
}): Promise<{ content: BlogPostContent; image: BlogGeneratedImage; provider: string }> {
  const topic = params.topic.trim();
  if (topic.length < 3) throw new Error("Topic must be at least 3 characters.");
  const rules = articleRulesFromSettings(params.settings);
  const providerSetting = params.settings?.llm_provider || "openai";

  let content: BlogPostContent | null = null;
  let provider = "simulator";

  if (providerSetting !== "simulator") {
    content = await tryOpenAiBlog(topic, rules.wordCount, params.settings?.openai_api_key);
    if (content) provider = "openai";
  }
  if (!content) {
    content = simulateBlogPost(topic, Math.min(Math.max(rules.wordCount, 500), 900));
    provider = "simulator";
  }

  if (params.categories?.length) {
    content.categories = params.categories.map((c) => c.trim()).filter(Boolean);
  }

  const images = await generateAtoyanImages({
    keyword: content.title,
    slug: content.slug,
    apiKey: params.settings?.gemini_api_key,
    openaiKey: params.settings?.openai_api_key,
  });

  const image: BlogGeneratedImage = {
    filename: `${content.slug}-featured.jpg`,
    altText: images.banner.altText || content.title,
    base64: images.banner.base64,
    mimeType: images.banner.mimeType || "image/jpeg",
    width: images.banner.width,
    height: images.banner.height,
    dataUrl: `data:${images.banner.mimeType || "image/jpeg"};base64,${images.banner.base64}`,
  };

  return { content, image, provider };
}

async function resolveCategoryIds(params: {
  names: string[];
  wpSiteUrl: string;
  authHeader: string;
}): Promise<number[]> {
  const cleanBase = params.wpSiteUrl.replace(/\/$/, "");
  const ids: number[] = [];
  for (const name of params.names) {
    const search = await fetch(
      `${cleanBase}/wp-json/wp/v2/categories?search=${encodeURIComponent(name)}&per_page=20`,
      {
        headers: { Authorization: `Basic ${params.authHeader}` },
        signal: AbortSignal.timeout(15_000),
      },
    );
    let matchId: number | undefined;
    if (search.ok) {
      const list = (await search.json()) as Array<{ id: number; name: string }>;
      const exact = list.find((item) => item.name.toLowerCase() === name.toLowerCase());
      matchId = exact?.id || list[0]?.id;
    }
    if (!matchId) {
      const created = await fetch(`${cleanBase}/wp-json/wp/v2/categories`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${params.authHeader}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
        signal: AbortSignal.timeout(15_000),
      });
      if (created.ok) {
        const json = (await created.json()) as { id?: number };
        matchId = json.id;
      }
    }
    if (matchId) ids.push(matchId);
  }
  return [...new Set(ids)];
}

/** Shrink the featured image so WordPress does not run out of memory on first publish. */
async function compressBlogFeaturedImage(image: BlogGeneratedImage): Promise<BlogGeneratedImage> {
  try {
    const input = Buffer.from(image.base64, "base64");
    const out = await sharp(input)
      .rotate()
      .resize({ width: 1200, height: 675, fit: "cover", withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    return {
      ...image,
      base64: out.data.toString("base64"),
      mimeType: "image/jpeg",
      filename: (image.filename || "blog-featured.jpg").replace(/\.\w+$/, ".jpg"),
      width: out.info.width,
      height: out.info.height,
      dataUrl: undefined,
    };
  } catch (err) {
    console.warn("Blog featured image compress skipped:", err);
    const { dataUrl: _drop, ...rest } = image;
    return rest;
  }
}

async function findPostBySlug(params: {
  cleanBase: string;
  authHeader: string;
  slug: string;
}): Promise<{ id: number; link?: string } | null> {
  try {
    const res = await fetch(
      `${params.cleanBase}/wp-json/wp/v2/posts?slug=${encodeURIComponent(params.slug)}&status=publish,draft,future,pending&_fields=id,link,slug`,
      {
        headers: { Authorization: `Basic ${params.authHeader}` },
        signal: AbortSignal.timeout(20_000),
      },
    );
    if (!res.ok) return null;
    const list = (await res.json()) as Array<{ id: number; link?: string; slug?: string }>;
    const match = list.find((item) => item.slug === params.slug) || list[0];
    return match?.id ? { id: match.id, link: match.link } : null;
  } catch {
    return null;
  }
}

async function createWordPressPost(params: {
  cleanBase: string;
  authHeader: string;
  payload: Record<string, unknown>;
}): Promise<{ id: number; link?: string }> {
  const slug = typeof params.payload.slug === "string" ? params.payload.slug : "";
  // Ask WP for a tiny response — full post JSON + theme/Yoast rendering can tip PHP over the memory limit.
  const attempt = async () =>
    fetch(`${params.cleanBase}/wp-json/wp/v2/posts?_fields=id,link,status`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${params.authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params.payload),
      signal: AbortSignal.timeout(60_000),
    });

  let lastErr = "";
  for (let i = 0; i < 3; i++) {
    if (i > 0) await new Promise((resolve) => setTimeout(resolve, 2000 * i));
    const createRes = await attempt();
    if (createRes.ok) {
      return (await createRes.json()) as { id: number; link?: string };
    }
    lastErr = await createRes.text();
    // First click often dies with "Allowed memory size exhausted" while WP still saved the post.
    if (slug && createRes.status >= 500) {
      const existing = await findPostBySlug({
        cleanBase: params.cleanBase,
        authHeader: params.authHeader,
        slug,
      });
      if (existing) return existing;
    }
    if (createRes.status < 500) break;
  }
  throw new Error(`Blog post create failed: ${lastErr.slice(0, 300)}`);
}

export async function publishBlogPost(params: {
  content: BlogPostContent;
  image?: BlogGeneratedImage;
  featuredMediaId?: number;
  settings?: Settings;
  scheduleAt?: string;
}): Promise<{
  mode: "live" | "simulated";
  status: "publish" | "future";
  postId?: number;
  postUrl?: string;
  editUrl?: string;
  featuredMediaId?: number;
  categoryIds?: number[];
  yoastUpdated?: boolean;
}> {
  const { content, image, settings, scheduleAt } = params;
  const wpSiteUrl =
    process.env.WP_SITE_URL?.trim() ||
    settings?.wp_site_url?.trim() ||
    "https://demo.wp-post.com/";
  const wpUser = process.env.WP_USER?.trim() || settings?.wp_username?.trim();
  const wpPassword = process.env.WP_PASSWORD?.trim() || settings?.wp_app_password?.trim();
  const cleanBase = wpSiteUrl.replace(/\/$/, "");
  const status = scheduleAt ? "future" : "publish";

  if (!wpUser || !wpPassword) {
    return {
      mode: "simulated",
      status,
      postId: 0,
      postUrl: `${cleanBase}/${content.slug}/`,
      editUrl: `${cleanBase}/wp-admin/post.php?post=0&action=edit`,
      yoastUpdated: true,
    };
  }

  const authHeader = Buffer.from(`${wpUser}:${wpPassword}`).toString("base64");

  // Categories first, then create the post without the image so PHP stays under the memory limit.
  const categoryIds = await resolveCategoryIds({
    names: content.categories,
    wpSiteUrl: cleanBase,
    authHeader,
  });

  const payload: Record<string, unknown> = {
    title: content.title,
    slug: content.slug,
    status,
    content: content.contentHtml,
    excerpt: content.excerpt,
    categories: categoryIds,
  };
  if (scheduleAt) {
    const d = new Date(scheduleAt);
    if (!Number.isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0");
      payload.date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
  }

  const created = await createWordPressPost({ cleanBase, authHeader, payload });
  const postId = created.id;
  const postUrl = created.link || `${cleanBase}/?p=${postId}`;
  const editUrl = `${cleanBase}/wp-admin/post.php?post=${postId}&action=edit`;

  // Upload the compressed image only after the post exists, and attach it in a separate request.
  // Doing upload + featured_media on create is what triggered PHP "Allowed memory size exhausted" on first click.
  let featuredMediaId = params.featuredMediaId;
  if (!featuredMediaId && image?.base64) {
    const compact = await compressBlogFeaturedImage(image);
    try {
      const uploaded = await uploadMediaToWordPress({
        base64Data: compact.base64,
        filename: compact.filename || `${content.slug}-featured.jpg`,
        mimeType: compact.mimeType || "image/jpeg",
        altText: compact.altText || content.title,
        title: content.title,
        wpSiteUrl: cleanBase,
        authHeader,
      });
      featuredMediaId = uploaded.id;
    } catch (mediaErr) {
      console.warn("Blog featured image upload failed, retrying once:", mediaErr);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const compactRetry = await compressBlogFeaturedImage(image);
      const uploaded = await uploadMediaToWordPress({
        base64Data: compactRetry.base64,
        filename: compactRetry.filename || `${content.slug}-featured.jpg`,
        mimeType: compactRetry.mimeType || "image/jpeg",
        altText: compactRetry.altText || content.title,
        title: content.title,
        wpSiteUrl: cleanBase,
        authHeader,
      });
      featuredMediaId = uploaded.id;
    }
  }

  if (featuredMediaId) {
    try {
      await fetch(`${cleanBase}/wp-json/wp/v2/posts/${postId}?_fields=id,featured_media`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ featured_media: featuredMediaId }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (featureErr) {
      console.warn("Could not attach featured image after create:", featureErr);
    }
  }

  const yoastUpdated = await updateYoastSeo({
    postId,
    title: content.metaTitle,
    description: content.metaDescription,
    focusKeyphrase: content.focusKeyphrase,
    wpSiteUrl: cleanBase,
    authHeader,
  });

  return {
    mode: "live",
    status,
    postId,
    postUrl,
    editUrl,
    featuredMediaId,
    categoryIds,
    yoastUpdated,
  };
}
