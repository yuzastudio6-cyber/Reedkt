# Phase 31 Audio Cleanup Artifact Policy

Phase 31 artifacts must remain private.

- Loudness reports and normalized audio: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase31/<runId>/`.
- Audio-normalized MP4 export: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/<runId>/`.
- QA and Phase 31 report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase31/<runId>/`.

No media, transcript, caption, or normalized export artifacts should be committed to git. Signed URLs are not a source of truth.
