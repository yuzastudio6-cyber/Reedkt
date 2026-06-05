# Agent-To-Tool Plan Bridge QA Policy

Mandatory QA gates:

- `source_of_truth_repo_audit`
- `phase52c_evidence`
- `candidate_plan_generation`
- `blocked_plan_generation`
- `approved_plan_schema_compliance`
- `ownership_routing`
- `producer_plan_gate`
- `qa_plan_gate`
- `cross_track_handoffs`
- `source_of_truth_policy`
- `supabase_milestone_sync`
- `blocked_features`

Phase52E readiness is `ready_for_approved_plan_snapshot_validation_system_reconciliation` only when every mandatory gate passes and the Phase 52D Supabase milestone sync writes and reads back successfully.

Failures fail closed. Missing Supabase credentials, schema, GCS upload access, owner routes, source-of-truth policy, or runtime-block flags blocks Phase52E readiness.
