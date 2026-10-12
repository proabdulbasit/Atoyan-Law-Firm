import { resolveDefaultAccordionShortcode } from "./atoyan";
import { decomposeKeyword } from "./keyword-utils";
import type { AtoyanFaq } from "./types";
import { saveEasyAccordionItems } from "./wp-admin";

export interface CreateAccordionParams {
  title: string;
  faqs: Array<{
    question?: string;
    answer?: string;
    accordion_content_title?: string;
    accordion_content_description?: string;
  }>;
  city?: string;
  topic?: string;
  shortcode_options?: Record<string, unknown>;
  wpSiteUrl?: string;
  wpUser?: string;
  wpPassword?: string;
}

export interface CreateAccordionResult {
  id: number;
  title: string;
  shortcode: string;
  source: "bridge" | "wp-rest" | "wp-admin" | "mapped";
  faqCount: number;
}

/**
 * Returns David Atoyan default Easy Accordion shortcode options matching the exact
 * styling, layout, typography, and color palette of atoyanlaw.com.
 */
export function getDefaultShortcodeOptions(customUniqId?: string): Record<string, unknown> {
  const uniqId =
    customUniqId ||
    `sp_easy_accordion-${Math.floor(1000000000 + Math.random() * 1147483647)}`;

  return {
      eap_accordion_layout: "vertical",
      accordion_margin_bottom: {
        all: 10,
      },
      eap_accordion_event: "ea-click",
      eap_accordion_mode: "ea-first-open",
      eap_mutliple_collapse: false,
      eap_scroll_to_active_item: false,
      eap_schema_markup: false,
      eap_preloader: false,
      eap_faq_search: false,
      eap_faq_collapse_button: false,
      eap_accordion_theme: "sp-ea-one",
      section_title: false,
      eap_border_css: {
        all: 1,
        style: "solid",
        color: "#e2e2e2",
      },
      ea_title_heading_tag: "3",
      eap_title_color: {
        color1: "#444",
      },
      eap_header_bg_color: "#eee",
      eap_nofollow_link: false,
      eap_title_padding: {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15,
      },
      eap_title_icon: false,
      eap_title_icon_size: {
        all: 20,
      },
      eap_dsc_color: "#444",
      eap_description_bg_color: "#fff",
      eap_description_padding: {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15,
      },
      eap_accordion_fillspace: false,
      eap_accordion_fillspace_height: {
        all: 200,
      },
      eap_autop: true,
      eap_expand_close_icon: true,
      eap_expand_collapse_icon: "1",
      eap_icon_size: {
        all: 16,
      },
      eap_icon_color_set: "#444",
      eap_icon_position: "left",
      eap_animation: false,
      eap_animation_style: "normal",
      eap_animation_time: 300,
      eap_accordion_uniq_id: uniqId,
      pagination_color: {
        text_color: "#5e5e5e",
        text_active_clr: "#ffffff",
        border_color: "#bbbbbb",
        border_active_clr: "#FE7C4D",
        background: "#ffffff",
        active_background: "#FE7C4D",
      },
      section_title_font_load: false,
      eap_section_title_typography: {
        "font-family": "Open Sans",
        "font-weight": "",
        "font-style": "600",
        subset: "",
        "text-align": "left",
        "text-transform": "none",
        "font-size": "28",
        "line-height": "32",
        "letter-spacing": "0",
        color: "#444",
        "margin-bottom": "30",
        type: "google",
        unit: "px",
      },
      eap_title_font_load: "",
      eap_title_typography: {
        "font-family": "Open Sans",
        "font-weight": "",
        "font-style": "600",
        subset: "",
        "text-align": "left",
        "text-transform": "none",
        "font-size": "20",
        "line-height": "30",
        "letter-spacing": "0",
        type: "google",
        unit: "px",
      },
      eap_desc_font_load: "",
      eap_content_typography: {
        "font-family": "Open Sans",
        "font-weight": "",
        "font-style": "400",
        subset: "",
        "text-align": "left",
        "text-transform": "none",
        "font-size": "16",
        "line-height": "26",
        "letter-spacing": "0",
        type: "google",
        unit: "px",
      },
  };
}

