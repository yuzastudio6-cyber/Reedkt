# Async Checkback Policy

## Purpose

Async checkback prevents the editing agent from stopping the entire edit while a provider, tool, or future worker job is pending.

The agent should:
- start independent work,
- store pending work state,
- check back later,
- reconcile completed outputs,
- unblock dependent work,
- apply fallback if needed,
- never lose context.

This policy is mock-only in the frontend. It does not create real queues, webhooks, polling, provider status checks, storage writes, worker jobs, or renders.

## Checkback triggers

- `provider_webhook`: preferred future trigger for provider generation jobs.
- `worker_event`: preferred future trigger for backend/tool worker jobs.
- `scheduled_poll`: future scheduled status check when no event source exists.
- `manual_refresh`: user or supervisor-triggered refresh.
- `status_poll`: fallback status poll when provider webhook support is unavailable.
- `timeout`: trigger when a job exceeds its allowed wait window.
- `retry`: trigger when retrying the same work item with the same idempotency key.
- `fallback_event`: trigger when fallback routing is required.
- `user_review`: trigger when the user must decide before downstream work continues.

## Checkback states

- `not_started`: checkback is planned but not waiting yet.
- `waiting`: pending provider/tool/worker/user state.
- `checking`: status is being checked by a future backend process.
- `ready`: expected output is ready for reconciliation.
- `stale`: status is old and needs refresh.
- `failed`: checkback failed.
- `timed_out`: timeout policy fired.
- `retrying`: retry is active.
- `fallback_needed`: approved fallback or user review is needed.
- `user_review_required`: user decision blocks affected work.
- `merged`: output has been reconciled into the asset manifest and downstream graph.

## Continue-while-waiting rule

If an image, AI video, tool output, or render dependency is pending, ReeditPro can continue independent work:
- cleanup planning,
- trim review,
- timing planning,
- caption timing,
- visual cue timing,
- map/chart/browser briefs,
- other independent generation plans,
- placeholder Remotion layer planning,
- QA on completed assets,
- credit/fallback planning.

It cannot continue dependent work that requires a missing asset:
- AI video that requires a missing start frame,
- final render requiring a missing final asset,
- final QA requiring a missing required asset,
- approved completion without required outputs.

## Blocking vs non-blocking dependencies

- `blocks_start`: dependency must be ready before the work item can begin.
- `blocks_finish`: dependency can start in parallel but must finish before downstream completion.
- `required_asset`: required for final output.
- `optional_asset`: may be skipped or fallbacked if approved.
- `can_use_placeholder`: preview may continue with a visible placeholder.
- `qa_after`: QA runs after the dependency is ready.
- `fallback_if_failed`: failed dependency routes to approved fallback policy.
- `user_review_required`: user decision blocks affected downstream work.

Examples:
- Final render blocks finish until required assets are ready.
- Preview render can use placeholders only if explicitly allowed.
- AI video image-to-video blocks start until the start image exists.
- QA runs after an asset is ready.
- Optional b-roll can be skipped or fallbacked if approved.

## Checkback intervals

No real intervals are implemented in this milestone.

Future defaults:
- provider webhook preferred,
- polling only when provider lacks webhook support,
- exponential backoff for polling,
- timeout triggers fallback or user review,
- user review waits until the user answers.

## Idempotency

Every checkback must use:
- work item ID,
- idempotency key,
- approved snapshot ID,
- provider request ID or worker job ID,
- expected output ID.

## Non-goals

This milestone does not implement real webhooks, polling, queues, provider checks, tool execution, worker execution, storage, rendering, backend, Supabase, Google Cloud, billing, or media processing.

## Agent QA + Fallback Integration

Checkbacks should feed `AgentQAFallbackPlan` when pending work fails, times out, needs user review, or requires fallback.

The checkback layer records state; the QA/fallback layer decides whether work can continue, whether final render is blocked, and which approved fallback or review path applies.

No real QA, retry, fallback execution, provider status check, polling, webhook, worker, or render is implemented in the frontend mock.
