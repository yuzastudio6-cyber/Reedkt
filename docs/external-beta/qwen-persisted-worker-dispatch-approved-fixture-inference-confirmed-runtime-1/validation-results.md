# Validation Results

Status: `full_validation_passed_with_confirmed_runtime_gate_blocked_before_provider_execution`

Runtime result: `blocked_missing_persisted_job_or_queue_lease_reference`

Confirmed runtime preflight command:

- `REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE=true npm run --silent rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1`: `blocked_missing_persisted_job_or_queue_lease_reference`

Run ID: `2026-06-30T11-35-39-930Z-53050e1e`

Output directory: `/tmp/reeditpro-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1/2026-06-30T11-35-39-930Z-53050e1e`

Validation commands to run:

- `npm ci --no-audit --no-fund --progress=false`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run --silent rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1:diagnostics`
- `npm run --silent rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1:diagnostics`
- `npm run --silent rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1:diagnostics`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --cached --check`

Validation evidence:

- `npm ci --no-audit --no-fund --progress=false`: `passed`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`: `passed`
- `npm run lint`: `passed`
- `npm run typecheck:server`: `passed`
- `npm run build`: `passed`
- `npm run build:server`: `passed`
- `npm run --silent rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1:diagnostics`: `passed`
- `npm run --silent rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1:diagnostics`: `passed`
- `npm run --silent rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1:diagnostics`: `passed`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --cached --check`: `passed`
- Non-executing changed-file/staged safety scans: `passed`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`

Runtime artifacts:

- `qwen-persisted-dispatch-approved-fixture-inference-confirmed-runtime-report.json`; bytes `4557`; SHA-256 `acfe099213660ea14942b6d487ddb05766ee838345ae677e3ed72c117db13e4d`
- `qwen-persisted-dispatch-approved-fixture-inference-confirmed-runtime-manifest.json`; bytes `608`; SHA-256 `5f35e8f24e0519e1768b06070588f7e32c60ddfed216434fb23edad3979c89fe`
- `qwen-persisted-dispatch-approved-fixture-inference-confirmed-runtime-checksums.json`; bytes `828`; SHA-256 `33e4223bb9ed7d5f868b117ba2ce4fc202955ad6475a4ee4a24937a86f3a7b98`
