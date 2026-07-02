# Validation Results

Validation status: `passed`

Required commands:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run smoke:rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1:diagnostics`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-qa-rollup-1:diagnostics`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1:diagnostics`
- `git diff --cached --check`

Observed smoke result:

- `confirmation_gates_block_before_persisted_handoff`
- `local_mock_job_service_handoff_created`
- `runtime_invocation_body_stored_without_execution`
- `unsafe_runtime_invocation_request_blocks`
- `express_route_registered_and_fails_closed_without_env_gates`
- `no_private_media_supabase_sql_worker_execution_public_artifact_or_final_export_enabled`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
