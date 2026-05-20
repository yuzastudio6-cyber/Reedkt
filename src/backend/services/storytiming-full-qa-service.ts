import type {
  FullStoryTimingQANextStep,
  RunFullStoryTimingQARequest,
  RunFullStoryTimingQAResponse,
} from '../contracts/storytiming-contracts'
import type { MockDatabase } from '../mock/mock-database'
import type {
  RenderTimingManifestRecord,
  StoryTimingAdjustmentRecommendationRecord,
  StoryTimingQAReportRecord,
  StoryTimingReadinessDecision,
} from '../../types/storytiming'
import { ok, type ServiceResult } from '../service-result'
import {
  createTimingAdjustmentRecommendations,
  createAdjustmentRecommendationSummary,
} from './storytiming-adjustment-recommendation-service'
import {
  analyzeOverallTimingRhythm,
  createOverallRhythmQACheck,
} from './storytiming-overall-rhythm-service'
import {
  createStoryTimingScoreBreakdown,
  createStoryTimingScoreSummary,
} from './storytiming-qa-scoring-service'
import {
  collectTimingQAIssues,
  createTimingIssueSummary,
} from './storytiming-qa-issue-service'
import {
  determineStoryTimingReadiness,
  determinePreviewReadiness,
  determineRenderReadiness,
} from './storytiming-readiness-service'
import {
  createRenderReadinessQACheck,
  validateRenderTimingReadiness,
} from './storytiming-render-readiness-service'
import {
  createStoryTimingQAReport,
  mergeSpecializedTimingQAResults,
} from './storytiming-qa-report-service'
import { createStoryTimingQAChatSummary } from './storytiming-qa-chat-summary-service'

const nextStepForDecision = (
  decision: StoryTimingReadinessDecision,
  renderTimingManifest?: RenderTimingManifestRecord,
): FullStoryTimingQANextStep => {
  if (!renderTimingManifest) return 'create_render_manifest'
  if (decision === 'ready_for_preview') return 'create_timing_review_ui'
  if (decision === 'ready_with_warnings' || decision === 'requires_user_review') return 'ready_for_timing_review'
  return 'adjust_timing'
}

const qaWarnings = (
  qaReport: StoryTimingQAReportRecord,
  adjustmentRecommendations: StoryTimingAdjustmentRecommendationRecord[],
): string[] => [
  qaReport.blocksRender ? 'Full Timing QA blocked render readiness.' : '',
  qaReport.blocksPreview ? 'Full Timing QA recommends timing adjustment before preview.' : '',
  qaReport.requiresUserReview ? 'Full Timing QA requires user review for timing choices.' : '',
  adjustmentRecommendations.some((recommendation) => recommendation.requiresUserApproval)
    ? 'One or more timing recommendations require user approval.'
    : '',
].filter(Boolean)

export function runFullStoryTimingQA(
  request: RunFullStoryTimingQARequest,
): ServiceResult<RunFullStoryTimingQAResponse> {
  const rhythmAnalysis = analyzeOverallTimingRhythm({
    masterTimingMap: request.masterTimingMap,
    segments: request.segments,
    events: request.events,
    conflicts: request.conflicts,
    videoTone: request.videoTone,
  })
  const rhythmCheck = createOverallRhythmQACheck({
    masterTimingMap: request.masterTimingMap,
    analysis: rhythmAnalysis,
    conflicts: request.conflicts,
  })
  const renderValidation = validateRenderTimingReadiness({
    masterTimingMap: request.masterTimingMap,
    renderTimingManifest: request.renderTimingManifest,
    conflicts: request.conflicts,
    events: request.events,
    requireApprovedMap: false,
  })
  const renderReadinessCheck = createRenderReadinessQACheck({
    masterTimingMap: request.masterTimingMap,
    validation: renderValidation,
    renderTimingManifest: request.renderTimingManifest,
  })
  const qaChecks = mergeSpecializedTimingQAResults(
    request.qaChecks ?? [],
    [rhythmCheck, renderReadinessCheck],
  )
  const conflicts = request.conflicts ?? []
  const scores = createStoryTimingScoreBreakdown({
    conflicts,
    qaChecks,
    renderTimingManifest: request.renderTimingManifest,
  })
  const readinessDecision = determineStoryTimingReadiness({
    conflicts,
    qaChecks,
    overallScore: scores.overallScore,
    renderTimingManifest: request.renderTimingManifest,
  })
  const adjustmentRecommendations = createTimingAdjustmentRecommendations({
    masterTimingMap: request.masterTimingMap,
    conflicts,
    qaChecks,
  })
  const issues = collectTimingQAIssues(conflicts, qaChecks)
  const qaReport = createStoryTimingQAReport({
    masterTimingMap: request.masterTimingMap,
    readinessDecision,
    scores,
    conflicts,
    qaChecks,
    adjustmentRecommendations,
    summary: [
      createStoryTimingScoreSummary(scores),
      createTimingIssueSummary(issues),
    ].join(' '),
  })
  const chatSummary = createStoryTimingQAChatSummary({
    qaReport,
    qaChecks,
    conflicts,
    adjustmentRecommendations,
  })
  const warnings = qaWarnings(qaReport, adjustmentRecommendations)

  return ok({
    qaReport,
    qaChecks,
    conflicts,
    adjustmentRecommendations,
    readinessDecision,
    chatSummary,
    nextStep: nextStepForDecision(readinessDecision, request.renderTimingManifest),
    warnings,
  }, warnings)
}

