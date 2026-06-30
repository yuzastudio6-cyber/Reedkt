# Operator Gcloud Auth Preflight Validation Results

Packet: `RP-EXTERNAL-BETA-OPERATOR-GCLOUD-AUTH-PREFLIGHT-1`

Decision: `completed_operator_gcloud_auth_preflight_helper_ready_no_runtime_invocation`

Execution: `completed_docs_and_guarded_local_preflight_helper_no_runtime_invocation`

## Validation

- `npm ci --no-audit --no-fund --progress=false`: `passed`
- `git diff --check`: `passed`
- `npm run lint`: `passed`
- `npm run typecheck:server`: `passed`
- `npm run build`: `passed`
- `npm run build:server`: `passed`
- `npm run --silent rp-external-beta-qwen-transport-dependency-preflight-current-1:diagnostics`: `passed`
- `npm run --silent rp-external-beta-operator-gcloud-auth-preflight-1:diagnostics`: `passed`
- `git diff --cached --check`: `passed`
- non-executing changed-file and staged safety scans: `passed`

## Runtime Status

- guarded operator auth preflight runner execution: `not_run_in_validation`
- Cloud Run invocation: `false`
- identity token fetch: `false`
- request sent: `false`
- QWEN2.5-VL execution: `false`
- worker dispatch: `false`
- Supabase mutation: `false`
- SQL execution: `false`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
