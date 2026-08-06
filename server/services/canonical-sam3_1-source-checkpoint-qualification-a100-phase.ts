import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  assertCanonicalSam31QualificationImageSupplyChainRelease,
  type CanonicalSam31QualificationImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-qualification-image-supply-chain-release'
import {
  assertCanonicalSam31SourceCheckpointQualificationWorkerRequest,
  type CanonicalSam31SourceCheckpointQualificationWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_QUALIFICATION_A100_MOUNT_OBSERVATION_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-a100-mount-observation-v1' as const
export const CANONICAL_SAM3_1_QUALIFICATION_A100_ADMISSION_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-a100-admission-v1' as const
export const CANONICAL_SAM3_1_QUALIFICATION_A100_SUBMISSION_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-a100-submission-v1' as const
export const CANONICAL_SAM3_1_QUALIFICATION_A100_JOB_OBSERVATION_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-a100-job-observation-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const BATCH_COLLECTION =
  'projects/reeditpro/locations/us-central1/jobs' as const
const BATCH_ENDPOINT =
  'https://batch.googleapis.com/v1/projects/reeditpro/locations/us-central1/jobs' as const
const INSTANCE_TEMPLATE =
  'projects/reeditpro/global/instanceTemplates/weeditpro-sam31-qualification-a100-v1' as const
const PRIVATE_NETWORK =
  'projects/reeditpro/global/networks/weeditpro-gpu-private' as const
const PRIVATE_SUBNETWORK =
  'projects/reeditpro/regions/us-central1/subnetworks/weeditpro-gpu-private-us-central1' as const
const SERVICE_ACCOUNT =
  'reeditpro-sam31-qualification-sa@reeditpro.iam.gserviceaccount.com' as const
const MOUNT_PATH = '/mnt/disks/reeditpro/sam31-qualification' as const
const REQUEST_OBJECT_NAME = 'request/request.json' as const
const CHECKPOINT_OBJECT_NAME =
  'checkpoint/sam3.1_multiplex.pt' as const
const FIXTURE_OBJECT_NAME = 'fixture/probe-person.mp4' as const
const RESULT_OBJECT_NAME = 'result/result.json' as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safeResource = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const exactPrivateObjectSchema = z.object({
  objectName: z.enum([
    REQUEST_OBJECT_NAME,
    CHECKPOINT_OBJECT_NAME,
    FIXTURE_OBJECT_NAME,
  ]),
  storageGeneration: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  storageEtag: z.string().trim().min(1).max(512),
  byteLength: positiveInteger,
  sha256: rawSha256,
  exactGenerationEtagLengthAndSha256Reread: z.literal(true),
  readOnlyForWorker: z.literal(true),
}).strict()

const mountWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_A100_MOUNT_OBSERVATION_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_qualification_private_mount_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  attemptId: safeId,
  qualificationId: safeId,
  workerRequestRef: evidenceRefSchema,
  stagingAuthorityRef: evidenceRefSchema,
  serviceIdentityRef: evidenceRefSchema,
  privateNetworkPolicyRef: evidenceRefSchema,
  instanceTemplateRef: evidenceRefSchema,
  projectId: z.literal(PROJECT_ID),
  region: z.literal(REGION),
  privateBucketName: z.string().regex(
    /^reeditpro-[a-z0-9][a-z0-9.-]{1,180}$/u,
  ),
  attemptRemoteSubdirectory: z.string().regex(
    /^private\/sam3_1\/source-checkpoint-qualification\/v1\/attempts\/[a-f0-9]{64}$/u,
  ),
  gcsRemotePath: z.string().max(1_024),
  mountPath: z.literal(MOUNT_PATH),
  mountOptions: z.literal('rw,implicit-dirs'),
  requestObject: exactPrivateObjectSchema.extend({
    objectName: z.literal(REQUEST_OBJECT_NAME),
    requestCanonicalHash: rawSha256,
  }).strict(),
  checkpointObject: exactPrivateObjectSchema.extend({
    objectName: z.literal(CHECKPOINT_OBJECT_NAME),
  }).strict(),
  probeFixtureObject: exactPrivateObjectSchema.extend({
    objectName: z.literal(FIXTURE_OBJECT_NAME),
  }).strict(),
  resultObjectName: z.literal(RESULT_OBJECT_NAME),
  resultObjectAbsentBeforeLaunch: z.literal(true),
  resultParentCreatedForWorkerOnly: z.literal(true),
  exactAttemptSubdirectoryReread: z.literal(true),
  requestCheckpointAndFixtureOnlyInputObjectSet: z.literal(true),
  serviceIdentityReadInputsWriteResultOnly: z.literal(true),
  objectBytesPathsUrlsOrCredentialsIncludedInWorkerRequest: z.literal(false),
  signedUrlOrPublicObjectUsed: z.literal(false),
  callerBucketPrefixPathOrObjectAccepted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const expectedSubdirectory =
    `private/sam3_1/source-checkpoint-qualification/v1/attempts/`
    + sha256AuthorityValue(value.attemptId)
  if (
    value.attemptRemoteSubdirectory !== expectedSubdirectory
    || value.gcsRemotePath !==
      `${value.privateBucketName}/${value.attemptRemoteSubdirectory}`
    || value.requestObject.requestCanonicalHash !==
      value.workerRequestRef.contentHash.slice(7)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 qualification mount lost its exact attempt scope.',
  })
})

export const canonicalSam31QualificationA100MountObservationSchema =
  mountWithoutHashSchema.extend({ observationHash: rawSha256 }).strict()
export type CanonicalSam31QualificationA100MountObservation = z.infer<
  typeof canonicalSam31QualificationA100MountObservationSchema
>

const admissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_A100_ADMISSION_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_source_checkpoint_qualification_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  attemptId: safeId,
  qualificationId: safeId,
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  workerRequestRef: evidenceRefSchema,
  qualificationImageSupplyChainReleaseRef: evidenceRefSchema,
  qualificationImageRef: evidenceRefSchema,
  qualificationImageDigest: prefixedSha256,
  qualificationImageUri: z.string().regex(
    /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-qualification@sha256:[a-f0-9]{64}$/u,
  ),
  mountObservationRef: evidenceRefSchema,
  accountEffectiveA100RateAuthorityRef: evidenceRefSchema,
  projectId: z.literal(PROJECT_ID),
  region: z.literal(REGION),
  batchCollection: z.literal(BATCH_COLLECTION),
  instanceTemplateResource: z.literal(INSTANCE_TEMPLATE),
  privateNetworkResource: z.literal(PRIVATE_NETWORK),
  privateSubnetworkResource: z.literal(PRIVATE_SUBNETWORK),
  noExternalIpAddress: z.literal(true),
  serviceAccountEmail: z.literal(SERVICE_ACCOUNT),
  executionTarget: z.literal('google_cloud_batch_a2_ultra_job'),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
  allocatedGpuCount: z.literal(1),
  allocatedVcpuCount: z.literal(12),
  allocatedMemoryGiB: z.literal(170),
  taskCount: z.literal(1),
  taskParallelism: z.literal(1),
  maximumExecutionSeconds: z.literal(7_200),
  maximumTaskRetries: z.literal(0),
  allowedZones: z.tuple([
    z.literal('us-central1-a'),
    z.literal('us-central1-c'),
  ]),
  userTriggered: z.literal(true),
  minimumIdleInstances: z.literal(0),
  prewarmingOrKeepaliveAllowed: z.literal(false),
  externalIpAllowed: z.literal(false),
  publicNetworkEgressAllowed: z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  substantiveCpuModelOrMediaExecutionAllowed: z.literal(false),
  callerCommandImageModelCheckpointPathUrlOrEnvironmentAccepted:
    z.literal(false),
  createOnlyAdmissionConsumptionRequiredBeforeBatchCreate: z.literal(true),
  oneAdmissionCreatesAtMostOneBatchJob: z.literal(true),
  retryAfterUnknownCreateOutcomeAllowed: z.literal(false),
  billingClassification: z.literal('platform_internal_qualification'),
  accountEffectivePricingReread: z.literal(true),
  internalAttemptCostReceiptRequired: z.literal(true),
  customerCreditsReserved: z.literal(false),
  customerCreditsSpent: z.literal(false),
  customerBillingAuthorityGranted: z.literal(false),
  sourceCheckpointQualificationGranted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionReady: z.literal(false),
  admittedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (
    value.qualificationImageRef.contentHash !== value.qualificationImageDigest
    || !value.qualificationImageUri.endsWith(
      `@${value.qualificationImageDigest}`,
    )
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 qualification admission lost its immutable image.',
  })
})

export const canonicalSam31QualificationA100AdmissionSchema =
  admissionWithoutHashSchema.extend({ admissionHash: rawSha256 }).strict()
export type CanonicalSam31QualificationA100Admission = z.infer<
  typeof canonicalSam31QualificationA100AdmissionSchema
>

const submissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_A100_SUBMISSION_VERSION,
  ),
  source: z.literal(
    'canonical_server_google_batch_sam3_1_qualification_launch_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  disposition: z.enum(['submitted', 'outcome_unknown']),
  attemptId: safeId,
  admissionRef: evidenceRefSchema,
  batchJobId: z.string().regex(/^weeditpro-sam31-q-[a-f0-9]{40}$/u),
  batchJobResource: z.string().regex(
    /^projects\/reeditpro\/locations\/us-central1\/jobs\/weeditpro-sam31-q-[a-f0-9]{40}$/u,
  ),
  providerRequestIdDigestSha256: rawSha256,
  createRequestBodyRef: evidenceRefSchema,
  immutableImageDigest: prefixedSha256,
  mountObservationRef: evidenceRefSchema,
  providerHttpStatus: z.number().int().min(100).max(599).nullable(),
  batchJobUid: safeId.nullable(),
  providerOutcome: z.enum(['executed', 'unknown']),
  durableAdmissionConsumedBeforeProviderCall: z.literal(true),
  durableSubmissionCreatedAndExactReread: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  providerCallMade: z.literal(true),
  sourceCheckpointQualificationGranted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const submitted = value.disposition === 'submitted'
  if (
    value.batchJobResource !== `${BATCH_COLLECTION}/${value.batchJobId}`
    || (submitted
      ? value.providerOutcome !== 'executed'
        || value.providerHttpStatus === null
        || value.batchJobUid === null
      : value.providerOutcome !== 'unknown'
        || value.batchJobUid !== null)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 qualification Batch submission truth changed.',
  })
})

export const canonicalSam31QualificationA100SubmissionSchema =
  submissionWithoutHashSchema.extend({ submissionHash: rawSha256 }).strict()
export type CanonicalSam31QualificationA100Submission = z.infer<
  typeof canonicalSam31QualificationA100SubmissionSchema
>

const observationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_A100_JOB_OBSERVATION_VERSION,
  ),
  source: z.literal(
    'canonical_server_google_batch_sam3_1_qualification_reconciliation_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  disposition: z.enum([
    'pending',
    'job_succeeded_pending_result_reread',
    'job_failed',
    'outcome_unknown',
  ]),
  attemptId: safeId,
  admissionRef: evidenceRefSchema,
  submissionRef: evidenceRefSchema,
  batchJobResource: safeResource,
  batchJobUid: safeId.nullable(),
  batchState: z.enum([
    'STATE_UNSPECIFIED', 'QUEUED', 'SCHEDULED', 'RUNNING',
    'SUCCEEDED', 'FAILED', 'DELETION_IN_PROGRESS', 'OUTCOME_UNKNOWN',
  ]),
  exactCreateConfigurationEchoVerified: z.boolean(),
  exactImmutableImageDigestVerified: z.boolean(),
  exactAttemptSubdirectoryMountVerified: z.boolean(),
  configuredAutomaticRetryCount: z.literal(0),
  resultObjectReread: z.literal(false),
  actualCudaQualificationAccepted: z.literal(false),
  internalAttemptCostReread: z.literal(false),
  automaticRetryAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  sourceCheckpointQualificationGranted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionReady: z.literal(false),
  terminalObservationPersistedCreateOnly: z.boolean(),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const unknown = value.disposition === 'outcome_unknown'
  const succeeded = value.disposition ===
    'job_succeeded_pending_result_reread'
  const failed = value.disposition === 'job_failed'
  if (
    unknown
      ? value.batchState !== 'OUTCOME_UNKNOWN'
        || value.batchJobUid !== null
        || value.exactCreateConfigurationEchoVerified
        || value.terminalObservationPersistedCreateOnly
      : !value.batchJobUid
        || !value.exactCreateConfigurationEchoVerified
        || !value.exactImmutableImageDigestVerified
        || !value.exactAttemptSubdirectoryMountVerified
        || (succeeded && value.batchState !== 'SUCCEEDED')
        || (failed && value.batchState !== 'FAILED')
        || ((succeeded || failed)
          ? !value.terminalObservationPersistedCreateOnly
          : value.terminalObservationPersistedCreateOnly)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 qualification Batch observation truth changed.',
  })
})

