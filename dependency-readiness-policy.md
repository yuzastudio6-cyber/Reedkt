# Dependency Readiness Policy

## Purpose

Dependency readiness decides what can run now and what must wait.

ReeditPro should continue independent work while pending jobs wait, but only when dependencies allow it. Required downstream work must wait for required assets, QA, user review, timing validation, trim review, and approved snapshot readiness.

This policy is mock-only in the frontend.

## Readiness groups

- `ready_now`: work can proceed in future execution.
- `waiting_for_provider`: provider output is pending.
- `waiting_for_worker`: future worker/tool output is pending.
- `waiting_for_asset`: required or optional asset is not ready.
- `waiting_for_user_review`: user decision is required.
- `waiting_for_qa`: output exists but QA is pending.
- `blocked_by_policy`: tier, safety, approval, or dependency policy blocks work.
- `complete`: dependency is satisfied.

## Required vs optional outputs

Required assets:
- final source video selections,
- required captions,
- required generated images/keyframes,
- required AI video clips,
- required map/chart/browser assets in the final plan,
- required masks for depth compositions,
- required audio/color outputs,
- required Remotion layers.

Optional assets:
- extra b-roll,
- alternate takes,
- decorative SFX,
- optional lower cards,
- optional transition flourishes.

Optional assets may be skipped only when the approved plan allows the skip or fallback. Required assets block final render until merged or replaced by an approved fallback.

## Merge readiness

An asset can merge when:
- output exists,
- status is ready,
- linked plan item exists,
- timing cue exists,
- renderer layer exists or can be created,
- QA pending/pass status exists,
- no policy violation is present.

## Final render readiness

Final render can start only when:
- approved snapshot exists,
- all required dependencies are ready/merged,
- timing validation passed,
- cleanup and trim review are resolved,
- provider prompts are fulfilled or skipped by approved fallback,
- asset manifest is reconciled,
- QA preflight passed,
- no placeholder is used for a required final asset.

## Preview readiness

Preview may proceed with placeholders only when:
- dependency readiness explicitly allows `can_use_placeholder`,
- the placeholder is clearly a preview placeholder,
- missing assets do not block preview by policy,
- final render remains blocked until real required assets are ready.

## Non-goals

No real dependency scheduler, queue, webhook, polling, provider status check, worker execution, render, storage, backend, Supabase, Google Cloud, billing, or media processing is implemented in this milestone.
