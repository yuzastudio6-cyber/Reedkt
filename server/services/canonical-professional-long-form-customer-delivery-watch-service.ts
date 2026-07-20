import { ApiError } from '../errors/api-error'
import {
  professionalLongFormDeliveryQualityReviewPacketSchema,
  type ProfessionalLongFormDeliveryQualityReviewPacket,
} from '../edit-architecture/professional-long-form-customer-delivery-download-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_MAX_PLAYBACK_RATE_PERMILLE,
  PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_CLOCK_SLACK_MS,
  PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_EVIDENCE_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_IDEMPOTENCY_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_LATEST_POINTER_VERSION,
  professionalLongFormDeliveryWatchAuthoritySchema,
  professionalLongFormDeliveryWatchEvidenceSchema,
  professionalLongFormDeliveryWatchIdempotencyRecordSchema,
  professionalLongFormDeliveryWatchLatestPointerSchema,
  recordProfessionalLongFormDeliveryWatchCheckpointSchema,
  type ProfessionalLongFormDeliveryWatchAuthority,
  type ProfessionalLongFormDeliveryWatchEvidence,
  type ProfessionalLongFormDeliveryWatchIdempotencyRecord,
  type ProfessionalLongFormDeliveryWatchLatestPointer,
  type RecordProfessionalLongFormDeliveryWatchCheckpoint,
} from '../edit-architecture/professional-long-form-customer-delivery-watch-evidence-contract'
import {
  readPrivateFileIfExistsWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateFileAtomicWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import type { ServiceContext } from '../types'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_WATCH_SERVICE_VERSION =
  'canonical-professional-long-form-customer-delivery-watch-service-v1' as const

type WatchServiceOptions = {
  now?: () => number
}

type WatchInput = {
  authority: ProfessionalLongFormDeliveryWatchAuthority
}

export type CanonicalProfessionalLongFormDeliveryWatchState = {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_WATCH_SERVICE_VERSION
  source:
    'canonical_professional_long_form_customer_delivery_watch_service'
  status: 'not_started' | 'in_progress' | 'complete'
  evidence: ProfessionalLongFormDeliveryWatchEvidence | null
  acceptanceGateSatisfied: boolean
  nextSequence: number
  expectedPreviousWatchEvidenceHash: string | null
}

export function buildProfessionalLongFormDeliveryWatchAuthority(
  packetInput: ProfessionalLongFormDeliveryQualityReviewPacket,
): ProfessionalLongFormDeliveryWatchAuthority {
  const packet = professionalLongFormDeliveryQualityReviewPacketSchema.parse(
    packetInput,
  )
  const { packetHash, ...withoutHash } = packet
  if (packetHash !== sha256AuthorityValue(withoutHash)) {
    throw notReady('Customer-delivery review packet lost integrity.')
  }
  return professionalLongFormDeliveryWatchAuthoritySchema.parse({
    workspaceId: packet.identity.workspaceId,
    projectId: packet.identity.projectId,
    editSessionId: packet.identity.editSessionId,
    approvedPlanSnapshotId: packet.identity.approvedPlanSnapshotId,
    packageRecordId: packet.identity.packageRecordId,
    reviewPacketHash: packet.packetHash,
    masterSha256: packet.master.sha256,
    masterFrameCount: packet.master.frameCount,
    frameRateNumerator: packet.master.frameRateNumerator,
    frameRateDenominator: packet.master.frameRateDenominator,
  })
}

export function createCanonicalProfessionalLongFormCustomerDeliveryWatchService(
  context: ServiceContext,
  options: WatchServiceOptions = {},
) {
  const now = options.now ?? Date.now
  return {
    async inspect(input: WatchInput): Promise<
      CanonicalProfessionalLongFormDeliveryWatchState
    > {
      assertPrivateRuntime(context)
      const authority = professionalLongFormDeliveryWatchAuthoritySchema.parse(
        input.authority,
      )
      const ownerUserId = await requireWorkspaceActor(
        context,
        authority.workspaceId,
        'read',
      )
      const evidence = await readLatestEvidence({
        context,
        ownerUserId,
        authority,
      })
      return watchState(evidence)
    },

    async record(input: WatchInput & {
      idempotencyKey: string
      checkpoint: RecordProfessionalLongFormDeliveryWatchCheckpoint
    }): Promise<{
      disposition: 'recorded' | 'exact_replay'
      state: CanonicalProfessionalLongFormDeliveryWatchState
    }> {
      assertPrivateRuntime(context)
      const authority = professionalLongFormDeliveryWatchAuthoritySchema.parse(
        input.authority,
      )
      const checkpoint =
        recordProfessionalLongFormDeliveryWatchCheckpointSchema.parse(
          input.checkpoint,
        )
      assertCheckpointAuthority(authority, checkpoint)
      const ownerUserId = await requireWorkspaceActor(
        context,
        authority.workspaceId,
        'write',
      )
      const idempotencyKeyHash = hashIdempotencyKey(input.idempotencyKey)
      const checkpointRequestHash = sha256AuthorityValue(checkpoint)
      return withPrivateCooperativeFileLockWithinRoot({
        rootPath: context.env.localStorageRoot,
        relativePath: watchLockPath(ownerUserId, authority),
        operation: async () => {
          const replay = await readIdempotencyRecord({
            context,
            ownerUserId,
            authority,
            idempotencyKeyHash,
          })
          if (replay) {
            if (replay.checkpointRequestHash !== checkpointRequestHash) {
              throw conflict(
                'The watch-checkpoint idempotency key belongs to a different request.',
              )
            }
            const evidence = await readEvidenceRef({
              context,
              ownerUserId,
              authority,
              ref: replay.evidenceRef,
              expectedEvidenceHash: replay.evidenceHash,
            })
            await repairLatestPointerAfterExactReplay({
              context,
              ownerUserId,
              authority,
              evidence,
              ref: replay.evidenceRef,
            })
            return {
              disposition: 'exact_replay' as const,
              state: watchState(evidence),
            }
          }

          const previous = await readLatestEvidence({
            context,
            ownerUserId,
            authority,
          })
          if (
            previous?.idempotencyKeyHash === idempotencyKeyHash &&
            previous.checkpointRequestHash === checkpointRequestHash
          ) {
            await persistIdempotencyRecord({
              context,
              ownerUserId,
              authority,
              idempotencyKeyHash,
              checkpointRequestHash,
              evidence: previous,
            })
            return {
              disposition: 'exact_replay' as const,
              state: watchState(previous),
            }
          }
          if (previous?.acceptanceGateSatisfied) {
            throw conflict(
              'The exact customer-delivery watch evidence is already complete.',
            )
          }
          validateCheckpointProgress({ authority, checkpoint, previous })
          const observedAtMs = safeNow(now)
          const evidence = buildWatchEvidence({
            ownerUserId,
            authority,
            checkpoint,
            previous,
            observedAtMs,
            idempotencyKeyHash,
            checkpointRequestHash,
          })
          const ref = await persistEvidence(context, evidence)
          await persistIdempotencyRecord({
            context,
            ownerUserId,
            authority,
            idempotencyKeyHash,
            checkpointRequestHash,
            evidence,
            ref,
          })
          await persistLatestPointer({
            context,
            ownerUserId,
            authority,
            evidence,
            ref,
          })
          return {
            disposition: 'recorded' as const,
            state: watchState(evidence),
          }
        },
      })
    },

    async requireComplete(input: WatchInput & {
      expectedWatchEvidenceHash: string
    }): Promise<ProfessionalLongFormDeliveryWatchEvidence> {
      assertPrivateRuntime(context)
      const authority = professionalLongFormDeliveryWatchAuthoritySchema.parse(
        input.authority,
      )
      const ownerUserId = await requireWorkspaceActor(
        context,
        authority.workspaceId,
        'read',
      )
      const evidence = await readLatestEvidence({
        context,
        ownerUserId,
        authority,
      })
      if (
        !evidence ||
        evidence.evidenceHash !== input.expectedWatchEvidenceHash ||
        !evidence.acceptanceGateSatisfied ||
        !evidence.fullProgramPlaybackObserved ||
        evidence.coveredFrameCount !== authority.masterFrameCount
      ) {
        throw notReady(
          'Complete durable whole-program watch evidence is required before acceptance.',
        )
      }
      return evidence
    },
  }
}

async function repairLatestPointerAfterExactReplay(input: {
  context: ServiceContext
  ownerUserId: string
  authority: ProfessionalLongFormDeliveryWatchAuthority
  evidence: ProfessionalLongFormDeliveryWatchEvidence
  ref: AuthorityJsonBlobRef
}): Promise<void> {
  const pointer = await readLatestPointer(input)
  if (!pointer) {
    if (
      input.evidence.sequence !== 1 ||
      input.evidence.previousWatchEvidenceHash !== null
    ) throw notReady(
      'Watch replay cannot safely reconstruct a missing latest pointer.',
    )
    await persistLatestPointer(input)
    return
  }
  if (pointer.latestSequence === input.evidence.sequence) {
    if (pointer.latestEvidenceHash !== input.evidence.evidenceHash) {
      throw notReady('Watch replay conflicts with the latest pointer.')
    }
    return
  }
  if (pointer.latestSequence > input.evidence.sequence) return
  if (
    pointer.latestSequence !== input.evidence.sequence - 1 ||
    pointer.latestEvidenceHash !== input.evidence.previousWatchEvidenceHash
  ) throw notReady(
    'Watch replay is not the direct successor of the latest pointer.',
  )
  await persistLatestPointer(input)
}

function buildWatchEvidence(input: {
  ownerUserId: string
  authority: ProfessionalLongFormDeliveryWatchAuthority
  checkpoint: RecordProfessionalLongFormDeliveryWatchCheckpoint
  previous: ProfessionalLongFormDeliveryWatchEvidence | undefined
  observedAtMs: number
  idempotencyKeyHash: string
  checkpointRequestHash: string
}): ProfessionalLongFormDeliveryWatchEvidence {
  const startedAtMs = input.previous
    ? Date.parse(input.previous.startedAt)
    : input.observedAtMs
  const previousCheckpointAtMs = input.previous
    ? Date.parse(input.previous.lastCheckpointAt)
    : startedAtMs
  if (
    !Number.isFinite(startedAtMs) ||
    !Number.isFinite(previousCheckpointAtMs) ||
    input.observedAtMs < startedAtMs ||
    input.observedAtMs < previousCheckpointAtMs
  ) {
    throw conflict('Watch-checkpoint server time moved backwards.')
  }
  const serverElapsedMs = input.observedAtMs - startedAtMs
  const coveredFrameCount = coverageFrameCount(
    input.checkpoint.coveredIntervals,
  )
  const maximumCoveredFrames = Math.min(
    input.authority.masterFrameCount,
    1 + Math.floor(
      (
        (serverElapsedMs +
          PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_CLOCK_SLACK_MS) *
        input.authority.frameRateNumerator *
        PROFESSIONAL_LONG_FORM_DELIVERY_MAX_PLAYBACK_RATE_PERMILLE
      ) / (
        input.authority.frameRateDenominator * 1_000_000
      ),
    ),
  )
  if (input.previous === undefined) {
    if (
      input.checkpoint.coveredIntervals.length !== 1 ||
      input.checkpoint.coveredIntervals[0]?.startFrame !== 0 ||
      input.checkpoint.coveredIntervals[0]?.endFrameExclusive !== 1
    ) throw conflict(
      'The first watch checkpoint must start the exact master at frame zero.',
    )
  } else if (coveredFrameCount > maximumCoveredFrames) {
    throw conflict(
      'Watch coverage advanced faster than the server-observed playback ceiling.',
    )
  }
  const minimumRequiredElapsedMs = Math.ceil(
    (
      (input.authority.masterFrameCount - 1) *
      input.authority.frameRateDenominator * 1_000_000
    ) / (
      input.authority.frameRateNumerator *
      PROFESSIONAL_LONG_FORM_DELIVERY_MAX_PLAYBACK_RATE_PERMILLE
    ),
  )
  const fullProgramPlaybackObserved =
    input.checkpoint.coveredIntervals.length === 1 &&
    input.checkpoint.coveredIntervals[0]?.startFrame === 0 &&
    input.checkpoint.coveredIntervals[0]?.endFrameExclusive ===
      input.authority.masterFrameCount
  if (
    fullProgramPlaybackObserved &&
    serverElapsedMs + PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_CLOCK_SLACK_MS <
      minimumRequiredElapsedMs
  ) throw conflict(
    'Whole-program coverage arrived before the server-observed review duration.',
  )
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_EVIDENCE_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_watch_service' as const,
    purpose:
      'retain_server_validated_exact_private_customer_delivery_playback_coverage' as const,
    identity: {
      ownerUserId: input.ownerUserId,
      workspaceId: input.authority.workspaceId,
      projectId: input.authority.projectId,
      editSessionId: input.authority.editSessionId,
      approvedPlanSnapshotId: input.authority.approvedPlanSnapshotId,
      packageRecordId: input.authority.packageRecordId,
    },
    authority: {
      reviewPacketHash: input.authority.reviewPacketHash,
      masterSha256: input.authority.masterSha256,
      masterFrameCount: input.authority.masterFrameCount,
      frameRateNumerator: input.authority.frameRateNumerator,
      frameRateDenominator: input.authority.frameRateDenominator,
    },
    sequence: input.checkpoint.sequence,
    previousWatchEvidenceHash:
      input.previous?.evidenceHash ?? null,
    coveredIntervals: input.checkpoint.coveredIntervals,
    coveredFrameCount,
    coveragePermille: Math.floor(
      (coveredFrameCount * 1_000) / input.authority.masterFrameCount,
    ),
    fullProgramPlaybackObserved,
    acceptanceGateSatisfied: fullProgramPlaybackObserved,
    startedAt: new Date(startedAtMs).toISOString(),
    lastCheckpointAt: new Date(input.observedAtMs).toISOString(),
    serverElapsedMs,
    minimumRequiredElapsedMs,
    maximumPlaybackRatePermille:
      PROFESSIONAL_LONG_FORM_DELIVERY_MAX_PLAYBACK_RATE_PERMILLE,
    clockSlackMs: PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_CLOCK_SLACK_MS,
    checkpointRequestHash: input.checkpointRequestHash,
    idempotencyKeyHash: input.idempotencyKeyHash,
    browserReportedCompletionTrusted: false as const,
    privateLocalDurable: true as const,
    distributedDatabaseBacked: false as const,
    productionDurabilityProven: false as const,
  }
  return professionalLongFormDeliveryWatchEvidenceSchema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
}

