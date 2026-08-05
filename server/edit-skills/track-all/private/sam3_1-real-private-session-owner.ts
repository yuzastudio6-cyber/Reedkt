import { z } from 'zod'

import type { EditSkillArtifactReference } from '../../core/edit-skill-artifact-store'
import type { SkillRouteQualificationRegistry } from '../../core/skill-route-qualification'
import {
  deepFreezeSkillValue,
  hashSkillValue,
  skillManifestReference,
} from '../../core/skill-capability-manifest-hash'
import { skillSha256Schema } from '../../core/skill-capability-manifest-schema'
import type { TrackAllSam31RuntimeProfileV2 } from '../track-all-planning-authorities'
import {
  trackAllSam31RuntimeProfileV2Schema,
} from '../track-all-planning-authorities'
import { TRACK_ALL_CAPABILITY_MANIFEST } from '../track-all-capability-manifest'
import {
  assertTrackAllSam31MaskletSessionPlan,
  createTrackAllSam31MaskletAttemptEvidence,
  createTrackAllSam31MaskletOutputManifest,
  type TrackAllSam31MaskletSessionPlan,
} from './sam3_1-track-masklets-operation'
import {
  trackAllSam31V2RouteGateReportSchema,
  type TrackAllSam31V2RouteGateReport,
} from './sam3_1-v2-route-qualification-gate'
import {
  TRACK_ALL_SAM31_REAL_PRIVATE_RUNTIME_AUTHORITY,
  TRACK_ALL_SAM31_REAL_PRIVATE_SESSION_OWNER_VERSION,
  TRACK_ALL_SAM31_REAL_PRIVATE_WORKER_PROTOCOL_VERSION,
} from './sam3_1-real-private-runtime-identity'

export {
  TRACK_ALL_SAM31_REAL_PRIVATE_RUNTIME_AUTHORITY,
  TRACK_ALL_SAM31_REAL_PRIVATE_SESSION_OWNER_VERSION,
  TRACK_ALL_SAM31_REAL_PRIVATE_WORKER_PROTOCOL_VERSION,
} from './sam3_1-real-private-runtime-identity'
export const TRACK_ALL_SAM31_REAL_PRIVATE_SESSION_RECEIPT_VERSION =
  'track_all_sam3_1_real_private_session_receipt_v1' as const

const safeId = z.string().trim().min(1).max(180)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const objectId = z.string().regex(/^object_[0-9]{3}$/u)

const privateObjectSchema = z.object({
  objectId,
  privateObjectRef: z.object({
    artifactType: z.literal('private_mask_sequence_binary_v1'),
    sha256: skillSha256Schema,
    byteLength: z.number().int().positive().safe(),
    ownerUserId: safeId,
    workspaceId: safeId,
    projectId: safeId,
  }).strict(),
  frameCount: z.number().int().positive().max(240),
  width: z.number().int().positive().max(16_384),
  height: z.number().int().positive().max(16_384),
  pixelFormat: z.enum(['gray8', 'gray16']),
  maskSequenceSha256: skillSha256Schema,
}).strict()

