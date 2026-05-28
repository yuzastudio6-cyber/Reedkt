# Activation Enhancement Model Approval Runbook

Phase 34A creates a static approval workflow for enhancement and slow-motion model candidates. It does not download model weights, deploy GPU, process frames/video, run enhancement, run slow motion, call providers, create public URLs, or change launch gates.

Only `RealESRGAN_x4plus` under `xinntao/Real-ESRGAN` is staging-approved, and only for sample-first enhancement planning on a representative frame or short private sample. The approval supports Phase 34B download/load planning, Phase 34C runtime verification planning, and Phase 34D controlled enhancement sample planning.

FILM (`google-research/frame-interpolation`) is evaluated-only. Its Apache-2.0 repo evidence is recorded for future selected-clip slow-motion planning, but FILM model download and execution remain blocked.

Commands:

- `npm run activation:enhancement-model-approval:plan`
- `npm run activation:enhancement-model-approval:report`
- `npm run activation:enhancement-model-weight:summary`
- `npm run smoke:activation-enhancement-model-approval-workflow`

All commands are static/report-only. They must not download Real-ESRGAN or FILM weights, run Docker, run `gcloud`, execute GPU jobs, process media, or call providers.
