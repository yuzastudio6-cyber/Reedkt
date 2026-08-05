import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_START_REQUEST_VERSION,
  TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_START_RESULT_VERSION,
  type TrackAllSam31L4TaskQaGpuStartRequest,
  type TrackAllSam31L4TaskQaGpuStartResult,
} from '../../src/types/track-all-sam3_1-l4-task-qa-gpu-start'
import {
  assertCanonicalProfessionalGpuApprovedFundingObservation,
  assertCanonicalProfessionalGpuAttemptStartAuthority,
  type CanonicalProfessionalGpuApprovedFundingReadPort,
  type CanonicalProfessionalGpuAttemptStartAuthorityReadPort,
  type CanonicalProfessionalGpuPlanPricingAuthorityReadPort,
  type CanonicalProfessionalGpuRuntimeDispatchContextReadPort,
} from './canonical-professional-gpu-plan-funded-dispatch-service'
import {
  createCanonicalProfessionalGpuFundedLifecycleIdentity,
  type CanonicalProfessionalGpuFundedJobLifecycleStore,
} from './canonical-professional-gpu-plan-funded-job-lifecycle-service'
import type {
  CanonicalProfessionalGpuJobLifecycleStore,
  CanonicalProfessionalGpuRuntimeReleaseReadPort,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  type CanonicalSam31GpuTaskContextRepository,
} from './canonical-sam3_1-gpu-task-context-owner'
import {
  assertCanonicalSam31GpuTaskContext,
  assertCanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  assertCanonicalSam31GpuRuntimeResultAdmission,
  type CanonicalSam31GpuRuntimeResultAdmission,
  type CanonicalSam31GpuRuntimeResultStore,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  buildCanonicalTrackAllSam31L4TaskQaMaterial,
  type CanonicalTrackAllSam31L4TaskQaMaterialRepository,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-owner-service'
import {
  parseSkillSupportRequest as parseCaptionSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import {
  parseCaptionTrackAllSupportPayload,
} from './canonical-caption-track-all-support-service'
import {
  startCanonicalTrackAllSam31L4TaskQaPlanFundedGpuJob,
  type CanonicalTrackAllSam31L4TaskQaFundedRuntimeComposition,
} from './canonical-track-all-sam3_1-l4-task-qa-funded-gpu-runtime-composition'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import type {
  CanonicalSpecialistSupportResumeRepository,
} from './canonical-specialist-support-resume-service'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_AUTHENTICATED_START_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-authenticated-start-v1' as const

const PRIVATE_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/invocations'
const MAXIMUM_MANIFEST_BYTES = 64 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const captionContractRefSchema = z.object({
  id: safeId,
  version: safeId,
  contentHash: sha256,
}).strict()
const requestWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_START_REQUEST_VERSION,
  ),
  requestId: safeId,
  approvedSnapshotId: safeId,
  workItemKey: safeId,
  sam31InvocationId: safeId,
  priorCaptionCallRef: captionContractRefSchema,
  selectedCaptionSupportRequestRef: captionContractRefSchema,
  userTriggeredAfterApprovedSam31Result: z.literal(true),
  browserOrCallerExecutionMaterialAccepted: z.literal(false),
  callerSelectedGpuRouteImageCommandEnvironmentOrPriceAccepted:
    z.literal(false),
}).strict()
const requestSchema = requestWithoutDigestSchema.extend({
  requestDigestSha256: sha256,
}).strict()
const authenticatedInputSchema = z.object({
  authenticatedOwnerUserId: safeId,
  workspaceId: safeId,
  idempotencyKey: safeId,
  request: z.unknown(),
}).strict()
const manifestMaskSchema = z.object({
  frameIndex: nonnegativeInteger,
  objectId: nonnegativeInteger.max(2 ** 31 - 1),
  relativeFileName: z.string().regex(
    /^frame-[0-9]{6}-object-[0-9]{6}\.png$/u,
  ),
  width: positiveInteger.max(16_384),
  height: positiveInteger.max(16_384),
  byteLength: positiveInteger,
  sha256,
}).strict()
const normalizedBoxSchema = z.tuple([
  z.number().finite().min(0).max(1),
  z.number().finite().min(0).max(1),
  z.number().finite().min(0).max(1),
  z.number().finite().min(0).max(1),
])
const manifestFrameObjectSchema = z.object({
  objectId: nonnegativeInteger.max(2 ** 31 - 1),
  normalizedBoxXywh: normalizedBoxSchema,
  maskSha256: sha256,
}).strict()
const manifestFrameSchema = z.object({
  frameIndex: nonnegativeInteger,
  objects: z.array(manifestFrameObjectSchema).min(1).max(16),
}).strict()
const manifestSchema = z.object({
  schemaVersion: z.literal('canonical-sam3_1-mask-sequence-manifest-v1'),
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  requestBindingSha256: sha256,
  sourceFrameRangeMappingRef: evidenceRefSchema,
  width: positiveInteger.max(16_384),
  height: positiveInteger.max(16_384),
  firstFrameIndex: nonnegativeInteger,
  lastFrameIndex: nonnegativeInteger,
  frames: z.array(manifestFrameSchema).min(1).max(240),
  masks: z.array(manifestMaskSchema).min(1).max(16 * 240),
}).strict()
const outputObservationSchema = z.object({
  manifestByteLength: positiveInteger.max(MAXIMUM_MANIFEST_BYTES),
  manifestSha256: sha256,
  maskPngCount: positiveInteger.max(16 * 240),
  distinctObjectIds: z.array(nonnegativeInteger).min(1).max(16),
  exactPrivateManifestBytesReread: z.literal(true),
  manifestTaskResultGeometryAndRangeVerified: z.literal(true),
  callerPathUrlOrBytesAccepted: z.literal(false),
}).strict()
export type CanonicalTrackAllSam31L4TaskQaSamOutputObservation = z.infer<
  typeof outputObservationSchema
