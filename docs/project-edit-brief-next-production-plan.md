# Project Edit Brief Next Production Plan

Edit Brief is optional. Chat remains default. Marker Chat is marker-scoped. Attachments are metadata-only. Plan hints are not execution. Production ready: false. Owner approval pending. No migration. No Supabase command.

## Current State

The mock/local Edit Brief flow is intended for internal testing only. It can create marker metadata, capture marker-scoped intent, store metadata-only attachments, save mock export settings, run deterministic QA, and prepare mock plan hints.

## Production Gates

- Owner approval for schema, persistence, route, and planner policy.
- Supabase migration and RLS/Data API plan after RP-DB gates.
- Storage/upload lifecycle for real media attachments.
- Real planner/edit-plan repository boundary and approval gates.
- Provider/model policy for any Qwen/DeepSeek or future reasoning runtime.
- Worker/render/export/progress/credit pipeline gates.
- Monitoring, privacy/legal review, rollback, and recovery plans.

## Recommended Next Milestone

After verification and owner review, use `RP-EDITBRIEF-16 — Production Persistence Implementation Plan` only after RP-EDITBRIEF-15 owner inputs are supplied in the RP-EDITBRIEF-15A intake template and RP-EDITBRIEF-15B evaluates that intake as ready. RP-EDITBRIEF-13 reconciled the Supabase persistence roots, RP-EDITBRIEF-14 converted blanket blockers into computed readiness gates, RP-EDITBRIEF-15 records the missing owner/operator evidence, RP-EDITBRIEF-15A supplies the concrete intake shape, RP-EDITBRIEF-15B adds the executable readiness check, RP-EDITBRIEF-15C names the owner assignment evidence needed to complete the gate, RP-EDITBRIEF-15D adds a local validation command for filled evidence files, RP-EDITBRIEF-15E adds the strict PR diff gate for the reviewed evidence update, RP-EDITBRIEF-15F adds schema validation before readiness/safety evaluation, and RP-EDITBRIEF-15G adds a safe draft generator for external owner collection. Do not jump from these gates to production enablement without the named evidence, a schema-valid intake, a safety-clean validation result, and a passing readiness result.

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
