import type {
  AutonomousEditPlanDraft,
  AutonomousEditOperationExecutionSpec,
  AutonomousEditOperationId,
  CreativeSkillKey,
  ProjectSourceVideoBackendUploadResult,
} from '../types'
import type {
  ProjectEditSessionAspectRatio,
  ProjectEditSessionPlatformTarget,
} from '../types/project-edit-session'
import {
  buildProjectEditSkillPlan,
  resolveProjectEditPlanDirection,
  type ProjectEditPlanDirectionSource,
  type ProjectEditSkillPlanSummary,
} from './project-edit-skill-aware-plan'

export type ProjectEditPlanApprovalStatus =
  | 'waiting_for_source'
  | 'waiting_for_backend_upload'
  | 'waiting_for_analysis'
  | 'analyzing'
  | 'ready_for_approval'
  | 'approved'

export interface ProjectEditPlanApprovalStep {
  label: string
  summary: string
}

export type ProjectEditPlanSegmentRole =
  | 'hook'
  | 'setup'
  | 'context'
  | 'main_body'
  | 'proof'
  | 'transition'
  | 'ending'

export type ProjectEditPlanOperationType =
  | 'trim'
  | 'cut'
  | 'caption'
  | 'graphics'
  | 'broll'
  | 'color_grade'
  | 'audio_cleanup'
  | 'transition'
  | 'render'
  | 'qa_check'

export interface ProjectEditPlanSegmentOperation {
  id: string
  segmentRole: ProjectEditPlanSegmentRole
  operationType: ProjectEditPlanOperationType
  label: string
  instruction: string
  sourceRangeLabel: string
  finalRangeLabel: string
  qaChecks: string[]
  operationId?: AutonomousEditOperationId
  rationale?: string
  skillKeys?: CreativeSkillKey[]
  sourceEvidenceRefs?: string[]
  sourceStartSeconds?: number
  sourceEndSeconds?: number
  executionSpec?: AutonomousEditOperationExecutionSpec
  workerReady: false
  productReady: false
}

export interface ProjectEditPlanOperationManifest {
  version: 'project-edit-operation-manifest-v1' | 'project-edit-operation-manifest-v2'
  sourceFileName: string
  sourceDurationSeconds?: number
  sourceAspectRatio?: string
  outputFrame?: ProjectEditPlanOutputFrame
  professionalBaseline: 'clean_professional'
  sourceOrderPolicy: 'preserve_source_order_until_user_approves_reorder'
  mediaIntelligenceStatus: 'not_analyzed_backend_local_only' | 'analyzed_private_source_evidence'
  sourceEvidenceVersion?: 'autonomous-edit-source-evidence-v1'
  sourceEvidenceArtifactIds?: string[]
  operations: ProjectEditPlanSegmentOperation[]
  requiredQaChecks: string[]
  workerExecutionReady: false
  productReady: false
  warnings: string[]
}

export interface ProjectEditPlanPlanningEvidence {
  attemptId: string
  autonomousPlanVersion: 'autonomous-edit-plan-v1'
  sourceEvidenceVersion: 'autonomous-edit-source-evidence-v1'
  plannerSource: 'qwen_live'
  providerCallMade: boolean
  qwenCallMade: boolean
  mediaAnalysisRun: true
  transcriptionRun: boolean
  visualUnderstandingRun: true
  deterministicCreativeFallbackUsed: false
  rawPromptStored: false
  privateArtifactIds: string[]
  createdAt: string
}

export interface ProjectEditPlanCreditEstimate {
  lowCredits: number
  expectedCredits: number
  highCredits: number
  creditConversion: '1 credit = $0.10'
  serviceFeeIncluded: false
}

export interface ProjectEditPlanBriefLineage {
  briefId: string
  revisionNumber: number
  briefFingerprint: string
}

export interface ProjectEditPlanOutputFrame {
  aspectRatio: ProjectEditSessionAspectRatio
  platformTarget: ProjectEditSessionPlatformTarget
  width: number
  height: number
  confirmed: true
  source: 'new_edit_create_form' | 'edit_session_metadata'
}

export interface ProjectEditPlanApprovalInput {
  approved: boolean
  backendUploadResult?: ProjectSourceVideoBackendUploadResult
  briefSaved: boolean
  briefText: string
  editSessionId: string
  outputAspectRatio?: ProjectEditSessionAspectRatio
  outputFrameConfirmed?: boolean
  outputFrameConfirmationSource?: ProjectEditPlanOutputFrame['source']
  outputPlatformTarget?: ProjectEditSessionPlatformTarget
  projectId: string
  sourceAspectRatio?: string
  sourceDurationSeconds?: number
  sourceFileName?: string
}

