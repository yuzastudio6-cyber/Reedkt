# Phase 35A SAM2 Model Approval Runbook

Phase 35A is a static, non-mutating approval workflow for SAM2. It reviews the
existing evaluated-only SAM2 evidence from Phase 33A and defines what must be
true before any future checkpoint download, runtime verification, or temporal
mask tracking phase.

## Current Decision

- Approval decision: pending human review.
- SAM2 planning recommendation: allowed for future staging review only.
- SAM2 download: blocked.
- SAM2 runtime: blocked.
- SAM2 temporal tracking: blocked.
- Full-video masks: blocked.
- Full-video text-behind-subject: blocked.
- Production, external beta, paid production, and broad real media: blocked.

## Evidence Reviewed

Phase 35A reuses the Phase 33A evidence for:

- `facebook/sam2-hiera-tiny`
- Meta `facebookresearch/sam2` official source/checkpoint evidence
- Apache-2.0 license claims recorded in the repo

No SAM2 weights are downloaded, no checksum is approved, no private SAM2 model
storage artifact exists, and no SAM2 runtime image/job is approved by this
phase.

## Future Phase Sequence

1. Phase 35B may download/load only the exact human-approved SAM2 checkpoint
   into private staging model storage and record checksums.
2. Phase 35C may verify runtime loading only on generated/synthetic fixtures.
3. Phase 35D may test one controlled short real-video temporal tracking sample
   only after runtime verification passes.
4. Phase 35E may plan a controlled text-behind-subject preview only if temporal
   mask QA passes.

## Must Not Run In Phase 35A

- SAM2 model downloads
- SAM2 runtime
- GPU jobs
- media processing
- Docker build/push
- Cloud Run deploy or execution
- GCS mutation
- provider calls
- public bucket or URL changes
- Revideo production path
