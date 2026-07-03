# AI Video B-roll 11A Model Import Plan

Decision: `ai_video_broll_gen_11a_model_import_plan_ready_for_bounded_no_inference_proof`.

AI-VIDEO-BROLL-GEN-11A plans the next B-roll/Wan execution step after the canonical external-agent wrapper proved payload delivery, offline dependency install, dependency import readiness, and cleanup on a prompt-scoped no-public-IP L4 VM.

This is plan/spec/smoke only. It does not create a VM, run GCP commands, run Docker, import Wan, load Wan weights, run inference, create generated video, create generated assets, create public artifacts, create signed URLs, mutate Supabase, execute SQL, call providers, dispatch workers, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- 10ZB wrapper result: `docs/ai-video-broll-wan-external-agent-wrapper-execution-result.md`
- 10ZB wrapper result spec: `src/backend/mock/mock-ai-video-broll-wan-external-agent-wrapper-execution-result.ts`
- 10ZB runner: `server/cli/ai-video-broll-gen-10zb-l4-payload-install-runner.ts`
- B-roll external-agent wrapper: `server/cli/external-agent-tool-execute-broll-wan.ts`
- Wan fast cache readiness: `src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness.ts`
- Wan mount validator: `server/workers/ai-video-broll-controlled-install/validate_wan_model_mount.py`
- Historical tabletop proof runner: `server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py`
- External-agent rollup: `docs/external-agent-tool-execution-readiness-rollup.md`

## Current Proven State

- The selected B-roll model lane is `Wan-AI/Wan2.1-T2V-1.3B-Diffusers`.
- The selected proof GPU remains `nvidia_l4`.
- The selected bounded proof machine remains `g2-standard-4`.
- The selected bounded proof zone remains `northamerica-northeast2-a`.
- The private Diffusers cache has `19` runtime-essential files and `28928887859` expected bytes.
- The private cache contains `model_index.json`, `scheduler`, `text_encoder`, `tokenizer`, `transformer`, and `vae` layout markers.
- The expected pipeline class is `WanPipeline`.
- The 10ZB wrapper proved dependency install and dependency imports only.
- Wan model import, model load, prompt encoding, denoising, frame generation, and video generation remain unproven.

## Why A Separate Model Import Plan Is Required

The historical tabletop runner has a future execution path that imports `WanPipeline` and then calls the pipeline to create frames. That is too broad for the next proof.

Future 11B must use a narrower no-inference import/load proof that stops before prompt encoding, scheduler steps, denoising, VAE decode, frame materialization, video encoding, asset creation, and any delivery path.

## Future 11B Scope

Future 11B may run only after live preflight and explicit confirmation are repeated. The future proof may:

1. Re-run B-roll quota and private cache readiness.
2. Create at most one prompt-scoped no-public-IP L4 VM.
3. Download only the approved private dependency payload and approved private Diffusers cache payload.
4. Install dependencies offline from the approved private wheelhouse.
5. Set offline environment variables before any model-library access.
6. Import dependency libraries.
7. Import the Wan pipeline class.
8. Load the approved local Diffusers cache with local-files-only behavior.
9. Write sanitized evidence that model import/load completed or failed.
10. Immediately release model resources and delete the VM.
11. Verify the VM and prompt-scoped resources are absent.

Future 11B must not run the pipeline, encode prompts, run denoising, decode frames, create images, create video, run FFmpeg, persist assets, publish artifacts, mutate Supabase, execute SQL, spend credits, unlock beta, or unlock production.

## Proof Envelope Requirements

- `toolId`: `ai_video_broll_generation_wan`
- `modelRepository`: `Wan-AI/Wan2.1-T2V-1.3B-Diffusers`
- `sourceCommit`: `0fad780a534b6463e45facd96134c9f345acfa5b`
- `privateCachePath`: approved private local/cache mount only
- `selectedGpu`: `nvidia_l4`
- `machineType`: `g2-standard-4`
- `targetRegion`: `northamerica-northeast2`
- `targetZone`: `northamerica-northeast2-a`
- `proofVmName`: `reeditpro-ai-broll-wan-l4-proof`
- `externalIpAllowed`: `false`
- `idleGpuAllowed`: `false`
- `modelInferenceAllowed`: `false`
- `generatedVideoAllowed`: `false`
- `cleanupVerificationRequired`: `true`

## Required Stop Points

The future proof must stop before:

- prompt text encoding;
- scheduler or denoising steps;
- VAE decode;
- frame materialization;
- media encoding;
- FFmpeg or ffprobe;
- generated asset row creation;
- storage object creation;
- signed URL creation;
- public artifact publication;
- worker dispatch;
- provider calls;
- credit estimation, approval, reservation, spend, refund, or release;
- beta, external beta, production, or paid production unlock.

## GPU Selection

`nvidia_l4` remains the best current proof GPU because:

- the 10ZB wrapper already proved a no-public-IP `g2-standard-4` L4 path can run only while used and clean up afterward;
- L4 is lower-cost than larger accelerator classes for a first import/load proof;
- the goal is import/load readiness, not full-quality inference;
- larger GPUs should be considered only if 11B proves L4 memory is insufficient.

Always-on GPU runtime, capacity reservations, public-IP VMs, and idle GPU services remain rejected.

## Runtime Gates

All runtime side effects remain false in 11A:

- `computeVmCreated=false`
- `gpuAttached=false`
- `dockerRun=false`
- `gcpMutatingCommandsExecuted=false`
- `dependencyInstalledOnVm=false`
- `dependencyImportReadinessRun=false`
- `modelDownloaded=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `promptEncodingRun=false`
- `denoisingRun=false`
- `framesCreated=false`
- `modelInferenceRun=false`
- `generatedVideoCreated=false`
- `generatedAssetsCreated=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `storageObjectsCreated=false`
- `signedUrlsCreated=false`
- `publicArtifactsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## External-Agent State After 11A

- Previous B-roll next action: `AI-VIDEO-BROLL-GEN-11A-MODEL-IMPORT-PLAN: plan Wan model import proof after payload/install readiness, no inference`
- New B-roll next action: `AI-VIDEO-BROLL-GEN-11B-MODEL-IMPORT-PROOF: run bounded no-idle L4 Wan model import proof, no inference`
- External agents may still run the existing B-roll dependency wrapper for dependency/install proof.
- External agents must not attempt Wan import until the 11B proof runner and smoke exist.

## Recommended Next Prompt

`AI-VIDEO-BROLL-GEN-11B-MODEL-IMPORT-PROOF: run bounded no-idle L4 Wan model import proof, no inference`
