# System Readiness Reconciliation QA Policy

Mandatory Phase 52F QA gates:

- `source_of_truth_repo_audit`
- `phase52e_evidence`
- `workstream_readiness_reconciliation`
- `controlled_internal_test_plan`
- `blocker_inventory`
- `feature_gate_reconciliation`
- `risk_register`
- `handoff_packets`
- `source_of_truth_policy`
- `supabase_milestone_sync`
- `blocked_features`

Phase52G readiness is allowed only when every mandatory gate passes and the Phase 52F Supabase milestone sync record writes and reads back.

Missing optional source-of-truth docs may be warnings. Runtime execution, public artifacts, signed URLs as source of truth, production, external beta, paid production, and broad media are blockers.
