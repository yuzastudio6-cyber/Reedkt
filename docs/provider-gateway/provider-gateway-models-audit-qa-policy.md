# PROVIDER-0 Provider Gateway Models Audit QA Policy

Mandatory QA gates:

- `official_provider_evidence`: DeepSeek and Qwen official source URLs are
  encoded with current model-name facts.
- `repo_contract_audit`: provider gateway contracts are audited and real
  provider calls remain fail-closed.
- `model_name_decisions`: internal and provider-facing model names are mapped.
- `secret_policy`: future secrets are backend-only references and no secret
  values are resolved in PROVIDER-0.
- `data_policy`: allowed/blocked data classes are explicit.
- `cost_policy`: provider calls remain blocked by default and budgets default
  to zero.
- `execution_policy`: DeepSeek cannot directly execute code and Qwen cannot
  directly execute tools/workers.
- `phase_roadmap`: safe follow-up phases are defined.
- `supabase_milestone_sync`: static mode writes nothing; guarded execution must
  write/read one milestone sync record or report an exact blocker.
- `blocked_features`: runtime/provider/public/production scopes remain false.

Smoke validation must fail if provider calls, direct code/tool execution,
public artifacts, signed URL source-of-truth, raw prompt execution, production,
external beta, paid production, broad media, or missing scripts are detected.
