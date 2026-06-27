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

## Evidence-Driven Policy

The beta go/no-go policy is not a permanent hardcoded block. External beta, real-user-media beta, and paid production are computed from supplied evidence and approvals:

- dry-run and safety/cost documentation must pass;
- production readiness must not be blocked;
- required checklist items must not be blocked;
- deployment, security, storage/privacy, model/license, legal, monitoring, and support approvals must be present;
- real-user-media beta and paid production require their own explicit approvals.

The default repo state remains blocked because those approvals and real execution proofs are not present yet.

## Why This Does Not Flip Beta On

The current evidence is dry-run and source-of-truth only. External beta needs real bounded runtime checks, deployment/storage/security approvals, deployed and verified cost persistence, model/license approvals, monitoring, rollback, and support readiness.

The gate is intentionally strict but no longer uses one permanent per-tool billing wall or a permanent product-ready `false`. If any tool lacks coverage, readiness evidence, model approval, or product-ready acceptance, external beta and paid production remain blocked for that tool. If shared billing deployment/QA is unverified, external beta and paid production remain blocked at the platform level.
