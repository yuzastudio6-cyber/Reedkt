# Supabase Milestone Ledger Contract

This contract defines the future append-only ledger shape for recording Supabase milestone/update state. It is a draft contract only. Prompt 23S does not create a table, run a migration, write records, or backfill historical rows.

## Ledger Principles

- Append-only by default; corrections should create a new event.
- Evidence references point to repo docs, PRs, CI runs, or redacted external evidence records.
- Human approvals must identify a human owner outside AI-generated prose.
- No AI-created production approval is valid.
- No staging update is valid without human approval and execution-time gates.
- No production update is valid without staging evidence and production approval.
- No row may store secrets, service-role keys, signed URLs, provider keys, Stripe keys, JWT secrets, full connection strings, or private media URLs.

## Future Record Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `milestoneId` | text | yes | Stable milestone identifier, for example `prompt-23s`. |
| `promptId` | text | yes | Prompt number or prompt label. |
| `promptName` | text | yes | Human readable milestone name. |
| `milestoneCategory` | text | yes | `docs`, `local_validation`, `staging_approval`, `staging_execution`, `production_candidate`, or `production_execution`. |
| `repoBranch` | text | yes | Branch that produced the evidence. |
| `prNumber` | text | no | Pull request number when available. |
| `commitSha` | text | no | Commit that produced or updated the record. |
| `validationStatus` | text | yes | Static/local validation status. |
| `ciStatus` | text | no | GitHub Foundation Validation status. |
| `localEvidenceStatus` | text | yes | Local evidence state. |
| `localSupabaseStatus` | text | yes | Local Supabase state when applicable. |
| `localRlsStatus` | text | yes | Local RLS state when applicable. |
| `stagingApprovalStatus` | text | yes | Human approval state for staging. |
| `stagingSyncStatus` | text | yes | Whether staging was touched. |
| `stagingMigrationStatus` | text | yes | Staging migration validation state. |
| `stagingRlsStatus` | text | yes | Staging RLS validation state. |
| `productionApprovalStatus` | text | yes | Human approval state for production. |
| `productionSyncStatus` | text | yes | Whether production was touched. |
| `evidenceDocs` | jsonb | yes | Array of repo paths, PRs, CI URLs, or redacted evidence refs. |
| `blockerSummary` | text | no | Current blockers. |
| `rollbackPlanRef` | text | no | Rollback plan reference. |
| `cleanupPlanRef` | text | no | Cleanup plan reference. |
| `approvedBy` | text | no | Human owner, redacted if needed. |
| `approvedAt` | timestamptz | no | Human approval timestamp. |
| `environment` | text | yes | `none`, `local`, `staging`, or `production`. |
| `createdAt` | timestamptz | yes | Insert timestamp. |
| `updatedAt` | timestamptz | no | Present only for draft UI display; source of truth remains append-only events. |
| `auditEventRef` | text | no | Future audit event reference, not a secret. |

## Status Values

Allowed status vocabulary:

- `not_needed`
- `docs_only`
- `local_evidence_recorded`
- `pending_human_approval`
- `approved_for_staging_packet`
- `ready_for_staging_dry_run`
- `applied_to_staging`
- `validated_in_staging`
- `blocked`
- `rollback_required`
- `production_candidate`
- `approved_for_production`
- `applied_to_production`

Prompt 23S may use only `docs_only`, `local_evidence_recorded`, `pending_human_approval`, `blocked`, and `not_needed` for current repo state. It must not claim `ready_for_staging_dry_run`, `applied_to_staging`, `validated_in_staging`, `approved_for_production`, or `applied_to_production`.

## Future Write Gate

A future ledger write requires:

- canonical table and RLS approval;
- append-only write path;
- human owner for staging or production approvals;
- sanitized evidence references only;
- no service-role exposure in committed docs;
- no signed URL or private media evidence stored as source of truth.
