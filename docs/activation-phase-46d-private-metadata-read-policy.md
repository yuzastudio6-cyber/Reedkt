# Phase 46D Private Metadata Read Policy

Phase 46D-AUTH-RERUN may read only JSON metadata from these exact private prefixes:

- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46b/generated-media-data-suite/phase46b-generated-media-data-suite-20260603/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46c/controlled-real-video-media-data/phase46c-controlled-real-video-media-data-suite-20260603/`

Reads require `REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_READ=true`.

Allowed objects are `.json` metadata reports only. Media files, generated videos, controlled video, frame images, thumbnails, broad bucket listings, arbitrary prefixes, public URLs, and signed URLs as source of truth remain blocked.

Committed reports may include hashes, object counts, file names, safe statuses, and redacted summaries. They must not include private media payloads or sensitive raw metadata.
