import type {
  EditLevelEstimateConfidence,
  EditLevelEstimateItem,
  EditLevelEstimateItemDefinition,
  EditLevelEstimateItemId,
  EditLevelEstimateKind,
  EditLevelEstimatePackage,
  EditLevelEstimateRange,
  EditLevelEstimateSideEffectFlags,
  EditLevelEstimateStatus,
  EditLevelEstimateUnit,
  ReEditProCanonicalEditLevel,
} from '../types'
import { mapCanonicalEditLevelToPublicLabel } from './edit-level-compatibility-mappers'
import { createEditLevelQAGatePackage } from './edit-level-qa-gates-rules'
import { createEditLevelQwenPlanningProfilePackage } from './edit-level-qwen-planning-rules'
import { createEditLevelSourceUnderstandingPolicyPackage } from './edit-level-source-understanding-rules'
import { createEditLevelToolRoutingPackage } from './edit-level-tool-router-rules'
import { createEditLevelEstimateProfile } from './edit-level-profile-mappers'

type EstimateItemSpec = {
  estimateId: EditLevelEstimateItemId
  estimateStatus: EditLevelEstimateStatus
  estimateValue: number | string
  estimateRange?: EditLevelEstimateRange
  unit?: EditLevelEstimateUnit
  confidence: EditLevelEstimateConfidence
  reason: string
  fallback: string
  userFacingSummary: string
  needsProductValue?: boolean
  futureGated?: boolean
  technicalNotes?: string[]
}

export const EDIT_LEVEL_ESTIMATE_ITEM_DEFINITIONS: EditLevelEstimateItemDefinition[] = [
  definition('time_estimate', 'Time estimate', 'time', 'minutes', 'Mock/local expected edit planning and treatment time.'),
  definition('credit_estimate', 'Credit estimate', 'credits', 'multiplier', 'Multiplier-only credit forecast; not billable credit execution.'),
  definition('analysis_pass_budget', 'Analysis pass budget', 'analysis', 'passes', 'Expected level-aware analysis pass budget.'),
  definition('qwen_reasoning_pass_budget', 'Qwen reasoning pass budget', 'model_reasoning', 'passes', 'Future Qwen 3.7 reasoning pass budget; no Qwen call is made.'),
  definition('qwen25vl_visual_pass_budget', 'Qwen2.5-VL visual pass budget', 'visual_understanding', 'none', 'Future Qwen2.5-VL visual-depth policy; no model call is made.'),
  definition('transcript_pass_budget', 'Transcript pass budget', 'transcript', 'passes', 'Future transcript-aware planning budget when speech exists.'),
  definition('audio_pass_budget', 'Audio pass budget', 'audio', 'passes', 'Future audio/music/SFX guidance budget.'),
  definition('graphic_pass_budget', 'Graphic pass budget', 'graphics', 'passes', 'Future graphic/card/layout direction budget.'),
  definition('qa_pass_budget', 'QA pass budget', 'qa', 'passes', 'Level-aware QA policy pass budget.'),
  definition('render_pass_budget_future', 'Render pass budget future', 'render_future', 'passes', 'Future render pass budget metadata only.'),
  definition('revision_budget_future', 'Revision budget future', 'revision_future', 'passes', 'Future revision budget metadata only.'),
  definition('variant_budget_future', 'Variant budget future', 'variant_future', 'variants', 'Future variant budget metadata only.'),
  definition('storage_budget_future', 'Storage budget future', 'storage_future', 'none', 'Future storage/readiness budget metadata only.'),
  definition('worker_budget_future', 'Worker budget future', 'worker_future', 'none', 'Future worker-budget metadata only.'),
  definition('degraded_capability_adjustment', 'Degraded capability adjustment', 'fallback', 'none', 'Estimate adjustment copy when future capabilities are unavailable.'),
]

const timeRanges: Record<ReEditProCanonicalEditLevel, EditLevelEstimateRange> = {
  normal: range(20, 45, 'minutes', '20-45 minutes'),
  premium: range(45, 90, 'minutes', '45-90 minutes'),
  ultra_premium: range(90, 180, 'minutes', '90-180 minutes'),
}

