import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_A100_VERTEX_CUSTOM_JOB_RELEASE_VERSION =
  'canonical-a100-vertex-custom-job-release-v1' as const
export const CANONICAL_A100_VERTEX_CUSTOM_JOB_LAUNCH_AUTHORITY_VERSION =
  'canonical-a100-vertex-custom-job-launch-authority-v1' as const
export const CANONICAL_A100_VERTEX_CUSTOM_JOB_CONSUMPTION_VERSION =
  'canonical-a100-vertex-custom-job-consumption-v1' as const
export const CANONICAL_A100_VERTEX_CUSTOM_JOB_EXECUTION_RECORD_VERSION =
  'canonical-a100-vertex-custom-job-execution-record-v1' as const
export const CANONICAL_A100_VERTEX_CUSTOM_JOB_LAUNCH_RESULT_VERSION =
  'canonical-a100-vertex-custom-job-launch-result-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const API_ORIGIN = 'https://us-central1-aiplatform.googleapis.com' as const
const CUSTOM_JOB_PARENT =
  'projects/reeditpro/locations/us-central1' as const
const QUOTA_PREFERENCE_ID =
  'weeditpro-vertex-a100-80gb-us-central1-1' as const
const QUOTA_ID =
  'CustomModelTrainingA10080GBGPUsPerProjectPerRegion' as const
const OPERATION_ID = 'tool.sam3_1.segment_and_track_subject.v1' as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const serviceAccountEmail = z.string().trim().max(180).regex(
  /^[a-z][a-z0-9-]{0,62}@reeditpro\.iam\.gserviceaccount\.com$/u,
)
const immutableImageUri = z.string().trim().max(512).regex(
  /^us-central1-docker\.pkg\.dev\/reeditpro\/[a-z0-9._-]+\/[a-z0-9._/-]+@sha256:[a-f0-9]{64}$/u,
)
const customJobResourceName = z.string().regex(
  /^projects\/(?:reeditpro|390722338345)\/locations\/us-central1\/customJobs\/[0-9]+$/u,
)

const releaseWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_A100_VERTEX_CUSTOM_JOB_RELEASE_VERSION,
  ),
  source: z.literal(
    'canonical_server_a100_vertex_custom_job_release_registry',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  releaseRef: evidenceRefSchema,
  routeId: z.literal('a100_80gb_heavy_primary'),
  executionTarget: z.literal(
    'google_cloud_vertex_custom_job_a2_ultra',
  ),
  projectId: z.literal(PROJECT_ID),
  region: z.literal(REGION),
  customJobParent: z.literal(CUSTOM_JOB_PARENT),
  serviceAccountEmail,
  serviceIdentityRef: evidenceRefSchema,
  immutableImageUri,
  immutableImageRef: evidenceRefSchema,
  immutableImageDigest: prefixedSha256,
  imageSupplyChainReleaseRef: evidenceRefSchema,
  sourceCheckpointQualificationRef: evidenceRefSchema,
  privateArtifactTransportRef: evidenceRefSchema,
  privateNetworkPeeringQualificationRef: evidenceRefSchema,
  networkResource: z.literal(
    'projects/390722338345/global/networks/weeditpro-gpu-private',
  ),
  encryptionKeyResource: z.literal(
    'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification',
  ),
  currentRateAuthorityRef: evidenceRefSchema,
  quotaPreferenceObservationRef: evidenceRefSchema,
  quotaPreferenceId: z.literal(QUOTA_PREFERENCE_ID),
  quotaId: z.literal(QUOTA_ID),
  quotaPreferredValue: z.literal(1),
  quotaGrantedValue: z.literal(1),
  quotaReconciling: z.literal(false),
  machineType: z.literal('a2-ultragpu-1g'),
  acceleratorType: z.literal('NVIDIA_A100_80GB'),
  acceleratorCount: z.literal(1),
  replicaCount: z.literal(1),
  bootDiskType: z.literal('pd-ssd'),
  bootDiskSizeGb: z.literal(200),
  maximumExecutionSeconds: z.number().int().min(60).max(7_200),
  persistentResourceAllowed: z.literal(false),
  persistentEndpointAllowed: z.literal(false),
  publicIpExecutionAllowed: z.literal(false),
  privateIpAndVPCPeeringRequired: z.literal(true),
  runtimeNetworkDownloadAllowed: z.literal(false),
  callerImageCommandArgsEnvironmentOrModelSelectionAllowed: z.literal(false),
  containerEntrypointFromImmutableImageOnly: z.literal(true),
  oneWorkerPoolOnly: z.literal(true),
  oneReplicaOnly: z.literal(true),
  restartJobOnWorkerRestart: z.literal(false),
  automaticRetryAllowed: z.literal(false),
  minimumIdleInstances: z.literal(0),
  startsOnlyFromDurablyConsumedApprovedAuthority: z.literal(true),
  stopsAtTerminalAttempt: z.literal(true),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  qualifiedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((release, context) => {
  const imageDigest = release.immutableImageUri.match(
    /@sha256:([a-f0-9]{64})$/u,
  )?.[1]
  if (
    release.immutableImageDigest !== `sha256:${imageDigest ?? ''}`
    || release.immutableImageRef.contentHash !== release.immutableImageDigest
    || Date.parse(release.expiresAt) <= Date.parse(release.qualifiedAt)
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex A100 release lost image or expiry lineage.',
  })
})

