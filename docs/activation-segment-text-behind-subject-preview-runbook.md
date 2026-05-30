# Phase 35E Segment Text-Behind-Subject Preview Runbook

Phase 35E creates one controlled private text-behind-subject preview from the
approved Phase 35D SAM2 temporal mask artifacts. It uses only
`phase35d-20260530T004442`, the 6.9s-8.9s segment, 10 frames at 768x432, and
the fixed text `REEDITPRO`.

Default commands are report-only. Execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_SEGMENT_TEXT_BEHIND_SUBJECT_PREVIEW=true \
npm run activation:segment-text-behind-subject-preview -- --execute
```

The runner downloads only the Phase 35D segment manifest, prompt metadata, mask
metadata, QA report, frames, and masks. It composes preview frames with the
native Node PNG compositor and uploads private preview/metadata/QA artifacts.

Phase 35E does not create a final export, public URL, signed URL, full-video
mask, full-video text-behind-subject asset, provider request, Revideo render,
FILM/slow-motion output, Real-ESRGAN output, or production/beta unlock.

Local generated media and temp files must not be committed. `package-lock.json`
must remain unchanged.
