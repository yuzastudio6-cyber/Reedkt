import type { ApprovedPlanSnapshotPayload } from '../../src/backend/cloud/approved-plan-snapshot-contracts'
import type { TimelineManifest } from '../../src/backend/contracts/timeline-manifest-contracts'
import type { ProductionWorkerType } from '../../src/backend/contracts/production-tool-runtime-contracts'
import { getProductionToolProfile } from '../tool-registry'
import type { ProductionRegistryWorkerType } from '../tool-registry'
import type {
  EditAssetManifestItem,
  EditingAgentExecutionPlan,
  EditWorkItem,
  EditWorkItemType,
  EditingAgentLayer,
} from '../../src/types/editing-agent-runtime'
import type {
  AutonomousEditOperationId,
  AutonomousEditPlanDraft,
  CreativeSkillKey,
} from '../../src/types'
import type { JSONObject, JSONValue } from '../../src/types/shared'
import type { CaptionStylePresetId } from '../workers/captions/caption-worker-types'
import type { TranscriptSegment, TranscriptWord } from '../workers/speech'
import type { ApprovedLocalEditPlanRecord } from './project-edit-plan-service'
import { ApiError } from '../errors/api-error'

export interface AutonomousEditToolRoute {
  routeId: string
  operationId: AutonomousEditOperationId
  workerType: ProductionWorkerType
  toolIds: string[]
  toolSteps: Array<{
    toolId: string
    workerType: ProductionRegistryWorkerType
    executionMode: string
    executableInWorker: boolean
  }>
  skillKeys: CreativeSkillKey[]
  segmentIds: string[]
  requiredQaChecks: string[]
  settings: Record<string, unknown>
}

export interface AutonomousCaptionExecutionDirection {
  enabled: boolean
  stylePresetId: CaptionStylePresetId
  placement: 'bottom_safe' | 'middle_safe' | 'top_safe' | 'lower_third' | 'side_panel'
  keywordEmphasis: boolean
  animationRequested: boolean
  sourceDirections: string[]
}

export interface AutonomousEditExecutionCompilation {
  plan: AutonomousEditPlanDraft
  approvedSnapshotPayload: ApprovedPlanSnapshotPayload
  timelineManifest: TimelineManifest
  editingAgentExecutionPlan: EditingAgentExecutionPlan
  toolRoutes: AutonomousEditToolRoute[]
  timelineTranscriptSegments: TranscriptSegment[]
  captionDirection: AutonomousCaptionExecutionDirection
  warnings: string[]
}

export function compileAutonomousEditExecution(input: {
  approvedLocalPlan: ApprovedLocalEditPlanRecord
  approvedSnapshotId: string
  creditApprovalId: string
  creditReservationId: string
  transcriptSegments: TranscriptSegment[]
  sourceStorageObjectPath: string
  fps: number
}): AutonomousEditExecutionCompilation {
  const plan = input.approvedLocalPlan.approvedLocalPlan.autonomousPlanSnapshot
  if (!plan || plan.status !== 'ready_for_approval') {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Execution requires the canonical autonomous plan snapshot.', 409)
  }
  if (!input.approvedLocalPlan.approvedLocalPlan.planningEvidence) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Execution requires source-analysis lineage.', 409)
  }
  if (!Number.isFinite(input.fps) || input.fps <= 0) {
    throw new ApiError('VALIDATION_FAILED', 'Execution requires a valid source frame rate.', 400)
  }

  const timeline = buildTimeline({
    plan,
    approvedLocalPlan: input.approvedLocalPlan,
    approvedSnapshotId: input.approvedSnapshotId,
    sourceStorageObjectPath: input.sourceStorageObjectPath,
    fps: input.fps,
  })
  const timelineTranscriptSegments = remapTranscriptToTimeline({
    plan,
    transcriptSegments: input.transcriptSegments,
  })
  const captionDirection = resolveCaptionDirection(plan)
  const toolRoutes = buildToolRoutes(plan, captionDirection)
  const editingAgentExecutionPlan = buildExecutionGraph({
    plan,
    approvedSnapshotId: input.approvedSnapshotId,
    source: input.approvedLocalPlan.source,
    toolRoutes,
    captionDirection,
  })
  const approvedSnapshotPayload = buildApprovedSnapshotPayload({
    plan,
    approvedLocalPlan: input.approvedLocalPlan,
    creditApprovalId: input.creditApprovalId,
    creditReservationId: input.creditReservationId,
    toolRoutes,
    captionDirection,
  })
  return {
    plan,
    approvedSnapshotPayload,
    timelineManifest: timeline,
    editingAgentExecutionPlan,
    toolRoutes,
    timelineTranscriptSegments,
    captionDirection,
    warnings: [
      'Execution compilation uses the canonical autonomous plan and private transcript evidence; no fixture-specific timeline or caption text is present.',
      'Tool names are execution metadata only and must not be shown in normal user-facing progress copy.',
    ],
  }
}

