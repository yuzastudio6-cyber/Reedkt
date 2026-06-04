# Production Beta Blocker Inventory

This inventory records blockers before production-level beta. Prompt 23 pending decision recording does not clear these blockers.

Prompt 21 staging Supabase/RLS approval packet remains the approval-preparation baseline; Prompt 22 human approval review adds human review material; Prompt 23 records that no human approval details were supplied.

| Severity | Blocker | Why it matters | Risk | Required fix | Owner/milestone | Can beta proceed without it? | Must be done before production beta? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Critical | E2E staging smoke not run | No integrated evidence exists. | Unknown cross-domain failures. | Run approved staging smoke with synthetic fixtures. | Prompt 19/31 | No for production beta. | Yes |
| Critical | Local/staging Supabase/RLS not executed | Local auth/workspace/project RLS now has partial evidence, but broader local RLS and all staging policies are not proven. Prompt 23 records `pending_human_approval`; staging SQL is not approved. | Cross-workspace data exposure in staging/production-like conditions. | Expand local RLS coverage in future approved prompts and complete a human approval decision before any staging SQL execution. | Prompt 23A | No. | Yes |
| Critical | Remote/staging migration not validated | Schema chain may not apply cleanly outside local. Prompt 23 adds a pending decision record, not execution evidence. | Runtime data corruption or missing tables. | Use the approved local evidence package first, then stage only with explicit human approval. | Prompt 23A | No. | Yes |
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
| Medium | Broader local RLS coverage missing | One local auth/workspace/project smoke test passed, but other domains remain draft-only. | Narrow local evidence can miss storage, credits, jobs, render, QA, tool, provider, compliance, and observability policy issues. | Convert and run additional local domain SQL only in later approved prompts. | Future local RLS prompts | Yes for static planning only. | Yes before production beta |

## Decision

Prompt 23 records the staging Supabase/RLS decision state as `pending_human_approval` after Prompt 20B-Retry ran and passed the first guarded local auth/workspace/project RLS smoke test. Production beta still cannot proceed because staging Supabase/RLS has not executed, broader local RLS coverage is incomplete, human staging approval is not granted, and runtime capabilities remain blocked. The next safe milestone is Prompt 23A - Human Approval Decision Completion.
