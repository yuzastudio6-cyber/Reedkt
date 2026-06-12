# Plan Snapshot Contract Decision

Decision: `blocked_pending_provider_dry_run_evidence`

Active blockers:

- pr322_qwen_pass_evidence_missing
- pr322_qwen_schema_rerun_provider_timeout
- pr322_qwen_schema_cases_did_not_pass

The schema and fixture portions are present, and invalid fixtures fail closed. The packet does not pass because committed provider evidence is not ready.

Reconciled evidence:

- Qwen: `blocked`
- DeepSeek: `passed_remote_pr320`
- Stale evidence: PR #327 was reading stale local provider evidence for at least one upstream report.