function validateCheckpointProgress(input: {
  authority: ProfessionalLongFormDeliveryWatchAuthority
  checkpoint: RecordProfessionalLongFormDeliveryWatchCheckpoint
  previous: ProfessionalLongFormDeliveryWatchEvidence | undefined
}): void {
  const expectedSequence = (input.previous?.sequence ?? 0) + 1
  const expectedPreviousHash = input.previous?.evidenceHash ?? null
  if (
    input.checkpoint.sequence !== expectedSequence ||
    input.checkpoint.expectedPreviousWatchEvidenceHash !==
      expectedPreviousHash ||
    input.checkpoint.coveredIntervals.some((interval) =>
      interval.endFrameExclusive > input.authority.masterFrameCount) ||
    (
      input.previous &&
      !coverageContains(
        input.checkpoint.coveredIntervals,
        input.previous.coveredIntervals,
      )
    )
  ) throw conflict(
    'Watch checkpoint is stale, non-monotonic, or outside the exact master.',
  )
}

function assertCheckpointAuthority(
  authority: ProfessionalLongFormDeliveryWatchAuthority,
  checkpoint: RecordProfessionalLongFormDeliveryWatchCheckpoint,
): void {
  if (
    checkpoint.workspaceId !== authority.workspaceId ||
    checkpoint.approvedPlanSnapshotId !==
      authority.approvedPlanSnapshotId ||
    checkpoint.expectedReviewPacketHash !== authority.reviewPacketHash ||
    checkpoint.expectedMasterSha256 !== authority.masterSha256
  ) throw conflict(
    'Watch checkpoint does not match the exact review/master authority.',
  )
}

