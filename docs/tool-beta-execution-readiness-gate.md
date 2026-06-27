# Tool Beta Execution Readiness Gate

This gate answers whether the registered ReEditPro production tools are ready for external beta or paid production execution.

Current status in this branch:

- Production registry tools: 49
- Tool cost owner coverage records: 49
- Production readiness specs: 49
- Product-ready local OSS tools: 0
- Tool-specific blockers: 184
- Platform blockers: 1 billing deployment/QA gate
- External beta tool execution: blocked
- Paid production tool execution: blocked

## What The Gate Checks

- Every `ProductionToolId` has a metering owner case.
- Every `ProductionToolId` has a production readiness spec.
- Every tool records worker/image readiness boundaries.
- Every tool remains behind approved plan, credit estimate, credit reservation, and idempotent event gates.
- Real command/import/container execution remains required before external beta.
- Model/checkpoint-backed tools remain blocked until model source, license, checksum, and staging approvals pass.
- Durable tool cost event persistence now has a Supabase-backed source skeleton and local migration artifact.
- Billing deployment remains a platform blocker until the migration, RLS/service-role path, wallet settlement, Stripe boundary, monitoring, and billing QA are verified.
- Product-ready local OSS remains `0` until a later QA gate accepts real runtime evidence.

## Evidence Acceptance

The tool execution gate is no longer a permanent hardcoded `false` for product readiness. A future QA packet can provide accepted per-tool evidence with:

- a known `toolId`;
- a non-empty source ID;
- passed or warning readiness status;
- real execution verification;
- production-readiness acceptance;
- product-ready local OSS acceptance;
- model/checkpoint approval when required.

Evidence is accepted only per named tool. Duplicate evidence for the same tool fails closed, unknown tool IDs fail closed, and accepted evidence for one tool does not bypass platform blockers or remaining tools' blockers.

The shared platform blocker is also evidence-driven. It clears only when a staging or production evidence packet proves:

- `tool_cost_events` migration deployment;
- backend service-role event writes;
- authenticated RLS member reads;
- idempotent replay;
- wallet settlement behavior;
- Stripe boundary behavior;
- monitoring;
- billing QA;
- deployment, security, storage, legal, and support approvals.

Partial platform evidence stays blocked and names the missing requirement.

Top-level beta checklist blockers can also be cleared only with explicit checklist evidence. The evidence must name a known checklist item, include a source ID, carry `passed` or `warning` status, and include notes. Duplicate checklist evidence fails closed.

## Backend Evaluation API

The backend now exposes an authenticated, mock-safe evaluation surface for this gate:

