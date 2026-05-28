# Activation Real-ESRGAN Runtime Runbook

Phase 34C verifies the dedicated Real-ESRGAN runtime on one generated synthetic
image only.

Allowed:

- `RealESRGAN_x4plus.pth` from private staging GCS
- one generated 128x128 PNG fixture
- one private enhanced PNG and QA report
- one L4 Cloud Run job execution

Blocked:

- real video or real frame processing
- full-video enhancement
- FILM and slow motion
- alternate Real-ESRGAN weights
- GFPGAN/facexlib weights and face enhancement
- runtime model downloads
- providers, public URLs, Revideo, production, external beta, and broad real media

Execution requires `REEDITPRO_ENV=staging` and
`REEDITPRO_CONFIRM_REAL_ESRGAN_RUNTIME=true`.
