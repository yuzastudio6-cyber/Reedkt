# Track A Current-Source Old PR Supersession Plan

Status: `future_owner_closure_plan_only`

This plan classifies old Track A PRs for a later owner-approved closure pass. TRACKA-CURRENT-SOURCE-1 does not close, merge, retarget, comment on, or edit any PR.

## Classification Register

| PR | Current State | Classification | Reason | Future Action |
| --- | --- | --- | --- | --- |
| #18 | open, non-draft, mergeable | `keep_as_historical_evidence` | early private export evidence on old base | keep unless owner explicitly requests old-stack merge |
| #19 | open, non-draft, mergeable | `keep_as_historical_evidence` | render IAM retry/private export context | keep unless owner explicitly requests old-stack merge |
| #21 | open, non-draft, mergeable | `keep_as_historical_evidence` | early color correction context | keep unless owner explicitly requests old-stack merge |
| #22 | open, non-draft, mergeable | `close_later_as_superseded` | BiRefNet approval prerequisite should be superseded by current-source evidence if owner agrees | close only after TRACKA-VISUAL-REVIEW-1 and owner approval |
| #23 | open, non-draft, mergeable | `close_later_as_superseded` | BiRefNet download prerequisite is old-stack runtime evidence | close only after owner approval |
| #24 | open, non-draft, mergeable | `close_later_as_superseded` | BiRefNet runtime verification is old-stack runtime evidence | close only after owner approval |
| #25 | open, non-draft, mergeable | `needs_human_visual_review_before_closure` | real video BiRefNet sample may contain useful review evidence | review before closure |
| #26 | open, non-draft, mergeable | `needs_human_visual_review_before_closure` | text-behind-subject preview may contain useful review evidence | review before closure |
| #27 | open, non-draft, mergeable | `close_later_as_superseded` | Real-ESRGAN approval prerequisite is old-stack evidence | close only after owner approval |
| #28 | open, non-draft, mergeable | `close_later_as_superseded` | Real-ESRGAN download prerequisite is old-stack evidence | close only after owner approval |
| #29 | open, non-draft, mergeable | `close_later_as_superseded` | Real-ESRGAN runtime verification is old-stack evidence | close only after owner approval |
| #30 | open, non-draft, mergeable | `needs_human_visual_review_before_closure` | real video enhancement sample may contain useful review evidence | review before closure |
| #31 | closed, not merged | `close_later_as_superseded` | already closed and superseded by #34 | no action in this phase |
| #34 | open, non-draft, mergeable | `close_later_as_superseded` | Real-ESRGAN policy decision should be superseded by current-source evidence if owner agrees | close only after owner approval |
| #35 | open, non-draft, mergeable | `close_later_as_superseded` | SAM2 approval prerequisite is old-stack evidence | close only after owner approval |
| #42 | open, non-draft, mergeable | `needs_human_visual_review_before_closure` | segment text-behind-subject preview may contain useful review evidence | review before closure |
| #43 | open, non-draft, mergeable | `needs_human_visual_review_before_closure` | SAM2 private feature E2E may contain useful review evidence | review before closure |
| #54 | open, non-draft, mergeable | `close_later_as_superseded` | FILM approval workflow is old-stack evidence | close only after owner approval |
| #55 | open, non-draft, mergeable | `close_later_as_superseded` | FILM download workflow is old-stack evidence | close only after owner approval |
| #58 | open, non-draft, mergeable | `close_later_as_superseded` | FILM runtime verification is old-stack evidence | close only after owner approval |
| #60 | open, non-draft, mergeable | `needs_human_visual_review_before_closure` | real video FILM sample may contain useful review evidence | review before closure |
| #63 | open, non-draft, mergeable | `close_later_as_superseded` | pro color approval workflow is old-stack evidence | close only after owner approval |
| #65 | open, non-draft, mergeable | `close_later_as_superseded` | generated fixture runtime belongs to old stack | close only after owner approval |
| #67 | open, non-draft, mergeable | `needs_human_visual_review_before_closure` | real video pro color sample may contain useful review evidence | review before closure |
| #68 | open, non-draft, mergeable | `needs_human_visual_review_before_closure` | pro color private E2E may contain useful review evidence | review before closure |
| #73 | open, non-draft, mergeable | `close_later_as_superseded` | libass validation should be replaced by route contract tests | close only after owner approval |
| #75 | open, non-draft, mergeable | `close_later_as_superseded` | Track A owner contract #364 is current source; render validation remains old-stack | close only after owner approval |
| #77 | open, non-draft, mergeable | `close_later_as_superseded` | OpenTimelineIO validation should be replaced by current route tests | close only after owner approval |
| #80 | open, non-draft, mergeable | `needs_human_visual_review_before_closure` | FFmpeg/FFprobe hardening may contain useful final-export evidence | review before closure |
| #82 | open, non-draft, mergeable | `needs_human_visual_review_before_closure` | full visual-video private E2E requires owner review | review before closure |
| #83 | open, non-draft, mergeable | `close_later_as_superseded` | readiness closure is old-stack and depends on #82 decision | close only after owner approval |
| #99 | open, non-draft, mergeable | `keep_as_historical_evidence` | foundation worker-runtime checks are parallel context | keep unless owner expands scope |
| #364 | merged | `do_not_close` | current Track A owner study source-of-truth | no action |
| #383 | merged | `do_not_close` | current Track A reconciliation source-of-truth | no action |

## Closure Gate

TRACKA-OLDSTACK-CLOSURE-1 remains `blocked_pending_visual_review_and_owner_approved_pr_closure_targets`. A later closure pass must name exact PRs and actions before any GitHub mutation.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
