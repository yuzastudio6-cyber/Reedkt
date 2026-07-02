# Production Tool Execution Readiness Gate

Milestone 10 adds one auditable paid-production gate for tool execution. It does not deploy, run tools, call Supabase, call Stripe, mutate wallets, dispatch workers, process media, or enable production by itself.

The gate can pass only when the production evidence packet proves:

- Supabase production persistence is deployed and reviewed, including explicit Data API grants for the intended roles, backend-only beta evidence access, authenticated RLS member/non-member readback, and service-role write/readback evidence.
- Tool cost ledger writes are durable, append-only, idempotent, and readable.
- Wallet reserve, spend, release, refund, settlement replay, and service-role-only settlement RPC execution are verified.
- Stripe remains separated from tool cost event recording and wallet settlement.
- Observability dashboards, alerts, and billing QA monitoring are deployed.
- Rollback, kill switches, rate limits, concurrency limits, and incident runbooks are approved.
- All production tools have accepted production evidence and model/license review.
- Hard safety invariants remain enforced: approved snapshots, credit estimate/reservation, idempotency, raw prompt/secret rejection, no signed URLs as source truth, backend-only heavy execution, and no silent billing.
- Final owners approve deployment, security, storage/privacy, legal, support, billing, operations, real-user-media beta, artifact privacy, paid production, and final delivery/share.

Every production evidence section must also include non-secret provenance:

- `evidenceArtifactId`: a durable internal artifact/attestation ID, not a signed URL or secret-bearing path.
- `reviewedBy`: the owner/operator reviewer reference.
- `reviewedAt`: an exact ISO timestamp for the review.

The gate rejects sections that only provide booleans and notes without this provenance. This keeps paid-production readiness tied to auditable artifacts rather than informal status text.

The default local report stays blocked because no real production evidence is supplied. The smoke test uses a controlled complete fixture to prove the policy can graduate when every required field exists.

Commands:

```bash
npm run smoke:production-tool-execution-readiness-gate
npm run smoke:production-tool-execution-readiness-api
npm run smoke:production-tool-execution-readiness-evidence-preflight
npm run prod:readiness:tool-execution-gate-preflight
npm run prod:readiness:tool-execution-gate
```

This is the bridge between beta readiness and paid production. It makes the remaining blockers exact evidence gaps instead of permanent hardcoded no-rules.

Use `prod:readiness:tool-execution-gate-preflight` before the final gate report. The preflight reads non-secret operator evidence variables, checks for missing production evidence, rejects secret-like notes, and tells operators whether the supplied packet is ready to evaluate against the paid-production gate. It does not call Supabase, Stripe, workers, tools, media processors, deployments, or production routes.

For CLI preflight input, `REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY` and `REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_AT` apply to the reviewed packet, while each evidence section has its own artifact ID, for example `REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_ARTIFACT_ID`, `REEDITPRO_PRODUCTION_WALLET_EVIDENCE_ARTIFACT_ID`, `REEDITPRO_PRODUCTION_STRIPE_EVIDENCE_ARTIFACT_ID`, and `REEDITPRO_PRODUCTION_OWNER_EVIDENCE_ARTIFACT_ID`.

Backend callers can also evaluate the same evidence packet with:

```http
POST /v1/beta-readiness/production-tool-execution-readiness/evaluate
```

The route is authenticated and report-only. It returns a blocked readiness report when evidence is incomplete, returns a passing report only when every production gate is supplied, and rejects secret-like evidence as validation failure. It does not record evidence, dispatch workers, run tools, process media, mutate wallets, call Supabase, call Stripe, or enable beta/production by itself.

The backend tool execution gateway also fail-closes `production_ready` dispatch unless the request carries a passing production readiness evidence packet in `productionReadinessEvidence`. The gateway checks that the evidence workspace/project matches the dispatch workspace/project, evaluates the same production gate, and returns the readiness report with the gateway result. Missing, incomplete, mismatched, staging-only, or secret-like evidence blocks before worker dispatch. Non-production dry-run and mock-safe gateway modes do not require this all-up paid-production packet.

`production_ready` dispatch now also has a backend-owned operations-control admission step immediately before new worker dispatch. The admission step checks active production kill switches, workspace job-creation rate limits, project concurrency limits, and worker-type concurrency limits. Local/mock runtime uses deterministic in-memory counters for smoke coverage. Non-mock runtime defaults kill switches active unless backend environment explicitly opens them and reads persistent `api_idempotency_keys` plus `worker_leases` for rate/concurrency readback; missing deployed control sources fail closed before worker dispatch or billing audit.

After a production-ready gateway request reaches the backend worker path, the gateway records a tool-cost event and wallet settlement audit through the existing metering services. In mock/local mode this stays in memory; in non-mock mode it uses the persistent service-role path and settlement RPC, failing closed if the deployed billing backend is missing. The emitted events keep `serviceFeeIncluded=false`, preserve Stripe isolation, and are idempotent on the worker idempotency key. The current worker route remains a placeholder until a later execution milestone replaces it with real tool handlers.

The Supabase migrations used by the tool-cost ledger now declare the Data API exposure intentionally instead of relying on default public-schema grants. `tool_cost_events` and `tool_cost_wallet_settlements` grant authenticated `select` only through their RLS policies and grant backend `service_role` read/insert for persistent writes. `beta_readiness_evidence_packets` remains backend-only with no authenticated read/write grant. The `settle_tool_cost_event` security-definer RPC revokes default public/authenticated execution and grants execute only to `service_role`.
