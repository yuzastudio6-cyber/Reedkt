# QWEN2_5_VL 7B Tool Routing Use-Case Ranking

## Status

This document is routing metadata only for the server-side production tool registry.

It does not call Qwen, invoke Cloud Run, dispatch a worker, run inference, download model weights, create generated assets, create public artifacts, create signed URLs, mutate Supabase, spend credits, render, export, or unlock beta/production.

## Source Policy

Qwen2.5-VL 7B Instruct is a visual understanding and visual QA tool. It is not an AI video generation route, not a final render/export route, not a provider route, and not a frontend/browser model.

Workers must receive approved plan snapshots and structured runtime payloads. Raw chat text and raw prompts must not become worker execution payloads.

## GPU And Cost Boundary

The selected serving shape remains Google Cloud Run GPU with one NVIDIA L4, scale-to-zero, `minInstances=0`, `maxInstances=1`, concurrency 1, and private invocation only after future auth/readiness gates pass. This keeps the GPU off when unused and avoids an always-running VM-style cost profile.

## Ranking Matrix

| Use case | Qwen rank | Runtime use case | Preferred after | Preferred before | Boundary |
| --- | --- | --- | --- | --- | --- |
| Source frame understanding | primary VLM | visual_understanding | OpenCV, PaddleOCR | Remotion | Semantic understanding from sampled private frame refs only |
| Product/demo step understanding | primary VLM | visual_understanding | OpenCV, PaddleOCR | Remotion, OpenTimelineIO | Step/context reasoning; exact UI text stays deterministic |
| B-roll candidate review | primary VLM | broll_candidate_review | Wan, LTX, Mochi | Remotion | Review/scoring only; never generates B-roll |
| Generated asset visual QA | primary VLM | frame_asset_qa | Wan, LTX, Mochi | Remotion, FFmpeg | Advisory visual QA before composition/export |
| Caption visual consistency QA | secondary advisory | caption_visual_consistency_qa | PaddleOCR, OpenCV | Remotion, libass | Advisory after OCR/safe-zone checks |
| OCR layout reasoning | secondary advisory | visual_understanding | PaddleOCR | Remotion | Layout/context reasoning only; exact OCR stays PaddleOCR |
| Chart/screen reasoning | secondary advisory | visual_understanding | D3, ECharts, PaddleOCR | Remotion | Advisory explanation only; controlled dataviz owns exact values |
| Safe-zone planning signal | secondary advisory | caption_visual_consistency_qa | OpenCV, PaddleOCR | Remotion, libass | Semantic no-cover signal only |
| AI video generation | blocked | none | Wan, LTX, Mochi | none | Qwen must not replace AI video models |
| Final render/export | blocked | none | Remotion, FFmpeg, ffprobe | none | Track A/render pipeline owns final output |
| Raw chat worker execution | blocked | none | none | none | Approved snapshots only |
| Direct frontend invocation | blocked | none | none | none | Backend/worker-only |
| Unbounded long-video analysis | blocked | none | OpenCV, PySceneDetect | none | Needs separate bounded sampling acceptance |

## Required Runtime Gates

- Approved plan snapshot required.
- Credit reservation required.
- Queue lease required.
- Private source references required.
- Private model path required.
- Bounded visual-token budget required.
- Scale-to-zero GPU runtime required.
- Raw prompts, public URLs, signed URLs, provider routes, frontend invocation, CPU execution, model download, inference, worker dispatch, Cloud Run invocation, public artifacts, media processing, and render/export remain disabled by this ranking layer.

## Relationship To AI Video B-Roll

Wan remains the primary open-source generated B-roll route. LTX remains the secondary fast-preview/image-to-video route. Mochi remains fallback/research. Hunyuan remains gated. Qwen can review B-roll candidates and generated asset QA, but it must not create generated video.

## Relationship To Controlled Tools

PaddleOCR remains the exact OCR/text extraction route. OpenCV remains deterministic frame/region/safe-zone support. D3, ECharts, and Vega-Lite remain exact chart/dataviz routes. Remotion remains final layout/composition. FFmpeg and ffprobe remain media/export integrity routes.

## Current Blockers

- Private invocation auth preflight still needs a refreshed local `gcloud` session before Cloud Run/IAM read checks can pass.
- Worker dispatch remains fail-closed until backend runtime owner acceptance.
- Qwen inference remains disabled until a future owner-approved invocation prompt.
- Production/beta use remains blocked until QA, billing, worker, Supabase, model policy, and owner evidence are complete.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_40-ROUTING-INTEGRATION-DRY-RUN: integrate Qwen use-case ranking into model/tool routing dry-run, no inference`
