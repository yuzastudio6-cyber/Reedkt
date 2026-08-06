import { createHash, randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import {
  PRIVATE_ARTIFACT_QA_AGGREGATE_VERSION,
  PRIVATE_ARTIFACT_QA_BLOB_VERSION,
  artifactQaBlobRefSchema,
  persistedPrivateArtifactQaAggregateSchema,
  persistedPrivateArtifactQaBlobSchema,
  privateArtifactQaAggregateSchema,
  type PersistedArtifactQaEvaluation,
  type PersistedArtifactReconciliation,
  type PersistedArtifactResult,
  type PrivateArtifactQaAggregate,
} from '../validation/private-artifact-qa-authority-schemas'
import { findApprovedSnapshotSecretLikePaths } from './approved-snapshot-validation'

const MAX_AGGREGATE_BYTES = 16 * 1024 * 1024
const MAX_BLOB_BYTES = 1024 * 1024

export interface PrivateArtifactQaStoreScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
}

export interface PrivateArtifactQaBlobRef {
  sha256: string
  byteLength: number
}

const scopeLocks = new Map<string, Promise<void>>()
const blobLocks = new Map<string, Promise<void>>()

export function clearPrivateArtifactQaAuthorityProcessStateForSmoke(): void {
  scopeLocks.clear()
  blobLocks.clear()
}

export function privateArtifactQaAggregateRelativePath(
  ownerUserId: string,
  workspaceId: string,
): string {
  return join(
    'artifact-qa-authority',
    'private-internal-v1',
    artifactQaScopeHash(ownerUserId, workspaceId),
    'aggregate.json',
  ).split('/').join('/')
}

export function privateArtifactQaBlobRelativePath(sha256: string): string {
  if (!/^[a-f0-9]{64}$/.test(sha256)) {
    throw new ApiError('VALIDATION_FAILED', 'Private artifact evidence SHA-256 is invalid.', 400)
  }
  return join(
    'artifact-qa-authority',
    'blobs',
    'sha256',
    sha256.slice(0, 2),
    `${sha256}.json`,
  ).split('/').join('/')
}

export async function putPrivateArtifactQaEvidenceBlob(input: {
  localStorageRoot: string
  value: Record<string, unknown>
}): Promise<PrivateArtifactQaBlobRef> {
  const stableValue = stableArtifactQaJsonValue(input.value) as Record<string, unknown>
  const serializedValue = JSON.stringify(stableValue)
  const byteLength = Buffer.byteLength(serializedValue, 'utf8')
  if (byteLength <= 0 || byteLength > MAX_BLOB_BYTES) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Private artifact/QA evidence exceeds its bounded content-addressed blob limit.',
      413,
      { byteLength, maxBytes: MAX_BLOB_BYTES },
    )
  }
  assertNoSecretLikeContent(stableValue, 'Private artifact/QA evidence')
  const sha256 = sha256ArtifactQaValue(stableValue)

  await withProcessLock(blobLocks, sha256, async () => {
    const record = {
      recordVersion: PRIVATE_ARTIFACT_QA_BLOB_VERSION,
      source: 'private_artifact_qa_content_addressed_blob' as const,
      sha256,
      byteLength,
      value: stableValue,
    }
    const recordBytes = Buffer.from(`${JSON.stringify(record)}\n`, 'utf8')
    try {
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: privateArtifactQaBlobRelativePath(sha256),
        content: recordBytes,
      })
    } catch (error) {
      if (!(error instanceof ApiError) || error.code !== 'IDEMPOTENCY_CONFLICT') throw error
      const existing = await readPrivateArtifactQaEvidenceBlob({
        localStorageRoot: input.localStorageRoot,
        ref: { sha256, byteLength },
      })
      if (stableArtifactQaStringify(existing) !== serializedValue) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Content-addressed artifact/QA evidence collided with different bytes.',
          409,
        )
      }
    }
  })

  return { sha256, byteLength }
}

