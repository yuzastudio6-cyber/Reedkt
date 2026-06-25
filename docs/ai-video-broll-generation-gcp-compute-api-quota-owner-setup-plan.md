# AI Video B-roll Generation GCP Compute API And L4 Quota Owner Setup Plan

Decision: `ai_video_broll_gen_9d_gcp_compute_api_quota_owner_setup_plan_completed_ready_for_owner_approval`

AI-VIDEO-BROLL-GEN-9D defines the owner-reviewed setup path needed before a future no-mutation retry can verify NVIDIA L4 availability and quota for the private Wan 1.3B synthetic proof. This gate does not enable the Compute Engine API, create or mutate Google Cloud resources, request quota, start Docker, run Cloud Run, run GKE, install dependencies, download weights, instantiate a pipeline, run inference, create frames, create video, run FFmpeg, mutate Supabase, execute SQL, call providers, dispatch workers, upload storage, create signed URLs, create public artifacts, mutate credits, unlock beta, unlock production, claim runtime readiness, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- `docs/ai-video-broll-generation-gcp-l4-prerequisite-verification-report.md`
- `docs/ai-video-broll-generation-gcp-l4-private-synthetic-proof-plan.md`
- `docs/ai-video-broll-generation-gcp-l4-cost-quota-preflight-plan.md`
- `docs/ai-video-broll-generation-gcp-l4-private-cache-transfer-policy.md`
- `docs/ai-video-broll-generation-runtime-memory-owner-review.md`
- `docs/activation-gcp-staging-command-policy.md`
- `docs/activation-gcp-staging-resource-map.md`
- Google Cloud Service Usage enable/disable docs: `https://cloud.google.com/service-usage/docs/enable-disable`
- Google Cloud quota management docs: `https://cloud.google.com/docs/quotas/view-manage`
- Google Cloud Compute Engine quota docs: `https://cloud.google.com/compute/quotas-limits`

## Gate 9C Blocker

Gate 9C verified that `gcloud` is installed, an active account is present, and the active project is `reeditpro`. The read-only Compute Engine checks stopped because `compute.googleapis.com` is disabled for that project. This prevents reliable L4 accelerator visibility, region availability, quota inspection, and exact Compute G2/L4 cost verification.

## Owner Setup Decision

The GCP/platform owner may plan a future Compute Engine API and L4 quota setup path for a non-production proof target. The setup path is not authorized for execution by this gate. API enablement is a mutating cloud action and must be approved separately with a human-visible command plan before any later prompt runs it.

The default project decision remains pending:

- If `reeditpro` is accepted as the non-production proof project, the owner must explicitly document that it is not production/staging customer-data execution and that no user media is in scope.
- If a separate proof project is required, the owner must create a separate project plan before any API enablement or quota request.

## Required Owner Acceptance

Before any future setup or verification retry, the GCP/platform owner must accept:

1. The intended project identity and proof-only scope.
2. Compute Engine API enablement plan, including required IAM and audit trail.
3. L4 quota-readiness plan for `us-central1`, `us-east4`, and `us-west1`.
4. Budget guard for the first private proof, with a fresh pricing check.
5. No-public-endpoint policy.
6. Private model-cache transfer policy.
7. Cleanup evidence requirements.
8. Explicit no-user-media and no-provider-fallback constraints.

Official Google Cloud Service Usage docs state that enabling APIs requires the Service Usage Admin role. Official quota docs describe quota viewing and management through Cloud Console, Cloud Quotas API, and gcloud. This repository gate records those as future owner responsibilities only.

## L4 Quota Readiness Plan

Future owner-approved setup must make it possible to inspect:

- `nvidia-l4` accelerator availability in `us-central1`, `us-east4`, and `us-west1`;
- regional or zonal GPU quota names exposed by the active project after Compute Engine API enablement;
- whether one L4 can be allocated for a private proof without reservations or long-running commitments;
- whether the future proof can stay under the USD 2.00 placeholder cap after current pricing is recalculated;
- whether Spot/preemptible options are acceptable for a one-off proof, while preserving cleanup and failure reporting.

No quota increase request is created by this gate.

## Cost And Budget Guard

The cost guard remains planning-only:

- first proof runtime cap: 60 minutes;
- planning placeholder cap: USD 2.00;
- fresh official pricing required before execution;
- no credit estimate, approval, reservation, spend, refund, or release;
- no paid production or beta unlock.

Cloud Run L4 pricing is useful context but not a Compute G2 proof quote. The next verification retry must inspect the exact selected runtime price before any later execution plan.

## Public Endpoint And Data Boundary

The future proof must remain private:

- no public endpoint;
- no public bucket;
- no signed URL source of truth;
- no production or staging customer data;
- no user media;
- no generated asset row;
- no public artifact;
- no final render/export.

## Future Allowed Setup Categories

Only a future owner-approved setup prompt may allow:

- Compute Engine API enablement for the accepted proof project;
- read-only verification that the API is enabled;
- read-only L4 quota and region checks;
- optional quota request planning if quota is insufficient.

The future setup prompt must still forbid inference, resource creation beyond the explicitly approved API/quota setup action, public endpoints, worker dispatch, Supabase mutation, storage upload, signed URLs, and credit mutation.

