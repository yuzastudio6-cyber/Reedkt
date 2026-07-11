# Current Product Visual Signoff

Status date: 2026-07-10
Scope: active ReeditPro website and desktop-app routes on the current branch
Review method: active-route screenshot review, in-app browser inspection, and Playwright viewport/layout/keyboard coverage

This review covers the product that is active now. Retired Brand Kit, Wallet page, pricing-page, export-queue, template, team, analytics, and media-library prototypes are not redesign inputs merely because historical files or documents mention them.

## Active Surface Reviewed

| Route | Result | Notes |
| --- | --- | --- |
| `/` | pass after chat-first redesign | The short promise, authentic editor preview, working section anchors, approval trust, signature systems, use cases, and private-workspace CTA express the active product without a feature-card wall. |
| `/sign-in` | pass after focused-entry redesign | The sign-in surface has one primary action, compact workspace protections, honest private-preview copy, and no developer-oriented authentication detail. |
| `/dashboard` | pass after reliability update | The home route presents one primary project path, recovers exact scoped named edits before inferring no latest edit, and keeps newer local work visible during a transient outage. |
| `/projects` | pass after reliability update | Loading, empty, local-only, unavailable, invalid-response, and access-denied states are distinct; transport failure no longer appears as a false empty account. |
| `/projects/new` | pass after project-first redesign | One labelled form asks only for project name and broad context, validates without losing input, and explains the next named-edit/upload steps in one quiet rail. |
| `/projects/:projectId` | pass after reliability update | The route distinguishes missing, denied, invalid, local-only, and unavailable recovery states. The New Edit dialog is labelled, focus-contained, Escapable, and returns focus. |
| `/preferences` | pass after resilience and visual redesign | Saved defaults use grouped flat fields and contextual actions while preserving draft recovery, retry/refresh/discard behavior, and honest authenticated single-host scope. |
| `/projects/:projectId/edits/:editSessionId` | pass after flagship workspace redesign | Exact scoped state resolves before mount; the compact header, one-decision chat flow, wide-screen preview rail, floating composer, inline Brief, exact-edit Preferences, Plan Review transition, and recovery states remain truthful and keyboard safe. |
| `/editor` | internal/demo only | The populated structured-chat route remains useful for editor QA. It is not evidence that demo clips or demo instructions belong to real projects. |

## Design Identity Findings

The active routes consistently use:

- a deep-space canvas;
- restrained cyan, blue, and violet signals;
- bounded desktop composition;
- readable production typography;
- quiet glass surfaces rather than glow on every card;
- compact route headers;
- clear focus on the next action.

The current product does not need the retired dashboard surfaces restored. The active three-item navigation—Home, Projects, Preferences—matches the current implementation better than the historical Brand Kit, Wallet, Team, Analytics, or Media Library navigation.

## Targeted Corrections From This Review

