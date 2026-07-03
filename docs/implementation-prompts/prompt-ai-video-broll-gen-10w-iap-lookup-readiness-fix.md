# AI-VIDEO-BROLL-GEN-10W-IAP-LOOKUP-READINESS-FIX

Add a no-execution fix for the 10V bounded L4 payload/install retry failure.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10W-IAP-LOOKUP-READINESS-FIX: add bounded post-create IAP instance lookup readiness before the next L4 payload/install retry, no VM/no model/no inference`.

10V created the prompt-scoped `g2-standard-4` plus one NVIDIA L4 VM in `northamerica-northeast2-a`, preserved the no-public-IP requirement, and verified cleanup. The first IAP SSH precheck failed before payload transfer with `Failed to lookup instance`. This prompt must fix the command contract and readiness plan before any new GPU VM is created.

Do not create a VM.
Do not open SSH.
Do not transfer payloads.
Do not install dependencies.
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

- `docs/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.md`
- `src/backend/mock/mock-ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.ts`
- `server/smoke/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result-smoke.ts`
- `docs/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.md`
- `docs/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.md`

## Required Fix Shape

- Add a bounded post-create readiness phase before the first IAP SSH command.
- Wait for the prompt-scoped instance to report `RUNNING`.
- Verify no public IP remains absent after the wait.
- Verify the boot disk is auto-delete.
- Add a bounded IAP lookup readiness loop before the first real remote command.
- Record each wait attempt in durable summary output.
- Keep cleanup mandatory and delete only the prompt-scoped proof VM.
- Keep model import, model inference, generated assets, Supabase, SQL, signed URLs, credits, beta, and production blocked.

## Failure Prevention

The next L4 runtime attempt must not immediately call `gcloud compute ssh` after create. It must prove that the instance is visible to Compute Engine reads and that the IAP SSH command path has had a bounded lookup readiness window. If lookup readiness still fails, the next runtime result must record the failure and clean up without payload transfer.

## Required Result

Produce a no-execution result packet showing the runner/plan now includes the post-create readiness wait and IAP lookup backoff. Route the next runtime attempt to a new bounded retry prompt. Keep `modelImportRun=false`, `modelInferenceRun=false`, `generatedAssetsCreated=false`, and `generatedLocalFixturePassedClaimed=false`.
