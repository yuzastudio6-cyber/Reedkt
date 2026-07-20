# Canonical Product UI Integration Readiness

Status: `source_gate_implemented_current_branch_blocked_until_edit_preferences_handoff`

Contract: `canonical-product-ui-integration-readiness-v1`

## Purpose

This gate prevents ReEditPro's protected internal-testing deployment lanes from publishing a technically reachable website with the wrong product UI. It is intentionally source-only and fail-closed. It does not redesign the UI, copy feature-owned files, or claim that a source-complete UI has passed browser, backend, cloud, authentication, persistence, provider, billing, or production verification.

The current backend continuation branch still mounts the retired generic defaults/settings implementation at `/preferences`. The active Edit Preferences task owns the correct library-first Edit Reference implementation and its exact-edit application bridge. Until that verified handoff is reconciled into this branch, the audit decision is:

```text
blocked_noncanonical_product_ui_integration
```

## Canonical Mounted Product Contract

The source gate requires all of the following to coexist in one reviewed source tree:

1. `/preferences` mounts one `PreferencesPage`, and that page mounts the library-first `EditReferenceWorkspacePage` rather than a second generic settings form.
2. The preference workspace provides one query-addressable library/create/study surface with a visible `New preference` action, semantic tabs, Study Chat, evidence, DNA, QA, and approval boundaries.
3. Browser calls use one frontend-safe, idempotent Edit Reference client for long-form study, DNA synthesis/QA/approval, target understanding, and application lifecycle operations.
4. Reference media uses the resumable private upload-intent, verified-offset, finalize, immutable object identity, and checksum-readback boundary.
5. `/projects/:projectId/edits/:editSessionId` resolves the exact scoped edit before mounting `ChatNativeEditor`.
6. Current Edit Preferences remains `?view=preferences` inside that same named-edit route and returns to Chat without creating a duplicate editor or preference product.
7. The exact-edit preference workspace binds an approved preference to an actual target-video study and explicit application status. Study completion cannot silently apply guidance.
8. The compact named-edit header exposes a keyboard-readable active Chat/Edit Preferences destination while preserving project/edit identity.
9. No competing `/chat`, `/brief`, Current Edit Preferences route, `ProjectEditSessionChatPage`, generic settings authority, or second mounted editor is admitted.

The checks follow `design.md`, `design-system/MASTER.md`, the active route map, and the repository's Edit Preferences/Edit Brief ownership rules. The UI UX Pro Max guidance contributed the deep-linking, semantic-navigation, keyboard, state-recovery, and single-primary-workspace checks; ReEditPro's existing design system remains visually authoritative.

## Commands

Audit mode always emits a deterministic JSON report and exits zero so a developer can inspect blockers without promoting the source:

```bash
npm run internal-testing:verify-canonical-product-ui-integration-readiness
```

Strict mode exits nonzero while any blocking invariant is missing:

```bash
REEDITPRO_REQUIRE_CANONICAL_PRODUCT_UI_READY=true \
  npm run internal-testing:verify-canonical-product-ui-integration-readiness
```

The adversarial smoke proves a complete fixture passes; missing upload authority, a generic settings page, duplicate routes/editors, a broken exact-edit deep link, and silent application semantics fail. It also proves every observed source file and the aggregate source snapshot receive SHA-256 identities:

```bash
npm run smoke:canonical-product-ui-integration-readiness
```

## Deployment Enforcement

Both protected lanes run the smoke and strict verifier before their first mutation or app build:

- `.github/workflows/beta-readiness-api-staging-deploy.yml` blocks before Google Cloud authentication and activation.
- `.github/workflows/app-internal-testing-pages-deploy.yml` blocks before the signed-in static app build and Pages deployment.

This makes a mismatched frontend a release blocker without changing the feature-owner single-writer boundary.

## Evidence Boundary

Passing this gate means only `source_verified_static_ui_integration_only`. It does not prove:

- a compiled or mounted browser route;
- Gmail sign-in or protected-session recovery;
- backend route compatibility, durable persistence, Supabase/RLS, or cross-device state;
- large reference/target upload recovery against deployed storage;
- worker/provider execution, a private edited result, or preference-compliance QA;
- customer credits, billing, export settlement, public delivery, or production readiness.

After the Edit Preferences task supplies a frozen handoff and this strict gate passes, the next bounded step is a same-source browser/backend integration run. External staging activation still requires the owner's separate explicit authorization.
