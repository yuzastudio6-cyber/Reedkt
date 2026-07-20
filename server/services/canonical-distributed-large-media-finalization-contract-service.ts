import { ApiError } from '../errors/api-error'
import {
  CANONICAL_DISTRIBUTED_MEDIA_INGEST_OPERATION_ID,
  CANONICAL_DISTRIBUTED_MEDIA_INGEST_PROCESSING_POLICY_ID,
  CANONICAL_DISTRIBUTED_MEDIA_INGEST_WORKLOAD_PROFILE_ID,
  canonicalDistributedMediaIngestRateCardHash,
  canonicalDistributedMediaIngestSeedSchema,
  type CanonicalDistributedMediaIngestSeed,
} from '../distributed-media-ingest/canonical-distributed-media-ingest-state-port'
import {
  REEDITPRO_REFERENCE_MEDIA_MAX_BYTES,
  REEDITPRO_SOURCE_MEDIA_MAX_BYTES,
  shouldUseResumableUpload,
} from '../../src/types/large-media'
import { sha256AuthorityValue } from './private-edit-authority-store'
import type { UploadFinalizationCandidate } from './upload-service'
import { TOOL_COST_RATE_CARD_VERSION } from '../tool-cost-metering/rate-card'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const GIB = 1024 ** 3

export interface CanonicalDistributedLargeMediaFinalizationReadiness {
  schemaVersion: 'canonical-distributed-large-media-finalization-readiness-v1'
  sourceContractReady: true
  prePlanTechnicalIngestAuthority: true
  approvedPackageAuthorityReusedOrFabricated: false
  databaseTransactionAdapterReady: false
  cloudDispatchReady: false
  liveGcsWorkerReadReady: false
  productionRuntimeEnabled: false
  hostedUploadsAboveInlineCeilingAllowed: false
  productionReady: false
  readinessHash: string
}

export function createCanonicalDistributedLargeMediaFinalizationSeed(
  candidate: UploadFinalizationCandidate,
): CanonicalDistributedMediaIngestSeed {
  assertEligibleCandidate(candidate)
  const identityPayload = {
    authorityClass: 'pre_plan_technical_media_ingest' as const,
    operationId: CANONICAL_DISTRIBUTED_MEDIA_INGEST_OPERATION_ID,
    processingPolicyId: CANONICAL_DISTRIBUTED_MEDIA_INGEST_PROCESSING_POLICY_ID,
    ownerUserId: candidate.ownerUserId,
    workspaceId: candidate.workspaceId,
    projectId: candidate.projectId,
    uploadIntentId: candidate.uploadIntentId,
    uploadPurpose: candidate.uploadPurpose,
    expectedSizeBytes: candidate.expectedSizeBytes,
    storageMode: 'gcs' as const,
    uploadAuthorityFingerprint: candidate.authorityFingerprint,
  }
  const identity = {
    ...identityPayload,
    identityHash: sha256AuthorityValue(identityPayload),
  }
  const rateCardHash = canonicalDistributedMediaIngestRateCardHash()
  const policyPayload = {
    workerClass: 'media_ingest_worker' as const,
    region: 'us-east1' as const,
    maximumAttempts: 3 as const,
    leaseDurationMs: 5 * MINUTE,
    attemptDeadlineDurationMs: deriveAttemptDeadlineMs(candidate.expectedSizeBytes),
    minimumHeadroomBytes: Math.max(
      8 * GIB,
      Math.ceil(candidate.expectedSizeBytes * 0.1),
    ),
    resourceEnvelope: {
      vcpuCount: 4 as const,
      memoryGib: 8 as const,
      gpuCount: 0 as const,
    },
    workloadProfileId: CANONICAL_DISTRIBUTED_MEDIA_INGEST_WORKLOAD_PROFILE_ID,
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    rateCardHash,
  }
  const policy = {
    ...policyPayload,
    policyHash: sha256AuthorityValue(policyPayload),
  }
  const jobId = `media-ingest-${sha256AuthorityValue({
    domain: 'canonical_distributed_media_ingest_job_v1',
    identityHash: identity.identityHash,
  }).slice(0, 48)}`
  const seedPayload = {
    schemaVersion: 'canonical-distributed-media-ingest-seed-v1' as const,
    jobId,
    identity,
    policy,
  }
  return canonicalDistributedMediaIngestSeedSchema.parse({
    ...seedPayload,
    seedHash: sha256AuthorityValue(seedPayload),
  })
}

export function canonicalDistributedLargeMediaFinalizationReadiness():
CanonicalDistributedLargeMediaFinalizationReadiness {
  const payload = {
    schemaVersion: 'canonical-distributed-large-media-finalization-readiness-v1' as const,
    sourceContractReady: true as const,
    prePlanTechnicalIngestAuthority: true as const,
    approvedPackageAuthorityReusedOrFabricated: false as const,
    databaseTransactionAdapterReady: false as const,
    cloudDispatchReady: false as const,
    liveGcsWorkerReadReady: false as const,
    productionRuntimeEnabled: false as const,
    hostedUploadsAboveInlineCeilingAllowed: false as const,
    productionReady: false as const,
  }
  return {
    ...payload,
    readinessHash: sha256AuthorityValue(payload),
  }
}

function assertEligibleCandidate(candidate: UploadFinalizationCandidate): void {
  const purposeCeiling = candidate.uploadPurpose === 'source_media'
    ? REEDITPRO_SOURCE_MEDIA_MAX_BYTES
    : REEDITPRO_REFERENCE_MEDIA_MAX_BYTES
  if (
    candidate.storageMode !== 'gcs' ||
    !candidate.backgroundFinalizationRequired ||
    !shouldUseResumableUpload(candidate.expectedSizeBytes) ||
    !Number.isSafeInteger(candidate.expectedSizeBytes) ||
    candidate.expectedSizeBytes <= 0 ||
    candidate.expectedSizeBytes > purposeCeiling ||
    !['signed', 'uploaded'].includes(candidate.status) ||
    !/^[a-f0-9]{64}$/u.test(candidate.authorityFingerprint)
  ) {
    throw new ApiError(
      'SOURCE_MEDIA_NOT_READY',
      'Only one exact unfinished GCS large-media upload authority can enter distributed technical ingest.',
      409,
    )
  }
}

function deriveAttemptDeadlineMs(expectedSizeBytes: number): number {
  const sizeGiB = expectedSizeBytes / GIB
  return Math.round(Math.min(
    24 * HOUR,
    Math.max(30 * MINUTE, 30 * MINUTE + sizeGiB * 30_000),
  ))
}
