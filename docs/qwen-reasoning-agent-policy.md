# Qwen Reasoning Agent Policy

Implementation date: 2026-06-18.

Qwen 3.7 Max is the configured default for ReeditPro reasoning and editorial judgment roles. This is a role-binding policy, not a provider call.

## Qwen Role Coverage

Qwen-backed roles in RP-MODEL-01:

- `main_reasoning_agent` for intent, editing judgment, and summaries;
- `preference_dna_analyst` for Edit Preference and Source Video DNA reasoning;
- `edit_planning_agent` for edit-plan judgment;
- `edit_qa_agent` and `qa_compliance_agent` for quality/compliance review;
- `revision_learning_agent` for revision interpretation;
- `provider_prompt_agent`, `music_prompt_agent`, `sfx_prompt_agent`, and `render_manifest_agent` for planning language and readiness summaries.

## Current Boundary

The registry can create mock/local routing plans and mock response envelopes. It does not call Qwen, configure Qwen secrets, create API routes, deploy backend runtime, reserve credits, dispatch workers, or render media.

RP-MODEL-02 records expected Qwen secret names and readiness blockers only. It does not add or inspect Qwen secret values.

RP-MODEL-03 adds the Qwen reasoning adapter skeleton and structured reasoning prompt contracts. The skeleton returns blocked/configured-later summaries only; it has no SDK, HTTP client, token usage, secret access, or provider call.

## Future Boundary

Future production Qwen use requires backend-only execution, secure secrets, rate limiting, project context, approval and credit gates where relevant, worker readiness for generated artifacts, QA, and logging.

## RP-PREF-VIDEO-01 Qwen Bridge

Preference Video Study creates a Qwen `preference_dna_analyst` prompt package bridge only. It does not call Qwen, access secrets, create token usage, dispatch workers, or turn source video evidence into direct worker instructions.

## RP-PREF-VIDEO-07 Qwen Bridge

Preference DNA builder creates a richer Qwen `preference_dna_analyst` bridge package from synthesized DNA layers. It remains bridge-only: no Qwen call, provider transport, secret access, token usage, credit effect, worker job, route, persistence, or render is allowed.
