import type { ID, JSONObject } from '../../types/shared'
import {
  cloudValidationResult,
  hasNonEmptyString,
  inspectForSecretLikeValues,
} from './cloud-runtime-contracts'
import type { CloudValidationResult } from './cloud-runtime-contracts'
import type { GcsBucketPurpose, GcsObjectLocation } from './gcs-storage-contracts'
import { validateGcsObjectLocation } from './gcs-storage-contracts'

export type RemotionRenderType =
  | 'preview'
  | 'revision_preview'
  | 'final_export'
  | 'test_render'

export type RemotionRenderQualityLevel =
  | 'draft'
  | 'standard'
  | 'high'
  | 'final'

export type RemotionRenderOutputFormat =
  | 'mp4'
  | 'webm'
  | 'mov'
  | 'png_sequence'

export interface RemotionTimelineSpec {
  masterTimingPlanId?: ID
  frameLayoutPlanId?: ID
  captionTimingPlanId?: ID
  soundSyncTimingPlanId?: ID
  durationFrames?: number
  layers: JSONObject[]
  metadata?: JSONObject
}

export interface RemotionRenderApprovalGates {
  previewApproved?: boolean
  qaPassed?: boolean
  exportApproved?: boolean
}

export interface RemotionRenderWorkerRequest {
  renderJobId: ID
  jobId: ID
  workspaceId: ID
  projectId: ID
  approvedPlanSnapshotId: ID
  editPlanId: ID
  creditReservationId: ID
  renderType: RemotionRenderType
  renderQualityLevel: RemotionRenderQualityLevel
  outputFormat: RemotionRenderOutputFormat
  width: number
  height: number
  frameRate: number
  durationSeconds?: number
  timelineSpec: RemotionTimelineSpec
  sourceAssetLocations: GcsObjectLocation[]
  generatedAssetLocations: GcsObjectLocation[]
  outputBucketPurpose: GcsBucketPurpose
  outputObjectPath: string
  idempotencyKey: string
  approvalGates?: RemotionRenderApprovalGates
  metadata?: JSONObject
}

export const REMOTION_RENDERER_EXECUTION_RULES: string[] = [
  'Remotion is compositor/final canvas.',
  'AI models generate assets only.',
  'Remotion owns captions, frame layout, panels, safe zones, timing, transitions, and final assembly.',
  'Render jobs cannot run without an approved snapshot and reserved credits.',
  'Preview render is not final export.',
  'Final export requires preview, QA, and export approval gates.',
]

function validatePositiveNumber(value: number, label: string, errors: string[]): void {
  if (!Number.isFinite(value) || value <= 0) {
    errors.push(`${label} must be a positive number.`)
  }
}

export function validateRemotionRenderWorkerRequest(request: RemotionRenderWorkerRequest): CloudValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!hasNonEmptyString(request.renderJobId)) {
    errors.push('Remotion render request must include renderJobId.')
  }

  if (!hasNonEmptyString(request.jobId)) {
    errors.push('Remotion render request must include jobId.')
  }

  if (!hasNonEmptyString(request.approvedPlanSnapshotId)) {
    errors.push('Remotion render request must include approvedPlanSnapshotId.')
  }

  if (!hasNonEmptyString(request.creditReservationId)) {
    errors.push('Remotion render request must include creditReservationId.')
  }

  if (!hasNonEmptyString(request.idempotencyKey)) {
    errors.push('Remotion render request must include idempotencyKey.')
  }

  validatePositiveNumber(request.width, 'width', errors)
  validatePositiveNumber(request.height, 'height', errors)
  validatePositiveNumber(request.frameRate, 'frameRate', errors)

  if (request.durationSeconds !== undefined) {
    validatePositiveNumber(request.durationSeconds, 'durationSeconds', errors)
  }

  if (!request.timelineSpec || request.timelineSpec.layers.length === 0) {
    errors.push('Remotion render request must include timelineSpec layers.')
  }

  if (request.renderType === 'preview' && request.outputBucketPurpose === 'exports') {
    errors.push('Preview renders must not write to the exports bucket purpose.')
  }

  if (request.renderType === 'final_export') {
    if (request.outputBucketPurpose !== 'exports') {
      errors.push('Final export renders must write to the exports bucket purpose.')
    }

    if (request.approvalGates?.previewApproved !== true || request.approvalGates.qaPassed !== true || request.approvalGates.exportApproved !== true) {
      errors.push('Final export requires previewApproved, qaPassed, and exportApproved gates.')
    }
  }

  const outputLocation: GcsObjectLocation = {
    bucketPurpose: request.outputBucketPurpose,
    bucketName: 'runtime-validation-placeholder',
    objectPath: request.outputObjectPath,
    signedUrlRequired: true,
    publicUrlAllowed: false,
  }
  const outputLocationResult = validateGcsObjectLocation(outputLocation)
  errors.push(...outputLocationResult.errors)
  warnings.push(...outputLocationResult.warnings)

  request.sourceAssetLocations.forEach((location, index) => {
    const result = validateGcsObjectLocation(location)
    errors.push(...result.errors.map((error) => `sourceAssetLocations[${index}]: ${error}`))
    warnings.push(...result.warnings.map((warning) => `sourceAssetLocations[${index}]: ${warning}`))
  })

  request.generatedAssetLocations.forEach((location, index) => {
    const result = validateGcsObjectLocation(location)
    errors.push(...result.errors.map((error) => `generatedAssetLocations[${index}]: ${error}`))
    warnings.push(...result.warnings.map((warning) => `generatedAssetLocations[${index}]: ${warning}`))
  })

  const secretResult = inspectForSecretLikeValues(request)
  errors.push(...secretResult.errors)
  warnings.push(...secretResult.warnings)

  return cloudValidationResult(errors, warnings)
}
