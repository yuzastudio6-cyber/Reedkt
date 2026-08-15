# Edit Level Reasoning And Visual Intelligence Routing Architecture

This legacy-named document defines reasoning and visual routing by Edit Level. RP-EDITLEVEL-07 adds mock/local reasoning policy while the active visual route is the provider-neutral `visual_intelligence` capability. It does not call Qwen 3.7, Visual Intelligence, DeepSeek, providers, planners, media workers, render/export, or credits.

## Role Split

| Model | Future role |
| --- | --- |
| Qwen 3.7 / Qwen 3.7 Max | Main reasoning brain for intent, plan synthesis, marker decisions, Edit Brief interpretation, Edit Preference/DNA reasoning, and QA explanation. |
| Visual Intelligence | Provider-neutral visual/video understanding specialist for visible objects, actions, layout, scene summaries, marker windows, visual continuity, and B-roll opportunities. Its semantic provider is Gemini 3.1 Pro High; deterministic evidence remains separately attributable. |
| DeepSeek V4 Pro | Coding/tool-code/Remotion draft agent only. It is not a user reasoning model. |

## Level Routing

| Level | Qwen 3.7 reasoning | Visual Intelligence |
| --- | --- | --- |
| Normal | Standard reasoning, basic edit plan, simple clarification, baseline QA explanation. | Targeted visual context only when a marker, ambiguity, or visible context requires it. |
| Premium | Deep reasoning, style application, marker intent reasoning, source summary reasoning, stronger pacing decisions. | Key visual moments, marker windows, B-roll opportunities, visible text/layout summaries when relevant. |
| Ultra Premium | Multi-pass reasoning, creative direction, QA explanation, story/pacing decisions, plan revision reasoning, stronger synthesis. | Scene-level visual understanding, visual continuity, B-roll strategy, visible style/polish analysis, higher confidence expectations. |

## Fallback Policy

If Qwen 3.7 reasoning is unavailable, use deterministic fallback and clearly mark the fallback. If Visual Intelligence is unavailable, do not claim visual/video understanding ran; use the lower available source summary and show a degraded capability notice.

## Provider Boundary References

| Role | Provider boundary | Secret Manager reference name |
| --- | --- | --- |
| Qwen 3.7 / Qwen 3.7 Max main edit agent | `qwen_3_7_provider_boundary` | `reeditpro-prod-qwen-api-key` |
| Visual Intelligence | `visual_intelligence` capability manifest | Backend-owned Gemini credential reference; never exposed through edit-level policy. |
| DeepSeek V4 Pro tool-code agent | `deepseek_v4_pro_tool_code_boundary` | `reeditpro-prod-deepseek-api-key` |

Backend credential references are not raw provider keys, do not prove the Secret Manager values exist, and do not authorize provider execution. Edit-level policy consumes only the Visual Intelligence capability boundary and never imports a Gemini SDK or provider secret.

## Boundary

This is no runtime implementation. Future adapters, prompts, pass budgets, and model calls belong to later backend/runtime milestones.
