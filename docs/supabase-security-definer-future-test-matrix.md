# Supabase SECURITY DEFINER Future Test Matrix

Future test matrix status: `security_definer_future_tests_planned`.
Supabase update status: docs_only.
SQL executed: none.
Migration deployed: no.
Local SQL run: no.
Staging SQL run: no.

## Test Rules

Future tests must be role-scoped and must separate `anon`, `authenticated`, and backend/service-role behavior. Tests may run only after an active local candidate exists, local safety gates pass, and staging gates are complete for any staging run.

| Function | Future local catalog test | Future local behavior test | Future staging evidence |
| --- | --- | --- | --- |
| `has_workspace_role` | Confirm grants and security mode. | Confirm anonymous denial and authenticated policy-helper behavior. | Redacted grants, policy references, and pass/fail evidence. |
| `is_workspace_owner_or_admin` | Confirm grants and security mode. | Confirm anonymous denial and authenticated owner/admin checks. | Redacted grants, policy references, and pass/fail evidence. |
| `is_workspace_owner_record` | Confirm grants and security mode. | Confirm anonymous denial and authenticated owner-record semantics. | Redacted grants, policy references, and pass/fail evidence. |
| `set_updated_at` | Confirm trigger function grants and dependencies. | Confirm trigger still updates timestamps after direct execute is restricted. | Redacted trigger dependency and pass/fail evidence. |
| `can_export_render` | Confirm grants and security mode. | Confirm only approved caller roles can evaluate export readiness. | Redacted route/RPC dependency and pass/fail evidence. |
| `is_project_editor` | Confirm grants and security mode. | Confirm anonymous denial and authenticated project editor behavior. | Redacted grants, policy references, and pass/fail evidence. |
| `is_project_member` | Confirm grants and security mode. | Confirm anonymous denial and authenticated project membership behavior. | Redacted grants, policy references, and pass/fail evidence. |

## Blocked Test Types

Prompt 26G does not run local SQL, staging SQL, raw `psql`, Supabase lifecycle commands, Google Cloud calls, Secret Manager calls, provider/tool/worker/render/storage/credit/Stripe paths, telemetry, deployment, production readiness, or beta unlock.