const transcriptBudgets: Record<ReEditProCanonicalEditLevel, number> = {
  normal: 1,
  premium: 2,
  ultra_premium: 3,
}

const audioBudgets: Record<ReEditProCanonicalEditLevel, number> = {
  normal: 1,
  premium: 2,
  ultra_premium: 3,
}

const graphicBudgets: Record<ReEditProCanonicalEditLevel, number> = {
  normal: 1,
  premium: 2,
  ultra_premium: 3,
}

const qaBudgets: Record<ReEditProCanonicalEditLevel, number> = {
  normal: 1,
  premium: 2,
  ultra_premium: 3,
}

const estimateStatusByLevel: Record<ReEditProCanonicalEditLevel, EditLevelEstimateStatus> = {
  normal: 'estimate_ready_mock',
  premium: 'estimate_ready_with_warnings',
  ultra_premium: 'estimate_degraded_by_missing_tool',
}

export function createEditLevelEstimateSideEffectFlags(): EditLevelEstimateSideEffectFlags {
  return {
    mockOnly: true,
    providerCallMade: false,
    qwenCallMade: false,
    qwen25vlCallMade: false,
    deepseekCallMade: false,
    plannerExecuted: false,
    editPlanCreated: false,
    mediaProcessingStarted: false,
    workerJobCreated: false,
    renderJobCreated: false,
    progressStarted: false,
    creditRecordCreated: false,
    creditReservedOrSpent: false,
    fileBytesRead: false,
    externalUrlFetched: false,
  }
}

export function listEditLevelEstimateItemDefinitions(): EditLevelEstimateItemDefinition[] {
  return [...EDIT_LEVEL_ESTIMATE_ITEM_DEFINITIONS]
}

export function getEditLevelEstimateItemDefinition(
  estimateId: EditLevelEstimateItemId,
): EditLevelEstimateItemDefinition {
  const found = EDIT_LEVEL_ESTIMATE_ITEM_DEFINITIONS.find((definitionItem) => definitionItem.estimateId === estimateId)

  if (!found) {
    throw new Error(`Missing Edit Level estimate item definition: ${estimateId}`)
  }

  return found
}

export function createNormalEstimatePackage(): EditLevelEstimatePackage {
  return createEditLevelEstimatePackage('normal')
}

export function createPremiumEstimatePackage(): EditLevelEstimatePackage {
  return createEditLevelEstimatePackage('premium')
}

export function createUltraPremiumEstimatePackage(): EditLevelEstimatePackage {
  return createEditLevelEstimatePackage('ultra_premium')
}

export function createAllEditLevelEstimatePackages(): EditLevelEstimatePackage[] {
  return [
    createNormalEstimatePackage(),
    createPremiumEstimatePackage(),
    createUltraPremiumEstimatePackage(),
  ]
}

