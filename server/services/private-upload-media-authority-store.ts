import { createHash, randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import {
  PRIVATE_UPLOAD_MEDIA_AUTHORITY_SCHEMA_VERSION,
  privateMediaAssetAuthorityRecordSchema,
  privateStorageObjectAuthorityRecordSchema,
  privateUploadIntentAuthorityRecordSchema,
  privateUploadMediaAuthorityAggregateSchema,
  type PrivateMediaAssetAuthorityRecord,
  type PrivateStorageObjectAuthorityRecord,
  type PrivateUploadIntentAuthorityRecord,
  type PrivateUploadMediaAuthorityAggregate,
} from '../validation/private-upload-media-authority-schemas'

const PRIVATE_UPLOAD_MEDIA_AUTHORITY_SOURCE = 'private_upload_media_authority_store' as const
const MAX_AGGREGATE_BYTES = 32 * 1024 * 1024

export type PrivateUploadMediaAuthorityScope = {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
}

interface PersistedPrivateUploadMediaAuthorityAggregate {
  recordVersion: typeof PRIVATE_UPLOAD_MEDIA_AUTHORITY_SCHEMA_VERSION
  source: typeof PRIVATE_UPLOAD_MEDIA_AUTHORITY_SOURCE
  aggregate: PrivateUploadMediaAuthorityAggregate
  checksumSha256: string
}

type StoreMutationResult<T> = {
  result: T
  changed: boolean
}

const scopeLocks = new Map<string, Promise<void>>()

export function clearPrivateUploadMediaAuthorityProcessStateForSmoke(): void {
  scopeLocks.clear()
}

export async function readPrivateUploadMediaAuthorityAggregate(
  scope: PrivateUploadMediaAuthorityScope,
): Promise<PrivateUploadMediaAuthorityAggregate | undefined> {
  assertSafeScope(scope)
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: privateUploadMediaAuthorityAggregatePath(scope),
  })
  if (!content) return undefined

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw invalidStoredAuthority('Private upload/media authority aggregate is not valid JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw invalidStoredAuthority('Private upload/media authority aggregate is not an object.')
  }
  const envelope = parsed as Partial<PersistedPrivateUploadMediaAuthorityAggregate>
  if (
    envelope.recordVersion !== PRIVATE_UPLOAD_MEDIA_AUTHORITY_SCHEMA_VERSION ||
    envelope.source !== PRIVATE_UPLOAD_MEDIA_AUTHORITY_SOURCE ||
    !envelope.aggregate ||
    typeof envelope.checksumSha256 !== 'string'
  ) {
    throw invalidStoredAuthority('Private upload/media authority aggregate has an unsupported envelope.')
  }

  const parsedAggregate = privateUploadMediaAuthorityAggregateSchema.safeParse(envelope.aggregate)
  if (!parsedAggregate.success) {
    throw invalidStoredAuthority(
      'Private upload/media authority aggregate shape is invalid.',
      parsedAggregate.error.flatten(),
    )
  }
  const aggregate = parsedAggregate.data
  if (envelope.checksumSha256 !== privateUploadMediaAuthorityValueHash(aggregate)) {
    throw invalidStoredAuthority('Private upload/media authority aggregate checksum is invalid.')
  }
  assertPrivateUploadMediaAuthorityAggregate(aggregate, scope)
  return aggregate
}