function watchState(
  evidence: ProfessionalLongFormDeliveryWatchEvidence | undefined,
): CanonicalProfessionalLongFormDeliveryWatchState {
  return {
    schemaVersion:
      CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_WATCH_SERVICE_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_watch_service',
    status: !evidence
      ? 'not_started'
      : evidence.acceptanceGateSatisfied
        ? 'complete'
        : 'in_progress',
    evidence: evidence ?? null,
    acceptanceGateSatisfied: evidence?.acceptanceGateSatisfied ?? false,
    nextSequence: (evidence?.sequence ?? 0) + 1,
    expectedPreviousWatchEvidenceHash: evidence?.evidenceHash ?? null,
  }
}

function coverageFrameCount(
  intervals: Array<{ startFrame: number; endFrameExclusive: number }>,
): number {
  return intervals.reduce(
    (sum, interval) =>
      sum + interval.endFrameExclusive - interval.startFrame,
    0,
  )
}

function coverageContains(
  current: Array<{ startFrame: number; endFrameExclusive: number }>,
  previous: Array<{ startFrame: number; endFrameExclusive: number }>,
): boolean {
  return previous.every((prior) => current.some((candidate) =>
    candidate.startFrame <= prior.startFrame &&
    candidate.endFrameExclusive >= prior.endFrameExclusive))
}