export const canonicalA100VertexCustomJobReleaseSchema =
  releaseWithoutHashSchema.extend({ configurationHash: sha256 }).strict()
export type CanonicalA100VertexCustomJobRelease = z.infer<
  typeof canonicalA100VertexCustomJobReleaseSchema
>

const authorityWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_A100_VERTEX_CUSTOM_JOB_LAUNCH_AUTHORITY_VERSION,
  ),
  source: z.literal('canonical_professional_gpu_dispatch_owner'),
  authorityId: safeId,
  toolId: z.literal('sam3_1'),
  operationId: z.literal(OPERATION_ID),
  routeId: z.literal('a100_80gb_heavy_primary'),
  executionTarget: z.literal(
    'google_cloud_vertex_custom_job_a2_ultra',
  ),
  releaseRef: evidenceRefSchema,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  approvedSnapshotRef: evidenceRefSchema,
  confirmedOutputFrameRef: evidenceRefSchema,
  masterTimingRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  workerLeaseRef: evidenceRefSchema,
  fundedReservationRef: evidenceRefSchema,
  approvedEstimateRef: evidenceRefSchema,
  userApprovalRecordRef: evidenceRefSchema,
  userTriggerRecordRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  executionEnvelopeRef: evidenceRefSchema,
  currentRateAuthorityRef: evidenceRefSchema,
  maximumReservedToolCostCredits: z.number().int().nonnegative().safe(),
  exactSnapshotWorkLeaseReservationTriggerReleaseAndRateReread:
    z.literal(true),
  createOnlyDurableConsumptionRequiredBeforeProviderCall: z.literal(true),
  oneAuthorityMayCreateAtMostOneCustomJob: z.literal(true),
  retryAfterUnknownCreateOutcomeAllowed: z.literal(false),
  userTriggeredScaleFromZero: z.literal(true),
  noApprovedAuthorityMeansZeroGpuJobs: z.literal(true),
  callerImageCommandArgsEnvironmentOrModelAccepted: z.literal(false),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  admittedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((authority, context) => {
  if (Date.parse(authority.expiresAt) <= Date.parse(authority.admittedAt)) {
    context.addIssue({ code: 'custom', message: 'Launch authority expired.' })
  }
})

export const canonicalA100VertexCustomJobLaunchAuthoritySchema =
  authorityWithoutHashSchema.extend({ authorityHash: sha256 }).strict()
export type CanonicalA100VertexCustomJobLaunchAuthority = z.infer<
  typeof canonicalA100VertexCustomJobLaunchAuthoritySchema
>

const consumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_A100_VERTEX_CUSTOM_JOB_CONSUMPTION_VERSION,
  ),
  source: z.literal('canonical_a100_vertex_custom_job_launch_port'),
  authorityRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  executionEnvelopeRef: evidenceRefSchema,
  customJobCreateRequestRef: evidenceRefSchema,
  consumedBeforeProviderCall: z.literal(true),
  createOnlyAndExactReread: z.literal(true),
  oneConsumptionMayCreateAtMostOneCustomJob: z.literal(true),
  automaticRetryAfterUnknownAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  consumedAt: timestamp,
}).strict()
export const canonicalA100VertexCustomJobConsumptionSchema =
  consumptionWithoutHashSchema.extend({ consumptionHash: sha256 }).strict()
