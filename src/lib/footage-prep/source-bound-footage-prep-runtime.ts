import type {
  AssetAnalysisReport,
  CleanAssembly,
  CleanAssemblySegment,
  CleanupPlan,
  CleanupReviewCard,
  FootagePrepSession,
  PrepSummary,
  SourceTimeMapping,
  SourceUnderstandingMap,
  WorkflowActivityEvent,
  WorkflowProgressSnapshot,
} from '../../types'
import { createWorkflowActivityEvent } from './build-workflow-activity'
import {
  MOCK_CREATED_AT,
  type MockFootagePrepInput,
  type MockFootagePrepSourceMedia,
} from './mock-footage-prep-data'
import type { MockFootagePrepResult } from './mock-footage-prep-runtime'
import { createSourceTimeMapping } from './source-time-mapping'

const SOURCE_BOUND_PREP_AUTHORITY = 'verified-private-upload-media-facts-v1'

function isTimelineSource(source: MockFootagePrepSourceMedia): boolean {
  return source.mediaKind === 'video' ||
    source.mediaKind === 'audio' ||
    source.mediaKind === 'screen_recording'
}

function assertSourceBoundInput(input: MockFootagePrepInput): MockFootagePrepSourceMedia[] {
  if (!input.projectId.trim()) {
    throw new Error('Source-bound footage prep requires an exact project identity.')
  }
  if (!input.sourceMedia.length) {
    throw new Error('Source-bound footage prep requires at least one private source.')
  }
  if (input.sourceMedia.some((source) => source.mockScenario !== undefined)) {
    throw new Error('Source-bound footage prep cannot consume a controlled demo scenario.')
  }

  const timelineSources = input.sourceMedia.filter(isTimelineSource)
  if (!timelineSources.length) {
    throw new Error('Source-bound footage prep requires at least one duration-bearing video or audio source.')
  }

  for (const source of timelineSources) {
    if (
      source.sourceMetadataAuthority !== 'verified_private_upload_probe' ||
      !Number.isFinite(source.durationMs) ||
      source.durationMs <= 0
    ) {
      throw new Error(`Source-bound footage prep requires verified positive media duration for ${source.mediaAssetId}.`)
    }
  }

  return timelineSources
}

function buildSourceBoundActivity(input: {
  cleanAssemblyId: string
  primaryMediaAssetId: string
  projectId: string
  userId?: string
  workspaceId?: string
}): WorkflowActivityEvent[] {
  const common = {
    projectId: input.projectId,
    userId: input.userId,
    workspaceId: input.workspaceId,
  }

  return [
    createWorkflowActivityEvent({
      ...common,
      id: `${input.projectId}-source-bound-activity-upload`,
      type: 'upload_received',
      severity: 'success',
      title: 'Verified private source ready',
      message: 'The private upload and its server-verified media facts are ready for source-order planning.',
      status: 'uploaded',
      progressPercent: 50,
      relatedMediaAssetId: input.primaryMediaAssetId,
    }),
    createWorkflowActivityEvent({
      ...common,
      id: `${input.projectId}-source-bound-activity-assembly`,
      type: 'clean_assembly_created',
      severity: 'success',
      title: 'Source-preserving assembly ready',
      message: 'The assembly preserves verified source order and duration. No transcript, scene, silence, retake, or cleanup analysis was invented.',
      status: 'clean_assembly_ready',
      progressPercent: 100,
      relatedMediaAssetId: input.primaryMediaAssetId,
      relatedCleanAssemblyId: input.cleanAssemblyId,
    }),
  ]
}

/**
 * Builds a truthful local planning bridge from verified private upload facts.
 *
 * This path deliberately preserves every duration-bearing source in confirmed
 * order. It does not claim transcript, scene, silence, retake, face, object, or
 * content analysis and it does not fabricate automatic trim decisions.
 */
