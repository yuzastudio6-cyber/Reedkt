# Controlled Real-Video OCR Safe-Zone Policy

Phase 37D has two separate surfaces:

- The metadata-only planning gate validates private GCS paths, controlled-chain run IDs, approved OCR evidence, selected sample bounds, and future artifact schemas.
- The guarded execution follow-up runs only after current-shell confirmations are set and may process exactly the one approved private sample/window.

The metadata-only gate must not:

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

The execution follow-up must not process anything beyond the approved source, `6.9s`-`8.9s` window, and six offsets. It may upload private JSON QA artifacts only; raw frames and overlays remain local temp only.

The only selected source is the private Phase 32 color-corrected export. Any public URL, signed URL, alternate bucket, alternate source object, extra window, or extra sample blocks both gate and execution paths.
