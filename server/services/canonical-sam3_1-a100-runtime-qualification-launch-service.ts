import { createHash } from 'node:crypto'
import type { Readable } from 'node:stream'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  assertCanonicalCurrentGoogleCloudVertexA100RateAuthority,
  type CanonicalCurrentGoogleCloudVertexA100RateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-rate-authority'
import {
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE,
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_METADATA,
  isCanonicalSam31OfficialProbeFixtureKmsKeyVersionName,
} from '../model-artifacts/canonical-sam3_1-official-probe-fixture'
import {
  assertCanonicalSam31CloudImageSupplyChainRelease,
  type CanonicalSam31CloudImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-cloud-image-supply-chain-release'
import {
  canonicalSam31SourceCheckpointQualificationReferenceSchema,
  assertCanonicalSam31QualifiedSourceCheckpointRelease,
  createCanonicalSam31QualifiedSourceCheckpointReleaseObjectReadPort,
  projectCanonicalSam31QualifiedSourceCheckpointRelease,
  type CanonicalSam31QualifiedSourceCheckpointRelease,
  type CanonicalSam31QualifiedSourceCheckpointReleaseReadPort,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualified-authority'
import {
  CANONICAL_A100_VERTEX_CUSTOM_JOB_LAUNCH_AUTHORITY_VERSION,
  CANONICAL_A100_VERTEX_CUSTOM_JOB_RELEASE_VERSION,
  assertCanonicalA100VertexCustomJobLaunchAuthority,
  assertCanonicalA100VertexCustomJobRelease,
  createCanonicalA100VertexCustomJobLaunchPort,
  type CanonicalA100VertexCustomJobLaunchResult,
} from './canonical-a100-vertex-custom-job-launch-port'
import {
  createCanonicalA100VertexCustomJobDurableStore,
} from './canonical-a100-vertex-custom-job-durable-store'
import {
  createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
  type CanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from './canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  createCanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository,
  type CanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository,
} from './canonical-current-google-cloud-vertex-a100-rate-authority-repository'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalProfessionalGpuDurableLifecycleStore,
  type CanonicalProfessionalGpuDurableLifecycleStore,
} from './canonical-professional-gpu-durable-lifecycle-store'
import {
  CANONICAL_PROFESSIONAL_GPU_EXECUTION_ENVELOPE_VERSION,
  CANONICAL_PROFESSIONAL_GPU_JOB_LAUNCH_VERSION,
  assertCanonicalProfessionalGpuAdmissionConsumption,
  assertCanonicalProfessionalGpuExecutionEnvelope,
  assertCanonicalProfessionalGpuJobLaunch,
  canonicalProfessionalGpuExecutionEnvelopeSchema,
  canonicalProfessionalGpuJobLaunchSchema,
  type CanonicalProfessionalGpuAdmissionConsumption,
  type CanonicalProfessionalGpuExecutionEnvelope,
  type CanonicalProfessionalGpuJobLaunch,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  createCanonicalSam31ImageSupplyChainReleaseRepository,
  type CanonicalSam31ImageSupplyChainReleaseRepository,
} from './canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  createCanonicalSam31VertexQualificationQuotaReadPort,
  type CanonicalSam31VertexQualificationQuotaReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-runtime'
import {
  assertCanonicalSam31VertexQualificationQuotaObservation,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-launch-port'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  buildCanonicalSam31GpuRuntimeRequest,
  canonicalSam31GpuApprovedPromptSchema,
  canonicalSam31GpuSourceMediaSchema,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  createCanonicalSam31GcsPrivateBinaryObjectPort,
  createCanonicalSam31GpuPrivateInputStagingPort,
  type CanonicalSam31GpuPreparedMaskProxyReadPort,
  type CanonicalSam31GpuPrivateInputStagingPort,
} from '../workers/masks/canonical-sam3_1-gpu-private-input-staging-service'
import {
  CANONICAL_SAM3_1_GPU_TASK_RECORD_VERSION,
  assertCanonicalSam31GpuTaskRecord,
  canonicalSam31GpuFixedTaskContractRef,
  canonicalSam31GpuTaskRecordSchema,
  createCanonicalSam31GpuTaskStoreFromObjectPort,
  type CanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_SAM3_1_A100_RUNTIME_QUALIFICATION_ADMISSION_VERSION =
  'canonical-sam3_1-a100-runtime-qualification-admission-v1' as const
export const CANONICAL_SAM3_1_A100_RUNTIME_QUALIFICATION_LAUNCH_VERSION =
  'canonical-sam3_1-a100-runtime-qualification-launch-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const PRIVATE_GPU_BUCKET = 'reeditpro-production-reeditpro-masks' as const
const WORKER_SERVICE_ACCOUNT =
  'reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com' as const
const NETWORK_RESOURCE =
  'projects/390722338345/global/networks/weeditpro-gpu-private' as const
const ENCRYPTION_KEY_RESOURCE =
  'projects/reeditpro/locations/us-central1/keyRings/'
  + 'weeditpro-private-artifacts/cryptoKeys/sam31-qualification'
const TASK_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/invocations'
const ADMISSION_PREFIX =
  'private/sam3_1/gpu-runtime-qualification/v2/launch-admissions'
const MAXIMUM_EXECUTION_SECONDS = 7_200 as const
const SOURCE_ARCHIVE_BYTE_LENGTH = 73_605_120 as const
const SOURCE_ARCHIVE_SHA256 =
  '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a'
const GPU_DECODE_PATCH_SHA256 =
  'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca'

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const timestamp = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const versionOneEvidenceRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
}).strict()

const admissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_A100_RUNTIME_QUALIFICATION_ADMISSION_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_a100_runtime_qualification_launch_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  admissionId: safeId,
  qualificationId: safeId,
  runOrdinal: positiveInteger.max(30),
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  routeId: z.literal('a100_80gb_heavy_primary'),
  sourceCheckpointQualificationRef:
    canonicalSam31SourceCheckpointQualificationReferenceSchema,
  imageSupplyChainReleaseRef: versionOneEvidenceRefSchema,
  immutableImageRef: evidenceRefSchema,
  immutableImageDigest: prefixedSha256,
  currentA100RateAuthorityRef: evidenceRefSchema,
  currentL4FallbackRateAuthorityRef: evidenceRefSchema,
  quotaObservationRef: evidenceRefSchema,
  deterministicProbeFixtureRef: evidenceRefSchema,
  internalQualificationPlanRef: evidenceRefSchema,
  approvedInternalCostEstimateRef: evidenceRefSchema,
  internalCostBudgetRef: evidenceRefSchema,
  maximumEstimatedInternalInfrastructureCostUsdNanos: nonnegativeInteger,
  maximumReservedCustomerToolCostCredits: z.literal(0),
  operatorTriggerRecordRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  idempotencyKey: safeId,
  exactSourceCheckpointImageQuotaAndAccountRatesReread: z.literal(true),
  accountEffectiveA100AndL4RatesBoundBeforeDispatch: z.literal(true),
  actualAttemptCostRequiresTerminalProviderUsageAndRateReread:
    z.literal(true),
  privatePreReleaseQualificationOnly: z.literal(true),
  runtimeAlreadyQualifiedClaimed: z.literal(false),
  userTriggeredScaleFromZero: z.literal(true),
  minimumIdleInstances: z.literal(0),
  automaticRetryOrFallbackAllowed: z.literal(false),
  callerPriceImageModelCommandPathUrlOrCredentialsAccepted:
    z.literal(false),
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
    || value.immutableImageRef.contentHash !== value.immutableImageDigest
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 qualification admission lost time or image lineage.',
  })
})

