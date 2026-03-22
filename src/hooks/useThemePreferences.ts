import { useState, useEffect, useCallback } from "react";

export type AccentTheme = "teal" | "ocean" | "purple" | "rose" | "amber" | "indigo";
export type ChartPalette = "default" | "warm" | "cool" | "highContrast";
export type CardStyle = "default" | "glass";

export interface ThemePreferences {
  accent: AccentTheme;
  chartPalette: ChartPalette;
  cardStyle: CardStyle;
}

const STORAGE_KEY = "privcybhub-theme-prefs";

const DEFAULT_PREFS: ThemePreferences = {
  accent: "teal",
  chartPalette: "default",
  cardStyle: "default",
};

interface AccentConfig {
  primary: string;
  primaryForeground: string;
  ring: string;
  accentBg: string;
  accentFg: string;
}

const ACCENT_MAP: Record<AccentTheme, AccentConfig> = {
  teal: {
    primary: "158 64% 51%",
    primaryForeground: "165 91% 9%",
    ring: "158 64% 51%",
    accentBg: "178 84% 10%",
    accentFg: "172 66% 50%",
  },
  ocean: {
    primary: "210 90% 50%",
    primaryForeground: "210 100% 97%",
    ring: "210 90% 50%",
    accentBg: "210 80% 10%",
    accentFg: "210 80% 60%",
  },
  purple: {
    primary: "270 70% 55%",
    primaryForeground: "270 100% 97%",
    ring: "270 70% 55%",
    accentBg: "270 60% 10%",
    accentFg: "270 60% 65%",
  },
  rose: {
    primary: "350 80% 55%",
    primaryForeground: "350 100% 97%",
    ring: "350 80% 55%",
    accentBg: "350 70% 10%",
    accentFg: "350 70% 65%",
  },
  amber: {
    primary: "38 92% 50%",
    primaryForeground: "38 100% 7%",
    ring: "38 92% 50%",
    accentBg: "38 80% 10%",
    accentFg: "38 80% 60%",
  },
  indigo: {
    primary: "240 75% 57%",
    primaryForeground: "240 100% 97%",
    ring: "240 75% 57%",
    accentBg: "240 65% 10%",
    accentFg: "240 65% 65%",
  },
};

const CHART_PALETTES: Record<ChartPalette, string[]> = {
  default: ["156 71% 66%", "141 76% 73%", "170 76% 64%", "81 84% 67%", "0 0% 45%"],
  warm: ["12 90% 60%", "38 92% 55%", "55 85% 50%", "350 80% 55%", "25 75% 45%"],
  cool: ["210 90% 55%", "190 80% 50%", "240 75% 60%", "170 70% 50%", "220 60% 45%"],
  highContrast: ["158 90% 40%", "0 85% 55%", "210 95% 50%", "45 100% 50%", "270 80% 55%"],
};

function applyTheme(prefs: ThemePreferences) {
  const root = document.documentElement;
  const accent = ACCENT_MAP[prefs.accent];
  const charts = CHART_PALETTES[prefs.chartPalette];

  root.style.setProperty("--primary", accent.primary);
  root.style.setProperty("--primary-foreground", accent.primaryForeground);
  root.style.setProperty("--ring", accent.ring);
  root.style.setProperty("--accent", accent.accentBg);
  root.style.setProperty("--accent-foreground", accent.accentFg);
  root.style.setProperty("--sidebar-primary", accent.primary);
  root.style.setProperty("--sidebar-primary-foreground", accent.primaryForeground);
  root.style.setProperty("--sidebar-ring", accent.ring);

  charts.forEach((c, i) => {
    root.style.setProperty(`--chart-${i + 1}`, c);
  });

  if (prefs.cardStyle === "glass") {
    root.style.setProperty("--card", "0 0% 14% / 0.6");
    root.style.setProperty("--card-backdrop", "blur(12px)");
  } else {
    root.style.removeProperty("--card-backdrop");
    // restore dark default
    root.style.setProperty("--card", "0 0% 14%");
  }
}

function clearTheme() {
  const root = document.documentElement;
  const props = [
    "--primary", "--primary-foreground", "--ring",
    "--accent", "--accent-foreground",
    "--sidebar-primary", "--sidebar-primary-foreground", "--sidebar-ring",
    "--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5",
    "--card", "--card-backdrop",
  ];
  props.forEach((p) => root.style.removeProperty(p));
}

export function useThemePreferences() {
  const [preferences, setPreferencesState] = useState<ThemePreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  useEffect(() => {
    if (
      preferences.accent === DEFAULT_PREFS.accent &&
      preferences.chartPalette === DEFAULT_PREFS.chartPalette &&
      preferences.cardStyle === DEFAULT_PREFS.cardStyle
    ) {
      clearTheme();
    } else {
      applyTheme(preferences);
    }
  }, [preferences]);

  const setPreferences = useCallback((update: Partial<ThemePreferences>) => {
    setPreferencesState((prev) => {
      const next = { ...prev, ...update };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetToDefault = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    clearTheme();
    setPreferencesState(DEFAULT_PREFS);
  }, []);

  return { preferences, setPreferences, resetToDefault };
}

export { ACCENT_MAP, CHART_PALETTES };
