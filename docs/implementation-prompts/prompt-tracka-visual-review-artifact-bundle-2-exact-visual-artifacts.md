# TRACKA-VISUAL-REVIEW-ARTIFACT-BUNDLE-2 Exact Visual Artifacts Or Representative Frame Bundle

## Goal

Collect exact review-safe visual artifacts for Track A visual review after TRACKA-VISUAL-REVIEW-2B recorded `metadata_only` and `blocked_missing_visual_artifacts`.

## Required Inputs

- #393 visual review rubric and pass/fail schema
- #403 metadata bundle checksums
- TRACKA-VISUAL-REVIEW-2B metadata-only outcome
- representative frames/videos/contact sheets uploaded directly, or exact private object refs for review-safe visual artifacts

## Allowed Scope

- classify uploaded visual artifacts
- verify filenames/checksums when supplied
- prepare upload-to-review instructions
- record missing capability coverage

## Blocked Scope

- no broad GCS access
- no signed URL source-of-truth
- no public artifacts
- no Track A runtime execution
- no FFmpeg/FFprobe, Remotion, libass, OTIO, OpenColorIO, OpenImageIO, Kornia, BiRefNet, SAM2, Real-ESRGAN, or FILM execution
- no frame extraction or contact sheet generation
- no Supabase mutation or SQL
- no beta, production, final delivery, or broad media unlock

## Completion Criteria

Return a bundle or upload manifest that lets a later visual outcome phase inspect actual visual evidence. JSON metadata alone is not enough.

## Implementation Notes

- Use branch `codex/rp-tracka-visual-review-artifact-bundle-2-exact-visual-artifacts`.
- Use base `51cd4849c2dc31d4b59d7b673e27437493d0fcac`, which includes #408.
- Run the local runner with `npm run track-a:visual-review-artifact-bundle-2`.
- Run confirmed bounded execution only with `REEDITPRO_CONFIRM_TRACKA_EXACT_VISUAL_ARTIFACT_BUNDLE=true npm run track-a:visual-review-artifact-bundle-2 -- --execute`.
- If confirmation is absent, record `blocked_pending_exact_visual_artifact_access_confirmation` and do not call `gcloud`.
- If no visual files are copied, keep TRACKA-VISUAL-REVIEW-2C blocked and request exact visual refs or direct representative uploads.

## TRACKA-VISUAL-REVIEW-2C Handoff

Use `docs/implementation-prompts/prompt-tracka-visual-review-2c-record-visual-artifact-review-outcome.md` only after actual visual files are available. Metadata-only JSON files from #403 are supporting integrity evidence, not visual proof.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/list/read/copy was allowed only for exact or narrowly allowlisted Track A visual review artifact refs from current-source and historical PR evidence.