export interface ProjectEditPlanApprovalModel {
  approved: boolean
  blockers: string[]
  canApprove: boolean
  creditEstimate: ProjectEditPlanCreditEstimate
  editSessionId: string
  planId: string
  productReady: false
  providerCallMade: boolean
  renderJobCreated: false
  workerJobCreated: false
  creditReservedOrSpent: false
  projectId: string
  sourceSummary: string
  status: ProjectEditPlanApprovalStatus
  operationManifest: ProjectEditPlanOperationManifest
  directionSource: ProjectEditPlanDirectionSource
  skillPlan: ProjectEditSkillPlanSummary
  steps: ProjectEditPlanApprovalStep[]
  summary: string
  title: string
  warnings: string[]
  planningEvidence?: ProjectEditPlanPlanningEvidence
}

export type ProjectEditPlanApprovedLocalPlan = Pick<ProjectEditPlanApprovalModel, 'approved' | 'creditEstimate' | 'directionSource' | 'operationManifest' | 'planId' | 'skillPlan' | 'steps' | 'summary' | 'title'> & {
  briefLineage: ProjectEditPlanBriefLineage
  planningEvidence?: ProjectEditPlanPlanningEvidence
  autonomousPlanSnapshot?: AutonomousEditPlanDraft
}

export interface ProjectEditPlanBackendLocalRecord {
  id: string
  editPlanId: string
  creditEstimateId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedByUserId?: string
  approvedAt: string
  status: 'approved'
  approvedLocalPlan: ProjectEditPlanApprovedLocalPlan
  source: {
    storageObjectRecordId: string
    mediaAssetId?: string
    bucketName: string
    objectPath: string
    fileName: string
    mimeType: string
    sizeBytes: number
    checksumSha256?: string
  }
  briefLineage: ProjectEditPlanBriefLineage
  backendLocalPlanStored: true
  readbackVerified?: true
  providerCallMade: false
  workerJobCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
  supabaseWriteMade: false
  gcsWriteMade: false
  productReady: false
  mockOnly: true
  warnings: string[]
}

export interface ProjectEditPlanBackendApprovalResult {
  localEditPlan: ProjectEditPlanBackendLocalRecord
  readback?: ProjectEditPlanBackendLocalRecord
  executionGate?: ProjectEditPlanExecutionGate
  warnings: string[]
}

export interface ProjectEditPlanExecutionGate {
  status: 'execution_ready'
  planId: string
  creditEstimateId: string
  creditApprovalId: string
  creditReservationId: string
  reservedCredits: number
  approvedPlanSnapshotId: string
  snapshotHash: string
  workGraphId: string
  timelineManifestId: string
  userFacingWorkSummary: string[]
  privateArtifactsOnly: true
  publicDeliveryAllowed: false
  paidBillingMutationMade: false
  productReady: false
}

export function createProjectEditPlanBriefLineage(input: {
  briefId: string
  briefText: string
  revisionNumber: number
}): ProjectEditPlanBriefLineage {
  const normalized = input.briefText.trim().replace(/\s+/g, ' ')
  let hash = 2166136261
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return {
    briefId: input.briefId,
    revisionNumber: Math.max(1, Math.floor(input.revisionNumber || 1)),
    briefFingerprint: `brief-fnv1a-${hash.toString(16).padStart(8, '0')}-${normalized.length}`,
  }
}

function safeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64) || 'local'
}

function rangeLabel(startSeconds: number, endSeconds: number): string {
  const safeStart = Math.max(0, Math.floor(startSeconds))
  const safeEnd = Math.max(safeStart + 1, Math.ceil(endSeconds))
  return `${safeStart}s-${safeEnd}s`
}

export function getProjectEditPlanOutputFrameDimensions(aspectRatio: ProjectEditSessionAspectRatio | undefined): {
  width: number
  height: number
} | undefined {
  if (aspectRatio === '9:16') return { width: 540, height: 960 }
  if (aspectRatio === '16:9') return { width: 960, height: 540 }
  if (aspectRatio === '1:1') return { width: 720, height: 720 }
  if (aspectRatio === '4:5') return { width: 720, height: 900 }
  return undefined
}

function resolveConfirmedOutputFrame(input: ProjectEditPlanApprovalInput): ProjectEditPlanOutputFrame | undefined {
  const dimensions = getProjectEditPlanOutputFrameDimensions(input.outputAspectRatio)
  if (!input.outputFrameConfirmed || !input.outputAspectRatio || !input.outputPlatformTarget || !dimensions) return undefined
  return {
    aspectRatio: input.outputAspectRatio,
    platformTarget: input.outputPlatformTarget,
    width: dimensions.width,
    height: dimensions.height,
    confirmed: true,
    source: input.outputFrameConfirmationSource ?? 'edit_session_metadata',
  }
}

