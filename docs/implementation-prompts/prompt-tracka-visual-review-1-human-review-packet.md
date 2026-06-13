# TRACKA-VISUAL-REVIEW-1 Human Review Packet Prompt

## Goal

Prepare a human visual review packet from TRACKA-CURRENT-SOURCE-1 evidence. Do not execute runtime paths or access artifacts unless a future prompt explicitly provides safe private refs and authorizes metadata-only or review-only access.

## Required Reads

- `docs/track-a/track-a-current-source-visual-video-evidence-packet.md`
- `docs/track-a/track-a-current-source-evidence-matrix.md`
- `docs/track-a/track-a-current-source-artifact-reference-manifest.md`
- `docs/track-a/track-a-current-source-tool-readiness-map.md`
- `docs/track-a/track-a-current-source-visual-review-packet-plan.md`
- `docs/track-a/track-a-current-source-old-pr-supersession-plan.md`

## Allowed Scope

- Build a review checklist.
- Identify which capabilities need human visual review.
- Identify missing safe private artifact references.
- Produce review-only docs and diagnostics.
- Recommend exact old PRs for later owner-approved closure only after review.

## Blocked Scope

- No old PR merge, close, retarget, or comment.
- No artifact access, storage transfer, signed URL creation, public artifact creation, render/export, media processing, tool execution, worker execution, provider/model call, Supabase mutation, SQL, migration, beta, production, or raw prompt execution.

## Expected Output

- Visual review checklist
- Capability-to-review packet map
- Missing artifact reference register
- Old PR closure recommendation draft
- Updated readiness decision for TRACKA-OLDSTACK-CLOSURE-1

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