export type CanonicalA100VertexCustomJobConsumption = z.infer<
  typeof canonicalA100VertexCustomJobConsumptionSchema
>

const executionRecordWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_A100_VERTEX_CUSTOM_JOB_EXECUTION_RECORD_VERSION,
  ),
  source: z.literal('canonical_a100_vertex_custom_job_launch_port'),
  executionRecordId: safeId,
  authorityRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  consumptionRef: evidenceRefSchema,
  customJobCreateRequestRef: evidenceRefSchema,
  customJobResourceName,
  displayName: safeId,
  initialState: z.enum(['JOB_STATE_PENDING', 'JOB_STATE_QUEUED']),
  providerResponseDigestSha256: sha256,
  createResponsePersistedAndExactReread: z.literal(true),
  terminalStateClaimed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  persistedAt: timestamp,
}).strict()
export const canonicalA100VertexCustomJobExecutionRecordSchema =
  executionRecordWithoutHashSchema.extend({ executionRecordHash: sha256 })
    .strict()
export type CanonicalA100VertexCustomJobExecutionRecord = z.infer<
  typeof canonicalA100VertexCustomJobExecutionRecordSchema
>

const launchResultWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_A100_VERTEX_CUSTOM_JOB_LAUNCH_RESULT_VERSION,
  ),
  source: z.literal('canonical_a100_vertex_custom_job_launch_port'),
  authorityRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  consumptionRef: evidenceRefSchema.nullable(),
  customJobCreateRequestRef: evidenceRefSchema,
  customJobExecutionRef: evidenceRefSchema.nullable(),
  disposition: z.enum([
    'accepted',
    'rejected_before_creation',
    'outcome_unknown_requires_reconciliation',
  ]),
  providerInferenceOrSubstantiveWorkKnownExecuted: z.enum([
    'not_executed',
    'unknown',
  ]),
  providerCallStarted: z.boolean(),
  automaticRetryAllowed: z.literal(false),
  exactTerminalRereadRequired: z.literal(true),
  exactUsageAndAccountEffectiveCostRereadRequired: z.literal(true),
  minimumIdleInstances: z.literal(0),
  persistentEndpointCreated: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((result, context) => {
  const exact = result.disposition === 'accepted'
    ? result.consumptionRef !== null
      && result.customJobExecutionRef !== null
      && result.providerCallStarted
      && result.providerInferenceOrSubstantiveWorkKnownExecuted ===
        'not_executed'
    : result.disposition === 'rejected_before_creation'
      ? result.consumptionRef === null
        && result.customJobExecutionRef === null
        && !result.providerCallStarted
        && result.providerInferenceOrSubstantiveWorkKnownExecuted ===
          'not_executed'
      : result.consumptionRef !== null
        && result.providerCallStarted
        && result.providerInferenceOrSubstantiveWorkKnownExecuted === 'unknown'
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'Vertex launch result lost safe outcome semantics.',
  })
})
export const canonicalA100VertexCustomJobLaunchResultSchema =
  launchResultWithoutHashSchema.extend({ resultHash: sha256 }).strict()
export type CanonicalA100VertexCustomJobLaunchResult = z.infer<
  typeof canonicalA100VertexCustomJobLaunchResultSchema
>

export interface CanonicalA100VertexCustomJobConsumptionPort {
  consumeCreateOnlyAndReread(
    record: CanonicalA100VertexCustomJobConsumption,
  ): Promise<unknown>
}

export interface CanonicalA100VertexCustomJobExecutionRepository {
  createOnlyAndReread(
    record: CanonicalA100VertexCustomJobExecutionRecord,
  ): Promise<unknown>
}

