# Phase 40B Pro Color/Image QA Policy

Mandatory QA gates:

- `tool_runtime_integrity`
- `fixture_integrity`
- `opencolorio_result`
- `openimageio_result`
- `kornia_result`
- `image_artifact_integrity`
- `metadata_integrity`
- `color_transform_safety`
- `artifact_privacy`
- `blocked_features`

Phase 40C readiness is true only when all mandatory gates pass. Readiness means
only that a controlled real-video pro color/image sample may be planned in
Phase 40C. It does not approve production, external beta, broad real media,
final delivery, public output, providers, Revideo, or Track B tools.

If OpenColorIO, OpenImageIO, or Kornia cannot install/import/run safely, record
the exact tool-level blocker and keep Phase 40C readiness false.
