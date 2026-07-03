# AI_TOOLS_CREATIVE_GRAPHICS Tool Combination Map

Decision: `ai_tools_creative_graphics_tool_study_passed_docs_only`

All combinations below are planning combinations. They do not execute tools, workers, providers, routes, media processing, rendering, Supabase writes, public artifacts, signed URLs, beta, or production.

| Combination | Use case | Metadata-only handoff | Blocked until |
| --- | --- | --- | --- |
| `compiled_intent -> design_prompt_to_intent_routing -> ai_image_generation_planning` | Still/keyframe/card concept | structured provider-safe brief | provider dry-run/execution approval |
| `character_pack -> ai_image_generation_planning -> graphic_asset_qa_metadata` | Recurring character anchor or card | identity/style/avoid rules and QA checklist | character/source rights and provider approval |
| `fact_safety_plan -> title_card_lower_third_overlay_planning` | Neutral documentary name/source card | claim status, safe wording, visual treatment | fact-safety review if claim status is unclear |
| `brand_visual_style_metadata -> thumbnail_cover_poster_planning` | Social cover or poster concept | brand palette, typography, hierarchy, avoid rules | brand/IP approval and future generation/render gate |
| `typography_layout_composition_metadata -> title_card_lower_third_overlay_planning -> TRACK_A_RENDER_EXPORT` | Exact overlay/lower-third plan | safe-zone and layer metadata | Track A render/export owner approval |
| `TRACK_B_MEDIA_PROCESSING metadata -> graphic_asset_qa_metadata` | Face-safe or OCR-informed graphic placement | consume safe-zone/OCR/media metadata only | Track B runtime remains separate |
| `SOUND_MUSIC_AUDIO timing metadata -> creative_graphics_route_capability_metadata` | Timed visual cue with audio/SFX beat | cue timing refs only | audio/runtime remains separate |
| `map/web owner metadata -> typography_layout_composition_metadata` | Graphic around map/web evidence | consume map/capture refs only | map/web capture execution remains separate |
| `provider candidate output -> approved_plan_snapshot_v1` | Future asset handoff | blocked by approval gate | approved snapshot and worker execution phase |

Invalid combinations fail closed:

- raw chat -> provider prompt
- provider response -> worker/tool input
- provider response -> public artifact
- provider response -> signed URL source of truth
- generated image -> production/export without Track A
- creative graphics metadata -> Supabase write
- creative graphics route metadata -> live route execution
