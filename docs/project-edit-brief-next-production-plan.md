# Project Edit Brief Next Production Plan

Edit Brief is optional. Chat remains default. Marker Chat is marker-scoped. Attachments are metadata-only. Plan hints are not execution. Production ready: false. Public-release owner approval pending. Internal testing owner path accepted by RP-EDITBRIEF-15H. No migration. No Supabase command.

## Current State

The mock/local Edit Brief flow is intended for internal testing only. It can create marker metadata, capture marker-scoped intent, store metadata-only attachments, save mock export settings, run deterministic QA, and prepare mock plan hints.

Internal testing still has to be production-shaped. Test implementation should use the same route, repository, API, approved-plan, estimate, audit, and validation seams expected for release, with explicit blocked-scope checks for public launch, billing, live Supabase writes, providers, media workers, render/export, uploads, and real-user-media exposure.

## Production Gates

- Owner approval for schema, persistence, route, and planner policy.
- Supabase migration and RLS/Data API plan after RP-DB gates.
- Storage/upload lifecycle for real media attachments.
- Real planner/edit-plan repository boundary and approval gates.
- Provider/model policy for any Qwen/DeepSeek or future reasoning runtime.
- Worker/render/export/progress/credit pipeline gates.
- Monitoring, privacy/legal review, rollback, and recovery plans.

## Recommended Next Milestone

For internal testing, proceed through `RP-EDITBRIEF-16 — Production-Shaped Internal Persistence Implementation Plan` after RP-EDITBRIEF-15H because Codex is acting as the implementation owner for the internal testing lane. That milestone should build release-shaped contracts and wiring, not disposable test-only code.

For external beta, real-user-media beta, or paid production, use `RP-EDITBRIEF-16 — Production Persistence Implementation Plan` only after RP-EDITBRIEF-15 owner inputs are supplied in the RP-EDITBRIEF-15A intake template and RP-EDITBRIEF-15B evaluates that intake as ready. RP-EDITBRIEF-13 reconciled the Supabase persistence roots, RP-EDITBRIEF-14 converted blanket blockers into computed readiness gates, RP-EDITBRIEF-15 records the missing owner/operator evidence, RP-EDITBRIEF-15A supplies the concrete intake shape, RP-EDITBRIEF-15B adds the executable readiness check, RP-EDITBRIEF-15C names the owner assignment evidence needed to complete the gate, RP-EDITBRIEF-15D adds a local validation command for filled evidence files, RP-EDITBRIEF-15E adds the strict PR diff gate for the reviewed evidence update, RP-EDITBRIEF-15F adds schema validation before readiness/safety evaluation, and RP-EDITBRIEF-15G adds a safe draft generator for external owner collection. Do not jump from these gates to public production enablement without the named evidence, a schema-valid intake, a safety-clean validation result, and a passing readiness result.

## Internal Testing Owner Path

RP-EDITBRIEF-15H accepts Codex/operator ownership for internal testing only. It allows production-shaped internal persistence planning while keeping external beta, real-user-media beta, paid production, live Supabase writes, provider/model calls, workers, render/export, uploads, and credit spend blocked until their separate evidence gates pass.

## RP-EDITBRIEF-16 Internal Persistence Plan

RP-EDITBRIEF-16 defines the production-shaped internal persistence contract for the next backend skeleton. It keeps the durable roots on `edit_briefs`, `edit_cues`, cue child tables, application logs, and export settings; keeps browser access behind the API client; requires service-role access to remain backend-only; requires future write idempotency and audit event planning; and records the public-release delta. It does not add migrations, SQL, Supabase CLI usage, live Supabase reads/writes, Storage writes, signed URLs, production routes, providers, media processing, workers, render/export, uploads, or credit spend.

Next internal milestone: `RP-EDITBRIEF-17 - Internal Persistence Backend Skeleton`.

## RP-EDITBRIEF-17 Internal Persistence Backend Skeleton

RP-EDITBRIEF-17 adds the backend seam for internal testing route integration. It keeps writes in the mock repository, keeps Supabase in disabled fail-closed mode, requires idempotency and audit envelopes for mutating operations, and blocks partial approved-plan/credit approval fields. It is ready for internal route integration but still does not enable production routes, live Supabase, Storage, providers, media processing, workers, render/export, uploads, external beta, paid production, or credits.

Next internal milestone: `RP-EDITBRIEF-18 - Internal Route Integration`.

