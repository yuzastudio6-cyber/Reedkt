# Activation BiRefNet Runtime Policy

Phase 33C is a generated-image runtime verification only.

Allowed:

- dedicated BiRefNet runtime image
- Cloud Run Job using one NVIDIA L4 GPU
- private GCS model sync from the approved BiRefNet prefix
- generated synthetic image input only
- private mask, cutout, metadata, QA, and report artifacts

Blocked:

- real video or real frame input
- SAM2 and all non-BiRefNet models
- Hugging Face/model downloads at runtime
- providers and secrets
- RTX PRO 6000
- text-behind-subject
- Revideo
- public URLs or public buckets
- production, external beta, and broad real media
