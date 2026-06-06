# Supabase RLS No-Policy Test Contract

Prompt 26D defines future test requirements only. It does not create executable SQL tests and does not run local, staging, remote, or production SQL.

## Status

- Test contract status: `rls_no_policy_test_contract_created`.
- Executable SQL tests created: no.
- SQL executed: none.
- Supabase environment touched: none.
- Migration deployed: no.

## Required Future Tests

| Table | Positive read test | Negative read test | Backend write expectation | Non-member denial | Cross-workspace denial | Cross-project denial | Anon denial | Authenticated non-member denial | Service-role expectation | Local validation requirement | Staging validation requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `activation_artifacts` | None for raw client table under current model. | Authenticated user cannot read raw rows. | Document service-role write expectation; do not simulate unless future runner allows safe backend role. | Required. | Required if workspace column exists. | Required if project column exists. | Required. | Required. | Documented only unless future safe service-role test is approved. | Future local SQL denial tests after schema review. | Future staging denial tests after human approval and evidence acceptance. |
| `activation_qa_gates` | None for raw client table under current model. | Authenticated user cannot read raw rows. | Document service-role write expectation. | Required. | Required if workspace column exists. | Required if project column exists. | Required. | Required. | Documented only unless future safe service-role test is approved. | Future local SQL denial tests after schema review. | Future staging denial tests after human approval and evidence acceptance. |
| `activation_runs` | None for raw client table under current model. | Authenticated user cannot read raw rows. | Document service-role write expectation. | Required. | Required if workspace column exists. | Required if project column exists. | Required. | Required. | Documented only unless future safe service-role test is approved. | Future local SQL denial tests after schema review. | Future staging denial tests after human approval and evidence acceptance. |
| `feature_gates` | None for raw table under current model. Future summary route can have separate static catalog tests. | Authenticated user cannot read raw rows. | Document service-role write expectation. | Required if scoped columns exist. | Required if workspace column exists. | Required if project column exists. | Required. | Required. | Documented only unless future safe service-role test is approved. | Future local raw-table denial tests; summary tests only if route exists. | Future staging denial tests after human approval and evidence acceptance. |
| `readiness_snapshots` | None for raw client table under current model. Future redacted route can have separate tests. | Authenticated user cannot read raw rows. | Document service-role write expectation and immutability expectations. | Required. | Required if workspace column exists. | Required if project column exists. | Required. | Required. | Documented only unless future safe service-role test is approved. | Future local denial and immutability tests after schema review. | Future staging denial tests after human approval and evidence acceptance. |
| `tool_capabilities` | None for raw table under current model. Future static catalog route can have separate non-secret tests. | Authenticated user cannot read raw rows. | Document service-role write expectation. | Not applicable unless scope columns exist. | Not applicable unless workspace column exists. | Not applicable unless project column exists. | Required. | Required. | Documented only unless future safe service-role test is approved. | Future local raw-table denial tests; catalog tests only if route exists. | Future staging denial tests after human approval and evidence acceptance. |

## Fixture Requirements

- Use synthetic users, workspaces, projects, and runtime records only.
- Use transaction rollback or isolated cleanup.
- Do not use private media, signed URLs, provider keys, Stripe data, service-role keys, raw Secret Manager values, or real production/staging rows.
- Do not simulate service-role writes unless a future prompt explicitly approves a safe local-only method.

## Acceptance Requirements For Future SQL

- Every future local test must prove `anon` denial.
- Every future local test must prove authenticated raw-table denial for the current Prompt 26D model.
- Any future user-visible summary/catalog path must be tested separately from raw table policies.
- Staging tests require Prompt 23A human approval completion, accepted evidence, confirmed staging target, rollback/cleanup plan, and redacted evidence handling.
## Prompt 26E-1 local candidate note

`database/test-sql/local/002_rls_no_policy_advisor_tables_local.sql` satisfies the first catalog-only local test contract for policy presence and deny-only shape. It does not satisfy row-level fixture tests, positive access tests, service-role/backend tests, or staging tests.

