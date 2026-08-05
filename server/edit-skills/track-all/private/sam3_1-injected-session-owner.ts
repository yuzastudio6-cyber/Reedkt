import { createHash } from 'node:crypto'

import { z } from 'zod'

import type { EditSkillArtifactReference } from '../../core/edit-skill-artifact-store'
import {
  deepFreezeSkillValue,
  hashSkillValue,
} from '../../core/skill-capability-manifest-hash'
import { skillSha256Schema } from '../../core/skill-capability-manifest-schema'
import {
  assertTrackAllSam31MaskletAttemptEvidence,
  assertTrackAllSam31MaskletSessionPlan,
  createTrackAllSam31MaskletAttemptEvidence,
  createTrackAllSam31MaskletOutputManifest,
  TRACK_ALL_SAM31_MASKLET_ATTEMPT_EVIDENCE_VERSION,
  trackAllSam31MaskletOutputManifestSchema,
  type TrackAllSam31MaskletSessionPlan,
} from './sam3_1-track-masklets-operation'
import {
  trackAllSam31V2RouteGateReportSchema,
} from './sam3_1-v2-route-qualification-gate'

export const TRACK_ALL_SAM31_SESSION_EVENT_VERSION =
  'track_all_sam3_1_session_event_v1' as const

const safeId = z.string().trim().min(1).max(180)
const timestamp = z.string().datetime({ offset: true })

const sessionEventCoreSchema = z.object({
  schemaVersion: z.literal(TRACK_ALL_SAM31_SESSION_EVENT_VERSION),
  sessionId: safeId,
  sessionPlanHash: skillSha256Schema,
  assignmentHash: skillSha256Schema,
  workerLeaseHash: skillSha256Schema,
  sequence: z.number().int().positive().max(10_000),
  eventType: z.enum([
    'start_session',
    'add_prompt',
    'propagate',
    'remove_object',
    'reset_session',
    'cancel_session',
    'persist_private_output',
    'terminal_observed',
    'close_session',
  ]),
  plannedActionSequence: z.number().int().positive().nullable(),
  disposition: z.enum([
    'applied',
    'completed',
    'failed',
    'cancelled',
    'timed_out',
    'reconciliation_required',
    'partial_output',
  ]),
  observedAt: timestamp,
  injectedTestOnly: z.literal(true),
  providerRequestCount: z.literal(0),
  publicArtifactCount: z.literal(0),
  productionMutationCount: z.literal(0),
}).strict()

export const trackAllSam31SessionEventSchema = sessionEventCoreSchema.extend({
  eventHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { eventHash, ...core } = value
  if (eventHash !== hashSkillValue(core)) context.addIssue({
    code: 'custom', message: 'SAM 3.1 session event hash is invalid.',
  })
})

export type TrackAllSam31SessionEvent = z.infer<
  typeof trackAllSam31SessionEventSchema
>

export interface TrackAllSam31PrivateSessionPersistence {
  readonly storageClass: 'internal_in_memory' | 'durable_private'
  createSession(input: {
    sessionId: string
    sessionPlanHash: string
    assignmentHash: string
    writerLeaseHash: string
  }): Promise<'created' | 'already_exists'>
  appendEventCreateOnly(event: TrackAllSam31SessionEvent):
    Promise<'created' | 'already_exists'>
  putPrivateBinaryCreateOnly(input: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    bytes: Buffer
  }): Promise<EditSkillArtifactReference>
  putMaskletManifestCreateOnly(input: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    value: unknown
  }): Promise<EditSkillArtifactReference>
  readEvents(sessionId: string): Promise<readonly TrackAllSam31SessionEvent[]>
}

interface SessionRecord {
  sessionPlanHash: string
  assignmentHash: string
  writerLeaseHash: string
}

