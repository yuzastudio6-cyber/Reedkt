import { createHash } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import type { ApprovedPlanSnapshotRecord } from '../../src/backend/cloud/approved-plan-snapshot-contracts'
import { validateApprovedPlanSnapshotForWorker } from '../../src/backend/cloud/approved-plan-snapshot-contracts'
import type { ServiceContext } from '../types'
import { createMockId, getRequiredAuthUserId, mockWarning, nowIso, sanitizeJson } from './service-helpers'
import type {
  ProjectEditPlanDirectionSource,
  ProjectEditSkillPlanSummary,
} from '../../src/lib/project-edit-skill-aware-plan'
import type {
  AutonomousEditOperationId,
  AutonomousEditOperationExecutionSpec,
  AutonomousEditPlanDraft,
  CreativeSkillKey,
} from '../../src/types'
import {
  getAutonomousEditPlanningAttempt,
  getAutonomousPrivateExecutionEvidence,
} from './autonomous-edit-planning-service'
import {
  compileAutonomousEditExecution,
  type AutonomousEditExecutionCompilation,
} from './autonomous-edit-execution-compiler'

interface LocalEditPlanStepInput {
  label: string
  summary: string
}

interface LocalEditPlanSegmentOperationInput {
  id: string
  segmentRole: 'hook' | 'setup' | 'context' | 'main_body' | 'proof' | 'transition' | 'ending'
  operationType: 'trim' | 'cut' | 'caption' | 'graphics' | 'broll' | 'color_grade' | 'audio_cleanup' | 'transition' | 'render' | 'qa_check'
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

interface LocalEditPlanOutputFrameInput {
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | 'custom'
  platformTarget:
    | 'tiktok_reel'
    | 'instagram_reel'
    | 'instagram_feed'
    | 'youtube_shorts'
    | 'youtube_standard'
    | 'linkedin'
    | 'website'
    | 'podcast_clip'
    | 'ad_creative'
    | 'internal_review'
    | 'custom'
  width: number
  height: number
  confirmed: true
  source: 'new_edit_create_form' | 'edit_session_metadata'
}

interface LocalEditPlanOperationManifestInput {
  version: 'project-edit-operation-manifest-v1' | 'project-edit-operation-manifest-v2'
  sourceFileName: string
  sourceDurationSeconds?: number
  sourceAspectRatio?: string
  outputFrame?: LocalEditPlanOutputFrameInput
  professionalBaseline: 'clean_professional'
  sourceOrderPolicy: 'preserve_source_order_until_user_approves_reorder'
  mediaIntelligenceStatus: 'not_analyzed_backend_local_only' | 'analyzed_private_source_evidence'
  sourceEvidenceVersion?: 'autonomous-edit-source-evidence-v1'
  sourceEvidenceArtifactIds?: string[]
  operations: LocalEditPlanSegmentOperationInput[]
  requiredQaChecks: string[]
  workerExecutionReady: false
  productReady: false
  warnings: string[]
}

interface LocalEditPlanPlanningEvidenceInput {
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

interface LocalEditPlanCreditEstimateInput {
  lowCredits: number
  expectedCredits: number
  highCredits: number
  creditConversion: '1 credit = $0.10'
  serviceFeeIncluded: false
}

interface LocalEditPlanBriefLineageInput {
  briefId: string
  revisionNumber: number
  briefFingerprint: string
}

interface LocalEditPlanSourceInput {
  storageObjectRecordId: string
  mediaAssetId?: string
  bucketName: string
  objectPath: string
  fileName: string
  mimeType: string
  sizeBytes: number
  checksumSha256?: string
}

interface CreateApprovedLocalEditPlanInput {
  workspaceId: string
  projectId: string
  editSessionId: string
  planId: string
  title: string
  summary: string
  steps: LocalEditPlanStepInput[]
  operationManifest: LocalEditPlanOperationManifestInput
  planningEvidence?: LocalEditPlanPlanningEvidenceInput
  directionSource: ProjectEditPlanDirectionSource
  skillPlan: ProjectEditSkillPlanSummary
  creditEstimate: LocalEditPlanCreditEstimateInput
  briefLineage: LocalEditPlanBriefLineageInput
  source: LocalEditPlanSourceInput
}

export interface ApprovedLocalEditPlanRecord {
  id: string
  editPlanId: string
  creditEstimateId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedByUserId?: string
  approvedAt: string
  status: 'approved'
  approvedLocalPlan: {
    approved: true
    creditEstimate: LocalEditPlanCreditEstimateInput
    planId: string
    steps: LocalEditPlanStepInput[]
    operationManifest: LocalEditPlanOperationManifestInput
    planningEvidence?: LocalEditPlanPlanningEvidenceInput
    autonomousPlanSnapshot?: AutonomousEditPlanDraft
    directionSource: ProjectEditPlanDirectionSource
    skillPlan: ProjectEditSkillPlanSummary
    briefLineage: LocalEditPlanBriefLineageInput
    summary: string
    title: string
  }
  briefLineage: LocalEditPlanBriefLineageInput
  source: LocalEditPlanSourceInput
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

export interface ActivatedAutonomousEditPlanRecord {
  planId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  creditApproval: {
    id: string
    creditEstimateId: string
    status: 'approved'
    approvedByUserId: string
    approvedAt: string
  }
  creditReservation: {
    id: string
    creditEstimateId: string
    status: 'reserved'
    reservedCredits: number
    createdAt: string
  }
  approvedPlanSnapshot: ApprovedPlanSnapshotRecord
  executionCompilation: AutonomousEditExecutionCompilation
  userFacingWorkSummary: string[]
  productReady: false
  publicDeliveryAllowed: false
  paidBillingMutationMade: false
  createdAt: string
}

const mockApprovedLocalEditPlans = new Map<string, ApprovedLocalEditPlanRecord>()
const activatedAutonomousPlans = new Map<string, ActivatedAutonomousEditPlanRecord>()

export function getActivatedAutonomousEditPlan(
  planId: string,
): ActivatedAutonomousEditPlanRecord | undefined {
  return activatedAutonomousPlans.get(planId)
}

export function createProjectEditPlanService(context: ServiceContext) {
  return {
    async createApprovedLocalEditPlan(input: CreateApprovedLocalEditPlanInput) {
      const approvedByUserId = getRequiredAuthUserId(context)
      assertSafePlanText(input)
      const autonomousPlanSnapshot = assertCanonicalAutonomousPlan(input)

      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Backend-local edit plan approval is mock-safe only until durable approved edit plan persistence is implemented.',
          409,
        )
      }

      const existing = mockApprovedLocalEditPlans.get(input.planId)
      if (existing) {
        return {
          localEditPlan: {
            ...existing,
            readbackVerified: true,
          },
          warnings: [mockWarning('Approved local edit plan replay'), 'Existing backend-local approved plan record returned by plan id.'],
        }
      }

      const now = nowIso()
      const record: ApprovedLocalEditPlanRecord = {
        id: createMockId('local_edit_plan'),
        editPlanId: input.planId,
        creditEstimateId: `${input.planId}-credit-estimate`,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        approvedByUserId,
        approvedAt: now,
        status: 'approved',
        approvedLocalPlan: {
          approved: true,
          creditEstimate: input.creditEstimate,
          briefLineage: sanitizeBriefLineage(input.briefLineage),
          directionSource: input.directionSource,
          skillPlan: sanitizeSkillPlan(input.skillPlan),
          operationManifest: sanitizeOperationManifest(input.operationManifest),
          planningEvidence: input.planningEvidence ? sanitizePlanningEvidence(input.planningEvidence) : undefined,
          autonomousPlanSnapshot,
          planId: input.planId,
          steps: input.steps.map((step) => sanitizePlanStep(step)),
          summary: sanitizePlanText(input.summary),
          title: sanitizePlanText(input.title),
        },
        briefLineage: sanitizeBriefLineage(input.briefLineage),
        source: {
          ...input.source,
          fileName: sanitizePlanText(input.source.fileName),
        },
        backendLocalPlanStored: true,
        readbackVerified: true,
        providerCallMade: false,
        workerJobCreated: false,
        renderJobCreated: false,
        creditReservedOrSpent: false,
        supabaseWriteMade: false,
        gcsWriteMade: false,
        productReady: false,
        mockOnly: true,
        warnings: [
          mockWarning('Approved local edit plan storage'),
          'This is a backend-local approved plan record for internal testing only; it does not approve production execution.',
        ],
      }
      mockApprovedLocalEditPlans.set(record.editPlanId, record)

      return {
        localEditPlan: record,
        warnings: record.warnings,
      }
    },