export async function mutatePrivateUploadMediaAuthorityAggregate<T>(input: {
  scope: PrivateUploadMediaAuthorityScope
  now: string
  mutation: (
    aggregate: PrivateUploadMediaAuthorityAggregate,
  ) => Promise<StoreMutationResult<T>> | StoreMutationResult<T>
}): Promise<T> {
  assertSafeScope(input.scope)
  const lockKey = privateUploadMediaAuthorityScopeHash(input.scope)
  return withProcessLock(lockKey, async () => {
    const existing = await readPrivateUploadMediaAuthorityAggregate(input.scope)
    const aggregate = existing ?? createEmptyAggregate(input.scope, input.now)
    const result = await input.mutation(aggregate)
    if (!result.changed) return result.result

    aggregate.revision += 1
    aggregate.updatedAt = input.now
    assertPrivateUploadMediaAuthorityAggregate(aggregate, input.scope)
    const persisted: PersistedPrivateUploadMediaAuthorityAggregate = {
      recordVersion: PRIVATE_UPLOAD_MEDIA_AUTHORITY_SCHEMA_VERSION,
      source: PRIVATE_UPLOAD_MEDIA_AUTHORITY_SOURCE,
      aggregate,
      checksumSha256: privateUploadMediaAuthorityValueHash(aggregate),
    }
    const content = `${JSON.stringify(persisted)}\n`
    const byteLength = Buffer.byteLength(content, 'utf8')
    if (byteLength > MAX_AGGREGATE_BYTES) {
      throw new ApiError(
        'IDEMPOTENCY_CAPACITY_EXCEEDED',
        'Private upload/media authority aggregate reached its safe capacity.',
        503,
        { byteLength, maxBytes: MAX_AGGREGATE_BYTES },
      )
    }
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: input.scope.localStorageRoot,
      relativePath: privateUploadMediaAuthorityAggregatePath(input.scope),
      content,
    })
    return result.result
  })
}

export async function createPrivateUploadIntentAuthority(input: {
  scope: PrivateUploadMediaAuthorityScope
  uploadIntent: PrivateUploadIntentAuthorityRecord
  idempotencyKey?: string
  requestHash?: string
  now: string
}): Promise<PrivateUploadIntentAuthorityRecord> {
  const uploadIntent = parseRecord(
    privateUploadIntentAuthorityRecordSchema,
    input.uploadIntent,
    'Private upload intent authority record',
  )
  const requestHash = input.requestHash ?? privateUploadMediaAuthorityValueHash(uploadIntent)
  const idempotencyKey = input.idempotencyKey?.trim() || `upload-intent:${uploadIntent.id}`
  if (!/^[a-f0-9]{64}$/.test(requestHash) || idempotencyKey.length > 240) {
    throw new ApiError('VALIDATION_FAILED', 'Safe upload-intent idempotency authority is required.', 400)
  }
  return mutatePrivateUploadMediaAuthorityAggregate({
    scope: input.scope,
    now: input.now,
    mutation: (aggregate) => {
      const replay = findIdempotencyRecord(aggregate, 'create_upload_intent', idempotencyKey, requestHash)
      if (replay) {
        const existing = aggregate.uploadIntents.find((record) => record.id === replay.responseIds[0])
        if (!existing) throw invalidStoredAuthority('Upload-intent idempotency response is missing.')
        return { result: existing, changed: false }
      }
      const duplicate = aggregate.uploadIntents.find((record) =>
        record.id === uploadIntent.id ||
        (record.targetBucket === uploadIntent.targetBucket && record.targetPath === uploadIntent.targetPath)
      )
      if (duplicate) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Private upload intent identity already exists with different authority.', 409)
      }

      const committedRevision = aggregate.revision + 1
      aggregate.uploadIntents.push(uploadIntent)
      aggregate.idempotencyRecords.push({
        operation: 'create_upload_intent',
        idempotencyKey,
        requestHash,
        responseIds: [uploadIntent.id],
        committedRevision,
        completedAt: input.now,
      })
      aggregate.auditEvents.push({
        id: `upload_authority_audit_${randomUUID()}`,
        eventType: 'upload_intent_created',
        actorUserId: input.scope.ownerUserId,
        workspaceId: input.scope.workspaceId,
        projectId: uploadIntent.projectId,
        uploadIntentId: uploadIntent.id,
        recordRevision: committedRevision,
        createdAt: input.now,
      })
      return { result: uploadIntent, changed: true }
    },
  })
}

