# Phase 30 Real Video Private Export Runbook

Phase 30 creates one private review export from the approved Phase 28/29 real-video artifacts.

Allowed scope:

- Source run: `phase28-20260528T01552`
- Timeline run: `phase29-20260528T02254`
- Export worker: staging render worker only, no GPU
- Output: private MP4 in `reeditpro-staging-reeditpro-final-exports`

Execution requires `REEDITPRO_ENV=staging` and `REEDITPRO_CONFIRM_REAL_VIDEO_PRIVATE_EXPORT=true`.

The first Phase 30 export uses caption sidecars only. Caption burn-in remains skipped until a real-video libass path is separately validated.

Still blocked: production readiness, external beta, broad real-media testing, providers, model downloads, public URLs, Revideo, color/audio cleanup, masks, enhancement, and GPU work.
