# Qwen Reasoning Fallback Policy

Original implementation date: 2026-06-18. Superseded route decision: 2026-07-18.

Qwen 3.7 is the first full-capability fallback for ReEditPro reasoning and editorial judgment. Kimi K3 is now the primary reasoning/edit-planning/creativity/coding route. This is a role-binding policy, not a provider call.

## Qwen Role Coverage

Historical Qwen-backed role names in RP-MODEL-01 remain persisted compatibility inputs:

- `main_reasoning_agent` for intent, editing judgment, and summaries;
- `preference_dna_analyst` for Edit Preference and Source Video DNA reasoning;
- `edit_planning_agent` for edit-plan judgment;
- `edit_qa_agent` and `qa_compliance_agent` for quality/compliance review;
- `revision_learning_agent` for revision interpretation;
- `provider_prompt_agent`, `music_prompt_agent`, `sfx_prompt_agent`, and `render_manifest_agent` for planning language and readiness summaries.

Those role names must resolve through the canonical Kimi-primary route policy rather than creating a second Qwen-primary authority. Edit Reference/Edit Preference consumers remain externally owned and must be reconciled through their accepted handoff instead of being rewritten in this backend slice.

## Current Boundary

The canonical route contract can create fail-closed metadata, validate the exact Kimi -> Qwen -> DeepSeek order, and calculate provisional per-attempt internal provider cost. It does not call Qwen, configure Qwen secrets, deploy backend runtime, reserve or mutate credits, dispatch workers, or render media.

RP-MODEL-02 records expected Qwen secret names and readiness blockers only. It does not add or inspect Qwen secret values.

RP-MODEL-03 adds the Qwen reasoning adapter skeleton and structured reasoning prompt contracts. The skeleton returns blocked/configured-later summaries only; it has no SDK, HTTP client, token usage, secret access, or provider call.

Qwen fallback may run only after an allowed terminal Kimi failure, against the same immutable edit authority. Missing approval, reservation, tenant authority, safety authority, or snapshot blocks instead of triggering Qwen. A failed Qwen attempt remains part of internal production cost before DeepSeek is considered.

## Future Boundary

Future production Qwen use requires backend-only execution, secure secrets, rate limiting, project context, exact approved snapshot, existing reservation, idempotent one-use dispatch, durable attempts, provider usage readback, QA, and cost reconciliation.

## RP-PREF-VIDEO-01 Qwen Bridge

Preference Video Study creates a Qwen `preference_dna_analyst` prompt package bridge only. It does not call Qwen, access secrets, create token usage, dispatch workers, or turn source video evidence into direct worker instructions.

## RP-PREF-VIDEO-07 Qwen Bridge

Preference DNA builder creates a richer Qwen `preference_dna_analyst` bridge package from synthesized DNA layers. It remains bridge-only: no Qwen call, provider transport, secret access, token usage, credit effect, worker job, route, persistence, or render is allowed.
