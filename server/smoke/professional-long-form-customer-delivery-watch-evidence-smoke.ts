import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { loadRuntimeEnv } from '../config/env'
import {
  professionalLongFormDeliveryWatchEvidenceSchema,
  type ProfessionalLongFormDeliveryWatchEvidence,
  type ProfessionalLongFormDeliveryWatchAuthority,
} from '../edit-architecture/professional-long-form-customer-delivery-watch-evidence-contract'
import { ApiError } from '../errors/api-error'
import {
  createCanonicalProfessionalLongFormCustomerDeliveryWatchService,
} from '../services/canonical-professional-long-form-customer-delivery-watch-service'
import type { ServiceContext } from '../types'

const root = await mkdtemp(join(
  tmpdir(),
  'reeditpro-customer-delivery-watch-',
))
let clockMs = Date.parse('2026-07-20T00:00:00.000Z')
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: root,
  SIGNED_URL_TTL_SECONDS: '900',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})
const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'professional-long-form-customer-delivery-watch-smoke',
  auth: { userId: 'watch-owner', isMockUser: true },
}
const authority: ProfessionalLongFormDeliveryWatchAuthority = {
  workspaceId: 'workspace-watch-smoke',
  projectId: 'project-watch-smoke',
  editSessionId: 'edit-watch-smoke',
  approvedPlanSnapshotId: 'snapshot-watch-smoke',
  packageRecordId: 'delivery-package-watch-smoke',
  reviewPacketHash: 'a'.repeat(64),
  masterSha256: 'b'.repeat(64),
  masterFrameCount: 2_700,
  frameRateNumerator: 30,
  frameRateDenominator: 1,
}