export async function readPrivateArtifactQaEvidenceBlob(input: {
  localStorageRoot: string
  ref: PrivateArtifactQaBlobRef
}): Promise<Record<string, unknown>> {
  const parsedRef = artifactQaBlobRefSchema.safeParse(input.ref)
  if (!parsedRef.success) {
    throw new ApiError('VALIDATION_FAILED', 'Private artifact/QA evidence reference is invalid.', 409)
  }
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: privateArtifactQaBlobRelativePath(parsedRef.data.sha256),
  })
  if (!content) {
    throw new ApiError('VALIDATION_FAILED', 'Private artifact/QA evidence blob was not found.', 409)
  }
  const parsedJson = parseJsonObject(content, 'Private artifact/QA evidence blob')
  const parsed = persistedPrivateArtifactQaBlobSchema.safeParse(parsedJson)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Private artifact/QA evidence blob has an unsupported shape.',
      409,
      parsed.error.flatten(),
    )
  }
  const serializedValue = stableArtifactQaStringify(parsed.data.value)
  if (
    parsed.data.sha256 !== parsedRef.data.sha256 ||
    parsed.data.byteLength !== parsedRef.data.byteLength ||
    sha256Text(serializedValue) !== parsed.data.sha256 ||
    Buffer.byteLength(serializedValue, 'utf8') !== parsed.data.byteLength
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private artifact/QA evidence blob integrity failed.', 409)
  }
  assertNoSecretLikeContent(parsed.data.value, 'Private artifact/QA evidence blob')
  return parsed.data.value
}

export async function readPrivateArtifactQaAggregate(
  scope: PrivateArtifactQaStoreScope,
): Promise<PrivateArtifactQaAggregate | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: privateArtifactQaAggregateRelativePath(scope.ownerUserId, scope.workspaceId),
  })
  if (!content) return undefined
  return parseAggregateRecord(content, scope)
}

export async function mutatePrivateArtifactQaAggregate<T>(input: {
  scope: PrivateArtifactQaStoreScope
  now: string
  mutation: (
    aggregate: PrivateArtifactQaAggregate,
  ) => Promise<{ result: T; changed: boolean }> | { result: T; changed: boolean }
}): Promise<T> {
  const lockKey = artifactQaScopeHash(input.scope.ownerUserId, input.scope.workspaceId)
  return withProcessLock(scopeLocks, lockKey, async () => {
    const existing = await readPrivateArtifactQaAggregate(input.scope)
    const aggregate = existing ?? createAggregate(input.scope, input.now)
    const mutation = await input.mutation(aggregate)
    if (!mutation.changed) return mutation.result

    aggregate.revision += 1
    aggregate.updatedAt = input.now
    assertAggregateValid(aggregate, input.scope)
    const recordWithoutChecksum = {
      recordVersion: PRIVATE_ARTIFACT_QA_AGGREGATE_VERSION,
      source: 'private_artifact_qa_authority_store' as const,
      aggregate,
    }
    const record = {
      ...recordWithoutChecksum,
      checksumSha256: sha256ArtifactQaValue(aggregate),
    }
    const content = `${JSON.stringify(record)}\n`
    const byteLength = Buffer.byteLength(content, 'utf8')
    if (byteLength > MAX_AGGREGATE_BYTES) {
      throw new ApiError(
        'IDEMPOTENCY_CAPACITY_EXCEEDED',
        'Private artifact/QA authority reached its bounded aggregate capacity.',
        503,
        { byteLength, maxBytes: MAX_AGGREGATE_BYTES },
      )
    }
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: input.scope.localStorageRoot,
      relativePath: privateArtifactQaAggregateRelativePath(
        input.scope.ownerUserId,
        input.scope.workspaceId,
      ),
      content,
    })
    return mutation.result
  })
}

export async function verifyAllPrivateArtifactQaEvidenceBlobs(input: {
  scope: PrivateArtifactQaStoreScope
  aggregate: PrivateArtifactQaAggregate
}): Promise<void> {
  for (const artifact of input.aggregate.artifacts) {
    await verifyEvidenceBlob(input.scope.localStorageRoot, artifact.resultEvidenceRef, artifact.resultEvidenceHash)
  }
  for (const qaEvaluation of input.aggregate.qaEvaluations) {
    await verifyEvidenceBlob(input.scope.localStorageRoot, qaEvaluation.qaEvidenceRef, qaEvaluation.qaEvidenceHash)
  }
}

