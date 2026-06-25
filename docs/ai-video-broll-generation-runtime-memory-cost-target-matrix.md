# AI Video B-roll Generation Runtime Memory Cost Target Matrix

Decision: `ai_video_broll_gen_9a_runtime_memory_owner_review_completed_ready_for_gcp_l4_private_proof_plan`

This matrix ranks candidate proof targets after the local M4 16 GiB Wan proof blocked before inference. It is a planning matrix only. It does not run Google Cloud, Docker, providers, workers, Supabase, SQL, FFmpeg, media processing, inference, or generated media.

| Rank | Target | Model path | Cost posture | Memory posture | Decision |
| --- | --- | --- | --- | --- | --- |
| 1 | Single L4-class private job plan | Wan 1.3B | Cost-friendly cloud GPU planning, fresh price check required | Better headroom than local 16 GiB unified memory | Selected next plan |
| 2 | LTX local or L4 preview plan | LTX / LTX-Video | Potentially cheaper/fast-preview fallback | Requires separate weight/import proof | Fallback |
| 3 | Single T4 private job plan | Wan 1.3B or LTX | Slower low-cost fallback | Less headroom than L4 | Fallback only |
| 4 | Higher-memory local GPU | Wan 1.3B | Cost-friendly only if hardware already exists | Must prove memory above Gate 8 envelope | Future-only |
| 5 | CPU generation | none | Not cost-friendly | Too slow | Rejected |
| 6 | Wan 14B / HunyuanVideo | large/premium | Expensive/high-risk | Needs stronger review | Blocked |

## Source Notes

- Official Google Cloud GPU docs identify L4 GPU shapes with 24 GB memory and G2 machine types.
- Official Google Cloud docs describe G2 L4 as suitable for inference and graphics workloads.
- Official pricing pages must be rechecked immediately before any execution because region, reservation, spot/preemptible, sustained-use, and platform choices change cost.
- Cloud Run GPU pricing is instance-based and still requires CPU/memory charges plus any selected GPU pricing.

```json ai-video-broll-gen-9a-cost-target-matrix
{
  "phase": "AI-VIDEO-BROLL-GEN-9A",
  "decision": "ai_video_broll_gen_9a_runtime_memory_owner_review_completed_ready_for_gcp_l4_private_proof_plan",
  "targets": [
    {
      "rank": 1,
      "targetId": "single_l4_private_job_plan",
      "modelPath": "Wan-AI/Wan2.1-T2V-1.3B",
      "selected": true,
      "executionApprovedNow": false,
      "freshPricingCheckRequiredBeforeExecution": true,
      "expectedGpuMemoryClass": "24gb_l4_class",
      "why": "Best next balance for preserving Wan primary realistic B-roll path after local 16 GiB memory block."
    },
    {
      "rank": 2,
      "targetId": "ltx_local_or_l4_preview_plan",
      "modelPath": "LTX / LTX-Video",
      "selected": false,
      "executionApprovedNow": false,
      "requiresSeparateWeightChecksumImportProof": true,
      "why": "Secondary fast-preview route if Wan L4 path is blocked or too costly."
    },
    {
      "rank": 3,
      "targetId": "single_t4_private_job_plan",
      "modelPath": "Wan 1.3B or LTX only after owner review",
      "selected": false,
      "executionApprovedNow": false,
      "why": "May be cheaper but slower and tighter for memory than L4."
    },
    {
      "rank": 4,
      "targetId": "higher_memory_local_gpu",
      "modelPath": "Wan 1.3B",
      "selected": false,
      "currentLocalM4Accepted": false,
      "executionApprovedNow": false,
      "why": "Allowed only if future hardware proves enough memory headroom."
    },
    {
      "rank": 5,
      "targetId": "cpu_generation",
      "selected": false,
      "rejected": true,
      "why": "Not cost-friendly for AI video proof execution."
    },
    {
      "rank": 6,
      "targetId": "wan_14b_or_hunyuanvideo",
      "selected": false,
      "blocked": true,
      "why": "Too large, premium gated, or not accepted for this proof lane."
    }
  ],
  "pricePolicy": {
    "exactCostApprovalCreated": false,
    "billingMutationAllowed": false,
    "requiresFreshOfficialPricingBeforeExecution": true,
    "requiresCostCapBeforeExecution": true
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
    "storageUploadAllowed": false,
    "signedUrlCreationAllowed": false,
    "publicArtifactCreationAllowed": false,
    "creditMutationAllowed": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "betaProductionUnlockClaimed": false
  },
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9B: GCP L4 private synthetic proof plan, no cloud execution"
}
```
