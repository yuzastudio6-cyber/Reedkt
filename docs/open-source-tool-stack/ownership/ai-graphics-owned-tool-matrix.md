# AI Graphics Owned Tool Matrix

Owner id: `atlas_ai_graphics_worker_owner`

All entries are pending duplicate review. They assign responsibility for proof planning and metadata handoff only. They do not claim exclusive ownership or runtime readiness.

| Tool id | Display name | Package | Current status | Responsibility |
| --- | --- | --- | --- | --- |
| `torch_torchvision` | Torch/TorchVision | `torch`, `torchvision` | `package_declared_smoke_only` | Import/version proof, model-weight boundary, future runtime policy |
| `transformers` | Transformers | `transformers` | `package_declared_docs_only` | Import/version proof, no model downloads without approval |
| `sam2` | SAM2 | `sam2` | `package_declared_smoke_only` | Import/model-path proof, no segmentation execution until approved |
| `birefnet` | BiRefNet | `birefnet` | `package_declared_smoke_only` | Import/model-path proof, no model execution until approved |
| `real_esrgan` | Real-ESRGAN | `real-esrgan` | `package_declared_smoke_only` | Import/model-path proof, no upscaling execution until approved |
| `kornia` | Kornia | `kornia` | `package_declared_docs_only` | Import/version proof and synthetic metadata fixture |
| `rembg` | rembg | `rembg` | `docs_only_not_proven` | Backlog review; decide if needed after SAM2/BiRefNet |
| `transparent_background` | transparent-background | `transparent-background` | `docs_only_not_proven` | Backlog review; avoid duplicate background-removal stack unless needed |
| `d3` | D3 | `d3` | `draft_install_import_fixture_proof_pending_merge` | Package proof, chart metadata fixture proof, no runtime chart rendering until approved |
| `echarts` | ECharts | `echarts` | `draft_install_import_fixture_proof_pending_merge` | Package proof, chart metadata fixture proof, no browser chart runtime until approved |
| `vega_lite` | Vega-Lite | `vega-lite` | `draft_install_import_fixture_proof_pending_merge` | Spec validation, no production render/export until approved |
| `vega` | Vega | `vega` | `draft_install_import_fixture_proof_pending_merge` | Compile/parse proof only until runtime approval |
| `satori` | Satori | `satori` | `draft_install_import_fixture_proof_pending_merge` | Import/static SVG metadata proof, no public artifact output until approved |
| `svgdotjs_svg_js` | @svgdotjs/svg.js | `@svgdotjs/svg.js` | `draft_install_import_fixture_proof_pending_merge` | SVG metadata proof, no public artifact output until approved |
| `viz_js` | @viz-js/viz | `@viz-js/viz` | `draft_node_only_static_proof_pending_merge` | Node-only in-memory DOT/SVG proof, no public artifact output until approved |
| `lottie_web` | lottie-web | `lottie-web` | `draft_manifest_metadata_proof_pending_merge` | Manifest validation only, no player runtime until approved |
| `animejs` | Anime.js | `animejs` | `draft_import_manifest_proof_pending_merge` | Manifest/timeline metadata proof, no animation runtime until approved |
| `three_js` | Three.js | `three` | `draft_import_manifest_proof_pending_merge` | Import/manifest proof, no WebGL runtime until approved |
| `pixi_js` | PixiJS | `pixi.js` | `draft_import_manifest_proof_pending_merge` | Import/manifest proof, no canvas/WebGL runtime until approved |
| `konva` | Konva | `konva` | `draft_import_manifest_proof_pending_merge` | Import/manifest proof, no canvas runtime until approved |
| `babylonjs` | Babylon.js | `babylonjs` | `draft_import_manifest_proof_pending_merge` | Import/manifest proof, no WebGL runtime until approved |

## Not Owned By Atlas: Track B

These tools are owned by `TRACK_B_MEDIA_OSS_STEWARD` in `TRACK_B_MEDIA_PROCESSING`, not by Atlas:

`ffmpeg`, `ffprobe`, `sharp_libvips`, `duckdb`, `polars`, `opencv`, `pyav`, `pyscenedetect`, `paddleocr`, `paddlepaddle`, `mediainfo`, `exiftool`, `imagemagick_graphicsmagick`, `tesseract`, `opencolorio`, and `openimageio`.

Atlas may reference Track B evidence but cannot claim, install, prove, or execute these tools.
