# Supabase SECURITY DEFINER Invoker Decision Contract

Invoker decision contract status: `security_definer_invoker_decision_planned`.
Supabase update status: docs_only.
Function altered: no.
SQL executed: none.
Migration deployed: no.

## Decision Principles

Supabase function guidance defaults to `SECURITY INVOKER`, but a future ReeditPro remediation prompt must not convert SECURITY DEFINER helpers casually. Each conversion must prove that the function still behaves correctly under the invoking role and does not break RLS policies, triggers, or backend-only service paths.

Future decisions must preserve:

- function name and argument types;
- parameter names when PostgreSQL replacement rules require them;
- return type;
- volatility;
- owner expectations;
- trigger semantics;
- RLS helper semantics;
- fixed `search_path` and schema-qualified references when body evidence supports it.

## Function Decision Matrix

| Function | Current planning classification | SECURITY INVOKER candidate? | Decision blocker |
| --- | --- | --- | --- |
| `has_workspace_role` | `authenticated_only` | Possible only after policy behavior tests. | Need body, grants, and RLS policy dependency evidence. |
| `is_workspace_owner_or_admin` | `authenticated_only` | Possible only after policy behavior tests. | Need body, owner/admin source, and policy dependency evidence. |
| `is_workspace_owner_record` | `authenticated_only` | Possible only after policy behavior tests. | Need low-confidence classification review. |
| `set_updated_at` | `private_schema_candidate` | Possible if trigger behavior is unaffected. | Need trigger dependency and owner evidence. |
| `can_export_render` | `needs_human_review` | Unknown. | Need body and backend route dependency evidence. |
| `is_project_editor` | `authenticated_only` | Possible only after policy behavior tests. | Need project-role source and RLS dependency evidence. |
| `is_project_member` | `authenticated_only` | Possible only after policy behavior tests. | Need project membership source and direct RPC evidence. |

## Non-Execution Boundary

Prompt 26G does not convert any function to SECURITY INVOKER, does not preserve SECURITY DEFINER through an active migration, does not execute SQL, and does not approve staging execution.
