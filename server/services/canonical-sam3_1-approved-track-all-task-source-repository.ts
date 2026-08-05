import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalProfessionalToolGpuDispatchAdmission,
  type CanonicalProfessionalToolGpuDispatchAdmission,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import { ApiError } from '../errors/api-error'
import {
  parseOrchestraSkillCall,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-capability-contract'
import {
  canonicalSam31GpuApprovedPromptSchema,
  canonicalSam31GpuSourceMediaSchema,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  createCanonicalTrackAllSam31OrchestraBinding,
  CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE,
} from '../workers/masks/canonical-track-all-sam3_1-orchestra-binding'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalProfessionalGpuApprovedFundingObservation,
  assertCanonicalProfessionalGpuAttemptStartAuthority,
} from './canonical-professional-gpu-plan-funded-dispatch-service'
import {
  assertPlainSerializedData,
  assertCanonicalProfessionalGpuRuntimeLaunchTarget,
} from './canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalSam31GpuApprovedTaskMaterialSourceReadPort,
} from './canonical-sam3_1-gpu-task-context-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_APPROVED_TRACK_ALL_TASK_SOURCE_REPOSITORY_VERSION =
  'canonical-sam3_1-approved-track-all-task-source-repository-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX = 'private/track-all/sam3_1/approved-task-sources/v1'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const refSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const sourceScopeSchema = z.object({
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  editPlanId: safeId,
  editPlanVersion: positiveInteger,
  outputId: safeId,
  approvedSnapshotRef: refSchema,
  confirmedOutputFrameRef: refSchema,
  masterTimingRef: refSchema,
  approvedWorkItemRef: refSchema,
  workerLeaseRef: refSchema,
  fundedReservationRef: refSchema,
  executionAttemptRef: refSchema,
}).strict()
const materialSourceSchema = z.object({
  bindingId: safeId,
  orchestraCall: z.unknown(),
  supportRequest: z.unknown().nullable(),
  editPlanVersionId: safeId,
  editPlanVersionRef: refSchema,
  outputId: safeId,
  confirmedOutputFrameRef: refSchema,
  sceneId: safeId,
  sourceBindingRef: refSchema,
  sourceMedia: canonicalSam31GpuSourceMediaSchema,
  approvedPrompt: canonicalSam31GpuApprovedPromptSchema,
  primaryRateAuthorityRef: refSchema,
  fallbackRateAuthorityRef: refSchema,
  privateTaskInputTransportRef: refSchema,
  privateTaskOutputTransportRef: refSchema,
}).strict()
const recordWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_APPROVED_TRACK_ALL_TASK_SOURCE_REPOSITORY_VERSION,
  ),
  source: z.literal('canonical_track_all_approved_work_publication_owner'),
  evidenceClass: z.literal('gcs_create_only_exact_reread'),
  sourcePublicationId: safeId,
  sourceScope: sourceScopeSchema,
  materialSource: materialSourceSchema,
  sourceWorkApprovalAndAttemptRereadVerified: z.literal(true),
  exactOrchestraSceneSourceFrameTimingAndPromptBound: z.literal(true),
  callerOrBrowserMaterialAccepted: z.literal(false),
  runtimeReleaseGpuRouteModelImageCommandOrPriceAccepted: z.literal(false),
  workDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  publishedAt: timestamp,
}).strict()
const recordSchema = recordWithoutHashSchema.extend({
  sourcePublicationRef: refSchema.extend({ version: z.literal(1) }).strict(),
  sourcePublicationHash: sha256,
}).strict()
export type CanonicalSam31ApprovedTrackAllTaskSourceRecord = z.infer<
  typeof recordSchema
>

const sourcePublicationInputSchema = z.object({
  sourcePublicationId: safeId,
  approvedFundingObservation: z.unknown(),
  attemptStartAuthority: z.unknown(),
  bindingId: safeId,
  orchestraCall: z.unknown(),
  supportRequest: z.unknown().optional(),
  editPlanVersionId: safeId,
  editPlanVersionRef: refSchema,
  sceneId: safeId,
  sourceBindingRef: refSchema,
  sourceMedia: z.unknown(),
  approvedPrompt: z.unknown(),
  primaryRateAuthorityRef: refSchema,
  fallbackRateAuthorityRef: refSchema,
  privateTaskInputTransportRef: refSchema,
  privateTaskOutputTransportRef: refSchema,
  publishedAt: timestamp,
}).strict()
type SourcePublicationInput = z.input<typeof sourcePublicationInputSchema>