export const canonicalSam31A100RuntimeQualificationAdmissionSchema =
  admissionWithoutHashSchema.extend({ admissionHash: sha256 }).strict()
export type CanonicalSam31A100RuntimeQualificationAdmission = z.infer<
  typeof canonicalSam31A100RuntimeQualificationAdmissionSchema
>

const launchResultSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_A100_RUNTIME_QUALIFICATION_LAUNCH_VERSION,
  ),
  status: z.enum([
    'job_created',
    'job_rejected_before_creation',
    'job_creation_outcome_unknown',
  ]),
  admissionRef: evidenceRefSchema,
  executionEnvelopeRef: evidenceRefSchema,
  taskRef: evidenceRefSchema,
  launchRef: evidenceRefSchema,
  cloudJobExecutionRef: evidenceRefSchema.nullable(),
  sourceCheckpointQualificationRef:
    canonicalSam31SourceCheckpointQualificationReferenceSchema,
  imageSupplyChainReleaseRef: evidenceRefSchema,
  currentA100RateAuthorityRef: evidenceRefSchema,
  currentL4FallbackRateAuthorityRef: evidenceRefSchema,
  providerCallStarted: z.boolean(),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
export type CanonicalSam31A100RuntimeQualificationLaunchResult = z.infer<
  typeof launchResultSchema
>

export interface CanonicalSam31A100RuntimeQualificationAdmissionRepository {
  persistCreateOnlyAndReread(
    admission: CanonicalSam31A100RuntimeQualificationAdmission,
  ): Promise<'created' | 'already_exists'>
}

export interface CanonicalSam31A100RuntimeQualificationLaunchService {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_A100_RUNTIME_QUALIFICATION_LAUNCH_VERSION
  readonly evidenceClass:
    'private_pre_release_a100_one_shot_exact_prerequisite_reread'
  start(input: unknown): Promise<
    CanonicalSam31A100RuntimeQualificationLaunchResult
  >
}

type VertexLaunchPort = ReturnType<
  typeof createCanonicalA100VertexCustomJobLaunchPort
>

export function createCanonicalSam31A100RuntimeQualificationLaunchService(
  input: {
    readonly sourceCheckpointReadPort:
      CanonicalSam31QualifiedSourceCheckpointReleaseReadPort
    readonly imageSupplyChainReadPort: Pick<
      CanonicalSam31ImageSupplyChainReleaseRepository,
      'rereadQualifiedRelease'
    >
    readonly vertexRateReadPort: Pick<
      CanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository,
      'reread'
    >
    readonly gpuRateReadPort: Pick<
      CanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
      'rereadApprovedCurrentRate'
    >
    readonly quotaReadPort: CanonicalSam31VertexQualificationQuotaReadPort
    readonly admissionRepository:
      CanonicalSam31A100RuntimeQualificationAdmissionRepository
    readonly lifecycleStore: CanonicalProfessionalGpuDurableLifecycleStore
    readonly privateInputStagingPort:
      CanonicalSam31GpuPrivateInputStagingPort
    readonly taskStore: CanonicalSam31GpuTaskStore
    readonly vertexLaunchPort: VertexLaunchPort
    readonly now?: () => string
  },
): CanonicalSam31A100RuntimeQualificationLaunchService {
  assertDependencies(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_A100_RUNTIME_QUALIFICATION_LAUNCH_VERSION,
    evidenceClass:
      'private_pre_release_a100_one_shot_exact_prerequisite_reread' as const,
    async start(untrusted: unknown) {
      const request = startRequestSchema.parse(untrusted)
      const rereadStartedAt = timestamp.parse(now())
      const [sourceRaw, imageRaw, a100RateRaw, l4RateRaw, quotaRaw] =
        await Promise.all([
          input.sourceCheckpointReadPort.rereadQualificationRelease({
            sourceCheckpointQualificationRef:
              request.sourceCheckpointQualificationRef,
          }),
          input.imageSupplyChainReadPort.rereadQualifiedRelease({
            releaseRef: request.imageSupplyChainReleaseRef,
          }),
          input.vertexRateReadPort.reread({
            rateAuthorityRef: request.currentA100RateAuthorityRef,
            at: rereadStartedAt,
          }),
          input.gpuRateReadPort.rereadApprovedCurrentRate({
            rateAuthorityRef: request.currentL4FallbackRateAuthorityRef,
            routeId: 'l4_heavy_fallback',
            at: rereadStartedAt,
          }),
          input.quotaReadPort.rereadCurrent(),
        ])
      if (!sourceRaw || !imageRaw || !a100RateRaw || !l4RateRaw) {
        throw conflict('current_prerequisite_missing')
      }
      const admittedAt = timestamp.parse(now())
      const sourceRelease =
        assertCanonicalSam31QualifiedSourceCheckpointRelease(sourceRaw)
      const source = projectCanonicalSam31QualifiedSourceCheckpointRelease(
        sourceRelease,
      )
      const image = assertQualifiedImage(imageRaw)
      const a100Rate =
        assertCanonicalCurrentGoogleCloudVertexA100RateAuthority(
          a100RateRaw,
          admittedAt,
        )
      const l4Rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
        l4RateRaw,
        admittedAt,
      )
      const quota = assertCanonicalSam31VertexQualificationQuotaObservation(
        quotaRaw,
        admittedAt,
      )
      assertPrerequisites({ request, sourceRelease, source, image, a100Rate,
        l4Rate, quota })

      const identifiers = buildIdentifiers(request)
      const refs = buildQualificationRefs({ request, identifiers })
      const release = buildVertexRelease({
        request,
        source,
        image,
        a100Rate,
        quota,
        refs,
        admittedAt,
      })
      const admission = buildAdmission({
        request,
        image,
        a100Rate,
        l4Rate,
        quota,
        refs,
        admittedAt,
        expiresAt: release.expiresAt,
      })
      if (await input.admissionRepository.persistCreateOnlyAndReread(
        admission,
      ) !== 'created') {
        throw conflict('qualification_admission_already_exists')
      }
      const admissionRef = ref(admission.admissionId, admission.admissionHash)
      const consumption = buildLifecycleConsumption({
        admission,
        release,
        refs,
        consumedAt: admittedAt,
      })
      if (await input.lifecycleStore.consumeAdmissionCreateOnly({
        record: consumption,
      }) !== 'created') throw conflict('admission_already_consumed')
      const consumptionRef = ref(
        admission.admissionId,
        consumption.consumptionHash,
      )
      const envelope = buildExecutionEnvelope({
        admission,
        release,
        refs,
        consumptionRef,
      })
      if (await input.lifecycleStore.createExecutionEnvelopeOnly({
        record: envelope,
      }) !== 'created') throw conflict('execution_envelope_already_exists')
      const rereadEnvelope = assertCanonicalProfessionalGpuExecutionEnvelope(
        await input.lifecycleStore.rereadExecutionEnvelope({
          envelopeId: envelope.envelopeId,
        }),
      )
      if (rereadEnvelope.envelopeHash !== envelope.envelopeHash) {
        throw conflict('execution_envelope_reread_mismatch')
      }
      const envelopeRef = ref(envelope.envelopeId, envelope.envelopeHash)
      const sourceMedia = buildProbeSourceMedia(refs)
      const stagingEvidence = await input.privateInputStagingPort
        .stageAndRereadExactMaskProxy({
          invocationId: envelope.envelopeId,
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
      const task = buildQualificationTask({
        admission,
        release,
        source,
        image,
        refs,
        consumptionRef,
        envelopeRef,
        sourceMedia,
        stagingEvidence,
        preparedAt: admittedAt,
      })
      if (await input.taskStore.persistTaskCreateOnly(task) !== 'created') {
        throw conflict('qualification_task_already_exists')
      }
      const rereadTask = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(task.invocationId),
      )
      if (rereadTask.taskRecordHash !== task.taskRecordHash) {
        throw conflict('qualification_task_reread_mismatch')
      }
      const authority = buildVertexAuthority({
        admission,
        release,
        refs,
        envelopeRef,
      })
      const raw = await input.vertexLaunchPort.startOneShotJob({
        authority,
        release,
      })
      const launch = buildLifecycleLaunch({
        admission,
        release,
        consumptionRef,
        envelopeRef,
        raw,
        launchRecordId: identifiers.launchRecordId,
      })
      if (await input.lifecycleStore.createLaunchRecordOnly({ record: launch })
        !== 'created') {
        throw conflict('launch_record_already_exists_reconciliation_required')
      }
      return launchResultSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_A100_RUNTIME_QUALIFICATION_LAUNCH_VERSION,
        status: launch.launchDisposition,
        admissionRef,
        executionEnvelopeRef: envelopeRef,
        taskRef: ref(task.taskId, task.taskRecordHash),
        launchRef: ref(launch.launchRecordId, launch.launchHash),
        cloudJobExecutionRef: launch.cloudJobExecutionRef,
        sourceCheckpointQualificationRef:
          request.sourceCheckpointQualificationRef,
        imageSupplyChainReleaseRef: request.imageSupplyChainReleaseRef,
        currentA100RateAuthorityRef: request.currentA100RateAuthorityRef,
        currentL4FallbackRateAuthorityRef:
          request.currentL4FallbackRateAuthorityRef,
        providerCallStarted: raw.providerCallStarted,
        customerCreditsMutated: false,
        qaApproved: false,
        runtimeReleaseGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
      })
    },
  })
}

