# Worker Job Step Catalog

Worker job steps are future backend/runtime operations created from approved plan snapshots. No step should reinterpret raw chat. Provider calls are `generation_worker` steps, open-source tools are worker/preprocess/render/QA steps, Remotion rendering is a `render_worker` step, and approval plus credit reservation happen before expensive work.

| Step type | Purpose | Worker group | Required inputs | Outputs | Fallback behavior | QA responsibilities | Failure/credit behavior |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `validate_approved_snapshot` | Confirm immutable approved plan exists | `qa_worker` | snapshot id, project id | `qa_report` | request review | snapshot compliance | blocking before credits |
| `reserve_credits` | Confirm future credit reservation | `export_worker` | snapshot id, credit estimate | `none` | waiting for credits | credit gate check | no expensive work before success |
| `prepare_source_media` | Make source media worker-ready | `ffmpeg_media_worker` | source asset ids | `processed_video`, `processed_audio` | retry or request review | media readiness | light/preprocess impact |
| `analyze_media` | Future visual/audio/source analysis | `media_analysis_worker` | source assets, segment ids | `qa_report`, `timing_map` | retry/simplify | analysis confidence | analysis cost only if approved |
| `transcribe_audio` | Transcript/timing extraction | `media_analysis_worker` | audio/source assets | `timing_map` | retry/request review | transcript timing | analysis cost |
| `trim_and_cut` | Execute cut list | `ffmpeg_media_worker` | operation ids, segment ids | `processed_video` | retry/split scene | cut accuracy | preprocess/postprocess impact |
| `color_correct` | Basic correction | `color_pipeline_worker` | color operations | `processed_video` | simplify settings | color-safe output | tier-dependent |
| `color_grade` | Look/shot matching | `color_pipeline_worker` | color plan, asset ids | `processed_video` | fallback grade | skin tone/shot match QA | Pro/Premium impact |
| `normalize_audio` | Loudness normalization | `audio_soundsync_worker` | audio plan | `processed_audio` | retry/basic normalize | loudness QA | audio processing impact |
| `sound_cleanup` | Voice cleanup/noise reduction | `audio_soundsync_worker` | audio operations | `processed_audio` | lighter cleanup | speech clarity QA | audio processing impact |
| `analyze_music_beats` | Beat/BPM/onset/timing map | `audio_soundsync_worker` | audio/music cue ids | `timing_map` | skip/simplify timing | beat timing QA | optional SoundSync impact |
| `generate_gpt_image_asset` | Future GPT-Image-2 still/keyframe/card | `image_asset_worker` | prompt plan ids | `generated_image_asset` | retry/simplify/convert | prompt adherence | generation credits after reservation |
| `generate_ai_video_asset` | Future Wan/Hailuo/Veo clip asset | `ai_video_asset_worker` | provider route/prompt plan ids | `ai_video_clip_asset` | approved route only | model/tier/frame QA | generation credits; Basic/Pro no Veo |
| `render_map_asset` | Map card/route visual | `map_visual_worker` | map plan item ids | `map_visual_asset` | static map/lower panel | label/readability QA | controlled tool impact |
| `render_dataviz_asset` | Chart/diagram asset | `dataviz_worker` | data viz plan item ids | `chart_visual_asset` | simpler chart/static card | label/data QA | controlled tool impact |
| `capture_browser_asset` | Browser/app screenshot asset | `browser_capture_worker` | authorized URL/page ids | `browser_capture_asset` | request user review | redaction/readability/source QA | no bypass; controlled capture impact |
| `generate_mask_asset` | Foreground/contact/hero masks | `mask_tracking_worker` | mask plan item ids | `mask_asset` | fallback layout/manual review | mask edge/contact object QA | premium/high-risk impact |
| `compose_remotion_preview` | Assemble preview composition | `remotion_render_worker` | renderer layers/assets | `renderer_composition_asset` | fallback layout/static layers | frame/safe-zone QA | render planning/preview impact |
| `render_remotion_final` | Final render pass | `remotion_render_worker` | approved composition | `renderer_composition_asset` | retry/fallback layout | final render QA | render credits after approval |
| `postprocess_export` | Encode/export prep | `ffmpeg_media_worker` | rendered asset | `processed_video` | retry/simplify export | format/loudness QA | postprocess impact |
| `run_qa_checks` | Structured QA across outputs | `qa_worker` | outputs, plan ids | `qa_report` | request review/fallback | all applicable QA | required before delivery |
| `retry_or_fallback` | Approved retry/fallback step | `qa_worker` | failed step, policy | `error_report` or replacement asset | approved policy only | fallback compliance | may use allowance |
| `request_user_review` | Ask for new approval | `qa_worker` | exceeded policy reason | `qa_report` | none | scope compliance | blocks further work |
| `deliver_preview` | Make preview available | `export_worker` | preview asset | `renderer_composition_asset` | request review | preview QA | no final export implied |
| `create_final_export` | Deliver final output | `export_worker` | final render/postprocess asset | `final_export` | retry/request review | final export QA | final export credits |

## Catalog Rules

- Provider calls are generation steps and must use approved prompt plans.
- Open-source tools are worker, preprocess, render, or QA steps.
- Remotion render steps own final canvas/composition.
- Expensive work happens after approval and future credit reservation.
- Any fallback outside approved policy requires user review and new approval.
