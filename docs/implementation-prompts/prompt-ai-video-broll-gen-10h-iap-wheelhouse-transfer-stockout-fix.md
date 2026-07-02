# AI-VIDEO-BROLL-GEN-10H-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX

Choose the next approved no-idle L4 transfer proof capacity strategy after the `us-west4-a` stockout. Do not create a VM and do not run model inference.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10H-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-west4-a stockout, no VM/no inference`.

## Required Source Evidence

- `docs/ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result.md`
- `docs/ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/external-agent-tool-execution-readiness-rollup.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Scope

This future prompt is read-only and no-VM. It may inspect read-only Google Cloud metadata, current quota, candidate zones, machine-type visibility, accelerator visibility, services, IAP firewall, proof service account presence, proof-resource absence, private model cache stat-only readiness, and private wheelhouse manifest readiness.

It must use the 10G sanitized create result as source evidence, including the `us-west4-c` suggested available zone, but it must not automatically retry in `us-west4-c` without recording a fresh no-VM strategy decision first.

## Required Checks

- Confirm active project and auth refresh with token stdout suppressed.
- Re-read required services.
- Re-read project `GPUS_ALL_REGIONS` and regional L4 quota.
- Re-read candidate zones, prioritizing `us-west4-c` because the 10G create response suggested it.
- Re-read `g2-standard-4` and `nvidia_l4` visibility for candidate zones.
- Re-read CPU and SSD quota for candidate regions.
- Re-read proof service account presence without storing account values.
- Re-read IAP firewall target tag and no-public-IP path.
- Re-read absence of proof VM, disk, static address, and reservation.
- Re-read private model cache stat-only readiness.
- Re-read private Python 3.12 wheelhouse manifest count, bytes, and aggregate SHA-256.

## Strategy Rules

The selected strategy must preserve run-when-used and stop-when-idle GPU posture. It may select a future bounded no-idle transfer proof prompt for a single candidate zone, or it may block if no safe candidate remains.

Capacity reservations, always-on GPUs, public IPs, Cloud Run/Docker rewrites, delayed retry without a reasoned target, dependency install, model import, and model inference remain rejected for this strategy prompt.

## Forbidden Actions

Do not create a VM. Do not create a disk, static address, reservation, firewall rule, service account, service-account key, router, Cloud NAT, bucket, image, Artifact Registry resource, Cloud Run job, Docker container, IAP tunnel, SSH session, dependency install, model import, model inference, generated video, generated asset, Supabase row, SQL mutation, signed URL, public artifact, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Required Output

Produce a sanitized no-VM strategy result doc/spec/smoke that records the selected capacity path or blocked decision. If `us-west4-c` is selected, the next prompt must still be a bounded no-idle transfer proof prompt with mandatory cleanup and no model inference.
