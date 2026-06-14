# WORKER-11 Allowed And Blocked Scope

nextPrompt: `WORKER-11 - Controlled Job Claim/Lease No-Op QA Review`

## Allowed

- Review committed WORKER-10 controlled job claim/lease no-op evidence.
- Review the seven fixture rows and sanitized evidence summaries.
- Confirm local evidence references remain relative ignored paths only.
- Prepare readiness for the next worker gate if QA passes.
- Keep Supabase and production status docs-only.

## Blocked

- Live worker execution.
- Real job claim.
- Real lease mutation.
- Queue execution.
- Route execution.
- Tool execution.
- Provider/model runtime.
- Route handler import, tool runtime import, or worker runtime import.
- Supabase mutation, SQL execution, GCS/storage upload, signed URL creation, or public artifact creation.
- Raw prompt execution, final render/export, internal beta, external beta, paid production, or production.

## Approval Booleans

liveWorkerExecutionApprovedNow: `false`
realJobClaimApprovedNow: `false`
workerJobClaimApprovedNow: `false`
realLeaseMutationApprovedNow: `false`
workerLeaseMutationApprovedNow: `false`
queueExecutionApprovedNow: `false`
routeExecutionApprovedNow: `false`
toolExecutionApprovedNow: `false`
providerRuntimeApprovedNow: `false`
mediaRuntimeApprovedNow: `false`
audioRuntimeApprovedNow: `false`
supabaseMutationApprovedNow: `false`
publicArtifactsApproved: `false`
signedUrlsApproved: `false`
rawPromptExecutionApproved: `false`
internalBetaApproved: `false`
externalBetaApproved: `false`
productionApproved: `false`
