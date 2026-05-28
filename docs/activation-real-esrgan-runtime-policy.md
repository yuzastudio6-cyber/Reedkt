# Activation Real-ESRGAN Runtime Policy

Phase 34C is locked to:

- Project: `reeditpro`
- Region: `us-central1`
- Job: `reeditpro-staging-real-esrgan-runtime-job`
- GPU: one `nvidia-l4`
- Model manifest: `real_esrgan_x4plus_staging_v1`
- Model path: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/`
- Runtime path: `/tmp/reeditpro-model-weights/real-esrgan/x4plus`

The runtime must verify:

- file SHA-256 `4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1`
- aggregate SHA-256 `5cee93bc531570df59a772293ecae30f89c4519f93478cbb74ddce9f0e9bb4a5`
- exactly one model file, `RealESRGAN_x4plus.pth`

The runtime fails closed if it sees FILM, alternate Real-ESRGAN, GFPGAN,
facexlib, provider, public delivery, runtime model download, real-media, or
slow-motion behavior.
