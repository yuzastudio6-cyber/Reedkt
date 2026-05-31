# Phase 38D Real-Video FILM Slow-Motion Runbook

Phase 38D executes one Track A controlled real-video FILM slow-motion sample only.

Approved source:

- `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

Approved model:

- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/`
- Aggregate SHA-256: `6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b`

Execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_FILM_REAL_VIDEO_SLOWMOTION=true \
npm run activation:real-video:film-slowmotion -- --execute
```

The runner builds and deploys the CPU FILM worker image, uploads an approved plan snapshot, and executes `reeditpro-staging-film-runtime-job` once.

The sample is bounded to `6.9835s-8.4835s`, `9` source frames at `512x288`, and `17` preview frames after midpoint interpolation.

Blocked in Phase 38D: full-video interpolation, audio stretch, final delivery export, providers, Revideo, Track B tools, public access, production, external beta, paid production, and broad real media.
