# Persisted Job Worker Claim Lease Validation Results

Validation status: `passed`

Commands:

- `npm run smoke:rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1`
- `npm run typecheck:server`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1:diagnostics`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1:diagnostics`
- `git diff --check`
- `git diff --cached --check`

Smoke checks:

- `confirmation_gate_blocks_worker_claim_lease`
- `local_mock_worker_claim_lease_succeeds_without_worker_execution`
- `unsafe_runtime_flags_block`
- `remote_worker_claim_blocks_without_separate_confirmation`
- `express_route_requires_idempotency_and_returns_201`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