function createOperationManifest(input: ProjectEditPlanApprovalInput): ProjectEditPlanOperationManifest {
  const sourceFileName = input.sourceFileName ?? input.backendUploadResult?.fileName ?? 'source video'
  const durationSeconds = Math.max(1, Math.min(Math.ceil(input.sourceDurationSeconds ?? 60), 600))
  const outputFrame = resolveConfirmedOutputFrame(input)
  const hookEnd = Math.min(6, Math.max(3, Math.round(durationSeconds * 0.15)))
  const endingStart = Math.max(hookEnd + 1, durationSeconds - Math.min(6, Math.max(3, Math.round(durationSeconds * 0.12))))
  const fullRange = rangeLabel(0, durationSeconds)

  const operations: ProjectEditPlanSegmentOperation[] = [
    {
      id: 'op-hook-source-order-trim',
      segmentRole: 'hook',
      operationType: 'trim',
      label: 'Opening trim',
      instruction: 'Keep the strongest opening beat in source order and trim only obvious dead air that does not change meaning.',
      sourceRangeLabel: rangeLabel(0, hookEnd),
      finalRangeLabel: rangeLabel(0, hookEnd),
      qaChecks: ['meaning_preserved', 'source_order_visible', 'no_random_hook_added'],
      workerReady: false,
      productReady: false,
    },
    {
      id: 'op-body-clean-cuts',
      segmentRole: 'main_body',
      operationType: 'cut',
      label: 'Clean pacing cuts',
      instruction: 'Use clean cuts and phrase-safe pacing cleanup across the source; do not remove context needed to understand the speaker.',
      sourceRangeLabel: fullRange,
      finalRangeLabel: fullRange,
      qaChecks: ['speech_clarity_preserved', 'no_misleading_cut', 'plan_direction_followed'],
      workerReady: false,
      productReady: false,
    },
    {
      id: 'op-readable-captions',
      segmentRole: 'main_body',
      operationType: 'caption',
      label: 'Readable captions',
      instruction: 'Prepare clean readable captions with safe placement and no face/product obstruction.',
      sourceRangeLabel: fullRange,
      finalRangeLabel: fullRange,
      qaChecks: ['caption_readability', 'caption_safe_zone', 'caption_timing_pending_worker'],
      workerReady: false,
      productReady: false,
    },
    {
      id: 'op-natural-color',
      segmentRole: 'main_body',
      operationType: 'color_grade',
      label: 'Clean natural color',
      instruction: 'Plan a natural correction pass that keeps skin, products, and source footage believable.',
      sourceRangeLabel: fullRange,
      finalRangeLabel: fullRange,
      qaChecks: ['color_grade_matches_clean_professional', 'no_overprocessed_look'],
      workerReady: false,
      productReady: false,
    },
    {
      id: 'op-voice-first-audio',
      segmentRole: 'main_body',
      operationType: 'audio_cleanup',
      label: 'Voice-first audio',
      instruction: 'Plan basic voice leveling and cleanup while keeping music and effects secondary to speech clarity.',
      sourceRangeLabel: fullRange,
      finalRangeLabel: fullRange,
      qaChecks: ['voice_clear', 'music_ducking_if_used', 'no_sfx_over_speech'],
      workerReady: false,
      productReady: false,
    },
    {
      id: 'op-ending-handoff',
      segmentRole: 'ending',
      operationType: 'transition',
      label: 'Ending handoff',
      instruction: 'Use simple motivated transition handling at the end; avoid random effects or unapproved generated visuals.',
      sourceRangeLabel: rangeLabel(endingStart, durationSeconds),
      finalRangeLabel: rangeLabel(endingStart, durationSeconds),
      qaChecks: ['transition_motivated', 'no_random_effects', 'final_context_preserved'],
      workerReady: false,
      productReady: false,
    },
    {
      id: 'op-professional-qa',
      segmentRole: 'context',
      operationType: 'qa_check',
      label: 'Professional QA',
      instruction: 'Check the preview against the approved plan direction, source order, approval snapshot, captions, audio, color, and private artifact boundaries before export.',
      sourceRangeLabel: fullRange,
      finalRangeLabel: fullRange,
      qaChecks: ['approved_snapshot_used', 'credit_gate_recorded', 'private_artifact_only', 'product_ready_false'],
      workerReady: false,
      productReady: false,
    },
  ]

  return {
    version: 'project-edit-operation-manifest-v1',
    sourceFileName,
    sourceDurationSeconds: input.sourceDurationSeconds,
    sourceAspectRatio: input.sourceAspectRatio,
    outputFrame,
    professionalBaseline: 'clean_professional',
    sourceOrderPolicy: 'preserve_source_order_until_user_approves_reorder',
    mediaIntelligenceStatus: 'not_analyzed_backend_local_only',
    operations,
    requiredQaChecks: [...new Set(operations.flatMap((operation) => operation.qaChecks))],
    workerExecutionReady: false,
    productReady: false,
    warnings: [
      'Operation manifest is backend-local planning evidence only; transcript/media intelligence and production workers remain separate gates.',
      'Workers must execute an approved snapshot and must not reinterpret raw chat.',
      ...(outputFrame ? [`Confirmed output frame is ${outputFrame.aspectRatio} ${outputFrame.width}x${outputFrame.height} for ${outputFrame.platformTarget.replace(/_/g, ' ')}.`] : ['Output frame confirmation is required before approval or render smoke.']),
    ],
  }
}

