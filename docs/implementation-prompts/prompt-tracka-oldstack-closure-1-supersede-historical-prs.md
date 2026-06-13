# TRACKA-OLDSTACK-CLOSURE-1 Supersede Historical PRs Prompt

## Goal

Perform a later owner-approved old-stack closure pass only after TRACKA-VISUAL-REVIEW-1 identifies exact PR targets. This prompt is a draft contract, not authorization to mutate GitHub.

## Required Preconditions

- TRACKA-CURRENT-SOURCE-1 is merged.
- TRACKA-VISUAL-REVIEW-1 is complete.
- Owner approval names exact PR numbers and actions.
- The action list distinguishes close-as-superseded, keep-as-historical, do-not-close, and human-review-needed.

## Allowed Scope In A Future Explicit Run

- Re-query named PRs.
- Verify state, base, package-lock status, blocker language, and current-source replacement evidence.
- Close or comment on only explicitly named PRs if the future prompt authorizes that exact GitHub mutation.

## Blocked Scope

- No blanket closure.
- No retargeting or merge unless explicitly named in a future prompt.
- No runtime/tool/worker/provider/route execution.
- No Track A render/export, media processing, artifact access, GCS upload, signed URL creation, public artifact creation, Supabase mutation, SQL, migration, beta, production, or dependency mutation.

## Default Current Decision

TRACKA-OLDSTACK-CLOSURE-1 readiness: `blocked_pending_visual_review_and_owner_approved_pr_closure_targets`

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
