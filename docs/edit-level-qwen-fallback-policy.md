# Edit Level Qwen Fallback Policy

Status: mock/local fallback policy only.

RP-EDITLEVEL-07 defines how Qwen planning should degrade when future Qwen, visual context, transcript, audio, graphic/text, or Preference DNA inputs are unavailable. It does not execute a fallback planner.

## Fallback Rules

| Level | Fallback |
| --- | --- |
| Normal | Deterministic professional fallback is acceptable. Use source metadata and marker notes when deeper model context is unavailable. |
| Premium | Use deterministic fallback plus a degraded capability notice. Ask for clarification when missing visual/transcript/source context would change the edit. |
| Ultra Premium | Degrade to Premium-safe reasoning and show a clear notice. Do not imply studio-level model or media context ran when it did not. |

## User-Facing Boundary

Fallback copy must say the profile is mock/local and estimate-only. It must not imply:

- Qwen ran;
- Qwen2.5-VL ran;
- DeepSeek ran;
- a provider call happened;
- the real planner created an edit plan;
- worker, render, progress, Supabase, file-byte, external-fetch, or credit side effects occurred.

## Required Flags

Every RP07 package keeps `mockOnly: true` and all execution flags false, including `providerCallMade`, `qwenCallMade`, `qwen25vlCallMade`, `deepseekCallMade`, `plannerExecuted`, `editPlanCreated`, `workerJobCreated`, `renderJobCreated`, `creditReservedOrSpent`, `fileBytesRead`, and `externalUrlFetched`.
