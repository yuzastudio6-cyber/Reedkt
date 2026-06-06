# Supabase SECURITY DEFINER Staging Evidence Requirements

Staging evidence status: `evidence_required`.
Prompt 23 state on this base: `pending_human_approval`.
Supabase update status: docs_only.
SQL executed: none.
Migration deployed: no.
Staging validation run: no.
Production readiness approved: no.

## Required Evidence Before Staging

Future staging validation for SECURITY DEFINER remediation requires:

- accepted redacted project identity evidence;
- Secret Manager reference metadata evidence, with no values;
- approved PR and commit for the future local candidate;
- approved test set and fixture plan;
- cleanup and rollback owner;
- function definition evidence for every function;
- current grant evidence for `anon`, `authenticated`, and backend/service-role paths;
- RLS policy dependency evidence;
- trigger dependency evidence for trigger helpers;
- no raw keys, no service-role values, no JWT secrets, no database passwords, no signed URLs, and no raw connection strings.

## Function Evidence Matrix

| Function | Required evidence |
| --- | --- |
| `has_workspace_role` | Body, signature, grants, workspace policy references, authenticated caller need. |
| `is_workspace_owner_or_admin` | Body, signature, grants, owner/admin source, policy references. |
| `is_workspace_owner_record` | Body, signature, grants, owner-record semantics, direct caller inventory. |
| `set_updated_at` | Body, signature, trigger dependency, grants, timestamp behavior expectations. |
| `can_export_render` | Body, signature, grants, backend route/RPC use, export readiness dependency. |
| `is_project_editor` | Body, signature, grants, project editor source, policy references. |
| `is_project_member` | Body, signature, grants, project membership source, direct caller inventory. |

## Staging Blockers

- Prompt 23 remains `pending_human_approval` on this base.
- Prompt 24D accepted evidence is missing.
- Secret Manager references are not verified.
- Future local candidate and local validation are not complete.
- No staging target, PR, commit, test set, fixture plan, rollback owner, or cleanup owner is approved for execution.

Prompt 26G does not approve staging SQL, staging Supabase execution, production readiness, or beta unlock.