export function createEditLevelEstimatePackage(
  level: ReEditProCanonicalEditLevel,
): EditLevelEstimatePackage {
  const profileEstimate = createEditLevelEstimateProfile(level)
  const qwenPackage = createEditLevelQwenPlanningProfilePackage(level)
  const sourcePackage = createEditLevelSourceUnderstandingPolicyPackage(level)
  const qaPackage = createEditLevelQAGatePackage(level)
  const toolPackage = createEditLevelToolRoutingPackage(level)
  const displayName = mapCanonicalEditLevelToPublicLabel(level)
  const sideEffectFlags = createEditLevelEstimateSideEffectFlags()
  const timeEstimateRange = timeRanges[level]
  const creditEstimateRange = range(
    profileEstimate.creditEstimateMultiplier,
    profileEstimate.creditEstimateMultiplier,
    'multiplier',
    `${profileEstimate.creditEstimateMultiplier.toFixed(1)}x placeholder`,
  )
  const transcriptPassBudget = transcriptBudgets[level]
  const audioPassBudget = audioBudgets[level]
  const graphicPassBudget = graphicBudgets[level]
  const qaPassBudget = qaBudgets[level]
  const summary = userSummaryForLevel(level)
  const items = createEstimateItems({
    level,
    timeEstimateRange,
    creditEstimateRange,
    creditEstimateMultiplier: profileEstimate.creditEstimateMultiplier,
    analysisPassBudget: profileEstimate.analysisPassBudget,
    qwenReasoningPassBudget: profileEstimate.qwenReasoningPassBudget,
    qwen25vlVisualPassBudget: profileEstimate.qwen25vlVisualPassBudget,
    transcriptPassBudget,
    audioPassBudget,
    graphicPassBudget,
    qaPassBudget,
    renderPassBudgetFuture: profileEstimate.renderPassBudgetFuture,
    revisionBudgetFuture: profileEstimate.revisionBudgetFuture,
    variantBudgetFuture: profileEstimate.variantBudgetFuture,
  })

  return {
    level,
    displayName,
    estimateStatus: estimateStatusByLevel[level],
    timeEstimateRange,
    creditEstimateRange,
    creditEstimateMultiplier: profileEstimate.creditEstimateMultiplier,
    analysisPassBudget: profileEstimate.analysisPassBudget,
    qwenReasoningPassBudget: profileEstimate.qwenReasoningPassBudget,
    qwen25vlVisualPassBudget: profileEstimate.qwen25vlVisualPassBudget,
    transcriptPassBudget,
    audioPassBudget,
    graphicPassBudget,
    qaPassBudget,
    renderPassBudgetFuture: profileEstimate.renderPassBudgetFuture,
    revisionBudgetFuture: profileEstimate.revisionBudgetFuture,
    variantBudgetFuture: profileEstimate.variantBudgetFuture,
    estimateItems: items,
    futureGatedItems: items.filter((item) => item.futureGated).map((item) => item.estimateId),
    degradedItems: items
      .filter((item) => item.estimateStatus === 'estimate_degraded_by_missing_tool')
      .map((item) => item.estimateId),
    needsProductValueItems: items.filter((item) => item.needsProductValue).map((item) => item.estimateId),
    userFacingSummary: summary,
    technicalSummary: `${displayName} estimate package combines ${toolPackage.routes.length} tool routes, ${sourcePackage.layers.length} source layers, ${qwenPackage.dimensions.length} Qwen dimensions, and ${qaPackage.gates.length} QA gates without executing them.`,
    warnings: warningsForLevel(level),
    estimateOnly: true,
    creditsReservedOrSpent: false,
    ...sideEffectFlags,
    sideEffectFlags,
  }
}

export function createEditLevelEstimateItem(input: {
  level: ReEditProCanonicalEditLevel
} & EstimateItemSpec): EditLevelEstimateItem {
  const definitionItem = getEditLevelEstimateItemDefinition(input.estimateId)
  const sideEffectFlags = createEditLevelEstimateSideEffectFlags()

  return {
    level: input.level,
    estimateId: input.estimateId,
    displayName: definitionItem.displayName,
    estimateKind: definitionItem.estimateKind,
    estimateStatus: input.estimateStatus,
    estimateValue: input.estimateValue,
    estimateRange: input.estimateRange,
    unit: input.unit ?? definitionItem.defaultUnit,
    confidence: input.confidence,
    reason: input.reason,
    fallback: input.fallback,
    userFacingSummary: input.userFacingSummary,
    technicalNotes: [
      ...(input.technicalNotes ?? []),
      'RP-EDITLEVEL-09 estimates are mock/local policy only.',
      'No credits are reserved or spent; no credit records, workers, render jobs, progress, provider calls, model calls, planner execution, media processing, file-byte reads, or external fetches occur.',
    ],
    estimateOnly: true,
    needsProductValue: input.needsProductValue ?? false,
    futureGated: input.futureGated ?? false,
    ...sideEffectFlags,
    sideEffectFlags,
  }
}

export function createEditLevelEstimateBoundarySummary(): string[] {
  return [
    'Estimate only - no credits are reserved and no render starts.',
    'This estimate reflects planned depth and future budget.',
    'ReEditPro will not reserve credits, start workers, render, or export until future approval, credit, and render gates are active.',
    'Final pricing and credit values still need product values and credit gates.',
  ]
}