const workerResponseCoreSchema = z.object({
  schemaVersion: z.literal(TRACK_ALL_SAM31_REAL_PRIVATE_WORKER_PROTOCOL_VERSION),
  operationId: z.literal('tool.sam3_1.track_masklets.v2'),
  adapterClass: z.literal('canonical_private_execution_adapter'),
  evidenceClass: z.literal('canonical_private_reread'),
  sessionPlanHash: skillSha256Schema,
  assignmentHash: skillSha256Schema,
  runtimeProfileHash: skillSha256Schema,
  routeGateReportHash: skillSha256Schema,
  sourceRevision: z.literal('96914d2425f90a64f45ca977c2b5165418099543'),
  checkpointRevision: z.literal('daa63191845a41281374e725f4c9e51c7a824460'),
  checkpointSha256: skillSha256Schema,
  runtimeImageDigest: prefixedSha256,
  accelerator: z.enum(['nvidia_a100_80gb', 'nvidia_l4']),
  terminalDisposition: z.enum([
    'completed', 'failed', 'cancelled', 'timed_out',
    'reconciliation_required', 'partial_output',
  ]),
  exactAttemptReconciled: z.boolean(),
  sourceCheckpointStrictLoadObserved: z.boolean(),
  cudaInferenceObserved: z.boolean(),
  modelSubmissionCount: z.literal(1),
  objects: z.array(privateObjectSchema).max(16),
  terminalObservedAt: timestamp,
  close: z.object({
    closeOperation: z.literal('close_session'),
    closeAttempted: z.literal(true),
    closeCompleted: z.literal(true),
    closeObservedAt: timestamp,
    gpuMemoryReleaseRequested: z.literal(true),
  }).strict(),
  rawUserChatIncluded: z.literal(false),
  callerSelectedModelModuleClassCheckpointCommandGpuEndpointPathUrlRetryFallbackOrPriceAccepted:
    z.literal(false),
  automaticRetryCount: z.literal(0),
  automaticAlternateModelFallbackCount: z.literal(0),
  publicArtifactCount: z.literal(0),
  productionMutationCount: z.literal(0),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const completed = value.terminalDisposition === 'completed'
  if (completed !== (value.objects.length > 0)) context.addIssue({
    code: 'custom',
    message: 'Only a completed real SAM session may return private masklets.',
  })
  if (completed && (!value.sourceCheckpointStrictLoadObserved ||
    !value.cudaInferenceObserved)) context.addIssue({
    code: 'custom',
    message: 'Completed real SAM output requires strict load and CUDA inference.',
  })
  if (value.terminalDisposition === 'reconciliation_required' &&
    value.exactAttemptReconciled) context.addIssue({
    code: 'custom',
    message: 'An unresolved real SAM outcome cannot claim reconciliation.',
  })
  if (Date.parse(value.close.closeObservedAt) <
    Date.parse(value.terminalObservedAt)) context.addIssue({
    code: 'custom',
    message: 'Real SAM close evidence predates its terminal observation.',
  })
})

export const trackAllSam31RealPrivateWorkerResponseSchema =
  workerResponseCoreSchema.extend({ responseHash: skillSha256Schema })
    .strict().superRefine((value, context) => {
      const { responseHash, ...core } = value
      if (responseHash !== hashSkillValue(core)) context.addIssue({
        code: 'custom', message: 'Real SAM worker response is stale or forged.',
      })
    })

export type TrackAllSam31RealPrivateWorkerResponse = z.infer<
  typeof trackAllSam31RealPrivateWorkerResponseSchema
>

export interface TrackAllSam31RealPrivateWorkerPort {
  readonly protocolVersion:
    typeof TRACK_ALL_SAM31_REAL_PRIVATE_WORKER_PROTOCOL_VERSION
  readonly adapterClass: 'canonical_private_execution_adapter'
  readonly operationId: 'tool.sam3_1.track_masklets.v2'
  /**
   * Runs one server-owned plan. The worker resolves the opaque source lease to
   * its fixed private mount; this method accepts no path, URL, model, GPU,
   * command, checkpoint, retry, fallback, or price from a caller.
   */
  executeSession(input: {
    plan: TrackAllSam31MaskletSessionPlan
    runtimeProfile: TrackAllSam31RuntimeProfileV2
    routeGateReport: TrackAllSam31V2RouteGateReport
  }): Promise<unknown>
  /**
   * Reconciles the exact attempt and issues idempotent close. It may never
   * submit model work. An unresolved reconciliation must reject.
   */
  reconcileAndCloseExactAttempt(input: {
    plan: TrackAllSam31MaskletSessionPlan
    runtimeProfile: TrackAllSam31RuntimeProfileV2
    routeGateReport: TrackAllSam31V2RouteGateReport
    reason: 'transport_failure' | 'timeout' | 'cancellation'
  }): Promise<unknown>
}

export interface TrackAllSam31RealPrivateSessionPersistence {
  readonly storageClass: 'durable_private'
  createAttempt(input: {
    sessionId: string
    sessionPlanHash: string
    assignmentHash: string
    executionAttemptHash: string
    workerLeaseHash: string
  }): Promise<'created' | 'already_exists'>
  putMaskletManifestCreateOnly(input: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    value: unknown
  }): Promise<EditSkillArtifactReference>
}