export function findCurrentPrivateTestSelection(input: {
  aggregate: PrivateArtifactQaAggregate
  identity: Pick<PrivateArtifactQaAggregate['artifacts'][number]['identity'],
    'workspaceId' | 'projectId' | 'editSessionId' | 'snapshotId' | 'jobId' | 'expectedAssetId'>
}): {
  artifact: PersistedArtifactResult
  qa: PersistedArtifactQaEvaluation
  reconciliation: PersistedArtifactReconciliation
} | undefined {
  for (let index = input.aggregate.reconciliations.length - 1; index >= 0; index -= 1) {
    const reconciliation = input.aggregate.reconciliations[index]
    if (
      reconciliation.decision !== 'test_merged_not_live_authorized' ||
      !reconciliation.privateTestDependencySatisfied ||
      !sameIdentity(reconciliation.identity, input.identity)
    ) continue
    const artifact = input.aggregate.artifacts.find((candidate) =>
      candidate.artifactId === reconciliation.artifactId)
    const qa = input.aggregate.qaEvaluations.find((candidate) =>
      candidate.qaEvaluationId === reconciliation.qaEvaluationId)
    if (!artifact || !qa) {
      throw new ApiError('VALIDATION_FAILED', 'Private artifact selection lineage is incomplete.', 409)
    }
    return { artifact, qa, reconciliation }
  }
  return undefined
}

export function stableArtifactQaStringify(value: unknown): string {
  return JSON.stringify(stableArtifactQaJsonValue(value))
}

export function sha256ArtifactQaValue(value: unknown): string {
  return sha256Text(stableArtifactQaStringify(value))
}

function createAggregate(
  scope: PrivateArtifactQaStoreScope,
  now: string,
): PrivateArtifactQaAggregate {
  return {
    schemaVersion: PRIVATE_ARTIFACT_QA_AGGREGATE_VERSION,
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    revision: 0,
    artifacts: [],
    qaEvaluations: [],
    reconciliations: [],
    idempotencyRecords: [],
    auditEvents: [],
    createdAt: now,
    updatedAt: now,
  }
}

function parseAggregateRecord(
  content: string,
  scope: PrivateArtifactQaStoreScope,
): PrivateArtifactQaAggregate {
  const parsedJson = parseJsonObject(content, 'Private artifact/QA authority aggregate')
  const parsed = persistedPrivateArtifactQaAggregateSchema.safeParse(parsedJson)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Private artifact/QA authority aggregate has an unsupported shape.',
      409,
      parsed.error.flatten(),
    )
  }
  if (parsed.data.checksumSha256 !== sha256ArtifactQaValue(parsed.data.aggregate)) {
    throw new ApiError('VALIDATION_FAILED', 'Private artifact/QA authority aggregate checksum is invalid.', 409)
  }
  assertAggregateValid(parsed.data.aggregate, scope)
  return parsed.data.aggregate
}