export interface CanonicalSam31ApprovedTrackAllTaskSourceRepository
  extends CanonicalSam31GpuApprovedTaskMaterialSourceReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_APPROVED_TRACK_ALL_TASK_SOURCE_REPOSITORY_VERSION
  readonly evidenceClass: 'gcs_create_only_exact_reread'
  persistApprovedTaskSourceCreateOnly(input: SourcePublicationInput): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly sourcePublicationRef: z.infer<typeof refSchema>
    readonly exactCreateOnlyRereadVerified: true
    readonly gpuJobStarted: false
    readonly customerCreditsMutated: false
  }>
}

type MaterialSourceReadInput = Parameters<
  CanonicalSam31GpuApprovedTaskMaterialSourceReadPort[
    'rereadApprovedTaskMaterialSource'
  ]
>[0]

/**
 * Durable one-writer bridge between approved Track All work and the SAM 3.1
 * funded launch composition. The launch route cannot write this repository;
 * it can only reread a record selected by the admitted snapshot/work/lease/
 * attempt tuple.
 */
export function createCanonicalSam31ApprovedTrackAllTaskSourceRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31ApprovedTrackAllTaskSourceRepository {
  if (typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function') {
    throw notReady('approved_track_all_source_object_port_invalid')
  }
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const readRecord = async (
    lookup: SourceLookup,
  ): Promise<CanonicalSam31ApprovedTrackAllTaskSourceRecord | null> => {
    const body = await input.objectPort.readExact(sourcePath(prefix, lookup))
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw conflict('approved_track_all_source_record_bytes_invalid')
    }
    let untrusted: unknown
    try {
      untrusted = JSON.parse(body.toString('utf8'))
    } catch {
      throw conflict('approved_track_all_source_record_json_invalid')
    }
    const record = assertSourceRecord(untrusted)
    if (stableAuthorityStringify(record) !== body.toString('utf8')
      || !sameLookup(sourceLookupFromScope(record.sourceScope), lookup)) {
      throw conflict('approved_track_all_source_exact_reread_invalid')
    }
    return record
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_APPROVED_TRACK_ALL_TASK_SOURCE_REPOSITORY_VERSION,
    evidenceClass: 'gcs_create_only_exact_reread' as const,
    async persistApprovedTaskSourceCreateOnly(
      untrusted: SourcePublicationInput,
    ) {
      assertPlainSerializedData(untrusted,
        'sam31_approved_track_all_source_publication_input')
      const publication = sourcePublicationInputSchema.parse(untrusted)
      const publishedAt = publication.publishedAt
      const funding = assertCanonicalProfessionalGpuApprovedFundingObservation(
        publication.approvedFundingObservation,
        publishedAt,
      )
      const attempt = assertCanonicalProfessionalGpuAttemptStartAuthority(
        publication.attemptStartAuthority,
        publishedAt,
      )
      const materialSource = buildMaterialSource(
        publication,
        funding.confirmedOutputFrame.outputFrameRef,
      )
      const sourceScope = buildSourceScope({ funding, attempt })
      assertPublicationLineage({
        funding,
        attempt,
        sourceScope,
        materialSource,
      })
      const payload = recordWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_APPROVED_TRACK_ALL_TASK_SOURCE_REPOSITORY_VERSION,
        source: 'canonical_track_all_approved_work_publication_owner',
        evidenceClass: 'gcs_create_only_exact_reread',
        sourcePublicationId: publication.sourcePublicationId,
        sourceScope,
        materialSource,
        sourceWorkApprovalAndAttemptRereadVerified: true,
        exactOrchestraSceneSourceFrameTimingAndPromptBound: true,
        callerOrBrowserMaterialAccepted: false,
        runtimeReleaseGpuRouteModelImageCommandOrPriceAccepted: false,
        workDispatched: false,
        customerCreditsMutated: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        publishedAt,
      })
      const sourcePublicationHash = sha256AuthorityValue(payload)
      const record = recordSchema.parse({
        ...payload,
        sourcePublicationRef: {
          id: payload.sourcePublicationId,
          version: 1,
          contentHash: `sha256:${sourcePublicationHash}`,
        },
        sourcePublicationHash,
      })
      const body = bodyFor(record)
      const disposition = await input.objectPort.createOnly({
        objectPath: sourcePath(prefix, sourceLookupFromScope(sourceScope)),
        body,
        contentSha256: rawHash(body),
      })
      const reread = await readRecord(sourceLookupFromScope(sourceScope))
      if (!reread || stableAuthorityStringify(reread) !==
        stableAuthorityStringify(record)) {
        throw conflict('approved_track_all_source_create_reread_mismatch')
      }
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        sourcePublicationRef: structuredClone(record.sourcePublicationRef),
        exactCreateOnlyRereadVerified: true as const,
        gpuJobStarted: false as const,
        customerCreditsMutated: false as const,
      })
    },
    async rereadApprovedTaskMaterialSource(
      untrusted: MaterialSourceReadInput,
    ) {
      assertPlainSerializedData(untrusted,
        'sam31_approved_track_all_source_read_input')
      const admission = assertCanonicalProfessionalToolGpuDispatchAdmission(
        untrusted.admission,
      )
      const target = assertCanonicalProfessionalGpuRuntimeLaunchTarget(
        untrusted.target,
      )
      const readAt = timestamp.parse(untrusted.at)
      if (admission.toolId !== 'sam3_1'
        || target.toolId !== 'sam3_1'
        || target.routeId !== admission.routeId
        || !sameRef(target.releaseRef, admission.runtimeReleaseRef)) {
        throw conflict('approved_track_all_source_launch_scope_invalid')
      }
      const lookup = sourceLookupFromAdmission(admission)
      const record = await readRecord(lookup)
      if (!record) throw notReady('approved_track_all_source_not_published')
      if (Date.parse(readAt) < Date.parse(record.publishedAt)) {
        throw conflict('approved_track_all_source_read_precedes_publication')
      }
      assertRecordMatchesAdmission(record, admission)
      const source = record.materialSource
      const binding = createCanonicalTrackAllSam31OrchestraBinding({
        bindingId: source.bindingId,
        call: source.orchestraCall,
        ...(source.supportRequest === null
          ? {}
          : { supportRequest: source.supportRequest }),
        admission,
      })
      return Object.freeze({
        trackAllOrchestraBinding: binding,
        editPlanVersionId: source.editPlanVersionId,
        editPlanVersionRef: structuredClone(source.editPlanVersionRef),
        outputId: source.outputId,
        confirmedOutputFrameRef:
          structuredClone(source.confirmedOutputFrameRef),
        sceneId: source.sceneId,
        sourceBindingRef: structuredClone(source.sourceBindingRef),
        sourceMedia: structuredClone(source.sourceMedia),
        approvedPrompt: structuredClone(source.approvedPrompt),
        primaryRateAuthorityRef:
          structuredClone(source.primaryRateAuthorityRef),
        fallbackRateAuthorityRef:
          structuredClone(source.fallbackRateAuthorityRef),
        privateTaskInputTransportRef:
          structuredClone(source.privateTaskInputTransportRef),
        privateTaskOutputTransportRef:
          structuredClone(source.privateTaskOutputTransportRef),
      })
    },
  })
}

