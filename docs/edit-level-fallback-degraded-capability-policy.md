# Edit Level Fallback And Degraded Capability Policy

Higher levels must not overclaim unavailable capabilities. If an ideal tool, model, worker, transcript, visual analysis, or QA path is unavailable, ReeditPro should show the degraded capability and use the safest approved lower-depth path.

## Level Fallback Policy

| Situation | Future behavior |
| --- | --- |
| Ultra Premium selected but Qwen2.5-VL unavailable | Use Premium-safe visual fallback, rely on available source summary, and show degraded capability notice. Do not claim scene-level visual analysis ran. |
| Premium selected but transcript runtime unavailable | Use available source summary, ask for clarification when speech meaning matters, and do not claim transcript analysis ran. |
| Qwen 3.7 unavailable | Use deterministic fallback for planning and clearly mark fallback. |
| Audio/SoundSync unavailable | Keep voice-first audio recommendations simple and do not claim beat, waveform, or ducking analysis ran. |
| Render/export unavailable | Keep render budget future metadata only and do not start render/export. |
| Credit backend unavailable | Show estimate-only planning language and do not reserve/spend credits. |

## Degraded Notice Principles

Notices should be specific, calm, and honest. They should name what is unavailable, explain the safe fallback, and avoid describing the edit as lower quality. Normal remains a professional edit even when advanced tools are unavailable.

## Boundary

This fallback policy has no runtime implementation. Future fallback execution belongs behind approval, credit, backend, worker, and provider gates.
