import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { loadRuntimeEnv } from '../config/env'
import { createProjectService, clearLocalProjectMemoryForSmoke } from '../services/project-service'
import {
  clearPrivateUploadMediaAuthorityProcessStateForSmoke,
  privateUploadMediaAuthorityValueHash,
  readPrivateUploadMediaAuthorityAggregate,
} from '../services/private-upload-media-authority-store'
import { createSourceMediaAuthorityService } from '../services/source-media-authority-service'
import { createUploadService } from '../services/upload-service'
import { LocalStorageAdapter } from '../storage/local-storage-adapter'
import type { ServiceContext } from '../types'

const root = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-source-authority-'))
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
  requestId: 'private-source-authority-smoke',
  auth: { userId: 'source-owner', isMockUser: true },
}

try {
  const project = (await createProjectService(context).createProject({
    workspaceId: 'workspace-source',
    name: 'Private source authority smoke',
  })).project
  const secondProject = (await createProjectService(context).createProject({
    workspaceId: 'workspace-source',
    name: 'Wrong source project',
  })).project
  const otherWorkspaceProject = (await createProjectService(context).createProject({
    workspaceId: 'workspace-other',
    name: 'Wrong source workspace',
  })).project

  const first = await uploadAndFinalize({
    context,
    workspaceId: 'workspace-source',
    projectId: project.id,
    uploadPurpose: 'source_media',
    fileName: 'first.mp4',
    mimeType: 'video/mp4',
    bytes: Buffer.from('first private source media bytes'),
  })
  const second = await uploadAndFinalize({
    context,
    workspaceId: 'workspace-source',
    projectId: project.id,
    uploadPurpose: 'source_media',
    fileName: 'second.mp4',
    mimeType: 'video/mp4',
    bytes: Buffer.from('second private source media bytes'),
  })
  const reference = await uploadAndFinalize({
    context,
    workspaceId: 'workspace-source',
    projectId: project.id,
    uploadPurpose: 'reference_media',
    fileName: 'reference.png',
    mimeType: 'image/png',
    bytes: Buffer.from('private reference image bytes'),
  })

  const scope = {
    localStorageRoot: root,
    ownerUserId: 'source-owner',
    workspaceId: 'workspace-source',
  }
  const beforeRestart = await readPrivateUploadMediaAuthorityAggregate(scope)
  assert(beforeRestart)
  assert.equal(beforeRestart.uploadIntents.length, 3)
  assert.equal(beforeRestart.mediaAssets.length, 3)
  assert.equal(beforeRestart.storageObjects.length, 3)
  assert.equal(Object.keys(beforeRestart.mediaAssetIdByUploadIntentId).length, 3)
  assert.equal(Object.keys(beforeRestart.storageObjectIdByMediaAssetId).length, 3)
  assert(beforeRestart.auditEvents.some((event) => event.eventType === 'upload_finalized'))
  assert(beforeRestart.idempotencyRecords.some((record) => record.operation === 'finalize_upload_intent'))

  clearPrivateUploadMediaAuthorityProcessStateForSmoke()
  clearLocalProjectMemoryForSmoke()
  const restartedUploadService = createUploadService({ ...context, requestId: 'restart-read' })
  const restartedMedia = await restartedUploadService.getFinalizedSourceMediaAsset(
    first.mediaAsset.id,
    'workspace-source',
    project.id,
  )
  assert.equal(restartedMedia.storageObject.id, first.storageObjectRecord.id)
  assert.equal(restartedMedia.mediaAsset.checksumSha256, first.checksumSha256)

  const revisionBeforeReplay = (await readPrivateUploadMediaAuthorityAggregate(scope))?.revision
  const replayedFinalization = await restartedUploadService.finalizeUploadIntent({
    workspaceId: 'workspace-source',
    uploadIntentId: first.uploadIntent.id,
  })
  const revisionAfterReplay = (await readPrivateUploadMediaAuthorityAggregate(scope))?.revision
  assert.equal(replayedFinalization.mediaAsset.id, first.mediaAsset.id)
  assert.equal(replayedFinalization.storageObjectRecord.id, first.storageObjectRecord.id)
  assert.equal(revisionAfterReplay, revisionBeforeReplay, 'Idempotent finalization replay must not mutate authority.')

  const restartSafeIntentInput = {
    workspaceId: 'workspace-source',
    projectId: project.id,
    uploadPurpose: 'source_media' as const,
    originalFileName: 'restart-idempotent.mp4',
    mimeType: 'video/mp4',
    expectedSizeBytes: 12,
    checksumSha256: createHash('sha256').update('restart-safe').digest('hex'),
    idempotencyKey: 'restart-safe-upload-intent-key',
  }
  const restartSafeIntent = await restartedUploadService.createUploadIntent(restartSafeIntentInput)
  const revisionAfterRestartSafeIntent = (await readPrivateUploadMediaAuthorityAggregate(scope))?.revision
  clearPrivateUploadMediaAuthorityProcessStateForSmoke()
  const restartedIntentReplay = await createUploadService({ ...context, requestId: 'restart-idempotency-replay' })
    .createUploadIntent(restartSafeIntentInput)
  assert.equal(restartedIntentReplay.uploadIntent.id, restartSafeIntent.uploadIntent.id)
  assert.equal(
    (await readPrivateUploadMediaAuthorityAggregate(scope))?.revision,
    revisionAfterRestartSafeIntent,
    'Upload-intent idempotency must survive process-state reset.',
  )
  await assertRejects(() => restartedUploadService.createUploadIntent({
    ...restartSafeIntentInput,
    originalFileName: 'conflicting-restart-idempotency.mp4',
  }), 'Restart-safe upload-intent idempotency key reuse with different input must be rejected.')

  const sourceItems = [
    {
      sourceSequenceItemId: 'source-sequence-1',
      mediaAssetId: first.mediaAsset.id,
      uploadedOrder: 1,
      checksumSha256: first.checksumSha256,
      required: true,
    },
    {
      sourceSequenceItemId: 'source-sequence-2',
      mediaAssetId: second.mediaAsset.id,
      uploadedOrder: 2,
      checksumSha256: second.checksumSha256,
      required: true,
    },
  ]
  const sourceAuthority = createSourceMediaAuthorityService(context)
  const candidateOne = (await sourceAuthority.buildManifestCandidate({
    workspaceId: 'workspace-source',
    projectId: project.id,
    uploadPurpose: 'source_media',
    orderedItems: sourceItems,
  })).sourceBindingManifestCandidate
  const candidateTwo = (await sourceAuthority.buildManifestCandidate({
    workspaceId: 'workspace-source',
    projectId: project.id,
    uploadPurpose: 'source_media',
    orderedItems: sourceItems,
  })).sourceBindingManifestCandidate
  assert.deepEqual(candidateTwo, candidateOne, 'Manifest candidates must be deterministic and immutable.')
  assert.equal(candidateOne.authorityStatus, 'unapproved_manifest_candidate')
  assert.equal(candidateOne.executionAuthorized, false)
  assert.equal(candidateOne.approvedSnapshotMutated, false)
  assert.equal(candidateOne.noRuntimeSideEffects, true)
  assert.equal(candidateOne.requiredBindingCount, 2)
  assert.equal(candidateOne.bindings[0]?.uploadedOrder, 1)
  assert.equal(candidateOne.bindings[1]?.uploadedOrder, 2)
  assert(!JSON.stringify(candidateOne).includes('objectPath'))
  assert(!JSON.stringify(candidateOne).includes('bucketName'))

  const referenceCandidate = (await sourceAuthority.buildManifestCandidate({
    workspaceId: 'workspace-source',
    projectId: project.id,
    uploadPurpose: 'reference_media',
    orderedItems: [{
      sourceSequenceItemId: 'reference-sequence-1',
      mediaAssetId: reference.mediaAsset.id,
      uploadedOrder: 1,
      checksumSha256: reference.checksumSha256,
      required: true,
    }],
  })).sourceBindingManifestCandidate
  assert.equal(referenceCandidate.uploadPurpose, 'reference_media')

  await assertRejects(() => sourceAuthority.buildManifestCandidate({
    workspaceId: 'workspace-source',
    projectId: project.id,
    uploadPurpose: 'source_media',
    orderedItems: sourceItems.map((item, index) => ({ ...item, uploadedOrder: index + 2 })),
  }), 'Non-contiguous uploaded order must be rejected.')
  await assertRejects(() => sourceAuthority.buildManifestCandidate({
    workspaceId: 'workspace-source',
    projectId: project.id,
    uploadPurpose: 'source_media',
    orderedItems: [{ ...sourceItems[0]!, checksumSha256: 'f'.repeat(64) }],
  }), 'Checksum mismatch must be rejected.')
  await assertRejects(() => sourceAuthority.buildManifestCandidate({
    workspaceId: 'workspace-source',
    projectId: secondProject.id,
    uploadPurpose: 'source_media',
    orderedItems: [sourceItems[0]!],
  }), 'Cross-project source binding must be rejected.')
  await assertRejects(() => sourceAuthority.buildManifestCandidate({
    workspaceId: 'workspace-other',
    projectId: otherWorkspaceProject.id,
    uploadPurpose: 'source_media',
    orderedItems: [sourceItems[0]!],
  }), 'Cross-workspace source binding must be rejected.')
  const otherUserContext: ServiceContext = {
    ...context,
    requestId: 'other-user-source-authority',
    auth: { userId: 'source-other-user', isMockUser: true },
  }
  await assertRejects(() => createSourceMediaAuthorityService(otherUserContext).buildManifestCandidate({
    workspaceId: 'workspace-source',
    projectId: project.id,
    uploadPurpose: 'source_media',
    orderedItems: [sourceItems[0]!],
  }), 'Cross-tenant source binding must be rejected.')

  const aggregatePath = path.join(
    root,
    'upload-media-authority',
    'private-internal-v1',
    privateUploadMediaAuthorityValueHash('source-owner\u0000workspace-source'),
    'aggregate.json',
  )
  const originalAggregateBytes = await readFile(aggregatePath)
  const tamperedEnvelope = JSON.parse(originalAggregateBytes.toString('utf8')) as {
    aggregate: { storageObjectIdByMediaAssetId: Record<string, string> }
    checksumSha256: string
  }
  tamperedEnvelope.aggregate.storageObjectIdByMediaAssetId[first.mediaAsset.id] = second.storageObjectRecord.id
  tamperedEnvelope.checksumSha256 = privateUploadMediaAuthorityValueHash(tamperedEnvelope.aggregate)
  await writeFile(aggregatePath, `${JSON.stringify(tamperedEnvelope)}\n`)
  await assertRejects(
    () => readPrivateUploadMediaAuthorityAggregate(scope),
    'Rechecksummed but forged media/storage linkage must be rejected.',
  )
  await writeFile(aggregatePath, originalAggregateBytes)

  const firstObjectPath = path.join(
    root,
    first.storageObjectRecord.bucketName,
    first.storageObjectRecord.objectPath,
  )
  await writeFile(firstObjectPath, Buffer.from('tampered post-finalization source bytes'))
  await assertRejects(() => sourceAuthority.buildManifestCandidate({
    workspaceId: 'workspace-source',
    projectId: project.id,
    uploadPurpose: 'source_media',
    orderedItems: sourceItems,
  }), 'Post-finalization byte tampering must block manifest candidates.')

  const symlinkRoot = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-source-symlink-'))
  const outsideRoot = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-source-outside-'))
  try {
    await symlink(outsideRoot, path.join(symlinkRoot, 'upload-media-authority'), 'dir')
    const symlinkEnv = loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'local',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      API_PORT: '8787',
      STORAGE_MODE: 'local',
      LOCAL_STORAGE_ROOT: symlinkRoot,
      SIGNED_URL_TTL_SECONDS: '900',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    })
    const symlinkContext: ServiceContext = {
      env: symlinkEnv,
      clients: { admin: null, public: null },
      requestId: 'symlink-authority',
      auth: { userId: 'symlink-owner', isMockUser: true },
    }
    const symlinkProject = (await createProjectService(symlinkContext).createProject({
      workspaceId: 'symlink-workspace',
      name: 'Symlink authority project',
    })).project
    await assertRejects(() => createUploadService(symlinkContext).createUploadIntent({
      workspaceId: 'symlink-workspace',
      projectId: symlinkProject.id,
      uploadPurpose: 'source_media',
      originalFileName: 'symlink.mp4',
      mimeType: 'video/mp4',
      expectedSizeBytes: 4,
      checksumSha256: createHash('sha256').update('safe').digest('hex'),
    }), 'Symlinked private authority parent must be rejected.')

    const adapterRoot = path.join(symlinkRoot, 'adapter-root')
    const outsideFile = path.join(outsideRoot, 'outside-object')
    await mkdir(path.join(adapterRoot, 'source-media', 'safe'), { recursive: true })
    await writeFile(outsideFile, 'outside')
    await symlink(outsideFile, path.join(adapterRoot, 'source-media', 'safe', 'clip.mp4'))
    await assertRejects(() => new LocalStorageAdapter(adapterRoot).putObject({
      bucketName: 'source-media',
      objectPath: 'safe/clip.mp4',
      body: Buffer.from('safe'),
      mimeType: 'video/mp4',
    }), 'Symlinked local object target must be rejected.')
  } finally {
    await rm(symlinkRoot, { recursive: true, force: true })
    await rm(outsideRoot, { recursive: true, force: true })
  }

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'restart_safe_upload_media_authority_reads',
      'exact_finalized_indexes_and_lineage',
      'finalization_idempotency_and_immutability',
      'upload_intent_idempotency_survives_process_restart',
      'source_and_reference_authority_persisted',
      'deterministic_unapproved_manifest_candidate',
      'candidate_exposes_no_bucket_or_object_path',
      'tenant_workspace_project_purpose_scope_enforced',
      'uploaded_order_and_checksum_enforced',
      'forged_rechecksummed_linkage_rejected',
      'post_finalize_byte_tamper_rejected',
      'symlinked_authority_parent_rejected',
      'symlinked_local_object_target_rejected',
    ],
  }))
} finally {
  clearPrivateUploadMediaAuthorityProcessStateForSmoke()
  clearLocalProjectMemoryForSmoke()
  await rm(root, { recursive: true, force: true })
}

