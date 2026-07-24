import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createLocalInternalProjectHandoff } from '../../src/lib/local-project-handoff'
import type {
  ApplyMotionStudioCommandRequest,
  CreateMotionStudioArtifactVersionRequest,
} from '../../src/types/motion-studio'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import {
  assertMotionStudioCommandRepositoryRuntimePortIsNotProduction,
  createPrivateLocalMotionStudioCommandRepository,
  createPrivateLocalMotionStudioCommandRepositoryRuntimePort,
  createMotionStudioCommandService,
  type MotionStudioCommandRepositoryRuntimePort,
} from '../motion-studio/commands'
import { clearInternalEditStateMemoryForSmoke, createInternalEditStateService } from '../services/internal-edit-state-service'
import { clearLocalProjectMemoryForSmoke, createProjectService } from '../services/project-service'
import type { ServiceContext } from '../types'

const ownerUserId = '11111111-1111-4111-8111-111111111111'
const otherUserId = '22222222-2222-4222-8222-222222222222'
const workspaceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const otherWorkspaceId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const editSessionId = 'storytelling-edit-private-local-command-smoke'
const root = await mkdtemp(join(tmpdir(), 'reeditpro-motion-command-smoke-'))
const membershipServer = createServer((request, response) => {
  const bearer = request.headers.authorization
  const userId = bearer === 'Bearer owner-token'
    ? ownerUserId
    : bearer === 'Bearer other-token'
      ? otherUserId
      : undefined
  const workspace = userId === ownerUserId
    ? workspaceId
    : userId === otherUserId
      ? otherWorkspaceId
      : undefined
  response.statusCode = userId ? 200 : 401
  response.setHeader('content-type', 'application/json')
  response.end(JSON.stringify(workspace ? [{
    workspace_id: workspace,
    user_id: userId,
    role: 'owner',
  }] : { error: 'unauthorized' }))
})
membershipServer.listen(0, '127.0.0.1')
await once(membershipServer, 'listening')
const address = membershipServer.address()
assert.ok(address && typeof address === 'object')

const env = loadRuntimeEnv({
  ...process.env,
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  E2E_RUNTIME_MODE: 'local',
  LOCAL_STORAGE_ROOT: root,
  NODE_ENV: 'test',
  STORAGE_MODE: 'local',
  SUPABASE_ANON_KEY: 'public-local-smoke-key',
  SUPABASE_URL: `http://127.0.0.1:${address.port}`,
  WORKER_RUNTIME_MODE: 'mock',
})
const runtimePort =
  createPrivateLocalMotionStudioCommandRepositoryRuntimePort(
    createPrivateLocalMotionStudioCommandRepository,
  )
assert.doesNotThrow(() =>
  assertMotionStudioCommandRepositoryRuntimePortIsNotProduction(runtimePort))

