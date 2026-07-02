# AI-VIDEO-BROLL-GEN-10D-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX

Choose the next approved no-idle L4 transfer proof capacity strategy after the cleanup-verified `us-east1-c` stockout. This prompt is read-only and no-VM.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10D-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east1-c stockout, no VM/no inference`.

## Required Source Evidence

- `docs/ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c-result.md`
- `docs/ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result.md`
- `docs/ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Scope

This future prompt may run read-only Google Cloud and local cache/wheelhouse checks only. It must not create a VM, disk, static address, reservation, firewall rule, service account, service-account key, bucket, Cloud Run job, Docker container, IAP tunnel, SSH session, dependency install, model import, model inference, generated video, generated asset, Supabase row, SQL mutation, signed URL, public artifact, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Strategy Inputs

The prompt must consider:

- `us-east1-b` stocked out before VM creation in 10A.
- `us-east1-c` stocked out before VM creation in 10C.
- `us-east1-d` was previously visible as an available same-region fallback, but must be rechecked before any selection.
- Capacity reservations and always-on GPUs remain disfavored unless an explicit future prompt accepts idle/billing risk.
- Cloud Run, GKE, queue-based workers, or any scale-to-zero architecture must remain separate runtime architecture work, not an ad hoc replacement for the private IAP wheelhouse transfer proof.

## Required Output

The future prompt should produce:

- an updated no-VM stockout-fix result;
- the selected next no-idle strategy or a blocked no-safe-target decision;
- all read-only evidence used for the decision;
- explicit runtime side-effect flags, all false;
- the exact next prompt if a future bounded transfer proof is selected.

## Forbidden Actions

Do not create capacity reservations. Do not create a VM. Do not create a public IP. Do not mutate firewall, IAM, service accounts, service-account keys, routers, Cloud NAT, buckets, images, Artifact Registry, Cloud Run, or quota requests. Do not run Docker. Do not install dependencies. Do not clone repositories. Do not import Wan/Wan2.1. Do not run model inference. Do not create generated frames, generated video, generated assets, storage objects, signed URLs, Supabase rows, SQL mutations, credit records, beta unlocks, or production unlocks. Do not claim `dry_run_passed` or `generated_local_fixture_passed`.
