# AI Graphics / Worker Owner Boundary

Packet: `TRACKA-FILM-GPU-POLICY-AI-GRAPHICS-COORDINATION-1`

Decision: `blocked_pending_ai_graphics_owner_acceptance_gpu_runtime_policy_and_model_weight_policy`

## Boundary

Track A owns only the FILM render/export capability label, acceptance criteria, and future handoff requirements.

AI Graphics / Worker must own or explicitly coordinate:

- model runtime policy;
- model-weight source and storage policy;
- GPU execution policy;
- inference implementation;
- heavy ML dependency policy;
- worker runtime lane and artifact privacy;
- QA and cleanup policy for any generated or private evidence.

## Current Ownership Status

- FILM owner: `atlas_tracka_scoped_capability_label_only`.
- Track A responsibility: `render_export_capability_label_acceptance_criteria_and_future_handoff_requirements`.
- AI Graphics / Worker responsibility: `required_for_model_runtime_model_weights_gpu_execution_and_ml_dependency_policy`.
- AI Graphics / Worker coordination: `required_before_any_install_or_runtime`.
- FILM install proof readiness: `blocked_pending_ai_graphics_owner_acceptance_gpu_runtime_policy_and_model_weight_policy`.
- FILM runtime proof readiness: `blocked_pending_ai_graphics_owner_acceptance_gpu_runtime_policy_model_weight_policy_and_worker_runtime_lane`.

No owner acceptance, runtime, or model-weight approval is recorded in this packet.
