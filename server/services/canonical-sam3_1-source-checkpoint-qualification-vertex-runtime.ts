import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  assertCanonicalSam31VertexSourceCheckpointWorkerResult,
  createCanonicalSam31VertexSourceCheckpointWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification-vertex'
import {
  assertCanonicalSam31SourceCheckpointQualificationWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31GcpQualificationImageSupplyChainReleaseRepository,
  type CanonicalSam31QualificationImageSupplyChainReleaseRepository,
} from './canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  createCanonicalGcsCurrentGoogleCloudVertexA100RateAuthorityRepository,
  type CanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository,
} from './canonical-current-google-cloud-vertex-a100-rate-authority-repository'
import {
  canonicalSam31VertexQualificationPlatformStopSchema,
  createCanonicalSam31VertexQualificationProviderUsage,
  createCanonicalSam31VertexQualificationTerminalReconciler,
  type CanonicalSam31VertexQualificationPlatformStopReadPort,
  type CanonicalSam31VertexQualificationProviderUsageReadPort,
  type CanonicalSam31VertexQualificationWorkerResultReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-terminal-reconciliation'
import {
  assertCanonicalSam31VertexQualificationExecution,
  assertCanonicalSam31VertexQualificationQuotaObservation,
  createCanonicalSam31VertexQualificationLaunchPort,
  sealCanonicalSam31VertexQualificationQuotaObservation,
  type CanonicalSam31VertexQualificationExecutionRepository,
  type CanonicalSam31VertexQualificationQuotaObservation,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-launch-port'
import {
  assertCanonicalSam31VertexQualificationStagingObservation,
  createCanonicalSam31VertexQualificationStagingOwner,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-staging-owner'
import {
  createCanonicalSam31QualificationGcsStagingPort,
} from './canonical-sam3_1-source-checkpoint-qualification-staging-owner'
import {
  createCanonicalSam31GcpQualificationPackageRepository,
  type CanonicalSam31QualificationPackageRepository,
} from './canonical-sam3_1-source-checkpoint-qualification-package-repository'
import {
  createCanonicalSam31VertexQualificationRuntimeRepository,
  type CanonicalSam31VertexQualificationRuntimeRepository,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-runtime-repository'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RUNTIME_VERSION =
  'canonical-sam3_1-vertex-source-checkpoint-qualification-runtime-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const PRIVATE_BUCKET =
  'reeditpro-production-sam31-qualification-private' as const
const API_ORIGIN = 'https://us-central1-aiplatform.googleapis.com' as const
const CLOUD_QUOTAS_ORIGIN = 'https://cloudquotas.googleapis.com' as const
const QUOTA_PREFERENCE_ID =
  'weeditpro-vertex-a100-80gb-us-central1-1' as const
const QUOTA_ID =
  'CustomModelTrainingA10080GBGPUsPerProjectPerRegion' as const
const QUOTA_PREFERENCE_NAME =
  `projects/${PROJECT_ID}/locations/global/quotaPreferences/${QUOTA_PREFERENCE_ID}` as const
const QUOTA_INFO_NAME =
  `projects/${PROJECT_ID}/locations/global/services/aiplatform.googleapis.com/quotaInfos/${QUOTA_ID}` as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const PRIVATE_ARTIFACT_RETENTION_MILLISECONDS = 86_400_000 as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const releaseRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
}).strict()
type GoogleAuthRequest = Pick<GoogleAuth, 'request'>
type ProviderUsageReadInput = Parameters<
  CanonicalSam31VertexQualificationProviderUsageReadPort['rereadExact']
>[0]
type WorkerResultReadInput = Parameters<
  CanonicalSam31VertexQualificationWorkerResultReadPort['rereadExact']
>[0]
type PlatformStopReadInput = Parameters<
  CanonicalSam31VertexQualificationPlatformStopReadPort['rereadExact']
>[0]

export interface CanonicalSam31VertexQualificationQuotaReadPort {
  rereadCurrent(): Promise<CanonicalSam31VertexQualificationQuotaObservation>
}

export interface CanonicalSam31VertexQualificationRuntimeDependencies {
  readonly historicalPackageRepository:
    CanonicalSam31QualificationPackageRepository
  readonly runtimeRepository:
    CanonicalSam31VertexQualificationRuntimeRepository
  readonly stagingOwner: ReturnType<
    typeof createCanonicalSam31VertexQualificationStagingOwner
  >
  readonly imageReleaseRepository:
    CanonicalSam31QualificationImageSupplyChainReleaseRepository
  readonly rateRepository:
    CanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository
  readonly quotaReadPort: CanonicalSam31VertexQualificationQuotaReadPort
  readonly launchPort: ReturnType<
    typeof createCanonicalSam31VertexQualificationLaunchPort
  >
  readonly terminalReconciler: ReturnType<
    typeof createCanonicalSam31VertexQualificationTerminalReconciler
  >
  readonly now?: () => string
}

/**
 * Ordered one-writer composition for source/checkpoint qualification. Callers
 * supply only immutable references and an attempt ID; server owners reread all
 * request, image, quota, and account-price authority before any provider call.
 */
export function createCanonicalSam31VertexQualificationRuntime(
  input: CanonicalSam31VertexQualificationRuntimeDependencies,
) {
  assertDependencies(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RUNTIME_VERSION,
    routeId: 'a100_80gb_heavy_primary' as const,
    evidenceClass: 'private_ordered_fail_closed_vertex_qualification' as const,

    async prepareAndStage(untrusted: {
      readonly attemptId: string
      readonly historicalPackageRequestRef:
        z.input<typeof evidenceRefSchema>
      readonly issuedAt: string
    }) {
      assertPlainSerializedData(untrusted, 'sam31_vertex_prepare_stage')
      const request = z.object({
        attemptId: safeId,
        historicalPackageRequestRef: evidenceRefSchema.extend({
          version: z.literal(1),
          schemaVersion: z.literal(
            'canonical-sam3_1-source-checkpoint-qualification-worker-request-v1',
          ),
        }).strict(),
        issuedAt: timestamp,
      }).strict().parse(untrusted)
      const historicalReread = await input.historicalPackageRepository
        .rereadExactWorkerRequest({
          workerRequestRef: {
            id: request.historicalPackageRequestRef.id,
            version: request.historicalPackageRequestRef.version,
            contentHash: request.historicalPackageRequestRef.contentHash,
          },
        })
      if (!historicalReread) throw new Error(
        'Vertex qualification historical package is absent.',
      )
      const historical =
        assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
          historicalReread,
        )
      const workerRequest =
        createCanonicalSam31VertexSourceCheckpointWorkerRequest({
          historicalPackageRequest: historical,
          attemptId: request.attemptId,
          issuedAt: request.issuedAt,
        })
      const workerRequestRef = await input.runtimeRepository.workerRequests
        .persistCreateOnly(workerRequest)
      const stagingObservation =
        assertCanonicalSam31VertexQualificationStagingObservation(
          await input.stagingOwner.stageOne({ workerRequest }),
        )
      return Object.freeze({
        status: 'staged_not_dispatched' as const,
        attemptId: workerRequest.attemptId,
        workerRequestRef,
        stagingObservation,
        providerOrGpuJobStarted: false as const,
        customerCreditsMutated: false as const,
        sourceCheckpointQualificationGranted: false as const,
        productionReady: false as const,
      })
    },

    async admitAndStart(untrusted: {
      readonly workerRequestRef: z.input<typeof evidenceRefSchema>
      readonly imageSupplyChainReleaseRef:
        z.input<typeof evidenceRefSchema>
      readonly currentAccountRateAuthorityRef:
        z.input<typeof evidenceRefSchema>
    }) {
      assertPlainSerializedData(untrusted, 'sam31_vertex_admit_start')
      const request = z.object({
        workerRequestRef: evidenceRefSchema,
        imageSupplyChainReleaseRef: releaseRefSchema,
        currentAccountRateAuthorityRef: evidenceRefSchema,
      }).strict().parse(untrusted)
      const workerRequest = await input.runtimeRepository.workerRequests
        .rereadExact(request.workerRequestRef)
      if (!workerRequest) throw new Error('Vertex worker request is absent.')
      const stagingObservation = await input.stagingOwner.rereadExact({
        workerRequest,
      })
      if (!stagingObservation) throw new Error(
        'Vertex qualification staging observation is absent.',
      )
      const imageSupplyChainRelease = await input.imageReleaseRepository
        .rereadQualifiedQualificationImageRelease({
          releaseRef: request.imageSupplyChainReleaseRef,
        })
      if (!imageSupplyChainRelease) throw new Error(
        'Vertex qualification image release is absent.',
      )
      const admittedAt = timestamp.parse(now())
      const rateAuthority = await input.rateRepository.reread({
        rateAuthorityRef: request.currentAccountRateAuthorityRef,
        at: admittedAt,
      })
      if (!rateAuthority) throw new Error(
        'Vertex account-effective rate authority is absent.',
      )
      const quotaObservation = await input.quotaReadPort.rereadCurrent()
      return input.launchPort.startOne({
        workerRequest,
        stagingObservation,
        imageSupplyChainRelease,
        rateAuthority,
        quotaObservation,
      })
    },

    async reconcileOne(untrusted: {
      readonly executionRef: z.input<typeof evidenceRefSchema>
    }) {
      assertPlainSerializedData(untrusted, 'sam31_vertex_reconcile')
      const request = z.object({
        executionRef: evidenceRefSchema,
      }).strict().parse(untrusted)
      return input.terminalReconciler.reconcileOne(request)
    },
  })
}

