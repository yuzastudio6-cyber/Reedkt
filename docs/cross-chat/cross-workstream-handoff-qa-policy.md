# Cross-Workstream Handoff QA Policy

Mandatory Phase 52H QA gates:

- `source_of_truth_repo_audit`
- `phase52g_evidence`
- `owner_response_schema`
- `owner_response_ledger`
- `owner_prompt_references`
- `owner_response_statuses`
- `handoff_tracking_policy`
- `source_of_truth_policy`
- `supabase_milestone_sync`
- `blocked_features`

Phase 52H passes only if all mandatory gates pass and the Supabase milestone
sync readback completes during confirmed execution.

Warnings are acceptable for missing optional foundation/cross-chat docs on the
Phase 52G base when the absence is recorded and no contracts are inferred.
