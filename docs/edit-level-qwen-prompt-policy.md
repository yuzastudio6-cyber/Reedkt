# Edit Level Qwen Prompt Policy

Status: mock/local prompt policy only.

RP-EDITLEVEL-07 defines future Qwen prompt context policy by Edit Level. The policy describes what context a future backend prompt builder may include. It never builds a production prompt, never sends a prompt, and never calls Qwen 3.7.

## Policy By Level

| Level | Prompt context policy | Future context package |
| --- | --- | --- |
| Normal | compact | User prompt, selected level, export target, basic source metadata, optional Edit Brief markers, and safe style hints. |
| Premium | enhanced | Source key moments, marker windows, transcript/audio/graphic summaries, Preference DNA, Edit Brief priorities, and QA warnings. |
| Ultra Premium | studio | Scene-level source context, visual summaries, transcript and speech timing, audio/sound design, graphic/layout context, Preference DNA, QA guardrails, marker conflicts, and plan-hint history. |

## Source Context Reuse

The policy reuses RP06 source-understanding package labels:

- Normal: metadata + targeted context.
- Premium: key moments + marker windows.
- Ultra Premium: scene-level context.

This is prompt-context metadata only. There is no source-understanding execution, no Qwen2.5-VL call, no transcript worker, no audio worker, and no graphic/text worker.

## Boundary

No provider call, no Qwen call, no Qwen2.5-VL call, no DeepSeek call, no real planner, no edit plan creation, no media processing, no render, no progress, no Supabase, no file-byte read, no external fetch, and no credits are triggered by this policy.
