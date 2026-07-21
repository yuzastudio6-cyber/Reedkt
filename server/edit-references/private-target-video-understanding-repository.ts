import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { chmod, mkdir, open, realpath, rename, rm } from 'node:fs/promises'
import { dirname, relative, resolve, sep } from 'node:path'
import type { TargetVideoUnderstandingPackage } from '../../src/types/edit-reference-target-video-understanding'
import { validateTargetVideoUnderstandingPackage } from './edit-reference-target-video-understanding-contract'
import type { EditReferenceRepositoryScope } from './edit-reference-repository'

const PACKAGE_ENVELOPE_VERSION = 'target-video-understanding-package-envelope-v1' as const
const LATEST_ENVELOPE_VERSION = 'target-video-understanding-latest-envelope-v1' as const
const RECORD_SOURCE = 'target_video_understanding_repository' as const
const DIRECTORY_MODE = 0o700
const FILE_MODE = 0o600
const MAX_PACKAGE_BYTES = 8 * 1024 * 1024
const MAX_LATEST_BYTES = 32 * 1024

export interface TargetVideoUnderstandingBinding {
  readonly projectId: string
  readonly editSessionId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly storageObjectRecordId: string
  readonly editBriefDigestSha256: string
}

interface PackageEnvelopePayload {
  readonly recordVersion: typeof PACKAGE_ENVELOPE_VERSION
  readonly source: typeof RECORD_SOURCE
  readonly scopeHash: string
  readonly bindingHash: string
  readonly package: TargetVideoUnderstandingPackage
}

interface PackageEnvelope extends PackageEnvelopePayload {
  readonly checksumSha256: string
}

interface LatestEnvelopePayload {
  readonly recordVersion: typeof LATEST_ENVELOPE_VERSION
  readonly source: typeof RECORD_SOURCE
  readonly scopeHash: string
  readonly bindingHash: string
  readonly packageId: string
  readonly packageDigestSha256: string
  readonly runId: string
  readonly runRevision: number
  readonly updatedAt: string
}

interface LatestEnvelope extends LatestEnvelopePayload {
  readonly checksumSha256: string
}

export interface TargetVideoUnderstandingPersistenceResult {
  readonly package: TargetVideoUnderstandingPackage
  readonly disposition: 'created' | 'idempotent_replay'
  readonly persistence: 'backend_local_private_versioned'
  readonly rawMediaPersisted: false
  readonly rawTranscriptPersisted: false
  readonly signedUrlPersisted: false
  readonly localFilePathPersisted: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly remoteMutationMade: false
}

const bindingLocks = new Map<string, Promise<void>>()

export class PrivateTargetVideoUnderstandingRepository {
  readonly persistence = 'backend_local_private_versioned' as const