type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export function createCanonicalA100VertexCustomJobLaunchPort(input: {
  readonly consumptionPort: CanonicalA100VertexCustomJobConsumptionPort
  readonly executionRepository: CanonicalA100VertexCustomJobExecutionRepository
  readonly auth?: GoogleAuthRequest
  readonly now?: () => string
  readonly requestTimeoutMilliseconds?: number
}) {
  const auth = input.auth ?? new GoogleAuth({
    scopes: [CLOUD_PLATFORM_SCOPE],
  })
  const now = input.now ?? (() => new Date().toISOString())
  const timeout = input.requestTimeoutMilliseconds ?? 15_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 30_000) {
    throw new Error('Vertex A100 create timeout is invalid.')
  }

  return Object.freeze({
    async startOneShotJob(request: {
      readonly authority: unknown
      readonly release: unknown
    }): Promise<CanonicalA100VertexCustomJobLaunchResult> {
      const observedAt = now()
      let authority: CanonicalA100VertexCustomJobLaunchAuthority | null = null
      let release: CanonicalA100VertexCustomJobRelease | null = null
      let prepared: ReturnType<typeof prepareCreateRequest> | null = null
      let consumption: CanonicalA100VertexCustomJobConsumption | null = null
      let providerCallStarted = false
      try {
        authority = assertCanonicalA100VertexCustomJobLaunchAuthority(
          request.authority,
        )
        release = assertCanonicalA100VertexCustomJobRelease(request.release)
        assertAuthorityReleaseMatch(authority, release, observedAt)
        prepared = prepareCreateRequest({ authority, release })
        consumption = createConsumption({
          authority,
          release,
          createRequestRef: prepared.createRequestRef,
          consumedAt: observedAt,
        })
        const reread = assertCanonicalA100VertexCustomJobConsumption(
          await input.consumptionPort.consumeCreateOnlyAndReread(consumption),
        )
        if (stableAuthorityStringify(reread) !==
          stableAuthorityStringify(consumption)) {
          throw new Error('Vertex consumption reread changed.')
        }
        providerCallStarted = true
        const response = await auth.request({
          url: prepared.url,
          method: 'POST',
          data: prepared.body,
          timeout,
          retry: false,
          maxRedirects: 0,
          responseType: 'json',
          maxContentLength: 2 * 1024 * 1024,
        })
        const createResponse = parseCreateResponse({
          untrusted: response.data,
          prepared,
        })
        const executionRecord = createExecutionRecord({
          authority,
          release,
          consumption,
          createRequestRef: prepared.createRequestRef,
          createResponse,
          persistedAt: observedAt,
        })
        const rereadExecution = assertCanonicalA100VertexCustomJobExecutionRecord(
          await input.executionRepository.createOnlyAndReread(executionRecord),
        )
        if (stableAuthorityStringify(rereadExecution) !==
          stableAuthorityStringify(executionRecord)) {
          throw new Error('Vertex execution record reread changed.')
        }
        return launchResult({
          authority,
          release,
          consumption,
          createRequestRef: prepared.createRequestRef,
          customJobExecutionRef: ref(
            executionRecord.executionRecordId,
            executionRecord.executionRecordHash,
          ),
          disposition: 'accepted',
          providerCallStarted: true,
          substantiveWork: 'not_executed',
          observedAt,
        })
      } catch {
        const safeAuthority = authority
        const safeRelease = release
        const fallbackHash = sha256AuthorityValue({
          authority: safeAuthority?.authorityHash ?? 'unvalidated',
          release: safeRelease?.configurationHash ?? 'unvalidated',
          observedAt,
        })
        const fallbackRef = evidenceRefSchema.parse({
          id: `vertex-a100-create.${fallbackHash.slice(0, 32)}`,
          version: 1,
          contentHash: `sha256:${fallbackHash}`,
        })
        const fallbackAuthorityRef = safeAuthority
          ? ref(safeAuthority.authorityId, safeAuthority.authorityHash)
          : fallbackRef
        const fallbackReleaseRef = safeRelease?.releaseRef ?? fallbackRef
        return launchResult({
          authorityRef: fallbackAuthorityRef,
          releaseRef: fallbackReleaseRef,
          consumption: providerCallStarted ? consumption : null,
          createRequestRef: prepared?.createRequestRef ?? fallbackRef,
          customJobExecutionRef: null,
          disposition: providerCallStarted
            ? 'outcome_unknown_requires_reconciliation'
            : 'rejected_before_creation',
          providerCallStarted,
          substantiveWork: providerCallStarted ? 'unknown' : 'not_executed',
          observedAt,
        })
      }
    },
  })
}

