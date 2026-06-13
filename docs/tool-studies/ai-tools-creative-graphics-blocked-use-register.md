# AI_TOOLS_CREATIVE_GRAPHICS Blocked-Use Register

Decision: `ai_tools_creative_graphics_tool_study_passed_docs_only`

| Blocked use | Reason | Future owner |
| --- | --- | --- |
| Provider/model call for image generation | Requires provider gateway, secrets, cost, schema, and redaction approval | `PROVIDER_GATEWAY` |
| Provider/model call for image editing | Requires provider gateway and artifact safety approval | `PROVIDER_GATEWAY` |
| Raw prompt to provider/tool/worker | Workers and providers must consume structured approved snapshot data | `MODEL_ORCHESTRATION` |
| Provider response to mutation | Provider output is not an execution command | `WORKER_RUNTIME_JOBS` |
| Provider response to public artifact | Public artifact policy is not approved | `TRACK_A_RENDER_EXPORT` |
| Signed URL as source of truth | Signed URLs are never source of truth | `SUPABASE_RLS_STORAGE_DATABASE` |
| Public thumbnails/posters/covers | Delivery and rights policy are not approved | `TRACK_A_RENDER_EXPORT` |
| Style transfer on private/user media | Needs IP/brand/provenance and media-processing review | `COMPLIANCE_SECURITY` and owner route |
| Real named person likeness generation | Needs real-person policy, source rights, and approval | `COMPLIANCE_SECURITY` |
| Final render/export | Belongs to final render/export owner | `TRACK_A_RENDER_EXPORT` |
| Source media CV/OCR/processing | Belongs to Track B | `TRACK_B_MEDIA_PROCESSING` |
| Audio/SFX/music processing | Belongs to Sound/Music/Audio | `SOUND_MUSIC_AUDIO` |
| Supabase persistence | Requires separate Supabase approval | `SUPABASE_RLS_STORAGE_DATABASE` |
| Dependency install or runtime package enablement | Requires separate package/security/runtime review | owning runtime phase |
| Production/external beta/paid production | Product/runtime scope remains blocked | cross-workstream approval |

No blocked use is approved or executed by this study.
