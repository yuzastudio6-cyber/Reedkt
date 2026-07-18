import type {
  ReEditProModelRoleContract,
  ReEditProModelRoleContractValidation,
  ReEditProModelRoleId,
  ReEditProModelRoleUseValidation,
  ReEditProRequestedModelUse,
} from '../types'

export const REEDITPRO_MODEL_ROLE_CONTRACT_VERSION = 'reeditpro-model-role-routing-v2-kimi-primary'

export const REEDITPRO_MODEL_ROLE_CONTRACTS: ReEditProModelRoleContract[] = [
  {
    modelRoleId: 'kimi_k3_main_edit_agent',
    displayName: 'Kimi K3 primary edit agent',
    aliases: ['Kimi K3', 'kimi-k3', 'kimi_k3', 'kimi_primary_edit_agent'],
    canonicalProviderModel: 'kimi-k3',
    role: 'main_edit_reasoning_agent',
    reasoningRouteRole: 'primary',
    reasoningRoutePriority: 1,
    fallbackOnly: false,
    executionStatus: 'provider_required_future_gated',
    userReasoningAllowed: true,
    editPlanningAllowed: true,
    creativeStrategyAllowed: true,
    editQaReasoningAllowed: true,
    visualUnderstandingAllowed: false,
    toolCodeAllowed: true,
    remotionDraftAllowed: true,
    providerBoundary: 'kimi_k3_provider_boundary',
    purpose: 'Primary reasoning, planning, creative edit strategy, structured tool-use, coding, Remotion draft, and edit-QA reasoning agent for ReEditPro.',
    allowedResponsibilities: [
      'compile user intent into structured editing direction',
      'reason about edit goals, story, pacing, style, markers, creative restraint, and QA explanations',
      'produce validated edit plans and bounded coding or Remotion drafts from approved context',
    ],
    forbiddenResponsibilities: [
      'execute provider calls from frontend or mock planning',
      'perform source video visual understanding directly instead of consuming specialist evidence',
      'run tools, workers, render, storage, billing, or Supabase mutations',
    ],
    fallbackPolicy: 'If an allowed, classified failure occurs, advance exactly once to the Qwen 3.7 fallback route under the same immutable edit authority.',
    mockOnly: true,
  },
  {
    modelRoleId: 'qwen_3_7_main_edit_agent',
    displayName: 'Qwen 3.7 fallback edit agent',
    aliases: ['Qwen 3.7', 'Qwen 3.7 Max', 'qwen3.7-max', 'qwen3.7-max-2026-06-08', 'qwen_3_reasoning'],
    canonicalProviderModel: 'qwen3.7-max-2026-06-08',
    role: 'fallback_edit_reasoning_agent',
    reasoningRouteRole: 'fallback',
    reasoningRoutePriority: 2,
    fallbackOnly: true,
    executionStatus: 'provider_required_future_gated',
    userReasoningAllowed: true,
    editPlanningAllowed: true,
    creativeStrategyAllowed: true,
    editQaReasoningAllowed: true,
    visualUnderstandingAllowed: false,
    toolCodeAllowed: true,
    remotionDraftAllowed: true,
    providerBoundary: 'qwen_3_7_provider_boundary',
    purpose: 'First fallback for ReEditPro reasoning, planning, creative edit strategy, coding, Remotion drafts, and edit-QA reasoning after a classified Kimi K3 attempt failure.',
    allowedResponsibilities: [
      'continue the exact approved reasoning task after an allowed Kimi K3 failure',
      'reason from the same immutable prompt package and evidence authority',
      'produce validated edit plans, creative strategy, or bounded coding drafts as a fallback',
    ],
    forbiddenResponsibilities: [
      'act as the primary/default edit reasoning route',
      'execute provider calls from frontend or mock planning',
      'perform visual/video understanding directly',
      'run tools, workers, render, storage, billing, or Supabase mutations',
    ],
    fallbackPolicy: 'Run only after an allowed Kimi K3 failure; on another allowed failure, advance exactly once to DeepSeek V4 Pro.',
    mockOnly: true,
  },
  {
    modelRoleId: 'qwen2_5_vl_visual_understanding',
    displayName: 'Qwen2.5-VL visual understanding',
    aliases: ['Qwen2.5-VL', 'Qwen2.5-VL-7B-Instruct', 'qwen2.5-vl-7b-instruct', 'qwen25vl_visual_understanding'],
    canonicalProviderModel: 'qwen2.5-vl-7b-instruct',
    role: 'visual_understanding_specialist',
    reasoningRouteRole: 'specialist',
    reasoningRoutePriority: null,
    fallbackOnly: false,
    executionStatus: 'provider_required_future_gated',
    userReasoningAllowed: false,
    editPlanningAllowed: false,
    creativeStrategyAllowed: false,
    editQaReasoningAllowed: false,
    visualUnderstandingAllowed: true,
    toolCodeAllowed: false,
    remotionDraftAllowed: false,
    providerBoundary: 'qwen2_5_vl_7b_instruct_provider_boundary',
    purpose: 'Visual/video understanding specialist for visible objects, actions, layout, scene summaries, marker windows, visual continuity, and B-roll opportunities.',
    allowedResponsibilities: [
      'summarize visible context for the main edit agent',
      'inspect marker windows, scene layout, visible text, continuity, and B-roll opportunities after backend approval',
      'produce bounded visual summaries rather than final edit plans',
    ],
    forbiddenResponsibilities: [
      'act as the main user-facing reasoning agent',
      'create approved edit plans independently',
      'draft production code or Remotion implementation details',
      'execute provider calls before backend provider gates exist',
    ],
    fallbackPolicy: 'Use lower-depth source summaries or ask for clarification; do not claim visual understanding ran.',
    mockOnly: true,
  },
  {
    modelRoleId: 'deepseek_v4_tool_code_agent',
    displayName: 'DeepSeek V4 Pro final reasoning fallback',
    aliases: ['DeepSeek V4 Pro', 'DeepSeek', 'deepseek-v4-pro', 'deepseek_tool_code', 'deepseek_reasoning_fallback'],
    canonicalProviderModel: 'deepseek-v4-pro',
    role: 'fallback_edit_reasoning_agent',
    reasoningRouteRole: 'fallback',
    reasoningRoutePriority: 3,
    fallbackOnly: true,
    executionStatus: 'provider_required_future_gated',
    userReasoningAllowed: true,
    editPlanningAllowed: true,
    creativeStrategyAllowed: true,
    editQaReasoningAllowed: true,
    visualUnderstandingAllowed: false,
    toolCodeAllowed: true,
    remotionDraftAllowed: true,
    providerBoundary: 'deepseek_v4_pro_tool_code_boundary',
    purpose: 'Final bounded fallback for reasoning, planning, creative edit strategy, coding, Remotion drafts, and edit-QA reasoning after Kimi K3 and Qwen 3.7 fail with allowed classifications.',
    allowedResponsibilities: [
      'continue the exact approved reasoning task after allowed Kimi K3 and Qwen 3.7 failures',
      'produce validated edit plans or QA explanations from the same immutable evidence package',
      'draft bounded coding, tool-code, deterministic adapter, or Remotion implementation hints',
    ],
    forbiddenResponsibilities: [
      'act as the primary/default edit reasoning route',
      'skip the Qwen 3.7 fallback without a separately approved route-policy exception',
      'replace Qwen2.5-VL visual understanding',
      'run provider/tool/worker/render/storage/billing calls from frontend or mock planning',
    ],
    fallbackPolicy: 'This is the final model fallback. If it fails, block for deterministic recovery or user review instead of silently selecting another model.',
    mockOnly: true,
  },
]