```json ai-video-broll-gen-9d-gcp-compute-api-quota-owner-setup-plan
{
  "phase": "AI-VIDEO-BROLL-GEN-9D",
  "decision": "ai_video_broll_gen_9d_gcp_compute_api_quota_owner_setup_plan_completed_ready_for_owner_approval",
  "sourceBranch": "codex/ai-video-broll-gen-9c-gcp-l4-prerequisite-verification",
  "sourceCommit": "a2ce3b6c",
  "sourcePullRequests": {
    "pr786": "AI-VIDEO-BROLL-GEN-0 owner/model selection plan",
    "pr797": "AI-VIDEO-BROLL-GEN-1 license/provenance approval",
    "pr799": "AI-VIDEO-BROLL-GEN-2 weight source/checksum plan",
    "pr801": "AI-VIDEO-BROLL-GEN-3 dependency install plan",
    "pr804": "AI-VIDEO-BROLL-GEN-4 runtime/GPU owner review",
    "pr806": "AI-VIDEO-BROLL-GEN-5 controlled dependency install proof",
    "pr815": "AI-VIDEO-BROLL-GEN-6 controlled model weight download proof",
    "pr820": "AI-VIDEO-BROLL-GEN-7 model loader import proof",
    "pr823": "AI-VIDEO-BROLL-GEN-8 controlled synthetic generation plan",
    "pr826": "AI-VIDEO-BROLL-GEN-9 controlled synthetic proof result",
    "pr832": "AI-VIDEO-BROLL-GEN-9A runtime memory owner review",
    "pr836": "AI-VIDEO-BROLL-GEN-9B GCP L4 private proof plan",
    "pr841": "AI-VIDEO-BROLL-GEN-9C GCP L4 prerequisite verification"
  },
  "blockedPrerequisite": {
    "projectId": "reeditpro",
    "computeEngineApiStatus": "service_disabled",
    "l4RegionAvailabilityVerified": false,
    "l4QuotaVerified": false,
    "exactComputeG2L4ProofCostVerified": false
  },
  "ownerSetupPlan": {
    "workstreamOwner": "GCP_CLOUD_RUNTIME",
    "requestingWorkstream": "AI_VIDEO_BROLL_GENERATION",
    "setupMode": "owner_setup_plan_only",
    "computeApiEnablementApprovedNow": false,
    "quotaRequestApprovedNow": false,
    "resourceCreationApprovedNow": false,
    "proofExecutionApprovedNow": false,
    "requiresHumanReviewedCommandPlan": true
  },
  "projectDecision": {
    "observedActiveProject": "reeditpro",
    "acceptedAsNonProductionProofProject": "pending_owner_decision",
    "separateProofProjectRequired": "pending_owner_decision",
    "productionOrCustomerDataAllowed": false,
    "userMediaAllowed": false
  },
  "requiredOwnerAcceptance": [
    "project_identity_and_scope",
    "compute_engine_api_enablement_plan",
    "l4_quota_readiness_plan",
    "budget_guard",
    "no_public_endpoint_policy",
    "private_cache_transfer_policy",
    "cleanup_evidence",
    "no_user_media_no_provider_fallback"
  ],
  "candidateRegions": [
    {
      "region": "us-central1",
      "status": "requires_compute_api_enabled_then_l4_quota_check"
    },
    {
      "region": "us-east4",
      "status": "requires_compute_api_enabled_then_l4_quota_check"
    },
    {
      "region": "us-west1",
      "status": "requires_compute_api_enabled_then_l4_quota_check"
    }
  ],
  "costGuard": {
    "maxFirstProofRuntimeMinutes": 60,
    "maxFirstProofCostUsdPlaceholder": 2,
    "freshOfficialPricingRequiredBeforeExecution": true,
    "creditMutationAllowed": false,
    "billingApprovalCreated": false
  },
  "futureAllowedOnlyAfterOwnerApproval": [
    "compute_engine_api_enablement_for_accepted_non_production_project",
    "read_only_compute_api_enabled_verification",
    "read_only_l4_quota_region_check",
    "quota_request_planning_if_needed"
  ],
  "runtimeFlags": {
    "dependencyInstallAllowed": false,
    "modelWeightDownloadAllowed": false,
    "dependencyModuleImportAllowed": false,
    "modelLoaderMetadataInspectionAllowed": false,
    "pipelineInstantiationAllowed": false,
    "modelFromPretrainedAllowed": false,
    "torchLoadAllowed": false,
    "textEncodingAllowed": false,
    "denoisingStepAllowed": false,
    "schedulerRunAllowed": false,
    "vaeEncodeDecodeAllowed": false,
    "modelInferenceAllowed": false,
    "generatedFramesAllowed": false,
    "generatedVideoAllowed": false,
    "mediaProcessingAllowed": false,
    "ffmpegAllowed": false,
    "providerCallsAllowed": false,
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "supabaseMutationAllowed": false,
    "sqlAllowed": false,
    "dockerCloudRunAllowed": false,
    "gcpMutationAllowed": false,
    "cloudResourceCreationAllowed": false,
    "storageUploadAllowed": false,
    "signedUrlCreationAllowed": false,
    "publicArtifactCreationAllowed": false,
    "creditMutationAllowed": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "betaProductionUnlockClaimed": false
  },
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9E: GCP Compute API owner approval packet, no resource creation/no inference"
}
```

## No-Scope Statement

No dependency is installed. No virtual environment is created. No model weights are downloaded. No model import is attempted. No pipeline is instantiated. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No Docker container is built or started. No Google Cloud API is enabled. No Google Cloud resource is created, updated, deleted, deployed, or run. No quota request is created. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is created. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9E: GCP Compute API owner approval packet, no resource creation/no inference`