const realSessionReceiptCoreSchema = z.object({
  schemaVersion: z.literal(TRACK_ALL_SAM31_REAL_PRIVATE_SESSION_RECEIPT_VERSION),
  sessionOwnerVersion: z.literal(
    TRACK_ALL_SAM31_REAL_PRIVATE_SESSION_OWNER_VERSION,
  ),
  runtimeAuthorityHash: z.literal(
    TRACK_ALL_SAM31_REAL_PRIVATE_RUNTIME_AUTHORITY.authorityHash,
  ),
  operationId: z.literal('tool.sam3_1.track_masklets.v2'),
  sessionPlanHash: skillSha256Schema,
  assignmentHash: skillSha256Schema,
  runtimeProfileHash: skillSha256Schema,
  routeGateReportHash: skillSha256Schema,
  workerResponseHash: skillSha256Schema,
  terminalDisposition: z.enum([
    'completed', 'failed', 'cancelled', 'timed_out',
    'reconciliation_required', 'partial_output',
  ]),
  exactAttemptReconciled: z.boolean(),
  outputManifestRef: z.object({
    artifactType: z.string().min(1),
    sha256: skillSha256Schema,
    byteLength: z.number().int().nonnegative().safe(),
    ownerUserId: safeId,
    workspaceId: safeId,
    projectId: safeId,
  }).strict().nullable(),
  attemptEvidenceHash: skillSha256Schema.nullable(),
  closeCompleted: z.literal(true),
  actualSamRequestCount: z.literal(1),
  actualGpuExecutionCount: z.union([z.literal(0), z.literal(1)]),
  injectedEvidenceUsed: z.literal(false),
  publicArtifactCount: z.literal(0),
  productionMutationCount: z.literal(0),
  productionQualified: z.literal(false),
}).strict().superRefine((value, context) => {
  const completed = value.terminalDisposition === 'completed'
  if (completed !== (value.outputManifestRef !== null &&
    value.attemptEvidenceHash !== null && value.actualGpuExecutionCount === 1)) {
    context.addIssue({
      code: 'custom',
      message: 'Real SAM completion receipt lost output or inference evidence.',
    })
  }
})

export const trackAllSam31RealPrivateSessionReceiptSchema =
  realSessionReceiptCoreSchema.extend({ receiptHash: skillSha256Schema })
    .strict().superRefine((value, context) => {
      const { receiptHash, ...core } = value
      if (receiptHash !== hashSkillValue(core)) context.addIssue({
        code: 'custom', message: 'Real SAM session receipt is stale or forged.',
      })
    })

export type TrackAllSam31RealPrivateSessionReceipt = z.infer<
  typeof trackAllSam31RealPrivateSessionReceiptSchema
>

export interface TrackAllSam31RealPrivateSessionResult {
  receipt: TrackAllSam31RealPrivateSessionReceipt
  attemptEvidence: ReturnType<
    typeof createTrackAllSam31MaskletAttemptEvidence
  > | null
  outputManifest: ReturnType<
    typeof createTrackAllSam31MaskletOutputManifest
  > | null
  outputManifestRef: EditSkillArtifactReference | null
}

/**
 * One submission followed only by exact reconciliation on transport failure.
 * Kept separate so lifecycle behavior is testable without fabricating passed
 * model or route evidence.
 */
export async function executeOrReconcileTrackAllSam31ExactAttempt(input: {
  execute: () => Promise<unknown>
  reconcileAndClose: () => Promise<unknown>
}): Promise<unknown> {
  try {
    return await input.execute()
  } catch {
    return input.reconcileAndClose()
  }
}

/**
 * Real private SAM owner. It cannot be constructed from fixture evidence and
 * it does not contain an in-memory or injected execution escape hatch.
 */
export class TrackAllSam31RealPrivateSessionOwner {
  readonly #persistence: TrackAllSam31RealPrivateSessionPersistence
  readonly #worker: TrackAllSam31RealPrivateWorkerPort
  readonly #runtimeProfile: TrackAllSam31RuntimeProfileV2
  readonly #routeGateReport: TrackAllSam31V2RouteGateReport