    async getApprovedLocalEditPlan(planId: string, workspaceId: string) {
      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Backend-local edit plan readback is mock-safe only until durable approved edit plan persistence is implemented.',
          409,
        )
      }

      const record = mockApprovedLocalEditPlans.get(planId)
      if (!record || record.workspaceId !== workspaceId) {
        throw new ApiError('PLAN_NOT_APPROVED', 'Approved backend-local edit plan was not found for this workspace.', 404)
      }

      return {
        localEditPlan: {
          ...record,
          readbackVerified: true,
        },
        executionGate: activatedAutonomousPlans.has(planId)
          ? toExecutionGateView(activatedAutonomousPlans.get(planId)!)
          : undefined,
        warnings: [mockWarning('Approved local edit plan readback')],
      }
    },

    async activateApprovedLocalEditPlan(planId: string, workspaceId: string) {
      const approvedByUserId = getRequiredAuthUserId(context)
      const existingActivation = activatedAutonomousPlans.get(planId)
      if (existingActivation) {
        if (existingActivation.workspaceId !== workspaceId) {
          throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Activated edit plan does not belong to this workspace.', 403)
        }
        return {
          executionGate: toExecutionGateView(existingActivation),
          warnings: [mockWarning('Autonomous edit activation replay'), 'Existing immutable activation was returned without reserving twice.'],
        }
      }
      const localPlan = mockApprovedLocalEditPlans.get(planId)
      if (!localPlan || localPlan.workspaceId !== workspaceId) {
        throw new ApiError('PLAN_NOT_APPROVED', 'Approved evidence-backed edit plan was not found for this workspace.', 404)
      }
      const planningEvidence = localPlan.approvedLocalPlan.planningEvidence
      if (!planningEvidence || localPlan.approvedLocalPlan.operationManifest.version !== 'project-edit-operation-manifest-v2') {
        throw new ApiError('PLAN_NOT_APPROVED', 'Only an evidence-backed autonomous plan can activate real private execution.', 409)
      }
      const privateEvidence = getAutonomousPrivateExecutionEvidence(planningEvidence.attemptId)
      if (!privateEvidence) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Private planning evidence is unavailable; rebuild the plan before execution.', 409)
      }

