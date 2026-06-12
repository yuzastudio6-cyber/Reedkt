# Prompt Start Checklist

Status: `docs_only`.

Every future prompt should answer these before code or docs changes begin.

| Check | Required answer |
| --- | --- |
| Workstream owner | Registry workstream ID and owner chat. |
| Cross-chat boundaries checked | Yes/no plus relevant boundary docs. |
| Owned files/contracts | Files and contracts this prompt may change. |
| Not-owned files/contracts | Files and contracts this prompt must not change without handoff. |
| Dependencies | Upstream prompts, PRs, evidence, packages, services, or credentials. |
| Duplicate-risk check | Searches run and existing surfaces found. |
| Supabase update classification | `none`, `docs_only`, `schema_plan`, `migration_candidate`, `read_only_audit`, `milestone_sync`, or `runtime_write`. |
| GCP Secret Manager rule | Required only if secrets are involved; secret values must never be printed, logged, committed, or exposed. |
| Runtime scope | State whether runtime/tool/provider/worker/render/Supabase/Stripe/GCP execution is blocked or explicitly approved. |
| Final handoff expected | Target workstream, artifact type, and next prompt owner. |

XCHAT-0 classification: Supabase update `docs_only`; runtime scope blocked.