>

export interface CanonicalTrackAllSam31L4TaskQaSamOutputReadPort {
  rereadExactSam31MaskManifest(input: {
    readonly task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
    readonly result: CanonicalSam31GpuRuntimeResultAdmission
  }): Promise<unknown>
}

export interface CanonicalTrackAllSam31L4TaskQaAuthenticatedStartRuntimePort {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_AUTHENTICATED_START_VERSION
  readonly routeOwnsGpuPlacementOrPricing: false
  readonly rawCloudLaunchPortExposed: false
  startApprovedTaskQaWork(input: z.input<typeof authenticatedInputSchema>):
    Promise<TrackAllSam31L4TaskQaGpuStartResult>
}

type FundingReadInput = Parameters<
  CanonicalProfessionalGpuApprovedFundingReadPort['rereadApprovedFunding']
>[0]
type AttemptReadInput = Parameters<
  CanonicalProfessionalGpuAttemptStartAuthorityReadPort[
    'rereadCreateOnlyAttemptStart'
  ]
>[0]

export function buildTrackAllSam31L4TaskQaGpuStartRequest(input: {
  readonly requestId: string
  readonly approvedSnapshotId: string
  readonly workItemKey: string
  readonly sam31InvocationId: string
  readonly priorCaptionCallRef: z.infer<typeof captionContractRefSchema>
  readonly selectedCaptionSupportRequestRef:
    z.infer<typeof captionContractRefSchema>
}): TrackAllSam31L4TaskQaGpuStartRequest {
  assertPlainSerializedData(input, 'track_all_l4_task_qa_start_request_input')
  const payload = requestWithoutDigestSchema.parse({
    schemaVersion: TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_START_REQUEST_VERSION,
    ...structuredClone(input),
    userTriggeredAfterApprovedSam31Result: true,
    browserOrCallerExecutionMaterialAccepted: false,
    callerSelectedGpuRouteImageCommandEnvironmentOrPriceAccepted: false,
  })
  return Object.freeze(requestSchema.parse({
    ...payload,
    requestDigestSha256: sha256AuthorityValue(payload),
  }))
}