      const now = nowIso()
      const creditApprovalId = createMockId('credit_approval')
      const creditReservationId = createMockId('credit_reservation')
      const approvedSnapshotId = createMockId('approved_snapshot')
      const compilation = compileAutonomousEditExecution({
        approvedLocalPlan: localPlan,
        approvedSnapshotId,
        creditApprovalId,
        creditReservationId,
        transcriptSegments: privateEvidence.transcriptSegments,
        sourceStorageObjectPath: localPlan.source.objectPath,
        fps: privateEvidence.mediaProbe.fps ?? 30,
      })
      const snapshotHash = hashJson(compilation.approvedSnapshotPayload)
      const approvedPlanSnapshot: ApprovedPlanSnapshotRecord = {
        id: approvedSnapshotId,
        workspaceId: localPlan.workspaceId,
        projectId: localPlan.projectId,
        chatSessionId: localPlan.editSessionId,
        editPlanId: localPlan.editPlanId,
        creditEstimateId: localPlan.creditEstimateId,
        creditApprovalId,
        creditReservationId,
        snapshotStatus: 'execution_ready',
        snapshotVersion: 1,
        snapshotHash,
        approvedByUserId,
        approvedAt: localPlan.approvedAt,
        executionReadyAt: now,
        snapshotPayload: compilation.approvedSnapshotPayload,
        createdAt: now,
        updatedAt: now,
        metadata: {
          localInternalExecution: true,
          privateArtifactsOnly: true,
          publicDeliveryAllowed: false,
          productReady: false,
        },
      }
      const validation = validateApprovedPlanSnapshotForWorker(approvedPlanSnapshot, {
        requiresCreditReservation: true,
      })
      if (!validation.ok) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Compiled autonomous snapshot failed execution validation.', 409, validation)
      }
      const activation: ActivatedAutonomousEditPlanRecord = {
        planId,
        workspaceId: localPlan.workspaceId,
        projectId: localPlan.projectId,
        editSessionId: localPlan.editSessionId,
        creditApproval: {
          id: creditApprovalId,
          creditEstimateId: localPlan.creditEstimateId,
          status: 'approved',
          approvedByUserId,
          approvedAt: now,
        },
        creditReservation: {
          id: creditReservationId,
          creditEstimateId: localPlan.creditEstimateId,
          status: 'reserved',
          reservedCredits: localPlan.approvedLocalPlan.creditEstimate.highCredits,
          createdAt: now,
        },
        approvedPlanSnapshot,
        executionCompilation: compilation,
        userFacingWorkSummary: uniqueUserFacingWorkSummary(compilation),
        productReady: false,
        publicDeliveryAllowed: false,
        paidBillingMutationMade: false,
        createdAt: now,
      }
      activatedAutonomousPlans.set(planId, activation)
      return {
        executionGate: toExecutionGateView(activation),
        warnings: [
          'Approved estimate, bounded internal reservation, immutable snapshot, and private work graph were created together.',
          'No worker, render, public delivery, wallet spend, Stripe, or paid billing mutation started during activation.',
        ],
      }
    },
  }
}