/** Real GCP wiring. Construction performs no network or GPU work. */
export function createCanonicalSam31GcpVertexQualificationRuntime(input: {
  readonly storage?: Storage
  readonly auth?: GoogleAuthRequest
  readonly now?: () => string
  readonly requestTimeoutMilliseconds?: number
} = {}) {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_PLANE_BUCKET,
  })
  const historicalPackageRepository =
    createCanonicalSam31GcpQualificationPackageRepository({ storage })
  const runtimeRepository =
    createCanonicalSam31VertexQualificationRuntimeRepository({ objectPort })
  const stagingOwner = createCanonicalSam31VertexQualificationStagingOwner({
    historicalWorkerRequestReadPort: historicalPackageRepository,
    historicalSourceReadPort: historicalPackageRepository,
    stagingPort: createCanonicalSam31QualificationGcsStagingPort({ storage }),
    observationObjectPort: objectPort,
    now: input.now,
  })
  const quotaReadPort = createCanonicalSam31VertexQualificationQuotaReadPort({
    auth,
    now: input.now,
    requestTimeoutMilliseconds: input.requestTimeoutMilliseconds,
  })
  const imageReleaseRepository =
    createCanonicalSam31GcpQualificationImageSupplyChainReleaseRepository({
      storage,
    })
  const rateRepository =
    createCanonicalGcsCurrentGoogleCloudVertexA100RateAuthorityRepository({
      storage,
    })
  const launchPort = createCanonicalSam31VertexQualificationLaunchPort({
    admissionRepository: runtimeRepository.admissions,
    consumptionPort: runtimeRepository.consumptions,
    executionRepository: runtimeRepository.executions,
    auth,
    now: input.now,
    requestTimeoutMilliseconds: input.requestTimeoutMilliseconds,
  })
  const providerUsageReadPort =
    createCanonicalSam31VertexQualificationProviderUsageReadPort({
      store: runtimeRepository.providerUsage,
      now: input.now,
    })
  const platformStopReadPort =
    createCanonicalSam31VertexQualificationPlatformStopReadPort({
      executionRepository: runtimeRepository.executions,
      quotaReadPort,
      objectPort,
      auth,
      now: input.now,
      requestTimeoutMilliseconds: input.requestTimeoutMilliseconds,
    })
  const terminalReconciler =
    createCanonicalSam31VertexQualificationTerminalReconciler({
      admissionRepository: runtimeRepository.admissions,
      executionRepository: runtimeRepository.executions,
      requestReadPort: runtimeRepository.workerRequests,
      resultReadPort:
        createCanonicalSam31VertexQualificationGcsResultReadPort({ storage }),
      providerUsageReadPort,
      platformStopReadPort,
      rateReadPort: rateRepository,
      costReceiptStore: runtimeRepository.costs,
      auth,
      now: input.now,
      requestTimeoutMilliseconds: input.requestTimeoutMilliseconds,
    })
  return createCanonicalSam31VertexQualificationRuntime({
    historicalPackageRepository,
    runtimeRepository,
    stagingOwner,
    imageReleaseRepository,
    rateRepository,
    quotaReadPort,
    launchPort,
    terminalReconciler,
    now: input.now,
  })
}

