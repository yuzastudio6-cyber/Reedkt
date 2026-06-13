# Track A Current-Source Integration Plan

Status: `current_source_planning_only`

## Integration Sources

| Source | Role In Current Track A Path |
| --- | --- |
| TRACK_A_RENDER_EXPORT TOOL-STUDY-0 | Owner routing contract for final composition, render/export manifest policy, private review artifacts, and Track A handoffs. |
| TOOL-ROUTE-1 | Route dry-run plan that includes Track A owner route planning and blocked execution validation. |
| TOOL-ROUTE-2 | Generated/local fixture planning for Track A and adjacent owner route families. |
| TOOL-ROUTE-3 | Future generated/local fixture contract tests; not implemented in TRACKA-RECON-0. |
| WORKER-1 | Deterministic worker job planning only; no worker execution. |
| PLAN-SNAPSHOT-1 | Candidate-only approved-plan snapshot contract; runtime approval remains false. |
| MODEL-DRYRUN-1 | Sanitized provider output evidence only; no provider calls in this phase. |
| Historical Track A activation PRs | Evidence candidates for future merge/replay decisions; not current-source runtime approval. |

## Integration Path

1. Keep #364 as the Track A owner routing source of truth.
2. Use TOOL-ROUTE-1 and TOOL-ROUTE-2 as the current coordination path for route and generated/local fixture planning.
3. Use TRACKA-RECON-0 to classify historical visual/video evidence without executing it.
4. Use TRACKA-MERGE-1 to merge, close, or retarget only after human approval.
5. Use TOOL-ROUTE-3 for generated/local fixture contract tests before any Track A fixture execution packet.
6. Add a future Track A fixture contract-test phase for BiRefNet, SAM2, Real-ESRGAN, FILM, OpenColorIO, OpenImageIO, Kornia, libass, Remotion, OpenTimelineIO, FFmpeg, and FFprobe.
7. Add a future controlled private visual-video E2E replay/validation phase only after route contract tests and owner approval pass.
8. Keep final delivery, public artifacts, signed URL delivery, internal beta, external beta, and production blocked until separate approval.

## Source-Of-Truth Rule

Structured private manifests, checksums, provenance, timing, media refs, render/export settings, QA records, and owner handoff records are source-of-truth. Screenshots, previews, temporary renders, raw prompts, raw provider responses, raw media payloads, public artifacts, and signed URLs are not source-of-truth.

## Supabase Classification

Supabase update status: `docs_only`

Milestone sync: `blocked_current_branch_missing_sync_layer`

Environment touched: `none`

SQL executed: `none`

Migration deployed: `no`

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
