# Central Tool Owner Registry

Status: `ownership_claim_scoped_pending_merge_order`

Patch type: Docs/diagnostics-only central tool ownership registry repair for TOOL-OWNER-CONFLICT-SCAN-1.

Base PR: [#544](https://github.com/yuzastudio6-cyber/Reedkt/pull/544)

## Central Registry Path Decision

Keep `docs/tool-ownership/central-tool-owner-registry.json` as the PR #544 Track A registry path.

Cross-reference existing owner sources under `docs/open-source-tool-stack/owner-registry/` and `docs/open-source-tool-stack/ownership/`. Do not move, merge, or replace those registry trees in this PR.

## Purpose

The registry prevents duplicate tool ownership across chats and workstreams. Every owner must check this registry and the open-source tool stack owner sources before claiming, installing, modifying, executing, or expanding a tool.

This repair removes Atlas Track A broad/global claims and records only non-conflicting Track A-scoped ownership plus handoff-only upstream dependencies.

## Registered Owner

ownerDisplayName: Atlas Track A

ownerId: owner_tracka_visual_render_export

workstream: TRACK_A_VISUAL_RENDER_EXPORT

responsibilityType: tracka_scoped_visual_render_export_ownership

currentStatus: ownership_claim_scoped_pending_merge_order

duplicateRisk: resolved_to_scoped_tracka_claims

nextRequiredAction: MERGE-EXECUTION -- TOOL-OWNER-REGISTRY-1 / PR #544

lastUpdatedByBranch: codex/rp-tool-owner-registry-1-atlas-tracka-visual-render-export

## Kept Atlas Track A Claims

| scopedClaimId | classification | boundary |
| --- | --- | --- |
| tracka_caption_burnin_policy_e2e | keep_owned_by_atlas_tracka | Track A caption burn-in policy, source-of-truth, and private E2E review handoff only. |
| tracka_render_export_private_review_path | keep_owned_by_atlas_tracka | Track A private render/export review path, manifest/checksum/QA policy, and blocked final delivery policy only. |
| tracka_visual_video_private_e2e | keep_owned_by_atlas_tracka | Restricted Track A private visual-video E2E review readiness path only. |

## Shared Upstream Dependencies

Atlas Track A does not own these tools globally. It keeps only Track A integration/handoff responsibility.

| sourceTool | scopedClaimId | classification | owner evidence | Atlas boundary |
| --- | --- | --- | --- | --- |
| ffmpeg | tracka_ffmpeg_render_export_handoff_only | shared_upstream_dependency_tracka_integration_only | PR #542 Track B Media OSS Steward | Track A render/export handoff policy only. |
| ffprobe | tracka_ffprobe_export_validation_handoff_only | shared_upstream_dependency_tracka_integration_only | PR #542 Track B Media OSS Steward | Track A export validation handoff policy only. |
| libass | tracka_libass_caption_burnin_handoff_only | shared_upstream_dependency_tracka_integration_only | Track A caption burn-in evidence and open conflict scan | Track A caption burn-in policy handoff only. |
| remotion | tracka_remotion_render_validation_handoff_only | shared_upstream_dependency_tracka_integration_only | Track A render validation evidence and open conflict scan | Track A render validation handoff only. |
| opentimelineio | tracka_opentimelineio_validation_handoff_only | shared_upstream_dependency_tracka_integration_only | Track A timeline validation evidence and open conflict scan | Track A timeline validation handoff only. |

## Dropped Atlas Global Claims

| toolId | classification | source |
| --- | --- | --- |
| ffmpeg | owned_by_other_workstream_drop_from_atlas | PR #542 Track B Media OSS Steward |
| ffprobe | owned_by_other_workstream_drop_from_atlas | PR #542 Track B Media OSS Steward |
| sharp_libvips | owned_by_other_workstream_drop_from_atlas | PR #542 Track B Media OSS Steward |
| opencolorio | owned_by_other_workstream_drop_from_atlas | PR #542 Track B Media OSS Steward |
| openimageio | owned_by_other_workstream_drop_from_atlas | PR #542 Track B Media OSS Steward |
| sam2 | owned_by_other_workstream_drop_from_atlas | PR #543 AI Graphics owner assignment |
| kornia | owned_by_other_workstream_drop_from_atlas | PR #543 AI Graphics owner assignment |
| birefnet | owned_by_other_workstream_drop_from_atlas | PR #543 AI Graphics owner assignment |
| real_esrgan | owned_by_other_workstream_drop_from_atlas | PR #543 AI Graphics owner assignment |
| libass | shared_upstream_dependency_tracka_integration_only | Track A handoff only; no global claim. |
| remotion | shared_upstream_dependency_tracka_integration_only | Track A handoff only; no global claim. |
| opentimelineio | shared_upstream_dependency_tracka_integration_only | Track A handoff only; no global claim. |
| film | unclear_pending_source_review | Dropped from Atlas global claims and deferred pending source review. |

## Conflict Scan Evidence

- #544 Track A visual render owner
- #543 AI Graphics owner assignment
- #542 Track B media OSS steward owner registry
- #534 Open-source tool stack refresh after AI graphics worker
- #536 Open-source tool stack refresh after AI graphics worker QA review
- #529 Open-source tool stack owner-lane reconciliation after Batch 1 rollup
- #533 Open-source tool stack staged owner merge plan after Batch 1 rollup

## Unresolved Conflicts

none

## Blocked Scope

Atlas Track A does not own global media-processing tools, AI graphics model tools, Worker Runtime infrastructure, Supabase schema/RLS/migrations, provider/model execution, billing, signed URLs, public artifacts, final delivery/export, beta unlock, or production unlock.

## Next Prompt

MERGE-EXECUTION -- TOOL-OWNER-REGISTRY-1 / PR #544

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, or broad service-role handler was enabled.
