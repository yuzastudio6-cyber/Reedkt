# Production Tool Execution Readiness Gate

Milestone 10 adds one auditable paid-production gate for tool execution. It does not deploy, run tools, call Supabase, call Stripe, mutate wallets, dispatch workers, process media, or enable production by itself.

The gate can pass only when the production evidence packet proves:

- Supabase production persistence is deployed and reviewed, including explicit Data API grants for the intended roles, backend-only beta and production readiness evidence access, authenticated RLS member/non-member readback, and service-role write/readback evidence.
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
npm run smoke:production-tool-execution-readiness-evidence-collector
npm run smoke:production-tool-execution-readiness-evidence-bundle
npm run smoke:production-billing-evidence-collector
npm run smoke:production-ops-observability-evidence-collector
npm run smoke:production-final-owner-signoff-evidence-collector
npm run smoke:production-supabase-persistence-evidence-collector
npm run smoke:production-wallet-lifecycle-evidence-collector
npm run smoke:production-stripe-boundary-evidence-collector
npm run smoke:production-real-worker-handler-readiness
npm run prod:readiness:tool-execution-gate-preflight
npm run prod:readiness:tool-execution-evidence-bundle
npm run prod:readiness:tool-execution-evidence-collector
npm run prod:readiness:billing-evidence-collector
npm run prod:readiness:ops-observability-evidence-collector
npm run prod:readiness:final-owner-signoff-evidence-collector
npm run prod:readiness:supabase-persistence-evidence-collector
npm run prod:readiness:wallet-lifecycle-evidence-collector
npm run prod:readiness:stripe-boundary-evidence-collector
npm run prod:readiness:real-worker-handler-readiness
npm run prod:readiness:tool-execution-gate
```

This is the bridge between beta readiness and paid production. It makes the remaining blockers exact evidence gaps instead of permanent hardcoded no-rules.

Use `prod:readiness:tool-execution-gate-preflight` before the final gate report. The preflight reads non-secret operator evidence variables, checks for missing production evidence, rejects secret-like notes, and tells operators whether the supplied packet is ready to evaluate against the paid-production gate. It does not call Supabase, Stripe, workers, tools, media processors, deployments, or production routes.

For CLI preflight input, `REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY` and `REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_AT` apply to the reviewed packet, while each evidence section has its own artifact ID, for example `REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_ARTIFACT_ID`, `REEDITPRO_PRODUCTION_WALLET_EVIDENCE_ARTIFACT_ID`, `REEDITPRO_PRODUCTION_STRIPE_EVIDENCE_ARTIFACT_ID`, and `REEDITPRO_PRODUCTION_OWNER_EVIDENCE_ARTIFACT_ID`. Supabase persistence evidence must separately prove `tool_cost_events`, `beta_readiness_evidence_packets`, and `production_tool_execution_readiness_evidence_packets` deployment/readback with `REEDITPRO_PRODUCTION_SUPABASE_TOOL_COST_EVENTS_MIGRATION_DEPLOYED`, `REEDITPRO_PRODUCTION_SUPABASE_BETA_EVIDENCE_MIGRATION_DEPLOYED`, and `REEDITPRO_PRODUCTION_SUPABASE_PRODUCTION_EVIDENCE_MIGRATION_DEPLOYED`. Backend-only packet access must be proven separately for beta evidence and production readiness evidence with `REEDITPRO_PRODUCTION_SUPABASE_BETA_EVIDENCE_BACKEND_ONLY_VERIFIED` and `REEDITPRO_PRODUCTION_SUPABASE_PRODUCTION_EVIDENCE_BACKEND_ONLY_VERIFIED`.

Use `prod:readiness:tool-execution-evidence-bundle` as the dry-run operator runbook before collecting or recording production evidence. It forces all collector record confirmations off, runs the focused slice collectors in dry-run mode, reports section readiness and blockers, and prints the recommended sequence from Supabase persistence through final all-up evidence record/readback. The bundle never calls backend routes, Supabase, Stripe, workers, tools, media processors, deployments, or production.

Use `prod:readiness:real-worker-handler-readiness` after the all-up evidence collector and before any final production execution go/no-go. This static source check verifies whether production gateway adapters and production worker routes have reviewed real backend handler coverage. The current source intentionally reports decision `production_real_worker_handler_readiness_blocked_by_partial_handler_coverage`: the bounded `cpu_analysis_worker_media_probe` adapter can dispatch a production-ready `ffprobe` probe/report handler, the `cpu_analysis_worker_media_audio_extract` adapter can dispatch a production-ready private FFmpeg extracted-audio handler with `ffprobe` evidence and artifact manifest records, the `cpu_analysis_worker_media_proxy` adapter can dispatch a production-ready private FFmpeg proxy handler with `ffprobe` evidence and artifact manifest records, the `cpu_analysis_worker_media_keyframes` and `cpu_analysis_worker_media_representative_frames` adapters can dispatch production-ready private FFmpeg frame extraction handlers with `ffprobe` evidence and artifact manifest records, the `cpu_analysis_worker_smart_cut_timeline` adapter can dispatch production-ready approved timeline metadata, OTIO-style manifest, and QA-report generation without final export, the `cpu_analysis_worker_audio_metadata` adapter can dispatch production-ready audio analysis, loudness command metadata, SoundSync cue metadata, and QA-report generation without cleanup, stems, final mux, or export, the `cpu_analysis_worker_color_metadata` adapter can dispatch production-ready color analysis, grade recipe, and QA-report metadata without native color transforms or final export, and the `tool_readiness_worker_core_checks` adapter can dispatch non-user-billable core command/import/package readiness checks. `production_ready` placeholder adapters are blocked, but the all-up gate remains blocked because the rest of the production gateway adapters and worker routes still include placeholder/mock-only coverage. Passing Supabase, billing, wallet, Stripe, ops, owner evidence, and bounded real handlers remains necessary but is not sufficient for broad production execution until the remaining placeholders are retired or a later owner go/no-go explicitly narrows production scope to reviewed handler coverage. The command reads source files only; it does not call backend routes, dispatch workers, run tools, process media, call Supabase, call Stripe, or activate production.

Use `prod:readiness:supabase-persistence-evidence-collector` to isolate the Supabase production persistence slice before final all-up recording. The collector verifies non-secret provenance for production environment, `tool_cost_events`, `beta_readiness_evidence_packets`, `production_tool_execution_readiness_evidence_packets`, service-role write path, authenticated RLS readback, explicit Data API grants, backend-only beta/production evidence access, backup/PITR approval, Security Advisor review, Performance Advisor review, and private storage policy verification. It defaults to dry-run mode and does not call the backend unless `REEDITPRO_PRODUCTION_SUPABASE_PERSISTENCE_CONFIRM_RECORD_EVIDENCE=true` is supplied. Confirmed mode reuses the same authenticated production-readiness evidence route and still requires every other paid-production evidence section to pass; Supabase persistence evidence alone cannot unlock production. The collector never connects to Supabase, runs SQL, deploys migrations, changes grants, mutates storage, runs tools, dispatches workers, or activates beta/production.

Use `prod:readiness:wallet-lifecycle-evidence-collector` to isolate the wallet lifecycle slice before final all-up recording. The collector verifies non-secret provenance for credit reservation, spend settlement, release settlement, refund settlement, settlement RPC deployment, service-role-only RPC execution, idempotent settlement replay, and no silent-charge behavior. It defaults to dry-run mode and does not call the backend unless `REEDITPRO_PRODUCTION_WALLET_LIFECYCLE_CONFIRM_RECORD_EVIDENCE=true` is supplied. Confirmed mode reuses the same authenticated production-readiness evidence route and still requires every other paid-production evidence section to pass; wallet lifecycle evidence alone cannot unlock production. The collector never mutates wallets, writes ledgers directly, connects to Supabase directly, calls Stripe, runs tools, dispatches workers, processes media, or activates beta/production.

Use `prod:readiness:stripe-boundary-evidence-collector` to isolate the Stripe boundary slice before final all-up recording. The collector verifies non-secret provenance for billing-owner approval, no Stripe calls from tool-cost surfaces, service-fee exclusion from tool events, and webhook separation from the tool ledger. It defaults to dry-run mode and does not call the backend unless `REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_CONFIRM_RECORD_EVIDENCE=true` is supplied. Confirmed mode reuses the same authenticated production-readiness evidence route and still requires every other paid-production evidence section to pass; Stripe boundary evidence alone cannot unlock production. The collector never imports Stripe, calls Stripe, mutates billing records, mutates wallets, writes Supabase directly, runs tools, dispatches workers, processes media, or activates beta/production.

Use `prod:readiness:tool-execution-evidence-collector` only after the preflight is complete. The collector defaults to dry-run mode and performs no HTTP calls unless `REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_EVIDENCE=true` is supplied with `REEDITPRO_PRODUCTION_READINESS_API_BASE_URL`, `REEDITPRO_PRODUCTION_READINESS_BEARER_TOKEN`, and `REEDITPRO_PRODUCTION_READINESS_IDEMPOTENCY_KEY`. When confirmed, it posts the passing evidence packet through the authenticated backend route, uses the idempotency key for replay safety, reads the workspace packet back through the backend route, and redacts the bearer token from the summary. The collector never writes Supabase directly and does not run tools, dispatch workers, mutate wallets, call Stripe, process media, deploy, or activate production.

Use `prod:readiness:ops-observability-evidence-collector` to isolate the observability and operations-control slice before final all-up recording. The collector checks that dashboards, alerts, alert routing, billing QA monitoring, rollback approval, kill-switch verification, rate limits, concurrency limits, incident runbook approval, catalog coverage, and static cost-control policies are all backed by non-secret provenance. It defaults to dry-run mode and does not call the backend unless `REEDITPRO_PRODUCTION_OPS_OBSERVABILITY_CONFIRM_RECORD_EVIDENCE=true` is supplied. Confirmed mode reuses the same authenticated production-readiness evidence route and still requires the complete paid-production evidence packet; ops/observability evidence alone cannot unlock production. The collector never deploys dashboards or alerts, mutates Supabase directly, runs tools, dispatches workers, mutates wallets, calls Stripe, processes media, or activates beta/production.

Use `prod:readiness:final-owner-signoff-evidence-collector` to isolate the final owner signoff slice before final all-up recording. The collector verifies non-secret provenance and explicit approval for deployment, security, storage/privacy, legal, support, billing, operations, real-user-media beta, private media, artifact privacy, paid production, and final delivery/share. It defaults to dry-run mode and does not call the backend unless `REEDITPRO_PRODUCTION_OWNER_SIGNOFF_CONFIRM_RECORD_EVIDENCE=true` is supplied. Confirmed mode reuses the same authenticated production-readiness evidence route and still requires every other paid-production evidence section to pass; owner signoff alone cannot unlock production. The collector never grants approvals by itself, deploys, mutates Supabase directly, runs tools, dispatches workers, mutates wallets, calls Stripe, processes media, or activates beta/production.

Backend callers can also evaluate the same evidence packet with:

```http
POST /v1/beta-readiness/production-tool-execution-readiness/evaluate
```

The route is authenticated and report-only. It returns a blocked readiness report when evidence is incomplete, returns a passing report only when every production gate is supplied, and rejects secret-like evidence as validation failure. It does not record evidence, dispatch workers, run tools, process media, mutate wallets, call Supabase, call Stripe, or enable beta/production by itself.

Passing production evidence can be recorded through the backend-only evidence packet surface:

```http
POST /v1/beta-readiness/production-tool-execution-readiness/evidence
GET /v1/beta-readiness/production-tool-execution-readiness/evidence?workspaceId=...
```

The POST route is authenticated, requires an idempotency key, re-evaluates the same production gate, rejects blocked or secret-like evidence, and stores only passing packets. Local/mock mode stores packets in memory for deterministic smoke coverage. Non-mock backend mode uses the service-role Supabase path and fails closed if the `production_tool_execution_readiness_evidence_packets` migration is missing or unavailable. The paid-production gate also requires operator evidence that this migration is deployed and read back before it will accept Supabase production persistence as complete. Duplicate submissions for the same workspace and idempotency key replay the original packet instead of creating a second production approval artifact.

The GET route is authenticated and returns production evidence packet readback for a workspace. Recording or reading these packets does not deploy, run tools, process media, call Stripe, mutate wallets, dispatch workers, or enable paid production. It only makes the final all-up readiness decision durable enough for owner review and audit.

The backend tool execution gateway also fail-closes `production_ready` dispatch unless the request carries either a passing inline production readiness packet in `productionReadinessEvidence` or a durable `productionReadinessEvidencePacketId` that resolves to a stored packet for the request workspace. Supplying both is blocked as ambiguous. The gateway checks that the evidence workspace/project matches the dispatch workspace/project, re-evaluates the same production gate, and returns the readiness report with the gateway result. Missing, unknown, incomplete, mismatched, staging-only, or secret-like evidence blocks before worker dispatch. Non-production dry-run and mock-safe gateway modes do not require this all-up paid-production packet.

When a stored packet ID is used, the gateway echoes `productionReadinessEvidencePacketId` in the gateway result and carries it into the mock worker runtime job record. This ties production-ready dispatch attempts back to the durable owner-reviewed evidence artifact without requiring callers to resend the full evidence body for every dispatch.

`production_ready` dispatch now also has a backend-owned operations-control admission step immediately before new worker dispatch. The admission step checks active production kill switches, workspace job-creation rate limits, project concurrency limits, and worker-type concurrency limits. Local/mock runtime uses deterministic in-memory counters for smoke coverage. Non-mock runtime defaults kill switches active unless backend environment explicitly opens them and reads persistent `api_idempotency_keys` plus `worker_leases` for rate/concurrency readback; missing deployed control sources fail closed before worker dispatch or billing audit.

After a production-ready gateway request reaches a reviewed backend worker handler, the gateway records a tool-cost event and wallet settlement audit through the existing metering services. In mock/local mode this stays in memory; in non-mock mode it uses the persistent service-role path and settlement RPC, failing closed if the deployed billing backend is missing. The emitted events keep `serviceFeeIncluded=false`, preserve Stripe isolation, and are idempotent on the worker idempotency key. The current bounded real handler coverage is limited to `ffprobe` probe/report execution through `cpu_analysis_worker_media_probe`, private extracted-audio artifact creation through `cpu_analysis_worker_media_audio_extract`, private proxy artifact creation through `cpu_analysis_worker_media_proxy`, private keyframe image artifact creation through `cpu_analysis_worker_media_keyframes`, private representative-frame artifact creation through `cpu_analysis_worker_media_representative_frames`, approved smart-cut/timeline metadata and OTIO-style manifest generation through `cpu_analysis_worker_smart_cut_timeline`, bounded audio analysis/loudness/SoundSync/QA metadata generation through `cpu_analysis_worker_audio_metadata`, bounded color analysis/grade-recipe/QA metadata generation through `cpu_analysis_worker_color_metadata`, and internal `tool_readiness_worker_core_checks` readiness inspection. Tool-readiness events are audit-only and non-user-billable. Audio extraction, proxy generation, keyframe extraction, representative-frame extraction, smart-cut/timeline metadata generation, audio metadata/QA generation, and color metadata/QA generation are billable only after plan, credit, reservation, ops, and production-readiness gates pass, and each records private source-of-truth artifact manifest entries without signed URLs. Native audio cleanup, stems, final mux, native color transforms, transcript/scene/OCR/mask/render/export handlers, and broad media processing remain blocked until each handler has its own reviewed production path.

The Supabase migrations used by the tool-cost ledger now declare the Data API exposure intentionally instead of relying on default public-schema grants. `tool_cost_events` and `tool_cost_wallet_settlements` grant authenticated `select` only through their RLS policies and grant backend `service_role` read/insert for persistent writes. `beta_readiness_evidence_packets` and `production_tool_execution_readiness_evidence_packets` remain backend-only with no authenticated read/write grant. The `settle_tool_cost_event` security-definer RPC revokes default public/authenticated execution and grants execute only to `service_role`.