export async function transitionPrivateUploadIntentAuthority(input: {
  scope: PrivateUploadMediaAuthorityScope
  uploadIntentId: string
  nextStatus: 'uploaded' | 'failed'
  now: string
}): Promise<PrivateUploadIntentAuthorityRecord> {
  const operation = input.nextStatus === 'uploaded'
    ? 'mark_upload_intent_uploaded' as const
    : 'mark_upload_intent_failed' as const
  const eventType = input.nextStatus === 'uploaded'
    ? 'upload_intent_uploaded' as const
    : 'upload_intent_failed' as const
  const idempotencyKey = `${input.uploadIntentId}:${input.nextStatus}`
  const requestHash = privateUploadMediaAuthorityValueHash({
    uploadIntentId: input.uploadIntentId,
    nextStatus: input.nextStatus,
  })
  return mutatePrivateUploadMediaAuthorityAggregate({
    scope: input.scope,
    now: input.now,
    mutation: (aggregate) => {
      const replay = findIdempotencyRecord(aggregate, operation, idempotencyKey, requestHash)
      if (replay) {
        const existing = aggregate.uploadIntents.find((record) => record.id === input.uploadIntentId)
        if (!existing) throw invalidStoredAuthority('Upload status idempotency response is missing.')
        return { result: existing, changed: false }
      }
      const index = aggregate.uploadIntents.findIndex((record) => record.id === input.uploadIntentId)
      if (index < 0) throw new ApiError('UPLOAD_INTENT_NOT_FOUND', 'Private upload intent was not found.', 404)
      const current = aggregate.uploadIntents[index]
      if (!current) throw invalidStoredAuthority('Private upload intent index is invalid.')
      if (current.status === 'finalized') {
        throw new ApiError('UPLOAD_NOT_FINALIZED', 'Finalized upload authority is immutable.', 409)
      }
      if (current.status === 'failed' && input.nextStatus !== 'failed') {
        throw new ApiError('UPLOAD_NOT_FINALIZED', 'Failed upload authority cannot return to an uploadable state.', 409)
      }
      const updated: PrivateUploadIntentAuthorityRecord = {
        ...current,
        status: input.nextStatus,
        updatedAt: input.now,
      }
      aggregate.uploadIntents[index] = updated
      const committedRevision = aggregate.revision + 1
      aggregate.idempotencyRecords.push({
        operation,
        idempotencyKey,
        requestHash,
        responseIds: [updated.id],
        committedRevision,
        completedAt: input.now,
      })
      aggregate.auditEvents.push({
        id: `upload_authority_audit_${randomUUID()}`,
        eventType,
        actorUserId: input.scope.ownerUserId,
        workspaceId: input.scope.workspaceId,
        projectId: updated.projectId,
        uploadIntentId: updated.id,
        recordRevision: committedRevision,
        createdAt: input.now,
      })
      return { result: updated, changed: true }
    },
  })
}