  async save(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly package: TargetVideoUnderstandingPackage
  }): Promise<TargetVideoUnderstandingPersistenceResult> {
    validateScope(input.scope)
    validateTargetVideoUnderstandingPackage(input.package)
    validatePackageScope(input.scope, input.package)
    const binding = bindingFromPackage(input.package)
    return withBindingLock(input.scope, binding, async () => {
      const paths = pathsFor(input.scope, binding, input.package.packageId)
      const existing = await readPackageFile(paths, input.scope, binding)
      let disposition: TargetVideoUnderstandingPersistenceResult['disposition'] = 'created'
      if (existing) {
        if (existing.packageDigestSha256 !== input.package.packageDigestSha256) {
          throw persistenceConflict('target_video_understanding_package_conflict')
        }
        disposition = 'idempotent_replay'
      } else {
        const payload: PackageEnvelopePayload = {
          recordVersion: PACKAGE_ENVELOPE_VERSION,
          source: RECORD_SOURCE,
          scopeHash: scopeHash(input.scope),
          bindingHash: bindingHash(binding),
          package: structuredClone(input.package),
        }
        const envelope: PackageEnvelope = {
          ...payload,
          checksumSha256: sha256(stableStringify(payload)),
        }
        await writeEnvelope(paths.root, paths.packageFile, envelope, MAX_PACKAGE_BYTES)
      }

      const latestPayload: LatestEnvelopePayload = {
        recordVersion: LATEST_ENVELOPE_VERSION,
        source: RECORD_SOURCE,
        scopeHash: scopeHash(input.scope),
        bindingHash: bindingHash(binding),
        packageId: input.package.packageId,
        packageDigestSha256: input.package.packageDigestSha256,
        runId: input.package.study.runId,
        runRevision: input.package.study.runRevision,
        updatedAt: input.package.updatedAt,
      }
      const latest: LatestEnvelope = {
        ...latestPayload,
        checksumSha256: sha256(stableStringify(latestPayload)),
      }
      const currentLatest = await readLatestEnvelope(paths, input.scope, binding)
      if (currentLatest && currentLatest.runId === latest.runId) {
        if (currentLatest.runRevision > latest.runRevision) {
          throw persistenceConflict('target_video_understanding_latest_revision_regressed')
        }
      }
      await writeEnvelope(paths.root, paths.latestFile, latest, MAX_LATEST_BYTES)
      return result(existing ?? input.package, disposition)
    })
  }

  async readLatest(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly binding: TargetVideoUnderstandingBinding
  }): Promise<TargetVideoUnderstandingPackage | undefined> {
    validateScope(input.scope)
    validateBinding(input.binding)
    return withBindingLock(input.scope, input.binding, async () => {
      const bindingPaths = pathsFor(input.scope, input.binding, 'latest-placeholder')
      const latest = await readLatestEnvelope(bindingPaths, input.scope, input.binding)
      if (!latest) return undefined
      const packagePaths = pathsFor(input.scope, input.binding, latest.packageId)
      const packageRecord = await readPackageFile(packagePaths, input.scope, input.binding)
      if (!packageRecord) throw persistenceConflict('target_video_understanding_latest_package_missing')
      if (
        packageRecord.packageDigestSha256 !== latest.packageDigestSha256
        || packageRecord.packageId !== latest.packageId
        || packageRecord.study.runId !== latest.runId
      ) throw persistenceConflict('target_video_understanding_latest_pointer_mismatch')
      return packageRecord
    })
  }
}

export function clearPrivateTargetVideoUnderstandingRepositoryProcessStateForSmoke(): void {
  bindingLocks.clear()
}

function result(
  packageRecord: TargetVideoUnderstandingPackage,
  disposition: TargetVideoUnderstandingPersistenceResult['disposition'],
): TargetVideoUnderstandingPersistenceResult {
  return {
    package: structuredClone(packageRecord),
    disposition,
    persistence: 'backend_local_private_versioned',
    rawMediaPersisted: false,
    rawTranscriptPersisted: false,
    signedUrlPersisted: false,
    localFilePathPersisted: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    remoteMutationMade: false,
  }
}

function bindingFromPackage(value: TargetVideoUnderstandingPackage): TargetVideoUnderstandingBinding {
  return {
    projectId: value.projectId,
    editSessionId: value.editSessionId,
    editReferenceId: value.editReferenceId,
    studySessionId: value.studySessionId,
    storageObjectRecordId: value.source.storageObjectRecordId,
    editBriefDigestSha256: value.declaredContext.editBriefDigestSha256,
  }
}

function validatePackageScope(
  scope: EditReferenceRepositoryScope,
  value: TargetVideoUnderstandingPackage,
): void {
  if (value.workspaceId !== scope.workspaceId) {
    throw persistenceConflict('target_video_understanding_workspace_mismatch')
  }
  validateBinding(bindingFromPackage(value))
}

function validateScope(scope: EditReferenceRepositoryScope): void {
  if (!scope.localStorageRoot || !scope.ownerUserId || !scope.workspaceId) {
    throw persistenceConflict('target_video_understanding_scope_invalid')
  }
  for (const value of [scope.ownerUserId, scope.workspaceId]) assertId(value)
}

