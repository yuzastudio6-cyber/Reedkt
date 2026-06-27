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
- Private invoke status: `runtime_review_passed_fixture_plan_required`

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

Read-only Cloud Run auth/IAM reverify has passed, narrow TokenCreator and Run Invoker bindings are in place, and the controlled caller can mint an audience-bound identity token without printing or storing the token value. The earlier bounded local request returned HTTP `404` because the service ingress is `internal-and-cloud-load-balancing`. The internal caller harness plan selected a CPU-only Cloud Run Job with Direct VPC egress as the preferred no-idle-GPU path. The Direct VPC route config created a dedicated future-caller subnet with Private Google Access enabled and left the default subnet unchanged. The CPU-only caller source is defined with no model loader, no vLLM runtime, no CUDA dependency, and no inference path. The controlled caller job is deployed, one caller contract smoke observed HTTP `403` with `qwen_inference_disabled_after_contract_check`, `contractSatisfiedForFutureRuntime=true`, `runtimeContractExecutesNow=false`, and `modelInferenceEnabled=false`, and runtime readiness review is recorded. Private Cloud Run inference remains blocked until a separate first approved-fixture inference smoke plan defines the private fixture, approved snapshot, worker, QA, and cost gates.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_57-APPROVED-FIXTURE-INFERENCE-SMOKE-PLAN: define first private approved-fixture Qwen inference smoke, no execution`
