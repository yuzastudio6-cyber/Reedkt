# Phase 38D Real-Video FILM Slow-Motion Results

Status: completed with warning-only QA.

Run ID: `phase38d-20260531T00471`

Cloud Run execution: `reeditpro-staging-film-runtime-job-pmxs7`

Runtime image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-film-runtime@sha256:50f94ec6289fbbdbba21ab11e89aed3a846015b6f26180c43da14cee7732f6ac`

Source:

- `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

Selected segment:

- Start: `6.9835s`
- End: `8.4835s`
- Duration: `1.5s`
- Source frames: `9`
- Frame size: `512x288`
- Preview frames: `17`

Model:

- FILM `film_net/Style/saved_model`
- Private GCS path: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/`
- Aggregate SHA-256: `6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b`

Cloud Run:

- Job: `reeditpro-staging-film-runtime-job`
- Image tag: `staging-film-real-video-slowmotion-001`
- CPU-only: `4` CPU, `8Gi`, parallelism `1`, max retries `0`
- Service account: `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`

Artifacts:

- Generated assets: `gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38d/phase38d-20260531T00471/`
- Previews: `gs://reeditpro-staging-reeditpro-previews/activation-film-runtime/phase38d/phase38d-20260531T00471/`
- QA report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-film-runtime/phase38d/phase38d-20260531T00471/reports/phase38d-report.json`
- QA JSON: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-film-runtime/phase38d/phase38d-20260531T00471/qa/film-real-video-slowmotion-qa.json`
- Preview MP4: `gs://reeditpro-staging-reeditpro-previews/activation-film-runtime/phase38d/phase38d-20260531T00471/preview/film-slowmotion-preview.mp4`

QA:

- `source_integrity`: passed
- `plan_snapshot_integrity`: passed
- `segment_bounds`: passed
- `model_artifacts`: passed
- `runtime_integrity`: passed
- `interpolated_artifacts`: passed
- `motion_sanity`: passed
- `preview_artifacts`: passed
- `artifact_privacy`: passed
- `blocked_features`: passed
- Warnings: selected real-video segment only; human visual review is required before broader use.

Phase 38E readiness:

- Ready for FILM private feature E2E readiness gate only.
- Not ready for full-video interpolation, final delivery, audio stretch, production, external beta, paid production, or broad real media.

Blocked:

- Full-video interpolation
- Full-video slow motion
- Final delivery export
- Audio stretch
- Providers
- Revideo
- Track B tools
- Production, external beta, paid production, and broad real media