export const canonicalSam31QualificationA100JobObservationSchema =
  observationWithoutHashSchema.extend({ observationHash: rawSha256 }).strict()
export type CanonicalSam31QualificationA100JobObservation = z.infer<
  typeof canonicalSam31QualificationA100JobObservationSchema
>

export interface CanonicalSam31QualificationImageReleaseReadPort {
  rereadQualifiedQualificationImageRelease(input: {
    readonly releaseRef: z.infer<typeof evidenceRefSchema>
  }): Promise<unknown | null>
}

export interface CanonicalSam31QualificationWorkerRequestReadPort {
  rereadExactWorkerRequest(input: {
    readonly workerRequestRef: z.infer<typeof evidenceRefSchema>
  }): Promise<unknown | null>
}

export interface CanonicalSam31QualificationPrivateMountReadPort {
  rereadExactAttemptMount(input: {
    readonly attemptId: string
    readonly workerRequest:
      CanonicalSam31SourceCheckpointQualificationWorkerRequest
    readonly imageRelease:
      CanonicalSam31QualificationImageSupplyChainRelease
  }): Promise<unknown | null>
}

export interface CanonicalSam31QualificationA100RateReadPort {
  rereadCurrentAccountEffectiveA100Rate(input: {
    readonly routeId: 'a100_80gb_heavy_primary'
    readonly region: 'us-central1'
    readonly at: string
  }): Promise<unknown | null>
}

export interface CanonicalSam31QualificationA100StatePort {
  consumeAdmissionCreateOnly(input: {
    readonly admission: CanonicalSam31QualificationA100Admission
  }): Promise<'created' | 'already_exists'>
  rereadAdmission(input: {
    readonly attemptId: string
  }): Promise<unknown | null>
  persistSubmissionCreateOnly(input: {
    readonly submission: CanonicalSam31QualificationA100Submission
  }): Promise<'created' | 'already_exists'>
  rereadSubmission(input: {
    readonly attemptId: string
  }): Promise<unknown | null>
  persistTerminalObservationCreateOnly(input: {
    readonly observation: CanonicalSam31QualificationA100JobObservation
  }): Promise<'created' | 'already_exists'>
  rereadTerminalObservation(input: {
    readonly attemptId: string
  }): Promise<unknown | null>
}

export interface CanonicalSam31QualificationBatchTransport {
  request(input: {
    readonly method: 'GET' | 'POST'
    readonly url: string
    readonly params?: Readonly<Record<string, string>>
    readonly body?: Readonly<Record<string, unknown>>
  }): Promise<{ readonly status: number; readonly json: unknown }>
}

/**
 * Executable A100 phase of the one canonical SAM 3.1 source/checkpoint owner.
 * It performs the real authenticated Batch create/GET calls but cannot qualify
 * the checkpoint until a later owner rereads the create-only result and cost.
 */
