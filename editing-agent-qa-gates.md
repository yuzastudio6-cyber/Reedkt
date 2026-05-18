# Editing Agent QA Gates

## Purpose

Agent QA gates prevent bad outputs from silently entering an edit.

The editing agent should validate:
- plan readiness,
- source cleanup readiness,
- timing readiness,
- provider prompt readiness,
- dependency readiness,
- generated asset quality,
- asset merge readiness,
- tool output readiness,
- renderer readiness,
- final QA readiness,
- approval/snapshot readiness.

This milestone is mock planning only. It does not run real QA, inspect media, call providers, execute workers, render, store assets, or process files.

## QA gate sequence

`preflight_gate` confirms approved snapshot exists or is pending in mock, source order/output frame/cleanup/timing gates are represented, and model/tier policy is preserved.

`work_item_start_gate` confirms dependencies allow a work item to start, idempotency key exists, approved snapshot ID or pending snapshot note exists, and expected outputs are declared.

`provider_request_gate` confirms provider model is allowed, prompt plan exists, Basic/Pro no-Veo is enforced, Premium Veo is final fallback only, and output size/background/timing rules are present.

`asset_received_gate` confirms the asset belongs to the expected project/snapshot/work item, type matches expected output, storage/version fields are tracked, and manifest state is updated.

`asset_quality_gate` checks planned prompt adherence, style consistency, character consistency, color match, timing duration match, frame/panel safe zone, and documentary/fact safety when relevant.

`merge_gate` confirms the asset can link to segment, timing cue, renderer layer, dependency readiness, and active version/fallback state.

`render_preflight_gate` confirms required assets are ready/merged, no required final asset is a placeholder, timing validation passed, and renderer layer plan is complete.

`final_qa_gate` confirms timing, visual, audio, layout, model, fact, tool, user-review, and fallback checks are resolved before export can proceed.

## Gate statuses

- `not_checked`
- `passed`
- `warning`
- `failed`
- `blocked`
- `needs_user_review`
- `fallback_required`

## Local vs global failures

Local failures affect one asset, segment, or layer. A failed optional b-roll asset should not stop unrelated caption timing, source cleanup, map/chart planning, or independent asset generation.

Global failures block the whole edit or final export. Examples include missing approved snapshot, unconfirmed aspect ratio, missing required final asset, unresolved timing validation, or unresolved trim meaning risk.

## QA ownership

- Planning agent validates plan structure before approval.
- Editing supervisor validates work graph, dependencies, and fallback decisions.
- Asset generation agent validates provider output contracts and fallback routes.
- Tool execution agent validates future tool outputs.
- Renderer agent validates layer readiness and composition dependencies.
- QA agent validates final edit compliance.

## Non-goals

No real QA execution, media inspection, retries, provider calls, worker execution, storage, rendering, backend, Supabase, Google Cloud, billing, or media processing is implemented here.
