# Model Orchestration Plan Snapshot Contract

Decision: `blocked_pending_provider_dry_run_evidence`.

This packet defines the metadata-only handoff from provider evidence into reviewable planning records:

1. `agent_findings_v1`
2. `edit_intents_v1`
3. `plan_snapshot_candidate_v1`
4. approval gate
5. `approved_plan_snapshot_v1`

Provider output, findings, intents, and candidates cannot execute workers, tools, routes, Supabase writes, public artifacts, signed URLs, or production mutations. The current evidence gate remains blocked because PR #322 records Qwen schema rerun provider timeouts and PR #320 provider dry-run evidence is not passed.
