# AI Video B-roll Generation Controlled Model Weight Download Result

Decision: `ai_video_broll_gen_6_controlled_model_weight_download_completed_ready_for_model_loader_import_proof`

AI-VIDEO-BROLL-GEN-6 consumes the Gate 5 controlled dependency install proof and records a controlled model-weight download proof for the approved small-preview AI video B-roll lane. The proof downloaded the Wan / Wan2.1 T2V 1.3B runtime-essential file set from the official Hugging Face model repository into an outside-repo private cache, verified byte sizes, and computed SHA-256 checksums for every downloaded file.

This gate did not import a model, instantiate a pipeline, run inference, generate video, run media processing, run FFmpeg, run Docker, touch GCP, mutate Supabase, execute SQL, call providers, dispatch workers, create storage objects, create signed URLs, create public artifacts, mutate credits, unlock beta, unlock production, claim runtime readiness, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

```json ai-video-broll-gen-6-controlled-weight-download-result
{
  "phase": "AI-VIDEO-BROLL-GEN-6",
  "decision": "ai_video_broll_gen_6_controlled_model_weight_download_completed_ready_for_model_loader_import_proof",
  "sourceBranch": "codex/ai-video-broll-gen-5-controlled-dependency-install-proof",
  "sourceCommit": "1ded3cae",
  "sourcePullRequests": {
    "pr786": "AI-VIDEO-BROLL-GEN-0 owner/model selection plan",
    "pr797": "AI-VIDEO-BROLL-GEN-1 license/provenance approval",
    "pr799": "AI-VIDEO-BROLL-GEN-2 weight source/checksum plan",
    "pr801": "AI-VIDEO-BROLL-GEN-3 dependency install plan",
    "pr804": "AI-VIDEO-BROLL-GEN-4 runtime/GPU owner review",
    "pr806": "AI-VIDEO-BROLL-GEN-5 controlled dependency install proof"
  },
  "sourceEvidence": [
    "docs/implementation-prompts/prompt-ai-video-broll-gen-6-controlled-model-weight-download-proof.md",
    "docs/ai-video-broll-generation-controlled-dependency-install-result.md",
    "docs/ai-video-broll-generation-weight-source-checksum-plan.md",
    "docs/ai-video-broll-generation-checksum-private-cache-policy.md",
    "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt"
  ],
  "selectedModel": {
    "family": "Wan / Wan2.1",
    "modelId": "Wan-AI/Wan2.1-T2V-1.3B",
    "sourceUrl": "https://huggingface.co/Wan-AI/Wan2.1-T2V-1.3B",
    "sourceRevision": "37ec512624d61f7aa208f7ea8140a131f93afc9a",
    "license": "apache-2.0",
    "gated": false,
    "private": false,
    "selectionReason": "Gate 2 ranks Wan 1.3B as the first cost-friendly primary small-preview source for realistic stock-style B-roll."
  },
  "downloadScope": {
    "fileSet": "model_runtime_essential_plus_provenance",
    "fullSnapshotAssetsDownloaded": false,
    "runtimeEssentialFilesDownloaded": true,
    "downloadedFileCount": 10,
    "downloadedByteTotal": 17567424122,
    "downloadedApproxGiB": "16.36",
    "privateCachePath": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B/37ec512624d61f7aa208f7ea8140a131f93afc9a",
    "privateCacheOutsideRepository": true,
    "privateCacheCommitted": false,
    "gitTrackedModelFiles": false
  },
  "preflight": {
    "gate5DiagnosticsPassed": true,
    "gate4DiagnosticsPassed": true,
    "gate2DiagnosticsPassed": true,
    "crossChatOwnershipDiagnosticsPassed": true,
    "availableDiskGibAtStart": "168",
    "pythonStdlibHttpsCertCheckPassed": false,
    "pythonStdlibHttpsCertFailure": "local Python SSL certificate chain could not verify Hugging Face; no insecure Python network path was used",
    "metadataTooling": "curl and Node built-ins",
    "downloadTooling": "curl",
    "authenticatedDownload": false,
    "secretsUsed": false
  },
  "downloadExecution": {
    "modelWeightDownloadAllowedInThisGate": true,
    "modelWeightDownloadCompleted": true,
    "downloadedFromOfficialSourceOnly": true,
    "canonicalSourceUrlRecorded": true,
    "signedRedirectUrlsRecorded": false,
    "initialHttp2StreamFailureRecovered": true,
    "resumableDownloadUsed": true,
    "unsafeInternalRetryRestartDetected": true,
    "finalLargeFileMethod": "outer-loop curl resume without internal retry",
    "appleDoubleMetadataRemovedFromPrivateCache": true,
    "sha256ComputedForEveryDownloadedFile": true
  },
  "runtimeFlags": {
    "dependencyInstallAllowed": false,
    "modelWeightDownloadAllowed": true,
    "modelImportAllowed": false,
    "modelPipelineInstantiationAllowed": false,
    "modelInferenceAllowed": false,
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
  "nextPrompt": "AI-VIDEO-BROLL-GEN-7: model loader import proof, no inference/no generated video"
}
```

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, model import, model inference, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage upload, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.
