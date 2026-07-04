# AI Video B-roll 11G Bounded Inference Proof Runner

Decision: `ai_video_broll_gen_11g_bounded_inference_proof_runner_static_guard_ready_no_execution`.

AI-VIDEO-BROLL-GEN-11G implements the callable bounded Wan/Wan2.1 inference-proof runner shell after 11F defined the boundary. This is runner/spec/smoke only. It does not create a VM, does not run Wan inference, does not encode prompts, does not denoise, does not decode frames, does not create frames, does not run FFmpeg, does not create generated video, does not create generated assets, does not create storage objects, does not create public artifacts, does not create signed URLs, does not mutate Supabase, does not execute SQL, does not call providers, does not dispatch workers, does not mutate credits, does not unlock beta, does not unlock production, does not claim `dry_run_passed`, and does not claim `generated_local_fixture_passed`.

## Source Rules

- ReeditPro plans before it edits.
- Expensive AI editing, rendering, or generation must not start until the user approves the edit plan and credit estimate.
- External agents must use structured tool envelopes and approved fixture inputs, not raw chat.
- Wan remains the open-source generated B-roll route, but Remotion owns final composition.
- GPU work must remain prompt-scoped, no-idle, no-public-IP, and cleanup-verified.
- This runner does not authorize paid production, beta, public delivery, storage mutation, worker dispatch, provider calls, or generated asset creation.

## Reviewed Evidence

- 11F boundary plan: `docs/ai-video-broll-gen-11f-inference-boundary-plan.md`
- 11F boundary spec: `src/backend/mock/mock-ai-video-broll-gen-11f-inference-boundary-plan.ts`
- 11C review: `docs/ai-video-broll-gen-11c-model-import-result-review.md`
- 11B import/load result: `docs/ai-video-broll-gen-11b-model-import-proof-execution-result.md`
- 11B import/load runner: `server/cli/ai-video-broll-gen-11b-l4-model-import-runner.ts`
- External-agent B-roll wrapper: `server/cli/external-agent-tool-execute-broll-wan.ts`

## Runner Shape

- command name: `ai-video-broll-gen-11g:bounded-inference-proof-runner`
- runner file: `server/cli/ai-video-broll-gen-11g-bounded-inference-proof-runner.ts`
- smoke file: `server/smoke/ai-video-broll-gen-11g-bounded-inference-proof-runner-smoke.ts`
- runner confirmation env: `REEDITPRO_CONFIRM_BROLL_11G_INFERENCE_PROOF=true`
- wrapper confirmation env: `REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_INFERENCE_PROOF=true`
- default mode: fail-closed static guard
- execution mode in 11G: blocked until a later execute prompt
- selected GPU: `nvidia_l4`
- machine type: `g2-standard-4`
- target zone: `northamerica-northeast2-a`
- proof VM: `reeditpro-ai-broll-wan-l4-proof`
- no public IP: required
- idle GPU: forbidden
- cleanup verification: required

## Future Execution Contract

A later execute prompt may use this runner only if it repeats the live quota preflight, repeats private cache readiness, creates only the prompt-scoped no-public-IP L4 VM, downloads only approved private payloads, installs only approved offline dependencies, loads only the approved local Wan Diffusers cache, uses only the deterministic approved fixture prompt ID, keeps any inference output transient, writes sanitized JSON evidence only, deletes the VM, and verifies cleanup.

The future proof may validate a minimal inference canary, but it still must not persist frames, encode video, create generated assets, publish public artifacts, create signed URLs, mutate Supabase, spend credits, unlock beta, unlock production, or claim generated B-roll readiness.

## Callable Static Modes

The runner supports:

- static guard: `npm run ai-video-broll-gen-11g:bounded-inference-proof-runner -- --json`
- confirmation-blocked mode: `npm run ai-video-broll-gen-11g:bounded-inference-proof-runner -- --execute --json`
- wrapper static guard: `npm run external-agent-tool-execute-broll-wan -- --inference-proof --json`
- wrapper confirmation-blocked mode: `npm run external-agent-tool-execute-broll-wan -- --inference-proof --execute --json`

All 11G modes in this prompt keep runtime side effects false.

## Blocked Uses

- `gcpMutatingCommandsExecuted=false`
- `computeVmCreated=false`
- `dependencyInstalledOnVm=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `modelInferenceRun=false`
- `promptEncodingRun=false`
- `denoisingRun=false`
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

## Next Prompt

`AI-VIDEO-BROLL-GEN-11H-INFERENCE-PROOF-EXECUTE: run bounded Wan inference proof with mandatory cleanup, no generated video/no persisted assets`
