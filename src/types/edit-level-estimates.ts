import type {
  ReEditProCanonicalEditLevel,
  ReEditProEditLevelDisplayName,
} from './edit-level'

export type EditLevelEstimateItemId =
  | 'time_estimate'
  | 'credit_estimate'
  | 'analysis_pass_budget'
  | 'qwen_reasoning_pass_budget'
  | 'qwen25vl_visual_pass_budget'
  | 'transcript_pass_budget'
  | 'audio_pass_budget'
  | 'graphic_pass_budget'
  | 'qa_pass_budget'
  | 'render_pass_budget_future'
  | 'revision_budget_future'
  | 'variant_budget_future'
  | 'storage_budget_future'
  | 'worker_budget_future'
  | 'degraded_capability_adjustment'

export type EditLevelEstimateKind =
  | 'time'
  | 'credits'
  | 'analysis'
  | 'model_reasoning'
  | 'visual_understanding'
  | 'transcript'
  | 'audio'
  | 'graphics'
  | 'qa'
  | 'render_future'
  | 'revision_future'
  | 'variant_future'
  | 'storage_future'
  | 'worker_future'
  | 'fallback'

export type EditLevelEstimateStatus =
  | 'estimate_ready_mock'
  | 'estimate_ready_with_warnings'
  | 'estimate_degraded_by_missing_tool'
  | 'estimate_blocked_by_policy'
  | 'estimate_needs_product_value'
  | 'future_gated'
  | 'failed_validation'

export type EditLevelEstimateConfidence = 'low' | 'medium' | 'high'

export type EditLevelEstimateUnit =
  | 'multiplier'
  | 'minutes'
  | 'credits'
  | 'passes'
  | 'variants'
  | 'none'

export interface EditLevelEstimateSideEffectFlags {
  mockOnly: true
  providerCallMade: false
  qwenCallMade: false
  qwen25vlCallMade: false
  deepseekCallMade: false
  plannerExecuted: false
  editPlanCreated: false
  mediaProcessingStarted: false
  workerJobCreated: false
  renderJobCreated: false
  progressStarted: false
  creditRecordCreated: false
  creditReservedOrSpent: false
  fileBytesRead: false
  externalUrlFetched: false
}

export interface EditLevelEstimateRange {
  min: number
  max: number
  unit: EditLevelEstimateUnit
  label: string
  estimateOnly: true
}

export interface EditLevelEstimateItemDefinition {
  estimateId: EditLevelEstimateItemId
  displayName: string
  estimateKind: EditLevelEstimateKind
  defaultUnit: EditLevelEstimateUnit
  purpose: string
  mockOnly: true
}

export interface EditLevelEstimateItem extends EditLevelEstimateSideEffectFlags {
  level: ReEditProCanonicalEditLevel
  estimateId: EditLevelEstimateItemId
  displayName: string
  estimateKind: EditLevelEstimateKind
  estimateStatus: EditLevelEstimateStatus
  estimateValue: number | string
  estimateRange?: EditLevelEstimateRange
  unit: EditLevelEstimateUnit
  confidence: EditLevelEstimateConfidence
  reason: string
  fallback: string
  userFacingSummary: string
  technicalNotes: string[]
  estimateOnly: true
  needsProductValue: boolean
  futureGated: boolean
  sideEffectFlags: EditLevelEstimateSideEffectFlags
}

export interface EditLevelEstimatePackage extends EditLevelEstimateSideEffectFlags {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  estimateStatus: EditLevelEstimateStatus
  timeEstimateRange: EditLevelEstimateRange
  creditEstimateRange: EditLevelEstimateRange
  creditEstimateMultiplier: number
  analysisPassBudget: number
  qwenReasoningPassBudget: number | 'multi_pass'
  qwen25vlVisualPassBudget: 'targeted_only' | 'key_moments' | 'scene_level'
  transcriptPassBudget: number
  audioPassBudget: number
  graphicPassBudget: number
  qaPassBudget: number
  renderPassBudgetFuture: number
  revisionBudgetFuture: number
  variantBudgetFuture: number
  estimateItems: EditLevelEstimateItem[]
  futureGatedItems: EditLevelEstimateItemId[]
  degradedItems: EditLevelEstimateItemId[]
  needsProductValueItems: EditLevelEstimateItemId[]
  userFacingSummary: string
  technicalSummary: string
  warnings: string[]
  estimateOnly: true
  creditsReservedOrSpent: false
  creditRecordCreated: false
  sideEffectFlags: EditLevelEstimateSideEffectFlags
}

export interface EditLevelEstimateValidationResult extends EditLevelEstimateSideEffectFlags {
  ok: boolean
  blocked: boolean
  level?: ReEditProCanonicalEditLevel
  errors: string[]
  warnings: string[]
  checkedItemCount: number
  sideEffectFlags: EditLevelEstimateSideEffectFlags
}

export interface EditLevelEstimateSummaryModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  estimateStatusLabel: string
  timeEstimateSummary: string
  creditEstimateSummary: string
  creditEstimateMultiplier: string
  analysisPassBudget: string
  qwenReasoningPassBudget: string
  renderPassBudgetFuture: number
  revisionBudgetFuture: number
  variantBudgetFuture: number
  userFacingSummary: string
  highlights: string[]
  mockOnly: true
}

export interface EditLevelEstimateItemListModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  estimateItems: EditLevelEstimateItem[]
  futureGatedItems: EditLevelEstimateItem[]
  degradedItems: EditLevelEstimateItem[]
  needsProductValueItems: EditLevelEstimateItem[]
  mockOnly: true
}

export interface EditLevelCreditEstimateNoticeModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  creditEstimateMultiplier: number
  creditEstimateRange: EditLevelEstimateRange
  notice: string
  estimateOnly: true
  creditsReservedOrSpent: false
  creditRecordCreated: false
  mockOnly: true
}

export interface EditLevelRenderBudgetNoticeModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  renderPassBudgetFuture: number
  variantBudgetFuture: number
  notice: string
  futureGated: true
  renderJobCreated: false
  mockOnly: true
}

export interface EditLevelRevisionBudgetNoticeModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  revisionBudgetFuture: number
  notice: string
  futureGated: true
  mockOnly: true
}

export interface EditLevelEstimateBoundaryNoticeModel {
  level: ReEditProCanonicalEditLevel
  displayName: ReEditProEditLevelDisplayName
  shortCopy: string
  detailedCopy: string
  notices: string[]
  mockOnly: true
}

export const REEDITPRO_EDIT_LEVEL_ESTIMATE_RULE =
  'Edit Level estimates are mock/local planning forecasts for time, credits, render pass budget, revision budget, and tool depth; they are not billing or execution actions.'

export const REEDITPRO_EDIT_LEVEL_ESTIMATE_NO_CREDIT_EXECUTION_RULE =
  'RP-EDITLEVEL-09 must not reserve credits, spend credits, create credit records, start progress, create workers, render, or execute planners.'
