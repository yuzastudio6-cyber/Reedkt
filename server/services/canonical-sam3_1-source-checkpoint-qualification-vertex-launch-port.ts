import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  assertCanonicalSam31QualificationImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-qualification-image-supply-chain-release'
import {
  assertCanonicalSam31VertexSourceCheckpointWorkerRequest,
  type CanonicalSam31VertexSourceCheckpointWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification-vertex'
import {
  assertCanonicalCurrentGoogleCloudVertexA100RateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-rate-authority'
import {
  assertCanonicalSam31VertexQualificationStagingObservation,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-staging-owner'
import { assertPlainSerializedData } from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_QUOTA_OBSERVATION_VERSION =
  'canonical-sam3_1-vertex-a100-qualification-quota-observation-v1' as const
export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_ADMISSION_VERSION =
  'canonical-sam3_1-vertex-a100-qualification-admission-v1' as const
export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_CONSUMPTION_VERSION =
  'canonical-sam3_1-vertex-a100-qualification-consumption-v1' as const
export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_EXECUTION_VERSION =
  'canonical-sam3_1-vertex-a100-qualification-execution-v2' as const
export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_LAUNCH_RESULT_VERSION =
  'canonical-sam3_1-vertex-a100-qualification-launch-result-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const API_ORIGIN = 'https://us-central1-aiplatform.googleapis.com' as const
const CUSTOM_JOB_PARENT = 'projects/reeditpro/locations/us-central1' as const
const SERVICE_ACCOUNT =
  'weeditpro-sam31-qual-sa@reeditpro.iam.gserviceaccount.com' as const
const NETWORK =
  'projects/390722338345/global/networks/weeditpro-gpu-private' as const
const KMS_KEY =
  'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification' as const
const QUOTA_PREFERENCE =
  'weeditpro-vertex-a100-80gb-us-central1-1' as const
const QUOTA_ID =
  'CustomModelTrainingA10080GBGPUsPerProjectPerRegion' as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const quotaCapacity = z.number().int().min(1).max(64)
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const providerJobStateSchema = z.enum([
  'JOB_STATE_PENDING',
  'JOB_STATE_QUEUED',
  'JOB_STATE_RUNNING',
  'JOB_STATE_SUCCEEDED',
  'JOB_STATE_FAILED',
  'JOB_STATE_CANCELLED',
  'JOB_STATE_EXPIRED',
])

const quotaWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_QUOTA_OBSERVATION_VERSION,
  ),
  source: z.literal('canonical_server_vertex_quota_observation_owner'),
  evidenceClass: z.literal('canonical_private_reread'),
  projectId: z.literal(PROJECT_ID),
  region: z.literal(REGION),
  quotaPreferenceId: z.literal(QUOTA_PREFERENCE),
  quotaId: z.literal(QUOTA_ID),
  preferredValue: quotaCapacity,
  grantedValue: quotaCapacity,
  reconciling: z.boolean(),
  exactCloudQuotaPreferenceAndQuotaInfoReread: z.literal(true),
  batchOrComputeA100QuotaUsedAsVertexAuthority: z.literal(false),
  gpuJobStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  observedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  if (
    Date.parse(value.expiresAt) <= Date.parse(value.observedAt)
    || Date.parse(value.expiresAt) - Date.parse(value.observedAt) > 3_600_000
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex qualification quota observation is stale.',
  })
})
export const canonicalSam31VertexQualificationQuotaObservationSchema =
  quotaWithoutHashSchema.extend({ observationHash: sha256 }).strict()
export type CanonicalSam31VertexQualificationQuotaObservation = z.infer<
  typeof canonicalSam31VertexQualificationQuotaObservationSchema
>

const admissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_ADMISSION_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_qualification_admission_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  attemptId: safeId,
  workerRequestRef: evidenceRefSchema,
  stagingObservationRef: evidenceRefSchema,
  imageSupplyChainReleaseRef: evidenceRefSchema,
  immutableImageRef: evidenceRefSchema,
  immutableImageDigest: prefixedSha256,
  immutableImageUri: z.string().regex(
    /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-qualification@sha256:[a-f0-9]{64}$/u,
  ),
  currentAccountRateAuthorityRef: evidenceRefSchema,
  quotaObservationRef: evidenceRefSchema,
  projectId: z.literal(PROJECT_ID),
  region: z.literal(REGION),
  customJobParent: z.literal(CUSTOM_JOB_PARENT),
  serviceAccountEmail: z.literal(SERVICE_ACCOUNT),
  networkResource: z.literal(NETWORK),
  encryptionKeyResource: z.literal(KMS_KEY),
  executionTarget: z.literal('google_cloud_vertex_custom_job_a2_ultra'),
  machineType: z.literal('a2-ultragpu-1g'),
  acceleratorType: z.literal('NVIDIA_A100_80GB'),
  acceleratorCount: z.literal(1),
  replicaCount: z.literal(1),
  maximumExecutionSeconds: z.literal(7_200),
  minimumIdleInstances: z.literal(0),
  persistentResourceAllowed: z.literal(false),
  publicIpAndWebAccessAllowed: z.literal(false),
  runtimeNetworkDownloadAllowed: z.literal(false),
  callerImageCommandArgsEnvironmentModelPathOrUrlAccepted: z.literal(false),
  containerEntrypointFromImmutableImageOnly: z.literal(true),
  createOnlyConsumptionRequiredBeforeProviderCall: z.literal(true),
  oneAdmissionCreatesAtMostOneCustomJob: z.literal(true),
  retryAfterUnknownCreateOutcomeAllowed: z.literal(false),
  accountEffectivePricingReread: z.literal(true),
  platformInternalQualificationOnly: z.literal(true),
  customerCreditsReserved: z.literal(false),
  customerCreditsSpent: z.literal(false),
  sourceCheckpointQualificationGranted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionReady: z.literal(false),
  admittedAt: timestamp,
}).strict()
export const canonicalSam31VertexQualificationAdmissionSchema =
  admissionWithoutHashSchema.extend({ admissionHash: sha256 }).strict()
export type CanonicalSam31VertexQualificationAdmission = z.infer<
  typeof canonicalSam31VertexQualificationAdmissionSchema
>

const consumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_CONSUMPTION_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_qualification_launch_port',
  ),
  attemptId: safeId,
  admissionRef: evidenceRefSchema,
  customJobCreateRequestRef: evidenceRefSchema,
  consumedBeforeProviderCall: z.literal(true),
  createOnlyAndExactReread: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  consumedAt: timestamp,
}).strict()
export const canonicalSam31VertexQualificationConsumptionSchema =
  consumptionWithoutHashSchema.extend({ consumptionHash: sha256 }).strict()
export type CanonicalSam31VertexQualificationConsumption = z.infer<
  typeof canonicalSam31VertexQualificationConsumptionSchema
>

const executionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_EXECUTION_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_qualification_launch_port',
  ),
  executionId: safeId,
  attemptId: safeId,
  admissionRef: evidenceRefSchema,
  consumptionRef: evidenceRefSchema,
  customJobCreateRequestRef: evidenceRefSchema,
  customJobResourceName: z.string().regex(
    /^projects\/390722338345\/locations\/us-central1\/customJobs\/[0-9]+$/u,
  ),
  displayName: safeId,
  stateAtExecutionBinding: providerJobStateSchema,
  providerObservationMode: z.enum([
    'exact_create_response',
    'reconciled_unknown_create',
  ]),
  providerExecutionObservationDigestSha256: sha256,
  exactProviderExecutionObservationPersistedAndReread: z.literal(true),
  terminalOutcomeClaimed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  persistedAt: timestamp,
}).strict()
export const canonicalSam31VertexQualificationExecutionSchema =
  executionWithoutHashSchema.extend({ executionHash: sha256 }).strict()
export type CanonicalSam31VertexQualificationExecution = z.infer<
  typeof canonicalSam31VertexQualificationExecutionSchema
>

const resultWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_LAUNCH_RESULT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_qualification_launch_port',
  ),
  attemptId: safeId,
  admissionRef: evidenceRefSchema,
  consumptionRef: evidenceRefSchema.nullable(),
  customJobCreateRequestRef: evidenceRefSchema,
  executionRef: evidenceRefSchema.nullable(),
  disposition: z.enum([
    'accepted',
    'rejected_before_creation',
    'outcome_unknown_requires_reconciliation',
  ]),
  providerCallStarted: z.boolean(),
  substantiveQualificationOutcome: z.enum(['not_executed', 'unknown']),
  automaticRetryAllowed: z.literal(false),
  exactTerminalResultUsageAndCostRereadRequired: z.literal(true),
  minimumIdleInstances: z.literal(0),
  persistentResourceCreated: z.literal(false),
  customerCreditsMutated: z.literal(false),
  sourceCheckpointQualificationGranted: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const exact = value.disposition === 'accepted'
    ? value.providerCallStarted && value.consumptionRef !== null
      && value.executionRef !== null
      && value.substantiveQualificationOutcome === 'not_executed'
    : value.disposition === 'rejected_before_creation'
      ? !value.providerCallStarted && value.consumptionRef === null
        && value.executionRef === null
        && value.substantiveQualificationOutcome === 'not_executed'
      : value.providerCallStarted && value.consumptionRef !== null
        && value.executionRef === null
        && value.substantiveQualificationOutcome === 'unknown'
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'Vertex qualification launch lost safe outcome semantics.',
  })
})
export const canonicalSam31VertexQualificationLaunchResultSchema =
  resultWithoutHashSchema.extend({ resultHash: sha256 }).strict()
