# Storage Validation Boundary

Packet: `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1`

Decision: `blocked_pending_named_supabase_target_rls_storage_validation`

Storage validation: `not_run`

Storage bucket source status: `draft_review_only`

Public artifact creation: `false`

Signed URL creation: `false`

## Source Review

The current storage draft requires private buckets for:

- `source-media`
- `generated-assets`
- `processed-media`
- `previews`
- `exports`
- `thumbnails`
- `qa-artifacts`
- `worker-temp`

The draft keeps source media, generated assets, previews, exports, thumbnails, QA artifacts, and worker temp private by default. Future reads should be backend-mediated or signed only after a separate explicit private artifact access gate.

## Required Future Validation

Future guarded validation must prove:

- private bucket creation/readback on the named target;
- no public bucket policy for source, generated, processed, preview, export, thumbnail, QA, or temp artifacts;
- `storage.objects` RLS policies match bucket and path ownership;
- upsert behavior has the required `INSERT`, `SELECT`, and `UPDATE` policies when used;
- worker-temp objects are not durable user-facing artifacts;
- signed URL creation remains disabled until the private artifact access gate.

## Current Status

No bucket, object, signed URL, public artifact, or storage policy was created or read in this phase.
