# Activation Mask Model Storage Policy

Approved staging mask weights must use private staging model storage.

## BiRefNet Phase 33A Path

- Staging storage: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/`
- Runtime path: `/opt/reeditpro/model-weights/birefnet/main`
- Runtime temp path: `/tmp/reeditpro-model-weights/birefnet/main`

## Rules

- no model files in git
- no source-media bucket for model weights
- no public buckets
- no signed URL as source of truth
- no download in Phase 33A
- checksum remains `missing_until_download` until Phase 33B

Retention is private staging retention for review and later runtime verification.
Cleanup must be explicit and scoped to the BiRefNet model-weight prefix only.
