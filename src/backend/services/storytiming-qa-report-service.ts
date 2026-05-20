import type {
  MasterTimingMapRecord,
  RenderTimingManifestRecord,
  StoryTimingAdjustmentRecommendationRecord,
  StoryTimingQACheckRecord,
  StoryTimingQARecommendedAction,
  StoryTimingQAReportRecord,
  StoryTimingReadinessDecision,
  TimingConflictRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'
import {
  createStoryTimingScoreBreakdown,
  type StoryTimingScoreBreakdown,
} from './storytiming-qa-scoring-service'

export function mergeSpecializedTimingQAResults(
  ...qaCheckGroups: StoryTimingQACheckRecord[][]
): StoryTimingQACheckRecord[] {
  const byKey = new Map<string, StoryTimingQACheckRecord>()
  qaCheckGroups.flat().forEach((check) => {
    const key = `${check.checkType}:${check.summary}:${check.timeRange?.startSeconds ?? ''}:${check.timeRange?.endSeconds ?? ''}`
    const existing = byKey.get(key)
    if (!existing || Number(check.blocksRender) > Number(existing.blocksRender)) {
      byKey.set(key, check)
    }
  })

  return [...byKey.values()]
}

const recommendedActionsFromRecommendations = (
  recommendations: StoryTimingAdjustmentRecommendationRecord[] = [],
): StoryTimingQARecommendedAction[] => {
  const actions = recommendations.map((recommendation) => recommendation.recommendedAction)
  return actions.length > 0 ? [...new Set(actions)] : ['approve_timing']
}

export function createStoryTimingQAReport(input: {
  masterTimingMap: MasterTimingMapRecord
  readinessDecision: StoryTimingReadinessDecision
  scores: StoryTimingScoreBreakdown
  conflicts?: TimingConflictRecord[]
  qaChecks?: StoryTimingQACheckRecord[]
  adjustmentRecommendations?: StoryTimingAdjustmentRecommendationRecord[]
  recommendedActions?: StoryTimingQARecommendedAction[]
  summary?: string
}): StoryTimingQAReportRecord {
  const recommendedActions = input.recommendedActions ?? recommendedActionsFromRecommendations(input.adjustmentRecommendations)

  return {
    id: createMockId('storytiming-qa-report'),
    masterTimingMapId: input.masterTimingMap.id,
    projectId: input.masterTimingMap.projectId,
    editPlanId: input.masterTimingMap.editPlanId,
    readinessDecision: input.readinessDecision,
    overallScore: input.scores.overallScore,
    captionCutScore: input.scores.captionCutScore,
    musicSfxScore: input.scores.musicSfxScore,
    signatureTimingScore: input.scores.signatureTimingScore,
    overlaySafetyScore: input.scores.overlaySafetyScore,
    emotionalTimingScore: input.scores.emotionalTimingScore,
    overallRhythmScore: input.scores.overallRhythmScore,
    renderManifestScore: input.scores.renderManifestScore,
    conflictIds: (input.conflicts ?? []).map((conflict) => conflict.id),
    qaCheckIds: (input.qaChecks ?? []).map((check) => check.id),
    recommendedActions,
    blocksPreview: input.readinessDecision === 'blocked_for_render' || input.readinessDecision === 'requires_timing_adjustment',
    blocksRender: input.readinessDecision === 'blocked_for_render',
    requiresUserReview: input.readinessDecision === 'requires_user_review',
    summary: input.summary ?? createStoryTimingQAReportSummary(input.readinessDecision, input.scores, input.conflicts ?? []),
    createdAt: nowIso(),
    metadata: {
      mockOnly: true,
      recommendationIds: (input.adjustmentRecommendations ?? []).map((recommendation) => recommendation.id),
    },
  }
}

export function createStoryTimingQAReportFromChecks(input: {
  masterTimingMap: MasterTimingMapRecord
  readinessDecision: StoryTimingReadinessDecision
  qaChecks: StoryTimingQACheckRecord[]
  conflicts?: TimingConflictRecord[]
  renderTimingManifest?: RenderTimingManifestRecord
  adjustmentRecommendations?: StoryTimingAdjustmentRecommendationRecord[]
}): StoryTimingQAReportRecord {
  const scores = createStoryTimingScoreBreakdown({
    conflicts: input.conflicts,
    qaChecks: input.qaChecks,
    renderTimingManifest: input.renderTimingManifest,
  })

  return createStoryTimingQAReport({
    masterTimingMap: input.masterTimingMap,
    readinessDecision: input.readinessDecision,
    scores,
    conflicts: input.conflicts,
    qaChecks: input.qaChecks,
    adjustmentRecommendations: input.adjustmentRecommendations,
  })
}

export function createStoryTimingQAReportFromMap(input: {
  masterTimingMap: MasterTimingMapRecord
  readinessDecision: StoryTimingReadinessDecision
  conflicts?: TimingConflictRecord[]
  qaChecks?: StoryTimingQACheckRecord[]
  renderTimingManifest?: RenderTimingManifestRecord
  adjustmentRecommendations?: StoryTimingAdjustmentRecommendationRecord[]
}): StoryTimingQAReportRecord {
  return createStoryTimingQAReportFromChecks({
    masterTimingMap: input.masterTimingMap,
    readinessDecision: input.readinessDecision,
    qaChecks: input.qaChecks ?? [],
    conflicts: input.conflicts,
    renderTimingManifest: input.renderTimingManifest,
    adjustmentRecommendations: input.adjustmentRecommendations,
  })
}

export function createStoryTimingQAReportSummary(
  readinessDecision: StoryTimingReadinessDecision,
  scores: StoryTimingScoreBreakdown,
  conflicts: TimingConflictRecord[] = [],
): string {
  const blockers = conflicts.filter((conflict) => conflict.blocksRender).length
  return `Full Timing QA decision: ${readinessDecision.replaceAll('_', ' ')} with overall score ${scores.overallScore}/100 and ${blockers} render blocker(s).`
}