1. Real project edits no longer inherit hidden demo-story instructions or demo source assets.
2. A new edit header now reports `Source needed` and `Estimate pending`.
3. A failed approval now reports `Needs attention` and continues to state that no credits were approved or used.
4. The inert project-menu icon was removed rather than presenting a nonfunctional control.
5. The project detail page no longer repeats the project title in its primary content panel.
6. Empty project detail shows one primary `New edit` action.
7. Active user-facing brand copy is being normalized to `ReeditPro`.
8. Internal connection/readiness diagnostics on Preferences are being moved behind a quiet disclosure so they do not dominate the user task.
9. Project edit metadata now uses deliberate vertical spacing instead of merging source-count and preference-status copy into one line.
10. The top-right `Edit Brief` action appears only after Footage Prep, focuses the existing inline brief instead of creating a duplicate panel, and does not mutate brief state when opened. Meaningful brief changes continue to invalidate stale plan/approval state.
11. Edit Preferences now crosses an authenticated private-internal persistence boundary with live workspace authorization and honest single-host scope; the page does not imply Supabase or production durability.
12. Initial source-upload and source-validation failures now render inside the still-locked upload gate as an assertive alert. The copy identifies supported formats, gives a direct retry path, confirms that no plan, credit, edit, or generation action started, and clears when a new attempt begins or a valid source succeeds.
13. Named edit routes now keep `ChatNativeEditor` unmounted until the exact user/workspace/project/edit handoff resolves. Backend-recovered state is validated and saved locally before the editor's first mount so complete setup seeds first-render state; loading, not-found, access-denied, invalid-response, and retryable backend-failure states remain outside the editor. `/editor` remains the explicit internal/demo exception.
14. Workspace resolution failure now provides explicit retry and sign-out actions instead of trapping the signed-in user.
15. Home, Projects, and project detail preserve trusted local work during transient recovery failure while refusing foreign, malformed, or duplicate backend identities.
16. Same-name projects use distinct create intents and identities instead of colliding through display-name-derived keys.
17. Edit Preferences preserves the draft on failed load/save/conflict/network operations and provides deliberate retry, refresh, and discard actions.
18. The editor header reports estimate state instead of a fabricated wallet balance; the exact estimate remains in Plan Review.
19. A guarded loopback-only browser/API workspace is available through `npm run dev:private-workspace` for manual signed-in private testing without external services.
20. Named edits now show compact exact-scoped persistence truth: `Saving`, `Saved in browser`, `Recovery saved`, or `Needs retry`. A failed write retains the newest local handoff and exposes one explicit retry action.
21. The final active-route capture set covers public entry, every active app route, project detail, named-edit upload and recovery states, editor approval/progress/preview states, 1024–1920 widths, keyboard use, and the zoom proxy.

## Final QA Evidence

- Screenshot set: `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/`
- Full Playwright suite: 129 passed.
- Active-route viewport/zoom/public/project UI group: 68 passed.
- Active-route screenshot suite: passed with Landing at 1280/1024/720 plus current project/editor states.
- Keyboard and interaction coverage: passed.
- Frontend TypeScript: passed.
- Targeted lint for all redesigned frontend and QA files: passed.
- Whole-worktree lint: blocked by the unrelated existing `no-control-regex` server error in `server/tool-execution/node-runners/offline-node-runner-security.ts:367`.
- Production build: passed; current editor/mock chunks remain a performance watch item.
- Frontend/server boundary: passed for 851 files.
- Guarded private-workspace configuration and launcher smoke: passed.
- Authenticated browser-to-backend private review smoke: passed, including upload, plan approval, private review, revision, reload, exact edit recovery, cross-user rejection, and revoked-membership blocking.

The progress transition is intentionally brief in the current mock-safe flow. The progress locator is verified, but the captured progress frame can be visually identical to the immediately ready state. No debug-only freeze was added to production UI.

## Remaining Product-Level Work Outside This Active-Route UI Signoff

- Preserve the implemented top-right Edit Brief access model: it is available only after Footage Prep and focuses the single inline brief. Do not introduce a duplicate editable Brief.
- Reconcile the non-reproducible Supabase migration baseline before adding a durable preference table; then require reviewed RLS, controlled staging, and production durability evidence before describing Edit Preferences as production persisted.
- Preserve the now-verified local/private project/edit tenancy V2 boundary, and obtain a real mounted Supabase revocation test plus reviewed RLS/staging evidence before making real-user tenancy claims.
- Preserve named-route pre-mount recovery. Do not fall back to an empty upload workspace when a named edit is missing, unauthorized, mismatched, or temporarily unavailable.
- Keep the conditionally executable fixed-template Playwright capture behind its approved private tool-work gate; it is not a new user-facing navigation or provider control.
- Keep advanced planning, provider, runner, SFX, music, and timing details collapsed unless the user asks or a blocker requires them.
- Preserve the existing message/composer rail alignment, project-back navigation, preview/status rail, and no-hard-footer behavior.

## Definition of Current Visual Pass

The active surface passes when:

- the next action is understandable within a few seconds;
- no route presents inactive historical features as current product scope;
- status and credit language matches real state;
- one primary action dominates each task region;
- no dead control is visible;
- advanced implementation detail does not dominate normal use;
- keyboard, focus, viewport, zoom, and overflow tests remain green;
- screenshots and browser inspection agree with the automated layout evidence.
