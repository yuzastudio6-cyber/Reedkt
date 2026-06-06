# Supabase SECURITY DEFINER Exposure Migration Plan

Prompt 26G creates a draft-only migration plan for SECURITY DEFINER exposure advisor findings supplied in Prompt 26A. It does not inspect live Supabase function definitions, does not create an active migration, does not change grants, and does not alter any function.

SECURITY DEFINER exposure migration plan status: `security_definer_exposure_migration_plan_created`.
Supabase update required: docs/status only.
Supabase update status: docs_only.
Supabase environment touched: none.
SQL executed: none.
Migration deployed: no.
Grant/revoke executed: no.
Function altered: no.
Active migration files changed: no.
Production capability enabled: none; SECURITY DEFINER exposure migration plan only.

## Sources

- Prompt 26A supplied connected read-only advisor findings for a redacted Supabase project.
- Supabase Performance and Security Advisors include `anon security definer function executable` and `authenticated security definer function executable` checks.
- Supabase database function guidance defaults to `SECURITY INVOKER`, uses `SECURITY DEFINER` only when required, and recommends fixed `search_path` plus schema-qualified references.
- Supabase RLS guidance remains relevant because helper functions can become RLS dependencies; exposed-schema behavior must be role-scoped for `anon`, `authenticated`, and backend/service-role paths.

## In Scope

The plan covers exactly these connected-advisor functions:

| Function | Conservative classification | Confidence | Future migration posture |
| --- | --- | --- | --- |
| `has_workspace_role` | `authenticated_only` | Medium | Review body and grants, preserve authenticated policy-helper access only if required, and block anonymous direct execution. |
| `is_workspace_owner_or_admin` | `authenticated_only` | Medium | Review workspace membership source, preserve policy-helper semantics only if required, and block anonymous direct execution. |
| `is_workspace_owner_record` | `authenticated_only` | Low | Review inputs, return type, body, grants, and policy dependencies before changing direct execute behavior. |
| `set_updated_at` | `private_schema_candidate` | High | Treat as trigger-helper candidate; remove direct client execute only after trigger behavior is preserved. |
| `can_export_render` | `needs_human_review` | Low | Review route/backend usage and body evidence before deciding between authenticated helper access and private/backend-only access. |
| `is_project_editor` | `authenticated_only` | Medium | Review project/workspace joins, policy dependencies, grants, and anonymous denial. |
| `is_project_member` | `authenticated_only` | Medium | Review direct RPC exposure, policy usage, project membership source, and anonymous denial. |

## Future Migration Rules

Future remediation must:

- Preserve function names, argument types, parameter names, return types, volatility, language, owner expectations, security mode, and policy dependencies unless a later reviewed prompt approves a change.
- Review existing grants before any future `REVOKE EXECUTE` or `GRANT EXECUTE` statement.
- Revoke anonymous direct execution only when body evidence and policy dependency review show it is safe.
- Preserve authenticated direct execution only for functions proven to be policy or RPC dependencies.
- Prefer `SECURITY INVOKER` only when behavior tests show the function does not require definer privileges.
- Keep service-role material backend-only and browser-inaccessible.
- Pair grant/security-mode changes with fixed search-path/schema-qualification evidence from the Prompt 26F workstream when the function body requires it.

## Required Future Gates

Prompt 26G does not satisfy these gates:

| Gate | Required before execution | Prompt 26G status |
| --- | --- | --- |
| Function source evidence | Capture reviewed function definitions, signatures, security modes, owners, grants, and dependencies with secrets redacted. | Missing. |
| Grant dependency review | Confirm `anon`, `authenticated`, and backend/service-role callers for each function. | Planned only. |
| Policy dependency review | Identify RLS policies, triggers, routes, or RPC clients that rely on each helper. | Planned only. |
| Local migration candidate | Create an active local candidate in a future prompt. | Not created. |
| Local validation | Run local migration chain and behavior tests only when local safety gates pass. | Not run. |
| Accepted Supabase evidence | Review redacted evidence files and Secret Manager reference metadata. | Missing. |
| Human approval | Complete the human approval path for staging execution. | Prompt 23 remains `pending_human_approval` on this base. |
| Staging validation | Run only after approval, accepted evidence, approved PR/commit/test set, fixture plan, and rollback/cleanup gates pass. | Not run. |

## Handoff

Cross-chat owner remains `SUPABASE_RLS_STORAGE_DATABASE`. Related workstreams receive this as a planning handoff only: `WORKER_RUNTIME_JOBS`, `PROVIDER_GATEWAY_MODELS`, `AI_TOOLS_CREATIVE_GRAPHICS`, `SOUND_MUSIC_AUDIO`, `MAP_GEOSPATIAL`, `TRACK_A_RENDER_EXPORT`, `OBSERVABILITY_AUDIT_COST`, and `COMPLIANCE_SECURITY`.

## Next Prompt

Recommended next prompt: `Prompt 26G-1 - SECURITY DEFINER Local Migration Candidate` if grant/function hardening proceeds, or `Prompt 26H - FK Index Hardening Migration Plan` if FK advisor planning is prioritized.
