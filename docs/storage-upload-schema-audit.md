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

The active storage migration originally documented object paths as `<project_id>/...`. RP-FIX-07 adds a local readiness migration for `workspace/{workspaceId}/project/{projectId}/...` paths.

## Existing Upload Types

Existing TypeScript models already cover media, generated assets, renders, exports, SFX assets, and source sequence records. RP-FIX-07 adds `src/types/upload.ts` for upload purpose, validation, upload plans, storage operation results, and source upload flow results.

## Missing Or Partial Fields

- Active `media_assets` does not include `workspace_id`; project membership is resolved through `projects`.
- Active `final_exports` stores storage metadata but no full render record shape.
- Profile and brand assets do not have a dedicated table or bucket policy yet.
- Music track types do not yet carry storage metadata directly.

## What The App Can Support Now

- Mock-safe upload validation.
- Bucket selection using active bucket names.
- Structured storage paths with workspace and project ids.
- Mock media/reference/generated/audio/thumbnail records from upload plans.
- Source clip upload order preservation.

## What Still Requires Backend Runtime

- Deployed Supabase Storage buckets and tested RLS.
- Signed upload/download routes for private assets when browser RLS is insufficient.
- Backend worker writes for generated assets, previews, exports, QA artifacts, and temp files.
- Production profile/brand asset policy or signed upload support.