export async function commitPrivateFinalizedUploadAuthority(input: {
  scope: PrivateUploadMediaAuthorityScope
  uploadIntentId: string
  mediaAsset: PrivateMediaAssetAuthorityRecord
  storageObject: PrivateStorageObjectAuthorityRecord
  now: string
}): Promise<{
  uploadIntent: PrivateUploadIntentAuthorityRecord
  mediaAsset: PrivateMediaAssetAuthorityRecord
  storageObject: PrivateStorageObjectAuthorityRecord
}> {
  const mediaAsset = parseRecord(
    privateMediaAssetAuthorityRecordSchema,
    input.mediaAsset,
    'Private media asset authority record',
  )
  const storageObject = parseRecord(
    privateStorageObjectAuthorityRecordSchema,
    input.storageObject,
    'Private storage object authority record',
  )
  const idempotencyKey = `finalize:${input.uploadIntentId}`
  const requestHash = privateUploadMediaAuthorityValueHash({
    uploadIntentId: input.uploadIntentId,
    mediaAsset: lineageComparableMediaAsset(mediaAsset),
    storageObject: lineageComparableStorageObject(storageObject),
  })
  return mutatePrivateUploadMediaAuthorityAggregate({
    scope: input.scope,
    now: input.now,
    mutation: (aggregate) => {
      const current = aggregate.uploadIntents.find((record) => record.id === input.uploadIntentId)
      if (!current) throw new ApiError('UPLOAD_INTENT_NOT_FOUND', 'Private upload intent was not found.', 404)
      if (current.status === 'finalized') {
        return { result: finalizedUploadResult(aggregate, current), changed: false }
      }
      if (current.status !== 'signed' && current.status !== 'uploaded') {
        throw new ApiError('UPLOAD_NOT_FINALIZED', 'Upload intent is not eligible for finalization.', 409)
      }
      const existingIdempotency = aggregate.idempotencyRecords.find((record) =>
        record.operation === 'finalize_upload_intent' && record.idempotencyKey === idempotencyKey
      )
      if (existingIdempotency) {
        if (existingIdempotency.requestHash !== requestHash) {
          throw new ApiError('IDEMPOTENCY_CONFLICT', 'Upload finalization idempotency authority conflicts with this request.', 409)
        }
        return { result: finalizedUploadResult(aggregate, current), changed: false }
      }
      if (
        aggregate.mediaAssets.some((record) => record.id === mediaAsset.id) ||
        aggregate.storageObjects.some((record) => record.id === storageObject.id)
      ) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Finalized upload child identity already exists.', 409)
      }

      const finalizedIntent: PrivateUploadIntentAuthorityRecord = {
        ...current,
        status: 'finalized',
        finalizedAt: input.now,
        mediaAssetId: mediaAsset.id,
        updatedAt: input.now,
      }
      const intentIndex = aggregate.uploadIntents.findIndex((record) => record.id === current.id)
      aggregate.uploadIntents[intentIndex] = finalizedIntent
      aggregate.mediaAssets.push(mediaAsset)
      aggregate.storageObjects.push(storageObject)
      aggregate.mediaAssetIdByUploadIntentId[current.id] = mediaAsset.id
      aggregate.storageObjectIdByUploadIntentId[current.id] = storageObject.id
      aggregate.storageObjectIdByMediaAssetId[mediaAsset.id] = storageObject.id

      const committedRevision = aggregate.revision + 1
      aggregate.idempotencyRecords.push({
        operation: 'finalize_upload_intent',
        idempotencyKey,
        requestHash,
        responseIds: [finalizedIntent.id, mediaAsset.id, storageObject.id],
        committedRevision,
        completedAt: input.now,
      })
      aggregate.auditEvents.push({
        id: `upload_authority_audit_${randomUUID()}`,
        eventType: 'upload_finalized',
        actorUserId: input.scope.ownerUserId,
        workspaceId: input.scope.workspaceId,
        projectId: finalizedIntent.projectId,
        uploadIntentId: finalizedIntent.id,
        mediaAssetId: mediaAsset.id,
        storageObjectRecordId: storageObject.id,
        recordRevision: committedRevision,
        createdAt: input.now,
      })
      return {
        result: { uploadIntent: finalizedIntent, mediaAsset, storageObject },
        changed: true,
      }
    },
  })
}

export async function loadPrivateUploadIntentAuthority(
  scope: PrivateUploadMediaAuthorityScope,
  uploadIntentId: string,
): Promise<PrivateUploadIntentAuthorityRecord | undefined> {
  const aggregate = await readPrivateUploadMediaAuthorityAggregate(scope)
  return aggregate?.uploadIntents.find((record) => record.id === uploadIntentId)
}

export async function loadPrivateStorageObjectAuthority(
  scope: PrivateUploadMediaAuthorityScope,
  storageObjectRecordId: string,
): Promise<PrivateStorageObjectAuthorityRecord | undefined> {
  const aggregate = await readPrivateUploadMediaAuthorityAggregate(scope)
  return aggregate?.storageObjects.find((record) => record.id === storageObjectRecordId)
}