const startRequestSchema = z.object({
  qualificationId: safeId,
  runOrdinal: positiveInteger.max(30),
  sourceCheckpointQualificationRef:
    canonicalSam31SourceCheckpointQualificationReferenceSchema,
  imageSupplyChainReleaseRef: versionOneEvidenceRefSchema,
  currentA100RateAuthorityRef: evidenceRefSchema,
  currentL4FallbackRateAuthorityRef: evidenceRefSchema,
}).strict()
type StartRequest = z.infer<typeof startRequestSchema>

export function createCanonicalSam31A100RuntimeQualificationAdmissionRepository(
  input: { readonly objectPort: CanonicalCreateOnlyJsonObjectPort },
): CanonicalSam31A100RuntimeQualificationAdmissionRepository {
  return Object.freeze({
    async persistCreateOnlyAndReread(
      untrusted: CanonicalSam31A100RuntimeQualificationAdmission,
    ) {
      const admission = assertAdmission(untrusted)
      const body = Buffer.from(stableAuthorityStringify(admission), 'utf8')
      const objectPath = `${ADMISSION_PREFIX}/${admission.admissionHash}.json`
      const disposition = await input.objectPort.createOnly({
        objectPath,
        body,
        contentSha256: hashBytes(body),
      })
      const reread = input.objectPort.readExact
        ? await input.objectPort.readExact(objectPath)
        : null
      if (!reread || stableAuthorityStringify(assertAdmission(
        JSON.parse(reread.toString('utf8')),
      )) !== stableAuthorityStringify(admission)) {
        throw conflict('qualification_admission_reread_mismatch')
      }
      return disposition
    },
  })
}

export function createCanonicalSam31GcsOfficialProbeMaskProxyReadPort(
  input: { readonly storage?: Storage } = {},
): CanonicalSam31GpuPreparedMaskProxyReadPort {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const fixture = CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE
  return Object.freeze({
    async rereadExactApprovedMaskProxy(
      request: Parameters<
        CanonicalSam31GpuPreparedMaskProxyReadPort[
          'rereadExactApprovedMaskProxy'
        ]
      >[0],
    ) {
      const refs = buildProbeRefs()
      if (
        !sameRef(request.sourceBindingRef, refs.sourceBindingRef)
        || !sameRef(request.finalizedSourceArtifactRef,
          refs.finalizedSourceArtifactRef)
        || !sameRef(request.gpuPreparedMaskProxyArtifactRef,
          refs.deterministicProbeFixtureRef)
        || !sameRef(request.exactSourceReadEvidenceRef,
          refs.exactSourceReadEvidenceRef)
        || !sameRef(request.sourceFrameRangeMappingRef,
          refs.sourceFrameRangeMappingRef)
        || !sameRef(request.proxyPixelGeometryQaRef,
          refs.proxyPixelGeometryQaRef)
        || request.expectedByteLength !== fixture.byteLength
        || request.expectedSha256 !== fixture.sha256
      ) throw conflict('official_probe_read_scope_mismatch')
      const file = storage.bucket(fixture.bucketName).file(fixture.objectName)
      const [metadata] = await file.getMetadata()
      const generation = String(metadata.generation ?? '')
      const custom = metadata.metadata as Record<string, unknown> | undefined
      if (
        !/^[1-9][0-9]{0,30}$/u.test(generation)
        || Number(metadata.size ?? -1) !== fixture.byteLength
        || metadata.contentType !== fixture.mediaType
        || !isCanonicalSam31OfficialProbeFixtureKmsKeyVersionName(
          metadata.kmsKeyName,
        )
        || Object.entries(CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_METADATA)
          .some(([key, value]) => custom?.[key] !== value)
      ) throw conflict('official_probe_gcs_metadata_mismatch')
      const exact = storage.bucket(fixture.bucketName).file(
        fixture.objectName,
        { generation },
      )
      return Object.freeze({
        contentType: 'video/mp4' as const,
        byteLength: fixture.byteLength,
        sha256: fixture.sha256,
        width: fixture.width,
        height: fixture.height,
        decodedFrameCount: fixture.sourceFrameCount,
        selectedStartFrameInclusive: 0,
        selectedEndFrameInclusive: fixture.sourceFrameCount - 1,
        sourceBindingRef: refs.sourceBindingRef,
        finalizedSourceArtifactRef: refs.finalizedSourceArtifactRef,
        gpuPreparedMaskProxyArtifactRef:
          refs.deterministicProbeFixtureRef,
        exactSourceReadEvidenceRef: refs.exactSourceReadEvidenceRef,
        sourceFrameRangeMappingRef: refs.sourceFrameRangeMappingRef,
        proxyPixelGeometryQaRef: refs.proxyPixelGeometryQaRef,
        exactApprovedSnapshotWorkLeaseAndSourceReread: true as const,
        sourcePathUrlBucketObjectGenerationOrBytesExposed: false as const,
        async openStream(): Promise<Readable> {
          return exact.createReadStream({
            decompress: false,
            validation: 'crc32c',
          })
        },
      })
    },
  })
}

