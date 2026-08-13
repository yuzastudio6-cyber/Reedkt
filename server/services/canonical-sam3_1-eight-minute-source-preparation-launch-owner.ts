import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31EightMinuteSourcePreparationAdmission,
  assertCanonicalSam31EightMinuteSourcePreparationRelease,
  createCanonicalSam31EightMinuteSourcePreparationConsumption,
  type CanonicalSam31EightMinuteSourcePreparationAuthorityRepository,
  type CanonicalSam31EightMinuteSourcePreparationRelease,
} from './canonical-sam3_1-eight-minute-source-preparation-admission-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_CLOUD_RUN_PORT_VERSION =
  'canonical-sam3_1-eight-minute-source-preparation-cloud-run-port-v1' as const
export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_LAUNCH_VERSION =
  'canonical-sam3_1-eight-minute-source-preparation-launch-v1' as const
export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_LAUNCH_REPOSITORY_VERSION =
  'canonical-sam3_1-eight-minute-source-preparation-launch-repository-v1' as const
export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_LAUNCH_OWNER_VERSION =
  'canonical-sam3_1-eight-minute-source-preparation-launch-owner-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const JOB_RESOURCE =
  'projects/reeditpro/locations/us-central1/jobs/weeditpro-sam31-source-prep-l4' as const
const CLOUD_RUN_API_ORIGIN = 'https://run.googleapis.com' as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const INVOCATION_ENVIRONMENT_NAME =
  'WEEDITPRO_SAM31_SOURCE_PREPARATION_INVOCATION_ID' as const
const EXPECTED_IMAGE_PREFIX =
  'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-source-preparation-l4@' as const
const EXPECTED_COMMAND = '/usr/local/bin/node' as const
const EXPECTED_ENTRYPOINT =
  '/app/dist-server/weeditpro-sam3_1-eight-minute-source-preparation-worker.js' as const
const EXPECTED_SERVICE_ACCOUNT =
  'reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com' as const
const EXPECTED_CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const EXPECTED_SCRATCH_VOLUME =
  'weeditpro-sam31-source-prep-scratch' as const
const EXPECTED_SCRATCH_MOUNT =
  '/mnt/weeditpro-private/l4-visual-evidence' as const
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-eight-minute-source-preparation-launches'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/+:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('//'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>
const cloudRunOperationResourceSchema = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/operations\/[A-Za-z0-9._-]+$/u,
)

const cloudRunResultSchema = z.object({
  disposition: z.enum([
    'accepted',
    'rejected_before_creation',
    'outcome_unknown_requires_reconciliation',
  ]),
  cloudRunJobDefinitionRef: refSchema.nullable(),
  cloudJobCreateRequestRef: refSchema,
  cloudRunOperationResource: cloudRunOperationResourceSchema.nullable(),
  cloudRunOperationRef: refSchema.nullable(),
  substantiveWorkOutcomeAtAcceptance: z.enum([
    'not_executed', 'unknown',
  ]),
  costOutcomeAtAcceptance: z.enum(['not_incurred', 'unknown']),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const exact = value.disposition === 'accepted'
    ? value.cloudRunJobDefinitionRef !== null
      && value.cloudRunOperationResource !== null
      && value.cloudRunOperationRef !== null
      && value.substantiveWorkOutcomeAtAcceptance === 'unknown'
      && value.costOutcomeAtAcceptance === 'unknown'
    : value.disposition === 'rejected_before_creation'
      ? value.cloudRunJobDefinitionRef === null
        && value.cloudRunOperationResource === null
        && value.cloudRunOperationRef === null
        && value.substantiveWorkOutcomeAtAcceptance === 'not_executed'
        && value.costOutcomeAtAcceptance === 'not_incurred'
      : value.cloudRunJobDefinitionRef !== null
        && value.cloudRunOperationResource === null
        && value.cloudRunOperationRef === null
        && value.substantiveWorkOutcomeAtAcceptance === 'unknown'
        && value.costOutcomeAtAcceptance === 'unknown'
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'SAM source-preparation Cloud Run result changed.',
  })
})
export type CanonicalSam31EightMinuteSourcePreparationCloudRunResult = z.infer<
  typeof cloudRunResultSchema
