# AI-VIDEO-BROLL-GEN-10Z-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-AFTER-RUNNER-FIX

Retry the bounded no-idle L4 payload/install readiness proof after the 10Y runner raw JSON cleanup fix.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10Z-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-AFTER-RUNNER-FIX: retry bounded no-idle L4 payload/install readiness after raw JSON cleanup runner fix, no model import/no inference`.

This prompt may create at most one prompt-scoped no-public-IP L4 VM named `reeditpro-ai-broll-wan-l4-proof` only after all preflight smokes and absence checks pass. It must delete the VM before completion and verify exact-name absence for instance, disk, address, and reservation.

This prompt must not import Wan/Wan2.1, run inference, create generated video/assets, run Docker, mutate Supabase, execute SQL, call providers, dispatch workers, mutate credits, unlock beta/production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Required Source Evidence

- `docs/ai-video-broll-gen-10y-runner-raw-json-cleanup-fix-result.md`
- `src/backend/mock/mock-ai-video-broll-gen-10y-runner-raw-json-cleanup-fix-result.ts`
- `server/cli/ai-video-broll-gen-10y-l4-payload-install-runner-contract.ts`
- `server/smoke/ai-video-broll-gen-10y-runner-raw-json-cleanup-fix-result-smoke.ts`
- `docs/ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result.md`
- `docs/ai-video-broll-gen-10w-iap-lookup-readiness-fix-result.md`
- `docs/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.md`
- `docs/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.md`

## Required Preflight

- Run `npm run smoke:ai-video-broll-gen-10y-runner-raw-json-cleanup-fix-result`.
- Run `npm run smoke:ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result`.
- Run `npm run smoke:ai-video-broll-gen-10w-iap-lookup-readiness-fix-result`.
- Run `npm run smoke:ai-video-broll-wan-fast-cache-readiness-check`.
- Run `npm run smoke:ai-video-broll-wan-gpu-global-quota-verify`.
- Run read-only exact-name absence checks for prompt VM, disk, address, and reservation.

## Required Runner Behavior

- Use the source-controlled 10Y runner contract.
- Parse raw `gcloud` JSON stdout before sanitizing or truncating log summaries.
- Never parse `stdoutSummary` or `stderrSummary` for machine state.
- Use compact post-create describe shape `json(status,networkInterfaces,disks)`.
- Recheck `status=RUNNING`, no public NAT IP, and boot disk `autoDelete=true`.
- Record IAP lookup readiness attempts with bounded backoff.
- If create is attempted, cleanup must attempt exact-name delete even if describe parsing fails.
- Verify exact-name absence for instance, disk, address, and reservation.
- Write a durable summary for every phase and final cleanup state.

## Payload/Install Readiness Scope

Allowed only after VM readiness is proven:

- Python runtime readiness check.
- Private wheelhouse/payload transfer readiness.
- Remote payload readability/manifest validation.
- Offline dependency install readiness.

Still forbidden:

- model import
- model load
- model inference
- generated video
- generated assets
- provider calls
- worker dispatch
- Docker
- Supabase/SQL/storage/signed URL mutation
- credit mutation
- beta/production unlock

## Failure Handling

If any phase fails:

- Stop further runtime work.
- Run exact-name cleanup.
- Verify cleanup.
- Record which preflight/runtime phase failed.
- Recommend a fix prompt that directly addresses the observed failure class.

## Recommended Outcome Prompt If Payload/Install Readiness Passes

`AI-VIDEO-BROLL-GEN-11A-MODEL-IMPORT-PLAN: plan Wan model import proof after payload/install readiness, no inference`
