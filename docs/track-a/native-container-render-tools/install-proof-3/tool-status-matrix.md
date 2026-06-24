# Install-Proof-3 Tool Status Matrix

Product-ready end-to-end local OSS tools: `0`.

| Tool label | Prior source | Install-proof-3 status | Readiness |
| --- | --- | --- | --- |
| `gstreamer_render_pipeline_support` | #601 install-source; #609 build metadata; #649 no-media runtime; #652 synthetic fixture; #659/#667 scope; #662/#675 approval; #666 plan; #673 execution; #680 reconciliation; #682 QA; #693 rollup | `qa_passed_controlled_generated_private_fixture_execution_evidence` | `ready_for_future_private_e2e_planning_only` |
| `mkvtoolnix_container_validation` | #601 install-source; #609 build metadata; #649 no-media runtime; #652 synthetic fixture; #659/#667 scope; #662/#675 approval; #666 plan; #673 execution; #680 reconciliation; #682 QA; #693 rollup | `qa_passed_controlled_generated_private_fixture_execution_evidence` | `ready_for_future_private_e2e_planning_only` |
| `bento4_mp4box_packaging_validation` | #624 identity/policy | `blocked_gpac_mp4box_package_source_unavailable` | `requires_package_source_resolution_before_install_proof` |
| `vapoursynth_frame_pipeline` | #624 identity/policy | `blocked_core_vapoursynth_package_source_unavailable`; `blocked_vapoursynth_native_plugin_policy_not_satisfied` | `requires_package_source_resolution_before_install_proof` |
| `revideo_render_preview_alternative` | #624 identity/policy | `evaluation_only_non_core_owner_approval_required_before_install_source` | `blocked_pending_revideo_owner_approval_1` |
| `hyperframe_render_handoff` | #624 identity/policy | `handoff_only_no_install_source_change` | `handoff_only_no_install_source_change` |
| `shared_dependency_ffmpeg_trackb_owned` | Track B-owned shared dependency only | `not_run_in_install_proof_3` | `coordination_required_for_future_use` |
| `shared_dependency_ffprobe_trackb_owned` | Track B-owned shared dependency only | `not_run_in_install_proof_3` | `coordination_required_for_future_use` |

No GStreamer execution in this install-proof phase, MKVToolNix execution in this install-proof phase, GPAC/MP4Box execution, VapourSynth execution, Revideo execution, FFmpeg/FFprobe execution, Docker execution, Remotion execution, package installation, dependency mutation, or package-lock mutation occurred.
