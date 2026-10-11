import crypto from "crypto";
import { NextResponse } from "next/server";
import { PublishRequest, type AtoyanLegalContent } from "@/lib/types";
import { publishAtoyanPage } from "@/lib/wordpress";
import { generateAtoyanContent, extractCity } from "@/lib/llm";
import { generateAtoyanImages } from "@/lib/imagen";

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

  const parsed = PublishRequest.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", issues: parsed.error.issues.map((i) => i.message) },
      { status: 422 },
    );
  }

  // Verify WP_SUPER_ADMIN if configured on environment
  const configuredSuperAdmin = process.env.WP_SUPER_ADMIN?.trim();
  const bodyData = raw as Record<string, unknown>;

  if (configuredSuperAdmin) {
    const headerPassword = req.headers.get("x-admin-password")?.trim();
    const bodyPassword =
      typeof parsed.data.admin_password === "string"
        ? parsed.data.admin_password.trim()
        : typeof bodyData.admin_password === "string"
        ? (bodyData.admin_password as string).trim()
        : undefined;
    const providedPassword = headerPassword || bodyPassword;

    if (!providedPassword || !isPasswordValid(providedPassword, configuredSuperAdmin)) {
      return NextResponse.json(
        {
          error: "unauthorized",
          message: "Invalid or missing admin password. Publishing to live WordPress is protected by WP_SUPER_ADMIN.",
        },
        { status: 401 },
      );
    }
  }

  const { title, schedule_at, settings } = parsed.data;

  try {
    // If atoyan_content is provided as a structured object, use it directly; handle legacy strings gracefully
    let legalContent: AtoyanLegalContent | undefined;
    const candidate = bodyData.atoyan_content || bodyData.content;
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate) &&
      "servicesContent" in candidate
    ) {
      legalContent = candidate as AtoyanLegalContent;
    }

    if (!legalContent) {
      const city = extractCity(title);
      legalContent = await generateAtoyanContent({
        keyword: title,
        city,
        openaiKey: settings?.openai_api_key,
        geminiKey: settings?.gemini_api_key,
        provider: settings?.llm_provider,
        systemPrompt: settings?.system_prompt,
        chatContext: parsed.data.chat_context,
      });

      // If legacy content was provided as a string, honor it inside servicesContent
      if (typeof candidate === "string" && candidate.trim()) {
        legalContent.servicesContent = candidate;
      } else if (typeof bodyData.formatted_body === "string" && bodyData.formatted_body.trim()) {
        legalContent.servicesContent = bodyData.formatted_body;
      }
    }

    if (parsed.data.accordion_shortcode || bodyData.accordion_shortcode) {
      legalContent.accordionShortcode = String(
        parsed.data.accordion_shortcode || bodyData.accordion_shortcode,
      ).trim();
    }

    // Extract images if sent, or generate them independently if missing
    let bannerImageData = bodyData.banner_image as {
      base64?: string;
      filename?: string;
      mimeType?: string;
      altText?: string;
    } | undefined;

    let servicesImageData = bodyData.services_image as {
      base64?: string;
      filename?: string;
      mimeType?: string;
      altText?: string;
    } | undefined;

    const needsBanner = !bannerImageData?.base64 && !bodyData.banner_image_url;
    const needsServices = !servicesImageData?.base64 && !bodyData.services_image_url;

    if (needsBanner || needsServices) {
      try {
        const generatedImages = await generateAtoyanImages({
          keyword: title,
          city: legalContent.city,
          slug: legalContent.slug,
          apiKey: settings?.gemini_api_key,
          openaiKey: settings?.openai_api_key,
        });

        if (needsBanner) {
          bannerImageData = {
            base64: generatedImages.banner.base64,
            filename: generatedImages.banner.filename,
            mimeType: generatedImages.banner.mimeType,
            altText: generatedImages.banner.altText,
          };
        }

        if (needsServices) {
          servicesImageData = {
            base64: generatedImages.services.base64,
            filename: generatedImages.services.filename,
            mimeType: generatedImages.services.mimeType,
            altText: generatedImages.services.altText,
          };
        }
      } catch (imgErr) {
        console.warn("Image generation during direct publish skipped:", imgErr);
      }
    }

    const result = await publishAtoyanPage({
      content: legalContent,
      bannerImage: bannerImageData?.base64
        ? {
            base64: bannerImageData.base64,
            filename: bannerImageData.filename || `${legalContent.slug}-banner.jpg`,
            mimeType: bannerImageData.mimeType || "image/jpeg",
            altText: bannerImageData.altText || legalContent.heroTitle,
            prompt: "",
            width: 1920,
            height: 451,
          }
        : undefined,
      bannerUrl: (bodyData.banner_image_url as string) || undefined,
      bannerAttachmentId: (bodyData.banner_attachment_id as number) || undefined,
      servicesImage: servicesImageData?.base64
        ? {
            base64: servicesImageData.base64,
            filename: servicesImageData.filename || `${legalContent.slug}-services.jpg`,
            mimeType: servicesImageData.mimeType || "image/jpeg",
            altText: servicesImageData.altText || legalContent.servicesHeading,
            prompt: "",
            width: 600,
            height: 400,
          }
        : undefined,
      servicesUrl: (bodyData.services_image_url as string) || undefined,
      servicesAttachmentId: (bodyData.services_attachment_id as number) || undefined,
      scheduleAt: schedule_at || undefined,
      settings,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("Publishing error:", err);
    const message = err instanceof Error ? err.message : "Publishing to WordPress failed";
    return NextResponse.json({ error: "publish_failed", message }, { status: 500 });
  }
}
