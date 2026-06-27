# QWEN2_5_VL 7B Planner UI Surfacing

## Status

Decision: `qwen_vl_planner_ui_surfacing_mock_only`

This packet surfaces Qwen2.5-VL planner-routing choices inside the chat-native mock planning UI. It does not call Qwen, invoke Cloud Run, dispatch workers, run inference, download model weights, create generated assets, mutate Supabase, create signed URLs, create public artifacts, process media, render, export, spend credits, unlock beta, or unlock production.

## UI Scope

The accepted UI surface is `ChatNativeEditor.tsx`. The Qwen routing card appears beside the existing controlled tool strategy planning card and uses frontend-safe deterministic metadata from `src/lib/qwen-vl-planner-routing-ui.ts`.

The UI is developer-detail planning evidence. It is hidden in compact guided mode and visible in detailed/developer planning views through the normal chat card descriptor flow.

## Planner Route Summary

The UI presents 13 planner-routing tasks and one private-invoke dry-run route readiness surface:

- 4 primary Qwen metadata routes for visual understanding, product/demo step context, B-roll relevance scoring, and generated asset visual QA.
- 4 advisory Qwen metadata routes for caption visual consistency, OCR layout context, chart/screen context, and safe-zone semantic signal review.
- 5 blocked routes for AI video generation, final render/export, raw chat execution, frontend invocation, and unbounded long-video analysis.
- Private invoke client route: `jobs.qwen2_5_vl.privateInvoke.dryRun`
- Private invoke client helper: `callQwen25VlPrivateInvokeDryRun`
- Private invoke status: `structured_fixture_output_fix_required`

The card keeps `dryRunPassedClaimed=false` and all execution gates false.

## Ownership Boundaries

- Qwen is visual understanding and visual QA metadata only.
- Wan, LTX, Mochi, and Hunyuan own generated B-roll/video routes.
- PaddleOCR and OpenCV own deterministic OCR, frame regions, safe-zone evidence, and sampling primitives.
- D3, ECharts, and Vega-Lite own exact chart and dataviz output.
- Remotion owns final layout and composition.
- FFmpeg and ffprobe own media/export integrity.

The UI must not present Qwen as an OCR authority, video generator, renderer, exporter, provider gateway, storage path, signed URL source, public artifact source, or worker execution trigger.

## Runtime Gates

All UI data keeps these false:

- planner worker dispatch
- Cloud Run invocation
- inference
- model download
- generated asset creation
- public artifact creation
- signed URL creation
- render/export
- raw prompt execution
- service URL resolution
- auth header creation
- identity token fetch
- service runtime request send
- credit mutation

The card provides no execution buttons, no approval buttons, no credit buttons, no upload/publish buttons, and no worker/provider action labels.

## Current Blocker

Read-only Cloud Run auth/IAM reverify has passed, narrow TokenCreator and Run Invoker bindings are in place, and the controlled caller can mint an audience-bound identity token without printing or storing the token value. The earlier bounded local request returned HTTP `404` because the service ingress is `internal-and-cloud-load-balancing`. The internal caller harness plan selected a CPU-only Cloud Run Job with Direct VPC egress as the preferred no-idle-GPU path. The Direct VPC route config created a dedicated future-caller subnet with Private Google Access enabled and left the default subnet unchanged. The CPU-only caller source is defined with no model loader, no vLLM runtime, no CUDA dependency, and no inference path. The controlled caller job is deployed, one caller contract smoke observed HTTP `403` with `qwen_inference_disabled_after_contract_check`, `contractSatisfiedForFutureRuntime=true`, `runtimeContractExecutesNow=false`, and `modelInferenceEnabled=false`, runtime readiness review is recorded, the first approved-fixture inference smoke plan is defined, gated fixture inference service source is deployed, and the first controlled approved-fixture smoke failure is documented. The tuned retry observed HTTP `200` with `qwen_fixture_inference_smoke_completed` and stored only sanitized metadata output evidence. Result review accepts the invocation, private model-cache load, vLLM initialization, and bounded L4 fixture profile, but blocks runtime readiness because `parsedJson=false`, `schemaKeys=[]`, `objectCount=0`, and `textLikeRegionCount=0`. Private Cloud Run runtime readiness remains blocked until the fixture prompt/parser returns structured JSON metadata; beta, production, arbitrary media, generated assets, public artifacts, signed URLs, and raw prompt execution remain disabled.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58E-STRUCTURED-FIXTURE-OUTPUT-FIX: tune Qwen fixture prompt/parser for structured JSON metadata, no beta/no generated assets`
