# Canonical planning frame-authority promotion verification

Date: 2026-07-22

Status: protected private/local acceptance passed; production remains closed

## Defect

The mounted named-edit journey let the user explicitly confirm an output frame, but canonical plan publication stopped after reading the Exact Edit Preference authority when that authority had not yet recorded the frame. This created a circular gate: the browser was required to see server-confirmed frame evidence before the canonical handoff that verifies and records that evidence could run.

## Corrected authority flow

1. The browser still reads and validates the exact server-owned baseline, seven preference values, revisions, fingerprint, lifecycle lock, and frame-evidence shape.
2. The browser cannot write a frame confirmation, source-preparation digest, confirmation ID, or authority digest.
3. A canonical draft can reach the authenticated handoff only after the user explicitly confirms the output frame and the client draft passes the existing frame-first planning rules.
4. The handoff independently verifies finalized private source authority and the exact preference identity before it asks the selected server-side planning-authority port to record source/frame evidence.
5. The protected private compatibility port may atomically promote the verified source evidence and explicit confirmed aspect ratio into the exact-edit record.
6. The canonical V3/Postgres port retains its stricter transactional rule: it rejects evidence recording unless canonical output-frame authority already exists. This source correction does not create that live mutation authority or weaken production qualification.

## Retained gates

- No silent aspect-ratio default.
- No browser-authored source or frame authority.
- No generic Edit Preference mutation during planning.
- No fallback after a canonical authority read or canonical error.
- No plan approval, credit reservation, provider call, worker dispatch, render, export, billing, deployment, or public delivery is opened by the correction.
- Production Supabase/Auth/RLS/storage and same-release runtime qualification remain unproven.

## Verification

- `npm run smoke:canonical-planning-publication-client`
  - An authority whose frame is still `not_confirmed` reaches the server handoff contract without a browser mutation.
- `npm run smoke:editor-full-stack-private-review`
  - The first authority read preserves `not_confirmed`.
  - The canonical handoff accepts the explicit browser-confirmed 16:9 draft only after server-side source verification.
  - A later plan reads back source preparation `ready` and frame confirmation `confirmed` for 16:9.
  - Eight private sources, plan revision, one approval/estimate boundary, 27 canonical jobs, 3840x2160 private review, source-order audio identity, authenticated review playback/download, and review acceptance pass.
  - Providers, customer billing, public delivery, deployment, and production promotion remain false.

This is evidence for the protected private/local website journey, not a production-readiness claim.
