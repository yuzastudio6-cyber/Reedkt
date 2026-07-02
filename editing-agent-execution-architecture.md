# Editing Agent Execution Architecture

## Purpose

The Editing Agent Execution layer turns an approved ReeditPro plan into structured execution work items. The edit is not treated as one slow linear process. It becomes a dependency-aware async work graph that can keep independent work moving while long-running image, video, tool, audio, or render jobs are pending.

This milestone is planning-only. It does not execute workers, call providers, render Remotion compositions, write assets, connect backend services, or process media.

## Why This Matters

A professional edit may include source cleanup, retake selection, caption timing, image generation, AI video generation, maps, charts, browser captures, audio cleanup, SoundSync, color, masks, Remotion composition, QA, revisions, and export.

Some work can happen in parallel. Some work depends on generated assets. The editing agent must store this structure instead of relying on model memory.

## Core Execution Principle

Workers and agents execute approved snapshots, not raw chat.

The execution layer receives structured plans:

- approved plan snapshot
- worker/runtime plan when future worker architecture exists
- source cleanup and trim review plans
- master timing and timing validation plans
- visual asset plan
- provider prompt plans
- render/tool strategy plans
- renderer composition plan
- credit estimate
- fallback policy
- QA rules

The agent does not invent new work from memory.

## Agent Layers

- `planning_agent`: creates intent, strategy, timing, prompts, credits, and QA plans. Planning-only.
- `editing_supervisor_agent`: owns the work graph, dependency checks, wait states, merge policy, and fallback decisions.
- `asset_generation_agent`: manages future provider image/video/audio/generated-asset work items and manifest links.
- `tool_execution_agent`: manages future FFmpeg, VapourSynth, AudioFlux, Signalsmith Stretch, Sharp/libvips, MapLibre, D3/ECharts, Playwright, mask, and QA tool work. Worker-only.
- `timing_agent`: validates timing dependencies and checks generated clip durations against the planned timeline.
- `renderer_agent`: prepares Remotion layer work items and waits for required assets before final render.
- `qa_agent`: validates timing, visuals, audio, layout, model policy, safety, and asset presence.
- `revision_agent`: handles user changes, reusable work, and new plan versions.

## Continue While Waiting

If an asset is generating, the supervisor can continue independent work:

- prepare captions and timing
- prepare layouts and renderer placeholder layers
- prepare map/chart/browser specs
- run QA on completed assets
- process approved source cleanup decisions

It must not render a final segment with required assets missing, generate dependent AI video without a required start frame, complete the job without QA, or lose track of pending work.

## Resume And Reconciliation

Every work item needs an idempotency key, dependency list, approved snapshot reference, expected outputs, retry count, fallback policy, checkback policy, QA checks, and resume notes.

When an asset completes, future workers update the asset manifest, attach the asset to the correct segment/timing/layer, run QA, unblock dependent work, and update execution state.

## Non-Goals

This milestone does not implement real queues, workers, provider calls, backend storage, Remotion rendering, media processing, or asset persistence.
## RP-AGENT-02 Checkback And Reconciliation

`EditingAgentExecutionPlan` creates the work graph and asset manifest. `AsyncAssetReconciliationPlan` describes what happens after work items are waiting or assets become ready.

The reconciliation layer tracks:
- checkback items for pending provider/worker/asset/user-review work,
- dependency readiness for each work item dependency,
- merge plan items for every asset manifest entry,
- version and fallback relationships,
- preview and final render readiness.

The editing agent can continue independent work while pending jobs wait, but downstream work remains blocked when required assets, QA, user review, timing validation, trim review, or approved snapshot readiness are missing.

No real checkback, polling, provider status check, storage, worker event, backend queue, or rendering runs in this mock layer.

## RP-AGENT-03 QA Gates And Fallback Decisions

`AgentQAFallbackPlan` describes whether each work item, provider request, asset, merge, render preflight, and final QA stage can proceed.

The plan separates local failures from global failures. A local optional asset failure should not stop unrelated work. A global/approval/final-render failure blocks export until resolved.

Fallback decisions are approved-plan constrained. Basic/Pro cannot fallback to Veo, Premium Veo is final rescue only for approved AI video assets, and exact maps/charts/browser/captions/timing/masks do not fallback to AI video.

No real QA, retry, fallback execution, provider call, storage, worker event, billing, backend queue, or rendering runs in this mock layer.