async function persistEvidence(
  context: ServiceContext,
  evidence: ProfessionalLongFormDeliveryWatchEvidence,
): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: context.env.localStorageRoot,
    value: evidence,
    maxBytes: 4 * 1024 * 1024,
  })
  const readBack = professionalLongFormDeliveryWatchEvidenceSchema.parse(
    await readPrivateAuthorityJsonBlob({
      localStorageRoot: context.env.localStorageRoot,
      ref,
    }),
  )
  assertEvidenceIntegrity(readBack)
  if (readBack.evidenceHash !== evidence.evidenceHash) {
    throw notReady('Watch evidence changed on private readback.')
  }
  return ref
}

async function readLatestEvidence(input: {
  context: ServiceContext
  ownerUserId: string
  authority: ProfessionalLongFormDeliveryWatchAuthority
}): Promise<ProfessionalLongFormDeliveryWatchEvidence | undefined> {
  const pointer = await readLatestPointer(input)
  if (!pointer) return undefined
  return readEvidenceRef({
    ...input,
    ref: pointer.latestEvidenceRef,
    expectedEvidenceHash: pointer.latestEvidenceHash,
  })
}

async function readEvidenceRef(input: {
  context: ServiceContext
  ownerUserId: string
  authority: ProfessionalLongFormDeliveryWatchAuthority
  ref: AuthorityJsonBlobRef
  expectedEvidenceHash: string
}): Promise<ProfessionalLongFormDeliveryWatchEvidence> {
  const evidence = professionalLongFormDeliveryWatchEvidenceSchema.parse(
    await readPrivateAuthorityJsonBlob({
      localStorageRoot: input.context.env.localStorageRoot,
      ref: input.ref,
    }),
  )
  assertEvidenceIntegrity(evidence)
  if (
    evidence.evidenceHash !== input.expectedEvidenceHash ||
    !sameWatchIdentity(evidence.identity, input.ownerUserId, input.authority) ||
    evidence.authority.reviewPacketHash !== input.authority.reviewPacketHash ||
    evidence.authority.masterSha256 !== input.authority.masterSha256 ||
    evidence.authority.masterFrameCount !== input.authority.masterFrameCount
  ) throw notReady('Stored watch evidence lost exact review authority.')
  return evidence
}

