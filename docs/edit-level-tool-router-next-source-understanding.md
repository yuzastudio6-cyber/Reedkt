# Next: Level-Aware Source Video Understanding Routing

Status: RP-EDITLEVEL-06 is complete as mock/local source-understanding routing.

RP-EDITLEVEL-06 uses the RP05 routing package to decide how source understanding depth changes by Edit Level:

- Normal: basic source metadata and targeted visual clarification.
- Premium: key moments, marker windows, transcript-aware planning when speech exists, and source understanding package metadata.
- Ultra Premium: scene-level/deep visual policy, transcript-required-when-speech planning, audio/design context, and stricter source-truth QA.

RP06 remains safe: no provider/model calls, no media extraction, no Whisper, no Qwen2.5-VL execution, no workers, no render/export, no Supabase migration, and no credit spend.

Recommended next milestone after the completed RP06/RP07 chain: `RP-EDITLEVEL-08 - Level-Aware QA Gates`.
