# Edit Level Marker Context Policy

RP-EDITLEVEL-06 defines marker context policy by Edit Level.

| Level | Marker Window | Policy |
| --- | ---: | --- |
| Normal | 5s before / 5s after | Nearby markers, transcript if available, targeted visual/audio only when the marker or request needs it. |
| Premium | 10s before / 10s after | Transcript when speech exists, marker-window visual summary, audio/SFX/music summary where available, Preference DNA, nearby markers, and QA warnings. |
| Ultra Premium | 15s before / 15s after | Transcript and speech timing, scene-level visual context, sound-design context, graphic/text/layout context, Preference DNA, QA guardrails, nearby markers, conflicts, and plan-hint history. |

This is routing metadata only. It does not retrieve context, run Qwen2.5-VL, run transcript workers, read media bytes, or execute tools.
