# Authentication
- Start Google OAuth directly through the generated Lovable helper from the sign-in click, with a synchronous single-flight guard; parallel authorization attempts create independent states.
- Return Google OAuth to the public same-origin `/auth` page and let the session-aware guard enter protected pages; full-page redirects return before session hydration.
- Keep generated integration files unchanged; validate managed popup results with `auth.getUser()` before navigating.
# Learn (public content)
- Public content lives in `content_posts`; anonymous visibility is enforced by RLS (published/scheduled with `published_at <= now()`), mirrored by `isLive` in `src/lib/content.ts` — keep both in sync.
- Public lead forms write only through the `submit-lead` function (validation, honeypot, hourly rate limit, consent text stored); never grant anon insert on `marketing_leads`.
- Sitemap/RSS/llms entries for posts are generated live by the `content-feed` function so publishing never needs a rebuild.
