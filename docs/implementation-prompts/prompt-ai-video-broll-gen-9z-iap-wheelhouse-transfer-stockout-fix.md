# AI-VIDEO-BROLL-GEN-9Z-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX

Choose the next approved no-idle L4 transfer proof capacity strategy after the cleanup-verified `us-east4-c` stockout. This prompt is read-only and no-VM.

Exact next prompt: `AI-VIDEO-BROLL-GEN-9Z-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east4-c stockout, no VM/no inference`.

This prompt must inspect existing B-roll transfer-proof evidence, current quota, candidate zones, and no-idle constraints, then either select a future bounded transfer-proof target or declare the lane blocked pending a different architecture. It must not create a VM, disk, static address, reservation, firewall rule, service account, bucket, Cloud Run job, Docker container, IAP tunnel, SSH session, dependency install, model import, model inference, generated video, generated asset, Supabase row, SQL mutation, signed URL, public artifact, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

The selected strategy must preserve no idle GPU behavior: run only when the future prompt explicitly uses the resource, then stop and verify cleanup before completion.

## Required Source Evidence

- `docs/ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result.md`
- `docs/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result.md`
- `docs/ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Required Analysis

- Confirm the 9Y create attempt failed before any VM existed.
- Confirm cleanup/absence after 9Y: no proof VM, disk, static address, or reservation remains.
- Re-check current project/region/zone quota read-only.
- Re-check candidate zones read-only.
- Prefer no-idle, no-public-IP, prompt-scoped, cleanup-verified options.
- Reject always-on GPU, capacity reservation, public IP paths, Docker/runtime worker paths, and generated video inference for the immediate next step unless a future prompt explicitly changes the architecture with owner evidence.

## Required Result

Record a deterministic result doc, mock result, and smoke that include:

- candidate strategy evaluation;
- whether another bounded no-idle transfer-proof target is selected;
- whether the lane is blocked pending a different architecture;
- all runtime side-effect flags;
- exact next prompt.