export type CanonicalSam31VertexQualificationLaunchResult = z.infer<
  typeof canonicalSam31VertexQualificationLaunchResultSchema
>

export interface CanonicalSam31VertexQualificationConsumptionPort {
  createOnly(
    value: CanonicalSam31VertexQualificationConsumption,
  ): Promise<'created' | 'already_exists'>
  reread(
    consumptionRef: z.infer<typeof evidenceRefSchema>,
  ): Promise<unknown>
}
export interface CanonicalSam31VertexQualificationAdmissionRepository {
  createOnlyAndReread(
    value: CanonicalSam31VertexQualificationAdmission,
  ): Promise<unknown>
  reread(
    admissionRef: z.infer<typeof evidenceRefSchema>,
  ): Promise<unknown>
}
export interface CanonicalSam31VertexQualificationExecutionRepository {
  createOnlyAndReread(
    value: CanonicalSam31VertexQualificationExecution,
  ): Promise<unknown>
  reread(
    executionRef: z.infer<typeof evidenceRefSchema>,
  ): Promise<unknown>
  rereadByAdmission(
    admissionRef: z.infer<typeof evidenceRefSchema>,
  ): Promise<unknown>
}
type GoogleAuthRequest = Pick<GoogleAuth, 'request'>
type ProviderExecutionObservation = Readonly<{
  name: string
  displayName: string
  state: z.infer<typeof providerJobStateSchema>
  observationMode: 'exact_create_response' | 'reconciled_unknown_create'
  digest: string
}>