export function parseTrackAllSam31L4TaskQaGpuStartRequest(
  value: unknown,
): TrackAllSam31L4TaskQaGpuStartRequest {
  assertPlainSerializedData(value, 'track_all_l4_task_qa_start_request')
  const request = requestSchema.parse(value)
  const { requestDigestSha256, ...payload } = request
  if (requestDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All L4 task-QA start digest is invalid.')
  }
  return structuredClone(request)
}

export function createCanonicalTrackAllSam31L4TaskQaSamOutputReadPort(
  input: {
    readonly objectPort: Pick<CanonicalCreateOnlyJsonObjectPort, 'readExact'>
    readonly prefix?: string
  },
): CanonicalTrackAllSam31L4TaskQaSamOutputReadPort {
  if (typeof input.objectPort?.readExact !== 'function') {
    throw new Error('Track All SAM output object reader is unavailable.')
  }
  const prefix = normalizePrefix(input.prefix ?? PRIVATE_PREFIX)
  const port: CanonicalTrackAllSam31L4TaskQaSamOutputReadPort = {
    async rereadExactSam31MaskManifest({ task, result }) {
      const body = await input.objectPort.readExact(
        `${prefix}/${safeId.parse(task.invocationId)}/output/mask-manifest.json`,
      )
      if (!body || !Buffer.isBuffer(body) || body.byteLength < 2
        || body.byteLength > MAXIMUM_MANIFEST_BYTES) {
        throw new Error('SAM 3.1 private mask manifest is unavailable.')
      }
      let value: unknown
      try {
        value = JSON.parse(body.toString('utf8')) as unknown
      } catch {
        throw new Error('SAM 3.1 private mask manifest JSON is invalid.')
      }
      const manifest = manifestSchema.parse(value)
      const source = task.runtimeRequest.sourceMedia
      const manifestSha256 = createHash('sha256').update(body).digest('hex')
      const distinctObjectIds = [...new Set(manifest.masks.map(
        (mask) => mask.objectId,
      ))].sort((left, right) => left - right)
      const exactMaskKeys = new Set(manifest.masks.map((mask) =>
        `${mask.frameIndex}:${mask.objectId}`))
      const maskByKey = new Map(manifest.masks.map((mask) => [
        `${mask.frameIndex}:${mask.objectId}`,
        mask,
      ]))
      const frameKeys = new Set<string>()
      const framesMatchMasks = manifest.frames.every((frame, frameOffset) => {
        if (frame.frameIndex !== frameOffset
          || frame.objects.length !== distinctObjectIds.length) return false
        const frameObjectIds = new Set<number>()
        return frame.objects.every((object) => {
          const key = `${frame.frameIndex}:${object.objectId}`
          const mask = maskByKey.get(key)
          if (!mask || frameObjectIds.has(object.objectId)
            || frameKeys.has(key) || object.maskSha256 !== mask.sha256) {
            return false
          }
          frameObjectIds.add(object.objectId)
          frameKeys.add(key)
          return true
        })
      })
      const completeMaskSet = distinctObjectIds.every((objectId) =>
        Array.from({ length: source.decodedFrameCount }, (_, frameIndex) =>
          exactMaskKeys.has(`${frameIndex}:${objectId}`)).every(Boolean))
      const canonicalNamesAndGeometry = manifest.masks.every((mask) =>
        mask.relativeFileName ===
          `frame-${String(mask.frameIndex).padStart(6, '0')}`
          + `-object-${String(mask.objectId).padStart(6, '0')}.png`
        && mask.width === source.width
        && mask.height === source.height)
      if (
        result.executionEnvelopeRef.id !== task.invocationId
        || manifestSha256 !== stripSha(result.manifestRef.contentHash)
        || manifest.requestBindingSha256 !==
          task.runtimeRequest.requestBindingSha256
        || !sameRef(manifest.sourceFrameRangeMappingRef,
          source.sourceFrameRangeMappingRef)
        || manifest.width !== source.width
        || manifest.height !== source.height
        || manifest.firstFrameIndex !== 0
        || manifest.lastFrameIndex !== source.decodedFrameCount - 1
        || manifest.frames.length !== source.decodedFrameCount
        || manifest.masks.length !== result.maskFileCount
        || exactMaskKeys.size !== manifest.masks.length
        || frameKeys.size !== exactMaskKeys.size
        || !framesMatchMasks
        || !completeMaskSet
        || !canonicalNamesAndGeometry
      ) throw new Error(
        'SAM 3.1 mask manifest differs from its admitted task or result.',
      )
      return outputObservationSchema.parse({
        manifestByteLength: body.byteLength,
        manifestSha256,
        maskPngCount: manifest.masks.length,
        distinctObjectIds,
        exactPrivateManifestBytesReread: true,
        manifestTaskResultGeometryAndRangeVerified: true,
        callerPathUrlOrBytesAccepted: false,
      })
    },
  }
  return Object.freeze(port)
}

