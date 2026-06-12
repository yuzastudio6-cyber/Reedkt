# Model Orchestration Qwen/DeepSeek Audit

Decision: `repo_audit_passed_ready_for_dry_run_approval`.

This packet records a repo/source-of-truth audit only. It does not call Qwen, DeepSeek, providers, tools, workers, routes, Supabase, or production systems.

Official evidence captured:
- Alibaba Model Studio / DashScope OpenAI-compatible Qwen access.
- Qwen audit candidates: `qwen3.7-plus` first dry-run candidate and `qwen3.7-max` escalation candidate.
- DeepSeek API base URL and current candidates: `deepseek-v4-flash` and `deepseek-v4-pro`.

Supabase update classification: no write; Track B clean-staging milestone sync is completed; model orchestration is not synced in this phase.
