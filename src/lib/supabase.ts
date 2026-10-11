import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { GenerationReportItem, Settings } from "./types";

let cachedClient: SupabaseClient | null = null;
let cachedKey: string | null = null;

/**
 * Resolves Supabase connection credentials from environment variables or custom settings.
 */
export function getSupabaseCredentials(settings?: Settings): { url: string; key: string } {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    settings?.supabase_url?.trim() ||
    "";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    settings?.supabase_anon_key?.trim() ||
    "";

  return { url, key };
}

/**
 * Returns true if Supabase URL and Key are present.
 */
export function isSupabaseConfigured(settings?: Settings): boolean {
  const { url, key } = getSupabaseCredentials(settings);
  return Boolean(url && key && url.startsWith("http"));
}

/**
 * Returns a configured Supabase client or null if credentials are missing.
 */
export function getSupabaseClient(settings?: Settings): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials(settings);
  if (!url || !key) return null;

  const cacheId = `${url}:::${key}`;
  if (cachedClient && cachedKey === cacheId) {
    return cachedClient;
  }

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  cachedKey = cacheId;

  return cachedClient;
}

/**
 * Converts a database row (snake_case) to GenerationReportItem (camelCase).
 */
export function mapRowToReport(row: Record<string, unknown>): GenerationReportItem {
  return {
    id: String(row.id || `gen-${Date.now()}`),
    timestamp: String(row.timestamp || row.created_at || new Date().toISOString()),
    keyword: String(row.keyword || ""),
    city: String(row.city || "California"),
    slug: String(row.slug || ""),
    provider: String(row.provider || "gemini-2.5-flash + imagen-3"),
    contentWords: Number(row.content_words ?? 0),
    tokensEstimate: Number(row.tokens_estimate ?? 0),
    costContent: Number(row.cost_content ?? 0.003),
    costImages: Number(row.cost_images ?? 0.040),
    costTotal: Number(row.cost_total ?? 0.043),
    generationSeconds: Number(row.generation_seconds ?? 1.85),
    wpPostId: row.wp_post_id ? Number(row.wp_post_id) : undefined,
    pageUrl: row.page_url ? String(row.page_url) : undefined,
    status: (row.status as "published" | "scheduled" | "draft") || "published",
  };
}

/**
 * Converts a GenerationReportItem (camelCase) to database insert payload (snake_case).
 */
export function mapReportToRow(report: GenerationReportItem): Record<string, unknown> {
  return {
    id: report.id,
    timestamp: report.timestamp,
    keyword: report.keyword,
    city: report.city,
    slug: report.slug,
    provider: report.provider,
    content_words: report.contentWords,
    tokens_estimate: report.tokensEstimate,
    cost_content: report.costContent,
    cost_images: report.costImages,
    cost_total: report.costTotal,
    generation_seconds: report.generationSeconds,
    wp_post_id: report.wpPostId ?? null,
    page_url: report.pageUrl ?? null,
    status: report.status,
  };
}

/**
 * Fetches all generation reports from Supabase ordered by timestamp descending.
 */
export async function fetchReportsFromSupabase(settings?: Settings): Promise<{
  success: boolean;
  configured: boolean;
  data: GenerationReportItem[];
  error?: string;
}> {
  const client = getSupabaseClient(settings);
  if (!client) {
    return {
      success: true,
      configured: false,
      data: [],
      error: "Supabase credentials are not configured",
    };
  }

  try {
    const { data, error } = await client
      .from("generation_reports")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) {
      console.warn("Supabase query error:", error.message);
      return {
        success: false,
        configured: true,
        data: [],
        error: error.message,
      };
    }

    const items = (data || []).map((row) => mapRowToReport(row as Record<string, unknown>));
    return {
      success: true,
      configured: true,
      data: items,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("Failed to fetch reports from Supabase:", message);
    return {
      success: false,
      configured: true,
      data: [],
      error: message,
    };
  }
}

/**
 * Inserts or upserts a generation report in Supabase.
 */
export async function insertReportToSupabase(
  report: GenerationReportItem,
  settings?: Settings
): Promise<{
  success: boolean;
  configured: boolean;
  data?: GenerationReportItem;
  error?: string;
}> {
  const client = getSupabaseClient(settings);
  if (!client) {
    return {
      success: true,
      configured: false,
      data: report,
      error: "Supabase credentials not configured. Preserved locally.",
    };
  }

  try {
    const row = mapReportToRow(report);
    const { data, error } = await client
      .from("generation_reports")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.warn("Supabase insert error:", error.message);
      return {
        success: false,
        configured: true,
        data: report,
        error: error.message,
      };
    }

    return {
      success: true,
      configured: true,
      data: data ? mapRowToReport(data as Record<string, unknown>) : report,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("Failed to insert report into Supabase:", message);
    return {
      success: false,
      configured: true,
      data: report,
      error: message,
    };
  }
}

/**
 * Deletes a single generation report from Supabase by ID.
 */
export async function deleteReportFromSupabase(
  id: string,
  settings?: Settings
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(settings);
  if (!client) return { success: true };

  try {
    const { error } = await client.from("generation_reports").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
