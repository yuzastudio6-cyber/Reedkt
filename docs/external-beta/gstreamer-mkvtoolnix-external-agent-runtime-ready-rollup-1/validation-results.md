# Validation Results

Validation status: `passed`

Commands to validate this rollup:

- `npm ci --no-audit --no-fund --progress=false`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-confirmed-runtime-execution-1:diagnostics`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-external-agent-runtime-ready-rollup-1:diagnostics`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --cached --check`
- Non-executing changed-file and staged safety scans.

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`

Safety: No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution in this rollup phase, route execution in this rollup phase, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, external beta unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, GStreamer execution in this rollup phase, MKVToolNix execution in this rollup phase, FFmpeg/FFprobe execution in this rollup phase, Docker execution in this rollup phase, Remotion execution, package installation, dependency mutation, package-lock mutation, or broad service-role handler was enabled.
