# Fix mobile Google sign-in state failure

## Changes
- Prevent repeated Google sign-in requests while an authorization attempt is opening.
- Keep the managed Google sign-in flow and its approved same-origin return URL unchanged.
- Show a clear retry message if authorization fails instead of leaving the button active.

## Verification
- Confirm the sign-in page permits only one authorization launch per click.
- Test the public sign-in page at mobile and desktop sizes.
- Check the preview build and browser console for errors.

## Technical details
The screenshot shows an OAuth state mismatch at the authorization broker. The current Google button can start overlapping requests because it has no in-progress guard; each request creates a different security state. The change adds a single-flight guard without changing authentication methods, user data, or protected pages.
