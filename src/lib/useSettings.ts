"use client";

import { useEffect, useState } from "react";
import { Settings } from "./types";

const STORAGE_KEY = "atoyan_autopilot_settings_v3";
const LEGACY_STORAGE_KEYS = ["wp_autopilot_settings", "atoyan_autopilot_settings_v1", "atoyan_autopilot_settings_v2"];

export function defaultSettings(): Settings {
  return Settings.parse({});
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings();
  try {
    // Purge any old legacy keys that may contain stale demo prompts
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      window.localStorage.removeItem(legacyKey);
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings();

    const parsed = Settings.parse(JSON.parse(raw));

    if (!parsed.demo_1k_applied) {
      parsed.article_word_count = 1000;
      parsed.article_title_rule = "A strong SEO title built around the primary keyword, written for WoodMart Law.";
      parsed.article_intro_rule = "A short transition introduction immediately after the title. Two or three sentences that say what the page is about.";
      parsed.article_heading_rule = "Bold, question-based headings such as How Can a Los Angeles Retaliation Lawyer Help You? Use the page's own city and topic. Choose questions around actual search intent.";
      parsed.article_writing_rule = "Short sentences and straightforward paragraphs. Active voice. Natural, human legal writing rather than generic SEO language.";
      parsed.article_banned_rule = "No em dashes. No canned AI-style headings, excessive bullet lists, repetitive conclusions, or artificial keyword stuffing. Original wording. Do not copy source language.";
      parsed.article_research_rule = "Research the current California law and competing pages behind the scenes. Do not name, quote, or link to competing law firms.";
      parsed.article_reader_rule = "Answer whether the firing or punishment was illegal, how much money may be owed, what evidence matters, what the employer might argue, how long the worker has to act, and what a lawyer can do.";
      parsed.article_competitor_rule = "No competitor law-firm links or promotional references.";
      parsed.article_authority_rule = "Prioritize California statutes, California courts, the California Civil Rights Department, the Labor Commissioner, DLSE, federal agencies, and reliable government statistics.";
      parsed.max_internal_links = 2;
      parsed.links_only = true;
      parsed.keyword_links = [
        { keyword: "wrongful termination", url: "https://demo.wp-post.com/california-wrongful-termination-lawyer/" },
        { keyword: "free consultation", url: "https://demo.wp-post.com/contact-us/" },
      ];
      parsed.demo_1k_applied = true;
      saveSettings(parsed);
    }

    const prompt = parsed.system_prompt || "";
    const previousProjectPrompt =
      prompt.includes("Atoyan") ||
      prompt.includes("atoyanlaw.com") ||
      prompt.includes("888) 807-0077") ||
      prompt.includes("WP Post Project") ||
      prompt.startsWith("You write California employment law practice pages for this website.");
    if (previousProjectPrompt) {
      parsed.system_prompt = defaultSettings().system_prompt;
      saveSettings(parsed);
    }

    return parsed;
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore localStorage quota errors
  }
}

function validationMessage(field: unknown, fallback: string): string {
  if (field === "article_word_count") return "Article length must be from 300 to 6,000 words.";
  if (field === "beside_image_words") return "Words beside the photo must be from 40 to 400.";
  if (field === "max_internal_links") return "Maximum links must be from 0 to 20.";
  return fallback;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setReady(true);
  }, []);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...patch };
      const result = Settings.safeParse(merged);
      if (!result.success) return merged;
      saveSettings(result.data);
      return result.data;
    });
  };

  const save = (): string | null => {
    const result = Settings.safeParse(settings);
    if (!result.success) {
      const issue = result.error.issues[0];
      return validationMessage(issue?.path[0], issue?.message || "Check the settings and try again.");
    }
    setSettings(result.data);
    saveSettings(result.data);
    return null;
  };

  return { settings, update, ready, save };
}
