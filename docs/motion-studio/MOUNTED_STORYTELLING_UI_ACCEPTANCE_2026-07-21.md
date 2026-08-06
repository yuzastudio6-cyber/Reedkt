# Mounted Storytelling UI Acceptance — 2026-07-21

Status: `historical_evidence_route_claims_superseded_by_adr_012`

> **Superseded route note (2026-07-22):** ADR-012 replaces the ordinary
> named-edit Chat route and `?workflow=storytelling` placement described in
> this historical packet. Its 61-test evidence remains useful only for the
> feature-state regressions it covered. Current acceptance requires the
> dedicated Storytelling Library and Director Chat routes documented in
> `STORYTELLING_FRONTEND_EXPORT_HANDOFF_2026-07-22.md`.

Exact product-integration source before this evidence note:

- branch: `codex/canonical-motion-preferences-integration`
- commit: `4c8001bc234cdf48010b22249409fae86c2cf14a`
- tree: `ea12bc9b3f204775781815c0589e0b8ee5da6bab`
- worktree: clean

## Mounted product result

The current browser-visible hierarchy is one ReEditPro product:

1. the shared AppShell exposes `Motion Studio` in the primary sidebar;
2. `/motion-studio?workflow=storytelling` opens the focused Storytelling
   Library;
3. create or resume returns through the exact named-edit handoff;
4. Chat remains the default named-edit workspace; and
5. the compact Storytelling switcher exposes `Story`, `Scenes`, `Preview`,
   `Review`, and the secondary workspaces without creating another shell,
   editor, Brief, Preferences surface, Plan Review, or persistence authority.

The canonical local preview at `http://127.0.0.1:5196` was inspected at the
Storytelling Library, exact named-edit Chat, and Story workspace. The Library
and Chat hierarchy match the intended native ReEditPro integration. The Story
workspace honestly reports recovery when its API authority is unavailable;
it does not convert a transport or persistence failure into an empty state.

## Automated browser proof

The exact integrated source passed:

```text
npm run qa:motion-studio-ui
```

Result: `61/61` Playwright tests passed in Chromium.

An independent read-only QA pass first identified stale-runtime,
access-denial, and invalid-journal recovery gaps. After repair, its final audit
returned no findings and made no repository changes.

The suite covers:

- shared-sidebar entry and Storytelling-only module surface;
- Library loading, empty, create, resume, direct entry, exact identity, and
  return-to-Chat behavior;
- exact create-intent/idempotency retention across an unknown Project result,
  failed handoff save, reload, and workspace unmount;
- current-runtime revalidation of a retained browser-local result before it
  can migrate to the canonical backend Project identity;
- visible resumable, invalid/tampered, discard-and-recover, access-denied
  purge, and backend-list reconciliation states without leaking a pending
  title after authorization loss;
- source-less idea-first Storytelling and the normal-edit source-gate
  regression;
- Chat-default workspace navigation and historical-route correction;
- Story, Scenes, Preview, Audio, Timeline, Assets, Sources, and Review;
- delayed loading, empty, ready, partial, retry, conflict, access-denied,
  invalid, blocked, stale, approved, and locked/read-only states;
- exact proposal, timing, narration, asset, mix, review, and approval lineage;
- long-content preservation, keyboard/focus behavior, reduced motion,
  responsive widths, and horizontal-overflow safety; and
- one existing Plan Review and no direct generation, approval, credit,
  timeline, render, export, or provider side effect.

These tests use the explicit frontend-safe HTTP boundary with bounded route
fixtures. They prove the mounted browser and recovery contract and must not be
described as an atomic server transaction, real durable production
persistence, or provider execution.

## Real local API boundary check

The existing API was started locally and fail-closed with:

```text
NODE_ENV=test
API_PORT=8791
E2E_RUNTIME_MODE=mock
API_ALLOW_MOCK_WITHOUT_SUPABASE=true
PROVIDER_EXECUTION_ENABLED=false
WORKER_RUNTIME_MODE=mock
STORAGE_MODE=local
REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE=disabled
REEDITPRO_DISABLE_DOTENV=true
npm run dev:api
```

`GET /health` returned HTTP 200. An exact Motion Studio production read
returned HTTP 401 because `MotionStudioCommandService` requires a verified
bearer identity and canonical database authority; the local mock user cannot
cross that boundary. The API was then shut down cleanly.

This is the correct current truth. The ordinary browser cannot load durable
Story/Scenes/etc. data until the accepted authenticated persistence source is
available. No browser-local Motion database or second mock repository will be
added to disguise that missing authority.

## Remaining acceptance blockers

- authenticated canonical Motion Studio persistence for the exact
  project/edit/production identity;
- the atomic backend Storytelling list/create/resume/Chat-bootstrap lifecycle;
- trusted five-scenario calibration closed-history and authenticated review
  receipts;
- the backend-owned visual-calibration provider operation and released
  calibration receipts (the shared private Remotion resource/cost receipt is
  consumed but remains unreleased evidence);
- genuine provider-backed Speech/music/Foley evidence and the selected-audio
  chain; and
- the representative private end-to-end productions, Fine Cut/QC, private
  master, distributed durability, and separately gated deployment/public
  delivery evidence.

## Closed effects

This acceptance run made no provider/model request, Secret Manager payload
read, external HTTP request, remote Supabase/GCS/Cloud Run mutation, billing or
customer-credit action, timeline mutation, render/export, deployment, public
delivery, public push, or production-readiness promotion.