export function createCanonicalSam31VertexQualificationLaunchPort(input: {
  readonly admissionRepository:
    CanonicalSam31VertexQualificationAdmissionRepository
  readonly consumptionPort: CanonicalSam31VertexQualificationConsumptionPort
  readonly executionRepository:
    CanonicalSam31VertexQualificationExecutionRepository
  readonly auth?: GoogleAuthRequest
  readonly now?: () => string
  readonly requestTimeoutMilliseconds?: number
}) {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const now = input.now ?? (() => new Date().toISOString())
  const timeout = input.requestTimeoutMilliseconds ?? 15_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 30_000) {
    throw new Error('Vertex qualification create timeout is invalid.')
  }
  return Object.freeze({
    async startOne(inputValue: {
      readonly workerRequest: unknown
      readonly stagingObservation: unknown
      readonly imageSupplyChainRelease: unknown
      readonly rateAuthority: unknown
      readonly quotaObservation: unknown
    }): Promise<CanonicalSam31VertexQualificationLaunchResult> {
      const observedAt = now()
      let admission: CanonicalSam31VertexQualificationAdmission | null = null
      let prepared: ReturnType<typeof prepareRequest> | null = null
      let consumption: CanonicalSam31VertexQualificationConsumption | null =
        null
      let providerCallStarted = false
      try {
        admission = createAdmission({ ...inputValue, admittedAt: observedAt })
        const persistedAdmission = assertCanonicalSam31VertexQualificationAdmission(
          await input.admissionRepository.createOnlyAndReread(admission),
        )
        if (stableAuthorityStringify(persistedAdmission) !==
          stableAuthorityStringify(admission)) {
          throw new Error('Vertex qualification admission reread changed.')
        }
        prepared = prepareRequest(admission)
        consumption = createConsumption(admission,
          prepared.createRequestRef, observedAt)
        const consumptionRef = ref(
          `sam31-vertex-consumption-${consumption.consumptionHash.slice(0, 24)}`,
          consumption.consumptionHash,
        )
        const consumptionDisposition =
          await input.consumptionPort.createOnly(consumption)
        const consumed = assertCanonicalSam31VertexQualificationConsumption(
          await input.consumptionPort.reread(consumptionRef),
        )
        if (stableAuthorityStringify(consumed) !==
          stableAuthorityStringify(consumption)) {
          throw new Error('Vertex qualification consumption reread changed.')
        }
        if (consumptionDisposition === 'already_exists') {
          const prior = await input.executionRepository.rereadByAdmission(
            ref(admission.attemptId, admission.admissionHash),
          )
          if (!prior) {
            providerCallStarted = true
            const provider = await rereadUnknownCreate({
              auth,
              prepared,
              timeout,
            })
            const execution = createExecution({
              admission,
              consumption,
              createRequestRef: prepared.createRequestRef,
              provider,
              persistedAt: observedAt,
            })
            const recovered =
              assertCanonicalSam31VertexQualificationExecution(
                await input.executionRepository.createOnlyAndReread(
                  execution,
                ),
              )
            if (stableAuthorityStringify(recovered) !==
              stableAuthorityStringify(execution)) {
              throw new Error(
                'Reconciled Vertex qualification execution changed.',
              )
            }
            return launchResult({
              admissionRef: ref(admission.attemptId,
                admission.admissionHash),
              attemptId: admission.attemptId,
              consumption,
              createRequestRef: prepared.createRequestRef,
              executionRef: ref(execution.executionId,
                execution.executionHash, 2),
              disposition: 'accepted',
              providerCallStarted: true,
              outcome: 'not_executed',
              observedAt,
            })
          }
          const execution = assertCanonicalSam31VertexQualificationExecution(
            prior,
          )
          if (
            execution.attemptId !== admission.attemptId
            || !sameRef(execution.admissionRef,
              ref(admission.attemptId, admission.admissionHash))
            || !sameRef(execution.consumptionRef, consumptionRef)
            || !sameRef(execution.customJobCreateRequestRef,
              prepared.createRequestRef)
          ) throw new Error('Prior Vertex execution crossed admission.')
          return launchResult({
            admissionRef: ref(admission.attemptId, admission.admissionHash),
            attemptId: admission.attemptId,
            consumption,
            createRequestRef: prepared.createRequestRef,
            executionRef: ref(
              execution.executionId,
              execution.executionHash,
              2,
            ),
            disposition: 'accepted',
            providerCallStarted: true,
            outcome: 'not_executed',
            observedAt,
          })
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
        const provider = parseCreateResponse(response.data, prepared)
        const execution = createExecution({
          admission,
          consumption,
          createRequestRef: prepared.createRequestRef,
          provider,
          persistedAt: observedAt,
        })
        const persisted = assertCanonicalSam31VertexQualificationExecution(
          await input.executionRepository.createOnlyAndReread(execution),
        )
        if (stableAuthorityStringify(persisted) !==
          stableAuthorityStringify(execution)) {
          throw new Error('Vertex qualification execution reread changed.')
        }
        return launchResult({
          admissionRef: ref(admission.attemptId, admission.admissionHash),
          attemptId: admission.attemptId,
          consumption,
          createRequestRef: prepared.createRequestRef,
          executionRef: ref(execution.executionId, execution.executionHash, 2),
          disposition: 'accepted',
          providerCallStarted: true,
          outcome: 'not_executed',
          observedAt,
        })
      } catch {
        const fallbackHash = sha256AuthorityValue({
          attemptId: admission?.attemptId ?? 'unvalidated', observedAt,
        })
        const fallbackRef = ref(
          admission?.attemptId ?? `sam31-vertex-refusal-${fallbackHash.slice(0, 24)}`,
          admission?.admissionHash ?? fallbackHash,
        )
        return launchResult({
          admissionRef: fallbackRef,
          attemptId: admission?.attemptId ??
            `sam31-vertex-refusal-${fallbackHash.slice(0, 24)}`,
          consumption: providerCallStarted ? consumption : null,
          createRequestRef: prepared?.createRequestRef ?? fallbackRef,
          executionRef: null,
          disposition: providerCallStarted
            ? 'outcome_unknown_requires_reconciliation'
            : 'rejected_before_creation',
          providerCallStarted,
          outcome: providerCallStarted ? 'unknown' : 'not_executed',
          observedAt,
        })
      }
    },

    async recoverUnknownCreate(untrusted: {
      readonly admissionRef: unknown
      readonly consumptionRef: unknown
      readonly customJobCreateRequestRef: unknown
    }): Promise<CanonicalSam31VertexQualificationLaunchResult> {
      assertPlainSerializedData(
        untrusted,
        'sam31_vertex_unknown_create_recovery',
      )
      const request = z.object({
        admissionRef: evidenceRefSchema,
        consumptionRef: evidenceRefSchema,
        customJobCreateRequestRef: evidenceRefSchema,
      }).strict().parse(untrusted)
      const admission = assertCanonicalSam31VertexQualificationAdmission(
        await input.admissionRepository.reread(request.admissionRef),
      )
      const consumption = assertCanonicalSam31VertexQualificationConsumption(
        await input.consumptionPort.reread(request.consumptionRef),
      )
      const prepared = prepareRequest(admission)
      if (
        !sameRef(
          request.admissionRef,
          ref(admission.attemptId, admission.admissionHash),
        )
        || consumption.attemptId !== admission.attemptId
        || !sameRef(consumption.admissionRef, request.admissionRef)
        || !sameRef(consumption.customJobCreateRequestRef,
          request.customJobCreateRequestRef)
        || !sameRef(prepared.createRequestRef,
          request.customJobCreateRequestRef)
      ) throw new Error('Vertex unknown-create recovery crossed authority.')
      const prior = await input.executionRepository.rereadByAdmission(
        request.admissionRef,
      )
      const observedAt = now()
      if (prior) {
        const execution = assertCanonicalSam31VertexQualificationExecution(
          prior,
        )
        assertExecutionLineage({
          execution,
          admission,
          consumptionRef: request.consumptionRef,
          createRequestRef: request.customJobCreateRequestRef,
        })
        return launchResult({
          admissionRef: request.admissionRef,
          attemptId: admission.attemptId,
          consumption,
          createRequestRef: request.customJobCreateRequestRef,
          executionRef: ref(execution.executionId, execution.executionHash, 2),
          disposition: 'accepted',
          providerCallStarted: true,
          outcome: 'not_executed',
          observedAt,
        })
      }
      const provider = await rereadUnknownCreate({ auth, prepared, timeout })
      const execution = createExecution({
        admission,
        consumption,
        createRequestRef: request.customJobCreateRequestRef,
        provider,
        persistedAt: observedAt,
      })
      const persisted = assertCanonicalSam31VertexQualificationExecution(
        await input.executionRepository.createOnlyAndReread(execution),
      )
      if (stableAuthorityStringify(persisted) !==
        stableAuthorityStringify(execution)) {
        throw new Error('Recovered Vertex qualification execution changed.')
      }
      return launchResult({
        admissionRef: request.admissionRef,
        attemptId: admission.attemptId,
        consumption,
        createRequestRef: request.customJobCreateRequestRef,
        executionRef: ref(execution.executionId, execution.executionHash, 2),
        disposition: 'accepted',
        providerCallStarted: true,
        outcome: 'not_executed',
        observedAt,
      })
    },
  })
}

