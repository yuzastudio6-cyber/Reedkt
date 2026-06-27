# Validation Results

Packet: `QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE_1`

Decision: `completed_qwen2_5_vl_external_beta_confirmed_adapter_runtime_fixture`

Execution: `completed_confirmed_backend_adapter_runtime_fixture_with_fail_closed_restore`

## Pre-Run Validation

Passed before the confirmed fixture:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run smoke:qwen2-5-vl-external-beta-runtime-gate-integration-1`
- `npm run smoke:qwen2-5-vl-external-beta-backend-runtime-adapter-1`
- `npm run --silent rp-qwen2-5-vl-external-beta-backend-runtime-adapter-1:diagnostics`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`

The fail-closed runner check without confirmation also passed by blocking with `blocked_pending_qwen2_5_vl_external_beta_confirmed_adapter_runtime_fixture_confirmation`.

## Runtime Command

Exactly one confirmed runtime command was run:

`REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE=true npm run rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-confirmed`

Runtime result: `passed`

Fail-closed restore: `passed`

## Post-Run Validation

Post-run validation passed:

- `git diff --check`
- `npm run smoke:qwen2-5-vl-external-beta-runtime-gate-integration-1`
- `npm run smoke:qwen2-5-vl-external-beta-backend-runtime-adapter-1`
- `npm run --silent rp-qwen2-5-vl-external-beta-backend-runtime-adapter-1:diagnostics`
- `npm run --silent rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1:diagnostics`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`
- non-executing changed-file and staged safety scans

Validation: `passed`

## Status

- Service reason: `qwen_fixture_inference_smoke_completed`
- `parsedJson=true`
- `schemaValid=true`
- `structuredMetadataOutputAccepted=true`
- `rawOutputStoredInRepo=false`
- External beta unlocked in this phase: `false`
- Product-ready end-to-end local OSS tools: `0`
- Package-lock: `unchanged`
- Generated artifacts committed: `none`
