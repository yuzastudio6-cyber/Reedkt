# Backend Job Handoff Contract

Packet: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_1`

## Handoff Gate

Confirmation env: `REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF`

Required value: `true`

Ready status: `ready_for_guarded_qwen2_5_vl_product_route_provider_runtime_fixture`

## Handoff Envelope

The handoff source contract preserves these references:

- approved snapshot readback reference;
- credit reservation readback reference;
- queue lease readback reference;
- route idempotency key;
- private input manifest readback reference;
- private artifact manifest readback reference;
- private artifact checksum readback reference;
- source sequence map readback reference;
- compiled intent readback reference;
- edit plan version readback reference;
- model routing policy readback reference;
- QA policy readback reference.

The handoff envelope targets the accepted adapter lane:

`qwen2_5_vl_confirmed_private_adapter_runtime_fixture`

## Boundary

- Backend handoff prepared now: `true` only in local confirmed source evaluation.
- Route execution accepted now: `false`
- Provider/model call allowed now: `false`
- Worker dispatch allowed now: `false`
- Cloud Run job execution allowed now: `false`
- Secret payload access allowed now: `false`
- Signed/public artifact allowed now: `false`
- Final render/export allowed now: `false`
- External beta unlock allowed now: `false`

This packet creates handoff source wiring only. It does not execute the next provider runtime fixture.
