# Phase 35F SAM2 Feature E2E Policy

Phase 35F is a private technical beta-readiness gate for the SAM2 text-behind-subject feature only.

Allowed:

- approved Phase 32 private export as preview source
- verified local source candidate only as evidence, not arbitrary media
- bounded preview frame extraction at 768x432 and max 8 fps
- max 125 frames
- approved private SAM2.1 tiny checkpoint/config from Phase 35B
- existing SAM2 L4 Cloud Run runtime job
- private masks, preview frames, metadata, and QA artifacts

Blocked:

- arbitrary real user media
- public media or public artifact access
- full 4K processing
- production full-video mask export
- final delivery export
- providers, Revideo, FILM, slow motion, and Real-ESRGAN
- external beta, paid production, broad real media, and production unlocks

Workers must execute the structured Phase 35F approved plan snapshot, not raw chat.