export function createCanonicalSam31SourceCheckpointQualificationA100Phase(
  input: {
    readonly imageReleaseReadPort:
      CanonicalSam31QualificationImageReleaseReadPort
    readonly workerRequestReadPort:
      CanonicalSam31QualificationWorkerRequestReadPort
    readonly privateMountReadPort:
      CanonicalSam31QualificationPrivateMountReadPort
    readonly rateReadPort: CanonicalSam31QualificationA100RateReadPort
    readonly statePort: CanonicalSam31QualificationA100StatePort
    readonly batchTransport: CanonicalSam31QualificationBatchTransport
    readonly now?: () => string
  },
) {
  assertDependencies(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async admitAndStart(request: {
      readonly attemptId: string
      readonly qualificationImageSupplyChainReleaseRef:
        z.input<typeof evidenceRefSchema>
      readonly workerRequestRef: z.input<typeof evidenceRefSchema>
    }): Promise<CanonicalSam31QualificationA100Submission> {
      assertPlainSerializedData(request, 'sam31_qualification_start_request')
      const attemptId = safeId.parse(request.attemptId)
      const releaseRef = evidenceRefSchema.parse(
        request.qualificationImageSupplyChainReleaseRef,
      )
      const requestRef = evidenceRefSchema.parse(request.workerRequestRef)
      const admittedAt = now()
      const release = assertQualifiedRelease(
        await input.imageReleaseReadPort
          .rereadQualifiedQualificationImageRelease({ releaseRef }),
        releaseRef,
      )
      const workerRequest = assertWorkerRequest(
        await input.workerRequestReadPort.rereadExactWorkerRequest({
          workerRequestRef: requestRef,
        }),
        requestRef,
        release,
      )
      const mount = assertMount(
        await input.privateMountReadPort.rereadExactAttemptMount({
          attemptId,
          workerRequest,
          imageRelease: release,
        }),
        attemptId,
        workerRequest,
      )
      const rate = assertA100Rate(
        await input.rateReadPort.rereadCurrentAccountEffectiveA100Rate({
          routeId: 'a100_80gb_heavy_primary',
          region: REGION,
          at: admittedAt,
        }),
        admittedAt,
      )
      const admission = createAdmission({
        attemptId,
        release,
        workerRequest,
        mount,
        rate,
        admittedAt,
      })
      const consumption = await input.statePort.consumeAdmissionCreateOnly({
        admission,
      })
      const rereadAdmission = assertCanonicalSam31QualificationA100Admission(
        await input.statePort.rereadAdmission({ attemptId }),
      )
      assertExact(admission, rereadAdmission, 'admission reread')
      if (consumption === 'already_exists') {
        const existing = await input.statePort.rereadSubmission({ attemptId })
        if (existing) {
          const parsed = assertCanonicalSam31QualificationA100Submission(
            existing,
          )
          assertSubmissionMatches(parsed, admission)
          return parsed
        }
        throw new Error(
          'SAM 3.1 qualification admission was consumed; reconcile before any create retry.',
        )
      }
      const prepared = prepareBatchCreate({ admission, mount })
      let submission: CanonicalSam31QualificationA100Submission
      try {
        const response = await input.batchTransport.request({
          method: 'POST',
          url: BATCH_ENDPOINT,
          params: prepared.params,
          body: prepared.body,
        })
        const accepted = parseCreateResponse(response, prepared.jobResource)
        submission = sealSubmission({
          disposition: 'submitted',
          attemptId,
          admission,
          prepared,
          providerHttpStatus: response.status,
          batchJobUid: accepted.uid,
          providerOutcome: 'executed',
          observedAt: now(),
        })
      } catch {
        submission = sealSubmission({
          disposition: 'outcome_unknown',
          attemptId,
          admission,
          prepared,
          providerHttpStatus: null,
          batchJobUid: null,
          providerOutcome: 'unknown',
          observedAt: now(),
        })
      }
      await input.statePort.persistSubmissionCreateOnly({ submission })
      const reread = assertCanonicalSam31QualificationA100Submission(
        await input.statePort.rereadSubmission({ attemptId }),
      )
      assertExact(submission, reread, 'submission reread')
      return reread
    },

    async reconcileOne(request: {
      readonly attemptId: string
    }): Promise<CanonicalSam31QualificationA100JobObservation> {
      assertPlainSerializedData(request, 'sam31_qualification_reconcile_request')
      const attemptId = safeId.parse(request.attemptId)
      const admission = assertCanonicalSam31QualificationA100Admission(
        await input.statePort.rereadAdmission({ attemptId }),
      )
      const submission = assertCanonicalSam31QualificationA100Submission(
        await input.statePort.rereadSubmission({ attemptId }),
      )
      assertSubmissionMatches(submission, admission)
      const terminal = await input.statePort.rereadTerminalObservation({
        attemptId,
      })
      if (terminal) {
        const parsed = assertCanonicalSam31QualificationA100JobObservation(
          terminal,
        )
        assertObservationMatches(parsed, admission, submission)
        return parsed
      }
      const mount = assertCanonicalSam31QualificationA100MountObservation(
        await input.privateMountReadPort.rereadExactAttemptMount({
          attemptId,
          workerRequest:
            await rereadWorkerForAdmission(input, admission),
          imageRelease:
            await rereadReleaseForAdmission(input, admission),
        }),
      )
      let response: {
        readonly status: number
        readonly json: unknown
      }
      try {
        response = await input.batchTransport.request({
          method: 'GET',
          url: `${BATCH_ENDPOINT}/${submission.batchJobId}`,
        })
      } catch {
        return sealObservation({
          disposition: 'outcome_unknown',
          admission,
          submission,
          batchJobUid: null,
          batchState: 'OUTCOME_UNKNOWN',
          exactEcho: false,
          terminalPersisted: false,
          observedAt: now(),
        })
      }
      const job = parseJobObservation({
        response,
        admission,
        submission,
        mount,
      })
      const disposition = job.state === 'SUCCEEDED'
        ? 'job_succeeded_pending_result_reread' as const
        : job.state === 'FAILED'
          ? 'job_failed' as const
          : 'pending' as const
      const terminalDisposition = disposition !== 'pending'
      const observation = sealObservation({
        disposition,
        admission,
        submission,
        batchJobUid: job.uid,
        batchState: job.state,
        exactEcho: true,
        terminalPersisted: terminalDisposition,
        observedAt: now(),
      })
      if (!terminalDisposition) return observation
      await input.statePort.persistTerminalObservationCreateOnly({
        observation,
      })
      const reread = assertCanonicalSam31QualificationA100JobObservation(
        await input.statePort.rereadTerminalObservation({ attemptId }),
      )
      assertExact(observation, reread, 'terminal observation reread')
      return reread
    },
  })
}

export function createCanonicalGoogleBatchSam31QualificationTransport(input?: {
  readonly auth?: Pick<GoogleAuth, 'request'>
  readonly timeoutMilliseconds?: number
}): CanonicalSam31QualificationBatchTransport {
  const auth = input?.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const timeout = input?.timeoutMilliseconds ?? 15_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 30_000) {
    throw new Error('SAM 3.1 qualification Batch timeout is invalid.')
  }
  return Object.freeze({
    async request(
      request: Parameters<
        CanonicalSam31QualificationBatchTransport['request']
      >[0],
    ) {
      const response = await auth.request({
        url: request.url,
        method: request.method,
        params: request.params,
        data: request.body,
        timeout,
        retry: false,
        maxRedirects: 0,
      })
      return Object.freeze({
        status: response.status,
        json: structuredClone(response.data),
      })
    },
  })
}

