# AI-VIDEO-BROLL-GEN-9J-VM-CREATE-EXECUTE Prompt

Prompt: `AI-VIDEO-BROLL-GEN-9J-VM-CREATE-EXECUTE: create controlled no-public-IP L4 proof VM, no inference`

Goal: create the controlled no-public-IP L4 proof VM for AI_VIDEO_BROLL_GENERATION using the validated Python 3.12 private wheelhouse path. This prompt may create only the single approved VM if all preflight checks still pass immediately before execution. It must not run inference.

Use these source documents first:

- `docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md`
- `docs/ai-video-broll-generation-python-runtime-alignment-result.md`
- `docs/ai-video-broll-generation-gcp-private-vm-preflight-4-result.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

Required immediate preflight before execution:

- verify `gcloud` project is `reeditpro`;
- verify zone `us-central1-b` is `UP`;
- verify `g2-standard-4` and `nvidia-l4` remain available;
- verify L4, CPU, and SSD quotas remain sufficient;
- verify service account `reeditpro-ai-broll-proof-sa` exists and is enabled;
- verify IAP firewall rule `reeditpro-ai-broll-proof-iap-ssh` exists for target tag `ai-video-broll-wan-l4-proof`;
- verify no existing instance, disk, static address, or reservation named `reeditpro-ai-broll-wan-l4-proof` exists;
- verify the Python 3.12 wheelhouse manifest still has 66 real wheels and aggregate SHA-256 `55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64`;
- stop before VM creation if any check fails.

Allowed execution in this prompt only if all immediate preflight checks pass:

- create exactly one VM named `reeditpro-ai-broll-wan-l4-proof`;
- use `g2-standard-4` with one `nvidia-l4`;
- use image family `common-cu129-ubuntu-2404-nvidia-580`;
- use no external IP;
- use target tag `ai-video-broll-wan-l4-proof`;
- use the proof service account;
- use logging and monitoring write scopes only;
- verify the VM exists and has no external NAT IP;
- record sanitized result evidence;
- stop before IAP transfer, SSH, dependency install, model import, or inference.

Do not create Cloud NAT, router, firewall rule, service account, service account key, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request. Do not run IAP transfer commands. Do not install dependencies on the VM. Do not clone source repositories. Do not import models, call `from_pretrained`, call `torch.load`, run inference, create generated frames or video, run FFmpeg, touch Supabase, execute SQL, call providers, dispatch workers, create signed URLs, create public artifacts, mutate credits, or claim beta, production, runtime readiness, `dry_run_passed`, or `generated_local_fixture_passed`.

Expected next prompt if VM creation passes:

`AI-VIDEO-BROLL-GEN-9J-IAP-WHEELHOUSE-TRANSFER-EXECUTE: transfer Python 3.12 wheelhouse to no-public-IP L4 proof VM over IAP, no inference`