export function sealCanonicalSam31VertexQualificationQuotaObservation(
  value: z.input<typeof quotaWithoutHashSchema>,
) {
  const payload = quotaWithoutHashSchema.parse(value)
  return canonicalSam31VertexQualificationQuotaObservationSchema.parse({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31VertexQualificationQuotaObservation(
  value: unknown,
  at?: string,
): CanonicalSam31VertexQualificationQuotaObservation {
  assertPlainSerializedData(value, 'sam31_vertex_quota_observation')
  const parsed = canonicalSam31VertexQualificationQuotaObservationSchema
    .parse(value)
  const { observationHash, ...payload } = parsed
  if (
    observationHash !== sha256AuthorityValue(payload)
    || (at && (Date.parse(at) < Date.parse(parsed.observedAt)
      || Date.parse(at) >= Date.parse(parsed.expiresAt)))
  ) throw new Error('Vertex qualification quota observation is invalid.')
  return parsed
}

export function assertCanonicalSam31VertexQualificationAdmission(
  value: unknown,
) {
  assertPlainSerializedData(value, 'sam31_vertex_qualification_admission')
  const parsed = canonicalSam31VertexQualificationAdmissionSchema.parse(value)
  const { admissionHash, ...payload } = parsed
  if (admissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex qualification admission hash is invalid.')
  }
  return parsed
}

function createAdmission(input: {
  workerRequest: unknown
  stagingObservation: unknown
  imageSupplyChainRelease: unknown
  rateAuthority: unknown
  quotaObservation: unknown
  admittedAt: string
}) {
  const request = assertCanonicalSam31VertexSourceCheckpointWorkerRequest(
    input.workerRequest,
  )
  const staging = assertCanonicalSam31VertexQualificationStagingObservation(
    input.stagingObservation,
  )
  const image = assertCanonicalSam31QualificationImageSupplyChainRelease(
    input.imageSupplyChainRelease,
  )
  const rate = assertCanonicalCurrentGoogleCloudVertexA100RateAuthority(
    input.rateAuthority,
    input.admittedAt,
  )
  const quota = assertCanonicalSam31VertexQualificationQuotaObservation(
    input.quotaObservation,
    input.admittedAt,
  )
  const imageReleaseRef = ref(image.releaseId, image.releaseHash)
  if (
    request.attemptId !== staging.attemptId
    || !sameRef(vertexRequestRef(request), staging.workerRequestRef)
    || request.qualificationImage.immutableImageDigest !==
      image.immutableImageDigest
    || !sameRef(request.qualificationImage.artifactRef,
      image.immutableImageRef)
    || !sameRef(request.qualificationImage.supplyChainReleaseRef,
      imageReleaseRef)
    || !image.authority.qualificationImageSupplyChainQualified
    || !image.authority.sourceCheckpointQualificationImageAdmissible
    || image.authority.sourceCheckpointQualificationGranted
    || image.authority.gpuQualificationJobDispatched
    || rate.providerOrGpuJobStarted
    || quota.gpuJobStarted
  ) throw new Error('Vertex qualification admission lineage is invalid.')
  const payload = admissionWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_QUALIFICATION_ADMISSION_VERSION,
    source: 'canonical_server_sam3_1_vertex_qualification_admission_owner',
    evidenceClass: 'canonical_private_reread',
    attemptId: request.attemptId,
    workerRequestRef: vertexRequestRef(request),
    stagingObservationRef: ref(
      `sam31-vertex-staging-${staging.attemptDigestSha256.slice(0, 24)}`,
      staging.observationHash,
    ),
    imageSupplyChainReleaseRef: imageReleaseRef,
    immutableImageRef: image.immutableImageRef,
    immutableImageDigest: image.immutableImageDigest,
    immutableImageUri: image.immutableImageUri,
    currentAccountRateAuthorityRef: ref(
      rate.rateAuthorityId, rate.rateAuthorityHash,
    ),
    quotaObservationRef: ref(
      `sam31-vertex-quota-${quota.observationHash.slice(0, 24)}`,
      quota.observationHash,
    ),
    projectId: PROJECT_ID,
    region: REGION,
    customJobParent: CUSTOM_JOB_PARENT,
    serviceAccountEmail: SERVICE_ACCOUNT,
    networkResource: NETWORK,
    encryptionKeyResource: KMS_KEY,
    executionTarget: 'google_cloud_vertex_custom_job_a2_ultra',
    machineType: 'a2-ultragpu-1g',
    acceleratorType: 'NVIDIA_A100_80GB',
    acceleratorCount: 1,
    replicaCount: 1,
    maximumExecutionSeconds: 7_200,
    minimumIdleInstances: 0,
    persistentResourceAllowed: false,
    publicIpAndWebAccessAllowed: false,
    runtimeNetworkDownloadAllowed: false,
    callerImageCommandArgsEnvironmentModelPathOrUrlAccepted: false,
    containerEntrypointFromImmutableImageOnly: true,
    createOnlyConsumptionRequiredBeforeProviderCall: true,
    oneAdmissionCreatesAtMostOneCustomJob: true,
    retryAfterUnknownCreateOutcomeAllowed: false,
    accountEffectivePricingReread: true,
    platformInternalQualificationOnly: true,
    customerCreditsReserved: false,
    customerCreditsSpent: false,
    sourceCheckpointQualificationGranted: false,
    runtimeReleaseGranted: false,
    publicDeliveryAuthorized: false,
    productionReady: false,
    admittedAt: input.admittedAt,
  })
  return canonicalSam31VertexQualificationAdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

function prepareRequest(admission: CanonicalSam31VertexQualificationAdmission) {
  const displayName = `weeditpro-sam31-q-${sha256AuthorityValue(
    admission.attemptId,
  ).slice(0, 40)}`
  const body = {
    displayName,
    jobSpec: {
      workerPoolSpecs: [{
        machineSpec: {
          machineType: admission.machineType,
          acceleratorType: admission.acceleratorType,
          acceleratorCount: admission.acceleratorCount,
        },
        replicaCount: '1',
        diskSpec: { bootDiskType: 'pd-ssd', bootDiskSizeGb: 200 },
        containerSpec: {
          imageUri: admission.immutableImageUri,
          env: [
            { name: 'WEEDITPRO_GPU_INVOCATION_ID', value: admission.attemptId },
            { name: 'WEEDITPRO_GPU_ACCELERATOR_CLASS',
              value: 'nvidia_a100_80gb' },
          ],
        },
      }],
      serviceAccount: admission.serviceAccountEmail,
      network: admission.networkResource,
      scheduling: {
        timeout: `${admission.maximumExecutionSeconds}s`,
        restartJobOnWorkerRestart: false,
      },
    },
    encryptionSpec: { kmsKeyName: admission.encryptionKeyResource },
  }
  const url = `${API_ORIGIN}/v1/${CUSTOM_JOB_PARENT}/customJobs`
  const hash = sha256AuthorityValue({ url, body })
  return Object.freeze({
    url,
    body,
    displayName,
    createRequestRef: ref(`sam31-vertex-create-${hash.slice(0, 32)}`, hash),
  })
}

function createConsumption(
  admission: CanonicalSam31VertexQualificationAdmission,
  createRequestRef: z.infer<typeof evidenceRefSchema>,
  consumedAt: string,
) {
  const payload = consumptionWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_QUALIFICATION_CONSUMPTION_VERSION,
    source: 'canonical_server_sam3_1_vertex_qualification_launch_port',
    attemptId: admission.attemptId,
    admissionRef: ref(admission.attemptId, admission.admissionHash),
    customJobCreateRequestRef: createRequestRef,
    consumedBeforeProviderCall: true,
    createOnlyAndExactReread: true,
    automaticRetryAllowed: false,
    customerCreditsMutated: false,
    consumedAt,
  })
  return canonicalSam31VertexQualificationConsumptionSchema.parse({
    ...payload,
    consumptionHash: sha256AuthorityValue(payload),
  })
}

