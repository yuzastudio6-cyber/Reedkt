# Persisted Job Runtime Route Invocation QA Rollup Validation Results

Validation status: `passed`

Post-merge evidence command:

- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION=true REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION=true REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF=true REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE=true API_ALLOW_MOCK_WITHOUT_SUPABASE=true E2E_RUNTIME_MODE=local NODE_ENV=test SUPABASE_URL='' SUPABASE_SERVICE_ROLE_KEY='' npx tsx /tmp/reeditpro-persisted-route-invocation-evidence.ts`

Evidence result:

- HTTP status: `201`
- Route status: `completed_persisted_job_runtime_route_invocation`
- Decision: `completed_gstreamer_mkvtoolnix_persisted_job_payload_to_runtime_route_invocation`
- Runtime runner run ID: `2026-07-02T13-20-30-119Z-52de7c0c`

Repo validation:

- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1:diagnostics`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1:diagnostics`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1:diagnostics`
- `git diff --check`
- `git diff --cached --check`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
