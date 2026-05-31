# Phase 38D Real-Video FILM Slow-Motion Results

Status: blocked.

Run ID: `phase38d-20260531T00414`

Cloud Run execution: `reeditpro-staging-film-runtime-job-kvrbc`

Runtime image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-film-runtime@sha256:50f94ec6289fbbdbba21ab11e89aed3a846015b6f26180c43da14cee7732f6ac`

Source:

- `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

Selected segment:

- Start: `6.9835s`
- End: `8.4835s`
- Duration: `1.5s`
- Source frames: `9`
- Frame size: `512x288`
- Expected preview frames: `17`

Model:

- FILM `film_net/Style/saved_model`
- Private GCS path: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/`
- Aggregate SHA-256: `6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b`

Cloud Run:

- Job: `reeditpro-staging-film-runtime-job`
- Image tag: `staging-film-real-video-slowmotion-001`
- CPU-only: `4` CPU, `8Gi`, parallelism `1`, max retries `0`

QA:

- Blocked. The initial Cloud Run execution failed before FILM inference because `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com` did not have `storage.objects.get` on the approved Phase 38D plan snapshot:
  `gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38d/phase38d-20260531T00414/plan/approved-plan-snapshot.json`.
- The implementation now includes a narrow conditional `phase38d-plan-read` `roles/storage.objectViewer` binding for the approved Phase 38D generated-assets prefix so the worker can validate the plan snapshot.
- A guarded retry was attempted after the targeted IAM correction, but `gcloud run jobs execute` was blocked by Google reauthentication: `Reauthentication failed. cannot prompt during non-interactive execution.`
- No Phase 38D runtime QA report exists yet.

Phase 38E readiness:

- Blocked until Phase 38D selected-segment runtime QA passes after Google auth is refreshed.

Human action required:

- Refresh Google Cloud CLI authentication for `aiediting@reeditpro.com`, for example with `gcloud auth login`, then rerun the bounded Phase 38D execution command from this branch.

Blocked:

- Full-video interpolation
- Final delivery export
- Audio stretch
- Providers
- Revideo
- Track B tools
- Production, external beta, paid production, and broad real media
