# Learn Hub — Phase A upgrade

Most of Phase A is already live: public `/learn`, `/learn/:slug`, `/learn/topic/:tag`, the studio list and editor, version snapshots, and the `content-feed` sitemap/RSS/llms function. This plan fills the gaps between what's live and the brief, and keeps existing posts working.

## What changes for your team
- **Reviewers can now write.** Reviewers can create and edit drafts and send them for review. Only Super Admin and GRC Manager can schedule, publish or archive. Auditors can only view.
- **New "In review" status** shows up in the studio filters and the editor's status buttons.
- **Proper authors, categories and tags.** Authors get a bio card on each article. Categories and tags are picked from managed lists, not typed in freely. The topic pills on the Learn page are DPDP, GDPR, RBI, SEBI, CERT-In and ISO 27701.
- **Cover image upload** goes to a new public image library. Only Super Admin and GRC Manager can upload images there.
- **Scheduling:** you can pick a "go live" time, shown in IST. The post appears on the site automatically at that time.
- **One-click restore** from version history. Every save also keeps a history snapshot.
- **Every save checks for errors.** If a save or upload fails, you see an error message and the screen does not show the change as saved.
- **Studio filters** for author and category, alongside the existing status and type filters.

## Technical details
Database (additive only, existing rows kept):
- New tables `content_authors`, `content_categories`, `content_tags`, `content_post_tags`, each with grants and RLS: public read, writes for admin/moderator.
- Add columns to `content_posts`: `author_id`, `category_id`, `scheduled_for`, `current_version int default 1`. Allow `in_review` in the status values. Backfill categories, tags and authors from the existing `category`, `tags[]` and `author_name` columns. Keep the brief's names as aliases in the code only: `body_md`, `faq`, `reading_minutes` stay the stored names to avoid a breaking rename, and the old text columns are marked deprecated.
- RLS: anon SELECT only where `status='published' AND published_at <= now()`. This also covers scheduled posts once their go-live time passes, kept in sync with `isLive`. Staff SELECT for admin/moderator/user/auditor. INSERT/UPDATE for admin/moderator/user. A BEFORE trigger raises an error when someone without admin/moderator sets status to `published`, `scheduled` or `archived`, or changes a post that's already live.
- `content_versions`: staff read, plus inserts only through the RPC.
- `rpc_save_content_post(payload jsonb, tag_ids uuid[])` runs as SECURITY INVOKER, so RLS and the trigger still apply. In one transaction it upserts the post, syncs its tags, increments `current_version`, appends a snapshot, and returns the row. There's also a matching `rpc_restore_content_version(version_id)`.
- Storage bucket `content-media` is public-read, with `storage.objects` write policies for admin/moderator.

Frontend:
- `ContentStudio.tsx`: role matrix via existing role hook, plus author and category filters and IST dates.
- `ContentEditor.tsx`: saves through the RPC with a `{data,error}` guard on every call, adds an author/category/tag selector, cover uploader, IST schedule picker, and a restore button in the version drawer. The SEO panel keeps its existing 60 and 155 character meters, keyword check, FAQ builder and SERP preview.
- `LearnHub.tsx` / `LearnArticle.tsx`: fixed topic pills, author bio card, and BreadcrumbList JSON-LD added to the existing Article and FAQPage data.
- Sidebar: Content Studio visible to all four staff roles.
- `content-feed`: filter on `published_at <= now()` (scheduled-aware). Add an author and category to RSS items.
- Tests: role publish rules (Reviewer blocked from publishing, Auditor read-only) and the `isLive` scheduled rule.
