# Tool Status Matrix

Product-ready end-to-end local OSS tools: `0`.

| Tool label | Source chain | Policy review status | Readiness |
| --- | --- | --- | --- |
| `gstreamer_render_pipeline_support` | #601 install-source; #609 build metadata; #649 no-media runtime; #652 synthetic fixture; #659/#667 scope; #662/#675 approval; #666 plan; #673 execution; #680 reconciliation; #682 QA; #693 rollup; #697 install-proof-3; #702 source-resolution | `qa_passed_controlled_generated_private_fixture_execution_evidence`; not run in this phase | `ready_for_future_private_e2e_planning_only` |
| `mkvtoolnix_container_validation` | #601 install-source; #609 build metadata; #649 no-media runtime; #652 synthetic fixture; #659/#667 scope; #662/#675 approval; #666 plan; #673 execution; #680 reconciliation; #682 QA; #693 rollup; #697 install-proof-3; #702 source-resolution | `qa_passed_controlled_generated_private_fixture_execution_evidence`; not run in this phase | `ready_for_future_private_e2e_planning_only` |
| `bento4_mp4box_packaging_validation` | #624 identity/policy; #697 install-proof-3; #702 source-resolution | `blocked_gpac_mp4box_package_source_unavailable`; Bento4 `separate_not_selected_for_mp4box_command_path` | `blocked_pending_safe_package_source` |
| `vapoursynth_frame_pipeline` | #624 identity/policy; #697 install-proof-3; #702 source-resolution | `blocked_core_vapoursynth_package_source_unavailable`; `blocked_vapoursynth_native_plugin_policy_not_satisfied` | `blocked_pending_safe_package_source` |
| `revideo_render_preview_alternative` | #624 identity/policy; #697 install-proof-3; #702 source-resolution | `evaluation_only_non_core_owner_approval_required_before_install_source` | `blocked_pending_revideo_owner_approval_1` |
| `hyperframe_render_handoff` | #624 identity/policy; #697 install-proof-3; #702 source-resolution | `handoff_only_no_install_source_change` | `handoff_only_no_install_source_change` |
| `shared_dependency_ffmpeg_trackb_owned` | Track B-owned shared dependency only | `not_run_in_package_source_policy_review_1` | `coordination_required_for_future_use` |
| `shared_dependency_ffprobe_trackb_owned` | Track B-owned shared dependency only | `not_run_in_package_source_policy_review_1` | `coordination_required_for_future_use` |

No GStreamer execution in this phase, MKVToolNix execution in this phase, GPAC/MP4Box execution in this phase, VapourSynth execution in this phase, Revideo execution in this phase, FFmpeg/FFprobe execution, Docker build, Docker push/deploy, Remotion execution, package installation, dependency mutation, package-lock mutation, Dockerfile install-source change, or requirements install-source change occurred.