export function createCanonicalTrackAllSam31L4TaskQaAuthenticatedStartRuntime(
  input: {
    readonly pricingAuthorityReadPort:
      CanonicalProfessionalGpuPlanPricingAuthorityReadPort
    readonly approvedFundingReadPort:
      CanonicalProfessionalGpuApprovedFundingReadPort
    readonly attemptStartReadPort:
      CanonicalProfessionalGpuAttemptStartAuthorityReadPort
    readonly runtimeContextReadPort:
      CanonicalProfessionalGpuRuntimeDispatchContextReadPort
    readonly releaseReadPort: CanonicalProfessionalGpuRuntimeReleaseReadPort
    readonly runtimeComposition:
      CanonicalTrackAllSam31L4TaskQaFundedRuntimeComposition
    readonly materialRepository:
      CanonicalTrackAllSam31L4TaskQaMaterialRepository
    readonly sam31TaskStore: Pick<CanonicalSam31GpuTaskStore, 'rereadTask'>
    readonly sam31TaskContextRepository: Pick<
      CanonicalSam31GpuTaskContextRepository, 'rereadTaskContext'
    >
    readonly sam31ResultStore: Pick<
      CanonicalSam31GpuRuntimeResultStore, 'rereadResultAdmission'
    >
    readonly sam31OutputReadPort:
      CanonicalTrackAllSam31L4TaskQaSamOutputReadPort
    readonly supportResumeRepository: Pick<
      CanonicalSpecialistSupportResumeRepository, 'rereadCallResultPair'
    >
    readonly lifecycleStore: CanonicalProfessionalGpuJobLifecycleStore
    readonly fundedLifecycleStore:
      CanonicalProfessionalGpuFundedJobLifecycleStore
    readonly now?: () => string
  },
): CanonicalTrackAllSam31L4TaskQaAuthenticatedStartRuntimePort {
  const now = input.now ?? (() => new Date().toISOString())
  const runtime: CanonicalTrackAllSam31L4TaskQaAuthenticatedStartRuntimePort = {
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_AUTHENTICATED_START_VERSION,
    routeOwnsGpuPlacementOrPricing: false as const,
    rawCloudLaunchPortExposed: false as const,
    async startApprovedTaskQaWork(untrusted) {
      assertPlainSerializedData(untrusted,
        'track_all_l4_task_qa_authenticated_start_input')
      const trusted = authenticatedInputSchema.parse(untrusted)
      const request = parseTrackAllSam31L4TaskQaGpuStartRequest(
        trusted.request,
      )
      if (request.requestId !== trusted.idempotencyKey) {
        throw new TypeError('Track All L4 start idempotency differs.')
      }
      const startedAt = z.string().datetime({ offset: true }).parse(now())
      const [untrustedFunding, untrustedAttempt] = await Promise.all([
        input.approvedFundingReadPort.rereadApprovedFunding({
          workspaceId: trusted.workspaceId,
          snapshotId: request.approvedSnapshotId,
          workItemKey: request.workItemKey,
          at: startedAt,
        }),
        input.attemptStartReadPort.rereadCreateOnlyAttemptStart({
          workspaceId: trusted.workspaceId,
          snapshotId: request.approvedSnapshotId,
          workItemKey: request.workItemKey,
          at: startedAt,
        }),
      ])
      const funding = assertCanonicalProfessionalGpuApprovedFundingObservation(
        untrustedFunding,
        startedAt,
      )
      const attempt = assertCanonicalProfessionalGpuAttemptStartAuthority(
        untrustedAttempt,
        startedAt,
      )
      assertAuthenticatedL4Scope({
        authenticatedOwnerUserId: trusted.authenticatedOwnerUserId,
        workspaceId: trusted.workspaceId,
        request,
        funding,
        attempt,
      })
      const task = assertCanonicalSam31GpuTaskRecord(
        await input.sam31TaskStore.rereadTask(request.sam31InvocationId),
      )
      const context = assertCanonicalSam31GpuTaskContext(
        await input.sam31TaskContextRepository.rereadTaskContext({
          taskContextRef: task.taskContextRef,
        }),
      )
      const result = assertCanonicalSam31GpuRuntimeResultAdmission(
        await input.sam31ResultStore.rereadResultAdmission(
          request.sam31InvocationId,
        ),
      )
      const output = outputObservationSchema.parse(
        await input.sam31OutputReadPort.rereadExactSam31MaskManifest({
          task,
          result,
        }),
      )
      const pair = await input.supportResumeRepository.rereadCallResultPair({
        callRef: request.priorCaptionCallRef,
      })
      if (!pair || !sameCaptionRef({
        id: pair.call.callId,
        version: pair.call.schemaVersion,
        contentHash: pair.call.callDigestSha256,
      }, request.priorCaptionCallRef)) throw new TypeError(
        'Caption Track All prior call is unavailable.',
      )
      const selectedValue = pair.result.supportRequests.find((candidate) =>
        sameCaptionRef({
          id: candidate.requestId,
          version: candidate.schemaVersion,
          contentHash: candidate.requestDigestSha256,
        }, request.selectedCaptionSupportRequestRef))
      if (!selectedValue) throw new TypeError(
        'Caption Track All support request is not current.',
      )
      const supportRequest = parseCaptionSkillSupportRequest(selectedValue)
      const payload = parseCaptionTrackAllSupportPayload(
        supportRequest.typedPayload,
      )
      assertSamAndCaptionScope({
        request,
        funding,
        task,
        context,
        result,
        output,
        payload,
      })
      const subject = payload.subjectRequests[0]!
      const material = buildCanonicalTrackAllSam31L4TaskQaMaterial({
        schemaVersion:
          'canonical-track-all-sam3_1-l4-task-qa-material-v1',
        source:
          'canonical_server_track_all_sam3_1_l4_task_qa_material_owner',
        evidenceClass: 'canonical_private_reread',
        materialId: `track-all-l4-task-material:${attempt.executionAttemptRef.id}`,
        sam31InvocationId: task.invocationId,
        sam31TaskRef: numericRef(task.taskId, task.taskRecordHash),
        sam31RuntimeRequestBindingSha256:
          task.runtimeRequest.requestBindingSha256,
        sam31RuntimeResultAdmissionRef:
          numericRef(result.resultAdmissionId, result.resultAdmissionHash),
        sam31MaskManifestRef: result.manifestRef,
        approvedSnapshotRef: funding.approvedSnapshotRef,
        confirmedOutputFrameRef:
          funding.confirmedOutputFrame.outputFrameRef,
        masterTimingRef: funding.masterTimingRef,
        approvedWorkItemRef: funding.approvedWorkItem.approvedWorkItemRef,
        workerLeaseRef: attempt.workerLeaseRef,
        fundedReservationRef: funding.fundedReservationRef,
        userTriggerRecordRef: attempt.userTriggerRecordRef,
        executionAttemptRef: attempt.executionAttemptRef,
        sourceFrameMappingRef:
          task.runtimeRequest.sourceMedia.sourceFrameRangeMappingRef,
        sourceWidth: task.runtimeRequest.sourceMedia.width,
        sourceHeight: task.runtimeRequest.sourceMedia.height,
        maskFrameRange: {
          startFrame: 0,
          endFrameExclusive: task.runtimeRequest.sourceMedia.decodedFrameCount,
        },
        expectedMaskManifestByteLength: output.manifestByteLength,
        expectedMaskManifestSha256: output.manifestSha256,
        expectedMaskPngCount: output.maskPngCount,
        subjects: [{
          subjectRequestId: subject.subjectRequestId,
          subjectEvidenceId: `track-all-l4-evidence:${subject.subjectRequestId}`,
          subjectRole: subject.subjectRole,
          maskObjectId: output.distinctObjectIds[0]!,
          canonicalFrameRange: payload.requestedRange,
          maskFrameRange: {
            startFrame: 0,
            endFrameExclusive:
              task.runtimeRequest.sourceMedia.decodedFrameCount,
          },
          trackManifestRef: result.manifestRef,
          anchorManifestRef: null,
          sourceFrameMappingRef:
            task.runtimeRequest.sourceMedia.sourceFrameRangeMappingRef,
          outputFrameDigestSha256: stripSha(
            context.confirmedOutputFrameRef.contentHash,
          ),
        }],
        exactSamTaskContextResultAndPrivateOutputReread: true,
        exactApprovedSnapshotFrameTimingWorkLeaseAttemptAndFundingReread: true,
        materialCreateOnlyPersistenceAndExactRereadRequiredBeforeL4AdmissionConsumption:
          true,
        browserOrCallerTaskMaterialAccepted: false,
        callerPathUrlCommandCodeModelEnvironmentOrPriceAccepted: false,
        customerCreditsMutated: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        preparedAt: startedAt,
      })
      if (await input.materialRepository.persistMaterialCreateOnly({ material })
        !== 'created') {
        throw new TypeError('Track All L4 task material already exists.')
      }
      const rereadMaterial = await input.materialRepository.rereadMaterial({
        executionAttemptRef: attempt.executionAttemptRef,
      })
      if (!rereadMaterial
        || rereadMaterial.materialHash !== material.materialHash) {
        throw new TypeError('Track All L4 task material reread changed.')
      }
      const identity = createCanonicalProfessionalGpuFundedLifecycleIdentity({
        attemptStartAuthority: attempt,
      })
      const exactFundingReadPort = freezeFundingPort(
        input.approvedFundingReadPort,
        funding,
      )
      const exactAttemptReadPort = freezeAttemptPort(
        input.attemptStartReadPort,
        attempt,
      )
      const started =
        await startCanonicalTrackAllSam31L4TaskQaPlanFundedGpuJob({
          ...identity,
          workspaceId: trusted.workspaceId,
          snapshotId: request.approvedSnapshotId,
          workItemKey: request.workItemKey,
          pricingAuthorityReadPort: input.pricingAuthorityReadPort,
          approvedFundingReadPort: exactFundingReadPort,
          attemptStartReadPort: exactAttemptReadPort,
          runtimeContextReadPort: input.runtimeContextReadPort,
          releaseReadPort: input.releaseReadPort,
          runtimeComposition: input.runtimeComposition,
          lifecycleStore: input.lifecycleStore,
          fundedLifecycleStore: input.fundedLifecycleStore,
          admittedAt: startedAt,
          admissionExpiresAt: attempt.expiresAt,
          startedAt,
        })
      return buildResult({
        request,
        workspaceId: trusted.workspaceId,
        material,
        result,
        started,
      })
    },
  }
  return Object.freeze(runtime)
}

