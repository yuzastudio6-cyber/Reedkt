# AI Video B-roll Generation GCP L4 Private Cache Transfer Policy

Decision: `ai_video_broll_gen_9b_gcp_l4_private_proof_plan_completed_ready_for_prerequisite_verification`

This policy records how the existing Wan 1.3B private cache may be handled in a future L4 proof plan. It is policy-only and does not copy files, upload storage, create buckets, create signed URLs, mutate Supabase, run cloud commands, or create generated media.

## Cache Facts

- Model: `Wan-AI/Wan2.1-T2V-1.3B`
- Revision: `37ec512624d61f7aa208f7ea8140a131f93afc9a`
- Current cache: outside repository
- File count: 10
- Approximate size: 16 GiB
- Checksum evidence: Gate 6 manifest

## Allowed Future Transfer Candidates

1. Short-lived private disk transfer for a single proof target, with checksum verification and cleanup.
2. Owner-accepted private staging path with no public access and no signed URL source of truth.
3. Worker-owner-accepted image-layer strategy only after dependency/runtime image review.

## Forbidden Transfer Paths

- Public buckets.
- Signed URLs as source of truth.
- Repo-tracked model files.
- Runtime auto-download from Hugging Face or other external source.
- Provider-hosted fallback.
- User media co-location.
- Production/staging customer buckets.
- Unbounded persistent cache.

```json ai-video-broll-gen-9b-private-cache-transfer-policy
{
  "phase": "AI-VIDEO-BROLL-GEN-9B",
  "decision": "ai_video_broll_gen_9b_gcp_l4_private_proof_plan_completed_ready_for_prerequisite_verification",
  "modelId": "Wan-AI/Wan2.1-T2V-1.3B",
  "sourceRevision": "37ec512624d61f7aa208f7ea8140a131f93afc9a",
  "privateCacheOutsideRepository": true,
  "privateCacheApproxSizeGiB": 16,
  "checksumManifest": "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
  "allowedFutureTransferCandidates": [
    "short_lived_private_disk_transfer",
    "owner_accepted_private_staging_path",
    "worker_owner_accepted_image_layer_strategy"
  ],
  "forbiddenTransferPaths": [
    "public_bucket",
    "signed_url_source_of_truth",
    "repo_tracked_weights",
    "runtime_auto_download",
    "provider_hosted_fallback",
    "user_media_colocation",
    "production_customer_bucket",
    "unbounded_persistent_cache"
  ],
  "futureRequirements": {
    "checksumVerificationRequired": true,
    "privatePathPolicyRequired": true,
    "cleanupRequired": true,
    "supabaseStorageOwnerAcceptanceRequired": true,
    "workerRuntimeOwnerAcceptanceRequired": true
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