export function buildApprovedSnapshotPayload(input: {
  plan: AutonomousEditPlanDraft
  approvedLocalPlan: ApprovedLocalEditPlanRecord
  creditApprovalId: string
  creditReservationId: string
  toolRoutes: AutonomousEditToolRoute[]
  captionDirection: AutonomousCaptionExecutionDirection
}): ApprovedPlanSnapshotPayload {
  const { plan } = input
  return {
    compiledIntent: asJsonValue({
      userIntentSummary: plan.userIntentSummary,
      storyStrategy: plan.storyStrategy,
      outputFrame: plan.outputFrame,
    }),
    confirmedSettings: asJsonObject({
      outputFrame: plan.outputFrame,
      captionDirection: input.captionDirection,
      sourceOrderPolicy: plan.sourceOrderPolicy,
    }),
    sourceOrder: plan.segments.map((segment, order) => asJsonValue({
      order,
      segmentId: segment.id,
      sourceStartSeconds: segment.sourceStartSeconds,
      sourceEndSeconds: segment.sourceEndSeconds,
      narrativeReason: segment.narrativeReason,
    })),
    professionalEditingDirective: asJsonValue({
      title: plan.title,
      summary: plan.summary,
      professionalBaseline: 'clean_professional',
      preserveMeaning: true,
      noRandomCreativeChoices: true,
    }),
    segmentOperations: plan.segments.map(asJsonValue),
    visualAssetPlan: asJsonValue(plan.segments.flatMap((segment) => segment.operations
      .filter((operation) => operation.operationId.startsWith('graphics.') || operation.operationId.startsWith('broll.'))
      .map((operation) => ({
        segmentId: segment.id,
        operationId: operation.operationId,
        instruction: operation.instruction,
        rationale: operation.rationale,
        sourceEvidenceRefs: operation.sourceEvidenceRefs,
      })))),
    rendererPlan: asJsonValue({
      outputFrame: plan.outputFrame,
      renderOperations: plan.segments.flatMap((segment) => segment.operations
        .filter((operation) => operation.operationId === 'render.compose' || operation.operationId === 'graphics.animate')
        .map((operation) => ({ segmentId: segment.id, ...operation }))),
      privateReviewOnly: true,
    }),
    qaPlan: asJsonValue({
      globalQaChecks: plan.globalQaChecks,
      segmentQaChecks: plan.segments.map((segment) => ({ segmentId: segment.id, checks: segment.requiredQaChecks })),
      finalRenderRequiresAllBlockingQa: true,
    }),
    providerRouting: asJsonValue({
      planningSource: plan.runtime.plannerSource,
      sourceVisualUnderstandingCompleted: plan.runtime.visualUnderstandingRun,
      generatedAssetProviderCallsApproved: false,
      rawPromptExecutionAllowed: false,
    }),
    modelTierPolicy: asJsonValue({
      planningModel: 'qwen_reasoning_owner_configured',
      visualUnderstandingModel: 'Qwen/Qwen2.5-VL-7B-Instruct',
      visualUnderstandingRevision: 'cc594898137f460bfe9f0759e9844b3ce807cfb5',
    }),
    fallbackPolicy: asJsonValue({
      preserveMeaning: true,
      noUnapprovedScopeChange: true,
      requiredFailureNeedsUserReview: true,
      finalRenderBlockedOnMissingRequiredAsset: true,
    }),
    creditEstimate: asJsonValue(input.approvedLocalPlan.approvedLocalPlan.creditEstimate),
    approvalRecord: asJsonValue({
      approvedLocalPlanRecordId: input.approvedLocalPlan.id,
      approvedByUserId: input.approvedLocalPlan.approvedByUserId,
      approvedAt: input.approvedLocalPlan.approvedAt,
      creditApprovalId: input.creditApprovalId,
      creditReservationId: input.creditReservationId,
    }),
    audioPolicy: asJsonValue({
      speechClarityFirst: true,
      segmentDirections: plan.segments.map((segment) => ({ segmentId: segment.id, direction: segment.audioDirection })),
    }),
    renderPolicy: asJsonValue({
      privateArtifactsOnly: true,
      publicDeliveryAllowed: false,
      signedUrlsAsSourceTruth: false,
    }),
  }
}

