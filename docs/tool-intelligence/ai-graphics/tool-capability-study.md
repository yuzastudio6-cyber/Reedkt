# AI Graphics Tool Capability Study

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

## Purpose

This is a product/agent-facing capability study for AI graphics tool selection. It is organized by task capability, task fit, selection rules, elimination rules, fallback order, proof level, and runtime target. Internal coordination labels are source evidence only and are not product-facing capability categories.

## Source Evidence

- PR #361: merged with merge commit `05d429f6029136f0f55fe01375809071b588791c`; historical capability routing contract.
- PR #376: merged with merge commit `9296a4a41a143c0a212415d890e6ff544f73bb4b`; historical capability routing study.
- PR #425: merged with merge commit `a055ef045db2a6ce127a044bee6219d5933532c3`; Batch 1 package proof.
- PR #433: merged with merge commit `dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0`; Batch 2 package proof.
- PR #441: merged with merge commit `d174de59471eacf05bed5a5511d661f2e5ba9f0f`; Batch 3 package proof.
- PR #542: merged with merge commit `a66a1c0b72263e5e113d95216c373e0fad1071bb`; Track B exclusion context.
- PR #543: open/draft/MERGEABLE at `37fea25846987323d1de04098c701816fa24a237`; Atlas owner assignment and conflict sync.
- PR #544: merged with merge commit `62f69c6b66d77abf155287ffdb2e9a380541d763`; Track A exclusion context.
- PR #589: open/draft/MERGEABLE at `6a55428bfd99d6e745b572df4f1a96c3a22e59cc`; canonical package proof QA.
- PR #604: open/draft/MERGEABLE at `303ac0e00e5979a8857852aef91ac2aa8c2495fe`; runtime-boundary owner QA.
- PR #607: open/draft/MERGEABLE at `12cfc4f29e55db7a5b105ecfc3aba21480396435`; CPU/static approval.
- PR #612: open/draft/MERGEABLE at `5f870b9e493170cb9c02a03d33a719f1801560c8`; stale blocked lineage.
- PR #614: open/draft/MERGEABLE at `31b196f8158f6f3054cf90daaa9ba74d18c95089`; dependency reconciliation.
- PR #616: open/draft/MERGEABLE at `474a88aa31aaff46164d1ff0d9dc469e8d320bf1`; refreshed execution evidence.
- PR #617: open/draft/MERGEABLE at `5bc68feeb776f2329cc4a124515709f55aac36cb`; refreshed execution QA.
- PR #621: open/draft/CLEAN at `cd6ab312d83bb5ebaa30f1ef30f41cf3891c3306`; owner review source.

Live preflight confirmed PR #621 and the source branch. GitHub unauthenticated REST rate-limited after PR #616; remaining source-chain facts use the prompt-verified planning state and committed source lock evidence.

## Capability Groups

### Chart And Data Visualization

Capabilities: `chart_overlay`, `data_visualization`.

Tools: `vega_lite`, `vega`, `d3`, `echarts`.

Purpose:
- chart specs
- chart overlays
- data visualization metadata
- future visual overlays

Ranking:
- vega_lite preferred for declarative chart specs
- vega preferred for compiled/parsed Vega spec validation
- d3 preferred for custom data-shape and custom SVG planning
- echarts conditional until browser chart runtime proof

### SVG And Static Graphics

Capabilities: `svg_graphics`.

Tools: `satori`, `svgdotjs_svg_js`, `viz_js`.

Purpose:
- SVG-like graphics planning
- graph/diagram visualization
- static overlay metadata

Ranking:
- svgdotjs_svg_js preferred for explicit SVG construction planning
- satori preferred for JSX/HTML-style graphic manifest planning
- viz_js preferred for DOT/graph diagrams

### Diagram Graphics

Capabilities: `diagram_graphics`.

Tools: `viz_js`, `svgdotjs_svg_js`, `d3`.

Purpose:
- DOT graph diagrams
- process diagrams
- relationship graphics

Ranking:
- viz_js preferred for graph/DOT diagrams
- svgdotjs_svg_js conditional for explicit SVG diagrams
- d3 conditional for custom data-driven diagrams

### Animation Metadata

Capabilities: `animation_overlay`.

Tools: `lottie_web`, `animejs`.

Purpose:
- animation manifest validation
- timeline metadata

Ranking:
- lottie_web preferred planning for reusable vector animation manifests
- animejs preferred planning for timeline/motion metadata

Status: planning only; runtime later; not executable now

### Browser Canvas And WebGL Scene Tools

Capabilities: `canvas_scene`, `webgl_3d_scene`.

Tools: `three_js`, `pixi_js`, `konva`, `babylonjs`.

Purpose:
- 3D scene planning
- 2D canvas scene planning
- future WebGL/canvas sandbox proof

Ranking:
- three_js general 3D/WebGL scene planning
- babylonjs heavier 3D scene/game-style planning
- pixi_js 2D WebGL/canvas sprite/scene planning
- konva 2D canvas drawing/annotation planning

Status: planning only; browser/WebGL/canvas runtime later; not executable now

### Background Removal And Subject Extraction

Capabilities: `background_removal`, `subject_segmentation`.

Tools: `sam2`, `birefnet`, `rembg`, `transparent_background`.

Purpose:
- segmentation planning
- background removal planning
- subject extraction planning

Ranking:
- sam2 likely preferred for segmentation after model proof
- birefnet likely preferred for subject/background extraction after model proof
- rembg and transparent_background are backlog/fallback decisions with possible redundancy

### Upscaling

Capabilities: `upscaling`.

Tools: `real_esrgan`.

Purpose:
- future upscaling planning

Ranking:
- real_esrgan likely preferred for upscaling after model/GPU/provenance proof

### Model Runtime Foundation And Tensor Image Ops

Capabilities: `model_runtime_foundation`, `tensor_image_ops`.

Tools: `torch_torchvision`, `transformers`, `kornia`.

Purpose:
- model/runtime foundation
- tensor/image ops
- future CPU import/model-boundary proof

Ranking:
- torch_torchvision foundation candidate
- transformers model/runtime orchestration candidate
- kornia preferred tensor/image ops after import proof

## Agent Behavior

Agents may select these tools for planning and study metadata only. Agents must not execute tools or imply runtime, beta, or production readiness.

No tool execution, worker execution, route execution, provider/model runtime, dependency install, npm ci, package-lock mutation, CPU/static validation rerun, import smoke, synthetic fixture, browser/WebGL/canvas runtime, GPU runtime, model download, media/Remotion/resvg processing, Supabase mutation, SQL execution, GCS upload, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, PR merge, PR close, or PR retarget was performed.
