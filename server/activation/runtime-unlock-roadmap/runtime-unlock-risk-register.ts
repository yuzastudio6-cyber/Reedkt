import type { RuntimeUnlockRiskRegister } from './runtime-unlock-roadmap-types'

export function buildRuntimeUnlockRiskRegister(): RuntimeUnlockRiskRegister {
  return {
    registerId: 'phase53a_runtime_unlock_risk_register',
    risks: [
      {
        riskId: 'owner_scope_ambiguity',
        category: 'ownership',
        risk: 'Owners may interpret repo-audit prompts as implementation approval.',
        ownerWorkstreams: ['AI_TOOLS_CREATIVE_GRAPHICS', 'TRACK_A_RENDER_EXPORT', 'TRACK_B_MEDIA_PROCESSING', 'WORKER_RUNTIME_JOBS'],
        mitigation: 'Every prompt states no implementation until audit and requires blocked-scope confirmation.',
        blocksExternalBetaOrProduction: true,
      },
      {
        riskId: 'supabase_advisor_followups',
        category: 'supabase_security_performance',
        risk: 'Supabase advisors flag follow-ups that must be owned before external beta or production.',
        ownerWorkstreams: ['SUPABASE_RLS_STORAGE_DATABASE', 'COMPLIANCE_SECURITY', 'OBSERVABILITY_AUDIT_COST'],
        mitigation: 'Assign advisor triage to owner repo audits; Phase 53A performs no schema/RLS changes.',
        blocksExternalBetaOrProduction: true,
      },
      {
        riskId: 'provider_worker_premature_execution',
        category: 'runtime',
        risk: 'Provider or worker tracks may skip dry-run/fixture gates.',
        ownerWorkstreams: ['PROVIDER_GATEWAY_MODELS', 'WORKER_RUNTIME_JOBS'],
        mitigation: 'Unlock ladder forbids stage skipping without explicit policy and QA.',
        blocksExternalBetaOrProduction: true,
      },
      {
        riskId: 'raw_prompt_or_signed_url_misuse',
        category: 'source_of_truth',
        risk: 'Raw prompts or signed URLs could be treated as execution/source-of-truth artifacts.',
        ownerWorkstreams: ['FRONTEND_PRODUCT_UX', 'WORKER_RUNTIME_JOBS', 'SUPABASE_RLS_STORAGE_DATABASE'],
        mitigation: 'Raw prompt direct execution and signed URL source-of-truth are permanently blocked.',
        blocksExternalBetaOrProduction: true,
      },
    ],
  }
}
