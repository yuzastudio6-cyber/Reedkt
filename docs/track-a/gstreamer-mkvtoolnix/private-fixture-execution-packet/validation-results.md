# Validation Results

This reconciliation packet is intended to be validated without private fixture execution.

Required validation:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run --silent tracka:gstreamer-mkvtoolnix-private-fixture-scope-decision-1:diagnostics`
- `npm run --silent tracka:gstreamer-mkvtoolnix-private-fixture-scope-decision-1r:diagnostics`
- `npm run --silent tracka:gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1:diagnostics`
- `npm run --silent tracka:gstreamer-mkvtoolnix-private-fixture-approval-1:diagnostics`
- `npm run --silent tracka:gstreamer-mkvtoolnix-private-fixture-approval-1r:diagnostics`
- `npm run --silent tracka:gstreamer-mkvtoolnix-private-fixture-plan-1:diagnostics`
- `npm run --silent tracka:gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1:diagnostics`
- `npm run --silent tracka:gstreamer-mkvtoolnix-private-fixture-execution-packet-1:diagnostics`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`

Safety scans must be non-executing file-content scans only. They must not invoke FFmpeg, FFprobe, GStreamer, MKVToolNix, Docker, Remotion, workers, routes, providers, Supabase, SQL, signed URL creation, public artifact creation, package installation, dependency mutation, or generated artifact flows.
