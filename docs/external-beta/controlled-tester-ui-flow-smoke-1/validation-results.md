# Validation Results

Validation status: `passed_with_blocker_recorded`

Recorded blocker: `blocked_deployed_browser_ui_surface_not_present`

Confirmed run:

- `REEDITPRO_CONFIRM_EXTERNAL_BETA_CONTROLLED_TESTER_UI_FLOW_SMOKE=true REEDITPRO_EXTERNAL_BETA_TESTER_EMAIL=aiediting@reeditpro.com npm run rp-external-beta-controlled-tester-ui-flow-smoke-1`: `blocked_deployed_browser_ui_surface_not_present`

Run evidence:

- run ID: `2026-06-27T16-07-23-427Z-7e136bc9`
- output directory: `/tmp/reeditpro-rp-external-beta-controlled-tester-ui-flow-smoke-1/2026-06-27T16-07-23-427Z-7e136bc9`
- report SHA-256: `0bf0f4a53c435b3e8e1c62412d7f2cef7b7633de821eee36f62ace16f068b2e3`
- manifest SHA-256: `5672d630490da26bfc5b0ef37d66b5da5bbcb041f83ebdcbf0dfa1d328dc3dae`

Full validation after docs update:

- `npm ci --no-audit --no-fund --progress=false`: `passed`
- `git diff --check`: `passed`
- `npm run --silent rp-external-beta-controlled-tester-ui-flow-smoke-1:diagnostics`: `passed`
- `npm run --silent rp-external-product-beta-current-readiness-rollup-1:diagnostics`: `passed`
- `npm run --silent rp-external-beta-controlled-tester-product-flow-smoke-1:diagnostics`: `passed`
- `npm run lint`: `passed`
- `npm run typecheck:server`: `passed`
- `npm run build`: `passed`
- `npm run build:server`: `passed`
- `git diff --cached --check`: `passed`
- non-executing changed-file and staged safety scans: `passed`

Package-lock: `unchanged`

Generated artifacts committed: `none`
