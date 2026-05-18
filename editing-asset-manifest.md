# Editing Asset Manifest

## Purpose

The editing asset manifest prevents context loss. Every generated, processed, placeholder, or final-output asset planned by the execution graph should be traceable back to the approved plan, work item, prompt/tool, segment, timing cue, renderer layer, QA status, and fallback relationship.

This milestone creates mock manifest entries only. It does not generate, upload, store, render, or process real assets.

## Asset Lifecycle

Manifest lifecycle statuses:

- `planned`
- `queued`
- `generating`
- `processing`
- `ready`
- `merged`
- `qa_pending`
- `qa_passed`
- `qa_failed`
- `fallback_requested`
- `replaced`
- `archived`
- `failed`

## Asset Lineage

Each manifest item should track:

- asset ID
- parent work item ID
- generation request ID when future workers exist
- provider model or open-source tool
- prompt plan ID
- source clip or visual asset plan item
- linked segment IDs
- linked timing cue IDs
- linked renderer layer IDs
- fallback parent or replacement relationship
- version
- QA status and QA notes
- metadata and execution notes

## Storage

The manifest supports future storage providers:

- Google Cloud Storage
- Supabase Storage for controlled testing if approved
- external provider temporary URLs
- local mock paths
- unknown/pending storage

RP-AGENT-01 uses `local_mock` only. No storage operation is performed.

## Merge Into Timeline

An asset is not done simply because a provider or tool returns something. It is only ready for downstream work after it is stored, represented in the manifest, linked to the correct segment/timing/layer, QA status is known, and dependent work items are unblocked.

Final render waits for required manifest assets and QA. Browser-safe previews may use explicit placeholder dependencies, but final export may not.

## Non-Goals

This milestone does not implement real asset storage, real provider requests, real media files, real manifest persistence, backend tables, cloud buckets, or render outputs.
## RP-AGENT-02 Merge/Reconciliation

Every manifest item should have a matching asset merge plan and version reconciliation record when the async reconciliation layer is present.

An asset is not complete until it is:
- tracked in the manifest,
- connected to its source work item,
- linked to segment/timing/renderer targets,
- QA-checked,
- versioned,
- reconciled with fallback/replacement state,
- used only after dependencies unblock downstream work.

Preview placeholders are tracked separately from final assets. Final render cannot use placeholders for required assets.

This document remains a planning contract only; no real storage, provider status check, worker event, or rendering is implemented in the frontend mock.

## RP-AGENT-03 Asset QA/Fallback

Every manifest item can link to Agent QA gate checks, failure scenarios, and fallback decisions.

Assets should not merge into required final renderer layers after failed QA unless an approved fallback or user-reviewed recovery path resolves the failure. Optional local asset failures can be isolated so independent work continues.

No real asset QA, retry, fallback, storage, rendering, provider call, or worker execution is implemented in the frontend mock.
