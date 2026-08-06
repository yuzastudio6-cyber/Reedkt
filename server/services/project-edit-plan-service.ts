import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { createMockId, mockWarning, nowIso, sanitizeJson } from './service-helpers'
import { sha256AuthorityValue } from './private-edit-authority-store'
import { authorizeWorkspaceAccess } from './workspace-access-service'
import type {
  ProjectEditPlanDirectionSource,
  ProjectEditSkillPlanSummary,
} from '../../src/lib/project-edit-skill-aware-plan'

interface LocalEditPlanStepInput {
  label: string
  summary: string
}

interface LocalEditPlanSegmentOperationInput {
  id: string
  segmentRole: 'hook' | 'context' | 'main_body' | 'ending'
  operationType: 'trim' | 'cut' | 'caption' | 'color_grade' | 'audio_cleanup' | 'transition' | 'qa_check'
  label: string
  instruction: string
  sourceRangeLabel: string
  finalRangeLabel: string
  qaChecks: string[]
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
  version: 'project-edit-operation-manifest-v1'
  sourceFileName: string
  sourceDurationSeconds?: number
  sourceAspectRatio?: string
  outputFrame?: LocalEditPlanOutputFrameInput
  professionalBaseline: 'clean_professional'
  sourceOrderPolicy: 'preserve_source_order_until_user_approves_reorder'
  mediaIntelligenceStatus: 'not_analyzed_backend_local_only'
  operations: LocalEditPlanSegmentOperationInput[]
  requiredQaChecks: string[]
  workerExecutionReady: false
  productReady: false
  warnings: string[]
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

export interface LegacyLocalEditPlanAuthorityBoundary {
  schemaVersion: 'legacy-local-edit-plan-authority-boundary-v1'
  classification: 'legacy_local_preview_only'
  executionAllowed: false
  canonicalPlanAuthority: false
  approvedSnapshotAuthority: false
  creditReservationAuthority: false
  toolOrProviderAuthority: false
  canonicalPlanningHandoffRequired: true
  canonicalPublicationRequiresInternalService: true
  intentionalBlanketBlocksAllowed: false
  safeBlockerReductionAllowed: true
  blockerScopeType: 'unsafe_action_only'
  mustContinueSafeProgressWhenAvailable: true
  blockedDoesNotMeanStopAllWork: true
  blockedActionScope: string[]
  allowedForwardProgressScopes: string[]
}

interface StoredApprovedLocalEditPlan {
  record: ApprovedLocalEditPlanRecord
  requestHash: string
}

const mockApprovedLocalEditPlans = new Map<string, StoredApprovedLocalEditPlan>()

export function createLegacyLocalEditPlanAuthorityBoundary(): LegacyLocalEditPlanAuthorityBoundary {
  return {
    schemaVersion: 'legacy-local-edit-plan-authority-boundary-v1',
    classification: 'legacy_local_preview_only',
    executionAllowed: false,
    canonicalPlanAuthority: false,
    approvedSnapshotAuthority: false,
    creditReservationAuthority: false,
    toolOrProviderAuthority: false,
    canonicalPlanningHandoffRequired: true,
    canonicalPublicationRequiresInternalService: true,
    intentionalBlanketBlocksAllowed: false,
    safeBlockerReductionAllowed: true,
    blockerScopeType: 'unsafe_action_only',
    mustContinueSafeProgressWhenAvailable: true,
    blockedDoesNotMeanStopAllWork: true,
    blockedActionScope: [
      'canonical_plan_publication',
      'approved_snapshot_creation',
      'credit_reservation_or_spend',
      'tool_provider_worker_or_render_execution',
    ],
    allowedForwardProgressScopes: [
      'local_preview_contract_testing',
      'canonical_planning_handoff_preparation',
      'canonical_planning_handoff_inspection',
    ],
  }
}

export function createProjectEditPlanService(context: ServiceContext) {
  return {
    async createApprovedLocalEditPlan(input: CreateApprovedLocalEditPlanInput) {
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
      const approvedByUserId = access.userId
      assertSafePlanText(input)

      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Backend-local edit plan approval is mock-safe only until durable approved edit plan persistence is implemented.',
          409,
        )
      }

      const requestHash = sha256AuthorityValue(input)
      const recordKey = localEditPlanRecordKey(approvedByUserId, access.workspaceId, input.planId)
      const existing = mockApprovedLocalEditPlans.get(recordKey)
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'This legacy local plan identity is already bound to different preview-only content.',
            409,
          )
        }
        return {
          localEditPlan: {
            ...existing.record,
            readbackVerified: true,
          },
          authorityBoundary: createLegacyLocalEditPlanAuthorityBoundary(),
          warnings: [mockWarning('Approved local edit plan replay'), 'Existing backend-local approved plan record returned by plan id.'],
        }
      }

      const now = nowIso()
      const record: ApprovedLocalEditPlanRecord = {
        id: createMockId('local_edit_plan'),
        editPlanId: input.planId,
        creditEstimateId: `${input.planId}-credit-estimate`,
        workspaceId: access.workspaceId,
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
      mockApprovedLocalEditPlans.set(recordKey, { record, requestHash })

      return {
        localEditPlan: record,
        authorityBoundary: createLegacyLocalEditPlanAuthorityBoundary(),
        warnings: record.warnings,
      }
    },

    async getApprovedLocalEditPlan(planId: string, workspaceId: string) {
      const access = await authorizeWorkspaceAccess(context, workspaceId, 'read')
      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Backend-local edit plan readback is mock-safe only until durable approved edit plan persistence is implemented.',
          409,
        )
      }

      const stored = mockApprovedLocalEditPlans.get(localEditPlanRecordKey(access.userId, access.workspaceId, planId))
      if (!stored) {
        throw new ApiError('PLAN_NOT_APPROVED', 'Approved backend-local edit plan was not found for this workspace.', 404)
      }

      return {
        localEditPlan: {
          ...stored.record,
          readbackVerified: true,
        },
        authorityBoundary: createLegacyLocalEditPlanAuthorityBoundary(),
        warnings: [mockWarning('Approved local edit plan readback')],
      }
    },
  }
}

function localEditPlanRecordKey(ownerUserId: string, workspaceId: string, planId: string): string {
  return [ownerUserId, workspaceId, planId]
    .map((value) => `${value.length}:${value}`)
    .join('|')
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
    ]),
    ...input.operationManifest.requiredQaChecks,
    ...input.operationManifest.warnings,
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
      workerReady: false,
      productReady: false,
    })),
    requiredQaChecks: manifest.requiredQaChecks.map(sanitizePlanText),
    workerExecutionReady: false,
    productReady: false,
    warnings: manifest.warnings.map(sanitizePlanText),
  }
}

function sanitizePlanText(value: string): string {
  return String(sanitizeJson({ value }).value ?? value).trim()
}
