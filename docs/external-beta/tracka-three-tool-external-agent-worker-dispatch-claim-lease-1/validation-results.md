# Validation Results

Validation status: `passed`

Required commands:

- `npm run smoke:tracka-three-tool-external-agent-worker-dispatch-claim-lease-1`
- `npm run --silent tracka:three-tool-external-agent-worker-dispatch-claim-lease-1:diagnostics`
- `npm run --silent tracka:three-tool-external-agent-persisted-job-route-invocation-1:diagnostics`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`

Smoke result:

- Status: `completed_three_tool_worker_claim_lease_boundary`
- Worker lease claim: `completed_local_mock_claim_only`
- GStreamer readiness: `external_agent_local_mock_worker_claim_lease_passed`
- MKVToolNix readiness: `external_agent_local_mock_worker_claim_lease_passed`
- GPAC/MP4Box readiness: `external_agent_local_mock_worker_claim_lease_passed`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
