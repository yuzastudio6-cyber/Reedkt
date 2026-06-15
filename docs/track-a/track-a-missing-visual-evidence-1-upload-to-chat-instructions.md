# Track A Missing Visual Evidence 1 Upload-To-Chat Instructions

Status: `not_created`

No local visual bundle was created because private artifact access confirmation is absent.

## Human Action Required

Provide one of the following:

1. Run the local runner later with inline confirmation:

```bash
REEDITPRO_CONFIRM_TRACKA_MISSING_VISUAL_EVIDENCE_BUNDLE=true npm run track-a:missing-visual-evidence-1 -- --execute
```

2. Provide exact review-safe visual artifact refs for the blockers that still need evidence.

3. Upload representative frames/contact sheets/clips directly for review.

## Upload Requirements After A Future Bundle Exists

- upload copied visual files only from the local bundle path.
- include the checksum table from `docs/track-a/track-a-missing-visual-evidence-1-checksums.md`.
- do not upload JSON-only metadata as visual proof.
- do not use signed URLs as source of truth.
- do not treat upload as Track A closure until TRACKA-MISSING-VISUAL-EVIDENCE-2 records a visual review outcome.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/list/read/copy was allowed only for exact or narrowly allowlisted Track A missing-evidence refs from current-source and historical PR evidence.
