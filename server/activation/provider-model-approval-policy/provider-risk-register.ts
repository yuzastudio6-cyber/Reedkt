import type { ProviderRiskRegisterItem } from './provider-model-approval-types'

export function buildProviderRiskRegister(): ProviderRiskRegisterItem[] {
  return [
    {
      riskId: 'provider1_secret_exposure',
      severity: 'critical',
      risk: 'Provider key payloads could leak through frontend code, logs, docs, artifacts, or Supabase rows.',
      mitigation: 'Record reference names only, keep values in Google Secret Manager, and block provider secret value reads in PROVIDER-1.',
      ownerWorkstream: 'PROVIDER_GATEWAY_MODELS',
    },
    {
      riskId: 'provider1_raw_prompt_execution',
      severity: 'critical',
      risk: 'Agent or model output could be mistaken for executable worker instructions.',
      mitigation: 'Keep Qwen and DeepSeek outputs as candidate findings/proposals only; workers execute approved plan snapshots only.',
      ownerWorkstream: 'WORKER_RUNTIME_JOBS',
    },
    {
      riskId: 'provider1_cost_runaway',
      severity: 'high',
      risk: 'Future long-context calls could create unexpected spend if budgets are not explicit.',
      mitigation: 'Default PROVIDER-1 budget to zero and require per-call, per-run, daily, retry, timeout, and pricing recheck gates before live validation.',
      ownerWorkstream: 'OBSERVABILITY_AUDIT_COST',
    },
    {
      riskId: 'provider1_sensitive_media_ingestion',
      severity: 'high',
      risk: 'Raw media or sensitive transcripts could be sent to Qwen or DeepSeek too early.',
      mitigation: 'Allow only sanitized manifests/summaries in policy and keep private media ingestion blocked until a later approved privacy phase.',
      ownerWorkstream: 'COMPLIANCE_SECURITY',
    },
  ]
}
