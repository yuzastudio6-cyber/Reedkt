# Production Worker Runtime Orchestration

## Purpose

Milestone 4 adds the production-safe worker orchestration foundation for future ReeditPro tool recipes. It does not run media tools, AI models, providers, FFmpeg, OpenCV, Remotion, GPU jobs, or Google Cloud resources.

## Runtime Flow

```text
approved snapshot
  -> tool execution plan
  -> worker payload with IDs/storage refs
  -> worker gates
  -> mock-safe lease claim
  -> sanitized events
  -> placeholder worker route
  -> result writer
  -> lease release
```

## Boundaries

- Worker payloads reference approved snapshots and tool execution plans.
- Worker payloads use IDs and private storage references, not raw prompts or signed URLs.
- The frontend never runs these workers or heavy tools.
- Revideo remains evaluation-only and blocked from production execution.
- Milestone 4 routing returns placeholder dry-run/mock-safe results only.

## Future Integration

Later Cloud Run Jobs can call this runtime after container/tool readiness and real backend persistence exist. Until then, lease, idempotency, event, and result helpers are mock-safe/in-memory or draft-only.

## Milestone 6 Media Foundation Route

Milestone 6 keeps the default `cpu_analysis_worker` route as placeholder-only. It adds an explicit optional `metadata.mediaFoundation` route for `dry_run` or `local_dev` media foundation work.

That route still passes the Milestone 4 gates: approved snapshot, idempotency, private storage references, no raw prompts, no signed URLs, no secrets, registry policy, and no Revideo production execution. Existing worker smokes do not require FFmpeg or FFprobe.

## Milestone 7 Speech/Caption Routes

Milestone 7 keeps default worker routing placeholder-only. It adds explicit optional routes:

- `gpu_ai_worker` may call speech foundation only when `metadata.speechFoundation.mode` is `dry_run` or `local_dev`.
- `render_worker` or `qa_worker` may call caption foundation only when `metadata.captionFoundation.mode` is `dry_run` or `local_dev`.

These routes still require approved snapshots, idempotency keys, private artifact references, and raw prompt/signed URL/secret rejection. Existing worker smokes do not require faster-whisper, model files, FFmpeg, or libass.

## Milestone 8 Smart Cut/Timeline Routes

Milestone 8 adds explicit metadata-only routes:

- `cpu_analysis_worker` may call smart cut foundation only when `metadata.smartCutFoundation.mode` is `dry_run` or `local_dev`.
- `render_worker` may call timeline foundation only when `metadata.timelineFoundation.mode` is `dry_run` or `local_dev`.

The routes produce smart cut/timeline metadata and QA gates only. They do not cut media, run FFmpeg edit commands, import OpenTimelineIO/Hyperframe/Remotion runtimes, render, export, or use Revideo.

## Milestone 9 Audio Routes

Milestone 9 adds explicit `metadata.audioFoundation` routes for `dry_run` or `local_dev` only:

- `cpu_analysis_worker` can run audio analysis/planning foundation.
- `gpu_ai_worker` can run model-tool audio scaffold planning when explicitly requested.
- `qa_worker` can run audio QA foundation.

These routes produce audio plans, artifacts, and QA gates only. They do not download models, run production cleanup/stem separation, final mux/export, call providers, or use Revideo.
## Milestone 13 Speech Caption Execution Route

`gpu_ai_worker` can route explicit `metadata.speechCaptionExecution.mode` payloads to the speech/caption execution pipeline. `render_worker` and `qa_worker` can route explicit caption-only execution/QA modes. Default worker placeholder behavior remains unchanged.
## Milestone 14 Smart Cut Timeline Execution Route

`cpu_analysis_worker` can route explicit `metadata.smartCutTimelineExecution.mode` payloads to the smart cut/timeline execution pipeline for dry-run, local-dev, container-ready, and gated production modes. `render_worker` can route explicit local/container timeline preview planning requests only. Default worker placeholder behavior remains unchanged, and existing smokes do not require FFmpeg, OpenTimelineIO, Hyperframe, Remotion, or Revideo runtimes.

## Milestone 15A Audio Execution Route

`cpu_analysis_worker` can route explicit `metadata.audioExecution.mode` payloads to the audio execution pipeline for dry-run, local-dev, container-ready, and gated production modes. `gpu_ai_worker` can route explicit model-audio execution only when `metadata.audioExecution.enableModelAudioExecution=true`. `qa_worker` can route explicit `metadata.audioExecutionQA.mode` payloads for audio QA. Default worker placeholder behavior remains unchanged, and existing smokes do not require FFmpeg, DeepFilterNet, RNNoise, Demucs, model weights, final mux/export, or Revideo.

## Milestone 15B Color Execution Route

`cpu_analysis_worker` can route explicit `metadata.colorExecution.mode` payloads to the color execution pipeline for dry-run, local-dev, container-ready, and gated production modes. `render_worker` can route explicit local/container color preview planning requests only. `qa_worker` can route explicit `metadata.colorExecutionQA.mode` payloads for color QA. Default worker placeholder behavior remains unchanged, and existing smokes do not require FFmpeg, OpenColorIO, OpenImageIO, final export, full render, masks/enhancement, or Revideo.

## Milestone 15C Mask Composition Route

`gpu_ai_worker` can route explicit `metadata.maskComposition.mode` payloads to the mask-composition pipeline for dry-run, local-dev, container-ready, and gated production modes. `cpu_analysis_worker` can route explicit dry-run QA/refinement-only mask metadata. `render_worker` can route explicit text-behind-subject preview/metadata planning only. `qa_worker` can route explicit `metadata.maskCompositionQA.mode` payloads for mask/text QA. Default worker placeholder behavior remains unchanged, and existing smokes do not require BiRefNet, SAM2, transparent-background, rembg, OpenCV, Kornia, FFmpeg, model weights, final render/export, or Revideo.

## Milestone 15D Enhancement Slowmotion Route

`gpu_ai_worker` can route explicit `metadata.enhancementSlowMotion.mode` payloads to the enhancement/slow-motion pipeline for dry-run, local-dev, container-ready, and gated production modes. `cpu_analysis_worker` can route explicit dry-run QA/analysis-only metadata. `qa_worker` can route explicit `metadata.enhancementSlowMotionQA.mode` payloads for enhancement/slow-motion QA. Default worker placeholder behavior remains unchanged, and existing smokes do not require Real-ESRGAN, FILM, OpenCV, Sharp, FFmpeg, model weights, final render/export, or Revideo.

## Milestone 16A Final Render Export Route

`render_worker` can route explicit `metadata.finalRenderExecution.mode` payloads to the final render/export pipeline for dry-run, local-dev, container-ready, and gated production modes. `qa_worker` can route explicit `metadata.finalRenderQA.mode` payloads for render/export/final-delivery QA. Default worker placeholder behavior remains unchanged, and existing smokes do not require FFmpeg, Remotion, libass, final cloud jobs, providers, or Revideo.

## Milestone 16B Full E2E Workflow Orchestrator

The M16B E2E workflow orchestrator composes existing explicit stage runners and pipeline entrypoints instead of adding new production execution behavior. It builds approved payloads with idempotency keys, passes private artifacts between stages, summarizes QA/fallback/readiness blockers, and proves production-ready remains blocked while current readiness/model/manual-review blockers remain.