export function runFullStoryTimingQAFromMap(
  request: RunFullStoryTimingQARequest,
): ServiceResult<RunFullStoryTimingQAResponse> {
  return runFullStoryTimingQA(request)
}

export function runFullStoryTimingQAFromMockDatabase(input: {
  db: MockDatabase
  masterTimingMapId: string
}): ServiceResult<RunFullStoryTimingQAResponse> {
  const masterTimingMap = input.db.masterTimingMaps.find((map) => map.id === input.masterTimingMapId)

  if (!masterTimingMap) {
    return ok({
      qaReport: createMissingMapQAReport(input.masterTimingMapId),
      qaChecks: [],
      conflicts: [],
      adjustmentRecommendations: [],
      readinessDecision: 'blocked_for_render',
      chatSummary: [`Master timing map ${input.masterTimingMapId} was not found for full Timing QA.`],
      nextStep: 'adjust_timing',
      warnings: [`Master timing map ${input.masterTimingMapId} was not found.`],
    }, [`Master timing map ${input.masterTimingMapId} was not found.`])
  }

  return runFullStoryTimingQA({
    masterTimingMap,
    segments: input.db.storyTimingSegments.filter((segment) => segment.masterTimingMapId === masterTimingMap.id),
    anchors: input.db.timingAnchors.filter((anchor) => anchor.masterTimingMapId === masterTimingMap.id),
    events: input.db.timingEvents.filter((event) => event.masterTimingMapId === masterTimingMap.id),
    dependencies: input.db.timingDependencies.filter((dependency) => dependency.masterTimingMapId === masterTimingMap.id),
    conflicts: input.db.timingConflicts.filter((conflict) => conflict.masterTimingMapId === masterTimingMap.id),
    captionTimingPlans: input.db.captionTimingPlans.filter((plan) => plan.masterTimingMapId === masterTimingMap.id),
    cutTimingPlans: input.db.cutTimingPlans.filter((plan) => plan.masterTimingMapId === masterTimingMap.id),
    beatGrids: input.db.musicBeatGrids.filter((grid) => grid.masterTimingMapId === masterTimingMap.id),
    duckingPlans: input.db.musicDuckingTimingPlans.filter((plan) => plan.masterTimingMapId === masterTimingMap.id),
    signatureTimingPlans: input.db.signatureTimingPlans.filter((plan) => plan.masterTimingMapId === masterTimingMap.id),
    renderTimingManifest: input.db.renderTimingManifests.find((manifest) => manifest.masterTimingMapId === masterTimingMap.id),
    qaChecks: input.db.storyTimingQAChecks.filter((check) => check.masterTimingMapId === masterTimingMap.id),
  })
}

function createMissingMapQAReport(masterTimingMapId: string): StoryTimingQAReportRecord {
  return {
    id: `missing-storytiming-qa-report-${masterTimingMapId}`,
    masterTimingMapId,
    projectId: 'unknown',
    editPlanId: 'unknown',
    readinessDecision: 'blocked_for_render',
    overallScore: 0,
    captionCutScore: 0,
    musicSfxScore: 0,
    signatureTimingScore: 0,
    overlaySafetyScore: 0,
    emotionalTimingScore: 0,
    overallRhythmScore: 0,
    renderManifestScore: 0,
    conflictIds: [],
    qaCheckIds: [],
    recommendedActions: ['manual_review'],
    blocksPreview: true,
    blocksRender: true,
    requiresUserReview: true,
    summary: `Master timing map ${masterTimingMapId} is missing.`,
    createdAt: new Date(0).toISOString(),
    metadata: { mockOnly: true },
  }
}

export function createFullStoryTimingQASummary(output: RunFullStoryTimingQAResponse): string {
  const preview = determinePreviewReadiness(output.readinessDecision) ? 'preview allowed' : 'preview blocked'
  const render = determineRenderReadiness(output.readinessDecision) ? 'render allowed' : 'render blocked'

  return `${output.qaReport.summary} ${createAdjustmentRecommendationSummary(output.adjustmentRecommendations)} ${preview}; ${render}.`
}
