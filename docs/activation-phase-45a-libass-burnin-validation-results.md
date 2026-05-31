# Phase 45A Libass Caption Burn-In Validation Results

Status: completed

Phase 45A validates FFmpeg/libass caption burn-in on the approved controlled
Phase 32 private export using the existing Phase 28 ASS caption sidecar.

## Approved Inputs

- Source video: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- Caption source: `gs://reeditpro-staging-reeditpro-transcripts/activation-real-video/phase28/phase28-20260528T01552/captions/captions.ass`
- Caption SHA-256: `a103dd9a1252c48de27d1b4daf4e87180786bbdb781426fcc2888718cf8bc6de`
- Phase 40D run: `phase40d-20260531T12493`

## Execution

- Run ID: `phase45a-20260531T19033`
- Cloud Run execution: `reeditpro-staging-libass-burnin-validation-job-2g4zq`
- Runtime job: `reeditpro-staging-libass-burnin-validation-job`
- Runtime image tag: `staging-libass-burnin-validation-001`
- Runtime image digest: `sha256:aaf8b0095354511bc4a77654b8291ac66c913349781a8baca243aa176aa61438`
- Runtime mode: `libass_caption_burnin_validation`
- Compute: CPU-only, 4 CPU, 4Gi memory, parallelism 1, max retries 0
- Preview: 5 seconds from `0s`, 432x768, video-only
- First execution `reeditpro-staging-libass-burnin-validation-job-wkglw` was blocked by an overly strict FFmpeg filter-list detector even though the image contained libass/subtitles support. The worker detector was corrected and the bounded retry passed.

## Private Artifacts

- Burn-in preview: `gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4`
- Approved plan snapshot: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45a/phase45a-20260531T19033/plan/approved-plan-snapshot.json`
- Source validation: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45a/phase45a-20260531T19033/source/source-validation.json`
- Caption validation: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45a/phase45a-20260531T19033/captions/caption-validation.json`
- Preview validation: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/ffprobe-preview-validation.json`
- QA report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45a/phase45a-20260531T19033/qa/libass-burnin-qa.json`
- Phase 45A report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45a/phase45a-20260531T19033/reports/phase45a-report.json`

## QA Gates

- `source_integrity`: passed
- `caption_sidecar_integrity`: passed
- `libass_filter_available`: passed
- `burnin_preview_created`: passed
- `preview_decodes`: passed
- `duration_bounds`: passed
- `no_final_delivery`: passed
- `artifact_privacy`: passed
- `blocked_features`: passed

## Readiness

- Phase45B Remotion render validation: ready only for Remotion render validation.
- Final delivery: blocked.
- Production/external beta/broad real media: blocked.
- Providers/Revideo/Track B: blocked.

## Warnings

- Phase 45A created a bounded private caption burn-in preview only.
- No final delivery, production, external beta, paid production, broad media, provider, Revideo, Track B, or public delivery scope is approved.
