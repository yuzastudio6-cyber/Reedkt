# AI-VIDEO-BROLL-GEN-10Y-RUNNER-RAW-JSON-CLEANUP-FIX

Fix the L4 payload/install runner after the 10X retry created the prompt-scoped VM but failed before post-create readiness because it parsed sanitized/truncated `describe` output instead of raw machine JSON.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10Y-RUNNER-RAW-JSON-CLEANUP-FIX: fix L4 payload/install runner to parse raw describe JSON before sanitizing logs and delete prompt VM after any create attempt, no VM/no model/no inference`.

This prompt must not create a VM, open SSH, transfer payloads, install dependencies, import Wan/Wan2.1, run inference, create generated video/assets, run Docker, mutate Supabase, execute SQL, call providers, dispatch workers, mutate credits, unlock beta/production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Required Source Evidence

- `docs/ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result.md`
- `src/backend/mock/mock-ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result.ts`
- `server/smoke/ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result-smoke.ts`
- `docs/ai-video-broll-gen-10w-iap-lookup-readiness-fix-result.md`
- `docs/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.md`
- `docs/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.md`

## Required Fix

- Add or update the future L4 payload/install runner without running it.
- Parse raw command stdout before sanitizing or truncating summaries.
- Never make machine-state decisions from `stdoutSummary`, `stderrSummary`, or any truncated/sanitized string.
- Use compact post-create probes for state checks:
  - instance visibility
  - `status=RUNNING`
  - no public NAT IP
  - boot disk `autoDelete=true`
- If VM creation succeeds, cleanup must attempt exact-name delete for `reeditpro-ai-broll-wan-l4-proof` even when describe parsing fails.
- Cleanup verification must use exact-name absence checks for the instance, disk, address, and reservation.
- Durable summary output must record every phase and the final cleanup state.

## Required Smoke Coverage

- Assert the runner parses raw stdout before sanitization.
- Assert no state decision is made from sanitized/truncated summaries.
- Assert cleanup delete is keyed by `computeVmCreated` or successful create result, not by parsed describe only.
- Assert exact-name cleanup absence checks are present.
- Assert no VM, SSH, transfer, install, model import, inference, Docker, Supabase, SQL, provider, worker, generated asset, credit, beta, or production action is run by this fix prompt.

## Recommended Next Prompt

`AI-VIDEO-BROLL-GEN-10Z-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-AFTER-RUNNER-FIX: retry bounded no-idle L4 payload/install readiness after raw JSON cleanup runner fix, no model import/no inference`
