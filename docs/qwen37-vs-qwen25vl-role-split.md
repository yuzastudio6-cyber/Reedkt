# Qwen 3.7 Vs Qwen2.5-VL Role Split

Status: RP-VIDEOCTX-00R role split only. No runtime execution, no worker, no render, no credits, no media processing, no provider call, no Qwen2.5-VL call, no Qwen 3.7 call, no DeepSeek call, no upload, no file-byte read, no URL fetch, no Supabase command, no migration, no staging, no commit, and no cleanup are authorized.

## Final Split

Qwen 3.7 -> reasoning / plan / Marker Chat final decision.

Qwen2.5-VL -> visual/video context extraction.

This split keeps ReEditPro's existing reasoning architecture intact while adding a specialized visual/video understanding tool for source video context. Qwen2.5-VL visual observations should become compact context for Qwen 3.7, not a direct execution path.

## Qwen 3.7

Use Qwen 3.7 for:

- main Marker Chat reasoning
- intent clarification
- structured marker intent finalization
- planning explanation
- QA explanation
- Edit Brief plan-hint reasoning
- main Edit Chat reasoning
- preference/DNA reasoning
- key moment synthesis after receiving compact tool summaries
- edit opportunity synthesis after receiving compact tool summaries

Do not use Qwen 3.7 for raw video processing, frame extraction, transcription, sound analysis, rendering, worker execution, or credit actions.

## Qwen2.5-VL-7B-Instruct

Use Qwen2.5-VL-7B-Instruct for:

- visual scene description
- frame/keyframe understanding
- video segment visual summary
- object/place/action detection
- visible text/layout/card/UI understanding
- visual B-roll opportunity detection
- visual marker context around time ranges
- structured visual observations

Do not use Qwen2.5-VL for main user reasoning without context, Marker Chat final intent, speech transcription as primary source, music/SFX/audio analysis as primary source, rendering, worker execution, or credit actions.

## DeepSeek Boundary

DeepSeek V4 Pro remains coding/tool-code only. It may support future coding agent tasks, tool-code generation, Remotion draft code, and validation of generated code after gates. It is not used for Marker Chat reasoning, visual/video understanding, user edit intent reasoning, or provider execution.