function buildTimeline(input: {
  plan: AutonomousEditPlanDraft
  approvedLocalPlan: ApprovedLocalEditPlanRecord
  approvedSnapshotId: string
  sourceStorageObjectPath: string
  fps: number
}): TimelineManifest {
  let cursor = 0
  const clips = input.plan.segments.map((segment) => {
    const duration = segment.sourceEndSeconds - segment.sourceStartSeconds
    const timelineStart = cursor
    const timelineEnd = cursor + duration
    cursor = timelineEnd
    return {
      id: `clip-${safeId(segment.id)}`,
      sourceMediaAssetId: input.approvedLocalPlan.source.mediaAssetId ?? input.approvedLocalPlan.source.storageObjectRecordId,
      sourceRange: {
        startSeconds: round(segment.sourceStartSeconds),
        endSeconds: round(segment.sourceEndSeconds),
        startFrame: Math.round(segment.sourceStartSeconds * input.fps),
        endFrame: Math.round(segment.sourceEndSeconds * input.fps),
      },
      timelineRange: {
        startSeconds: round(timelineStart),
        endSeconds: round(timelineEnd),
        startFrame: Math.round(timelineStart * input.fps),
        endFrame: Math.round(timelineEnd * input.fps),
      },
      trackId: 'primary-video',
      metadata: {
        segmentId: segment.id,
        role: segment.role,
        objective: segment.objective,
        narrativeReason: segment.narrativeReason,
        sourceEvidenceRefs: unique(segment.operations.flatMap((operation) => operation.sourceEvidenceRefs)),
        sourceMeaningPreserved: true,
      },
    }
  })
  const colorDirections = input.plan.segments.flatMap((segment) => segment.operations
    .filter((operation) => operation.operationId === 'color.correct' || operation.operationId === 'color.grade')
    .map((operation) => ({ segmentId: segment.id, operation })))
  return {
    id: `timeline-${safeId(input.approvedSnapshotId)}`,
    workspaceId: input.approvedLocalPlan.workspaceId,
    projectId: input.approvedLocalPlan.projectId,
    editPlanId: input.approvedLocalPlan.editPlanId,
    approvedSnapshotId: input.approvedSnapshotId,
    mediaAssetId: input.approvedLocalPlan.source.mediaAssetId ?? input.approvedLocalPlan.source.storageObjectRecordId,
    version: 'autonomous-source-aware-timeline-v1',
    timelineFormat: 'reeditpro_timeline',
    durationSeconds: round(cursor),
    clips,
    audioLayers: [],
    captionLayers: [],
    overlayLayers: [],
    maskLayers: [],
    colorOperations: colorDirections.map(({ segmentId, operation }, index) => ({
      id: `color-${index + 1}-${safeId(segmentId)}`,
      targetClipId: `clip-${safeId(segmentId)}`,
      operationType: operation.operationId,
      settings: {
        instruction: operation.instruction,
        rationale: operation.rationale,
        evidenceRefs: operation.sourceEvidenceRefs,
      },
    })),
    renderNotes: [
      input.plan.storyStrategy,
      ...input.plan.segments.map((segment) => `${segment.id}: ${segment.visualDirection}`),
    ],
    sourceReferences: [{
      storageBucketPurpose: 'source_media',
      storageObjectPath: input.sourceStorageObjectPath,
      sourceOfTruth: true,
    }],
    createdAt: input.approvedLocalPlan.approvedAt,
  }
}

