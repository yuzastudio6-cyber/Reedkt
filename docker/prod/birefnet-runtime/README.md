# Phase 33C BiRefNet Runtime Image

Dedicated staging image for verifying `ZhengPeng7/BiRefNet` against one generated
synthetic image.

The image does not contain model weights. At runtime the worker copies the
approved BiRefNet snapshot from private staging GCS, verifies the Phase 33B
checksum, scans custom code, and runs local-only inference.

Blocked in this image:

- SAM2 and non-BiRefNet models
- provider SDKs and secrets
- runtime Hugging Face model downloads
- real video or real frame inputs
- text-behind-subject execution
- Revideo
