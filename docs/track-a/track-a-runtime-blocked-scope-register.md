# Track A Runtime Blocked-Scope Register

Status: `blocked_scope_register`

TRACKA-RECON-0 records blocked runtime and delivery scope. It does not relax or remove any existing block.

## Blocked Scope

| Scope | Status | Notes |
| --- | --- | --- |
| Final delivery | blocked | No final delivery path is enabled. |
| Public artifacts | blocked | Public artifact creation and public delivery are out of scope. |
| Signed URLs as source-of-truth | blocked | Signed URLs are not source-of-truth and are not created. |
| Production | blocked | No production unlock or deployment. |
| External beta | blocked | No external beta unlock. |
| Internal beta | blocked | No internal beta unlock in this reconciliation phase. |
| Paid production | blocked | No billing, credit, Stripe, or paid production action. |
| Broad real media | blocked | No arbitrary or broad user media processing. |
| Arbitrary real/user media | blocked | Historical samples are evidence only; no replay is run. |
| Provider/model calls | blocked | No Qwen, DeepSeek, image, video, or audio provider call. |
| Track B runtime | blocked | Track B media processing remains separate and not executed. |
| Worker execution | blocked | WORKER-1 is dry-run only. |
| Tool-route execution | blocked | TOOL-ROUTE-1 and TOOL-ROUTE-2 are planning evidence only. |
| BiRefNet runtime | blocked | No mask runtime is run. |
| SAM2 runtime | blocked | No segmentation runtime is run. |
| Real-ESRGAN runtime | blocked | No enhancement runtime is run. |
| FILM runtime | blocked | No interpolation runtime is run. |
| Kornia runtime | blocked | No Kornia runtime is run. |
| OpenColorIO runtime | blocked | No color management runtime is run. |
| OpenImageIO runtime | blocked | No image pipeline runtime is run. |
| libass runtime | blocked | No caption burn-in is run. |
| GStreamer private fixture execution | bounded_generated_fixture_qa_accepted_rollup_recorded | `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-ROLLUP-AFTER-GSTREAMER-MKVTOOLNIX-QA-1` records `completed_native_container_rollup_after_gstreamer_mkvtoolnix_qa` and status `qa_passed_controlled_generated_private_fixture_execution_evidence` from #682 merge SHA `d1dfcdbee62971313f6d7b017ed61747ac9d2518`. The rollup accepts PR #673 evidence and PR #680 reconciliation only for the approved network-disabled generated fixture class. This rollup phase did not rerun tools. User/private/real media, broad private folders, render/export, beta, production, private E2E, and product runtime remain blocked. |
| MKVToolNix private fixture execution | bounded_generated_fixture_qa_accepted_rollup_recorded | `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-ROLLUP-AFTER-GSTREAMER-MKVTOOLNIX-QA-1` records `completed_native_container_rollup_after_gstreamer_mkvtoolnix_qa` and status `qa_passed_controlled_generated_private_fixture_execution_evidence` from #682 merge SHA `d1dfcdbee62971313f6d7b017ed61747ac9d2518`. The rollup accepts PR #673 evidence and PR #680 reconciliation only for generated temp SRT to subtitle-only MKV mux/identify evidence. This rollup phase did not regenerate artifacts or rerun tools. User/private/real media, broad private folders, public artifacts, signed URLs, render/export, beta, production, private E2E, and product runtime remain blocked. |
| GPAC/MP4Box install source | blocked_gpac_mp4box_package_source_unavailable | `TRACKA-NATIVE-CONTAINER-INSTALL-PROOF-3-POST-PR697-SOURCE-OF-TRUTH-REVIEW` confirms merged PR #697 supersedes the pushed post-PR690 branch and selects `TRACKA-GPAC-MP4BOX-PACKAGE-SOURCE-RESOLUTION-1` as the next source lane. No Dockerfile package declarations, third-party repositories, package dependencies, or runtime execution are added. |
| VapourSynth install source | blocked_core_vapoursynth_package_source_unavailable | Post-PR697 review preserves the core package-source blocker and keeps plugin policy separately blocked as `blocked_vapoursynth_native_plugin_policy_not_satisfied`; VapourSynth resolution remains a separate lane after or alongside GPAC source review. |
| Revideo install source | evaluation_only_non_core_owner_approval_required_before_install_source | Post-PR697 review preserves Revideo as evaluation-only/non-core and owner-gated before any install-source proof. |
| Hyperframe install source | handoff_only_no_install_source_change | Post-PR697 review preserves Hyperframe as handoff-only with no selected external install target. |
| Remotion runtime | blocked | No preview or final render is run. |
| OpenTimelineIO runtime | blocked | No timeline/interchange validation is run. |
| FFmpeg runtime | blocked | No media processing, encoding, or export hardening is run. |
| FFprobe runtime | blocked | No media probing is run. |
| Full 4K/full-video broad processing | blocked | Requires future explicit approval. |
| Raw prompt execution | blocked | No raw prompts are executed or treated as source-of-truth. |

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
