# AI Video B-roll Wan GPU Global Quota Verify Result

Decision: `ai_video_broll_wan_gpu_global_quota_verified_10w_iap_lookup_readiness_fix_required`.

Recorded at: `2026-07-02T13:09:27Z`.

This packet records a read-only B-roll quota verification result for the Wan/Wan2.1 controlled L4 proof path. It does not request quota, create a VM, create disks, mutate firewall/IAM/networking, run Docker, import models, run inference, create generated video, touch Supabase, execute SQL, create storage objects, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Verified Target

- Project: `reeditpro`
- Region: `northamerica-northeast2`
- Zone: `northamerica-northeast2-a`
- GPU: `nvidia_l4`
- Future machine shape: `g2-standard-4`
- Verification command: `npm run ai-video-broll-wan-gpu-global-quota:verify`

## Read-Only Quota Result

| Check | Result |
| --- | --- |
| `gcloud` available | yes |
| Active project matched `reeditpro` | yes |
| Auth refresh check | passed with token stdout suppressed |
| Project quota read | passed |
| Regional quota read | passed |
| `GPUS_ALL_REGIONS` limit | `1` |
| `GPUS_ALL_REGIONS` usage | `0` |
| `NVIDIA_L4_GPUS` limit in `northamerica-northeast2` | `1` |
| `NVIDIA_L4_GPUS` usage in `northamerica-northeast2` | `0` |
| `PREEMPTIBLE_NVIDIA_L4_GPUS` limit in `northamerica-northeast2` | `1` |
| `PREEMPTIBLE_NVIDIA_L4_GPUS` usage in `northamerica-northeast2` | `0` |
| Quota sufficient for one L4 VM | yes |

## Runtime Boundary

Quota is sufficient for one L4 VM, but this result is not execution permission. The 9W create attempt in `us-east4-a` stocked out before any VM existed, the 9X no-VM strategy result selected `us-east4-c`, and the 9Y create attempt in `us-east4-c` also stocked out before any VM existed. The 9Z no-VM stockout-fix result selected `us-east1-b` as the next bounded no-idle transfer-proof target. The 10A no-idle transfer proof then stocked out in `us-east1-b` before any VM existed, with cleanup/absence verified. The 10B no-VM stockout-fix result selected `us-east1-c` as the next same-region cross-zone no-idle transfer-proof target. The 10C no-idle transfer proof then stocked out in `us-east1-c` before any VM existed, with cleanup/absence verified. The 10D no-VM stockout-fix result selected `us-east1-d` as the next same-region cross-zone no-idle transfer-proof target. The 10E no-idle transfer proof then stocked out in `us-east1-d` before any VM existed, with cleanup/absence verified. The 10F no-VM stockout-fix result selected `us-west4-a` as the next bounded cross-region no-idle transfer-proof target. The 10G no-idle transfer proof then stocked out in `us-west4-a` before any VM existed, with cleanup/absence verified and `us-west4-c` suggested as planning evidence only. The 10H no-VM stockout-fix result selected `us-west4-c` as the next bounded no-idle transfer-proof target. The 10I bounded transfer proof then passed in `us-west4-c` with a no-public-IP VM, IAP manifest transfer, remote manifest readability, and cleanup verified. The 10J bounded payload/install-readiness proof then stocked out in `us-west4-c` before any VM existed, with cleanup/absence verified. The 10K no-VM strategy result selected `northamerica-northeast1-b` as the next bounded no-idle payload/install-readiness proof target. The 10L bounded payload/install-readiness proof then failed in `northamerica-northeast1-b` before any VM existed because the exact `g2-standard-4` plus one `nvidia_l4` configuration was unavailable at create time, with cleanup/absence verified. The 10M no-VM strategy result selected `northamerica-northeast1-c` as the next bounded no-idle payload/install-readiness proof target to avoid blindly retrying the failed zone. The 10N bounded payload/install-readiness proof then failed in `northamerica-northeast1-c` before any VM existed because the exact G2/L4 resource pool was unavailable at create time, with cleanup/absence verified. The 10O no-VM strategy result selected `northamerica-northeast2-a`, recorded `northamerica-northeast2-b` as backup evidence only, rejected `northamerica-northeast2-c` because the required shape was not visible, and fixed the local preflight method by requiring JSON output plus local filtering instead of fragile `gcloud --filter` expressions. The 10P proof then successfully created and deleted the no-public-IP `g2-standard-4` plus one `nvidia_l4` VM in `northamerica-northeast2-a`, but IAP SSH failed with `Permission denied (publickey)` before payload transfer. The 10Q read-only diagnosis narrowed the failure to an unproven SSH identity path and did not confirm a root cause. The 10S no-GPU canary then proved that the bounded runner can create and clean up a no-public-IP canary, but every SSH attempt failed before testing access because the runner passed mutually exclusive `gcloud compute ssh` flags: `--internal-ip` with `--tunnel-through-iap`. The 10T no-execution fix removed that flag conflict. The 10U no-GPU canary rerun then captured the IAP SSH success marker and verified cleanup. The 10V L4 retry then created a no-public-IP GPU VM and verified cleanup, but the first IAP SSH precheck failed with `Failed to lookup instance` before payload transfer. The next step is not inference; it is a no-execution 10W post-create IAP lookup readiness fix:

- no VM creation during the fix prompt;
- no model import or inference;
- no provider, worker, storage, Supabase, SQL, credit, beta, or production execution;
- no payload transfer or offline install during the fix prompt;
- a bounded readiness/backoff plan before a later payload/install retry.

## Runtime Gates

All runtime side-effect gates remained false:

- quota request created: false
- Compute Engine VM created: false
- disk created: false
- firewall/IAM/network mutation: false
- Cloud Run service/job mutation: false
- Docker run: false
- model import/inference: false
- generated video/assets: false
- provider calls/workers: false
- Supabase/SQL/storage/signed URLs: false
- public artifacts: false
- credit mutation: false
- beta/production unlock: false

## Recommended Next Prompt

`AI-VIDEO-BROLL-GEN-10W-IAP-LOOKUP-READINESS-FIX: add bounded post-create IAP instance lookup readiness before the next L4 payload/install retry, no VM/no model/no inference`