export async function loadPrivateFinalizedMediaAuthority(
  scope: PrivateUploadMediaAuthorityScope,
  mediaAssetId: string,
): Promise<{
  uploadIntent: PrivateUploadIntentAuthorityRecord
  mediaAsset: PrivateMediaAssetAuthorityRecord
  storageObject: PrivateStorageObjectAuthorityRecord
  authorityRevision: number
  authorityChecksumSha256: string
} | undefined> {
  const aggregate = await readPrivateUploadMediaAuthorityAggregate(scope)
  if (!aggregate) return undefined
  const mediaAsset = aggregate.mediaAssets.find((record) => record.id === mediaAssetId)
  if (!mediaAsset) return undefined
  const uploadIntent = aggregate.uploadIntents.find((record) => record.id === mediaAsset.uploadIntentId)
  const storageObjectId = aggregate.storageObjectIdByMediaAssetId[mediaAsset.id]
  const storageObject = aggregate.storageObjects.find((record) => record.id === storageObjectId)
  if (!uploadIntent || !storageObject || uploadIntent.status !== 'finalized') {
    throw invalidStoredAuthority('Finalized media authority lineage is incomplete.')
  }
  const projectAuthority = privateProjectUploadMediaAuthority(aggregate, mediaAsset.projectId)
  return {
    uploadIntent,
    mediaAsset,
    storageObject,
    authorityRevision: projectAuthority.authorityRevision,
    authorityChecksumSha256: projectAuthority.authorityChecksumSha256,
  }
}

export function privateUploadMediaAuthorityValueHash(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex')
}

export function privateProjectUploadMediaAuthority(
  aggregate: PrivateUploadMediaAuthorityAggregate,
  projectId: string,
): { authorityRevision: number; authorityChecksumSha256: string } {
  const uploadIntents = aggregate.uploadIntents.filter((record) => record.projectId === projectId)
  const uploadIntentIds = new Set(uploadIntents.map((record) => record.id))
  const mediaAssets = aggregate.mediaAssets.filter((record) => record.projectId === projectId)
  const mediaAssetIds = new Set(mediaAssets.map((record) => record.id))
  const storageObjects = aggregate.storageObjects.filter((record) => record.projectId === projectId)
  const auditEvents = aggregate.auditEvents.filter((record) => record.projectId === projectId)
  const authorityRevision = Math.max(0, ...auditEvents.map((record) => record.recordRevision))
  if (authorityRevision <= 0 || uploadIntents.length === 0) {
    throw new ApiError('UPLOAD_NOT_FINALIZED', 'Project source-media authority was not found.', 409)
  }
  const projectAuthority = {
    schemaVersion: 'private-project-upload-media-authority-v1',
    workspaceId: aggregate.workspaceId,
    ownerUserId: aggregate.ownerUserId,
    projectId,
    authorityRevision,
    uploadIntents,
    mediaAssets,
    storageObjects,
    mediaAssetIdByUploadIntentId: Object.fromEntries(Object.entries(
      aggregate.mediaAssetIdByUploadIntentId,
    ).filter(([uploadIntentId, mediaAssetId]) =>
      uploadIntentIds.has(uploadIntentId) && mediaAssetIds.has(mediaAssetId))),
    storageObjectIdByUploadIntentId: Object.fromEntries(Object.entries(
      aggregate.storageObjectIdByUploadIntentId,
    ).filter(([uploadIntentId]) => uploadIntentIds.has(uploadIntentId))),
    storageObjectIdByMediaAssetId: Object.fromEntries(Object.entries(
      aggregate.storageObjectIdByMediaAssetId,
    ).filter(([mediaAssetId]) => mediaAssetIds.has(mediaAssetId))),
    auditEvents,
  }
  return {
    authorityRevision,
    authorityChecksumSha256: privateUploadMediaAuthorityValueHash(projectAuthority),
  }
}

function createEmptyAggregate(
  scope: PrivateUploadMediaAuthorityScope,
  now: string,
): PrivateUploadMediaAuthorityAggregate {
  return {
    schemaVersion: PRIVATE_UPLOAD_MEDIA_AUTHORITY_SCHEMA_VERSION,
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    revision: 0,
    uploadIntents: [],
    mediaAssets: [],
    storageObjects: [],
    mediaAssetIdByUploadIntentId: {},
    storageObjectIdByUploadIntentId: {},
    storageObjectIdByMediaAssetId: {},
    idempotencyRecords: [],
    auditEvents: [],
    createdAt: now,
    updatedAt: now,
    privateInternalOnly: true,
  }
}

