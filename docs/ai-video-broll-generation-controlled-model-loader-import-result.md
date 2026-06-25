# AI Video B-roll Generation Controlled Model Loader Import Result

Decision: `ai_video_broll_gen_7_model_loader_import_completed_ready_for_controlled_synthetic_generation_plan`

AI-VIDEO-BROLL-GEN-7 consumes the Gate 6 controlled model-weight download proof and records a controlled model loader/import proof for the approved Wan / Wan2.1 T2V 1.3B small-preview lane. The proof used a fresh throwaway Python environment built from the committed Gate 5 requirements manifest, imported the approved dependency modules and `WanPipeline` class, parsed local model config, opened the DiT safetensors header, loaded tokenizer metadata offline, and inspected PyTorch archive structure without deserializing weights through `torch.load`.

This gate did not create a prompt, call text encoding, instantiate the pipeline, call `from_pretrained`, call `torch.load`, denoise, run a scheduler, run VAE encode/decode, run inference, create generated frames, generate video, run media processing, run FFmpeg, run Docker, touch GCP, mutate Supabase, execute SQL, call providers, dispatch workers, create storage objects, create signed URLs, create public artifacts, mutate credits, unlock beta, unlock production, claim runtime readiness, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

```json ai-video-broll-gen-7-model-loader-import-result
{
  "phase": "AI-VIDEO-BROLL-GEN-7",
  "decision": "ai_video_broll_gen_7_model_loader_import_completed_ready_for_controlled_synthetic_generation_plan",
  "sourceBranch": "codex/ai-video-broll-gen-6-controlled-model-weight-download-proof",
  "sourceCommit": "34ca209c",
  "sourcePullRequests": {
    "pr786": "AI-VIDEO-BROLL-GEN-0 owner/model selection plan",
    "pr797": "AI-VIDEO-BROLL-GEN-1 license/provenance approval",
    "pr799": "AI-VIDEO-BROLL-GEN-2 weight source/checksum plan",
    "pr801": "AI-VIDEO-BROLL-GEN-3 dependency install plan",
    "pr804": "AI-VIDEO-BROLL-GEN-4 runtime/GPU owner review",
    "pr806": "AI-VIDEO-BROLL-GEN-5 controlled dependency install proof",
    "pr815": "AI-VIDEO-BROLL-GEN-6 controlled model weight download proof"
  },
  "sourceEvidence": [
    "docs/implementation-prompts/prompt-ai-video-broll-gen-7-model-loader-import-proof.md",
    "docs/ai-video-broll-generation-controlled-model-weight-download-result.md",
    "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
    "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt"
  ],
  "selectedModel": {
    "family": "Wan / Wan2.1",
    "modelId": "Wan-AI/Wan2.1-T2V-1.3B",
    "sourceRevision": "37ec512624d61f7aa208f7ea8140a131f93afc9a",
    "privateCachePath": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B/37ec512624d61f7aa208f7ea8140a131f93afc9a",
    "privateCacheOutsideRepository": true
  },
  "throwawayEnvironment": {
    "venvPath": "/private/tmp/reeditpro-ai-video-broll-gen-7-import-proof-hKEszd",
    "pythonVersion": "3.13.13",
    "pipVersion": "26.1.2",
    "requirementsManifest": "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
    "freezeEntryCount": 48,
    "cleanupVerified": true
  },
  "offlineMode": {
    "HF_HUB_OFFLINE": "1",
    "TRANSFORMERS_OFFLINE": "1",
    "DIFFUSERS_OFFLINE": "1",
    "networkRequiredForProof": false
  },
  "imports": {
    "dependencyModulesImported": true,
    "wanPipelineClassImported": "WanPipeline",
    "pipelineInstantiated": false,
    "modelFromPretrainedCalled": false,
    "torchLoadCalled": false
  },
  "metadataInspection": {
    "modelConfigParsed": true,
    "modelType": "WanModel",
    "numLayers": 30,
    "safetensorsHeaderOpened": true,
    "safetensorsTensorKeyCount": 825,
    "safetensorsSampleKeys": [
      "blocks.0.cross_attn.k.bias",
      "blocks.0.cross_attn.k.weight",
      "blocks.0.cross_attn.norm_k.weight",
      "blocks.0.cross_attn.norm_q.weight",
      "blocks.0.cross_attn.o.bias",
      "blocks.0.cross_attn.o.weight",
      "blocks.0.cross_attn.q.bias",
      "blocks.0.cross_attn.q.weight"
    ],
    "tokenizerClass": "T5Tokenizer",
    "tokenizerLength": 256300,
    "sentencePieceSize": 256000,
    "vaeArchiveInspected": true,
    "textEncoderArchiveInspected": true,
    "torchWeightDeserializationSkipped": true
  },
  "moduleVersions": {
    "torch": "2.12.1",
    "torchvision": "0.27.1",
    "diffusers": "0.38.0",
    "transformers": "5.12.1",
    "accelerate": "1.14.0",
    "safetensors": "0.8.0",
    "huggingface_hub": "1.21.0",
    "sentencepiece": "0.2.1",
    "numpy": "2.5.0",
    "pillow": "12.2.0",
    "einops": "0.8.2"
  },
  "runtimeFlags": {
    "dependencyInstallAllowed": true,
    "modelWeightDownloadAllowed": false,
    "dependencyModuleImportAllowed": true,
    "modelLoaderMetadataInspectionAllowed": true,
    "pipelineInstantiationAllowed": false,
    "modelFromPretrainedAllowed": false,
    "torchLoadAllowed": false,
    "promptCreationAllowed": false,
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
  "nextPrompt": "AI-VIDEO-BROLL-GEN-8: controlled synthetic generation plan, no execution"
}
```

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model inference, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage upload, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.
