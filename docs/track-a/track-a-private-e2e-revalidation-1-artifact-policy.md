# TRACKA-PRIVATE-E2E-REVALIDATION-1 Artifact Policy

## Policy Status

artifactPolicyStatus: `private_review_metadata_only_planning`

privateLocalOrGcsReviewArtifactsOnly: true

manifestRequired: true

checksumRequired: true

qaReportRequired: true

approvedPlanSnapshotRequiredIfFutureWorkerOrToolExecutionIsUsed: true

publicArtifactsBlocked: true

signedUrlSourceOfTruthBlocked: true

finalDeliveryBlocked: true

productionExternalBetaArtifactsBlocked: true

## Source-Of-Truth Rules

Private artifact source-of-truth must be manifest records, private refs, checksums, and QA reports. Signed URLs are not source-of-truth. Temporary delivery links, if ever approved in a later milestone, must be delivery-only and cannot replace manifest/checksum evidence.

The private review bundle for future execution must include:

- private artifact manifest.
- SHA-256 checksum list.
- QA report.
- FFprobe validation evidence when future guarded execution runs.
- caption policy evidence from #492.
- source ref evidence from #452.
- runtime path evidence from #463.
- visual review evidence from #434, #475, #488, and #492.
- explicit blocked status for public artifacts, signed URLs, final delivery, internal beta unlock, external beta, paid production, and production.

## Retention And Privacy Notes

Private review artifacts may contain source media, captions, QA details, and review-only previews. Future execution must keep them private by default and must record cleanup/retention expectations before any worker/tool execution. This packet does not create, upload, download, inspect, sign, delete, or move any artifact.

## Blocked Claims

public artifact: `blocked`

signed URL source-of-truth: `blocked`

final delivery: `blocked`

internal beta unlock: `blocked`

external beta: `blocked`

production: `blocked`

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
