import type {
  EditLevelQAFallbackNoticeModel,
  EditLevelQAGateListModel,
  EditLevelQAGatePackage,
  EditLevelQAGateSummaryModel,
  EditLevelQAReadinessCardModel,
  ReEditProCanonicalEditLevel,
} from '../types'
import {
  createEditLevelQAGateBoundarySummary,
  createEditLevelQAGatePackage,
} from './edit-level-qa-gates-rules'
import {
  createEditLevelQAGateStatusSummary,
  qaReadinessLabel,
  qaStrictnessLabel,
} from './edit-level-qa-gates-summaries'

export function loadEditLevelQAGatesForUI(level: ReEditProCanonicalEditLevel): EditLevelQAGatePackage {
  return createEditLevelQAGatePackage(level)
}

export function createEditLevelQAGateSummaryModel(
  level: ReEditProCanonicalEditLevel,
  qaPackage: EditLevelQAGatePackage = createEditLevelQAGatePackage(level),
): EditLevelQAGateSummaryModel {
  return {
    level,
    displayName: qaPackage.displayName,
    qaStrictnessLabel: qaStrictnessLabel(qaPackage.qaStrictness),
    readinessStatusLabel: qaReadinessLabel(qaPackage.readinessStatus),
    requiredCount: qaPackage.requiredGates.length,
    warningCount: qaPackage.warningOnlyGates.length,
    blockingCount: qaPackage.blockingGates.length,
    futureGatedCount: qaPackage.futureOnlyGates.length,
    userFacingSummary: qaPackage.userFacingSummary,
    highlights: [
      qaPackage.userFacingSummary,
      qaPackage.readinessSummary,
      createEditLevelQAGateStatusSummary(qaPackage),
      'QA policy is mock/local only; no QA tool, model, planner, media worker, render, or credit operation executes.',
    ],
    mockOnly: true,
  }
}

export function createEditLevelQAGateListModel(
  level: ReEditProCanonicalEditLevel,
  qaPackage: EditLevelQAGatePackage = createEditLevelQAGatePackage(level),
): EditLevelQAGateListModel {
  return {
    level,
    displayName: qaPackage.displayName,
    required: qaPackage.gates.filter((gate) => gate.requiredness === 'required'),
    recommended: qaPackage.gates.filter((gate) => gate.requiredness === 'recommended'),
    warningOnly: qaPackage.gates.filter((gate) => gate.requiredness === 'warning_only'),
    blocking: qaPackage.gates.filter((gate) => gate.blocksPlan || gate.blocksRenderFuture),
    futureGated: qaPackage.gates.filter((gate) => gate.requiredness === 'future_only' || gate.status === 'future_gated'),
    degradedOrFallback: qaPackage.gates.filter((gate) => qaPackage.degradedGates.includes(gate.gateId)),
    mockOnly: true,
  }
}

export function createEditLevelQAFallbackNoticeModel(
  level: ReEditProCanonicalEditLevel,
  qaPackage: EditLevelQAGatePackage = createEditLevelQAGatePackage(level),
): EditLevelQAFallbackNoticeModel {
  return {
    level,
    displayName: qaPackage.displayName,
    notices: qaPackage.fallbackPolicy,
    boundary: createEditLevelQAGateBoundarySummary().join(' '),
    mockOnly: true,
  }
}

export function createEditLevelQAReadinessCardModel(
  level: ReEditProCanonicalEditLevel,
  qaPackage: EditLevelQAGatePackage = createEditLevelQAGatePackage(level),
): EditLevelQAReadinessCardModel {
  return {
    level,
    displayName: qaPackage.displayName,
    readinessStatus: qaPackage.readinessStatus,
    readinessLabel: qaReadinessLabel(qaPackage.readinessStatus),
    readinessSummary: qaPackage.readinessSummary,
    blockingGates: qaPackage.gates.filter((gate) => gate.blocksPlan),
    futureGatedChecks: qaPackage.gates.filter((gate) => gate.blocksRenderFuture),
    noExecutionNotice: createEditLevelQAGateBoundarySummary().join(' '),
    mockOnly: true,
  }
}
