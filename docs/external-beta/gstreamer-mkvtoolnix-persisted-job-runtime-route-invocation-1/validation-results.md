# Validation Results

Validation status: `passed`

Required commands:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run smoke:rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1:diagnostics`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1:diagnostics`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`

Expected smoke checks:

- `confirmation_gates_block_before_runtime_invocation`
- `persisted_job_payload_delegates_to_existing_runtime_invocation_with_fake_runner`
- `unsafe_runtime_invocation_controls_block`
- `express_route_registered_and_fails_closed_without_env_gates`
- `no_private_media_supabase_sql_worker_execution_public_artifact_or_final_export_enabled`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
