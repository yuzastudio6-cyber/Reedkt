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

In mock mode, stored evidence is in-memory only. In non-mock mode, evidence writes require the `beta_readiness_evidence_packets` migration and backend service-role path; missing persistence fails closed instead of silently enabling beta. These routes do not reserve or spend credits, call providers, run tools, enable beta, or mark production ready by themselves. They make the gate executable from backend callers, so blocker state is computed from explicit evidence instead of a hidden hardcoded wall. Unknown tools, unknown checklist items, duplicate downstream evidence, and secret-like payloads fail closed.

Core real-check evidence is deliberately narrow: it may run version checks, Python imports, and Node package metadata resolution already defined by the production readiness specs. It does not process media, render/export, run providers, download models, run Docker, or accept missing tools. A tool is counted as product-ready local OSS only when the request explicitly accepts production readiness and product-ready local OSS for passed checks.

For local core Python readiness proof, run `npm run tools:readiness:install-core-python` to hydrate the ignored `.reeditpro-tool-readiness-python/` virtualenv from `docker/prod/tool-readiness-worker/requirements.readiness.txt`, then run `npm run smoke:prod-core-python-readiness`. This imports only the safe core Python packages (`av`, `scenedetect`, `cv2`, `duckdb`, `polars`, `opentimelineio`, `PyOpenColorIO`, and `OpenImageIO`) and must not process media, transform images, run color pipelines, run Docker, call providers, or enable beta/production.

## Evidence-Driven Policy

The beta go/no-go policy is not a permanent hardcoded block. External beta, real-user-media beta, and paid production are computed from supplied evidence and approvals:

- dry-run and safety/cost documentation must pass;
- production readiness must not be blocked;
- required checklist items must not be blocked;
- deployment, security, storage/privacy, model/license, legal, monitoring, and support approvals must be present;
- real-user-media beta and paid production require their own explicit approvals.

The default repo state remains blocked because those approvals and real execution proofs are not present yet.

Every blocked state must remain paired with an unblock path. If a tool, checklist item, or platform gate is blocked, the report must describe the missing evidence and the next safe lane that can collect it. This policy keeps beta and production guarded, but prevents blockers from becoming intentional permanent walls when a smaller source-review, local-proof, diagnostics, or QA step can safely move the tool lane forward.

## Why This Does Not Flip Beta On

The current evidence is dry-run and source-of-truth only. External beta needs real bounded runtime checks, deployment/storage/security approvals, deployed and verified cost persistence, model/license approvals, monitoring, rollback, and support readiness.

The gate is intentionally strict but no longer uses one permanent per-tool billing wall, one permanent platform billing wall, or a permanent product-ready `false`. If any tool lacks coverage, readiness evidence, model approval, or product-ready acceptance, external beta and paid production remain blocked for that tool. If shared billing deployment/QA is unverified, external beta and paid production remain blocked at the platform level.
