import type { ID, ISODateString, JSONObject, JSONValue } from '../../types/shared'
import {
  cloudValidationResult,
  hasNonEmptyString,
  inspectForSecretLikeValues,
} from './cloud-runtime-contracts'
import type { CloudValidationResult } from './cloud-runtime-contracts'

export type ApprovedSnapshotStatus =
  | 'draft'
  | 'approved'
  | 'execution_ready'
  | 'superseded'
  | 'revoked'
  | 'failed'

export interface ApprovedPlanSnapshotPayload {
  compiledIntent: JSONValue
  confirmedSettings: JSONObject
  sourceOrder: JSONValue[]
  professionalEditingDirective: JSONValue
  segmentOperations: JSONValue[]
  visualAssetPlan: JSONValue
  rendererPlan: JSONValue
  qaPlan: JSONValue
  providerRouting: JSONValue
  modelTierPolicy: JSONValue
  fallbackPolicy: JSONValue
  creditEstimate: JSONValue
  approvalRecord: JSONValue
  browserCapturePolicy?: JSONValue
  audioPolicy?: JSONValue
  renderPolicy?: JSONValue
}

export interface ApprovedPlanSnapshotRecord {
  id: ID
  workspaceId: ID
  projectId: ID
  chatSessionId: ID
  editPlanId: ID
  editPlanVersionId?: ID
  creditEstimateId: ID
  creditApprovalId?: ID
  creditReservationId?: ID
  snapshotStatus: ApprovedSnapshotStatus
  snapshotVersion: number
  snapshotHash: string
  approvedByUserId: ID
  approvedAt: ISODateString
  executionReadyAt?: ISODateString
  supersedesSnapshotId?: ID
  snapshotPayload: ApprovedPlanSnapshotPayload
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface ApprovedSnapshotWorkerValidationOptions {
  requiresCreditReservation?: boolean
}

export const APPROVED_SNAPSHOT_EXECUTION_RULE =
  'Workers execute approved snapshots, not raw chat.'

export const APPROVED_SNAPSHOT_CREDIT_RULE =
  'An approved snapshot must point to the exact credit estimate the user approved.'

export const APPROVED_SNAPSHOT_REVISION_RULE =
  'If a revision changes material instructions, create a new plan version and a new estimate before execution.'

export const APPROVED_SNAPSHOT_REQUIRED_PAYLOAD_FIELDS: (keyof ApprovedPlanSnapshotPayload)[] = [
  'compiledIntent',
  'confirmedSettings',
  'sourceOrder',
  'professionalEditingDirective',
  'segmentOperations',
  'visualAssetPlan',
  'rendererPlan',
  'qaPlan',
  'providerRouting',
  'modelTierPolicy',
  'fallbackPolicy',
  'creditEstimate',
  'approvalRecord',
]

export function validateApprovedPlanSnapshotForWorker(
  snapshot: ApprovedPlanSnapshotRecord,
  options: ApprovedSnapshotWorkerValidationOptions = {},
): CloudValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (snapshot.snapshotStatus !== 'approved' && snapshot.snapshotStatus !== 'execution_ready') {
    errors.push('Approved snapshot status must be approved or execution_ready before worker execution.')
  }

  if (!hasNonEmptyString(snapshot.snapshotHash)) {
    errors.push('Approved snapshot must include snapshotHash.')
  }

  if (!hasNonEmptyString(snapshot.editPlanId)) {
    errors.push('Approved snapshot must include editPlanId.')
  }

  if (!hasNonEmptyString(snapshot.creditEstimateId)) {
    errors.push('Approved snapshot must include creditEstimateId.')
  }

  if (!hasNonEmptyString(snapshot.approvedAt)) {
    errors.push('Approved snapshot must include approvedAt.')
  }

  if (options.requiresCreditReservation && !hasNonEmptyString(snapshot.creditReservationId)) {
    errors.push('creditReservationId is required for generation, render, and export workers.')
  }

  APPROVED_SNAPSHOT_REQUIRED_PAYLOAD_FIELDS.forEach((fieldName) => {
    if (snapshot.snapshotPayload[fieldName] === undefined || snapshot.snapshotPayload[fieldName] === null) {
      errors.push(`Approved snapshot payload is missing ${fieldName}.`)
    }
  })

  const secretResult = inspectForSecretLikeValues(snapshot.snapshotPayload)
  errors.push(...secretResult.errors)
  warnings.push(...secretResult.warnings)

  return cloudValidationResult(errors, warnings)
}
