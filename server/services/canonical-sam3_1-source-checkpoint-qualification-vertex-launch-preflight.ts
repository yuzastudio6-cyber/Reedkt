import { z } from 'zod'

import {
  assertCanonicalSam31QualificationImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-qualification-image-supply-chain-release'
import {
  assertCanonicalSam31SourceCheckpointQualificationWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  calculateCanonicalA100VertexInfrastructureCost,
  createCanonicalA100VertexProviderAllocationUsage,
} from '../tool-cost-metering/canonical-a100-vertex-attempt-cost-authority'
import {
  createCanonicalSam31GcpQualificationImageSupplyChainReleaseRepository,
  type CanonicalSam31QualificationImageSupplyChainReleaseRepository,
} from './canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  createCanonicalGcsCurrentGoogleCloudVertexA100RateAuthorityRepository,
  type CanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository,
} from './canonical-current-google-cloud-vertex-a100-rate-authority-repository'
import {
  createCanonicalSam31GcpQualificationPackageRepository,
  type CanonicalSam31QualificationPackageRepository,
} from './canonical-sam3_1-source-checkpoint-qualification-package-repository'
import {
  assertCanonicalSam31VertexQualificationQuotaObservation,
  type CanonicalSam31VertexQualificationQuotaObservation,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-launch-port'
import {
  createCanonicalSam31VertexQualificationQuotaReadPort,
  type CanonicalSam31VertexQualificationQuotaReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-runtime'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_LAUNCH_PREFLIGHT_VERSION =
  'canonical-sam3_1-vertex-qualification-launch-preflight-v1' as const

const MAXIMUM_EXECUTION_SECONDS = 7_200 as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const blockerCodeSchema = z.enum([
  'historical_package_missing',
  'qualification_image_release_missing',
  'current_rate_authority_missing_or_expired',
  'vertex_a100_quota_missing_or_stale',
  'package_image_release_lineage_mismatch',
])
const requestSchema = z.object({
  historicalPackageRequestRef: evidenceRefSchema,
  imageSupplyChainReleaseRef: evidenceRefSchema,
  currentAccountRateAuthorityRef: evidenceRefSchema,
}).strict()
const resultFields = {
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_LAUNCH_PREFLIGHT_VERSION),
  source: z.literal(
    'canonical_server_sam3_1_vertex_qualification_launch_preflight'),
  evidenceClass: z.literal('read_only_exact_canonical_reread'),
  disposition: z.enum([
    'ready_for_explicit_paid_launch_authorization',
    'blocked_canonical_inputs_not_current',
  ]),
  historicalPackageRequestRef: evidenceRefSchema,
  imageSupplyChainReleaseRef: evidenceRefSchema,
  currentAccountRateAuthorityRef: evidenceRefSchema,
  quotaObservationRef: evidenceRefSchema.nullable(),
  blockerCodes: z.array(blockerCodeSchema).max(5),
  maximumExecutionSeconds: z.literal(MAXIMUM_EXECUTION_SECONDS),
  maximumComputeAndProratedBootDiskCostUsdNanos:
    z.number().int().nonnegative().safe().nullable(),
  variablePrivateObjectStorageAndOperationsCostIncluded: z.literal(false),
  automaticRetryAllowed: z.literal(false),
  exactCanonicalInputsReread: z.boolean(),
  packageImageReleaseLineageMatched: z.boolean(),
  providerOrGpuJobStarted: z.literal(false),
  packageOrStagingRecordCreated: z.literal(false),
  customerCreditsMutated: z.literal(false),
  billingSettlementPerformed: z.literal(false),
  sourceCheckpointQualificationGranted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
} as const
function validateResultSemantics(
  value: z.infer<ReturnType<typeof createResultWithoutHashSchema>>,
  context: z.RefinementCtx,
): void {
  const ready = value.blockerCodes.length === 0
    && value.quotaObservationRef !== null
    && value.maximumComputeAndProratedBootDiskCostUsdNanos !== null
    && value.exactCanonicalInputsReread
    && value.packageImageReleaseLineageMatched
  if (ready !== (value.disposition ===
    'ready_for_explicit_paid_launch_authorization')) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 launch preflight disposition is inconsistent.',
    })
  }
}
function createResultWithoutHashSchema() {
  return z.object(resultFields).strict()
}
const resultWithoutHashSchema = createResultWithoutHashSchema()
  .superRefine(validateResultSemantics)
