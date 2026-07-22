import assert from 'node:assert/strict'
import { createHmac, randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  prepareEditReferenceLongFormStudyRun,
} from '../edit-references/edit-reference-long-form-study-binding'
import {
  createEditReferenceLongFormStudyPlan,
  createEditReferenceLongFormStudyRun,
} from '../edit-references/edit-reference-long-form-study-contract'
import { ApiError } from '../errors/api-error'
import {
  calculateTargetVideoEditBriefDigest,
} from '../services/edit-reference-target-video-understanding-service'
import {
  createEditReferenceCanonicalV3LocalExactEditBriefRuntimePortFactory,
} from '../services/edit-reference-canonical-v3-local-exact-edit-brief-runtime-port-factory'
import {
  createEditReferenceCanonicalV3LocalLongFormRuntimePortFactory,
} from '../services/edit-reference-canonical-v3-local-long-form-runtime-port-factory'

const endpointOrigin = requiredEnvironment('REEDITPRO_CANONICAL_V3_API_URL')
const anonKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_ANON_KEY')
const jwtSecret = requiredEnvironment('REEDITPRO_CANONICAL_V3_JWT_SECRET')
assert.equal(endpointOrigin, 'http://127.0.0.1:57431')

const ownerA = '11111111-1111-4111-8111-111111111111'
const ownerB = '22222222-2222-4222-8222-222222222222'
const workspaceA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const projectA = 'aaaaaaaa-1000-4000-8000-000000000001'
const editSessionA = 'aaaaaaaa-2000-4000-8000-000000000001'
const editReferenceA = 'aaaaaaaa-3000-4000-8000-000000000001'
const studySessionA = 'aaaaaaaa-4000-4000-8000-000000000001'
const sourceStorageObjectRecordId = randomUUID()
const sourceMediaAssetId = randomUUID()
const ownerAToken = createLocalAuthenticatedJwt(ownerA, jwtSecret)
const ownerBToken = createLocalAuthenticatedJwt(ownerB, jwtSecret)
const exactBriefFactory =
  createEditReferenceCanonicalV3LocalExactEditBriefRuntimePortFactory({
    endpointOrigin,
    anonKey,
    localInternalSigningSecret: jwtSecret,
  })
const briefPortA = exactBriefFactory.createForAuthenticatedRequest({
  env: localRuntimeEnv(),
  authority: {
    ownerUserId: ownerA,
    authenticatedAccessToken: ownerAToken,
    isMockUser: false,
  },
})
const saveKey = `exact-brief-save:${randomUUID()}`
const first = await briefPortA.save({
  workspaceId: workspaceA,
  projectId: projectA,
  editSessionId: editSessionA,
  briefText: 'Preserve testimony, source order, and factual context.',
  sourceStorageObjectRecordId,
  sourceMediaAssetId,
  idempotencyKey: saveKey,
})
assert.equal(first.disposition, 'inserted')
assert.equal(first.record.revisionNumber, 1)
assert.equal(first.record.persistenceAuthority, 'canonical_v3_local_supabase_rls')
assert.equal(first.record.supabaseWriteMade, true)
assert.equal(first.record.remoteMutationMade, false)
assert.match(first.record.contentDigestSha256, /^[a-f0-9]{64}$/u)

const replay = await briefPortA.save({
  workspaceId: workspaceA,
  projectId: projectA,
  editSessionId: editSessionA,
  briefText: 'Preserve testimony, source order, and factual context.',
  sourceStorageObjectRecordId,
  sourceMediaAssetId,
  idempotencyKey: saveKey,
})
assert.equal(replay.disposition, 'idempotent_replay')
assert.deepEqual(replay.record, first.record)

const revised = await briefPortA.save({
  workspaceId: workspaceA,
  projectId: projectA,
  editSessionId: editSessionA,
  briefText: 'Preserve testimony, source order, factual context, and natural pauses.',
  sourceStorageObjectRecordId,
  sourceMediaAssetId,
  idempotencyKey: `exact-brief-save:${randomUUID()}`,
})
assert.equal(revised.record.revisionNumber, 2)
assert.notEqual(revised.record.id, first.record.id)
assert.equal(
  calculateTargetVideoEditBriefDigest(revised.record),
  revised.record.contentDigestSha256,
)
assert.deepEqual(await briefPortA.read({
  workspaceId: workspaceA,
  projectId: projectA,
  editSessionId: editSessionA,
}), revised.record)

