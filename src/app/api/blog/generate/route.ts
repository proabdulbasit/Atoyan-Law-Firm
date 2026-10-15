import { NextResponse } from "next/server";
import { Settings } from "@/lib/types";
import { generateBlogPost } from "@/lib/blog-poster";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const body = raw as Record<string, unknown>;
  const topic = String(body.topic || body.title || "").trim();
  if (topic.length < 3) {
    return NextResponse.json({ error: "validation_failed", message: "Topic is required." }, { status: 422 });
  }

  const settingsParsed = body.settings ? Settings.safeParse(body.settings) : null;
  const settings = settingsParsed?.success ? settingsParsed.data : undefined;
  const categories = Array.isArray(body.categories)
    ? body.categories.map((item) => String(item).trim()).filter(Boolean)
    : undefined;

  try {
    const result = await generateBlogPost({ topic, settings, categories });
    return NextResponse.json({
      success: true,
      provider: result.provider,
      content: result.content,
      image: result.image,
    });
  } catch (err) {
    console.error("Blog generate error:", err);
    return NextResponse.json(
      {
        error: "generation_failed",
        message: err instanceof Error ? err.message : "Failed to generate blog post",
      },
      { status: 500 },
    );
  }
}
