# Phase 40D Pro Color/Image Feature E2E QA Policy

Mandatory gates:

- `source_integrity`: approved Phase 32 input only, source private, no arbitrary media.
- `phase40c_evidence`: Phase 40C QA report exists, passed, and references private artifacts.
- `plan_snapshot_integrity`: approved Phase 40D snapshot exists and `rawPromptExecution=false`.
- `sample_bounds`: frame count <= 5, dimensions <= 768x432, no full-video extraction.
- `openimageio_feature`: OpenImageIO reads/writes feature sample frames and records metadata.
- `opencolorio_feature`: OpenColorIO validates a safe raw/identity transform without external config downloads.
- `kornia_feature`: Kornia CPU metrics/transform runs without model inference.
- `review_artifacts`: private contact sheet or review package and private review manifest exist.
- `artifact_privacy`: artifacts are under private staging GCS prefixes only.
- `feature_readiness_evidence`: automated QA has no blockers and internal-readiness evidence is recorded.
- `blocked_features`: full-video processing, final delivery, providers, Revideo, production, beta, and broad media stay blocked.

`proColorImageFeatureInternalTestingReady=true` is allowed only when mandatory
gates pass. Phase 45A readiness means only “ready for libass caption burn-in
validation,” not external beta, paid production, broad media, final delivery, or
production readiness.