const briefPortB = exactBriefFactory.createForAuthenticatedRequest({
  env: localRuntimeEnv(),
  authority: {
    ownerUserId: ownerB,
    authenticatedAccessToken: ownerBToken,
    isMockUser: false,
  },
})
await assert.rejects(
  () => briefPortB.read({
    workspaceId: workspaceA,
    projectId: projectA,
    editSessionId: editSessionA,
  }),
  isPersistenceBlock,
)

const createdAt = new Date().toISOString()
const targetSourceAssetId = randomUUID()
const plan = createEditReferenceLongFormStudyPlan({
  workspaceId: workspaceA,
  editReferenceId: editReferenceA,
  studySessionId: studySessionA,
  source: {
    privateMediaArtifactId: sourceStorageObjectRecordId,
    mediaChecksumSha256: 'a'.repeat(64),
    durationSeconds: 2 * 60 * 60,
    sizeBytes: 80 * 1024 ** 3,
    mimeType: 'video/mp4',
    hasAudio: true,
  },
  includeCaptionOcr: true,
  createdAt,
})
const runId = `canonical-target-${randomUUID()}`
const preparedRun = prepareEditReferenceLongFormStudyRun({
  plan,
  run: createEditReferenceLongFormStudyRun({ runId, plan, createdAt }),
  ingestIntegrityDigestSha256: 'b'.repeat(64),
  mediaProbeDigestSha256: 'c'.repeat(64),
  mediaProbeObservedWallClockMs: 4_200,
  now: createdAt,
})
const longFormFactory = createEditReferenceCanonicalV3LocalLongFormRuntimePortFactory({
  endpointOrigin,
  anonKey,
  localInternalSigningSecret: jwtSecret,
})
const longFormRuntime = longFormFactory.createForAuthenticatedRequest({
  env: localRuntimeEnv(),
  authority: {
    ownerUserId: ownerA,
    authenticatedAccessToken: ownerAToken,
    isMockUser: false,
  },
})
const sourceBinding = {
  sourceAuthority: 'target_source_media' as const,
  sourceAssetId: targetSourceAssetId,
  sourceStorageObjectRecordId,
  sourceMediaAssetId,
  sourceStorageObjectId: `workspaces/${workspaceA}/source/${sourceMediaAssetId}.mp4`,
  sourceStorageGeneration: '1',
  sourceStorageEtag: 'target-etag-a',
  targetProjectId: projectA,
  targetEditSessionId: editSessionA,
  targetEditBriefId: revised.record.id,
  targetEditBriefRevision: revised.record.revisionNumber,
  targetEditBriefDigestSha256: revised.record.contentDigestSha256,
}
const created = await longFormRuntime.create({
  scope: {
    localStorageRoot: join(tmpdir(), 'reeditpro-canonical-v3-target-source-smoke'),
    ownerUserId: ownerA,
    workspaceId: workspaceA,
  },
  plan,
  run: preparedRun,
  sourceBinding,
})
assert.equal(created.disposition, 'created')
assert.equal(created.run.state, 'running')
assert.equal(created.run.workItems.filter((item) => item.status === 'completed').length, 2)
const replayedCreate = await longFormRuntime.create({
  scope: {
    localStorageRoot: join(tmpdir(), 'reeditpro-canonical-v3-target-source-smoke'),
    ownerUserId: ownerA,
    workspaceId: workspaceA,
  },
  plan,
  run: preparedRun,
  sourceBinding,
})
assert.equal(replayedCreate.disposition, 'idempotent_replay')
assert.equal(replayedCreate.run.recordDigestSha256, created.run.recordDigestSha256)

const rawRegistryResponse = await fetch(
  `${endpointOrigin}/rest/v1/preference_assets?id=eq.${encodeURIComponent(targetSourceAssetId)}&select=id`,
  {
    headers: {
      accept: 'application/json',
      apikey: anonKey,
      authorization: `Bearer ${ownerAToken}`,
    },
    signal: AbortSignal.timeout(15_000),
  },
)
assert.equal(rawRegistryResponse.status, 403)