function assertPrivateUploadMediaAuthorityAggregate(
  aggregate: PrivateUploadMediaAuthorityAggregate,
  scope: PrivateUploadMediaAuthorityScope,
): void {
  const parsed = privateUploadMediaAuthorityAggregateSchema.safeParse(aggregate)
  if (!parsed.success) {
    throw invalidStoredAuthority('Private upload/media authority aggregate shape is invalid.', parsed.error.flatten())
  }
  if (
    aggregate.ownerUserId !== scope.ownerUserId ||
    aggregate.workspaceId !== scope.workspaceId ||
    aggregate.privateInternalOnly !== true
  ) {
    throw invalidStoredAuthority('Private upload/media authority tenancy scope is invalid.')
  }
  for (const records of [aggregate.uploadIntents, aggregate.mediaAssets, aggregate.storageObjects]) {
    const ids = records.map((record) => record.id)
    if (new Set(ids).size !== ids.length) {
      throw invalidStoredAuthority('Private upload/media authority contains duplicate record IDs.')
    }
  }
  const objectIdentities = aggregate.storageObjects.map((record) => `${record.bucketName}\u0000${record.objectPath}`)
  if (new Set(objectIdentities).size !== objectIdentities.length) {
    throw invalidStoredAuthority('Private upload/media authority contains duplicate live object identities.')
  }
  const finalizedIntents = aggregate.uploadIntents.filter((record) => record.status === 'finalized')
  if (
    finalizedIntents.length !== aggregate.mediaAssets.length ||
    finalizedIntents.length !== aggregate.storageObjects.length ||
    finalizedIntents.length !== Object.keys(aggregate.mediaAssetIdByUploadIntentId).length ||
    finalizedIntents.length !== Object.keys(aggregate.storageObjectIdByUploadIntentId).length ||
    finalizedIntents.length !== Object.keys(aggregate.storageObjectIdByMediaAssetId).length
  ) {
    throw invalidStoredAuthority('Private upload/media authority finalized indexes are not exact.')
  }
  for (const intent of aggregate.uploadIntents) {
    if (
      intent.workspaceId !== aggregate.workspaceId ||
      intent.requestedByUserId !== aggregate.ownerUserId
    ) {
      throw invalidStoredAuthority('Private upload intent tenancy does not match its aggregate.')
    }
    assertCanonicalIntentPath(intent)
    if (intent.status === 'finalized') {
      assertFinalizedLineage(aggregate, intent)
    } else if (
      intent.finalizedAt ||
      intent.mediaAssetId ||
      aggregate.mediaAssetIdByUploadIntentId[intent.id] ||
      aggregate.storageObjectIdByUploadIntentId[intent.id]
    ) {
      throw invalidStoredAuthority('Non-finalized upload intent contains finalized lineage.')
    }
  }
  const auditIds = new Set(aggregate.auditEvents.map((record) => record.id))
  if (auditIds.size !== aggregate.auditEvents.length) {
    throw invalidStoredAuthority('Private upload/media authority contains duplicate audit IDs.')
  }
  if (aggregate.auditEvents.some((record) =>
    record.workspaceId !== aggregate.workspaceId ||
    record.actorUserId !== aggregate.ownerUserId ||
    record.recordRevision > aggregate.revision
  )) {
    throw invalidStoredAuthority('Private upload/media authority audit lineage is invalid.')
  }
  const idempotencyKeys = aggregate.idempotencyRecords.map((record) =>
    `${record.operation}\u0000${record.idempotencyKey}`
  )
  if (
    new Set(idempotencyKeys).size !== idempotencyKeys.length ||
    aggregate.idempotencyRecords.some((record) => record.committedRevision > aggregate.revision)
  ) {
    throw invalidStoredAuthority('Private upload/media authority idempotency lineage is invalid.')
  }
}

function assertCanonicalIntentPath(intent: PrivateUploadIntentAuthorityRecord): void {
  const purposeSegment = intent.uploadPurpose === 'source_media' ? 'source-media' : 'reference-media'
  const expectedPrefix = [
    'workspaces',
    intent.workspaceId,
    'projects',
    intent.projectId,
    purposeSegment,
    intent.id,
    '',
  ].join('/')
  if (!intent.targetPath.startsWith(expectedPrefix)) {
    throw invalidStoredAuthority('Private upload intent target path does not match its tenant/project/purpose identity.')
  }
}