function assertAuthenticatedL4Scope(input: {
  authenticatedOwnerUserId: string
  workspaceId: string
  request: TrackAllSam31L4TaskQaGpuStartRequest
  funding: ReturnType<
    typeof assertCanonicalProfessionalGpuApprovedFundingObservation
  >
  attempt: ReturnType<typeof assertCanonicalProfessionalGpuAttemptStartAuthority>
}): void {
  const { funding, attempt, request } = input
  if (
    funding.scope.ownerUserId !== input.authenticatedOwnerUserId
    || attempt.scope.ownerUserId !== input.authenticatedOwnerUserId
    || funding.scope.workspaceId !== input.workspaceId
    || attempt.scope.workspaceId !== input.workspaceId
    || funding.approvedSnapshotRef.id !== request.approvedSnapshotId
    || attempt.approvedSnapshotRef.id !== request.approvedSnapshotId
    || funding.approvedWorkItem.workItemKey !== request.workItemKey
    || !sameRef(attempt.approvedWorkItemRef,
      funding.approvedWorkItem.approvedWorkItemRef)
    || !funding.approvedWorkItem.approvedToolIds.includes('kornia')
    || attempt.routeId !== 'l4_standard_primary'
    || attempt.attemptOrdinal !== 1
  ) throw new TypeError(
    'Track All L4 task-QA scope is not authenticated approved work.',
  )
}