>

const launchWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_LAUNCH_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_eight_minute_source_preparation_launch_owner',
  ),
  evidenceClass: z.literal('canonical_private_cloud_run_launch_observation'),
  invocationId: safeId,
  admissionRef: refSchema,
  consumptionRef: refSchema,
  releaseRef: refSchema,
  immutableImageRef: refSchema,
  cloudRunJobDefinitionRef: refSchema.nullable(),
  cloudJobCreateRequestRef: refSchema,
  cloudRunOperationResource: cloudRunOperationResourceSchema.nullable(),
  cloudRunOperationRef: refSchema.nullable(),
  disposition: cloudRunResultSchema.shape.disposition,
  substantiveWorkOutcomeAtAcceptance:
    cloudRunResultSchema.shape.substantiveWorkOutcomeAtAcceptance,
  costOutcomeAtAcceptance: cloudRunResultSchema.shape.costOutcomeAtAcceptance,
  projectId: z.literal(PROJECT_ID),
  region: z.literal(REGION),
  cloudRunJobResource: z.literal(JOB_RESOURCE),
  routeId: z.literal('l4_standard_primary'),
  accelerator: z.literal('nvidia_l4'),
  maximumAttempts: z.literal(1),
  createOnlyAdmissionConsumedBeforeCloudRunCall: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  callerCloudResourceImageCommandArgsOrEnvironmentAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const exact = value.disposition === 'accepted'
    ? value.cloudRunJobDefinitionRef !== null
      && value.cloudRunOperationResource !== null
      && value.cloudRunOperationRef !== null
      && value.substantiveWorkOutcomeAtAcceptance === 'unknown'
      && value.costOutcomeAtAcceptance === 'unknown'
    : value.disposition === 'rejected_before_creation'
      ? value.cloudRunJobDefinitionRef === null
        && value.cloudRunOperationResource === null
        && value.cloudRunOperationRef === null
        && value.substantiveWorkOutcomeAtAcceptance === 'not_executed'
        && value.costOutcomeAtAcceptance === 'not_incurred'
      : value.cloudRunJobDefinitionRef !== null
        && value.cloudRunOperationResource === null
        && value.cloudRunOperationRef === null
        && value.substantiveWorkOutcomeAtAcceptance === 'unknown'
        && value.costOutcomeAtAcceptance === 'unknown'
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'SAM source-preparation launch state changed.',
  })
})
const launchSchema = launchWithoutHashSchema.extend({
  launchHash: sha256,
}).strict()
export type CanonicalSam31EightMinuteSourcePreparationLaunch = z.infer<
  typeof launchSchema
>

const repositoryRecordWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_LAUNCH_REPOSITORY_VERSION,
  ),
  recordKind: z.literal('sam3_1_source_preparation_launch'),
  launch: launchSchema,
}).strict()
const repositoryRecordSchema = repositoryRecordWithoutHashSchema.extend({
  recordHash: sha256,
}).strict()

export interface CanonicalSam31EightMinuteSourcePreparationCloudRunPort {
  readonly schemaVersion: typeof
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_CLOUD_RUN_PORT_VERSION
  runOnce(input: {
    readonly invocationId: string
    readonly release: CanonicalSam31EightMinuteSourcePreparationRelease
  }): Promise<CanonicalSam31EightMinuteSourcePreparationCloudRunResult>
}

export interface CanonicalSam31EightMinuteSourcePreparationLaunchRepository {
  readonly schemaVersion: typeof
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_LAUNCH_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly launch: CanonicalSam31EightMinuteSourcePreparationLaunch
  }): Promise<'created' | 'identical_replay'>
  reread(input: {
    readonly invocationId: string
  }): Promise<CanonicalSam31EightMinuteSourcePreparationLaunch | null>
}

