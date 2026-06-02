# Beta Readiness Scorecard

Scores are honest readiness estimates after Prompt 20A local Supabase toolchain repair. They are not production approval.

| Area | Foundation readiness | Executable beta readiness | Production beta readiness | Status | Evidence | Blockers | Next action |
| --- | ---: | ---: | ---: | --- | --- | --- | --- |
| Source of truth | 90% | 20% | 10% | Partial | Prompt 0-18 docs and trackers. | Needs staging evidence and ongoing tracker hygiene. | Keep trackers current. |
| Architecture boundaries | 90% | 25% | 10% | Partial | Architecture freeze and diagnostics. | Runtime validation missing. | Preserve fail-closed boundaries. |
| Schema/RLS | 65% | 8% | 1% | Blocked | Static audit, draft SQL, Prompt 19 manifest, conversion plan, fixture contract, environment contract, runbook, evidence checklist, Prompt 20 preflight/runner, and Prompt 20A local config/toolchain hardening. | Local/staging SQL unexecuted; Supabase CLI is wrong architecture, `psql` is missing, no local DB URL or executable SQL candidate exists. | Prompt 20C, then Prompt 20B. |
| Auth/workspace/project | 70% | 20% | 5% | Partial | Prompt 3 route/service foundation. | RLS/staging validation missing. | Validate local/staging access. |
| Storage/upload | 65% | 10% | 0% | Partial | Prompt 4 route/service foundation. | Real storage policies and signed URL runtime unvalidated. | Staging storage validation. |
| Approved snapshots | 65% | 10% | 0% | Partial | Prompt 5 contracts. | Persistence/runtime backend-required. | Transactional validation. |
| Credits/approval gate | 60% | 5% | 0% | Blocked | Prompt 6 fail-closed gate. | No credit mutation, Stripe, or transactional ledger. | Credit runtime milestone. |
| Backend API runtime | 80% | 20% | 5% | Partial | Prompt 7 hardening and diagnostics. | No deployed backend. | Staging backend validation. |
| Job/worker foundation | 65% | 5% | 0% | Blocked | Prompt 8 and Prompt 14 contracts. | No transactional claims or execution. | Worker runtime validation. |
| Media readiness | 60% | 5% | 0% | Blocked | Prompt 9 readiness. | No real media processing. | Media fixture validation. |
| Render/preview/export | 60% | 5% | 0% | Blocked | Prompt 10/10A readiness. | No render/export execution. | Render readiness validation. |
| QA/revision/fallback | 60% | 5% | 0% | Blocked | Prompt 11 readiness. | No QA/revision execution. | QA blocker validation. |
| Tool-call foundation | 65% | 5% | 0% | Blocked | Prompt 12 contracts. | No tool runtime. | Tool runtime approval path. |
| Tool readiness | 70% | 5% | 0% | Blocked | Prompt 13/13A static readiness. | Tools remain runtime-disabled. | Compliance/runtime review. |
| Worker execution contract | 75% | 5% | 0% | Blocked | Prompt 14 CI passed. | No real worker execution. | Transactional worker milestone. |
| Provider gateway | 65% | 5% | 0% | Blocked | Prompt 15 gateway foundation. | No secrets, calls, or webhook processing. | Provider runtime review. |
| Compliance/security | 65% | 10% | 0% | Blocked | Prompt 16 foundation. | No human legal/security approval. | Human review workflow. |
| Observability/audit/cost controls | 65% | 10% | 0% | Blocked | Prompt 17 foundation and CI. | No persistence or external telemetry. | Staging operational validation. |
| E2E staging smoke | 40% | 0% | 0% | Planning only | Prompt 18 plan/diagnostics plus Prompt 19 RLS preparation path, Prompt 20 local-only runner tooling, and Prompt 20A local config/toolchain hardening. | Staging smoke not run; local/staging Supabase/RLS not executed. | Prompt 20C, then Prompt 20B. |
| Production deployment | 10% | 0% | 0% | Blocked | Architecture docs only. | No deployment, rollback, monitoring. | Deployment readiness milestone. |
| Stripe/billing | 30% | 0% | 0% | Blocked | Pricing docs and credit contract. | No Stripe or transactional credits. | Billing milestone after ledger. |
| Actual execution path | 20% | 0% | 0% | Blocked | Fail-closed contracts. | Workers/providers/tools/render/media all blocked. | Runtime activation milestones. |

## Decision

Prompt 20A adds local-only config and hardens preflight/runner gates but does not run Supabase/RLS because the local toolchain is still blocked. Aggregate readiness after Prompt 20A:

- Foundation readiness: about 64%.
- Executable beta readiness: about 8%.
- Production beta readiness: about 1%.

Foundation readiness is slightly improved because repo-owned local config, safety gates, and dry-run tooling now exist. Executable beta readiness and production beta readiness remain blocked until local/staging validation executes with evidence.
