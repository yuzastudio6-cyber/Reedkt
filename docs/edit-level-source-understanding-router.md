# Edit Level Source Understanding Router

RP-EDITLEVEL-06 adds a mock/local router that maps `normal`, `premium`, and `ultra_premium` to source video understanding depth.

The router resolves policy only:

- Normal: metadata + targeted context.
- Premium: key moments + marker windows.
- Ultra Premium: scene-level context.

It does not execute source understanding tools, call Qwen 3.7, call Qwen2.5-VL, call DeepSeek, call providers, run media processing, run transcript/Whisper, run audio workers, run graphic workers, render/export, start progress, reserve credits, spend credits, read uploaded file bytes, fetch external URLs, or run Supabase.

The output is an `EditLevelSourceUnderstandingPolicyPackage` with source layers, marker context policy, Qwen context policy, fallbacks, warnings, summaries, and all side-effect flags false.

Next milestone after the completed RP07 Qwen planning profile: `RP-EDITLEVEL-08 - Level-Aware QA Gates`.