/** Seals the server-owned staging observation after exact GCS rereads. */
export function sealCanonicalSam31QualificationA100MountObservation(
  value: z.input<typeof mountWithoutHashSchema>,
): CanonicalSam31QualificationA100MountObservation {
  assertPlainSerializedData(value, 'sam31_qualification_mount_input')
  const payload = mountWithoutHashSchema.parse(value)
  return canonicalSam31QualificationA100MountObservationSchema.parse({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31QualificationA100MountObservation(
  value: unknown,
): CanonicalSam31QualificationA100MountObservation {
  assertPlainSerializedData(value, 'sam31_qualification_mount_observation')
  const parsed = canonicalSam31QualificationA100MountObservationSchema
    .parse(value)
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification mount observation hash changed.')
  }
  return parsed
}

export function assertCanonicalSam31QualificationA100Admission(
  value: unknown,
): CanonicalSam31QualificationA100Admission {
  assertPlainSerializedData(value, 'sam31_qualification_a100_admission')
  const parsed = canonicalSam31QualificationA100AdmissionSchema.parse(value)
  const { admissionHash, ...payload } = parsed
  if (admissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification A100 admission hash changed.')
  }
  return parsed
}

export function assertCanonicalSam31QualificationA100Submission(
  value: unknown,
): CanonicalSam31QualificationA100Submission {
  assertPlainSerializedData(value, 'sam31_qualification_a100_submission')
  const parsed = canonicalSam31QualificationA100SubmissionSchema.parse(value)
  const { submissionHash, ...payload } = parsed
  if (submissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification A100 submission hash changed.')
  }
  return parsed
}

export function assertCanonicalSam31QualificationA100JobObservation(
  value: unknown,
): CanonicalSam31QualificationA100JobObservation {
  assertPlainSerializedData(value, 'sam31_qualification_a100_job_observation')
  const parsed = canonicalSam31QualificationA100JobObservationSchema
    .parse(value)
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification A100 job observation hash changed.')
  }
  return parsed
}

function createAdmission(input: {
  attemptId: string
  release: CanonicalSam31QualificationImageSupplyChainRelease
  workerRequest: CanonicalSam31SourceCheckpointQualificationWorkerRequest
  mount: CanonicalSam31QualificationA100MountObservation
  rate: CanonicalCurrentGoogleCloudGpuRateAuthority
  admittedAt: string
}): CanonicalSam31QualificationA100Admission {
  const payload = admissionWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_A100_ADMISSION_VERSION,
    source: 'canonical_server_sam3_1_source_checkpoint_qualification_owner',
    evidenceClass: 'canonical_private_reread',
    attemptId: input.attemptId,
    qualificationId: input.workerRequest.qualificationId,
    operationId: input.workerRequest.operationId,
    workerRequestRef: workerRequestRef(input.workerRequest),
    qualificationImageSupplyChainReleaseRef: releaseRef(input.release),
    qualificationImageRef: input.release.immutableImageRef,
    qualificationImageDigest: input.release.immutableImageDigest,
    qualificationImageUri: input.release.immutableImageUri,
    mountObservationRef: mountRef(input.mount),
    accountEffectiveA100RateAuthorityRef: rateRef(input.rate),
    projectId: PROJECT_ID,
    region: REGION,
    batchCollection: BATCH_COLLECTION,
    instanceTemplateResource: INSTANCE_TEMPLATE,
    privateNetworkResource: PRIVATE_NETWORK,
    privateSubnetworkResource: PRIVATE_SUBNETWORK,
    noExternalIpAddress: true,
    serviceAccountEmail: SERVICE_ACCOUNT,
    executionTarget: 'google_cloud_batch_a2_ultra_job',
    machineType: 'a2-ultragpu-1g',
    accelerator: 'nvidia_a100_80gb',
    allocatedGpuCount: 1,
    allocatedVcpuCount: 12,
    allocatedMemoryGiB: 170,
    taskCount: 1,
    taskParallelism: 1,
    maximumExecutionSeconds: 7_200,
    maximumTaskRetries: 0,
    allowedZones: ['us-central1-a', 'us-central1-c'],
    userTriggered: true,
    minimumIdleInstances: 0,
    prewarmingOrKeepaliveAllowed: false,
    externalIpAllowed: false,
    publicNetworkEgressAllowed: false,
    runtimeDownloadAllowed: false,
    substantiveCpuModelOrMediaExecutionAllowed: false,
    callerCommandImageModelCheckpointPathUrlOrEnvironmentAccepted: false,
    createOnlyAdmissionConsumptionRequiredBeforeBatchCreate: true,
    oneAdmissionCreatesAtMostOneBatchJob: true,
    retryAfterUnknownCreateOutcomeAllowed: false,
    billingClassification: 'platform_internal_qualification',
    accountEffectivePricingReread: true,
    internalAttemptCostReceiptRequired: true,
    customerCreditsReserved: false,
    customerCreditsSpent: false,
    customerBillingAuthorityGranted: false,
    sourceCheckpointQualificationGranted: false,
    runtimeReleaseGranted: false,
    publicDeliveryAuthorized: false,
    productionReady: false,
    admittedAt: input.admittedAt,
  })
  return canonicalSam31QualificationA100AdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

function prepareBatchCreate(input: {
  admission: CanonicalSam31QualificationA100Admission
  mount: CanonicalSam31QualificationA100MountObservation
}) {
  const jobId = `weeditpro-sam31-q-${sha256AuthorityValue({
    attemptId: input.admission.attemptId,
    admissionHash: input.admission.admissionHash,
  }).slice(0, 40)}`
  const providerRequestId = deterministicUuid({
    jobId,
    admissionHash: input.admission.admissionHash,
    purpose: 'google_batch_create_deduplication_only',
  })
  const body = Object.freeze({
    priority: '99',
    labels: {
      'weeditpro-purpose': 'sam31-qualification',
      'weeditpro-attempt': sha256AuthorityValue(input.admission.attemptId)
        .slice(0, 32),
    },
    taskGroups: [{
      taskCount: '1',
      parallelism: '1',
      runAsNonRoot: true,
      taskSpec: {
        runnables: [{
          container: { imageUri: input.admission.qualificationImageUri },
          ignoreExitStatus: false,
          background: false,
          alwaysRun: false,
        }],
        computeResource: {
          cpuMilli: '12000',
          memoryMib: String(170 * 1_024),
        },
        maxRunDuration: '7200s',
        maxRetryCount: 0,
        volumes: [{
          gcs: { remotePath: input.mount.gcsRemotePath },
          mountPath: MOUNT_PATH,
          mountOptions: input.mount.mountOptions,
        }],
        environment: {
          variables: {
            REEDITPRO_GPU_INVOCATION_ID: input.admission.attemptId,
            WEEDITPRO_GPU_ACCELERATOR_CLASS: 'nvidia_a100_80gb',
          },
        },
      },
    }],
    allocationPolicy: {
      network: {
        networkInterfaces: [{
          network: PRIVATE_NETWORK,
          subnetwork: PRIVATE_SUBNETWORK,
          noExternalIpAddress: true,
        }],
      },
      location: {
        allowedLocations: ['zones/us-central1-a', 'zones/us-central1-c'],
      },
      instances: [{
        instanceTemplate: INSTANCE_TEMPLATE,
        installGpuDrivers: false,
        installOpsAgent: false,
        blockProjectSshKeys: true,
      }],
      serviceAccount: { email: SERVICE_ACCOUNT },
    },
    logsPolicy: { destination: 'CLOUD_LOGGING' },
  })
  const createRequestHash = sha256AuthorityValue({
    url: BATCH_ENDPOINT,
    params: { jobId, requestId: providerRequestId },
    body,
  })
  return Object.freeze({
    jobId,
    jobResource: `${BATCH_COLLECTION}/${jobId}`,
    params: Object.freeze({ jobId, requestId: providerRequestId }),
    body,
    providerRequestIdDigestSha256:
      sha256AuthorityValue(providerRequestId),
    createRequestBodyRef: Object.freeze({
      id: `sam31-qualification-batch-create-${createRequestHash.slice(0, 32)}`,
      version: 1,
      contentHash: `sha256:${createRequestHash}`,
    }),
  })
}

