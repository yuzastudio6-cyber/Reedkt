# Model Orchestration Plan Snapshot Contract

Decision: `plan_snapshot_contract_passed_ready_for_dry_run_validation`.

This packet defines the metadata-only handoff from provider evidence into reviewable planning records:

1. `agent_findings_v1`
2. `edit_intents_v1`
3. `plan_snapshot_candidate_v1`
4. approval gate
5. `approved_plan_snapshot_v1`

Provider output, findings, intents, and candidates cannot execute workers, tools, routes, Supabase writes, public artifacts, signed URLs, or production mutations.

Provider evidence reconciliation:

- Qwen: `passed`
- DeepSeek: `passed_remote_pr320`
- Stale evidence: PR #327 was reading stale local provider evidence for at least one upstream report.
