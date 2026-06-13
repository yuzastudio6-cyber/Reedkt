# Track A Superseded PR Register

Status: `docs_only_review_register`

This register identifies PRs that should not remain indefinite milestone candidates once a later owner-approved merge pass starts. TRACKA-RECON-0 does not close any PR.

## Superseded Or Duplicate Candidates

| PR | State | Superseded By | Reason | TRACKA-MERGE-1 Recommendation |
| --- | --- | --- | --- | --- |
| #31 | closed, not merged | #34 | #31 was a FILM slow-motion review gate under the older Real-ESRGAN/FILM transition. #34 is the preferred Phase 34E Real-ESRGAN policy decision candidate requested by the Track A reconciliation plan. | leave closed; record as superseded |

## Historical Or Parallel Candidates Requiring Owner Review

| PR Range | Classification | Reason |
| --- | --- | --- |
| #18, #19, #21 | historical_not_required_for_current_merge | Early private export/color correction evidence is old-stack evidence and is not a direct current-source merge candidate. |
| #22-#30, #35, #42, #43, #54, #55, #58, #60, #63, #65, #67, #68, #73, #75, #77, #80, #82, #83 | needs_retarget_or_visual_review | These PRs are open and mostly mergeable, but their bases are old phase branches. TRACKA-MERGE-1 must decide whether to retarget/merge, close as superseded, or replace with a fresh current-source evidence packet. |
| #99 | historical_parallel_review | Foundation worker-runtime checks are relevant context but not owned by Track A reconciliation. |

## Closure Rule For TRACKA-MERGE-1

Only close a PR when the human-approved merge pass explicitly names it as superseded, rejected, or historical-not-required. Otherwise leave it open and report the blocker or owner decision required.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