function assertSamAndCaptionScope(input: {
  request: TrackAllSam31L4TaskQaGpuStartRequest
  funding: ReturnType<
    typeof assertCanonicalProfessionalGpuApprovedFundingObservation
  >
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  context: ReturnType<typeof assertCanonicalSam31GpuTaskContext>
  result: CanonicalSam31GpuRuntimeResultAdmission
  output: CanonicalTrackAllSam31L4TaskQaSamOutputObservation
  payload: ReturnType<typeof parseCaptionTrackAllSupportPayload>
}): void {
  const { task, context, result, output, payload, funding } = input
  const source = task.runtimeRequest.sourceMedia
  if (
    task.invocationId !== input.request.sam31InvocationId
    || result.executionEnvelopeRef.id !== task.invocationId
    || result.status !== 'ready_for_independent_mask_artifact_qa'
    || task.taskContextRef.id !== context.taskContextRef.id
    || task.taskContextRef.contentHash !== context.taskContextRef.contentHash
    || task.runtimeRequest.scope.ownerUserId !== funding.scope.ownerUserId
    || task.runtimeRequest.scope.workspaceId !== funding.scope.workspaceId
    || task.runtimeRequest.scope.approvedPlanSnapshotId !==
      funding.approvedSnapshotRef.id
    || task.runtimeRequest.scope.approvedPlanSnapshotHash !==
      stripSha(funding.approvedSnapshotRef.contentHash)
    || !sameRef(context.confirmedOutputFrameRef,
      funding.confirmedOutputFrame.outputFrameRef)
    || !sameRef(task.runtimeRequest.scope.masterTimingRef,
      funding.masterTimingRef)
    || payload.canonicalScope.ownerUserId !== funding.scope.ownerUserId
    || payload.canonicalScope.workspaceId !== funding.scope.workspaceId
    || payload.canonicalScope.approvedSnapshotRef?.id !==
      funding.approvedSnapshotRef.id
    || payload.canonicalScope.outputId !== funding.scope.outputId
    || payload.subjectRequests.length !== 1
    || payload.subjectRequests[0]?.anchorRequired
    || output.distinctObjectIds.length !== 1
    || output.maskPngCount !== source.decodedFrameCount
    || payload.requestedRange.startFrame !==
      source.canonicalSourceStartFrameInclusive
    || payload.requestedRange.endFrameExclusive !==
      source.canonicalSourceEndFrameInclusive + 1
    || output.manifestSha256 !== stripSha(result.manifestRef.contentHash)
  ) throw new TypeError(
    'Track All L4 task-QA SAM, Caption, frame, or output scope differs.',
  )
}

