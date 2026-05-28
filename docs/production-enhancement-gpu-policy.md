# Production Enhancement GPU Policy

Real-ESRGAN and FILM are future GPU enhancement and interpolation candidates.

Milestone 11 does not upscale, restore, interpolate, enhance, or slow-motion any media. Both tools remain pending source-install and model-weight review.

Future execution must include artifact QA for hallucinated detail, warping, temporal instability, text distortion, face/product integrity, and meaning preservation.

## Activation Phase 34A

Phase 34A records staging-only approval for `RealESRGAN_x4plus` sample-first
enhancement planning. It is not runtime approval.

Still blocked:

- Real-ESRGAN weight download until Phase 34B
- Real-ESRGAN execution until a later runtime verification phase
- full-video blind enhancement
- FILM download/execution
- slow motion
- GPU deploy/jobs
- production, external beta, paid production, and broad real media

## Activation Phase 34B

Phase 34B is the only approved Real-ESRGAN model download step. It may store
`RealESRGAN_x4plus.pth` in private staging generated-assets storage with
checksum evidence. It does not run Real-ESRGAN, deploy GPU, process media,
enhance frames/video, or approve slow motion.

## Activation Phase 34C

Phase 34C ran one dedicated staging L4 Real-ESRGAN runtime verification job
against one generated synthetic image. It copied `RealESRGAN_x4plus.pth` from
private staging storage, verified checksum evidence, disabled face enhancement,
avoided runtime downloads, and wrote private enhancement QA.

Still blocked:

- real-video enhancement
- full-video enhancement
- FILM download/execution and slow motion
- alternate Real-ESRGAN, GFPGAN, and facexlib weights
- providers, public delivery, Revideo, production, external beta, paid production, and broad real media

## Activation Phase 34D

Phase 34D ran one bounded real-video-derived sample from the approved Phase 33D
representative frame. It used `RealESRGAN_x4plus` only, copied the model from
private staging storage, verified checksum evidence, and wrote private
before/after sample artifacts and QA.

Still blocked:

- full-frame enhancement
- full-video enhancement
- FILM download/execution and slow motion
- alternate Real-ESRGAN, GFPGAN, and facexlib weights
- providers, public delivery, Revideo, production, external beta, paid production, and broad real media
