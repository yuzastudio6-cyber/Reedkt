import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
  type CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import {
  assertCanonicalSam31QualifiedSourceCheckpointRelease,
  createCanonicalSam31QualifiedSourceCheckpointReleaseObjectReadPort,
  projectCanonicalSam31QualifiedSourceCheckpointRelease,
  type CanonicalSam31QualifiedSourceCheckpointReleaseReadPort,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualified-authority'
import {
  assertCanonicalSam31CloudImageSupplyChainRelease,
  type CanonicalSam31CloudImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-cloud-image-supply-chain-release'
import {
  createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
  type CanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from './canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  createCanonicalGcsCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
  type CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
} from './canonical-current-google-cloud-vertex-a100-serving-rate-authority-repository'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority,
  createCanonicalGcsCurrentGoogleCloudVertexA100ServingQuotaRepository,
  type CanonicalCurrentGoogleCloudVertexA100ServingQuotaRepository,
} from './canonical-current-google-cloud-vertex-a100-serving-quota-authority'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  createCanonicalSam31ImageSupplyChainReleaseRepository,
  type CanonicalSam31ImageSupplyChainReleaseRepository,
} from './canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  buildCanonicalSam31A100QualificationProbeSourceMedia,
  buildCanonicalSam31A100QualificationTask,
  createCanonicalSam31A100QualificationIdentifiers,
  createCanonicalSam31A100QualificationRefs,
  createCanonicalSam31GcsOfficialProbeMaskProxyReadPort,
} from './canonical-sam3_1-a100-runtime-qualification-launch-service'
import {
  assertCanonicalSam31VertexServingQualificationCandidate,
  createCanonicalGcsSam31VertexServingQualificationCandidateRepository,
  type CanonicalSam31VertexServingQualificationCandidateRepository,
} from './canonical-sam3_1-vertex-serving-qualification-candidate'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  createCanonicalSam31GcsPrivateBinaryObjectPort,
  createCanonicalSam31GpuPrivateInputStagingPort,
  type CanonicalSam31GpuPrivateInputStagingPort,
} from '../workers/masks/canonical-sam3_1-gpu-private-input-staging-service'
import {
  assertCanonicalSam31GpuTaskRecord,
  createCanonicalSam31GpuTaskStoreFromObjectPort,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_ADMISSION_VERSION =
  'canonical-sam3_1-vertex-serving-qualification-admission-v1' as const
export const CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_PREPARATION_VERSION =
  'canonical-sam3_1-vertex-serving-qualification-preparation-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const PRIVATE_GPU_BUCKET = 'reeditpro-production-reeditpro-masks' as const
const TASK_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/invocations'
const RECORD_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-vertex-serving-qualification-preparations'
const ENDPOINT =
  'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
type Ref = z.infer<typeof refSchema>

const requestSchema = z.object({
  qualificationId: safeId,
  runOrdinal: z.number().int().min(1).max(30).safe(),
  qualificationCandidateRef: refSchema,
  sourceCheckpointQualificationRef: refSchema.extend({
    schemaVersion: z.literal(
      'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
    ),
    version: z.literal(2),
  }).strict(),
  imageSupplyChainReleaseRef: refSchema.extend({ version: z.literal(1) })
    .strict(),
  currentA100ServingRateAuthorityRef: refSchema,
  currentL4FallbackRateAuthorityRef: refSchema,
  currentA100ServingQuotaAuthorityRef: refSchema,
}).strict()
type Request = z.infer<typeof requestSchema>

const admissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_ADMISSION_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_qualification_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  admissionId: safeId,
  qualificationId: safeId,
  runOrdinal: z.number().int().min(1).max(30).safe(),
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  routeId: z.literal('a100_80gb_heavy_primary'),
  executionTarget: z.literal(
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
  ),
  endpointResourceName: z.literal(ENDPOINT),
  qualificationCandidateRef: refSchema,
  endpointDeploymentRef: refSchema,
  exactDeploymentObservationRef: refSchema,
  readinessProbeRef: refSchema,
  sourceCheckpointQualificationRef: refSchema,
  imageSupplyChainReleaseRef: refSchema,
  immutableImageRef: refSchema,
  immutableImageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  currentA100ServingRateAuthorityRef: refSchema,
  currentL4FallbackRateAuthorityRef: refSchema,
  currentA100ServingQuotaAuthorityRef: refSchema,
  deterministicProbeFixtureRef: refSchema,
  internalQualificationPlanRef: refSchema,
  approvedInternalCostEstimateRef: refSchema,
  internalCostBudgetRef: refSchema,
  maximumExecutionSeconds: z.literal(600),
  maximumEstimatedInternalInfrastructureCostUsdNanos:
    z.number().int().nonnegative().safe(),
  maximumReservedCustomerToolCostCredits: z.literal(0),
  operatorTriggerRecordRef: refSchema,
  executionAttemptRef: refSchema,
  idempotencyKey: safeId,
  exactCandidateDeploymentReadinessSourceCheckpointImageQuotaAndRatesReread:
    z.literal(true),
  accountEffectiveA100ServingAndL4RatesBoundBeforeDispatch: z.literal(true),
  actualAttemptCostRequiresEndpointUsageAndBillingReread: z.literal(true),
  privatePreReleaseQualificationOnly: z.literal(true),
  runtimeAlreadyQualifiedClaimed: z.literal(false),
  userTriggeredScaleFromZero: z.literal(true),
  minimumIdleInstances: z.literal(0),
  automaticRetryOrFallbackAllowed: z.literal(false),
  callerPriceImageModelCommandPathUrlOrCredentialsAccepted: z.literal(false),
  customerEditPlanOrCustomerCreditsUsed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  admittedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  if (
    Date.parse(value.expiresAt) <= Date.parse(value.admittedAt)
    || Date.parse(value.expiresAt) - Date.parse(value.admittedAt) > 600_000
    || value.immutableImageRef.contentHash !== value.immutableImageDigest
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex serving qualification admission lost bounded lineage.',
  })
})
export const canonicalSam31VertexServingQualificationAdmissionSchema =
  admissionWithoutHashSchema.extend({ admissionHash: sha256 }).strict()