export function assertCanonicalA100VertexCustomJobRelease(
  value: unknown,
): CanonicalA100VertexCustomJobRelease {
  assertPlainSerializedData(value, 'vertex_a100_release')
  const release = canonicalA100VertexCustomJobReleaseSchema.parse(value)
  const { configurationHash, ...payload } = release
  if (configurationHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex A100 release hash is invalid.')
  }
  return release
}

export function assertCanonicalA100VertexCustomJobLaunchAuthority(
  value: unknown,
): CanonicalA100VertexCustomJobLaunchAuthority {
  assertPlainSerializedData(value, 'vertex_a100_launch_authority')
  const authority =
    canonicalA100VertexCustomJobLaunchAuthoritySchema.parse(value)
  const { authorityHash, ...payload } = authority
  if (authorityHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex A100 launch authority hash is invalid.')
  }
  return authority
}

export function assertCanonicalA100VertexCustomJobConsumption(
  value: unknown,
): CanonicalA100VertexCustomJobConsumption {
  assertPlainSerializedData(value, 'vertex_a100_consumption')
  const consumption = canonicalA100VertexCustomJobConsumptionSchema
    .parse(value)
  const { consumptionHash, ...payload } = consumption
  if (consumptionHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex A100 consumption hash is invalid.')
  }
  return consumption
}

export function assertCanonicalA100VertexCustomJobExecutionRecord(
  value: unknown,
): CanonicalA100VertexCustomJobExecutionRecord {
  assertPlainSerializedData(value, 'vertex_a100_execution_record')
  const record = canonicalA100VertexCustomJobExecutionRecordSchema.parse(value)
  const { executionRecordHash, ...payload } = record
  if (executionRecordHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex A100 execution record hash is invalid.')
  }
  return record
}

function assertAuthorityReleaseMatch(
  authority: CanonicalA100VertexCustomJobLaunchAuthority,
  release: CanonicalA100VertexCustomJobRelease,
  at: string,
): void {
  if (
    !sameRef(authority.releaseRef, release.releaseRef)
    || !sameRef(authority.currentRateAuthorityRef,
      release.currentRateAuthorityRef)
    || authority.operationId !== OPERATION_ID
    || authority.executionTarget !== release.executionTarget
    || Date.parse(at) < Date.parse(release.qualifiedAt)
    || Date.parse(at) >= Date.parse(release.expiresAt)
    || Date.parse(at) < Date.parse(authority.admittedAt)
    || Date.parse(at) >= Date.parse(authority.expiresAt)
  ) throw new Error('Vertex A100 authority differs from current release.')
}

function prepareCreateRequest(input: {
  authority: CanonicalA100VertexCustomJobLaunchAuthority
  release: CanonicalA100VertexCustomJobRelease
}) {
  const invocationDigest = sha256AuthorityValue({
    authorityHash: input.authority.authorityHash,
    executionEnvelopeRef: input.authority.executionEnvelopeRef,
    releaseHash: input.release.configurationHash,
  })
  const displayName = `weeditpro-sam31-a100-${invocationDigest.slice(0, 40)}`
  const body = {
    displayName,
    labels: {
      'weeditpro-operation': 'sam31-track-all',
      'weeditpro-route': 'a100-80gb-heavy-primary',
      'weeditpro-invocation': invocationDigest.slice(0, 32),
    },
    jobSpec: {
      workerPoolSpecs: [{
        machineSpec: {
          machineType: input.release.machineType,
          acceleratorType: input.release.acceleratorType,
          acceleratorCount: input.release.acceleratorCount,
        },
        replicaCount: String(input.release.replicaCount),
        diskSpec: {
          bootDiskType: input.release.bootDiskType,
          bootDiskSizeGb: input.release.bootDiskSizeGb,
        },
        containerSpec: {
          imageUri: input.release.immutableImageUri,
          env: [
            {
              name: 'WEEDITPRO_GPU_INVOCATION_ID',
              value: input.authority.executionEnvelopeRef.id,
            },
            {
              name: 'WEEDITPRO_GPU_ACCELERATOR_CLASS',
              value: 'nvidia_a100_80gb',
            },
          ],
        },
      }],
      serviceAccount: input.release.serviceAccountEmail,
      network: input.release.networkResource,
      scheduling: {
        timeout: `${input.release.maximumExecutionSeconds}s`,
        restartJobOnWorkerRestart: input.release.restartJobOnWorkerRestart,
      },
    },
    encryptionSpec: {
      kmsKeyName: input.release.encryptionKeyResource,
    },
  }
  const url = `${API_ORIGIN}/v1/${CUSTOM_JOB_PARENT}/customJobs`
  const requestHash = sha256AuthorityValue({ url, body })
  return Object.freeze({
    url,
    body,
    displayName,
    createRequestRef: evidenceRefSchema.parse({
      id: `vertex-a100-create.${requestHash.slice(0, 32)}`,
      version: 1,
      contentHash: `sha256:${requestHash}`,
    }),
  })
}

