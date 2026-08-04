# Storage Upload Schema Audit

## Existing Tables Found

Active RP-DATA-04 migrations provide these storage-aware tables:

- `media_assets`: project-scoped media metadata with `storage_bucket`, `storage_path`, `file_name`, `mime_type`, `duration_seconds`, `width`, `height`, `size_bytes`, `status`, and `metadata_json`.
- `uploaded_clips`: source clip records tied to `media_assets`, with `uploaded_order`, notes, importance flags, and status.
- `source_sequence_items`: active source-order confirmation records for uploaded clips.
- `generated_assets`: generated output placeholders with `storage_bucket`, `storage_path`, dimensions, duration, status, and metadata.
- `generated_asset_versions`: generated asset version storage paths.
- `final_exports`: final export placeholders with `storage_bucket`, `storage_path`, `export_format`, `aspect_ratio`, and status.
- `sfx_generated_assets`: SFX generated asset metadata with `storage_path`, duration, trim, hit, reuse, QA, and license fields.

Legacy broader migrations also define `reference_assets`, `source_clip_sequences`, richer `media_assets`, `renders`, and `exports` tables with workspace-level fields. The active RP-DATA-04 schema is the implementation target for RP-FIX-07.

## Storage Buckets Found

`202605180008_reeditpro_storage_buckets_policies.sql` creates private buckets:

- `source-media`
- `generated-assets`
- `processed-media`
- `previews`
- `exports`
- `thumbnails`
- `qa-artifacts`
- `worker-temp`

The active storage migration originally documented object paths as `<project_id>/...`. RP-FIX-07 now removes those permissive legacy policies and uses the application's canonical `workspaces/{workspaceId}/projects/{projectId}/...` path. The path workspace must match the project's stored workspace.

## Existing Upload Types

Existing TypeScript models already cover media, generated assets, renders, exports, SFX assets, and source sequence records. RP-FIX-07 adds `src/types/upload.ts` for upload purpose, validation, upload plans, storage operation results, and source upload flow results.

## Missing Or Partial Fields

- Active `media_assets` does not include `workspace_id`; project membership is resolved through `projects`.
- Active `final_exports` stores storage metadata but no full render record shape.
- Profile and brand assets do not have a dedicated table or bucket policy yet.
- Music track types do not yet carry storage metadata directly.
- `storage_object_records` does not yet have first-class GCS `generation`, `etag`, and `metageneration` columns. The hardened runtime preserves these in private `media_assets.metadata.storageObjectIdentity` and in runtime views, but the future canonical schema should add constrained columns before production migration.

## What The App Can Support Now

- Mock-safe upload validation.
- Bucket selection using active bucket names.
- Structured `workspaces/{workspaceId}/projects/{projectId}/...` storage paths with exact workspace/project binding plus bucket MIME and size limits.
- Mock media/reference/generated/audio/thumbnail records from upload plans.
- Source clip upload order preservation.

## What Still Requires Backend Runtime

- Deployed Supabase Storage buckets and tested RLS.
- Signed upload/download routes for private assets when browser RLS is insufficient.
- Backend worker writes for generated assets, previews, exports, QA artifacts, and temp files.
- Production profile/brand asset policy or signed upload support.
- Deployed GCS proof for create-only signed PUT replay rejection, generation-bound reads, exact-generation cleanup, lifecycle reconciliation, CORS, and least-privilege IAM.

## Runtime Boundary Hardening — 2026-07-10

The backend local raw-byte compatibility route is now non-production only and capped at 16 MiB with mandatory `Content-Length`, actual-byte, MIME, upload-intent size, concurrency, and rate checks. Production media uses the signed/direct object-storage target and does not buffer multi-gigabyte request bodies in Express.

Upload route authorization now precedes idempotency recording. Storage records without an upload intent must still resolve to an authorized workspace/project, while worker-temp objects are denied and processed/QA artifacts require explicit review delivery purposes.

See `docs/upload-storage-boundary-hardening-2026-07-10.md` for evidence and remaining production blockers. These source checks do not prove deployed bucket policies or live Supabase state.