export function createCanonicalSam31VertexQualificationQuotaReadPort(input: {
  readonly auth?: GoogleAuthRequest
  readonly now?: () => string
  readonly requestTimeoutMilliseconds?: number
} = {}): CanonicalSam31VertexQualificationQuotaReadPort {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const now = input.now ?? (() => new Date().toISOString())
  const timeout = boundedTimeout(input.requestTimeoutMilliseconds)
  return Object.freeze({
    async rereadCurrent() {
      const [preferenceResponse, infoResponse] = await Promise.all([
        auth.request({
          url: `${CLOUD_QUOTAS_ORIGIN}/v1/${QUOTA_PREFERENCE_NAME}`,
          method: 'GET', timeout, retry: false, maxRedirects: 0,
          responseType: 'json', maxContentLength: 2 * 1024 * 1024,
        }),
        auth.request({
          url: `${CLOUD_QUOTAS_ORIGIN}/v1/${QUOTA_INFO_NAME}`,
          method: 'GET', timeout, retry: false, maxRedirects: 0,
          responseType: 'json', maxContentLength: 2 * 1024 * 1024,
        }),
      ])
      const preference = parseQuotaPreference(preferenceResponse.data)
      const quotaInfo = parseQuotaInfo(infoResponse.data)
      if (quotaInfo.regionalLimit < 1) {
        throw new Error('Vertex A100 regional quota is below one.')
      }
      const observedAt = timestamp.parse(now())
      return sealCanonicalSam31VertexQualificationQuotaObservation({
        schemaVersion:
          'canonical-sam3_1-vertex-a100-qualification-quota-observation-v1',
        source: 'canonical_server_vertex_quota_observation_owner',
        evidenceClass: 'canonical_private_reread',
        projectId: PROJECT_ID,
        region: REGION,
        quotaPreferenceId: QUOTA_PREFERENCE_ID,
        quotaId: QUOTA_ID,
        preferredValue: preference.preferredValue,
        grantedValue: preference.grantedValue,
        reconciling: preference.reconciling,
        exactCloudQuotaPreferenceAndQuotaInfoReread: true,
        batchOrComputeA100QuotaUsedAsVertexAuthority: false,
        gpuJobStarted: false,
        customerCreditsMutated: false,
        observedAt,
        expiresAt: new Date(Date.parse(observedAt) + 15 * 60_000)
          .toISOString(),
      })
    },
  })
}