function createEstimateItems(input: {
  level: ReEditProCanonicalEditLevel
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
}): EditLevelEstimateItem[] {
  const levelCopy = levelEstimateCopy(input.level)
  const degradedStatus: EditLevelEstimateStatus = input.level === 'normal'
    ? 'estimate_ready_mock'
    : 'estimate_degraded_by_missing_tool'

  return [
    item(input.level, 'time_estimate', 'estimate_needs_product_value', input.timeEstimateRange.label, input.timeEstimateRange, 'medium', levelCopy.timeReason, 'Use deterministic setup context and revise once real plan duration exists.', levelCopy.timeSummary, true),
    item(input.level, 'credit_estimate', 'estimate_needs_product_value', `${input.creditEstimateMultiplier.toFixed(1)}x`, input.creditEstimateRange, 'medium', levelCopy.creditReason, 'Keep estimate-only copy and do not reserve or spend credits.', levelCopy.creditSummary, true),
    item(input.level, 'analysis_pass_budget', estimateStatusByLevel[input.level], input.analysisPassBudget, undefined, 'high', levelCopy.analysisReason, 'Use the selected level default analysis budget.', levelCopy.analysisSummary),
    item(input.level, 'qwen_reasoning_pass_budget', estimateStatusByLevel[input.level], input.qwenReasoningPassBudget, undefined, 'high', levelCopy.qwenReason, 'Use deterministic mock reasoning hints; do not call Qwen.', levelCopy.qwenSummary),
    item(input.level, 'qwen25vl_visual_pass_budget', input.level === 'normal' ? 'estimate_ready_mock' : degradedStatus, input.qwen25vlVisualPassBudget, undefined, 'medium', levelCopy.visualReason, 'Use source summary fallback; do not call Qwen2.5-VL.', levelCopy.visualSummary),
    item(input.level, 'transcript_pass_budget', input.level === 'normal' ? 'estimate_ready_mock' : degradedStatus, input.transcriptPassBudget, undefined, 'medium', levelCopy.transcriptReason, 'Use source summary and ask for clarification when speech meaning is unclear.', levelCopy.transcriptSummary),
    item(input.level, 'audio_pass_budget', input.level === 'normal' ? 'estimate_ready_mock' : degradedStatus, input.audioPassBudget, undefined, 'medium', levelCopy.audioReason, 'Use basic audio policy fallback; do not run audio workers.', levelCopy.audioSummary),
    item(input.level, 'graphic_pass_budget', estimateStatusByLevel[input.level], input.graphicPassBudget, undefined, 'medium', levelCopy.graphicReason, 'Use text-safe graphic defaults until design workers exist.', levelCopy.graphicSummary),
    item(input.level, 'qa_pass_budget', estimateStatusByLevel[input.level], input.qaPassBudget, undefined, 'high', levelCopy.qaReason, 'Use RP08 QA gate package only; do not execute QA tools.', levelCopy.qaSummary),
    item(input.level, 'render_pass_budget_future', 'future_gated', input.renderPassBudgetFuture, undefined, 'low', 'Render pass budget is future planning metadata.', 'Do not create a render job.', `${input.renderPassBudgetFuture} future render pass budget.`, true, true),
    item(input.level, 'revision_budget_future', 'future_gated', input.revisionBudgetFuture, undefined, 'low', 'Revision budget is future planning metadata.', 'Do not commit revision service budget.', `${input.revisionBudgetFuture} future revision budget.`, true, true),
    item(input.level, 'variant_budget_future', 'future_gated', input.variantBudgetFuture, undefined, 'low', 'Variant budget is future planning metadata.', 'Do not create variants or render jobs.', `${input.variantBudgetFuture} future variant budget.`, true, true),
    item(input.level, 'storage_budget_future', 'future_gated', storageBudgetValue(input.level), undefined, 'low', 'Storage budget is future readiness metadata.', 'Do not upload files or read file bytes.', storageBudgetSummary(input.level), true, true),
    item(input.level, 'worker_budget_future', 'future_gated', workerBudgetValue(input.level), undefined, 'low', 'Worker budget is future worker metadata.', 'Do not create worker jobs.', workerBudgetSummary(input.level), true, true),
    item(input.level, 'degraded_capability_adjustment', degradedStatus, degradedValue(input.level), undefined, 'medium', levelCopy.degradedReason, levelCopy.degradedFallback, levelCopy.degradedSummary, input.level !== 'normal'),
  ]
}

