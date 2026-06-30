# Confirmed Runtime Result

Result: `blocked_missing_persisted_job_or_queue_lease_reference`

Execution: `blocked_current_source_has_backend_handoff_only_no_qwen_persisted_dispatch_execution`

Confirmed gate: `REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE=true`

Run ID: `2026-06-30T11-35-39-930Z-53050e1e`

Output directory: `/tmp/reeditpro-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1/2026-06-30T11-35-39-930Z-53050e1e`

Target:

- Google Cloud project: `reeditpro`
- Region: `us-central1`
- Staging API service: `reeditpro-staging-api`
- QWEN worker service: `reeditpro-qwen2-5-vl-l4-worker`
- Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`
- Tester: `aiediting@reeditpro.com`

Approved fixture reference: `qwen25-approved-snapshot-job-orchestration-runtime-fixture-1-2026-06-28T07-37-02-997Z-a0b72404`

Observed gcloud context: `aiediting@reeditpro.com` / `reeditpro`

Cloud Run metadata readback:

- Staging API latest ready revision: `reeditpro-staging-api-00011-79q`
- QWEN worker latest ready revision: `reeditpro-qwen2-5-vl-l4-worker-00037-658`
- Source dispatch readiness: `backend_handoff_only`; `noConfigMutationPersistedDispatchReady=false`

The guarded runner read local gcloud account/project, probed user and ADC token availability without printing token values, and read Cloud Run service metadata. It did not send a route request or execute model/runtime work while the current source remains backend-handoff-only.

QWEN inference: `not_run`

Provider/model call: `not_run`

Worker dispatch: `not_run`

Cloud Run job execution: `not_run`

Cloud Run service update: `not_run`

Product-ready end-to-end local OSS tools: `0`

Artifacts:

- `qwen-persisted-dispatch-approved-fixture-inference-confirmed-runtime-report.json`; bytes `4557`; SHA-256 `acfe099213660ea14942b6d487ddb05766ee838345ae677e3ed72c117db13e4d`
- `qwen-persisted-dispatch-approved-fixture-inference-confirmed-runtime-manifest.json`; bytes `608`; SHA-256 `5f35e8f24e0519e1768b06070588f7e32c60ddfed216434fb23edad3979c89fe`
- `qwen-persisted-dispatch-approved-fixture-inference-confirmed-runtime-checksums.json`; bytes `828`; SHA-256 `33e4223bb9ed7d5f868b117ba2ce4fc202955ad6475a4ee4a24937a86f3a7b98`