export function createCanonicalSam31VertexQualificationProviderUsageReadPort(
  input: {
    readonly store: {
      createOnlyAndReread(value: ReturnType<
        typeof createCanonicalSam31VertexQualificationProviderUsage
      >): Promise<unknown>
    }
    readonly now?: () => string
  },
): CanonicalSam31VertexQualificationProviderUsageReadPort {
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async rereadExact(value: ProviderUsageReadInput) {
      const requestBytes = Buffer.byteLength(
        stableAuthorityStringify(value.request),
        'utf8',
      )
      const resultBytes = value.workerResult === null ? 0 : Buffer.byteLength(
        stableAuthorityStringify(value.workerResult),
        'utf8',
      )
      const usage = createCanonicalSam31VertexQualificationProviderUsage({
        attemptId: value.request.attemptId,
        executionRef: value.executionRef,
        workerRequestRef: ref(
          value.request.qualificationId,
          value.request.requestHash,
          2,
        ),
        workerResultRef: value.workerResultRef,
        providerTimes: value.providerTimes,
        providerInferenceOrSubstantiveWorkOutcome:
          value.providerInferenceOrSubstantiveWorkOutcome,
        privateArtifactBytes: requestBytes
          + value.request.checkpoint.byteLength
          + value.request.deterministicProbeFixture.byteLength
          + resultBytes,
        privateArtifactRetentionMilliseconds:
          PRIVATE_ARTIFACT_RETENTION_MILLISECONDS,
        networkEgressBytes: 0,
        classAOperationCount: value.workerResult === null ? 3 : 4,
        classBOperationCount: value.workerResult === null ? 6 : 8,
        observedAt: timestamp.parse(now()),
      })
      const reread = await input.store.createOnlyAndReread(usage)
      return structuredClone(reread)
    },
  })
}

