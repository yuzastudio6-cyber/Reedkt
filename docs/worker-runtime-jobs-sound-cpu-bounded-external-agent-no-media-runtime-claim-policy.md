# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Runtime Claim Policy

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-runtime-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-runtime-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_plan_completed_with_warnings_ready_for_surface_proof",
  "allowedClaims": {
    "boundedExternalAgentNoMediaSurfacePlanned": true,
    "validCredentiallessExternalAgentNoMediaEnvelopeAcceptedBySource": true,
    "acceptedSoundCpuToolCount": 15,
    "surfaceProofMayProceed": true
  },
  "blockedClaims": {
    "realExternalAgentCredentialsReady": false,
    "realExternalAgentRuntimeExecutionReady": false,
    "realUserMediaReady": false,
    "workerDispatchReady": false,
    "routeExecutionReady": false,
    "mediaProcessingReady": false,
    "supabaseReady": false,
    "sqlReady": false,
    "artifactWriteReady": false,
    "externalBetaRuntimeReady": false,
    "generated_local_fixture_passed": false,
    "dry_run_passed": false,
    "paidProductionReady": false
  },
  "runtimeActions": {
    "realExternalAgentCredentialProvisioning": false,
    "realUserMediaRead": false,
    "mediaProcessing": false,
    "workerExecution": false,
    "routeExecution": false,
    "artifactCreation": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "storageTransfer": false,
    "signedUrlCreation": false,
    "publicArtifactCreation": false,
    "providerModelCall": false,
    "dockerGcpAction": false,
    "betaUnlock": false,
    "productionUnlock": false
  },
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled. The bounded external-agent no-media execution surface is credentialless, stdout JSON only, and does not read real-user media."
}
```

This claim policy allows the bounded no-media surface plan and blocks all runtime, media, persistence, beta, and production readiness claims.
