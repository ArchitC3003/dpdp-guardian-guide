# Authentication
- Start Google OAuth directly through the generated Lovable helper from the sign-in click, with a synchronous single-flight guard; parallel authorization attempts create independent states.
- Return Google OAuth to the public same-origin `/auth` page and let the session-aware guard enter protected pages; full-page redirects return before session hydration.
- Keep generated integration files unchanged; validate managed popup results with `auth.getUser()` before navigating.
# Learn (public content)
- Public content lives in `content_posts`; anonymous visibility is enforced by RLS (published/scheduled with `published_at <= now()`), mirrored by `isLive` in `src/lib/content.ts` — keep both in sync.
- Studio saves go only through `rpc_save_content_post` / `rpc_restore_content_version` (SECURITY INVOKER) so post, tags and version snapshot commit atomically under RLS; a BEFORE trigger reserves scheduled/published/archived for admin/moderator.
- `content-media` is a private bucket (public buckets are blocked in this workspace); cover images are stored as long-lived signed links.
- Public lead forms write only through the `submit-lead` function (validation, honeypot, hourly rate limit, consent text stored); never grant anon insert on `marketing_leads`.
- Sitemap/RSS/llms entries for posts are generated live by the `content-feed` function so publishing never needs a rebuild.
