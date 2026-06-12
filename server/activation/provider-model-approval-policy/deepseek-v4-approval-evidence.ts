import type { ProviderApprovalEvidence, ProviderRoleApproval } from './provider-model-approval-types'

export function buildDeepSeekV4ApprovalEvidence(): ProviderApprovalEvidence[] {
  return [
    {
      evidenceId: 'deepseek_v4_api_surface_provider1',
      provider: 'deepseek',
      sourceName: 'DeepSeek API Docs',
      sourceUrl: 'https://api-docs.deepseek.com/',
      sourceType: 'official_docs',
      observedFacts: [
        'OpenAI-compatible base URL is https://api.deepseek.com.',
        'Anthropic-compatible base URL is https://api.deepseek.com/anthropic.',
        'DeepSeek V4 records 1M context, JSON output, tool calls, thinking and non-thinking modes, and FIM in non-thinking mode.',
      ],
      policyImpact: 'DeepSeek can be recorded as a future backend Provider Gateway route for proposal generation only; live calls remain blocked in PROVIDER-1.',
      reverifyBeforeLiveValidation: true,
    },
    {
      evidenceId: 'deepseek_v4_model_identity_provider1',
      provider: 'deepseek',
      sourceName: 'DeepSeek API Pricing and Updates',
      sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
      sourceType: 'official_docs',
      observedFacts: [
        'Official model IDs recorded for ReEditPro policy are deepseek-v4-pro and deepseek-v4-flash.',
        'Legacy names deepseek-chat and deepseek-reasoner are compatibility names scheduled for deprecation on 2026-07-24.',
        'Pricing must be rechecked from the official pricing page before any future live validation because PROVIDER-1 does not freeze permanent rates.',
      ],
      policyImpact: 'DeepSeek V4-Pro is approved as a coding/spec proposal specialist; V4-Flash is recorded as a cheaper future fallback candidate.',
      reverifyBeforeLiveValidation: true,
    },
  ]
}

export function buildDeepSeekRoleApprovals(): ProviderRoleApproval[] {
  return [
    {
      roleId: 'deepseek_v4_pro_coding_specialist',
      provider: 'deepseek',
      providerModelIds: ['deepseek-v4-pro'],
      status: 'approved_policy_only',
      intendedRole: 'Coding, specification, test scaffold, manifest helper proposal, build-error analysis, and adapter proposal draft specialist.',
      allowedOutputs: [
        'coding proposals',
        'spec proposals',
        'test scaffold proposals',
        'manifest helper proposals',
        'build-error analysis',
        'adapter proposal drafts',
      ],
      blockedActions: [
        'direct execution',
        'shell command execution instructions',
        'worker execution',
        'provider chaining',
        'secret handling',
        'private media analysis',
        'Supabase schema mutation',
        'frontend service-role exposure',
      ],
      storagePolicy: 'Store sanitized proposal metadata only unless a later policy approves additional storage.',
    },
    {
      roleId: 'deepseek_v4_flash_coding_fallback',
      provider: 'deepseek',
      providerModelIds: ['deepseek-v4-flash'],
      status: 'recorded_future_candidate',
      intendedRole: 'Cheaper/simple coding fallback candidate after a future fixture and cost phase approves it.',
      allowedOutputs: ['simple coding proposal candidates after future approval', 'bounded fixture-normalized proposal summaries after future approval'],
      blockedActions: [
        'direct execution',
        'shell command execution instructions',
        'worker execution',
        'provider chaining',
        'secret handling',
        'private media analysis',
        'Supabase schema mutation',
        'frontend service-role exposure',
      ],
      storagePolicy: 'Store no live outputs in PROVIDER-1; future phases may store sanitized proposal summaries only.',
    },
  ]
}