async function persistLatestPointer(input: {
  context: ServiceContext
  ownerUserId: string
  authority: ProfessionalLongFormDeliveryWatchAuthority
  evidence: ProfessionalLongFormDeliveryWatchEvidence
  ref: AuthorityJsonBlobRef
}): Promise<void> {
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_LATEST_POINTER_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_watch_service' as const,
    identity: input.evidence.identity,
    latestSequence: input.evidence.sequence,
    latestEvidenceHash: input.evidence.evidenceHash,
    latestEvidenceRef: input.ref,
  }
  const pointer = professionalLongFormDeliveryWatchLatestPointerSchema.parse({
    ...payload,
    pointerHash: sha256AuthorityValue(payload),
  })
  await writePrivateFileAtomicWithinRoot({
    rootPath: input.context.env.localStorageRoot,
    relativePath: watchLatestPath(input.ownerUserId, input.authority),
    content: Buffer.from(`${stableAuthorityStringify(pointer)}\n`, 'utf8'),
  })
  const readBack = await readLatestPointer(input)
  if (readBack?.pointerHash !== pointer.pointerHash) {
    throw notReady('Watch latest pointer changed on readback.')
  }
}

async function readLatestPointer(input: {
  context: ServiceContext
  ownerUserId: string
  authority: ProfessionalLongFormDeliveryWatchAuthority
}): Promise<ProfessionalLongFormDeliveryWatchLatestPointer | undefined> {
  const decoded = await readBoundedJsonIfExists({
    context: input.context,
    relativePath: watchLatestPath(input.ownerUserId, input.authority),
  })
  if (decoded === undefined) return undefined
  const pointer = professionalLongFormDeliveryWatchLatestPointerSchema.parse(
    decoded,
  )
  const { pointerHash, ...withoutHash } = pointer
  if (
    pointerHash !== sha256AuthorityValue(withoutHash) ||
    !sameWatchIdentity(pointer.identity, input.ownerUserId, input.authority)
  ) throw notReady('Stored watch latest pointer lost integrity.')
  return pointer
}