function item(
  level: ReEditProCanonicalEditLevel,
  estimateId: EditLevelEstimateItemId,
  estimateStatus: EditLevelEstimateStatus,
  estimateValue: number | string,
  estimateRange: EditLevelEstimateRange | undefined,
  confidence: EditLevelEstimateConfidence,
  reason: string,
  fallback: string,
  userFacingSummary: string,
  needsProductValue = false,
  futureGated = false,
): EditLevelEstimateItem {
  return createEditLevelEstimateItem({
    level,
    estimateId,
    estimateStatus,
    estimateValue,
    estimateRange,
    confidence,
    reason,
    fallback,
    userFacingSummary,
    needsProductValue,
    futureGated,
  })
}

function definition(
  estimateId: EditLevelEstimateItemId,
  displayName: string,
  estimateKind: EditLevelEstimateKind,
  defaultUnit: EditLevelEstimateUnit,
  purpose: string,
): EditLevelEstimateItemDefinition {
  return {
    estimateId,
    displayName,
    estimateKind,
    defaultUnit,
    purpose,
    mockOnly: true,
  }
}

function range(min: number, max: number, unit: EditLevelEstimateUnit, label: string): EditLevelEstimateRange {
  return {
    min,
    max,
    unit,
    label,
    estimateOnly: true,
  }
}

function userSummaryForLevel(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') {
    return 'Normal is the fastest clean professional edit path. Estimates are lower because it uses targeted analysis and baseline QA.'
  }

  if (level === 'premium') {
    return 'Premium takes more analysis and polish time for stronger story, B-roll, captions, audio guidance, Preference DNA, and creative QA.'
  }

  return 'Ultra Premium has the highest estimate because it plans for studio-level analysis, deeper visual/audio/design context, stricter QA, and more future iteration budget.'
}

function warningsForLevel(level: ReEditProCanonicalEditLevel): string[] {
  if (level === 'normal') {
    return [
      'Normal estimates stay low by using targeted analysis and baseline QA.',
      'Final pricing still needs product values and future credit gates.',
    ]
  }

  if (level === 'premium') {
    return [
      'Premium estimates include degraded capability notices for missing key visual, transcript, or audio tools.',
      'Final pricing still needs product values and future credit gates.',
    ]
  }

  return [
    'Ultra Premium estimates include stronger degraded notices when scene-level visual, audio, graphic, or context tools are unavailable.',
    'Final pricing still needs product values and future credit gates.',
  ]
}

