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

    // Ensure prompt strictly belongs to Atoyan Law Firm and has no legacy text
    if (parsed.system_prompt?.includes("David") || !parsed.system_prompt?.includes("Atoyan")) {
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

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setReady(true);
  }, []);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = Settings.parse({ ...prev, ...patch });
      saveSettings(next);
      return next;
    });
  };

  return { settings, update, ready };
}