function remapTranscriptToTimeline(input: {
  plan: AutonomousEditPlanDraft
  transcriptSegments: TranscriptSegment[]
}): TranscriptSegment[] {
  const remapped: TranscriptSegment[] = []
  let timelineCursor = 0
  for (const planSegment of input.plan.segments) {
    const sourceStart = planSegment.sourceStartSeconds
    const sourceEnd = planSegment.sourceEndSeconds
    const matching = input.transcriptSegments.filter((segment) =>
      segment.endSeconds > sourceStart && segment.startSeconds < sourceEnd,
    )
    for (const transcript of matching) {
      const words = transcript.words
        .filter((word) => word.endSeconds > sourceStart && word.startSeconds < sourceEnd)
        .map((word): TranscriptWord => ({
          ...word,
          segmentId: `timeline-${safeId(planSegment.id)}-${safeId(transcript.segmentId)}`,
          startSeconds: round(timelineCursor + Math.max(0, word.startSeconds - sourceStart)),
          endSeconds: round(timelineCursor + Math.min(sourceEnd - sourceStart, word.endSeconds - sourceStart)),
          word: word.word.trim(),
          confidence: word.confidence,
        }))
        .filter((word) => word.word && word.endSeconds > word.startSeconds)

      const segmentStart = round(timelineCursor + Math.max(0, transcript.startSeconds - sourceStart))
      const segmentEnd = round(timelineCursor + Math.min(sourceEnd - sourceStart, transcript.endSeconds - sourceStart))
      if (segmentEnd <= segmentStart) continue
      const text = words.length > 0
        ? words.map((word) => word.word).join(' ').replace(/\s+/g, ' ').trim()
        : transcript.text.trim()
      if (!text) continue
      remapped.push({
        segmentId: `timeline-${safeId(planSegment.id)}-${safeId(transcript.segmentId)}`,
        startSeconds: segmentStart,
        endSeconds: segmentEnd,
        text,
        words,
        confidence: transcript.confidence,
      })
    }
    timelineCursor += sourceEnd - sourceStart
  }
  return remapped
}

function resolveCaptionDirection(plan: AutonomousEditPlanDraft): AutonomousCaptionExecutionDirection {
  const skillKeys = new Set(plan.skillSelections.map((selection) => selection.skillKey))
  const sourceDirections = unique(plan.segments.map((segment) => segment.captionDirection))
  const text = sourceDirections.join(' ').toLowerCase()
  const enabled = !skillKeys.has('no_captions') && plan.segments.some((segment) =>
    segment.operations.some((operation) => operation.operationId.startsWith('caption.')),
  )
  const keywordEmphasis = skillKeys.has('caption_keyword_emphasis') || /keyword|emphasis|highlight/.test(text)
  const animationRequested = skillKeys.has('caption_animation') || /kinetic|animate|word.by.word/.test(text)
  let stylePresetId: CaptionStylePresetId = 'clean_subtitle'
  if (skillKeys.has('caption_accessibility_planning')) stylePresetId = 'minimal_accessibility_captions'
  else if (/documentary|restrained lower.third/.test(text)) stylePresetId = 'documentary_lower_third'
  else if (/sentence|education|explain/.test(text)) stylePresetId = 'sentence_block_captions'
  else if (animationRequested && /word.by.word|karaoke/.test(text)) stylePresetId = 'karaoke_word_by_word'
  else if (keywordEmphasis) stylePresetId = 'keyword_emphasis_captions'
  else if (['instagram_reel', 'youtube_shorts', 'tiktok_reel'].includes(plan.outputFrame.platformTarget)) {
    stylePresetId = 'bold_social_captions'
  }
  const placement = sourceDirections.some((direction) => /top/.test(direction.toLowerCase()))
    ? 'top_safe'
    : stylePresetId === 'documentary_lower_third'
      ? 'lower_third'
      : stylePresetId === 'bold_social_captions' || stylePresetId === 'keyword_emphasis_captions'
        ? 'middle_safe'
        : 'bottom_safe'
  return { enabled, stylePresetId, placement, keywordEmphasis, animationRequested, sourceDirections }
}

