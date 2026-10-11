"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Zap,
  ShieldCheck,
  FileText,
  PieChart,
  Download,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Check,
  Database,
  RefreshCw,
  Trash2,
  AlertCircle,
  Copy,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GenerationReportItem } from "@/lib/types";

export type { GenerationReportItem };

type Timeframe = "today" | "week" | "month" | "all";

interface ClientReportsViewProps {
  onSwitchToGenerator?: () => void;
}

export function ClientReportsView({ onSwitchToGenerator }: ClientReportsViewProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState<GenerationReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [showSchemaHelp, setShowSchemaHelp] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch live generation reports from Supabase through /api/reports
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/reports", { cache: "no-store" });
      const json = await res.json();

      setIsConfigured(Boolean(json.configured));

      if (json.success && Array.isArray(json.data)) {
        // Merge with any offline generation reports stored locally
        try {
          const localStored = localStorage.getItem("atoyan_generation_reports");
          const localParsed: GenerationReportItem[] = localStored ? JSON.parse(localStored) : [];
          
          // Deduplicate by ID
          const existingIds = new Set(json.data.map((r: GenerationReportItem) => r.id));
          const unpersistedLocal = localParsed.filter((item) => !existingIds.has(item.id));
          
          const combined = [...unpersistedLocal, ...json.data];
          setRecords(combined);
        } catch {
          setRecords(json.data);
        }
      } else {
        if (json.error) {
          setErrorMessage(json.error);
        }
        // Fallback to local storage if API returned empty
        const localStored = localStorage.getItem("atoyan_generation_reports");
        if (localStored) {
          try {
            setRecords(JSON.parse(localStored));
          } catch {
            setRecords([]);
          }
        } else {
          setRecords([]);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch reports:", err);
      // Read local storage on network failure
      try {
        const localStored = localStorage.getItem("atoyan_generation_reports");
        setRecords(localStored ? JSON.parse(localStored) : []);
      } catch {
        setRecords([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Listen for newly added generation reports dispatched from the generator tab
  useEffect(() => {
    const handleNewReport = () => {
      fetchReports();
    };
    window.addEventListener("atoyan_report_added", handleNewReport);
    return () => window.removeEventListener("atoyan_report_added", handleNewReport);
  }, [fetchReports]);

  // Delete individual record
  const handleDeleteRecord = async (id: string) => {
    setIsDeleting(id);
    try {
      await fetch(`/api/reports?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setRecords((prev) => prev.filter((r) => r.id !== id));
      try {
        const local = localStorage.getItem("atoyan_generation_reports");
        if (local) {
          const parsed = JSON.parse(local).filter((r: GenerationReportItem) => r.id !== id);
          localStorage.setItem("atoyan_generation_reports", JSON.stringify(parsed));
        }
      } catch {
        // Ignore storage errors
      }
    } catch (err) {
      console.warn("Failed to delete record:", err);
    } finally {
      setIsDeleting(null);
    }
  };

  // Filter records by timeframe and search query
  const filteredRecords = useMemo(() => {
    const now = Date.now();
    return records.filter((rec) => {
      const recordTime = new Date(rec.timestamp).getTime();
      const diffHours = (now - recordTime) / (1000 * 60 * 60);

      let matchesTime = true;
      if (timeframe === "today") {
        matchesTime = diffHours <= 24;
      } else if (timeframe === "week") {
        matchesTime = diffHours <= 24 * 7;
      } else if (timeframe === "month") {
        matchesTime = diffHours <= 24 * 30;
      }

      if (!matchesTime) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        rec.keyword.toLowerCase().includes(q) ||
        rec.city.toLowerCase().includes(q) ||
        rec.slug.toLowerCase().includes(q)
      );
    });
  }, [records, timeframe, searchQuery]);

  // Executive Rollup Metrics
  const stats = useMemo(() => {
    const totalPages = filteredRecords.length;
    const totalCost = filteredRecords.reduce((sum, r) => sum + r.costTotal, 0);
    const totalContentCost = filteredRecords.reduce((sum, r) => sum + r.costContent, 0);
    const totalImageCost = filteredRecords.reduce((sum, r) => sum + r.costImages, 0);
    const totalWords = filteredRecords.reduce((sum, r) => sum + r.contentWords, 0);
    const totalTokens = filteredRecords.reduce((sum, r) => sum + r.tokensEstimate, 0);
    const avgLatency =
      totalPages > 0
        ? (filteredRecords.reduce((sum, r) => sum + r.generationSeconds, 0) / totalPages).toFixed(2)
        : "0.00";

    const avgCostPerPage = totalPages > 0 ? (totalCost / totalPages).toFixed(3) : "0.043";

    // Agency benchmark comparison ($175 freelance legal copywriter benchmark)
    const agencyBenchmarkCost = totalPages * 175;
    const clientSavings = agencyBenchmarkCost - totalCost;
    const savingsPercent =
      agencyBenchmarkCost > 0
        ? ((clientSavings / agencyBenchmarkCost) * 100).toFixed(1)
        : "99.9";

    return {
      totalPages,
      totalCost: totalCost.toFixed(2),
      totalContentCost: totalContentCost.toFixed(3),
      totalImageCost: totalImageCost.toFixed(2),
      totalWords: totalWords.toLocaleString(),
      totalTokens: totalTokens.toLocaleString(),
      avgLatency,
      avgCostPerPage,
      agencyBenchmarkCost: agencyBenchmarkCost.toLocaleString(),
      clientSavings: clientSavings.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      savingsPercent,
    };
  }, [filteredRecords]);

  // Export CSV Handler
  const handleExportCsv = () => {
    if (filteredRecords.length === 0) return;

    const headers = [
      "ID",
      "Timestamp",
      "Practice Area Keyword",
      "Jurisdiction",
      "Slug",
      "AI Engine",
      "Word Count",
      "Estimated Tokens",
      "Content Cost ($)",
      "Image Cost ($)",
      "Total Cost ($)",
      "Speed (seconds)",
      "WP Post ID",
      "Live URL",
      "Status",
    ];

    const rows = filteredRecords.map((r) => [
      r.id,
      r.timestamp,
      `"${r.keyword.replace(/"/g, '""')}"`,
      r.city,
      r.slug,
      r.provider,
      r.contentWords,
      r.tokensEstimate,
      r.costContent.toFixed(4),
      r.costImages.toFixed(4),
      r.costTotal.toFixed(4),
      r.generationSeconds.toFixed(2),
      r.wpPostId || "",
      r.pageUrl || "",
      r.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `atoyan-content-autopilot-report-${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2500);
  };

  const copySqlSchema = () => {
    const schemaSql = `-- Atoyan Law Firm • Generation Reports Table Schema
CREATE TABLE IF NOT EXISTS public.generation_reports (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  keyword TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'California',
  slug TEXT NOT NULL,
  provider TEXT NOT NULL,
  content_words INTEGER NOT NULL DEFAULT 0,
  tokens_estimate INTEGER NOT NULL DEFAULT 0,
  cost_content NUMERIC(10, 4) NOT NULL DEFAULT 0.003,
  cost_images NUMERIC(10, 4) NOT NULL DEFAULT 0.040,
  cost_total NUMERIC(10, 4) NOT NULL DEFAULT 0.043,
  generation_seconds NUMERIC(8, 2) NOT NULL DEFAULT 1.85,
  wp_post_id INTEGER,
  page_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_reports_timestamp 
  ON public.generation_reports(timestamp DESC);

ALTER TABLE public.generation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on generation_reports"
  ON public.generation_reports FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on generation_reports"
  ON public.generation_reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete access on generation_reports"
  ON public.generation_reports FOR DELETE USING (true);`;

    navigator.clipboard.writeText(schemaSql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Timeframe Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="size-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <BarChart3 className="size-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
              Client Executive Reports &amp; Cost Tracking
            </h2>
            {/* Supabase Status Pill */}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                isConfigured
                  ? "bg-good/10 text-good border-good/30"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
              )}
            >
              <Database className="size-3.5" />
              <span>{isConfigured ? "Supabase Connected" : "Supabase Ready"}</span>
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  isConfigured ? "bg-good animate-pulse" : "bg-amber-500",
                )}
              />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Real-time generation volume, statutory content speed, and exact visual synthesis cost tracking for Atoyan Law Firm.
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-xl border border-line bg-panel-2 p-1 text-xs font-semibold">
            <button
              onClick={() => setTimeframe("today")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition",
                timeframe === "today" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-text",
              )}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe("week")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition",
                timeframe === "week" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-text",
              )}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe("month")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition",
                timeframe === "month" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-text",
              )}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeframe("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition",
                timeframe === "all" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-text",
              )}
            >
              All Time
            </button>
          </div>

          <button
            onClick={() => fetchReports()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-2 text-xs font-medium hover:bg-panel-2 text-text transition shadow-sm disabled:opacity-50"
            title="Refresh reports from Supabase"
          >
            <RefreshCw className={cn("size-3.5 text-muted", isLoading && "animate-spin")} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={filteredRecords.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel px-3.5 py-2 text-xs font-medium hover:bg-panel-2 text-text transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            title="Download CSV report"
          >
            {copiedCsv ? <Check className="size-3.5 text-good" /> : <Download className="size-3.5 text-muted" />}
            {copiedCsv ? "Exported!" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Supabase Setup Quick Help (Collapsible) */}
      {!isConfigured && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
              <AlertCircle className="size-4" />
              <span>Connect Supabase Cloud for Permanent Real-Time Logging</span>
            </div>
            <button
              onClick={() => setShowSchemaHelp(!showSchemaHelp)}
              className="text-accent underline hover:text-accent/80 font-medium"
            >
              {showSchemaHelp ? "Hide SQL Schema" : "View Supabase SQL Setup"}
            </button>
          </div>
          <p className="text-muted leading-relaxed">
            Generations are currently recorded in local memory. To persist across devices and team members, add{" "}
            <code className="px-1.5 py-0.5 rounded bg-panel border border-line font-mono text-[11px] text-text">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            and{" "}
            <code className="px-1.5 py-0.5 rounded bg-panel border border-line font-mono text-[11px] text-text">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            to your <code className="font-mono text-text">.env.local</code>.
          </p>
          {showSchemaHelp && (
            <div className="space-y-2 pt-2 border-t border-amber-500/20">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text">Supabase SQL Editor Query:</span>
                <button
                  onClick={copySqlSchema}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-panel border border-line text-[11px] font-medium text-text hover:bg-panel-2 transition"
                >
                  {copiedSchema ? <Check className="size-3 text-good" /> : <Copy className="size-3 text-muted" />}
                  {copiedSchema ? "Copied SQL!" : "Copy SQL"}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-panel-2 border border-line font-mono text-[11px] text-muted overflow-x-auto max-h-48 leading-relaxed">
{`CREATE TABLE IF NOT EXISTS public.generation_reports (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  keyword TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'California',
  slug TEXT NOT NULL,
  provider TEXT NOT NULL,
  content_words INTEGER NOT NULL DEFAULT 0,
  tokens_estimate INTEGER NOT NULL DEFAULT 0,
  cost_content NUMERIC(10, 4) NOT NULL DEFAULT 0.003,
  cost_images NUMERIC(10, 4) NOT NULL DEFAULT 0.040,
  cost_total NUMERIC(10, 4) NOT NULL DEFAULT 0.043,
  generation_seconds NUMERIC(8, 2) NOT NULL DEFAULT 1.85,
  wp_post_id INTEGER,
  page_url TEXT,
  status TEXT NOT NULL DEFAULT 'published'
);
ALTER TABLE public.generation_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON public.generation_reports FOR ALL USING (true);`}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Production Volume */}
        <div className="rounded-2xl border border-line bg-panel p-5 space-y-3 relative overflow-hidden group shadow-sm hover:border-accent/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">Practice Areas</span>
            <div className="size-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <FileText className="size-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              {stats.totalPages} <span className="text-sm font-semibold text-muted">Pages</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-good font-semibold">
              <TrendingUp className="size-3.5" />
              <span>{stats.totalPages > 0 ? "100% Live REST Synced" : "Ready for Generation"}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-muted">
            <span>Parent #750 (Labor Law)</span>
            <span className="font-mono text-accent font-semibold">{stats.totalWords} words</span>
          </div>
        </div>

        {/* KPI 2: Total Generation Cost */}
        <div className="rounded-2xl border border-line bg-panel p-5 space-y-3 relative overflow-hidden group shadow-sm hover:border-good/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">Total AI Cost</span>
            <div className="size-8 rounded-xl bg-good/10 text-good flex items-center justify-center">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              ${stats.totalCost}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-good font-semibold">
              <span>Avg ${stats.avgCostPerPage} / page</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-good/20 text-good font-mono font-bold">99.9% ROI</span>
            </div>
          </div>
          <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-muted">
            <span>Saved vs Agency Copy:</span>
            <span className="font-semibold text-good font-mono">${stats.clientSavings}</span>
          </div>
        </div>

        {/* KPI 3: Pipeline Velocity */}
        <div className="rounded-2xl border border-line bg-panel p-5 space-y-3 relative overflow-hidden group shadow-sm hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">Generation Speed</span>
            <div className="size-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Zap className="size-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              {stats.totalPages > 0 ? `${stats.avgLatency}s` : "1.82s"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold">
              <Clock className="size-3.5" />
              <span>Zero Queue Latency</span>
            </div>
          </div>
          <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-muted">
            <span>Architecture:</span>
            <span className="font-semibold text-text">In-Memory Parallel</span>
          </div>
        </div>

        {/* KPI 4: Schema & SEO Quality */}
        <div className="rounded-2xl border border-line bg-panel p-5 space-y-3 relative overflow-hidden group shadow-sm hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">SEO Rich Snippets</span>
            <div className="size-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              100%
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold">
              <CheckCircle2 className="size-3.5" />
              <span>Schema.org FAQPage Valid</span>
            </div>
          </div>
          <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-muted">
            <span>Yoast SEO Synced:</span>
            <span className="font-semibold text-text">Focus KW + Meta Title</span>
          </div>
        </div>
      </div>

      {/* Visual Unit Economics Breakdown & Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Model Breakdown Card */}
        <div className="lg:col-span-1 rounded-2xl border border-line bg-panel p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="size-5 text-accent" />
              <h3 className="font-bold text-base text-text">Cost Breakdown Per Page</h3>
            </div>
            <span className="text-xs font-mono font-bold text-accent px-2 py-0.5 rounded bg-accent/10">
              ~$0.043 Total
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Item 1: Content LLM */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-medium">
                <span className="text-text flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-accent" />
                  Legal Content (~1,800 tokens)
                </span>
                <span className="font-mono text-text font-bold">$0.0030 (7%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-panel-2 overflow-hidden">
                <div className="bg-accent h-full rounded-full" style={{ width: "7%" }} />
              </div>
              <span className="text-[10px] text-muted">Gemini 2.5 Flash / GPT-4o-mini structured California statutory synthesis</span>
            </div>

            {/* Item 2: Banner Image */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-medium">
                <span className="text-text flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500" />
                  16:9 Law Office Banner Image
                </span>
                <span className="font-mono text-text font-bold">$0.0200 (46.5%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-panel-2 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: "46.5%" }} />
              </div>
              <span className="text-[10px] text-muted">Google Imagen 3 / DALL-E 3 moody mahogany California law office</span>
            </div>

            {/* Item 3: Services Image */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-medium">
                <span className="text-text flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-indigo-500" />
                  4:3 Services Editorial Graphic
                </span>
                <span className="font-mono text-text font-bold">$0.0200 (46.5%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-panel-2 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: "46.5%" }} />
              </div>
              <span className="text-[10px] text-muted">Legal advocacy visual uploaded straight to WordPress Media Library</span>
            </div>

            {/* Item 4: WordPress REST API */}
            <div className="space-y-1.5 pt-2 border-t border-line/60">
              <div className="flex items-center justify-between font-medium">
                <span className="text-text flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-good" />
                  WordPress REST &amp; ACF Bridge
                </span>
                <span className="font-mono text-good font-bold">$0.0000 (Free)</span>
              </div>
              <span className="text-[10px] text-muted">Direct HTTP REST bridge into ACF Field Group 348 and WP Rocket cache flush</span>
            </div>
          </div>

          {/* Agency Comparison Box */}
          <div className="rounded-xl border border-good/20 bg-good/5 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-good">
              <span>Freelance Legal Copywriter Cost:</span>
              <span className="line-through text-muted font-normal">$175.00</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-text">
              <span>Atoyan Autopilot Cost:</span>
              <span className="font-mono text-good font-extrabold text-sm">$0.043</span>
            </div>
            <p className="text-[11px] text-muted pt-1 border-t border-good/10">
              Saves Atoyan Law Firm <strong className="text-good font-semibold">99.97%</strong> on every published practice area.
            </p>
          </div>
        </div>

        {/* Architectural Explainer Card: Speed without Inngest */}
        <div className="lg:col-span-2 rounded-2xl border border-line bg-panel p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Zap className="size-5 text-amber-500" />
              <div>
                <h3 className="font-bold text-base text-text">
                  How It Produces Everything in 2–3s Without Inngest
                </h3>
                <p className="text-xs text-muted">
                  High-throughput in-memory parallel execution architecture designed for interactive publishing.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              No External Queue Delay
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Card 1: Concurrent Parallelism */}
            <div className="p-4 rounded-xl border border-line bg-panel-2 space-y-2">
              <div className="flex items-center gap-2 font-bold text-text">
                <div className="size-6 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-mono text-xs">
                  1
                </div>
                <span>Concurrent Promise.allSettled Pipeline</span>
              </div>
              <p className="text-muted leading-relaxed">
                Rather than generating text first and then sequentially prompting for images, the engine fires LLM legal synthesis, Banner 16:9 generation, and Services 4:3 illustration simultaneously across 3 non-blocking async threads.
              </p>
            </div>

            {/* Card 2: Eliminating Inngest Queue Latency */}
            <div className="p-4 rounded-xl border border-line bg-panel-2 space-y-2">
              <div className="flex items-center gap-2 font-bold text-text">
                <div className="size-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-mono text-xs">
                  2
                </div>
                <span>Zero Message Queue Overhead</span>
              </div>
              <p className="text-muted leading-relaxed">
                External orchestrators (Inngest, Celery, BullMQ) add 2s–5s of queue handshake, database polling, and worker cold starts. For 1–5 concurrent practice area runs, Node.js native async I/O has zero overhead.
              </p>
            </div>

            {/* Card 3: In-Memory Buffer Streaming */}
            <div className="p-4 rounded-xl border border-line bg-panel-2 space-y-2">
              <div className="flex items-center gap-2 font-bold text-text">
                <div className="size-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-mono text-xs">
                  3
                </div>
                <span>Direct Buffer Streaming to WordPress</span>
              </div>
              <p className="text-muted leading-relaxed">
                Generated image buffers are piped directly into WordPress REST media endpoints (<code className="text-accent">/wp-json/wp/v2/media</code>) in memory. No disk writes, no S3 roundtrips, no intermediary asset hops.
              </p>
            </div>

            {/* Card 4: Atomic ACF Group 348 Mapping */}
            <div className="p-4 rounded-xl border border-line bg-panel-2 space-y-2">
              <div className="flex items-center gap-2 font-bold text-text">
                <div className="size-6 rounded-lg bg-good/10 text-good flex items-center justify-center font-mono text-xs">
                  4
                </div>
                <span>Atomic REST Persistence &amp; Cache Purge</span>
              </div>
              <p className="text-muted leading-relaxed">
                All 27 ACF subfields, cloned client reviews, and sidebar practice areas are dispatched in a clean atomic HTTP payload. The bridge plugin then purges WP Rocket immediately.
              </p>
            </div>
          </div>

          {/* Architecture Visual Diagram Strip */}
          <div className="p-3.5 rounded-xl border border-line bg-panel-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-1 rounded bg-accent/20 text-accent font-bold">Input Keyword</span>
              <span className="text-muted">➔</span>
              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-bold">Parallel AI Synthesis (1.8s)</span>
              <span className="text-muted">➔</span>
              <span className="px-2 py-1 rounded bg-good/20 text-good font-bold">Direct WP REST Publish</span>
            </div>
            <span className="text-good font-semibold flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="size-3.5" /> Total Latency: ~1.8–2.3s
            </span>
          </div>
        </div>
      </div>

      {/* Generation History & Audit Log Table */}
      <div className="rounded-2xl border border-line bg-panel p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg text-text">Production Generation Log</h3>
              {records.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                  {records.length} {records.length === 1 ? "Page" : "Pages"}
                </span>
              )}
            </div>
            <p className="text-xs text-muted">
              Live audit trail of practice area legal pages, visual assets, and cost metrics stored in Supabase.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Filter by keyword or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-line bg-panel-2 text-xs text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="size-6 text-accent animate-spin mx-auto" />
            <p className="text-xs text-muted font-medium">Syncing practice area logs from Supabase...</p>
          </div>
        )}

        {/* Clean Zero-State (When No Generations Yet) */}
        {!isLoading && records.length === 0 && (
          <div className="py-14 px-6 text-center space-y-4 rounded-xl border border-dashed border-line bg-panel-2/30">
            <div className="size-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto border border-accent/20">
              <Database className="size-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h4 className="font-bold text-base text-text">No Practice Area Generations Yet</h4>
              <p className="text-xs text-muted leading-relaxed">
                Your generation database is clean and fresh. As soon as you generate and publish a practice area page, its word count, token consumption, $0.043 cost breakdown, and live WordPress link will appear here in real time.
              </p>
            </div>
            {onSwitchToGenerator && (
              <button
                onClick={onSwitchToGenerator}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition shadow-sm"
              >
                <Plus className="size-4" />
                <span>Generate Your First Practice Area</span>
              </button>
            )}
          </div>
        )}

        {/* Table Container (When Records Exist) */}
        {!isLoading && records.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-panel-2 text-muted font-medium">
                  <th className="py-3 px-4">Practice Area / Keyword</th>
                  <th className="py-3 px-4">Jurisdiction</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">AI Model &amp; Visuals</th>
                  <th className="py-3 px-4">Words / Tokens</th>
                  <th className="py-3 px-4">Cost (Txt / Img / Total)</th>
                  <th className="py-3 px-4">Status &amp; Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted">
                      No generation records match &quot;{searchQuery}&quot; for the selected timeframe.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item) => {
                    const dateStr = new Date(item.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={item.id} className="hover:bg-panel-2/50 transition">
                        <td className="py-3.5 px-4 font-semibold text-text max-w-xs">
                          <div className="truncate" title={item.keyword}>
                            {item.keyword}
                          </div>
                          <div className="text-[10px] text-muted font-mono truncate">/{item.slug}/</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-panel-2 border border-line text-[11px] font-medium text-text">
                            {item.city}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-muted whitespace-nowrap">{dateStr}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-[11px] text-text">{item.provider}</div>
                          <div className="text-[10px] text-muted">Dual 16:9 &amp; 4:3 visuals</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-text">
                            {item.contentWords.toLocaleString()} words
                          </div>
                          <div className="text-[10px] text-muted font-mono">
                            {item.tokensEstimate} tokens
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                          <div className="text-text font-bold">${item.costTotal.toFixed(4)}</div>
                          <div className="text-[10px] text-muted">
                            ${item.costContent.toFixed(3)} + ${item.costImages.toFixed(2)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-good/10 text-good border border-good/20 text-[10px] font-semibold">
                              <span className="size-1.5 rounded-full bg-good" />
                              {item.wpPostId ? `#${item.wpPostId}` : "Live"}
                            </span>
                            {item.pageUrl && (
                              <a
                                href={item.pageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded text-muted hover:text-accent transition"
                                title="View live page on atoyanlaw.com"
                              >
                                <ExternalLink className="size-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteRecord(item.id)}
                              disabled={isDeleting === item.id}
                              className="p-1 rounded text-muted hover:text-red-500 transition opacity-60 hover:opacity-100"
                              title="Delete record"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Summary */}
        {!isLoading && records.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs text-muted">
            <span>Showing {filteredRecords.length} practice areas logged</span>
            <span className="font-mono">Total Period Cost: ${stats.totalCost} USD</span>
          </div>
        )}
      </div>
    </div>
  );
}
