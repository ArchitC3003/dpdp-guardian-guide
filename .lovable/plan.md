

## Plan: SaaS-Inspired Artefact Repository Redesign

### Overview
A major UI overhaul of the Artefact Repository page plus supporting DB schema changes. The current flat folder-based view becomes a modern document management experience with faceted search, grid/list toggle, pinned/recent sections, tagging, and collaboration features. No changes to KM integration, consent module, or other existing pages.

---

### 1. Database Schema Changes

**Alter `artefact_files` table** — add columns for tagging, versioning, collaboration:

```sql
ALTER TABLE artefact_files
  ADD COLUMN tags text[] DEFAULT '{}',
  ADD COLUMN framework text DEFAULT NULL,
  ADD COLUMN author text DEFAULT NULL,
  ADD COLUMN file_size bigint DEFAULT NULL,
  ADD COLUMN mime_type text DEFAULT NULL,
  ADD COLUMN version_number integer DEFAULT 1,
  ADD COLUMN parent_id uuid DEFAULT NULL REFERENCES artefact_files(id),
  ADD COLUMN is_current_version boolean DEFAULT true,
  ADD COLUMN collection text DEFAULT NULL;
```

**Create `artefact_pins` table** — user-specific pins and recents:

```sql
CREATE TABLE artefact_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  artefact_id uuid NOT NULL REFERENCES artefact_files(id) ON DELETE CASCADE,
  pin_type text NOT NULL DEFAULT 'pin', -- 'pin' or 'recent'
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, artefact_id, pin_type)
);
ALTER TABLE artefact_pins ENABLE ROW LEVEL SECURITY;
-- Users can manage own pins
CREATE POLICY "Users manage own pins" ON artefact_pins FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

**Create `artefact_comments` table** — collaboration comments:

```sql
CREATE TABLE artefact_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artefact_id uuid NOT NULL REFERENCES artefact_files(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE artefact_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view comments" ON artefact_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own comments" ON artefact_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON artefact_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage comments" ON artefact_comments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
```

---

### 2. Refactor ArtefactRepository Page

**File: `src/pages/ArtefactRepository.tsx`** — complete rewrite

The page becomes a 3-zone layout:

**Zone A — Top Bar**:
- Search input with debounced full-text search across file_name, description, tags
- Filter chips: Type (folder), Framework, Author, Date range
- Grid/List view toggle (two icon buttons)
- Sort dropdown (Name, Date, Size)

**Zone B — Personalized Dashboard Strip** (horizontal cards, collapsible):
- **Pinned** section: user's pinned artefacts (from `artefact_pins` where pin_type='pin')
- **Recent** section: last 5 accessed (from `artefact_pins` where pin_type='recent', ordered by created_at)
- **Recommended** section: artefacts matching user's profile industry (from `profiles.organisation` cross-referenced with artefact tags)

**Zone C — Main Content Area**:
- **Grid view**: Cards with file type icon/thumbnail, title, folder badge, framework badge, tags, date, pin/download actions
- **List view**: Compact table rows (existing style enhanced with tags/framework columns)
- **Collection sidebar** (left): hierarchical tree of folders + user-created collections for navigation; clicking filters the main view
- Pagination or infinite scroll for large volumes

**Preserved elements**:
- Stats cards row (Total + per-folder counts) — kept but restyled as compact pills
- Admin Upload Panel — kept as-is, moved into a collapsible section
- KM Admin Panel — kept as-is for admins
- Privacy notice banner — kept

---

### 3. Grid Card Component

**New file: `src/components/artefacts/ArtefactCard.tsx`**

Each card shows:
- File type icon (PDF, DOCX, image, etc.) derived from mime_type/extension — large icon or thumbnail placeholder
- File name (truncated to 2 lines)
- Folder badge (colour-coded)
- Framework badge if present
- Tags as small pills (max 3 visible + "+N more")
- Upload date in relative format ("2d ago")
- Action row: Pin toggle, Download, Comment count, Admin delete

---

### 4. Artefact Detail Slide-Over

**New file: `src/components/artefacts/ArtefactDetailPanel.tsx`**

Opens as a Sheet (right slide-over) when clicking a card/row:
- Full metadata display (name, folder, description, tags, framework, author, dates, size)
- **Version History** tab: lists all versions (same parent_id), side-by-side comparison of descriptions/metadata
- **Comments** tab: threaded comments list + input to add comment
- **Share** section: copy shareable link button (generates a public URL from storage)
- Download button
- Admin-only: Edit metadata (tags, framework, description), Delete

---

### 5. Enhanced Upload Panel

**File: `src/components/AdminUploadPanel.tsx`** — extend

Add fields during upload:
- Tags input (comma-separated, converted to array)
- Framework dropdown (DPDP Act, GDPR, ISO 27701, etc.)
- Author text input
- Collection selector (existing folders + custom)

Store `file.size` as `file_size` and `file.type` as `mime_type` on insert.

---

### 6. Hooks & State

**New file: `src/hooks/useArtefactPins.ts`**
- Manages pin/unpin and recent tracking for current user
- `togglePin(artefactId)`, `trackRecent(artefactId)`, `pinnedIds`, `recentFiles`

**Update: `src/hooks/useArtefactContext.ts`**
- Add support for new columns (tags, framework, author, etc.)
- Add filtered query support: `fetchArtefacts(filters?: { folder?, framework?, tags?, search?, dateRange? })`

---

### 7. No Routing Changes

The page stays at `/artefacts`. No new routes needed. The detail panel is a Sheet overlay, not a separate page.

---

### File Change Summary

| File | Action |
|---|---|
| DB migration | Create: alter `artefact_files`, create `artefact_pins`, `artefact_comments` |
| `src/pages/ArtefactRepository.tsx` | Rewrite: faceted search, grid/list, personalized dashboard |
| `src/components/artefacts/ArtefactCard.tsx` | Create: grid card component |
| `src/components/artefacts/ArtefactDetailPanel.tsx` | Create: detail slide-over with versions, comments, sharing |
| `src/components/AdminUploadPanel.tsx` | Edit: add tags, framework, author, mime_type fields |
| `src/hooks/useArtefactContext.ts` | Edit: extend interface, add filter support |
| `src/hooks/useArtefactPins.ts` | Create: pin/recent management hook |

### Safety
- KMAdminPanel, consent module, policy builder, assessment generator untouched
- Existing download/delete logic preserved
- All new tables have proper RLS
- Uses existing shadcn/ui components (Sheet, Badge, Tabs, ToggleGroup, Command)
- Teal/green design tokens maintained

