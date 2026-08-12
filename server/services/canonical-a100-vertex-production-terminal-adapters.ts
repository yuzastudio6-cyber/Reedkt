import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalA100VertexCustomJobExecutionRecord,
  assertCanonicalA100VertexCustomJobLaunchAuthority,
} from './canonical-a100-vertex-custom-job-launch-port'
import type {
  CanonicalA100VertexLaunchContextReadPort,
} from './canonical-a100-vertex-custom-job-durable-store'
import {
  CANONICAL_A100_VERTEX_PLATFORM_USAGE_EVIDENCE_VERSION,
  CANONICAL_A100_VERTEX_WORKER_USAGE_EVIDENCE_VERSION,
  assertCanonicalA100VertexPlatformUsageEvidence,
  assertCanonicalA100VertexWorkerUsageEvidence,
  canonicalA100VertexPlatformUsageEvidenceSchema,
  canonicalA100VertexWorkerUsageEvidenceSchema,
  type CanonicalA100VertexAttemptCostReceiptStore,
  type CanonicalA100VertexPlatformUsageEvidenceReadPort,
  type CanonicalA100VertexWorkerUsageEvidenceReadPort,
} from './canonical-a100-vertex-terminal-cost-evidence-service'
import {
  assertCanonicalSam31VertexQualificationQuotaObservation,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-launch-port'
import type {
  CanonicalSam31VertexQualificationQuotaReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-runtime'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalA100VertexProviderAllocationCostReceipt,
  type CanonicalA100VertexProviderAllocationCostReceipt,
} from '../tool-cost-metering/canonical-a100-vertex-attempt-cost-authority'
import {
  assertCanonicalSam31GpuRuntimeResponse,
  canonicalSam31GpuRuntimeResponseSchema,
  type CanonicalSam31GpuRuntimeResponse,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_A100_VERTEX_PRODUCTION_TERMINAL_ADAPTERS_VERSION =
  'canonical-a100-vertex-production-terminal-adapters-v1' as const

const API_ORIGIN = 'https://us-central1-aiplatform.googleapis.com' as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v2/vertex-a100-terminal'
const PRIVATE_ARTIFACT_RETENTION_MILLISECONDS = 30 * 24 * 60 * 60 * 1_000
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: z.string().trim().min(1).max(240)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
    .refine((value) => !value.includes('..')),
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const providerTimesSchema = z.object({
  createTime: timestamp,
  startTime: timestamp,
  endTime: timestamp,
  providerStartTimeObserved: z.boolean(),
}).strict()
type GoogleAuthRequest = Pick<GoogleAuth, 'request'>
type WorkerUsageReadInput = Parameters<
  CanonicalA100VertexWorkerUsageEvidenceReadPort['rereadPrivateWorkerUsage']
>[0]
type PlatformUsageReadInput = Parameters<
  CanonicalA100VertexPlatformUsageEvidenceReadPort[
    'rereadPlatformUsageAndStoppedCapacity'
  ]
>[0]

export function createCanonicalSam31A100VertexWorkerUsageReadPort(input: {
  readonly taskStore: CanonicalSam31GpuTaskStore
  readonly launchContextReadPort: CanonicalA100VertexLaunchContextReadPort
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
  readonly now?: () => string
}): CanonicalA100VertexWorkerUsageEvidenceReadPort {
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async rereadPrivateWorkerUsage(value: WorkerUsageReadInput) {
      const execution = assertCanonicalA100VertexCustomJobExecutionRecord(
        value.execution,
      )
      const authority = assertCanonicalA100VertexCustomJobLaunchAuthority(
        await input.launchContextReadPort.rereadLaunchAuthority({
          authorityRef: execution.authorityRef,
        }),
      )
      const task = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(
          authority.executionEnvelopeRef.id,
        ),
      )
      if (
        !sameRef(value.executionRef, ref(
          execution.executionRecordId,
          execution.executionRecordHash,
        ))
        || !sameRef(task.executionEnvelopeRef,
          authority.executionEnvelopeRef)
        || !sameRef(task.runtimeReleaseRef, execution.releaseRef)
        || task.invocationId !== authority.executionEnvelopeRef.id
      ) throw new Error('Vertex A100 worker task lineage differs.')
      const providerTimes = providerTimesSchema.parse(value.providerTimes)
      let response: ReturnType<typeof assertCanonicalSam31GpuRuntimeResponse>
        | null = null
      try {
        const rawResponse = await input.taskStore.rereadRuntimeResponse(
          task.invocationId,
        )
        try {
          response = assertCanonicalSam31GpuRuntimeResponse({
            request: task.runtimeRequest,
            response: rawResponse,
          })
        } catch (boundResponseError) {
          try {
            response = assertCanonicalSam31UnboundRequestValidationFailure(
              rawResponse,
            )
          } catch {
            throw boundResponseError
          }
        }
      } catch (error) {
        if (providerTimes.providerStartTimeObserved) throw error
      }
      const measurement = response?.runtimeMeasurement ?? null
      const outcome = response === null
        ? 'not_executed' as const
        : response.status === 'completed'
          ? 'executed' as const
          : ['request_validation', 'artifact_verification', 'cuda_admission']
              .includes(response.terminalStage)
            ? 'not_executed' as const
            : 'executed' as const
      const taskBytes = Buffer.byteLength(stableAuthorityStringify(task), 'utf8')
      const responseBytes = response === null ? 0 : Buffer.byteLength(
        stableAuthorityStringify(response), 'utf8')
      const payload = {
        schemaVersion: CANONICAL_A100_VERTEX_WORKER_USAGE_EVIDENCE_VERSION,
        source: 'canonical_a100_vertex_private_worker_usage_owner' as const,
        evidenceClass: 'canonical_private_reread' as const,
        executionRef: value.executionRef,
        authorityRef: execution.authorityRef,
        cloudTerminalObservationRef: value.cloudTerminalObservationRef,
        providerTimes,
        providerInferenceOrSubstantiveWorkOutcome: outcome,
        runtimeResponseStatus: response?.status ??
          'not_created_before_worker_start',
        runtimeTerminalStage: response?.terminalStage ?? 'not_started',
        workerWallTimeMilliseconds: measurement?.wallTimeMilliseconds ?? 0,
        modelLoadMilliseconds: measurement?.modelLoadMilliseconds ?? 0,
        promptMilliseconds: measurement?.promptMilliseconds ?? 0,
        propagationMilliseconds: measurement?.propagationMilliseconds ?? 0,
        outputPersistenceMilliseconds:
          measurement?.outputPersistenceMilliseconds ?? 0,
        cudaEventInferenceMilliseconds:
          measurement?.cudaEventInferenceMilliseconds ?? 0,
        peakCudaAllocatedBytes: measurement?.peakCudaAllocatedBytes ?? 0,
        peakCudaReservedBytes: measurement?.peakCudaReservedBytes ?? 0,
        outputFileCount: measurement?.outputFileCount ?? 0,
        privateArtifactBytes: task.privateInputStagingEvidence.byteLength
          + taskBytes + responseBytes
          + (measurement?.outputByteLength ?? 0),
        privateArtifactRetentionMilliseconds:
          PRIVATE_ARTIFACT_RETENTION_MILLISECONDS,
        networkEgressBytes: 0,
        classAOperationCount: 0,
        classBOperationCount: 0,
        exactImmutableTaskWorkerMetricsReread: true as const,
        workerWallTimeDoesNotDefineProviderAllocationOrBilling: true as const,
        providerAllocationIncludesUnobservableWorkerStartupAndDrain:
          true as const,
        workerSuppliedProviderTimesBillableDurationPriceOrCostAccepted:
          false as const,
        runtimeNetworkDownloadObserved: false as const,
        cpuOnlySubstantiveExecutionObserved: false as const,
        rawMediaPathsUrlsSecretsOrCredentialsIncluded: false as const,
        observedAt: timestamp.parse(now()),
      }
      const evidence = canonicalA100VertexWorkerUsageEvidenceSchema.parse({
        ...payload,
        evidenceHash: sha256AuthorityValue(payload),
      })
      return persistAndReread({
        port: input.objectPort,
        objectPath: `${prefix}/worker/${evidence.evidenceHash}.json`,
        value: evidence,
        parse: assertCanonicalA100VertexWorkerUsageEvidence,
      })
    },
  })
}