async function persistIdempotencyRecord(input: {
  context: ServiceContext
  ownerUserId: string
  authority: ProfessionalLongFormDeliveryWatchAuthority
  idempotencyKeyHash: string
  checkpointRequestHash: string
  evidence: ProfessionalLongFormDeliveryWatchEvidence
  ref?: AuthorityJsonBlobRef
}): Promise<void> {
  const ref = input.ref ?? await persistEvidence(input.context, input.evidence)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_IDEMPOTENCY_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_watch_service' as const,
    identity: input.evidence.identity,
    idempotencyKeyHash: input.idempotencyKeyHash,
    checkpointRequestHash: input.checkpointRequestHash,
    evidenceHash: input.evidence.evidenceHash,
    evidenceRef: ref,
  }
  const record =
    professionalLongFormDeliveryWatchIdempotencyRecordSchema.parse({
      ...payload,
      recordHash: sha256AuthorityValue(payload),
    })
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.context.env.localStorageRoot,
    relativePath: watchIdempotencyPath(
      input.ownerUserId,
      input.authority,
      input.idempotencyKeyHash,
    ),
    content: Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8'),
  })
  const readBack = await readIdempotencyRecord({
    context: input.context,
    ownerUserId: input.ownerUserId,
    authority: input.authority,
    idempotencyKeyHash: input.idempotencyKeyHash,
  })
  if (readBack?.recordHash !== record.recordHash) {
    throw notReady('Watch idempotency record changed on readback.')
  }
}

async function readIdempotencyRecord(input: {
  context: ServiceContext
  ownerUserId: string
  authority: ProfessionalLongFormDeliveryWatchAuthority
  idempotencyKeyHash: string
}): Promise<ProfessionalLongFormDeliveryWatchIdempotencyRecord | undefined> {
  const decoded = await readBoundedJsonIfExists({
    context: input.context,
    relativePath: watchIdempotencyPath(
      input.ownerUserId,
      input.authority,
      input.idempotencyKeyHash,
    ),
  })
  if (decoded === undefined) return undefined
  const record =
    professionalLongFormDeliveryWatchIdempotencyRecordSchema.parse(decoded)
  const { recordHash, ...withoutHash } = record
  if (
    recordHash !== sha256AuthorityValue(withoutHash) ||
    record.idempotencyKeyHash !== input.idempotencyKeyHash ||
    !sameWatchIdentity(record.identity, input.ownerUserId, input.authority)
  ) throw notReady('Stored watch idempotency record lost integrity.')
  return record
}

function assertEvidenceIntegrity(
  evidence: ProfessionalLongFormDeliveryWatchEvidence,
): void {
  const { evidenceHash, ...withoutHash } = evidence
  if (evidenceHash !== sha256AuthorityValue(withoutHash)) {
    throw notReady('Stored watch evidence lost integrity.')
  }
}