function createExecution(input: {
  admission: CanonicalSam31VertexQualificationAdmission
  consumption: CanonicalSam31VertexQualificationConsumption
  createRequestRef: z.infer<typeof evidenceRefSchema>
  provider: ProviderExecutionObservation
  persistedAt: string
}) {
  const payload = executionWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_QUALIFICATION_EXECUTION_VERSION,
    source: 'canonical_server_sam3_1_vertex_qualification_launch_port',
    executionId: `sam31-vertex-execution-${input.provider.digest.slice(0, 32)}`,
    attemptId: input.admission.attemptId,
    admissionRef: ref(input.admission.attemptId,
      input.admission.admissionHash),
    consumptionRef: ref(
      `sam31-vertex-consumption-${input.consumption.consumptionHash.slice(0, 24)}`,
      input.consumption.consumptionHash,
    ),
    customJobCreateRequestRef: input.createRequestRef,
    customJobResourceName: input.provider.name,
    displayName: input.provider.displayName,
    stateAtExecutionBinding: input.provider.state,
    providerObservationMode: input.provider.observationMode,
    providerExecutionObservationDigestSha256: input.provider.digest,
    exactProviderExecutionObservationPersistedAndReread: true,
    terminalOutcomeClaimed: false,
    customerCreditsMutated: false,
    persistedAt: input.persistedAt,
  })
  return canonicalSam31VertexQualificationExecutionSchema.parse({
    ...payload,
    executionHash: sha256AuthorityValue(payload),
  })
}