function buildToolRoutes(
  plan: AutonomousEditPlanDraft,
  captionDirection: AutonomousCaptionExecutionDirection,
): AutonomousEditToolRoute[] {
  const byOperation = new Map<AutonomousEditOperationId, {
    skills: CreativeSkillKey[]
    segmentIds: string[]
    qa: string[]
  }>()
  for (const segment of plan.segments) {
    for (const operation of segment.operations) {
      const current = byOperation.get(operation.operationId) ?? { skills: [], segmentIds: [], qa: [] }
      current.skills.push(...operation.skillKeys)
      current.segmentIds.push(segment.id)
      current.qa.push(...operation.requiredQaChecks, ...segment.requiredQaChecks)
      byOperation.set(operation.operationId, current)
    }
  }
  return [...byOperation.entries()].map(([operationId, value]) => {
    const toolIds = toolsForOperation(operationId, value.skills)
    return {
      routeId: `tool-route-${safeId(operationId)}`,
      operationId,
      workerType: workerTypeForOperation(operationId),
      toolIds,
      toolSteps: toolIds.map((toolId) => {
        const profile = getProductionToolProfile(toolId)
        if (!profile) throw new ApiError('VALIDATION_FAILED', `Autonomous tool route references unknown production tool ${toolId}.`, 500)
        if (profile.productionStatus === 'blocked' || profile.productionStatus === 'evaluation_only') {
          throw new ApiError('VALIDATION_FAILED', `Autonomous tool route cannot select ${toolId} while its production status is ${profile.productionStatus}.`, 409)
        }
        return {
          toolId,
          workerType: profile.workerType,
          executionMode: profile.executionMode,
          executableInWorker: profile.workerType !== 'planning_only' && profile.workerType !== 'frontend_preview_only',
        }
      }),
      skillKeys: unique(value.skills),
      segmentIds: unique(value.segmentIds),
      requiredQaChecks: unique(value.qa),
      settings: operationId.startsWith('caption.') ? { ...captionDirection } : {},
    }
  })
}

function toolsForOperation(operationId: AutonomousEditOperationId, skills: CreativeSkillKey[]): string[] {
  const skillSet = new Set(skills)
  if (operationId.startsWith('timeline.')) return ['ffmpeg', 'ffprobe', 'opentimelineio']
  if (operationId.startsWith('caption.')) return ['faster_whisper', 'libass', 'ffmpeg']
  if (operationId === 'graphics.compose') {
    if (skillSet.has('framework_diagram_design')) return ['d3', 'svg_js', 'viz_js', 'satori']
    if (skillSet.has('comparison_layout_design') || skillSet.has('proof_card_design')) return ['vega_lite', 'echarts', 'satori', 'svg_js']
    return ['satori', 'svg_js', 'remotion']
  }
  if (operationId === 'graphics.animate') {
    if ([...skillSet].some((skill) => skill.startsWith('three_d_'))) return ['three_js', 'babylon_js', 'remotion']
    return ['remotion', 'lottie', 'animejs']
  }
  if (operationId.startsWith('broll.')) return ['ffmpeg', 'opencv', 'remotion']
  if (operationId === 'audio.cleanup') return ['ffmpeg', 'librosa']
  if (operationId === 'audio.loudness.normalize') return ['ffmpeg', 'librosa']
  if (operationId === 'audio.music.plan' || operationId === 'audio.sfx.plan') return ['librosa', 'audioflux']
  if (operationId.startsWith('color.')) return ['ffmpeg', 'opencolorio', 'openimageio']
  if (operationId === 'transition.apply') return ['ffmpeg', 'remotion']
  if (operationId === 'render.compose') return ['remotion', 'ffmpeg', 'libass']
  return ['ffprobe', 'opencv']
}

