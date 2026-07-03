# AI-VIDEO-BROLL-GEN-10ZA Payload Delivery Timeout Fix

## Summary

Implement a no-VM/no-model/no-inference payload delivery fix plan after AI-VIDEO-BROLL-GEN-10Z proved that recursive IAP transfer of the 2.8 GB wheelhouse is not reliable enough for a bounded no-idle L4 proof.

This prompt must not create a VM, run Docker, call providers, download model weights, import Wan, run inference, create generated video, create generated assets, mutate Supabase, execute SQL, create storage objects, create signed URLs, spend credits, unlock beta, or unlock production.

Boundary phrase for diagnostics: no VM/no model/no inference.

## Required Inputs

- `docs/ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix-result.md`
- `src/backend/mock/mock-ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix-result.ts`
- `server/cli/ai-video-broll-gen-10z-l4-payload-install-runner.ts`
- `server/cli/ai-video-broll-gen-10y-l4-payload-install-runner-contract.ts`
- `docs/ai-video-broll-wan-fast-cache-readiness-result.md`
- `docs/ai-video-broll-wan-gpu-global-quota-verify-result.md`

## Required Fix Direction

The fix must avoid blindly retrying recursive `gcloud compute scp --recurse` of the full wheelhouse on a paid GPU VM.

Evaluate and choose a safer bounded payload strategy, such as:

- local single-archive packaging with checksum plus remote extraction;
- resumable/chunked transfer with manifest verification;
- an approved private cache/image strategy;
- a smaller minimal wheel subset if dependency analysis proves the full wheelhouse is unnecessary.

The selected strategy must preserve:

- no public IP;
- no idle GPU;
- one prompt-scoped VM only in a later execution prompt;
- exact-name cleanup after any create attempt;
- no model import;
- no model inference;
- no generated video or assets;
- no Supabase, SQL, storage, signed URL, provider, worker, credit, beta, or production side effects.

## Required Output

- A result doc/spec/smoke describing the selected payload delivery fix.
- External-agent gate and rollup updates so the active B-roll blocker changes away from 10Z retry.
- A next prompt for the bounded payload/install retry only after the payload strategy is fixed.

## Recommended Next Prompt After Fix

`AI-VIDEO-BROLL-GEN-10ZB-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-WITH-FIXED-DELIVERY: retry bounded L4 payload/install readiness with fixed payload delivery, no model import/no inference`