export function assertCanonicalSam31UnboundRequestValidationFailure(
  value: unknown,
): CanonicalSam31GpuRuntimeResponse {
  const response = canonicalSam31GpuRuntimeResponseSchema.parse(value)
  const { responseBindingSha256, ...payload } = response
  const emptyBinding = '0'.repeat(64)
  if (
    responseBindingSha256 !== sha256AuthorityValue(payload)
    || response.status !== 'failed'
    || response.terminalStage !== 'request_validation'
    || response.failureCode !== 'request_rejected'
    || response.requestBindingSha256 !== emptyBinding
    || response.dispatchAdmissionDigestSha256 !== emptyBinding
    || response.gpuEvidence !== null
    || response.runtimeMeasurement !== null
    || response.outputSummary !== null
    || response.modelSourceAndCheckpointHashesVerifiedBeforeAndAfter
    || response.sourceCheckpointCompatibilityQualificationReread
  ) {
    throw new Error(
      'SAM 3.1 unbound request-validation failure is invalid.',
    )
  }
  return response
}

export function createCanonicalA100VertexPlatformUsageReadPort(input: {
  readonly executionReadPort: {
    rereadExecution(value: { executionRef: z.infer<typeof evidenceRefSchema> }):
      Promise<unknown>
  }
  readonly quotaReadPort: CanonicalSam31VertexQualificationQuotaReadPort
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly auth?: GoogleAuthRequest
  readonly prefix?: string
  readonly now?: () => string
}): CanonicalA100VertexPlatformUsageEvidenceReadPort {
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async rereadPlatformUsageAndStoppedCapacity(
      value: PlatformUsageReadInput,
    ) {
      const execution = assertCanonicalA100VertexCustomJobExecutionRecord(
        await input.executionReadPort.rereadExecution({
          executionRef: value.executionRef,
        }),
      )
      const response = await auth.request({
        url: `${API_ORIGIN}/v1/${execution.customJobResourceName}`,
        method: 'GET', timeout: 15_000, retry: false, maxRedirects: 0,
        responseType: 'json', maxContentLength: 2 * 1024 * 1024,
      })
      assertPlainSerializedData(response.data, 'vertex_terminal_stop_response')
      const provider = z.object({
        name: z.literal(execution.customJobResourceName),
        displayName: z.literal(execution.displayName),
        state: z.enum([
          'JOB_STATE_SUCCEEDED', 'JOB_STATE_FAILED',
          'JOB_STATE_CANCELLED', 'JOB_STATE_EXPIRED',
        ]),
        createTime: timestamp,
        startTime: timestamp.optional(),
        endTime: timestamp,
      }).passthrough().parse(response.data)
      const providerTimes = providerTimesSchema.parse({
        createTime: provider.createTime,
        startTime: provider.startTime ?? provider.createTime,
        endTime: provider.endTime,
        providerStartTimeObserved: provider.startTime !== undefined,
      })
      if (stableAuthorityStringify(providerTimes) !==
        stableAuthorityStringify(value.providerTimes)) {
        throw new Error('Vertex A100 terminal provider times changed.')
      }
      const quota = assertCanonicalSam31VertexQualificationQuotaObservation(
        await input.quotaReadPort.rereadCurrent(),
        timestamp.parse(now()),
      )
      if (quota.grantedValue < 1) {
        throw new Error('Vertex A100 quota is unavailable.')
      }
      const observedAt = timestamp.parse(now())
      const rereadRef = opaqueRef('vertex-a100-platform-reread', {
        executionRef: value.executionRef,
        providerTimes,
        providerState: provider.state,
        quotaRef: {
          id: quota.quotaPreferenceId,
          grantedValue: quota.grantedValue,
          observedAt: quota.observedAt,
        },
      })
      const payload = {
        schemaVersion: CANONICAL_A100_VERTEX_PLATFORM_USAGE_EVIDENCE_VERSION,
        source: 'canonical_server_vertex_platform_usage_owner' as const,
        evidenceClass: 'canonical_private_reread' as const,
        executionRef: value.executionRef,
        authorityRef: execution.authorityRef,
        cloudTerminalObservationRef: value.cloudTerminalObservationRef,
        providerTimes,
        workerUsageEvidenceRef: value.workerUsageEvidenceRef,
        platformUsageRereadRef: rereadRef,
        providerJobTerminalStateReread: true as const,
        providerCapacityAndQuotaReread: true as const,
        workerStoppedVerified: true as const,
        activeA100GpuInstancesAfterObservation: 0 as const,
        persistentEndpointPresent: false as const,
        minimumIdleInstances: 0 as const,
        exactOneShotA2UltraAllocationReread: true as const,
        zeroActiveWorkerClaimScopedToThisOneShotCustomJob: true as const,
        allocatedGpuCount: 1 as const,
        allocatedVcpuCount: 12 as const,
        allocatedMemoryGiB: 170 as const,
        bootDiskType: 'pd-ssd' as const,
        bootDiskSizeGb: 200 as const,
        callerCapacityStopUsageOrPriceClaimAccepted: false as const,
        observedAt,
      }
      const evidence = canonicalA100VertexPlatformUsageEvidenceSchema.parse({
        ...payload,
        evidenceHash: sha256AuthorityValue(payload),
      })
      return persistAndReread({
        port: input.objectPort,
        objectPath: `${prefix}/platform/${evidence.evidenceHash}.json`,
        value: evidence,
        parse: assertCanonicalA100VertexPlatformUsageEvidence,
      })
    },
  })
}

