# Product Documentation Drift

Status: `drift_confirmed`

## Summary

The repository contains a mature current Project -> Named Edit -> Chat workflow alongside older product documents that describe a much broader SaaS suite. Current code and tests must take precedence for product scope; `design.md` remains authoritative for visual identity principles, not for every historical route or feature list. The current implementation and several governance docs also use `Preferences` as visible product copy even though the authoritative user-facing name is `Edit Preferences`.

## Documents That Closely Match Current Code

- `docs/ui-ux-master-plan.md` route goals and retired-route rules.
- `docs/ui-ux-codex-rules.md` chat-first, approval, accessibility, and performance rules.
- `docs/ui-ux-app-shell-sizing.md` current shell/composer constraints.
- `docs/ui-ux-chat-message-architecture.md` structured message behavior.
- `docs/ui-ux-editor-final-acceptance.md` current editor baseline.
- `product-plan.md` project-first intent, approval gate, credits, and web-first direction.

These documents remain useful but require the terminology and Home-hierarchy corrections listed below.

## Documents With Mixed Current And Historical Content

### `design.md`

Current and authoritative:

- AI Topology Matrix/deep-space identity.
- Restrained cyan/blue/violet accents.
- Premium-not-busy principle.
- Story-first, timing-first, transparent AI, accessibility, and consistent component rules.
- Stroke Motion, VisualExplain, Real Motion, SoundSync, and StoryTiming concepts.

Historical or superseded for current UI scope:

- Full desktop navigation containing AI Editor, Media Library, Templates, Team, Analytics, Exports, Brand Kit, and Settings.
- Standalone Brand Kit, Analytics, Team, Templates, Media Library, and Export Queue as current MVP routes.
- Full-power timeline-first editor specification.
- Native mobile companion as a current design deliverable.
- Dashboard KPI/analytics/storage/widget requirements.
- Pricing and collaboration sections as current active pages.

### `product-plan.md`

Mostly current at the product-law level. Its `Not Being Built Yet` backend wording is behind the current branch, which now contains substantial evidence-gated server, worker, storage, provider, rendering, credit, and readiness work. The UI must still represent those capabilities conservatively because production readiness remains gated.

## Code Ahead Of Documentation

- Project -> multiple named edits hierarchy.
- Upload occurring inside the edit rather than during project creation.
- Optional Edit Brief integrated after source preparation.
- Global/local Edit Preferences snapshotted into new edits.
- Private review and revision workflow.
- Structured chat message renderer and lazy SFX/Music/timeline flows.
- Evidence-gated production/backend readiness systems.
- Retired standalone Wallet/Pricing/Brand Kit/Exports routes.

## Current UX Documentation Corrections

- `Preferences` and `Edit Preferences` are one feature. Visible copy should say `Edit Preferences`; route/code identifiers may remain.
- Saved Edit Preferences and Current Edit Preferences are two scopes of one system, not separate product areas.
- Current-edit preferences are only partially represented through the edit setup snapshot and planning controls; there is no dedicated current-edit surface yet.
- The current Home is onboarding-first rather than a true returning-user dashboard. It should not be described as a completed resume/attention workspace.
- The Supabase/API diagnostic strings are not Home content in the current router. They are inside the collapsed internal-testing disclosure on `/preferences`.
- Internal testing is not an Edit Preferences category and should move to an environment-gated internal surface.

## Historical Code Residue

Deleted or redirected page/component evidence shows an intentional cleanup of old generic SaaS surfaces, including Wallet, Pricing, Brand Kit, Export Queue, Metric cards, generic Project cards, and older AI chat/upload components. These deleted files must not be revived without a new product decision.

## Recommended Documentation Actions

1. Keep `design.md` as visual/product-principle history, but add a prominent current-scope addendum linking to `docs/current-product-scope.md`.
2. Update `product-plan.md` to distinguish current internal/private runtime work from external production readiness.
3. Treat `docs/current-route-navigation-map.md` as the route truth for redesign work.
4. Archive or label old feature-specific UI docs when their routes are retired.
5. Resolve the three-tab workspace decision before documenting it as implemented.
6. Update visible/governance terminology from `Preferences` to `Edit Preferences` without forcing route/class renames.
7. Treat `docs/ui-ux-home-audit.md` and `docs/ui-ux-home-concepts.md` as the Home redesign authority until implementation and visual signoff.
8. Move internal-testing guidance out of normal Edit Preferences architecture.
9. Do not delete historical docs during the audit; mark authority and drift explicitly.

## Path Divergence Caveat

Historical-path-only files may exist in `/Users/macuser/Developer/REeditpro`. They are not current scope evidence for this checkout until the source-of-truth reconciliation is completed.
