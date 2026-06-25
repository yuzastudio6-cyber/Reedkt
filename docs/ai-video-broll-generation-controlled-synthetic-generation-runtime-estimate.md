# AI Video B-roll Generation Controlled Synthetic Generation Runtime Estimate

Decision: `ai_video_broll_gen_8_controlled_synthetic_generation_plan_completed_ready_for_controlled_synthetic_generation_proof`

This estimate records the CPU/GPU planning envelope for a future tiny synthetic proof. It is not a benchmark. It does not instantiate a model, run text encoding, denoise, decode frames, write video, run FFmpeg, start Docker, call GCP, dispatch workers, mutate Supabase, execute SQL, or create artifacts.

## Cost-Friendly Runtime Ranking

1. Local small-preview GPU or MPS target only if the future prompt proves memory, architecture, offline cache use, and no user media.
2. Single cost-friendly cloud GPU only after explicit GCP/Worker Runtime owner acceptance; preferred planning profile is a small L4-class target because it offers more memory headroom than tiny GPUs.
3. T4-class target remains slower and acceptable only if owner-reviewed as a low-cost fallback.
4. CPU generation is blocked for the synthetic proof because the estimate is too slow for a cost-friendly validation lane.
5. Large Wan 14B, HunyuanVideo, and premium/high-GPU lanes remain out of scope.

## Owner-Reviewed Limits

- Abort before execution if GPU memory projection exceeds 16 GiB for the tiny proof.
- Abort before execution if runtime projection exceeds 180 minutes for the tiny proof.
- Abort before execution if the model requires a native frame count or resolution above the accepted proof envelope.
- Abort before execution if the proof would need network model fetch, user media, storage upload, signed URL, public artifact, worker dispatch, provider call, credit mutation, media processing, FFmpeg, or final render/export.

```json ai-video-broll-gen-8-runtime-estimate
{
  "phase": "AI-VIDEO-BROLL-GEN-8",
  "decision": "ai_video_broll_gen_8_controlled_synthetic_generation_plan_completed_ready_for_controlled_synthetic_generation_proof",
  "estimateKind": "planning_only_unbenchmarked",
  "modelId": "Wan-AI/Wan2.1-T2V-1.3B",
  "sourceRevision": "37ec512624d61f7aa208f7ea8140a131f93afc9a",
  "syntheticFixtureId": "ai-video-broll-gen-8-plan-only-neutral-tabletop-object",
  "targetProofEnvelope": {
    "content": "non_user_media_neutral_tabletop_object",
    "targetResolution": "480p_or_lower_if_supported",
    "targetDurationSeconds": 1,
    "targetFrameCount": "smallest_owner_approved_native_safe_count",
    "audio": false,
    "userMedia": false,
    "publicArtifact": false
  },
  "cpuEstimate": {
    "acceptedForFutureProof": false,
    "wallClockEstimateMinutes": ">720",
    "memoryEstimateGiB": "unknown_high",
    "reason": "CPU generation is too slow for a cost-friendly proof and would risk long-running local execution."
  },
  "localGpuEstimate": {
    "acceptedForFutureProofOnlyAfterPreflight": true,
    "preferredTarget": "local_mps_or_local_gpu_if_available_and_owner_accepted",
    "minimumMemoryEstimateGiB": 10,
    "recommendedMemoryHeadroomGiB": 16,
    "wallClockEstimateMinutes": "60-240_unverified",
    "notes": "Future proof must benchmark or abort before denoising; this gate records planning numbers only."
  },
  "cloudGpuEstimate": {
    "acceptedForFutureProofOnlyAfterOwnerApproval": true,
    "preferredCostFriendlyTarget": "single_l4_24gb_future_worker_only",
    "fallbackTarget": "single_t4_16gb_only_if_owner_accepts_slower_path",
    "singleL4WallClockEstimateMinutes": "20-90_unverified",
    "singleT4WallClockEstimateMinutes": "45-180_unverified",
    "gcpExecutionAllowedNow": false,
    "cloudRunAllowedNow": false
  },
  "abortThresholds": {
    "projectedGpuMemoryGiBGreaterThan": 16,
    "projectedRuntimeMinutesGreaterThan": 180,
    "networkFetchRequired": true,
    "userMediaRequired": true,
    "storageUploadRequired": true,
    "ffmpegRequired": true,
    "ownerGateMissing": true
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
    "storageUploadAllowed": false,
    "signedUrlCreationAllowed": false,
    "publicArtifactCreationAllowed": false,
    "creditMutationAllowed": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "betaProductionUnlockClaimed": false
  },
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9: controlled synthetic generation proof, local tiny non-user-media only"
}
```
