# Owner: Atlas Track A

ownerDisplayName: Atlas Track A

ownerId: owner_tracka_visual_render_export

workstream: TRACK_A_VISUAL_RENDER_EXPORT

ownerRole: End-to-end owner for Track A visual/render/export open-source tools after cross-owner conflict check.

responsibilityType: end_to_end_tool_ownership_after_cross_owner_conflict_check

currentStatus: ownership_claim_registered_pending_cross_owner_conflict_scan

humanOwnerPromptSource: current chat request

sourceEvidence: Track A tool-study, Track A caption/render chain, Track A restricted internal beta scope decision, current repo tool registry

duplicateRisk: pending_cross_owner_conflict_scan

nextRequiredAction: TOOL-OWNER-CONFLICT-SCAN-1 -- Cross-owner tool claim scan before Track A tool implementation

lastUpdatedByBranch: codex/rp-tool-owner-registry-1-atlas-tracka-visual-render-export

## Claimed Tools

| toolId | displayName | ownershipStatus | currentInstallStatus | currentImplementationStatus | intendedPurpose | firstBetaScopeStatus | productionStatus | evidenceRequiredBeforeInstallOrExecution | duplicateCheckRequired |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ffmpeg | FFmpeg | claimed_pending_cross_owner_conflict_check | unknown_until_tool_inventory_pass | preliminary Track A caption/render chain evidence only | Core private media transcode/mux/validation support for Track A render/export and caption burn-in. | restricted_private_e2e_only_after_gates | blocked_pending_tool_inventory_conflict_scan_and_runtime_packet | conflict scan, inventory, license/build review, approved private execution packet | true |
| ffprobe | FFprobe | claimed_pending_cross_owner_conflict_check | unknown_until_tool_inventory_pass | preliminary Track A caption/render chain evidence only | Technical metadata/readback validation for private Track A render/export outputs. | restricted_private_e2e_only_after_gates | blocked_pending_tool_inventory_conflict_scan_and_runtime_packet | conflict scan, inventory, license/build review, approved private execution packet | true |
| libass | libass | claimed_pending_cross_owner_conflict_check | unknown_until_tool_inventory_pass | preliminary Track A caption/render chain evidence only | ASS subtitle/caption burn-in engine for Track A captions and fallback subtitle rendering. | restricted_private_e2e_only_after_gates | blocked_pending_tool_inventory_conflict_scan_and_runtime_packet | conflict scan, inventory, font/license review, caption policy evidence | true |
| remotion | Remotion | claimed_pending_cross_owner_conflict_check | unknown_until_tool_inventory_pass | preliminary Track A preview/render planning evidence only | Programmatic composition/preview/render template engine for approved Track A assets and manifests. | restricted_private_e2e_only_after_gates | blocked_pending_tool_inventory_conflict_scan_and_runtime_packet | conflict scan, inventory, renderer policy, approved snapshot handoff | true |
| opentimelineio | OpenTimelineIO | claimed_pending_cross_owner_conflict_check | unknown_until_tool_inventory_pass | unknown_until_tool_inventory_pass | Timeline/edit-decision interchange and validation for private Track A E2E handoff. | blocked_pending_inventory_and_conflict_scan | blocked_pending_tool_inventory_conflict_scan_and_runtime_packet | conflict scan, inventory, timeline contract, approved snapshot mapping | true |
| sharp_libvips | Sharp + libvips | claimed_pending_cross_owner_conflict_check | unknown_until_tool_inventory_pass | unknown_until_tool_inventory_pass | Image/still/asset prep, thumbnails, private review images, alpha/resize/crop support for Track A handoffs. | blocked_pending_inventory_and_conflict_scan | blocked_pending_tool_inventory_conflict_scan_and_runtime_packet | conflict scan, inventory, libvips/security review, private artifact policy | true |
| opencolorio | OpenColorIO | claimed_pending_cross_owner_conflict_check | unknown_until_tool_inventory_pass | unknown_until_tool_inventory_pass | Future professional color-management pipeline for Track A pro color transforms. | excluded_from_first_beta | blocked_future_production_color_review | conflict scan, inventory, color pipeline review, license/config review | true |
| openimageio | OpenImageIO | claimed_pending_cross_owner_conflict_check | unknown_until_tool_inventory_pass | unknown_until_tool_inventory_pass | Future professional image IO/metadata/color-image QA support. | excluded_from_first_beta | blocked_future_production_image_pipeline_review | conflict scan, inventory, image IO review, native dependency review | true |
| sam2 | SAM2 | claimed_pending_cross_owner_conflict_check | unknown_until_tool_inventory_pass | unknown_until_tool_inventory_pass | Future segmentation/tracking/mask sequence support for Track A visual tools. | excluded_from_first_beta | blocked_future_mask_model_review | conflict scan, inventory, model weight/license/privacy review, mask QA policy | true |
| kornia | Kornia | claimed_pending_cross_owner_conflict_check | unknown_until_tool_inventory_pass | unknown_until_tool_inventory_pass | Future GPU/CV mask refinement and image transform support. | excluded_from_first_beta | blocked_future_gpu_cv_review | conflict scan, inventory, GPU/CV review, QA thresholds | true |
| birefnet | BiRefNet | claimed_pending_cross_owner_conflict_check | unknown_until_tool_inventory_pass | unknown_until_tool_inventory_pass | Future foreground extraction/cutout/text-behind-subject support. | excluded_from_first_beta | blocked_future_mask_model_review | conflict scan, inventory, model weight/license/privacy review, artifact QA | true |
| real_esrgan | Real-ESRGAN | claimed_pending_cross_owner_conflict_check | unknown_until_tool_inventory_pass | unknown_until_tool_inventory_pass | Future image/video enhancement/upscale support. | excluded_from_first_beta | blocked_future_enhancement_review | conflict scan, inventory, model/license review, no-misleading-restoration QA | true |
| film | FILM | claimed_pending_cross_owner_conflict_check | unknown_until_tool_inventory_pass | unknown_until_tool_inventory_pass | Future frame interpolation/slow-motion support. | excluded_from_first_beta | blocked_future_interpolation_review | conflict scan, inventory, model/license review, motion artifact QA | true |
| tracka_caption_burnin | Track A Caption Burn-in | claimed_pending_cross_owner_conflict_check | unknown_until_tool_inventory_pass | preliminary Track A caption/render chain evidence only | End-to-end Track A caption source, style, burn-in, visual review, and policy path. | restricted_private_e2e_only_after_gates | blocked_pending_tool_inventory_conflict_scan_and_runtime_packet | conflict scan, inventory, caption source, style, burn-in, QA evidence | true |
| tracka_render_export_hardening | Track A Render Export Hardening | claimed_pending_cross_owner_conflict_check | unknown_until_tool_inventory_pass | preliminary private render/export planning evidence only | Private render/export validation, artifact manifests, checksums, QA reports, and blocked final delivery policy. | restricted_private_e2e_only_after_gates | blocked_pending_tool_inventory_conflict_scan_and_runtime_packet | conflict scan, inventory, manifest/checksum/QA policy evidence | true |
| tracka_visual_video_private_e2e | Track A Visual Video Private E2E | claimed_pending_cross_owner_conflict_check | unknown_until_tool_inventory_pass | preliminary Track A private E2E planning evidence only | Restricted private E2E visual-video validation path for internal beta readiness. | restricted_private_e2e_only_after_gates | blocked_pending_worker_tool_route_and_execution_gates | conflict scan, inventory, guarded private E2E packet, worker/tool route gates | true |

## Explicitly Not Owned

Track B media processing tools: paddleocr, paddlepaddle, opencv ownership for Track B analysis, pyav, pyscenedetect, duckdb, polars, deepfilternet, signalsmith_stretch, demucs, qwen_vl, vllm

Web search/capture tools: searxng, brave_search, playwright for web capture, mozilla_readability

Map/geospatial tools: maplibre, turf, deck_gl, cesium_js, nominatim, photon, pelias, osrm, valhalla, pmtiles, tileserver_gl, martin

AI creative graphics tools outside Track A final render handoff: d3, echarts, vega_lite, three_js, pixijs, lottie_web, svg_js, satori, resvg_js, graphviz, viz_js

Sound/Music/Audio tools: audioflux, mirelo, mmaudio, lyria, sound library generation, music/SFX provider routes

Provider/model execution: qwen, deepseek, provider gateway, model calls

Worker Runtime infrastructure: worker claim/lease/RPC, transactional execution, service-role runtime

Supabase: schema, RLS, migrations, SQL, milestone sync

Billing: credits, Stripe, payment flows

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, or broad service-role handler was enabled.
