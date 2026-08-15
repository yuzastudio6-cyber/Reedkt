import { createHash } from 'node:crypto'
import type { Readable } from 'node:stream'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
  type CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import {
  assertCanonicalSam31CloudImageSupplyChainRelease,
  type CanonicalSam31CloudImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-cloud-image-supply-chain-release'
import {
  assertCanonicalSam31QualifiedSourceCheckpointRelease,
  createCanonicalSam31QualifiedSourceCheckpointReleaseObjectReadPort,
  projectCanonicalSam31QualifiedSourceCheckpointRelease,
  type CanonicalSam31QualifiedSourceCheckpointReleaseReadPort,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualified-authority'
import {
  canonicalSam31GpuSourceMediaSchema,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  createCanonicalSam31GcsPrivateBinaryObjectPort,
  createCanonicalSam31GpuPrivateInputStagingPort,
  type CanonicalSam31GpuPreparedMaskProxyReadPort,
  type CanonicalSam31GpuPrivateInputStagingPort,
} from '../workers/masks/canonical-sam3_1-gpu-private-input-staging-service'
import {
  assertCanonicalSam31GpuTaskRecord,
  createCanonicalSam31GpuTaskStoreFromObjectPort,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
  type CanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from './canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  createCanonicalGcsCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
  type CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
} from './canonical-current-google-cloud-vertex-a100-serving-rate-authority-repository'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  buildCanonicalSam31A100QualificationExecutionEnvelope,
  buildCanonicalSam31A100QualificationLifecycleConsumption,
  buildCanonicalSam31A100QualificationTask,
  createCanonicalSam31A100QualificationIdentifiers,
  createCanonicalSam31A100QualificationRefs,
} from './canonical-sam3_1-a100-runtime-qualification-launch-service'
import {
  createCanonicalSam31ImageSupplyChainReleaseRepository,
  type CanonicalSam31ImageSupplyChainReleaseRepository,
} from './canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  type CanonicalSam31EightMinuteQualificationSourcePlan,
  type CanonicalSam31EightMinuteQualificationSourcePreparation,
  createCanonicalSam31EightMinuteQualificationSourceRepository,
  parseCanonicalSam31EightMinuteQualificationSourcePlan,
  parseCanonicalSam31EightMinuteQualificationSourcePreparation,
} from './canonical-sam3_1-eight-minute-qualification-source-owner'
import {
  assertCanonicalSam31PrivateCompleteSourceQualificationAdmission,
  canonicalSam31PrivateCompleteSourceQualificationAdmissionRef,
  createCanonicalSam31PrivateCompleteSourceQualificationAdmissionRepository,
  type CanonicalSam31PrivateCompleteSourceQualificationAdmissionRepository,
} from './canonical-sam3_1-private-complete-source-qualification-admission-owner'
import {
  assertCanonicalSam31VertexServingQualificationCandidate,
  createCanonicalGcsSam31VertexServingQualificationCandidateRepository,
  type CanonicalSam31VertexServingQualificationCandidateRepository,
} from './canonical-sam3_1-vertex-serving-qualification-candidate'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_CHUNK_QUALIFICATION_ADMISSION_VERSION =
  'canonical-sam3_1-vertex-complete-source-chunk-qualification-admission-v1' as const
export const
CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_QUALIFICATION_PREPARATION_VERSION =
  'canonical-sam3_1-vertex-complete-source-qualification-preparation-v1' as const
export const
CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_QUALIFICATION_AUTHORITY_LIFETIME_MILLISECONDS =
  15 * 60_000

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const PRIVATE_GPU_BUCKET = 'reeditpro-production-reeditpro-masks' as const
const TASK_PREFIX = 'private/canonical-professional-gpu/sam3_1/v1/invocations'
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-vertex-complete-source-qualification-preparations'
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const timestamp = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const versionOneRefSchema = refSchema.extend({ version: z.literal(1) }).strict()
type EvidenceRef = z.infer<typeof refSchema>
type PreparedChunk = CanonicalSam31EightMinuteQualificationSourcePreparation[
  'preparedChunks'
][number]

const requestSchema = z.object({
  parentQualificationAdmissionRef: refSchema,
  qualificationCandidateRef: refSchema,
  sourceCheckpointQualificationRef: refSchema.extend({
    schemaVersion: z.literal(
      'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
    ),
    version: z.literal(2),
  }).strict(),
  currentA100ServingRateAuthorityRef: refSchema,
  currentL4FallbackRateAuthorityRef: refSchema,
  chunkOrdinal: z.number().int().min(1).max(49).safe(),
}).strict()

const admissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_CHUNK_QUALIFICATION_ADMISSION_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_qualification_owner',
  ),
  evidenceClass: z.literal('canonical_private_exact_chunk_reread'),
  admissionId: safeId,
  parentQualificationAdmissionRef: refSchema,
  qualificationId: safeId,
  runOrdinal: z.number().int().min(1).max(30).safe(),
  chunkOrdinal: z.number().int().min(1).max(49).safe(),
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  routeId: z.literal('a100_80gb_heavy_primary'),
  executionTarget: z.literal(
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
  ),
  qualificationCandidateRef: refSchema,
  sourceCheckpointQualificationRef: refSchema.extend({
    schemaVersion: z.literal(
      'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
    ),
    version: z.literal(2),
  }).strict(),
  imageSupplyChainReleaseRef: refSchema,
  immutableImageRef: refSchema,
  immutableImageDigest: prefixedSha256,
  currentA100RateAuthorityRef: refSchema,
  currentL4FallbackRateAuthorityRef: refSchema,
  qualificationSourcePlanRef: refSchema,
  sourcePreparationRef: refSchema,
  exactEightMinuteSourceRef: refSchema,
  preparedChunkArtifactRef: refSchema,
  exactSourceRangeMappingRef: refSchema,
  ffprobeEvidenceRef: refSchema,
  gpuPreparationEvidenceRef: refSchema,
  canonicalStartFrameInclusive: z.number().int().nonnegative().safe(),
  canonicalEndFrameInclusive: z.number().int().nonnegative().safe(),
  decodedFrameCount: z.number().int().min(1).max(240).safe(),
  exactParentAdmissionCandidateCheckpointImageRatesPlanPreparationAndChunkReread:
    z.literal(true),
  oneChunkCreateOnlyConsumptionRequired: z.literal(true),
  privateCompleteSourceQualificationOnly: z.literal(true),
  finalRuntimeReleaseRequiredBeforeThisQualificationChunk: z.literal(false),
  finalRuntimeReleaseMayConsumeThisAdmission: z.literal(false),
  userTriggeredScaleFromZero: z.literal(true),
  minimumIdleInstances: z.literal(0),
  automaticRetryOrFallbackAllowed: z.literal(false),
  substantiveCpuExecutionAllowed: z.literal(false),
  sourceResolutionReductionAllowed: z.literal(false),
  maximumCustomerToolCostCredits: z.literal(0),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  admittedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  const life = Date.parse(value.expiresAt) - Date.parse(value.admittedAt)
  if (life <= 0 || life >
      CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_QUALIFICATION_AUTHORITY_LIFETIME_MILLISECONDS
    || value.canonicalEndFrameInclusive < value.canonicalStartFrameInclusive
    || value.canonicalEndFrameInclusive - value.canonicalStartFrameInclusive
      + 1 !== value.decodedFrameCount) {
    context.addIssue({
      code: 'custom',
      message: 'Complete-source chunk qualification admission changed.',
    })
  }
})
export const
canonicalSam31VertexCompleteSourceChunkQualificationAdmissionSchema =
  admissionWithoutHashSchema.extend({ admissionHash: sha256 }).strict()
export type CanonicalSam31VertexCompleteSourceChunkQualificationAdmission =
  z.infer<
    typeof canonicalSam31VertexCompleteSourceChunkQualificationAdmissionSchema
  >

const preparationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_QUALIFICATION_PREPARATION_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_qualification_owner',
  ),
  qualificationId: safeId,
  runOrdinal: z.number().int().min(1).max(30).safe(),
  chunkOrdinal: z.number().int().min(1).max(49).safe(),
  invocationId: safeId,
  parentQualificationAdmissionRef: refSchema,
  qualificationCandidateRef: refSchema,
  admissionRef: refSchema,
  dispatchAdmissionDigestSha256: sha256,
  admissionConsumptionRef: refSchema,
  executionEnvelopeRef: refSchema,
  taskRecordRef: refSchema,
  sourcePreparationRef: refSchema,
  preparedChunkArtifactRef: refSchema,
  exactSourceRangeMappingRef: refSchema,
  canonicalStartFrameInclusive: z.number().int().nonnegative().safe(),
  canonicalEndFrameInclusive: z.number().int().nonnegative().safe(),
  decodedFrameCount: z.number().int().min(1).max(240).safe(),
  currentA100ServingRateAuthorityRef: refSchema,
  currentL4FallbackRateAuthorityRef: refSchema,
  exactPreparedChunkStagedAndTaskReread: z.literal(true),
  readyForOnePrivateCompleteSourceQualificationInvocation: z.literal(true),
  customerInvocationAuthorized: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  preparedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  if (Date.parse(value.expiresAt) <= Date.parse(value.preparedAt)
    || Date.parse(value.expiresAt) - Date.parse(value.preparedAt) >
      CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_QUALIFICATION_AUTHORITY_LIFETIME_MILLISECONDS
    || value.admissionRef.contentHash !==
      `sha256:${value.dispatchAdmissionDigestSha256}`
    || value.canonicalEndFrameInclusive - value.canonicalStartFrameInclusive
      + 1 !== value.decodedFrameCount) {
    context.addIssue({
      code: 'custom',
      message: 'Complete-source qualification preparation changed.',
    })
  }
})
export const canonicalSam31VertexCompleteSourceQualificationPreparationSchema =
  preparationWithoutHashSchema.extend({ preparationHash: sha256 }).strict()
export type CanonicalSam31VertexCompleteSourceQualificationPreparation =
  z.infer<
    typeof canonicalSam31VertexCompleteSourceQualificationPreparationSchema
  >

export interface CanonicalSam31VertexCompleteSourceQualificationPreparationRepository {
  persistCreateOnly(input: {
    readonly admission:
      CanonicalSam31VertexCompleteSourceChunkQualificationAdmission
    readonly consumption: Readonly<Record<string, unknown>>
    readonly envelope: Readonly<Record<string, unknown>>
    readonly preparation:
      CanonicalSam31VertexCompleteSourceQualificationPreparation
  }): Promise<'created' | 'already_exists'>
  reread(input: { readonly invocationId: string }): Promise<unknown>
}

