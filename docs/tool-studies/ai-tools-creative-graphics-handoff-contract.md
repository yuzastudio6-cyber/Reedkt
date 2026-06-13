# AI_TOOLS_CREATIVE_GRAPHICS Handoff Contract

Decision: `ai_tools_creative_graphics_tool_study_passed_docs_only`

Future phases may consume this owner study as metadata only. They must not treat it as provider, route, worker, image generation, image editing, render, Supabase, public artifact, beta, or production approval.

## Required Handoff Fields

- owner: `AI_TOOLS_CREATIVE_GRAPHICS`
- approved snapshot ref or pending snapshot ref
- segment id and beat id
- visual purpose
- asset class
- generation/editing planning lane
- style/brand notes
- typography/layout constraints
- frame and safe-zone constraints
- character consistency needs
- documentary/fact-safety notes
- copyright/IP/provenance review needs
- artifact privacy class
- source-of-truth refs
- signed URL source-of-truth flag: false
- public artifact flag: false
- provider/model execution flag: false
- worker/tool/route execution flags: false
- cost/capacity estimate metadata
- blockers and owner handoffs

## Accepted Source-Of-Truth Refs

- approved plan snapshot refs
- private manifest ids
- checksums
- private GCS path refs when approved by a later storage phase
- Supabase row refs only after a separate Supabase approval

Signed URLs are never source of truth.

## Downstream Handoffs

- `PROVIDER_GATEWAY`: receives only structured provider-safe design briefs after a later provider approval.
- `WORKER_RUNTIME_JOBS`: receives only approved plan snapshot refs after a later worker approval.
- `TRACK_A_RENDER_EXPORT`: receives graphic asset refs and layer/composition metadata after a later render/export approval.
- `TRACK_B_MEDIA_PROCESSING`: provides media metadata and QA facts; this owner does not run Track B tools.
- `SOUND_MUSIC_AUDIO`: provides timing/audio/SFX metadata; this owner does not run audio tools.
- `SUPABASE_RLS_STORAGE_DATABASE`: owns future persistence; this owner does not write rows.

## Explicit Non-Handoff

Raw prompts, raw chat, provider responses, generated images, edited images, signed URLs, public artifact URLs, and private data bodies are not valid worker/tool/route inputs in this study.
