import type {
  AssetAnalysisReport,
  CleanAssembly,
  CleanAssemblySegment,
  CleanupPlan,
  CleanupPlanItem,
  CleanupReviewCard,
  FootagePrepSession,
  PrepSummary,
  RetakeGroup,
  SceneSegment,
  SilenceRegion,
  SourceQualityFlag,
  SourceTimeMapping,
  SourceUnderstandingMap,
  TranscriptSegment,
  WorkflowActivityEvent,
  WorkflowProgressSnapshot,
} from '../../types'
import { buildMockAssetAnalysisReports } from './build-asset-analysis'
import { buildMockCleanAssembly } from './build-clean-assembly'
import { buildMockCleanupPlan } from './build-cleanup-plan'
import {
  buildMockRetakeGroups,
  buildMockSceneSegments,
  buildMockSilenceRegions,
  buildMockSourceUnderstandingMap,
  buildMockTranscriptSegments,
} from './build-source-understanding'
import { createFootagePrepActivityTimeline } from './build-workflow-activity'
import {
  MOCK_CREATED_AT,
  defaultMockFootagePrepInput,
  getPrimaryMockSourceMedia,
  messyTalkingHeadFootageInput,
  realEstateFootagePrepInput,
  screenRecordingFootagePrepInput,
  type MockFootagePrepInput,
  type MockFootagePrepScenario,
} from './mock-footage-prep-data'

export interface MockFootagePrepResult {
  footagePrepSession: FootagePrepSession
  assetAnalysisReports: AssetAnalysisReport[]
  transcriptSegments: TranscriptSegment[]
  sceneSegments: SceneSegment[]
  silenceRegions: SilenceRegion[]
  retakeGroups: RetakeGroup[]
  sourceQualityFlags: SourceQualityFlag[]
  sourceUnderstandingMap: SourceUnderstandingMap
  cleanupPlan: CleanupPlan
  cleanupPlanItems: CleanupPlanItem[]
  cleanAssembly: CleanAssembly
  cleanAssemblySegments: CleanAssemblySegment[]
  sourceTimeMappings: SourceTimeMapping[]
  cleanupReviewCard: CleanupReviewCard
  prepSummary: PrepSummary
  activityEvents: WorkflowActivityEvent[]
  progressSnapshot: WorkflowProgressSnapshot
}

function buildPrepSummary(result: {
  cleanupReviewCard: CleanupReviewCard
  cleanAssembly: CleanAssembly
  cleanupPlanItems: CleanupPlanItem[]
  sourceQualityFlags: SourceQualityFlag[]
}): PrepSummary {
  return {
    originalDurationMs: result.cleanupReviewCard.originalDurationMs,
    cleanAssemblyDurationMs: result.cleanAssembly.durationMs,
    removedSilenceCount: result.cleanupReviewCard.removedSilenceCount,
    retakeGroupCount: result.cleanupReviewCard.retakeGroupCount,
    falseStartCount: result.cleanupReviewCard.falseStartCount,
    preservedMomentCount: result.cleanupReviewCard.preservedMomentCount,
    qualityIssueCount: result.sourceQualityFlags.filter((flag) => flag.severity === 'medium' || flag.severity === 'high' || flag.severity === 'blocking').length,
    recommendedNextActions: ['continue_with_ai_plan', 'add_edit_brief', 'add_edit_cues', 'review_cleanup_decisions'],
    summaryText:
      'Original length was reduced into a non-destructive Clean Assembly. The mock prep keeps best takes, removes obvious dead space, and preserves source timing references.',
  }
}

