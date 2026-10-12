# Authentication
- Start Google OAuth directly through the generated Lovable helper from the sign-in click, with a synchronous single-flight guard; parallel authorization attempts create independent states.
- Return Google OAuth to the public same-origin `/auth` page and let the session-aware guard enter protected pages; full-page redirects return before session hydration.
- Keep generated integration files unchanged; validate managed popup results with `auth.getUser()` before navigating.