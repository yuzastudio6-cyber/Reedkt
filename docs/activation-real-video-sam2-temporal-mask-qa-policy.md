# Phase 35D Real-Video SAM2 QA Policy

Required QA gates:

- `source_integrity`: approved Phase 32 video and Phase 33D anchor artifacts only
- `segment_bounds`: segment duration <= 2.0s, frame count <= 12, bounded dimensions
- `model_artifacts`: Phase 35B checkpoint/config/aggregate checksums verified
- `prompt_integrity`: prompt derived from Phase 33D mask/frame evidence
- `runtime_integrity`: CUDA available on NVIDIA L4, SAM2 initialized
- `mask_artifacts`: one non-empty mask per extracted frame
- `temporal_consistency`: basic area/centroid sanity, warning-only pending visual review
- `artifact_privacy`: private staging prefixes only
- `blocked_features`: no full-video, providers, Revideo, FILM, slow motion, beta, or production

Phase 35E readiness is limited to controlled segment text-behind-subject preview
planning/execution. Passing Phase 35D does not approve full-video masks,
full-video text-behind-subject, production, external beta, or broad real media.