function createConsumption(input: {
  authority: CanonicalA100VertexCustomJobLaunchAuthority
  release: CanonicalA100VertexCustomJobRelease
  createRequestRef: z.infer<typeof evidenceRefSchema>
  consumedAt: string
}): CanonicalA100VertexCustomJobConsumption {
  const payload = consumptionWithoutHashSchema.parse({
    schemaVersion: CANONICAL_A100_VERTEX_CUSTOM_JOB_CONSUMPTION_VERSION,
    source: 'canonical_a100_vertex_custom_job_launch_port',
    authorityRef: ref(input.authority.authorityId,
      input.authority.authorityHash),
    releaseRef: input.release.releaseRef,
    executionAttemptRef: input.authority.executionAttemptRef,
    executionEnvelopeRef: input.authority.executionEnvelopeRef,
    customJobCreateRequestRef: input.createRequestRef,
    consumedBeforeProviderCall: true,
    createOnlyAndExactReread: true,
    oneConsumptionMayCreateAtMostOneCustomJob: true,
    automaticRetryAfterUnknownAllowed: false,
    customerCreditsMutated: false,
    consumedAt: input.consumedAt,
  })
  return canonicalA100VertexCustomJobConsumptionSchema.parse({
    ...payload,
    consumptionHash: sha256AuthorityValue(payload),
  })
}

function createExecutionRecord(input: {
  authority: CanonicalA100VertexCustomJobLaunchAuthority
  release: CanonicalA100VertexCustomJobRelease
  consumption: CanonicalA100VertexCustomJobConsumption
  createRequestRef: z.infer<typeof evidenceRefSchema>
  createResponse: ReturnType<typeof parseCreateResponse>
  persistedAt: string
}): CanonicalA100VertexCustomJobExecutionRecord {
  const payload = executionRecordWithoutHashSchema.parse({
    schemaVersion: CANONICAL_A100_VERTEX_CUSTOM_JOB_EXECUTION_RECORD_VERSION,
    source: 'canonical_a100_vertex_custom_job_launch_port',
    executionRecordId:
      `vertex-a100-execution.${input.createResponse.responseDigest.slice(0, 32)}`,
    authorityRef: ref(input.authority.authorityId,
      input.authority.authorityHash),
    releaseRef: input.release.releaseRef,
    consumptionRef: ref(
      `vertex-a100-consumption.${input.consumption.consumptionHash.slice(0, 32)}`,
      input.consumption.consumptionHash,
    ),
    customJobCreateRequestRef: input.createRequestRef,
    customJobResourceName: input.createResponse.name,
    displayName: input.createResponse.displayName,
    initialState: input.createResponse.state,
    providerResponseDigestSha256: input.createResponse.responseDigest,
    createResponsePersistedAndExactReread: true,
    terminalStateClaimed: false,
    customerCreditsMutated: false,
    persistedAt: input.persistedAt,
  })
  return canonicalA100VertexCustomJobExecutionRecordSchema.parse({
    ...payload,
    executionRecordHash: sha256AuthorityValue(payload),
  })
}

