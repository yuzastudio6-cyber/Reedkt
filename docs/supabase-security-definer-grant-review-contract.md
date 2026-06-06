# Supabase SECURITY DEFINER Grant Review Contract

Grant review contract status: `security_definer_grant_review_planned`.
Supabase update status: docs_only.
Grant/revoke executed: no.
SQL executed: none.
Migration deployed: no.

## Review Inputs Required

Every future grant decision must capture redacted, accepted evidence for:

- current function signature, owner, volatility, security mode, language, and search-path setting;
- current execute grants for `anon`, `authenticated`, backend/service-role paths, and any custom roles;
- RLS policy dependencies and whether policies call the helper through stable/cached forms;
- direct RPC/client usage;
- trigger usage;
- route/backend usage;
- rollback command shape and cleanup ownership.

## Function Grant Review Matrix

| Function | Default grant posture | Direct anon execute | Authenticated execute | Future review action |
| --- | --- | --- | --- | --- |
| `has_workspace_role` | Preserve only proven helper access. | Revoke candidate. | Preserve candidate if policy-dependent. | Review body, current grants, RLS policy references, and membership source. |
| `is_workspace_owner_or_admin` | Preserve only proven helper access. | Revoke candidate. | Preserve candidate if policy-dependent. | Review body, grants, and owner/admin source. |
| `is_workspace_owner_record` | Preserve only proven helper access. | Revoke candidate. | Preserve candidate if policy-dependent. | Review direct execute need and policy dependency. |
| `set_updated_at` | Trigger-only/private candidate. | Revoke candidate. | Revoke candidate unless direct execute is proven. | Preserve trigger behavior while removing unnecessary client execute. |
| `can_export_render` | Needs human review. | Revoke candidate. | Unknown until body/route evidence. | Confirm backend route and approval/export dependency before choosing grants. |
| `is_project_editor` | Preserve only proven helper access. | Revoke candidate. | Preserve candidate if policy-dependent. | Review body, grants, and project editor source. |
| `is_project_member` | Preserve only proven helper access. | Revoke candidate. | Preserve candidate if policy-dependent. | Review body, grants, and direct RPC exposure. |

## Future Execution Gate

No future prompt may run grant changes until local migration/test gates pass and staging execution gates are complete. Prompt 26G is review-only and does not approve any `REVOKE EXECUTE`, `GRANT EXECUTE`, function alteration, Supabase command, SQL execution, staging validation, or production readiness.