export function listReEditProModelRoleContracts(): ReEditProModelRoleContract[] {
  return REEDITPRO_MODEL_ROLE_CONTRACTS.map((contract) => ({ ...contract }))
}

export function getReEditProModelRoleContract(
  modelRoleId: ReEditProModelRoleId,
): ReEditProModelRoleContract {
  const contract = REEDITPRO_MODEL_ROLE_CONTRACTS.find((item) => item.modelRoleId === modelRoleId)

  if (!contract) {
    throw new Error(`Missing ReEditPro model role contract: ${modelRoleId}`)
  }

  return { ...contract }
}

export function resolveReEditProModelRoleContract(
  value: string | null | undefined,
): ReEditProModelRoleContract | undefined {
  const normalizedValue = normalizeModelRoleLookupValue(value)
  if (!normalizedValue) return undefined

  const contract = REEDITPRO_MODEL_ROLE_CONTRACTS.find((item) => {
    if (normalizeModelRoleLookupValue(item.modelRoleId) === normalizedValue) return true
    if (normalizeModelRoleLookupValue(item.providerBoundary) === normalizedValue) return true
    if (normalizeModelRoleLookupValue(item.canonicalProviderModel) === normalizedValue) return true
    return item.aliases.some((alias) => normalizeModelRoleLookupValue(alias) === normalizedValue)
  })

  return contract ? { ...contract } : undefined
}

