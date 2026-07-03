# AI_TOOLS_CREATIVE_GRAPHICS Capability Map

Decision: `ai_tools_creative_graphics_tool_study_passed_docs_only`

| Capability | Good for | Weaknesses | Prohibited uses | Inputs | Outputs | Readiness |
| --- | --- | --- | --- | --- | --- | --- |
| `ai_image_generation_planning` | Still assets, character anchors, keyframes, rich evidence cards, designed graphics | Cannot verify provider output without later calls | Real provider/model calls, public artifacts, final canvas | approved visual asset plan, frame rules, style notes | private provider prompt plan metadata | metadata-only |
| `ai_image_editing_planning` | Planned inpaint/outpaint/cleanup notes, product card variants, background match instructions | Cannot edit pixels in this phase | Editing user media or provider assets now | approved asset refs, edit intent, avoid rules | private image-edit brief metadata | metadata-only |
| `style_transfer_planning` | Brand-safe look notes, visual consistency, non-final style experiments | Risk of style drift/IP confusion | Copying protected styles or executing style transfer | brand style refs, mood, frame/background rules | style route metadata | metadata-only |
| `thumbnail_cover_poster_planning` | Social cover concepts, campaign posters, hero graphics | Not export-ready without future generation/render QA | Publishing, public delivery, signed URLs | platform, title, visual hierarchy, safe text | concept brief and QA checklist | metadata-only |
| `title_card_lower_third_overlay_planning` | Exact text overlays, name cards, lower thirds, callouts | Needs final render owner for execution | Rendering overlays or route execution | segment meaning, safe zones, typography rules | Remotion/design handoff metadata | metadata-only |
| `typography_layout_composition_metadata` | Hierarchy, spacing, caption collision avoidance, visual zones | Cannot guarantee render quality without Track A | Final export or browser/canvas rendering | frame layout, caption zones, content density | layout constraints | metadata-only |
| `brand_visual_style_metadata` | Brand fit, palette, visual tone, professional consistency | Needs user brand source approval later | Secret/private brand payload exposure | style mode, brand notes, product category | brand-safe visual direction | metadata-only |
| `graphic_asset_qa_metadata` | Readability, face-safe layout, fact-safety, artifact scope | QA is planning-only here | Claiming generated assets passed visual QA | planned asset class, safety constraints | QA checklist and blockers | metadata-only |
| `design_prompt_to_intent_routing` | Converts compiled intent into provider-safe design briefs | Cannot use raw prompt as worker input | raw prompt execution, raw chat-to-provider forwarding | compiled intent, approved snapshot refs | structured brief metadata | metadata-only |
| `creative_graphics_route_capability_metadata` | Future route matching and owner handoff | Does not enable route execution | routing live jobs | tool-route manifest metadata | route readiness facts | metadata-only |
| `creative_graphics_cost_capacity_metadata` | Cost estimate planning and execution blocker visibility | No real cost telemetry | charging credits or reserving usage | candidate count, expected model class, QA depth | cost/capacity planning fields | metadata-only |

Related but not owned: `TRACK_B_MEDIA_PROCESSING`, `SOUND_MUSIC_AUDIO`, `TRACK_A_RENDER_EXPORT`, `PROVIDER_GATEWAY`, `WORKER_RUNTIME_JOBS`, `SUPABASE_RLS_STORAGE_DATABASE`, map/web capture owner studies.
