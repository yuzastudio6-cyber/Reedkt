# Phase 38D Real-Video FILM Slow-Motion Policy

Phase 38D policy is Track A visual/video only.

Allowed:

- One approved Phase 32 private export as input.
- One bounded selected segment centered on the existing visual anchor timestamp.
- Private Phase 38B FILM `film_net/Style/saved_model` artifacts.
- CPU-only Cloud Run job execution with `4` CPU, `8Gi`, parallelism `1`, max retries `0`.
- Private GCS uploads under Phase 38D generated, preview, QA, and optional worker-temp prefixes.

Required plan:

- Segment start: `6.9835s`
- Segment end: `8.4835s`
- Segment duration: `1.5s`
- Source frames: `9`
- Source FPS: `6`
- Frame size: `512x288`
- Output frames: `17`
- Output cap: `24`

Always blocked:

- Full-video interpolation
- Final delivery export
- Audio preservation/stretching
- Public URLs or public buckets
- Providers
- Revideo
- Track B audio/OCR tools
- Production, external beta, paid production, and broad real media
