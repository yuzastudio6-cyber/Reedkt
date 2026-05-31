# Phase 39A VLM Private Artifact Policy

Phase 39A reports are safe metadata. They may include source URLs, candidate ids, blocked scopes, future GCS prefixes, risk notes, and handoff requirements.

Phase 39A reports must not include:

- model, tokenizer, processor, or runtime payload bytes
- raw prompts for real media
- images, frames, videos, screenshots, or arbitrary files
- GCS signed URLs
- credentials, secrets, tokens, or secret-derived logs
- public output URLs
- Track A execution outputs

Future Phase 39C and Phase 39D QA artifacts, if approved, must be JSON-only, private, redacted where derived from private media, and stored under their dedicated QA prefixes:

- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-runtime/<run-id>/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39d/controlled-real-frame-vlm/<run-id>/`
