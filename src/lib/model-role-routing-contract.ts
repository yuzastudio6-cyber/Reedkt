import type {
  ReEditProModelRoleContract,
  ReEditProModelRoleContractValidation,
  ReEditProModelRoleId,
  ReEditProModelRoleUseValidation,
  ReEditProRequestedModelUse,
} from '../types'

export const REEDITPRO_MODEL_ROLE_CONTRACT_VERSION = 'reeditpro-model-role-routing-v1'

export const REEDITPRO_MODEL_ROLE_CONTRACTS: ReEditProModelRoleContract[] = [
  {
    modelRoleId: 'qwen_3_7_main_edit_agent',
    displayName: 'Qwen 3.7 main edit agent',
    aliases: ['Qwen 3.7', 'Qwen 3.7 Max', 'qwen-3.7-max', 'qwen_3_reasoning'],
    canonicalProviderModel: 'qwen-3.7-max',
    role: 'main_edit_reasoning_agent',
    executionStatus: 'policy_defined_runtime_disabled',
    userReasoningAllowed: true,
    editPlanningAllowed: true,
    visualUnderstandingAllowed: false,
    toolCodeAllowed: false,
    remotionDraftAllowed: false,
    providerBoundary: 'qwen_3_7_provider_boundary',
    purpose: 'Main reasoning brain for user intent, edit planning, marker decisions, Edit Brief interpretation, Preference DNA reasoning, plan synthesis, and QA explanation.',
    allowedResponsibilities: [
      'compile user intent into structured editing direction',
      'reason about edit goals, pacing, style, markers, and QA explanations',
      'plan from approved source summaries, visual summaries, transcripts, preferences, and brief context',
    ],
    forbiddenResponsibilities: [
      'execute provider calls from frontend or mock planning',
      'perform visual/video understanding directly',
      'draft production code or Remotion implementation details',
      'run tools, workers, render, storage, billing, or Supabase mutations',
    ],
    fallbackPolicy: 'Use deterministic professional planning fallback and clearly mark that Qwen 3.7 did not run.',
    mockOnly: true,
  },
  {
    modelRoleId: 'qwen2_5_vl_visual_understanding',
    displayName: 'Qwen2.5-VL visual understanding',
    aliases: ['Qwen2.5-VL', 'Qwen2.5-VL-7B-Instruct', 'qwen2.5-vl-7b-instruct', 'qwen25vl_visual_understanding'],
    canonicalProviderModel: 'qwen2.5-vl-7b-instruct',
    role: 'visual_understanding_specialist',
    executionStatus: 'provider_required_future_gated',
    userReasoningAllowed: false,
    editPlanningAllowed: false,
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
    displayName: 'DeepSeek V4 Pro tool-code agent',
    aliases: ['DeepSeek V4 Pro', 'DeepSeek', 'deepseek-v4-pro', 'deepseek_tool_code'],
    canonicalProviderModel: 'deepseek-v4-pro',
    role: 'tool_code_agent',
    executionStatus: 'provider_required_future_gated',
    userReasoningAllowed: false,
    editPlanningAllowed: false,
    visualUnderstandingAllowed: false,
    toolCodeAllowed: true,
    remotionDraftAllowed: true,
    providerBoundary: 'deepseek_v4_pro_tool_code_boundary',
    purpose: 'Future coding, tool-code, deterministic adapter, and Remotion draft support agent only; it is not the user-facing edit reasoning brain.',
    allowedResponsibilities: [
      'assist future backend-only tool-code planning after approved snapshots exist',
      'draft Remotion or deterministic adapter implementation hints under backend gates',
      'support coding-oriented tool orchestration without deciding user-facing creative intent',
    ],
    forbiddenResponsibilities: [
      'perform user reasoning or reason with users as the main edit agent',
      'compile user intent into the canonical edit plan',
      'replace Qwen 3.7 planning or Qwen2.5-VL visual understanding',
      'run provider/tool/worker/render/storage/billing calls from frontend or mock planning',
    ],
    fallbackPolicy: 'Use deterministic tool-code notes and existing renderer planning; do not use DeepSeek for user reasoning.',
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
  const qwen = contracts.find((contract) => contract.modelRoleId === 'qwen_3_7_main_edit_agent')
  const visual = contracts.find((contract) => contract.modelRoleId === 'qwen2_5_vl_visual_understanding')
  const deepseek = contracts.find((contract) => contract.modelRoleId === 'deepseek_v4_tool_code_agent')

  if (!qwen?.userReasoningAllowed || !qwen.editPlanningAllowed || qwen.toolCodeAllowed) {
    errors.push('Qwen 3.7 must remain the main edit reasoning/planning agent and must not be marked as tool-code.')
  }

  if (!visual?.visualUnderstandingAllowed || visual.userReasoningAllowed || visual.editPlanningAllowed) {
    errors.push('Qwen2.5-VL must remain visual-understanding only and must not become the main edit planner.')
  }

  if (!deepseek?.toolCodeAllowed || !deepseek.remotionDraftAllowed || deepseek.userReasoningAllowed || deepseek.editPlanningAllowed) {
    errors.push('DeepSeek V4 Pro must remain tool-code/Remotion draft only and must not be used for user reasoning.')
  }

  for (const contract of contracts) {
    if (!contract.mockOnly) errors.push(`${contract.modelRoleId} must remain mockOnly in this contract.`)
    if (!contract.providerBoundary) errors.push(`${contract.modelRoleId} is missing provider boundary metadata.`)
    if (!contract.canonicalProviderModel) errors.push(`${contract.modelRoleId} is missing canonical provider model metadata.`)
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
