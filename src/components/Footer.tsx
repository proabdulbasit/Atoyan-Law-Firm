"use client";

import { CheckCircle2, ShieldCheck, Scale, Image as ImageIcon, Layers, FileText } from "lucide-react";

const PIPELINE_PILLARS = [
  {
    icon: Scale,
    title: "California Legal Depth",
    body: "Practice pages for WP Post Project cite FEHA, CRD regulations, Labor Code §§ 98.6 & 1102.5, and the SB 497 rebuttable presumption.",
  },
  {
    icon: Layers,
    title: "Easy Accordion FAQs",
    body: "Each page includes a 10-question accordion, the shared directions block, and the shared testimonials block used on demo.wp-post.com.",
  },
  {
    icon: ImageIcon,
    title: "Header and Article Photos",
    body: "Builds a full-brightness 1000×583 header photo and an 850×567 article photo. The hero fades that photo with CSS opacity so the dark title stays readable.",
  },
  {
    icon: ShieldCheck,
    title: "WordPress & Yoast REST",
    body: "Publishes a top-level WoodMart page on demo.wp-post.com, sets the header photo, and writes the Yoast title and description.",
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-panel-2 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-14 space-y-12">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-start">
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-wider mb-3">
                <FileText className="size-3.5" /> Production Publishing Engine
              </div>
              <h3 className="text-xl font-bold tracking-tight text-text">
                WP Post Project • Practice Area Automation
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed max-w-xl">
                Publishing platform for WP Post Project at demo.wp-post.com. It writes California employment pages, generates the header and article photos, and publishes them through the WordPress REST API.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 pt-2">
              {PIPELINE_PILLARS.map((item) => (
                <div key={item.title} className="flex gap-3.5">
                  <div className="mt-0.5 size-8 shrink-0 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <item.icon className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text">{item.title}</h4>
                    <p className="mt-1 text-xs text-muted leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-6 space-y-5 shadow-sm">
            <h4 className="font-semibold text-sm text-text flex items-center gap-2">
              <ShieldCheck className="size-4 text-good" /> Verified Target Architecture
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-panel-2 border border-line">
                <span className="text-muted">Target Domain:</span>
                <span className="font-semibold text-text font-mono">demo.wp-post.com</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-panel-2 border border-line">
                <span className="text-muted">Parent Post:</span>
                <span className="font-semibold text-text font-mono">Top level</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-panel-2 border border-line">
                <span className="text-muted">Page Template:</span>
                <span className="font-semibold text-text font-mono">WoodMart default</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-panel-2 border border-line">
                <span className="text-muted">Page Builder:</span>
                <span className="font-semibold text-text font-mono">Easy Accordion + Yoast</span>
              </div>
            </div>

            <div className="pt-3 border-t border-line text-xs text-muted space-y-1.5">
              <div className="flex items-center gap-2 text-good font-medium">
                <CheckCircle2 className="size-3.5" /> Ready for Immediate Client Publishing
              </div>
              <p className="text-[11px] text-muted">
                Generates complete pages that follow the live demo.wp-post.com layout.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-line flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted">
          <div>
            &copy; {new Date().getFullYear()} <strong>WP Post Project</strong>. All rights reserved.
          </div>
          <div className="flex items-center gap-4 font-medium">
            <span className="flex items-center gap-1.5 text-good">
              <span className="size-2 rounded-full bg-good animate-pulse" /> Production Ready
            </span>
            <span>•</span>
            <span>WordPress REST API</span>
            <span>•</span>
            <span>demo.wp-post.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
