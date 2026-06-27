# QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE_1

Run a single bounded confirmed QWEN2.5-VL backend adapter runtime fixture only after `QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_1` is merged and validation remains clean.

## Required Confirmation

Require an explicit confirmation gate before runtime execution. The packet must name:

- `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE=true`;
- `REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd`;
- `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE=approved_snapshot_structured_metadata_only`;
- approved snapshot reference;
- credit reservation reference;
- queue lease reference;
- idempotency key;
- private input manifest reference;
- private artifact manifest reference;
- private artifact checksum reference;
- exact cleanup and fail-closed restore checks.

## Allowed Future Scope

Future runtime may execute only one bounded approved-snapshot structured metadata fixture through the backend-only adapter, with private artifacts and checksums. It must not use raw chat, arbitrary user media, public artifacts, signed URL source-of-truth, broad beta, paid production, production, or final render/export.

## Still Blocked

- frontend provider/model calls;
- raw prompt execution;
- arbitrary user media;
- public artifacts;
- signed URL source-of-truth;
- final render/export;
- broad external beta;
- paid production;
- production.