function parseCreateResponse(
  response: { readonly status: number; readonly json: unknown },
  expectedResource: string,
): { uid: string } {
  if (response.status < 200 || response.status >= 300) {
    throw new Error('SAM 3.1 qualification Batch create status is uncertain.')
  }
  assertPlainSerializedData(response.json, 'sam31_batch_create_response')
  const parsed = z.object({
    name: safeResource,
    uid: safeId,
  }).passthrough().parse(response.json)
  if (parsed.name !== expectedResource) {
    throw new Error('SAM 3.1 qualification Batch created another job.')
  }
  return { uid: parsed.uid }
}

function sealSubmission(input: {
  disposition: 'submitted' | 'outcome_unknown'
  attemptId: string
  admission: CanonicalSam31QualificationA100Admission
  prepared: ReturnType<typeof prepareBatchCreate>
  providerHttpStatus: number | null
  batchJobUid: string | null
  providerOutcome: 'executed' | 'unknown'
  observedAt: string
}): CanonicalSam31QualificationA100Submission {
  const payload = submissionWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_A100_SUBMISSION_VERSION,
    source: 'canonical_server_google_batch_sam3_1_qualification_launch_owner',
    evidenceClass: 'canonical_private_reread',
    disposition: input.disposition,
    attemptId: input.attemptId,
    admissionRef: admissionRef(input.admission),
    batchJobId: input.prepared.jobId,
    batchJobResource: input.prepared.jobResource,
    providerRequestIdDigestSha256:
      input.prepared.providerRequestIdDigestSha256,
    createRequestBodyRef: input.prepared.createRequestBodyRef,
    immutableImageDigest: input.admission.qualificationImageDigest,
    mountObservationRef: input.admission.mountObservationRef,
    providerHttpStatus: input.providerHttpStatus,
    batchJobUid: input.batchJobUid,
    providerOutcome: input.providerOutcome,
    durableAdmissionConsumedBeforeProviderCall: true,
    durableSubmissionCreatedAndExactReread: true,
    automaticRetryAllowed: false,
    providerCallMade: true,
    sourceCheckpointQualificationGranted: false,
    runtimeReleaseGranted: false,
    customerCreditsMutated: false,
    publicDeliveryAuthorized: false,
    productionReady: false,
    observedAt: input.observedAt,
  })
  return canonicalSam31QualificationA100SubmissionSchema.parse({
    ...payload,
    submissionHash: sha256AuthorityValue(payload),
  })
}

function parseJobObservation(input: {
  response: { readonly status: number; readonly json: unknown }
  admission: CanonicalSam31QualificationA100Admission
  submission: CanonicalSam31QualificationA100Submission
  mount: CanonicalSam31QualificationA100MountObservation
}): { uid: string; state: z.infer<typeof observationWithoutHashSchema>['batchState'] } {
  if (input.response.status < 200 || input.response.status >= 300) {
    throw new Error('SAM 3.1 qualification Batch GET outcome is uncertain.')
  }
  assertPlainSerializedData(input.response.json, 'sam31_batch_job_response')
  const parsed = z.object({
    name: safeResource,
    uid: safeId,
    status: z.object({
      state: z.enum([
        'STATE_UNSPECIFIED', 'QUEUED', 'SCHEDULED', 'RUNNING',
        'SUCCEEDED', 'FAILED', 'DELETION_IN_PROGRESS',
      ]),
    }).passthrough(),
    taskGroups: z.array(z.unknown()).min(1),
    allocationPolicy: z.unknown(),
  }).passthrough().parse(input.response.json)
  if (
    parsed.name !== input.submission.batchJobResource
    || (input.submission.batchJobUid !== null
      && parsed.uid !== input.submission.batchJobUid)
  ) throw new Error('SAM 3.1 qualification Batch job identity changed.')
  assertBatchConfigurationEcho({
    job: parsed,
    admission: input.admission,
    mount: input.mount,
  })
  return { uid: parsed.uid, state: parsed.status.state }
}