export function createCanonicalSam31VertexCompleteSourceQualificationPreparationService(
  input: {
    readonly parentAdmissionRepository: Pick<
      CanonicalSam31PrivateCompleteSourceQualificationAdmissionRepository,
      'reread'
    >
    readonly sourceRepository: ReturnType<
      typeof createCanonicalSam31EightMinuteQualificationSourceRepository
    >
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
    readonly repository:
      CanonicalSam31VertexCompleteSourceQualificationPreparationRepository
    privateInputStagingPortFactory(input: {
      readonly plan: CanonicalSam31EightMinuteQualificationSourcePlan
      readonly preparation:
        CanonicalSam31EightMinuteQualificationSourcePreparation
      readonly chunk: PreparedChunk
    }): CanonicalSam31GpuPrivateInputStagingPort
    readonly taskStore: CanonicalSam31GpuTaskStore
    readonly now?: () => string
  },
) {
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async prepareOne(untrusted: unknown): Promise<
      CanonicalSam31VertexCompleteSourceQualificationPreparation
    > {
      assertPlainSerializedData(untrusted,
        'sam31_vertex_complete_source_qualification_preparation')
      const request = requestSchema.parse(untrusted)
      const preparedAt = timestamp.parse(now())
      const parent = await input.parentAdmissionRepository.reread({
        admissionRef: request.parentQualificationAdmissionRef,
        at: preparedAt,
      })
      if (!parent) throw new Error(
        'Complete-source qualification parent admission is absent.',
      )
      const [planRaw, preparationRaw, candidateRaw, sourceRaw, imageRaw,
        a100RateRaw, l4RateRaw] = await Promise.all([
        input.sourceRepository.rereadPlan({
          qualificationSourceId: parent.qualificationSourcePlanRef.id,
        }),
        input.sourceRepository.rereadPreparation({
          preparationId: parent.sourcePreparationRef.id,
        }),
        input.candidateRepository.reread({
          candidateId: request.qualificationCandidateRef.id,
        }),
        input.sourceCheckpointReadPort.rereadQualificationRelease({
          sourceCheckpointQualificationRef:
            request.sourceCheckpointQualificationRef,
        }),
        input.imageSupplyChainReadPort.rereadQualifiedRelease({
          releaseRef: versionOneRefSchema.parse(
            parent.imageSupplyChainReleaseRef,
          ),
        }),
        input.a100ServingRateRepository.reread({
          rateAuthorityRef: request.currentA100ServingRateAuthorityRef,
          at: preparedAt,
        }),
        input.l4RateRepository.rereadApprovedCurrentRate({
          rateAuthorityRef: request.currentL4FallbackRateAuthorityRef,
          routeId: 'l4_heavy_fallback',
          at: preparedAt,
        }),
      ])
      if (!planRaw || !preparationRaw || !candidateRaw || !sourceRaw
        || !imageRaw || !a100RateRaw || !l4RateRaw) {
        throw new Error(
          'Complete-source qualification prerequisite is absent.',
        )
      }
      const plan = parseCanonicalSam31EightMinuteQualificationSourcePlan(
        planRaw,
      )
      const preparation =
        parseCanonicalSam31EightMinuteQualificationSourcePreparation(
          preparationRaw,
        )
      const candidate = assertCanonicalSam31VertexServingQualificationCandidate(
        candidateRaw,
        preparedAt,
      )
      const sourceRelease = assertCanonicalSam31QualifiedSourceCheckpointRelease(
        sourceRaw,
      )
      const source = projectCanonicalSam31QualifiedSourceCheckpointRelease(
        sourceRelease,
      )
      const image = assertQualifiedImage(imageRaw)
      const a100Rate =
        assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2(
          a100RateRaw,
          preparedAt,
        )
      const l4Rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
        l4RateRaw,
        preparedAt,
      )
      const chunk = preparation.preparedChunks[request.chunkOrdinal - 1]
      if (!chunk) throw new Error('Prepared qualification chunk is absent.')
      assertPrerequisites({ request, parent, plan, preparation, candidate,
        sourceRelease, source, image, a100Rate, l4Rate, chunk })

      const childQualificationId = safeId.parse(
        `${parent.qualificationId}.chunk-${String(request.chunkOrdinal)
          .padStart(3, '0')}`,
      )
      const identifierRequest = {
        qualificationId: childQualificationId,
        runOrdinal: parent.runOrdinal,
        sourceCheckpointQualificationRef:
          request.sourceCheckpointQualificationRef,
        imageSupplyChainReleaseRef: versionOneRefSchema.parse(
          parent.imageSupplyChainReleaseRef,
        ),
        currentA100RateAuthorityRef:
          request.currentA100ServingRateAuthorityRef,
        currentL4FallbackRateAuthorityRef:
          request.currentL4FallbackRateAuthorityRef,
      }
      const identifiers = createCanonicalSam31A100QualificationIdentifiers(
        identifierRequest,
      )
      const baseRefs = createCanonicalSam31A100QualificationRefs({
        request: identifierRequest,
        identifiers,
      })
      const refs = buildChunkRefs({ baseRefs, parent, plan, preparation,
        chunk })
      const expiresAt = earliest(parent.expiresAt, candidate.expiresAt,
        a100Rate.expiresAt, l4Rate.expiresAt,
        new Date(Date.parse(preparedAt) +
          CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_QUALIFICATION_AUTHORITY_LIFETIME_MILLISECONDS,
        ).toISOString())
      const admission = buildAdmission({ parent, candidate, sourceRelease,
        image, a100Rate, l4Rate, chunk, request, refs, preparedAt, expiresAt })
      const admissionRef = ref(admission.admissionId, admission.admissionHash)
      const consumption =
        buildCanonicalSam31A100QualificationLifecycleConsumption({
          admission,
          release: { releaseRef: request.qualificationCandidateRef },
          refs,
          consumedAt: preparedAt,
        })
      const consumptionRef = ref(
        `${admission.admissionId}.consumption`,
        consumption.consumptionHash,
      )
      const envelope =
        buildCanonicalSam31A100QualificationExecutionEnvelope({
          admission,
          release: {
            releaseRef: request.qualificationCandidateRef,
            immutableImageDigest: image.immutableImageDigest,
          },
          refs,
          consumptionRef,
        })
      const envelopeRef = ref(envelope.envelopeId, envelope.envelopeHash)
      const sourceMedia = buildSourceMedia({ plan, chunk, refs })
      const stagingEvidence = await input.privateInputStagingPortFactory({
        plan,
        preparation,
        chunk,
      }).stageAndRereadExactMaskProxy({
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
        stagedAt: preparedAt,
      })
      const task = buildCanonicalSam31A100QualificationTask({
        admission,
        release: { releaseRef: request.qualificationCandidateRef },
        source,
        image,
        refs,
        consumptionRef,
        envelopeRef,
        sourceMedia,
        stagingEvidence,
        preparedAt,
      })
      if (await input.taskStore.persistTaskCreateOnly(task) !== 'created') {
        throw new Error(
          'Complete-source qualification task is not create-only.',
        )
      }
      const rereadTask = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(task.invocationId),
      )
      if (rereadTask.taskRecordHash !== task.taskRecordHash) {
        throw new Error('Complete-source qualification task changed.')
      }
      const payload = preparationWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_QUALIFICATION_PREPARATION_VERSION,
        source: 'canonical_server_sam3_1_vertex_serving_qualification_owner',
        qualificationId: parent.qualificationId,
        runOrdinal: parent.runOrdinal,
        chunkOrdinal: request.chunkOrdinal,
        invocationId: task.invocationId,
        parentQualificationAdmissionRef:
          request.parentQualificationAdmissionRef,
        qualificationCandidateRef: request.qualificationCandidateRef,
        admissionRef,
        dispatchAdmissionDigestSha256: admission.admissionHash,
        admissionConsumptionRef: consumptionRef,
        executionEnvelopeRef: envelopeRef,
        taskRecordRef: ref(task.taskId, task.taskRecordHash),
        sourcePreparationRef: parent.sourcePreparationRef,
        preparedChunkArtifactRef: chunk.preparedChunkArtifactRef,
        exactSourceRangeMappingRef: chunk.exactSourceRangeMappingRef,
        canonicalStartFrameInclusive: chunk.canonicalStartFrameInclusive,
        canonicalEndFrameInclusive: chunk.canonicalEndFrameInclusive,
        decodedFrameCount: chunk.decodedFrameCount,
        currentA100ServingRateAuthorityRef:
          request.currentA100ServingRateAuthorityRef,
        currentL4FallbackRateAuthorityRef:
          request.currentL4FallbackRateAuthorityRef,
        exactPreparedChunkStagedAndTaskReread: true,
        readyForOnePrivateCompleteSourceQualificationInvocation: true,
        customerInvocationAuthorized: false,
        customerCreditsMutated: false,
        qaApproved: false,
        runtimeReleaseGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        preparedAt,
        expiresAt,
      })
      const record =
        canonicalSam31VertexCompleteSourceQualificationPreparationSchema.parse({
          ...payload,
          preparationHash: sha256AuthorityValue(payload),
        })
      if (await input.repository.persistCreateOnly({ admission, consumption,
        envelope, preparation: record }) !== 'created') {
        throw new Error('Complete-source qualification preparation collided.')
      }
      const reread =
        assertCanonicalSam31VertexCompleteSourceQualificationPreparation(
          await input.repository.reread({ invocationId: task.invocationId }),
          preparedAt,
        )
      if (reread.preparationHash !== record.preparationHash) {
        throw new Error('Complete-source qualification preparation changed.')
      }
      return reread
    },
  })
}

