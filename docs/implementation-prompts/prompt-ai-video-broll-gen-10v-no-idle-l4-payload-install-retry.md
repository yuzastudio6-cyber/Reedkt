# AI-VIDEO-BROLL-GEN-10V-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY

Retry the bounded no-idle L4 payload/install readiness proof after 10U proved the no-GPU no-public-IP IAP SSH canary path.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10V-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY: retry bounded no-idle L4 payload/install readiness after no-GPU IAP SSH canary passed; mandatory cleanup, no model import/no inference`.

This prompt may create at most one prompt-scoped L4 VM only after fresh preflight passes. The VM must use no public IP, the proof service account path, the IAP target tag, boot disk auto-delete, and the existing bounded no-idle lifecycle discipline. It must exist only long enough to validate private payload transfer and offline dependency install readiness, then it must be deleted with cleanup verification.

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

## Required Source Evidence

- `docs/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.md`
- `src/backend/mock/mock-ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.ts`
- `server/smoke/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result-smoke.ts`
- `docs/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.md`
- `docs/ai-video-broll-wan-gpu-global-quota-verify-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`

## Required Preflight

- Verify 10U result smoke passes and confirms IAP SSH success plus cleanup.
- Verify quota/cache checks still pass.
- Verify no prompt-scoped proof instance, disk, address, or reservation exists before creation.
- Verify the selected target remains `northamerica-northeast2-a` with one NVIDIA L4 and no public IP.

## Required Runtime Shape

- Use a bounded no-idle lifecycle.
- Create only one prompt-scoped GPU VM.
- Use `g2-standard-4` plus one NVIDIA L4.
- Use no public IP.
- Transfer only private payload/install readiness inputs.
- Run only offline dependency install readiness checks.
- Do not import Wan.
- Do not run inference.
- Delete only the prompt-scoped proof VM.
- Verify instance, disk, address, and reservation absence before completion.

## Failure Routing

- If VM creation stocks out or the configuration is unavailable, record the exact capacity class and recommend a no-VM capacity strategy prompt.
- If IAP transfer fails, record the transfer failure class and recommend a private IAP transfer repair prompt.
- If dependency install readiness fails, record the package/install failure class and recommend an offline wheelhouse/install repair prompt.
- If cleanup fails, recommend a cleanup repair prompt and do not continue.
- If payload transfer, install readiness, and cleanup pass, recommend the next bounded no-idle model import readiness prompt.

## Required Result

Record whether the L4 VM created, whether no public IP was preserved, whether IAP payload transfer passed, whether offline dependency install readiness passed, whether cleanup passed, and what the next prompt should be. Keep `modelImportRun=false`, `modelInferenceRun=false`, `generatedAssetsCreated=false`, and `generatedLocalFixturePassedClaimed=false` regardless of result.
