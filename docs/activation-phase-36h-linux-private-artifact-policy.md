# Phase 36H Linux Private Artifact Policy

Private artifacts may be uploaded only to:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase36h/deepfilternet-controlled-speech/phase36h-linux-deepfilternet-runtime-completion-20260603-r5/`

Allowed private artifacts:

- JSON runtime smoke and QA reports
- Generated input/output audio
- Bounded controlled input/output audio
- Metrics reports
- Private artifact manifest

Committed artifacts are limited to safe JSON/Markdown metadata, object counts, sizes, hashes, and private GCS references. The repository must not commit audio/video payloads, frames, thumbnails, spectrogram images, raw transcripts, caches, logs with secrets, model files, or private media-derived payloads.