function freezeFundingPort(
  port: CanonicalProfessionalGpuApprovedFundingReadPort,
  expected: ReturnType<
    typeof assertCanonicalProfessionalGpuApprovedFundingObservation
  >,
): CanonicalProfessionalGpuApprovedFundingReadPort {
  return Object.freeze({
    async rereadApprovedFunding(query: FundingReadInput) {
      const reread = assertCanonicalProfessionalGpuApprovedFundingObservation(
        await port.rereadApprovedFunding(query),
        query.at,
      )
      if (reread.observationId !== expected.observationId
        || reread.observationHash !== expected.observationHash) {
        throw new TypeError('Track All L4 approved funding changed.')
      }
      return reread
    },
  })
}

function freezeAttemptPort(
  port: CanonicalProfessionalGpuAttemptStartAuthorityReadPort,
  expected: ReturnType<typeof assertCanonicalProfessionalGpuAttemptStartAuthority>,
): CanonicalProfessionalGpuAttemptStartAuthorityReadPort {
  return Object.freeze({
    async rereadCreateOnlyAttemptStart(query: AttemptReadInput) {
      const reread = assertCanonicalProfessionalGpuAttemptStartAuthority(
        await port.rereadCreateOnlyAttemptStart(query),
        query.at,
      )
      if (reread.attemptAuthorityId !== expected.attemptAuthorityId
        || reread.attemptAuthorityHash !== expected.attemptAuthorityHash) {
        throw new TypeError('Track All L4 attempt changed.')
      }
      return reread
    },
  })
}

