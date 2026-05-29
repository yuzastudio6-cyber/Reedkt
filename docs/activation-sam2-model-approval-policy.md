# Phase 35A SAM2 Model Approval Policy

SAM2 remains evaluated-only after Phase 35A. The workflow may recommend SAM2
for future controlled staging review, but it does not approve any execution.

## Approval State

- `approvalDecision=pending_human_review`
- `sam2PlanningRecommendationAllowed=true`
- `sam2DownloadAllowed=false`
- `sam2RuntimeAllowed=false`
- `sam2TemporalTrackingAllowed=false`
- `sam2FullVideoMaskAllowed=false`
- `fullVideoTextBehindSubjectAllowed=false`
- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `broadRealUserMediaAllowed=false`
- `providerAllowed=false`
- `revideoAllowed=false`

## Human Review Requirements

Before Phase 35B can proceed, a human must approve:

- exact SAM2 checkpoint source and revision
- license and provenance review
- checkpoint commercial-use and redistribution posture
- private model storage path
- checksum plan
- runtime constraint that execution uses private model storage only

No model approval is final until this evidence is recorded in the repo.

## Execution Boundary

Frontend code must never run SAM2, providers, worker jobs, render jobs, service
role actions, or media processing. Future workers may execute only approved
structured plan snapshots and never raw chat.
