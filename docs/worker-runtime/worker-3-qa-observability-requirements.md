# WORKER-3 QA And Observability Requirements

Requirement state: `ready_with_warnings_for_worker_4`

Future WORKER-4 must produce local/offline evidence for:

- worker fixture validation;
- synthetic worker job payload validation;
- no worker runtime import proof;
- no job claim proof;
- no lease mutation proof;
- no queue execution proof;
- no route or tool runtime proof;
- no provider runtime proof;
- no Supabase mutation proof;
- log redaction and safe summary evidence;
- correlation ID and idempotency-key placeholder evidence;
- warning/blocker evidence;
- cleanup evidence.

Future evidence must use ignored local paths only and must not include raw prompts, private URLs, signed URLs, secret payloads, provider responses, real GCS paths, public artifact links, Supabase mutations, SQL output, route handler imports, tool runtime imports, worker runtime imports, or media/audio processing outputs.

All future WORKER-4 QA must keep liveWorkerExecutionApprovedNow, workerJobClaimApprovedNow, workerLeaseMutationApprovedNow, queueExecutionApprovedNow, routeExecutionApprovedNow, toolExecutionApprovedNow, providerRuntimeApprovedNow, mediaRuntimeApprovedNow, audioRuntimeApprovedNow, supabaseMutationApprovedNow, publicArtifactsApproved, signedUrlsApproved, rawPromptExecutionApproved, internalBetaApproved, externalBetaApproved, and productionApproved as `false`.
