import crypto from "crypto";
import { NextResponse } from "next/server";
import { Settings } from "@/lib/types";
import { generateBlogPost, publishBlogPost, type BlogPostContent, type BlogGeneratedImage } from "@/lib/blog-poster";

export const runtime = "nodejs";
export const maxDuration = 300;

function isPasswordValid(provided: string, expected: string): boolean {
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(expected);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function GET() {
  return NextResponse.json({
    protected: Boolean(process.env.WP_SUPER_ADMIN?.trim()),
  });
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const body = raw as Record<string, unknown>;
  const configuredSuperAdmin = process.env.WP_SUPER_ADMIN?.trim();
  if (configuredSuperAdmin) {
    const headerPassword = req.headers.get("x-admin-password")?.trim();
    const bodyPassword = typeof body.admin_password === "string" ? body.admin_password.trim() : undefined;
    const providedPassword = headerPassword || bodyPassword;
    if (!providedPassword || !isPasswordValid(providedPassword, configuredSuperAdmin)) {
      return NextResponse.json(
        {
          error: "unauthorized",
          message: "Invalid or missing admin password. Publishing blog posts is protected by WP_SUPER_ADMIN.",
        },
        { status: 401 },
      );
    }
  }

  const settingsParsed = body.settings ? Settings.safeParse(body.settings) : null;
  const settings = settingsParsed?.success ? settingsParsed.data : undefined;
  const scheduleAt = typeof body.schedule_at === "string" ? body.schedule_at : undefined;

  try {
    let content = body.content as BlogPostContent | undefined;
    let image = body.image as BlogGeneratedImage | undefined;
    const featuredMediaId =
      typeof body.featuredMediaId === "number"
        ? body.featuredMediaId
        : typeof body.featured_media_id === "number"
          ? body.featured_media_id
          : undefined;

    if (!content || !content.contentHtml) {
      const topic = String(body.topic || body.title || "").trim();
      if (topic.length < 3) {
        return NextResponse.json({ error: "validation_failed", message: "Topic or content is required." }, { status: 422 });
      }
      const generated = await generateBlogPost({
        topic,
        settings,
        categories: Array.isArray(body.categories)
          ? body.categories.map((item) => String(item).trim()).filter(Boolean)
          : undefined,
      });
      content = generated.content;
      image = generated.image;
    }

    // Drop the preview data URL so the publish path keeps less image data in memory.
    if (image) {
      const { dataUrl: _drop, ...rest } = image;
      image = rest;
    }

    const result = await publishBlogPost({
      content,
      image,
      featuredMediaId,
      settings,
      scheduleAt,
    });

    return NextResponse.json({
      success: true,
      ...result,
      content,
    });
  } catch (err) {
    console.error("Blog publish error:", err);
    return NextResponse.json(
      {
        error: "publish_failed",
        message: err instanceof Error ? err.message : "Failed to publish blog post",
      },
      { status: 500 },
    );
  }
}
