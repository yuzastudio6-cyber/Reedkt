# Phase 38C FILM Runtime QA Policy

Mandatory QA gates:

- `model_artifacts`: Phase 38B private GCS artifact files copied and hashes match.
- `runtime_integrity`: TensorFlow loads the FILM SavedModel and returns an image.
- `fixture_integrity`: generated-only input frames exist and match expected bounds.
- `interpolated_frame_artifacts`: one private interpolated midpoint frame exists.
- `motion_sanity`: interpolated output is non-empty and differs from source frames.
- `artifact_privacy`: outputs are under private staging GCS prefixes only.
- `blocked_features`: real video, full-video interpolation, providers, Revideo,
  production, beta, public access, and broad media stay blocked.

Phase 38D readiness is true only if all mandatory gates pass without blockers.
Readiness means only that a controlled selected real-video slow-motion sample
may be planned; it is not approval for full-video interpolation, production, or
external beta.
