# Production Tool Execution Readiness Gate

Milestone 10 adds one auditable paid-production gate for tool execution. It does not deploy, run tools, call Supabase, call Stripe, mutate wallets, dispatch workers, process media, or enable production by itself.

The gate can pass only when the production evidence packet proves:

- Supabase production persistence is deployed and reviewed.
- Tool cost ledger writes are durable, append-only, idempotent, and readable.
- Wallet reserve, spend, release, refund, and settlement replay are verified.
- Stripe remains separated from tool cost event recording and wallet settlement.
- Observability dashboards, alerts, and billing QA monitoring are deployed.
- Rollback, kill switches, rate limits, concurrency limits, and incident runbooks are approved.
- All production tools have accepted production evidence and model/license review.
- Hard safety invariants remain enforced: approved snapshots, credit estimate/reservation, idempotency, raw prompt/secret rejection, no signed URLs as source truth, backend-only heavy execution, and no silent billing.
- Final owners approve deployment, security, storage/privacy, legal, support, billing, operations, real-user-media beta, artifact privacy, paid production, and final delivery/share.

The default local report stays blocked because no real production evidence is supplied. The smoke test uses a controlled complete fixture to prove the policy can graduate when every required field exists.

Commands:

```bash
npm run smoke:production-tool-execution-readiness-gate
npm run smoke:production-tool-execution-readiness-evidence-preflight
npm run prod:readiness:tool-execution-gate-preflight
npm run prod:readiness:tool-execution-gate
```

This is the bridge between beta readiness and paid production. It makes the remaining blockers exact evidence gaps instead of permanent hardcoded no-rules.

Use `prod:readiness:tool-execution-gate-preflight` before the final gate report. The preflight reads non-secret operator evidence variables, checks for missing production evidence, rejects secret-like notes, and tells operators whether the supplied packet is ready to evaluate against the paid-production gate. It does not call Supabase, Stripe, workers, tools, media processors, deployments, or production routes.