async function readBoundedJsonIfExists(input: {
  context: ServiceContext
  relativePath: string
}): Promise<unknown | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.context.env.localStorageRoot,
    relativePath: input.relativePath,
  })
  if (!bytes) return undefined
  if (bytes.byteLength < 2 || bytes.byteLength > 4 * 1024 * 1024) {
    throw notReady('Stored watch authority exceeds its private boundary.')
  }
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    throw notReady('Stored watch authority is not valid JSON.')
  }
}

function sameWatchIdentity(
  identity: ProfessionalLongFormDeliveryWatchEvidence['identity'],
  ownerUserId: string,
  authority: ProfessionalLongFormDeliveryWatchAuthority,
): boolean {
  return identity.ownerUserId === ownerUserId &&
    identity.workspaceId === authority.workspaceId &&
    identity.projectId === authority.projectId &&
    identity.editSessionId === authority.editSessionId &&
    identity.approvedPlanSnapshotId === authority.approvedPlanSnapshotId &&
    identity.packageRecordId === authority.packageRecordId
}

function watchScopeHash(
  ownerUserId: string,
  authority: ProfessionalLongFormDeliveryWatchAuthority,
): string {
  return sha256AuthorityValue({
    domain: 'canonical_customer_delivery_watch_scope_v1',
    ownerUserId,
    workspaceId: authority.workspaceId,
    projectId: authority.projectId,
    editSessionId: authority.editSessionId,
    approvedPlanSnapshotId: authority.approvedPlanSnapshotId,
    packageRecordId: authority.packageRecordId,
    reviewPacketHash: authority.reviewPacketHash,
    masterSha256: authority.masterSha256,
  })
}

function watchLatestPath(
  ownerUserId: string,
  authority: ProfessionalLongFormDeliveryWatchAuthority,
): string {
  const hash = watchScopeHash(ownerUserId, authority)
  return `canonical-customer-delivery-watch/private-v1/${
    hash.slice(0, 2)}/${hash}/latest.json`
}

function watchLockPath(
  ownerUserId: string,
  authority: ProfessionalLongFormDeliveryWatchAuthority,
): string {
  const hash = watchScopeHash(ownerUserId, authority)
  return `canonical-customer-delivery-watch/private-v1/${
    hash.slice(0, 2)}/${hash}/mutation.lock`
}

function watchIdempotencyPath(
  ownerUserId: string,
  authority: ProfessionalLongFormDeliveryWatchAuthority,
  idempotencyKeyHash: string,
): string {
  const hash = watchScopeHash(ownerUserId, authority)
  return `canonical-customer-delivery-watch/private-v1/${
    hash.slice(0, 2)}/${hash}/idempotency/${idempotencyKeyHash}.json`
}

function hashIdempotencyKey(value: string): string {
  const key = value.trim()
  if (key.length < 8 || key.length > 200 || /[\r\n\0]/u.test(key)) {
    throw new ApiError(
      'IDEMPOTENCY_KEY_REQUIRED',
      'A bounded idempotency key is required for the watch checkpoint.',
      400,
    )
  }
  return sha256AuthorityValue({
    domain: 'canonical_customer_delivery_watch_idempotency_v1',
    key,
  })
}

async function requireWorkspaceActor(
  context: ServiceContext,
  workspaceId: string,
  operation: 'read' | 'write',
): Promise<string> {
  const actor = getRequiredAuthUserId(context)
  const access = await authorizeWorkspaceAccess(context, workspaceId, operation)
  if (actor !== access.userId) {
    throw new ApiError(
      'WORKSPACE_ACCESS_DENIED',
      'Customer-delivery watch authority is outside this workspace.',
      403,
    )
  }
  return actor
}

function safeNow(now: () => number): number {
  const value = now()
  if (!Number.isSafeInteger(value) || value < 0) {
    throw notReady('Watch service clock is unavailable.')
  }
  return value
}

function assertPrivateRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv === 'production' ||
    (context.env.mode !== 'local' && context.env.mode !== 'mock')
  ) throw new ApiError(
    'TOOL_NOT_READY',
    'Customer-delivery watch evidence is private/local only.',
    503,
  )
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409)
}

function notReady(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409)
}
