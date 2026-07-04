# AI Video B-roll 11H Bounded Inference Proof Execute

Decision: `ai_video_broll_gen_11h_bounded_latent_inference_proof_runner_ready_prompt_scoped_execution`.

AI-VIDEO-BROLL-GEN-11H turns the 11G fail-closed shell into a bounded, prompt-scoped Wan/Wan2.1 latent inference proof runner. The runner is callable by the external-agent B-roll wrapper only after explicit confirmation. It may create one no-public-IP L4 VM, install the approved offline wheelhouse, load the approved private Wan Diffusers cache, run one minimal latent-only inference canary from the approved fixture prompt, write sanitized JSON evidence, delete the VM, and verify cleanup.

This does not create generated B-roll video, does not decode frames, does not run FFmpeg, does not persist inference output, does not create generated assets, does not create public artifacts, does not create signed URLs, does not mutate Supabase, does not execute SQL, does not call providers, does not dispatch workers, does not mutate credits, does not unlock beta, does not unlock production, does not claim `dry_run_passed`, and does not claim `generated_local_fixture_passed`.

## Source Rules

- ReeditPro plans before it edits.
- Expensive AI editing, rendering, or generation must not start until the user approves the edit plan and credit estimate.
- External agents must use structured tool envelopes and approved fixture inputs, not raw chat.
- Wan remains the open-source generated B-roll route, but Remotion owns final composition.
- GPU work must remain prompt-scoped, no-idle, no-public-IP, and cleanup-verified.
- This runner does not authorize paid production, beta, public delivery, storage mutation, worker dispatch, provider calls, generated asset creation, or generated video readiness.

## Reviewed Evidence

- 11G runner: `docs/ai-video-broll-gen-11g-bounded-inference-proof-runner.md`
- 11G runner spec: `src/backend/mock/mock-ai-video-broll-gen-11g-bounded-inference-proof-runner.ts`
- 11F boundary plan: `docs/ai-video-broll-gen-11f-inference-boundary-plan.md`
- 11C review: `docs/ai-video-broll-gen-11c-model-import-result-review.md`
- 11B import/load result: `docs/ai-video-broll-gen-11b-model-import-proof-execution-result.md`
- 11B import/load runner: `server/cli/ai-video-broll-gen-11b-l4-model-import-runner.ts`
- External-agent B-roll wrapper: `server/cli/external-agent-tool-execute-broll-wan.ts`

## Runner Shape

- command name: `ai-video-broll-gen-11h:bounded-inference-proof-runner`
- runner file: `server/cli/ai-video-broll-gen-11h-bounded-inference-proof-runner.ts`
- smoke file: `server/smoke/ai-video-broll-gen-11h-inference-proof-execute-smoke.ts`
- runner confirmation env: `REEDITPRO_CONFIRM_BROLL_11H_INFERENCE_PROOF_EXECUTE=true`
- wrapper confirmation env: `REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_INFERENCE_PROOF=true`
- default mode: fail-closed static guard
- read-only preflight mode: validates local cache, private cache markers, quota, and pre-existing resources without VM creation
- execution mode: prompt-scoped L4 latent inference proof with cleanup verification
- selected GPU: `nvidia_l4`
- machine type: `g2-standard-8`
- source payload/install proof machine type: `g2-standard-4`
- target zone: `northamerica-northeast2-a`
- proof VM: `reeditpro-ai-broll-wan-l4-proof`
- no public IP: required
- idle GPU: forbidden
- cleanup verification: required

## Inference Canary Boundary

The 11H canary uses the approved local Wan Diffusers cache and the approved internal fixture prompt only. It calls `WanPipeline` with:

- `output_type="latent"`
- `height=128`
- `width=128`
- `num_frames=1`
- `num_inference_steps=1`
- `guidance_scale=1.0`
- `max_sequence_length=64`
- deterministic seed `112358`
- pipeline-load success marker before inference: `REEDITPRO_BROLL_11H_WAN_PIPELINE_LOAD_OK`
- latent canary timeout: 90 minutes
- parallel/offline load hints: `HF_ENABLE_PARALLEL_LOADING=true`, `HF_PARALLEL_LOADING_WORKERS=4`

This may run prompt encoding, one denoising step, and transient latent creation. It must not run VAE decode, frame postprocessing, video encoding, FFmpeg, export, storage writes, generated asset creation, public delivery, signed URLs, Supabase mutation, provider calls, workers, credits, beta, or production.

## Callable Modes

- static guard: `npm run ai-video-broll-gen-11h:bounded-inference-proof-runner -- --json`
- read-only preflight: `npm run ai-video-broll-gen-11h:bounded-inference-proof-runner -- --read-only-preflight --json`
- confirmation-blocked mode: `npm run ai-video-broll-gen-11h:bounded-inference-proof-runner -- --execute --json`
- confirmed execution mode: `REEDITPRO_CONFIRM_BROLL_11H_INFERENCE_PROOF_EXECUTE=true npm run ai-video-broll-gen-11h:bounded-inference-proof-runner -- --execute --json`
- wrapper static guard: `npm run external-agent-tool-execute-broll-wan -- --inference-proof --json`
- wrapper confirmed mode: `REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_INFERENCE_PROOF=true npm run external-agent-tool-execute-broll-wan -- --inference-proof --execute --json`

## Runtime Boundaries

Allowed only during confirmed 11H execution:

- `gcpReadOnlyCommandsExecuted=true`
- `gcpMutatingCommandsExecuted=true`
- `computeVmCreateAttempted=true`
- `computeVmCreated=true`
- `privateGcsPayloadDownloaded=true`
- `dependencyInstalledOnVm=true`
- `modelImportRun=true`
- `modelLoadRun=true`
- `modelInferenceRun=true`
- `promptEncodingRun=true`
- `denoisingRun=true`
- `transientLatentsCreated=true`
- `cleanupRun=true`
- `cleanupVerified=true`

Must remain false:

- `publicIpCreated=false`
- `dockerRun=false`
- `modelDownloaded=false`
- `inferenceOutputPersisted=false`
- `vaeDecodeRun=false`
- `frameCreationRun=false`
- `videoEncodingRun=false`
- `ffmpegRun=false`
- `generatedVideoCreated=false`
- `generatedAssetsCreated=false`
- `storageObjectsCreated=false`
- `signedUrlsCreated=false`
- `publicArtifactsCreated=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `generatedLocalFixturePassedClaimed=false`

## Failure Planning

If quota, private cache, VM creation, IAP, Python readiness, private payload transfer, offline wheelhouse extraction, `WanPipeline` load, latent canary execution, or cleanup verification fails, the runner must stop, delete only resources created by this prompt, write sanitized evidence, and recommend:

`AI-VIDEO-BROLL-GEN-11H-FIX-INFERENCE-PROOF: fix blocked bounded Wan inference proof, no generated video`

It must not silently switch to a larger GPU, enable public IP, reuse an existing VM, run Docker, download models from public sources, write media, persist output, create generated assets, or claim B-roll readiness.

## Next Prompt

If the bounded proof passes with cleanup verified:

`AI-VIDEO-BROLL-GEN-11I-INFERENCE-PROOF-RESULT-REVIEW: review bounded Wan inference proof result, no generated video`
