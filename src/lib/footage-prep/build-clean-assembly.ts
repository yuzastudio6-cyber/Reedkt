import type {
  CleanAssembly,
  CleanAssemblySegment,
  CleanupPlan,
  CleanupPlanItem,
  CleanupReviewCard,
  SourceTimeMapping,
  TranscriptSegment,
  WorkflowID,
  WorkflowTimeRange,
} from '../../types'
import {
  MOCK_CREATED_AT,
  getMockInputScenario,
  type MockFootagePrepInput,
} from './mock-footage-prep-data'
import { createSourceTimeMapping } from './source-time-mapping'

type BuildMockCleanAssemblyInput = MockFootagePrepInput & {
  footagePrepSessionId: WorkflowID
  cleanupPlan: CleanupPlan
  cleanupPlanItems: CleanupPlanItem[]
  primaryMediaAssetId: WorkflowID
  transcriptSegments?: TranscriptSegment[]
}

function range(startMs: number, endMs: number): WorkflowTimeRange {
  return { startMs, endMs }
}

function messyKeptMappings(projectId: WorkflowID, mediaAssetId: WorkflowID): SourceTimeMapping[] {
  return [
    createSourceTimeMapping({
      id: `${projectId}-source-time-map-kept-001`,
      mediaAssetId,
      rawSourceRange: range(42000, 58000),
      cleanAssemblyRange: range(0, 16000),
      mappingReason: 'kept',
      confidence: 0.94,
    }),
    createSourceTimeMapping({
      id: `${projectId}-source-time-map-kept-002`,
      mediaAssetId,
      rawSourceRange: range(138000, 190000),
      cleanAssemblyRange: range(16000, 68000),
      mappingReason: 'kept',
      confidence: 0.92,
    }),
    createSourceTimeMapping({
      id: `${projectId}-source-time-map-kept-003`,
      mediaAssetId,
      rawSourceRange: range(310000, 382000),
      cleanAssemblyRange: range(68000, 140000),
      mappingReason: 'kept',
      confidence: 0.9,
    }),
    createSourceTimeMapping({
      id: `${projectId}-source-time-map-kept-004`,
      mediaAssetId,
      rawSourceRange: range(580000, 656000),
      cleanAssemblyRange: range(140000, 216000),
      mappingReason: 'trimmed',
      confidence: 0.86,
    }),
    createSourceTimeMapping({
      id: `${projectId}-source-time-map-kept-005`,
      mediaAssetId,
      rawSourceRange: range(704000, 736000),
      cleanAssemblyRange: range(216000, 248000),
      mappingReason: 'kept',
      confidence: 0.93,
    }),
  ]
}

function removedMappings(projectId: WorkflowID, mediaAssetId: WorkflowID): SourceTimeMapping[] {
  return [
    createSourceTimeMapping({
      id: `${projectId}-source-time-map-removed-dead-intro`,
      mediaAssetId,
      rawSourceRange: range(0, 7000),
      mappingReason: 'removed',
      confidence: 0.9,
    }),
    createSourceTimeMapping({
      id: `${projectId}-source-time-map-removed-false-start`,
      mediaAssetId,
      rawSourceRange: range(8000, 17000),
      mappingReason: 'removed',
      confidence: 0.88,
    }),
    createSourceTimeMapping({
      id: `${projectId}-source-time-map-removed-bad-retake`,
      mediaAssetId,
      rawSourceRange: range(18000, 41000),
      mappingReason: 'removed',
      confidence: 0.82,
    }),
    createSourceTimeMapping({
      id: `${projectId}-source-time-map-removed-silence`,
      mediaAssetId,
      rawSourceRange: range(130000, 136000),
      mappingReason: 'removed',
      confidence: 0.91,
    }),
  ]
}

function genericKeptMappings(input: BuildMockCleanAssemblyInput): SourceTimeMapping[] {
  const targetDuration = getMockInputScenario(input) === 'screen_recording' ? 178000 : 156000
  const rawRanges = getMockInputScenario(input) === 'screen_recording'
    ? [range(0, 58000), range(92000, 138000), range(220000, 294000)]
    : [range(24000, 44000), range(68000, 108000), range(132000, 172000), range(250000, 282000)]
  const cleanDurations = getMockInputScenario(input) === 'screen_recording'
    ? [58000, 46000, 74000]
    : [20000, 40000, 40000, 56000]

  let cleanStart = 0
  return rawRanges.map((rawSourceRange, index) => {
    const duration = cleanDurations[index] ?? Math.floor(targetDuration / rawRanges.length)
    const cleanAssemblyRange = range(cleanStart, cleanStart + duration)
    cleanStart += duration
    return createSourceTimeMapping({
      id: `${input.projectId}-source-time-map-kept-${String(index + 1).padStart(3, '0')}`,
      mediaAssetId: input.primaryMediaAssetId,
      rawSourceRange,
      cleanAssemblyRange,
      mappingReason: index === 0 ? 'trimmed' : 'kept',
      confidence: 0.86,
    })
  })
}