const resultSchema = z.object({
  ...resultFields,
  preflightHash: z.string().regex(/^[a-f0-9]{64}$/u),
}).strict().superRefine(validateResultSemantics)

export type CanonicalSam31VertexQualificationLaunchPreflightRequest =
  z.infer<typeof requestSchema>
export type CanonicalSam31VertexQualificationLaunchPreflightResult =
  z.infer<typeof resultSchema>

export interface CanonicalSam31VertexQualificationLaunchPreflightService {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_VERTEX_QUALIFICATION_LAUNCH_PREFLIGHT_VERSION
  inspect(input: CanonicalSam31VertexQualificationLaunchPreflightRequest):
    Promise<CanonicalSam31VertexQualificationLaunchPreflightResult>
}

export function createCanonicalSam31VertexQualificationLaunchPreflightService(
  input: {
    readonly historicalPackageRepository:
      CanonicalSam31QualificationPackageRepository
    readonly imageReleaseRepository:
      CanonicalSam31QualificationImageSupplyChainReleaseRepository
    readonly rateRepository:
      CanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository
    readonly quotaReadPort: CanonicalSam31VertexQualificationQuotaReadPort
    readonly now?: () => string
  },
): CanonicalSam31VertexQualificationLaunchPreflightService {
  assertDependencies(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_QUALIFICATION_LAUNCH_PREFLIGHT_VERSION,
    async inspect(
      untrusted: CanonicalSam31VertexQualificationLaunchPreflightRequest,
    ) {
      assertPlainSerializedData(untrusted, 'sam31_vertex_launch_preflight')
      const request = requestSchema.parse(untrusted)
      const blockers: z.infer<typeof blockerCodeSchema>[] = []
      const [historicalRaw, imageRaw, quotaRaw] = await Promise.all([
        input.historicalPackageRepository.rereadExactWorkerRequest({
          workerRequestRef: request.historicalPackageRequestRef,
        }),
        input.imageReleaseRepository
          .rereadQualifiedQualificationImageRelease({
          releaseRef: request.imageSupplyChainReleaseRef,
        }),
        input.quotaReadPort.rereadCurrent().catch(() => null),
      ])
      const observedAt = timestamp.parse(now())
      const rate = await input.rateRepository.reread({
        rateAuthorityRef: request.currentAccountRateAuthorityRef,
        at: observedAt,
      })
      let quota: CanonicalSam31VertexQualificationQuotaObservation | null = null
      try {
        if (quotaRaw === null) throw new Error('quota unavailable')
        quota = assertCanonicalSam31VertexQualificationQuotaObservation(
          quotaRaw, observedAt,
        )
      } catch {
        blockers.push('vertex_a100_quota_missing_or_stale')
      }
      if (!historicalRaw) blockers.push('historical_package_missing')
      if (!imageRaw) blockers.push('qualification_image_release_missing')
      if (!rate) blockers.push('current_rate_authority_missing_or_expired')

      let lineageMatched = false
      if (historicalRaw && imageRaw) {
        const historical =
          assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
            historicalRaw,
          )
        const image =
          assertCanonicalSam31QualificationImageSupplyChainRelease(imageRaw)
        lineageMatched = historical.qualificationImage.immutableImageDigest
            === image.immutableImageDigest
          && sameRef(historical.qualificationImage.artifactRef,
            image.immutableImageRef)
          && sameRef(historical.qualificationImage.supplyChainReleaseRef,
            request.imageSupplyChainReleaseRef)
          && image.authority.qualificationImageSupplyChainQualified
          && image.authority.sourceCheckpointQualificationImageAdmissible
          && !image.authority.sourceCheckpointQualificationGranted
          && !image.authority.gpuQualificationJobDispatched
        if (!lineageMatched) {
          blockers.push('package_image_release_lineage_mismatch')
        }
      }

      const maximumCost = rate
        ? calculateMaximumCost(rate, observedAt)
        : null
      const exactCanonicalInputsReread = historicalRaw !== null
        && imageRaw !== null
        && rate !== null
        && quota !== null
        && maximumCost !== null
      const ready = blockers.length === 0 && exactCanonicalInputsReread
      const payload = resultWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_VERTEX_QUALIFICATION_LAUNCH_PREFLIGHT_VERSION,
        source:
          'canonical_server_sam3_1_vertex_qualification_launch_preflight',
        evidenceClass: 'read_only_exact_canonical_reread',
        disposition: ready
          ? 'ready_for_explicit_paid_launch_authorization'
          : 'blocked_canonical_inputs_not_current',
        historicalPackageRequestRef: request.historicalPackageRequestRef,
        imageSupplyChainReleaseRef: request.imageSupplyChainReleaseRef,
        currentAccountRateAuthorityRef:
          request.currentAccountRateAuthorityRef,
        quotaObservationRef: quota ? {
          id: `sam31-vertex-quota-${quota.observationHash.slice(0, 24)}`,
          version: 1,
          contentHash: `sha256:${quota.observationHash}`,
        } : null,
        blockerCodes: blockers,
        maximumExecutionSeconds: MAXIMUM_EXECUTION_SECONDS,
        maximumComputeAndProratedBootDiskCostUsdNanos: maximumCost,
        variablePrivateObjectStorageAndOperationsCostIncluded: false,
        automaticRetryAllowed: false,
        exactCanonicalInputsReread,
        packageImageReleaseLineageMatched: lineageMatched,
        providerOrGpuJobStarted: false,
        packageOrStagingRecordCreated: false,
        customerCreditsMutated: false,
        billingSettlementPerformed: false,
        sourceCheckpointQualificationGranted: false,
        runtimeReleaseGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        observedAt,
      })
      return Object.freeze(resultSchema.parse({
        ...payload,
        preflightHash: sha256AuthorityValue(payload),
      }))
    },
  })
}