/**
 * Builds David Atoyan formatted upload options containing FAQ items with bulleted lists,
 * tables, statutory citations, and a concluding localized attorney CTA.
 */
export function buildDavidAccordionUploadOptions(params: {
  faqs: Array<{
    question?: string;
    answer?: string;
    accordion_content_title?: string;
    accordion_content_description?: string;
  }>;
  city?: string;
  topic?: string;
}): Record<string, unknown> {
  const { faqs, city = "California", topic = "Employment Law" } = params;
  const decomposed = decomposeKeyword(topic, city);
  const resolvedCity = decomposed.city || city || "California";
  const cleanTopic = decomposed.cleanTopic || topic || "Employment Law";

  const accordionContentSource: Array<{
    accordion_content_title: string;
    accordion_content_description: string;
  }> = [];

  for (const item of faqs) {
    const q = item.accordion_content_title || item.question || "";
    const a = item.accordion_content_description || item.answer || "";
    if (q.trim() && a.trim()) {
      accordionContentSource.push({
        accordion_content_title: q.replace(/<[^>]+>/g, "").trim(),
        accordion_content_description: a.trim(),
      });
    }
  }

  // Ensure concluding localized attorney CTA in final FAQ item
  if (accordionContentSource.length > 0) {
    const lastIdx = accordionContentSource.length - 1;
    const last = accordionContentSource[lastIdx];
    if (
      !last.accordion_content_description.includes("Talk to a") &&
      !last.accordion_content_description.includes("807-0077")
    ) {
      const citySlug = resolvedCity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const topicSlug = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const slug = `talk-to-a-${citySlug}-${topicSlug}-lawyer`;
      const ctaHtml = `\r\n<h2 id="${slug}">Talk to a ${resolvedCity} ${cleanTopic} Lawyer</h2>\r\n<p>If you believe your workplace rights were violated in ${resolvedCity}, time limits apply under California law. <strong>Contact WP Post Project at (323) 968-0000</strong> or through the online form at <a href="https://demo.wp-post.com/contact-us/" target="_blank" rel="noopener">demo.wp-post.com</a> for a free, confidential case evaluation.</p>`;
      last.accordion_content_description += ctaHtml;
    }
  }

  return {
    eap_accordion_type: "content-accordion",
    accordion_content_source: accordionContentSource,
    eap_post_type: "sp_accordion_faqs",
    post_order_by: "date",
    post_order: "DESC",
  };
}

/**
 * Creates an Easy Accordion (sp_easy_accordion) on WordPress.
 * 1. Calls WP Content Autopilot Bridge endpoint /wp-json/autopilot/v1/accordion if available.
 * 2. Falls back to standard WordPress REST API /wp-json/wp/v2/sp_easy_accordion.
 * 3. Gracefully resolves to verified live catalog shortcode if API is offline.
 */
