# Blocked Scope Register

Milestone: `TRACKA-NATIVE-CONTAINER-PACKAGE-SOURCE-RESOLUTION-BATCH-1`

| Scope | Status | Notes |
| --- | --- | --- |
| GPAC/MP4Box package source | `blocked_gpac_mp4box_package_source_unavailable` | No safe current-base package source was accepted for `node:24-bookworm`. |
| Bento4 MP4Box command path | `separate_not_selected_for_mp4box_command_path` | Bento4 remains separate and is not selected as the MP4Box provider. |
| core VapourSynth package source | `blocked_core_vapoursynth_package_source_unavailable` | Current base Python/package-source policy does not support install-source changes. |
| VapourSynth plugins | `blocked_vapoursynth_native_plugin_policy_not_satisfied` | Plugins require separate package/license/policy review. |
| Revideo install source | `evaluation_only_non_core_owner_approval_required_before_install_source` | Owner approval is required before any install-source proof. |
| Hyperframe install source | `handoff_only_no_install_source_change` | Handoff-only; no install target selected. |
| Tool execution | `blocked_not_in_scope` | No GPAC/MP4Box, VapourSynth, Revideo, GStreamer, MKVToolNix, FFmpeg, FFprobe, Docker, or Remotion command is run. |
| Dockerfile package declarations | `blocked_not_in_scope` | No Dockerfile or requirements install-source change is allowed. |
| Public artifacts, signed URLs, beta, production, final delivery/export | `blocked_not_in_scope` | All delivery and unlock scopes remain blocked. |
| Supabase and SQL | `not_applicable_docs_only` | No Supabase environment was touched and no SQL was executed. |

Product-ready end-to-end local OSS tools: `0`.
