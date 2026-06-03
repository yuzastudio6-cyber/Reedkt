# Phase 46B Generated Artifact Policy

Committed artifacts are limited to safe metadata reports, docs, code, hashes,
object counts, and redacted summaries.

Do not commit generated videos, generated image binaries, generated thumbnails,
real media, real frames, private payloads, secrets, runtime caches, Python venvs,
or Node temp package installs.

Private QA artifacts may include generated fixture binaries only under:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46b/generated-media-data-suite/<run-id>/`

No public artifacts, public URLs, or signed URLs as source of truth are allowed.