export type CanonicalSam31EightMinuteSourcePreparationLaunchResult =
  | Readonly<{
      status: 'not_ready'
      blockerCode:
        | 'sam31_source_preparation_admission_not_ready'
        | 'sam31_source_preparation_cloud_run_not_started'
      cloudJobStarted: false
      automaticRetryAllowed: false
      customerCreditsMutated: false
    }>
  | Readonly<{
      status: 'reconciliation_required'
      invocationId: string
      blockerCode:
        | 'sam31_source_preparation_consumed_launch_not_observed'
        | 'sam31_source_preparation_cloud_outcome_unknown'
      cloudJobStartState: 'unknown'
      automaticRetryAllowed: false
      customerCreditsMutated: false
    }>
  | Readonly<{
      status: 'accepted'
      disposition: 'created' | 'identical_replay'
      invocationId: string
      cloudRunOperationRef: EvidenceRef
      workerOutcomeAtAcceptance: 'unknown'
      costOutcomeAtAcceptance: 'unknown'
      exactCreateOnlyConsumptionAndLaunchRereadVerified: true
      automaticRetryAllowed: false
      customerCreditsMutated: false
      productionAuthorityGranted: false
    }>

export interface CanonicalSam31EightMinuteSourcePreparationLaunchOwner {
  readonly schemaVersion: typeof
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_LAUNCH_OWNER_VERSION
  readonly maximumAttempts: 1
  readonly automaticRetryAfterUnknownOutcomeAllowed: false
  readonly customerCreditMutationAllowed: false
  startOneShot(input: unknown): Promise<
    CanonicalSam31EightMinuteSourcePreparationLaunchResult
  >
}

