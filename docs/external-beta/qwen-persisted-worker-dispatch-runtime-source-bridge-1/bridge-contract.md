# QWEN Persisted Worker Dispatch Runtime Source Bridge Contract

Packet: `RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-RUNTIME-SOURCE-BRIDGE-1`

Ready status: `ready_for_confirmed_qwen_persisted_worker_dispatch_approved_fixture_inference_runtime_retry`

Next milestone: `RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-CONFIRMED-RUNTIME-1R`

## Confirmation Gate

Future runtime retry remains gated by:

`REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE=true`

This bridge does not run that future retry.

## Required References

- approved snapshot reference
- approval record reference
- credit estimate reference
- credit reservation reference
- persisted job batch reference
- persisted job reference
- worker lease reference
- route idempotency key
- provider request reference
- private input manifest reference
- private artifact manifest reference
- private artifact checksum reference
- source sequence map reference
- compiled intent reference
- model routing policy reference
- QA policy reference
- QWEN runtime readiness rollup reference
- QWEN product route runtime run ID
- approved fixture reference
- approved tester account
- Google Cloud project and region
- Supabase target ref
- timeout/cost ceiling reference
- fail-closed restore policy reference

## Required State

- approved snapshot status: `approved`
- credit reservation status: `reserved`
- job status: `queued` or `leased`
- worker lease status: `claimed`
- private input manifest status: `approved_fixture_reference`
- private output manifest/checksum policy: `required`
- timeout/cost ceiling status: `satisfied`
- fail-closed restore policy status: `required`

## Adapter Path Rule

The prior product-route/provider runtime fixture is not accepted as a direct shortcut. It may only be delegated after the bridge proves the approved snapshot, job, lease, idempotency, private manifest, timeout/cost, and fail-closed references.

Direct adapter shortcut allowed: `false`

Existing product-route runtime fixture allowed only behind persisted bridge: `true`

Product-ready end-to-end local OSS tools: `0`