try {
  const owner = context(ownerUserId, 'owner-token', runtimePort)
  const mockOwner = mockContext(ownerUserId)
  const other = context(otherUserId, 'other-token', runtimePort)

  const project = (await createProjectService(owner).createProject({
    workspaceId,
    name: 'Signed-in private Storytelling production',
  })).project
  assert.match(project.id, /^[a-f0-9-]{36}$/u)
  assert.equal(project.id.startsWith('project_'), false)

  const handoff = createLocalInternalProjectHandoff({
    category: 'storytelling',
    editName: 'Private Storytelling edit',
    editSessionId,
    productWorkflow: 'motion_studio.storytelling',
    projectId: project.id,
    projectName: project.name,
    workspaceId,
  })
  await createInternalEditStateService(mockOwner).saveInternalEditState({
    workspaceId,
    projectId: project.id,
    editSessionId,
    handoff: structuredClone(handoff) as unknown as Record<string, unknown>,
    idempotencyKey: 'seed-storytelling-handoff',
  })

  const service = createMotionStudioCommandService(owner)
  const created = await service.createProduction(
    project.id,
    editSessionId,
    {
      moduleId: 'storytelling',
      moduleCatalogVersion: 'motion-studio-module-catalog-v1',
    },
    'create-private-storytelling-production',
  )
  const production = created.data.production
  assert.equal(production.projectId, project.id)
  assert.equal(production.editSessionId, editSessionId)
  assert.equal(production.localCandidateOnly, true)

  const replayed = await service.createProduction(
    project.id,
    editSessionId,
    {
      moduleId: 'storytelling',
      moduleCatalogVersion: 'motion-studio-module-catalog-v1',
    },
    'create-private-storytelling-production',
  )
  assert.equal(replayed.data.production.id, production.id)

  const artifactRequest = productionBriefRequest({
    editSessionId,
    productionId: production.id,
    projectId: project.id,
    workspaceId,
    title: 'Initial private Storytelling brief',
  })
  const artifactResult = await service.createInitialArtifactVersion(
    production.id,
    artifactRequest,
    'create-private-production-brief',
  )
  const artifact = artifactResult.data.artifact
  assert.ok(artifact.currentDraft)
  const exactArtifactReplay = await service.createInitialArtifactVersion(
    production.id,
    artifactRequest,
    'create-private-production-brief',
  )
  assert.equal(exactArtifactReplay.data.artifact.id, artifact.id)
  await expectApiError(
    () => service.createInitialArtifactVersion(
      production.id,
      productionBriefRequest({
        editSessionId,
        productionId: production.id,
        projectId: project.id,
        workspaceId,
        title: 'Changed content under the same key',
      }),
      'create-private-production-brief',
    ),
    'IDEMPOTENCY_CONFLICT',
  )

  const base = artifact.currentDraft!
  const command: ApplyMotionStudioCommandRequest = {
    baseVersionId: base.id,
    baseVersionDigest: base.contentDigest,
    operations: [{
      operationId: 'set-private-brief-title',
      kind: 'set_property',
      targetPath: '/data/title',
      value: 'Revised private Storytelling brief',
    }],
    reason: 'Prove durable local Motion command CAS.',
  }
  const applied = await service.applyCommand(
    production.id,
    artifact.id,
    command,
    'apply-private-production-brief',
  )
  assert.equal(applied.data.result.status, 'applied')
  const appliedReplay = await service.applyCommand(
    production.id,
    artifact.id,
    command,
    'apply-private-production-brief',
  )
  assert.deepEqual(appliedReplay.data.result, applied.data.result)
  await expectApiError(
    () => service.applyCommand(
      production.id,
      artifact.id,
      {
        ...command,
        operations: [{
          ...command.operations[0]!,
          value: 'Different request under the same command key',
        }],
      },
      'apply-private-production-brief',
    ),
    'IDEMPOTENCY_CONFLICT',
  )

  const latest = (await service.getArtifact(
    production.id,
    artifact.id,
  )).data.artifact.currentDraft
  assert.ok(latest)
  const raceCommand = (suffix: string): ApplyMotionStudioCommandRequest => ({
    baseVersionId: latest.id,
    baseVersionDigest: latest.contentDigest,
    operations: [{
      operationId: `set-private-brief-title-${suffix}`,
      kind: 'set_property',
      targetPath: '/data/title',
      value: `Concurrent revision ${suffix}`,
    }],
    reason: `Prove single-host CAS ${suffix}.`,
  })
  const race = await Promise.all([
    service.applyCommand(
      production.id,
      artifact.id,
      raceCommand('a'),
      'apply-private-production-brief-race-a',
    ),
    service.applyCommand(
      production.id,
      artifact.id,
      raceCommand('b'),
      'apply-private-production-brief-race-b',
    ),
  ])
  assert.equal(
    race.filter((result) => result.data.result.status === 'applied').length,
    1,
  )
  assert.equal(
    race.filter((result) => result.data.result.status === 'conflict').length,
    1,
  )

  clearLocalProjectMemoryForSmoke()
  clearInternalEditStateMemoryForSmoke()
  const restarted = createMotionStudioCommandService(
    context(ownerUserId, 'owner-token', runtimePort),
  )
  const restartedProduction = await restarted.getProduction(
    project.id,
    editSessionId,
  )
  assert.equal(restartedProduction.data.production.id, production.id)
  const restartedArtifact = await restarted.getArtifact(
    production.id,
    artifact.id,
  )
  assert.equal(
    restartedArtifact.data.artifact.currentDraft?.versionNumber,
    base.versionNumber + 2,
  )

  await expectApiError(
    () => createMotionStudioCommandService(other)
      .getProductionById(production.id),
    'MOTION_STUDIO_NOT_FOUND',
  )
  await expectApiError(
    async () => createMotionStudioCommandService({
      ...owner,
      motionStudioCommandRepositoryRuntimePort: forgedRuntimePort(),
    }).getProductionById(production.id),
    'TOOL_NOT_READY',
  )
  await expectApiError(
    async () => createMotionStudioCommandService({
      ...mockOwner,
      motionStudioCommandRepositoryRuntimePort: runtimePort,
    }).getProductionById(production.id),
    'AUTH_INVALID',
  )

  console.log(JSON.stringify({
    ok: true,
    smoke: 'motion-studio-private-local-command-repository',
    assertions: {
      authenticatedSavedNamedEditRequired: true,
      signedInLocalProjectUsesCanonicalUuid: true,
      exactIdempotentReplayAndConflict: true,
      durableRestartReadback: true,
      singleHostConcurrentCas: true,
      crossTenantReadDenied: true,
      forgedAndMockRuntimePromotionDenied: true,
      providerOrWorkerStarted: false,
      remoteMutationMade: false,
      productionReady: false,
    },
  }))
} finally {
  membershipServer.close()
  await once(membershipServer, 'close')
  await rm(root, { recursive: true, force: true })
  clearLocalProjectMemoryForSmoke()
  clearInternalEditStateMemoryForSmoke()
}

