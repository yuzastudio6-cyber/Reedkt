# AI Video B-roll Generation Controlled Synthetic Generation Plan

Decision: `ai_video_broll_gen_8_controlled_synthetic_generation_plan_completed_ready_for_controlled_synthetic_generation_proof`

AI-VIDEO-BROLL-GEN-8 plans the first possible synthetic proof for the Gate 7 Wan 1.3B import lane. This is planning evidence only. It does not run inference, create a prompt for execution, encode text, denoise, run a scheduler, decode frames, write video, process media, run FFmpeg, run Docker, touch GCP, mutate Supabase, execute SQL, call providers, dispatch workers, create storage objects, create signed URLs, create public artifacts, mutate credits, unlock beta, unlock production, claim runtime readiness, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Scope

The future proof may only test a tiny non-user-media synthetic B-roll candidate if all owners repeat safety preflight and accept the runtime target in that future prompt. The future proof must use the already recorded private Wan 1.3B cache and must remain disconnected from user uploads, product projects, credits, storage, public delivery, workers, provider transport, and final render/export.

The planned use case is realistic stock-style filler B-roll for a simple object/environment cutaway. The proof is not a product route, not beta readiness, not user media readiness, not final composition readiness, and not a public artifact.

## Planned Synthetic Input

- Source: synthetic text-only fixture authored by the AI_VIDEO_BROLL_GENERATION owner, not raw chat and not user media.
- Content: neutral household object on a plain tabletop.
- Exclusions: no people, no faces, no minors, no logos, no brands, no readable text, no copyrighted characters, no public figures, no documentary evidence claim, no product claim, no audio.
- Purpose: exercise the smallest owner-approved Wan 1.3B generation path later, after runtime and memory preflight.
- Output status now: no frames and no video exist.

## Runtime Boundary

The future proof must stop before execution unless it can prove a local or explicitly approved GPU target, expected memory, expected runtime, private cache isolation, no network model fetch, no user media, no public artifact, and no owner gate drift. CPU generation is not accepted for the proof because the planning estimate is too slow and expensive for a cost-friendly lane.

The future prompt must separately approve any text encoding, denoising, scheduler step, VAE decode, frame creation, image/video write, media container write, or FFmpeg operation. This plan approves none of those actions.

## Owner Gate Boundary

- `AI_VIDEO_BROLL_GENERATION` owns this plan and the future tiny synthetic proof request.
- `WORKER_RUNTIME_JOBS` must accept any worker-shaped runtime or job contract before dispatch.
- `PROVIDER_GATEWAY_MODELS` must confirm no hosted provider fallback or secret path is used.
- `TRACK_A_RENDER_EXPORT` must accept any future final composition handoff before render/export.
- `TRACK_B_MEDIA_PROCESSING` must accept any media processing, FFmpeg, ffprobe, or artifact inspection path before execution.
- `SUPABASE_RLS_STORAGE_DATABASE` must accept any future row, private path, manifest, checksum, storage, or signed URL policy before mutation.
- `OBSERVABILITY_AUDIT_COST` must accept any future QA, audit, abuse, and cost evidence before beta.
- `BILLING_STRIPE_CREDITS` must accept any future credit estimate, reservation, spend, refund, or release path before billing mutation.
- `PRODUCT_BETA_READINESS` must accept internal beta separately after runtime, QA, billing, and storage gates.

## Source Of Truth

Future generated B-roll artifacts must use private source-of-truth records only:

```text
approved plan snapshot
+ structured generated B-roll intent
+ private artifact manifest
+ checksum
+ private storage path
+ provenance/license metadata
```

Signed URLs are never source of truth. Public artifacts remain blocked until delivery, retention, abuse, access logging, visibility, and user approval policies are accepted.

