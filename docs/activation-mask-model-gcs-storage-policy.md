# Activation Mask Model GCS Storage Policy

BiRefNet Phase 33B model files are stored only in private staging generated-assets
model storage:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/`

Rules:

- no source-media bucket for model weights
- no public principals
- no signed URL as source of truth
- no model files in git
- no SAM2 or unrelated model files in the BiRefNet prefix
- no bucket deletion during cleanup

Phase 33B retains private GCS model storage for Phase 33C runtime verification.
