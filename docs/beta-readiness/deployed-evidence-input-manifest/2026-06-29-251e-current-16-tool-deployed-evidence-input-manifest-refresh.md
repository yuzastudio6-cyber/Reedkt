# Current 16-Tool Deployed Evidence Input Manifest Refresh - 2026-06-29

Decision: `beta_deployed_evidence_input_manifest_passed_ready_for_operator_staging_inputs`

This packet refreshes the deployed-evidence input manifest defaults after the current-source 16-tool local accepted evidence bundle landed. It does not make external beta runnable by itself.

## Current Source State

- Current source branch: `codex/sound-music-audio-1abc-checkpoint`
- Current source SHA: `251e07194828ea74370f04b30c95f0904e2a2d83`
- Local accepted evidence bundle: `docs/beta-readiness/local-accepted-evidence-bundle/2026-06-29-current-source-16-tool-local-accepted-evidence-bundle.json`
- Local accepted evidence source SHA: `e8821759a10a43a60795accb596b3b83c15f9dfb`
- Deployed evidence source SHA still recorded by the source-freshness guard: `769fc2d922b37a9eebb8b0ca29fa2447a6f8f127`

Source freshness remains blocked because the current branch includes runtime/readiness source changes after the deployed evidence SHA. That is a real blocker for deployed evidence collection, not a blanket blocker for source-truth review or no-runtime validation.

## Tool Evidence Inputs

The deployed-evidence input manifest now defaults to the 16-tool bundle:

- `ffmpeg`
- `ffprobe`
- `pyav`
- `opentimelineio`
- `hyperframe`
- `remotion`
- `sharp`
- `duckdb`
- `polars`
- `pyscenedetect`
- `opencv`
- `opencolorio`
- `openimageio`
- `audioflux`
- `signalsmith_stretch`
- `libass`

Expected operator values:

- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID=beta-tools-current-source-16-tool-local-accepted-evidence-bundle`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA=e8821759a10a43a60795accb596b3b83c15f9dfb`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS=ffmpeg,ffprobe,pyav,opentimelineio,hyperframe,remotion,sharp,duckdb,polars,pyscenedetect,opencv,opencolorio,openimageio,audioflux,signalsmith_stretch`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_BOUNDED_ACCEPTED_TOOL_COUNT=16`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT=0`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE=docker`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE=us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-libass-burnin-validation:staging-libass-burnin-validation-001`

Track B totals remain `16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready`.

## Source Freshness Blocker

The source-freshness preflight now reports changed-file evidence for the stale deploy comparison. Blocking changed paths include:

- `.gitignore`
- `docker/prod/tool-readiness-worker/requirements.readiness.txt`
- `package.json`
- `server/cli/build-signalsmith-stretch-readiness.ts`
- `server/config/env.ts`
- `server/workers/production-readiness/core-tool-command-checks.ts`
- `server/workers/production-readiness/core-tool-python-import-checks.ts`
- `server/workers/production-readiness/core-tool-readiness-report.ts`
- `server/workers/readiness-validation/production-readiness-report-builder.ts`

Because the drift includes runtime/readiness source paths, deployed evidence collection must wait for current-source staging deploy evidence and a fresh source-freshness pass.

## Boundaries

This refresh did not call the deployed backend, record evidence, run tools, process media, write Supabase, run SQL, write GCS, dispatch workers, call providers, create public artifacts, create signed URLs, enable external beta, enable real-user-media beta, enable paid production, or claim product-ready local OSS status.

Supabase classification: no write / environment none / SQL none / migration no.

## Next Safe Action

Run the guarded current-source staging API deploy/preflight path with owner-approved inputs, then rerun:

1. `npm run beta:readiness:source-freshness-preflight`
2. `npm run beta:readiness:owner-approval-intake-preflight`
3. `npm run beta:readiness:deployed-evidence-input-manifest`
4. `npm run beta:readiness:external-beta-evidence-collector`
5. `npm run beta:readiness:operator-status-api`
