# Supabase Function Search Path Schema Qualification Checklist

This checklist defines the review requirements for a future function search-path migration candidate. Prompt 26F does not execute the checklist against live Supabase and does not change function definitions.

Checklist status: `schema_qualification_planned`.
Supabase update status: docs_only.
SQL executed: none.

## Checklist

| Check | Requirement | Prompt 26F status |
| --- | --- | --- |
| Function source captured | A future prompt must capture the function body from source-controlled migration material or approved read-only evidence. | Missing. |
| Signature preserved | Function name, argument types, parameter names, return type, security mode, volatility, owner expectations, and grants must remain unchanged unless separately approved. | Planned. |
| Fixed search path chosen | Prefer fixed empty search path plus fully qualified references. If a minimal schema list is required, document each schema and why. | Planned. |
| Table references qualified | Every table/view reference must include schema, such as `public.<table>` or another reviewed schema. | Planned. |
| Helper function references qualified | Helper function calls must include schema where possible. | Planned. |
| Type references qualified | Custom types and extension objects must be schema-qualified or explicitly justified. | Planned. |
| Auth references qualified | Auth schema references must be explicit when used. | Planned. |
| Trigger behavior preserved | Trigger helper functions must preserve trigger variable usage and mutation semantics. | Planned. |
| RLS dependency reviewed | Functions used in policies must preserve `anon`, `authenticated`, and backend/service-role behavior expectations. | Planned. |
| Grants unchanged | No grant or owner change is part of the search-path-only remediation candidate. | Planned. |
| Rollback prepared | Future candidate must include a rollback/restoration packet based on prior function definitions. | Planned. |

## Function Coverage

The checklist applies to: `can_claim_worker_job`, `can_start_generation`, `prevent_approved_plan_snapshot_immutable_update`, `can_run_job`, `can_create_approved_plan_snapshot`, `active_worker_claim_exists`, `e2e_jsonb_has_secret_like_content`, `e2e_assert_safe_json`, and `e2e_json_contains_secret_marker`.

## Non-Execution Rule

Do not run Supabase lifecycle commands, raw `psql`, SQL, migrations, Google Cloud, Secret Manager, providers, tools, workers, rendering, storage transfer, credit mutation, Stripe, deployment, telemetry, staging approval, or beta/production unlocks for Prompt 26F.
