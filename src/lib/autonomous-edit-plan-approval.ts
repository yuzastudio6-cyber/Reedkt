import type {
  AutonomousEditOperationId,
  AutonomousEditPlanDraft,
  AutonomousEditPlanOperation,
  AutonomousEditPlanSegment,
  ProjectSourceVideoBackendUploadResult,
} from '../types'
import type {
  ProjectEditPlanApprovalModel,
  ProjectEditPlanOperationType,
  ProjectEditPlanPlanningEvidence,
  ProjectEditPlanSegmentOperation,
  ProjectEditPlanSegmentRole,
} from './project-edit-plan-approval'
import { estimateLocalEditPlanCredits } from './project-edit-plan-approval'
import type {
  ProjectEditPlanDirectionSource,
  ProjectEditSkillActivityId,
  ProjectEditSkillPlanActivity,
  ProjectEditSkillPlanSummary,
} from './project-edit-skill-aware-plan'

export interface BuildAutonomousEditPlanApprovalModelInput {
  attemptId: string
  draft: AutonomousEditPlanDraft
  directionSource: ProjectEditPlanDirectionSource
  sourceVideoUploadResult: ProjectSourceVideoBackendUploadResult
}

const operationTypeById: Record<AutonomousEditOperationId, ProjectEditPlanOperationType> = {
  'timeline.select': 'cut',
  'timeline.trim': 'trim',
  'timeline.smart_cut': 'cut',
  'caption.generate': 'caption',
  'caption.align': 'caption',
  'caption.style': 'caption',
  'graphics.compose': 'graphics',
  'graphics.animate': 'graphics',
  'broll.select': 'broll',
  'broll.generate': 'broll',
  'audio.cleanup': 'audio_cleanup',
  'audio.loudness.normalize': 'audio_cleanup',
  'audio.music.plan': 'audio_cleanup',
  'audio.sfx.plan': 'audio_cleanup',
  'color.correct': 'color_grade',
  'color.grade': 'color_grade',
  'transition.apply': 'transition',
  'render.compose': 'render',
  'qa.validate': 'qa_check',
}

const activityDefinitions: Array<{
  id: ProjectEditSkillActivityId
  label: string
  prefixes: string[]
}> = [
  { id: 'story_cleanup', label: 'Story and pacing', prefixes: ['timeline.'] },
  { id: 'captions_readability', label: 'Captions and readability', prefixes: ['caption.'] },
  { id: 'voice_polish', label: 'Sound and voice', prefixes: ['audio.'] },
  { id: 'visual_clarity', label: 'Supporting visuals', prefixes: ['graphics.', 'broll.'] },
  { id: 'motion_restraint', label: 'Motion and transitions', prefixes: ['transition.', 'render.'] },
  { id: 'color_finish', label: 'Color finish', prefixes: ['color.'] },
  { id: 'private_review_qa', label: 'Private review checks', prefixes: ['qa.'] },
]

