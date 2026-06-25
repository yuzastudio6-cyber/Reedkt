# AI Video B-roll Generation GCP L4 Private Synthetic Proof Plan

Decision: `ai_video_broll_gen_9b_gcp_l4_private_proof_plan_completed_ready_for_prerequisite_verification`

AI-VIDEO-BROLL-GEN-9B defines the no-cloud-execution plan for a future private single-L4 synthetic proof of the Wan 1.3B non-user-media fixture. This gate does not run Google Cloud commands, create Google Cloud resources, start Docker, build images, push images, run Cloud Run, run GKE, install dependencies, download weights, instantiate a pipeline, run inference, create frames, create video, run FFmpeg, mutate Supabase, execute SQL, call providers, dispatch workers, upload storage, create signed URLs, create public artifacts, mutate credits, unlock beta, unlock production, claim runtime readiness, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- `docs/ai-video-broll-generation-runtime-memory-owner-review.md`
- `docs/ai-video-broll-generation-runtime-memory-cost-target-matrix.md`
- `docs/ai-video-broll-generation-controlled-synthetic-generation-proof-result.md`
- `docs/ai-video-broll-generation-controlled-synthetic-generation-runtime-estimate.md`
- `docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md`
- `docs/activation-gcp-staging-command-policy.md`
- `docs/activation-gcp-staging-resource-map.md`
- Google Cloud GPU machine type docs: `https://cloud.google.com/compute/docs/gpus`
- Google Cloud GPU pricing docs: `https://cloud.google.com/compute/gpus-pricing`
- Google Cloud Run GPU docs: `https://cloud.google.com/run/docs/configuring/services/gpu`
- Google Cloud Run pricing docs: `https://cloud.google.com/run/pricing`

## Selected Future Shape

The selected future proof shape is a private, single-L4, no-public-endpoint job plan for the Wan 1.3B synthetic fixture. The default target is a Compute Engine G2 L4-class shape rather than a public service because the first proof should be private, bounded, and easier to clean up. Cloud Run GPU remains a later option only after service-ingress, cold-start, container, and public-endpoint policy review.

Recommended future request shape:

- Accelerator: one NVIDIA L4.
- GPU memory class: 24 GB L4-class target.
- Machine family: G2 accelerator-optimized class, exact machine type to be verified later by quota and region.
- Runtime: private proof job or tightly scoped manual proof; no public endpoint.
- Input: Gate 8 non-user-media tabletop fixture only.
- Output: temporary private proof directory only if a later execution prompt allows it.
- Time cap: 60 minutes hard stop for first proof attempt.
- Cost cap: planning placeholder of USD 2.00 maximum for first proof attempt, to be recalculated from official pricing immediately before execution.

## Region Candidates

The future verification prompt must choose from official L4-available regions after checking quota and pricing. The planning candidates are:

1. `us-central1`: preferred first candidate because existing ReeditPro GCP docs reference central/staging-oriented resources and it is a common low-latency US region.
2. `us-east4`: secondary US candidate if L4 quota or capacity is unavailable in `us-central1`.
3. `us-west1`: tertiary US candidate only if quota, pricing, and data-boundary review accept it.

No region is approved for execution by this gate. A fresh official pricing and quota check is required before any future command.

## Private Model Cache Transfer Policy

The private Wan cache currently lives outside the repository. A future L4 proof must not use public buckets, signed URLs, repo-tracked weights, provider-hosted fallbacks, or runtime auto-download. Acceptable future transfer paths must be approved before execution:

- ephemeral private disk attached to the proof target;
- private GCS object path only after Supabase/Storage owner acceptance;
- Artifact Registry image layer only after Worker Runtime and GCP owner acceptance.

The first future proof should prefer a short-lived private disk or private staging path with checksum verification and cleanup. Signed URLs are not source of truth.

## Required Verification Before Any Future Command

- Confirm active project is the intended non-production proof project.
- Confirm no production or staging customer data is in scope.
- Confirm L4 quota in selected region.
- Confirm exact price from official Google Cloud pricing at execution time.
- Confirm projected cost stays below the approved cap.
- Confirm image/runtime does not expose a public endpoint.
- Confirm no user media and no product project linkage.
- Confirm no service account secrets are printed or committed.
- Confirm cleanup command plan is reviewed but not executed in this gate.

```json ai-video-broll-gen-9b-gcp-l4-private-proof-plan
{
  "phase": "AI-VIDEO-BROLL-GEN-9B",
  "decision": "ai_video_broll_gen_9b_gcp_l4_private_proof_plan_completed_ready_for_prerequisite_verification",
  "sourceBranch": "codex/ai-video-broll-gen-9a-runtime-memory-owner-review",
  "sourceCommit": "d12ab93b",
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
    "pr832": "AI-VIDEO-BROLL-GEN-9A runtime memory owner review"
  },
  "selectedModel": {
    "family": "Wan / Wan2.1",
    "modelId": "Wan-AI/Wan2.1-T2V-1.3B",
    "sourceRevision": "37ec512624d61f7aa208f7ea8140a131f93afc9a",
    "privateCacheOutsideRepository": true,
    "privateCacheApproxSizeGiB": 16
  },
  "selectedFutureTarget": {
    "targetId": "gcp_single_l4_private_proof_plan",
    "accelerator": "nvidia_l4",
    "acceleratorCount": 1,
    "gpuMemoryClass": "24gb_l4_class",
    "preferredRuntime": "private_compute_job_or_manual_proof_plan",
    "cloudRunServicePreferredNow": false,
    "publicEndpointAllowed": false,
    "executionApprovedNow": false
  },
  "regionCandidates": [
    {
      "region": "us-central1",
      "rank": 1,
      "status": "candidate_requires_quota_and_price_verification"
    },
    {
      "region": "us-east4",
      "rank": 2,
      "status": "fallback_candidate_requires_quota_and_price_verification"
    },
    {
      "region": "us-west1",
      "rank": 3,
      "status": "fallback_candidate_requires_quota_price_and_data_boundary_review"
    }
  ],
  "costAndRuntimeCaps": {
    "freshOfficialPricingRequiredBeforeExecution": true,
    "maxFirstProofRuntimeMinutes": 60,
    "maxFirstProofCostUsdPlaceholder": 2,
    "costApprovalCreated": false,
    "billingMutationAllowed": false,
    "abortIfPriceCannotBeVerified": true
  },
  "transferPolicy": {
    "publicBucketAllowed": false,
    "signedUrlAllowed": false,
    "repoTrackedWeightsAllowed": false,
    "runtimeAutoDownloadAllowed": false,
    "preferredFutureTransfer": "short_lived_private_disk_or_owner_accepted_private_staging_path",
    "checksumVerificationRequired": true,
    "cleanupPlanRequired": true
  },
  "fallbackDecision": {
    "ltxFallbackIfL4Blocked": true,
    "ltxRequiresSeparateWeightChecksumImportProof": true,
    "t4FallbackAllowedOnlyAfterOwnerReview": true,
    "cpuFallbackAllowed": false,
    "hunyuanFallbackAllowed": false
  },
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

## No-Scope Statement

No dependency is installed. No virtual environment is created. No model weights are downloaded. No model import is attempted. No pipeline is instantiated. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No Docker container is built or started. No Google Cloud command is run. No GCP resource is touched. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is created. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9C: GCP L4 prerequisite verification, no cloud mutation/no inference`
