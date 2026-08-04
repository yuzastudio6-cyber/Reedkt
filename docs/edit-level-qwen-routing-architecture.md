# Edit Level Qwen Routing Architecture

This document defines Qwen routing by Edit Level. RP-EDITLEVEL-07 now adds mock/local Qwen planning profile policy on top of earlier routing architecture, and `src/lib/model-role-routing-contract.ts` is the shared code contract for the Qwen 3.7 / Qwen2.5-VL / DeepSeek role split. It still does not call Qwen 3.7, Qwen2.5-VL, DeepSeek, providers, planners, media workers, render/export, or credits.

## Role Split

| Model | Future role |
| --- | --- |
| Qwen 3.7 / Qwen 3.7 Max | Main reasoning brain for intent, plan synthesis, marker decisions, Edit Brief interpretation, Edit Preference/DNA reasoning, and QA explanation. |
| Qwen2.5-VL-7B-Instruct | Visual/video understanding specialist for visible objects, actions, layout, scene summaries, marker windows, visual continuity, and B-roll opportunities. |
| DeepSeek V4 Pro | Coding/tool-code/Remotion draft agent only. It is not a user reasoning model. |

## Level Routing

| Level | Qwen 3.7 | Qwen2.5-VL |
| --- | --- | --- |
| Normal | Standard reasoning, basic edit plan, simple clarification, baseline QA explanation. | Targeted visual context only when a marker, ambiguity, or visible context requires it. |
| Premium | Deep reasoning, style application, marker intent reasoning, source summary reasoning, stronger pacing decisions. | Key visual moments, marker windows, B-roll opportunities, visible text/layout summaries when relevant. |
| Ultra Premium | Multi-pass reasoning, creative direction, QA explanation, story/pacing decisions, plan revision reasoning, stronger synthesis. | Scene-level visual understanding, visual continuity, B-roll strategy, visible style/polish analysis, higher confidence expectations. |

## Fallback Policy

If Qwen 3.7 is unavailable, use deterministic fallback and clearly mark the fallback. If Qwen2.5-VL is unavailable, do not claim visual/video understanding ran; use the lower available source summary and show a degraded capability notice.

## Provider Boundary References

| Role | Provider boundary | Secret Manager reference name |
| --- | --- | --- |
| Qwen 3.7 / Qwen 3.7 Max main edit agent | `qwen_3_7_provider_boundary` | `reeditpro-prod-qwen-api-key` |
| Qwen2.5-VL visual understanding | `qwen2_5_vl_7b_instruct_provider_boundary` | `reeditpro-prod-qwen-api-key` |
| DeepSeek V4 Pro tool-code agent | `deepseek_v4_pro_tool_code_boundary` | `reeditpro-prod-deepseek-api-key` |

These are backend-only Secret Manager reference names. They are not raw provider keys, do not prove the Secret Manager values exist, and do not authorize provider execution.

## Boundary

This is no runtime implementation. Future adapters, prompts, pass budgets, and model calls belong to later backend/runtime milestones.
