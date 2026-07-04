# AI Video B-roll 11F Inference Boundary Plan

Decision: `ai_video_broll_gen_11f_inference_boundary_plan_ready_for_runner_implementation_no_execution`.

AI-VIDEO-BROLL-GEN-11F defines the future bounded Wan/Wan2.1 inference proof boundary after the 11B import/load proof passed and 11C accepted it as external-agent evidence. This is plan/spec/smoke only. It does not create a VM, does not run Wan inference, encode prompts, denoise, decode frames, run FFmpeg, create video frames, create generated video, create generated assets, create public artifacts, create signed URLs, mutate Supabase, execute SQL, call providers, dispatch workers, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Rules

- ReeditPro plans before it edits.
- Expensive AI editing, rendering, or generation must not start until the user approves the edit plan and credit estimate.
- External agents must use structured tool envelopes and approved fixture inputs, not raw chat.
- Wan is the primary open-source animation/B-roll route, but Remotion still owns final composition.
- GPU work must be prompt-scoped, no-idle, no-public-IP, and cleanup-verified.
- This plan does not authorize paid production, beta, public delivery, storage mutation, worker dispatch, provider calls, or generated asset creation.

## Reviewed Evidence

- 11C review: `docs/ai-video-broll-gen-11c-model-import-result-review.md`
- 11C review spec: `src/backend/mock/mock-ai-video-broll-gen-11c-model-import-result-review.ts`
- 11B result: `docs/ai-video-broll-gen-11b-model-import-proof-execution-result.md`
- 11B result spec: `src/backend/mock/mock-ai-video-broll-gen-11b-model-import-proof-execution-result.ts`
- 11B runner: `server/cli/ai-video-broll-gen-11b-l4-model-import-runner.ts`
- External-agent B-roll wrapper: `server/cli/external-agent-tool-execute-broll-wan.ts`
- External-agent readiness rollup: `docs/external-agent-tool-execution-readiness-rollup.md`

## Boundary Decision

11F accepts that the next B-roll implementation may be a bounded inference-proof runner, but not an inference execution yet.

The future runner may be implemented in a later prompt only if it:

- repeats live quota preflight before any VM action;
- repeats private cache readiness before any VM action;
- creates only the prompt-scoped no-public-IP L4 VM;
- installs dependencies only from the approved private wheelhouse;
- loads the approved private Wan Diffusers cache with local-files-only behavior;
- uses a deterministic internal approved fixture prompt, not raw chat;
- keeps any future inference result transient and non-persisted;
- writes only sanitized JSON evidence;
- deletes the prompt-scoped VM before completion;
- verifies cleanup.

## Future Execution Boundary

The future execution prompt is not part of 11F. It must remain separately approved and must define hard stops before generated-video readiness.

Future bounded inference proof may eventually prove:

- prompt encoding can start from an approved synthetic fixture prompt;
- one minimal Wan inference canary can run under explicit confirmation;
- runtime cleanup still succeeds after inference pressure;
- no output is persisted as a generated asset.

Future bounded inference proof must not claim:

- generated B-roll video readiness;
- generated asset readiness;
- public artifact readiness;
- final render/export readiness;
- beta or production readiness;
- paid production readiness.

## Required Future Runner Shape

- command name: `ai-video-broll-gen-11g:bounded-inference-proof-runner`
- external wrapper: `external-agent-tool-execute-broll-wan`
- confirmation env: `REEDITPRO_CONFIRM_BROLL_11G_INFERENCE_PROOF=true`
- wrapper confirmation env: `REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_INFERENCE_PROOF=true`
- default mode: fail-closed static guard
- execution mode: blocked until a later execute prompt records explicit permission
- selected GPU: `nvidia_l4`
- machine type: `g2-standard-4`
- target zone: `northamerica-northeast2-a`
- proof VM: `reeditpro-ai-broll-wan-l4-proof`
- no public IP: required
- idle GPU: forbidden
- cleanup verification: required

## Blocked Uses

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

## Failure Planning

If the future implementation or execution finds memory pressure, unsupported parameters, missing scheduler fields, IAP transport failure, quota drift, cache drift, or cleanup failure, it must stop and record a fix prompt. It must not silently switch to a larger GPU, enable public IP, reuse an existing VM, run Docker, download models, write media, or persist output.

## Next Prompt

`AI-VIDEO-BROLL-GEN-11G-INFERENCE-PROOF-RUNNER: implement bounded Wan inference proof runner, no execution/no generated video`