function toExecutionGateView(activation: ActivatedAutonomousEditPlanRecord) {
  return {
    status: 'execution_ready' as const,
    planId: activation.planId,
    creditEstimateId: activation.creditApproval.creditEstimateId,
    creditApprovalId: activation.creditApproval.id,
    creditReservationId: activation.creditReservation.id,
    reservedCredits: activation.creditReservation.reservedCredits,
    approvedPlanSnapshotId: activation.approvedPlanSnapshot.id,
    snapshotHash: activation.approvedPlanSnapshot.snapshotHash,
    workGraphId: activation.executionCompilation.editingAgentExecutionPlan.id,
    timelineManifestId: activation.executionCompilation.timelineManifest.id,
    userFacingWorkSummary: activation.userFacingWorkSummary,
    privateArtifactsOnly: true as const,
    publicDeliveryAllowed: false as const,
    paidBillingMutationMade: false as const,
    productReady: false as const,
  }
}

function uniqueUserFacingWorkSummary(compilation: AutonomousEditExecutionCompilation): string[] {
  return [...new Set(compilation.editingAgentExecutionPlan.workItems
    .filter((item) => item.workItemType !== 'validate_approved_snapshot')
    .map((item) => item.label))]
}

function hashJson(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex')
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
    return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function assertCanonicalAutonomousPlan(
  input: CreateApprovedLocalEditPlanInput,
): AutonomousEditPlanDraft | undefined {
  if (input.operationManifest.version === 'project-edit-operation-manifest-v1') return undefined
  const evidence = input.planningEvidence
  if (!evidence) {
    throw new ApiError('VALIDATION_FAILED', 'Evidence-backed plan approval requires planning evidence.', 400)
  }
  const attempt = getAutonomousEditPlanningAttempt(evidence.attemptId)
  const plan = attempt?.plan
  if (!attempt || attempt.status !== 'completed' || !plan || plan.status !== 'ready_for_approval') {
    throw new ApiError('PLAN_NOT_APPROVED', 'Canonical autonomous planning attempt is unavailable or not ready for approval.', 409)
  }
  const mismatches = [
    attempt.workspaceId === input.workspaceId ? undefined : 'workspace',
    attempt.projectId === input.projectId ? undefined : 'project',
    attempt.editSessionId === input.editSessionId ? undefined : 'edit session',
    plan.planId === input.planId ? undefined : 'plan ID',
    plan.title === input.title ? undefined : 'title',
    plan.summary === input.summary ? undefined : 'summary',
    plan.sourceEvidence.sourceStorageObjectRecordId === input.source.storageObjectRecordId ? undefined : 'source object',
    plan.runtime.plannerSource === evidence.plannerSource ? undefined : 'planner source',
    plan.runtime.providerCallMade === evidence.providerCallMade ? undefined : 'provider evidence',
    plan.runtime.qwenCallMade === evidence.qwenCallMade ? undefined : 'Qwen evidence',
    plan.runtime.transcriptionRun === evidence.transcriptionRun ? undefined : 'transcription evidence',
    plan.runtime.visualUnderstandingRun === evidence.visualUnderstandingRun ? undefined : 'visual evidence',
    JSON.stringify(plan.outputFrame) === JSON.stringify(stripOutputFrameSource(input.operationManifest.outputFrame))
      ? undefined
      : 'output frame',
  ].filter((value): value is string => Boolean(value))
  if (!sameStringSet(plan.sourceEvidence.privateArtifactIds, evidence.privateArtifactIds)) {
    mismatches.push('private artifact lineage')
  }
  if (!sameStringSet(plan.sourceEvidence.privateArtifactIds, input.operationManifest.sourceEvidenceArtifactIds ?? [])) {
    mismatches.push('manifest source evidence')
  }
  if (!sameStringSet(plan.skillSelections.map((selection) => selection.skillKey), input.skillPlan.selectedSkillKeys)) {
    mismatches.push('skill selection')
  }
  if (!sameStringMultiset(canonicalPlanOperationSignatures(plan), manifestOperationSignatures(input.operationManifest))) {
    mismatches.push('operation manifest')
  }
  if (mismatches.length > 0) {
    throw new ApiError(
      'VALIDATION_FAILED',
      `Approved plan does not match the canonical autonomous planning attempt: ${mismatches.join(', ')}.`,
      409,
    )
  }
  return structuredClone(plan)
}

function stripOutputFrameSource(
  frame: LocalEditPlanOperationManifestInput['outputFrame'],
): AutonomousEditPlanDraft['outputFrame'] | undefined {
  if (!frame) return undefined
  return {
    aspectRatio: frame.aspectRatio,
    platformTarget: frame.platformTarget,
    width: frame.width,
    height: frame.height,
    confirmed: true,
  }
}

function canonicalPlanOperationSignatures(plan: AutonomousEditPlanDraft): string[] {
  return plan.segments.flatMap((segment) => segment.operations.map((operation) => JSON.stringify({
    operationId: operation.operationId,
    instruction: operation.instruction,
    rationale: operation.rationale,
    skillKeys: [...operation.skillKeys].sort(),
    sourceEvidenceRefs: [...operation.sourceEvidenceRefs].sort(),
    sourceStartSeconds: segment.sourceStartSeconds,
    sourceEndSeconds: segment.sourceEndSeconds,
    executionSpec: operation.executionSpec,
  })))
}

function manifestOperationSignatures(manifest: LocalEditPlanOperationManifestInput): string[] {
  return manifest.operations.map((operation) => JSON.stringify({
    operationId: operation.operationId,
    instruction: operation.instruction,
    rationale: operation.rationale,
    skillKeys: [...(operation.skillKeys ?? [])].sort(),
    sourceEvidenceRefs: [...(operation.sourceEvidenceRefs ?? [])].sort(),
    sourceStartSeconds: operation.sourceStartSeconds,
    sourceEndSeconds: operation.sourceEndSeconds,
    executionSpec: operation.executionSpec,
  }))
}

function sameStringSet(left: string[], right: string[]): boolean {
  return JSON.stringify([...new Set(left)].sort()) === JSON.stringify([...new Set(right)].sort())
}

function sameStringMultiset(left: string[], right: string[]): boolean {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort())
}

