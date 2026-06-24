# FILM GPU / Heavy Runtime Policy

Phase: `TRACKA-FILM-FRAME-INTERPOLATION-SCOPE-DECISION-1`

FILM is blocked pending GPU/heavy runtime policy. The current repo does not approve TensorFlow, PyTorch, equivalent heavy ML runtimes, GPU runtime setup, model weight download/access, Docker execution, worker execution, provider/model calls, media processing, or render/export execution for FILM.

## Policy Answers

- FILM capability label: `film_frame_interpolation`.
- FILM owner: `atlas_tracka_scoped_capability_label_only`.
- GPU requirement: `expected_gpu_heavy`.
- ML runtime policy: `required_before_tensorflow_pytorch_or_equivalent_runtime`.
- Model weights: `not_accessed`.
- Install source: `not_changed`.
- Runtime: `not_run`.
- Install proof readiness: `blocked_pending_gpu_heavy_runtime_policy_and_ai_graphics_coordination`.
- Runtime proof readiness: `blocked_pending_gpu_heavy_runtime_policy_and_model_weight_policy`.

## Blocked Runtime Classes

- TensorFlow, PyTorch, or equivalent heavy runtime installation.
- GPU tooling, GPU image, GPU driver, or GPU host assumptions.
- FILM model-weight download, access, checksum, or execution.
- FILM media interpolation.
- Docker build, Docker push/deploy, Remotion execution, workers/routes/providers/models, Supabase, SQL, and beta/production/final delivery.

Package installation: `none`

Dependency mutation: `none`

Package-lock: `unchanged`
