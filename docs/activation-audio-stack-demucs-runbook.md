# Phase 36G Audio Stack Demucs Runbook

Phase 36G corrects the audio AI product stack after the Phase 36F internal
audio readiness gate.

## Decision

- DeepFilterNet remains the internal speech-cleanup engine for Clean Voice,
  Enhance Speech, Remove Background Noise, speech denoise, and voice cleanup.
- RNNoise is removed from active product routing and fallback execution.
- Demucs is the intended candidate for Separate Vocals, Remove Background
  Music, Split Audio Stems, isolate voice, and vocal/music separation.
- Demucs download/runtime is blocked because official pretrained-model
  license/provenance remains ambiguous.

## Commands

```sh
npm run activation:audio-stack-demucs:report
npm run activation:audio-stack-demucs:iam-plan
npm run smoke:activation-audio-stack-demucs
```

Execution mode only records the evidence gate. It does not download models,
run Demucs, process media, build Docker images, deploy Cloud Run, or mutate GCS.

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_AUDIO_STACK_DEMUCS_E2E=true \
npm run activation:audio-stack-demucs -- --execute
```

## Blocked Scope

No arbitrary media, no `IMG_6024.MOV`, no provider calls, no Revideo, no FILM,
no slow motion, no public URLs, no public buckets, no external beta, no paid
production, no broad real media, and no Demucs runtime.
