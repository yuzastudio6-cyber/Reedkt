# Supabase RLS No-Policy Future Test Matrix

Prompt 26E defines future test requirements only. It does not create executable SQL tests and does not run SQL.

## Status

- Future test matrix status: `rls_no_policy_future_tests_planned`.
- Executable SQL tests created: no.
- SQL executed: none.
- Supabase environment touched: none.
- Migration deployed: no.

| Table | Anon denied | Auth non-member denied | Workspace member allowed | Project member allowed | Admin/backend allowed | Cross-workspace denied | Cross-project denied | Insert/update/delete restrictions | Service-role behavior documented | Local test needed | Staging test needed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `activation_artifacts` | Required. | Required. | Not under current model. | Not under current model. | Documented only unless future safe backend test is approved. | Required if workspace column exists. | Required if project column exists. | Normal roles denied; backend-only expectation documented. | Required. | Yes, denial-only first. | Yes, after gates pass. |
| `activation_qa_gates` | Required. | Required. | Not under current model. | Not under current model. | Documented only unless future safe backend test is approved. | Required if workspace column exists. | Required if project column exists. | Normal roles denied; backend-only expectation documented. | Required. | Yes, denial-only first. | Yes, after gates pass. |
| `activation_runs` | Required. | Required. | Not under current model. | Not under current model. | Documented only unless future safe backend test is approved. | Required if workspace column exists. | Required if project column exists. | Normal roles denied; backend-only expectation documented. | Required. | Yes, denial-only first. | Yes, after gates pass. |
| `feature_gates` | Required. | Required. | Not under current raw-table model. | Not under current raw-table model. | Documented only unless future safe backend test is approved. | Required only if scope columns exist. | Required only if scope columns exist. | Normal roles denied; backend-only expectation documented. | Required. | Yes, denial-only first. | Yes, after gates pass. |
| `readiness_snapshots` | Required. | Required. | Not under current model. | Not under current model. | Documented only unless future safe backend test is approved. | Required if workspace column exists. | Required if project column exists. | Normal roles denied; backend-only and immutability expectations documented. | Required. | Yes, denial-only first. | Yes, after gates pass. |
| `tool_capabilities` | Required. | Required. | Not applicable unless scope columns exist. | Not applicable unless scope columns exist. | Documented only unless future safe backend test is approved. | Required only if scope columns exist. | Required only if scope columns exist. | Normal roles denied; backend-only expectation documented. | Required. | Yes, denial-only first. | Yes, after gates pass. |

## Future Fixture Rules

- Use synthetic users, workspaces, projects, activation records, readiness records, and tool records only.
- Use rollback or deterministic cleanup.
- Do not include private media, signed URLs, provider keys, Stripe data, service-role keys, raw Secret Manager values, production rows, or real staging customer data.
- Staging tests require human approval completion, accepted evidence, target confirmation, rollback/cleanup plan, and reviewed command packet.
## Prompt 26E-1 local candidate update

`database/test-sql/local/002_rls_no_policy_advisor_tables_local.sql` is now the catalog-only local candidate for this RLS no-policy track.

| Test | Status | Scope | Expected result |
| --- | --- | --- | --- |
| `002_rls_no_policy_advisor_tables_local.sql` | catalog-only local candidate | Six advisor tables, RLS enabled flag, expected policy names, `anon`/`authenticated` deny-only predicates/checks | Passes only when all six tables exist locally and the Prompt 26E-1 candidate policies are present. |

This test does not insert rows and does not prove positive workspace/project behavior. Staging tests remain future-only and still require accepted evidence plus approval gates.
