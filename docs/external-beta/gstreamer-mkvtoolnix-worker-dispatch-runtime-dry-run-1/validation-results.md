# Validation Results

Validation status: `confirmed_dry_run_passed`

Run ID: `2026-07-02T16-10-17-014Z-eec19f59`

Output directory: `/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1/2026-07-02T16-10-17-014Z-eec19f59`

Report: `/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1/2026-07-02T16-10-17-014Z-eec19f59/worker-dispatch-runtime-dry-run-report.json`

Manifest: `/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1/2026-07-02T16-10-17-014Z-eec19f59/worker-dispatch-runtime-dry-run-manifest.json`

Required commands:

- `npm ci --no-audit --no-fund --progress=false`
- `npm run smoke:rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1`
- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN=true npm run rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1:diagnostics`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1:diagnostics`
- `git diff --cached --check`
- non-executing changed-file and staged safety scans

Package-lock: `unchanged`

Generated artifacts committed: `none`