function validateBinding(binding: TargetVideoUnderstandingBinding): void {
  for (const value of [
    binding.projectId,
    binding.editSessionId,
    binding.editReferenceId,
    binding.studySessionId,
    binding.storageObjectRecordId,
  ]) assertId(value)
  if (!isSha256(binding.editBriefDigestSha256)) {
    throw persistenceConflict('target_video_understanding_brief_digest_invalid')
  }
}

function assertId(value: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/.test(value)) {
    throw persistenceConflict('target_video_understanding_identity_invalid')
  }
}

interface TargetVideoUnderstandingPaths {
  readonly root: string
  readonly directory: string
  readonly packageFile: string
  readonly latestFile: string
}

function pathsFor(
  scope: EditReferenceRepositoryScope,
  binding: TargetVideoUnderstandingBinding,
  packageId: string,
): TargetVideoUnderstandingPaths {
  const root = resolve(scope.localStorageRoot)
  const directory = resolve(
    root,
    'edit-reference-private',
    'scopes',
    scopeHash(scope),
    'target-video-understanding',
    bindingHash(binding),
  )
  return {
    root,
    directory,
    packageFile: resolve(directory, 'versions', `${sha256(packageId)}.json`),
    latestFile: resolve(directory, 'latest.json'),
  }
}

async function readPackageFile(
  paths: TargetVideoUnderstandingPaths,
  scope: EditReferenceRepositoryScope,
  binding: TargetVideoUnderstandingBinding,
): Promise<TargetVideoUnderstandingPackage | undefined> {
  const bytes = await readPrivateFile(paths.root, paths.packageFile, MAX_PACKAGE_BYTES)
  if (!bytes) return undefined
  const envelope = parseEnvelope<PackageEnvelope>(bytes, 'target_video_understanding_package_json_invalid')
  const { checksumSha256, ...payload } = envelope
  if (
    envelope.recordVersion !== PACKAGE_ENVELOPE_VERSION
    || envelope.source !== RECORD_SOURCE
    || envelope.scopeHash !== scopeHash(scope)
    || envelope.bindingHash !== bindingHash(binding)
    || !isSha256(checksumSha256)
    || checksumSha256 !== sha256(stableStringify(payload))
  ) throw persistenceConflict('target_video_understanding_package_envelope_invalid')
  validateTargetVideoUnderstandingPackage(envelope.package)
  validatePackageScope(scope, envelope.package)
  if (bindingHash(bindingFromPackage(envelope.package)) !== bindingHash(binding)) {
    throw persistenceConflict('target_video_understanding_package_binding_mismatch')
  }
  return structuredClone(envelope.package)
}

async function readLatestEnvelope(
  paths: TargetVideoUnderstandingPaths,
  scope: EditReferenceRepositoryScope,
  binding: TargetVideoUnderstandingBinding,
): Promise<LatestEnvelope | undefined> {
  const bytes = await readPrivateFile(paths.root, paths.latestFile, MAX_LATEST_BYTES)
  if (!bytes) return undefined
  const envelope = parseEnvelope<LatestEnvelope>(bytes, 'target_video_understanding_latest_json_invalid')
  const { checksumSha256, ...payload } = envelope
  if (
    envelope.recordVersion !== LATEST_ENVELOPE_VERSION
    || envelope.source !== RECORD_SOURCE
    || envelope.scopeHash !== scopeHash(scope)
    || envelope.bindingHash !== bindingHash(binding)
    || !isSha256(envelope.packageDigestSha256)
    || !isSha256(checksumSha256)
    || checksumSha256 !== sha256(stableStringify(payload))
    || !Number.isSafeInteger(envelope.runRevision)
    || envelope.runRevision < 1
  ) throw persistenceConflict('target_video_understanding_latest_envelope_invalid')
  return envelope
}

function parseEnvelope<T>(bytes: Buffer, code: string): T {
  try {
    const parsed = JSON.parse(bytes.toString('utf8'))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(code)
    return parsed as T
  } catch {
    throw persistenceConflict(code)
  }
}

