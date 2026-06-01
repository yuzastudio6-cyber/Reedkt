# Phase 36D Real-Video DeepFilterNet Audio Cleanup Runbook

Phase 36D runs one controlled DeepFilterNet audio cleanup sample on the approved
Phase 32 private export only. It is not a production, external beta, arbitrary
media, or final delivery phase.

## Scope

- Source video:
  `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- Reference audio export:
  `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4`
- Tool: DeepFilterNet v0.5.6 from the private Phase 36B artifact prefix.
- Runtime: CPU-only Cloud Run Job `reeditpro-staging-deepfilternet-runtime-job`.

## Commands

Static report:

```sh
npm run activation:real-video:deepfilternet-audio-cleanup:report
```

IAM plan:

```sh
npm run activation:real-video:deepfilternet-audio-cleanup:iam-plan
```

Execution:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_REAL_VIDEO_DEEPFILTERNET_AUDIO_CLEANUP=true \
npm run activation:real-video:deepfilternet-audio-cleanup -- --execute
```

The execution path builds and pushes the dedicated runtime image, deploys the
CPU-only job, executes once, fetches the private QA report, and returns sanitized
evidence. Runtime artifacts remain in private GCS only.