export function validateReEditProModelRoleContracts(
  contracts: readonly ReEditProModelRoleContract[] = REEDITPRO_MODEL_ROLE_CONTRACTS,
): ReEditProModelRoleContractValidation {
  const errors: string[] = []
  const kimi = contracts.find((contract) => contract.modelRoleId === 'kimi_k3_main_edit_agent')
  const qwen = contracts.find((contract) => contract.modelRoleId === 'qwen_3_7_main_edit_agent')
  const visual = contracts.find((contract) => contract.modelRoleId === 'qwen2_5_vl_visual_understanding')
  const deepseek = contracts.find((contract) => contract.modelRoleId === 'deepseek_v4_tool_code_agent')

  if (
    !kimi?.userReasoningAllowed || !kimi.editPlanningAllowed ||
    !kimi.creativeStrategyAllowed || !kimi.editQaReasoningAllowed ||
    !kimi.toolCodeAllowed || !kimi.remotionDraftAllowed ||
    kimi.reasoningRouteRole !== 'primary' || kimi.reasoningRoutePriority !== 1 || kimi.fallbackOnly
  ) {
    errors.push('Kimi K3 must remain the primary edit reasoning, planning, creativity, QA-reasoning, and coding route at priority 1.')
  }

  if (
    !qwen?.userReasoningAllowed || !qwen.editPlanningAllowed ||
    !qwen.creativeStrategyAllowed || !qwen.editQaReasoningAllowed ||
    !qwen.toolCodeAllowed || !qwen.remotionDraftAllowed ||
    qwen.reasoningRouteRole !== 'fallback' || qwen.reasoningRoutePriority !== 2 || !qwen.fallbackOnly
  ) {
    errors.push('Qwen 3.7 must remain the first full-capability fallback route at priority 2.')
  }

  if (
    !visual?.visualUnderstandingAllowed || visual.userReasoningAllowed || visual.editPlanningAllowed ||
    visual.creativeStrategyAllowed || visual.editQaReasoningAllowed || visual.toolCodeAllowed ||
    visual.reasoningRouteRole !== 'specialist' || visual.reasoningRoutePriority !== null || visual.fallbackOnly
  ) {
    errors.push('Qwen2.5-VL must remain visual-understanding only and must not become the main edit planner.')
  }

  if (
    !deepseek?.userReasoningAllowed || !deepseek.editPlanningAllowed ||
    !deepseek.creativeStrategyAllowed || !deepseek.editQaReasoningAllowed ||
    !deepseek.toolCodeAllowed || !deepseek.remotionDraftAllowed ||
    deepseek.reasoningRouteRole !== 'fallback' || deepseek.reasoningRoutePriority !== 3 || !deepseek.fallbackOnly
  ) {
    errors.push('DeepSeek V4 Pro must remain the final full-capability fallback route at priority 3.')
  }

  const reasoningPriorities = contracts
    .filter((contract) => contract.reasoningRouteRole !== 'specialist')
    .map((contract) => contract.reasoningRoutePriority)
  if (new Set(reasoningPriorities).size !== reasoningPriorities.length) {
    errors.push('Reasoning model route priorities must be unique.')
  }

  for (const contract of contracts) {
    if (!contract.mockOnly) errors.push(`${contract.modelRoleId} must remain mockOnly in this contract.`)
    if (!contract.providerBoundary) errors.push(`${contract.modelRoleId} is missing provider boundary metadata.`)
    if (!contract.canonicalProviderModel) errors.push(`${contract.modelRoleId} is missing canonical provider model metadata.`)
    if (contract.fallbackOnly !== (contract.reasoningRouteRole === 'fallback')) {
      errors.push(`${contract.modelRoleId} fallbackOnly must match its fallback route role.`)
    }
    if (resolveReEditProModelRoleContract(contract.canonicalProviderModel)?.modelRoleId !== contract.modelRoleId) {
      errors.push(`${contract.modelRoleId} canonical provider model must resolve back to the same model role.`)
    }
    if (!contract.forbiddenResponsibilities.some((item) => /frontend|mock planning|provider|tool|worker|render/i.test(item))) {
      errors.push(`${contract.modelRoleId} is missing explicit no-execution responsibilities.`)
    }
  }

  return {
    ok: errors.length === 0,
    blocked: errors.length > 0,
    errors,
    checkedContractCount: contracts.length,
    mockOnly: true,
  }
}

export function modelRoleAllowsUserReasoning(modelRoleId: ReEditProModelRoleId): boolean {
  return getReEditProModelRoleContract(modelRoleId).userReasoningAllowed
}

export function modelRoleAllowsToolCode(modelRoleId: ReEditProModelRoleId): boolean {
  return getReEditProModelRoleContract(modelRoleId).toolCodeAllowed
}