function assertAggregateValid(
  aggregateInput: PrivateArtifactQaAggregate,
  scope: PrivateArtifactQaStoreScope,
): void {
  const parsed = privateArtifactQaAggregateSchema.safeParse(aggregateInput)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Private artifact/QA authority aggregate validation failed.',
      409,
      parsed.error.flatten(),
    )
  }
  const aggregate = parsed.data
  if (
    aggregate.ownerUserId !== scope.ownerUserId ||
    aggregate.workspaceId !== scope.workspaceId
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private artifact/QA authority tenant scope is invalid.', 409)
  }
  assertNoSecretLikeContent(aggregate, 'Private artifact/QA authority aggregate')

  assertUnique(aggregate.artifacts.map((record) => record.artifactId), 'artifact IDs')
  assertUnique(aggregate.qaEvaluations.map((record) => record.qaEvaluationId), 'QA evaluation IDs')
  assertUnique(aggregate.reconciliations.map((record) => record.reconciliationId), 'reconciliation IDs')
  assertUnique(aggregate.auditEvents.map((record) => record.eventId), 'audit event IDs')
  assertUnique(aggregate.idempotencyRecords.map((record) => record.idempotencyKey), 'idempotency keys')

  const artifactById = new Map(aggregate.artifacts.map((artifact) => [artifact.artifactId, artifact]))
  const qaById = new Map(aggregate.qaEvaluations.map((qa) => [qa.qaEvaluationId, qa]))
  const reconciliationByArtifactId = new Set<string>()
  const qaByArtifactId = new Set<string>()
  const versionsByExpectedAsset = new Map<string, Set<number>>()

  for (const artifact of aggregate.artifacts) {
    assertIdentityScope(artifact.identity, aggregate)
    if (
      artifact.identity.expectedAssetId !== artifact.lineage.assetId ||
      artifact.identity.jobId === '' ||
      artifact.resultEvidenceHash !== artifact.resultEvidenceRef.sha256 ||
      artifact.liveRuntimeEligible !== false
    ) {
      throw invalidAggregate('Artifact result lineage or evidence reference is invalid.')
    }
    const identityKey = identityKeyOf(artifact.identity)
    const versions = versionsByExpectedAsset.get(identityKey) ?? new Set<number>()
    if (versions.has(artifact.artifactVersion)) {
      throw invalidAggregate('Artifact authority contains duplicate versions for one expected output.')
    }
    versions.add(artifact.artifactVersion)
    versionsByExpectedAsset.set(identityKey, versions)

    if (artifact.artifactVersion === 1) {
      if (artifact.replacesArtifactId !== undefined || artifact.attemptKind !== 'initial') {
        throw invalidAggregate('Initial artifact version lineage is invalid.')
      }
    } else {
      const predecessor = artifact.replacesArtifactId
        ? artifactById.get(artifact.replacesArtifactId)
        : undefined
      if (
        !predecessor ||
        !sameIdentity(predecessor.identity, artifact.identity) ||
        predecessor.artifactVersion !== artifact.artifactVersion - 1 ||
        artifact.attemptKind === 'initial'
      ) {
        throw invalidAggregate('Replacement artifact version lineage is invalid.')
      }
    }
  }

  for (const qa of aggregate.qaEvaluations) {
    assertIdentityScope(qa.identity, aggregate)
    const artifact = artifactById.get(qa.artifactId)
    if (
      !artifact ||
      !sameIdentity(artifact.identity, qa.identity) ||
      qa.qaEvidenceHash !== qa.qaEvidenceRef.sha256 ||
      qa.liveRuntimeEligible !== false ||
      qaByArtifactId.has(qa.artifactId)
    ) {
      throw invalidAggregate('Artifact QA evaluation lineage is invalid or duplicated.')
    }
    qaByArtifactId.add(qa.artifactId)
  }

  const activeSelectionByIdentity = new Map<string, PersistedArtifactReconciliation>()
  for (const reconciliation of aggregate.reconciliations) {
    assertIdentityScope(reconciliation.identity, aggregate)
    const artifact = artifactById.get(reconciliation.artifactId)
    const qa = qaById.get(reconciliation.qaEvaluationId)
    if (
      !artifact ||
      !qa ||
      qa.artifactId !== artifact.artifactId ||
      !sameIdentity(artifact.identity, reconciliation.identity) ||
      reconciliationByArtifactId.has(artifact.artifactId) ||
      reconciliation.liveRuntimeDependencySatisfied !== false ||
      reconciliation.finalRenderAuthorized !== false
    ) {
      throw invalidAggregate('Artifact reconciliation lineage is invalid or duplicated.')
    }
    reconciliationByArtifactId.add(artifact.artifactId)
    const identityKey = identityKeyOf(artifact.identity)
    const priorSelection = activeSelectionByIdentity.get(identityKey)
    if (reconciliation.decision === 'test_merged_not_live_authorized') {
      if (
        artifact.placeholder.isPlaceholder ||
        !['passed', 'warning'].includes(qa.outcome) ||
        !reconciliation.privateTestDependencySatisfied ||
        reconciliation.replacesSelectedArtifactId !== priorSelection?.artifactId
      ) {
        throw invalidAggregate('Private-test merged artifact selection is invalid.')
      }
      activeSelectionByIdentity.set(identityKey, reconciliation)
    } else if (reconciliation.privateTestDependencySatisfied) {
      throw invalidAggregate('Only a test-merged artifact can satisfy private-test dependencies.')
    }
  }

  for (const idempotency of aggregate.idempotencyRecords) {
    const exists = idempotency.operation === 'record_artifact'
      ? artifactById.has(idempotency.responseId)
      : idempotency.operation === 'record_qa'
        ? qaById.has(idempotency.responseId)
        : aggregate.reconciliations.some((record) => record.reconciliationId === idempotency.responseId)
    if (!exists) throw invalidAggregate('Artifact/QA idempotency response lineage is invalid.')
  }

  for (const event of aggregate.auditEvents) {
    assertIdentityScope(event.identity, aggregate)
    if (!artifactById.has(event.artifactId)) {
      throw invalidAggregate('Artifact/QA audit event artifact lineage is invalid.')
    }
    if (event.qaEvaluationId && !qaById.has(event.qaEvaluationId)) {
      throw invalidAggregate('Artifact/QA audit event QA lineage is invalid.')
    }
    if (
      event.reconciliationId &&
      !aggregate.reconciliations.some((record) => record.reconciliationId === event.reconciliationId)
    ) {
      throw invalidAggregate('Artifact/QA audit event reconciliation lineage is invalid.')
    }
  }
}