export function createCanonicalGcsSam31ApprovedTrackAllTaskSourceRepository(
  input: {
    readonly storage?: Storage
    readonly projectId?: string
    readonly bucketName?: string
    readonly prefix?: string
  } = {},
): CanonicalSam31ApprovedTrackAllTaskSourceRepository {
  const storage = input.storage ?? new Storage({
    projectId: input.projectId ?? PROJECT_ID,
  })
  return createCanonicalSam31ApprovedTrackAllTaskSourceRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: input.bucketName ?? CONTROL_PLANE_STATE_BUCKET,
    }),
    prefix: input.prefix,
  })
}

type Funding = ReturnType<
  typeof assertCanonicalProfessionalGpuApprovedFundingObservation
>
type Attempt = ReturnType<
  typeof assertCanonicalProfessionalGpuAttemptStartAuthority
>
type MaterialSource = z.infer<typeof materialSourceSchema>
type SourceScope = z.infer<typeof sourceScopeSchema>
type SourceLookup = Pick<SourceScope,
  'workspaceId' | 'approvedSnapshotRef' | 'approvedWorkItemRef'
  | 'workerLeaseRef' | 'executionAttemptRef'>

function buildMaterialSource(
  input: SourcePublicationInput,
  confirmedOutputFrameRef: z.input<typeof refSchema>,
): MaterialSource {
  const call = parseOrchestraSkillCall(input.orchestraCall)
  const supportRequest = input.supportRequest === undefined
    ? null
    : parseSkillSupportRequest(input.supportRequest)
  return materialSourceSchema.parse({
    bindingId: input.bindingId,
    orchestraCall: call,
    supportRequest,
    editPlanVersionId: input.editPlanVersionId,
    editPlanVersionRef: input.editPlanVersionRef,
    outputId: call.scope.scopeType === 'scene' ? call.scope.outputId : '',
    confirmedOutputFrameRef,
    sceneId: input.sceneId,
    sourceBindingRef: input.sourceBindingRef,
    sourceMedia: input.sourceMedia,
    approvedPrompt: input.approvedPrompt,
    primaryRateAuthorityRef: input.primaryRateAuthorityRef,
    fallbackRateAuthorityRef: input.fallbackRateAuthorityRef,
    privateTaskInputTransportRef: input.privateTaskInputTransportRef,
    privateTaskOutputTransportRef: input.privateTaskOutputTransportRef,
  })
}

