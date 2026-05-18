# Async Edit Work Graph

## Purpose

The async edit work graph represents future execution tasks and their dependencies. It lets ReeditPro continue independent work while required generated assets, tool outputs, QA checks, or render jobs are pending.

This milestone defines mock planning records only. No queues, providers, workers, tools, or renders run.

## Work Item Examples

- `prepare_source_trim`
- `select_retake`
- `validate_meaning_preservation`
- `prepare_caption_timing`
- `prepare_soundsync_timing`
- `generate_image_asset`
- `generate_ai_video_asset`
- `render_map_asset`
- `render_chart_asset`
- `capture_browser_asset`
- `run_audio_analysis`
- `run_audio_stretch`
- `process_image_asset`
- `process_video_asset`
- `generate_mask_asset`
- `prepare_remotion_layer`
- `render_remotion_preview`
- `render_final_export`
- `run_asset_qa`
- `run_timing_qa`
- `run_final_qa`
- `apply_fallback`
- `request_user_review`

## Dependency Types

- `blocks_start`: prerequisite before work can begin.
- `blocks_finish`: prerequisite before downstream completion.
- `required_asset`: required manifest asset.
- `optional_asset`: useful but not required.
- `can_use_placeholder`: preview may reserve placement while asset is pending.
- `qa_after`: QA runs after work or asset readiness.
- `fallback_if_failed`: fallback path if work fails.
- `user_review_required`: user decision must resolve before affected work continues.

## Dependency Examples

- AI video image-to-video depends on a start image asset.
- Remotion final export depends on required layers, assets, and QA.
- Timing QA depends on the timing plans.
- Audio ducking may later depend on AudioFlux/FFmpeg worker output.
- Browser capture depends on authorized future source access.
- Mask composition depends on a foreground mask asset.
- Credit release depends on job result and approval policy.

## Parallel Execution

The editing supervisor can run or prepare independent work in parallel:

- multiple image assets for unrelated segments
- map/chart/browser specs while image generation is pending
- caption timing while AI video generation is pending
- QA on completed assets while other assets are still pending
- Remotion placeholder layers while waiting for required final assets

Required dependencies block only affected downstream work, not the whole edit.

## Checkback Strategy

Future execution can use provider webhooks, worker status events, scheduled checkbacks, retry timers, or polling when required. Checkback state must be stored in structured work items and event logs, not model memory.

## Non-Goals

No real async queue, provider call, worker job, tool execution, Remotion rendering, storage write, or media processing is implemented here.
## RP-AGENT-02 Readiness And Checkback

The async work graph is paired with `AsyncAssetReconciliationPlan`.

When a work item waits, the reconciliation plan stores checkback policy instead of relying on model memory. When an asset becomes ready, the reconciliation plan determines whether it can merge into the correct segment, timing cue, renderer layer, and version slot.

Final render dependencies are stricter than preview dependencies. Preview can use placeholders only when explicitly allowed; final render waits for required assets and QA.

No real queue, webhook, polling loop, provider status check, worker event, or render is implemented in this frontend milestone.

## RP-AGENT-03 Gate/Fallback Integration

The async work graph is also paired with `AgentQAFallbackPlan`.

Each work item can link to QA gate checks, likely failure scenarios, and fallback decisions. Local non-blocking failures can leave unrelated work ready or parallelizable. Required/global failures block final render until fallback, user review, or new approval resolves the problem.

No real QA execution, retry, fallback, provider call, worker execution, or rendering is implemented in this frontend milestone.