function assertExecutionLineage(input: {
  execution: CanonicalSam31VertexQualificationExecution
  admission: CanonicalSam31VertexQualificationAdmission
  consumptionRef: z.infer<typeof evidenceRefSchema>
  createRequestRef: z.infer<typeof evidenceRefSchema>
}) {
  if (
    input.execution.attemptId !== input.admission.attemptId
    || !sameRef(
      input.execution.admissionRef,
      ref(input.admission.attemptId, input.admission.admissionHash),
    )
    || !sameRef(input.execution.consumptionRef, input.consumptionRef)
    || !sameRef(
      input.execution.customJobCreateRequestRef,
      input.createRequestRef,
    )
  ) throw new Error('Prior Vertex execution crossed admission.')
}

function parseCreateResponse(value: unknown,
  prepared: ReturnType<typeof prepareRequest>) {
  assertPlainSerializedData(value, 'sam31_vertex_create_response')
  const parsed = z.object({
    name: z.string().regex(
      /^projects\/390722338345\/locations\/us-central1\/customJobs\/[0-9]+$/u,
    ),
    displayName: safeId,
    state: z.enum(['JOB_STATE_PENDING', 'JOB_STATE_QUEUED']),
  }).passthrough().parse(value)
  if (parsed.displayName !== prepared.displayName) {
    throw new Error('Vertex returned another qualification job.')
  }
  return Object.freeze({
    ...parsed,
    observationMode: 'exact_create_response' as const,
    digest: sha256AuthorityValue({
      name: parsed.name,
      displayName: parsed.displayName,
      state: parsed.state,
      observationMode: 'exact_create_response',
      createRequestRef: prepared.createRequestRef,
    }),
  })
}