- `GET /v1/beta-readiness` returns the default source-of-truth readiness report.
- `POST /v1/beta-readiness/evaluate` accepts structured evidence for checklist items, per-tool accepted execution, platform billing/deployment readiness, and human approvals, then returns the computed report.
- `POST /v1/beta-readiness/evidence` records a sanitized evidence packet idempotently and returns the computed report.
- `GET /v1/beta-readiness/evidence` lists stored evidence packets, the merged evidence view, and the computed report.
- `POST /v1/beta-readiness/evidence/core-real-check` runs only the bounded core command/import/package-metadata checks and records accepted evidence only for tools that actually pass those checks.
- `GET /v1/beta-readiness/platform-preflight` returns a read-only local platform evidence preflight. It verifies source artifacts such as migration files and backend route/store wiring, names the staging/production-only evidence still missing, and does not write evidence or open beta/production gates.
- `POST /v1/beta-readiness/platform-billing-qa` runs an idempotent platform billing QA harness. In mock mode it records a controlled in-memory tool-cost event, replays the same idempotency key, reads the project summary, confirms wallet settlement and Stripe remain separate, invokes the explicit mock wallet-settlement skeleton, and names the staging/production evidence still missing. In non-mock mode, persistent platform billing QA fails closed before writes until a transactional wallet-settlement RPC exists.
- `POST /v1/beta-readiness/platform-deployed-evidence/verify` validates deployed platform probe observations against the backend verifier. By default it is report-only. Recording requires auth, idempotency, `recordEvidence: true`, `confirmRecordEvidence: true`, every deployed probe passing, and every owner approval present. The route records only the resulting platform evidence packet and does not run probes, call Stripe, execute tools, process media, enable external beta, or mark production ready.
- `POST /v1/beta-readiness/platform-deployed-evidence/probe` runs the backend-owned Supabase deployed probe transport. It can read deployed `tool_cost_events` and `beta_readiness_evidence_packets`, optionally write controlled backend-only probe evidence when `allowPersistentProbeWrites=true`, verify idempotent replay, and call the wallet-settlement RPC only when an approved staging fixture event ID is supplied. RLS/member readback, Stripe-boundary, monitoring, and billing-QA evidence remain explicit deployed attestations. Recording still requires a complete packet plus `recordEvidence: true` and `confirmRecordEvidence: true`.
- `npm run beta:tools:core-real-check-evidence-preflight` is the no-network operator preflight for per-tool accepted evidence. It checks staging API/auth/workspace/idempotency presence, source SHA, requested tool IDs, explicit production/product-ready acceptance confirmations, require-accepted-evidence mode, and secret-like notes before any deployed backend call is made. It prints a sanitized readiness report and does not run tool checks or write evidence.
- `npm run beta:tools:core-real-check-evidence` is the operator CLI for the bounded per-tool real-check route. It posts to `/v1/beta-readiness/evidence/core-real-check`, carries only workspace/project/source/tool IDs and non-secret notes, sends the bearer token only in the authorization header, and requires explicit confirmation before requesting production-readiness or product-ready local OSS acceptance. The backend still runs only safe command/import/package metadata checks and records evidence only for tools that actually pass.
- `npm run beta:platform:staging-evidence-preflight` is the no-network operator preflight for the staging collector. It checks only env-var presence, explicit owner approvals, redacted deployed attestations, wallet-settlement fixture ID, record confirmations, source SHA, and secret-like evidence text before any deployed backend call is made. It prints a sanitized readiness report, never prints bearer tokens or service-role secrets, and does not contact Supabase, execute tools, process media, write evidence, enable beta, or enable production.
- `npm run beta:platform:staging-evidence-probe` is the operator CLI for the deployed probe route. It reads staging API URL, bearer token, workspace/project IDs, idempotency key, owner approvals, fixture event ID, and attestation notes from `REEDITPRO_BETA_PLATFORM_*` environment variables, posts to the deployed backend, and prints only a sanitized summary. It does not contain credentials, does not print bearer tokens, and fails closed when `REEDITPRO_BETA_PLATFORM_REQUIRE_READY=true` and the evidence packet is incomplete.
- `POST /v1/tool-costs/events/:toolCostEventId/settle` records an idempotent mock wallet-settlement ledger effect for a tool-cost event in local/mock mode. It is backend-owned, requires auth and idempotency, does not call Stripe, does not include ReEditPro service/edit fees, and in non-mock runtime calls the `settle_tool_cost_event` RPC from the wallet-settlement migration. Missing migration/RPC support fails closed with `TOOL_COST_BACKEND_REQUIRED`.
- `npm run smoke:tool-cost-wallet-settlement:service-role` verifies the non-mock service-role settlement path with a controlled fake Supabase admin client. It checks replay lookup, RPC function/parameter shape, persistent row mapping, Stripe isolation, service-fee exclusion, and fail-closed behavior when the RPC is missing. This smoke does not touch remote Supabase and does not prove deployed service-role credentials.
- `npm run smoke:tool-cost-wallet-settlement:sql` applies the wallet-settlement migration to a disposable local Postgres database with minimal prerequisite tables, settles a billable tool-cost event, replays the same idempotency key without double-spending, settles a provider failure as non-billable, and verifies RLS/policy/source metadata. This is local SQL evidence only; it does not touch remote Supabase, Stripe, providers, media tools, beta, or production.
- `npm run smoke:beta-tools-core-real-check-evidence-cli` verifies the per-tool core real-check evidence CLI request shape, idempotency/auth headers, explicit acceptance confirmations, unknown-tool rejection, secret-like note rejection, require-accepted-evidence failure behavior, and sanitized summary output without touching a deployed backend.
- `npm run smoke:beta-tools-core-real-check-evidence-preflight` verifies the no-network per-tool evidence preflight for complete operator inputs, missing configuration reporting, confirmation-gap reporting, invalid tool rejection, and secret-like note rejection.
- `npm run smoke:beta-platform-rls-readback:sql` applies the tool-cost event, beta evidence, and wallet-settlement migrations to a disposable local Postgres database with Supabase-like `authenticated` role and `auth.uid()` behavior. It verifies a workspace member can read only scoped tool-cost and wallet-settlement rows, a non-member reads none, beta readiness evidence remains backend-only, and authenticated inserts stay denied. This is local RLS evidence only; deployed staging/production readback is still required.
- `npm run smoke:beta-platform-monitoring-catalog` verifies source templates for tool-cost event writes, idempotent replay, persistent write failures, wallet settlement, RLS readback, billing QA missing evidence, and Stripe-boundary violations. These are monitoring templates only; no dashboard or alert is deployed by the smoke.
- `npm run smoke:beta-platform-stripe-boundary` verifies the tool-cost and beta billing surfaces do not depend on Stripe, import Stripe, instantiate Stripe, call Stripe APIs, or lose the `stripeCallAttempted: false` and `serviceFeeIncluded: false` audit markers. This is source evidence only; billing-owner approval remains required.
- `npm run smoke:beta-platform-evidence-manifest` verifies the platform blocker is evidence-driven rather than a permanent hard wall. It maps each remaining shared platform requirement to existing local proof commands, source files, deployed staging/production evidence, owner approvals, and a next safe action. The smoke proves complete platform evidence can clear the shared platform blocker while default/local-only evidence still keeps external beta and production closed.
- `npm run smoke:beta-platform-deployed-evidence-verifier` verifies the backend verifier that will turn real staging/production probe results into a platform evidence packet. The verifier fails closed when any deployed probe is missing, any owner approval is absent, or secret-like material appears in notes. Even a complete platform packet clears only the shared platform blocker; per-tool accepted execution evidence and launch approvals are still separate gates.
- `npm run smoke:beta-platform-deployed-evidence-probes` verifies the adapter that maps deployed migration, service-role, RLS, idempotency, wallet-settlement, Stripe-boundary, monitoring, and billing-QA observations into the verifier's probe contract. A failed transport observation keeps the platform blocker closed.
- `npm run smoke:beta-platform-supabase-deployed-evidence-transport` verifies the backend Supabase transport with a fake service-role client. It proves deployed-table read probes, controlled evidence write/replay probes, wallet-settlement RPC call shape, missing-admin fail-closed behavior, and persistent-write confirmation gating without touching remote Supabase or enabling beta/production.
- `npm run smoke:beta-platform-staging-evidence-collector-cli` verifies the staging evidence collector CLI request shape, secret omission from request bodies/summaries, production-confirmation guard, require-ready failure behavior, and sanitized summary output without touching a remote backend.
- `npm run smoke:beta-platform-staging-evidence-preflight` verifies the no-network preflight for complete staging operator inputs, missing approval/evidence reporting, production rejection for the staging lane, and secret-like evidence rejection.

