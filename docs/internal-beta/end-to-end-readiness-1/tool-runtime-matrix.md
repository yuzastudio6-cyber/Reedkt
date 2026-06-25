# ReEditPro Internal Beta Tool Runtime Matrix

Decision: `blocked_pending_backend_worker_render_storage_billing_and_tool_runtime_gates`

Runtime layer requirement: `planning_only_approved_internal_beta_production_ready_separation`

Product-ready end-to-end local OSS tools: `0`

| Capability | Current Evidence | Internal Beta Status | Production Status | Next Action |
| --- | --- | --- | --- | --- |
| Remotion render worker | policy and worker-skeleton docs exist; #577 remains excluded | `blocked_pending_external_validation_or_new_worker_render_lane` | `blocked_no_final_render_export` | `RP-RENDER-01-REMOTION-WORKER-SKELETON` |
| GStreamer | `qa_passed_controlled_generated_private_fixture_execution_evidence` | `blocked_pending_worker_route_private_artifact_and_internal_beta_e2e_gate` | `blocked_pending_production_runtime_review` | carry into internal beta only after worker/runtime gates |
| MKVToolNix | `qa_passed_controlled_generated_private_fixture_execution_evidence` | `blocked_pending_worker_route_private_artifact_and_internal_beta_e2e_gate` | `blocked_pending_production_runtime_review` | carry into internal beta only after worker/runtime gates |
| GPAC/MP4Box | official APT install-source/package presence evidence; no product runtime | `blocked_pending_install_source_qa_worker_integration_and_no_media_runtime_gate` | `blocked_pending_production_runtime_review` | `TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-QA-1` |
| FFmpeg/FFprobe | Track B-owned shared dependency policy/evidence | `blocked_pending_track_b_lgpl_policy_and_worker_boundary` | `blocked_pending_production_codec_policy_and_qa` | coordinate with Track B before any beta media evidence |
| Sharp/libvips | candidate only in launch tool docs | `blocked_pending_dependency_security_lgpl_review` | `blocked_pending_production_review` | source/dependency review before install proof |
| VapourSynth | blocked pending owner-approved package source and plugin policy | `blocked` | `blocked` | `TRACKA-VAPOURSYNTH-PACKAGE-SOURCE-OWNER-DECISION-1` |
| Revideo | evaluation-only/non-core | `blocked_pending_owner_approval` | `blocked` | `TRACKA-REVIDEO-OWNER-APPROVAL-1` |
| FILM | capability label only; AI Graphics acceptance absent | `blocked_pending_ai_graphics_owner_acceptance_for_film_runtime` | `blocked` | `AI_GRAPHICS_FILM_OWNER_ACCEPTANCE_HANDOFF_1` |
| SAM2/BiRefNet/Real-ESRGAN | historical evidence requires retarget/visual review | `deferred_post_beta_or_explicit_scope_expansion` | `blocked` | separate owner review and source alignment |

## Tool State Rule

No tool may imply production readiness from install evidence alone. Every tool must move through owner/source approval, install proof, build metadata proof, no-media runtime proof, synthetic fixture proof, private fixture QA, worker integration, beta QA, and production readiness review before being labeled production ready.
