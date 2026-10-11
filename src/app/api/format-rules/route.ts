import { NextResponse } from "next/server";
import { Settings } from "@/lib/types";

/**
 * Publishes the active rule set so a reviewer can audit exactly what the
 * pipeline will do to a title, without generating anything — the same
 * "audit the deterministic source" pattern used across this shop's demos.
 */
export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }
  const parsed = Settings.partial().safeParse((raw as { settings?: unknown })?.settings ?? raw);
  const settings = Settings.parse(parsed.success ? parsed.data : {});

  return NextResponse.json({
    heading_class: settings.heading_class,
    cta_shortcode: settings.cta_shortcode,
    cta_after_paragraph: settings.cta_after_paragraph,
    keyword_links: settings.keyword_links,
    acf_mapping: settings.acf_mapping,
    image_template: settings.image_template,
    llm_provider: settings.llm_provider,
  });
}
