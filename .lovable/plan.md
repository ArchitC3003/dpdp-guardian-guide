

## Plan: Test Upload Verification + User Theme Customization Panel

### Part 1: Upload Panel Verification

The upload panel (`AdminUploadPanel.tsx`) already includes all required fields (tags, framework, author, file_size, mime_type). The DB schema confirms `artefact_files` has these columns. No code changes needed for upload — this is a manual testing step.

### Part 2: User Theme Customization Panel

Create a "Display Preferences" panel that lets each user customize accent colors and chart palettes, persisted in `localStorage` and applied via CSS custom property overrides.

---

### Implementation

**A. New Component: `src/components/ThemeCustomizer.tsx`**

A collapsible card (accessible from Account Settings) with:
- **Accent Color Picker**: 6 preset palettes (Teal/default, Blue, Purple, Rose, Amber, Indigo) — each sets `--primary`, `--ring`, `--chart-1` through `--chart-5`, and gradient utilities
- **Chart Color Scheme**: 4 preset chart palettes (Default, Warm, Cool, High Contrast) — overrides `--chart-1` through `--chart-5`
- **Card Style**: Toggle between default and "glass" card variant
- Live preview swatch showing the selected colors
- "Reset to Default" button

State is stored in `localStorage` under `privcybhub-theme-prefs`. On app mount, a `useThemePreferences` hook reads prefs and applies CSS variable overrides to `document.documentElement.style`.

**B. New Hook: `src/hooks/useThemePreferences.ts`**

- Reads/writes `localStorage` key `privcybhub-theme-prefs`
- Exports `{ preferences, setPreferences, resetToDefault }`
- On mount + on change, applies CSS custom property overrides to `:root`
- Predefined palette maps for each accent choice

**C. Modify: `src/pages/AccountSettings.tsx`**

- Import and render `ThemeCustomizer` as a new Card section titled "Display Preferences" between the Profile and AI Configuration cards

**D. Modify: `src/components/AppLayout.tsx`**

- Import `useThemePreferences` hook at layout level so theme overrides are always applied on app load (single call, no UI)

---

### Palette Presets

| Name | Primary HSL | Chart 1-5 |
|---|---|---|
| Teal (default) | 158 64% 51% | current defaults |
| Ocean Blue | 210 90% 50% | blue-gradient series |
| Royal Purple | 270 70% 55% | purple-gradient series |
| Rose | 350 80% 55% | pink/rose-gradient series |
| Amber Gold | 38 92% 50% | warm-gradient series |
| Indigo | 240 75% 57% | indigo-gradient series |

### File Summary

| File | Action |
|---|---|
| `src/components/ThemeCustomizer.tsx` | Create |
| `src/hooks/useThemePreferences.ts` | Create |
| `src/pages/AccountSettings.tsx` | Edit: add ThemeCustomizer card |
| `src/components/AppLayout.tsx` | Edit: mount useThemePreferences hook |

### Safety
- No DB changes — purely client-side localStorage
- No modification to existing color tokens in `index.css` — overrides applied via JS
- All existing pages automatically pick up changes since they use CSS variables
- Reset button restores original theme

