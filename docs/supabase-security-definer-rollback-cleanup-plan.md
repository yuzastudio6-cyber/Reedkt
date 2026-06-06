# Supabase SECURITY DEFINER Rollback And Cleanup Plan

Rollback plan status: `security_definer_rollback_requirements_defined`.
Supabase update status: docs_only.
Rollback executed: no.
Cleanup executed: no.
SQL executed: none.
Migration deployed: no.

## Rollback Requirements

Any future SECURITY DEFINER remediation must include a rollback plan that restores the exact prior function signatures, security modes, grants, owners where relevant, and trigger/policy dependencies. Prompt 26G defines the requirements only; it does not create executable rollback SQL.

| Function | Required rollback evidence | Cleanup requirement |
| --- | --- | --- |
| `has_workspace_role` | Prior grants, signature, security mode, policy dependencies. | Remove failed candidate artifacts and restore grants if needed. |
| `is_workspace_owner_or_admin` | Prior grants, signature, security mode, policy dependencies. | Restore helper behavior before retry. |
| `is_workspace_owner_record` | Prior grants, signature, security mode, direct caller inventory. | Restore low-confidence helper behavior before retry. |
| `set_updated_at` | Prior trigger dependency, grants, signature, security mode. | Restore trigger behavior and timestamp updates. |
| `can_export_render` | Prior route/RPC dependency, grants, signature, security mode. | Restore export-readiness helper behavior. |
| `is_project_editor` | Prior grants, signature, security mode, policy dependencies. | Restore project editor checks. |
| `is_project_member` | Prior grants, signature, security mode, direct caller inventory. | Restore project member checks. |

## Future Rollback Gates

- Rollback SQL must be reviewed in a future prompt before execution.
- Rollback must be tested locally before staging.
- Staging rollback requires human approval, accepted evidence, approved PR/commit, and cleanup ownership.
- No production rollback is approved by Prompt 26G.

## Non-Execution Boundary

Prompt 26G does not run rollback, cleanup, SQL, Supabase commands, grants, revokes, function changes, staging validation, or production validation.
