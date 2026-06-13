# TOOL-STUDY-0 AI_TOOLS_CREATIVE_GRAPHICS Tool Study

Status: `docs_diagnostics_only`

Decision: `ai_tools_creative_graphics_tool_study_passed_docs_only`

Owner: `AI_TOOLS_CREATIVE_GRAPHICS`

This study defines how ReEditPro should route creative graphics planning before any tool-route, provider, worker, image generation, image editing, media processing, public artifact, signed URL, beta, or production execution is separately approved. It is a planning and diagnostics artifact only.

## Owner Purpose

`AI_TOOLS_CREATIVE_GRAPHICS` owns planning metadata for visual assets that are creative, designed, generative, brand-driven, or Graphic Design / VisualExplain oriented:

- `ai_image_generation_planning`
- `ai_image_editing_planning`
- `style_transfer_planning`
- `thumbnail_cover_poster_planning`
- `title_card_lower_third_overlay_planning`
- `typography_layout_composition_metadata`
- `brand_visual_style_metadata`
- `graphic_asset_qa_metadata`
- `design_prompt_to_intent_routing`
- `creative_graphics_route_capability_metadata`
- `creative_graphics_cost_capacity_metadata`

The study does not call models or providers. GPT-Image-2, image editing models, style systems, and future design providers remain provider routes governed by approved-plan snapshots, provider gateway policy, credit approval, and later execution packets.

## Strengths

- Turn story beats into planned stills, keyframes, title cards, overlays, lower thirds, thumbnails, posters, and visual style briefs.
- Preserve VisualExplain rules for clean hierarchy, readable labels, safe zones, and exact text.
- Choose when controlled Remotion or open-source tool outputs are better than generative visuals.
- Define handoff metadata for future provider prompts without passing raw chat to providers, tools, workers, or routes.
- Keep brand, character consistency, fact-safety, copyright/IP, and public-artifact risk visible before execution.

## Weaknesses

- It cannot prove visual quality because no generation, image editing, rendering, or media processing runs.
- It cannot verify provider availability, cost, latency, model alias support, or prompt output quality.
- It cannot create final compositions, public artifacts, signed URLs, GCS objects, Supabase rows, or production assets.
- It cannot replace Track B media analysis, Sound/Music/Audio timing/audio decisions, or Track A final render/export.

## Bad Fits

- Exact charts, maps, browser captures, OCR, scene detection, media metadata, or source media processing. Route those to `TRACK_B_MEDIA_PROCESSING`, map/web owners, or later controlled tools.
- Speech cleanup, loudness, beat timing, SFX, music generation, stem separation, and Demucs decisions. Route those to `SOUND_MUSIC_AUDIO`.
- Final video assembly, muxing, export QC, render job execution, and delivery. Route those to `TRACK_A_RENDER_EXPORT`.
- Any runtime request that starts from raw chat instead of an approved plan snapshot.

## Safety Boundaries

- routeExecutionAllowed: false
- runtimeExecutionAllowed: false
- workerExecutionAllowed: false
- providerExecutionAllowed: false
- modelExecutionAllowed: false
- toolExecutionAllowed: false
- imageGenerationAllowed: false
- imageEditingAllowed: false
- mediaProcessingAllowed: false
- publicArtifactsAllowed: false
- signedUrlsAsSourceOfTruthAllowed: false
- rawPromptExecutionAllowed: false

Signed URLs are never source of truth. Provider outputs, graphic candidates, and prompt drafts cannot become public artifacts or worker inputs without a later approval packet.

## Supabase Classification

Supabase update required: `no write`

Supabase update status: `docs_only`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`

Supabase milestone sync remains completed for Track B clean staging; this phase does not mutate Supabase.
