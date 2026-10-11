"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  KeyRound,
  Globe,
  Layers,
  ShieldCheck,
  FileCode,
  Building2,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Database,
  Lock,
  Unlock,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useSettings } from "@/lib/useSettings";
import { cn } from "@/lib/utils";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-text">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-line bg-panel px-3.5 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40";

export default function SettingsPage() {
  const { settings, update, ready } = useSettings();
  const [savedFlash, setSavedFlash] = useState(false);

  // Admin password state
  const [adminPassword, setAdminPassword] = useState("");
  const [isSuperAdminProtected, setIsSuperAdminProtected] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminFlashSaved, setAdminFlashSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wp_super_admin_pass");
      if (saved) {
        setAdminPassword(saved);
        setAdminPassInput(saved);
      }
    } catch {}

    fetch("/api/publish")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.protected === "boolean") {
          setIsSuperAdminProtected(data.protected);
        }
      })
      .catch(() => null);
  }, []);

  const saveAdminPassword = () => {
    const clean = adminPassInput.trim();
    setAdminPassword(clean);
    try {
      if (clean) {
        localStorage.setItem("wp_super_admin_pass", clean);
      } else {
        localStorage.removeItem("wp_super_admin_pass");
      }
    } catch {}
    setAdminFlashSaved(true);
    setTimeout(() => setAdminFlashSaved(false), 1500);
  };

  const clearAdminPassword = () => {
    setAdminPassword("");
    setAdminPassInput("");
    try {
      localStorage.removeItem("wp_super_admin_pass");
    } catch {}
    setAdminFlashSaved(true);
    setTimeout(() => setAdminFlashSaved(false), 1500);
  };

  if (!ready) return null;

  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const resetToAtoyanDefaults = () => {
    update({
      llm_provider: "openai",
      wp_site_url: "https://www.atoyanlaw.com",
      wp_username: "",
      wp_app_password: "",
      heading_class: "h2dav",
      cta_shortcode: "[sp_easyaccordion id=\"3932\"]",
      system_prompt:
        "You are the senior legal content strategist and California employment attorney for Atoyan Law Firm (atoyanlaw.com). Write authoritative, localized practice area articles citing FEHA, California Labor Code §§ 98.6/1102.5, SB 497, and Yanowitz v. L'Oreal.",
    });
    flashSaved();
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition"
        >
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">Pipeline Settings</h1>
            <p className="text-muted mt-1 text-sm">
              Configure credentials and AI engine settings. Pre-configured for <strong>Atoyan Law Firm</strong>.
            </p>
          </div>
          <button
            onClick={resetToAtoyanDefaults}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent border border-line rounded-lg px-3 py-2 bg-panel-2 transition self-start"
            title="Reset to verified Atoyan Law Firm defaults"
          >
            <RotateCcw className="size-3.5" /> Reset Defaults
          </button>
        </div>
      </div>

      {/* WordPress Connection */}
      <section className="rounded-2xl border border-line bg-panel-2 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2 text-text">
            <Globe className="size-4 text-accent" /> WordPress REST API Credentials
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-good/10 text-good border border-good/20 inline-flex items-center gap-1 font-medium">
            <CheckCircle2 className="size-3" /> Ready
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="WordPress Site URL" hint="Target domain with https://">
            <input
              className={inputCls}
              placeholder="https://www.atoyanlaw.com"
              value={settings.wp_site_url ?? ""}
              onChange={(e) => update({ wp_site_url: e.target.value })}
            />
          </Field>
          <Field label="WordPress Username" hint="Admin username or env default">
            <input
              className={inputCls}
              placeholder="Server env or username"
              value={settings.wp_username ?? ""}
              onChange={(e) => update({ wp_username: e.target.value })}
            />
          </Field>
          <Field
            label="Application Password"
            hint="WordPress application password"
          >
            <input
              type="password"
              className={inputCls}
              placeholder={settings.wp_app_password ? "••••••••••••" : "Configured via env or enter here"}
              value={settings.wp_app_password ?? ""}
              onChange={(e) => update({ wp_app_password: e.target.value })}
            />
          </Field>
        </div>

        <div className="rounded-xl bg-panel border border-line p-4 text-xs space-y-2 text-muted">
          <div className="flex items-center gap-2 text-text font-medium">
            <Building2 className="size-4 text-accent" />
            <span>Target WordPress Page Architecture</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-2 pt-1 font-mono">
            <div>Parent Page: <strong className="text-text font-sans">#750 (Employment Law)</strong></div>
            <div>Page Template: <strong className="text-text font-sans">templates/labor-law.php</strong></div>
            <div>REST Endpoint: <strong className="text-text font-sans">/wp-json/wp/v2/pages</strong></div>
          </div>
        </div>
      </section>

      {/* Live Site Publishing Protection (WP_SUPER_ADMIN) */}
      <section className="rounded-2xl border border-line bg-panel-2 p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold flex items-center gap-2 text-text">
            <Lock className="size-4 text-accent" /> Live Site Publishing Protection (WP_SUPER_ADMIN)
          </h2>
          {isSuperAdminProtected ? (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 inline-flex items-center gap-1 font-medium">
              <ShieldCheck className="size-3" /> Server Protection Enforced
            </span>
          ) : (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-panel text-muted border border-line inline-flex items-center gap-1 font-medium">
              WP_SUPER_ADMIN Unset (Development Mode)
            </span>
          )}
        </div>

        <p className="text-xs text-muted leading-relaxed">
          Protects the <strong>1-Click Publish Now</strong> and <strong>Publish Previewed Page</strong> buttons from accidentally publishing unverified articles to the live WordPress site (<strong>atoyanlaw.com</strong>).
          When configured on Vercel environment variables as <code className="text-accent bg-accent/10 px-1 py-0.5 rounded font-mono text-[11px]">WP_SUPER_ADMIN</code>, all publish API calls require this password.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 items-end">
          <Field
            label="Super Admin Password (Saved in Browser)"
            hint="Stored securely in your local browser storage and attached to publish requests"
          >
            <div className="relative">
              <input
                type={showAdminPass ? "text" : "password"}
                className={cn(inputCls, "pr-20")}
                placeholder="Enter WP_SUPER_ADMIN password"
                value={adminPassInput}
                onChange={(e) => setAdminPassInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowAdminPass(!showAdminPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-text cursor-pointer"
              >
                {showAdminPass ? "Hide" : "Show"}
              </button>
            </div>
          </Field>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={saveAdminPassword}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-accent hover:opacity-90 rounded-xl transition cursor-pointer"
            >
              <Save className="size-3.5" />
              <span>{adminFlashSaved ? "Saved!" : "Save Password"}</span>
            </button>
            {adminPassword && (
              <button
                type="button"
                onClick={clearAdminPassword}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-muted hover:text-bad border border-line hover:bg-panel rounded-xl transition cursor-pointer"
                title="Clear saved admin password"
              >
                <Trash2 className="size-3.5" />
                <span>Clear / Lock</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* AI Provider Configuration */}
      <section className="rounded-2xl border border-line bg-panel-2 p-6 space-y-5">
        <h2 className="font-semibold flex items-center gap-2 text-text">
          <KeyRound className="size-4 text-accent" /> AI Generation Engines (OpenAI &amp; Gemini)
        </h2>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Content LLM Provider" hint="Primary engine for practice area text">
            <select
              className={inputCls}
              value={settings.llm_provider}
              onChange={(e) =>
                update({ llm_provider: e.target.value as typeof settings.llm_provider })
              }
            >
              <option value="openai">OpenAI (gpt-4o / gpt-4o-mini)</option>
              <option value="gemini">Google Gemini (gemini-2.5-flash)</option>
              <option value="simulator">Offline Legal Simulator (Zero-cost)</option>
            </select>
          </Field>
          <Field label="OpenAI API Key" hint="For statutory legal text & DALL-E 3">
            <input
              className={inputCls}
              type="password"
              placeholder="sk-proj-..."
              value={settings.openai_api_key ?? ""}
              onChange={(e) => update({ openai_api_key: e.target.value })}
            />
          </Field>
          <Field label="Google Gemini API Key" hint="For Gemini & Imagen 3 visual pairs">
            <input
              className={inputCls}
              type="password"
              placeholder="AIzaSy..."
              value={settings.gemini_api_key ?? ""}
              onChange={(e) => update({ gemini_api_key: e.target.value })}
            />
          </Field>
        </div>

        {/* Collapsible Advanced Prompt Section */}
        <details className="group rounded-xl border border-line bg-panel p-4 text-xs">
          <summary className="font-semibold cursor-pointer text-text hover:text-accent transition flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sliders className="size-3.5 text-accent" /> Advanced Legal Guardrails &amp; System Prompt (Optional)
            </span>
            <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-4 space-y-2 pt-3 border-t border-line/60">
            <p className="text-muted text-xs">
              Replicates Atoyan Law Firm's exact tone: punchy 1-3 sentence paragraphs, FEHA citations, and question subheadings.
            </p>
            <textarea
              className={cn(inputCls, "min-h-32 text-xs leading-relaxed font-mono")}
              value={settings.system_prompt}
              onChange={(e) => update({ system_prompt: e.target.value })}
            />
          </div>
        </details>
      </section>

      {/* ACF Field Group 348 Architecture Reference */}
      <section className="rounded-2xl border border-line bg-panel-2 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2 text-text">
            <Layers className="size-4 text-accent" /> Secure Custom Fields (SCF / ACF Field Group 348)
          </h2>
          <span className="text-xs text-muted font-mono">personal_injury_group</span>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          The pipeline maps all 27 subfields across 6 tabs automatically. Global assets (8 verified client reviews, 27 practice area sidebar cross-links, CTA background, and Contact Form 7 shortcode) are cloned from live Page 3933 to maintain 100% theme consistency.
        </p>

        <div className="pt-2">
          <a
            href="/docs/acf-field-group-348-personal-injury.json"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium"
          >
            <FileCode className="size-3.5" /> View ACF Field Group 348 Schema Export
          </a>
        </div>
      </section>

      {/* Supabase Analytics Database */}
      <section className="rounded-2xl border border-line bg-panel-2 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2 text-text">
            <Database className="size-4 text-accent" /> Supabase Real-Time Reporting Database
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-medium">
            PostgreSQL Logs
          </span>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          Stores executive generation metrics, word counts, token estimation, and exact $0.043/page cost breakdowns in real-time. Can be configured here or via <code className="font-mono text-text">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="font-mono text-text">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code className="font-mono text-text">.env.local</code>.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Supabase Project URL" hint="https://[project-id].supabase.co">
            <input
              className={inputCls}
              placeholder="https://xyzcompany.supabase.co"
              value={settings.supabase_url ?? ""}
              onChange={(e) => update({ supabase_url: e.target.value })}
            />
          </Field>
          <Field label="Supabase Anon Key" hint="Public anonymous API key (or env default)">
            <input
              type="password"
              className={inputCls}
              placeholder={settings.supabase_anon_key ? "••••••••••••" : "eyJhbGciOi..."}
              value={settings.supabase_anon_key ?? ""}
              onChange={(e) => update({ supabase_anon_key: e.target.value })}
            />
          </Field>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={flashSaved}
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-6 py-3 text-sm font-medium hover:opacity-90 transition shadow-sm"
        >
          <Save className="size-4" /> {savedFlash ? "Saved!" : "Save Settings"}
        </button>
        <span className="text-xs text-muted">Changes are saved in your browser session and active immediately.</span>
      </div>
    </div>
  );
}
