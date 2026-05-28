# Real-ESRGAN Runtime Image

This image is dedicated to Phase 34C generated-image runtime verification.

It runs only `RealESRGAN_x4plus` with the approved `RealESRGAN_x4plus.pth`
weight copied from private staging GCS at runtime. The weight is not baked into
the image.

Blocked in this image/runtime:

- FILM and slow motion
- alternate Real-ESRGAN weights
- GFPGAN/facexlib weights and face enhancement
- provider calls
- runtime model downloads
- real video or real frame inputs
- Revideo
- production, external beta, or broad real-media unlocks