In mock mode, stored evidence is in-memory only. In non-mock mode, evidence writes require the `beta_readiness_evidence_packets` migration and backend service-role path; missing persistence fails closed instead of silently enabling beta. These routes do not reserve or spend credits, call providers, run tools, enable beta, or mark production ready by themselves. They make the gate executable from backend callers, so blocker state is computed from explicit evidence instead of a hidden hardcoded wall. Unknown tools, unknown checklist items, duplicate downstream evidence, and secret-like payloads fail closed.

Core real-check evidence is deliberately narrow: it may run version checks, Python imports, and Node package metadata resolution already defined by the production readiness specs. It does not process media, render/export, run providers, download models, run Docker, or accept missing tools. A tool is counted as product-ready local OSS only when the request explicitly accepts production readiness and product-ready local OSS for passed checks. Operators should first use `npm run beta:tools:core-real-check-evidence-preflight`, then use `npm run beta:tools:core-real-check-evidence` against staging after dependency/tool installation is complete, with `REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE=true` and `REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE=true` only when the owner intends those passed checks to count as accepted evidence.

For local core Python readiness proof, run `npm run tools:readiness:install-core-python` to hydrate the ignored `.reeditpro-tool-readiness-python/` virtualenv from `docker/prod/tool-readiness-worker/requirements.readiness.txt`, then run `npm run smoke:prod-core-python-readiness`. This imports only the safe core Python packages (`av`, `scenedetect`, `cv2`, `duckdb`, `polars`, `opentimelineio`, `PyOpenColorIO`, and `OpenImageIO`) and must not process media, transform images, run color pipelines, run Docker, call providers, or enable beta/production.

