# AI-VIDEO-BROLL-GEN-10X-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-WITH-IAP-LOOKUP-READINESS

Retry the bounded no-idle L4 payload/install readiness proof only after 10W added the post-create IAP instance lookup readiness contract.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10X-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-WITH-IAP-LOOKUP-READINESS: retry bounded no-idle L4 payload/install readiness with post-create IAP lookup readiness and mandatory cleanup, no model import/no inference`.

This prompt may create at most one prompt-scoped no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `northamerica-northeast2-a` only long enough to validate Python 3.12 readiness, private wheelhouse payload transfer, remote payload validation, and offline dependency install readiness. It must not import Wan/Wan2.1 or run inference.

## Required Source Evidence

- `docs/ai-video-broll-gen-10w-iap-lookup-readiness-fix-result.md`
- `src/backend/mock/mock-ai-video-broll-gen-10w-iap-lookup-readiness-fix-result.ts`
- `server/smoke/ai-video-broll-gen-10w-iap-lookup-readiness-fix-result-smoke.ts`
- `docs/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.md`
- `docs/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.md`
- `docs/ai-video-broll-wan-gpu-global-quota-verify-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`

## Mandatory Preflight

- Run `npm run smoke:ai-video-broll-gen-10w-iap-lookup-readiness-fix-result`.
- Run `npm run smoke:ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result`.
- Run `npm run smoke:ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result`.
- Run `npm run ai-video-broll-wan-fast-cache-readiness:check`.
- Run `npm run ai-video-broll-wan-gpu-global-quota:verify`.
- Verify no prompt-scoped proof instance, disk, address, or reservation exists before create.
- Verify target zone `northamerica-northeast2-a`, `g2-standard-4`, `nvidia-l4`, and the approved image family remain available.
- Verify `GPUS_ALL_REGIONS` quota and regional `NVIDIA_L4_GPUS` quota remain sufficient.

## Required Post-Create Readiness Sequence

The runtime attempt must not call IAP SSH immediately after create. After the VM create returns, run the bounded readiness sequence first:

1. Poll Compute Engine describe until the prompt-scoped instance is visible.
2. Poll until the instance reports `RUNNING`.
3. Re-read the network interface and verify no public NAT IP exists.
4. Re-read the boot disk attachment and verify `autoDelete=true`.
5. Run a bounded IAP lookup readiness loop before the first real remote command.
6. Persist every readiness attempt with attempt number, sanitized result class, and elapsed time.
7. Stop before payload transfer if lookup readiness fails inside the bounded window.
8. Always cleanup the prompt-scoped VM and verify absence of VM, disk, address, and reservation before completion.

Suggested bounds: at most `8` IAP lookup attempts, `10s` delay between attempts, and a maximum `120s` post-create readiness window.

## Allowed Runtime Scope

- Create one prompt-scoped no-public-IP L4 VM.
- Verify post-create instance visibility, `RUNNING`, no public IP, and boot disk auto-delete.
- Open only the required IAP SSH/transfer path after lookup readiness passes.
- Transfer only the approved private Python 3.12 wheelhouse payload.
- Run remote payload validation and offline dependency install readiness.
- Delete the prompt-scoped VM and verify cleanup.

## Forbidden Runtime Scope

Do not run model import.
Do not run inference.
Do not create generated video or assets.
Do not run Docker.
Do not mutate Supabase.
Do not execute SQL.
Do not create signed URLs.
Do not mutate credits.
Do not unlock beta or production.
Do not claim `dry_run_passed`.
Do not claim `generated_local_fixture_passed`.

## Required Result

Produce a sanitized result doc/spec/smoke that records the exact outcome. If readiness, SSH, transfer, or install fails, classify the failure precisely, record what prevention should happen next, and verify cleanup. Do not include secrets, service-account values, access tokens, public URLs, signed URLs, raw prompts, or full remote logs.
