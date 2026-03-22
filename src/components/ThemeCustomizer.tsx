import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, RotateCcw, BarChart3, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useThemePreferences,
  ACCENT_MAP,
  CHART_PALETTES,
  type AccentTheme,
  type ChartPalette,
  type CardStyle,
} from "@/hooks/useThemePreferences";

const ACCENT_OPTIONS: { key: AccentTheme; label: string }[] = [
  { key: "teal", label: "Teal" },
  { key: "ocean", label: "Ocean Blue" },
  { key: "purple", label: "Royal Purple" },
  { key: "rose", label: "Rose" },
  { key: "amber", label: "Amber Gold" },
  { key: "indigo", label: "Indigo" },
];

const CHART_OPTIONS: { key: ChartPalette; label: string }[] = [
  { key: "default", label: "Default" },
  { key: "warm", label: "Warm" },
  { key: "cool", label: "Cool" },
  { key: "highContrast", label: "High Contrast" },
];

const CARD_OPTIONS: { key: CardStyle; label: string }[] = [
  { key: "default", label: "Solid" },
  { key: "glass", label: "Glass" },
];

export function ThemeCustomizer() {
  const { preferences, setPreferences, resetToDefault } = useThemePreferences();

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Display Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Accent Color */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Accent Colour</p>
          <p className="text-xs text-muted-foreground">Changes primary buttons, links, and navigation highlights.</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {ACCENT_OPTIONS.map(({ key, label }) => {
              const hsl = ACCENT_MAP[key].primary;
              const selected = preferences.accent === key;
              return (
                <button
                  key={key}
                  onClick={() => setPreferences({ accent: key })}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                    selected
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <span
                    className="h-4 w-4 rounded-full shrink-0 ring-1 ring-border"
                    style={{ backgroundColor: `hsl(${hsl})` }}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart Palette */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" /> Chart Palette
          </p>
          <p className="text-xs text-muted-foreground">Applies to all dashboard graphs and report visualisations.</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {CHART_OPTIONS.map(({ key, label }) => {
              const colors = CHART_PALETTES[key];
              const selected = preferences.chartPalette === key;
              return (
                <button
                  key={key}
                  onClick={() => setPreferences({ chartPalette: key })}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                    selected
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <span className="flex gap-0.5">
                    {colors.map((c, i) => (
                      <span
                        key={i}
                        className="h-3.5 w-3.5 rounded-sm"
                        style={{ backgroundColor: `hsl(${c})` }}
                      />
                    ))}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Style */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Layers className="h-4 w-4" /> Card Style
          </p>
          <div className="flex gap-2 mt-2">
            {CARD_OPTIONS.map(({ key, label }) => {
              const selected = preferences.cardStyle === key;
              return (
                <button
                  key={key}
                  onClick={() => setPreferences({ cardStyle: key })}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                    selected
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview + Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              Live preview active
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={resetToDefault} className="text-xs gap-1.5">
            <RotateCcw className="h-3 w-3" /> Reset to Default
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
