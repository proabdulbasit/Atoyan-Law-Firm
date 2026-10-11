import { z } from "zod";

/**
 * Keyword link pair for auto-linking keywords inside content.
 */
export const KeywordLink = z.object({
  keyword: z.string().min(1),
  url: z.string().min(1),
});
export type KeywordLink = z.infer<typeof KeywordLink>;

export const AcfMapping = z.object({
  title_field: z.string().default("post_title"),
  body_field: z.string().default("article_body"),
  cta_field: z.string().default("cta_block"),
  image1_field: z.string().default("hero_image"),
  image2_field: z.string().default("secondary_image"),
});
export type AcfMapping = z.infer<typeof AcfMapping>;

export const Settings = z.object({
  llm_provider: z.enum(["gemini", "openai", "simulator"]).default("openai"),
  gemini_api_key: z.string().optional(),
  openai_api_key: z.string().optional(),
  system_prompt: z
    .string()
    .default(
      "You are the senior legal content strategist and California employment attorney for Atoyan Law Firm (atoyanlaw.com).",
    ),
  heading_class: z.string().default("h2dav"),
  cta_shortcode: z.string().default("[sp_easyaccordion id=\"3932\"]"),
  cta_after_paragraph: z.number().int().min(1).default(2),
  keyword_links: z.array(KeywordLink).default([]),
  image_template: z.enum(["sunset", "midnight", "paper"]).default("midnight"),
  wp_site_url: z.string().default("https://www.atoyanlaw.com"),
  wp_username: z.string().optional(),
  wp_app_password: z.string().optional(),
  supabase_url: z.string().optional(),
  supabase_anon_key: z.string().optional(),
  acf_mapping: AcfMapping.default({
    title_field: "post_title",
    body_field: "article_body",
    cta_field: "cta_block",
    image1_field: "hero_image",
    image2_field: "secondary_image",
  }),
});
export type Settings = z.infer<typeof Settings>;

export const GenerateRequest = z.object({
  title: z.string().min(3),
  settings: Settings.optional(),
  schedule_at: z.string().optional(),
  accordion_shortcode: z.string().optional(),
  chat_context: z.string().optional(),
});
export type GenerateRequest = z.infer<typeof GenerateRequest>;

export const PublishRequest = z.object({
  title: z.string().min(3),
  formatted_body: z.string().optional(),
  cta_block: z.string().optional(),
  image_url: z.string().optional(),
  schedule_at: z.string().optional(),
  settings: Settings.optional(),
  atoyan_content: z.record(z.unknown()).optional(),
  banner_image_url: z.string().optional(),
  banner_attachment_id: z.number().optional(),
  services_image_url: z.string().optional(),
  services_attachment_id: z.number().optional(),
  banner_image: z
    .object({
      base64: z.string().optional(),
      filename: z.string().optional(),
      mimeType: z.string().optional(),
      altText: z.string().optional(),
    })
    .optional(),
  services_image: z
    .object({
      base64: z.string().optional(),
      filename: z.string().optional(),
      mimeType: z.string().optional(),
      altText: z.string().optional(),
    })
    .optional(),
  admin_password: z.string().optional(),
  accordion_shortcode: z.string().optional(),
  chat_context: z.string().optional(),
});
export type PublishRequest = z.infer<typeof PublishRequest>;

export interface FormattedArticle {
  raw: string;
  formatted: string;
  headings_wrapped: number;
  links_inserted: number;
  cta_inserted: boolean;
  dashes_stripped: number;
  html_stripped: boolean;
}

// -----------------------------------------------------------------------------
// ATOYAN LAW FIRM AUTOMATION TYPES
// -----------------------------------------------------------------------------

export interface AtoyanFaq {
  question: string;
  answer: string;
}

export interface AtoyanLegalContent {
  keyword: string;
  city: string;
  slug: string;
  heroTitle: string;
  servicesHeading: string;
  servicesSubHeading: string;
  servicesContent: string;
  howDoHeading: string;
  howDoContent: string;
  compensationHeading: string;
  compensationIntro: string;
  faqs: AtoyanFaq[];
  yoastTitle: string;
  yoastMetaDesc: string;
  yoastFocusKw: string;
  accordionShortcode?: string;
}

export interface AtoyanGeneratedImage {
  base64: string;
  mimeType: string;
  prompt: string;
  filename: string;
  altText: string;
  width: number;
  height: number;
  source?: "openai" | "gemini" | "fallback";
}

export interface AtoyanImages {
  banner: AtoyanGeneratedImage;
  services: AtoyanGeneratedImage;
}

export interface TestimonialReviewItem {
  title: string;
  description: string;
  name: string;
}

export interface AcfPersonalInjuryGroup {
  personal_injury_image: string | number;
  personal_injury_title: string;
  _personal_injury_services_heading: string;
  _personal_injury_services_sub_heading: string;
  _personal_injury_services_content: string;
  _personal_injury_services_Sidebar: string[] | number[];
  testimonials_reviews_bg_image: string | number;
  testimonials_reviews_heading: string;
  testimonials_reviews_sub_heading: string;
  testimonials_reviews_repet: TestimonialReviewItem[];
  testimonials_reviews_button: {
    title: string;
    url: string;
    target: string;
  };
  how_do_heading: string;
  how_do_content: string;
  how_do_contact_form_heading: string;
  how_do_contact_form_shortcode: string;
  cta_bg_image: string | number;
  cta_heading: string;
  cta_content: string;
  cta_button: {
    title: string;
    url: string;
    target: string;
  };
  compensation_heading: string;
  compensation_content: string;
}

export interface AtoyanPublishResult {
  mode: "live" | "simulated";
  status: "publish" | "future";
  postId?: number;
  pageUrl?: string;
  editUrl?: string;
  scheduledFor?: string;
  bannerAttachmentId?: number;
  bannerUrl?: string;
  servicesAttachmentId?: number;
  servicesUrl?: string;
  yoastUpdated: boolean;
  inpostHeadScript?: string;
  acfPayload: Record<string, unknown>;
  accordionShortcode?: string;
  accordionId?: number;
}

export interface GenerationReportItem {
  id: string;
  timestamp: string;
  keyword: string;
  city: string;
  slug: string;
  provider: string;
  contentWords: number;
  tokensEstimate: number;
  costContent: number;
  costImages: number;
  costTotal: number;
  generationSeconds: number;
  wpPostId?: number;
  pageUrl?: string;
  status: "published" | "scheduled" | "draft";
}

export interface TrackedArticle {
  slug: string;
  title: string;
  keyword: string;
  city?: string;
  category: string;
  url: string;
  publishedAt?: string;
  isHub?: boolean;
}