export function buildAutonomousEditPlanApprovalModel(
  input: BuildAutonomousEditPlanApprovalModelInput,
): ProjectEditPlanApprovalModel {
  const { draft } = input
  if (draft.runtime.plannerSource !== 'qwen_live') {
    throw new Error('Only a live evidence-backed Qwen plan can be converted into an approvable edit plan.')
  }
  const operations = draft.segments.flatMap((segment) =>
    segment.operations.map((operation, index) => mapOperation(segment, operation, index)),
  )
  const requiredQaChecks = unique([
    ...draft.globalQaChecks,
    ...draft.segments.flatMap((segment) => segment.requiredQaChecks),
    ...operations.flatMap((operation) => operation.qaChecks),
  ])
  const sourceSummary = [
    input.sourceVideoUploadResult.fileName,
    `${draft.outputFrame.aspectRatio} ${draft.outputFrame.platformTarget.replace(/_/g, ' ')}`,
    `${Math.round(draft.sourceEvidence.probe.durationSeconds)}s source`,
    draft.referenceEvidence?.status === 'completed' ? 'private style reference analyzed' : undefined,
  ].filter(Boolean).join(' · ')
  const blockers = unique([
    ...draft.blockers,
    ...draft.clarificationQuestions.map((question) => `clarification_required: ${question}`),
    draft.runtime.deterministicCreativeFallbackUsed ? 'deterministic_creative_fallback_not_allowed' : undefined,
    draft.runtime.mediaAnalysisRun ? undefined : 'source_analysis_required',
    draft.runtime.visualUnderstandingRun ? undefined : 'visual_understanding_required',
    draft.referenceEvidence && draft.referenceEvidence.status !== 'completed' ? 'reference_analysis_required' : undefined,
  ].filter((value): value is string => Boolean(value)))
  const canApprove = draft.status === 'ready_for_approval' && blockers.length === 0
  const planningEvidence: ProjectEditPlanPlanningEvidence = {
    attemptId: input.attemptId,
    autonomousPlanVersion: draft.version,
    sourceEvidenceVersion: draft.sourceEvidence.evidenceVersion,
    plannerSource: draft.runtime.plannerSource,
    providerCallMade: draft.runtime.providerCallMade,
    qwenCallMade: draft.runtime.qwenCallMade,
    mediaAnalysisRun: true,
    transcriptionRun: draft.runtime.transcriptionRun,
    visualUnderstandingRun: true,
    deterministicCreativeFallbackUsed: false,
    rawPromptStored: false,
    privateArtifactIds: unique([
      ...draft.sourceEvidence.privateArtifactIds,
      ...(draft.referenceEvidence?.privateArtifactIds ?? []),
    ]),
    createdAt: draft.createdAt,
  }

  return {
    approved: false,
    blockers: canApprove ? ['plan_credit_approval_required'] : blockers,
    canApprove,
    creditEstimate: estimateAutonomousPlanCredits(draft),
    editSessionId: draft.editSessionId,
    planId: draft.planId,
    productReady: false,
    providerCallMade: draft.runtime.providerCallMade,
    renderJobCreated: false,
    workerJobCreated: false,
    creditReservedOrSpent: false,
    projectId: draft.projectId,
    sourceSummary,
    status: canApprove ? 'ready_for_approval' : 'waiting_for_backend_upload',
    operationManifest: {
      version: 'project-edit-operation-manifest-v2',
      sourceFileName: input.sourceVideoUploadResult.fileName,
      sourceDurationSeconds: draft.sourceEvidence.probe.durationSeconds,
      sourceAspectRatio: `${draft.sourceEvidence.probe.width}:${draft.sourceEvidence.probe.height}`,
      outputFrame: {
        ...draft.outputFrame,
        source: 'edit_session_metadata',
      },
      professionalBaseline: 'clean_professional',
      sourceOrderPolicy: 'preserve_source_order_until_user_approves_reorder',
      mediaIntelligenceStatus: 'analyzed_private_source_evidence',
      sourceEvidenceVersion: draft.sourceEvidence.evidenceVersion,
      sourceEvidenceArtifactIds: unique([
        ...draft.sourceEvidence.privateArtifactIds,
        ...(draft.referenceEvidence?.privateArtifactIds ?? []),
      ]),
      operations,
      requiredQaChecks,
      workerExecutionReady: false,
      productReady: false,
      warnings: [
        'This manifest was compiled from private source analysis and an evidence-validated Qwen plan.',
        ...(draft.referenceEvidence?.status === 'completed'
          ? ['The optional style reference was measured privately and used as adaptation guidance only.']
          : []),
        'Approval is still required before an immutable snapshot, reservation, work graph, or render may be created.',
      ],
    },
    directionSource: input.directionSource,
    skillPlan: buildEvidenceBackedSkillPlan(draft, input.directionSource),
    steps: draft.segments.slice(0, 11).map((segment) => ({
      label: humanSegmentLabel(segment),
      summary: segment.objective,
    })),
    summary: draft.summary,
    title: draft.title,
    warnings: unique([
      ...draft.warnings,
      'The plan is source-aware but unapproved; no editing worker, render, export, or credit spend has started.',
    ]),
    planningEvidence,
  }
}

function mapOperation(
  segment: AutonomousEditPlanSegment,
  operation: AutonomousEditPlanOperation,
  index: number,
): ProjectEditPlanSegmentOperation {
  return {
    id: `${safeId(segment.id)}-${safeId(operation.operationId)}-${index + 1}`,
    segmentRole: segment.role as ProjectEditPlanSegmentRole,
    operationType: operationTypeById[operation.operationId],
    label: humanOperationLabel(operation.operationId),
    instruction: operation.instruction,
    sourceRangeLabel: rangeLabel(segment.sourceStartSeconds, segment.sourceEndSeconds),
    finalRangeLabel: 'resolved_by_approved_timing_plan',
    qaChecks: unique([...operation.requiredQaChecks, ...segment.requiredQaChecks]),
    operationId: operation.operationId,
    rationale: operation.rationale,
    skillKeys: [...operation.skillKeys],
    sourceEvidenceRefs: [...operation.sourceEvidenceRefs],
    sourceStartSeconds: segment.sourceStartSeconds,
    sourceEndSeconds: segment.sourceEndSeconds,
    executionSpec: operation.executionSpec ? structuredClone(operation.executionSpec) : undefined,
    workerReady: false,
    productReady: false,
  }
}