export function createGoogleCloudRunSam31EightMinuteSourcePreparationPort(
  input: {
    readonly auth?: Pick<GoogleAuth, 'request'>
    readonly now?: () => string
    readonly requestTimeoutMilliseconds?: number
  } = {},
): CanonicalSam31EightMinuteSourcePreparationCloudRunPort {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const now = input.now ?? (() => new Date().toISOString())
  const timeout = input.requestTimeoutMilliseconds ?? 15_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 30_000) {
    throw new TypeError('SAM source-preparation launch timeout is invalid.')
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_CLOUD_RUN_PORT_VERSION,
    async runOnce({ invocationId: rawId, release: rawRelease }: {
      readonly invocationId: string
      readonly release: CanonicalSam31EightMinuteSourcePreparationRelease
    }) {
      const invocationId = safeId.parse(rawId)
      const release = assertCanonicalSam31EightMinuteSourcePreparationRelease(
        rawRelease,
        now(),
      )
      if (release.cloudRunJobResource !== JOB_RESOURCE
        || release.maximumExecutionSeconds !== 7_200
        || release.maximumAttempts !== 1
        || release.minimumIdleInstances !== 0
        || release.uncertainOutcomeRetryAllowed
        || release.substantiveCpuMediaProcessingAllowed
        || release.runtimeDownloadAllowed
        || release.productionAuthorityGranted) {
        return cloudRunResultSchema.parse({
          disposition: 'rejected_before_creation',
          cloudRunJobDefinitionRef: null,
          cloudJobCreateRequestRef: requestRef(invocationId, release, null),
          cloudRunOperationResource: null,
          cloudRunOperationRef: null,
          substantiveWorkOutcomeAtAcceptance: 'not_executed',
          costOutcomeAtAcceptance: 'not_incurred',
          observedAt: now(),
        })
      }
      let cloudRunJobDefinitionRef: EvidenceRef | null = null
      let cloudJobCreateRequestRef = requestRef(invocationId, release, null)
      let requestStarted = false
      try {
        const definitionResponse = await auth.request({
          url: `${CLOUD_RUN_API_ORIGIN}/v2/${JOB_RESOURCE}`,
          method: 'GET',
          timeout,
          retry: false,
          maxRedirects: 0,
        })
        cloudRunJobDefinitionRef =
          getCanonicalSam31EightMinuteSourcePreparationCloudRunJobDefinitionRef({
          untrusted: definitionResponse.data,
          release,
          })
        cloudJobCreateRequestRef = requestRef(
          invocationId,
          release,
          cloudRunJobDefinitionRef,
        )
        requestStarted = true
        const response = await auth.request({
          url: `${CLOUD_RUN_API_ORIGIN}/v2/${JOB_RESOURCE}:run`,
          method: 'POST',
          data: {
            overrides: {
              taskCount: 1,
              timeout: '7200s',
              containerOverrides: [{
                env: [{
                  name: INVOCATION_ENVIRONMENT_NAME,
                  value: invocationId,
                }],
              }],
            },
          },
          timeout,
          retry: false,
          maxRedirects: 0,
        })
        assertPlainSerializedData(response.data, 'sam31_source_prep_cloud_run')
        const operation = z.object({
          name: cloudRunOperationResourceSchema,
        }).passthrough().parse(response.data)
        const observedAt = timestamp.parse(now())
        return cloudRunResultSchema.parse({
          disposition: 'accepted',
          cloudRunJobDefinitionRef,
          cloudJobCreateRequestRef,
          cloudRunOperationResource: operation.name,
          cloudRunOperationRef: ref(
            `${invocationId}:cloud-run-operation`,
            sha256AuthorityValue({
              jobResource: JOB_RESOURCE,
              operationResource: operation.name,
              cloudJobCreateRequestRef,
            }),
          ),
          substantiveWorkOutcomeAtAcceptance: 'unknown',
          costOutcomeAtAcceptance: 'unknown',
          observedAt,
        })
      } catch {
        return cloudRunResultSchema.parse({
          disposition: requestStarted
            ? 'outcome_unknown_requires_reconciliation'
            : 'rejected_before_creation',
          cloudRunJobDefinitionRef,
          cloudJobCreateRequestRef,
          cloudRunOperationResource: null,
          cloudRunOperationRef: null,
          substantiveWorkOutcomeAtAcceptance: requestStarted
            ? 'unknown' : 'not_executed',
          costOutcomeAtAcceptance: requestStarted
            ? 'unknown' : 'not_incurred',
          observedAt: timestamp.parse(now()),
        })
      }
    },
  })
}

export function assertCanonicalSam31EightMinuteSourcePreparationLaunch(
  value: unknown,
): CanonicalSam31EightMinuteSourcePreparationLaunch {
  assertPlainSerializedData(value, 'sam31_source_prep_launch')
  const launch = launchSchema.parse(value)
  const { launchHash, ...payload } = launch
  if (launchHash !== sha256AuthorityValue(payload)) {
    throw conflict('sam31_source_preparation_launch_digest_changed')
  }
  return freeze(structuredClone(launch))
}