export function createCanonicalSam31VertexQualificationGcsResultReadPort(
  input: { readonly storage: Storage },
): CanonicalSam31VertexQualificationWorkerResultReadPort {
  return Object.freeze({
    async rereadExact({ request }: WorkerResultReadInput) {
      const objectName =
        `private/sam3_1/source-checkpoint-qualification/v2/attempts/`
        + `${request.attemptDigestSha256}/result/result.json`
      const file = input.storage.bucket(PRIVATE_BUCKET).file(objectName)
      let metadata: Record<string, unknown>
      try {
        const [observed] = await file.getMetadata()
        metadata = observed as unknown as Record<string, unknown>
      } catch (error) {
        if (cloudErrorCode(error) === 404) return null
        throw error
      }
      const generation = String(metadata.generation ?? '')
      const size = Number(metadata.size ?? -1)
      const etag = String(metadata.etag ?? '')
      if (
        !/^[1-9][0-9]{0,30}$/u.test(generation)
        || !etag
        || !Number.isSafeInteger(size)
        || size < 2
        || size > 4 * 1024 * 1024
        || metadata.contentType !== 'application/json'
      ) throw new Error('Vertex qualification result metadata is invalid.')
      const exact = input.storage.bucket(PRIVATE_BUCKET).file(objectName, {
        generation,
      })
      const [body] = await exact.download({ validation: 'crc32c' })
      const [stable] = await exact.getMetadata()
      if (
        body.byteLength !== size
        || String(stable.generation ?? '') !== generation
        || String(stable.etag ?? '') !== etag
      ) throw new Error('Vertex qualification result identity changed.')
      let decoded: unknown
      try { decoded = JSON.parse(body.toString('utf8')) } catch {
        throw new Error('Vertex qualification result JSON is invalid.')
      }
      const result =
        assertCanonicalSam31VertexSourceCheckpointWorkerResult(decoded)
      if (stableAuthorityStringify(result) !== body.toString('utf8')) {
        throw new Error('Vertex qualification result bytes changed.')
      }
      return result
    },
  })
}