  constructor(input: {
    persistence: TrackAllSam31RealPrivateSessionPersistence
    worker: TrackAllSam31RealPrivateWorkerPort
    runtimeProfile: unknown
    routeGateReport: unknown
    routeQualificationRegistry: SkillRouteQualificationRegistry
  }) {
    const profile = trackAllSam31RuntimeProfileV2Schema.parse(
      input.runtimeProfile,
    )
    const gate = trackAllSam31V2RouteGateReportSchema.parse(
      input.routeGateReport,
    )
    if (input.persistence.storageClass !== 'durable_private' ||
      input.worker.protocolVersion !==
        TRACK_ALL_SAM31_REAL_PRIVATE_WORKER_PROTOCOL_VERSION ||
      input.worker.adapterClass !== 'canonical_private_execution_adapter' ||
      input.worker.operationId !== 'tool.sam3_1.track_masklets.v2' ||
      profile.operationId !== input.worker.operationId ||
      profile.qualification.routeGateReportHash !== gate.reportHash ||
      profile.qualification.environmentClass !== 'canonical_private' ||
      profile.qualification.status !== 'internal_execution_qualified' ||
      !profile.qualification.internalExecutionAuthorized ||
      gate.routeQualificationStatus !== 'internal_execution_qualified' ||
      !gate.internalExecutionAuthorized || gate.checkpointSha256 === null) {
      throw new Error(
        'Real private SAM 3.1 V2 owner is unavailable until every exact route gate is qualified.',
      )
    }
    const routeReceipt = input.routeQualificationRegistry.resolveReceipt({
      manifestRef: skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST),
      routeKey: 'sam3_1_masklet_route',
      environmentClass: 'canonical_private',
    })
    if (routeReceipt.receiptHash !== profile.qualification.routeReceiptHash ||
      routeReceipt.qualificationStatus !== 'internal_execution_qualified' ||
      routeReceipt.evidenceClass !== 'actual_canonical_private_evidence' ||
      routeReceipt.fixtureEvidenceOnly ||
      routeReceipt.qualificationCandidateOnly ||
      routeReceipt.providerRequestCount < 1 ||
      routeReceipt.gpuExecutionCount < 1) {
      throw new Error(
        'Real private SAM 3.1 V2 owner requires the exact current evidence-backed route receipt.',
      )
    }
    this.#persistence = input.persistence
    this.#worker = input.worker
    this.#runtimeProfile = profile
    this.#routeGateReport = gate
  }

  async execute(input: {
    plan: unknown
  }): Promise<TrackAllSam31RealPrivateSessionResult> {
    const plan = assertTrackAllSam31MaskletSessionPlan(input.plan)
    const created = await this.#persistence.createAttempt({
      sessionId: plan.sessionId,
      sessionPlanHash: plan.sessionPlanHash,
      assignmentHash: plan.assignmentHash,
      executionAttemptHash: hashSkillValue(plan.executionAttemptRef),
      workerLeaseHash: hashSkillValue(plan.workerLeaseRef),
    })
    if (created !== 'created') {
      throw new Error(
        'Real SAM attempt already exists; exact reconciliation is required and resubmission is forbidden.',
      )
    }

    const rawResponse = await executeOrReconcileTrackAllSam31ExactAttempt({
      execute: () => this.#worker.executeSession({
        plan,
        runtimeProfile: this.#runtimeProfile,
        routeGateReport: this.#routeGateReport,
      }),
      reconcileAndClose: () =>
        this.#worker.reconcileAndCloseExactAttempt({
        plan,
        runtimeProfile: this.#runtimeProfile,
        routeGateReport: this.#routeGateReport,
        reason: 'transport_failure',
        }),
    })
    const response = this.#assertWorkerResponse({ plan, value: rawResponse })
    return this.#projectResult({ plan, response })
  }

  #assertWorkerResponse(input: {
    plan: TrackAllSam31MaskletSessionPlan
    value: unknown
  }): TrackAllSam31RealPrivateWorkerResponse {
    const response = trackAllSam31RealPrivateWorkerResponseSchema.parse(
      input.value,
    )
    const expectedCheckpoint = this.#routeGateReport.checkpointSha256
    const expectedFrameCount = input.plan.source.chunkRange.endFrameExclusive -
      input.plan.source.chunkRange.startFrameInclusive
    if (response.sessionPlanHash !== input.plan.sessionPlanHash ||
      response.assignmentHash !== input.plan.assignmentHash ||
      response.runtimeProfileHash !== this.#runtimeProfile.profileHash ||
      response.routeGateReportHash !== this.#routeGateReport.reportHash ||
      response.checkpointSha256 !== expectedCheckpoint ||
      response.runtimeImageDigest !==
        this.#runtimeProfile.runtimeImage.immutableImageDigest ||
      response.objects.some((item) =>
        !input.plan.targetGroup.objectIds.includes(item.objectId) ||
        item.frameCount !== expectedFrameCount ||
        item.privateObjectRef.sha256 !== item.maskSequenceSha256 ||
        item.privateObjectRef.ownerUserId !== input.plan.ownerUserId ||
        item.privateObjectRef.workspaceId !== input.plan.workspaceId ||
        item.privateObjectRef.projectId !== input.plan.projectId) ||
      new Set(response.objects.map((item) => item.objectId)).size !==
        response.objects.length) {
      throw new Error(
        'Real SAM worker response differs from exact route, tenant, object, or range authority.',
      )
    }
    return response
  }

  async #projectResult(input: {
    plan: TrackAllSam31MaskletSessionPlan
    response: TrackAllSam31RealPrivateWorkerResponse
  }): Promise<TrackAllSam31RealPrivateSessionResult> {
    const { plan, response } = input
    let outputManifest: TrackAllSam31RealPrivateSessionResult['outputManifest'] = null
    let outputManifestRef: EditSkillArtifactReference | null = null
    let attemptEvidence: TrackAllSam31RealPrivateSessionResult['attemptEvidence'] = null
    if (response.terminalDisposition === 'completed') {
      if (response.objects.length !== plan.targetGroup.objectIds.length) {
        throw new Error('Real SAM output does not cover the exact approved object set.')
      }
      outputManifest = createTrackAllSam31MaskletOutputManifest({
        schemaVersion: 'track_all_sam3_1_masklet_output_manifest_v2',
        operationId: plan.operationId,
        sessionId: plan.sessionId,
        sessionPlanHash: plan.sessionPlanHash,
        assignmentId: plan.assignmentId,
        assignmentHash: plan.assignmentHash,
        ownerUserId: plan.ownerUserId,
        workspaceId: plan.workspaceId,
        projectId: plan.projectId,
        editSessionId: plan.editSessionId,
        authorizedRange: plan.source.authorizedRange,
        chunkRange: plan.source.chunkRange,
        objects: response.objects,
        privateBinaryOnly: true,
        createOnlyPersistence: true,
        publicUrlPresent: false,
        injectedTestOnly: false,
      })
      outputManifestRef = await this.#persistence.putMaskletManifestCreateOnly({
        ownerUserId: plan.ownerUserId,
        workspaceId: plan.workspaceId,
        projectId: plan.projectId,
        value: outputManifest,
      })
      const closeCore = {
        closeOperation: 'close_session' as const,
        closeAttempted: true as const,
        closeCompleted: true as const,
        closeObservedAt: response.close.closeObservedAt,
        terminalObservedAt: response.terminalObservedAt,
        sessionId: plan.sessionId,
        assignmentHash: plan.assignmentHash,
        sessionPlanHash: plan.sessionPlanHash,
        gpuMemoryReleaseRequested: true as const,
      }
      attemptEvidence = createTrackAllSam31MaskletAttemptEvidence({
        schemaVersion: 'track_all_sam3_1_masklet_attempt_evidence_v2',
        operationId: plan.operationId,
        sessionPlanHash: plan.sessionPlanHash,
        assignmentHash: plan.assignmentHash,
        executionAttemptRef: plan.executionAttemptRef,
        evidenceClass: 'real_private_sam3_1_inference',
        terminalDisposition: 'completed',
        exactAttemptReconciled: response.exactAttemptReconciled,
        sourceCheckpointStrictLoadObserved:
          response.sourceCheckpointStrictLoadObserved,
        cudaInferenceObserved: response.cudaInferenceObserved,
        outputMaskletManifestRef: outputManifestRef,
        closeEvidence: {
          ...closeCore,
          closeEvidenceHash: hashSkillValue(closeCore),
        },
        providerRequestCount: 1,
        publicArtifactCount: 0,
        productionMutationCount: 0,
        customerCreditsMutated: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
      })
    }
    const core = realSessionReceiptCoreSchema.parse({
      schemaVersion: TRACK_ALL_SAM31_REAL_PRIVATE_SESSION_RECEIPT_VERSION,
      sessionOwnerVersion: TRACK_ALL_SAM31_REAL_PRIVATE_SESSION_OWNER_VERSION,
      runtimeAuthorityHash:
        TRACK_ALL_SAM31_REAL_PRIVATE_RUNTIME_AUTHORITY.authorityHash,
      operationId: plan.operationId,
      sessionPlanHash: plan.sessionPlanHash,
      assignmentHash: plan.assignmentHash,
      runtimeProfileHash: this.#runtimeProfile.profileHash,
      routeGateReportHash: this.#routeGateReport.reportHash,
      workerResponseHash: response.responseHash,
      terminalDisposition: response.terminalDisposition,
      exactAttemptReconciled: response.exactAttemptReconciled,
      outputManifestRef,
      attemptEvidenceHash: attemptEvidence?.evidenceHash ?? null,
      closeCompleted: true,
      actualSamRequestCount: 1,
      actualGpuExecutionCount: response.cudaInferenceObserved ? 1 : 0,
      injectedEvidenceUsed: false,
      publicArtifactCount: 0,
      productionMutationCount: 0,
      productionQualified: false,
    })
    const receipt = trackAllSam31RealPrivateSessionReceiptSchema.parse({
      ...core,
      receiptHash: hashSkillValue(core),
    })
    return deepFreezeSkillValue({
      receipt,
      attemptEvidence,
      outputManifest,
      outputManifestRef,
    })
  }
}
