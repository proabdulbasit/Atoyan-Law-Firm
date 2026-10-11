import { NextRequest, NextResponse } from "next/server";
import {
  getAllTrackedArticles,
  trackPublishedArticle,
  findRelevantArticlesForTopic,
  buildLinkingCatalogForLlm,
} from "@/lib/article-tracker";
import type { TrackedArticle } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const city = searchParams.get("city") || "";
    const currentSlug = searchParams.get("currentSlug") || "";
    const search = searchParams.get("q")?.toLowerCase() || "";

    const all = getAllTrackedArticles();

    if (category || city) {
      const relevant = findRelevantArticlesForTopic({
        category,
        city,
        currentSlug,
      });

      const catalog = buildLinkingCatalogForLlm({
        category,
        city,
        currentSlug,
      });

      return NextResponse.json({
        total: all.length,
        relevant,
        catalog,
        all,
      });
    }

    let filtered = all;
    if (search) {
      filtered = all.filter(
        (a) =>
          a.title.toLowerCase().includes(search) ||
          a.slug.toLowerCase().includes(search) ||
          a.keyword.toLowerCase().includes(search) ||
          (a.city && a.city.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      total: filtered.length,
      articles: filtered,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to retrieve articles";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, title, keyword, city, category, url, publishedAt, isHub } = body;

    if (!slug || !title || !keyword || !url) {
      return NextResponse.json(
        { error: "Missing required fields: slug, title, keyword, url" },
        { status: 400 }
      );
    }

    const article: TrackedArticle = {
      slug: slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      title: String(title).trim(),
      keyword: String(keyword).trim(),
      city: city ? String(city).trim() : undefined,
      category: category ? String(category).trim().toLowerCase() : "california employment law",
      url: String(url).trim(),
      publishedAt: publishedAt || new Date().toISOString(),
      isHub: Boolean(isHub),
    };

    trackPublishedArticle(article);

    return NextResponse.json({
      success: true,
      message: `Tracked article: ${article.title}`,
      article,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to save article";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
