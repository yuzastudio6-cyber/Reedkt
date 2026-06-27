# Product-Flow Evidence

Decision: `completed_external_beta_controlled_tester_product_flow_smoke`

Run ID: `2026-06-27T15-34-26-957Z-dbe78e9d`

Output directory: `/tmp/reeditpro-rp-external-beta-controlled-tester-product-flow-smoke-1/2026-06-27T15-34-26-957Z-dbe78e9d`

Cloud Run service: `reeditpro-staging-api`

Cloud Run region: `us-central1`

Latest ready revision: `reeditpro-staging-api-00005-7gs`

Traffic: `100_percent_reeditpro-staging-api-00005-7gs`

Tester: `aiediting@reeditpro.com`

Tester classification: `owner_approved_primary_real_tester_account`

Route map readback:

- `/api/routes` status: `200`
- total routes: `109`
- mock-ready routes: `67`
- required routes present: `true`

Access smoke:

- unauthenticated `/health`: `blocked_403`

Mock product-flow route outcomes:

| Route ID | HTTP | Inner status | Result |
| --- | ---: | ---: | --- |
| `planning.demo.chatNative.create` | `200` | `200` | `nextRequiredAction=approve_plan_and_credits`, `editPlanStatus=awaiting_approval`, `creditEstimateCredits=18`, `sourceAssetCount=4` |
| `credits.estimate.create` | `200` | `200` | `nextStep=approve_plan_and_credits`, `creditEstimateCredits=18` |
| `credits.gate.check` | `200` | `200` | `creditGateOk=true`, `nextStep=queue_generation` |
| `jobs.gate.check` | `200` | `200` | `jobGateOk=false`, `nextStep=fix_blocking_gate` |
| `render.creditGate.check` | `200` | `200` | `creditGateOk=true`, `nextStep=queue_generation` |
| `render.readiness.check` | `200` | `200` | `mockOnly=true` |

Backend-required route outcomes:

| Route ID | HTTP | Inner status | Result |
| --- | ---: | ---: | --- |
| `planning.editPlan.approve` | `424` | `424` | `backend_runtime_required` |
| `render.preview.create` | `424` | `424` | `backend_runtime_required` |

Artifacts/checksums:

- `controlled-tester-product-flow-smoke-report.json`: `4967` bytes, SHA-256 `ed4be5c34449725443592cf1bcf459b5847601b229abacb48018c36a56f86522`
- `artifact-manifest.json`: `442` bytes, SHA-256 `a0b67ee1a562d5f3c2d91678eb7dd4bc6dd1bab814b615abd0055c43a3cd187e`

Generated artifacts committed: `none`

Package-lock: `unchanged`