export function createCanonicalSam31VertexCompleteSourceQualificationPreparationRepository(
  input: { readonly objectPort: CanonicalCreateOnlyJsonObjectPort;
    readonly prefix?: string },
): CanonicalSam31VertexCompleteSourceQualificationPreparationRepository {
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const recordSchema = z.object({
    admission:
      canonicalSam31VertexCompleteSourceChunkQualificationAdmissionSchema,
    consumption: z.record(z.string(), z.unknown()),
    envelope: z.record(z.string(), z.unknown()),
    preparation:
      canonicalSam31VertexCompleteSourceQualificationPreparationSchema,
  }).strict()
  const repository:
  CanonicalSam31VertexCompleteSourceQualificationPreparationRepository = {
    async persistCreateOnly({ admission, consumption, envelope,
      preparation }) {
      const record = recordSchema.parse({
        admission: assertCanonicalSam31VertexCompleteSourceChunkQualificationAdmission(
          admission,
        ),
        consumption,
        envelope,
        preparation:
          assertCanonicalSam31VertexCompleteSourceQualificationPreparation(
            preparation,
          ),
      })
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      return input.objectPort.createOnly({
        objectPath: `${prefix}/${preparation.invocationId}/record.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
    },
    async reread({ invocationId }) {
      const body = await input.objectPort.readExact(
        `${prefix}/${safeId.parse(invocationId)}/record.json`,
      )
      if (!body) return null
      const parsed = recordSchema.parse(
        JSON.parse(body.toString('utf8')) as unknown,
      )
      const preparation =
        assertCanonicalSam31VertexCompleteSourceQualificationPreparation(
          parsed.preparation,
        )
      if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
        throw new Error('Complete-source qualification record bytes changed.')
      }
      return structuredClone(preparation)
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalGcpSam31VertexCompleteSourceQualificationPreparationService(
  input: { readonly storage?: Storage; readonly now?: () => string } = {},
) {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const control = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_PLANE_BUCKET,
  })
  const privateGpu = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: PRIVATE_GPU_BUCKET,
  })
  return createCanonicalSam31VertexCompleteSourceQualificationPreparationService({
    parentAdmissionRepository:
      createCanonicalSam31PrivateCompleteSourceQualificationAdmissionRepository({
        objectPort: control,
      }),
    sourceRepository:
      createCanonicalSam31EightMinuteQualificationSourceRepository({
        objectPort: control,
      }),
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
    repository:
      createCanonicalSam31VertexCompleteSourceQualificationPreparationRepository({
        objectPort: control,
      }),
    privateInputStagingPortFactory: ({ plan, preparation, chunk }) =>
      createCanonicalSam31GpuPrivateInputStagingPort({
        sourceReadPort:
          createCanonicalSam31GcsEightMinuteQualificationChunkReadPort({
            storage,
            plan,
            preparation,
            chunk,
          }),
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

export function createCanonicalSam31GcsEightMinuteQualificationChunkReadPort(
  input: {
    readonly storage?: Storage
    readonly plan: CanonicalSam31EightMinuteQualificationSourcePlan
    readonly preparation:
      CanonicalSam31EightMinuteQualificationSourcePreparation
    readonly chunk: PreparedChunk
  },
): CanonicalSam31GpuPreparedMaskProxyReadPort {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const plan = parseCanonicalSam31EightMinuteQualificationSourcePlan(
    input.plan,
  )
  const preparation =
    parseCanonicalSam31EightMinuteQualificationSourcePreparation(
      input.preparation,
    )
  const chunk = preparation.preparedChunks[input.chunk.chunkOrdinal - 1]
  if (!chunk || !sameRef(chunk.preparedChunkArtifactRef,
    input.chunk.preparedChunkArtifactRef)) {
    throw new Error('Qualification chunk read port lineage changed.')
  }
  const refs = sourceRefs({ plan, preparation, chunk })
  return Object.freeze({
    async rereadExactApprovedMaskProxy(
      request: Parameters<
        CanonicalSam31GpuPreparedMaskProxyReadPort[
          'rereadExactApprovedMaskProxy'
        ]
      >[0],
    ) {
      if (!sameRef(request.sourceBindingRef, refs.sourceBindingRef)
        || !sameRef(request.finalizedSourceArtifactRef,
          plan.exactEightMinuteSourceRef)
        || !sameRef(request.gpuPreparedMaskProxyArtifactRef,
          chunk.preparedChunkArtifactRef)
        || !sameRef(request.exactSourceReadEvidenceRef,
          chunk.gpuPreparationEvidenceRef)
        || !sameRef(request.sourceFrameRangeMappingRef,
          chunk.exactSourceRangeMappingRef)
        || !sameRef(request.proxyPixelGeometryQaRef,
          chunk.ffprobeEvidenceRef)
        || request.expectedByteLength !== chunk.byteLength
        || request.expectedSha256 !== chunk.sha256) {
        throw new Error('Qualification chunk source request changed.')
      }
      const file = storage.bucket(chunk.privateCoordinate.bucketName).file(
        chunk.privateCoordinate.objectName,
        { generation: chunk.privateCoordinate.generation },
      )
      const [metadata] = await file.getMetadata()
      const etag = String(metadata.etag ?? '')
      if (String(metadata.generation ?? '') !==
          chunk.privateCoordinate.generation
        || Number(metadata.size ?? -1) !== chunk.byteLength
        || String(metadata.contentType ?? '') !== 'video/mp4'
        || createHash('sha256').update(etag, 'utf8').digest('hex') !==
          chunk.privateCoordinate.etagSha256) {
        throw new Error('Qualification chunk GCS generation changed.')
      }
      return {
        contentType: 'video/mp4' as const,
        byteLength: chunk.byteLength,
        sha256: chunk.sha256,
        width: plan.sourceWidth,
        height: plan.sourceHeight,
        decodedFrameCount: chunk.decodedFrameCount,
        selectedStartFrameInclusive: 0,
        selectedEndFrameInclusive: chunk.decodedFrameCount - 1,
        sourceBindingRef: refs.sourceBindingRef,
        finalizedSourceArtifactRef: plan.exactEightMinuteSourceRef,
        gpuPreparedMaskProxyArtifactRef: chunk.preparedChunkArtifactRef,
        exactSourceReadEvidenceRef: chunk.gpuPreparationEvidenceRef,
        sourceFrameRangeMappingRef: chunk.exactSourceRangeMappingRef,
        proxyPixelGeometryQaRef: chunk.ffprobeEvidenceRef,
        exactApprovedSnapshotWorkLeaseAndSourceReread: true as const,
        sourcePathUrlBucketObjectGenerationOrBytesExposed: false as const,
        async openStream(): Promise<Readable> {
          return file.createReadStream({
            decompress: false,
            validation: 'crc32c',
          })
        },
      }
    },
  })
}

export function assertCanonicalSam31VertexCompleteSourceChunkQualificationAdmission(
  value: unknown,
): CanonicalSam31VertexCompleteSourceChunkQualificationAdmission {
  assertPlainSerializedData(value,
    'sam31_vertex_complete_source_chunk_qualification_admission')
  const parsed =
    canonicalSam31VertexCompleteSourceChunkQualificationAdmissionSchema.parse(
      value,
    )
  const { admissionHash, ...payload } = parsed
  if (admissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('Complete-source chunk qualification admission changed.')
  }
  return parsed
}

export function assertCanonicalSam31VertexCompleteSourceQualificationPreparation(
  value: unknown,
  at?: string,
): CanonicalSam31VertexCompleteSourceQualificationPreparation {
  assertPlainSerializedData(value,
    'sam31_vertex_complete_source_qualification_preparation')
  const parsed =
    canonicalSam31VertexCompleteSourceQualificationPreparationSchema.parse(
      value,
    )
  const { preparationHash, ...payload } = parsed
  if (preparationHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (Date.parse(at) < Date.parse(parsed.preparedAt)
      || Date.parse(at) >= Date.parse(parsed.expiresAt)))) {
    throw new Error('Complete-source qualification preparation is invalid.')
  }
  return parsed
}

export function createCanonicalSam31VertexCompleteSourceQualificationPreparationRef(
  value: CanonicalSam31VertexCompleteSourceQualificationPreparation,
): EvidenceRef {
  const preparation =
    assertCanonicalSam31VertexCompleteSourceQualificationPreparation(value)
  return ref(
    `sam31-complete-source-qualification-preparation:${preparation.invocationId}`,
    preparation.preparationHash,
  )
}

function buildAdmission(input: {
  parent: ReturnType<
    typeof assertCanonicalSam31PrivateCompleteSourceQualificationAdmission
  >
  candidate: ReturnType<
    typeof assertCanonicalSam31VertexServingQualificationCandidate
  >
  sourceRelease: ReturnType<
    typeof assertCanonicalSam31QualifiedSourceCheckpointRelease
  >
  image: CanonicalSam31CloudImageSupplyChainRelease
  a100Rate: CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2
  l4Rate: CanonicalCurrentGoogleCloudGpuRateAuthority
  chunk: PreparedChunk
  request: z.infer<typeof requestSchema>
  refs: ReturnType<typeof buildChunkRefs>
  preparedAt: string
  expiresAt: string
}) {
  const payload = admissionWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_COMPLETE_SOURCE_CHUNK_QUALIFICATION_ADMISSION_VERSION,
    source: 'canonical_server_sam3_1_vertex_serving_qualification_owner',
    evidenceClass: 'canonical_private_exact_chunk_reread',
    admissionId: input.refs.admissionId,
    parentQualificationAdmissionRef:
      input.request.parentQualificationAdmissionRef,
    qualificationId: input.parent.qualificationId,
    runOrdinal: input.parent.runOrdinal,
    chunkOrdinal: input.chunk.chunkOrdinal,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    routeId: 'a100_80gb_heavy_primary',
    executionTarget:
      'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
    qualificationCandidateRef: input.request.qualificationCandidateRef,
    sourceCheckpointQualificationRef:
      input.request.sourceCheckpointQualificationRef,
    imageSupplyChainReleaseRef: input.parent.imageSupplyChainReleaseRef,
    immutableImageRef: input.image.immutableImageRef,
    immutableImageDigest: input.image.immutableImageDigest,
    currentA100RateAuthorityRef:
      input.request.currentA100ServingRateAuthorityRef,
    currentL4FallbackRateAuthorityRef:
      input.request.currentL4FallbackRateAuthorityRef,
    qualificationSourcePlanRef: input.parent.qualificationSourcePlanRef,
    sourcePreparationRef: input.parent.sourcePreparationRef,
    exactEightMinuteSourceRef: input.parent.exactEightMinuteSourceRef,
    preparedChunkArtifactRef: input.chunk.preparedChunkArtifactRef,
    exactSourceRangeMappingRef: input.chunk.exactSourceRangeMappingRef,
    ffprobeEvidenceRef: input.chunk.ffprobeEvidenceRef,
    gpuPreparationEvidenceRef: input.chunk.gpuPreparationEvidenceRef,
    canonicalStartFrameInclusive: input.chunk.canonicalStartFrameInclusive,
    canonicalEndFrameInclusive: input.chunk.canonicalEndFrameInclusive,
    decodedFrameCount: input.chunk.decodedFrameCount,
    exactParentAdmissionCandidateCheckpointImageRatesPlanPreparationAndChunkReread:
      true,
    oneChunkCreateOnlyConsumptionRequired: true,
    privateCompleteSourceQualificationOnly: true,
    finalRuntimeReleaseRequiredBeforeThisQualificationChunk: false,
    finalRuntimeReleaseMayConsumeThisAdmission: false,
    userTriggeredScaleFromZero: true,
    minimumIdleInstances: 0,
    automaticRetryOrFallbackAllowed: false,
    substantiveCpuExecutionAllowed: false,
    sourceResolutionReductionAllowed: false,
    maximumCustomerToolCostCredits: 0,
    customerCreditsMutated: false,
    qaApproved: false,
    runtimeReleaseGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    admittedAt: input.preparedAt,
    expiresAt: input.expiresAt,
  })
  return canonicalSam31VertexCompleteSourceChunkQualificationAdmissionSchema
    .parse({ ...payload, admissionHash: sha256AuthorityValue(payload) })
}

function buildChunkRefs(input: {
  baseRefs: ReturnType<typeof createCanonicalSam31A100QualificationRefs>
  parent: ReturnType<
    typeof assertCanonicalSam31PrivateCompleteSourceQualificationAdmission
  >
  plan: CanonicalSam31EightMinuteQualificationSourcePlan
  preparation: CanonicalSam31EightMinuteQualificationSourcePreparation
  chunk: PreparedChunk
}) {
  const suffix = `run-${String(input.parent.runOrdinal).padStart(2, '0')}`
    + `.chunk-${String(input.chunk.chunkOrdinal).padStart(3, '0')}`
  const named = (name: string) => opaqueRef(
    `sam31-complete-source-${name}:${suffix}`,
    {
      parentAdmissionRef:
        canonicalSam31PrivateCompleteSourceQualificationAdmissionRef(
          input.parent,
        ),
      chunkOrdinal: input.chunk.chunkOrdinal,
      preparedChunkArtifactRef: input.chunk.preparedChunkArtifactRef,
      name,
    },
  )
  const source = sourceRefs(input)
  return Object.freeze({
    ...input.baseRefs,
    editSessionId: `sam31-complete-source-session-${suffix}`,
    outputId: 'sam31-complete-source-output',
    sceneId: `sam31-complete-source-chunk-${String(
      input.chunk.chunkOrdinal,
    ).padStart(3, '0')}`,
    idempotencyKey: `sam31-complete-source-${suffix}`,
    deterministicProbeFixtureRef: input.chunk.preparedChunkArtifactRef,
    finalizedSourceArtifactRef: input.plan.exactEightMinuteSourceRef,
    sourceBindingRef: source.sourceBindingRef,
    exactSourceReadEvidenceRef: input.chunk.gpuPreparationEvidenceRef,
    sourceFrameRangeMappingRef: input.chunk.exactSourceRangeMappingRef,
    proxyPixelGeometryQaRef: input.chunk.ffprobeEvidenceRef,
    ffprobeEvidenceRef: input.chunk.ffprobeEvidenceRef,
    boundedChunkOverlapAndStitchPlanRef: ref(
      input.plan.qualificationSourceId,
      input.plan.planHash,
    ),
    compiledIntentRef: named('compiled-person-subject-intent'),
    promptApprovalRef: named('fixed-person-prompt-approval'),
    taskContextRef: named('task-context'),
    approvedSnapshotRef: named('private-qualification-snapshot'),
    confirmedOutputFrameRef: named('source-frame-authority'),
    masterTimingRef: named('complete-source-master-timing'),
    approvedWorkItemRef: named('private-qualification-work-item'),
    workerLeaseRef: named('private-qualification-worker-lease'),
    fundedReservationRef: named('zero-customer-credit-reservation'),
    operatorTriggerRecordRef: named('operator-trigger'),
    executionAttemptRef: named('execution-attempt'),
    internalQualificationPlanRef: named('internal-qualification-plan'),
    approvedInternalCostEstimateRef: named('platform-cost-estimate'),
    internalCostBudgetRef: named('platform-cost-budget'),
    privateTaskInputTransportRef: named('private-input-transport'),
    privateTaskOutputTransportRef: named('private-output-transport'),
  })
}

function buildSourceMedia(input: {
  plan: CanonicalSam31EightMinuteQualificationSourcePlan
  chunk: PreparedChunk
  refs: ReturnType<typeof buildChunkRefs>
}) {
  return canonicalSam31GpuSourceMediaSchema.parse({
    mediaForm: 'private_read_only_mp4',
    finalizedSourceArtifactRef: input.plan.exactEightMinuteSourceRef,
    gpuPreparedMaskProxyArtifactRef: input.chunk.preparedChunkArtifactRef,
    exactSourceReadEvidenceRef: input.chunk.gpuPreparationEvidenceRef,
    ffprobeOrFrameDirectoryEvidenceRef: input.chunk.ffprobeEvidenceRef,
    sourceFrameRangeMappingRef: input.chunk.exactSourceRangeMappingRef,
    proxyPixelGeometryQaRef: input.chunk.ffprobeEvidenceRef,
    byteLength: input.chunk.byteLength,
    sha256: input.chunk.sha256,
    width: input.plan.sourceWidth,
    height: input.plan.sourceHeight,
    decodedFrameCount: input.chunk.decodedFrameCount,
    fpsNumerator: input.plan.fpsNumerator,
    fpsDenominator: input.plan.fpsDenominator,
    selectedStartFrameInclusive: 0,
    selectedEndFrameInclusive: input.chunk.decodedFrameCount - 1,
    canonicalSourceStartFrameInclusive:
      input.chunk.canonicalStartFrameInclusive,
    canonicalSourceEndFrameInclusive:
      input.chunk.canonicalEndFrameInclusive,
    boundedChunkOverlapAndStitchPlanRef:
      input.refs.boundedChunkOverlapAndStitchPlanRef,
    variableFrameRateAllowed: false,
    callerPathOrUrlAccepted: false,
  })
}

function sourceRefs(input: {
  plan: CanonicalSam31EightMinuteQualificationSourcePlan
  preparation: CanonicalSam31EightMinuteQualificationSourcePreparation
  chunk: PreparedChunk
}) {
  return {
    sourceBindingRef: opaqueRef(
      `sam31-complete-source-binding:chunk-${String(
        input.chunk.chunkOrdinal,
      ).padStart(3, '0')}`,
      {
        planRef: ref(input.plan.qualificationSourceId, input.plan.planHash),
        preparationRef: ref(input.preparation.preparationId,
          input.preparation.preparationHash),
        preparedChunkArtifactRef: input.chunk.preparedChunkArtifactRef,
        exactSourceRangeMappingRef: input.chunk.exactSourceRangeMappingRef,
      },
    ),
  }
}

function assertPrerequisites(input: {
  request: z.infer<typeof requestSchema>
  parent: ReturnType<
    typeof assertCanonicalSam31PrivateCompleteSourceQualificationAdmission
  >
  plan: CanonicalSam31EightMinuteQualificationSourcePlan
  preparation: CanonicalSam31EightMinuteQualificationSourcePreparation
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
  a100Rate: CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2
  l4Rate: CanonicalCurrentGoogleCloudGpuRateAuthority
  chunk: PreparedChunk
}) {
  const parentRef =
    canonicalSam31PrivateCompleteSourceQualificationAdmissionRef(input.parent)
  const exactCandidateRef = ref(input.candidate.candidateId,
    input.candidate.candidateHash)
  const blockers = [
    !sameRef(parentRef, input.request.parentQualificationAdmissionRef)
      ? 'parent_admission_changed' : null,
    input.parent.routeId !== 'a100_80gb_heavy_primary'
      || !input.parent.qualificationExecutionAuthorized
      || input.parent.runtimeReleaseGranted
      || input.parent.customerOrPublicDispatchAuthorized
      ? 'parent_admission_not_qualification_only' : null,
    !sameRef(ref(input.plan.qualificationSourceId, input.plan.planHash),
      input.parent.qualificationSourcePlanRef)
      ? 'source_plan_changed' : null,
    !sameRef(ref(input.preparation.preparationId,
      input.preparation.preparationHash), input.parent.sourcePreparationRef)
      ? 'source_preparation_changed' : null,
    input.preparation.disposition !== 'ready'
      || input.preparation.preparedChunkCount !== 49
      ? 'source_preparation_not_complete' : null,
    input.chunk.chunkOrdinal !== input.request.chunkOrdinal
      ? 'chunk_ordinal_changed' : null,
    !sameRef(exactCandidateRef, input.request.qualificationCandidateRef)
      || !input.candidate.readyForPrivateQualificationInvocation
      || input.candidate.readyForCustomerInvocation
      ? 'serving_candidate_changed' : null,
    !sameRef(input.sourceRelease.sourceCheckpointQualificationRef,
      input.request.sourceCheckpointQualificationRef)
      || !input.source.exactCanonicalReread
      || !input.source.sourceCheckpointQualificationGranted
      ? 'source_checkpoint_changed' : null,
    !sameRef(ref(input.image.releaseId, input.image.releaseHash,
      input.image.releaseVersion), input.parent.imageSupplyChainReleaseRef)
      || input.image.immutableImageDigest !==
        input.parent.immutableImageDigest
      || input.image.immutableImageDigest !== input.candidate.immutableImageDigest
      ? 'image_release_changed' : null,
    !sameRef(rateRef(input.a100Rate),
      input.request.currentA100ServingRateAuthorityRef)
      || !sameRef(input.parent.accountEffectiveRateAuthorityRef,
        input.request.currentA100ServingRateAuthorityRef)
      || input.a100Rate.routeId !== 'a100_80gb_heavy_primary'
      ? 'a100_rate_changed' : null,
    !sameRef(rateRef(input.l4Rate),
      input.request.currentL4FallbackRateAuthorityRef)
      || input.l4Rate.routeId !== 'l4_heavy_fallback'
      ? 'l4_rate_changed' : null,
  ].filter((value): value is string => value !== null)
  if (blockers.length > 0) throw new Error(
    `Complete-source qualification lineage changed: ${blockers.join(', ')}.`,
  )
}

function assertQualifiedImage(value: unknown) {
  const image = assertCanonicalSam31CloudImageSupplyChainRelease(value)
  if (image.status !== 'image_supply_chain_qualified'
    || !image.authority.imageSupplyChainQualified
    || image.authority.runtimeReleaseGranted
    || image.authority.gpuJobDispatched) {
    throw new Error('Complete-source qualification image is not eligible.')
  }
  return image
}

function rateRef(value: CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2
  | CanonicalCurrentGoogleCloudGpuRateAuthority): EvidenceRef {
  return ref(value.rateAuthorityId, value.rateAuthorityHash,
    value.rateAuthorityVersion)
}

function ref(id: string, hash: string, version = 1): EvidenceRef {
  return refSchema.parse({
    id,
    version,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}

function opaqueRef(id: string, basis: unknown): EvidenceRef {
  return ref(id, sha256AuthorityValue(basis))
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function earliest(...values: readonly string[]): string {
  return new Date(Math.min(...values.map((value) => Date.parse(value))))
    .toISOString()
}
