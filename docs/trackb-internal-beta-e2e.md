# Track B Internal Beta E2E QA

Milestone 8 proves the completed Track B adapter lane can run through the backend skeleton as a controlled internal beta dry run.

## Scope

The proof uses a generated synthetic private edit fixture and covers the full 16-tool Track B adapter set:

- Source clip preparation
- Timeline and caption preparation
- OCR/text safety
- Scene and visual analysis
- Color and image consistency
- Audio timing
- Chart/data visualization
- Preview assembly

The user-facing activity language stays aligned with Milestone 7: chat cards summarize edit work and do not expose raw execution tool names by default. Technical identifiers remain available in developer review only.

## What Runs

`npm run smoke:trackb-internal-beta-e2e` calls the backend-only internal beta runner. The runner:

- creates one synthetic private fixture;
- dispatches every Track B adapter through the approved tool execution gateway;
- requires approved plan snapshot, credit estimate, and reservation IDs;
- uses mock-safe bounded execution only;
- produces private artifact manifest entries;
- emits one idempotent tool cost event per adapter;
- replays the first gateway dispatch and first cost event to prove no double execution or double charge;
- builds an operator dashboard and beta readiness snapshot.

## Boundaries

This milestone does not enable live provider calls, direct frontend tool execution, real user media, real tool binaries, Docker, media processing, Supabase writes, billing mutation, external beta, paid production, public artifacts, or signed URLs.

Product-ready local OSS tools remain `0`. External beta, real-user-media beta, and paid production stay blocked until their separate owner evidence and deployment gates pass.

## Decision

Passing smoke output uses:

`trackb_milestone8_internal_beta_e2e_passed_ready_for_controlled_internal_beta`

That decision means controlled internal beta sessions can exercise the backend skeleton with synthetic/private fixtures and mock-safe tool-assisted edit flow. It does not mean the product is externally beta-ready or production-ready.

## Validation

Run:

```bash
npm run smoke:trackb-internal-beta-e2e
npm run smoke:trackb-adapter-pack
npm run smoke:tool-execution-gateway
npm run smoke:worker-runtime-artifact-pipeline
npm run smoke:tool-cost-metering
npm run smoke:frontend-chat-tool-ux
npm run typecheck:server
git diff --check
```
