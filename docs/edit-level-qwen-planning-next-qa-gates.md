# Completed: Level-Aware QA Gates

RP-EDITLEVEL-08 is complete as mock/local Level-Aware QA Gates.

RP08 uses the RP07 Qwen planning profile metadata to define future QA gate differences by level:

- Normal: baseline professional QA, concise explanation, deterministic fallback acceptable.
- Premium: deeper source/context/style QA, detailed concise explanations, degraded capability notices.
- Ultra Premium: strict studio QA, scene-level and plan-aware checks, Premium-safe degraded fallback when advanced context is unavailable.

## Required Boundary

RP08 remains mock/local. It does not call Qwen 3.7, Qwen2.5-VL, DeepSeek, providers, planners, media tools, workers, render/export, Supabase, file-byte reads, external fetches, or credits.

RP08 should continue preserving current runtime `basic | pro | premium` compatibility until a later runtime migration milestone explicitly changes it.

Recommended next milestone: `RP-EDITLEVEL-09 - Level-Aware Estimates: Time, Credits, Render Budget`.