async function uploadAndFinalize(input: {
  context: ServiceContext
  workspaceId: string
  projectId: string
  uploadPurpose: 'source_media' | 'reference_media'
  fileName: string
  mimeType: string
  bytes: Buffer
}) {
  const checksumSha256 = createHash('sha256').update(input.bytes).digest('hex')
  const service = createUploadService(input.context)
  const created = await service.createUploadIntent({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    uploadPurpose: input.uploadPurpose,
    originalFileName: input.fileName,
    mimeType: input.mimeType,
    expectedSizeBytes: input.bytes.byteLength,
    checksumSha256,
  })
  await service.uploadLocalObject(
    created.uploadIntent.id,
    input.workspaceId,
    input.bytes,
    input.mimeType,
    input.bytes.byteLength,
  )
  const revisionAfterUpload = (await readPrivateUploadMediaAuthorityAggregate({
    localStorageRoot: input.context.env.localStorageRoot,
    ownerUserId: input.context.auth?.userId ?? '',
    workspaceId: input.workspaceId,
  }))?.revision
  await service.uploadLocalObject(
    created.uploadIntent.id,
    input.workspaceId,
    input.bytes,
    input.mimeType,
    input.bytes.byteLength,
  )
  const revisionAfterIdenticalReplay = (await readPrivateUploadMediaAuthorityAggregate({
    localStorageRoot: input.context.env.localStorageRoot,
    ownerUserId: input.context.auth?.userId ?? '',
    workspaceId: input.workspaceId,
  }))?.revision
  assert.equal(revisionAfterIdenticalReplay, revisionAfterUpload)
  await assertRejects(() => service.uploadLocalObject(
    created.uploadIntent.id,
    input.workspaceId,
    Buffer.from('different collision bytes'),
    input.mimeType,
  ), 'Different-byte create-only retry must be rejected.')

  const finalized = await service.finalizeUploadIntent({
    workspaceId: input.workspaceId,
    uploadIntentId: created.uploadIntent.id,
  })
  return { ...finalized, checksumSha256 }
}

async function assertRejects(action: () => Promise<unknown>, message: string): Promise<void> {
  let rejected = false
  try {
    await action()
  } catch {
    rejected = true
  }
  assert(rejected, message)
}