/** Internal fixture storage only. Production construction must inject durable storage. */
export class InMemoryTrackAllSam31PrivateSessionPersistence
implements TrackAllSam31PrivateSessionPersistence {
  readonly storageClass = 'internal_in_memory' as const
  readonly #sessions = new Map<string, SessionRecord>()
  readonly #events = new Map<string, TrackAllSam31SessionEvent>()
  readonly #binaries = new Map<string, Buffer>()
  readonly #manifests = new Map<string, unknown>()

  async createSession(input: {
    sessionId: string
    sessionPlanHash: string
    assignmentHash: string
    writerLeaseHash: string
  }): Promise<'created' | 'already_exists'> {
    const existing = this.#sessions.get(input.sessionId)
    if (existing) {
      if (hashSkillValue(existing) !== hashSkillValue({
        sessionPlanHash: input.sessionPlanHash,
        assignmentHash: input.assignmentHash,
        writerLeaseHash: input.writerLeaseHash,
      })) throw new Error('SAM 3.1 session already has another writer authority.')
      return 'already_exists'
    }
    this.#sessions.set(input.sessionId, {
      sessionPlanHash: skillSha256Schema.parse(input.sessionPlanHash),
      assignmentHash: skillSha256Schema.parse(input.assignmentHash),
      writerLeaseHash: skillSha256Schema.parse(input.writerLeaseHash),
    })
    return 'created'
  }

  async appendEventCreateOnly(
    input: TrackAllSam31SessionEvent,
  ): Promise<'created' | 'already_exists'> {
    const event = trackAllSam31SessionEventSchema.parse(input)
    const session = this.#sessions.get(event.sessionId)
    if (!session || session.sessionPlanHash !== event.sessionPlanHash ||
      session.assignmentHash !== event.assignmentHash ||
      session.writerLeaseHash !== event.workerLeaseHash) {
      throw new Error('SAM 3.1 event differs from its one-writer session.')
    }
    const key = `${event.sessionId}:${event.sequence}`
    const existing = this.#events.get(key)
    if (existing) {
      if (existing.eventHash !== event.eventHash) {
        throw new Error('SAM 3.1 create-only event sequence collided.')
      }
      return 'already_exists'
    }
    this.#events.set(key, structuredClone(event))
    return 'created'
  }

  async putPrivateBinaryCreateOnly(input: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    bytes: Buffer
  }): Promise<EditSkillArtifactReference> {
    if (!Buffer.isBuffer(input.bytes) || input.bytes.byteLength === 0 ||
      input.bytes.byteLength > 128 * 1024 * 1024) {
      throw new Error('Injected mask sequence bytes exceed their private bound.')
    }
    const sha256 = createHash('sha256').update(input.bytes).digest('hex')
    const reference = {
      artifactType: 'private_mask_sequence_binary_v1',
      sha256,
      byteLength: input.bytes.byteLength,
      ownerUserId: safeId.parse(input.ownerUserId),
      workspaceId: safeId.parse(input.workspaceId),
      projectId: safeId.parse(input.projectId),
    }
    const key = hashSkillValue(reference)
    const existing = this.#binaries.get(key)
    if (existing && !existing.equals(input.bytes)) {
      throw new Error('Private mask sequence content-address collision.')
    }
    this.#binaries.set(key, Buffer.from(input.bytes))
    return reference
  }

  async putMaskletManifestCreateOnly(input: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    value: unknown
  }): Promise<EditSkillArtifactReference> {
    const value = trackAllSam31MaskletOutputManifestSchema.parse(input.value)
    if (value.ownerUserId !== input.ownerUserId ||
      value.workspaceId !== input.workspaceId ||
      value.projectId !== input.projectId) {
      throw new Error('SAM 3.1 masklet manifest is cross-tenant.')
    }
    const reference = {
      artifactType: 'track_all_sam3_1_masklet_output_manifest_v2',
      sha256: hashSkillValue(value),
      byteLength: Buffer.byteLength(JSON.stringify(value), 'utf8'),
      ownerUserId: value.ownerUserId,
      workspaceId: value.workspaceId,
      projectId: value.projectId,
    }
    const key = hashSkillValue(reference)
    const existing = this.#manifests.get(key)
    if (existing && hashSkillValue(existing) !== hashSkillValue(value)) {
      throw new Error('SAM 3.1 masklet manifest content-address collision.')
    }
    this.#manifests.set(key, structuredClone(value))
    return reference
  }

  async readEvents(sessionId: string):
  Promise<readonly TrackAllSam31SessionEvent[]> {
    safeId.parse(sessionId)
    return [...this.#events.values()]
      .filter((event) => event.sessionId === sessionId)
      .sort((left, right) => left.sequence - right.sequence)
      .map((event) => structuredClone(event))
  }
}

export interface InjectedMaskletObject {
  objectId: string
  bytes: Buffer
  frameCount: number
  width: number
  height: number
  pixelFormat: 'gray8' | 'gray16'
}

export interface TrackAllSam31InjectedSessionResult {
  attemptEvidence: ReturnType<
    typeof createTrackAllSam31MaskletAttemptEvidence
  >
  outputManifest: ReturnType<
    typeof createTrackAllSam31MaskletOutputManifest
  > | null
  outputManifestRef: EditSkillArtifactReference | null
  events: readonly TrackAllSam31SessionEvent[]
}

