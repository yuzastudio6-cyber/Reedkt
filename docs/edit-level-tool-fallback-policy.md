# Edit Level Tool Fallback Policy

The router produces degraded notices when a selected level references a future model, worker, storage, render, or credit capability.

## Fallbacks

| Missing capability | Safe fallback |
| --- | --- |
| Qwen 3.7 | Use deterministic reasoning fallback and say Qwen did not run. |
| Qwen2.5-VL | Use visible-context/source-summary fallback or lower visual depth. |
| Transcript | Use source summary and ask for clarification when speech meaning matters. |
| Audio/SoundSync | Use a basic voice-first audio policy and do not claim beat/waveform analysis. |
| Graphic/design understanding | Use basic captions/cards and controlled layout guidance. |
| Render worker | Stay in plan-only mode. |
| Credit gate | Stay in estimate-only mode; reserve and spend no credits. |

Fallbacks must never describe Normal as low quality. They name unavailable capability depth, not reduced professionalism.

No fallback executes a provider/model/tool, creates a worker, processes media, starts progress, renders, exports, or touches credits.