const longFormRuntimeB = longFormFactory.createForAuthenticatedRequest({
  env: localRuntimeEnv(),
  authority: {
    ownerUserId: ownerB,
    authenticatedAccessToken: ownerBToken,
    isMockUser: false,
  },
})
await assert.rejects(
  () => longFormRuntimeB.create({
    scope: {
      localStorageRoot: join(tmpdir(), 'reeditpro-canonical-v3-target-source-smoke'),
      ownerUserId: ownerB,
      workspaceId: workspaceA,
    },
    plan,
    run: preparedRun,
    sourceBinding,
  }),
  isAtomicityBlock,
)

const tamperedCreatedAt = new Date(Date.parse(createdAt) + 1_000).toISOString()
const tamperedPlan = createEditReferenceLongFormStudyPlan({
  workspaceId: workspaceA,
  editReferenceId: editReferenceA,
  studySessionId: studySessionA,
  source: plan.source,
  includeCaptionOcr: true,
  createdAt: tamperedCreatedAt,
})
await assert.rejects(
  () => longFormRuntime.create({
    scope: {
      localStorageRoot: join(tmpdir(), 'reeditpro-canonical-v3-target-source-smoke'),
      ownerUserId: ownerA,
      workspaceId: workspaceA,
    },
    plan: tamperedPlan,
    run: prepareEditReferenceLongFormStudyRun({
      plan: tamperedPlan,
      run: createEditReferenceLongFormStudyRun({
        runId: `canonical-target-tampered-${randomUUID()}`,
        plan: tamperedPlan,
        createdAt: tamperedCreatedAt,
      }),
      ingestIntegrityDigestSha256: 'b'.repeat(64),
      mediaProbeDigestSha256: 'c'.repeat(64),
      mediaProbeObservedWallClockMs: 4_200,
      now: tamperedCreatedAt,
    }),
    sourceBinding: {
      ...sourceBinding,
      sourceAssetId: randomUUID(),
      targetEditBriefDigestSha256: 'f'.repeat(64),
    },
  }),
  isAtomicityBlock,
)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: 'edit-reference-canonical-v3-exact-edit-target-source-smoke-v1',
  exactBriefRevisionCount: revised.record.revisionNumber,
  exactBriefReplayVerified: true,
  exactBriefCrossTenantReadDenied: true,
  targetSourceRegisteredIntoExistingQueueAuthority: true,
  targetSourceExactReplayVerified: true,
  targetSourceRawRegistryBrowserReadDenied: true,
  targetSourceCrossTenantMutationDenied: true,
  targetSourceBriefTamperRejected: true,
  workItemCount: preparedRun.workItems.length,
  preflightCheckpointCount: 2,
  secondQueueCreated: false,
  providerCallMade: false,
  workerDispatchPerformed: false,
  remoteMutationAllowed: false,
  productionAuthority: false,
}, null, 2))

function localRuntimeEnv() {
  return {
    nodeEnv: 'test',
    mode: 'local',
    storageMode: 'local',
    workerRuntimeMode: 'mock',
  } as Parameters<
    typeof exactBriefFactory.createForAuthenticatedRequest
  >[0]['env']
}

function createLocalAuthenticatedJwt(subject: string, secret: string): string {
  const now = Math.floor(Date.now() / 1_000)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    aud: 'authenticated',
    exp: now + 900,
    iat: now,
    role: 'authenticated',
    sub: subject,
  })).toString('base64url')
  const unsigned = `${header}.${payload}`
  return `${unsigned}.${createHmac('sha256', secret)
    .update(unsigned)
    .digest('base64url')}`
}

function isPersistenceBlock(error: unknown): boolean {
  return error instanceof ApiError
    && error.code === 'EDIT_REFERENCE_PERSISTENCE_BLOCKED'
}

function isAtomicityBlock(error: unknown): boolean {
  return error instanceof ApiError
    && error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED'
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`canonical_v3_exact_target_environment_missing:${name}`)
  return value
}
