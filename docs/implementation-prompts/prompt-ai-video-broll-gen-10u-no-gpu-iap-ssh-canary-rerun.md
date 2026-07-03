# AI-VIDEO-BROLL-GEN-10U-NO-GPU-IAP-SSH-CANARY-RERUN

Rerun the bounded no-GPU IAP SSH canary after 10T removed the mutually exclusive `gcloud compute ssh` flag pairing from the runner.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10U-NO-GPU-IAP-SSH-CANARY-RERUN: rerun the bounded no-GPU IAP SSH canary after removing mutually exclusive flags; no GPU/no model/no inference`.

This prompt may create at most one prompt-scoped non-GPU VM only after fresh preflight passes. The VM must use no public IP, the proof service account path, the IAP target tag, boot disk auto-delete, and the existing bounded runner. The VM must exist only long enough to capture real IAP SSH pass/fail evidence with the tiny sanitized command, then it must be deleted with cleanup verification.

Do not create a GPU VM.
Do not run Docker.
Do not transfer model payloads.
Do not install dependencies.
Do not import Wan.
Do not run inference.
Do not create generated video or assets.
Do not mutate Supabase.
Do not execute SQL.
Do not create signed URLs.
Do not mutate credits.
Do not unlock beta or production.
Do not claim `dry_run_passed`.
Do not claim `generated_local_fixture_passed`.

## Required Source Evidence

- `docs/ai-video-broll-gen-10t-iap-ssh-flag-fix-result.md`
- `src/backend/mock/mock-ai-video-broll-gen-10t-iap-ssh-flag-fix-result.ts`
- `server/cli/ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner.ts`
- `server/smoke/ai-video-broll-gen-10t-iap-ssh-flag-fix-result-smoke.ts`
- `server/smoke/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-smoke.ts`

## Required Preflight

- Verify the runner smoke passes and confirms no `--internal-ip` plus `--tunnel-through-iap` conflict.
- Verify the B-roll private cache readiness check still passes without model import or inference.
- Verify the B-roll quota/readiness surfaces still route to this no-GPU canary rerun, not to a GPU payload/install attempt.
- Verify no prompt-scoped canary instance, disk, address, or reservation exists before creation.

## Required Runtime Shape

- Use the bounded runner only: `npm run ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner -- --execute --json`.
- Use no GPU accelerator.
- Use no public IP.
- Persist the sanitized summary after each phase.
- Capture whether the IAP SSH command reaches the remote canary marker.
- Delete only the prompt-scoped canary.
- Verify instance, disk, address, and reservation absence before completion.

## Failure Routing

- If SSH fails with a durable publickey/OS Login signal, recommend an SSH-key/OS Login metadata fix prompt.
- If SSH fails with a durable IAP tunnel or firewall signal, recommend an IAP tunnel/firewall fix prompt.
- If cleanup fails, recommend a canary cleanup repair prompt and do not continue.
- If SSH passes and cleanup passes, recommend the next bounded no-idle L4 payload/install readiness retry with mandatory cleanup.

## Required Result

Record whether the non-GPU no-public-IP canary created, whether IAP SSH opened, whether cleanup passed, and what the next prompt should be. Keep `gpuVmCreated=false`, `modelImportRun=false`, `modelInferenceRun=false`, `generatedAssetsCreated=false`, and `generatedLocalFixturePassedClaimed=false` regardless of result.