function buildEvidenceBackedSkillPlan(
  draft: AutonomousEditPlanDraft,
  directionSource: ProjectEditPlanDirectionSource,
): ProjectEditSkillPlanSummary {
  const selections = draft.skillSelections
  const activities = activityDefinitions.flatMap<ProjectEditSkillPlanActivity>((definition) => {
    const matchingOperations = draft.segments.flatMap((segment) => segment.operations).filter((operation) =>
      definition.prefixes.some((prefix) => operation.operationId.startsWith(prefix)),
    )
    const matchingKeys = unique([
      ...matchingOperations.flatMap((operation) => operation.skillKeys),
      ...selections.filter((selection) =>
        selection.operationIds.some((operationId) => definition.prefixes.some((prefix) => operationId.startsWith(prefix))),
      ).map((selection) => selection.skillKey),
    ])
    if (matchingKeys.length === 0) return []
    return [{
      id: definition.id,
      label: definition.label,
      summary: summarizeActivity(matchingOperations),
      skillKeys: matchingKeys,
      approvalRequired: true,
      executionMode: 'planning_only',
      productReady: false,
    }]
  })
  const selectedSkillKeys = unique(selections.map((selection) => selection.skillKey))
  return {
    version: 'project-edit-skill-plan-v1',
    directionSource,
    directionSummary: draft.userIntentSummary,
    activities,
    selectedSkillKeys,
    blockedSkillKeys: [],
    planningOnly: true,
    exposesInternalToolNames: false,
    productReady: false,
    warnings: [
      'Skills were selected from source evidence and user intent. Package and tool names stay out of user-facing activity copy.',
      'Skill selection becomes executable only after approval compiles an immutable snapshot and work graph.',
    ],
  }
}

function estimateAutonomousPlanCredits(draft: AutonomousEditPlanDraft) {
  const baseline = estimateLocalEditPlanCredits(draft.sourceEvidence.probe.durationSeconds)
  const operationCount = draft.segments.reduce((count, segment) => count + segment.operations.length, 0)
  const complexityUnits = Math.ceil(operationCount / 8) + Math.ceil(draft.skillSelections.length / 10)
  return {
    ...baseline,
    expectedCredits: baseline.expectedCredits + complexityUnits,
    highCredits: baseline.highCredits + complexityUnits * 2,
  }
}

function humanSegmentLabel(segment: AutonomousEditPlanSegment): string {
  const label = segment.role.replace(/_/g, ' ')
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} · ${rangeLabel(segment.sourceStartSeconds, segment.sourceEndSeconds)}`
}

function humanOperationLabel(operationId: AutonomousEditOperationId): string {
  const labels: Record<AutonomousEditOperationId, string> = {
    'timeline.select': 'Select the strongest source moments',
    'timeline.trim': 'Refine timing',
    'timeline.smart_cut': 'Shape the story',
    'caption.generate': 'Prepare captions',
    'caption.align': 'Align captions to speech',
    'caption.style': 'Design caption emphasis',
    'graphics.compose': 'Compose supporting visuals',
    'graphics.animate': 'Animate supporting visuals',
    'broll.select': 'Select supporting footage',
    'broll.generate': 'Prepare an approved supporting visual',
    'audio.cleanup': 'Clean the source audio',
    'audio.loudness.normalize': 'Balance loudness',
    'audio.music.plan': 'Shape music direction',
    'audio.sfx.plan': 'Shape sound accents',
    'color.correct': 'Correct source color',
    'color.grade': 'Create the visual finish',
    'transition.apply': 'Apply motivated transitions',
    'render.compose': 'Compose the private review',
    'qa.validate': 'Validate the finished edit',
  }
  return labels[operationId]
}

function summarizeActivity(operations: AutonomousEditPlanOperation[]): string {
  const reasons = unique(operations.map((operation) => operation.rationale))
  return reasons.slice(0, 2).join(' ') || 'Prepare this part of the approved edit with source-aware direction.'
}

function rangeLabel(startSeconds: number, endSeconds: number): string {
  return `${startSeconds.toFixed(2)}s-${endSeconds.toFixed(2)}s`
}

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 72) || 'operation'
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}