function workerTypeForOperation(operationId: AutonomousEditOperationId): ProductionWorkerType {
  if (operationId === 'render.compose' || operationId === 'graphics.animate') return 'render_worker'
  if (operationId === 'qa.validate') return 'qa_worker'
  if (operationId === 'broll.generate') return 'gpu_ai_worker'
  return 'cpu_analysis_worker'
}

function buildExecutionGraph(input: {
  plan: AutonomousEditPlanDraft
  approvedSnapshotId: string
  source: ApprovedLocalEditPlanRecord['source']
  toolRoutes: AutonomousEditToolRoute[]
  captionDirection: AutonomousCaptionExecutionDirection
}): EditingAgentExecutionPlan {
  const validateId = 'work-validate-approved-snapshot'
  const operationItems = input.toolRoutes.map((route) => createWorkItem({
    id: `work-${safeId(route.operationId)}`,
    type: workItemTypeForOperation(route.operationId),
    layer: agentLayerForOperation(route.operationId),
    label: humanWorkLabel(route.operationId),
    purpose: `Execute the approved ${route.operationId.replace(/\./g, ' ')} direction for its linked source-aware segments.`,
    approvedSnapshotId: input.approvedSnapshotId,
    segmentIds: route.segmentIds,
    qaChecks: route.requiredQaChecks,
    dependencies: [{
      id: `${route.routeId}-snapshot`,
      dependencyType: 'blocks_start',
      dependsOnWorkItemId: validateId,
      reason: 'Approved snapshot validation must pass before execution.',
      blocking: true,
    }],
    notes: [`Backend route ${route.routeId} owns the developer-visible tool selection.`],
  }))
  const nonRenderIds = operationItems
    .filter((item) => item.workItemType !== 'render_remotion_preview' && item.workItemType !== 'render_final_export' && item.workItemType !== 'run_final_qa')
    .map((item) => item.id)
  const renderItems = operationItems.map((item) => {
    if (item.workItemType !== 'render_remotion_preview' && item.workItemType !== 'render_final_export') return item
    return {
      ...item,
      dependencies: [
        ...item.dependencies,
        ...nonRenderIds.map((id) => ({
          id: `${item.id}-after-${id}`,
          dependencyType: 'blocks_start' as const,
          dependsOnWorkItemId: id,
          reason: 'All required edit operations must complete before composition.',
          blocking: true,
        })),
      ],
    }
  })
  const workItems: EditWorkItem[] = [
    createWorkItem({
      id: validateId,
      type: 'validate_approved_snapshot',
      layer: 'editing_supervisor_agent',
      label: 'Validate the approved edit',
      purpose: 'Verify immutable plan, estimate, reservation, source, and private artifact lineage.',
      approvedSnapshotId: input.approvedSnapshotId,
      segmentIds: input.plan.segments.map((segment) => segment.id),
      qaChecks: ['snapshot_hash_matches', 'credit_reservation_matches', 'source_evidence_matches'],
      dependencies: [],
    }),
    ...renderItems,
  ]
  const finalQaIds = workItems.filter((item) => item.workItemType === 'run_final_qa').map((item) => item.id)
  const assetManifest: EditAssetManifestItem[] = [{
    id: input.source.storageObjectRecordId,
    label: 'Private source video',
    lifecycleStatus: 'ready',
    assetType: 'source_video',
    storageProvider: 'local_private',
    storageBucket: input.source.bucketName,
    storagePath: input.source.objectPath,
    linkedSegmentIds: input.plan.segments.map((segment) => segment.id),
    linkedVisualAssetPlanItemIds: [],
    linkedTimingCueIds: [],
    linkedRendererLayerIds: [],
    version: 1,
    qaStatus: 'passed',
    qaNotes: ['Canonical upload and source-analysis lineage verified before approval.'],
    metadata: { checksumSha256: input.source.checksumSha256 ?? '', private: true },
    notes: ['Private source of truth.'],
  }, ...workItems.flatMap((item) => item.expectedOutputs
    .filter((output) => output.outputType !== 'none' && output.outputType !== 'status_update')
    .map((output): EditAssetManifestItem => ({
      id: `asset-${output.id}`,
      label: item.label,
      lifecycleStatus: 'planned',
      assetType: outputTypeToAssetType(output.outputType),
      storageProvider: 'local_private',
      parentWorkItemId: item.id,
      linkedSegmentIds: item.linkedSegmentIds,
      linkedVisualAssetPlanItemIds: [],
      linkedTimingCueIds: [],
      linkedRendererLayerIds: [],
      version: 1,
      qaStatus: 'not_checked',
      qaNotes: item.qaChecks,
      metadata: { private: true },
      notes: ['Created only when the approved work item executes successfully.'],
    }))) ]
  return {
    id: `execution-graph-${safeId(input.approvedSnapshotId)}`,
    runMode: 'bounded_private_execution',
    summary: input.plan.summary,
    approvedPlanSnapshotId: input.approvedSnapshotId,
    planningModelLabel: 'Qwen owner-configured planning runtime',
    editingSupervisorModelLabel: 'Deterministic approved-snapshot supervisor',
    workItems,
    assetManifest,
    checkpoints: [{
      id: 'checkpoint-approved',
      label: 'Approved edit ready',
      completedWorkItemIds: [],
      pendingWorkItemIds: workItems.map((item) => item.id),
      blockedWorkItemIds: [],
      readyToMergeAssetIds: [input.source.storageObjectRecordId],
      currentFocus: 'Validate the approved snapshot, then execute independent private work items.',
      nextActions: ['Validate snapshot', 'Begin source-safe edit operations'],
      notes: ['Normal user progress copy must summarize work without package names.'],
    }],
    parallelGroups: [{
      id: 'parallel-approved-edit-work',
      label: 'Independent approved edit preparation',
      workItemIds: nonRenderIds,
      reason: 'Independent caption, audio, visual, and color work may run after snapshot validation.',
    }],
    blockingWorkItemIds: [],
    readyWorkItemIds: [validateId],
    waitingWorkItemIds: workItems.filter((item) => item.id !== validateId).map((item) => item.id),
    qaWorkItemIds: finalQaIds,
    globalRules: [
      'Execute only the immutable approved snapshot.',
      'Keep all source and output artifacts private.',
      'Do not improvise outside approved operations and fallbacks.',
      'Block final render on unresolved required failures or QA.',
    ],
    limitations: [
      'Public delivery and paid production are not enabled by this private execution graph.',
    ],
    notes: [
      `Caption execution is ${input.captionDirection.enabled ? 'enabled' : 'disabled'} by the approved plan.`,
      'Developer-visible tool routes are stored separately from user-facing activity labels.',
    ],
  }
}