function buildSourceScope(input: {
  funding: Funding
  attempt: Attempt
}): SourceScope {
  const funding = input.funding
  const attempt = input.attempt
  return sourceScopeSchema.parse({
    ownerUserId: funding.scope.ownerUserId,
    workspaceId: funding.scope.workspaceId,
    projectId: funding.scope.projectId,
    editSessionId: funding.scope.editSessionId,
    editPlanId: funding.scope.editPlanId,
    editPlanVersion: funding.scope.editPlanVersion,
    outputId: funding.scope.outputId,
    approvedSnapshotRef: funding.approvedSnapshotRef,
    confirmedOutputFrameRef: funding.confirmedOutputFrame.outputFrameRef,
    masterTimingRef: funding.masterTimingRef,
    approvedWorkItemRef: funding.approvedWorkItem.approvedWorkItemRef,
    workerLeaseRef: attempt.workerLeaseRef,
    fundedReservationRef: funding.fundedReservationRef,
    executionAttemptRef: attempt.executionAttemptRef,
  })
}

function assertPublicationLineage(input: {
  funding: Funding
  attempt: Attempt
  sourceScope: SourceScope
  materialSource: MaterialSource
}): void {
  const { funding, attempt, sourceScope, materialSource: source } = input
  const call = parseOrchestraSkillCall(source.orchestraCall)
  const support = source.supportRequest === null
    ? null
    : parseSkillSupportRequest(source.supportRequest)
  const scene = call.scope.scopeType === 'scene' ? call.scope : null
  const prompt = canonicalSam31GpuApprovedPromptSchema.parse(
    source.approvedPrompt,
  )
  const media = canonicalSam31GpuSourceMediaSchema.parse(source.sourceMedia)
  const requiredRefs = [
    source.sourceBindingRef,
    source.confirmedOutputFrameRef,
    sourceScope.masterTimingRef,
    prompt.compiledIntentRef,
    prompt.promptApprovalRef,
    prompt.sourceFrameLineageRef,
  ]
  if (
    stableAuthorityStringify(attempt.scope) !==
      stableAuthorityStringify(funding.scope)
    || !sameRef(attempt.approvedSnapshotRef, funding.approvedSnapshotRef)
    || !sameRef(attempt.approvedWorkItemRef,
      funding.approvedWorkItem.approvedWorkItemRef)
    || call.targetSkillKey !== 'track_all'
    || call.jobType !== CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE
    || call.phase !== 'approved_execution'
    || call.idempotencyKey !== attempt.idempotencyKey
    || !sameRef(call.attemptEnvelopeRef, attempt.executionAttemptRef)
    || call.approvedSnapshotRef === null
    || !sameRef(call.approvedSnapshotRef, funding.approvedSnapshotRef)
    || !scene || !scene.completeSceneCoverageRequired
    || scene.sceneId !== source.sceneId
    || scene.outputId !== sourceScope.outputId
    || !sameRef(scene.sourceArtifactRef, media.finalizedSourceArtifactRef)
    || !sameRef(scene.selectedSceneBindingRef, source.sourceBindingRef)
    || scene.authorizedRange.startFrame !==
      media.canonicalSourceStartFrameInclusive
    || scene.authorizedRange.endFrameExclusive !==
      media.canonicalSourceEndFrameInclusive + 1
    || scene.authorizedRange.frameRate.numerator !== media.fpsNumerator
    || scene.authorizedRange.frameRate.denominator !== media.fpsDenominator
    || source.editPlanVersionRef.id !== source.editPlanVersionId
    || source.editPlanVersionRef.version !== sourceScope.editPlanVersion
    || !sameRef(source.confirmedOutputFrameRef,
      sourceScope.confirmedOutputFrameRef)
    || requiredRefs.some((required) =>
      !call.requiredEvidenceRefs.some((observed) => sameRef(observed, required)))
    || sameRef(source.primaryRateAuthorityRef, source.fallbackRateAuthorityRef)
    || (call.requestedBy.kind === 'orchestra' ? support !== null : !support)
  ) throw conflict('approved_track_all_source_lineage_invalid')
}

