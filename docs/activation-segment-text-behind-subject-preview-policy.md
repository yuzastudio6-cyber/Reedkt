# Phase 35E Segment Text-Behind-Subject Preview Policy

Allowed scope:

- Source run: `phase35d-20260530T004442`
- Source segment: 6.9s-8.9s, 2.0 seconds, 10 frames, 768x432
- Source masks: Phase 35D SAM2 mask sequence only
- Text: `REEDITPRO`
- Output: private preview frame sequence, composition metadata, QA report, and
  Phase 35E report

Blocked scope:

- arbitrary user media
- new video input
- full-video masks
- full-video text-behind-subject
- final delivery export
- public access or signed URLs as source of truth
- providers
- Revideo
- FILM or slow motion
- Real-ESRGAN
- model downloads
- production, external beta, paid production, or broad real media

The implementation uses a deterministic Node PNG compositor. Preview clip
assembly is optional and omitted when local FFmpeg is unavailable; private
preview frames are the Phase 35E source of truth.
