# Validation Results

Validation status: `full_validation_passed`

Commands:

- `npm ci --no-audit --no-fund --progress=false`: `passed`
- `git diff --check`: `passed`
- `npm run smoke:internal-beta-runtime-readiness-orchestrator`: `passed`
- `npm run smoke:internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration`: `passed`
- `npm run smoke:internal-beta-local-e2e-chain-smoke`: `passed`
- `npm run lint`: `passed`
- `npm run typecheck:server`: `passed`
- `npm run build`: `passed`
- `npm run build:server`: `passed`
- `npm run --silent rp-internal-beta-local-e2e-chain-smoke-1:diagnostics`: `passed`
- `npm run --silent rp-internal-beta-runtime-readiness-orchestrator-1:diagnostics`: `passed`
- `npm run --silent rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration:diagnostics`: `passed`
- `npm run --silent rp-internal-beta-runtime-readiness-credential-context-integration-1:diagnostics`: `passed`
- `npm run --silent rp-internal-beta-local-readiness-gate-rollup-1:diagnostics`: `passed`
- `git diff --cached --check`: `passed`
- Non-executing changed-file safety scan: `passed`
- Non-executing staged safety scan: `passed`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`

Internal beta unlock: `false`

Product-ready end-to-end local OSS tools: `0`
