# Plan Snapshot Contract Decision

Decision: `blocked_pending_provider_dry_run_evidence`

Active blockers:

- pr322_qwen_provider_evidence_not_ready
- pr322_qwen_schema_rerun_provider_timeout
- pr322_qwen_schema_cases_did_not_pass
- pr320_provider_dry_run_not_passed
- pr320_deepseek_provider_dry_run_not_passed

The schema and fixture portions are present, and invalid fixtures fail closed. The packet does not pass because committed provider evidence is not ready.
