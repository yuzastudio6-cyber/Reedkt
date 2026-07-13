# Sign In Page Override

Status: `implemented_and_visually_verified`

## Job

Establish one trusted session and return the user to the intended internal route safely.

## Composition

- Compact brand row and back action.
- Calm value statement with three quiet workspace protections.
- One focal authentication surface.
- The active authentication mode is explained honestly without exposing unnecessary implementation jargon.

## Page Rules

- One dominant sign-in action.
- No marketing badge, giant technical explanation, bearer-token language, or backend-readiness diagnostics.
- Loading, unavailable, and error states remain in the focal surface.
- External return targets are rejected; internal return context remains preserved.
- `returnTo` is canonical and the legacy internal `redirect` alias remains sanitized for existing testing entrypoints.
- Local preview mode uses one tab-scoped browser-session action. Supabase mode uses the same focal card with email/password fields; neither mode exposes account creation or internal diagnostics here.
- A signed-in session leaves Sign In immediately for the sanitized destination. Sign-out clears the tab-scoped local identity and returns through the same guarded route.
- The skip link stays visually quiet until keyboard focus, and the two-column layout collapses to one readable column without horizontal overflow.

## Evidence

- `tests/e2e/auth.spec.ts`
- `tests/e2e/app-sign-in-internal-testing-mock.spec.ts`
- `tests/e2e/marketing-ui.spec.ts`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/sign-in-1280.png`
- Computed-style and keyboard regressions prove the two/one-column layout, focal card, hidden-until-focused skip link, safe internal return handling, external-target rejection, local-session entry, and clean sign-out.
