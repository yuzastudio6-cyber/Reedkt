# RP External Beta Controlled Tester Product Flow Smoke 1 Results

Decision: `completed_external_beta_controlled_tester_product_flow_smoke`

Execution: `completed_guarded_authenticated_tester_mock_product_flow_smoke_no_persistent_runtime_mutation`

Tester: `aiediting@reeditpro.com`

Tester classification: `owner_approved_primary_real_tester_account`

Run ID: `2026-06-27T15-34-26-957Z-dbe78e9d`

Generated fixture: `/tmp/reeditpro-rp-external-beta-controlled-tester-product-flow-smoke-1/2026-06-27T15-34-26-957Z-dbe78e9d`

Artifacts/checksums:

- `controlled-tester-product-flow-smoke-report.json`: `4967` bytes, SHA-256 `ed4be5c34449725443592cf1bcf459b5847601b229abacb48018c36a56f86522`
- `artifact-manifest.json`: `442` bytes, SHA-256 `a0b67ee1a562d5f3c2d91678eb7dd4bc6dd1bab814b615abd0055c43a3cd187e`

Smoke result:

- unauthenticated `/health`: `blocked_403`
- authenticated `/api/routes`: `200`
- total routes: `109`
- mock-ready routes: `67`
- required route presence: `true`
- `planning.demo.chatNative.create`: `passed_mock_only`, stopped at `approve_plan_and_credits`
- `credits.estimate.create`: `passed_mock_only`, `18` credits
- `credits.gate.check`: `passed_mock_only`
- `jobs.gate.check`: `passed_mock_only`, `jobGateOk=false`
- `render.creditGate.check`: `passed_mock_only`
- `render.readiness.check`: `passed_mock_only`
- `planning.editPlan.approve`: `blocked_424_backend_runtime_required`
- `render.preview.create`: `blocked_424_backend_runtime_required`

External product beta readiness: `ready_for_controlled_owner_tester_product_walkthrough`

External beta enabled in this phase: `true`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

## Result

The owner-approved tester account completed a controlled product-flow smoke through the deployed staging API. The flow proved authenticated access to route metadata, mock chat-native planning, mock credit estimate/gates, mock job gate, and mock render gates while preserving backend-required blockers for real plan approval and preview render creation.

Next milestone: `RP-EXTERNAL-BETA-CONTROLLED-TESTER-UI-FLOW-SMOKE-1`

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, service-role route execution, browser capture, signed URL creation, public artifact creation, persistent credit mutation, persistent credit reservation creation, credit spend, Stripe checkout/webhook/payment processing, internal beta broad unlock, external beta broad audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Remotion execution, FFmpeg/FFprobe execution, Docker execution, package installation beyond dependency validation, dependency mutation, package-lock mutation, group membership mutation, Cloud Run IAM mutation, Cloud Run service update, deployment, or broad service-role handler was enabled. The controlled tester product-flow smoke was limited to authenticated staging API `/api/routes` and `/api/mock` mock-ready product-flow route checks plus backend-required route-block verification.
