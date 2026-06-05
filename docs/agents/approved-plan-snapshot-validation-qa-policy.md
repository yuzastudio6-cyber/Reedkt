# Approved-Plan Snapshot Validation QA Policy

Mandatory QA gates:

- `source_of_truth_repo_audit`
- `phase52d_evidence`
- `candidate_plan_schema_validation`
- `blocked_plan_validation`
- `ownership_validation`
- `runtime_block_validation`
- `feature_gate_validation`
- `system_reconciliation`
- `missing_contract_inventory`
- `validated_handoffs`
- `source_of_truth_policy`
- `supabase_milestone_sync`
- `blocked_features`

Phase52F readiness is ready only when every mandatory gate passes and the Phase 52E Supabase milestone sync writes and reads back. If Supabase credentials, registry access, private artifact upload, or readback fails, Phase52F readiness stays blocked with the exact blocker.

Missing prompt-listed source-of-truth documents are recorded as reconciliation gaps. They block Phase 52E only if they prevent safe validation of candidate snapshots or ownership boundaries.