function assertFinalizedLineage(
  aggregate: PrivateUploadMediaAuthorityAggregate,
  intent: PrivateUploadIntentAuthorityRecord,
): void {
  if (!intent.finalizedAt || !intent.mediaAssetId) {
    throw invalidStoredAuthority('Finalized upload intent is missing immutable finalization identity.')
  }
  const mediaAssetId = aggregate.mediaAssetIdByUploadIntentId[intent.id]
  const storageObjectId = aggregate.storageObjectIdByUploadIntentId[intent.id]
  const mediaAsset = aggregate.mediaAssets.find((record) => record.id === mediaAssetId)
  const storageObject = aggregate.storageObjects.find((record) => record.id === storageObjectId)
  if (
    !mediaAsset ||
    !storageObject ||
    intent.mediaAssetId !== mediaAsset.id ||
    aggregate.storageObjectIdByMediaAssetId[mediaAsset.id] !== storageObject.id ||
    mediaAsset.uploadIntentId !== intent.id ||
    mediaAsset.storageObjectRecordId !== storageObject.id ||
    storageObject.uploadIntentId !== intent.id ||
    storageObject.mediaAssetId !== mediaAsset.id ||
    mediaAsset.workspaceId !== intent.workspaceId ||
    storageObject.workspaceId !== intent.workspaceId ||
    mediaAsset.projectId !== intent.projectId ||
    storageObject.projectId !== intent.projectId ||
    mediaAsset.uploadPurpose !== intent.uploadPurpose ||
    storageObject.uploadPurpose !== intent.uploadPurpose ||
    storageObject.objectPurpose !== intent.uploadPurpose ||
    mediaAsset.fileName !== intent.originalFileName ||
    mediaAsset.mimeType !== intent.mimeType ||
    storageObject.mimeType !== intent.mimeType ||
    mediaAsset.storageBucket !== intent.targetBucket ||
    storageObject.bucketName !== intent.targetBucket ||
    mediaAsset.storagePath !== intent.targetPath ||
    storageObject.objectPath !== intent.targetPath ||
    mediaAsset.storageProvider !== storageObject.storageProvider ||
    mediaAsset.sizeBytes !== storageObject.sizeBytes ||
    mediaAsset.checksumSha256 !== storageObject.checksumSha256 ||
    (intent.expectedSizeBytes !== undefined && intent.expectedSizeBytes !== mediaAsset.sizeBytes) ||
    (intent.checksumSha256 !== undefined && intent.checksumSha256 !== mediaAsset.checksumSha256)
  ) {
    throw invalidStoredAuthority('Finalized upload media/storage lineage is inconsistent.')
  }
  if (mediaAsset.storageProvider === 'google_cloud_storage') {
    if (
      !mediaAsset.storageGeneration ||
      !mediaAsset.storageEtag ||
      mediaAsset.storageGeneration !== storageObject.generation ||
      mediaAsset.storageEtag !== storageObject.etag ||
      mediaAsset.storageMetageneration !== storageObject.metageneration
    ) {
      throw invalidStoredAuthority('Finalized GCS upload authority is missing exact generation/ETag identity.')
    }
  } else if (
    mediaAsset.storageGeneration ||
    mediaAsset.storageEtag ||
    storageObject.generation ||
    storageObject.etag
  ) {
    throw invalidStoredAuthority('Local private upload authority contains unexpected cloud object identity.')
  }
  if (
    mediaAsset.sourceMetadata &&
    mediaAsset.sourceMetadata.source !== (
      mediaAsset.storageProvider === 'google_cloud_storage' ? 'gcs_ffprobe' : 'local_ffprobe'
    )
  ) {
    throw invalidStoredAuthority('Finalized media probe provenance does not match its storage provider.')
  }
}

