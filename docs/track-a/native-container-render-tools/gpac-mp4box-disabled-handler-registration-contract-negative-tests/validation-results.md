# Validation Results

Lane: `TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-CONTRACT-NEGATIVE-TESTS-1`.

Validation status: `full_validation_passed`.

Required commands:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run smoke:tracka-gpac-mp4box-disabled-handler-registration-contract-negative-tests`
- `npm run --silent tracka:gpac-mp4box-disabled-handler-registration-contract:diagnostics`
- `npm run --silent tracka:gpac-mp4box-disabled-handler-registration-contract-negative-tests:diagnostics`
- `git diff --cached --check`
- non-executing changed-file and staged safety scans

Result: all required commands passed locally in the clean sibling worktree.

Package-lock: `unchanged`.

Generated artifacts committed: `none`.

Product-ready local OSS tools: `0`.
