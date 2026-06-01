# Phase 36F Audio System Readiness Runbook

Phase 36F verifies the approved audio chain for internal audio feature testing
only. It validates Phase 31 and Phase 36A-36E evidence, verifies the private
Phase 36E artifacts in GCS, uploads a private beta-scope manifest, and emits a
private readiness report.

Execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_AUDIO_SYSTEM_INTERNAL_BETA_READINESS=true \
npm run activation:audio-system-readiness -- --execute
```

The phase must not process new media, use `IMG_6024.MOV`, download artifacts,
call providers, run RNNoise/Demucs, use Revideo, run FILM/slow motion, create
public URLs, or unlock production/external beta/broad media.
