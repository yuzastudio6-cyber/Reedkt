# Track All tool route matrix

| Route | Fixed operations | Qualification | Outputs | Fallback |
|---|---|---|---|---|
| source truth | `tool.ffprobe.inspect_approved_media.v1` | actual local FFprobe fixture passed; aggregate receipt pending | source facts | fail closed |
| bounded media | `tool.ffmpeg.execute_approved_media_recipe.v1` | exact request authority and actual local FFmpeg fixture passed; aggregate receipt pending | private proxy/frames/redaction preview | fail closed |
| shot discovery | `tool.pyscenedetect.detect_scene_boundaries.v1` | confined real content-detector fixture passed; aggregate receipt pending | shot candidates | deterministic explicit boundaries or review |
| visual geometry | `tool.opencv.analyze_approved_visual_artifacts.v1` with fixed `track_all_camera_motion_v1` and `track_all_planar_homography_v1` profiles | confined real optical-flow/homography fixture passed; aggregate receipt pending | camera/planar/flow/QA evidence | no model fallback |
| mask refinement | `tool.kornia.refine_mask.v1` | conditional internal execution | refined private masks/metrics | conservative OpenCV policy or review |
| temporal masklets | `tool.sam3_1.track_masklets.v2` | blocked pending real evidence | private masklet manifest | none; SAM2 forbidden |
| table metrics | `tool.polars.transform_approved_artifact_tables.v1`, `tool.duckdb.query_approved_artifact_tables.v1` | internal execution | QA summaries | in-process bounded validation |
| timing handoff | `tool.opentimelineio.interchange_approved_timeline.v1` | internal execution | timeline handoff | strict JSON handoff |
| private preview | `tool.remotion.render_approved_composition.v1` | internal execution | private preview | FFmpeg flattened privacy preview where approved |
| image preparation | `tool.sharp.prepare_approved_image_asset.v1` | internal execution | normalized private image | fail closed |

PaddleOCR and MediaPipe remain unbound until their Track All-specific operation and fixture evidence exists. The planner chooses the minimum sufficient qualified route; no bundle automatically dispatches every listed operation.
