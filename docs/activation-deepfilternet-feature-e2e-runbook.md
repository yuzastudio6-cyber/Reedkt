# Phase 36E DeepFilterNet Feature E2E Runbook

Phase 36E runs one private DeepFilterNet audio feature E2E on the approved Phase
32 controlled export only. `/Users/macuser/Downloads/IMG_6024.MOV` is not used
in this phase.

## Scope

- Source video:
  `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- Reference audio:
  `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4`
- Prior evidence: Phase 36C generated-audio runtime and Phase 36D controlled
  real-video cleanup sample.
- Tool: DeepFilterNet v0.5.6 from the private Phase 36B artifact prefix.
- Runtime: CPU-only Cloud Run Job `reeditpro-staging-deepfilternet-runtime-job`.

## Commands

```sh
npm run activation:deepfilternet-feature-e2e:report
npm run activation:deepfilternet-feature-e2e:iam-plan
```

Execution requires the explicit confirmation:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_DEEPFILTERNET_AUDIO_FEATURE_E2E=true \
npm run activation:deepfilternet-feature-e2e -- --execute
```

Successful execution creates private GCS artifacts and copies the private review
MP4 to `/Volumes/backup/codex-results/reeditpro/phase36e-deepfilternet-feature-e2e/<runId>/`.
