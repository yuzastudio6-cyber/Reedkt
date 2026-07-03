# AI Video B-roll 10R No-GPU IAP SSH Canary Result

Decision: `ai_video_broll_gen_10r_no_gpu_iap_ssh_canary_interrupted_cleanup_repaired_runner_fix_required`.

AI-VIDEO-BROLL-GEN-10R attempted the approved no-public-IP, non-GPU IAP SSH canary after 10Q narrowed the 10P blocker to the SSH identity path. The preflight passed, one prompt-scoped non-GPU canary VM was created, but the SSH canary runner did not produce a durable pass/fail summary before it was interrupted. A follow-up cleanup check found the canary instance and boot disk still present. Cleanup was then repaired by deleting only the named canary VM and verifying the instance, disk, address, and reservation were absent.

This result does not prove IAP SSH is fixed or broken. It proves the canary runner itself needs a stricter bounded execution wrapper before any further GPU VM attempt.

## Source Evidence

- `docs/implementation-prompts/prompt-ai-video-broll-gen-10r-no-gpu-iap-ssh-canary.md`
- `docs/ai-video-broll-gen-10q-iap-oslogin-access-fix-result.md`
- `docs/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.md`
- `docs/ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result.md`
- `docs/external-agent-tool-execution-readiness-rollup.md`

## Preflight Result

| Area | Result |
| --- | --- |
| Checked at | `2026-07-02T23:29:23Z` |
| Project | `reeditpro` matched |
| Target region | `northamerica-northeast2` |
| Target zone | `northamerica-northeast2-a` |
| Canary name | `reeditpro-ai-broll-iap-ssh-canary` |
| Machine type | `e2-standard-2` |
| Accelerator | none |
| Public IP | forbidden |
| IAP firewall | present, enabled, source `35.235.240.0/20`, target tag `ai-video-broll-wan-l4-proof`, TCP `22` |
| Project OS Login | not enabled in project metadata |
| Project block project SSH keys | not enabled in project metadata |
| Project metadata keys | `ssh-keys` |
| Local `gcloud` SSH public key | present; key material not printed |
| Project metadata contains local `gcloud` SSH public key | `false` |
| Machine type visible | `true` |
| Deep learning image ready | `true` |
| Pre-existing canary instance | `false` |
| Pre-existing canary disk | `false` |
| Pre-existing canary address | `false` |
| Pre-existing canary reservation | `false` |
| Preflight passed | `true` |

No user email, service account email, SSH public key, private key, access token, metadata value, or credential value is stored in this packet.

## Runtime Attempt

| Runtime area | Result |
| --- | --- |
| Non-GPU canary create attempted | `true` |
| Non-GPU canary observed after interrupt | `true` |
| Boot disk observed after interrupt | `true` |
| GPU VM created | `false` |
| GPU attached | `false` |
| Public IP created | `false` |
| Capacity reservation created | `false` |
| Model payload transferred | `false` |
| Dependency install run | `false` |
| Model import run | `false` |
| Model inference run | `false` |
| Generated asset created | `false` |
| SSH success evidence captured | `false` |
| SSH failure evidence captured | `false` |
| Durable canary summary captured | `false` |
| Initial trap cleanup completed | `false` |
| Follow-up cleanup repaired | `true` |
| Final cleanup verified | `true` |

Final cleanup verification:

```text
instancePresent=false
diskPresent=false
addressPresent=false
reservationPresent=false
cleanupVerified=true
```

## Failure Analysis

What failed:

- The 10R runtime runner did not emit a durable sanitized result summary before interruption.
- The SSH attempt did not capture reliable pass/fail evidence.
- The interrupt left the canary instance and boot disk present until a separate cleanup repair deleted them.

What did not fail:

- The no-GPU preflight found the target project, zone, image, firewall, and no-pre-existing-resource posture acceptable.
- The canary used a non-GPU machine type and no public IP.
- Follow-up cleanup successfully removed the prompt-scoped canary instance and boot disk.

Root cause confirmed: `false`.

Most likely failure class:

- bounded-runner design, not model/runtime readiness.
- The runner allowed the `gcloud compute ssh --tunnel-through-iap` path to outlive the intended bounded window and did not persist a summary before cleanup.
- The interrupt path did not make cleanup verification durable enough to rely on the original trap alone.

## What To Do Better Next Time

- Wrap every SSH readiness attempt in a hard command timeout that is shorter than the prompt budget.
- Write a sanitized JSON result file after each create, SSH attempt, and cleanup step.
- Capture explicit `sshSuccessEvidenceCaptured`, `sshFailureEvidenceCaptured`, and `cleanupVerified` fields before exiting.
- Run at most one no-GPU canary VM and delete only that VM.
- Emit a final cleanup summary even if SSH times out, fails, or the wrapper is interrupted.
- If SSH returns `Permission denied (publickey)`, record that exact sanitized blocker and route to an SSH key or OS Login metadata repair prompt.
- If SSH passes, record the pass and only then route back to a bounded L4 payload/install retry.

## What This Proves

- A non-GPU no-public-IP canary VM could be created in the selected zone during this attempt.
- The canary cleanup can be repaired safely when the resource name is known and prompt-scoped.
- The current canary runner is not safe enough for another GPU attempt because it lacks hard timeouts and durable summary capture.

## What This Does Not Prove

- This does not prove IAP SSH is fixed.
- This does not prove IAP SSH is still blocked by public-key authentication.
- This does not prove wheelhouse payload transfer, dependency install readiness, model import, model load, inference, generated video, generated assets, worker dispatch, Supabase writes, SQL, storage, signed URLs, credits, beta, or production readiness.
- This does not claim B-roll is external-agent executable end to end.

## Runtime Flags

- `preflightPassed=true`
- `computeVmCreateAttempted=true`
- `computeVmCreated=true`
- `nonGpuCanaryCreated=true`
- `diskCreated=true`
- `gpuVmCreated=false`
- `gpuAttached=false`
- `publicIpCreated=false`
- `sshSessionOpened=false`
- `sshSuccessEvidenceCaptured=false`
- `sshFailureEvidenceCaptured=false`
- `durableCanarySummaryCaptured=false`
- `initialCleanupTrapCompleted=false`
- `followUpCleanupRepairExecuted=true`
- `cleanupVerified=true`
- `iapTransferExecuted=false`
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
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Next Prompt

`AI-VIDEO-BROLL-GEN-10R-FIX-IAP-SSH-CANARY-BOUNDED-RUNNER: fix bounded no-GPU IAP SSH canary runner timeout and durable cleanup-summary capture, no GPU/no model/no inference`