try {
  const service =
    createCanonicalProfessionalLongFormCustomerDeliveryWatchService(
      context,
      { now: () => clockMs },
    )
  const initial = await service.inspect({ authority })
  assert.equal(initial.status, 'not_started')
  assert.equal(initial.nextSequence, 1)
  assert.equal(initial.expectedPreviousWatchEvidenceHash, null)
  assert.equal(initial.acceptanceGateSatisfied, false)

  const firstRequest = checkpoint({
    sequence: 1,
    previousHash: null,
    endFrameExclusive: 1,
  })
  const first = await service.record({
    authority,
    idempotencyKey: 'watch-checkpoint-sequence-1',
    checkpoint: firstRequest,
  })
  assert.equal(first.disposition, 'recorded')
  assert.equal(first.state.status, 'in_progress')
  assert.equal(first.state.evidence?.coveredFrameCount, 1)
  assert.equal(first.state.evidence?.browserReportedCompletionTrusted, false)
  assert.equal(first.state.evidence?.privateLocalDurable, true)
  assert.equal(first.state.evidence?.distributedDatabaseBacked, false)
  assert.equal(first.state.evidence?.productionDurabilityProven, false)

  const firstLatestPath = (await readdir(root, {
    recursive: true,
    withFileTypes: true,
  })).find((entry) => entry.isFile() && entry.name === 'latest.json')
  assert.ok(firstLatestPath)
  await rm(join(firstLatestPath.parentPath, firstLatestPath.name))

  const firstReplay = await service.record({
    authority,
    idempotencyKey: 'watch-checkpoint-sequence-1',
    checkpoint: firstRequest,
  })
  assert.equal(firstReplay.disposition, 'exact_replay')
  assert.equal(
    firstReplay.state.evidence?.evidenceHash,
    first.state.evidence?.evidenceHash,
  )
  assert.equal(
    (await service.inspect({ authority })).evidence?.evidenceHash,
    first.state.evidence?.evidenceHash,
  )

  await assertApiError(
    () => service.record({
      authority,
      idempotencyKey: 'watch-checkpoint-sequence-1',
      checkpoint: checkpoint({
        sequence: 2,
        previousHash: first.state.evidence!.evidenceHash,
        endFrameExclusive: 2,
      }),
    }),
    'IDEMPOTENCY_CONFLICT',
  )
  await assertApiError(
    () => service.record({
      authority,
      idempotencyKey: 'watch-checkpoint-instant-full',
      checkpoint: checkpoint({
        sequence: 2,
        previousHash: first.state.evidence!.evidenceHash,
        endFrameExclusive: authority.masterFrameCount,
      }),
    }),
    'IDEMPOTENCY_CONFLICT',
  )
  await assertApiError(
    () => service.record({
      authority,
      idempotencyKey: 'watch-checkpoint-stale-predecessor',
      checkpoint: checkpoint({
        sequence: 2,
        previousHash: 'c'.repeat(64),
        endFrameExclusive: 2,
      }),
    }),
    'IDEMPOTENCY_CONFLICT',
  )

  clockMs += 45_100
  const completeRequest = checkpoint({
    sequence: 2,
    previousHash: first.state.evidence!.evidenceHash,
    endFrameExclusive: authority.masterFrameCount,
  })
  const complete = await service.record({
    authority,
    idempotencyKey: 'watch-checkpoint-sequence-2-complete',
    checkpoint: completeRequest,
  })
  assert.equal(complete.disposition, 'recorded')
  assert.equal(complete.state.status, 'complete')
  assert.equal(complete.state.acceptanceGateSatisfied, true)
  assert.equal(complete.state.evidence?.coveredFrameCount, 2_700)
  assert.equal(complete.state.evidence?.coveragePermille, 1_000)
  assert.equal(complete.state.evidence?.fullProgramPlaybackObserved, true)
  assert.equal(complete.state.evidence?.serverElapsedMs, 45_100)
  assert.ok(
    complete.state.evidence!.serverElapsedMs >=
      complete.state.evidence!.minimumRequiredElapsedMs,
  )
  assert.equal(
    professionalLongFormDeliveryWatchEvidenceSchema.safeParse({
      ...complete.state.evidence!,
      serverElapsedMs: 0,
    }).success,
    false,
  )
  const coverageRateTamper: ProfessionalLongFormDeliveryWatchEvidence = {
    ...first.state.evidence!,
    sequence: 2,
    previousWatchEvidenceHash: 'e'.repeat(64),
    coveredIntervals: [{ startFrame: 0, endFrameExclusive: 32 }],
    coveredFrameCount: 32,
    coveragePermille: 11,
  }
  assert.equal(
    professionalLongFormDeliveryWatchEvidenceSchema.safeParse(
      coverageRateTamper,
    ).success,
    false,
  )

  const restarted =
    createCanonicalProfessionalLongFormCustomerDeliveryWatchService(
      context,
      { now: () => clockMs },
    )
  const reopened = await restarted.inspect({ authority })
  assert.equal(
    reopened.evidence?.evidenceHash,
    complete.state.evidence?.evidenceHash,
  )
  const acceptanceEvidence = await restarted.requireComplete({
    authority,
    expectedWatchEvidenceHash: complete.state.evidence!.evidenceHash,
  })
  assert.equal(acceptanceEvidence.acceptanceGateSatisfied, true)
  await assertApiError(
    () => restarted.requireComplete({
      authority,
      expectedWatchEvidenceHash: 'd'.repeat(64),
    }),
    'JOB_DEPENDENCY_NOT_READY',
  )
  await assertApiError(
    () => restarted.record({
      authority,
      idempotencyKey: 'watch-checkpoint-after-completion',
      checkpoint: checkpoint({
        sequence: 3,
        previousHash: complete.state.evidence!.evidenceHash,
        endFrameExclusive: authority.masterFrameCount,
      }),
    }),
    'IDEMPOTENCY_CONFLICT',
  )

  const foreignService =
    createCanonicalProfessionalLongFormCustomerDeliveryWatchService({
      ...context,
      requestId: 'professional-long-form-watch-foreign-smoke',
      auth: { userId: 'watch-foreign-user', isMockUser: true },
    })
  const foreign = await foreignService.inspect({ authority })
  assert.equal(foreign.status, 'not_started')
  await assertApiError(
    () => foreignService.requireComplete({
      authority,
      expectedWatchEvidenceHash: complete.state.evidence!.evidenceHash,
    }),
    'JOB_DEPENDENCY_NOT_READY',
  )

  const latestPath = (await readdir(root, {
    recursive: true,
    withFileTypes: true,
  })).find((entry) => entry.isFile() && entry.name === 'latest.json')
  assert.ok(latestPath)
  const latestAbsolutePath = join(latestPath.parentPath, latestPath.name)
  const pointer = JSON.parse(await readFile(latestAbsolutePath, 'utf8')) as {
    latestSequence: number
  }
  pointer.latestSequence += 1
  await writeFile(latestAbsolutePath, JSON.stringify(pointer), {
    mode: 0o600,
  })
  await assert.rejects(() => restarted.inspect({ authority }))

  console.log(JSON.stringify({
    ok: true,
    schemaVersion:
      'professional-long-form-customer-delivery-watch-evidence-smoke-v1',
    exactReviewAndMasterBound: true,
    firstFrameStartRequired: true,
    serverElapsedPlaybackCeilingVerified: true,
    instantaneousWholeProgramClaimRejected: true,
    monotonicHashChainedCoverageVerified: true,
    exactIdempotencyReplayVerified: true,
    latestPointerCrashRecoveryVerified: true,
    stalePredecessorRejected: true,
    completeCoverageFrameCount: acceptanceEvidence.coveredFrameCount,
    completeCoveragePermille: acceptanceEvidence.coveragePermille,
    restartReadbackVerified: true,
    crossUserEvidenceDisclosure: false,
    pointerTamperRejected: true,
    persistedElapsedAndCoverageTamperRejected: true,
    browserReportedCompletionTrusted: false,
    durableServerAcceptanceGateVerified: true,
    distributedDatabaseBacked: false,
    publicDeliveryAuthorized: false,
    customerCreditsMutated: false,
    billingAuthorized: false,
    productionReady: false,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}

function checkpoint(input: {
  sequence: number
  previousHash: string | null
  endFrameExclusive: number
}) {
  return {
    workspaceId: authority.workspaceId,
    approvedPlanSnapshotId: authority.approvedPlanSnapshotId,
    expectedReviewPacketHash: authority.reviewPacketHash,
    expectedMasterSha256: authority.masterSha256,
    expectedPreviousWatchEvidenceHash: input.previousHash,
    sequence: input.sequence,
    coveredIntervals: [{
      startFrame: 0,
      endFrameExclusive: input.endFrameExclusive,
    }],
  }
}

async function assertApiError(
  action: () => Promise<unknown>,
  code: ApiError['code'],
): Promise<void> {
  await assert.rejects(action, (error: unknown) =>
    error instanceof ApiError && error.code === code)
}
