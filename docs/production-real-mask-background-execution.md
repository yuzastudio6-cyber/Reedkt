# Production Real Mask Background Execution

Milestone 15C turns mask, background removal, subject cutout, and text-behind-subject planning into a controlled server-only execution path.

The flow is approved payload validation, mask task planning, model/tool command planning, fallback planning, private mask artifacts, metadata-only text-behind-subject composition, and QA gates. BiRefNet, SAM2, transparent-background, rembg, OpenCV, and Kornia stay skip-safe unless explicitly enabled in local-dev with already available tools and reviewed/local-safe weights.

M15C does not final render/export, run Revideo, download models, run unapproved GPU jobs, call providers, deploy, run enhancement/upscaling, or overwrite source/proxy media.

M16A final render/export consumes private mask, cutout, and depth composition metadata artifacts for render layers and re-checks render asset integrity and mask coverage gates.

## Activation Phase 33A

Phase 33A does not execute mask/background/text-behind-subject work. It only
creates the staging approval workflow for `ZhengPeng7/BiRefNet` as the first
single-frame background-removal model scope. SAM2 tracking, text-behind-subject,
GPU runtime, model downloads, and real mask execution remain blocked until later
explicit phases.

## Activation Phase 33D

Phase 33D executed the first controlled real-video BiRefNet mask test on exactly
one representative frame from the approved Phase 32 private export. It produced
private frame, mask, RGBA cutout, metadata, and QA artifacts with no blocking
mask QA failures.

This is not production approval. Full-video masks, SAM2 tracking,
text-behind-subject execution, public delivery, external beta, and broad real
media remain blocked until later explicit phases.
