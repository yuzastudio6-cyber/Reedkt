# Phase 36E DeepFilterNet Feature E2E Artifact Policy

Canonical artifacts remain private in staging GCS:

- generated assets: plan snapshot, source validation, input WAV, cleaned WAV,
  checksum verification, runtime metadata
- final exports/private review: review MP4 and private review manifest
- analysis artifacts: audio metrics and loudness comparison
- QA artifacts: feature E2E QA JSON and Phase 36E report

The local backup copy is only for Finder review:

`/Volumes/backup/codex-results/reeditpro/phase36e-deepfilternet-feature-e2e/<runId>/deepfilternet-audio-feature-review.mp4`

Do not commit audio, video, private JSON reports, logs, credentials, or large
binary artifacts.
