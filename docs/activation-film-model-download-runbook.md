# FILM Model Download Runbook

Phase 38B downloads only the approved official FILM `film_net/Style/saved_model` TF2 Saved Model tree and uploads it to private staging GCS.

## Scope

- Source repo: `https://github.com/google-research/frame-interpolation`
- Checkpoint source: official README Google Drive TF2 Saved Models folder
- Selected artifact: `film_net/Style/saved_model`
- Target: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/`

## Execution

Static plan/report commands are non-mutating:

```sh
npm run activation:film-model-download:plan
npm run activation:film-model-download:report
```

Execution requires explicit staging confirmation:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_FILM_MODEL_DOWNLOAD=true \
npm run activation:film-model-download -- --execute
```

The runner verifies official README/license evidence, resolves the public Google Drive tree, downloads only `film_net/Style/saved_model` to `/tmp`, computes checksums, uploads private GCS artifacts, verifies uploaded object metadata, and deletes local temp artifacts by default.

## Blocked

FILM runtime, slow motion, real-video processing, full-video interpolation, Docker, Cloud Run, providers, Revideo, public URLs, production, external beta, paid production, and broad real media remain blocked.
