# Edit Level Source Video Understanding Policy

Source video understanding helps ReeditPro avoid template editing by choosing strategies from the actual uploaded footage, user intent, Edit Brief, and Edit Preference/DNA. RP-EDITLEVEL-06 adds mock/local source-understanding routing by Edit Level; it does not execute source understanding tools.

## Level Policy

| Level | Source understanding depth |
| --- | --- |
| Normal | Basic source metadata: duration, dimensions, aspect ratio, uploaded order, rough clip role, and obvious export recommendation. Visual context is targeted only when a marker or ambiguity requires it. |
| Premium | Source video understanding package: key moments, marker windows, rough transcript when speech exists, useful B-roll opportunities, visible text/layout notes when relevant, and stronger source-truth QA. |
| Ultra Premium | Deep source understanding: scene-level Qwen2.5-VL visual analysis, transcript plus speech timing when speech exists, audio/sound design planning, graphic/text/layout understanding, visual continuity, and stricter confidence review. |

## Integration Points

The future policy should feed the Source Sequence Map, Marker Chat context package, Edit Brief planning, Edit Preference/DNA application, tool routing, QA profile, and credit estimate only metadata.

## Degraded Capability

If source understanding workers or Qwen2.5-VL are unavailable, do not overclaim. Use available source metadata, ask for clarification when needed, and show degraded capability copy for Premium or Ultra Premium expectations.

## Boundary

No real transcript generation, video analysis, audio analysis, face/object detection, media extraction, provider call, worker dispatch, render/export, upload, external fetch, file-byte read, or credit spend occurs in RP-EDITLEVEL-06.

Recommended next milestone after the completed RP07 Qwen planning profile: `RP-EDITLEVEL-08 - Level-Aware QA Gates`.
