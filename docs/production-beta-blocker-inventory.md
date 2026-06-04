# Production Beta Blocker Inventory

This inventory records blockers before production-level beta. Prompt 18 does not clear these blockers.

| Severity | Blocker | Why it matters | Risk | Required fix | Owner/milestone | Can beta proceed without it? | Must be done before production beta? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Critical | E2E staging smoke not run | No integrated evidence exists. | Unknown cross-domain failures. | Run approved staging smoke with synthetic fixtures. | Prompt 19/31 | No for production beta. | Yes |
| Critical | Local/staging Supabase/RLS not executed | Access policies are not proven. | Cross-workspace data exposure. | Run the existing first local executable SQL candidate through the guarded runner; staging SQL requires later human approval. | Prompt 20B-Retry | No. | Yes |
| Critical | Remote/staging migration not validated | Schema chain may not apply cleanly. | Runtime data corruption or missing tables. | Use the approved local evidence package first, then stage only with explicit approval. | Prompt 20B-Retry, then staging approval packet | No. | Yes |
| Critical | Service-role backend persistence not enabled | Writes remain backend-required. | Fake readiness could be mistaken for production. | Add reviewed transactional services. | Future backend milestones | No. | Yes |
| Critical | Real signed upload/download not validated | Private media boundary is unproven. | Data exposure or broken upload flow. | Validate private storage and signed URL policy. | Storage validation milestone | No. | Yes |
| Critical | Credit transactional mutation not enabled | Spend/reserve/refund cannot be trusted. | Unbounded cost or billing mismatch. | Implement transactional credit ledger. | Credit runtime milestone | No. | Yes |
| Critical | Real job queue/worker claims not enabled | Execution cannot safely start. | Duplicate jobs or unsafe claims. | Implement transactional claims/leases. | Worker runtime milestone | No. | Yes |
| Critical | Production deployment not done | No deployed runtime to test. | Release cannot operate. | Add deployment, rollback, monitoring. | Deployment milestone | No. | Yes |
| High | Approved snapshot persistence not production-enabled | Workers need immutable execution input. | Workers could use mutable/raw inputs. | Validate snapshot writes and RLS. | Snapshot runtime milestone | No. | Yes |
| High | Real media probe/transcript/timing not enabled | Planning/render gates lack media facts. | Bad edits or unsafe media assumptions. | Add reviewed media workers. | Media runtime milestone | No for real media beta. | Yes |
| High | Real render/preview/export not enabled | Users cannot receive outputs. | Beta cannot complete edit lifecycle. | Add render/export runtime. | Render milestone | No for user beta. | Yes |
| High | Real QA/revision/fallback not enabled | Output quality and recovery are unproven. | Bad results or unresolved failures. | Add QA/revision runtime. | QA milestone | No for production beta. | Yes |
| High | Real tool execution not enabled | Controlled tool promises remain planning-only. | Misleading capability. | Complete compliance/runtime approval and workers. | Tool runtime milestone | Yes for no-tool beta only. | Yes if tools advertised |
| High | Real provider gateway not enabled | AI asset/provider generation unavailable. | Generation paths blocked. | Add secret, request, webhook, output runtime. | Provider milestone | Yes for no-provider beta only. | Yes if providers advertised |
| High | Compliance/legal/security not human-approved | AI docs are not approvals. | License/security/legal exposure. | Human review and signed approval record. | Compliance milestone | No. | Yes |
| High | External observability not enabled | Incidents may be invisible. | Poor operations and audit gaps. | Add reviewed telemetry/alerts. | Observability milestone | No for production beta. | Yes |
| High | Rate limits/cost controls not persistent | Abuse and spend are not bounded. | Cost overruns and abuse. | Add persistent enforcement. | Ops/cost milestone | No. | Yes |
| High | Stripe/billing not implemented | Paid beta cannot bill/refund safely. | Billing failure. | Add Stripe after credit ledger. | Billing milestone | Yes for free closed test only. | Yes for paid beta |
| Medium | Source-of-truth drift risk | Long PR stack can drift. | Confusing implementation targets. | Keep tracker and map updated. | Every prompt | Yes if monitored. | Yes |
| Medium | Local host Node/npm architecture blocker | Local validation is inconsistent. | Developer validation gaps. | Use compatible Node path or CI. | Validation milestone | Yes with CI. | No if CI passes |
| Medium | Local Supabase migration-chain blocker | Local SQL validation was blocked. | Slower RLS iteration and no RLS execution evidence. | Prompt 20P2 confirms local `supabase start` now passes and localhost DB evidence is captured. The blocker has moved from migration-chain repair to first SQL smoke execution. | Prompt 20B-Retry | Yes for static planning only. | Yes before production beta |

## Decision

Prompt 20P2 repairs the later storage-schema comment ownership blocker, and local `supabase start` now completes with localhost DB evidence. Production beta still cannot proceed because local SQL/RLS smoke tests and staging Supabase/RLS have not executed. The next safe milestone is Prompt 20B-Retry - Local RLS First Executable Smoke Test Run.