export function estimateLocalEditPlanCredits(durationSeconds?: number): ProjectEditPlanCreditEstimate {
  const boundedDurationSeconds = Math.max(1, Math.min(Math.ceil(durationSeconds ?? 60), 600))
  const durationUnits = Math.max(1, Math.ceil(boundedDurationSeconds / 30))
  const expectedCredits = 4 + durationUnits * 2

  return {
    lowCredits: Math.max(1, expectedCredits - 2),
    expectedCredits,
    highCredits: expectedCredits + 4,
    creditConversion: '1 credit = $0.10',
    serviceFeeIncluded: false,
  }
}

export function buildProjectEditPlanApprovalModel(input: ProjectEditPlanApprovalInput): ProjectEditPlanApprovalModel {
  const backendUploaded = input.backendUploadResult?.status === 'uploaded'
  const hasSource = Boolean(input.sourceFileName || input.backendUploadResult?.fileName)
  const outputFrame = resolveConfirmedOutputFrame(input)
  const canApprove = hasSource && backendUploaded && Boolean(outputFrame)
  const approved = canApprove && input.approved
  const direction = resolveProjectEditPlanDirection({
    briefSaved: input.briefSaved,
    directionText: input.briefText,
  })
  const skillPlan = buildProjectEditSkillPlan({
    briefSaved: input.briefSaved,
    directionText: input.briefText,
    sourceDurationSeconds: input.sourceDurationSeconds,
  })

  const status: ProjectEditPlanApprovalStatus = approved
    ? 'approved'
    : !hasSource
      ? 'waiting_for_source'
      : !backendUploaded
        ? 'waiting_for_backend_upload'
        : 'ready_for_approval'

  const blockers = [
    hasSource ? undefined : 'source_video_required',
    backendUploaded ? undefined : 'backend_local_upload_required',
    outputFrame ? undefined : 'confirmed_output_frame_required',
    approved ? undefined : 'plan_credit_approval_required',
  ].filter(Boolean) as string[]

  const sourceName = input.sourceFileName ?? input.backendUploadResult?.fileName ?? 'source video'
  const sourceSummary = [
    sourceName,
    outputFrame ? `${outputFrame.aspectRatio} ${outputFrame.platformTarget.replace(/_/g, ' ')} output` : undefined,
    input.sourceAspectRatio ? `${input.sourceAspectRatio} frame` : undefined,
    input.sourceDurationSeconds ? `${Math.round(input.sourceDurationSeconds)}s source` : undefined,
  ].filter(Boolean).join(' · ')

  return {
    approved,
    blockers,
    canApprove,
    creditEstimate: estimateLocalEditPlanCredits(input.sourceDurationSeconds),
    editSessionId: input.editSessionId,
    planId: `local-plan-${safeSegment(input.projectId)}-${safeSegment(input.editSessionId)}`,
    productReady: false,
    providerCallMade: false,
    renderJobCreated: false,
    workerJobCreated: false,
    creditReservedOrSpent: false,
    projectId: input.projectId,
    sourceSummary,
    status,
    operationManifest: createOperationManifest(input),
    directionSource: direction.source,
    skillPlan,
    steps: [
      {
        label: 'Source review',
        summary: 'Confirm the uploaded source belongs to this edit and keep the browser preview tied to the backend-local source record.',
      },
      {
        label: 'Clean assembly',
        summary: 'Build a professional first pass around pacing, meaning preservation, simple structure, and the approved plan direction.',
      },
      {
        label: 'Caption and timing pass',
        summary: 'Prepare readable caption and timing intent before any worker can execute a future approved snapshot.',
      },
      {
        label: 'Sound balance',
        summary: 'Keep voice clarity first and treat music or effects as later approved enhancements.',
      },
      {
        label: 'Review preview',
        summary: 'Unlock only the internal preview smoke path for local testing; final export stays blocked.',
      },
    ],
    summary: direction.text,
    title: 'Local test edit plan',
    warnings: [
      'Approving this local plan does not call providers, run production tools, write Supabase, or unlock final export.',
      input.briefSaved
        ? 'The saved edit brief is used as the approved plan direction.'
        : 'Edit brief is optional; this plan can use the current prompt text or the default professional direction.',
      'The preview smoke remains internal and product-ready local OSS count stays 0.',
    ],
  }
}