function buildResult(input: {
  request: TrackAllSam31L4TaskQaGpuStartRequest
  workspaceId: string
  material: ReturnType<typeof buildCanonicalTrackAllSam31L4TaskQaMaterial>
  result: CanonicalSam31GpuRuntimeResultAdmission
  started: Awaited<ReturnType<
    typeof startCanonicalTrackAllSam31L4TaskQaPlanFundedGpuJob
  >>
}): TrackAllSam31L4TaskQaGpuStartResult {
  const funded = input.started.prelaunchAuthorization.fundedDispatchAdmission
  const launch = input.started.launch
  const binding = input.started.launchBinding
  if (funded.toolDispatchAdmission.toolId !== 'kornia'
    || launch.routeId !== 'l4_standard_primary'
    || launch.accelerator !== 'nvidia_l4'
    || launch.executionEnvelopeRef.id === input.material.sam31InvocationId) {
    throw new TypeError('Track All L4 start returned invalid GPU lineage.')
  }
  const payload = {
    schemaVersion: TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_START_RESULT_VERSION,
    requestRef: numericRef(input.request.requestId,
      input.request.requestDigestSha256),
    workspaceId: input.workspaceId,
    approvedSnapshotId: input.request.approvedSnapshotId,
    workItemKey: input.request.workItemKey,
    sam31InvocationId: input.material.sam31InvocationId,
    l4InvocationId: launch.executionEnvelopeRef.id,
    sam31RuntimeResultAdmissionRef: numericRef(
      input.result.resultAdmissionId,
      input.result.resultAdmissionHash,
    ),
    l4TaskMaterialRef: numericRef(
      input.material.materialId,
      input.material.materialHash,
    ),
    fundedDispatchAdmissionRef: numericRef(
      funded.fundedAdmissionId,
      funded.fundedAdmissionHash,
    ),
    prelaunchAuthorizationRef: numericRef(
      input.started.prelaunchAuthorization.prelaunchAuthorizationId,
      input.started.prelaunchAuthorization.prelaunchAuthorizationHash,
    ),
    launchRef: numericRef(launch.launchRecordId, launch.launchHash),
    launchBindingRef: numericRef(binding.launchBindingId,
      binding.launchBindingHash),
    launchDisposition: launch.launchDisposition,
    routeId: 'l4_standard_primary' as const,
    accelerator: 'nvidia_l4' as const,
    userTriggeredScaleFromZero: true as const,
    exactSamTaskResultManifestAndApprovedL4WorkReread: true as const,
    accountEffectivePricingAndFundingRereadBeforeLaunch: true as const,
    fixedTaskPersistedAndRereadBeforeCloudJobCreation: true as const,
    separateSam31InputAndL4JobInvocationRoots: true as const,
    rawCloudLaunchPortExposed: false as const,
    callerSuppliedMaskBytesPathsCommandsImageRouteEnvironmentOrPriceAccepted:
      false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
  }
  return Object.freeze({
    ...payload,
    resultDigestSha256: sha256AuthorityValue(payload),
  })
}

function numericRef(id: string, rawHash: string) {
  return evidenceRefSchema.parse({
    id,
    version: 1,
    contentHash: rawHash.startsWith('sha256:')
      ? rawHash
      : `sha256:${rawHash}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function sameCaptionRef(
  left: z.infer<typeof captionContractRefSchema>,
  right: z.infer<typeof captionContractRefSchema>,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function stripSha(value: string): string {
  return value.startsWith('sha256:') ? value.slice(7) : value
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (!normalized || normalized.length > 400 || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) =>
      !safeId.safeParse(part).success)) {
    throw new Error('Track All SAM output prefix is invalid.')
  }
  return normalized
}
