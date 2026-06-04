# Supabase Status Record Schema Draft

This is a draft-only schema concept for future milestone/update status records. It is not a migration and must not be applied by Prompt 23S.

## Draft Tables

### `supabase_milestone_events`

Append-only milestone status events.

| Column | Purpose |
| --- | --- |
| `id` | UUID primary key. |
| `milestone_id` | Stable prompt/milestone key. |
| `prompt_id` | Prompt label. |
| `event_type` | `repo_status`, `local_evidence`, `staging_approval`, `staging_execution`, `production_candidate`, or `production_execution`. |
| `status` | Status from the ledger contract. |
| `environment` | `none`, `local`, `staging`, or `production`. |
| `branch_name` | Repo branch. |
| `pr_number` | PR reference. |
| `commit_sha` | Commit reference. |
| `evidence_refs` | Sanitized JSON evidence references. |
| `blockers` | Sanitized blocker summary. |
| `created_by` | Future user/service identity. |
| `created_at` | Insert timestamp. |

### `supabase_update_runs`

Records approved staging or production update attempts.

| Column | Purpose |
| --- | --- |
| `id` | UUID primary key. |
| `milestone_event_id` | Reference to milestone event. |
| `environment` | `staging` or `production`. |
| `run_status` | `planned`, `started`, `blocked`, `passed`, `failed`, or `rollback_required`. |
| `approved_by` | Human owner reference. |
| `started_at` | Run start timestamp. |
| `completed_at` | Run completion timestamp. |
| `redacted_evidence_refs` | Sanitized evidence references only. |

### `supabase_validation_evidence`

Stores sanitized evidence metadata, not secrets or raw connection details.

| Column | Purpose |
| --- | --- |
| `id` | UUID primary key. |
| `update_run_id` | Reference to update run when applicable. |
| `evidence_type` | `ci`, `local_rls`, `staging_rls`, `migration`, `cleanup`, `rollback`, or `manual_review`. |
| `evidence_ref` | Repo path, PR URL, CI URL, or redacted external reference. |
| `is_redacted` | Must be true for environment evidence. |
| `created_at` | Insert timestamp. |

### `supabase_environment_snapshots`

Future sanitized environment snapshots.

| Column | Purpose |
| --- | --- |
| `id` | UUID primary key. |
| `environment` | `local`, `staging`, or `production`. |
| `status` | `not_checked`, `ready`, `blocked`, or `validated`. |
| `sanitized_summary` | No secrets, no full URLs, no project secrets. |
| `created_at` | Insert timestamp. |

## Draft RLS Direction

- Workspace/project users do not read internal Supabase milestone operations by default.
- Maintainers may read sanitized milestone status.
- Append-only writes require a future scoped backend path.
- Production approval writes require human approval evidence.
- No service-role broad handler should be exposed to frontend routes.

## Prompt 23S Status

No schema-changing migration is created. No table is applied. No record is written.
