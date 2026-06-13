# TRACKA-VISUAL-REVIEW-2 Record Human Review Outcome Prompt

## Goal

Record the human review outcome for Track A current-source visual/video evidence using the TRACKA-VISUAL-REVIEW-1 packet.

## Required Reads

- `docs/track-a/track-a-visual-review-human-review-packet.md`
- `docs/track-a/track-a-visual-review-artifact-index.md`
- `docs/track-a/track-a-visual-review-quality-rubric.md`
- `docs/track-a/track-a-visual-review-pass-fail-schema.md`
- `docs/track-a/track-a-visual-review-privacy-security-checklist.md`
- `docs/track-a/track-a-visual-review-reviewer-instructions.md`
- `docs/track-a/track-a-visual-review-gap-and-blocker-map.md`
- `docs/track-a/track-a-current-source-visual-video-evidence-packet.md`

## Allowed Scope

- Record the human review outcome as docs/status evidence.
- Record pass, pass-with-warnings, fail, missing-artifact blocker, or privacy blocker per capability.
- Record required follow-ups and owner routes.
- Record whether later old-stack closure planning or private E2E revalidation planning is recommended.

## Blocked Scope

- Do not access artifacts unless a separate future prompt explicitly authorizes the approved internal private access path.
- Do not create signed URLs or public artifacts.
- Do not merge, close, retarget, or comment on PRs.
- Do not execute Track A runtime, FFmpeg, FFprobe, Remotion, libass, OTIO, OpenColorIO, OpenImageIO, Kornia, BiRefNet, SAM2, Real-ESRGAN, FILM, workers, tools, providers, routes, media processing, Supabase, SQL, beta, production, or final render/export.

## Required Outcome Fields

- reviewId
- reviewer
- reviewedAt
- sourceEvidencePacket
- artifactReviews[]
- capabilityReviews[]
- overallDecision
- requiredFollowUps[]
- approvedNextPhase
- explicitNonApprovals

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