export type CanonicalSam31VertexServingQualificationAdmission = z.infer<
  typeof canonicalSam31VertexServingQualificationAdmissionSchema
>

const preparationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_PREPARATION_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_qualification_owner',
  ),
  qualificationId: safeId,
  runOrdinal: z.number().int().min(1).max(30).safe(),
  invocationId: safeId,
  qualificationCandidateRef: refSchema,
  admissionRef: refSchema,
  dispatchAdmissionDigestSha256: sha256,
  admissionConsumptionRef: refSchema,
  executionEnvelopeRef: refSchema,
  taskRecordRef: refSchema,
  currentA100ServingRateAuthorityRef: refSchema,
  currentL4FallbackRateAuthorityRef: refSchema,
  currentA100ServingQuotaAuthorityRef: refSchema,
  exactOfficialProbeStagedAndTaskReread: z.literal(true),
  readyForOnePrivateServingQualificationInvocation: z.literal(true),
  customerInvocationAuthorized: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  preparedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  if (
    Date.parse(value.expiresAt) <= Date.parse(value.preparedAt)
    || Date.parse(value.expiresAt) - Date.parse(value.preparedAt) > 600_000
    || value.admissionRef.contentHash !==
      `sha256:${value.dispatchAdmissionDigestSha256}`
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex serving qualification preparation lost bounded lineage.',
  })
})
export const canonicalSam31VertexServingQualificationPreparationSchema =
  preparationWithoutHashSchema.extend({ preparationHash: sha256 }).strict()
export type CanonicalSam31VertexServingQualificationPreparation = z.infer<
  typeof canonicalSam31VertexServingQualificationPreparationSchema
>

export interface CanonicalSam31VertexServingQualificationPreparationRepository {
  persistCreateOnly(input: {
    readonly admission: CanonicalSam31VertexServingQualificationAdmission
    readonly consumption: Readonly<Record<string, unknown>>
    readonly envelope: Readonly<Record<string, unknown>>
    readonly preparation: CanonicalSam31VertexServingQualificationPreparation
  }): Promise<'created' | 'already_exists'>
  reread(input: { readonly invocationId: string }): Promise<unknown>
}

