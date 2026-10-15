"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Lock,
  Newspaper,
  Send,
  Sparkles,
  Unlock,
} from "lucide-react";
import { useSettings } from "@/lib/useSettings";
import { cn } from "@/lib/utils";
import type { BlogGeneratedImage, BlogPostContent } from "@/lib/blog-poster";

export default function BlogPosterPage() {
  const { settings, ready } = useSettings();
  const [topic, setTopic] = useState("California Pregnancy Discrimination Rights for Workers");
  const [categoriesText, setCategoriesText] = useState("Employment Law, Pregnancy Discrimination");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<BlogPostContent | null>(null);
  const [image, setImage] = useState<BlogGeneratedImage | null>(null);
  const [provider, setProvider] = useState("");
  const [publishUrl, setPublishUrl] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [isProtected, setIsProtected] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wp_super_admin_pass");
      if (saved) setAdminPassword(saved);
    } catch {}
    fetch("/api/blog/publish")
      .then((res) => res.json())
      .then((data) => setIsProtected(Boolean(data.protected)))
      .catch(() => setIsProtected(false));
  }, []);

  if (!ready) return null;

  const categories = categoriesText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setPublishUrl(null);
    setEditUrl(null);
    try {
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, categories, settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Generation failed");
      setContent(data.content);
      setImage(data.image);
      setProvider(data.provider || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!content) {
      setError("Generate the blog post first.");
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (adminPassword) headers["x-admin-password"] = adminPassword;
      const publishImage = image
        ? {
            filename: image.filename,
            altText: image.altText,
            base64: image.base64,
            mimeType: image.mimeType,
            width: image.width,
            height: image.height,
          }
        : undefined;
      const body = JSON.stringify({
        content,
        image: publishImage,
        settings,
        admin_password: adminPassword || undefined,
      });

      const postOnce = async () => {
        const res = await fetch("/api/blog/publish", { method: "POST", headers, body });
        const data = await res.json();
        return { res, data };
      };

      let { res, data } = await postOnce();
      // WordPress sometimes OOMs on the first create; one automatic retry matches the manual "click again" fix.
      if (!res.ok) {
        const msg = String(data.message || data.error || "");
        const transient =
          res.status >= 500 ||
          /allowed me|memory size|critical error|create failed/i.test(msg);
        if (transient) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          ({ res, data } = await postOnce());
        }
      }
      if (!res.ok) throw new Error(data.message || data.error || "Publish failed");
      setPublishUrl(data.postUrl || null);
      setEditUrl(data.editUrl || null);
      if (adminPassword) {
        try {
          localStorage.setItem("wp_super_admin_pass", adminPassword);
        } catch {}
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent mb-3">
            <ArrowLeft className="size-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
            <Newspaper className="size-6 text-accent" /> Blog Poster
          </h1>
          <p className="text-muted mt-1 text-sm">
            Create a WordPress blog post with title, meta title, meta description, content, featured image, and categories.
          </p>
        </div>
        <Link
          href="/settings"
          className="text-xs text-muted hover:text-accent border border-line rounded-lg px-3 py-2 bg-panel-2"
        >
          Settings
        </Link>
      </div>

      <section className="rounded-2xl border border-line bg-panel-2 p-6 space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-text">Blog topic / title</span>
          <input
            className="w-full rounded-xl border border-line bg-panel px-3.5 py-2.5 text-sm text-text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="California Pregnancy Discrimination Rights for Workers"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-text">Categories</span>
          <input
            className="w-full rounded-xl border border-line bg-panel px-3.5 py-2.5 text-sm text-text"
            value={categoriesText}
            onChange={(e) => setCategoriesText(e.target.value)}
            placeholder="Employment Law, Pregnancy Discrimination"
          />
          <span className="text-xs text-muted">Comma-separated. Missing categories are created on WordPress.</span>
        </label>

        {isProtected && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-text inline-flex items-center gap-1.5">
              {adminPassword ? <Unlock className="size-3.5 text-good" /> : <Lock className="size-3.5" />}
              Super admin password
            </span>
            <input
              type="password"
              className="w-full rounded-xl border border-line bg-panel px-3.5 py-2.5 text-sm text-text"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Required to publish"
            />
          </label>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || publishing}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl bg-accent text-white px-5 py-2.5 text-sm font-medium",
              (loading || publishing) && "opacity-70",
            )}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generate Preview
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!content || loading || publishing}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-5 py-2.5 text-sm font-medium text-text",
              (!content || loading || publishing) && "opacity-50",
            )}
          >
            {publishing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Publish Blog Post
          </button>
        </div>

        {error && (
          <p className="text-sm text-bad border border-bad/30 rounded-xl px-3 py-2 bg-bad/5">{error}</p>
        )}
        {publishUrl && (
          <div className="rounded-xl border border-good/30 bg-good/5 px-4 py-3 text-sm text-text space-y-1">
            <p className="inline-flex items-center gap-1.5 font-medium text-good">
              <CheckCircle2 className="size-4" /> Blog post published
            </p>
            <a href={publishUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-accent">
              {publishUrl} <ExternalLink className="size-3.5" />
            </a>
            {editUrl && (
              <a href={editUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-muted">
                Edit in WordPress <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        )}
      </section>

      {content && (
        <section className="rounded-2xl border border-line bg-panel-2 p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-text">Preview</h2>
            {provider && <span className="text-xs text-muted">Provider: {provider}</span>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted text-xs mb-1">Title</p>
              <p className="text-text font-medium">{content.title}</p>
            </div>
            <div>
              <p className="text-muted text-xs mb-1">Meta title</p>
              <p className="text-text">{content.metaTitle}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-muted text-xs mb-1">Meta description</p>
              <p className="text-text">{content.metaDescription}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-muted text-xs mb-1">Categories</p>
              <p className="text-text">{content.categories.join(", ")}</p>
            </div>
          </div>

          {image?.dataUrl && (
            <div>
              <p className="text-muted text-xs mb-2 inline-flex items-center gap-1.5">
                <ImageIcon className="size-3.5" /> Featured image
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.dataUrl}
                alt={image.altText || content.title}
                className="rounded-xl border border-line max-h-64 object-cover"
              />
            </div>
          )}

          <div>
            <p className="text-muted text-xs mb-2">Content</p>
            <div
              className="prose prose-sm dark:prose-invert max-w-none rounded-xl border border-line bg-panel p-4 text-text"
              dangerouslySetInnerHTML={{ __html: content.contentHtml }}
            />
          </div>
        </section>
      )}
    </div>
  );
}
