# Tool Readiness Matrix After GPAC Dispatch Scaffold

Packet: `RP-EXTERNAL-PRODUCT-TOOL-READINESS-AFTER-GPAC-DISPATCH-1`

| Lane | Current status | Product/runtime boundary |
| --- | --- | --- |
| Controlled staging UI/API | `active_single_tester_external_beta_for_aiediting_reeditpro_com` | Real usage route readback is `blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa`. |
| QWEN2.5-VL controlled product flow | `qa_passed_single_tester_qwen_product_flow_runtime_evidence_backend_only_gated_not_broad_provider_unlock` | Backend-only gated path; broad provider/model calls and production remain blocked. |
| Remotion private preview/export | `completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation` | Generated-local evidence only; #577 remains excluded; final delivery/export remains blocked. |
| GStreamer render pipeline support | `qa_passed_controlled_generated_private_fixture_execution_evidence_not_broad_production_ready` | Not run in this phase; product runtime/broad media remain blocked. |
| MKVToolNix container validation | `qa_passed_controlled_generated_private_fixture_execution_evidence_not_broad_production_ready` | Not run in this phase; product runtime/broad media remain blocked. |
| GPAC/MP4Box packaging validation | `blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation_after_official_apt_runtime_and_synthetic_command_qa` | Official APT/source/runtime/synthetic evidence exists; route/worker dispatch and product runtime remain blocked pending explicit confirmation. |
| Core VapourSynth | `blocked_no_safe_package_source_for_core_vapoursynth_current_base` | Package/source/plugin policy remains blocked. |
| Revideo | `evaluation_only_non_core_source_evidence_insufficient_for_install_source` | Owner-gated; not product runtime. |
| FILM | `blocked_pending_ai_graphics_owner_acceptance_for_film_runtime` | No model weights, GPU runtime, or AI Graphics owner acceptance. |
| Broad external beta audience | `blocked_no_additional_named_tester_list` | No additional named tester list is source-approved. |
| Paid production / final export | `blocked` | Requires separate legal, billing, security, support, artifact, and production reviews. |

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`
