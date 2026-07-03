# AI Video B-roll 10V No-Idle L4 Payload Install Retry Result

Decision: `ai_video_broll_gen_10v_no_idle_l4_payload_install_retry_blocked_iap_instance_lookup_cleanup_verified`.

AI-VIDEO-BROLL-GEN-10V retried the bounded no-idle L4 payload/install-readiness proof after 10U proved the no-GPU IAP SSH canary path. The prompt-scoped `g2-standard-4` VM with one NVIDIA L4 was created in `northamerica-northeast2-a`, the VM had no public IP, and cleanup was verified. The proof stopped before payload transfer because the first IAP SSH precheck failed with `Failed to lookup instance`.

This result does not run model import, run inference, create generated video/assets, run Docker, mutate Supabase, execute SQL, create signed URLs, mutate credits, unlock beta/production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- 10V prompt: `docs/implementation-prompts/prompt-ai-video-broll-gen-10v-no-idle-l4-payload-install-retry.md`
- 10U result: `docs/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.md`
- 10U result spec: `src/backend/mock/mock-ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.ts`
- 10P result: `docs/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.md`
- private cache manifest: `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`
- 10V result spec: `src/backend/mock/mock-ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.ts`
- 10V result smoke: `server/smoke/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result-smoke.ts`

## Preflight

| Check | Result |
| --- | --- |
| Active project | `reeditpro` |
| 10U result smoke | passed |
| Wan private cache readiness smoke | passed |
| B-roll GPU quota verification smoke | passed |
| Prompt-scoped proof instance before create | absent |
| Prompt-scoped proof disk before create | absent |
| Prompt-scoped proof address before create | absent |
| Prompt-scoped proof reservation before create | absent |
| Zone `northamerica-northeast2-a` | `UP` |
| Machine type | `g2-standard-4` visible |
| Accelerator | `nvidia-l4` visible |
| Image family | `common-cu129-ubuntu-2404-nvidia-580` resolved |
| Regional `NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |
| IAP firewall | present for target tag `ai-video-broll-wan-l4-proof` and TCP `22` |
| Proof service account | present and not reported disabled; value not stored |
| Python 3.12 wheelhouse manifest | present |

## Runtime Attempt

| Item | Result |
| --- | --- |
| Prompt-scoped L4 VM create attempted | `true` |
| Prompt-scoped L4 VM created | `true` |
| Machine type | `g2-standard-4` |
| Accelerator | one `nvidia-l4` |
| Zone | `northamerica-northeast2-a` |
| Public IP requested | `false` |
| Public IP present after create | `false` |
| IAP SSH precheck attempted | `true` |
| IAP SSH precheck passed | `false` |
| Failure class | `iap_instance_lookup_failed_before_payload_transfer` |
| Failure marker | `Failed to lookup instance` |
| Python 3.12 readiness checked | `false` |
| Full wheelhouse payload transfer attempted | `false` |
| Remote payload validation attempted | `false` |
| Offline dependency install attempted | `false` |
| Dependency spec readiness attempted | `false` |
| Model import attempted | `false` |
| Model inference attempted | `false` |
| Cleanup attempted | `true` |
| Cleanup verified | `true` |

## Final Resource State

| Resource | Present after cleanup |
| --- | --- |
| Proof instance | `false` |
| Proof disk | `false` |
| Proof address | `false` |
| Proof reservation | `false` |

## Failure Analysis And Prevention

What failed:

- The first IAP SSH command failed before opening a remote shell with `Failed to lookup instance`.
- The failure happened after successful L4 VM creation and no-public-IP verification, and before Python 3.12 readiness, payload transfer, or offline install.
- This is a different failure class from the earlier 10P publickey blocker. 10U proved the general no-GPU IAP SSH command path, while 10V shows the immediate post-create GPU VM path still needs a readiness wait or lookup stabilization guard.

What did not fail:

- Project, quota, target zone, machine type, accelerator type, image family, firewall, and cache preflight were sufficient to start the proof.
- The selected zone could create the no-public-IP L4 VM again.
- Cleanup worked and no prompt-scoped VM, disk, address, or reservation remains.

What to do better next time:

- Do not repeat the immediate SSH attempt right after create.
- Add a bounded post-create readiness phase that waits for the instance `RUNNING` state, confirms the network interface remains private-only, and waits for IAP instance lookup readiness before the first SSH command.
- Keep the fix no-execution first: update the runner/plan contract and smoke coverage before another paid L4 lifecycle.
- On the next runtime retry, use bounded retry/backoff for IAP lookup while preserving mandatory cleanup and no model import/no inference.

## Runtime Side Effects

Allowed side effects from this prompt:

- Read-only GCP checks: `true`
- Prompt-scoped GPU VM create/delete: `true`
- Prompt-scoped boot disk create/delete: `true`
- Cleanup verification: `true`

Blocked and still false:

- `publicIpCreated=false`
- `iapTransferExecuted=false`
- `fullWheelhousePayloadTransferred=false`
- `remoteWheelhouseValidationRun=false`
- `dependencyInstalledOnVm=false`
- `dependencyImportReadinessRun=false`
- `dockerRun=false`
- `modelDownloaded=false`
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
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Recommended Next Prompt

`AI-VIDEO-BROLL-GEN-10W-IAP-LOOKUP-READINESS-FIX: add bounded post-create IAP instance lookup readiness before the next L4 payload/install retry, no VM/no model/no inference`
