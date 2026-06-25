# AI Video B-roll Generation Controlled Dependency Install Result

Decision: `ai_video_broll_gen_5_controlled_dependency_install_completed_with_warnings_ready_for_model_weight_download_proof`

AI-VIDEO-BROLL-GEN-5 consumes Gate 4 runtime/GPU owner review and records exact direct Python package pins for the small-preview AI video B-roll dependency lane. Dependency resolution was performed only inside a throwaway virtual environment under `/private/tmp`; no model weights, model import, inference, generated video, Docker/GCP execution, provider call, worker dispatch, Supabase mutation, SQL, storage object, signed URL, public artifact, credit mutation, beta unlock, production unlock, `dry_run_passed`, `generated_local_fixture_passed`, or runtime-readiness claim was performed or made.

```json ai-video-broll-gen-5-controlled-install-result
{
  "phase": "AI-VIDEO-BROLL-GEN-5",
  "decision": "ai_video_broll_gen_5_controlled_dependency_install_completed_with_warnings_ready_for_model_weight_download_proof",
  "sourceBranch": "codex/ai-video-broll-gen-4-runtime-gpu-owner-review",
  "sourceCommit": "0aa0b1cb",
  "sourcePullRequests": {
    "pr786": "AI-VIDEO-BROLL-GEN-0 owner/model selection plan",
    "pr797": "AI-VIDEO-BROLL-GEN-1 license/provenance approval",
    "pr799": "AI-VIDEO-BROLL-GEN-2 weight source/checksum plan",
    "pr801": "AI-VIDEO-BROLL-GEN-3 dependency install plan",
    "pr804": "AI-VIDEO-BROLL-GEN-4 runtime/GPU owner review"
  },
  "sourceEvidence": [
    "docs/ai-video-broll-generation-runtime-gpu-owner-review.md",
    "docs/ai-video-broll-generation-runtime-gpu-tier-decision.md",
    "docs/ai-video-broll-generation-runtime-owner-acceptance-map.md",
    "docs/ai-video-broll-generation-gate-4-blocker-register.md",
    "docs/implementation-prompts/prompt-ai-video-broll-gen-5-controlled-dependency-install-proof.md"
  ],
  "requirementsManifest": "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "requirementsConvention": "scoped_worker_requirements_manifest",
  "proofScope": {
    "smallPreviewLaneOnly": true,
    "wanOnePointThreeBPlanningLane": true,
    "ltxPreviewPlanningLane": true,
    "mochiResearchDependencyLaneDeferred": true,
    "hunyuanBlocked": true
  },
  "pythonResolution": {
    "interpreter": "/Library/Frameworks/Python.framework/Versions/3.13/bin/python3",
    "pythonVersion": "3.13.13",
    "pipInitialVersion": "26.0.1",
    "pipResolvedVersion": "26.1.2",
    "tempVenvLocation": "/private/tmp/reeditpro-ai-video-broll-gen-5-pip-resolve-sfcTKn",
    "tempVenvCleaned": true,
    "resolverAction": "pip installed approved direct package names into a throwaway venv for version resolution only",
    "controlledDependencyInstallCompleted": true,
    "modelWeightDownloadsRun": false,
    "modelImportCommandsRun": false,
    "inferenceCommandsRun": false,
    "generatedVideoCommandsRun": false,
    "mediaProcessingCommandsRun": false
  },
  "directPackagePins": [
    {"packageName": "torch", "version": "2.12.1", "manifestLine": "torch==2.12.1", "purpose": "PyTorch runtime base for future small-preview proof"},
    {"packageName": "torchvision", "version": "0.27.1", "manifestLine": "torchvision==0.27.1", "purpose": "vision helper dependency used by model-runtime stacks"},
    {"packageName": "diffusers", "version": "0.38.0", "manifestLine": "diffusers==0.38.0", "purpose": "shared Wan/LTX pipeline planning lane"},
    {"packageName": "transformers", "version": "5.12.1", "manifestLine": "transformers==5.12.1", "purpose": "text encoder and model component dependency"},
    {"packageName": "accelerate", "version": "1.14.0", "manifestLine": "accelerate==1.14.0", "purpose": "future device placement and memory planning"},
    {"packageName": "safetensors", "version": "0.8.0", "manifestLine": "safetensors==0.8.0", "purpose": "future safe tensor file handling"},
    {"packageName": "huggingface-hub", "version": "1.21.0", "manifestLine": "huggingface-hub==1.21.0", "purpose": "future official model source metadata and authenticated download path"},
    {"packageName": "sentencepiece", "version": "0.2.1", "manifestLine": "sentencepiece==0.2.1", "purpose": "tokenizer dependency"},
    {"packageName": "protobuf", "version": "7.35.1", "manifestLine": "protobuf==7.35.1", "purpose": "model config/tokenizer serialization dependency"},
    {"packageName": "einops", "version": "0.8.2", "manifestLine": "einops==0.8.2", "purpose": "tensor operation helper dependency"},
    {"packageName": "numpy", "version": "2.5.0", "manifestLine": "numpy==2.5.0", "purpose": "numeric helper dependency"},
    {"packageName": "pillow", "version": "12.2.0", "manifestLine": "pillow==12.2.0", "purpose": "image input helper dependency for future image-to-video planning"}
  ],
  "resolvedTransitivePackageCount": 39,
  "blockedOrDeferredPackages": {
    "hunyuanvideo": "blocked_pending_legal_territory_commercial_review",
    "mochi_source_checkout": "deferred_research_lane_no_repo_clone",
    "ltx_source_checkout": "deferred_version_split_no_repo_clone",
    "wan_source_checkout": "deferred_no_repo_clone",
    "ffmpeg": "blocked_track_a_track_b_media_owner",
    "ffprobe": "blocked_track_b_media_owner",
    "imageio_ffmpeg": "blocked_media_output_dependency",
    "opencv_python": "blocked_until_media_processing_owner_acceptance",
    "xformers": "deferred_gpu_runtime_owner_review",
    "flash_attn": "deferred_gpu_runtime_owner_review",
    "triton": "deferred_gpu_runtime_owner_review",
    "comfyui": "blocked_third_party_runtime_bundle"
  },
  "packageLockStatus": "unchanged_required",
  "packageJsonStatus": "diagnostic_script_added_only",
  "nextPrompt": "AI-VIDEO-BROLL-GEN-6: controlled model weight download proof, no import/no inference",
  "runtimeFlags": {
    "dependencyResolutionAllowed": true,
    "modelWeightDownloadAllowed": false,
    "modelImportAllowed": false,
    "modelInferenceAllowed": false,
    "generatedVideoAllowed": false,
    "mediaProcessingAllowed": false,
    "providerCallsAllowed": false,
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "supabaseMutationAllowed": false,
    "sqlAllowed": false,
    "dockerCloudRunAllowed": false,
    "signedUrlCreationAllowed": false,
    "publicArtifactCreationAllowed": false,
    "creditMutationAllowed": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "betaProductionUnlockClaimed": false
  }
}
```

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, model import, model inference, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.