function parseCreateResponse(input: {
  untrusted: unknown
  prepared: ReturnType<typeof prepareCreateRequest>
}) {
  assertPlainSerializedData(input.untrusted, 'vertex_custom_job_response')
  const parsed = z.object({
    name: customJobResourceName,
    displayName: z.string().trim().min(1).max(128),
    state: z.enum(['JOB_STATE_PENDING', 'JOB_STATE_QUEUED']),
  }).passthrough().parse(input.untrusted)
  if (parsed.displayName !== input.prepared.displayName) {
    throw new Error('Vertex response returned another custom job.')
  }
  const responseDigest = sha256AuthorityValue({
    name: parsed.name,
    displayName: parsed.displayName,
    state: parsed.state,
    createRequestRef: input.prepared.createRequestRef,
  })
  return Object.freeze({
    name: parsed.name,
    displayName: parsed.displayName,
    state: parsed.state,
    responseDigest,
  })
}

function launchResult(input: {
  authority?: CanonicalA100VertexCustomJobLaunchAuthority
  release?: CanonicalA100VertexCustomJobRelease
  authorityRef?: z.infer<typeof evidenceRefSchema>
  releaseRef?: z.infer<typeof evidenceRefSchema>
  consumption: CanonicalA100VertexCustomJobConsumption | null
  createRequestRef: z.infer<typeof evidenceRefSchema>
  customJobExecutionRef: z.infer<typeof evidenceRefSchema> | null
  disposition: CanonicalA100VertexCustomJobLaunchResult['disposition']
  providerCallStarted: boolean
  substantiveWork:
    CanonicalA100VertexCustomJobLaunchResult[
      'providerInferenceOrSubstantiveWorkKnownExecuted'
    ]
  observedAt: string
}): CanonicalA100VertexCustomJobLaunchResult {
  const payload = launchResultWithoutHashSchema.parse({
    schemaVersion: CANONICAL_A100_VERTEX_CUSTOM_JOB_LAUNCH_RESULT_VERSION,
    source: 'canonical_a100_vertex_custom_job_launch_port',
    authorityRef: input.authority
      ? ref(input.authority.authorityId, input.authority.authorityHash)
      : input.authorityRef,
    releaseRef: input.release?.releaseRef ?? input.releaseRef,
    consumptionRef: input.consumption
      ? ref(
        `vertex-a100-consumption.${input.consumption.consumptionHash.slice(0, 32)}`,
        input.consumption.consumptionHash,
      )
      : null,
    customJobCreateRequestRef: input.createRequestRef,
    customJobExecutionRef: input.customJobExecutionRef,
    disposition: input.disposition,
    providerInferenceOrSubstantiveWorkKnownExecuted: input.substantiveWork,
    providerCallStarted: input.providerCallStarted,
    automaticRetryAllowed: false,
    exactTerminalRereadRequired: true,
    exactUsageAndAccountEffectiveCostRereadRequired: true,
    minimumIdleInstances: 0,
    persistentEndpointCreated: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    observedAt: input.observedAt,
  })
  return Object.freeze(canonicalA100VertexCustomJobLaunchResultSchema.parse({
    ...payload,
    resultHash: sha256AuthorityValue(payload),
  }))
}

function ref(id: string, hash: string) {
  return evidenceRefSchema.parse({
    id,
    version: 1,
    contentHash: `sha256:${hash}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertPlainSerializedData(
  value: unknown,
  label: string,
  state: { seen: Set<object>; entries: number } = {
    seen: new Set<object>(),
    entries: 0,
  },
  depth = 0,
): void {
  if (depth > 16) throw new Error(`${label} nesting is too deep.`)
  if (value === null || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))) return
  if (typeof value === 'string') {
    if (value.length > 16_384) throw new Error(`${label} string is too long.`)
    return
  }
  if (typeof value !== 'object') {
    throw new Error(`${label} is not serialized plain data.`)
  }
  if (state.seen.has(value)) throw new Error(`${label} contains a cycle.`)
  state.seen.add(value)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== Array.prototype) {
    throw new Error(`${label} has a non-plain prototype.`)
  }
  const keys = Reflect.ownKeys(value)
  state.entries += keys.length
  if (keys.length > 512 || state.entries > 4_096) {
    throw new Error(`${label} serialized tree is too large.`)
  }
  for (const key of keys) {
    if (typeof key !== 'string') throw new Error(`${label} has a symbol key.`)
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor || !('value' in descriptor)) {
      throw new Error(`${label} has an accessor.`)
    }
    assertPlainSerializedData(descriptor.value, `${label}.${key}`, state,
      depth + 1)
  }
  state.seen.delete(value)
}
