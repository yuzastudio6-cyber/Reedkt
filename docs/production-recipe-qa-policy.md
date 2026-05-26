# Production Recipe QA Policy

## Purpose

Production tools in ReeditPro must be recipe pipelines, not simple wrappers. A recipe combines intent, approved snapshot policy, input analysis, settings validation, execution, artifacts, confidence, QA, fallback/refinement, and timeline/render integration.

Milestone 0 defines the policy only. It does not install tools, execute recipes, process media, render, call providers, create worker jobs, or deploy infrastructure.

## Universal Tool Recipe Lifecycle

Every production tool recipe follows this lifecycle:

1. Detect need.
2. Analyze input.
3. Select recipe.
4. Validate settings.
5. Run tool.
6. Collect artifacts.
7. Score confidence.
8. Run QA.
9. Fallback/refine if needed.
10. Integrate timeline/render.
11. Block final export if QA fails.

## Required Recipe Contract

Each recipe version should define:

- recipe family and version;
- required approved snapshot fields;
- accepted worker group;
- required source/storage references;
- required settings and defaults;
- tier/model/tool restrictions;
- credit reservation requirement where applicable;
- expected artifacts and manifest links;
- confidence score fields;
- QA checks and blocking thresholds;
- fallback/refine options;
- user-review triggers;
- timeline/render integration target;
- cleanup and retention notes.

## Recipe Families

| Recipe family | Purpose | Primary workers | Required QA focus |
| --- | --- | --- | --- |
| `smart_cut_recipe` | Source cleanup, retake selection, trim ranges, cut reasons, and timeline decisions. | `cpu_analysis_worker`, `qa_worker` | Meaning preservation, source order, timing, required steps/proof, user-review gates. |
| `transcript_recipe` | Speech transcription, alignment, transcript intelligence, and caption source data. | `gpu_ai_worker`, `cpu_analysis_worker`, `qa_worker` | Transcript confidence, word/segment timing, hallucination checks, privacy handling. |
| `caption_recipe` | Caption segmentation, styling, animation, safe zones, and burn-in/render tracks. | `render_worker`, `qa_worker` | Readability, speech alignment, safe zones, visual collision, timing. |
| `audio_cleanup_recipe` | Voice cleanup, denoise, loudness, separation, music/SFX prep, and ducking inputs. | `gpu_ai_worker`, `cpu_analysis_worker`, `qa_worker` | Speech clarity, artifacts, loudness, true peak, music/SFX ducking safety. |
| `color_grade_recipe` | Professional correction, shot match, generated asset match, LUT/look handling. | `cpu_analysis_worker`, `render_worker`, `qa_worker` | Skin tone, exposure, contrast, color consistency, documentary restraint. |
| `background_removal_image_recipe` | Still/image foreground extraction, alpha masks, and image compositing prep. | `gpu_ai_worker`, `qa_worker` | Edge quality, contact-object preservation, alpha artifacts, mask confidence. |
| `background_removal_video_recipe` | Temporal masks, segmentation tracks, and video foreground extraction. | `gpu_ai_worker`, `qa_worker` | Temporal stability, flicker, edge quality, identity preservation, mask confidence. |
| `text_behind_subject_recipe` | Depth-aware overlays, foreground masks, layer ordering, and contact-object rules. | `gpu_ai_worker`, `render_worker`, `qa_worker` | Mask fit, text readability, foreground preservation, caption/graphic layering. |
| `ocr_screen_recording_recipe` | OCR, screen capture analysis, UI-safe overlays, and label-safe planning. | `cpu_analysis_worker`, `gpu_ai_worker` if approved, `qa_worker` | OCR confidence, privacy-sensitive text, label collision, authorized capture source. |
| `video_enhancement_recipe` | Upscale, denoise, restoration, detail improvement, and artifact-controlled enhancement. | `gpu_ai_worker`, `qa_worker` | Hallucinated detail, artifacting, face/product integrity, source truth. |
| `slow_motion_recipe` | Frame interpolation and approved slow-motion effects. | `gpu_ai_worker`, `qa_worker` | Warping, timing accuracy, face/hand/text artifacts, meaning preservation. |
| `motion_graphics_recipe` | Cards, diagrams, explainers, 2D/3D motion, Lottie/Pixi/Three/Babylon assets. | `render_worker`, `qa_worker` | Exact labels, safe zones, timing, render determinism, visual relevance. |
| `final_export_recipe` | Final render, mux, subtitle burn-in, transcode, delivery variants, and export package. | `render_worker`, `qa_worker` | Required assets, frame/timing, streams, captions, audio, color, masks, render integrity. |

## Blocking Rules

- Required recipe QA failure blocks affected downstream work.
- Required final-export QA failure blocks final export.
- `QualityGateResult` records whether a gate is required, blocking, preview-blocking, final-export-blocking, or human-review-required.
- `FallbackDecision` records retry, refinement, simpler recipe, skip, preview block, final-export block, or user-review paths after failed gates or tool runs.
- Optional asset failure can be isolated when the approved plan allows it.
- Fallback must stay inside approved snapshot policy, tier rules, credit estimate, model policy, and user-review requirements.
- If fallback changes cost, timing, frame, source meaning, tier/model route, or user intent, it requires a revised approval path.

## No Raw Chat Execution

Recipes may use compiled intent, approved instructions, prompt plans, timing plans, tool strategy, and QA policies from the approved snapshot. They must not execute raw chat text as the only instruction source.
