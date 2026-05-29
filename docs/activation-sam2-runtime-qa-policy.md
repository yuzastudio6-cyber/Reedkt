# Phase 35C SAM2 Runtime QA Policy

Required QA gates:

- `model_artifacts`: checkpoint/config copied from private GCS and checksums
  match Phase 35B evidence
- `runtime_integrity`: CUDA and NVIDIA L4 are confirmed and SAM2 initializes
- `fixture_integrity`: generated-only five-frame 512x512 fixture exists with
  prompt metadata
- `mask_artifacts`: one mask per frame exists, dimensions match, and masks are
  non-empty
- `temporal_fixture_consistency`: basic generated-fixture area/centroid sanity
  check passes
- `artifact_privacy`: outputs stay under private staging prefixes
- `blocked_features`: no real video, providers, Revideo, FILM, slow motion,
  full-video masks, or launch gates execute

Passing Phase 35C means only that Phase 35D may plan a controlled short
real-video temporal mask tracking test. It does not approve full-video masks or
text-behind-subject video.
