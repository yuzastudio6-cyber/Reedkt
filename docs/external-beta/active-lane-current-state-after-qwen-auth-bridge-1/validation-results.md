# Validation Results

Packet: `RP-EXTERNAL-BETA-ACTIVE-LANE-CURRENT-STATE-AFTER-QWEN-AUTH-BRIDGE-1`

Validation status: `passed`

Validation:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run --silent rp-external-beta-active-lane-current-state-after-qwen-auth-bridge-1:diagnostics`
- `git diff --cached --check`
- non-executing changed-file and staged safety scans

Observed result:

- dependency validation: `passed`
- diff check: `passed`
- lint: `passed`
- server typecheck: `passed`
- build: `passed`
- build:server: `passed`
- new auth-bridge active-lane diagnostics: `passed`
- prior active-lane diagnostics: `passed`
- QWEN native auth bridge staging handoff diagnostics: `passed`
- cached diff check: `passed`
- non-executing changed-file and staged safety scans: `passed`

Current source readbacks:

- Integration base: `d2a1baab07dd5d1b4e021e7e720210952f7480fc`.
- Active gcloud account: `aiediting@reeditpro.com`.
- Active Google Cloud project: `reeditpro`.
- Staging API latest ready revision: `reeditpro-staging-api-00011-79q`.
- QWEN worker latest ready revision: `reeditpro-qwen2-5-vl-l4-worker-00037-658`.
- QWEN worker default inference posture: `fail_closed`.
- PR #577: `open_draft_conflicting_dirty_excluded`.
- Duplicate PR scan: `none_found`.

Package-lock: `unchanged`

Generated artifacts committed: `none`
