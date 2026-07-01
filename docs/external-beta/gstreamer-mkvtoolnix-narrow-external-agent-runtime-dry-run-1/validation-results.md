# Validation Results

Validation status: `passed`

Validation commands passed:

- `npm ci --no-audit --no-fund --progress=false`
- fail-closed no-gate dry-run check
- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_DRY_RUN=true npm run --silent rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1`
- `git diff --check`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1:diagnostics`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1:diagnostics`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`
- non-executing changed-file safety scan
- non-executing staged safety scan

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`

Supabase classification: `not_applicable_docs_only`
