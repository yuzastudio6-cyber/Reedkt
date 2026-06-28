# Edit Level Qwen Routing Audit

This audit maps intended Qwen 3.7 and Qwen2.5-VL usage by level. No Qwen 3.7, Qwen2.5-VL, DeepSeek, provider, worker, media, render, or credit execution occurs in RP-EDITLEVEL-00.

## Role Split

| Model/tool | Role |
| --- | --- |
| Qwen 3.7 | Main reasoning brain, Marker Chat final decision, planning, QA explanation, Edit Preference/DNA reasoning. |
| Qwen2.5-VL-7B-Instruct | Visual/video understanding specialist: marker visual context, keyframe/scene summaries, visible objects/actions/text/layout. |
| DeepSeek V4 Pro | Coding/tool-code/Remotion draft work only, not user reasoning. |

## Level Matrix

| Future level | Qwen 3.7 | Qwen2.5-VL |
| --- | --- | --- |
| Normal | Standard reasoning for clean professional plan, direct user instructions, basic QA explanation, and low tool budget. | Targeted calls only when marker or visual clarification requires it. |
| Premium | Deep reasoning for stronger story/pacing, marker priority, Preference DNA, and plan/QA explanations. | Key visual moments and marker windows; visible objects/actions/text/layout summaries where useful. |
| Ultra Premium | Multi-pass reasoning for studio-level plan, stricter QA, advanced tool/render decisions, and revision/fallback reasoning. | Scene-level visual understanding with deeper summaries and stronger confidence requirements. |

## Current Repo Fit

Current model-routing code focuses on generation provider routes, not Qwen runtime routing. The requested `docs/qwen*`, `src/types/qwen*`, and `src/backend/qwen-runtime/*` files were missing in this checkout. Future Qwen routing should be added behind backend/runtime gates and should not be mixed into frontend-only docs.
