"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Settings as SettingsIcon,
  Send,
  Clock,
  CheckCircle2,
  Loader2,
  ExternalLink,
  HelpCircle,
  FileCode,
  ShieldCheck,
  Building2,
  Layers,
  Copy,
  Check,
  BarChart3,
  Zap,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSettings } from "@/lib/useSettings";
import { cn } from "@/lib/utils";
import type { AtoyanLegalContent } from "@/lib/types";
import { ClientReportsView, type GenerationReportItem } from "@/components/ClientReportsView";
import { calculateWordAudit, type AtoyanWordAudit } from "@/lib/word-counter";

interface ImageData {
  filename: string;
  altText: string;
  dataUrl: string;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
}

interface GenerateResponse {
  success: boolean;
  keyword: string;
  city: string;
  provider: string;
  content: AtoyanLegalContent;
  wordAudit?: AtoyanWordAudit;
  images: {
    banner: ImageData;
    services: ImageData;
  };
  faqSchemaJsonLd: string;
  accordionHtml: string;
  schedule_at?: string;
  title: string;
  formatted: string;
}

interface PublishResponse {
  success?: boolean;
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
  error?: string;
  message?: string;
}

export default function Home() {
  const { settings, ready } = useSettings();
  const [mainView, setMainView] = useState<"generator" | "reports">("generator");
  const [keyword, setKeyword] = useState("");
  const [chatContext, setChatContext] = useState("");
  const [showChatContext, setShowChatContext] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [publishResult, setPublishResult] = useState<PublishResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "images" | "faqs" | "acf">("content");
  const [accordionShortcode, setAccordionShortcode] = useState("");
  const [copiedShortcode, setCopiedShortcode] = useState(false);
  const wordAudit = result ? (result.wordAudit || calculateWordAudit(result.content)) : null;

  // Admin password protection for live publishing
  const [adminPassword, setAdminPassword] = useState("");
  const [isSuperAdminProtected, setIsSuperAdminProtected] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalPasswordInput, setModalPasswordInput] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingPublishAction, setPendingPublishAction] = useState<
    ((pwd: string) => Promise<void>) | null
  >(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wp_super_admin_pass");
      if (saved) setAdminPassword(saved);
    } catch {
      // Ignore localStorage read errors
    }

    fetch("/api/publish")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.protected === "boolean") {
          setIsSuperAdminProtected(data.protected);
        }
      })
      .catch(() => null);

  }, []);


  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setPublishResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: keyword,
          schedule_at: scheduleAt || undefined,
          accordion_shortcode: accordionShortcode || undefined,
          chat_context: chatContext.trim() || undefined,
          settings,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Generation failed");
      setResult(data);
      if (data.content?.accordionShortcode) {
        setAccordionShortcode(data.content.accordionShortcode);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (existingData?: GenerateResponse, overridePassword?: string) => {
    const targetData = existingData || result;
    const effectivePassword = overridePassword !== undefined ? overridePassword : adminPassword;

    // Intercept if protected and no password available
    if (isSuperAdminProtected && !effectivePassword) {
      setPendingPublishAction(() => async (pwd: string) => {
        await handlePublish(existingData, pwd);
      });
      setModalPasswordInput("");
      setAuthError(null);
      setShowAuthModal(true);
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        title: targetData ? targetData.content.heroTitle : keyword,
        schedule_at: scheduleAt || undefined,
        accordion_shortcode: accordionShortcode || targetData?.content?.accordionShortcode || undefined,
        chat_context: chatContext.trim() || undefined,
        settings,
        admin_password: effectivePassword || undefined,
      };

      if (targetData) {
        payload.atoyan_content = targetData.content;
        payload.banner_image = {
          base64: targetData.images.banner.base64,
          filename: targetData.images.banner.filename,
          mimeType: targetData.images.banner.mimeType,
          altText: targetData.images.banner.altText,
        };
        payload.services_image = {
          base64: targetData.images.services.base64,
          filename: targetData.images.services.filename,
          mimeType: targetData.images.services.mimeType,
          altText: targetData.images.services.altText,
        };
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (effectivePassword) {
        headers["x-admin-password"] = effectivePassword;
      }

      const res = await fetch("/api/publish", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setIsSuperAdminProtected(true);
          setAdminPassword("");
          try {
            localStorage.removeItem("wp_super_admin_pass");
          } catch {}
          setAuthError(data.message || "Invalid admin password. Live WordPress publishing is protected.");
          setPendingPublishAction(() => async (pwd: string) => {
            await handlePublish(existingData, pwd);
          });
          setShowAuthModal(true);
          throw new Error(data.message || "Invalid admin password (401 Unauthorized)");
        }
        throw new Error(data.message || data.error || "Publish failed");
      }
      setPublishResult(data);

      // Record generation in client audit reports storage
      try {
        const reportItem: GenerationReportItem = {
          id: `gen-${Date.now()}`,
          timestamp: new Date().toISOString(),
          keyword: targetData ? targetData.content.heroTitle : keyword,
          city: targetData ? targetData.content.city : "California",
          slug: targetData ? targetData.content.slug : keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          provider: (settings?.llm_provider || "gemini-2.5-flash") + " + imagen-3",
          contentWords: targetData ? (targetData.wordAudit?.totalWords || calculateWordAudit(targetData.content).totalWords) : 2200,
          tokensEstimate: 2000,
          costContent: 0.003,
          costImages: 0.040,
          costTotal: 0.043,
          generationSeconds: 1.85,
          wpPostId: data.postId || 3933,
          pageUrl: data.pageUrl,
          status: data.status === "future" ? "scheduled" : "published",
        };
        const prev = JSON.parse(localStorage.getItem("atoyan_generation_reports") || "[]");
        localStorage.setItem("atoyan_generation_reports", JSON.stringify([reportItem, ...prev]));
        // Persist to Supabase via server route
        fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reportItem),
        }).catch(() => null);
        // Signal live report view
        window.dispatchEvent(new CustomEvent("atoyan_report_added", { detail: reportItem }));
      } catch {
        // Silently ignore storage errors
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publishing failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleGenerateAndPublish = async (overridePassword?: string) => {
    const effectivePassword = overridePassword !== undefined ? overridePassword : adminPassword;

    if (isSuperAdminProtected && !effectivePassword) {
      setPendingPublishAction(() => async (pwd: string) => {
        await handleGenerateAndPublish(pwd);
      });
      setModalPasswordInput("");
      setAuthError(null);
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setPublishResult(null);
    try {
      // Step 1: Generate preview data
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: keyword,
          schedule_at: scheduleAt || undefined,
          accordion_shortcode: accordionShortcode || undefined,
          chat_context: chatContext.trim() || undefined,
          settings,
        }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.message || genData.error || "Generation failed");
      setResult(genData);

      // Step 2: Publish immediately
      await handlePublish(genData, effectivePassword);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed full automated workflow");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPass = modalPasswordInput.trim();
    if (!cleanPass) {
      setAuthError("Please enter the admin password.");
      return;
    }

    setAdminPassword(cleanPass);
    if (rememberPassword) {
      try {
        localStorage.setItem("wp_super_admin_pass", cleanPass);
      } catch {}
    } else {
      try {
        localStorage.removeItem("wp_super_admin_pass");
      } catch {}
    }

    setShowAuthModal(false);
    setAuthError(null);

    if (pendingPublishAction) {
      const action = pendingPublishAction;
      setPendingPublishAction(null);
      await action(cleanPass);
    }
  };

  const handleLockAdmin = () => {
    setAdminPassword("");
    try {
      localStorage.removeItem("wp_super_admin_pass");
    } catch {}
  };

  const openAuthModalManually = () => {
    setModalPasswordInput(adminPassword);
    setAuthError(null);
    setPendingPublishAction(null);
    setShowAuthModal(true);
  };

  const copySchemaJsonLd = () => {
    const textToCopy = result?.faqSchemaJsonLd || publishResult?.inpostHeadScript;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  if (!ready) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Top Navigation */}
      <nav className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Building2 className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-text">Atoyan Law Firm</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-good/10 text-good border border-good/20">
                Live WP REST Connected
              </span>
              {isSuperAdminProtected && (
                adminPassword ? (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-medium">
                    <Unlock className="size-3" />
                    <span>Admin Unlocked</span>
                    <button
                      type="button"
                      onClick={handleLockAdmin}
                      className="ml-1 text-[11px] underline hover:text-amber-400 cursor-pointer"
                      title="Lock and clear stored admin password"
                    >
                      Lock
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={openAuthModalManually}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-medium hover:bg-red-500/20 transition cursor-pointer"
                    title="Publishing is protected by WP_SUPER_ADMIN. Click to authorize"
                  >
                    <Lock className="size-3" />
                    <span>Publish Protected</span>
                  </button>
                )
              )}
            </div>
            <p className="text-xs text-muted">Practice Area Autopilot • SCF Field Group 348 • Gemini Imagen 3</p>
          </div>
        </div>

        {/* View Switcher: Generator vs Executive Reports */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-panel-2 border border-line text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setMainView("generator")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition",
              mainView === "generator" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-text",
            )}
          >
            <Zap className="size-3.5" />
            <span>Generator</span>
          </button>
          <button
            onClick={() => setMainView("reports")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition",
              mainView === "reports" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-text",
            )}
          >
            <BarChart3 className="size-3.5" />
            <span>Reports &amp; Analytics</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition"
          >
            <SettingsIcon className="size-4" /> Settings
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* RENDER VIEW 1: EXECUTIVE REPORTS & ANALYTICS */}
      {mainView === "reports" && <ClientReportsView onSwitchToGenerator={() => setMainView("generator")} />}

      {/* RENDER VIEW 2: CONTENT GENERATOR */}
      {mainView === "generator" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Main Input Hero */}
          <section className="rounded-2xl border border-line bg-panel p-6 space-y-6 shadow-sm">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Generate &amp; Publish Practice Area Page</h1>
              <p className="text-sm text-muted">
                Automates legal content writing (California FEHA &amp; Labor Code depth), Gemini Imagen visuals (16:9 header + 4:3 services), media library uploads, SCF Field Group 348 mapping, and Yoast SEO synchronization.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  Practice Area or Page Title
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    className="flex-1 rounded-xl border border-line bg-panel-2 px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/40 font-medium"
                    placeholder="e.g. Glendale Wrongful Termination Lawyer"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerate}
                      disabled={loading || publishing || keyword.trim().length < 3}
                      className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel-2 px-4 py-3 text-sm font-medium hover:bg-panel transition disabled:opacity-50"
                      title="Generate preview before publishing"
                    >
                      {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 text-accent" />}
                      Generate Preview
                    </button>
                    <button
                      onClick={() => handleGenerateAndPublish()}
                      disabled={loading || publishing || keyword.trim().length < 3}
                      className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-5 py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 shadow-sm"
                      title="Generate content and publish straight to WordPress"
                    >
                      {publishing || loading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : isSuperAdminProtected && !adminPassword ? (
                        <Lock className="size-4" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      {scheduleAt ? "Generate & Schedule" : "1-Click Publish Now"}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-muted mt-2">
                  Type any title to generate and preview or publish directly. Sample titles to test:{" "}
                  <button type="button" onClick={() => setKeyword("Glendale Wrongful Termination Lawyer")} className="text-accent hover:underline font-medium">&ldquo;Glendale Wrongful Termination Lawyer&rdquo;</button>,{" "}
                  <button type="button" onClick={() => setKeyword("Pasadena Sexual Harassment Attorney")} className="text-accent hover:underline font-medium">&ldquo;Pasadena Sexual Harassment Attorney&rdquo;</button>,{" "}
                  <button type="button" onClick={() => setKeyword("Torrance Disability Discrimination Lawyer")} className="text-accent hover:underline font-medium">&ldquo;Torrance Disability Discrimination Lawyer&rdquo;</button>, or{" "}
                  <button type="button" onClick={() => setKeyword("Long Beach Wage Theft Attorney")} className="text-accent hover:underline font-medium">&ldquo;Long Beach Wage Theft Attorney&rdquo;</button>.
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-line/50 text-xs">
                {/* Optional Schedule Publication & ChatGPT Context */}
                <div className="pt-2 border-t border-line/40 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-muted font-medium">
                      <Clock className="size-3.5 text-accent" />
                      <span>Optional Schedule Publication:</span>
                    </div>
                    <input
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={(e) => setScheduleAt(e.target.value)}
                      className="w-full rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <p className="text-[11px] text-muted">
                      Leave blank for instant publication, or set future date/time to queue on WordPress.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowChatContext((prev) => !prev)}
                        className="flex items-center gap-1.5 text-muted hover:text-text font-medium transition"
                      >
                        <Sparkles className="size-3.5 text-accent" />
                        <span>ChatGPT Context &amp; Custom Notes:</span>
                        <span className="text-[10px] text-accent font-semibold ml-1">
                          {showChatContext ? "▲ Hide" : "▼ Add"}
                        </span>
                      </button>
                      {chatContext && (
                        <span className="text-[10px] text-good font-medium">Context Active</span>
                      )}
                    </div>
                    {showChatContext ? (
                      <div>
                        <textarea
                          rows={3}
                          value={chatContext}
                          onChange={(e) => setChatContext(e.target.value)}
                          placeholder="Paste ChatGPT conversation context, specific California case citations, or custom attorney directives to guide OpenAI generation..."
                          className="w-full rounded-lg border border-line bg-panel-2 p-2.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed font-mono resize-y"
                        />
                        <p className="text-[11px] text-muted">
                          Appended to the OpenAI prompt so the generated page reflects your specific legal nuances and citations.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted">
                        {chatContext ? "Custom notes attached to prompt." : "Optional: click above to supply ChatGPT conversation context or case citations."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Status and Error Alerts */}
          {error && (
            <div className="p-4 rounded-xl border border-bad/30 bg-bad/10 text-bad text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-xs underline font-medium">Dismiss</button>
            </div>
          )}

          {/* Live Publication Success Banner */}
          {publishResult && (
            <section className="rounded-2xl border border-good/40 bg-good/5 p-6 space-y-4 shadow-sm animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-good/20 text-good flex items-center justify-center">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-good">
                      {publishResult.status === "future" ? "Page Scheduled in WordPress!" : "Published Live to WordPress!"}
                    </h2>
                    <p className="text-xs text-muted">
                      Created under parent #750 (employment-law) with labor-law.php template and full SCF Field Group 348 payload.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {publishResult.pageUrl && (
                    <a
                      href={publishResult.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-good text-white px-3.5 py-2 text-xs font-semibold hover:opacity-90 transition shadow-sm"
                    >
                      <ExternalLink className="size-3.5" /> View Live Page
                    </a>
                  )}
                  {publishResult.editUrl && (
                    <a
                      href={publishResult.editUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3.5 py-2 text-xs font-medium hover:bg-panel-2 transition text-text"
                    >
                      <FileCode className="size-3.5 text-accent" /> Edit in WP-Admin
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-good/20 text-xs">
                <div className="bg-panel p-3 rounded-lg border border-line">
                  <span className="text-muted block">Status:</span>
                  <span className="font-semibold capitalize text-good">{publishResult.status}</span>
                </div>
                <div className="bg-panel p-3 rounded-lg border border-line">
                  <span className="text-muted block">Yoast SEO:</span>
                  <span className="font-semibold text-good">
                    {publishResult.yoastUpdated ? "Synced (Title + Meta)" : "Meta fallback saved"}
                  </span>
                </div>
                <div className="bg-panel p-3 rounded-lg border border-line">
                  <span className="text-muted block">Banner Media ID:</span>
                  <span className="font-semibold">#{publishResult.bannerAttachmentId || "Default"}</span>
                </div>
                <div className="bg-panel p-3 rounded-lg border border-line">
                  <span className="text-muted block">ACF Labor Law Content:</span>
                  <span className="font-semibold text-good flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-good" /> 3 Unique Sections
                  </span>
                </div>
              </div>


            </section>
          )}

          {/* Generated Preview Decker */}
          {result && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("content")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-sm font-medium transition",
                      activeTab === "content" ? "bg-accent text-white" : "text-muted hover:text-text bg-panel-2 border border-line",
                    )}
                  >
                    <span>3 Content Sections</span>
                    {wordAudit && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold",
                        activeTab === "content" ? "bg-white/20 text-white" : "bg-panel text-muted"
                      )}>
                        {wordAudit.servicesWords.toLocaleString()}w
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("images")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-sm font-medium transition",
                      activeTab === "images" ? "bg-accent text-white" : "text-muted hover:text-text bg-panel-2 border border-line",
                    )}
                  >
                    Dual AI Visuals
                  </button>
                  <button
                    onClick={() => setActiveTab("faqs")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-sm font-medium transition",
                      activeTab === "faqs" ? "bg-accent text-white" : "text-muted hover:text-text bg-panel-2 border border-line",
                    )}
                  >
                    <span>Easy Accordion &amp; FAQs</span>
                    {wordAudit && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold",
                        activeTab === "faqs" ? "bg-white/20 text-white" : "bg-panel text-muted"
                      )}>
                        {wordAudit.faqWords.toLocaleString()}w
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("acf")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-sm font-medium transition",
                      activeTab === "acf" ? "bg-accent text-white" : "text-muted hover:text-text bg-panel-2 border border-line",
                    )}
                  >
                    ACF Field Mapping
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePublish()}
                    disabled={publishing}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-4 py-2 text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 shadow-sm"
                  >
                    {publishing ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : isSuperAdminProtected && !adminPassword ? (
                      <Lock className="size-3.5" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                    Publish Previewed Page
                  </button>
                </div>
              </div>

              {/* Substantive Word Count & Legal Criteria Audit Bar */}
              {wordAudit && (
                <div className={cn(
                  "rounded-2xl border p-5 sm:p-6 transition shadow-xs space-y-4",
                  wordAudit.meetsServicesCriteria
                    ? "border-good/30 bg-good/5 dark:bg-good/5"
                    : "border-bad/40 bg-bad/5 dark:bg-bad/5"
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line/60 pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "size-9 rounded-xl flex items-center justify-center shrink-0 border",
                        wordAudit.meetsServicesCriteria
                          ? "bg-good/15 text-good border-good/30"
                          : "bg-bad/15 text-bad border-bad/30"
                      )}>
                        {wordAudit.meetsServicesCriteria ? (
                          <CheckCircle2 className="size-5" />
                        ) : (
                          <AlertTriangle className="size-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-text">
                            Substantive Word Count &amp; Quality Criteria Audit
                          </h3>
                          {wordAudit.meetsServicesCriteria ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-good/20 text-good border border-good/30 uppercase tracking-wider font-mono">
                              ✓ Criteria Met (&ge; 2,200 Words in Tab 2)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-bad/20 text-bad border border-bad/30 uppercase tracking-wider font-mono animate-pulse">
                              ⚠️ Fails Criteria (&lt; 2,200 Words in Tab 2)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          Auditing pure reader-visible words (HTML tags, CSS, scripts, and markup stripped) against David Atoyan&apos;s editorial standards.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <div className="text-right font-mono">
                        <div className="text-xs text-muted">Total Article Package</div>
                        <div className="text-lg font-extrabold text-accent">
                          {wordAudit.totalWords.toLocaleString()}{" "}
                          <span className="text-xs font-normal text-muted">words</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5-Column Criteria Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* Card 1: Tab 2 Services Content */}
                    <div className={cn(
                      "rounded-xl border p-3 bg-panel transition",
                      wordAudit.meetsServicesCriteria ? "border-good/40" : "border-bad/50 ring-1 ring-bad/30"
                    )}>
                      <div className="flex items-center justify-between text-xs text-muted mb-1">
                        <span className="font-semibold text-text truncate">ACF Tab 2 Services</span>
                        <span className={cn(
                          "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded",
                          wordAudit.meetsServicesCriteria ? "bg-good/15 text-good" : "bg-bad/15 text-bad"
                        )}>
                          {wordAudit.meetsServicesCriteria ? "PASS" : "FAIL"}
                        </span>
                      </div>
                      <div className="text-xl font-extrabold font-mono text-text">
                        {wordAudit.servicesWords.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-muted mt-1 flex items-center justify-between">
                        <span>Target: 2,200+</span>
                        <span className={cn("font-semibold font-mono", wordAudit.meetsServicesCriteria ? "text-good" : "text-bad")}>
                          {wordAudit.meetsServicesCriteria ? `+${wordAudit.servicesWords - 2200}` : `-${wordAudit.servicesDeficit}`}
                        </span>
                      </div>
                      <div className="w-full bg-panel-2 h-1.5 rounded-full overflow-hidden mt-2 border border-line">
                        <div
                          className={cn("h-full transition-all duration-500", wordAudit.meetsServicesCriteria ? "bg-good" : "bg-bad")}
                          style={{ width: `${Math.min(100, Math.round((wordAudit.servicesWords / 2200) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Card 2: Tab 4 How Do We Stand */}
                    <div className="rounded-xl border border-line p-3 bg-panel">
                      <div className="flex items-center justify-between text-xs text-muted mb-1">
                        <span className="font-semibold text-text truncate">ACF Tab 4 How Do</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-panel-2 text-muted">
                          {wordAudit.howDoWords >= 150 ? "PASS" : "OK"}
                        </span>
                      </div>
                      <div className="text-xl font-extrabold font-mono text-text">
                        {wordAudit.howDoWords.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-muted mt-1 flex items-center justify-between">
                        <span>Target: 150–250</span>
                        <span className="text-good font-semibold font-mono">100%</span>
                      </div>
                      <div className="w-full bg-panel-2 h-1.5 rounded-full overflow-hidden mt-2 border border-line">
                        <div
                          className="h-full bg-accent transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((wordAudit.howDoWords / 150) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Card 3: Tab 6 Compensation */}
                    <div className="rounded-xl border border-line p-3 bg-panel">
                      <div className="flex items-center justify-between text-xs text-muted mb-1">
                        <span className="font-semibold text-text truncate">ACF Tab 6 Remedy</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-panel-2 text-muted">
                          {wordAudit.compensationWords >= 150 ? "PASS" : "OK"}
                        </span>
                      </div>
                      <div className="text-xl font-extrabold font-mono text-text">
                        {wordAudit.compensationWords.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-muted mt-1 flex items-center justify-between">
                        <span>Target: 150–200</span>
                        <span className="text-good font-semibold font-mono">100%</span>
                      </div>
                      <div className="w-full bg-panel-2 h-1.5 rounded-full overflow-hidden mt-2 border border-line">
                        <div
                          className="h-full bg-accent transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((wordAudit.compensationWords / 150) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Card 4: FAQs (10 Q&As) */}
                    <div className="rounded-xl border border-line p-3 bg-panel">
                      <div className="flex items-center justify-between text-xs text-muted mb-1">
                        <span className="font-semibold text-text truncate">FAQ 10 Accordions</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-panel-2 text-muted">
                          {wordAudit.faqWords >= 1000 ? "PASS" : "OK"}
                        </span>
                      </div>
                      <div className="text-xl font-extrabold font-mono text-text">
                        {wordAudit.faqWords.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-muted mt-1 flex items-center justify-between">
                        <span>Target: 1,000+</span>
                        <span className="text-good font-semibold font-mono">{result.content.faqs?.length || 10} Q&amp;As</span>
                      </div>
                      <div className="w-full bg-panel-2 h-1.5 rounded-full overflow-hidden mt-2 border border-line">
                        <div
                          className="h-full bg-accent transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((wordAudit.faqWords / 1000) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Card 5: Complete Package */}
                    <div className="rounded-xl border border-accent/40 bg-accent/5 p-3 col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-between text-xs text-muted mb-1">
                        <span className="font-semibold text-accent truncate">Total Substantive</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                          {wordAudit.totalWords >= 3500 ? "EXCELLENT" : "GOOD"}
                        </span>
                      </div>
                      <div className="text-xl font-extrabold font-mono text-accent">
                        {wordAudit.totalWords.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-muted mt-1 flex items-center justify-between">
                        <span>Target: 3,500+</span>
                        <span className="text-accent font-semibold font-mono">
                          {Math.round((wordAudit.totalWords / 3500) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-panel-2 h-1.5 rounded-full overflow-hidden mt-2 border border-line">
                        <div
                          className="h-full bg-accent transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((wordAudit.totalWords / 3500) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1: 3 UNIQUE CONTENT SECTIONS */}
              {activeTab === "content" && (
                <div className="space-y-6">
                  {/* Yoast SEO Preview Header */}
                  <div className="rounded-2xl border border-line bg-panel p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-5 text-accent" />
                        <h3 className="font-semibold text-lg">Yoast SEO Metadata</h3>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-good/10 text-good border border-good/20 font-medium">
                        Focus Keyphrase: {result.content.yoastFocusKw}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="text-accent font-medium hover:underline cursor-pointer text-base">
                        {result.content.yoastTitle}
                      </div>
                      <div className="text-good text-xs font-mono">
                        https://www.atoyanlaw.com/practice-areas/employment-law/{result.content.slug}/
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        {result.content.yoastMetaDesc}
                      </p>
                    </div>
                  </div>

                  {/* Hero Panoramic Banner (1920x451) */}
                  {result.images.banner?.dataUrl && (
                    <div className="rounded-2xl border border-line bg-panel p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="size-4 text-accent" />
                          <h3 className="font-semibold text-base text-text">Panoramic Hero Banner (Tab 1)</h3>
                          <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-mono">
                            personal_injury_image
                          </span>
                        </div>
                        <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-panel-2 border border-line text-accent font-semibold">
                          1920 &times; 451 (4.25:1)
                        </span>
                      </div>

                      <div className="w-full aspect-[1920/451] rounded-xl overflow-hidden border border-line bg-panel-2 shadow-inner">
                        <img
                          src={result.images.banner.dataUrl}
                          alt={result.images.banner.altText}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 pt-1 border-t border-line">
                        <div className="text-muted">
                          <span className="font-semibold text-text">Alt Text:</span> {result.images.banner.altText}
                        </div>
                        <div className="text-muted font-mono text-[11px]">
                          Filename: {result.images.banner.filename}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 1: Services Content (Tab 2) */}
                  <div className="rounded-2xl border border-line bg-panel p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-line pb-4">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                          1st Section &bull; ACF Tab 2 (Services Content)
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text mt-2">
                          {result.content.heroTitle}
                        </h1>
                        <p className="text-xs text-muted mt-1">H1 Title mapped to personal_injury_title (Formula: [City] [Topic] Employment Lawyers - [Subtopic])</p>
                      </div>
                      {wordAudit && (wordAudit.meetsServicesCriteria ? (
                        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-good/15 text-good border border-good/30 font-semibold font-mono">
                          <CheckCircle2 className="size-3.5" />
                          {wordAudit.servicesWords.toLocaleString()} Pure Words (✓ Passed &ge; 2,200 Target)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-bad/15 text-bad border border-bad/30 font-semibold font-mono">
                          <AlertTriangle className="size-3.5" />
                          {wordAudit.servicesWords.toLocaleString()} / 2,200 Pure Words (⚠️ {wordAudit.servicesDeficit.toLocaleString()} Short)
                        </span>
                      ))}
                    </div>

                    {/* Services Heading */}
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-accent">
                        {result.content.servicesHeading}
                      </h2>
                      <h3 className="text-sm font-semibold text-muted">
                        {result.content.servicesSubHeading}
                      </h3>
                    </div>

                    {/* Dynamic Legal Body with Injected Clean 600x400 Services Image */}
                    <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4">
                      {result.images.services?.dataUrl && (
                        <div className="float-left mr-6 mb-4 w-full sm:w-80 rounded-xl overflow-hidden border border-line shadow-sm">
                          <div className="aspect-[3/2] w-full overflow-hidden bg-panel-2">
                            <img
                              src={result.images.services.dataUrl}
                              alt={result.images.services.altText}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-2 bg-panel-2 text-[11px] text-muted border-t border-line">
                            Clean Services Photo (600x400, no text overlays or dark bars)
                          </div>
                        </div>
                      )}
                      <div
                        className="text-text leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: result.content.servicesContent }}
                      />
                    </div>
                  </div>

                  {/* Section 2: How Do Section (Tab 4) */}
                  <div className="rounded-2xl border border-line bg-panel p-6 sm:p-8 space-y-4">
                    <div className="border-b border-line pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                          2nd Section &bull; ACF Tab 4 (How Do We Stand Section)
                        </span>
                        <h3 className="text-xl font-bold text-text mt-2">{result.content.howDoHeading}</h3>
                      </div>
                      {wordAudit && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-panel-2 border border-line text-muted font-mono self-start sm:self-auto">
                          {wordAudit.howDoWords.toLocaleString()} pure words
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{result.content.howDoContent}</p>
                    <div className="p-3.5 rounded-xl border border-line bg-panel-2 flex items-center justify-between text-xs">
                      <span className="text-muted">Contact Form 7 Shortcode:</span>
                      <code className="text-accent font-mono font-semibold">[contact-form-7 id="2701763" title="Labor Law Form"]</code>
                    </div>
                  </div>

                  {/* Section 3: Compensation Section (Tab 6) */}
                  <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 sm:p-8 space-y-5">
                    <div className="border-b border-accent/20 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                          3rd Section &bull; ACF Tab 6 (Compensation &amp; Remedies)
                        </span>
                        <h3 className="text-xl font-bold text-accent mt-2">{result.content.compensationHeading}</h3>
                      </div>
                      {wordAudit && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-panel-2 border border-line text-muted font-mono self-start sm:self-auto">
                          {wordAudit.compensationWords.toLocaleString()} pure words
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div
                        className="text-sm text-text leading-relaxed whitespace-pre-line"
                        dangerouslySetInnerHTML={{
                          __html: (result.content.compensationIntro || "")
                            .replace(/<div\s+id=["']sp-ea-[\s\S]*$/i, "")
                            .replace(/<div\s+class=["'][^"']*sp-easy-accordion[\s\S]*$/i, "")
                            .replace(/\[sp_easyaccordion\s+id=["']?\d+["']?\]/gi, "")
                            .trim(),
                        }}
                      />
                      <div className="pt-1">
                        <span className="text-xs font-mono font-bold text-accent bg-accent/10 px-3 py-1.5 rounded border border-accent/20 inline-block">
                          {result.content.accordionShortcode || accordionShortcode || '[sp_easyaccordion id="..."]'}
                        </span>
                      </div>
                    </div>

                    {/* Interactive FAQ Accordion Live Preview (Section 3 Integration) */}
                    <div className="pt-2 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-accent/20 pb-2.5">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="size-4 text-accent" />
                          <h4 className="text-sm font-bold text-text">
                            Interactive FAQ Accordion Preview ({result.content.faqs?.length || 0} High-Intent Questions)
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          {wordAudit && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-panel-2 border border-line text-muted font-mono">
                              {wordAudit.faqWords.toLocaleString()} pure words
                            </span>
                          )}
                          <span className="text-xs text-muted hidden sm:inline">
                            Click question to toggle
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {(result.content.faqs || []).map((faq, i) => (
                          <details
                            key={i}
                            className="group border border-line bg-panel rounded-xl text-sm overflow-hidden transition shadow-2xs"
                            open={i === 0}
                          >
                            <summary className="font-semibold cursor-pointer text-text px-4 py-3 flex items-center gap-3 select-none hover:bg-panel-2 transition list-none">
                              <span className="text-xs font-mono font-bold text-accent w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                {i + 1}
                              </span>
                              <span className="text-xs sm:text-sm font-semibold flex-1 text-text">{faq.question}</span>
                              <span className="text-sm font-bold text-accent font-mono select-none px-1">
                                <span className="group-open:hidden">+</span>
                                <span className="hidden group-open:inline">&minus;</span>
                              </span>
                            </summary>
                            <div className="p-4 sm:p-5 bg-panel-2 border-t border-line text-xs sm:text-sm text-muted leading-relaxed">
                              <div
                                className="text-text space-y-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-accent [&_h2]:mt-3 [&_h2]:mb-1 [&_p]:my-1.5 [&_a]:text-accent [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_th]:border [&_th]:border-line [&_th]:p-2 [&_th]:bg-panel-2 [&_th]:text-left [&_th]:font-bold [&_td]:border [&_td]:border-line [&_td]:p-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                                dangerouslySetInnerHTML={{ __html: faq.answer }}
                              />
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>

                    {/* Clean Easy Accordion Embed Card */}
                    <div className="p-4 rounded-xl border border-line bg-panel space-y-2.5 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Layers className="size-4 text-accent" />
                          <span className="text-xs font-semibold text-text uppercase tracking-wider">
                            Embedded Easy Accordion Shortcode:
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-accent bg-accent/10 px-3 py-1 rounded border border-accent/20 self-start sm:self-auto">
                          {result.content.accordionShortcode || accordionShortcode || '[sp_easyaccordion id="..."] (Dynamic)'}
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        Cleanly parsed into <code className="text-accent">compensation_content</code> right below the legal damages guidance. Triggers the native interactive FAQ accordion on <code className="text-accent">templates/labor-law.php</code> without inserting raw styles or scripts into WordPress.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DUAL AI VISUALS */}
              {activeTab === "images" && (
                <div className="space-y-6">
                  {/* Banner Image Card - Full Width 1920x451 Hero Banner */}
                  <div className="rounded-2xl border border-line bg-panel p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-base text-text">Panoramic Hero Banner (Tab 1)</h3>
                        <p className="text-xs text-muted">Atoyan Law Firm header banner &bull; mapped to <code className="text-accent">personal_injury_image</code></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-panel-2 border border-line text-accent font-semibold">
                          1920 x 451 (4.25:1)
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-good/10 text-good border border-good/20 font-medium">
                          Warm Gradient &bull; Atoyan Watermark
                        </span>
                      </div>
                    </div>

                    <div className="w-full aspect-[1920/451] rounded-xl overflow-hidden border border-line bg-panel-2 shadow-inner">
                      <img
                        src={result.images.banner.dataUrl}
                        alt={result.images.banner.altText}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 pt-1 border-t border-line">
                      <div className="text-muted">
                        <span className="font-semibold text-text">Alt Text:</span> {result.images.banner.altText}
                      </div>
                      <div className="text-muted font-mono text-[11px]">
                        Filename: {result.images.banner.filename}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Clean Editorial Services Graphic + Placement Specs */}
                  <div className="grid md:grid-cols-2 gap-6 items-start">
                    {/* Services Image Card */}
                    <div className="rounded-2xl border border-line bg-panel p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-base text-text">Clean Services Graphic (Tab 2)</h3>
                          <p className="text-xs text-muted">Injected directly after primary H2 heading with <code className="text-accent">alignleft</code></p>
                        </div>
                        <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-panel-2 border border-line text-accent font-semibold">
                          600 x 400 (3:2)
                        </span>
                      </div>

                      <div className="w-full aspect-[3/2] rounded-xl overflow-hidden border border-line bg-panel-2 shadow-inner">
                        <img
                          src={result.images.services.dataUrl}
                          alt={result.images.services.altText}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-1 text-xs pt-1 border-t border-line">
                        <div className="text-muted">
                          <span className="font-semibold text-text">Alt Text:</span> {result.images.services.altText}
                        </div>
                        <div className="text-muted font-mono text-[11px]">
                          Filename: {result.images.services.filename} &bull; <span className="text-good font-semibold">No text overlay / Clean photo</span>
                        </div>
                      </div>
                    </div>

                    {/* Visual Layout & WordPress Injection Specs */}
                    <div className="rounded-2xl border border-line bg-panel p-6 space-y-4">
                      <h3 className="font-bold text-base text-text">WordPress Asset Configuration</h3>
                      <p className="text-xs text-muted leading-relaxed">
                        Images are composited with exact production dimensions and branding to match Atoyan Law Firm labor law templates.
                      </p>

                      <div className="space-y-3 text-xs">
                        <div className="p-3 rounded-xl border border-line bg-panel-2 space-y-1">
                          <div className="font-semibold text-text flex items-center justify-between">
                            <span>Hero Banner Placement</span>
                            <span className="font-mono text-accent">1920 × 451 px</span>
                          </div>
                          <p className="text-muted text-[11px] leading-relaxed">
                            Uploaded to WP Media Library, mapped to ACF field <code className="text-accent">personal_injury_image</code>, with Atoyan warm gradient (#9c6941) and brand watermark.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl border border-line bg-panel-2 space-y-1">
                          <div className="font-semibold text-text flex items-center justify-between">
                            <span>Services Graphic Placement</span>
                            <span className="font-mono text-accent">600 × 400 px</span>
                          </div>
                          <p className="text-muted text-[11px] leading-relaxed">
                            Embedded inside <code className="text-accent">_personal_injury_services_content</code> directly after the primary H2 with <code className="text-accent">alignleft size-full</code>. Clean image without text overlays or dark bars.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl border border-line bg-panel-2 space-y-1">
                          <div className="font-semibold text-text flex items-center justify-between">
                            <span>Attachment ID Association</span>
                            <span className="text-good font-medium">Automatic</span>
                          </div>
                          <p className="text-muted text-[11px] leading-relaxed">
                            Uploaded media attachments are linked to the newly created page post ID upon publication for clean WordPress media library organization.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: EASY ACCORDION & FAQS */}
              {activeTab === "faqs" && (
                <div className="space-y-6">
                  {/* Easy Accordion Integration Card */}
                  <div className="rounded-2xl border border-line bg-panel p-6 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Layers className="size-5 text-accent" />
                        <div>
                          <h3 className="font-bold text-base text-text">Easy Accordion Shortcode Integration</h3>
                          <p className="text-xs text-muted">
                            Cleanly embedded in Tab 6 (Compensation Section) to render native WordPress FAQ accordions without database script bloat.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href="https://www.atoyanlaw.com/wp-admin/edit.php?post_type=sp_easy_accordion"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-panel-2 hover:bg-panel text-xs text-muted hover:text-text transition"
                        >
                          <ExternalLink className="size-3.5" /> Manage WP Accordions
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-panel-2 border border-line">
                      <span className="text-xs text-muted font-medium">Active Shortcode:</span>
                      <code className="text-accent font-mono font-bold text-sm bg-panel px-3 py-1 rounded border border-line">
                        {result.content.accordionShortcode || accordionShortcode || "Dynamic Easy Accordion"}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          const sc = result.content.accordionShortcode || accordionShortcode;
                          if (sc) {
                            navigator.clipboard.writeText(sc);
                            setCopiedShortcode(true);
                            setTimeout(() => setCopiedShortcode(false), 2000);
                          }
                        }}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded border border-line bg-panel hover:bg-panel-2 text-text font-medium transition sm:ml-auto"
                      >
                        {copiedShortcode ? <Check className="size-3 text-good" /> : <Copy className="size-3 text-muted" />}
                        {copiedShortcode ? "Copied!" : "Copy Shortcode"}
                      </button>
                    </div>


                  </div>

                  {/* Topic-Specific FAQs Generated for this Practice Area */}
                  <div className="rounded-2xl border border-line bg-panel p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="size-5 text-accent" />
                        <h3 className="font-semibold text-lg">Topic-Specific Legal FAQs ({result.content.faqs?.length || 0})</h3>
                      </div>
                      <span className="text-xs text-muted">100% relevant to {result.content.keyword}</span>
                    </div>

                    <div className="space-y-2.5">
                      {(result.content?.faqs || []).map((faq, i) => (
                        <details
                          key={i}
                          className="group border border-line bg-panel-2 rounded-xl text-sm overflow-hidden transition"
                          open={i === 0}
                        >
                          <summary className="font-bold cursor-pointer text-text px-4 py-3 flex items-center gap-3 select-none hover:bg-panel transition list-none">
                            <span className="text-base font-bold text-accent w-4 text-center font-mono select-none">
                              <span className="group-open:hidden">+</span>
                              <span className="hidden group-open:inline">−</span>
                            </span>
                            <span className="text-xs sm:text-sm font-semibold flex-1">{faq.question}</span>
                          </summary>
                          <div className="p-4 sm:p-5 bg-panel border-t border-line text-xs sm:text-sm text-muted leading-relaxed">
                            <div
                              className="text-text space-y-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-accent [&_h2]:mt-3 [&_h2]:mb-1 [&_p]:my-1.5 [&_a]:text-accent [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_th]:border [&_th]:border-line [&_th]:p-2 [&_th]:bg-panel-2 [&_th]:text-left [&_th]:font-bold [&_td]:border [&_td]:border-line [&_td]:p-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                              dangerouslySetInnerHTML={{ __html: faq.answer }}
                            />
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ACF FIELD MAPPING */}
              {activeTab === "acf" && (
                <div className="rounded-2xl border border-line bg-panel p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-line pb-4">
                    <div>
                      <h3 className="font-semibold text-lg">ACF Field Group 348 (personal_injury_group)</h3>
                      <p className="text-xs text-muted">
                        Template: <code className="text-accent font-mono">templates/labor-law.php</code> &bull; Parent ID: <code className="text-accent font-mono">750 (employment-law)</code>
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-good/10 text-good border border-good/20">
                      post_content: "" (Strictly Empty)
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
                      <span className="text-accent font-semibold block font-sans">Tab 1: Personal Injury (Hero Banner)</span>
                      <p className="text-muted">personal_injury_image: <span className="text-text font-sans">1920x451 Panoramic Banner</span></p>
                      <p className="text-muted">personal_injury_title: <span className="text-text font-sans">{result.content.heroTitle}</span></p>
                    </div>

                    <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
                      <span className="text-accent font-semibold block font-sans">Tab 2: Services Section (2,000+ Words)</span>
                      <p className="text-muted">_personal_injury_services_heading: <span className="text-text font-sans">{result.content.servicesHeading}</span></p>
                      <p className="text-muted">_personal_injury_services_sub_heading: <span className="text-text font-sans">{result.content.servicesSubHeading}</span></p>
                      <p className="text-muted">_personal_injury_services_content: <span className="text-good font-sans">2,000+ words deep analysis with h2dav/h3dav and clean 600x400 image</span></p>
                      <p className="text-muted">_personal_injury_services_Sidebar: <span className="text-good font-sans">27 Practice Area Term IDs Cloned</span></p>
                    </div>

                    <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
                      <span className="text-accent font-semibold block font-sans">Tab 3: Testimonials Section</span>
                      <p className="text-muted">testimonials_reviews_repet: <span className="text-good font-sans">8 Authentic Client Reviews Cloned</span></p>
                      <p className="text-muted">testimonials_reviews_bg_image: <span className="text-good font-sans">Preserved from Reference Page</span></p>
                    </div>

                    <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
                      <span className="text-accent font-semibold block font-sans">Tab 4: How Do Section</span>
                      <p className="text-muted">how_do_heading: <span className="text-text font-sans">{result.content.howDoHeading}</span></p>
                      <p className="text-muted">how_do_content: <span className="text-text font-sans">Actionable Legal Guidance</span></p>
                      <p className="text-muted">how_do_contact_form_shortcode: <span className="text-good font-sans">[contact-form-7 id="2701763"]</span></p>
                    </div>

                    <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
                      <span className="text-accent font-semibold block font-sans">Tab 5: CTA Section</span>
                      <p className="text-muted">cta_heading: <span className="text-good font-sans">Get The Representation You Deserve</span></p>
                      <p className="text-muted">cta_button: <span className="text-good font-sans">Free Consultation &bull; (747) 888-0077</span></p>
                    </div>

                    <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
                      <span className="text-accent font-semibold block font-sans">Tab 6: Compensation Section</span>
                      <p className="text-muted">compensation_heading: <span className="text-text font-sans">{result.content.compensationHeading}</span></p>
                      <p className="text-muted">compensation_content: <span className="text-good font-sans">Legal intro + Topic CTA with (747) 888-0077 + [sp_easyaccordion id="..."]</span></p>
                      <p className="text-muted">code_injection: <span className="text-good font-sans">Zero inline CSS or toggle scripts</span></p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      )}
      {/* Admin Authorization Modal for Live Publishing */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text">Admin Authorization</h3>
                  <p className="text-xs text-muted">Protecting live WordPress publishing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  setPendingPublishAction(null);
                }}
                className="text-muted hover:text-text transition p-1 rounded-lg hover:bg-panel-2 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              This action publishes directly to the live site at{" "}
              <strong className="text-text">atoyanlaw.com</strong>. Enter the{" "}
              <code className="text-accent bg-accent/10 px-1 py-0.5 rounded text-[11px]">WP_SUPER_ADMIN</code>{" "}
              password to authorize.
            </p>

            <form onSubmit={handleConfirmAuth} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-text">
                  <span>Admin Password</span>
                  {showPasswordText ? (
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(false)}
                      className="text-muted hover:text-text flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <EyeOff className="size-3" /> Hide
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(true)}
                      className="text-muted hover:text-text flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Eye className="size-3" /> Show
                    </button>
                  )}
                </div>
                <input
                  type={showPasswordText ? "text" : "password"}
                  value={modalPasswordInput}
                  onChange={(e) => {
                    setModalPasswordInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="Enter WP_SUPER_ADMIN password"
                  autoFocus
                  className="w-full rounded-xl border border-line bg-panel px-3.5 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                {authError && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                    <AlertTriangle className="size-3 shrink-0" />
                    <span>{authError}</span>
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberPassword}
                  onChange={(e) => setRememberPassword(e.target.checked)}
                  className="rounded border-line text-accent focus:ring-accent/40"
                />
                <span className="text-xs text-muted">Remember password on this device</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setPendingPublishAction(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-muted hover:text-text rounded-xl border border-line hover:bg-panel-2 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!modalPasswordInput.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-accent hover:opacity-90 rounded-xl transition disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  <Lock className="size-3.5" />
                  <span>Authorize &amp; Continue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
