# Canonical Agent Selection Missing-Proof Rules QA

Decision: `ai_graphics_canonical_agent_selection_qa_passed_with_warnings`.

- `chart_overlay`: browser chart runtime approval for echarts; approved render/export lane before visual output.
- `data_visualization`: runtime approval for browser chart execution; artifact approval before output.
- `svg_graphics`: static SVG output contract approval; public artifact boundary approval.
- `diagram_graphics`: diagram output contract approval; artifact boundary approval.
- `animation_overlay`: animation manifest/runtime approval.
- `canvas_scene`: browser/canvas sandbox approval.
- `webgl_3d_scene`: browser/WebGL sandbox approval.
- `background_removal`: model/import/provenance proof; model boundary approval.
- `subject_segmentation`: model/import/provenance proof; model boundary approval.
- `upscaling`: model/GPU/provenance proof; model boundary approval.
- `tensor_image_ops`: CPU import proof; operation boundary approval.
- `model_runtime_foundation`: CPU/GPU/model-boundary proof; model provenance approval.
