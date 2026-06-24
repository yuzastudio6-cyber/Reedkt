# AI Graphics Runtime Boundary Handoff Capability Map

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_handoff_review_passed_with_warnings`

## Capabilities

- `chart_overlay`: handoff reviewed for canonical agent selection planning/study metadata only.
- `data_visualization`: handoff reviewed for canonical agent selection planning/study metadata only.
- `svg_graphics`: handoff reviewed for canonical agent selection planning/study metadata only.
- `diagram_graphics`: handoff reviewed for canonical agent selection planning/study metadata only.
- `animation_overlay`: handoff reviewed for canonical agent selection planning/study metadata only.
- `canvas_scene`: handoff reviewed for canonical agent selection planning/study metadata only.
- `webgl_3d_scene`: handoff reviewed for canonical agent selection planning/study metadata only.
- `background_removal`: handoff reviewed for canonical agent selection planning/study metadata only.
- `subject_segmentation`: handoff reviewed for canonical agent selection planning/study metadata only.
- `upscaling`: handoff reviewed for canonical agent selection planning/study metadata only.
- `tensor_image_ops`: handoff reviewed for canonical agent selection planning/study metadata only.
- `model_runtime_foundation`: handoff reviewed for canonical agent selection planning/study metadata only.

## Runtime Buckets

- `planning_metadata_allowed_now`: preserved in handoff; no current execution approval.
- `cpu_static_execution_previously_validated_but_not_agent_executable_now`: preserved in handoff; no current execution approval.
- `browser_chart_runtime_later`: preserved in handoff; no current execution approval.
- `animation_runtime_later`: preserved in handoff; no current execution approval.
- `browser_canvas_webgl_runtime_later`: preserved in handoff; no current execution approval.
- `model_cpu_gpu_runtime_later`: preserved in handoff; no current execution approval.
- `tool_route_handoff_later`: preserved in handoff; no current execution approval.
- `worker_handoff_later`: preserved in handoff; no current execution approval.
- `public_artifact_and_signed_url_later`: preserved in handoff; no current execution approval.

## Safety Boundary

- Agent selection may consume runtime-boundary metadata only for planning/study metadata.
- CPU/static validated tools remain not agent-executable.
- Browser chart runtime remains future-only.
- Animation runtime remains future-only.
- Browser/canvas/WebGL runtime remains future-only.
- Model CPU/GPU runtime remains future-only.
- Tool Route handoff remains future-only.
- Worker handoff remains future-only.
- Public artifacts and signed URLs remain future-only.
- Track B remains under TRACK_B_MEDIA_OSS_STEWARD as evidence-only exclusion context.
- Track A render/export exclusion via PR #544 remains evidence-only context.
- Internal owner labels are not product-facing capability names.
- No E2E proof, runtime readiness, internal beta, external beta, or production readiness is approved.
