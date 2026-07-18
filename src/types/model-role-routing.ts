export const REEDITPRO_MODEL_ROLE_IDS = [
  'kimi_k3_main_edit_agent',
  'qwen_3_7_main_edit_agent',
  'qwen2_5_vl_visual_understanding',
  'deepseek_v4_tool_code_agent',
] as const

export type ReEditProModelRoleId = (typeof REEDITPRO_MODEL_ROLE_IDS)[number]

export type ReEditProModelRole =
  | 'main_edit_reasoning_agent'
  | 'fallback_edit_reasoning_agent'
  | 'visual_understanding_specialist'

export type ReEditProReasoningRouteRole = 'primary' | 'fallback' | 'specialist'

export type ReEditProModelExecutionStatus =
  | 'policy_defined_runtime_disabled'
  | 'provider_required_future_gated'

export const REEDITPRO_REQUESTED_MODEL_USES = [
  'user_reasoning',
  'edit_planning',
  'creative_edit_strategy',
  'edit_qa_reasoning',
  'visual_understanding',
  'tool_code',
  'remotion_draft',
  'provider_asset_generation',
] as const

export type ReEditProRequestedModelUse = (typeof REEDITPRO_REQUESTED_MODEL_USES)[number]

export interface ReEditProModelRoleContract {
  modelRoleId: ReEditProModelRoleId
  displayName: string
  aliases: string[]
  canonicalProviderModel: string
  role: ReEditProModelRole
  reasoningRouteRole: ReEditProReasoningRouteRole
  reasoningRoutePriority: number | null
  fallbackOnly: boolean
  executionStatus: ReEditProModelExecutionStatus
  userReasoningAllowed: boolean
  editPlanningAllowed: boolean
  creativeStrategyAllowed: boolean
  editQaReasoningAllowed: boolean
  visualUnderstandingAllowed: boolean
  toolCodeAllowed: boolean
  remotionDraftAllowed: boolean
  providerBoundary: string
  purpose: string
  allowedResponsibilities: string[]
  forbiddenResponsibilities: string[]
  fallbackPolicy: string
  mockOnly: true
}

export interface ReEditProModelRoleContractValidation {
  ok: boolean
  blocked: boolean
  errors: string[]
  checkedContractCount: number
  mockOnly: true
}

export interface ReEditProModelRoleUseValidation {
  ok: boolean
  blocked: boolean
  errors: string[]
  warnings: string[]
  resolvedModelRoleId?: ReEditProModelRoleId
  resolvedCanonicalProviderModel?: string
  resolvedProviderBoundary?: string
  requestedUse?: ReEditProRequestedModelUse
  mockOnly: true
}
