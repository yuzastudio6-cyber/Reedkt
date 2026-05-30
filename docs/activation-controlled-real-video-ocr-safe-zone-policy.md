# Controlled Real-Video OCR Safe-Zone Policy

Phase 37D is a metadata-only planning gate. It may validate private GCS paths, controlled-chain run IDs, approved OCR evidence, selected sample bounds, and future artifact schemas.

It must not:

- read or download media bytes
- extract frames
- run OCR on real video
- process arbitrary media
- upload artifacts
- mutate GCP or IAM
- build or push Docker images
- deploy or execute Cloud Run
- call providers
- integrate with caption/render QA
- use public URLs or signed URLs as source of truth
- touch Track A execution code
- unlock internal beta, external beta, paid production, or broad real-user media

The only selected source is the private Phase 32 color-corrected export. Any public URL, signed URL, alternate bucket, alternate source object, extra window, or extra sample blocks the gate.

Future real-video OCR execution requires a separate explicit phase and separate confirmations. Phase 37D defines those confirmations as future-only and blocks if they are set during this metadata gate.
