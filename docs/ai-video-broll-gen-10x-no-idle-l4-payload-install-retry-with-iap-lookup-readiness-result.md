# AI Video B-roll 10X No-Idle L4 Payload Install Retry With IAP Lookup Readiness Result

Decision: `ai_video_broll_gen_10x_no_idle_l4_payload_install_retry_blocked_runner_parse_cleanup_bug_manual_cleanup_verified`.

AI-VIDEO-BROLL-GEN-10X attempted the bounded no-idle L4 payload/install-readiness proof after 10W added the post-create IAP lookup readiness contract. Mandatory preflight passed, the prompt-scoped `g2-standard-4` VM with one NVIDIA L4 was created in `northamerica-northeast2-a`, and no model import, inference, generated asset, Docker, Supabase, SQL, provider, worker, credit, beta, or production action occurred.

The proof stopped before IAP lookup readiness, Python readiness, wheelhouse transfer, remote payload validation, or offline dependency install because the temporary runner parsed sanitized/truncated `describe` output instead of the raw machine JSON. That local runner bug prevented the runner from recognizing the VM it had just created. Independent exact-name cleanup was then run and verified: the prompt-scoped instance, disk, address, and reservation are absent.

This result does not claim `dry_run_passed` or `generated_local_fixture_passed`.

## Source Evidence

- 10X prompt: `docs/implementation-prompts/prompt-ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness.md`
- 10W result: `docs/ai-video-broll-gen-10w-iap-lookup-readiness-fix-result.md`
- 10V result: `docs/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.md`
- 10U result: `docs/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.md`
- B-roll quota verify result: `docs/ai-video-broll-wan-gpu-global-quota-verify-result.md`
- Private cache manifest: `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`
- 10X result spec: `src/backend/mock/mock-ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result.ts`
- 10X result smoke: `server/smoke/ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result-smoke.ts`

## Preflight

| Check | Result |
| --- | --- |
| Active project | `reeditpro` |
| 10W result smoke | passed |
| 10V result smoke | passed |
| 10U result smoke | passed |
| Wan private cache readiness | passed |
| B-roll GPU quota verification | passed |
| Prompt-scoped proof instance before create | absent |
| Prompt-scoped proof disk before create | absent |
| Prompt-scoped proof address before create | absent |
| Prompt-scoped proof reservation before create | absent |
| Zone `northamerica-northeast2-a` | `UP` |
| Machine type | `g2-standard-4` visible |
| Accelerator | `nvidia-l4` visible |
| Image family | `common-cu129-ubuntu-2404-nvidia-580` resolved |
| Regional `NVIDIA_L4_GPUS` quota | sufficient for one L4 VM |
| Project `GPUS_ALL_REGIONS` quota | sufficient for one L4 VM |
| IAP firewall | present for target tag `ai-video-broll-wan-l4-proof` and TCP `22` |
| Proof service account | present and not disabled |
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
| Post-create instance visibility verified by runner | `false` |
| Post-create `RUNNING` state verified by runner | `false` |
| Post-create no-public-IP recheck completed | `false` |
| Post-create boot disk auto-delete recheck completed | `false` |
| IAP lookup readiness attempted | `false` |
| Python 3.12 readiness checked | `false` |
| Full wheelhouse payload transfer attempted | `false` |
| Remote payload validation attempted | `false` |
| Offline dependency install attempted | `false` |
| Dependency import readiness attempted | `false` |
| Model import attempted | `false` |
| Model inference attempted | `false` |
| Independent cleanup attempted | `true` |
| Independent cleanup verified | `true` |

## Final Resource State

| Resource | Present after independent cleanup |
| --- | --- |
| Proof instance | `false` |
| Proof disk | `false` |
| Proof address | `false` |
| Proof reservation | `false` |

## Failure Analysis And Prevention

What failed:

- The temporary 10X runner sanitized and truncated `gcloud compute instances describe --format=json` output before parsing it.
- The runner then tried to parse the sanitized `stdoutSummary`, not the raw stdout.
- Because the parse failed, the runner did not mark the instance visible or running and did not reach the bounded IAP lookup readiness loop.
- The runner cleanup path also depended on that same parsed describe result, so it reported cleanup as not verified even though the prompt-scoped VM still existed.

What did not fail:

- The source-result smokes passed.
- Cache readiness passed.
- Live quota verification passed.
- Target zone, machine type, accelerator type, image family, IAP firewall, and proof service account were present.
- One prompt-scoped L4 VM could be created again.
- Independent exact-name cleanup succeeded and verified absence of the instance, disk, address, and reservation.

What to do better next time:

- Do not rerun the L4 proof until the runner is fixed in a no-VM/no-model/no-inference step.
- Parse raw command stdout before sanitizing or truncating log summaries.
- Use compact machine-readable post-create probes such as `--format=json(status,networkInterfaces,disks)` or exact `--format=value(...)` reads for VM state.
- Store sanitized summaries only after decisions are made from raw data.
- If VM creation returns success or `computeVmCreateAttempted=true`, cleanup must call exact-name delete for the prompt-scoped VM even when describe parsing fails.
- Cleanup verification must use exact-name absence checks and treat 404/not-found as absence.

## Runtime Side Effects

Allowed side effects from this prompt:

- Read-only GCP checks: `true`
- Prompt-scoped GPU VM create/delete: `true`
- Prompt-scoped boot disk create/delete: `true`
- Independent cleanup verification: `true`

Blocked and still false:

- `publicIpVerifiedAfterCreate=false`
- `iapLookupReadinessPassed=false`
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

`AI-VIDEO-BROLL-GEN-10Y-RUNNER-RAW-JSON-CLEANUP-FIX: fix L4 payload/install runner to parse raw describe JSON before sanitizing logs and delete prompt VM after any create attempt, no VM/no model/no inference`