function assertBatchConfigurationEcho(input: {
  job: Record<string, unknown>
  admission: CanonicalSam31QualificationA100Admission
  mount: CanonicalSam31QualificationA100MountObservation
}): void {
  const parsed = z.object({
    taskGroups: z.array(z.object({
      taskCount: z.union([z.literal('1'), z.literal(1)]),
      parallelism: z.union([z.literal('1'), z.literal(1)]),
      runAsNonRoot: z.literal(true),
      taskSpec: z.object({
        runnables: z.array(z.object({
          container: z.object({ imageUri: z.string() }).passthrough(),
        }).passthrough()).length(1),
        maxRunDuration: z.literal('7200s'),
        maxRetryCount: z.literal(0),
        volumes: z.array(z.object({
          gcs: z.object({ remotePath: z.string() }).strict(),
          mountPath: z.string(),
          mountOptions: z.literal('rw,implicit-dirs'),
        }).passthrough()).length(1),
        environment: z.object({
          variables: z.record(z.string(), z.string()),
        }).passthrough(),
      }).passthrough(),
    }).passthrough()).length(1),
    allocationPolicy: z.object({
      network: z.object({
        networkInterfaces: z.array(z.object({
          network: z.literal(PRIVATE_NETWORK),
          subnetwork: z.literal(PRIVATE_SUBNETWORK),
          noExternalIpAddress: z.literal(true),
        }).strict()).length(1),
      }).strict(),
      location: z.object({ allowedLocations: z.array(z.string()) }).passthrough(),
      instances: z.array(z.object({
        instanceTemplate: z.string(),
        installGpuDrivers: z.literal(false),
      }).passthrough()).length(1),
      serviceAccount: z.object({ email: z.string() }).passthrough(),
    }).passthrough(),
  }).passthrough().parse(input.job)
  const group = parsed.taskGroups[0]!
  const runnable = group.taskSpec.runnables[0]!
  const volume = group.taskSpec.volumes[0]!
  const variables = group.taskSpec.environment.variables
  const networkInterface = parsed.allocationPolicy.network
    .networkInterfaces[0]!
  if (
    runnable.container.imageUri !== input.admission.qualificationImageUri
    || volume.gcs.remotePath !== input.mount.gcsRemotePath
    || volume.mountPath !== MOUNT_PATH
    || variables.REEDITPRO_GPU_INVOCATION_ID !== input.admission.attemptId
    || variables.WEEDITPRO_GPU_ACCELERATOR_CLASS !== 'nvidia_a100_80gb'
    || parsed.allocationPolicy.instances[0]?.instanceTemplate !==
      INSTANCE_TEMPLATE
    || parsed.allocationPolicy.serviceAccount.email !== SERVICE_ACCOUNT
    || networkInterface.network !== PRIVATE_NETWORK
    || networkInterface.subnetwork !== PRIVATE_SUBNETWORK
    || networkInterface.noExternalIpAddress !== true
    || stableAuthorityStringify(
      parsed.allocationPolicy.location.allowedLocations,
    ) !== stableAuthorityStringify([
      'zones/us-central1-a', 'zones/us-central1-c',
    ])
  ) throw new Error('SAM 3.1 qualification Batch configuration changed.')
}

