# AI-VIDEO-BROLL-GEN-9X-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX

Choose the next approved no-idle L4 transfer proof capacity strategy after `us-east4-a` stocked out before VM creation. The strategy must preserve a strict no idle GPU boundary.

Exact next prompt: `AI-VIDEO-BROLL-GEN-9X-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east4-a stockout, no VM/no inference`.

This prompt is read-only and no-VM. It must not create a VM, disk, static address, capacity reservation, firewall rule, service account, service-account key, router, Cloud NAT, bucket, custom image, Cloud Run job, Docker container, IAP tunnel, SSH session, dependency install, model import, model inference, generated video, generated asset, Supabase row, SQL mutation, signed URL, public artifact, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Required Source Evidence

- `docs/ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result.md`
- `docs/ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result.md`
- `docs/ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result.md`
- `docs/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.md`
- `docs/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Audit Work

- Confirm cleanup from 9W: proof instance, disk, static address, and reservation are absent.
- Re-check project `GPUS_ALL_REGIONS` usage and regional L4 usage after cleanup.
- Read-only inspect candidate L4 zones that have not yet been used for the transfer proof, beginning with `us-east4-c`, then `us-east1-b`, `us-east1-c`, `us-east1-d`, `us-west4-a`, and `us-west4-c`.
- Re-check private model cache and Python 3.12 wheelhouse readiness.
- Decide whether the next safe strategy is one more bounded no-idle cross-region transfer proof target, a delayed retry, or a separate scale-to-zero architecture plan.

## Decision Rules

- Prefer one more bounded no-idle cross-region transfer proof only if an untried zone has visible `g2-standard-4`, visible `nvidia_l4`, quota limit at least `1`, usage `0`, CPU and SSD headroom, and no matching proof resources.
- Reject capacity reservations unless a future prompt explicitly accepts cost/idle risk.
- Reject always-on GPU instances because the user requires run-when-used and stop-when-idle GPU behavior.
- Keep Cloud Run, queued jobs, Docker, and worker architecture as separate future tracks unless this prompt finds no safe one-VM transfer target remains.
- If no safe no-idle target remains, recommend a no-execution architecture plan instead of creating infrastructure.

## Required Result

Record a deterministic result doc, mock result, and smoke that include:

- cleanup state from the 9W attempt;
- read-only candidate zone findings;
- selected capacity strategy;
- whether another no-idle transfer proof target is selected;
- why reservation/always-on GPU remains rejected;
- all runtime side-effect flags false;
- exact next prompt.