function segmentLabel(index: number, scenario = 'messy_talking_head') {
  if (scenario === 'screen_recording') {
    return ['Dashboard proof setup', 'Privacy-safe proof section', 'CTA walkthrough'][index] ?? 'Clean segment'
  }

  if (scenario === 'real_estate') {
    return ['Property hook', 'Kitchen selling point', 'Backyard and pool', 'CTA'][index] ?? 'Clean segment'
  }

  return ['Strong hook', 'Main explanation', 'Emotional story', 'Details and proof', 'CTA'][index] ?? 'Clean segment'
}

export function buildMockCleanAssembly(input: BuildMockCleanAssemblyInput): {
  cleanAssembly: CleanAssembly
  cleanAssemblySegments: CleanAssemblySegment[]
  sourceTimeMappings: SourceTimeMapping[]
  cleanupReviewCard: CleanupReviewCard
} {
  const scenario = getMockInputScenario(input)
  const keptMappings = scenario === 'messy_talking_head'
    ? messyKeptMappings(input.projectId, input.primaryMediaAssetId)
    : genericKeptMappings(input)
  const sourceTimeMappings = [...keptMappings, ...removedMappings(input.projectId, input.primaryMediaAssetId)]
  const durationMs = scenario === 'messy_talking_head' ? 248000 : scenario === 'screen_recording' ? 178000 : 156000

  const cleanAssemblySegments: CleanAssemblySegment[] = keptMappings.map((mapping, index) => ({
    id: `${input.projectId}-clean-assembly-segment-${String(index + 1).padStart(3, '0')}`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    cleanAssemblyId: `${input.projectId}-clean-assembly`,
    mediaAssetId: mapping.mediaAssetId,
    kind: index === 0 ? 'best_take' : index === 3 && scenario === 'messy_talking_head' ? 'tightened_source' : 'kept_source',
    rawSourceRange: mapping.rawSourceRange,
    cleanAssemblyRange: mapping.cleanAssemblyRange ?? range(0, 0),
    label: segmentLabel(index, scenario),
    transcriptText: input.transcriptSegments?.[index]?.text,
    sourceTimeMappingId: mapping.id,
    cleanupPlanItemIds: input.cleanupPlanItems
      .filter((item) => item.sourceRange.startMs <= mapping.rawSourceRange.endMs && item.sourceRange.endMs >= mapping.rawSourceRange.startMs)
      .map((item) => item.id),
    locked: false,
    userRestored: false,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }))

  const cleanAssembly: CleanAssembly = {
    id: `${input.projectId}-clean-assembly`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    footagePrepSessionId: input.footagePrepSessionId,
    cleanupPlanId: input.cleanupPlan.id,
    status: 'ready',
    durationMs,
    segmentIds: cleanAssemblySegments.map((segment) => segment.id),
    sourceTimeMappingIds: sourceTimeMappings.map((mapping) => mapping.id),
    transcriptSegmentIds: input.transcriptSegments?.map((segment) => segment.id),
    summary: 'A non-destructive Clean Assembly is ready with source references and raw-to-clean time mappings.',
    version: 1,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }

  const cleanupReviewCard: CleanupReviewCard = {
    id: `${input.projectId}-cleanup-review-card`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    cleanupPlanId: input.cleanupPlan.id,
    cleanAssemblyId: cleanAssembly.id,
    title: 'Footage Prep summary',
    summary: 'I removed obvious dead space and false starts, selected stronger takes, and preserved the moments most useful for planning.',
    originalDurationMs: input.cleanupPlan.estimatedOriginalDurationMs,
    cleanDurationMs: cleanAssembly.durationMs,
    removedSilenceCount: input.cleanupPlanItems.filter((item) => item.reason === 'silence' && item.action === 'remove').length,
    retakeGroupCount: input.cleanupPlanItems.filter((item) => item.reason === 'retake').length,
    falseStartCount: input.cleanupPlanItems.filter((item) => item.reason === 'false_start').length,
    preservedMomentCount: input.cleanupPlanItems.filter((item) => item.action === 'preserve' || item.action === 'keep').length,
    actions: ['continue_with_ai_plan', 'add_edit_brief', 'add_edit_cues', 'review_cleanup_decisions'],
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }

  return {
    cleanAssembly,
    cleanAssemblySegments,
    sourceTimeMappings,
    cleanupReviewCard,
  }
}