async function verifyEvidenceBlob(
  localStorageRoot: string,
  ref: PrivateArtifactQaBlobRef,
  expectedHash: string,
): Promise<void> {
  if (ref.sha256 !== expectedHash) {
    throw new ApiError('VALIDATION_FAILED', 'Private artifact/QA evidence hash reference is invalid.', 409)
  }
  await readPrivateArtifactQaEvidenceBlob({ localStorageRoot, ref })
}

function assertIdentityScope(
  identity: PersistedArtifactResult['identity'],
  aggregate: PrivateArtifactQaAggregate,
): void {
  if (identity.workspaceId !== aggregate.workspaceId) {
    throw invalidAggregate('Artifact/QA record workspace scope is invalid.')
  }
}

function identityKeyOf(identity: PersistedArtifactResult['identity']): string {
  return stableArtifactQaStringify(identity)
}

function sameIdentity(
  left: PersistedArtifactResult['identity'],
  right: PersistedArtifactResult['identity'],
): boolean {
  return identityKeyOf(left) === identityKeyOf(right)
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw invalidAggregate(`Private artifact/QA authority contains duplicate ${label}.`)
  }
}

function assertNoSecretLikeContent(value: unknown, label: string): void {
  const secretLikePaths = findApprovedSnapshotSecretLikePaths(value)
  if (secretLikePaths.length > 0) {
    throw new ApiError(
      'VALIDATION_FAILED',
      `${label} contains secret-like fields or values.`,
      409,
      { secretLikePaths },
    )
  }
}

function invalidAggregate(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}

function parseJsonObject(content: string, label: string): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new ApiError('VALIDATION_FAILED', `${label} is not valid JSON.`, 409)
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ApiError('VALIDATION_FAILED', `${label} is not an object.`, 409)
  }
  return parsed as Record<string, unknown>
}

function artifactQaScopeHash(ownerUserId: string, workspaceId: string): string {
  return sha256Text(`${ownerUserId}\n${workspaceId}`)
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableArtifactQaJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableArtifactQaJsonValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nested]) => nested !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stableArtifactQaJsonValue(nested)]),
    )
  }
  return value
}

async function withProcessLock<T>(
  locks: Map<string, Promise<void>>,
  key: string,
  action: () => Promise<T>,
): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve()
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  const tail = previous.then(() => gate)
  locks.set(key, tail)
  await previous
  try {
    return await action()
  } finally {
    release()
    if (locks.get(key) === tail) locks.delete(key)
  }
}

export function createPrivateArtifactQaEventId(prefix: string): string {
  return `${prefix}_${randomUUID()}`
}