function createWorkItem(input: {
  id: string
  type: EditWorkItemType
  layer: EditingAgentLayer
  label: string
  purpose: string
  approvedSnapshotId: string
  segmentIds: string[]
  qaChecks: string[]
  dependencies: EditWorkItem['dependencies']
  notes?: string[]
}): EditWorkItem {
  return {
    id: input.id,
    workItemType: input.type,
    agentLayer: input.layer,
    status: input.type === 'run_final_qa' || input.type === 'render_final_export' ? 'blocked' : 'ready',
    label: input.label,
    purpose: input.purpose,
    approvedPlanSnapshotId: input.approvedSnapshotId,
    idempotencyKey: `idem-${safeId(input.approvedSnapshotId)}-${safeId(input.id)}`,
    priority: input.type === 'validate_approved_snapshot' || input.type === 'run_final_qa' ? 'critical' : 'high',
    canRunInParallel: input.type !== 'validate_approved_snapshot' && !input.type.startsWith('render_'),
    dependencies: input.dependencies,
    expectedOutputs: [{
      id: `${input.id}-output`,
      outputType: expectedOutputType(input.type),
      notes: ['Private approved-plan output only.'],
    }],
    linkedSegmentIds: input.segmentIds,
    linkedVisualAssetPlanItemIds: [],
    linkedTimingCueIds: [],
    linkedProviderPromptPlanIds: [],
    linkedToolStrategyItemIds: [],
    linkedRendererLayerIds: [],
    retryCount: 0,
    maxRetries: 1,
    fallbackPolicy: ['Use only an approved fallback that preserves meaning and scope; otherwise request review.'],
    checkbackPolicy: ['Persist structured status and resume from the work graph, never model memory.'],
    qaChecks: unique(input.qaChecks),
    notes: input.notes ?? [],
  }
}

