# Sign In Page Override

Status: `google_oauth_locally_verified_hosted_configuration_pending`

## Job

Establish one trusted session and return the user to the intended internal route safely.

## Composition

- Compact brand row and back action.
- Calm value statement with three quiet workspace protections.
- One focal authentication surface.
- The active authentication mode is explained honestly without exposing unnecessary implementation jargon.

## Page Rules

- Google is the one dominant sign-in action in secure hosted mode.
- No marketing badge, giant technical explanation, bearer-token language, or backend-readiness diagnostics.
- Loading, unavailable, and error states remain in the focal surface.
- External return targets are rejected; internal return context remains preserved.
- `returnTo` is canonical and the legacy internal `redirect` alias remains sanitized for existing testing entrypoints.
- Local preview mode uses one tab-scoped browser-session action. Supabase mode presents Google first and keeps email/password inside a quiet disclosure for recovery and approved internal testers; neither mode exposes account creation or internal diagnostics here.
- Google and fallback controls retain at least a 44px target, visible keyboard focus, disabled/loading feedback, and a recoverable error path.
- The OAuth callback uses the exact browser origin and configured app base path. Only sanitized internal return context is carried through the provider handoff.
- At compact mobile widths, supporting trust rows yield to the authentication card so the complete Google action remains inside a 375×667 first viewport; the full trust list remains visible on larger layouts.
- A signed-in session leaves Sign In immediately for the sanitized destination. Sign-out clears the tab-scoped local identity and returns through the same guarded route.
- The skip link stays visually quiet until keyboard focus, and the two-column layout collapses to one readable column without horizontal overflow.

## Evidence

- `tests/e2e/auth.spec.ts`
- `tests/e2e/app-sign-in-internal-testing-mock.spec.ts`
- `tests/e2e/google-oauth-sign-in.spec.ts`
- `tests/e2e/marketing-ui.spec.ts`
- `server/smoke/google-oauth-sign-in-smoke.ts`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/sign-in-1280.png`
- Computed-style and keyboard regressions prove the two/one-column layout, focal card, hidden-until-focused skip link, safe internal return handling, external-target rejection, local-session entry, and clean sign-out.
- The focused Google suite proves action hierarchy, mobile fit, accessible fallback disclosure, exact safe callback construction, external-target rejection, and provider-error confidentiality without contacting Google.

## Remaining Hosted Gate

The design and local browser behavior are verified. A real Gmail-session claim still requires approved Supabase Google-provider configuration, exact redirect allowlisting, deployment, and real browser session readback. Those remote steps are intentionally not implied by this page status.