export class TrackAllSam31InjectedSessionOwner {
  readonly #persistence: TrackAllSam31PrivateSessionPersistence
  readonly #now: () => string
  readonly #results = new Map<string, TrackAllSam31InjectedSessionResult>()

  constructor(input: {
    persistence: TrackAllSam31PrivateSessionPersistence
    now?: () => string
  }) {
    if (input.persistence.storageClass !== 'internal_in_memory') {
      throw new Error('Injected SAM session owner requires internal fixture storage.')
    }
    this.#persistence = input.persistence
    this.#now = input.now ?? (() => new Date().toISOString())
  }

  async execute(input: {
    plan: unknown
    injectedObjects: readonly InjectedMaskletObject[]
    failAtPlannedActionSequence?: number
    forcedTerminalDispositionAfterActions?:
      | 'timed_out'
      | 'reconciliation_required'
      | 'partial_output'
  }): Promise<TrackAllSam31InjectedSessionResult> {
    const plan = assertTrackAllSam31MaskletSessionPlan(input.plan)
    const replay = this.#results.get(plan.sessionPlanHash)
    if (replay) return structuredClone(replay)
    const writerAuthorityHash = hashSkillValue(plan.workerLeaseRef)
    if (await this.#persistence.createSession({
      sessionId: plan.sessionId,
      sessionPlanHash: plan.sessionPlanHash,
      assignmentHash: plan.assignmentHash,
      writerLeaseHash: writerAuthorityHash,
    }) !== 'created') throw new Error(
      'SAM 3.1 session already exists; exact reconciliation is required.',
    )

    let eventSequence = 0
    let terminalDisposition:
      | 'completed'
      | 'failed'
      | 'cancelled'
      | 'timed_out'
      | 'reconciliation_required'
      | 'partial_output' = 'completed'
    let terminalObservedAt: string
    let outputManifest: TrackAllSam31InjectedSessionResult['outputManifest'] = null
    let outputManifestRef: EditSkillArtifactReference | null = null
    const append = async (inputEvent: {
      eventType: TrackAllSam31SessionEvent['eventType']
      plannedActionSequence: number | null
      disposition: TrackAllSam31SessionEvent['disposition']
      observedAt?: string
    }) => {
      const core = sessionEventCoreSchema.parse({
        schemaVersion: TRACK_ALL_SAM31_SESSION_EVENT_VERSION,
        sessionId: plan.sessionId,
        sessionPlanHash: plan.sessionPlanHash,
        assignmentHash: plan.assignmentHash,
        workerLeaseHash: writerAuthorityHash,
        sequence: ++eventSequence,
        ...inputEvent,
        observedAt: inputEvent.observedAt ?? this.#now(),
        injectedTestOnly: true,
        providerRequestCount: 0,
        publicArtifactCount: 0,
        productionMutationCount: 0,
      })
      const event = trackAllSam31SessionEventSchema.parse({
        ...core,
        eventHash: hashSkillValue(core),
      })
      if (await this.#persistence.appendEventCreateOnly(event) !== 'created') {
        throw new Error('SAM 3.1 event replay requires reconciliation.')
      }
    }

    try {
      for (const action of plan.actions) {
        if (input.failAtPlannedActionSequence === action.sequence) {
          throw new Error('injected_session_failure')
        }
        await append({
          eventType: action.action,
          plannedActionSequence: action.sequence,
          disposition: action.action === 'cancel_session'
            ? 'cancelled'
            : 'applied',
        })
        if (action.action === 'cancel_session') {
          terminalDisposition = 'cancelled'
          break
        }
      }
      if (terminalDisposition === 'completed' &&
        input.forcedTerminalDispositionAfterActions) {
        terminalDisposition = input.forcedTerminalDispositionAfterActions
      }
      if (terminalDisposition === 'completed') {
        const objects = await this.#persistInjectedObjects({
          plan,
          injectedObjects: input.injectedObjects,
        })
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
          objects,
          privateBinaryOnly: true,
          createOnlyPersistence: true,
          publicUrlPresent: false,
          injectedTestOnly: true,
        })
        outputManifestRef = await this.#persistence
          .putMaskletManifestCreateOnly({
            ownerUserId: plan.ownerUserId,
            workspaceId: plan.workspaceId,
            projectId: plan.projectId,
            value: outputManifest,
          })
        await append({
          eventType: 'persist_private_output',
          plannedActionSequence: null,
          disposition: 'completed',
        })
      }
    } catch {
      terminalDisposition = 'failed'
      outputManifest = null
      outputManifestRef = null
    } finally {
      terminalObservedAt = this.#now()
      await append({
        eventType: 'terminal_observed',
        plannedActionSequence: null,
        disposition: terminalDisposition,
        observedAt: terminalObservedAt,
      })
      await append({
        eventType: 'close_session',
        plannedActionSequence: null,
        disposition: terminalDisposition,
      })
    }

    const events = await this.#persistence.readEvents(plan.sessionId)
    const close = events.at(-1)
    if (!close || close.eventType !== 'close_session') {
      throw new Error('Injected SAM session did not close.')
    }
    const closeCore = {
      closeOperation: 'close_session' as const,
      closeAttempted: true as const,
      closeCompleted: true as const,
      closeObservedAt: close.observedAt,
      terminalObservedAt,
      sessionId: plan.sessionId,
      assignmentHash: plan.assignmentHash,
      sessionPlanHash: plan.sessionPlanHash,
      gpuMemoryReleaseRequested: true as const,
    }
    const attemptEvidence = createTrackAllSam31MaskletAttemptEvidence({
      schemaVersion: TRACK_ALL_SAM31_MASKLET_ATTEMPT_EVIDENCE_VERSION,
      operationId: plan.operationId,
      sessionPlanHash: plan.sessionPlanHash,
      assignmentHash: plan.assignmentHash,
      executionAttemptRef: plan.executionAttemptRef,
      evidenceClass: 'injected_masklets_test_only',
      terminalDisposition,
      exactAttemptReconciled:
        terminalDisposition !== 'reconciliation_required',
      sourceCheckpointStrictLoadObserved: false,
      cudaInferenceObserved: false,
      outputMaskletManifestRef: outputManifestRef,
      closeEvidence: {
        ...closeCore,
        closeEvidenceHash: hashSkillValue(closeCore),
      },
      providerRequestCount: 0,
      publicArtifactCount: 0,
      productionMutationCount: 0,
      customerCreditsMutated: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionAuthorityGranted: false,
    })
    assertTrackAllSam31MaskletAttemptEvidence({
      plan,
      evidence: attemptEvidence,
      requiredEvidenceClass: 'injected_masklets_test_only',
    })
    const result = deepFreezeSkillValue({
      attemptEvidence,
      outputManifest,
      outputManifestRef,
      events,
    })
    this.#results.set(plan.sessionPlanHash, result)
    return structuredClone(result)
  }

  async #persistInjectedObjects(input: {
    plan: TrackAllSam31MaskletSessionPlan
    injectedObjects: readonly InjectedMaskletObject[]
  }) {
    const expected = input.plan.targetGroup.objectIds
    if (input.injectedObjects.length !== expected.length ||
      new Set(input.injectedObjects.map((object) => object.objectId)).size !==
        input.injectedObjects.length ||
      input.injectedObjects.some((object) => !expected.includes(object.objectId))) {
      throw new Error('Injected masklet objects differ from the session budget.')
    }
    const exactFrameCount = input.plan.source.chunkRange.endFrameExclusive -
      input.plan.source.chunkRange.startFrameInclusive
    return Promise.all(input.injectedObjects.map(async (object) => {
      if (object.frameCount !== exactFrameCount || object.width < 1 ||
        object.height < 1 || object.width > 16_384 || object.height > 16_384) {
        throw new Error('Injected masklet geometry differs from the exact chunk.')
      }
      const privateObjectRef = await this.#persistence
        .putPrivateBinaryCreateOnly({
          ownerUserId: input.plan.ownerUserId,
          workspaceId: input.plan.workspaceId,
          projectId: input.plan.projectId,
          bytes: object.bytes,
        })
      return {
        objectId: object.objectId,
        privateObjectRef,
        frameCount: object.frameCount,
        width: object.width,
        height: object.height,
        pixelFormat: object.pixelFormat,
        maskSequenceSha256: privateObjectRef.sha256,
      }
    }))
  }
}

export function assertTrackAllSam31CanonicalPrivateSessionAvailable(input: {
  routeGateReport: unknown
  persistence: TrackAllSam31PrivateSessionPersistence
}): never {
  const routeGateReport = trackAllSam31V2RouteGateReportSchema.parse(
    input.routeGateReport,
  )
  if (input.persistence.storageClass !== 'durable_private' ||
    !routeGateReport.internalExecutionAuthorized ||
    routeGateReport.routeQualificationStatus !==
      'internal_execution_qualified') throw new Error(
    'Canonical private SAM 3.1 V2 session runtime is not qualified.',
  )
  throw new Error(
    'Canonical private SAM 3.1 V2 adapter is intentionally unavailable until real route evidence is integrated.',
  )
}
