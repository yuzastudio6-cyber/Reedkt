# Beta Readiness Scorecard

Scores are honest readiness estimates after Prompt 20P2 local storage ownership/privilege repair. They are not production approval.

| Area | Foundation readiness | Executable beta readiness | Production beta readiness | Status | Evidence | Blockers | Next action |
| --- | ---: | ---: | ---: | --- | --- | --- | --- |
| Source of truth | 90% | 20% | 10% | Partial | Prompt 0-18 docs and trackers. | Needs staging evidence and ongoing tracker hygiene. | Keep trackers current. |
| Architecture boundaries | 90% | 25% | 10% | Partial | Architecture freeze and diagnostics. | Runtime validation missing. | Preserve fail-closed boundaries. |
| Schema/RLS | 76% | 10% | 1% | Blocked | Static audit, draft SQL, Prompt 19 manifest, conversion plan, fixture contract, environment contract, runbook, evidence checklist, Prompt 20 preflight/runner, Prompt 20A local config/toolchain hardening, Prompt 20C manual setup docs, Prompt 20D verification evidence, Prompt 20E host probe evidence, Prompt 20F host repair verification, Prompt 20G migration-chain repair, Prompt 20B first local SQL candidate plus local start attempt, Prompt 20H migration-chain repair evidence, Prompt 20I media/source-sequence migration-chain repair evidence, Prompt 20J intent-plan migration-chain repair evidence, Prompt 20K credit/approval migration-chain repair evidence, Prompt 20L generation/assets/jobs migration-chain repair evidence, Prompt 20M QA/export/audit migration-chain repair evidence, Prompt 20N RLS helper migration-chain repair evidence, Prompt 20O local port retry evidence, Prompt 20P storage migration-chain repair evidence, and Prompt 20P2 storage ownership repair evidence. | Local SQL smoke test unexecuted; Prompt 20P2 confirms local `supabase start` passes and localhost DB evidence is captured. Staging SQL remains unexecuted. | Prompt 20B-Retry to run the first local executable RLS smoke test with the guarded runner. |
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
| E2E staging smoke | 49% | 0% | 0% | Planning only | Prompt 18 plan/diagnostics plus Prompt 19 RLS preparation path, Prompt 20 local-only runner tooling, Prompt 20A local config/toolchain hardening, Prompt 20C manual setup docs, Prompt 20D verification evidence, Prompt 20E host probe evidence, Prompt 20F host repair verification, Prompt 20G migration-chain repair, Prompt 20B first local candidate/start evidence, Prompt 20H migration-chain repair evidence, Prompt 20I migration-chain repair evidence, Prompt 20J migration-chain repair evidence, Prompt 20K migration-chain repair evidence, Prompt 20L migration-chain repair evidence, Prompt 20M migration-chain repair evidence, Prompt 20N migration-chain repair evidence, Prompt 20O local start retry evidence, Prompt 20P storage migration-chain repair evidence, and Prompt 20P2 local start evidence. | Staging smoke not run; local SQL/RLS smoke test not executed; local start now passes with localhost DB evidence. | Prompt 20B-Retry to run the first local executable RLS smoke test, then continue staging preparation only after approved local evidence. |
| Production deployment | 10% | 0% | 0% | Blocked | Architecture docs only. | No deployment, rollback, monitoring. | Deployment readiness milestone. |
| Stripe/billing | 30% | 0% | 0% | Blocked | Pricing docs and credit contract. | No Stripe or transactional credits. | Billing milestone after ledger. |
| Actual execution path | 20% | 0% | 0% | Blocked | Fail-closed contracts. | Workers/providers/tools/render/media all blocked. | Runtime activation milestones. |

## Decision

Prompt 20P2 confirms `202605200001_storage_upload_pipeline_readiness.sql` now passes local start after storage policy comments were moved to plain SQL comments. Local `supabase start` completed and localhost DB evidence was captured. SQL/RLS smoke tests and staging validation remain unexecuted. Aggregate readiness after Prompt 20P2:

- Foundation readiness: about 74%.
- Executable beta readiness: about 10%.
- Production beta readiness: about 1%.

Foundation readiness increases modestly because the local migration chain now starts successfully. Executable beta readiness remains low until the first local RLS smoke test actually runs; production beta readiness remains blocked until staging validation and runtime capabilities are approved.
