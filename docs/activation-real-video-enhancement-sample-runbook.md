# Activation Real Video Enhancement Sample Runbook

Phase 34D runs one controlled Real-ESRGAN enhancement sample from the approved Phase 33D representative frame.

Allowed:

- read `phase33d-20260528T161056` representative frame only
- create one bounded sample crop
- run `RealESRGAN_x4plus` on that crop only
- write private before/after sample artifacts and QA

Blocked:

- full-frame enhancement
- full-video enhancement
- FILM and slow motion
- GFPGAN/facexlib face enhancement or weights
- runtime model downloads
- providers, public URLs, Revideo, production, external beta, and broad real media

Execution requires `REEDITPRO_ENV=staging` and `REEDITPRO_CONFIRM_REAL_VIDEO_ENHANCEMENT_SAMPLE=true`.
