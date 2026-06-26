# Validation Results

Validation status: `full_validation_passed`

Accepted validation commands:

- `npm ci --no-audit --no-fund --progress=false`: `passed`
- `git diff --check`: `passed`
- `npm run smoke:internal-beta-local-e2e-chain-smoke`: `passed`
- `npm run lint`: `passed`
- `npm run typecheck:server`: `passed`
- `npm run build`: `passed`
- `npm run build:server`: `passed`
- `npm run --silent rp-internal-beta-local-e2e-chain-smoke-1:diagnostics`: `passed`
- `npm run --silent rp-internal-beta-local-readiness-gate-rollup-1:diagnostics`: `passed`
- `git diff --cached --check`: `passed`
- non-executing changed-file/staged safety scan: `passed`

Pre-validation caveat: a local pre-validation `npx tsx server/smoke/internal-beta-local-e2e-chain-smoke.ts` probe fetched `tsx` into npm cache because `node_modules` was absent. The probe is not accepted validation evidence and must not be repeated. Accepted validation starts with `npm ci`.

Package-lock: `unchanged`

Generated artifacts committed: `none`
