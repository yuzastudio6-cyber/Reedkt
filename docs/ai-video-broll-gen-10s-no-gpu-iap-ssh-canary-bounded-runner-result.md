# AI Video B-roll 10S No-GPU IAP SSH Canary Bounded Runner Result

Decision: `ai_video_broll_gen_10s_no_gpu_iap_ssh_canary_blocked_by_gcloud_ssh_flag_conflict_cleanup_verified`.

AI-VIDEO-BROLL-GEN-10S ran the fixed bounded no-GPU IAP SSH canary runner after 10R-FIX added hard timeouts, durable summaries, and cleanup verification. The result is useful but blocked: the no-GPU no-public-IP canary VM was created and deleted successfully, but all SSH attempts failed before testing real IAP access because the runner combined mutually exclusive `gcloud compute ssh` flags.

This result does not prove an OS Login, SSH key, IAP firewall, or service account access failure. It proves the runner command must be repaired before another canary attempt. It does not create a GPU VM, run Docker, transfer model payloads, import Wan, run inference, create generated assets, touch Supabase, execute SQL, create signed URLs, mutate credits, unlock beta/production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- 10S prompt: `docs/implementation-prompts/prompt-ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-execute.md`
- 10R-FIX runner result: `docs/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-result.md`
- 10R-FIX runner CLI: `server/cli/ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner.ts`
- 10R-FIX runner spec: `src/backend/mock/mock-ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner.ts`
- 10S result spec: `src/backend/mock/mock-ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result.ts`
- 10S result smoke: `server/smoke/ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result-smoke.ts`

## Preflight

| Check | Result |
| --- | --- |
| Local runner smoke | passed |
| Wan private cache readiness | passed |
| B-roll quota verification | passed |
| External-agent blocker preflight | passed |
| Proof service account | present and not disabled; value not stored |
| Pre-existing canary instance | `false` |
| Pre-existing canary disk | `false` |
| Pre-existing canary address | `false` |
| Pre-existing canary reservation | `false` |

## Runtime Attempt

| Item | Result |
| --- | --- |
| Runner command executed | `true` |
| Canary create attempted | `true` |
| Canary created | `true` |
| Machine type | `e2-standard-2` |
| GPU accelerator requested | `false` |
| Public IP requested | `false` |
| SSH attempted | `true` |
| SSH attempt count | `3` |
| SSH success evidence captured | `false` |
| SSH failure evidence captured | `true` |
| Cleanup attempted | `true` |
| Cleanup verified | `true` |

## Failure Analysis

The runner failed before reaching a real IAP SSH access test. The sanitized error was:

```text
argument --internal-ip: At most one of --internal-ip | --tunnel-through-iap can be specified
```

What failed:

- The runner combined mutually exclusive `--internal-ip` and `--tunnel-through-iap` flags.
- The SSH success marker was not captured.
- Real IAP SSH access was not tested because `gcloud` rejected the command arguments.

What did not fail:

- No-GPU no-public-IP VM creation worked.
- The prompt-scoped canary cleanup path worked.
- Instance, disk, address, and reservation absence were verified after cleanup.

## Final Resource State

| Resource | Present after cleanup |
| --- | --- |
| Canary instance | `false` |
| Canary disk | `false` |
| Canary address | `false` |
| Canary reservation | `false` |

## Runtime Side Effects

Allowed side effects from this prompt:

- Read-only GCP checks: `true`
- Prompt-scoped no-GPU canary VM create/delete: `true`
- Prompt-scoped boot disk create/delete: `true`
- Cleanup verification: `true`

Blocked and still false:

- `gpuVmCreated=false`
- `gpuAttached=false`
- `publicIpCreated=false`
- `sshSessionOpened=false`
- `modelImportRun=false`
- `modelInferenceRun=false`
- `generatedAssetsCreated=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `generatedLocalFixturePassedClaimed=false`

## Prevention Before Next Runtime Attempt

- Remove `--internal-ip` when `--tunnel-through-iap` is used.
- Add a smoke assertion that the bounded runner never combines those mutually exclusive flags.
- Rerun the same no-GPU canary shape after the flag fix.
- Do not create a GPU VM until the no-GPU canary captures real SSH pass/fail evidence and cleanup passes.

## Recommended Next Prompt

`AI-VIDEO-BROLL-GEN-10T-IAP-SSH-FLAG-FIX: remove mutually exclusive IAP SSH flags from the bounded no-GPU canary runner, no VM/no model/no inference`
