# Track A Visual Review Reviewer Instructions

Status: `instructions_ready_review_not_completed`

## Before Reviewing

1. Read #390 current-source evidence docs under `docs/track-a/track-a-current-source-*`.
2. Read the artifact index in `docs/track-a/track-a-visual-review-artifact-index.md`.
3. Use only an approved internal private artifact access path if a future human review workflow separately authorizes artifact access.
4. Do not create signed URLs, public artifacts, screenshots, downloads, renders, exports, previews, or derivative media from this packet.

## During Reviewing

- Score every applicable section in `docs/track-a/track-a-visual-review-quality-rubric.md`.
- Fill the schema described in `docs/track-a/track-a-visual-review-pass-fail-schema.md`.
- Mark missing required refs as `blocked_missing_artifact`.
- Mark privacy or security issues as `blocked_privacy_issue`.
- Record follow-ups for any score below threshold.
- Do not treat historical PR mergeability as current runtime approval.

## After Reviewing

- Use `docs/implementation-prompts/prompt-tracka-visual-review-2-record-human-review-outcome.md` to record the review outcome in a later docs-only packet.
- Do not close historical PRs in TRACKA-VISUAL-REVIEW-2 unless a separate owner-approved closure prompt explicitly names targets.
- Keep TRACKA-OLDSTACK-CLOSURE-1 blocked until the outcome and exact closure list exist.
- Keep TRACKA-PRIVATE-E2E-REVALIDATION-1 blocked until review outcome, route/worker gates, and owner approval allow planning.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