function workItemTypeForOperation(operationId: AutonomousEditOperationId): EditWorkItemType {
  if (operationId.startsWith('timeline.')) return 'prepare_source_trim'
  if (operationId.startsWith('caption.')) return 'prepare_caption_timing'
  if (operationId.startsWith('graphics.') || operationId.startsWith('broll.')) return 'prepare_remotion_layer'
  if (operationId.startsWith('audio.')) return 'run_audio_analysis'
  if (operationId.startsWith('color.')) return 'process_video_asset'
  if (operationId === 'transition.apply') return 'prepare_remotion_layer'
  if (operationId === 'render.compose') return 'render_final_export'
  return 'run_final_qa'
}

function agentLayerForOperation(operationId: AutonomousEditOperationId): EditingAgentLayer {
  if (operationId.startsWith('timeline.')) return 'editing_supervisor_agent'
  if (operationId.startsWith('caption.') || operationId.startsWith('audio.')) return 'timing_agent'
  if (operationId === 'render.compose' || operationId.startsWith('graphics.') || operationId === 'transition.apply') return 'renderer_agent'
  if (operationId === 'qa.validate') return 'qa_agent'
  return 'tool_execution_agent'
}

function humanWorkLabel(operationId: AutonomousEditOperationId): string {
  if (operationId.startsWith('timeline.')) return 'Shape the story'
  if (operationId.startsWith('caption.')) return 'Prepare readable captions'
  if (operationId.startsWith('graphics.')) return 'Build supporting visuals'
  if (operationId.startsWith('broll.')) return 'Prepare supporting footage'
  if (operationId.startsWith('audio.')) return 'Polish the sound'
  if (operationId.startsWith('color.')) return 'Finish the picture'
  if (operationId === 'transition.apply') return 'Refine the flow'
  if (operationId === 'render.compose') return 'Build the private review'
  return 'Check the finished edit'
}

function expectedOutputType(type: EditWorkItemType): EditWorkItem['expectedOutputs'][number]['outputType'] {
  if (type === 'run_final_qa') return 'qa_report'
  if (type === 'render_final_export') return 'final_export'
  if (type === 'run_audio_analysis') return 'processed_audio'
  if (type === 'process_video_asset' || type === 'prepare_source_trim') return 'processed_video'
  if (type === 'prepare_remotion_layer') return 'remotion_layer'
  return 'status_update'
}

function outputTypeToAssetType(
  type: EditWorkItem['expectedOutputs'][number]['outputType'],
): EditAssetManifestItem['assetType'] {
  if (type === 'final_export') return 'final_export'
  if (type === 'processed_audio') return 'audio_asset'
  if (type === 'processed_video') return 'processed_video'
  if (type === 'remotion_layer') return 'processed_video'
  return 'unknown'
}

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 96) || 'item'
}

function round(value: number): number {
  return Number(value.toFixed(3))
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function asJsonValue(value: unknown): JSONValue {
  return JSON.parse(JSON.stringify(value)) as JSONValue
}

function asJsonObject(value: unknown): JSONObject {
  const parsed = asJsonValue(value)
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('Expected JSON object while compiling the approved snapshot.')
  }
  return parsed as JSONObject
}
