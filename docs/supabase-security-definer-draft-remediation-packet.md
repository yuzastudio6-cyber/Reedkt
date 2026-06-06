# Supabase SECURITY DEFINER Draft Remediation Packet

Prompt 26C records a future review packet for SECURITY DEFINER helper exposure. Prompt 26G adds a concrete migration-plan package and records `security_definer_exposure_migration_plan_created`. No function, grant, owner, security mode, or schema is changed in Prompt 26C. No function, grant, owner, security mode, or schema is changed in Prompt 26G.

## Status

- Draft status: `draft_only`.
- Prompt 26G planning status: `security_definer_exposure_migration_plan_created`.
- Function/grant hardening applied: no.
- SQL executed: none.
- Active migration created: no.
- Supabase environment touched: none.

## Functions For Future Review

| Function | Draft concern | Future review direction |
| --- | --- | --- |
| `has_workspace_role` | Broad callable helper can expose role checks if grants are loose. | Prompt 26G classification: `authenticated_only`; review body, schema qualification, caller roles, and whether execute should be limited. |
| `is_workspace_owner_or_admin` | Workspace ownership helper can become an RLS bypass if body is permissive. | Prompt 26G classification: `authenticated_only`; preserve semantics, review grants, and confirm workspace membership source. |
| `is_workspace_owner_record` | Ownership helper may expose owner record behavior. | Prompt 26G classification: `authenticated_only`; confirm inputs, return type, and caller roles before changing grants. |
| `set_updated_at` | Trigger helper may not need public execute grants. | Prompt 26G classification: `private_schema_candidate`; remove broad execute only if trigger use remains unaffected. |
| `can_export_render` | Runtime/export helper can expose approval or render readiness. | Prompt 26G classification: `needs_human_review`; review body and execution roles before use in policies. |
| `is_project_editor` | Project helper can become an RLS bypass if editor role check is too broad. | Prompt 26G classification: `authenticated_only`; review project/workspace join and grants. |
| `is_project_member` | Project membership helper can expose membership status. | Prompt 26G classification: `authenticated_only`; review body, grants, and search path before policy use. |

## Draft Grant Direction

Future remediation should classify each function:

- Keep SECURITY DEFINER with restricted execute grants.
- Convert to SECURITY INVOKER only if policy semantics remain correct.
- Revoke broad execute from anonymous and normal authenticated roles if the function is internal-only.
- Preserve trigger-only functions for triggers while removing unnecessary direct execute.
- Add explicit schema qualification and fixed search path in the paired search-path remediation prompt.

## Blockers

- Function bodies and current grants need accepted evidence or local schema inspection in a future approved prompt.
- Grant changes can break RLS helpers if reviewed too casually.
- Prompt 23 remains `pending_human_approval`.
- Prompt 24D accepted evidence is missing.

## Draft Sketch

Review-only grant sketch: `docs/draft-sql/supabase-advisor-remediation/security-definer-grants-draft.sql.md`.

## Prompt 26G Planning Files

- `docs/supabase-security-definer-exposure-migration-plan.md`
- `docs/supabase-security-definer-function-classification.md`
- `docs/supabase-security-definer-grant-review-contract.md`
- `docs/supabase-security-definer-invoker-decision-contract.md`
- `docs/supabase-security-definer-future-test-matrix.md`
- `docs/supabase-security-definer-rollback-cleanup-plan.md`
- `docs/supabase-security-definer-staging-evidence-requirements.md`

Prompt 26G remains planning only; no grant, revoke, function alteration, SQL execution, active migration, Supabase environment touch, staging validation, production readiness, or beta unlock is enabled.
