import { NextRequest, NextResponse } from "next/server";
import {
  fetchReportsFromSupabase,
  insertReportToSupabase,
  deleteReportFromSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase";
import type { GenerationReportItem } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/reports
 * Returns real generation reports from Supabase.
 */
export async function GET(req: NextRequest) {
  try {
    const configured = isSupabaseConfigured();
    const result = await fetchReportsFromSupabase();

    return NextResponse.json({
      success: result.success,
      configured,
      data: result.data || [],
      error: result.error || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch reports";
    return NextResponse.json(
      {
        success: false,
        configured: isSupabaseConfigured(),
        data: [],
        error: message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports
 * Stores a real practice area generation record into Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerationReportItem;

    if (!body || !body.keyword) {
      return NextResponse.json(
        { success: false, error: "Invalid report payload: keyword is required" },
        { status: 400 }
      );
    }

    const report: GenerationReportItem = {
      id: body.id || `gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: body.timestamp || new Date().toISOString(),
      keyword: body.keyword,
      city: body.city || "California",
      slug: body.slug || body.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      provider: body.provider || "gemini-2.5-flash + imagen-3",
      contentWords: body.contentWords || 0,
      tokensEstimate: body.tokensEstimate || 0,
      costContent: Number(body.costContent ?? 0.003),
      costImages: Number(body.costImages ?? 0.040),
      costTotal: Number(body.costTotal ?? 0.043),
      generationSeconds: Number(body.generationSeconds ?? 1.85),
      wpPostId: body.wpPostId,
      pageUrl: body.pageUrl,
      status: body.status || "published",
    };

    const result = await insertReportToSupabase(report);

    return NextResponse.json({
      success: result.success,
      configured: result.configured,
      data: result.data || report,
      error: result.error || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record generation report";
    return NextResponse.json(
      {
        success: false,
        configured: isSupabaseConfigured(),
        error: message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports?id=...
 * Removes a generation record.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id parameter" }, { status: 400 });
    }

    const result = await deleteReportFromSupabase(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete report";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