export function validateReEditProModelRoleUse(input: {
  modelRoleId?: ReEditProModelRoleId | null
  providerRoute?: string | null
  providerModel?: string | null
  requestedUse?: ReEditProRequestedModelUse | null
}): ReEditProModelRoleUseValidation {
  const explicitContract = input.modelRoleId
    ? getReEditProModelRoleContract(input.modelRoleId)
    : undefined
  const providerModelContract = resolveReEditProModelRoleContract(input.providerModel)
  const providerRouteContract = resolveReEditProModelRoleContract(input.providerRoute)
  const contract = explicitContract ?? providerModelContract ?? providerRouteContract
  const warnings: string[] = []
  const errors: string[] = []

  if (!contract) {
    return {
      ok: true,
      blocked: false,
      errors,
      warnings,
      ...(input.requestedUse ? { requestedUse: input.requestedUse } : {}),
      mockOnly: true,
    }
  }

  if (contract && input.providerModel?.trim() && !providerModelContract) {
    errors.push(`${contract.displayName} requires providerModel to resolve to its canonical provider model ${contract.canonicalProviderModel} or an approved alias, not ${input.providerModel}.`)
  }

  pushModelRoleMismatchError({
    errors,
    leftSource: 'modelRoleId',
    leftContract: explicitContract,
    rightSource: 'providerModel',
    rightContract: providerModelContract,
  })
  pushModelRoleMismatchError({
    errors,
    leftSource: 'modelRoleId',
    leftContract: explicitContract,
    rightSource: 'providerRoute',
    rightContract: providerRouteContract,
  })
  pushModelRoleMismatchError({
    errors,
    leftSource: 'providerModel',
    leftContract: providerModelContract,
    rightSource: 'providerRoute',
    rightContract: providerRouteContract,
  })
  pushConcreteProviderRouteMismatchError({
    errors,
    contract,
    providerRoute: input.providerRoute,
    providerRouteContract,
  })

  if (!input.requestedUse) {
    errors.push(`${contract.displayName} matched a ReEditPro model role and requires an explicit requested model use.`)
  } else if (!modelRoleAllowsRequestedUse(contract, input.requestedUse)) {
    errors.push(`${contract.displayName} is not allowed for requested use ${input.requestedUse}.`)
  }

  return {
    ok: errors.length === 0,
    blocked: errors.length > 0,
    errors,
    warnings,
    resolvedModelRoleId: contract.modelRoleId,
    resolvedCanonicalProviderModel: contract.canonicalProviderModel,
    resolvedProviderBoundary: contract.providerBoundary,
    ...(input.requestedUse ? { requestedUse: input.requestedUse } : {}),
    mockOnly: true,
  }
}

function modelRoleAllowsRequestedUse(
  contract: ReEditProModelRoleContract,
  requestedUse: ReEditProRequestedModelUse,
): boolean {
  switch (requestedUse) {
    case 'user_reasoning':
      return contract.userReasoningAllowed
    case 'edit_planning':
      return contract.editPlanningAllowed
    case 'creative_edit_strategy':
      return contract.creativeStrategyAllowed
    case 'edit_qa_reasoning':
      return contract.editQaReasoningAllowed
    case 'visual_understanding':
      return contract.visualUnderstandingAllowed
    case 'tool_code':
      return contract.toolCodeAllowed
    case 'remotion_draft':
      return contract.remotionDraftAllowed
    case 'provider_asset_generation':
      return false
  }
}

function pushModelRoleMismatchError(input: {
  errors: string[]
  leftSource: string
  leftContract?: ReEditProModelRoleContract
  rightSource: string
  rightContract?: ReEditProModelRoleContract
}): void {
  if (!input.leftContract || !input.rightContract) return
  if (input.leftContract.modelRoleId === input.rightContract.modelRoleId) return

  input.errors.push(
    `ReEditPro model role metadata mismatch: ${input.leftSource} resolved to ${input.leftContract.displayName}, but ${input.rightSource} resolved to ${input.rightContract.displayName}.`,
  )
}

function pushConcreteProviderRouteMismatchError(input: {
  errors: string[]
  contract: ReEditProModelRoleContract
  providerRoute?: string | null
  providerRouteContract?: ReEditProModelRoleContract
}): void {
  const providerRoute = input.providerRoute?.trim()
  if (!providerRoute || providerRoute === 'none') return
  if (input.providerRouteContract) return

  input.errors.push(
    `${input.contract.displayName} must use its model-role provider boundary ${input.contract.providerBoundary}, not concrete provider route ${providerRoute}.`,
  )
}

function normalizeModelRoleLookupValue(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}
