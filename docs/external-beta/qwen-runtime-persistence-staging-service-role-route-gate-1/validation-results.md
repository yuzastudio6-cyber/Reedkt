# Validation Results

Validation status: `full_validation_passed_docs_only_route_gate`

Validation commands:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run --silent rp-external-beta-qwen-runtime-persistence-staging-rls-storage-readback-1:diagnostics`
- `npm run --silent rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1:diagnostics`
- `git diff --cached --check`
- non-executing changed/staged file-content safety scan

Diagnostics:

- `npm ci --no-audit --no-fund --progress=false`: `passed`
- `git diff --check`: `passed`
- `npm run lint`: `passed`
- `npm run typecheck:server`: `passed`
- `npm run build`: `passed`
- `npm run build:server`: `passed`
- Staging RLS/storage readback diagnostics: `passed`
- Service-role route gate diagnostics: `passed`
- `git diff --cached --check`: `passed`
- Changed/staged safety scans: `passed_non_executing_file_content_scans`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Remote mutation: `false`

SQL execution: `false`

Route execution: `false`

QWEN runtime execution: `false`
