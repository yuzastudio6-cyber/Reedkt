# AI-VIDEO-BROLL-GEN-10T-IAP-SSH-FLAG-FIX

Fix the bounded no-GPU IAP SSH canary runner after 10S proved the runner used mutually exclusive `gcloud compute ssh` flags.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10T-IAP-SSH-FLAG-FIX: remove mutually exclusive IAP SSH flags from the bounded no-GPU canary runner, no VM/no model/no inference`.

This prompt is implementation-only. It must not create a VM, open SSH, run Docker, transfer model payloads, install dependencies, import Wan, run inference, create generated video/assets, mutate Supabase, execute SQL, create signed URLs, mutate credits, or unlock beta/production.

Do not create a VM.
Do not run inference.
Do not rerun the canary in this fix prompt.

## Required Source Evidence

- `docs/ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result.md`
- `src/backend/mock/mock-ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result.ts`
- `server/cli/ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner.ts`
- `server/smoke/ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result-smoke.ts`

## Required Fix

- Remove `--internal-ip` from the `gcloud compute ssh` command when `--tunnel-through-iap` is used.
- Keep `--tunnel-through-iap`.
- Keep no GPU, no public IP, prompt-scoped canary name, bounded SSH attempts, durable summaries, and cleanup verification.
- Add or update smoke assertions so the runner cannot combine `--internal-ip` with `--tunnel-through-iap` again.

## Required Validation

- Run the 10S result smoke.
- Run the 10R-FIX bounded runner smoke.
- Run B-roll cache/quota and external-agent routing smokes.
- Do not run the canary again in this fix prompt.

## Expected Follow-Up

After the flag fix validates, the next prompt should rerun the same bounded no-GPU canary shape. Do not create a GPU VM until that no-GPU canary captures real IAP SSH pass/fail evidence and cleanup passes.
