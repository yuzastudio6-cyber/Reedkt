# AI Video B-roll Generation GCP L4 Cost / Quota Preflight Plan

Decision: `ai_video_broll_gen_9b_gcp_l4_private_proof_plan_completed_ready_for_prerequisite_verification`

This preflight plan defines what must be checked in a future no-inference verification prompt before any L4 proof can be attempted. It is text-only and does not run `gcloud`, Docker, Cloud Run, GKE, SQL, Supabase, providers, workers, inference, media processing, FFmpeg, storage, signed URLs, credits, beta, or production.

## Future Checks

The next prompt may perform read-only CLI/version/config checks and, if explicitly authorized by its prompt, read-only Google Cloud quota/pricing inspection. It must not create, mutate, deploy, run, upload, or delete resources.

Required future checks:

- active account and project identity, without printing secrets;
- region candidate availability for L4;
- quota availability for one L4 in the selected region;
- exact current price from official Google Cloud pricing;
- projected runtime cost under the USD 2.00 placeholder cap;
- no public ingress or public service endpoint plan;
- no user media;
- no provider fallback;
- no worker dispatch before Worker Runtime acceptance;
- no Supabase/storage mutation before Supabase owner acceptance.

```json ai-video-broll-gen-9b-cost-quota-preflight-plan
{
  "phase": "AI-VIDEO-BROLL-GEN-9B",
  "decision": "ai_video_broll_gen_9b_gcp_l4_private_proof_plan_completed_ready_for_prerequisite_verification",
  "preflightMode": "future_read_only_verification_plan",
  "selectedFutureTarget": "gcp_single_l4_private_proof_plan",
  "candidateRegions": [
    "us-central1",
    "us-east4",
    "us-west1"
  ],
  "checksRequiredBeforeExecution": [
    "active_non_production_project",
    "l4_region_availability",
    "l4_quota_available",
    "fresh_official_price",
    "cost_under_cap",
    "private_no_public_endpoint",
    "no_user_media",
    "no_worker_dispatch",
    "no_supabase_mutation",
    "cleanup_plan"
  ],
  "costCap": {
    "placeholderUsd": 2,
    "exactCostApprovalCreated": false,
    "freshPricingRequiredBeforeExecution": true,
    "abortIfOverCap": true
  },
  "allowedFutureVerificationCategories": [
    "read_only_tool_version_checks",
    "read_only_project_identity_check",
    "read_only_quota_check_if_prompt_authorizes",
    "read_only_pricing_source_check"
  ],
  "forbiddenFutureVerificationCategories": [
    "resource_creation",
    "resource_mutation",
    "docker_build_or_run",
    "cloud_run_deploy_or_start",
    "model_inference",
    "storage_upload",
    "signed_url_creation",
    "credit_mutation"
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
    "gcpCommandAllowed": false,
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
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9C: GCP L4 prerequisite verification, no cloud mutation/no inference"
}
```
