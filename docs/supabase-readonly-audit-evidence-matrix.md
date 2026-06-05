# Supabase Read-Only Audit Evidence Matrix

Current evidence status: `evidence_required`.

Current redaction status: `not_applicable_no_evidence`.

Current audit status: `evidence_required`.

Template files created: yes.

Prompt 24B found no counted redacted evidence files in the allowed evidence paths. `docs/supabase-readonly-audit-evidence/README.md` exists, but it is an instruction file only and is not counted as evidence. Prompt 24C adds templates and exact requested filenames; templates are instruction files only and are not counted as supplied evidence. Every category remains `missing`.

| Category | Required | Required evidence file | Template created? | Current status | Redaction status | Blocker | Human/operator next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project identity | yes | `docs/supabase-readonly-audit-evidence/project-identity-redacted.md` | yes | `missing` | `not_applicable_no_evidence` | Redacted project identity evidence is missing. | Fill `templates/project-identity-redacted.template.md` without secrets. |
| Project access | yes | `docs/supabase-readonly-audit-evidence/project-identity-redacted.md` | yes | `missing` | `not_applicable_no_evidence` | Redacted access or role evidence is missing. | Include redacted access summary in the project identity evidence file. |
| Database migrations | yes | `docs/supabase-readonly-audit-evidence/database-migrations-redacted.md` | yes | `missing` | `not_applicable_no_evidence` | Redacted migration history evidence is missing. | Fill `templates/database-migrations-redacted.template.md` without SQL output or credentials. |
| Database schema | yes | `docs/supabase-readonly-audit-evidence/database-schema-redacted.md` | yes | `missing` | `not_applicable_no_evidence` | Redacted schema inventory evidence is missing. | Fill `templates/database-schema-redacted.template.md` without row data. |
| RLS policies | yes | `docs/supabase-readonly-audit-evidence/rls-policies-redacted.md` | yes | `missing` | `not_applicable_no_evidence` | Redacted RLS policy evidence is missing. | Fill `templates/rls-policies-redacted.template.md` with policy names/state only. |
| Storage buckets | yes | `docs/supabase-readonly-audit-evidence/storage-buckets-redacted.md` | yes | `missing` | `not_applicable_no_evidence` | Redacted storage bucket evidence is missing. | Fill `templates/storage-buckets-redacted.template.md` with bucket state and no object secrets. |
| Storage policies | yes | `docs/supabase-readonly-audit-evidence/storage-buckets-redacted.md` | yes | `missing` | `not_applicable_no_evidence` | Redacted storage policy evidence is missing. | Include storage policy names/state in the storage bucket evidence file. |
| Auth settings | yes | `docs/supabase-readonly-audit-evidence/auth-settings-redacted.md` | yes | `missing` | `not_applicable_no_evidence` | Redacted auth setting evidence is missing. | Fill `templates/auth-settings-redacted.template.md`; crop key panels. |
| Edge functions | yes | `docs/supabase-readonly-audit-evidence/edge-functions-redacted.md` | yes | `missing` | `not_applicable_no_evidence` | Redacted edge function inventory evidence is missing. | Fill `templates/edge-functions-redacted.template.md` or record no-functions evidence. |
| Logs/activity | yes | `docs/supabase-readonly-audit-evidence/activity-summary-redacted.md` | yes | `missing` | `not_applicable_no_evidence` | Redacted dashboard activity/log evidence is missing. | Fill `templates/activity-summary-redacted.template.md` with summary only. |
| Milestone sync state | yes | `docs/supabase-readonly-audit-evidence/milestone-sync-state-redacted.md` | yes | `missing` | `not_applicable_no_evidence` | Redacted Supabase milestone sync evidence is missing. | Fill `templates/milestone-sync-state-redacted.template.md`; do not claim staging update. |
| Secret Manager reference metadata only | yes | `docs/supabase-readonly-audit-evidence/gcp-secret-manager-reference-metadata-redacted.md` | yes | `missing` | `not_applicable_no_evidence` | Redacted reference metadata evidence is missing. | Fill `templates/gcp-secret-manager-reference-metadata-redacted.template.md`; do not provide payloads. |

## Acceptance Rule

Do not mark this matrix `accepted`, `ready_for_staging_inventory_review`, or complete until every required category has a supplied redacted evidence file and the redaction diagnostic passes.

## Current Decision

- Evidence supplied: no.
- Prompt 24B evidence review status: `evidence_required`.
- Accepted evidence categories: none.
- Unsafe evidence detected: no.
- Audit completion claimed: no.
- Staging SQL approved: no.
- Production readiness approved: no.
- Beta unlock approved: no.
