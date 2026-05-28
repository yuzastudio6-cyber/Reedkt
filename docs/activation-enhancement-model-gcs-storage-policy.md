# Activation Enhancement Model GCS Storage Policy

Phase 34B stores approved Real-ESRGAN weights only in private staging generated-assets storage:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/`

Allowed objects:

- `RealESRGAN_x4plus.pth`
- `file_checksums_sha256.txt`
- `model_tree_manifest.json`

Blocked storage behavior:

- source-media buckets
- public buckets or public principals
- signed URL source-of-truth
- committed model files
- alternate model prefixes
- FILM, GFPGAN, facexlib, anime, x2plus, or realesr-general weights

Phase 34B does not delete private GCS model storage after upload. Runtime verification in Phase 34C must copy from this private prefix and verify checksums before loading.