function assertSafePlanText(input: CreateApprovedLocalEditPlanInput): void {
  const unsafeText = [
    input.planId,
    input.title,
    input.summary,
    input.briefLineage.briefId,
    input.briefLineage.briefFingerprint,
    input.directionSource,
    input.skillPlan.directionSummary,
    ...input.skillPlan.activities.flatMap((activity) => [
      activity.id,
      activity.label,
      activity.summary,
      ...activity.skillKeys,
    ]),
    ...input.skillPlan.blockedSkillKeys,
    ...input.skillPlan.selectedSkillKeys,
    ...input.skillPlan.warnings,
    input.source.bucketName,
    input.source.objectPath,
    input.source.fileName,
    ...input.steps.flatMap((step) => [step.label, step.summary]),
    input.operationManifest.sourceFileName,
    ...input.operationManifest.operations.flatMap((operation) => [
      operation.id,
      operation.label,
      operation.instruction,
      operation.sourceRangeLabel,
      operation.finalRangeLabel,
      ...operation.qaChecks,
      operation.executionSpec ? JSON.stringify(operation.executionSpec) : '',
    ]),
    ...input.operationManifest.requiredQaChecks,
    ...input.operationManifest.warnings,
    input.planningEvidence?.attemptId ?? '',
    ...(input.planningEvidence?.privateArtifactIds ?? []),
  ].find((value) => /service.?role|api.?key|secret|signed.?url|token|sk-[a-z0-9_-]+/i.test(value))

  if (unsafeText) {
    throw new ApiError('VALIDATION_FAILED', 'Approved local edit plan contains secret-like or signed URL text.', 400)
  }
}