function levelEstimateCopy(level: ReEditProCanonicalEditLevel) {
  if (level === 'normal') {
    return {
      timeReason: 'Normal uses the fastest clean professional estimate band.',
      timeSummary: '20-45 minute placeholder time range for a clean professional path.',
      creditReason: 'Normal uses the baseline 1.0x multiplier fixture.',
      creditSummary: '1.0x multiplier estimate only; no credits reserved or spent.',
      analysisReason: 'Normal uses one targeted professional analysis pass.',
      analysisSummary: 'Single analysis pass budget.',
      qwenReason: 'Normal uses a single future Qwen planning pass policy.',
      qwenSummary: 'Single Qwen planning pass policy; no Qwen call.',
      visualReason: 'Normal uses targeted Qwen2.5-VL only when needed.',
      visualSummary: 'Targeted visual understanding only when needed.',
      transcriptReason: 'Normal uses targeted transcript policy when speech matters.',
      transcriptSummary: 'Targeted transcript budget when speech meaning matters.',
      audioReason: 'Normal uses basic audio guidance.',
      audioSummary: 'Basic audio pass budget.',
      graphicReason: 'Normal uses basic caption/text-safe graphic policy.',
      graphicSummary: 'Basic graphic pass budget.',
      qaReason: 'Normal uses baseline QA gates.',
      qaSummary: 'Baseline QA pass budget.',
      degradedReason: 'Normal remains low with targeted fallbacks.',
      degradedFallback: 'Use targeted fallback and ask for clarification when needed.',
      degradedSummary: 'Targeted fallback keeps the estimate low.',
    }
  }

  if (level === 'premium') {
    return {
      timeReason: 'Premium uses a medium estimate band for deeper analysis and polish.',
      timeSummary: '45-90 minute placeholder time range for enhanced creative polish.',
      creditReason: 'Premium uses the 2.0x multiplier fixture.',
      creditSummary: '2.0x multiplier estimate only; no credits reserved or spent.',
      analysisReason: 'Premium uses two analysis passes.',
      analysisSummary: 'Two analysis pass budget.',
      qwenReason: 'Premium uses two-pass future Qwen planning policy.',
      qwenSummary: 'Two Qwen planning passes; no Qwen call.',
      visualReason: 'Premium plans Qwen2.5-VL key moments and marker windows.',
      visualSummary: 'Key moments plus marker windows visual budget.',
      transcriptReason: 'Premium is transcript-aware when speech exists.',
      transcriptSummary: 'Transcript-aware planning budget when speech exists.',
      audioReason: 'Premium includes music/SFX/ducking guidance.',
      audioSummary: 'Music, SFX, and ducking guidance budget.',
      graphicReason: 'Premium includes styled captions/cards and graphic observations.',
      graphicSummary: 'Medium graphic/card direction budget.',
      qaReason: 'Premium uses stronger creative QA.',
      qaSummary: 'Premium creative QA pass budget.',
      degradedReason: 'Premium may degrade when key visual, transcript, or audio tools are unavailable.',
      degradedFallback: 'Show degraded capability notice and continue with Premium-safe summary fallback.',
      degradedSummary: 'Degraded capability notice for missing visual, transcript, or audio tools.',
    }
  }

  return {
    timeReason: 'Ultra Premium uses the highest estimate band for studio-level treatment.',
    timeSummary: '90-180 minute placeholder time range for studio-level treatment.',
    creditReason: 'Ultra Premium uses the 4.0x multiplier fixture.',
    creditSummary: '4.0x multiplier estimate only; no credits reserved or spent.',
    analysisReason: 'Ultra Premium uses three analysis passes.',
    analysisSummary: 'Three analysis pass budget.',
    qwenReason: 'Ultra Premium uses multi-pass future Qwen planning policy.',
    qwenSummary: 'Multi-pass Qwen planning policy; no Qwen call.',
    visualReason: 'Ultra Premium plans scene-level Qwen2.5-VL visual understanding.',
    visualSummary: 'Scene-level visual understanding budget.',
    transcriptReason: 'Ultra Premium requires transcript when speech exists.',
    transcriptSummary: 'Speech-aware transcript budget.',
    audioReason: 'Ultra Premium includes sound design planning.',
    audioSummary: 'Sound design planning budget.',
    graphicReason: 'Ultra Premium includes graphic/layout direction.',
    graphicSummary: 'Graphic and layout direction budget.',
    qaReason: 'Ultra Premium uses strict studio QA.',
    qaSummary: 'Strict studio QA pass budget.',
    degradedReason: 'Ultra Premium has stronger degraded notices when scene-level context tools are unavailable.',
    degradedFallback: 'Show Premium-safe degraded fallback until scene-level visual, audio, graphic, and context tools exist.',
    degradedSummary: 'Premium-safe degraded fallback when studio-level tools are unavailable.',
  }
}

function storageBudgetValue(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') return 'basic source package future'
  if (level === 'premium') return 'source package future'
  return 'studio source package future'
}

function storageBudgetSummary(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') return 'Future storage readiness for basic source metadata.'
  if (level === 'premium') return 'Future storage readiness for source package and key moments.'
  return 'Future storage readiness for studio source package and scene-level context.'
}

function workerBudgetValue(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') return 'minimal professional future'
  if (level === 'premium') return 'medium future'
  return 'highest future'
}

function workerBudgetSummary(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') return 'Future worker budget stays minimal and targeted.'
  if (level === 'premium') return 'Future worker budget supports key visual, transcript, audio, and QA depth.'
  return 'Future worker budget supports studio-level visual, audio, graphic, render, and QA depth.'
}

function degradedValue(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') return 'targeted fallback'
  if (level === 'premium') return 'degraded notice'
  return 'Premium-safe degraded fallback'
}