```json ai-video-broll-gen-8-controlled-synthetic-generation-plan
{
  "phase": "AI-VIDEO-BROLL-GEN-8",
  "decision": "ai_video_broll_gen_8_controlled_synthetic_generation_plan_completed_ready_for_controlled_synthetic_generation_proof",
  "sourceBranch": "codex/ai-video-broll-gen-7-model-loader-import-proof",
  "sourceCommit": "c0b9c420",
  "sourcePullRequests": {
    "pr786": "AI-VIDEO-BROLL-GEN-0 owner/model selection plan",
    "pr797": "AI-VIDEO-BROLL-GEN-1 license/provenance approval",
    "pr799": "AI-VIDEO-BROLL-GEN-2 weight source/checksum plan",
    "pr801": "AI-VIDEO-BROLL-GEN-3 dependency install plan",
    "pr804": "AI-VIDEO-BROLL-GEN-4 runtime/GPU owner review",
    "pr806": "AI-VIDEO-BROLL-GEN-5 controlled dependency install proof",
    "pr815": "AI-VIDEO-BROLL-GEN-6 controlled model weight download proof",
    "pr820": "AI-VIDEO-BROLL-GEN-7 model loader import proof"
  },
  "sourceEvidence": [
    "docs/implementation-prompts/prompt-ai-video-broll-gen-8-controlled-synthetic-generation-plan.md",
    "docs/ai-video-broll-generation-controlled-model-loader-import-result.md",
    "docs/ai-video-broll-generation-controlled-model-loader-import-metadata.md",
    "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
    "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt"
  ],
  "selectedModel": {
    "family": "Wan / Wan2.1",
    "modelId": "Wan-AI/Wan2.1-T2V-1.3B",
    "sourceRevision": "37ec512624d61f7aa208f7ea8140a131f93afc9a",
    "license": "apache-2.0",
    "privateCachePath": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B/37ec512624d61f7aa208f7ea8140a131f93afc9a",
    "privateCacheOutsideRepository": true,
    "networkFetchAllowedForFutureProof": false
  },
  "syntheticFixturePlan": {
    "fixtureId": "ai-video-broll-gen-8-plan-only-neutral-tabletop-object",
    "inputKind": "structured_non_user_media_text_fixture",
    "plannedPromptText": "Neutral sunlit ceramic mug on a plain warm white tabletop, slow gentle camera drift, realistic stock-style B-roll, soft natural shadows, no people, no faces, no logos, no brands, no readable text, no copyrighted characters, no audio.",
    "negativePromptText": "people, faces, minors, public figures, logos, brands, readable text, watermark, copyrighted character, violent content, sexual content, documentary evidence, user media, audio",
    "userMediaUsed": false,
    "rawChatUsedAsExecutionPlan": false,
    "containsPeople": false,
    "containsFaces": false,
    "containsBrandsOrLogos": false,
    "containsReadableText": false,
    "containsAudio": false,
    "plannedAspectRatio": "16:9 synthetic proof only",
    "plannedResolution": "lowest owner-approved Wan 1.3B proof resolution, target 480p or lower if supported",
    "plannedFrameCount": "smallest owner-approved native-safe frame count; stop if model requires a larger proof than the approved cost envelope",
    "plannedDurationSeconds": "one second target if supported; otherwise native-minimum proof only after owner acceptance",
    "generatedFramesCreatedNow": false,
    "generatedVideoCreatedNow": false
  },
  "runtimeReadiness": {
    "futureProofMayBeRequested": true,
    "cpuGenerationAccepted": false,
    "localGpuPreflightRequired": true,
    "cloudGpuPreflightRequiredIfLocalUnavailable": true,
    "ownerAcceptanceRequiredBeforeDenoising": true,
    "ownerAcceptanceRequiredBeforeFrameCreation": true,
    "ownerAcceptanceRequiredBeforeVaeDecode": true,
    "ownerAcceptanceRequiredBeforeVideoWrite": true,
    "ownerAcceptanceRequiredBeforeFfmpeg": true,
    "ownerAcceptanceRequiredBeforeStorage": true
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

## No-Scope Statement

No dependency is installed. No virtual environment is created. No new model weights are downloaded. No checksum is computed. No model import is attempted. No pipeline is instantiated. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No Docker container is built or started. No GCP resource is touched. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is created. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9: controlled synthetic generation proof, local tiny non-user-media only`
