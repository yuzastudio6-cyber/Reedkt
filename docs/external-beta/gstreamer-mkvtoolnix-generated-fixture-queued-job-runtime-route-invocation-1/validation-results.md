# Validation Results

Validation status: `passed`

Required validation:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run smoke:rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1:diagnostics`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`

Safety scans are non-executing file-content checks only. They must reject package-lock mutation, generated artifacts, Docker push/deploy, forbidden media/tool execution claims, FFmpeg/FFprobe execution, private/user media processing, Supabase/SQL, signed/public artifacts, worker/provider/model execution, and beta/production/final-delivery unlock claims.

Observed validation passed:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run smoke:rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1:diagnostics`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`