export function runMockFootagePrep(input: MockFootagePrepInput = defaultMockFootagePrepInput): MockFootagePrepResult {
  const footagePrepSessionId = `${input.projectId}-prep-session`
  const primarySource = getPrimaryMockSourceMedia(input)
  const assetAnalysisReports = buildMockAssetAnalysisReports(input)
  const sourceQualityFlags = assetAnalysisReports.flatMap((report) => report.qualityFlags)
  const transcriptSegments = buildMockTranscriptSegments(input)
  const sceneSegments = buildMockSceneSegments(input)
  const silenceRegions = buildMockSilenceRegions(input)
  const retakeGroups = buildMockRetakeGroups(input)
  const sourceUnderstandingMap = buildMockSourceUnderstandingMap({
    ...input,
    footagePrepSessionId,
    transcriptSegments,
    sceneSegments,
    silenceRegions,
    retakeGroups,
    sourceQualityFlags,
  })
  const { cleanupPlan, cleanupPlanItems } = buildMockCleanupPlan({
    ...input,
    footagePrepSessionId,
    sourceUnderstandingMap,
    transcriptSegments,
    silenceRegions,
    retakeGroups,
    sourceQualityFlags,
  })
  const {
    cleanAssembly,
    cleanAssemblySegments,
    sourceTimeMappings,
    cleanupReviewCard,
  } = buildMockCleanAssembly({
    ...input,
    footagePrepSessionId,
    cleanupPlan,
    cleanupPlanItems,
    primaryMediaAssetId: primarySource.mediaAssetId,
    transcriptSegments,
  })
  const prepSummary = buildPrepSummary({
    cleanupReviewCard,
    cleanAssembly,
    cleanupPlanItems,
    sourceQualityFlags,
  })
  const activityEvents = createFootagePrepActivityTimeline({
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    primaryMediaAssetId: primarySource.mediaAssetId,
    cleanAssemblyId: cleanAssembly.id,
  })
  const latestEvent = activityEvents.find((event) => event.type === 'clean_assembly_created') ?? activityEvents[activityEvents.length - 1]

  const footagePrepSession: FootagePrepSession = {
    id: footagePrepSessionId,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    status: 'ready_for_brief',
    activeStage: 'clean_assembly_build',
    sourceMediaIds: input.sourceMedia.map((source) => source.mediaAssetId),
    cleanAssemblyId: cleanAssembly.id,
    sourceUnderstandingMapId: sourceUnderstandingMap.id,
    cleanupPlanId: cleanupPlan.id,
    progressPercent: 100,
    startedAt: MOCK_CREATED_AT,
    completedAt: MOCK_CREATED_AT,
    retryCount: 0,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }

  const progressSnapshot: WorkflowProgressSnapshot = {
    projectId: input.projectId,
    status: 'clean_assembly_ready',
    activeLabel: 'Clean assembly ready',
    progressPercent: 100,
    latestEvent,
    blockingIssueCount: 0,
    warningCount: sourceQualityFlags.filter((flag) => flag.severity === 'medium' || flag.severity === 'high').length,
    nextRecommendedActions: [
      'Create edit plan',
      'Add Edit Brief',
      'Add Edit Cues',
      'Review cleanup decisions',
    ],
  }

  return {
    footagePrepSession,
    assetAnalysisReports,
    transcriptSegments,
    sceneSegments,
    silenceRegions,
    retakeGroups,
    sourceQualityFlags,
    sourceUnderstandingMap,
    cleanupPlan,
    cleanupPlanItems,
    cleanAssembly,
    cleanAssemblySegments,
    sourceTimeMappings,
    cleanupReviewCard,
    prepSummary,
    activityEvents,
    progressSnapshot,
  }
}

export function runDefaultMockFootagePrep(): MockFootagePrepResult {
  return runMockFootagePrep(defaultMockFootagePrepInput)
}

export function getMockFootagePrepResultForScenario(scenario: MockFootagePrepScenario): MockFootagePrepResult {
  if (scenario === 'real_estate') return runMockFootagePrep(realEstateFootagePrepInput)
  if (scenario === 'screen_recording') return runMockFootagePrep(screenRecordingFootagePrepInput)
  return runMockFootagePrep(messyTalkingHeadFootageInput)
}