function finalizedUploadResult(
  aggregate: PrivateUploadMediaAuthorityAggregate,
  uploadIntent: PrivateUploadIntentAuthorityRecord,
): {
  uploadIntent: PrivateUploadIntentAuthorityRecord
  mediaAsset: PrivateMediaAssetAuthorityRecord
  storageObject: PrivateStorageObjectAuthorityRecord
} {
  assertFinalizedLineage(aggregate, uploadIntent)
  const mediaAssetId = aggregate.mediaAssetIdByUploadIntentId[uploadIntent.id]
  const storageObjectId = aggregate.storageObjectIdByUploadIntentId[uploadIntent.id]
  const mediaAsset = aggregate.mediaAssets.find((record) => record.id === mediaAssetId)
  const storageObject = aggregate.storageObjects.find((record) => record.id === storageObjectId)
  if (!mediaAsset || !storageObject) throw invalidStoredAuthority('Finalized upload authority records are missing.')
  return { uploadIntent, mediaAsset, storageObject }
}

function findIdempotencyRecord(
  aggregate: PrivateUploadMediaAuthorityAggregate,
  operation: PrivateUploadMediaAuthorityAggregate['idempotencyRecords'][number]['operation'],
  idempotencyKey: string,
  requestHash: string,
) {
  const existing = aggregate.idempotencyRecords.find((record) =>
    record.operation === operation && record.idempotencyKey === idempotencyKey
  )
  if (existing && existing.requestHash !== requestHash) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Private upload/media authority idempotency key was reused with different input.', 409)
  }
  return existing
}

function lineageComparableMediaAsset(record: PrivateMediaAssetAuthorityRecord): Record<string, unknown> {
  return omitAuthorityFields(record, ['id', 'storageObjectRecordId', 'createdAt', 'updatedAt'])
}

function lineageComparableStorageObject(record: PrivateStorageObjectAuthorityRecord): Record<string, unknown> {
  return omitAuthorityFields(record, ['id', 'mediaAssetId', 'createdAt', 'updatedAt'])
}

function omitAuthorityFields(
  record: Record<string, unknown>,
  omittedFields: string[],
): Record<string, unknown> {
  const omitted = new Set(omittedFields)
  return Object.fromEntries(Object.entries(record).filter(([key]) => !omitted.has(key)))
}

function privateUploadMediaAuthorityAggregatePath(scope: PrivateUploadMediaAuthorityScope): string {
  return [
    'upload-media-authority',
    'private-internal-v1',
    privateUploadMediaAuthorityScopeHash(scope),
    'aggregate.json',
  ].join('/')
}

function privateUploadMediaAuthorityScopeHash(
  scope: Omit<PrivateUploadMediaAuthorityScope, 'localStorageRoot'>,
): string {
  return privateUploadMediaAuthorityValueHash(`${scope.ownerUserId}\u0000${scope.workspaceId}`)
}

function assertSafeScope(scope: PrivateUploadMediaAuthorityScope): void {
  if (
    !scope.localStorageRoot.trim() ||
    !isSafeId(scope.ownerUserId) ||
    !isSafeId(scope.workspaceId)
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Safe private upload/media authority scope is required.', 400)
  }
}

function isSafeId(value: string): boolean {
  return Boolean(
    value &&
    value.length <= 160 &&
    !value.includes('..') &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)
  )
}

function parseRecord<T>(
  schema: { safeParse(value: unknown): { success: true; data: T } | { success: false; error: { flatten(): unknown } } },
  value: unknown,
  label: string,
): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw invalidStoredAuthority(`${label} shape is invalid.`, parsed.error.flatten())
  return parsed.data
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => [key, stableJsonValue(entryValue)]),
  )
}

async function withProcessLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = scopeLocks.get(key) ?? Promise.resolve()
  let release: () => void = () => undefined
  const current = new Promise<void>((resolve) => { release = resolve })
  const queued = previous.catch(() => undefined).then(() => current)
  scopeLocks.set(key, queued)
  await previous.catch(() => undefined)
  try {
    return await operation()
  } finally {
    release()
    if (scopeLocks.get(key) === queued) scopeLocks.delete(key)
  }
}

function invalidStoredAuthority(message: string, details?: unknown): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, details)
}
