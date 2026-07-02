import {
  cloudValidationResult,
  containsSignedUrl,
  inspectForSecretLikeValues,
  mergeCloudValidationResults,
} from './cloud-runtime-contracts'
import type { CloudValidationResult } from './cloud-runtime-contracts'
import type { ApprovedPlanSnapshotRecord } from './approved-plan-snapshot-contracts'
import { validateApprovedPlanSnapshotForWorker } from './approved-plan-snapshot-contracts'
import type { GcsObjectLocation } from './gcs-storage-contracts'
import { validateGcsObjectLocation } from './gcs-storage-contracts'
import type { ProviderGatewayRequest } from './provider-gateway-contracts'
import { validateProviderGatewayRequest } from './provider-gateway-contracts'
import type { WorkerJobPayload } from './worker-job-contracts'
import { validateWorkerJobPayload } from './worker-job-contracts'

export function assertNoSecretLikeValues(object: unknown): CloudValidationResult {
  return inspectForSecretLikeValues(object)
}

export function assertWorkerPayloadIsSafe(payload: WorkerJobPayload): CloudValidationResult {
  const validationResult = validateWorkerJobPayload(payload)
  const signedUrlResult = containsSignedUrl(payload)
    ? cloudValidationResult(['Worker payload contains a signed URL. Use storage IDs and GCS object references instead.'])
    : cloudValidationResult()

  return mergeCloudValidationResults(validationResult, signedUrlResult)
}

export function assertApprovedSnapshotIsExecutionReady(snapshot: ApprovedPlanSnapshotRecord): CloudValidationResult {
  return validateApprovedPlanSnapshotForWorker(snapshot)
}

export function assertProviderRouteAllowedForTier(request: ProviderGatewayRequest): CloudValidationResult {
  return validateProviderGatewayRequest(request)
}

export function assertStorageLocationIsSafe(location: GcsObjectLocation): CloudValidationResult {
  return validateGcsObjectLocation(location)
}
