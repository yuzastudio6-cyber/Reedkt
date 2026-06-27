# Runner Contract

Runner: `scripts/validation/rp-external-beta-controlled-tester-product-flow-smoke-1.mjs`

Package script: `rp-external-beta-controlled-tester-product-flow-smoke-1`

Confirmation gate: `REEDITPRO_CONFIRM_EXTERNAL_BETA_CONTROLLED_TESTER_PRODUCT_FLOW_SMOKE`

Tester email gate: `REEDITPRO_EXTERNAL_BETA_TESTER_EMAIL`

Approved tester: `aiediting@reeditpro.com`

Fail-closed blockers:

- `blocked_pending_external_beta_controlled_tester_product_flow_smoke_confirmation`
- `blocked_tester_email_not_owner_approved_primary_account`
- `blocked_group_membership_readback_failed`
- `blocked_pending_owner_approved_tester_group_membership`
- `blocked_cloud_run_iam_readback_failed`
- `blocked_cloud_run_group_invoker_binding_missing`
- `blocked_broad_cloud_run_invoker_binding_present`
- `blocked_cloud_run_service_readback_failed`
- `blocked_cloud_run_service_not_ready`
- `blocked_gcloud_auth_readback_failed`
- `blocked_tester_auth_context_not_active`
- `blocked_tester_identity_token_unavailable`
- `blocked_tester_product_flow_request_failed`
- `blocked_unauthenticated_health_not_forbidden`
- `blocked_product_flow_route_map_readback_failed`
- `blocked_mock_product_flow_route_failed`
- `blocked_backend_required_route_not_safely_blocked`
- `blocked_planning_flow_did_not_stop_before_approval`
- `blocked_job_gate_unexpectedly_allowed_execution`

Allowed runtime calls:

- Authenticated `GET /api/routes`.
- Authenticated `POST /api/mock` for mock-ready route IDs only.
- Unauthenticated `GET /health` only to confirm it remains `403`.

Mock-ready success routes:

- `planning.demo.chatNative.create`
- `credits.estimate.create`
- `credits.gate.check`
- `jobs.gate.check`
- `render.creditGate.check`
- `render.readiness.check`

Backend-required blocked routes:

- `planning.editPlan.approve`
- `render.preview.create`

The runner must not print or persist identity tokens. Generated reports stay under `/tmp/reeditpro-rp-external-beta-controlled-tester-product-flow-smoke-1/<runId>/` and are never committed.