export function createCanonicalSam31GcpVertexQualificationLaunchPreflightService(
): CanonicalSam31VertexQualificationLaunchPreflightService {
  return createCanonicalSam31VertexQualificationLaunchPreflightService({
    historicalPackageRepository:
      createCanonicalSam31GcpQualificationPackageRepository(),
    imageReleaseRepository:
      createCanonicalSam31GcpQualificationImageSupplyChainReleaseRepository(),
    rateRepository:
      createCanonicalGcsCurrentGoogleCloudVertexA100RateAuthorityRepository(),
    quotaReadPort: createCanonicalSam31VertexQualificationQuotaReadPort(),
  })
}

export function parseCanonicalSam31VertexQualificationLaunchPreflightResult(
  value: unknown,
): CanonicalSam31VertexQualificationLaunchPreflightResult {
  assertPlainSerializedData(value, 'sam31_vertex_launch_preflight_result')
  const parsed = resultSchema.parse(value)
  const { preflightHash, ...payload } = parsed
  if (preflightHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 launch preflight hash is invalid.')
  }
  return structuredClone(parsed)
}

function calculateMaximumCost(
  rateAuthority: Parameters<
    typeof calculateCanonicalA100VertexInfrastructureCost
  >[0]['rateAuthority'],
  observedAt: string,
): number {
  const startedAt = new Date(Date.parse(observedAt) + 1).toISOString()
  const endedAt = new Date(
    Date.parse(startedAt) + MAXIMUM_EXECUTION_SECONDS * 1_000,
  ).toISOString()
  const usage = createCanonicalA100VertexProviderAllocationUsage({
    providerCreateTime: observedAt,
    providerStartTime: startedAt,
    providerEndTime: endedAt,
    privateArtifactBytes: 0,
    privateArtifactRetentionMilliseconds: 0,
    networkEgressBytes: 0,
  })
  const cost = calculateCanonicalA100VertexInfrastructureCost({
    rateAuthority,
    usage,
    at: observedAt,
  })
  return cost.vertexTrainingA10080GbUsdNanos
    + cost.vertexTrainingA2CoreUsdNanos
    + cost.vertexTrainingA2RamUsdNanos
    + cost.vertexTrainingPdSsdUsdNanos
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertDependencies(input: {
  historicalPackageRepository: CanonicalSam31QualificationPackageRepository
  imageReleaseRepository:
    CanonicalSam31QualificationImageSupplyChainReleaseRepository
  rateRepository: CanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository
  quotaReadPort: CanonicalSam31VertexQualificationQuotaReadPort
}): void {
  if (typeof input.historicalPackageRepository
    ?.rereadExactWorkerRequest !== 'function'
    || typeof input.imageReleaseRepository
      ?.rereadQualifiedQualificationImageRelease !== 'function'
    || typeof input.rateRepository?.reread !== 'function'
    || typeof input.quotaReadPort?.rereadCurrent !== 'function') {
    throw new Error('SAM 3.1 launch preflight dependencies are incomplete.')
  }
}
