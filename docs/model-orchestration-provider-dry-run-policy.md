# Qwen/DeepSeek Synthetic Provider Dry-Run Policy

MODEL-DRYRUN-1 is fail-closed by default.

- Provider calls require the PR #318 approval packet plus explicit execution confirmations.
- `DASHSCOPE_API_KEY` and `DEEPSEEK_API_KEY` are resolved only through Google Cloud Secret Manager in the server-side execution process.
- Secret payloads are never printed, committed, or included in JSON reports.
- Prompts and cases are synthetic and non-sensitive.
- Raw provider responses are process-local only; committed evidence stores schema status and normalized key summaries.
- Private artifact upload is allowed only to the approved staging GCS prefixes in execute mode.
- Supabase milestone sync may use only an existing approved path; no SQL, migrations, schema/RLS changes, or unrelated rows are allowed.
