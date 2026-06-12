import type { ProviderApprovalEvidence, ProviderRoleApproval } from './provider-model-approval-types'

export function buildQwen37MaxApprovalEvidence(): ProviderApprovalEvidence[] {
  return [
    {
      evidenceId: 'qwen37_max_model_identity_provider1',
      provider: 'qwen',
      sourceName: 'Alibaba Model Studio Newly Released Models',
      sourceUrl: 'https://help.aliyun.com/zh/model-studio/newly-released-models',
      sourceType: 'official_docs',
      observedFacts: [
        'Primary model candidate is qwen3.7-max.',
        'Dated snapshot candidates are qwen3.7-max-2026-06-08 and qwen3.7-max-2026-05-20.',
        'Alibaba docs identify Qwen Max as a flagship text model with long-horizon programming/productivity suitability.',
      ],
      policyImpact: 'Qwen3.7-Max can be recorded as the future head editing/planning agent candidate, but only through Provider Gateway policy.',
      reverifyBeforeLiveValidation: true,
    },
    {
      evidenceId: 'qwen37_max_api_cost_provider1',
      provider: 'qwen',
      sourceName: 'Alibaba Model Studio OpenAI Compatibility and Pricing',
      sourceUrl: 'https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope',
      sourceType: 'official_docs',
      observedFacts: [
        'Alibaba documents OpenAI-compatible Qwen API support through DashScope/Model Studio.',
        'API key semantics to verify are DASHSCOPE_API_KEY.',
        'Official docs record non-thinking and thinking modes, thinking mode on by default according to model update docs, text-only input, explicit cache support, and a 0<Token<=1M pricing band.',
      ],
      policyImpact: 'Qwen provider calls require backend-only DashScope secret references, zero default budget, and a later official pricing recheck before live validation.',
      reverifyBeforeLiveValidation: true,
    },
  ]
}

export function buildQwenRoleApprovals(): ProviderRoleApproval[] {
  return [
    {
      roleId: 'qwen_3_7_max_head_planning_agent',
      provider: 'qwen',
      providerModelIds: ['qwen3.7-max', 'qwen3.7-max-2026-06-08', 'qwen3.7-max-2026-05-20'],
      status: 'approved_policy_only',
      intendedRole: 'Head editing, planning, and decision agent candidate for structured findings and edit-intent formation.',
      allowedOutputs: [
        'structured findings',
        'edit intents',
        'professional edit scoring',
        'tool route requests',
        'blocked decision summaries',
      ],
      blockedActions: [
        'direct worker execution',
        'direct tool calls',
        'raw prompt execution',
        'direct provider chaining',
        'code patching',
        'secret handling',
        'private media ingestion without future approval',
      ],
      storagePolicy: 'Store sanitized normalized findings and intents only.',
    },
  ]
}