function sealObservation(input: {
  disposition: z.infer<typeof observationWithoutHashSchema>['disposition']
  admission: CanonicalSam31QualificationA100Admission
  submission: CanonicalSam31QualificationA100Submission
  batchJobUid: string | null
  batchState: z.infer<typeof observationWithoutHashSchema>['batchState']
  exactEcho: boolean
  terminalPersisted: boolean
  observedAt: string
}): CanonicalSam31QualificationA100JobObservation {
  const payload = observationWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_A100_JOB_OBSERVATION_VERSION,
    source: 'canonical_server_google_batch_sam3_1_qualification_reconciliation_owner',
    evidenceClass: 'canonical_private_reread',
    disposition: input.disposition,
    attemptId: input.admission.attemptId,
    admissionRef: admissionRef(input.admission),
    submissionRef: submissionRef(input.submission),
    batchJobResource: input.submission.batchJobResource,
    batchJobUid: input.batchJobUid,
    batchState: input.batchState,
    exactCreateConfigurationEchoVerified: input.exactEcho,
    exactImmutableImageDigestVerified: input.exactEcho,
    exactAttemptSubdirectoryMountVerified: input.exactEcho,
    configuredAutomaticRetryCount: 0,
    resultObjectReread: false,
    actualCudaQualificationAccepted: false,
    internalAttemptCostReread: false,
    automaticRetryAllowed: false,
    customerCreditsMutated: false,
    sourceCheckpointQualificationGranted: false,
    runtimeReleaseGranted: false,
    publicDeliveryAuthorized: false,
    productionReady: false,
    terminalObservationPersistedCreateOnly: input.terminalPersisted,
    observedAt: input.observedAt,
  })
  return canonicalSam31QualificationA100JobObservationSchema.parse({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

function assertQualifiedRelease(
  value: unknown,
  expectedRef: z.infer<typeof evidenceRefSchema>,
): CanonicalSam31QualificationImageSupplyChainRelease {
  if (!value) throw new Error('SAM 3.1 qualification image release missing.')
  const release = assertCanonicalSam31QualificationImageSupplyChainRelease(
    value,
  )
  if (
    !sameRef(releaseRef(release), expectedRef)
    || !release.authority.qualificationImageSupplyChainQualified
    || !release.authority.sourceCheckpointQualificationImageAdmissible
    || release.authority.sourceCheckpointQualificationGranted
    || release.authority.gpuQualificationJobDispatched
  ) throw new Error('SAM 3.1 qualification image release is not admissible.')
  return release
}

function assertWorkerRequest(
  value: unknown,
  expectedRef: z.infer<typeof evidenceRefSchema>,
  release: CanonicalSam31QualificationImageSupplyChainRelease,
): CanonicalSam31SourceCheckpointQualificationWorkerRequest {
  if (!value) throw new Error('SAM 3.1 qualification worker request missing.')
  const request =
    assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(value)
  if (
    !sameRef(workerRequestRef(request), expectedRef)
    || !sameRef(
      request.qualificationImage.supplyChainReleaseRef,
      releaseRef(release),
    )
    || !sameRef(request.qualificationImage.artifactRef,
      release.immutableImageRef)
    || request.qualificationImage.immutableImageDigest !==
      release.immutableImageDigest
  ) throw new Error('SAM 3.1 qualification request crossed image release.')
  return request
}

function assertMount(
  value: unknown,
  attemptId: string,
  request: CanonicalSam31SourceCheckpointQualificationWorkerRequest,
): CanonicalSam31QualificationA100MountObservation {
  if (!value) throw new Error('SAM 3.1 qualification mount is missing.')
  const mount = assertCanonicalSam31QualificationA100MountObservation(value)
  if (
    mount.attemptId !== attemptId
    || mount.qualificationId !== request.qualificationId
    || !sameRef(mount.workerRequestRef, workerRequestRef(request))
    || mount.requestObject.requestCanonicalHash !== request.requestHash
    || mount.checkpointObject.sha256 !== request.checkpoint.sha256
    || mount.checkpointObject.byteLength !== request.checkpoint.byteLength
    || mount.probeFixtureObject.sha256 !==
      request.deterministicProbeFixture.sha256
    || mount.probeFixtureObject.byteLength !==
      request.deterministicProbeFixture.byteLength
  ) throw new Error('SAM 3.1 qualification mount crossed request bytes.')
  return mount
}

function assertA100Rate(
  value: unknown,
  at: string,
): CanonicalCurrentGoogleCloudGpuRateAuthority {
  if (!value) throw new Error('Current A100 account-effective rate missing.')
  const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(value, at)
  if (
    rate.routeId !== 'a100_80gb_heavy_primary'
    || rate.region !== REGION
    || rate.executionTarget !== 'google_cloud_batch_a2_ultra_job'
    || rate.machineType !== 'a2-ultragpu-1g'
    || rate.accelerator !== 'nvidia_a100_80gb'
    || rate.customerPricingOrServiceFeeAuthorityGranted
    || rate.walletOrCreditMutationAuthorityGranted
  ) throw new Error('Current A100 rate authority differs from qualification.')
  return rate
}

async function rereadWorkerForAdmission(
  input: Parameters<
    typeof createCanonicalSam31SourceCheckpointQualificationA100Phase
  >[0],
  admission: CanonicalSam31QualificationA100Admission,
) {
  return assertWorkerRequest(
    await input.workerRequestReadPort.rereadExactWorkerRequest({
      workerRequestRef: admission.workerRequestRef,
    }),
    admission.workerRequestRef,
    await rereadReleaseForAdmission(input, admission),
  )
}

async function rereadReleaseForAdmission(
  input: Parameters<
    typeof createCanonicalSam31SourceCheckpointQualificationA100Phase
  >[0],
  admission: CanonicalSam31QualificationA100Admission,
) {
  return assertQualifiedRelease(
    await input.imageReleaseReadPort
      .rereadQualifiedQualificationImageRelease({
        releaseRef: admission.qualificationImageSupplyChainReleaseRef,
      }),
    admission.qualificationImageSupplyChainReleaseRef,
  )
}

function assertSubmissionMatches(
  submission: CanonicalSam31QualificationA100Submission,
  admission: CanonicalSam31QualificationA100Admission,
): void {
  if (
    submission.attemptId !== admission.attemptId
    || !sameRef(submission.admissionRef, admissionRef(admission))
    || submission.immutableImageDigest !== admission.qualificationImageDigest
    || !sameRef(submission.mountObservationRef, admission.mountObservationRef)
  ) throw new Error('SAM 3.1 qualification submission crossed admission.')
}

function assertObservationMatches(
  observation: CanonicalSam31QualificationA100JobObservation,
  admission: CanonicalSam31QualificationA100Admission,
  submission: CanonicalSam31QualificationA100Submission,
): void {
  if (
    observation.attemptId !== admission.attemptId
    || !sameRef(observation.admissionRef, admissionRef(admission))
    || !sameRef(observation.submissionRef, submissionRef(submission))
    || observation.batchJobResource !== submission.batchJobResource
  ) throw new Error('SAM 3.1 qualification observation crossed attempt.')
}

function assertDependencies(input: Parameters<
  typeof createCanonicalSam31SourceCheckpointQualificationA100Phase
>[0]): void {
  if (
    typeof input.imageReleaseReadPort
      ?.rereadQualifiedQualificationImageRelease !== 'function'
    || typeof input.workerRequestReadPort?.rereadExactWorkerRequest !==
      'function'
    || typeof input.privateMountReadPort?.rereadExactAttemptMount !==
      'function'
    || typeof input.rateReadPort?.rereadCurrentAccountEffectiveA100Rate !==
      'function'
    || typeof input.statePort?.consumeAdmissionCreateOnly !== 'function'
    || typeof input.statePort?.rereadAdmission !== 'function'
    || typeof input.statePort?.persistSubmissionCreateOnly !== 'function'
    || typeof input.statePort?.rereadSubmission !== 'function'
    || typeof input.statePort?.persistTerminalObservationCreateOnly !==
      'function'
    || typeof input.statePort?.rereadTerminalObservation !== 'function'
    || typeof input.batchTransport?.request !== 'function'
  ) throw new Error('SAM 3.1 qualification A100 phase dependencies invalid.')
}

function admissionRef(value: CanonicalSam31QualificationA100Admission) {
  return evidenceRefSchema.parse({
    id: value.attemptId,
    version: 1,
    contentHash: `sha256:${value.admissionHash}`,
  })
}

function submissionRef(value: CanonicalSam31QualificationA100Submission) {
  return evidenceRefSchema.parse({
    id: `${value.attemptId}.submission`,
    version: 1,
    contentHash: `sha256:${value.submissionHash}`,
  })
}

function mountRef(value: CanonicalSam31QualificationA100MountObservation) {
  return evidenceRefSchema.parse({
    id: `${value.attemptId}.mount`,
    version: 1,
    contentHash: `sha256:${value.observationHash}`,
  })
}

function workerRequestRef(
  value: CanonicalSam31SourceCheckpointQualificationWorkerRequest,
) {
  return evidenceRefSchema.parse({
    id: value.qualificationId,
    version: value.qualificationVersion,
    contentHash: `sha256:${value.requestHash}`,
  })
}

function releaseRef(
  value: CanonicalSam31QualificationImageSupplyChainRelease,
) {
  return evidenceRefSchema.parse({
    id: value.releaseId,
    version: value.releaseVersion,
    contentHash: `sha256:${value.releaseHash}`,
  })
}

function rateRef(value: CanonicalCurrentGoogleCloudGpuRateAuthority) {
  return evidenceRefSchema.parse({
    id: value.rateAuthorityId,
    version: value.rateAuthorityVersion,
    contentHash: `sha256:${value.rateAuthorityHash}`,
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

function assertExact(left: unknown, right: unknown, label: string): void {
  if (stableAuthorityStringify(left) !== stableAuthorityStringify(right)) {
    throw new Error(`SAM 3.1 qualification ${label} changed.`)
  }
}

function deterministicUuid(value: unknown): string {
  const bytes = Buffer.from(sha256AuthorityValue(value).slice(0, 32), 'hex')
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`
    + `-${hex.slice(16, 20)}-${hex.slice(20)}`
}