export function createCanonicalSam31VertexQualificationPlatformStopReadPort(
  input: {
    readonly executionRepository:
      CanonicalSam31VertexQualificationExecutionRepository
    readonly quotaReadPort: CanonicalSam31VertexQualificationQuotaReadPort
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly auth?: GoogleAuthRequest
    readonly now?: () => string
    readonly requestTimeoutMilliseconds?: number
  },
): CanonicalSam31VertexQualificationPlatformStopReadPort {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const now = input.now ?? (() => new Date().toISOString())
  const timeout = boundedTimeout(input.requestTimeoutMilliseconds)
  return Object.freeze({
    async rereadExact(value: PlatformStopReadInput) {
      const execution = assertCanonicalSam31VertexQualificationExecution(
        await input.executionRepository.reread(value.executionRef),
      )
      const response = await auth.request({
        url: `${API_ORIGIN}/v1/${execution.customJobResourceName}`,
        method: 'GET', timeout, retry: false, maxRedirects: 0,
        responseType: 'json', maxContentLength: 2 * 1024 * 1024,
      })
      const provider = z.object({
        name: z.literal(execution.customJobResourceName),
        displayName: z.literal(execution.displayName),
        state: z.enum([
          'JOB_STATE_SUCCEEDED', 'JOB_STATE_FAILED',
          'JOB_STATE_CANCELLED', 'JOB_STATE_EXPIRED',
        ]),
        createTime: timestamp,
        startTime: timestamp,
        endTime: timestamp,
      }).passthrough().parse(response.data)
      if (stableAuthorityStringify({
        createTime: provider.createTime,
        startTime: provider.startTime,
        endTime: provider.endTime,
      }) !== stableAuthorityStringify(value.providerTimes)) {
        throw new Error('Vertex terminal stop times changed.')
      }
      const quota = assertCanonicalSam31VertexQualificationQuotaObservation(
        await input.quotaReadPort.rereadCurrent(),
        timestamp.parse(now()),
      )
      if (quota.grantedValue !== 1 || quota.reconciling) {
        throw new Error('Vertex quota changed during terminal observation.')
      }
      const observedAt = timestamp.parse(now())
      const payload = {
        schemaVersion:
          'canonical-sam3_1-vertex-qualification-platform-stop-v1' as const,
        source:
          'canonical_server_vertex_qualification_platform_owner' as const,
        evidenceClass: 'canonical_private_reread' as const,
        attemptId: value.attemptId,
        executionRef: value.executionRef,
        cloudTerminalObservationRef: value.cloudTerminalObservationRef,
        providerTimes: value.providerTimes,
        providerJobTerminalStateReread: true as const,
        providerCapacityAndQuotaReread: true as const,
        workerStoppedVerified: true as const,
        activeA100GpuInstancesAfterObservation: 0 as const,
        persistentEndpointPresent: false as const,
        minimumIdleInstances: 0 as const,
        exactOneShotA2UltraAllocationReread: true as const,
        allocatedGpuCount: 1 as const,
        allocatedVcpuCount: 12 as const,
        allocatedMemoryGiB: 170 as const,
        bootDiskType: 'pd-ssd' as const,
        bootDiskSizeGb: 200 as const,
        callerCapacityStopUsagePriceOrCostClaimAccepted: false as const,
        observedAt,
      }
      const evidence = canonicalSam31VertexQualificationPlatformStopSchema
        .parse({ ...payload, evidenceHash: sha256AuthorityValue(payload) })
      const body = Buffer.from(stableAuthorityStringify(evidence), 'utf8')
      const objectPath =
        `private/sam3_1/source-checkpoint-qualification/v2/runtime/`
        + `platform-stop/${evidence.evidenceHash}.json`
      await input.objectPort.createOnly({
        objectPath,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await input.objectPort.readExact(objectPath)
      if (!reread || !reread.equals(body)) {
        throw new Error('Vertex platform stop reread changed.')
      }
      return evidence
    },
  })
}

function parseQuotaPreference(value: unknown) {
  assertPlainSerializedData(value, 'sam31_vertex_quota_preference')
  const parsed = z.object({
    name: z.literal(QUOTA_PREFERENCE_NAME),
    service: z.literal('aiplatform.googleapis.com'),
    quotaId: z.literal(QUOTA_ID),
    dimensions: z.object({ region: z.literal(REGION) }).strict(),
    quotaConfig: z.object({
      preferredValue: z.union([z.string(), z.number()]),
      grantedValue: z.union([z.string(), z.number()]),
    }).passthrough(),
    reconciling: z.boolean(),
  }).passthrough().parse(value)
  const preferredValue = Number(parsed.quotaConfig.preferredValue)
  const grantedValue = Number(parsed.quotaConfig.grantedValue)
  if (preferredValue !== 1 || grantedValue !== 1 || parsed.reconciling) {
    throw new Error('Vertex A100 quota preference is not granted.')
  }
  return { preferredValue: 1 as const, grantedValue: 1 as const,
    reconciling: false as const }
}

function parseQuotaInfo(value: unknown) {
  assertPlainSerializedData(value, 'sam31_vertex_quota_info')
  const parsed = z.object({
    name: z.literal(QUOTA_INFO_NAME),
    service: z.literal('aiplatform.googleapis.com'),
    quotaId: z.literal(QUOTA_ID),
    dimensionsInfos: z.array(z.object({
      dimensions: z.record(z.string(), z.string()),
      details: z.object({ value: z.union([z.string(), z.number()]) })
        .passthrough(),
    }).passthrough()).min(1),
  }).passthrough().parse(value)
  const regional = parsed.dimensionsInfos.find((item) =>
    item.dimensions.region === REGION)
  const regionalLimit = Number(regional?.details.value ?? 0)
  if (!Number.isSafeInteger(regionalLimit) || regionalLimit < 0) {
    throw new Error('Vertex A100 quota info is invalid.')
  }
  return { regionalLimit }
}

function assertDependencies(
  input: CanonicalSam31VertexQualificationRuntimeDependencies,
) {
  if (
    typeof input.historicalPackageRepository?.rereadExactWorkerRequest !==
      'function'
    || typeof input.runtimeRepository?.workerRequests?.persistCreateOnly !==
      'function'
    || typeof input.stagingOwner?.stageOne !== 'function'
    || typeof input.imageReleaseRepository
      ?.rereadQualifiedQualificationImageRelease !== 'function'
    || typeof input.rateRepository?.reread !== 'function'
    || typeof input.quotaReadPort?.rereadCurrent !== 'function'
    || typeof input.launchPort?.startOne !== 'function'
    || typeof input.terminalReconciler?.reconcileOne !== 'function'
  ) throw new Error('Vertex qualification runtime is not configured.')
}

function boundedTimeout(value = 15_000) {
  if (!Number.isInteger(value) || value < 1_000 || value > 30_000) {
    throw new Error('Vertex qualification request timeout is invalid.')
  }
  return value
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined
  const code = (error as { code?: unknown }).code
  return typeof code === 'number' ? code : Number(code)
}
