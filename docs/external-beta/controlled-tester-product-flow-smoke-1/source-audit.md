# RP-EXTERNAL-BETA-CONTROLLED-TESTER-PRODUCT-FLOW-SMOKE-1 Source Audit

Decision: `completed_external_beta_controlled_tester_product_flow_smoke`

Execution: `completed_guarded_authenticated_tester_mock_product_flow_smoke_no_persistent_runtime_mutation`

Source chain:

- `RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-SMOKE-1`: `aiediting@reeditpro.com` is the owner-approved primary real tester account.
- `RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1`: external product beta readiness was `ready_for_owner_approved_controlled_external_beta_testing` before this product-flow smoke.
- Cloud Run staging service: `reeditpro-staging-api` in `us-central1`.
- Google group: `external-beta-testers@reeditpro.com`.
- Cloud Run invoker member: `group:external-beta-testers@reeditpro.com`.
- Supabase target carried forward: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.
- PR #577 remains open/draft/blocked/conflicting and excluded from source-of-truth.

This packet uses the already deployed staging API and the owner-approved tester account to exercise the mock product-flow transport. It does not add a new tester, broaden IAM, change Cloud Run, run Supabase, run SQL, call providers, execute workers, process media, create signed URLs, create public artifacts, or unlock production.

Product-ready end-to-end local OSS tools: `0`
