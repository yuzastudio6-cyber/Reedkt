# Phase 45B Remotion Render Validation Results

Status: completed

Phase 45B validated the private Remotion render path using the approved controlled Phase 32 source and Phase 45A libass caption burn-in evidence.

## Approved Inputs

- Source video: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- Phase 45A run: `phase45a-20260531T19033`
- Phase 45A preview: `gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4`
- Phase 45A report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45a/phase45a-20260531T19033/reports/phase45a-report.json`

## Execution

- Run ID: `phase45b-20260531T19552`
- Cloud Run job: `reeditpro-staging-remotion-render-validation-job`
- Cloud Run execution: `reeditpro-staging-remotion-render-validation-job-l7tpj`
- Runtime image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-remotion-render-validation@sha256:27fbb6a509002334b827a7067d65af044cdbb58b4bada84fb3ad85b20e821baa`
- Runtime image digest: `sha256:27fbb6a509002334b827a7067d65af044cdbb58b4bada84fb3ad85b20e821baa`
- Runtime mode: `remotion_render_validation`
- Compute: CPU-only, 4 CPU, 8Gi memory, parallelism 1, max retries 0
- Preview: 5.056 seconds, 432x768, 30 fps

## Private Artifacts

- Approved plan snapshot: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45b/phase45b-20260531T19552/plan/approved-plan-snapshot.json`
- Source validation: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45b/phase45b-20260531T19552/source/source-validation.json`
- Remotion render metadata: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45b/phase45b-20260531T19552/metadata/remotion-render-metadata.json`
- Remotion preview: `gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45b/phase45b-20260531T19552/preview/remotion-render-preview.mp4`
- FFprobe preview validation: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45b/phase45b-20260531T19552/preview/ffprobe-preview-validation.json`
- QA report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45b/phase45b-20260531T19552/qa/remotion-render-qa.json`
- Phase 45B report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45b/phase45b-20260531T19552/reports/phase45b-report.json`

## QA Gates

- `source_integrity`: passed
- `phase45a_evidence`: passed
- `remotion_render_invoked`: passed
- `render_preview_created`: passed
- `ffprobe_preview_validation`: passed
- `duration_bounds`: passed
- `private_artifacts`: passed
- `no_final_delivery`: passed
- `blocked_features`: passed

## Notes

- Remotion was invoked through the dedicated private validation worker.
- The worker rendered from the approved Phase 45A preview using a Remotion `staticFile()` public-dir input inside the private container workspace.
- The dedicated Docker image pins Remotion runtime packages inside the image only; `package-lock.json` remains unchanged.
- No private preview MP4, private JSON report, logs, credentials, or large generated artifacts are committed.

## Readiness

- Phase45C OpenTimelineIO timeline validation: ready only for OpenTimelineIO timeline validation.
- Final delivery: blocked.
- Production/external beta/paid production/broad real media: blocked.
- Providers/Revideo/Track B: blocked.
