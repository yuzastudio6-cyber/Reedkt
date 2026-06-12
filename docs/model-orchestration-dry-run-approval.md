# Model Orchestration Qwen/DeepSeek Dry-Run Approval

Decision: `approved_for_future_qwen_deepseek_provider_dry_run`.

This packet approves only a future synthetic, non-sensitive Qwen/DeepSeek provider dry-run. It does not call Qwen, DeepSeek, providers, tools, workers, routes, Supabase, production systems, public artifact systems, or signed URL systems.

Approved future candidates:
- Qwen/DashScope default: `qwen3.7-plus`
- Qwen/DashScope escalation: `qwen3.7-max`
- DeepSeek default: `deepseek-v4-flash`
- DeepSeek escalation: `deepseek-v4-pro`

Supabase update classification: no write; Track B clean-staging milestone sync is completed; model orchestration dry-run is not synced in this phase.
