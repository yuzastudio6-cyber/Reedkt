# Phase 46C Storage And Privacy Policy

Phase 46C artifacts are private QA artifacts only.

Private prefix:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46c/controlled-real-video-media-data/<run-id>/`

Allowed private artifacts include JSON reports, bounded metrics CSV, private
sampled frame PNGs, private bounded-window clip, private thumbnails, and private
artifact manifests.

Committed artifacts must be metadata-only: JSON reports, hashes, sizes, object
counts, safe references, and redacted summaries. Real-media-derived binary
frames, thumbnails, clips, public URLs, signed URLs, secrets, and private raw
payloads must not be committed.
