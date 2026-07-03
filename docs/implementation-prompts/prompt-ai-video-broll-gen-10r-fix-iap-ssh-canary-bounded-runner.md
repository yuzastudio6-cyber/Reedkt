# AI-VIDEO-BROLL-GEN-10R-FIX-IAP-SSH-CANARY-BOUNDED-RUNNER

Fix the no-GPU IAP SSH canary runner after 10R created a non-GPU no-public-IP canary but did not capture durable SSH pass/fail evidence before interruption.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10R-FIX-IAP-SSH-CANARY-BOUNDED-RUNNER: fix bounded no-GPU IAP SSH canary runner timeout and durable cleanup-summary capture, no GPU/no model/no inference`.

This prompt should produce a safer retry plan or command packet for the same no-GPU canary shape. It must not create a GPU VM, run model imports, run inference, transfer model payloads, mutate Supabase, execute SQL, create signed URLs, create generated assets, or unlock beta/production.

## Required Source Evidence

- `docs/ai-video-broll-gen-10r-no-gpu-iap-ssh-canary-result.md`
- `docs/implementation-prompts/prompt-ai-video-broll-gen-10r-no-gpu-iap-ssh-canary.md`
- `docs/ai-video-broll-gen-10q-iap-oslogin-access-fix-result.md`
- `docs/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.md`
- `docs/external-agent-tool-execution-readiness-rollup.md`

## Required Fix Scope

- Add a hard timeout around each IAP SSH attempt.
- Emit a sanitized JSON summary after preflight, create, SSH attempt, cleanup, and final absence verification.
- Ensure cleanup runs and records instance, disk, address, and reservation absence even after SSH timeout or interrupt.
- Keep the target VM name prompt-scoped: `reeditpro-ai-broll-iap-ssh-canary`.
- Keep the machine non-GPU.
- Keep no public IP.
- Keep the same IAP target tag.
- Keep the same proof service account without storing its value.
- Keep the allowed remote command limited to a canary marker and Python version check.

## Failure Routing

If the fixed runner captures `Permission denied (publickey)`, recommend an explicit SSH key or OS Login metadata repair prompt before any GPU VM.

If the fixed runner captures an IAP tunnel failure before SSH authentication, recommend an IAP permission or firewall diagnosis prompt.

If the fixed runner captures success and cleanup verification, recommend a bounded L4 payload/install retry with mandatory cleanup.

If cleanup is not verified, do not claim pass; recommend a cleanup repair prompt.

## Forbidden Actions

- Do not create GPU VMs.
- Do not attach GPUs.
- Do not create public IPs.
- Do not create capacity reservations.
- Do not transfer wheelhouse payloads.
- Do not install dependencies.
- Do not run Docker.
- Do not import Wan.
- Do not instantiate model pipelines.
- Do not run inference.
- Do not create generated video or generated assets.
- Do not mutate IAM, OS Login, project metadata, firewall rules, Supabase, SQL, storage, signed URLs, credits, beta, or production.

## Required Result

Record the bounded-runner fix and the exact safe next prompt. Keep `gpuVmCreated=false`, `modelImportRun=false`, `modelInferenceRun=false`, `generatedAssetsCreated=false`, and `generatedLocalFixturePassedClaimed=false`.
