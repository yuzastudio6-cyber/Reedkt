import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { createMockId, getRequiredAuthUserId, mockWarning, nowIso, sanitizeJson } from './service-helpers'

interface LocalEditPlanStepInput {
  label: string
  summary: string
}

interface LocalEditPlanCreditEstimateInput {
  lowCredits: number
  expectedCredits: number
  highCredits: number
  creditConversion: '1 credit = $0.10'
  serviceFeeIncluded: false
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
  creditEstimate: LocalEditPlanCreditEstimateInput
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
    summary: string
    title: string
  }
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

const mockApprovedLocalEditPlans = new Map<string, ApprovedLocalEditPlanRecord>()

export function createProjectEditPlanService(context: ServiceContext) {
  return {
    async createApprovedLocalEditPlan(input: CreateApprovedLocalEditPlanInput) {
      const approvedByUserId = getRequiredAuthUserId(context)
      assertSafePlanText(input)

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
          planId: input.planId,
          steps: input.steps.map((step) => sanitizePlanStep(step)),
          summary: sanitizePlanText(input.summary),
          title: sanitizePlanText(input.title),
        },
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
        warnings: [mockWarning('Approved local edit plan readback')],
      }
    },
  }
}

function assertSafePlanText(input: CreateApprovedLocalEditPlanInput): void {
  const unsafeText = [
    input.planId,
    input.title,
    input.summary,
    input.source.bucketName,
    input.source.objectPath,
    input.source.fileName,
    ...input.steps.flatMap((step) => [step.label, step.summary]),
  ].find((value) => /service.?role|api.?key|secret|signed.?url|token|sk-[a-z0-9_-]+/i.test(value))

  if (unsafeText) {
    throw new ApiError('VALIDATION_FAILED', 'Approved local edit plan contains secret-like or signed URL text.', 400)
  }
}

function sanitizePlanStep(step: LocalEditPlanStepInput): LocalEditPlanStepInput {
  return {
    label: sanitizePlanText(step.label),
    summary: sanitizePlanText(step.summary),
  }
}

function sanitizePlanText(value: string): string {
  return String(sanitizeJson({ value }).value ?? value).trim()
}
