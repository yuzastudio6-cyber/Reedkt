# AI Video B-roll 10U No-GPU IAP SSH Canary Rerun Result

Decision: `ai_video_broll_gen_10u_no_gpu_iap_ssh_canary_rerun_passed_cleanup_verified`.

AI-VIDEO-BROLL-GEN-10U reran the bounded no-GPU, no-public-IP IAP SSH canary after 10T removed the mutually exclusive `gcloud compute ssh` flag pairing. The rerun passed: the prompt-scoped non-GPU canary VM was created, the IAP SSH command captured the canary success marker, and cleanup was verified by the runner plus independent absence probes.

This result does not create a GPU VM, run Docker, transfer model payloads, install dependencies, import Wan, run inference, create generated video/assets, mutate Supabase, execute SQL, create signed URLs, mutate credits, unlock beta/production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- 10U prompt: `docs/implementation-prompts/prompt-ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun.md`
- 10T result: `docs/ai-video-broll-gen-10t-iap-ssh-flag-fix-result.md`
- 10T result spec: `src/backend/mock/mock-ai-video-broll-gen-10t-iap-ssh-flag-fix-result.ts`
- bounded canary runner: `server/cli/ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner.ts`
- 10R-FIX runner smoke: `server/smoke/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-smoke.ts`
- 10U result spec: `src/backend/mock/mock-ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.ts`
- 10U result smoke: `server/smoke/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result-smoke.ts`

## Preflight

| Check | Result |
| --- | --- |
| 10T flag-fix smoke | passed |
| 10R bounded runner smoke | passed |
| Wan private cache readiness | passed |
| B-roll quota verification | passed |
| External-agent blocker preflight | passed |
| B-roll wrapper static guard | passed |
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
| SSH success evidence captured | `true` |
| SSH failure evidence captured | `false` |
| Cleanup attempted | `true` |
| Cleanup verified | `true` |

## Failure Analysis And Prevention

What failed before:

- 10P proved `northamerica-northeast2-a` could create and clean up the no-public-IP L4 VM, but IAP SSH failed with a publickey/OS Login blocker before payload transfer.
- 10Q narrowed that to an unproven SSH identity path without confirming a root cause.
- 10R proved the original no-GPU canary flow could be interrupted before durable SSH pass/fail evidence.
- 10S then produced durable evidence, but it exposed a local runner command-contract bug instead of testing real IAP SSH access: `--internal-ip` was combined with `--tunnel-through-iap`.

What is fixed now:

- 10T removed the mutually exclusive `--internal-ip` flag from the IAP SSH command.
- 10U reran the same no-GPU no-public-IP canary and captured the remote success marker.
- Cleanup was verified by the runner and by independent post-run absence probes for the canary instance, disk, address, and reservation.

How to avoid repeating this failure:

- Keep the runner smoke assertion that `--tunnel-through-iap` is present and `--internal-ip` is absent.
- Keep the bounded runner summary path for every phase so interruptions cannot erase the failure class.
- Before the next GPU VM attempt, rerun quota/cache checks and pre-existing resource absence checks.
- The next GPU attempt must remain no-idle and prompt-scoped: create only after preflight, use no public IP, run only payload/install readiness, then delete and verify cleanup.

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
- IAP SSH canary command: `true`
- Cleanup verification: `true`

Blocked and still false:

- `gpuVmCreated=false`
- `gpuAttached=false`
- `publicIpCreated=false`
- `modelPayloadTransferred=false`
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

## Route Normalization

The older bounded runner success route emitted a legacy `AI-VIDEO-BROLL-GEN-10U-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY` label. Because 10U is now the no-GPU IAP SSH rerun result, this packet normalizes the next implementation prompt to 10V to avoid duplicate prompt labels and prevent external agents from looping backward.

## Recommended Next Prompt

`AI-VIDEO-BROLL-GEN-10V-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY: retry bounded no-idle L4 payload/install readiness after no-GPU IAP SSH canary passed; mandatory cleanup, no model import/no inference`