async function rereadUnknownCreate(input: {
  auth: GoogleAuthRequest
  prepared: ReturnType<typeof prepareRequest>
  timeout: number
}) {
  const response = await input.auth.request({
    url: `${API_ORIGIN}/v1/${CUSTOM_JOB_PARENT}/customJobs`,
    method: 'GET',
    params: {
      filter: `displayName="${input.prepared.displayName}"`,
      pageSize: 2,
    },
    timeout: input.timeout,
    retry: false,
    maxRedirects: 0,
    responseType: 'json',
    maxContentLength: 2 * 1024 * 1024,
  })
  assertPlainSerializedData(
    response.data,
    'sam31_vertex_unknown_create_reconciliation',
  )
  const parsed = z.object({
    customJobs: z.array(z.object({
      name: z.string().regex(
        /^projects\/390722338345\/locations\/us-central1\/customJobs\/[0-9]+$/u,
      ),
      displayName: safeId,
      state: providerJobStateSchema,
    }).passthrough()).max(2),
    nextPageToken: z.string().optional(),
  }).passthrough().parse(response.data)
  if (
    parsed.customJobs.length !== 1
    || (parsed.nextPageToken ?? '') !== ''
    || parsed.customJobs[0].displayName !== input.prepared.displayName
  ) throw new Error('Vertex unknown create outcome is not singular.')
  const provider = parsed.customJobs[0]
  return Object.freeze({
    ...provider,
    observationMode: 'reconciled_unknown_create' as const,
    digest: sha256AuthorityValue({
      name: provider.name,
      displayName: provider.displayName,
      state: provider.state,
      observationMode: 'reconciled_unknown_create',
      createRequestRef: input.prepared.createRequestRef,
    }),
  })
}

function launchResult(input: {
  attemptId: string
  admissionRef: z.infer<typeof evidenceRefSchema>
  consumption: CanonicalSam31VertexQualificationConsumption | null
  createRequestRef: z.infer<typeof evidenceRefSchema>
  executionRef: z.infer<typeof evidenceRefSchema> | null
  disposition: CanonicalSam31VertexQualificationLaunchResult['disposition']
  providerCallStarted: boolean
  outcome: 'not_executed' | 'unknown'
  observedAt: string
}) {
  const payload = resultWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_QUALIFICATION_LAUNCH_RESULT_VERSION,
    source: 'canonical_server_sam3_1_vertex_qualification_launch_port',
    attemptId: input.attemptId,
    admissionRef: input.admissionRef,
    consumptionRef: input.consumption ? ref(
      `sam31-vertex-consumption-${input.consumption.consumptionHash.slice(0, 24)}`,
      input.consumption.consumptionHash,
    ) : null,
    customJobCreateRequestRef: input.createRequestRef,
    executionRef: input.executionRef,
    disposition: input.disposition,
    providerCallStarted: input.providerCallStarted,
    substantiveQualificationOutcome: input.outcome,
    automaticRetryAllowed: false,
    exactTerminalResultUsageAndCostRereadRequired: true,
    minimumIdleInstances: 0,
    persistentResourceCreated: false,
    customerCreditsMutated: false,
    sourceCheckpointQualificationGranted: false,
    productionReady: false,
    observedAt: input.observedAt,
  })
  return canonicalSam31VertexQualificationLaunchResultSchema.parse({
    ...payload,
    resultHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31VertexQualificationConsumption(
  value: unknown,
) {
  assertPlainSerializedData(value, 'sam31_vertex_consumption')
  const parsed = canonicalSam31VertexQualificationConsumptionSchema
    .parse(value)
  const { consumptionHash, ...payload } = parsed
  if (consumptionHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex qualification consumption hash changed.')
  }
  return parsed
}

export function assertCanonicalSam31VertexQualificationExecution(
  value: unknown,
) {
  assertPlainSerializedData(value, 'sam31_vertex_execution')
  const parsed = canonicalSam31VertexQualificationExecutionSchema.parse(value)
  const { executionHash, ...payload } = parsed
  if (executionHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex qualification execution hash changed.')
  }
  return parsed
}

function vertexRequestRef(
  value: CanonicalSam31VertexSourceCheckpointWorkerRequest,
) {
  return ref(value.qualificationId, value.requestHash, 2)
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
) {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}