export function createCanonicalSam31EightMinuteSourcePreparationLaunchRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31EightMinuteSourcePreparationLaunchRepository {
  if (typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function') {
    throw notReady('sam31_source_preparation_launch_store_not_ready')
  }
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const reread = async (invocationId: string) => {
    const id = safeId.parse(invocationId)
    const body = await input.objectPort.readExact(`${prefix}/${id}.json`)
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw conflict('sam31_source_preparation_launch_record_bytes_changed')
    }
    let decoded: unknown
    try {
      decoded = JSON.parse(body.toString('utf8'))
    } catch {
      throw conflict('sam31_source_preparation_launch_record_json_changed')
    }
    assertPlainSerializedData(decoded, 'sam31_source_prep_launch_record')
    const record = repositoryRecordSchema.parse(decoded)
    const { recordHash, ...payload } = record
    const launch = assertCanonicalSam31EightMinuteSourcePreparationLaunch(
      record.launch,
    )
    if (recordHash !== sha256AuthorityValue(payload)
      || launch.invocationId !== id
      || body.toString('utf8') !== stableAuthorityStringify(record)) {
      throw conflict('sam31_source_preparation_launch_record_changed')
    }
    return launch
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_LAUNCH_REPOSITORY_VERSION,
    async persistCreateOnly({ launch: rawLaunch }: {
      readonly launch: CanonicalSam31EightMinuteSourcePreparationLaunch
    }) {
      const launch = assertCanonicalSam31EightMinuteSourcePreparationLaunch(
        rawLaunch,
      )
      const payload = repositoryRecordWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_LAUNCH_REPOSITORY_VERSION,
        recordKind: 'sam3_1_source_preparation_launch',
        launch,
      })
      const record = repositoryRecordSchema.parse({
        ...payload,
        recordHash: sha256AuthorityValue(payload),
      })
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      const disposition = await input.objectPort.createOnly({
        objectPath: `${prefix}/${launch.invocationId}.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const exact = await reread(launch.invocationId)
      if (!exact || exact.launchHash !== launch.launchHash) {
        throw conflict('sam31_source_preparation_launch_reread_changed')
      }
      return disposition === 'created'
        ? 'created' as const : 'identical_replay' as const
    },
    reread({ invocationId }: { readonly invocationId: string }) {
      return reread(invocationId)
    },
  })
}

export function createCanonicalSam31EightMinuteSourcePreparationLaunchOwner(
  input: {
    readonly authorityRepository:
      CanonicalSam31EightMinuteSourcePreparationAuthorityRepository
    readonly launchRepository:
      CanonicalSam31EightMinuteSourcePreparationLaunchRepository
    readonly cloudRunPort:
      CanonicalSam31EightMinuteSourcePreparationCloudRunPort
    readonly now?: () => string
  },
): CanonicalSam31EightMinuteSourcePreparationLaunchOwner {
  assertDependencies(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_LAUNCH_OWNER_VERSION,
    maximumAttempts: 1 as const,
    automaticRetryAfterUnknownOutcomeAllowed: false as const,
    customerCreditMutationAllowed: false as const,
    async startOneShot(untrusted: unknown) {
      assertPlainSerializedData(untrusted, 'sam31_source_prep_launch_request')
      const request = z.object({ invocationId: safeId }).strict()
        .parse(untrusted)
      const existingLaunch = await input.launchRepository.reread(request)
      if (existingLaunch) return projectLaunch(existingLaunch,
        'identical_replay')
      const admissionRaw = await input.authorityRepository.rereadAdmission(
        request,
      )
      if (!admissionRaw) return Object.freeze({
        status: 'not_ready' as const,
        blockerCode: 'sam31_source_preparation_admission_not_ready' as const,
        cloudJobStarted: false as const,
        automaticRetryAllowed: false as const,
        customerCreditsMutated: false as const,
      })
      const at = timestamp.parse(now())
      const admission =
        assertCanonicalSam31EightMinuteSourcePreparationAdmission(
          admissionRaw,
          at,
        )
      const existingConsumption = await input.authorityRepository
        .rereadConsumption(request)
      if (existingConsumption) return reconciliation(
        request.invocationId,
        'sam31_source_preparation_consumed_launch_not_observed',
      )
      const consumedAt = timestamp.parse(now())
      const consumption =
        createCanonicalSam31EightMinuteSourcePreparationConsumption({
          admission,
          idempotencyKey: admission.idempotencyKey,
          consumedAt,
        })
      if (await input.authorityRepository.consumeAdmissionCreateOnly({
        consumption,
      }) !== 'created') {
        throw conflict('sam31_source_preparation_consumption_not_created')
      }
      const consumed = await input.authorityRepository
        .rereadConsumedAdmission(request)
      if (!consumed
        || consumed.consumption.consumptionHash !==
          consumption.consumptionHash) {
        throw conflict('sam31_source_preparation_consumption_reread_changed')
      }
      const cloud = await input.cloudRunPort.runOnce({
        invocationId: request.invocationId,
        release: consumed.release,
      })
      const launch = buildLaunch({ admission, consumption, release:
        consumed.release, cloud })
      const disposition = await input.launchRepository.persistCreateOnly({
        launch,
      })
      const reread = await input.launchRepository.reread(request)
      if (!reread || reread.launchHash !== launch.launchHash) {
        throw conflict('sam31_source_preparation_launch_exact_reread_changed')
      }
      return projectLaunch(reread, disposition)
    },
  })
}

function buildLaunch(input: {
  admission: ReturnType<
    typeof assertCanonicalSam31EightMinuteSourcePreparationAdmission
  >
  consumption: ReturnType<
    typeof createCanonicalSam31EightMinuteSourcePreparationConsumption
  >
  release: CanonicalSam31EightMinuteSourcePreparationRelease
  cloud: CanonicalSam31EightMinuteSourcePreparationCloudRunResult
}): CanonicalSam31EightMinuteSourcePreparationLaunch {
  const payload = launchWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_LAUNCH_VERSION,
    source:
      'canonical_server_sam3_1_eight_minute_source_preparation_launch_owner',
    evidenceClass: 'canonical_private_cloud_run_launch_observation',
    invocationId: input.admission.invocationId,
    admissionRef: ref(input.admission.admissionId,
      input.admission.admissionHash),
    consumptionRef: ref(
      `${input.consumption.invocationId}:consumption`,
      input.consumption.consumptionHash,
    ),
    releaseRef: input.admission.releaseRef,
    immutableImageRef: input.admission.immutableImageRef,
    cloudRunJobDefinitionRef: input.cloud.cloudRunJobDefinitionRef,
    cloudJobCreateRequestRef: input.cloud.cloudJobCreateRequestRef,
    cloudRunOperationResource: input.cloud.cloudRunOperationResource,
    cloudRunOperationRef: input.cloud.cloudRunOperationRef,
    disposition: input.cloud.disposition,
    substantiveWorkOutcomeAtAcceptance:
      input.cloud.substantiveWorkOutcomeAtAcceptance,
    costOutcomeAtAcceptance: input.cloud.costOutcomeAtAcceptance,
    projectId: PROJECT_ID,
    region: REGION,
    cloudRunJobResource: input.release.cloudRunJobResource,
    routeId: input.release.routeId,
    accelerator: input.release.accelerator,
    maximumAttempts: 1,
    createOnlyAdmissionConsumedBeforeCloudRunCall: true,
    automaticRetryAllowed: false,
    callerCloudResourceImageCommandArgsOrEnvironmentAccepted: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    observedAt: input.cloud.observedAt,
  })
  return assertCanonicalSam31EightMinuteSourcePreparationLaunch({
    ...payload,
    launchHash: sha256AuthorityValue(payload),
  })
}

function projectLaunch(
  launch: CanonicalSam31EightMinuteSourcePreparationLaunch,
  disposition: 'created' | 'identical_replay',
): CanonicalSam31EightMinuteSourcePreparationLaunchResult {
  if (launch.disposition !== 'accepted' || !launch.cloudRunOperationRef) {
    if (launch.disposition === 'rejected_before_creation') {
      return freeze({
        status: 'not_ready' as const,
        blockerCode: 'sam31_source_preparation_cloud_run_not_started' as const,
        cloudJobStarted: false as const,
        automaticRetryAllowed: false as const,
        customerCreditsMutated: false as const,
      })
    }
    return reconciliation(
      launch.invocationId,
      'sam31_source_preparation_cloud_outcome_unknown',
    )
  }
  return freeze({
    status: 'accepted' as const,
    disposition,
    invocationId: launch.invocationId,
    cloudRunOperationRef: launch.cloudRunOperationRef,
    workerOutcomeAtAcceptance: 'unknown' as const,
    costOutcomeAtAcceptance: 'unknown' as const,
    exactCreateOnlyConsumptionAndLaunchRereadVerified: true as const,
    automaticRetryAllowed: false as const,
    customerCreditsMutated: false as const,
    productionAuthorityGranted: false as const,
  })
}

function reconciliation(
  invocationId: string,
  blockerCode:
    | 'sam31_source_preparation_consumed_launch_not_observed'
    | 'sam31_source_preparation_cloud_outcome_unknown',
): CanonicalSam31EightMinuteSourcePreparationLaunchResult {
  return Object.freeze({
    status: 'reconciliation_required' as const,
    invocationId,
    blockerCode,
    cloudJobStartState: 'unknown' as const,
    automaticRetryAllowed: false as const,
    customerCreditsMutated: false as const,
  })
}

function requestRef(
  invocationId: string,
  release: CanonicalSam31EightMinuteSourcePreparationRelease,
  cloudRunJobDefinitionRef: EvidenceRef | null,
): EvidenceRef {
  return ref(`${invocationId}:cloud-job-create`, sha256AuthorityValue({
    invocationId,
    releaseRef: ref(release.releaseId, release.releaseHash),
    cloudRunJobDefinitionRef,
    jobResource: JOB_RESOURCE,
    taskCount: 1,
    timeout: '7200s',
    environmentOverrideName: INVOCATION_ENVIRONMENT_NAME,
  }))
}

export function getCanonicalSam31EightMinuteSourcePreparationCloudRunJobDefinitionRef(
  input: {
  readonly untrusted: unknown
  readonly release: CanonicalSam31EightMinuteSourcePreparationRelease
  },
): EvidenceRef {
  assertPlainSerializedData(input.untrusted,
    'sam31_source_prep_cloud_run_job_definition')
  const definition = z.object({
    name: z.literal(JOB_RESOURCE),
    uid: safeId,
    generation: z.union([z.string().regex(/^\d+$/u),
      z.number().int().nonnegative().safe()]),
    updateTime: timestamp,
    labels: z.record(z.string(), z.string()),
    template: z.object({
      parallelism: z.literal(1),
      taskCount: z.literal(1),
      template: z.object({
        containers: z.array(z.object({
          image: z.string(),
          command: z.tuple([z.literal(EXPECTED_COMMAND)]),
          args: z.tuple([z.literal(EXPECTED_ENTRYPOINT)]),
          env: z.array(z.object({
            name: z.string(),
            value: z.string(),
          }).passthrough()),
          resources: z.object({
            limits: z.record(z.string(), z.string()),
          }).passthrough(),
          volumeMounts: z.array(z.object({
            name: z.string(),
            mountPath: z.string(),
          }).passthrough()),
        }).passthrough()).length(1),
        volumes: z.array(z.object({
          name: z.string(),
          emptyDir: z.object({
            medium: z.literal('MEMORY'),
            sizeLimit: z.literal('24Gi'),
          }).passthrough(),
        }).passthrough()),
        maxRetries: z.literal(0),
        timeout: z.literal('7200s'),
        serviceAccount: z.literal(EXPECTED_SERVICE_ACCOUNT),
        nodeSelector: z.record(z.string(), z.string()),
        gpuZonalRedundancyDisabled: z.literal(true),
      }).passthrough(),
    }).passthrough(),
  }).passthrough().parse(input.untrusted)
  const container = definition.template.template.containers[0]
  const environment = new Map(container.env.map((entry) => [
    entry.name, entry.value,
  ]))
  const volumes = definition.template.template.volumes
  const mounts = container.volumeMounts
  const exact = container.image ===
      `${EXPECTED_IMAGE_PREFIX}${input.release.immutableImageDigest}`
    && container.resources.limits.cpu === '8'
    && container.resources.limits.memory === '32Gi'
    && container.resources.limits['nvidia.com/gpu'] === '1'
    && definition.template.template.nodeSelector[
      'run.googleapis.com/accelerator'
    ] === 'nvidia-l4'
    && environment.size === 3
    && environment.get('REEDITPRO_ENV') === 'production'
    && environment.get('WORKER_GROUP') === 'l4_standard_primary'
    && environment.get('GCS_CONTROL_PLANE_STATE_BUCKET') ===
      EXPECTED_CONTROL_PLANE_STATE_BUCKET
    && mounts.length === 1
    && mounts[0]?.name === EXPECTED_SCRATCH_VOLUME
    && mounts[0]?.mountPath === EXPECTED_SCRATCH_MOUNT
    && volumes.length === 1
    && volumes[0]?.name === EXPECTED_SCRATCH_VOLUME
    && definition.labels.app === 'weeditpro'
    && definition.labels.operation === 'sam31-source-preparation'
    && definition.labels.route === 'l4-standard-primary'
    && definition.labels.scale === 'zero'
  if (!exact) throw conflict(
    'sam31_source_preparation_live_cloud_run_definition_changed',
  )
  const normalizedConfiguration = {
    name: definition.name,
    uid: definition.uid,
    generation: String(definition.generation),
    updateTime: definition.updateTime,
    labels: {
      app: definition.labels.app,
      operation: definition.labels.operation,
      route: definition.labels.route,
      scale: definition.labels.scale,
    },
    image: container.image,
    command: container.command,
    args: container.args,
    environment: Object.fromEntries([...environment.entries()].sort(
      ([left], [right]) => left < right ? -1 : left > right ? 1 : 0,
    )),
    resources: {
      cpu: container.resources.limits.cpu,
      memory: container.resources.limits.memory,
      gpu: container.resources.limits['nvidia.com/gpu'],
    },
    volumeMounts: mounts,
    volumes,
    parallelism: definition.template.parallelism,
    taskCount: definition.template.taskCount,
    maxRetries: definition.template.template.maxRetries,
    timeout: definition.template.template.timeout,
    serviceAccount: definition.template.template.serviceAccount,
    nodeSelector: definition.template.template.nodeSelector,
    gpuZonalRedundancyDisabled:
      definition.template.template.gpuZonalRedundancyDisabled,
  }
  return ref(`${definition.uid}:cloud-run-job-definition`,
    sha256AuthorityValue(normalizedConfiguration))
}

function assertDependencies(input: Parameters<
  typeof createCanonicalSam31EightMinuteSourcePreparationLaunchOwner
>[0]): void {
  if (typeof input.authorityRepository?.rereadAdmission !== 'function'
    || typeof input.authorityRepository?.rereadConsumption !== 'function'
    || typeof input.authorityRepository?.consumeAdmissionCreateOnly !==
      'function'
    || typeof input.authorityRepository?.rereadConsumedAdmission !== 'function'
    || typeof input.launchRepository?.persistCreateOnly !== 'function'
    || typeof input.launchRepository?.reread !== 'function'
    || input.cloudRunPort?.schemaVersion !==
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_CLOUD_RUN_PORT_VERSION
    || typeof input.cloudRunPort.runOnce !== 'function') {
    throw notReady('sam31_source_preparation_launch_dependencies_not_ready')
  }
}

function ref(id: string, hash: string): EvidenceRef {
  return Object.freeze(refSchema.parse({
    id,
    version: 1,
    contentHash: `sha256:${hash}`,
  }))
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'SAM 3.1 source-preparation launch authority changed.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'SAM 3.1 source-preparation launch is not ready.',
    503,
    { requiredGate },
  )
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) {
      freeze(child)
    }
  }
  return value
}