## RP-EDITBRIEF-18 Internal Route Integration

RP-EDITBRIEF-18 connects Project Edit Brief route handlers to the internal persistence backend skeleton. Successful mock route responses now include internal persistence metadata, so internal testing can verify the backend seam used by the UI without turning on live Supabase or production route behavior.

Next internal milestone: `RP-EDITBRIEF-19 - Internal Testing Readback And QA`.

## RP-EDITBRIEF-19 Internal Testing Readback QA

RP-EDITBRIEF-19 validates the connected internal route path end to end inside the backend skeleton: create brief, create marker, append Marker Chat, read summary, and read bundle. The path preserves safety flags and internal persistence metadata, proving the route integration is ready for review as an internal testing slice.

Next internal milestone: `RP-EDITBRIEF-20 - Internal Testing Review And PR Readiness`.

## Qwen Runtime Dependency

RP-QWEN-00 is complete as an audit-only package for future reasoning runtime readiness. Edit Brief Marker Chat remains deterministic mock/local until a later owner-approved Qwen milestone. No Qwen call, provider call, Secret Manager inspection, `gcloud`, Supabase CLI, route wiring, Marker Chat runtime change, worker, render/export/progress, credit action, staging, commit, or cleanup occurred.

## RP-QWEN-01 Dependency Update

RP-QWEN-01 adds a server-only disabled Qwen runtime boundary for future Edit Brief reasoning work. Edit Brief Marker Chat still uses deterministic local rules only; it is not wired to Qwen. Production planning remains blocked on owner approval, fake transport, structured response validation, real Secret Manager gates, provider transport, monitoring, persistence, workers, render/export/progress, credits, and privacy/security review.

## RP-QWEN-BETA-01 Dependency Update

Edit Brief Marker Chat now has a backend-only beta Qwen bridge. This changes beta readiness only. Production still requires monitoring, auth/effect gates, persistence decisions, usage/cost controls, incident handling, privacy/security review, Supabase deployment gates, workers/render/export/credits policy, and owner production approval.

## Source Video Context Dependency

RP-VIDEOCTX-00 documents the future Source Video Understanding Package and Marker Context Package that should feed context-aware Marker Chat. It does not change Edit Brief runtime behavior. Future Edit Brief production planning should wait for `RP-MEDIA-01 - Primary Source Video Upload + Playable Brief Timeline Sync`, then context package types, repository/client, retrieval, and Qwen prompt integration.

RP-VIDEOCTX-00R updates the planned tool split: Qwen2.5-VL is the future visual/video understanding specialist, Qwen 3.7 remains the Marker Chat reasoning brain, and DeepSeek remains coding/tool-code only. Future Edit Brief production planning should add `RP-QWENVL-01 - Qwen2.5-VL Runtime Boundary + Visual Adapter` after RP-MEDIA-01 and before context-aware Marker Chat runtime wiring.

No runtime execution, no worker, no render, no credits, no media processing, no upload/file-byte read, no provider call, no Supabase command, and no migration are authorized by the video-context audit.

## RP-MEDIA-01 Local Preview Update

Project Edit Brief now supports browser-local primary source video preview and timeline sync. This proves the UX path for source selection, playback, `currentTime` seeking, marker defaults, and source-dimension export recommendations, but it is not durable media production readiness.

Production planning still needs durable storage/media asset records, source media repository policy, media workers, Qwen2.5-VL visual context, speech/audio tools, render/export gates, credit gates, privacy/security review, Supabase persistence, and owner approval. No upload, backend file-byte read, worker, media/model/provider call, render/export, credit action, Supabase command, or migration is authorized by RP-MEDIA-01.

## RP-QWENVL-BETA-01 Visual Context Update

Project Edit Brief now has a beta marker Visual Context panel and backend-only Qwen2.5-VL route for sampled local-preview frames. This improves internal testing and visual-awareness readiness, but production planning still needs durable source media, owner-approved deployment mode, monitoring, persistence policy, context-aware Qwen 3.7 prompt integration, media worker boundaries, render/export gates, credit gates, privacy/security review, Supabase deployment gates, and owner production approval.

No full-video upload, raw frame persistence, backend file-byte read, media worker/tool runtime, render/export, credit action, Supabase CLI, migration, DeepSeek, Qwen 3.7 visual call, staging, commit, or cleanup is authorized by RP-QWENVL-BETA-01.