export function runSourceBoundFootagePrep(input: MockFootagePrepInput): MockFootagePrepResult {
  const timelineSources = assertSourceBoundInput(input)
  const footagePrepSessionId = `${input.projectId}-source-bound-prep-session`
  const sourceUnderstandingMapId = `${input.projectId}-source-bound-understanding`
  const cleanupPlanId = `${input.projectId}-source-bound-cleanup-plan`
  const cleanAssemblyId = `${input.projectId}-source-bound-clean-assembly`
  const totalDurationMs = timelineSources.reduce((total, source) => total + source.durationMs, 0)

  const assetAnalysisReports: AssetAnalysisReport[] = input.sourceMedia.map((source, index) => ({
    id: `${input.projectId}-source-bound-media-facts-${String(index + 1).padStart(3, '0')}`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    mediaAssetId: source.mediaAssetId,
    mediaKind: source.mediaKind,
    durationMs: source.durationMs > 0 ? source.durationMs : undefined,
    width: source.width,
    height: source.height,
    frameRate: source.frameRate,
    hasAudio: source.hasAudio,
    qualityFlags: [],
    summary: 'Verified container metadata only. Content, transcript, scene, silence, retake, face, object, and quality analysis have not run.',
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }))

  const sourceUnderstandingMap: SourceUnderstandingMap = {
    id: sourceUnderstandingMapId,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    footagePrepSessionId,
    mediaAssetIds: input.sourceMedia.map((source) => source.mediaAssetId),
    transcriptSegmentIds: [],
    sceneSegmentIds: [],
    silenceRegionIds: [],
    retakeGroupIds: [],
    qualityFlagIds: [],
    hookCandidateRanges: [],
    ctaCandidateRanges: [],
    bRollCandidateRanges: [],
    summary: 'Verified private media facts and confirmed source order are ready. Deeper content understanding remains pending approved backend analysis.',
    createdFromModel: SOURCE_BOUND_PREP_AUTHORITY,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }

  const cleanupPlan: CleanupPlan = {
    id: cleanupPlanId,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    footagePrepSessionId,
    sourceUnderstandingMapId,
    status: 'ready',
    itemIds: [],
    summary: 'No automatic cuts were fabricated. The source-preserving assembly keeps every duration-bearing source in confirmed order.',
    estimatedOriginalDurationMs: totalDurationMs,
    estimatedCleanDurationMs: totalDurationMs,
    createdFromModel: SOURCE_BOUND_PREP_AUTHORITY,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }

  let cleanCursorMs = 0
  const sourceTimeMappings: SourceTimeMapping[] = timelineSources.map((source, index) => {
    const cleanStartMs = cleanCursorMs
    cleanCursorMs += source.durationMs
    return createSourceTimeMapping({
      id: `${input.projectId}-source-bound-time-map-${String(index + 1).padStart(3, '0')}`,
      mediaAssetId: source.mediaAssetId,
      rawSourceRange: { startMs: 0, endMs: source.durationMs },
      cleanAssemblyRange: { startMs: cleanStartMs, endMs: cleanCursorMs },
      mappingReason: 'kept',
      confidence: 1,
    })
  })

  const cleanAssemblySegments: CleanAssemblySegment[] = timelineSources.map((source, index) => {
    const mapping = sourceTimeMappings[index]
    if (!mapping?.cleanAssemblyRange) {
      throw new Error(`Source-bound footage prep lost the clean range for ${source.mediaAssetId}.`)
    }
    return {
      id: `${input.projectId}-source-bound-segment-${String(index + 1).padStart(3, '0')}`,
      projectId: input.projectId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      cleanAssemblyId,
      mediaAssetId: source.mediaAssetId,
      kind: 'kept_source',
      rawSourceRange: mapping.rawSourceRange,
      cleanAssemblyRange: mapping.cleanAssemblyRange,
      label: source.label,
      sourceTimeMappingId: mapping.id,
      cleanupPlanItemIds: [],
      locked: false,
      userRestored: false,
      createdAt: MOCK_CREATED_AT,
      updatedAt: MOCK_CREATED_AT,
    }
  })

  const cleanAssembly: CleanAssembly = {
    id: cleanAssemblyId,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    footagePrepSessionId,
    cleanupPlanId,
    status: 'ready',
    durationMs: totalDurationMs,
    segmentIds: cleanAssemblySegments.map((segment) => segment.id),
    sourceTimeMappingIds: sourceTimeMappings.map((mapping) => mapping.id),
    transcriptSegmentIds: [],
    summary: 'A non-destructive source-preserving assembly is ready from exact verified durations and confirmed upload order.',
    version: 1,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }

  const cleanupReviewCard: CleanupReviewCard = {
    id: `${input.projectId}-source-bound-cleanup-review`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    cleanupPlanId,
    cleanAssemblyId,
    title: 'Source-preserving preparation',
    summary: 'No automatic silence, retake, transcript, scene, or cleanup decisions were claimed. Every verified source remains intact for plan review.',
    originalDurationMs: totalDurationMs,
    cleanDurationMs: totalDurationMs,
    removedSilenceCount: 0,
    retakeGroupCount: 0,
    falseStartCount: 0,
    preservedMomentCount: timelineSources.length,
    actions: ['continue_with_ai_plan', 'add_edit_brief', 'add_edit_cues'],
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }

  const prepSummary: PrepSummary = {
    originalDurationMs: totalDurationMs,
    cleanAssemblyDurationMs: totalDurationMs,
    removedSilenceCount: 0,
    retakeGroupCount: 0,
    falseStartCount: 0,
    preservedMomentCount: timelineSources.length,
    qualityIssueCount: 0,
    recommendedNextActions: ['continue_with_ai_plan', 'add_edit_brief', 'add_edit_cues'],
    summaryText: 'Verified source order and duration are ready. No unverified content analysis or cleanup decision was projected.',
  }

  const activityEvents = buildSourceBoundActivity({
    cleanAssemblyId,
    primaryMediaAssetId: timelineSources[0].mediaAssetId,
    projectId: input.projectId,
    userId: input.userId,
    workspaceId: input.workspaceId,
  })
  const latestEvent = activityEvents[activityEvents.length - 1]

  const footagePrepSession: FootagePrepSession = {
    id: footagePrepSessionId,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    status: 'ready_for_brief',
    activeStage: 'clean_assembly_build',
    sourceMediaIds: input.sourceMedia.map((source) => source.mediaAssetId),
    cleanAssemblyId,
    sourceUnderstandingMapId,
    cleanupPlanId,
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
    activeLabel: 'Source-preserving assembly ready',
    progressPercent: 100,
    latestEvent,
    blockingIssueCount: 0,
    warningCount: 0,
    nextRecommendedActions: ['Create edit plan', 'Add Edit Brief'],
  }

  return {
    footagePrepSession,
    assetAnalysisReports,
    transcriptSegments: [],
    sceneSegments: [],
    silenceRegions: [],
    retakeGroups: [],
    sourceQualityFlags: [],
    sourceUnderstandingMap,
    cleanupPlan,
    cleanupPlanItems: [],
    cleanAssembly,
    cleanAssemblySegments,
    sourceTimeMappings,
    cleanupReviewCard,
    prepSummary,
    activityEvents,
    progressSnapshot,
  }
}
