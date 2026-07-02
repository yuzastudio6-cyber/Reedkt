# AI-VIDEO-BROLL-GEN-9K No-Idle L4 Proof Prompt

Prompt: `AI-VIDEO-BROLL-GEN-9K-NO-IDLE-L4-PROOF-PROMPT: prepare bounded no-idle L4 proof execution with mandatory cleanup, no VM/no inference in the planning prompt`

Decision: `ai_video_broll_gen_9k_no_idle_l4_proof_prompt_ready_no_vm_no_inference`

This prompt prepares the next B-roll GPU proof envelope. It does not create a VM, start Docker, install dependencies, import Wan/Wan2.1, run inference, create generated assets, touch Supabase, execute SQL, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`. It does not create generated video.

## Source Evidence

Read these files before any future execution prompt:

- `docs/external-agent-tool-execution-readiness-rollup.md`
- `docs/ai-video-broll-wan-gpu-global-quota-verify-result.md`
- `docs/ai-video-broll-wan-external-agent-wrapper-blocked-result.md`
- `docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md`
- `docs/ai-video-broll-generation-gcp-private-cache-validate-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`
- `server/cli/external-agent-tool-execute-broll-wan.ts`
- `server/cli/ai-video-broll-wan-gpu-global-quota-verify.ts`
- `server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts`
- `server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py`

## Verified Planning Inputs

The B-roll lane has quota and private-cache evidence only:

- Project: `reeditpro`
- Region: `us-central1`
- Zone: `us-central1-b`
- Proof VM name: `reeditpro-ai-broll-wan-l4-proof`
- Machine type: `g2-standard-4`
- GPU: one `nvidia_l4`
- Minimum `GPUS_ALL_REGIONS` quota: `1`
- Minimum regional `NVIDIA_L4_GPUS` quota: `1`
- Current read-only quota verification: passed
- Private cache readiness command: `npm run ai-video-broll-wan-fast-cache-readiness:check`
- Quota verification command: `npm run ai-video-broll-wan-gpu-global-quota:verify`

## No-Idle Proof Envelope

The future execution prompt must prove the GPU runs only while the bounded proof is active:

- create at most one prompt-scoped VM;
- create only `reeditpro-ai-broll-wan-l4-proof`;
- require a fresh pre-existing resource check before creation;
- stop if an instance, disk, static address, reservation, or other resource with the proof name already exists;
- use no public IP;
- require IAP-only access;
- require boot disk auto-delete;
- use no Cloud NAT, router, static address, reservation, service-account key, custom image, bucket, Artifact Registry image, or Cloud Run job;
- delete only the VM created by the future execution prompt;
- verify cleanup before completion;
- treat cleanup failure as proof failure;
- record sanitized metadata only.

## Future Execution Prompt Requirements

The next execution prompt must repeat live preflight immediately before any VM action:

- verify `gcloud` auth without recording token output;
- verify active project is `reeditpro`;
- verify zone `us-central1-b` is usable;
- verify `g2-standard-4` and `nvidia_l4` availability;
- verify global and regional GPU quota usage is compatible with one proof VM;
- verify CPU and disk quota are sufficient;
- verify the proof service account exists and is enabled;
- verify the IAP SSH firewall rule targets `ai-video-broll-wan-l4-proof`;
- verify private cache and proof runner inputs remain present;
- verify no pre-existing proof resource exists;
- define a hard cleanup path before creation;
- abort before creation if any required proof is missing.

## Forbidden In This Prompt

This planning prompt must not:

- create, start, stop, or delete Compute Engine resources;
- open SSH or IAP sessions;
- start Docker;
- install packages;
- clone repositories;
- download model weights;
- import models;
- call `from_pretrained`;
- call `torch.load`;
- run Wan/Wan2.1 inference;
- create generated frames, generated video, generated assets, media files, public artifacts, or signed URLs;
- touch Supabase, execute SQL, create rows, create storage objects, call providers, dispatch workers, mutate credits, or run billing;
- unlock beta or production.

## Future Prompt Shape

The next prompt may request a bounded lifecycle proof only if it keeps inference blocked and cleanup mandatory.

Required next prompt:

`AI-VIDEO-BROLL-GEN-9L-NO-IDLE-L4-PROOF-EXECUTE: run bounded no-idle L4 VM lifecycle proof with mandatory cleanup, no model inference`

That future prompt may create and delete only the single approved no-public-IP proof VM if all fresh preflight checks pass. It must still stop before model import and inference.
