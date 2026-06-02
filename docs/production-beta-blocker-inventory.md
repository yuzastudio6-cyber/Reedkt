# Production Beta Blocker Inventory

This inventory records blockers before production-level beta. Prompt 18 does not clear these blockers.

| Severity | Blocker | Why it matters | Risk | Required fix | Owner/milestone | Can beta proceed without it? | Must be done before production beta? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Critical | E2E staging smoke not run | No integrated evidence exists. | Unknown cross-domain failures. | Run approved staging smoke with synthetic fixtures. | Prompt 19/31 | No for production beta. | Yes |
| Critical | Local/staging Supabase/RLS not executed | Access policies are not proven. | Cross-workspace data exposure. | Repair validation environment and run scoped SQL. | Prompt 19 | No. | Yes |
| Critical | Remote/staging migration not validated | Schema chain may not apply cleanly. | Runtime data corruption or missing tables. | Validate migration chain in approved environment. | Prompt 19 | No. | Yes |
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
| Medium | Supabase CLI architecture blocker | Local SQL validation blocked. | Slower RLS iteration. | Install compatible CLI or container path. | Prompt 19 | Yes for static planning only. | Yes before production beta |

## Decision

Production beta cannot proceed. The next safe milestone is staging Supabase/RLS validation preparation after Prompt 18 static diagnostics and GitHub Foundation Validation pass.
