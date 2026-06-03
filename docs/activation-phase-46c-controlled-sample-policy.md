# Phase 46C Controlled Sample Policy

Phase 46C is locked to the Phase 32 private export already used by the Phase
37D OCR safe-zone chain. The activation runner has no CLI argument for an
arbitrary source path or GCS URI.

Before any analysis, the runner must:

- describe the private GCS object without signed URLs
- copy only the approved private object
- verify SHA-256 against committed Phase 32/37D evidence
- process only the `6.9s` to `8.9s` window and six approved offsets
- keep all media-derived images, thumbnails, clips, and raw metrics private.

If source metadata, copy, checksum, or sample policy validation fails, Phase 46C
is blocked and Phase 46D must not start.