function assertSourceRecord(
  value: unknown,
): CanonicalSam31ApprovedTrackAllTaskSourceRecord {
  assertPlainSerializedData(value, 'sam31_approved_track_all_source_record')
  const record = recordSchema.parse(value)
  const { sourcePublicationRef, sourcePublicationHash, ...payload } = record
  if (sourcePublicationHash !== sha256AuthorityValue(payload)
    || sourcePublicationRef.id !== record.sourcePublicationId
    || sourcePublicationRef.contentHash !==
      `sha256:${sourcePublicationHash}`) {
    throw conflict('approved_track_all_source_record_digest_invalid')
  }
  return record
}

function assertRecordMatchesAdmission(
  record: CanonicalSam31ApprovedTrackAllTaskSourceRecord,
  admission: CanonicalProfessionalToolGpuDispatchAdmission,
): void {
  const scope = record.sourceScope
  if (scope.ownerUserId !== admission.scope.ownerUserId
    || scope.workspaceId !== admission.scope.workspaceId
    || scope.projectId !== admission.scope.projectId
    || scope.editSessionId !== admission.scope.editSessionId
    || scope.editPlanId !== admission.scope.editPlanId
    || scope.editPlanVersion !== admission.scope.editPlanVersion
    || !sameRef(scope.approvedSnapshotRef,
      admission.scope.approvedSnapshotRef)
    || !sameRef(scope.confirmedOutputFrameRef,
      admission.scope.confirmedOutputFrameRef)
    || !sameRef(scope.masterTimingRef, admission.scope.masterTimingRef)
    || !sameRef(scope.approvedWorkItemRef,
      admission.scope.approvedWorkItemRef)
    || !sameRef(scope.workerLeaseRef, admission.scope.workerLeaseRef)
    || !sameRef(scope.fundedReservationRef,
      admission.scope.fundedReservationRef)
    || !sameRef(scope.executionAttemptRef,
      admission.scope.executionAttemptRef)) {
    throw conflict('approved_track_all_source_admission_mismatch')
  }
}

function sourceLookupFromScope(scope: SourceScope): SourceLookup {
  return {
    workspaceId: scope.workspaceId,
    approvedSnapshotRef: scope.approvedSnapshotRef,
    approvedWorkItemRef: scope.approvedWorkItemRef,
    workerLeaseRef: scope.workerLeaseRef,
    executionAttemptRef: scope.executionAttemptRef,
  }
}

function sourceLookupFromAdmission(
  admission: CanonicalProfessionalToolGpuDispatchAdmission,
): SourceLookup {
  return {
    workspaceId: admission.scope.workspaceId,
    approvedSnapshotRef: admission.scope.approvedSnapshotRef,
    approvedWorkItemRef: admission.scope.approvedWorkItemRef,
    workerLeaseRef: admission.scope.workerLeaseRef,
    executionAttemptRef: admission.scope.executionAttemptRef,
  }
}

function sameLookup(left: SourceLookup, right: SourceLookup): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function sourcePath(prefix: string, lookup: SourceLookup): string {
  return `${prefix}/${createHash('sha256')
    .update(stableAuthorityStringify(lookup), 'utf8').digest('hex')}.json`
}

function bodyFor(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('approved_track_all_source_record_size_invalid')
  }
  return body
}

function rawHash(body: Buffer): string {
  return createHash('sha256').update(body).digest('hex')
}

function sameRef(
  left: z.infer<typeof refSchema>,
  right: z.infer<typeof refSchema>,
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function conflict(reason: string): ApiError {
  return new ApiError('VERSION_CONFLICT',
    `SAM 3.1 approved task source: ${reason}.`, 409)
}

function notReady(reason: string): ApiError {
  return new ApiError('TOOL_NOT_READY',
    `SAM 3.1 approved task source is unavailable: ${reason}.`, 503)
}
