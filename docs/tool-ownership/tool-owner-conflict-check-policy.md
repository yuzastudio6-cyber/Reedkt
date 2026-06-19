# Tool Owner Conflict Check Policy

Status: `completed_for_pr_544_scoped_claims`

## Policy Result

TOOL-OWNER-CONFLICT-SCAN-1 completed the first Atlas Track A conflict repair for PR #544.

Atlas Track A must not claim broad/global tools already assigned to another owner. Atlas Track A may keep only Track A-specific policy, review, validation handoff, and private E2E responsibilities that do not duplicate another owner.

## Conflict Classifications

Every candidate tool must be recorded with one of these values:

- keep_owned_by_atlas_tracka
- shared_upstream_dependency_tracka_integration_only
- owned_by_other_workstream_drop_from_atlas
- conflict_needs_human_decision
- unclear_pending_source_review

## Current PR #544 Decision

currentStatus: ownership_claim_scoped_pending_merge_order

Unresolved conflicts: none

Kept claims:

- tracka_caption_burnin_policy_e2e
- tracka_render_export_private_review_path
- tracka_visual_video_private_e2e

Handoff-only shared upstream dependencies:

- tracka_ffmpeg_render_export_handoff_only
- tracka_ffprobe_export_validation_handoff_only
- tracka_libass_caption_burnin_handoff_only
- tracka_remotion_render_validation_handoff_only
- tracka_opentimelineio_validation_handoff_only

Dropped global claims:

- ffmpeg
- ffprobe
- libass
- remotion
- opentimelineio
- sharp_libvips
- opencolorio
- openimageio
- sam2
- kornia
- birefnet
- real_esrgan
- film

## Evidence Sources

- #544 Track A visual render owner
- #543 AI Graphics owner assignment
- #542 Track B media OSS steward owner registry
- #534 Open-source tool stack refresh after AI graphics worker
- #536 Open-source tool stack refresh after AI graphics worker QA review
- #529 Open-source tool stack owner-lane reconciliation after Batch 1 rollup
- #533 Open-source tool stack staged owner merge plan after Batch 1 rollup

## Future Owner Process

Before Atlas Track A installs, modifies, executes, or expands a scoped claim, it must:

1. read `docs/tool-ownership/central-tool-owner-registry.json`
2. read active owner sources under `docs/open-source-tool-stack/owner-registry/` and `docs/open-source-tool-stack/ownership/`
3. check open and merged PRs for owner conflicts
4. preserve other workstreams' global ownership
5. record only Track A-specific handoff responsibilities
6. keep tool installation, execution, media processing, Supabase, SQL, dependencies, final delivery, beta, and production blocked unless a later approved packet explicitly unlocks that scope

## Next Prompt

MERGE-EXECUTION -- TOOL-OWNER-REGISTRY-1 / PR #544

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, or broad service-role handler was enabled.
