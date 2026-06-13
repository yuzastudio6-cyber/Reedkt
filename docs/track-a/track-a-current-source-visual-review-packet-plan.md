# Track A Current-Source Visual Review Packet Plan

Status: `future_human_review_plan_only`

TRACKA-VISUAL-REVIEW-1 should prepare a human review packet from current-source evidence and safe private refs only. TRACKA-CURRENT-SOURCE-1 does not access artifacts or produce review media.

## Review Goals

- Confirm whether historical visual/video evidence is still useful after the current model/plan/worker/tool-route chain.
- Identify old PRs that can be closed later as superseded.
- Identify old PRs that need replacement by fresh current-source evidence.
- Identify any capability that needs a new generated/local fixture contract before runtime consideration.

## Review Inputs

| Input | Source | Use |
| --- | --- | --- |
| Evidence matrix | `docs/track-a/track-a-current-source-evidence-matrix.md` | capability-level source map |
| Artifact reference manifest | `docs/track-a/track-a-current-source-artifact-reference-manifest.md` | safe ref availability check |
| Tool readiness map | `docs/track-a/track-a-current-source-tool-readiness-map.md` | current review-only tool status |
| Old PR supersession plan | `docs/track-a/track-a-current-source-old-pr-supersession-plan.md` | closure target candidates |
| TRACKA-RECON-0 | PR #383 | existing reconciliation source |

## Review Criteria

- Source is private and structured.
- Artifact reference is recorded in current-source docs or PR body before any future artifact access.
- No signed URL is treated as source-of-truth.
- No raw media, raw prompt, raw provider response, or public artifact is source-of-truth.
- Visual outputs, when available in a future review, are assessed for identity preservation, mask quality, enhancement artifacts, color stability, caption readability, timing, export integrity, and professional Track A standards.
- A pass does not approve runtime, workers, tools, public delivery, internal beta, external beta, production, or final export.

## Future Output Fields

- capabilityId
- sourcePrs
- safeArtifactRefStatus
- visualReviewStatus
- reviewerNotes
- privacyStatus
- qaStatus
- supersessionRecommendation
- currentSourceReplacementNeeded
- runtimeApprovalStatus

## Readiness

TRACKA-VISUAL-REVIEW-1 readiness: `ready_for_TRACKA_VISUAL_REVIEW_1_human_review_packet`

TRACKA-OLDSTACK-CLOSURE-1 readiness: `blocked_pending_visual_review_and_owner_approved_pr_closure_targets`

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
