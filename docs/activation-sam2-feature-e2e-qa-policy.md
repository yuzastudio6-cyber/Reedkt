# Phase 35F SAM2 Feature E2E QA Policy

Required QA gates:

- `source_integrity`: approved source/export only, no arbitrary media
- `plan_snapshot_integrity`: approved snapshot exists and raw prompt execution is false
- `preview_scope`: bounded resolution, FPS, and frame cap
- `model_integrity`: approved private SAM2 model/config and checksums
- `sam2_mask_tracking`: masks exist, match frames, and are non-empty
- `composition_integrity`: private text-behind-subject preview frames exist
- `artifact_privacy`: private GCS prefixes only, no public or signed URLs
- `beta_readiness_evidence`: internal SAM2 feature testing evidence only
- `blocked_features`: providers, Revideo, FILM, slow motion, Real-ESRGAN, public export, production, external beta, paid production, and broad media remain blocked

Readiness outcomes:

- `ready_for_internal_sam2_feature_testing`: full controlled private preview scope passes with no blockers.
- `ready_for_segment_level_internal_testing_only`: fallback segment scope passes, but full feature beta readiness remains blocked.
- `blocked`: any required gate has blocking failures.

Human visual review is recommended before broader use, even when automated QA passes.
