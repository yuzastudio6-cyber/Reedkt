# Deployed Evidence Input Manifest - 2026-06-28

Decision: `beta_deployed_evidence_input_manifest_passed_ready_for_operator_staging_inputs`

This packet converts the local accepted evidence snapshot into the exact deployed-evidence input contract for the next beta tools gate. It is source-traceable to `codex/sound-music-audio-1abc-checkpoint` at `ffb1dc81325f24d37a0753783264052fe69ca0ee`.

The local accepted snapshot remains `docs/beta-readiness/local-accepted-evidence-bundle/2026-06-27-local-accepted-evidence-bundle.json`, captured at `5bc6abf0ef238d8038ea0b95877ca06dd73738fc`. The later `ffb1dc81325f24d37a0753783264052fe69ca0ee` source only adds source-truth metadata and smoke coverage; it does not change the accepted local tool behavior.

## Fixed Inputs

- `REEDITPRO_BETA_EXTERNAL_SOURCE_SHA=ffb1dc81325f24d37a0753783264052fe69ca0ee`
- `REEDITPRO_BETA_EXTERNAL_CONFIRM_EVIDENCE_SEQUENCE=true`
- `REEDITPRO_BETA_EXTERNAL_REQUIRE_EXTERNAL_BETA_READY=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS=ffmpeg,ffprobe,pyav,opentimelineio,hyperframe,remotion,sharp,duckdb,polars,pyscenedetect,opencv,opencolorio,openimageio`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT=14`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE=docker`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE=us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-libass-burnin-validation:staging-libass-burnin-validation-001`
- `REEDITPRO_BETA_PLATFORM_ENVIRONMENT=staging`

## Operator Inputs

The operator must provide the deployed staging API URL, bearer token, workspace/project IDs, separate idempotency keys for core tool evidence, libass evidence, platform evidence, and launch approval evidence, the wallet-settlement fixture event ID, platform attestations, and launch owner evidence notes.

Run `npm run beta:readiness:deployed-evidence-input-manifest` first. It prints only input presence, expected non-secret values, gaps, and blocked scopes. It does not print bearer tokens and it fails closed until all required inputs and approvals are present.

After the manifest is ready, run `npm run beta:readiness:external-beta-evidence-collector`, then verify with `npm run beta:readiness:operator-status-api`.

## Boundaries

This manifest does not record backend evidence, write Supabase, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.

Supabase classification remains `no write / environment none / SQL none / migration no`.

## Remaining Scopes

- External beta remains blocked until the deployed evidence collector and final operator-status readback pass.
- Real-user-media beta remains blocked until a separate scope approval evidence lane passes.
- Paid production remains blocked until a separate paid-production evidence collector passes.
- Public launch claims remain blocked until final operator status proves the exact scope.
