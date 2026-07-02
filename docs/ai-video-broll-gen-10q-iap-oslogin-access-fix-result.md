# AI Video B-roll 10Q IAP OS Login Access Fix Result

Decision: `ai_video_broll_gen_10q_iap_oslogin_access_fix_read_only_inconclusive_non_gpu_canary_required`.

AI-VIDEO-BROLL-GEN-10Q ran a no-GPU, no-VM, read-only diagnosis after 10P created a no-public-IP `g2-standard-4` plus one `nvidia_l4` VM in `northamerica-northeast2-a`, then failed to open IAP SSH with `Permission denied (publickey)`.

The diagnosis does not justify another GPU VM attempt yet. Read-only evidence says the resource/capacity path improved, IAP firewall evidence is still present, and the active account can read/write the relevant Compute metadata surfaces. The remaining uncertainty is the SSH identity path itself: project OS Login is not enabled, the project uses metadata SSH keys, the local `gcloud` SSH public key exists, and the current project metadata does not contain that local key. Because this check happens after the 10P VM was deleted, the key mismatch is strong access-path evidence but not a complete root-cause proof.

The next step should be a bounded no-public-IP non-GPU IAP SSH canary that uses the same image family, target tag, proof service account, and metadata posture. It must be created only in a later explicit prompt, then deleted with cleanup verification. Do not create another L4 VM until that canary passes or produces a more precise no-GPU fix.

## Source Evidence

- `docs/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.md`
- `docs/ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result.md`
- `docs/ai-video-broll-gen-10o-payload-install-resource-availability-fix-result.md`
- `docs/implementation-prompts/prompt-ai-video-broll-gen-10q-iap-oslogin-access-fix.md`
- `docs/external-agent-tool-execution-readiness-rollup.md`

## Read-Only Checks

| Area | Result |
| --- | --- |
| Checked at | `2026-07-02T22:00:33Z` |
| Project | `reeditpro` matched |
| Token refresh | passed with stdout suppressed |
| Active account | present; value not stored |
| Proof service account | readable and active; value not stored |
| IAP firewall | present, enabled, source `35.235.240.0/20`, target tag `ai-video-broll-wan-l4-proof`, TCP `22` |
| Project OS Login | not enabled in project metadata |
| Project block project SSH keys | not enabled in project metadata |
| Project metadata keys | `ssh-keys` only |
| Project SSH key line count | `1` |
| Local `gcloud` SSH public key | present |
| Project metadata contains local `gcloud` SSH public key | `false` |
| OS Login profile read | passed |
| OS Login profile has POSIX account | `true` |
| OS Login SSH key listing | passed |
| OS Login SSH key count | `1` |
| Policy Troubleshooter: `compute.projects.setCommonInstanceMetadata` | granted |
| Policy Troubleshooter: `compute.instances.setMetadata` | granted |
| Policy Troubleshooter: `compute.instances.create` | granted |
| Policy Troubleshooter: proof service account act-as | granted |
| Policy Troubleshooter: project-level IAP permission | inconclusive for this resource shape |

No service account email, user email, public key, access token, private key, project metadata value, or credential value is stored in this packet.

## Comparison With 10I And 10P

| Evidence | 10I `us-west4-c` | 10P `northamerica-northeast2-a` | 10Q diagnosis |
| --- | --- | --- | --- |
| No-public-IP VM create | passed | passed | no VM created |
| IAP transport | passed | reached SSH public-key auth | firewall still present |
| SSH session | opened | rejected public key | current metadata key mismatch found |
| Payload transfer | manifest only passed | not attempted | not attempted |
| Cleanup | verified | verified | no cleanup needed |

## Failure Analysis

What failed:

- 10P reached SSH authentication but the VM rejected the key with `Permission denied (publickey)`.
- Full wheelhouse payload transfer, remote payload validation, offline dependency install, dependency import readiness, model import, model inference, and generated asset creation never started.

What did not fail:

- 10P proved `northamerica-northeast2-a` could create the selected no-public-IP L4 shape once.
- IAP firewall evidence is still present.
- The active account has read-only evidence of permission to create instances, write instance metadata, write project metadata, and act as the proof service account.
- The proof service account remains readable and active.
- Cleanup remains verified.

Most likely class:

- SSH key/metadata propagation, guest-agent readiness, username mapping, or image metadata behavior.
- A missing IAP tunnel permission is less likely because 10P reached SSH public-key authentication rather than failing before tunnel establishment.
- A missing service-account act-as permission is unlikely because Policy Troubleshooter reports the proof service account act-as check as granted.
- A missing metadata-write permission is unlikely because Policy Troubleshooter reports project and instance metadata write checks as granted, but the current metadata key mismatch still needs a live canary because key expiration or post-run cleanup may have changed state after 10P.

Root cause confirmed: `false`.

## Required Next-Time Fix

- Do not create another GPU VM until a no-GPU IAP SSH canary proves the access path.
- The canary should use the same deep learning image family, proof service account, IAP target tag, no-public-IP setting, and boot-disk auto-delete posture.
- The canary should run only a tiny SSH readiness command, such as a sanitized echo and Python version check.
- The canary must delete only the VM it creates and verify instance/disk/address/reservation absence before completion.
- If the canary fails with the same public-key blocker, the next prompt should repair the SSH-key/OS Login metadata path explicitly before any GPU lifecycle.
- If the canary passes, the next prompt can return to a bounded L4 payload/install retry with mandatory cleanup.

## Runtime Flags

- `gcpReadOnlyCommandsExecuted=true`
- `policyTroubleshooterReadOnlyChecksExecuted=true`
- `osLoginProfileRead=true`
- `osLoginKeysListed=true`
- `computeVmCreated=false`
- `gpuVmCreated=false`
- `nonGpuCanaryCreated=false`
- `diskCreated=false`
- `sshSessionOpened=false`
- `iapTransferExecuted=false`
- `iamMutated=false`
- `osLoginKeyAdded=false`
- `projectMetadataMutated=false`
- `instanceMetadataMutated=false`
- `firewallMutated=false`
- `serviceAccountKeyCreated=false`
- `dockerRun=false`
- `dependencyInstalledOnVm=false`
- `modelImportRun=false`
- `modelInferenceRun=false`
- `generatedVideoCreated=false`
- `generatedAssetsCreated=false`
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

## What This Proves

- 10Q proves the blocker is no longer GPU quota or target-zone capacity.
- 10Q narrows the access issue to the SSH identity path and its interaction with project metadata, OS Login profile state, image behavior, and gcloud key handling.
- 10Q proves the next step should be a non-GPU canary, not another paid L4 attempt.

## What This Does Not Prove

- This does not prove IAP SSH is fixed.
- This does not prove OS Login key propagation.
- This does not prove full wheelhouse payload transfer, remote payload validation, offline dependency install, dependency import readiness, model import, model load, inference, generated video, generated assets, media processing, or final B-roll execution readiness.
- This does not approve another GPU VM, public IP, always-on GPU, capacity reservation, IAM mutation, OS Login key mutation, project metadata mutation, Docker, dependency install, model import, model inference, generated assets, Supabase, SQL, storage, signed URLs, credits, beta, or production.
- This does not claim B-roll is external-agent executable end to end.

## Next Prompt

`AI-VIDEO-BROLL-GEN-10R-NO-GPU-IAP-SSH-CANARY: run bounded no-public-IP non-GPU IAP SSH canary with the same image, target tag, proof service account, and mandatory cleanup; no GPU/no model/no inference`