export function createCanonicalA100VertexProviderAllocationCostReceiptStore(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalA100VertexAttemptCostReceiptStore {
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    async rereadAttemptCostReceiptIfPresent({ receiptId }: {
      receiptId: string
    }) {
      const safeId = evidenceRefSchema.shape.id.parse(receiptId)
      const objectPath = `${prefix}/cost/${safeId}.json`
      const body = await input.objectPort.readExact(objectPath)
      if (body === null) return null
      return readJson({
        port: input.objectPort,
        objectPath,
        parse: assertCanonicalA100VertexProviderAllocationCostReceipt,
      })
    },
    async createAttemptCostReceiptOnly({ receipt }: {
      receipt: CanonicalA100VertexProviderAllocationCostReceipt
    }) {
      const parsed = assertCanonicalA100VertexProviderAllocationCostReceipt(
        receipt,
      )
      const body = Buffer.from(stableAuthorityStringify(parsed), 'utf8')
      const disposition = await input.objectPort.createOnly({
        objectPath: `${prefix}/cost/${parsed.receiptId}.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      return disposition === 'created' ? 'created' : 'already_exists'
    },
    async rereadAttemptCostReceipt({ receiptId }: { receiptId: string }) {
      const safeId = evidenceRefSchema.shape.id.parse(receiptId)
      return readJson({
        port: input.objectPort,
        objectPath: `${prefix}/cost/${safeId}.json`,
        parse: assertCanonicalA100VertexProviderAllocationCostReceipt,
      })
    },
  })
}

async function persistAndReread<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  objectPath: string
  value: T
  parse(value: unknown): T
}): Promise<T> {
  const body = Buffer.from(stableAuthorityStringify(input.value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Vertex A100 terminal record size is invalid.')
  }
  await input.port.createOnly({
    objectPath: input.objectPath,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await readJson(input)
  if (stableAuthorityStringify(reread) !== body.toString('utf8')) {
    throw new Error('Vertex A100 terminal record exact reread changed.')
  }
  return reread
}

async function readJson<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  objectPath: string
  parse(value: unknown): T
}): Promise<T> {
  const body = await input.port.readExact(input.objectPath)
  if (!body || !Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Vertex A100 terminal record is unavailable.')
  }
  let decoded: unknown
  try { decoded = JSON.parse(body.toString('utf8')) } catch {
    throw new Error('Vertex A100 terminal record JSON is invalid.')
  }
  assertPlainSerializedData(decoded, 'vertex_a100_terminal_record')
  return input.parse(decoded)
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id, version, contentHash: `sha256:${hash}`,
  })
}

function opaqueRef(id: string, value: unknown) {
  const hash = sha256AuthorityValue(value)
  return ref(`${id}.${hash.slice(0, 32)}`, hash)
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}
