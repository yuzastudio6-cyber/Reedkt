# FILM Model Download Policy

Phase 38B is a Track A private model download/load phase only.

## Allowed

- Resolve official FILM source/license evidence.
- Download exactly `film_net/Style/saved_model` from the official README Google Drive folder.
- Compute SHA-256 checksums and aggregate checksum.
- Upload model files and evidence manifests to the private staging generated-assets bucket.

## Required Environment

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_FILM_MODEL_DOWNLOAD=true`

## Hard Blocks

- `filmRuntimeAllowed=false`
- `slowMotionAllowed=false`
- `realVideoSlowMotionAllowed=false`
- `fullVideoInterpolationAllowed=false`
- `providerAllowed=false`
- `revideoAllowed=false`
- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `paidProductionAllowed=false`
- `broadRealUserMediaAllowed=false`

If public non-authenticated Google Drive access cannot resolve the official `film_net/Style/saved_model` tree, the phase blocks before download/upload.