function sanitizeSkillPlan(skillPlan: ProjectEditSkillPlanSummary): ProjectEditSkillPlanSummary {
  return {
    ...skillPlan,
    directionSummary: sanitizePlanText(skillPlan.directionSummary),
    activities: skillPlan.activities.map((activity) => ({
      ...activity,
      label: sanitizePlanText(activity.label),
      summary: sanitizePlanText(activity.summary),
      executionMode: 'planning_only',
      productReady: false,
    })),
    planningOnly: true,
    exposesInternalToolNames: false,
    productReady: false,
    warnings: skillPlan.warnings.map(sanitizePlanText),
  }
}

function sanitizeBriefLineage(briefLineage: LocalEditPlanBriefLineageInput): LocalEditPlanBriefLineageInput {
  return {
    briefId: sanitizePlanText(briefLineage.briefId),
    revisionNumber: Math.max(1, Math.floor(briefLineage.revisionNumber || 1)),
    briefFingerprint: sanitizePlanText(briefLineage.briefFingerprint),
  }
}

function sanitizePlanStep(step: LocalEditPlanStepInput): LocalEditPlanStepInput {
  return {
    label: sanitizePlanText(step.label),
    summary: sanitizePlanText(step.summary),
  }
}

function sanitizeOperationManifest(manifest: LocalEditPlanOperationManifestInput): LocalEditPlanOperationManifestInput {
  return {
    ...manifest,
    sourceFileName: sanitizePlanText(manifest.sourceFileName),
    sourceEvidenceArtifactIds: manifest.sourceEvidenceArtifactIds?.map(sanitizePlanText),
    outputFrame: manifest.outputFrame
      ? {
          ...manifest.outputFrame,
          width: Math.max(1, Math.floor(manifest.outputFrame.width)),
          height: Math.max(1, Math.floor(manifest.outputFrame.height)),
          confirmed: true,
        }
      : undefined,
    operations: manifest.operations.map((operation) => ({
      ...operation,
      id: sanitizePlanText(operation.id),
      label: sanitizePlanText(operation.label),
      instruction: sanitizePlanText(operation.instruction),
      sourceRangeLabel: sanitizePlanText(operation.sourceRangeLabel),
      finalRangeLabel: sanitizePlanText(operation.finalRangeLabel),
      qaChecks: operation.qaChecks.map(sanitizePlanText),
      operationId: operation.operationId,
      rationale: operation.rationale ? sanitizePlanText(operation.rationale) : undefined,
      skillKeys: operation.skillKeys ? [...operation.skillKeys] : undefined,
      sourceEvidenceRefs: operation.sourceEvidenceRefs?.map(sanitizePlanText),
      sourceStartSeconds: operation.sourceStartSeconds,
      sourceEndSeconds: operation.sourceEndSeconds,
      executionSpec: operation.executionSpec ? structuredClone(operation.executionSpec) : undefined,
      workerReady: false,
      productReady: false,
    })),
    requiredQaChecks: manifest.requiredQaChecks.map(sanitizePlanText),
    workerExecutionReady: false,
    productReady: false,
    warnings: manifest.warnings.map(sanitizePlanText),
  }
}

function sanitizePlanningEvidence(
  evidence: LocalEditPlanPlanningEvidenceInput,
): LocalEditPlanPlanningEvidenceInput {
  return {
    ...evidence,
    attemptId: sanitizePlanText(evidence.attemptId),
    privateArtifactIds: evidence.privateArtifactIds.map(sanitizePlanText),
  }
}

function sanitizePlanText(value: string): string {
  return String(sanitizeJson({ value }).value ?? value).trim()
}
