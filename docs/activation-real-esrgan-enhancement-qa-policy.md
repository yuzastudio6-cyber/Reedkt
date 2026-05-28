# Activation Real-ESRGAN Enhancement QA Policy

Phase 34C QA is limited to generated-image runtime verification.

Required gates:

- `enhancement_artifacts`: fixture and enhanced PNG exist, enhanced output is x4, and file size is non-zero.
- `render_asset_integrity`: metadata, QA, and report artifacts exist for the same run.
- `sample_first_policy`: only the generated fixture is processed.
- `runtime_safety`: no runtime model downloads, providers, GFPGAN/facexlib weights, face enhancement, FILM, slow motion, public access, or secrets.

QA must not claim real-video quality improvement, hallucination safety, temporal
stability, or full-video readiness from this generated-image run.
