import type { ProviderOwnershipCheck, ProviderRoutingPolicy } from './provider-model-approval-types'

export function buildProviderRoutingPolicy(): ProviderRoutingPolicy {
  return {
    policyId: 'provider1_routing_policy',
    qwenAllowedRole: 'head_editing_planning_decision_agent_candidate',
    deepSeekAllowedRole: 'coding_spec_tool_implementation_proposal_specialist',
    qwenCanExecuteToolsOrWorkers: false,
    deepSeekCanExecuteCodeOrTools: false,
    providerChainingAllowed: false,
    rawPromptExecutionAllowed: false,
    workerExecutionSource: 'approved_plan_snapshots_only',
    gatewayEnforcement: [
      'Qwen may produce structured findings and edit intents only.',
      'DeepSeek may produce coding and specification proposals only.',
      'DeepSeek cannot choose tools to execute.',
      'Qwen cannot execute tools or workers.',
      'Worker Runtime executes only approved plan snapshots.',
      'Owner workstreams validate their own tool outputs.',
      'Producer and QA gates must run before plan snapshot approval.',
    ],
  }
}

export function buildProviderOwnershipCheck(): ProviderOwnershipCheck {
  return {
    owner: 'PROVIDER_GATEWAY_MODELS',
    relatedWorkstreams: [
      'WORKER_RUNTIME_JOBS',
      'TRACK_A_RENDER_EXPORT',
      'TRACK_B_MEDIA_PROCESSING',
      'AI_TOOLS_CREATIVE_GRAPHICS',
      'MAP_GEOSPATIAL',
      'SOUND_MUSIC_AUDIO',
      'SUPABASE_RLS_STORAGE_DATABASE',
      'COMPLIANCE_SECURITY',
      'OBSERVABILITY_AUDIT_COST',
      'FRONTEND_PRODUCT_UX',
      'BILLING_STRIPE_CREDITS',
    ],
    explicitlyNotOwned: [
      'Worker execution',
      'Track A render/export execution',
      'Track B media/model runtime',
      'AI Tools graphics implementation',
      'Supabase schema/RLS/migrations',
      'Frontend UX',
      'Billing',
      'Compliance implementation',
      'Observability implementation',
    ],
    integrationPoints: [
      'Provider Gateway policy',
      'model secret references',
      'approved plan snapshots',
      'agent findings/edit intents',
      'tool capability registry',
      'Worker Runtime contracts',
      'Supabase milestone sync',
      'cost controls',
    ],
  }
}
