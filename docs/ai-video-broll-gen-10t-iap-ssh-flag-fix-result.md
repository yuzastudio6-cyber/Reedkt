# AI Video B-roll 10T IAP SSH Flag Fix Result

Decision: `ai_video_broll_gen_10t_iap_ssh_flag_fix_applied_no_execution`.

AI-VIDEO-BROLL-GEN-10T repaired the bounded no-GPU IAP SSH canary runner after 10S proved the runner was combining mutually exclusive `gcloud compute ssh` flags. The runner now keeps `--tunnel-through-iap` and removes `--internal-ip` from the SSH attempt command.

This fix does not create a VM, open SSH, run Docker, transfer payloads, install dependencies, import Wan, run inference, create generated video/assets, mutate Supabase, execute SQL, create signed URLs, mutate credits, unlock beta/production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- 10S result: `docs/ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result.md`
- 10S result spec: `src/backend/mock/mock-ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result.ts`
- 10T prompt: `docs/implementation-prompts/prompt-ai-video-broll-gen-10t-iap-ssh-flag-fix.md`
- Runner CLI: `server/cli/ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner.ts`
- 10R-FIX smoke: `server/smoke/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-smoke.ts`
- 10T result spec: `src/backend/mock/mock-ai-video-broll-gen-10t-iap-ssh-flag-fix-result.ts`
- 10T result smoke: `server/smoke/ai-video-broll-gen-10t-iap-ssh-flag-fix-result-smoke.ts`

## What Failed In 10S

The 10S no-GPU canary created and cleaned up the prompt-scoped no-public-IP VM, but SSH failed before real access could be tested. The sanitized error was:

```text
argument --internal-ip: At most one of --internal-ip | --tunnel-through-iap can be specified
```

That means the correct root cause was a local runner argument conflict, not a proven OS Login, SSH-key, IAP firewall, or service-account access failure.

## What Changed In 10T

| Area | Result |
| --- | --- |
| `--tunnel-through-iap` retained | `true` |
| `--internal-ip` removed from SSH command | `true` |
| Runner combines mutually exclusive flags | `false` |
| Smoke assertion added for flag compatibility | `true` |
| VM created by this prompt | `false` |
| SSH opened by this prompt | `false` |
| GPU VM created | `false` |
| Model inference run | `false` |
| Generated assets created | `false` |

## Prevention Before Next Runtime Attempt

- Keep the runner smoke assertion that `--tunnel-through-iap` is present.
- Keep the runner smoke assertion that `--internal-ip` is absent from the IAP SSH command.
- Rerun the same bounded no-GPU canary shape before any GPU VM or payload/install attempt.
- If the no-GPU rerun fails, classify the new failure from durable SSH evidence instead of guessing from 10S.

## Runtime Side Effects

All runtime side-effect gates remain false for 10T:

- `gcpMutatingCommandsExecutedByThisPrompt=false`
- `computeVmCreatedByThisPrompt=false`
- `sshSessionOpenedByThisPrompt=false`
- `gpuVmCreated=false`
- `dockerRun=false`
- `dependencyInstalledOnVm=false`
- `modelImportRun=false`
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
- `generatedLocalFixturePassedClaimed=false`

## Recommended Next Prompt

`AI-VIDEO-BROLL-GEN-10U-NO-GPU-IAP-SSH-CANARY-RERUN: rerun the bounded no-GPU IAP SSH canary after removing mutually exclusive flags; no GPU/no model/no inference`