## Evidence-Driven Policy

The beta go/no-go policy is not a permanent hardcoded block. External beta, real-user-media beta, and paid production are computed from supplied evidence and approvals:

- dry-run and safety/cost documentation must pass;
- production readiness must not be blocked;
- required checklist items must not be blocked;
- deployment, security, storage/privacy, model/license, legal, monitoring, and support approvals must be present;
- real-user-media beta and paid production require their own explicit approvals.

The default repo state remains blocked because those approvals and real execution proofs are not present yet. Local service-role path, SQL, monitoring-template, and Stripe-boundary source proof can reduce wallet-settlement, service-role, RLS/readback, monitoring, and Stripe-boundary blockers from "unimplemented source" to "needs deployed staging/prod/owner evidence", but it does not clear the platform gate by itself.

Every blocked state must remain paired with an unblock path. If a tool, checklist item, or platform gate is blocked, the report must describe the missing evidence and the next safe lane that can collect it. This policy keeps beta and production guarded, but prevents blockers from becoming intentional permanent walls when a smaller source-review, local-proof, diagnostics, or QA step can safely move the tool lane forward.

The gate blocks only the unsafe action it is protecting. A tool blocker can block external beta execution for that tool without blocking source classification, package approval, local command/import proof, cost-metering integration, diagnostics, QA review, or rollback planning. A platform blocker can block billable external beta without blocking local source preflights, persistent-store skeletons, migration reviews, monitoring plans, wallet-settlement tests, or owner approval packets. Reports should prefer precise next lanes over broad stop language.

The executable report now exposes this as source-of-truth metadata:

- `blockerPolicy: evidence_driven_block_unsafe_actions_only`
- `safeBlockerReductionAllowed: true`
- `blockedActionScope`, which must name only the unsafe beta/production actions currently closed.

These fields are intentionally separate from `externalBetaToolExecutionAllowed` and `productionToolExecutionAllowed`. They let automation and agents keep building the next bounded unblock step while still refusing live beta/production execution until the required evidence exists.

The platform evidence manifest makes that policy executable. Each shared platform blocker must name the local source/runtime proof already available, the deployed or owner evidence still missing, and the next safe lane that can gather it. A missing platform requirement can block live external beta without blocking source-of-truth review, local SQL proof, service-role call-shape proof, monitoring-template proof, Stripe-boundary proof, billing QA planning, or named owner approval collection.

The deployed platform evidence verifier is the handoff point for the next safe lane. It is designed for a future staging transport to supply verified migration, service-role, RLS, idempotency, wallet-settlement, Stripe-boundary, monitoring, and billing-QA probe results. It does not write the evidence packet by itself and does not carry secrets; recording remains behind the authenticated/idempotent backend evidence route.

The deployed probe adapter and Supabase transport are the tested seam for staging evidence collection. They let real Supabase/readback/monitoring checks plug into the evidence verifier without changing the gate logic, and keep a single failed observation from producing a platform evidence packet. The Supabase transport can do backend-owned table, write, replay, and wallet-settlement probes; it still requires explicit staging attestations for RLS/member readback, Stripe-boundary, monitoring deployment, and billing QA.

The staging evidence collector CLI is the handoff from source readiness to human-run staging validation. Operators should first run `npm run beta:platform:staging-evidence-preflight` with the same `REEDITPRO_BETA_PLATFORM_*` environment variables, fix any reported missing owner approvals or attestations, then run the collector only after staging migrations and backend runtime are deployed, using a staging bearer token and approved fixture IDs. A successful CLI run is still evidence collection, not beta launch; external beta and production remain closed until the resulting evidence packet plus per-tool accepted evidence and launch approvals are present.

## Why This Does Not Flip Beta On

The current evidence is dry-run and source-of-truth only. External beta needs real bounded runtime checks, deployment/storage/security approvals, deployed and verified cost persistence, model/license approvals, monitoring, rollback, and support readiness.

The gate is intentionally strict but no longer uses one permanent per-tool billing wall, one permanent platform billing wall, or a permanent product-ready `false`. If any tool lacks coverage, readiness evidence, model approval, or product-ready acceptance, external beta and paid production remain blocked for that tool. If shared billing deployment/QA is unverified, external beta and paid production remain blocked at the platform level.