async function readPrivateFile(root: string, file: string, maximumBytes: number): Promise<Buffer | undefined> {
  assertInside(root, file)
  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW)
  } catch (error) {
    if (isNodeError(error, 'ENOENT')) return undefined
    throw error
  }
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size > maximumBytes) {
      throw persistenceConflict('target_video_understanding_private_file_unsafe')
    }
    await handle.chmod(FILE_MODE)
    return await handle.readFile()
  } finally {
    await handle.close()
  }
}

async function writeEnvelope(root: string, file: string, envelope: unknown, maximumBytes: number): Promise<void> {
  if (findForbiddenPersistenceKey(envelope)) {
    throw persistenceConflict('target_video_understanding_forbidden_private_field')
  }
  const content = `${JSON.stringify(envelope, null, 2)}\n`
  if (Buffer.byteLength(content) > maximumBytes) {
    throw persistenceConflict('target_video_understanding_record_exceeds_byte_ceiling')
  }
  assertInside(root, file)
  await ensurePrivateDirectory(root, dirname(file))
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`
  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    handle = await open(
      temporary,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      FILE_MODE,
    )
    await handle.writeFile(content, 'utf8')
    await handle.sync()
  } finally {
    await handle?.close()
  }
  try {
    await rename(temporary, file)
    await chmod(file, FILE_MODE)
    const directory = await open(dirname(file), constants.O_RDONLY)
    try { await directory.sync() } finally { await directory.close() }
  } catch (error) {
    await rm(temporary, { force: true })
    throw error
  }
}

async function ensurePrivateDirectory(root: string, directory: string): Promise<void> {
  assertInside(root, directory)
  await mkdir(directory, { recursive: true, mode: DIRECTORY_MODE })
  await chmod(directory, DIRECTORY_MODE)
  const [rootRealPath, directoryRealPath] = await Promise.all([realpath(root), realpath(directory)])
  const rel = relative(rootRealPath, directoryRealPath)
  if (rel.startsWith('..') || rel === '' || rel.split(sep).includes('..')) {
    throw persistenceConflict('target_video_understanding_private_directory_unsafe')
  }
}

function assertInside(root: string, target: string): void {
  const rel = relative(resolve(root), resolve(target))
  if (!rel || rel.startsWith('..') || rel.split(sep).includes('..')) {
    throw persistenceConflict('target_video_understanding_path_escape')
  }
}

async function withBindingLock<T>(
  scope: EditReferenceRepositoryScope,
  binding: TargetVideoUnderstandingBinding,
  operation: () => Promise<T>,
): Promise<T> {
  const key = `${scopeHash(scope)}:${bindingHash(binding)}`
  const previous = bindingLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolvePromise) => { release = resolvePromise })
  const queued = previous.then(() => current)
  bindingLocks.set(key, queued)
  await previous
  try {
    return await operation()
  } finally {
    release()
    if (bindingLocks.get(key) === queued) bindingLocks.delete(key)
  }
}

function scopeHash(scope: EditReferenceRepositoryScope): string {
  return sha256(`${scope.ownerUserId}\u0000${scope.workspaceId}`)
}

function bindingHash(binding: TargetVideoUnderstandingBinding): string {
  validateBinding(binding)
  return sha256(stableStringify(binding))
}

function findForbiddenPersistenceKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(findForbiddenPersistenceKey)
  if (!value || typeof value !== 'object') return false
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (/^(localFilePath|signedUrl|rawTranscript|rawFrameBytes|rawProviderPayload|providerPayload|secret|apiKey)$/i.test(key)) {
      if (child !== false && child !== null && child !== undefined) return true
    }
    if (findForbiddenPersistenceKey(child)) return true
  }
  return false
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function isNodeError(error: unknown, code: string): boolean {
  return error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === code
}

function persistenceConflict(code: string): Error {
  return new Error(code)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
}