export function createCanonicalSam31VertexServingQualificationPreparationService(
  input: {
    readonly candidateRepository:
      CanonicalSam31VertexServingQualificationCandidateRepository
    readonly sourceCheckpointReadPort:
      CanonicalSam31QualifiedSourceCheckpointReleaseReadPort
    readonly imageSupplyChainReadPort: Pick<
      CanonicalSam31ImageSupplyChainReleaseRepository,
      'rereadQualifiedRelease'
    >
    readonly a100ServingRateRepository: Pick<
      CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
      'reread'
    >
    readonly l4RateRepository: Pick<
      CanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
      'rereadApprovedCurrentRate'
    >
    readonly servingQuotaRepository: Pick<
      CanonicalCurrentGoogleCloudVertexA100ServingQuotaRepository,
      'reread'
    >
    readonly repository:
      CanonicalSam31VertexServingQualificationPreparationRepository
    readonly privateInputStagingPort:
      CanonicalSam31GpuPrivateInputStagingPort
    readonly taskStore: CanonicalSam31GpuTaskStore
    readonly now?: () => string
  },
) {
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async prepareOne(untrusted: unknown): Promise<
      CanonicalSam31VertexServingQualificationPreparation
    > {
      assertPlainSerializedData(untrusted, 'sam31_vertex_serving_qualification')
      const request = requestSchema.parse(untrusted)
      const admittedAt = timestamp.parse(now())
      const [candidateRaw, sourceRaw, imageRaw, a100RateRaw, l4RateRaw,
        quotaRaw] = await Promise.all([
        input.candidateRepository.reread({
          candidateId: request.qualificationCandidateRef.id,
        }),
        input.sourceCheckpointReadPort.rereadQualificationRelease({
          sourceCheckpointQualificationRef:
            request.sourceCheckpointQualificationRef,
        }),
        input.imageSupplyChainReadPort.rereadQualifiedRelease({
          releaseRef: request.imageSupplyChainReleaseRef,
        }),
        input.a100ServingRateRepository.reread({
          rateAuthorityRef: request.currentA100ServingRateAuthorityRef,
          at: admittedAt,
        }),
        input.l4RateRepository.rereadApprovedCurrentRate({
          rateAuthorityRef: request.currentL4FallbackRateAuthorityRef,
          routeId: 'l4_heavy_fallback',
          at: admittedAt,
        }),
        input.servingQuotaRepository.reread({
          quotaAuthorityRef: request.currentA100ServingQuotaAuthorityRef,
          at: admittedAt,
        }),
      ])
      if (!candidateRaw || !sourceRaw || !imageRaw || !a100RateRaw
        || !l4RateRaw || !quotaRaw) {
        throw new Error('Vertex serving qualification prerequisite is absent.')
      }
      const candidate =
        assertCanonicalSam31VertexServingQualificationCandidate(
          candidateRaw,
          admittedAt,
        )
      const sourceRelease =
        assertCanonicalSam31QualifiedSourceCheckpointRelease(sourceRaw)
      const source = projectCanonicalSam31QualifiedSourceCheckpointRelease(
        sourceRelease,
      )
      const image = assertQualifiedImage(imageRaw)
      const a100Rate =
        assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority(
          a100RateRaw,
          admittedAt,
        )
      const l4Rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
        l4RateRaw,
        admittedAt,
      )
      const quota =
        assertCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority(
          quotaRaw,
          admittedAt,
        )
      assertPrerequisites({ request, candidate, sourceRelease, source, image,
        a100Rate, l4Rate, quota })

      const identifiers = createCanonicalSam31A100QualificationIdentifiers({
        qualificationId: request.qualificationId,
        runOrdinal: request.runOrdinal,
        sourceCheckpointQualificationRef:
          request.sourceCheckpointQualificationRef,
        imageSupplyChainReleaseRef: request.imageSupplyChainReleaseRef,
        currentA100RateAuthorityRef:
          request.currentA100ServingRateAuthorityRef,
        currentL4FallbackRateAuthorityRef:
          request.currentL4FallbackRateAuthorityRef,
      })
      const refs = createCanonicalSam31A100QualificationRefs({
        request: {
          qualificationId: request.qualificationId,
          runOrdinal: request.runOrdinal,
          sourceCheckpointQualificationRef:
            request.sourceCheckpointQualificationRef,
          imageSupplyChainReleaseRef: request.imageSupplyChainReleaseRef,
          currentA100RateAuthorityRef:
            request.currentA100ServingRateAuthorityRef,
          currentL4FallbackRateAuthorityRef:
            request.currentL4FallbackRateAuthorityRef,
        },
        identifiers,
      })
      const expiresAt = earliest(
        candidate.expiresAt,
        a100Rate.expiresAt,
        l4Rate.expiresAt,
        quota.expiresAt,
        new Date(Date.parse(admittedAt) + 600_000).toISOString(),
      )
      const admission = buildAdmission({ request, candidate, source, image,
        a100Rate, l4Rate, quota, refs, admittedAt, expiresAt })
      const admissionRef = ref(admission.admissionId, admission.admissionHash)
      const consumption = buildConsumption({ admission, refs, admittedAt })
      const consumptionRef = ref(
        `${admission.admissionId}.consumption`,
        sha256AuthorityValue(consumption),
      )
      const envelope = buildEnvelope({ admission, refs, consumptionRef })
      const envelopeRef = ref(refs.invocationId,
        sha256AuthorityValue(envelope))
      const sourceMedia = buildCanonicalSam31A100QualificationProbeSourceMedia(
        refs,
      )
      const stagingEvidence = await input.privateInputStagingPort
        .stageAndRereadExactMaskProxy({
          invocationId: refs.invocationId,
          scope: {
            ownerUserId: refs.ownerUserId,
            workspaceId: refs.workspaceId,
            projectId: refs.projectId,
            editSessionId: refs.editSessionId,
            approvedSnapshotRef: refs.approvedSnapshotRef,
            approvedWorkItemRef: refs.approvedWorkItemRef,
            workerLeaseRef: refs.workerLeaseRef,
            executionAttemptRef: refs.executionAttemptRef,
          },
          dispatchAdmissionRef: admissionRef,
          executionEnvelopeRef: envelopeRef,
          sourceBindingRef: refs.sourceBindingRef,
          sourceMedia,
          privateTaskInputTransportRef: refs.privateTaskInputTransportRef,
          stagedAt: admittedAt,
        })
      const task = buildCanonicalSam31A100QualificationTask({
        admission: {
          admissionId: admission.admissionId,
          admissionHash: admission.admissionHash,
          sourceCheckpointQualificationRef:
            request.sourceCheckpointQualificationRef,
          currentA100RateAuthorityRef:
            request.currentA100ServingRateAuthorityRef,
          currentL4FallbackRateAuthorityRef:
            request.currentL4FallbackRateAuthorityRef,
        },
        release: { releaseRef: request.qualificationCandidateRef },
        source,
        image,
        refs,
        consumptionRef,
        envelopeRef,
        sourceMedia,
        stagingEvidence,
        preparedAt: admittedAt,
      })
      const taskDisposition = await input.taskStore.persistTaskCreateOnly(task)
      const rereadTask = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(task.invocationId),
      )
      if (taskDisposition !== 'created'
        || rereadTask.taskRecordHash !== task.taskRecordHash) {
        throw new Error('Vertex serving qualification task is not create-only.')
      }
      const payload = preparationWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_PREPARATION_VERSION,
        source: 'canonical_server_sam3_1_vertex_serving_qualification_owner',
        qualificationId: request.qualificationId,
        runOrdinal: request.runOrdinal,
        invocationId: task.invocationId,
        qualificationCandidateRef: request.qualificationCandidateRef,
        admissionRef,
        dispatchAdmissionDigestSha256: admission.admissionHash,
        admissionConsumptionRef: consumptionRef,
        executionEnvelopeRef: envelopeRef,
        taskRecordRef: ref(task.taskId, task.taskRecordHash),
        currentA100ServingRateAuthorityRef:
          request.currentA100ServingRateAuthorityRef,
        currentL4FallbackRateAuthorityRef:
          request.currentL4FallbackRateAuthorityRef,
        currentA100ServingQuotaAuthorityRef:
          request.currentA100ServingQuotaAuthorityRef,
        exactOfficialProbeStagedAndTaskReread: true,
        readyForOnePrivateServingQualificationInvocation: true,
        customerInvocationAuthorized: false,
        customerCreditsMutated: false,
        qaApproved: false,
        runtimeReleaseGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        preparedAt: admittedAt,
        expiresAt,
      })
      const preparation =
        canonicalSam31VertexServingQualificationPreparationSchema.parse({
          ...payload,
          preparationHash: sha256AuthorityValue(payload),
        })
      if (await input.repository.persistCreateOnly({ admission, consumption,
        envelope, preparation }) !== 'created') {
        throw new Error('Vertex serving qualification preparation collided.')
      }
      const reread = assertCanonicalSam31VertexServingQualificationPreparation(
        await input.repository.reread({ invocationId: task.invocationId }),
        admittedAt,
      )
      if (reread.preparationHash !== preparation.preparationHash) {
        throw new Error('Vertex serving qualification preparation changed.')
      }
      return reread
    },
  })
}

