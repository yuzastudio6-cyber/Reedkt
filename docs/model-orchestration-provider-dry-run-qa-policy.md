# Qwen/DeepSeek Synthetic Provider Dry-Run QA Policy

QA checks for MODEL-DRYRUN-1:

- Approval packet present and passed.
- Confirmation env values match the runbook exactly.
- Synthetic request redaction passes.
- Secret Manager payload access succeeds without logging payloads.
- Qwen and DeepSeek responses parse as JSON objects.
- Responses match the schema contracts for `agent_findings_v1` and `coding_spec_proposal_v1`.
- Safety booleans remain false.
- Redaction checks pass on normalized response summaries.
- Cost/usage metadata is normalized without production billing claims.
- Private artifact upload succeeds in execute mode.
- Supabase sync is either passed through an approved path or recorded as unavailable partial status.
