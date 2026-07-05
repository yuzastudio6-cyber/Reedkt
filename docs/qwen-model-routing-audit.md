# Qwen Model Routing Audit

RP-QWEN-00 audits how Qwen 3.7 Max is already represented in model routing. The source of truth is `src/backend/model-routing/model-role-registry.ts` plus the frontend-safe summaries in `src/lib/reeditpro-model-roles.ts`.

Common audit boundary: Qwen 3.7 Max, Marker Chat, Secret Manager, backend-only, structured response, fallback, owner approval pending, no Qwen call, no provider call, no secret values inspected, no gcloud command, no runtime implementation.

## Existing Routing

- `main_reasoning_agent`, `preference_dna_analyst`, `edit_planning_agent`, `edit_qa_agent`, `revision_learning_agent`, `provider_prompt_agent`, `music_prompt_agent`, `sfx_prompt_agent`, `render_manifest_agent`, and `qa_compliance_agent` default to `qwen_3_7`.
- Coding/tool-code/Remotion draft roles default to DeepSeek V4 Pro and remain separate from Qwen reasoning.
- Qwen roles are marked backend-only with required gates: project context, backend secret, provider enablement, and rate limit.
- Existing routing smokes verify Qwen metadata is selected without provider calls and that frontend provider calls are blocked.

## Reuse Plan

Reuse the model-role registry, routing service, validation service, summary service, and existing smoke coverage as the first layer before any Qwen runtime adapter. Future Qwen routing should consume the role plan, not bypass it.

## Gaps

- Routing returns metadata and mock plans only.
- No runtime adapter receives route plans.
- No owner-approved route selects Qwen for real execution.
- No usage/cost policy is connected to Qwen runtime.
