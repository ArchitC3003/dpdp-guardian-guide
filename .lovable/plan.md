# Learn — Public Content & Marketing Hub

Turn the "Learn" tile (currently Coming Soon) into a publishing system: your team writes blogs, articles and landing pages inside PrivcybHub, and they appear on the public site, optimised for search engines and AI crawlers, with secure lead capture.

## Model overview

```text
 ADMIN STUDIO (signed-in, role-gated)            PUBLIC SITE (anyone)
 ┌─────────────────────────────┐                 ┌──────────────────────────┐
 │ Content editor              │   publish  ──►  │ /learn        (hub)      │
 │  - Blog / Article / Landing │                 │ /learn/:slug  (article)  │
 │  - SEO panel + AI assist    │                 │ /lp/:slug     (landing)  │
 │  - Draft > Review > Publish │                 │ /learn/topic/:tag        │
 │  - Schedule (IST)           │                 └───────────┬──────────────┘
 │ Leads inbox                 │ ◄── secure form ────────────┘
 │ Subscribers / outreach      │                 Sitemap, RSS, llms.txt,
 └─────────────────────────────┘                 JSON-LD auto-updated
```

## What gets built

1. **Content types**: Blog post, Long-form article / guide, Landing page (block-based: hero, benefits, FAQ, CTA form).
2. **Editorial workflow**: Draft → In Review → Scheduled → Published → Archived. Roles: Super Admin and GRC Manager publish; Reviewer can review; Auditor read-only. Version history per post.
3. **Editor**: rich text (headings, lists, tables, images, callouts, code), cover image upload, categories/tags (DPDP, GDPR, Sector guides…), author profiles, related posts.
4. **SEO panel per post**: title/description with length meters, slug, canonical, OG/Twitter image, focus keyword, readability hints, FAQ schema, live Google-preview.
5. **AI assist** (built-in AI, no key): outline draft, meta description, FAQ generation, keyword suggestions, summary for AI crawlers — always editable, never auto-published.
6. **AI crawling & discoverability**: Article/FAQ/Breadcrumb JSON-LD, dynamic sitemap and RSS feed, llms.txt listing published content, clean semantic HTML, per-post "AI summary" block.
7. **Secure outreach**: lead/newsletter forms on posts and landing pages with validation, spam protection (honeypot + rate limit), explicit DPDP consent checkbox recorded with timestamp, double opt-in email via your notify.privcybhub.com domain, unsubscribe link, leads inbox with CSV export.
8. **Public pages**: Learn hub (featured, latest, by topic, search), article page (reading time, table of contents, share, CTA), landing pages — styled to match the new landing page.

## Technical details
- Tables: `content_posts`, `content_versions`, `content_categories`, `content_tags` (+ join), `content_authors`, `landing_blocks` (JSONB), `marketing_leads`, `newsletter_subscribers`. RLS: public can read only `status='published' AND published_at<=now()`; writes role-gated via `has_role`; leads insert-only for public through an edge function (validation + rate limit), readable by admins only.
- Public storage bucket `content-media` for images (admin write).
- Edge functions: `content-ai-assist`, `submit-lead`, `content-feed` (sitemap.xml / rss.xml / llms.txt generated from published posts).
- Routes: `/learn`, `/learn/:slug`, `/learn/topic/:tag`, `/lp/:slug` (public); `/studio/content`, `/studio/content/:id`, `/studio/leads` (protected).
- Per-page metadata via existing react-helmet-async. Note: the site is a single-page app, so some non-JS crawlers see limited content; JSON-LD, sitemap and llms.txt mitigate this.
- Tests for publish visibility and role permissions.

## Phasing
- Phase A: tables, public Learn hub + article page, editor, SEO panel, sitemap/RSS.
- Phase B: landing page builder, lead forms + double opt-in, leads inbox.
- Phase C: AI assist, scheduling, analytics of views/leads per post.