export function createCanonicalSam31GcpA100RuntimeQualificationLaunchService(
  input: { readonly storage?: Storage; readonly now?: () => string } = {},
): CanonicalSam31A100RuntimeQualificationLaunchService {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const control = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_PLANE_BUCKET,
  })
  const privateGpu = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: PRIVATE_GPU_BUCKET,
  })
  const vertexStore = createCanonicalA100VertexCustomJobDurableStore({
    objectPort: control,
  })
  return createCanonicalSam31A100RuntimeQualificationLaunchService({
    sourceCheckpointReadPort:
      createCanonicalSam31QualifiedSourceCheckpointReleaseObjectReadPort({
        objectPort: control,
      }),
    imageSupplyChainReadPort:
      createCanonicalSam31ImageSupplyChainReleaseRepository({
        objectPort: control,
      }),
    vertexRateReadPort:
      createCanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository({
        objectPort: control,
      }),
    gpuRateReadPort:
      createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository({
        objectPort: control,
      }),
    quotaReadPort: createCanonicalSam31VertexQualificationQuotaReadPort({
      now: input.now,
    }),
    admissionRepository:
      createCanonicalSam31A100RuntimeQualificationAdmissionRepository({
        objectPort: control,
      }),
    lifecycleStore: createCanonicalProfessionalGpuDurableLifecycleStore({
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
    vertexLaunchPort: createCanonicalA100VertexCustomJobLaunchPort({
      launchContextRepository: vertexStore,
      consumptionPort: vertexStore,
      executionRepository: vertexStore,
      now: input.now,
    }),
    now: input.now,
  })
}

function buildAdmission(input: {
  request: StartRequest
  image: CanonicalSam31CloudImageSupplyChainRelease
  a100Rate: CanonicalCurrentGoogleCloudVertexA100RateAuthority
  l4Rate: CanonicalCurrentGoogleCloudGpuRateAuthority
  quota: ReturnType<typeof assertCanonicalSam31VertexQualificationQuotaObservation>
  refs: ReturnType<typeof buildQualificationRefs>
  admittedAt: string
  expiresAt: string
}): CanonicalSam31A100RuntimeQualificationAdmission {
  const estimate = maximumInternalCostUsdNanos(input.a100Rate)
  const payload = admissionWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_A100_RUNTIME_QUALIFICATION_ADMISSION_VERSION,
    source:
      'canonical_server_sam3_1_a100_runtime_qualification_launch_owner',
    evidenceClass: 'canonical_private_reread',
    admissionId: input.refs.admissionId,
    qualificationId: input.request.qualificationId,
    runOrdinal: input.request.runOrdinal,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    routeId: 'a100_80gb_heavy_primary',
    sourceCheckpointQualificationRef:
      input.request.sourceCheckpointQualificationRef,
    imageSupplyChainReleaseRef: input.request.imageSupplyChainReleaseRef,
    immutableImageRef: input.image.immutableImageRef,
    immutableImageDigest: input.image.immutableImageDigest,
    currentA100RateAuthorityRef: rateRef(input.a100Rate),
    currentL4FallbackRateAuthorityRef: rateRef(input.l4Rate),
    quotaObservationRef: ref(
      input.quota.quotaPreferenceId,
      input.quota.observationHash,
    ),
    deterministicProbeFixtureRef: input.refs.deterministicProbeFixtureRef,
    internalQualificationPlanRef: input.refs.internalQualificationPlanRef,
    approvedInternalCostEstimateRef:
      input.refs.approvedInternalCostEstimateRef,
    internalCostBudgetRef: input.refs.internalCostBudgetRef,
    maximumEstimatedInternalInfrastructureCostUsdNanos: estimate,
    maximumReservedCustomerToolCostCredits: 0,
    operatorTriggerRecordRef: input.refs.operatorTriggerRecordRef,
    executionAttemptRef: input.refs.executionAttemptRef,
    idempotencyKey: input.refs.idempotencyKey,
    exactSourceCheckpointImageQuotaAndAccountRatesReread: true,
    accountEffectiveA100AndL4RatesBoundBeforeDispatch: true,
    actualAttemptCostRequiresTerminalProviderUsageAndRateReread: true,
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
  return canonicalSam31A100RuntimeQualificationAdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

function buildLifecycleConsumption(input: {
  admission: Pick<CanonicalSam31A100RuntimeQualificationAdmission,
    'admissionId' | 'admissionHash'>
  release: Readonly<{ releaseRef: z.infer<typeof evidenceRefSchema> }>
  refs: ReturnType<typeof buildQualificationRefs>
  consumedAt: string
}): CanonicalProfessionalGpuAdmissionConsumption {
  const payload = {
    schemaVersion: 'canonical-professional-gpu-admission-consumption-v1',
    source: 'canonical_professional_gpu_job_lifecycle_owner',
    admissionRef: ref(input.admission.admissionId,
      input.admission.admissionHash),
    admissionHash: input.admission.admissionHash,
    runtimeReleaseRef: input.release.releaseRef,
    executionAttemptRef: input.refs.executionAttemptRef,
    approvedWorkItemRef: input.refs.approvedWorkItemRef,
    fundedReservationRef: input.refs.fundedReservationRef,
    userTriggerRecordRef: input.refs.operatorTriggerRecordRef,
    idempotencyKey: input.refs.idempotencyKey,
    toolId: 'sam3_1',
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    routeId: 'a100_80gb_heavy_primary',
    consumedBeforeCloudJobCreation: true,
    oneAdmissionMayCreateAtMostOneCloudJob: true,
    retryAfterUnknownOutcomeAllowed: false,
    customerCreditsMutated: false,
    consumedAt: input.consumedAt,
  } as const
  return assertCanonicalProfessionalGpuAdmissionConsumption({
    ...payload,
    consumptionHash: sha256AuthorityValue(payload),
  })
}

function buildExecutionEnvelope(input: {
  admission: Pick<CanonicalSam31A100RuntimeQualificationAdmission,
    'admissionId' | 'admissionHash'>
  release: Readonly<{
    releaseRef: z.infer<typeof evidenceRefSchema>
    immutableImageDigest: string
  }>
  refs: ReturnType<typeof buildQualificationRefs>
  consumptionRef: z.infer<typeof evidenceRefSchema>
}): CanonicalProfessionalGpuExecutionEnvelope {
  const payload = {
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_EXECUTION_ENVELOPE_VERSION,
    source: 'canonical_professional_gpu_job_lifecycle_owner',
    envelopeId: input.refs.invocationId,
    admissionRef: ref(input.admission.admissionId,
      input.admission.admissionHash),
    admissionConsumptionRef: input.consumptionRef,
    runtimeReleaseRef: input.release.releaseRef,
    approvedSnapshotRef: input.refs.approvedSnapshotRef,
    confirmedOutputFrameRef: input.refs.confirmedOutputFrameRef,
    masterTimingRef: input.refs.masterTimingRef,
    approvedWorkItemRef: input.refs.approvedWorkItemRef,
    workerLeaseRef: input.refs.workerLeaseRef,
    fundedReservationRef: input.refs.fundedReservationRef,
    userTriggerRecordRef: input.refs.operatorTriggerRecordRef,
    executionAttemptRef: input.refs.executionAttemptRef,
    fixedServerTaskContractRef: canonicalSam31GpuFixedTaskContractRef(),
    toolId: 'sam3_1',
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    routeId: 'a100_80gb_heavy_primary',
    immutableImageDigest: input.release.immutableImageDigest,
    byteFreeEnvelope: true,
    privateWorkerRereadsEnvelopeByExactRef: true,
    callerCodeCommandImageModelPathUrlOrEnvironmentIncluded: false,
    rawChatMediaBytesCredentialsOrSecretsIncluded: false,
    runtimeDownloadAllowed: false,
    cpuOnlySubstantiveExecutionAllowed: false,
    createdBeforeCloudJob: true,
    createOnlyAndExactRereadRequired: true,
  } as const
  return canonicalProfessionalGpuExecutionEnvelopeSchema.parse({
    ...payload,
    envelopeHash: sha256AuthorityValue(payload),
  })
}

function buildQualificationTask(input: {
  admission: Pick<CanonicalSam31A100RuntimeQualificationAdmission,
    'admissionId' | 'admissionHash' | 'sourceCheckpointQualificationRef'
    | 'currentA100RateAuthorityRef' | 'currentL4FallbackRateAuthorityRef'>
  release: Readonly<{ releaseRef: z.infer<typeof evidenceRefSchema> }>
  source: ReturnType<typeof projectCanonicalSam31QualifiedSourceCheckpointRelease>
  image: CanonicalSam31CloudImageSupplyChainRelease
  refs: ReturnType<typeof buildQualificationRefs>
  consumptionRef: z.infer<typeof evidenceRefSchema>
  envelopeRef: z.infer<typeof evidenceRefSchema>
  sourceMedia: ReturnType<typeof buildProbeSourceMedia>
  stagingEvidence: unknown
  preparedAt: string
}): CanonicalSam31GpuTaskRecord {
  const runtimeRequest = buildCanonicalSam31GpuRuntimeRequest({
    schemaVersion: 'canonical-sam3_1-gpu-runtime-request-v1',
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    dispatchAdmissionRef: ref(input.admission.admissionId,
      input.admission.admissionHash),
    dispatchAdmissionDigestSha256: input.admission.admissionHash,
    scope: {
      ownerUserId: input.refs.ownerUserId,
      workspaceId: input.refs.workspaceId,
      projectId: input.refs.projectId,
      editSessionId: input.refs.editSessionId,
      editPlanId: input.refs.editPlanId,
      editPlanVersionId: input.refs.editPlanVersionId,
      approvedPlanSnapshotId: input.refs.approvedSnapshotRef.id,
      approvedPlanSnapshotHash:
        input.refs.approvedSnapshotRef.contentHash.slice(7),
      outputId: input.refs.outputId,
      sceneId: input.refs.sceneId,
      approvedWorkItemRef: input.refs.approvedWorkItemRef,
      workerLeaseRef: input.refs.workerLeaseRef,
      executionAttemptRef: input.refs.executionAttemptRef,
      fundedCreditReservationRef: input.refs.fundedReservationRef,
      masterTimingRef: input.refs.masterTimingRef,
      sourceBindingRef: input.refs.sourceBindingRef,
    },
    dispatch: {
      routeRole: 'a100_80gb_heavy_primary',
      gpuProfileId: 'quality_a100_80gb_user_triggered_heavy_job_v1',
      accelerator: 'nvidia_a100_80gb',
      attemptOrdinal: 1,
      priorAttemptDisposition: 'not_applicable_primary',
      priorAttemptDispositionRef: null,
      currentPrimaryAndFallbackRateAuthoritiesReread: true,
      exactPerToolEstimateApproved: true,
      userTriggeredAfterApproval: true,
      scaleFromZeroRequired: true,
      scaleBackToZeroAfterTerminalAttemptRequired: true,
      unknownPriorOutcomeMayRetryOrFallback: false,
      cpuOnlyInferenceAllowed: false,
    },
    sourceMedia: input.sourceMedia,
    approvedPrompt: canonicalSam31GpuApprovedPromptSchema.parse({
      promptType: 'server_compiled_text_subject',
      approvedSubjectText:
        CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.fixedTextPrompt,
      promptFrameIndex: 0,
      compiledIntentRef: input.refs.compiledIntentRef,
      promptApprovalRef: input.refs.promptApprovalRef,
      sourceFrameLineageRef: input.refs.sourceFrameRangeMappingRef,
      rawUserChatIncluded: false,
      executableTextIncluded: false,
    }),
    modelArtifacts: {
      sourceCandidateRef: input.source.qualification.candidateRef,
      privateArtifactIngestReceiptRef:
        stripSchemaVersion(input.source.qualification.ingestReceiptRef),
      sourceArchiveRef: input.source.sourceArchive.artifactRef,
      sourceRevision: input.source.sourceArchive.revision,
      sourceArchiveByteLength: SOURCE_ARCHIVE_BYTE_LENGTH,
      sourceArchiveSha256: SOURCE_ARCHIVE_SHA256,
      reeditproGpuDecodePatchSha256: GPU_DECODE_PATCH_SHA256,
      checkpointRef: input.source.checkpoint.artifactRef,
      checkpointRepositoryRevision:
        input.source.checkpoint.repositoryRevision,
      checkpointFileName: input.source.checkpoint.fileName,
      checkpointByteLength: input.source.checkpoint.byteLength,
      checkpointSha256: input.source.checkpoint.sha256,
      sourceCheckpointCompatibilityQualificationRef:
        input.admission.sourceCheckpointQualificationRef,
      immutableImageReleaseRef: input.image.immutableImageRef,
      immutableImageDigest: input.image.immutableImageDigest,
      humanTermsAcceptanceAndLegalReviewReread: true,
      sourceAndCheckpointMalwareScanReread: true,
      runtimeDownloadAllowed: false,
    },
    settings: {
      builder: 'build_sam3_multiplex_video_predictor',
      predictorVersion: 'sam3.1',
      maximumTrackedObjectsProductCap: 16,
      multiplexBucketSize: 16,
      useFlashAttention3: false,
      useRealValuedRope: true,
      torchCompileEnabled: false,
      warmupCompilationEnabled: false,
      defaultOutputProbabilityThreshold: 0.5,
      asynchronousFrameLoading: true,
      videoDecodeBackend: 'torchcodec_0_10_cuda_nvdec',
      gpuAcceleratedDecode: true,
      cpuOpenCvOrPillowDecodeAllowed: false,
      strictCheckpointLoadRequired: true,
      cudaOutputTensorsRequired: true,
      boundedCpuOutputSerializationOnly: true,
      offloadVideoToCpu: false,
      offloadStateToCpu: false,
      gpuMemoryProfileId: 'a100_full_gpu_state_v1',
      propagationDirection: 'forward',
      outputFormat: 'lossless_grayscale_png_mask_sequence_v1',
      sourceResolutionPreserved: true,
      sourceFrameRangePreserved: true,
      quantizationAllowed: false,
    },
    byteFreeRequest: true,
    callerCodePathUrlCommandOrEnvironmentAccepted: false,
  })
  const runtimeHash = sha256AuthorityValue(runtimeRequest)
  const staging = input.stagingEvidence as Record<string, unknown>
  const stagingHash = sha256.parse(staging.evidenceHash)
  const stagingId = safeId.parse(staging.stagingId)
  const payload = {
    schemaVersion: CANONICAL_SAM3_1_GPU_TASK_RECORD_VERSION,
    source: 'canonical_server_sam3_1_gpu_task_owner',
    evidenceClass: 'canonical_private_reread',
    taskId: `sam31-task:${input.envelopeRef.id}`,
    invocationId: input.envelopeRef.id,
    taskContextRef: input.refs.taskContextRef,
    fixedTaskContractRef: canonicalSam31GpuFixedTaskContractRef(),
    dispatchAdmissionRef: runtimeRequest.dispatchAdmissionRef,
    admissionConsumptionRef: input.consumptionRef,
    executionEnvelopeRef: input.envelopeRef,
    runtimeReleaseRef: input.release.releaseRef,
    specializedRuntimeReleaseRef:
      stripSchemaVersion(input.admission.sourceCheckpointQualificationRef),
    primaryRateAuthorityRef: input.admission.currentA100RateAuthorityRef,
    fallbackRateAuthorityRef:
      input.admission.currentL4FallbackRateAuthorityRef,
    privateTaskInputTransportRef: input.refs.privateTaskInputTransportRef,
    privateTaskOutputTransportRef: input.refs.privateTaskOutputTransportRef,
    privateInputStagingEvidenceRef: ref(stagingId, stagingHash),
    privateInputStagingEvidence: input.stagingEvidence,
    runtimeRequestRef: ref(
      `sam31-runtime-request:${input.envelopeRef.id}`,
      runtimeHash,
    ),
    runtimeRequestContentSha256: runtimeHash,
    runtimeRequest,
    privateWorkerMustRereadThisExactTaskBeforeAnySourceOrModelRead: true,
    responseMustBeCreateOnlyAndServerRereadBeforeAdmission: true,
    callerPathUrlBytesCommandModelRoutePriceOrEnvironmentIncluded: false,
    cloudJobCreated: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    preparedAt: input.preparedAt,
  } as const
  return canonicalSam31GpuTaskRecordSchema.parse({
    ...payload,
    taskRecordHash: sha256AuthorityValue(payload),
  })
}

function buildVertexRelease(input: {
  request: StartRequest
  source: ReturnType<typeof projectCanonicalSam31QualifiedSourceCheckpointRelease>
  image: CanonicalSam31CloudImageSupplyChainRelease
  a100Rate: CanonicalCurrentGoogleCloudVertexA100RateAuthority
  quota: ReturnType<typeof assertCanonicalSam31VertexQualificationQuotaObservation>
  refs: ReturnType<typeof buildQualificationRefs>
  admittedAt: string
}) {
  const expiresAt = earliest(
    input.a100Rate.expiresAt,
    input.quota.expiresAt,
    new Date(Date.parse(input.admittedAt) + 15 * 60_000).toISOString(),
  )
  const payload = {
    schemaVersion: CANONICAL_A100_VERTEX_CUSTOM_JOB_RELEASE_VERSION,
    source: 'canonical_server_a100_vertex_custom_job_release_registry',
    evidenceClass: 'canonical_private_reread',
    releaseRef: input.refs.runtimeCandidateReleaseRef,
    routeId: 'a100_80gb_heavy_primary',
    executionTarget: 'google_cloud_vertex_custom_job_a2_ultra',
    projectId: PROJECT_ID,
    region: REGION,
    customJobParent: 'projects/reeditpro/locations/us-central1',
    serviceAccountEmail: WORKER_SERVICE_ACCOUNT,
    serviceIdentityRef: input.refs.serviceIdentityRef,
    immutableImageUri: input.image.immutableImageUri,
    immutableImageRef: input.image.immutableImageRef,
    immutableImageDigest: input.image.immutableImageDigest,
    imageSupplyChainReleaseRef: input.request.imageSupplyChainReleaseRef,
    sourceCheckpointQualificationRef:
      stripSchemaVersion(input.request.sourceCheckpointQualificationRef),
    privateArtifactTransportRef: input.refs.privateArtifactTransportRef,
    privateNetworkPeeringQualificationRef:
      input.refs.privateNetworkPolicyRef,
    networkResource: NETWORK_RESOURCE,
    encryptionKeyResource: ENCRYPTION_KEY_RESOURCE,
    currentRateAuthorityRef: rateRef(input.a100Rate),
    quotaPreferenceObservationRef: ref(
      input.quota.quotaPreferenceId,
      input.quota.observationHash,
    ),
    quotaPreferenceId: input.quota.quotaPreferenceId,
    quotaId: input.quota.quotaId,
    quotaPreferredValue: input.quota.preferredValue,
    quotaGrantedValue: input.quota.grantedValue,
    quotaReconciling: input.quota.reconciling,
    machineType: 'a2-ultragpu-1g',
    acceleratorType: 'NVIDIA_A100_80GB',
    acceleratorCount: 1,
    replicaCount: 1,
    bootDiskType: 'pd-ssd',
    bootDiskSizeGb: 200,
    maximumExecutionSeconds: MAXIMUM_EXECUTION_SECONDS,
    persistentResourceAllowed: false,
    persistentEndpointAllowed: false,
    publicIpExecutionAllowed: false,
    privateIpAndVPCPeeringRequired: true,
    runtimeNetworkDownloadAllowed: false,
    callerImageCommandArgsEnvironmentOrModelSelectionAllowed: false,
    containerEntrypointFromImmutableImageOnly: true,
    oneWorkerPoolOnly: true,
    oneReplicaOnly: true,
    restartJobOnWorkerRestart: false,
    automaticRetryAllowed: false,
    minimumIdleInstances: 0,
    startsOnlyFromDurablyConsumedApprovedAuthority: true,
    stopsAtTerminalAttempt: true,
    cpuOnlySubstantiveExecutionAllowed: false,
    customerCreditsMutated: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    qualifiedAt: input.admittedAt,
    expiresAt,
  } as const
  return assertCanonicalA100VertexCustomJobRelease({
    ...payload,
    configurationHash: sha256AuthorityValue(payload),
  })
}

function buildVertexAuthority(input: {
  admission: CanonicalSam31A100RuntimeQualificationAdmission
  release: ReturnType<typeof assertCanonicalA100VertexCustomJobRelease>
  refs: ReturnType<typeof buildQualificationRefs>
  envelopeRef: z.infer<typeof evidenceRefSchema>
}) {
  const payload = {
    schemaVersion: CANONICAL_A100_VERTEX_CUSTOM_JOB_LAUNCH_AUTHORITY_VERSION,
    source: 'canonical_professional_gpu_dispatch_owner',
    authorityId: `${input.admission.admissionId}.vertex-a100`,
    toolId: 'sam3_1',
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    routeId: 'a100_80gb_heavy_primary',
    executionTarget: 'google_cloud_vertex_custom_job_a2_ultra',
    releaseRef: input.release.releaseRef,
    workspaceId: input.refs.workspaceId,
    projectId: input.refs.projectId,
    editSessionId: input.refs.editSessionId,
    approvedSnapshotRef: input.refs.approvedSnapshotRef,
    confirmedOutputFrameRef: input.refs.confirmedOutputFrameRef,
    masterTimingRef: input.refs.masterTimingRef,
    approvedWorkItemRef: input.refs.approvedWorkItemRef,
    workerLeaseRef: input.refs.workerLeaseRef,
    fundedReservationRef: input.refs.fundedReservationRef,
    approvedEstimateRef: input.refs.approvedInternalCostEstimateRef,
    userApprovalRecordRef: input.refs.operatorTriggerRecordRef,
    userTriggerRecordRef: input.refs.operatorTriggerRecordRef,
    executionAttemptRef: input.refs.executionAttemptRef,
    executionEnvelopeRef: input.envelopeRef,
    currentRateAuthorityRef: input.admission.currentA100RateAuthorityRef,
    maximumReservedToolCostCredits: 0,
    exactSnapshotWorkLeaseReservationTriggerReleaseAndRateReread: true,
    createOnlyDurableConsumptionRequiredBeforeProviderCall: true,
    oneAuthorityMayCreateAtMostOneCustomJob: true,
    retryAfterUnknownCreateOutcomeAllowed: false,
    userTriggeredScaleFromZero: true,
    noApprovedAuthorityMeansZeroGpuJobs: true,
    callerImageCommandArgsEnvironmentOrModelAccepted: false,
    cpuOnlySubstantiveExecutionAllowed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    admittedAt: input.admission.admittedAt,
    expiresAt: input.admission.expiresAt,
  } as const
  return assertCanonicalA100VertexCustomJobLaunchAuthority({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

function buildLifecycleLaunch(input: {
  admission: CanonicalSam31A100RuntimeQualificationAdmission
  release: ReturnType<typeof assertCanonicalA100VertexCustomJobRelease>
  consumptionRef: z.infer<typeof evidenceRefSchema>
  envelopeRef: z.infer<typeof evidenceRefSchema>
  raw: CanonicalA100VertexCustomJobLaunchResult
  launchRecordId: string
}): CanonicalProfessionalGpuJobLaunch {
  const launchDisposition = input.raw.disposition === 'accepted'
    ? 'job_created' as const
    : input.raw.disposition === 'rejected_before_creation'
      ? 'job_rejected_before_creation' as const
      : 'job_creation_outcome_unknown' as const
  const payload = {
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_JOB_LAUNCH_VERSION,
    source: 'canonical_professional_gpu_job_lifecycle_owner',
    launchRecordId: input.launchRecordId,
    admissionRef: ref(input.admission.admissionId,
      input.admission.admissionHash),
    admissionConsumptionRef: input.consumptionRef,
    runtimeReleaseRef: input.release.releaseRef,
    executionEnvelopeRef: input.envelopeRef,
    toolId: 'sam3_1',
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    routeId: 'a100_80gb_heavy_primary',
    runtimeRegion: 'us-central1',
    executionTarget: 'google_cloud_vertex_custom_job_a2_ultra',
    accelerator: 'nvidia_a100_80gb',
    immutableImageDigest: input.release.immutableImageDigest,
    cloudJobCreateRequestRef: input.raw.customJobCreateRequestRef,
    cloudJobExecutionRef: input.raw.customJobExecutionRef,
    launchDisposition,
    providerInferenceOrSubstantiveWorkKnownExecuted:
      input.raw.providerInferenceOrSubstantiveWorkKnownExecuted,
    createOnlyAdmissionConsumedBeforeLaunch: true,
    duplicateLaunchAllowed: false,
    unknownOutcomeRetryAllowed: false,
    noApprovedAdmissionMeansZeroGpuJobs: true,
    minimumIdleInstances: 0,
    prewarmingKeepaliveOrAlwaysOnPoolAllowed: false,
    cpuOnlySubstantiveExecutionAllowed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    launchedAt: input.raw.observedAt,
  } as const
  return assertCanonicalProfessionalGpuJobLaunch(
    canonicalProfessionalGpuJobLaunchSchema.parse({
      ...payload,
      launchHash: sha256AuthorityValue(payload),
    }),
  )
}

function buildProbeSourceMedia(refs: ReturnType<typeof buildQualificationRefs>) {
  const fixture = CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE
  return canonicalSam31GpuSourceMediaSchema.parse({
    mediaForm: 'private_read_only_mp4',
    finalizedSourceArtifactRef: refs.finalizedSourceArtifactRef,
    gpuPreparedMaskProxyArtifactRef: refs.deterministicProbeFixtureRef,
    exactSourceReadEvidenceRef: refs.exactSourceReadEvidenceRef,
    ffprobeOrFrameDirectoryEvidenceRef: refs.ffprobeEvidenceRef,
    sourceFrameRangeMappingRef: refs.sourceFrameRangeMappingRef,
    proxyPixelGeometryQaRef: refs.proxyPixelGeometryQaRef,
    byteLength: fixture.byteLength,
    sha256: fixture.sha256,
    width: fixture.width,
    height: fixture.height,
    decodedFrameCount: fixture.sourceFrameCount,
    fpsNumerator: fixture.sourceFpsNumerator,
    fpsDenominator: fixture.sourceFpsDenominator,
    selectedStartFrameInclusive: 0,
    selectedEndFrameInclusive: fixture.sourceFrameCount - 1,
    canonicalSourceStartFrameInclusive: 0,
    canonicalSourceEndFrameInclusive: fixture.sourceFrameCount - 1,
    boundedChunkOverlapAndStitchPlanRef:
      refs.boundedChunkOverlapAndStitchPlanRef,
    variableFrameRateAllowed: false,
    callerPathOrUrlAccepted: false,
  })
}

export const buildCanonicalSam31A100QualificationProbeSourceMedia =
  buildProbeSourceMedia

function buildProbeRefs() {
  const fixture = CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE
  const deterministicProbeFixtureRef = ref(
    `sam31-qualification-probe-${fixture.sha256.slice(0, 24)}`,
    fixture.sha256,
  )
  return Object.freeze({
    deterministicProbeFixtureRef,
    finalizedSourceArtifactRef: deterministicProbeFixtureRef,
    sourceBindingRef: opaqueRef('sam31-official-probe-source-binding', {
      sha256: fixture.sha256,
      frameCount: fixture.sourceFrameCount,
    }),
    exactSourceReadEvidenceRef: opaqueRef(
      'sam31-official-probe-exact-source-read',
      { sha256: fixture.sha256, byteLength: fixture.byteLength },
    ),
    sourceFrameRangeMappingRef: opaqueRef(
      'sam31-official-probe-frame-range',
      { start: 0, end: fixture.sourceFrameCount - 1 },
    ),
    proxyPixelGeometryQaRef: opaqueRef(
      'sam31-official-probe-pixel-geometry',
      { width: fixture.width, height: fixture.height },
    ),
  })
}

export const createCanonicalSam31A100QualificationProbeRefs = buildProbeRefs

function buildIdentifiers(request: StartRequest) {
  const suffix = `${request.qualificationId}.run-${
    String(request.runOrdinal).padStart(2, '0')}`
  return Object.freeze({
    suffix,
    admissionId: `sam31-a100-qualification:${suffix}`,
    invocationId: `sam31-a100-qualification:${suffix}.execution`,
    launchRecordId: `sam31-a100-qualification:${suffix}.launch`,
  })
}

function buildQualificationRefs(input: {
  request: StartRequest
  identifiers: ReturnType<typeof buildIdentifiers>
}) {
  const probe = buildProbeRefs()
  const basis = {
    qualificationId: input.request.qualificationId,
    runOrdinal: input.request.runOrdinal,
    sourceCheckpointQualificationRef:
      input.request.sourceCheckpointQualificationRef,
    imageSupplyChainReleaseRef: input.request.imageSupplyChainReleaseRef,
  }
  const named = (name: string) => opaqueRef(
    `sam31-qualification-${name}-${input.request.runOrdinal}`,
    { ...basis, name },
  )
  return Object.freeze({
    ...probe,
    ...input.identifiers,
    ownerUserId: 'weeditpro-internal-qualification-owner',
    workspaceId: 'weeditpro-internal-qualification',
    projectId: 'weeditpro-sam31-runtime-qualification',
    editSessionId: `sam31-qualification-session-${input.request.runOrdinal}`,
    editPlanId: 'sam31-runtime-qualification-plan',
    editPlanVersionId: 'sam31-runtime-qualification-plan-v1',
    outputId: 'sam31-official-probe-output',
    sceneId: 'sam31-official-probe-scene',
    idempotencyKey: `sam31-qualification-${input.request.runOrdinal}`,
    runtimeCandidateReleaseRef: named('runtime-candidate-release'),
    internalQualificationPlanRef: named('internal-plan'),
    approvedInternalCostEstimateRef: named('approved-cost-estimate'),
    internalCostBudgetRef: named('internal-cost-budget'),
    operatorTriggerRecordRef: named('operator-trigger'),
    executionAttemptRef: named('execution-attempt'),
    approvedSnapshotRef: named('approved-snapshot'),
    confirmedOutputFrameRef: named('confirmed-output-frame'),
    masterTimingRef: named('master-timing'),
    approvedWorkItemRef: named('approved-work-item'),
    workerLeaseRef: named('worker-lease'),
    fundedReservationRef: named('zero-customer-credit-reservation'),
    sourceBindingRef: probe.sourceBindingRef,
    ffprobeEvidenceRef: named('ffprobe-evidence'),
    boundedChunkOverlapAndStitchPlanRef: named('single-chunk-plan'),
    compiledIntentRef: named('compiled-intent'),
    promptApprovalRef: named('prompt-approval'),
    taskContextRef: named('task-context'),
    privateTaskInputTransportRef: named('private-input-transport'),
    privateTaskOutputTransportRef: named('private-output-transport'),
    serviceIdentityRef: opaqueRef('sam31-a100-worker-service-identity', {
      projectId: PROJECT_ID,
      serviceAccountEmail: WORKER_SERVICE_ACCOUNT,
    }),
    privateArtifactTransportRef: opaqueRef(
      'sam31-a100-private-artifact-transport',
      { inputBucket: PRIVATE_GPU_BUCKET, modelBucket:
        'reeditpro-production-reeditpro-model-artifacts' },
    ),
    privateNetworkPolicyRef: opaqueRef('sam31-a100-private-network-policy', {
      networkResource: NETWORK_RESOURCE,
      publicIpExecutionAllowed: false,
    }),
  })
}

export const createCanonicalSam31A100QualificationRefs =
  buildQualificationRefs

export const buildCanonicalSam31A100QualificationTask =
  buildQualificationTask

export const buildCanonicalSam31A100QualificationExecutionEnvelope =
  buildExecutionEnvelope

export const buildCanonicalSam31A100QualificationLifecycleConsumption =
  buildLifecycleConsumption

function assertPrerequisites(input: {
  request: StartRequest
  sourceRelease: CanonicalSam31QualifiedSourceCheckpointRelease
  source: ReturnType<typeof projectCanonicalSam31QualifiedSourceCheckpointRelease>
  image: CanonicalSam31CloudImageSupplyChainRelease
  a100Rate: CanonicalCurrentGoogleCloudVertexA100RateAuthority
  l4Rate: CanonicalCurrentGoogleCloudGpuRateAuthority
  quota: ReturnType<typeof assertCanonicalSam31VertexQualificationQuotaObservation>
}): void {
  if (
    input.sourceRelease.sourceCheckpointQualificationRef.id !==
      input.request.sourceCheckpointQualificationRef.id
    || input.sourceRelease.sourceCheckpointQualificationRef.version !==
      input.request.sourceCheckpointQualificationRef.version
    || input.sourceRelease.sourceCheckpointQualificationRef.contentHash !==
      input.request.sourceCheckpointQualificationRef.contentHash
    || !input.source.exactCanonicalReread
    || !input.source.sourceCheckpointQualificationGranted
    || input.image.releaseId !== input.request.imageSupplyChainReleaseRef.id
    || `sha256:${input.image.releaseHash}` !==
      input.request.imageSupplyChainReleaseRef.contentHash
    || input.a100Rate.routeId !== 'a100_80gb_heavy_primary'
    || input.l4Rate.routeId !== 'l4_heavy_fallback'
    || input.quota.preferredValue !== 1
    || input.quota.grantedValue !== 1
    || input.quota.reconciling
  ) throw conflict('exact_prerequisite_lineage_mismatch')
}

function assertQualifiedImage(
  value: unknown,
): CanonicalSam31CloudImageSupplyChainRelease {
  const image = assertCanonicalSam31CloudImageSupplyChainRelease(value)
  if (
    image.evidenceClass !== 'canonical_private_reread'
    || image.status !== 'image_supply_chain_qualified'
    || !image.authority.imageSupplyChainQualified
    || image.authority.a100RuntimeQualified
    || image.authority.runtimeReleaseGranted
    || image.authority.gpuJobDispatched
  ) throw conflict('image_supply_chain_release_not_pre_release_eligible')
  return image
}

function assertAdmission(
  value: unknown,
): CanonicalSam31A100RuntimeQualificationAdmission {
  const parsed = canonicalSam31A100RuntimeQualificationAdmissionSchema
    .parse(value)
  const { admissionHash, ...payload } = parsed
  if (admissionHash !== sha256AuthorityValue(payload)) {
    throw conflict('qualification_admission_hash_invalid')
  }
  return parsed
}

function maximumInternalCostUsdNanos(
  rate: CanonicalCurrentGoogleCloudVertexA100RateAuthority,
): number {
  const quantities: Record<string, readonly [bigint, bigint]> = {
    vertex_training_a100_80gb_hour: [2n, 1n],
    vertex_training_a2_core_hour: [24n, 1n],
    vertex_training_a2_ram_gib_hour: [340n, 1n],
    vertex_training_pd_ssd_gib_month: [400n, 720n],
    private_object_storage_gib_month: [8n, 1n],
    network_egress_gib: [0n, 1n],
    object_class_a_per_1000: [0n, 1n],
    object_class_b_per_1000: [0n, 1n],
  }
  const nanos = rate.components.reduce((sum, component) => {
    const [numerator, denominator] = quantities[component.componentClass]
      ?? [0n, 1n]
    const amount = BigInt(component.maximumUsdNanosPerBillingUnit)
    return sum + ceilDiv(amount * numerator, denominator)
  }, 0n)
  const numeric = Number(nanos)
  if (!Number.isSafeInteger(numeric) || numeric < 0) {
    throw conflict('qualification_cost_estimate_overflow')
  }
  return numeric
}

function rateRef(
  rate: CanonicalCurrentGoogleCloudVertexA100RateAuthority
    | CanonicalCurrentGoogleCloudGpuRateAuthority,
) {
  return evidenceRefSchema.parse({
    id: rate.rateAuthorityId,
    version: rate.rateAuthorityVersion,
    contentHash: `sha256:${rate.rateAuthorityHash}`,
  })
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}

function opaqueRef(id: string, value: unknown) {
  return ref(id, sha256AuthorityValue(value))
}

function stripSchemaVersion(value: {
  readonly id: string
  readonly version: number
  readonly contentHash: string
}) {
  return evidenceRefSchema.parse({
    id: value.id,
    version: value.version,
    contentHash: value.contentHash,
  })
}

function sameRef(
  left: { readonly id: string; readonly version: number;
    readonly contentHash: string },
  right: { readonly id: string; readonly version: number;
    readonly contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function earliest(...values: readonly string[]): string {
  return new Date(Math.min(...values.map((value) => Date.parse(value))))
    .toISOString()
}

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  return numerator === 0n ? 0n : (numerator + denominator - 1n) / denominator
}

function hashBytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function assertDependencies(input: {
  sourceCheckpointReadPort: CanonicalSam31QualifiedSourceCheckpointReleaseReadPort
  imageSupplyChainReadPort: Pick<
    CanonicalSam31ImageSupplyChainReleaseRepository,
    'rereadQualifiedRelease'
  >
  vertexRateReadPort: Pick<
    CanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository,
    'reread'
  >
  gpuRateReadPort: Pick<
    CanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
    'rereadApprovedCurrentRate'
  >
  quotaReadPort: CanonicalSam31VertexQualificationQuotaReadPort
  admissionRepository: CanonicalSam31A100RuntimeQualificationAdmissionRepository
  lifecycleStore: CanonicalProfessionalGpuDurableLifecycleStore
  privateInputStagingPort: CanonicalSam31GpuPrivateInputStagingPort
  taskStore: CanonicalSam31GpuTaskStore
  vertexLaunchPort: VertexLaunchPort
}): void {
  if (
    typeof input.sourceCheckpointReadPort?.rereadQualificationRelease !==
      'function'
    || typeof input.imageSupplyChainReadPort?.rereadQualifiedRelease !==
      'function'
    || typeof input.vertexRateReadPort?.reread !== 'function'
    || typeof input.gpuRateReadPort?.rereadApprovedCurrentRate !== 'function'
    || typeof input.quotaReadPort?.rereadCurrent !== 'function'
    || typeof input.admissionRepository?.persistCreateOnlyAndReread !==
      'function'
    || typeof input.lifecycleStore?.consumeAdmissionCreateOnly !== 'function'
    || typeof input.privateInputStagingPort
      ?.stageAndRereadExactMaskProxy !== 'function'
    || typeof input.taskStore?.persistTaskCreateOnly !== 'function'
    || typeof input.vertexLaunchPort?.startOneShotJob !== 'function'
  ) throw new Error('SAM 3.1 A100 qualification launch ports are incomplete.')
}

function conflict(reason: string): Error {
  return new Error(`SAM31_A100_QUALIFICATION_LAUNCH_CONFLICT:${reason}`)
}
