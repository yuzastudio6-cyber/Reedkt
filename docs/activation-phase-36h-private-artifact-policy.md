# Phase 36H Private Artifact Policy

Private QA artifacts may be uploaded only when explicitly confirmed to:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase36h/deepfilternet-controlled-speech/<run-id>/`

Allowed private artifacts:

- JSON reports
- audio metrics
- safe hashes
- private generated/controlled enhanced WAV outputs
- safe manifests

Committed artifacts are limited to safe metadata reports and docs. Do not commit audio/video payloads, generated WAVs, cleaned WAVs, private media, logs with secrets, runtime caches, temp downloads, credentials, or signed URLs.
