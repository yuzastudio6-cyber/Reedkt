# AI-VIDEO-BROLL-GEN-10S-NO-GPU-IAP-SSH-CANARY-BOUNDED-RUNNER-EXECUTE

Run the fixed bounded no-GPU IAP SSH canary runner after 10R-FIX added hard timeouts, durable sanitized summaries, and mandatory cleanup verification.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10S-NO-GPU-IAP-SSH-CANARY-BOUNDED-RUNNER-EXECUTE: run the fixed bounded no-GPU IAP SSH canary with hard timeouts, durable summaries, and mandatory cleanup; no GPU/no model/no inference`.

This prompt may create at most one prompt-scoped non-GPU VM after fresh preflight and explicit confirmation. It must not create a GPU VM, attach GPUs, transfer model payloads, install dependencies, run Docker, import Wan, run inference, create generated video/assets, mutate Supabase, execute SQL, create signed URLs, mutate credits, or unlock beta/production.

## Required Source Evidence

- `docs/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-result.md`
- `server/cli/ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner.ts`
- `src/backend/mock/mock-ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner.ts`
- `server/smoke/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-smoke.ts`
- `docs/ai-video-broll-gen-10r-no-gpu-iap-ssh-canary-result.md`

## Required Execution Shape

- Run only `npm run ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner -- --execute --json` with the explicit confirmation env set by the future prompt.
- Use no GPU accelerator.
- Use no public IP.
- Use the prompt-scoped canary name `reeditpro-ai-broll-iap-ssh-canary`.
- Use hard SSH attempt timeouts.
- Persist the sanitized summary after each phase.
- Delete only the prompt-scoped canary.
- Verify instance, disk, address, and reservation absence before completion.

## Required Result

If SSH succeeds and cleanup verifies, record the pass and route to a bounded L4 payload/install retry.

If SSH fails with public-key evidence, record the sanitized blocker and route to an SSH key or OS Login metadata repair prompt.

If cleanup is not verified, do not claim pass; route to cleanup repair.

Always keep `gpuVmCreated=false`, `modelImportRun=false`, `modelInferenceRun=false`, `generatedAssetsCreated=false`, and `generatedLocalFixturePassedClaimed=false`.
