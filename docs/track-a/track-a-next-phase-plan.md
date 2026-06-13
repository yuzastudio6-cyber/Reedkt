# Track A Next Phase Plan

Status: `ready_for_tracka_merge_1_review`

## Next Phase

`TRACKA-MERGE-1`: human-approved Track A visual/video stack merge/close/retarget review.

## TRACKA-MERGE-1 Inputs

- TRACKA-RECON-0 docs and diagnostics.
- GitHub PR metadata for #18-#31, #34, #35, #42, #43, #54, #55, #58, #60, #63, #65, #67, #68, #73, #75, #77, #80, #82, #83, #99, and #364.
- Current integration branch containing #380.
- Existing Track A TOOL-STUDY-0 contract from #364.
- TOOL-ROUTE-1 and TOOL-ROUTE-2 route/fixture planning evidence.

## TRACKA-MERGE-1 Allowed Actions

- Inspect PR metadata.
- Reconfirm validation evidence.
- Reconfirm package-lock status.
- Reconfirm no runtime, Supabase, public artifact, signed URL, beta, or production unlock claims.
- Retarget only PRs explicitly approved by the user.
- Merge only ready/mergeable Track A PRs in the owner-approved order.
- Close only PRs explicitly identified as superseded or rejected by the owner.
- Produce a final merge report.

## TRACKA-MERGE-1 Blocked Actions

- Runtime execution.
- Tool execution.
- Worker execution.
- Provider/model calls.
- Media processing.
- Final render/export.
- Supabase mutation, SQL, migrations, schema/RLS changes.
- GCS upload or storage transfer.
- Signed URL creation.
- Public artifact creation.
- Internal beta, external beta, production, or paid production unlock.

## Later Phases

1. `TOOL-ROUTE-3`: generated/local fixture contract tests.
2. `TRACKA-FIXTURE-1`: Track A generated/local fixture contract tests for visual-video stack manifests.
3. `TRACKA-PRIVATE-E2E-1`: controlled private visual-video E2E replay/validation, only after explicit approval.
4. `TRACKA-READINESS-1`: internal private readiness review, not beta/production.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