export function createCanonicalSam31VertexServingQualificationPreparationRepository(
  input: { readonly objectPort: CanonicalCreateOnlyJsonObjectPort;
    readonly prefix?: string },
): CanonicalSam31VertexServingQualificationPreparationRepository {
  const prefix = (input.prefix ?? RECORD_PREFIX).replace(/^\/+|\/+$/gu, '')
  if (!prefix || prefix.includes('..') || prefix.includes('\\')) {
    throw new Error('Vertex serving qualification preparation prefix changed.')
  }
  return Object.freeze({
    async persistCreateOnly({ admission, consumption, envelope, preparation }) {
      const acceptedAdmission =
        assertCanonicalSam31VertexServingQualificationAdmission(admission)
      const acceptedPreparation =
        assertCanonicalSam31VertexServingQualificationPreparation(preparation)
      const record = { admission: acceptedAdmission, consumption, envelope,
        preparation: acceptedPreparation }
      assertPlainSerializedData(record, 'sam31_vertex_serving_preparation_record')
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      return input.objectPort.createOnly({
        objectPath: `${prefix}/${acceptedPreparation.invocationId}/record.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
    },
    async reread({ invocationId }) {
      const body = await input.objectPort.readExact(
        `${prefix}/${safeId.parse(invocationId)}/record.json`,
      )
      if (!body) return null
      const decoded = JSON.parse(body.toString('utf8')) as unknown
      assertPlainSerializedData(decoded, 'sam31_vertex_serving_preparation_record')
      const record = z.object({
        admission: canonicalSam31VertexServingQualificationAdmissionSchema,
        consumption: z.record(z.string(), z.unknown()),
        envelope: z.record(z.string(), z.unknown()),
        preparation: canonicalSam31VertexServingQualificationPreparationSchema,
      }).strict().parse(decoded)
      assertCanonicalSam31VertexServingQualificationAdmission(record.admission)
      assertCanonicalSam31VertexServingQualificationPreparation(
        record.preparation,
      )
      if (stableAuthorityStringify(record) !== body.toString('utf8')) {
        throw new Error('Vertex serving qualification record bytes changed.')
      }
      return structuredClone(record.preparation)
    },
  })
}

export function createCanonicalGcpSam31VertexServingQualificationPreparationService(
  input: { readonly storage?: Storage; readonly now?: () => string } = {},
) {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const control = createCanonicalGcsSourceAnalysisJsonObjectPort({ storage,
    bucketName: CONTROL_PLANE_BUCKET })
  const privateGpu = createCanonicalGcsSourceAnalysisJsonObjectPort({ storage,
    bucketName: PRIVATE_GPU_BUCKET })
  return createCanonicalSam31VertexServingQualificationPreparationService({
    candidateRepository:
      createCanonicalGcsSam31VertexServingQualificationCandidateRepository({
        storage,
      }),
    sourceCheckpointReadPort:
      createCanonicalSam31QualifiedSourceCheckpointReleaseObjectReadPort({
        objectPort: control,
      }),
    imageSupplyChainReadPort:
      createCanonicalSam31ImageSupplyChainReleaseRepository({
        objectPort: control,
      }),
    a100ServingRateRepository:
      createCanonicalGcsCurrentGoogleCloudVertexA100ServingRateAuthorityRepository({
        storage,
      }),
    l4RateRepository:
      createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository({
        objectPort: control,
      }),
    servingQuotaRepository:
      createCanonicalGcsCurrentGoogleCloudVertexA100ServingQuotaRepository({
        storage,
      }),
    repository:
      createCanonicalSam31VertexServingQualificationPreparationRepository({
        objectPort: control,
      }),
    privateInputStagingPort: createCanonicalSam31GpuPrivateInputStagingPort({
      sourceReadPort:
        createCanonicalSam31GcsOfficialProbeMaskProxyReadPort({ storage }),
      binaryObjectPort: createCanonicalSam31GcsPrivateBinaryObjectPort({
        storage,
        projectId: PROJECT_ID,
        bucketName: PRIVATE_GPU_BUCKET,
      }),
    }),
    taskStore: createCanonicalSam31GpuTaskStoreFromObjectPort({
      objectPort: privateGpu,
      prefix: TASK_PREFIX,
    }),
    now: input.now,
  })
}

export function assertCanonicalSam31VertexServingQualificationAdmission(
  value: unknown,
): CanonicalSam31VertexServingQualificationAdmission {
  assertPlainSerializedData(value, 'sam31_vertex_serving_qualification_admission')
  const parsed = canonicalSam31VertexServingQualificationAdmissionSchema.parse(
    value,
  )
  const { admissionHash, ...payload } = parsed
  if (admissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex serving qualification admission hash changed.')
  }
  return parsed
}

export function assertCanonicalSam31VertexServingQualificationPreparation(
  value: unknown,
  at?: string,
): CanonicalSam31VertexServingQualificationPreparation {
  assertPlainSerializedData(value,
    'sam31_vertex_serving_qualification_preparation')
  const parsed =
    canonicalSam31VertexServingQualificationPreparationSchema.parse(value)
  const { preparationHash, ...payload } = parsed
  if (preparationHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (Date.parse(at) < Date.parse(parsed.preparedAt)
      || Date.parse(at) >= Date.parse(parsed.expiresAt)))) {
    throw new Error('Vertex serving qualification preparation is invalid.')
  }
  return parsed
}

export function createCanonicalSam31VertexServingQualificationPreparationRef(
  preparation: CanonicalSam31VertexServingQualificationPreparation,
): Ref {
  return ref(
    `sam31-qualification-preparation:${preparation.invocationId}`,
    preparation.preparationHash,
  )
}

function buildAdmission(input: {
  request: Request
  candidate: ReturnType<
    typeof assertCanonicalSam31VertexServingQualificationCandidate
  >
  source: ReturnType<
    typeof projectCanonicalSam31QualifiedSourceCheckpointRelease
  >
  image: CanonicalSam31CloudImageSupplyChainRelease
  a100Rate: CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority
  l4Rate: CanonicalCurrentGoogleCloudGpuRateAuthority
  quota: ReturnType<
    typeof assertCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority
  >
  refs: ReturnType<typeof createCanonicalSam31A100QualificationRefs>
  admittedAt: string
  expiresAt: string
}) {
  const payload = admissionWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_ADMISSION_VERSION,
    source: 'canonical_server_sam3_1_vertex_serving_qualification_owner',
    evidenceClass: 'canonical_private_reread',
    admissionId: input.refs.admissionId,
    qualificationId: input.request.qualificationId,
    runOrdinal: input.request.runOrdinal,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    routeId: 'a100_80gb_heavy_primary',
    executionTarget:
      'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
    endpointResourceName: ENDPOINT,
    qualificationCandidateRef: input.request.qualificationCandidateRef,
    endpointDeploymentRef: input.candidate.endpointDeploymentRef,
    exactDeploymentObservationRef:
      input.candidate.exactDeploymentObservationRef,
    readinessProbeRef: input.candidate.readinessProbeRef,
    sourceCheckpointQualificationRef:
      stripSchemaVersion(input.request.sourceCheckpointQualificationRef),
    imageSupplyChainReleaseRef: input.request.imageSupplyChainReleaseRef,
    immutableImageRef: input.image.immutableImageRef,
    immutableImageDigest: input.image.immutableImageDigest,
    currentA100ServingRateAuthorityRef:
      input.request.currentA100ServingRateAuthorityRef,
    currentL4FallbackRateAuthorityRef:
      input.request.currentL4FallbackRateAuthorityRef,
    currentA100ServingQuotaAuthorityRef:
      input.request.currentA100ServingQuotaAuthorityRef,
    deterministicProbeFixtureRef: input.refs.deterministicProbeFixtureRef,
    internalQualificationPlanRef: input.refs.internalQualificationPlanRef,
    approvedInternalCostEstimateRef:
      input.refs.approvedInternalCostEstimateRef,
    internalCostBudgetRef: input.refs.internalCostBudgetRef,
    maximumExecutionSeconds: 600,
    maximumEstimatedInternalInfrastructureCostUsdNanos:
      maximumServingQualificationCostUsdNanos(input.a100Rate),
    maximumReservedCustomerToolCostCredits: 0,
    operatorTriggerRecordRef: input.refs.operatorTriggerRecordRef,
    executionAttemptRef: input.refs.executionAttemptRef,
    idempotencyKey: input.refs.idempotencyKey,
    exactCandidateDeploymentReadinessSourceCheckpointImageQuotaAndRatesReread:
      true,
    accountEffectiveA100ServingAndL4RatesBoundBeforeDispatch: true,
    actualAttemptCostRequiresEndpointUsageAndBillingReread: true,
    privatePreReleaseQualificationOnly: true,
    runtimeAlreadyQualifiedClaimed: false,
    userTriggeredScaleFromZero: true,
    minimumIdleInstances: 0,
    automaticRetryOrFallbackAllowed: false,
    callerPriceImageModelCommandPathUrlOrCredentialsAccepted: false,
    customerEditPlanOrCustomerCreditsUsed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    runtimeReleaseGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    admittedAt: input.admittedAt,
    expiresAt: input.expiresAt,
  })
  return canonicalSam31VertexServingQualificationAdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

function buildConsumption(input: {
  admission: CanonicalSam31VertexServingQualificationAdmission
  refs: ReturnType<typeof createCanonicalSam31A100QualificationRefs>
  admittedAt: string
}) {
  return Object.freeze({
    schemaVersion:
      'canonical-sam3_1-vertex-serving-qualification-consumption-v1',
    source: 'canonical_server_sam3_1_vertex_serving_qualification_owner',
    admissionRef: ref(input.admission.admissionId,
      input.admission.admissionHash),
    executionAttemptRef: input.refs.executionAttemptRef,
    approvedWorkItemRef: input.refs.approvedWorkItemRef,
    operatorTriggerRecordRef: input.refs.operatorTriggerRecordRef,
    idempotencyKey: input.refs.idempotencyKey,
    consumedBeforePredictionCall: true,
    createOnlySingleUse: true,
    automaticRetryAllowed: false,
    customerCreditsMutated: false,
    runtimeReleaseGranted: false,
    productionAuthorityGranted: false,
    consumedAt: input.admittedAt,
  } as const)
}

function buildEnvelope(input: {
  admission: CanonicalSam31VertexServingQualificationAdmission
  refs: ReturnType<typeof createCanonicalSam31A100QualificationRefs>
  consumptionRef: Ref
}) {
  return Object.freeze({
    schemaVersion:
      'canonical-sam3_1-vertex-serving-qualification-envelope-v1',
    source: 'canonical_server_sam3_1_vertex_serving_qualification_owner',
    envelopeId: input.refs.invocationId,
    admissionRef: ref(input.admission.admissionId,
      input.admission.admissionHash),
    admissionConsumptionRef: input.consumptionRef,
    qualificationCandidateRef: input.admission.qualificationCandidateRef,
    approvedSnapshotRef: input.refs.approvedSnapshotRef,
    confirmedOutputFrameRef: input.refs.confirmedOutputFrameRef,
    masterTimingRef: input.refs.masterTimingRef,
    approvedWorkItemRef: input.refs.approvedWorkItemRef,
    workerLeaseRef: input.refs.workerLeaseRef,
    operatorTriggerRecordRef: input.refs.operatorTriggerRecordRef,
    executionAttemptRef: input.refs.executionAttemptRef,
    byteFreeEnvelope: true,
    cpuOnlySubstantiveExecutionAllowed: false,
    privateQualificationOnly: true,
    customerCreditsMutated: false,
    runtimeReleaseGranted: false,
    productionAuthorityGranted: false,
  } as const)
}

function assertPrerequisites(input: {
  request: Request
  candidate: ReturnType<
    typeof assertCanonicalSam31VertexServingQualificationCandidate
  >
  sourceRelease: ReturnType<
    typeof assertCanonicalSam31QualifiedSourceCheckpointRelease
  >
  source: ReturnType<
    typeof projectCanonicalSam31QualifiedSourceCheckpointRelease
  >
  image: CanonicalSam31CloudImageSupplyChainRelease
  a100Rate: CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority
  l4Rate: CanonicalCurrentGoogleCloudGpuRateAuthority
  quota: ReturnType<
    typeof assertCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority
  >
}): void {
  if (!sameRef(input.request.qualificationCandidateRef, {
    id: input.candidate.candidateId,
    version: 1,
    contentHash: `sha256:${input.candidate.candidateHash}`,
  }) || !sameRef(input.request.sourceCheckpointQualificationRef,
    input.sourceRelease.sourceCheckpointQualificationRef)
    || !input.source.exactCanonicalReread
    || !input.source.sourceCheckpointQualificationGranted
    || input.image.releaseId !== input.request.imageSupplyChainReleaseRef.id
    || `sha256:${input.image.releaseHash}` !==
      input.request.imageSupplyChainReleaseRef.contentHash
    || input.image.immutableImageDigest !== input.candidate.immutableImageDigest
    || input.a100Rate.routeId !== 'a100_80gb_heavy_primary'
    || input.a100Rate.executionTarget !== input.candidate.executionTarget
    || input.l4Rate.routeId !== 'l4_heavy_fallback'
    || input.quota.effectiveLimit !== 1
    || input.quota.requiredMaximumReplicaCount !== 1
    || !input.candidate.readyForPrivateQualificationInvocation
    || input.candidate.readyForCustomerInvocation
  ) throw new Error('Vertex serving qualification lineage changed.')
}

function assertQualifiedImage(value: unknown) {
  const image = assertCanonicalSam31CloudImageSupplyChainRelease(value)
  if (image.status !== 'image_supply_chain_qualified'
    || !image.authority.imageSupplyChainQualified
    || image.authority.a100RuntimeQualified
    || image.authority.runtimeReleaseGranted
    || image.authority.gpuJobDispatched) {
    throw new Error('SAM 3.1 image is not pre-release qualification eligible.')
  }
  return image
}

function maximumServingQualificationCostUsdNanos(
  rate: CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
) {
  const quantities: Readonly<Record<string, readonly [bigint, bigint]>> = {
    vertex_prediction_a100_80gb_hour: [1n, 4n],
    vertex_prediction_a2_core_hour: [3n, 1n],
    vertex_prediction_a2_ram_gib_hour: [85n, 2n],
    vertex_prediction_management_a2_core_hour: [3n, 1n],
    vertex_prediction_management_a2_ram_gib_hour: [85n, 2n],
    private_object_storage_gib_month: [8n, 1n],
    network_egress_gib: [0n, 1n],
    object_class_a_per_1000: [1n, 1n],
    object_class_b_per_1000: [1n, 1n],
  }
  const total = rate.components.reduce((sum, component) => {
    const [numerator, denominator] = quantities[component.componentClass]
      ?? [0n, 1n]
    const unit = BigInt(component.maximumUsdNanosPerBillingUnit)
    return sum + (unit * numerator + denominator - 1n) / denominator
  }, 0n)
  const result = Number(total)
  if (!Number.isSafeInteger(result) || result < 0) {
    throw new Error('Vertex serving qualification estimate overflowed.')
  }
  return result
}

function ref(id: string, digest: string, version = 1): Ref {
  return refSchema.parse({ id, version, contentHash: `sha256:${digest}` })
}

function sameRef(left: Ref, right: Ref): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function earliest(...values: readonly string[]): string {
  return new Date(Math.min(...values.map((value) => Date.parse(value))))
    .toISOString()
}

function stripSchemaVersion(value: {
  readonly id: string
  readonly version: number
  readonly contentHash: string
}) {
  return refSchema.parse({
    id: value.id,
    version: value.version,
    contentHash: value.contentHash,
  })
}
