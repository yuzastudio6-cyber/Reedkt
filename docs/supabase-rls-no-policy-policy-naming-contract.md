# Supabase RLS No-Policy Policy Naming Contract

Prompt 26E defines future policy names for the six RLS-enabled/no-policy tables. This contract does not create policies, grants, migrations, or executable SQL.

## Status

- Policy naming contract status: `rls_no_policy_policy_names_defined`.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.
- Active RLS policy migration created: no.

## Naming Rules

- Use stable snake_case policy names.
- Include the table purpose, action, and access model.
- Use explicit action words: `select`, `insert`, `update`, `delete`.
- Avoid names that imply production readiness, public access, or runtime enablement.
- Preserve role-specific policy thinking for `anon`, `authenticated`, and `service_role`.

## Future Policy Names

| Table | SELECT policy name | INSERT policy name | UPDATE policy name | DELETE policy name | Backend/service-role expectation |
| --- | --- | --- | --- | --- | --- |
| `activation_artifacts` | `activation_artifacts_select_backend_only` | `activation_artifacts_insert_backend_only` | `activation_artifacts_update_backend_only` | `activation_artifacts_delete_backend_only` | Backend service only; no raw client read/write. |
| `activation_qa_gates` | `activation_qa_gates_select_backend_only` | `activation_qa_gates_insert_backend_only` | `activation_qa_gates_update_backend_only` | `activation_qa_gates_delete_backend_only` | Backend service only; redacted summaries need separate contract. |
| `activation_runs` | `activation_runs_select_backend_only` | `activation_runs_insert_backend_only` | `activation_runs_update_backend_only` | `activation_runs_delete_backend_only` | Backend service only; raw run state remains hidden. |
| `feature_gates` | `feature_gates_select_no_client_access` | `feature_gates_insert_backend_only` | `feature_gates_update_backend_only` | `feature_gates_delete_backend_only` | No raw client access; safe summaries require future route review. |
| `readiness_snapshots` | `readiness_snapshots_select_backend_only` | `readiness_snapshots_insert_backend_only` | `readiness_snapshots_update_backend_only` | `readiness_snapshots_delete_backend_only` | Backend service only; immutability and redaction need review. |
| `tool_capabilities` | `tool_capabilities_select_no_client_access` | `tool_capabilities_insert_backend_only` | `tool_capabilities_update_backend_only` | `tool_capabilities_delete_backend_only` | No raw client access; static catalog requires non-secret field review. |

## Future Review Notes

- If a later prompt approves project/workspace-scoped reads, policy names must be revised before SQL is created.
- Static catalog visibility for `tool_capabilities` must not imply that tools, providers, workers, render/export, or beta features are production-enabled.
- Any service-role or backend-only policy must be paired with backend boundary evidence and must not be exposed to frontend code.

## Prompt 26E-1 local candidate update

Explicit deny policy names prepared as local candidate in `supabase/migrations/202606060001_rls_no_policy_advisor_remediation.sql`. The Prompt 26E-1 candidate uses the names in this contract only for `anon` and `authenticated` deny policies and does not add grants, service-role policies, positive read policies, or public/authenticated writes.
