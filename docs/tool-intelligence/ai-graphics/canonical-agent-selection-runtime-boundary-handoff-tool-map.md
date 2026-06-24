# AI Graphics Runtime Boundary Handoff Tool Map

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_handoff_review_passed_with_warnings`

## Tools

- `torch_torchvision`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `transformers`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `sam2`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `birefnet`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `real_esrgan`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `kornia`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `rembg`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `transparent_background`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `d3`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `echarts`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `vega_lite`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `vega`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `satori`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `svgdotjs_svg_js`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `viz_js`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `lottie_web`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `animejs`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `three_js`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `pixi_js`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `konva`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `babylonjs`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.

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
