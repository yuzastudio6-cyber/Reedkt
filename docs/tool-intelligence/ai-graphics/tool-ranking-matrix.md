# AI Graphics Tool Ranking Matrix

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

Scoring model: capabilityFit 0-25, outputQualityPotential 0-20, reliabilityProof 0-15, cloudReadiness 0-10, costEfficiency 0-10, integrationSimplicity 0-10, safetyAndControl 0-10, totalScore 0-100.

| Tool | Display | Capabilities | Tier | Score | Proof | Runtime |
| --- | --- | --- | --- | ---: | --- | --- |
| `torch_torchvision` | Torch / Torchvision | `model_runtime_foundation`, `tensor_image_ops`, `planning_metadata_only`, `blocked_or_deferred` | Blocked | 45 | owner_assigned_no_import_or_model_proof | blocked_pending_cpu_import_model_boundary_and_gpu_policy |
| `transformers` | Transformers | `model_runtime_foundation`, `planning_metadata_only`, `blocked_or_deferred` | Blocked | 44 | owner_assigned_no_import_or_model_proof | blocked_pending_cpu_import_model_boundary_and_model_weight_policy |
| `sam2` | SAM2 | `subject_segmentation`, `background_removal`, `planning_metadata_only`, `blocked_or_deferred` | Blocked | 50 | owner_assigned_no_model_proof | blocked_pending_model_weight_provenance_and_gpu_policy |
| `birefnet` | BiRefNet | `background_removal`, `subject_segmentation`, `planning_metadata_only`, `blocked_or_deferred` | Blocked | 49 | owner_assigned_no_model_proof | blocked_pending_model_weight_provenance_and_gpu_policy |
| `real_esrgan` | Real-ESRGAN | `upscaling`, `planning_metadata_only`, `blocked_or_deferred` | Blocked | 51 | owner_assigned_no_model_proof | blocked_pending_model_weight_provenance_and_gpu_policy |
| `kornia` | Kornia | `tensor_image_ops`, `model_runtime_foundation`, `planning_metadata_only`, `blocked_or_deferred` | Blocked | 52 | owner_assigned_no_import_proof | blocked_pending_cpu_import_proof |
| `rembg` | rembg | `background_removal`, `planning_metadata_only`, `blocked_or_deferred` | Tier D | 42 | owner_assigned_backlog_decision_pending | blocked_pending_backlog_redundancy_review |
| `transparent_background` | transparent-background | `background_removal`, `planning_metadata_only`, `blocked_or_deferred` | Tier D | 41 | owner_assigned_backlog_decision_pending | blocked_pending_backlog_redundancy_review |
| `d3` | D3 | `chart_overlay`, `data_visualization`, `svg_graphics`, `diagram_graphics`, `planning_metadata_only` | Tier A | 90 | canonical_package_proof_and_cpu_static_validation_passed | planning_metadata_only_runtime_blocked |
| `echarts` | ECharts | `chart_overlay`, `data_visualization`, `planning_metadata_only`, `blocked_or_deferred` | Tier B | 74 | canonical_package_import_static_fixture_proof_only | blocked_pending_browser_chart_runtime |
| `vega_lite` | Vega-Lite | `chart_overlay`, `data_visualization`, `planning_metadata_only` | Tier A | 93 | canonical_package_proof_and_cpu_static_validation_passed | planning_metadata_only_runtime_blocked |
| `vega` | Vega | `chart_overlay`, `data_visualization`, `planning_metadata_only` | Tier A | 88 | canonical_package_proof_and_cpu_static_validation_passed | planning_metadata_only_runtime_blocked |
| `satori` | Satori | `svg_graphics`, `planning_metadata_only` | Tier A | 84 | canonical_package_proof_and_cpu_static_validation_passed | planning_metadata_only_runtime_blocked |
| `svgdotjs_svg_js` | SVG.js | `svg_graphics`, `diagram_graphics`, `planning_metadata_only` | Tier A | 91 | canonical_package_proof_and_cpu_static_validation_passed | planning_metadata_only_runtime_blocked |
| `viz_js` | Viz.js | `diagram_graphics`, `svg_graphics`, `planning_metadata_only` | Tier A | 89 | canonical_package_proof_and_cpu_static_validation_passed | planning_metadata_only_runtime_blocked |
| `lottie_web` | Lottie Web | `animation_overlay`, `planning_metadata_only`, `blocked_or_deferred` | Tier B | 75 | canonical_package_import_static_fixture_proof_only | blocked_pending_animation_runtime_approval |
| `animejs` | Anime.js | `animation_overlay`, `planning_metadata_only`, `blocked_or_deferred` | Tier B | 73 | canonical_package_import_manifest_proof_only | blocked_pending_animation_runtime_approval |
| `three_js` | Three.js | `webgl_3d_scene`, `planning_metadata_only`, `blocked_or_deferred` | Tier B | 69 | canonical_package_import_manifest_proof_only | blocked_pending_browser_webgl_canvas_sandbox |
| `pixi_js` | PixiJS | `canvas_scene`, `planning_metadata_only`, `blocked_or_deferred` | Tier B | 69 | canonical_package_import_manifest_proof_only | blocked_pending_browser_webgl_canvas_sandbox |
| `konva` | Konva | `canvas_scene`, `planning_metadata_only`, `blocked_or_deferred` | Tier B | 69 | canonical_package_import_manifest_proof_only | blocked_pending_browser_canvas_sandbox |
| `babylonjs` | Babylon.js | `webgl_3d_scene`, `planning_metadata_only`, `blocked_or_deferred` | Tier C | 65 | canonical_package_import_manifest_proof_only | blocked_pending_browser_webgl_canvas_sandbox |

Agent execution is blocked for every row. Planning/study metadata selection is allowed for every row.
