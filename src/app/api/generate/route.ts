import { NextResponse } from "next/server";
import { GenerateRequest } from "@/lib/types";
import { generateAtoyanContent, extractCity, activeProvider } from "@/lib/llm";
import { generateAtoyanImages } from "@/lib/imagen";
import { formatArticle } from "@/lib/formatting";
import { calculateWordAudit } from "@/lib/word-counter";
import { generateEasyAccordionHtml, generateFaqSchemaJsonLd } from "@/lib/atoyan";
import { createEasyAccordion } from "@/lib/accordion-creator";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = GenerateRequest.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", issues: parsed.error.issues.map((i) => i.message) },
      { status: 422 },
    );
  }

  const { title: keyword, settings, schedule_at, accordion_shortcode, chat_context } = parsed.data;
  const city = extractCity(keyword);
  const provider = await activeProvider(settings);

  try {
    // 1. Generate high-authority California legal content (OpenAI -> Gemini -> Simulator)
    const content = await generateAtoyanContent({
      keyword,
      city,
      openaiKey: settings?.openai_api_key,
      geminiKey: settings?.gemini_api_key,
      provider: (settings?.llm_provider || provider) as "openai" | "gemini" | "simulator",
      systemPrompt: settings?.system_prompt,
      chatContext: chat_context,
    });

    if (accordion_shortcode && accordion_shortcode.trim()) {
      content.accordionShortcode = accordion_shortcode.trim();
    } else if (content.faqs && content.faqs.length > 0) {
      // Dynamically create WordPress Easy Accordion with the unique FAQs right during preview
      const wpSiteUrl =
        settings?.wp_site_url?.trim() ||
        process.env.WP_SITE_URL?.trim() ||
        "https://www.atoyanlaw.com";
      const wpUser =
        process.env.WP_USER?.trim() ||
        settings?.wp_username?.trim() ||
        undefined;
      const wpPassword =
        process.env.WP_PASSWORD?.trim() ||
        settings?.wp_app_password?.trim() ||
        undefined;

      if (wpUser && wpPassword) {
        try {
          const acc = await createEasyAccordion({
            title: `${city} ${content.keyword} FAQs`,
            faqs: content.faqs,
            city,
            topic: content.keyword,
            wpSiteUrl,
            wpUser,
            wpPassword,
          });
          if (acc && acc.shortcode) {
            content.accordionShortcode = acc.shortcode;
          }
        } catch (accErr) {
          console.warn("Could not create dynamic Easy Accordion in preview:", accErr);
        }
      }
    }

    // 2. Generate Gemini Imagen visual pair (16:9 Banner + 4:3 Editorial Illustration)
    const images = await generateAtoyanImages({
      keyword,
      city,
      slug: content.slug,
      apiKey: settings?.gemini_api_key,
      openaiKey: settings?.openai_api_key,
    });

    // Calculate substantive word audit across all ACF sections and FAQs
    const wordAudit = calculateWordAudit(content);

    // 3. Generate Accordion & Schema.org JSON-LD
    const accordionHtml = content.accordionShortcode || generateEasyAccordionHtml(content.faqs);
    const faqSchemaJsonLd = generateFaqSchemaJsonLd(content.faqs);

    // 4. Also provide formatted body for backward compatibility
    const legacyFormatted = settings
      ? formatArticle(`${content.servicesContent}\n\n${content.howDoContent}`, settings)
      : { formatted: content.servicesContent, headings_wrapped: 2, links_inserted: 0, cta_inserted: true, dashes_stripped: 0, html_stripped: false };

    return NextResponse.json({
      success: true,
      keyword,
      city,
      provider,
      content,
      wordAudit,
      images: {
        banner: {
          filename: images.banner.filename,
          altText: images.banner.altText,
          dataUrl: `data:${images.banner.mimeType};base64,${images.banner.base64}`,
          base64: images.banner.base64,
          mimeType: images.banner.mimeType,
          width: images.banner.width,
          height: images.banner.height,
        },
        services: {
          filename: images.services.filename,
          altText: images.services.altText,
          dataUrl: `data:${images.services.mimeType};base64,${images.services.base64}`,
          base64: images.services.base64,
          mimeType: images.services.mimeType,
          width: images.services.width,
          height: images.services.height,
        },
      },
      faqSchemaJsonLd,
      accordionHtml,
      schedule_at,
      title: content.heroTitle,
      raw: content.servicesContent,
      ...legacyFormatted,
    });
  } catch (err) {
    console.error("Generation error:", err);
    return NextResponse.json(
      {
        error: "generation_failed",
        message: err instanceof Error ? err.message : "Failed to generate content",
      },
      { status: 500 },
    );
  }
}
