# TRACK_A_RENDER_EXPORT Tool Combination Map

This map shows how Track A should combine upstream owner-study evidence into future render/export planning. It is a routing contract only.

| Combination | Upstream Owner | Track A Role | Required Inputs | Planned Output | Source-Of-Truth | Blocked In TOOL-STUDY-0 |
| --- | --- | --- | --- | --- | --- | --- |
| AI Tools asset -> Track A composition | `AI_TOOLS_CREATIVE_GRAPHICS` | Intake cards, charts, vectors, Lottie/SVG specs, transparent overlays, and scene manifests for future layer planning. | creative asset manifest, graphic spec, source data refs, checksums, alpha policy, QA report | `ai_tools_asset_intake` and `transparent_overlay_intake` records | structured manifests, checksums, source refs, QA | graphics generation, rasterization, Remotion execution, final render/export |
| Track B media analysis -> Track A preview/render planning | `TRACK_B_MEDIA_PROCESSING` | Consume shot/timeline/media readiness summaries and source cleanup handoffs. | media analysis manifest, trim/select refs, color/audio readiness, QA flags | `track_b_media_analysis_intake` record | sanitized summaries, fixture refs, QA | raw media processing, ffprobe/FFmpeg execution, broad media handling |
| Map manifest -> Track A overlay/final composition | `MAP_GEOSPATIAL` | Place map cards, pins, routes, camera moves, and geography overlays in future compositions. | GeoJSON, style, camera, timing, render manifest, map QA | `map_overlay_intake` record | GeoJSON/style/camera/timing/render manifests | map rendering, live tiles, live geocoding, live routing |
| Web/Search evidence manifest -> Track A visual reference/intake | `WEB_SEARCH_CAPTURE` | Convert sanitized source/capture/extraction evidence into evidence-card and browser-visual planning. | source manifest, capture manifest, extraction manifest, source QA | `web_evidence_visual_intake` record | source/capture/extraction manifests and QA | web search, browser capture, raw search response storage |
| Sound/Music cue manifest -> Track A timing/final composition handoff | `SOUND_MUSIC_AUDIO` | Align visual layers, caption moments, transition cues, and final artifact QA with audio plans. | cue sheet, ducking plan, loudness policy, SFX timing refs | `sound_music_audio_intake` record | cue/timing/mix manifests and QA | audio rendering, mixdown, SFX/music generation |
| Approved plan snapshot -> Worker Runtime -> Track A future execution | `WORKER_RUNTIME_JOBS` | Receive only approved, immutable plan snapshots and deterministic worker job handoffs before any future execution. | approved plan snapshot, idempotency key, dependency graph, worker event plan | `final_composition_planning` and `render_manifest_policy` records | approved snapshot and worker event manifests | worker execution, claim/lease mutation, route execution |
| Caption/subtitle plan -> private preview composition | `TRACK_A_RENDER_EXPORT` with timing/caption owners | Plan caption layer placement, safe zones, readability, burn-in policy, and subtitle sidecar expectations. | caption timing refs, safe-zone refs, style refs, collision QA | `caption_burnin_preview_route` record | caption/subtitle plan and timing QA | libass execution, burn-in rendering, preview render execution |
| Final render/export manifest -> QA/review handoff | `TRACK_A_RENDER_EXPORT` plus Compliance/Observability | Prepare human review and future readiness gates without delivery. | render manifest, export manifest, private refs, checksums, QA gates | `final_artifact_qa_handoff` record | private manifests, checksums, QA records | declaring final artifact complete, signed URL creation, public artifact delivery |

## Combination Rules

- Track A may combine manifests only after source ownership, provenance, timing, and QA fields are present.
- Track A must not convert screenshots or temporary previews into source-of-truth.
- Track A must block final composition planning when the approved snapshot is missing, frame is unconfirmed, timing validation is failed, required assets are missing, or QA gates are unresolved.
- Worker Runtime is required before execution. TOOL-STUDY-0 produces only review/planning docs.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
