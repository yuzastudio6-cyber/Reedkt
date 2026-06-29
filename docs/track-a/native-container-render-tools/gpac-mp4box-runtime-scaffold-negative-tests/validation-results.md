# Validation Results

Lane: `TRACKA-GPAC-MP4BOX-RUNTIME-SCAFFOLD-NEGATIVE-TESTS-1`.

Validation status: `full_validation_passed`.

Required commands:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run smoke:tracka-gpac-mp4box-disabled-runtime-scaffold`
- `npm run smoke:tracka-gpac-mp4box-runtime-scaffold-negative-tests`
- `npm run --silent tracka:gpac-mp4box-disabled-runtime-scaffold:diagnostics`
- `npm run --silent tracka:gpac-mp4box-runtime-scaffold-negative-tests:diagnostics`
- `git diff --cached --check`
- non-executing changed-file and staged safety scans

Result:

- `npm ci --no-audit --no-fund --progress=false`: passed.
- `git diff --check`: passed with `DEVELOPER_DIR=/Library/Developer/CommandLineTools`.
- `npm run lint`: passed.
- `npm run typecheck:server`: passed.
- `npm run build`: passed.
- `npm run build:server`: passed.
- `npm run smoke:tracka-gpac-mp4box-disabled-runtime-scaffold`: passed.
- `npm run smoke:tracka-gpac-mp4box-runtime-scaffold-negative-tests`: passed.
- `npm run --silent tracka:gpac-mp4box-disabled-runtime-scaffold:diagnostics`: passed.
- `npm run --silent tracka:gpac-mp4box-runtime-scaffold-negative-tests:diagnostics`: passed.
- `git diff --cached --check`: passed with `DEVELOPER_DIR=/Library/Developer/CommandLineTools`.
- Non-executing changed-file and staged safety scans: passed.

Package-lock: `unchanged`.

Generated artifacts committed: `none`.

Product-ready local OSS tools: `0`.

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, GPAC execution in this phase, MP4Box execution in this phase, FFmpeg/FFprobe execution, worker execution, worker dispatch, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, external beta expansion, paid production unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, media processing, private media processing, user media processing, or broad service-role handler was enabled.
