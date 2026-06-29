# Deployed Evidence Input Manifest - 2026-06-28

Decision: `beta_deployed_evidence_input_manifest_passed_ready_for_operator_staging_inputs`

This packet converts the local accepted evidence snapshot into the exact deployed-evidence input contract for the next beta tools gate. The deployed source SHA is intentionally operator-supplied at run time with `REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA`; it must match the staging release being evidenced.

The local accepted snapshot remains `docs/beta-readiness/local-accepted-evidence-bundle/2026-06-27-local-accepted-evidence-bundle.json`, captured at `5bc6abf0ef238d8038ea0b95877ca06dd73738fc`. Later source-truth PRs add metadata and smoke coverage; they do not change the accepted local tool behavior. The evidence collector must use the actual deployed source SHA for the release under test.

## Fixed Inputs

- `REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA=<current deployed staging source SHA>`
- `REEDITPRO_BETA_EXTERNAL_SOURCE_SHA=<same value as REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA>`
- `REEDITPRO_BETA_EXTERNAL_CONFIRM_EVIDENCE_SEQUENCE=true`
- `REEDITPRO_BETA_EXTERNAL_REQUIRE_EXTERNAL_BETA_READY=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS=ffmpeg,ffprobe,pyav,opentimelineio,hyperframe,remotion,sharp,duckdb,polars,pyscenedetect,opencv,opencolorio,openimageio`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT=14`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE=docker`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE=us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-libass-burnin-validation:staging-libass-burnin-validation-001`
- `REEDITPRO_BETA_PLATFORM_ENVIRONMENT=staging`

## Operator Inputs

The operator must provide the deployed staging API URL, bearer token, workspace/project IDs, separate idempotency keys for core tool evidence, libass evidence, platform evidence, and launch approval evidence, the wallet-settlement fixture event ID, platform attestations, and launch owner evidence notes.

Current evidence now includes a newer normal API deploy at source `d997d567d40853f59741763c8e9ca8b2c361148a`: `docs/beta-readiness/api-staging-deploy-current-source/2026-06-28-d997-api-staging-deploy.md`. GitHub Actions run [28335776268](https://github.com/yuzastudio6-cyber/Reedkt/actions/runs/28335776268) deployed `reeditpro-api-staging` revision `reeditpro-api-staging-00010-c6h` in `us-east1` with image `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-api:api-staging-d997d567d408-20260628T2058Z`; unauthenticated `GET /health` returned HTTP `403` for both the service URL and canonical Cloud Run URL. The current-source API deployment preflight packet `docs/beta-readiness/api-deployment-preflight/2026-06-28-d997-api-deployment-preflight-passed.md` passed and supersedes the old blocked API-preflight packet for this deployed source. The current technical-input manifest gap packet `docs/beta-readiness/deployed-evidence-input-manifest/2026-06-28-d997-technical-inputs-owner-approval-gap.md` confirms value gaps and secret-like paths are `0`; owner approval booleans and evidence notes are the remaining manifest blocker.

Tool evidence should use `reeditpro-tool-readiness-staging` because it contains the safe command/import dependencies for the 13 core checks. Platform evidence, launch approval evidence, and final status readback can use `reeditpro-api-staging`. Both services are authenticated-only and staging-only.

The latest report-only platform probe is still recorded at `docs/beta-readiness/platform-technical-probe-current-state/2026-06-28-a735-platform-technical-probe.md`: 8 of 9 technical checks passed on the normal API, and the remaining non-passing probe is billing-owner Stripe-boundary approval. That probe has not been rerun at `d997d567d40853f59741763c8e9ca8b2c361148a`; authenticated current-source preflight/probe and every owner approval remain required before recording a platform evidence packet.

Current owner approval collection should start with `npm run beta:readiness:owner-approval-packet` or `docs/beta-readiness/owner-approval-packet-current-gates/2026-06-28-owner-approval-packet-current-gates.md`. That packet names every platform and launch owner approval input and the non-secret evidence notes required before this manifest can become ready. Use `npm run beta:readiness:owner-approval-env-template` to generate an exact local fill-in template. Before rerunning this manifest with owner-provided values, run `npm run beta:readiness:source-freshness-preflight`, then `npm run beta:readiness:owner-approval-intake-preflight`; intake requires approval/attestation booleans to be explicitly `true`, rejects secret-like evidence notes, rejects real-user-media or paid-production scope flags, and avoids echoing evidence note values.

After source freshness and intake preflight pass, run `npm run beta:readiness:deployed-evidence-input-manifest`. It prints only input presence, expected non-secret values, gaps, and blocked scopes. It does not print bearer tokens and it fails closed until all required inputs and approvals are present.

After the manifest is ready, run `npm run beta:readiness:external-beta-evidence-collector`, then verify with `npm run beta:readiness:operator-status-api`.

## Boundaries

This manifest does not record backend evidence, write Supabase, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.

Supabase classification remains `no write / environment none / SQL none / migration no`.

## Remaining Scopes

- External beta remains blocked until the deployed evidence collector and final operator-status readback pass.
- Real-user-media beta remains blocked until a separate scope approval evidence lane passes.
- Paid production remains blocked until a separate paid-production evidence collector passes.
- Public launch claims remain blocked until final operator status proves the exact scope.