export async function createEasyAccordion(
  params: CreateAccordionParams
): Promise<CreateAccordionResult> {
  const { title, faqs, city = "California", topic = "Employment Law" } = params;

  const wpSiteUrl =
    params.wpSiteUrl?.trim() ||
    process.env.WP_SITE_URL?.trim() ||
    "https://www.atoyanlaw.com";
  const cleanBase = wpSiteUrl.replace(/\/$/, "");

  const wpUser =
    params.wpUser?.trim() || process.env.WP_USER?.trim() || undefined;
  const wpPassword =
    params.wpPassword?.trim() || process.env.WP_PASSWORD?.trim() || undefined;

  // If credentials are missing, fallback to live catalog mapping
  if (!wpUser || !wpPassword) {
    const shortcode = resolveDefaultAccordionShortcode(topic, city);
    const idMatch = shortcode.match(/\d+/);
    const id = idMatch ? parseInt(idMatch[0], 10) : 0;
    return {
      id,
      title,
      shortcode,
      source: "mapped",
      faqCount: faqs.length,
    };
  }

  const authHeader = Buffer.from(`${wpUser}:${wpPassword}`).toString("base64");

  // Strategy 1: Call WP Content Autopilot Bridge endpoint
  try {
    const bridgeRes = await fetch(`${cleanBase}/wp-json/autopilot/v1/accordion`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        faqs,
        city,
        topic,
        shortcode_options: params.shortcode_options || getDefaultShortcodeOptions(),
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (bridgeRes.ok) {
      const data = await bridgeRes.json();
      if (data.id && data.shortcode) {
        // Run immediate sanitization via WP REST API to ensure upload_options and shortcode_options are unwrapped objects in wp_postmeta
        try {
          const defaultOpts = params.shortcode_options || getDefaultShortcodeOptions();
          const uploadOpts = buildDavidAccordionUploadOptions({ faqs, city, topic });
          await fetch(`${cleanBase}/wp-json/wp/v2/sp_easy_accordion/${data.id}`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${authHeader}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              meta: {
                sp_eap_upload_options: uploadOpts,
                sp_eap_shortcode_options: defaultOpts,
              },
            }),
            signal: AbortSignal.timeout(10_000),
          });
        } catch (sanitizeErr) {
          console.warn("Immediate accordion sanitization error (non-fatal):", sanitizeErr);
        }

        return {
          id: data.id,
          title: data.title || title,
          shortcode: data.shortcode,
          source: "bridge",
          faqCount: data.count || faqs.length,
        };
      }
    }
  } catch (bridgeErr) {
    console.warn("Bridge accordion creation call encountered error, attempting fallback:", bridgeErr);
  }

  // Strategy 2: Call standard WordPress REST API /wp-json/wp/v2/sp_easy_accordion
  try {
    const shortcodeOptions =
      params.shortcode_options || getDefaultShortcodeOptions();
    const uploadOptions = buildDavidAccordionUploadOptions({
      faqs,
      city,
      topic,
    });

    const demoSite = (() => {
      try {
        return new URL(cleanBase).hostname.replace(/^www\./, "") === "demo.wp-post.com";
      } catch {
        return false;
      }
    })();
    const standardRes = await fetch(`${cleanBase}/wp-json/wp/v2/sp_easy_accordion`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        demoSite
          ? { title, status: "draft" }
          : {
              title,
              status: "publish",
              meta: {
                sp_eap_shortcode_options: shortcodeOptions,
                sp_eap_upload_options: uploadOptions,
              },
            },
      ),
      signal: AbortSignal.timeout(20_000),
    });

    if (!standardRes.ok) {
      const errorBody = await standardRes.text();
      console.warn(`Easy Accordion create failed (${standardRes.status}): ${errorBody.slice(0, 180)}`);
    } else {
      const data = await standardRes.json();
      if (data.id) {
        if (demoSite) {
          const saved = await saveEasyAccordionItems({
            wpSiteUrl: cleanBase,
            postId: data.id,
            title,
            faqs,
            wpUser,
            wpPassword: process.env.WP_LOGIN_PASSWORD?.trim() || undefined,
          });
          if (saved) {
            return {
              id: data.id,
              title,
              shortcode: `[sp_easyaccordion id="${data.id}"]`,
              source: "wp-admin",
              faqCount: faqs.length,
            };
          }
        }
        return {
          id: data.id,
          title,
          shortcode: `[sp_easyaccordion id="${data.id}"]`,
          source: "wp-rest",
          faqCount: faqs.length,
        };
      }
    }
  } catch (stdErr) {
    console.warn("Standard WP REST accordion creation failed:", stdErr);
  }

  // Strategy 3: Graceful fallback to verified live catalog mapping
  const fallbackShortcode = resolveDefaultAccordionShortcode(topic, city);
  const idMatch = fallbackShortcode.match(/\d+/);
  const id = idMatch ? parseInt(idMatch[0], 10) : 0;

  return {
    id,
    title,
    shortcode: fallbackShortcode,
    source: "mapped",
    faqCount: faqs.length,
  };
}
