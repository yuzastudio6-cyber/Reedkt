# AI-VIDEO-BROLL-GEN-10L-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-NORTHAMERICA-NORTHEAST1-B

Run one bounded no-idle L4 VM lifecycle with private wheelhouse payload transfer and offline dependency install readiness validation in `northamerica-northeast1-b`, then clean up. This is the future execution prompt selected by AI-VIDEO-BROLL-GEN-10K after the cleanup-verified `us-west4-c` payload/install stockout.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10L-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-NORTHAMERICA-NORTHEAST1-B: run bounded no-idle L4 VM lifecycle with private wheelhouse payload transfer and offline dependency install readiness validation in northamerica-northeast1-b with mandatory cleanup, no model import/no inference`.

## Required Source Evidence

- `docs/ai-video-broll-gen-10k-payload-install-stockout-fix-result.md`
- `docs/ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c-result.md`
- `docs/ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result.md`
- `docs/external-agent-tool-execution-readiness-rollup.md`

## Scope

The future 10L prompt may attempt exactly one prompt-scoped no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `northamerica-northeast1-b` only after repeated preflight passes. It must transfer only the private Python 3.12 wheelhouse payload, validate remote payload presence, and run offline dependency install readiness checks if safe. It must delete the prompt-created VM and verify cleanup before completion.

It must not use a public IP, create a capacity reservation, keep an idle GPU, mutate firewall/IAM/networking, create service-account keys, run Docker, clone repositories, download models, import Wan/Wan2.1, run model inference, create generated frames, create generated video, create generated assets, call providers, dispatch workers, touch Supabase, execute SQL, create storage objects, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Required Preflight

- active project is `reeditpro`;
- auth refresh passes with stdout suppressed;
- required services remain enabled;
- `northamerica-northeast1-b` zone status is `UP`;
- `g2-standard-4` is visible in `northamerica-northeast1-b`;
- `nvidia-l4` is visible in `northamerica-northeast1-b`;
- project `GPUS_ALL_REGIONS` quota limit is at least `1` with usage `0`;
- `northamerica-northeast1` regional `NVIDIA_L4_GPUS` quota limit is at least `1` with usage `0`;
- `northamerica-northeast1` CPU and SSD quota are sufficient;
- proof service account is present and not disabled, without recording its value;
- IAP firewall or approved equivalent no-public-IP path is present;
- matching proof VM, disk, static address, and reservation are absent;
- private model cache stat-only readiness passes;
- private Python 3.12 wheelhouse manifest is present, complete, and matches the expected wheel count, byte count, and aggregate SHA-256.

## Failure Handling

Stop and record a blocked result if safety proof, zone/shape visibility, quota, IAP path, private cache, private wheelhouse, VM creation, transfer, install readiness, or cleanup verification fails. Do not retry another zone inside the same prompt. Do not leave a GPU VM running.
