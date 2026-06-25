# RP-DATA-01 RLS And Storage Readiness

Decision: `completed_schema_migration_readiness_review_ready_for_migration_safety_packet`

RLS readiness: `review_ready_not_applied`

Storage readiness: `review_ready_not_applied`

## RLS Principles

- Enable RLS on tables in exposed schemas.
- Use workspace/project membership predicates for row access.
- Avoid broad `TO authenticated` policies without ownership or membership predicates.
- Do not use user-editable metadata for authorization decisions.
- Users cannot update approved snapshots directly.
- Users cannot directly write worker-only tables, credit ledger/reservation rows, worker events, generated artifacts, QA reports, or final export state.
- Service-role writes must remain backend-only and scoped to named operations.
- Audit events are append-only.

## Storage Buckets

| Bucket | Access Model | Internal Beta Readiness |
| --- | --- | --- |
| `source-media` | private | `review_ready_not_applied` |
| `generated-assets` | private | `review_ready_not_applied` |
| `processed-media` | private | `review_ready_not_applied` |
| `previews` | private | `review_ready_not_applied` |
| `exports` | private | `review_ready_not_applied` |
| `thumbnails` | private | `review_ready_not_applied` |
| `qa-artifacts` | private | `review_ready_not_applied` |
| `worker-temp` | private, short TTL | `review_ready_not_applied` |

## Storage Policy Direction

No bucket should be public by default. Source media, generated assets, previews, exports, thumbnails, QA artifacts, and worker temporary files can expose private project content.

Future bucket policies must distinguish:

- user upload of source media through app-approved paths;
- worker writes of generated, processed, preview, export, thumbnail, QA, and temp artifacts;
- project-member reads through backend-mediated or scoped signed URL access;
- no durable signed URL source-of-truth;
- cleanup and retention by artifact role.

## Not Applied In This Phase

This phase does not create buckets, run SQL, deploy RLS, create policies, upload files, access private media, create signed URLs, or touch a Supabase environment.