function context(
  userId: string,
  accessToken: string,
  port: MotionStudioCommandRepositoryRuntimePort,
): ServiceContext {
  return {
    env,
    clients: { admin: null, public: null },
    requestId: `motion-command-smoke-${userId}`,
    auth: {
      userId,
      accessToken,
      email: `${userId}@example.test`,
      isMockUser: false,
    },
    motionStudioCommandRepositoryRuntimePort: port,
  }
}

function mockContext(userId: string): ServiceContext {
  return {
    env,
    clients: { admin: null, public: null },
    requestId: `motion-command-mock-seed-${userId}`,
    auth: {
      userId,
      email: `${userId}@example.test`,
      isMockUser: true,
    },
  }
}

function productionBriefRequest(input: {
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  title: string
}): CreateMotionStudioArtifactVersionRequest {
  return {
    kind: 'production_brief',
    state: 'in_review',
    payload: {
      schemaVersion: 'motion-studio.production-brief.v1',
      data: {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        id: `brief-${input.productionId}`,
        productionId: input.productionId,
        title: input.title,
        objective: 'Prove an exact signed-in local Storytelling workflow.',
        audience: 'Internal break tester',
        platform: 'YouTube',
        targetDurationSeconds: 120,
        language: 'en',
        tone: ['professional', 'clear'],
        prohibitedElements: ['unapproved generation'],
        openQuestions: [],
      },
      references: [],
      extensions: [],
    },
    provenance: {
      sourceArtifactVersionIds: [],
      sourceAssetIds: [],
      skillRunIds: [],
      toolRunIds: [],
      providerAttemptIds: [],
    },
    dependencies: [],
  }
}

function forgedRuntimePort(): MotionStudioCommandRepositoryRuntimePort {
  return {
    schemaVersion: 'motion-studio-command-repository-runtime-port-v1',
    authorityClass: 'motion_studio_command_repository',
    sourceAuthority: 'canonical_motion_studio_repository',
    evidenceClass: 'canonical_backend_verified_runtime',
    productionAuthority: true,
    browserSelectable: false,
    durableSingleHostPersistenceVerified: true,
    authenticatedTenantBindingVerified: true,
    durableIdempotencyAndCasVerified: true,
    crossDeviceReadbackVerified: true,
    sameReleaseEvidenceVerified: true,
    createRepository: createPrivateLocalMotionStudioCommandRepository,
  }
}

async function expectApiError(
  operation: () => Promise<unknown>,
  code: ApiError['code'],
): Promise<void> {
  await assert.rejects(operation, (error: unknown) => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.code, code)
    return true
  })
}
