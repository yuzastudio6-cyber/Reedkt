import { createHash, randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import {
  link,
  lstat,
  mkdir,
  open,
  realpath,
  rm,
} from 'node:fs/promises'
import { dirname, isAbsolute, resolve, sep } from 'node:path'
import { Readable } from 'node:stream'
import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  ensurePrivateDirectoryWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
  CANONICAL_MODEL_ARTIFACT_INGEST_RECEIPT_VERSION,
  CANONICAL_MODEL_ARTIFACT_LOCATOR_VERSION,
  CANONICAL_MODEL_ARTIFACT_MANIFEST_VERSION,
  CANONICAL_MODEL_ARTIFACT_REPOSITORY_ROOT_AUTHORITY_VERSION,
  CANONICAL_MODEL_ARTIFACT_REPOSITORY_VERSION,
  CANONICAL_MODEL_ARTIFACT_SOURCE_READER_VERSION,
  CANONICAL_MODEL_ARTIFACT_VERIFICATION_VERSION,
  type CanonicalModelArtifactAuthorityBoundary,
  type CanonicalModelArtifactDescriptor,
  type CanonicalModelArtifactIngestReceipt,
  type CanonicalModelArtifactLocator,
  type CanonicalModelArtifactManifest,
  type CanonicalModelArtifactRepositoryPort,
  type CanonicalModelArtifactRepositoryRootAuthority,
  type CanonicalModelArtifactSourceReaderPort,
  type CanonicalModelArtifactVerificationReceipt,
} from './canonical-model-artifact-types'

const PRIVATE_DIRECTORY_MODE = 0o700
const PRIVATE_MANIFEST_MODE = 0o600
const IMMUTABLE_MODEL_OBJECT_MODE = 0o400
const MAXIMUM_MODEL_ARTIFACT_BYTES = 64 * 1024 * 1024 * 1024
const MAXIMUM_MANIFEST_BYTES = 128 * 1024
const MANIFEST_RECORD_VERSION =
  'canonical-model-artifact-manifest-record-v1' as const
const REPOSITORY_LOCK_PATH = 'locks/repository.lock'
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const ARTIFACT_RECORD_PATTERN = /^model-artifact-[a-f0-9]{64}$/u

const safeIdSchema = z.string().regex(SAFE_ID_PATTERN)
  .refine((value) => !value.includes('..'))
const digestSchema = z.string().regex(DIGEST_PATTERN)
const safeLabelSchema = z.string().trim().min(1).max(240)
  .refine((value) => !containsControlCharacter(value))
  .refine((value) => !/(?:https?:\/\/|file:\/\/|gs:\/\/|s3:\/\/)/iu.test(value))
  .refine((value) => !/(?:api[_-]?key|authorization|credential|private[_-]?key|secret)/iu.test(value))
const consumerScopesSchema = z.array(safeIdSchema).min(1).max(32)
  .refine((values) => new Set(values).size === values.length)
  .refine((values) => values.every(
    (value, index) => index === 0 || values[index - 1]! < value,
  ))

const licensePolicySchema = z.object({
  modelArtifactLicense: safeLabelSchema,
  commercialUseStatus: z.enum([
    'allowed',
    'blocked',
    'unknown',
    'needs_review',
  ]),
  reviewStatus: z.enum([
    'not_reviewed',
    'needs_review',
    'approved',
    'blocked',
    'evaluation_only',
  ]),
  redistributionAllowed: z.boolean(),
  requiresAttribution: z.boolean(),
  paidProductionUseApproved: z.boolean(),
  sourceLicenseDocumentSha256: digestSchema,
  modelCardDocumentSha256: digestSchema.nullable(),
}).strict().superRefine((policy, context) => {
  if (
    policy.paidProductionUseApproved
    && (
      policy.commercialUseStatus !== 'allowed'
      || policy.reviewStatus !== 'approved'
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'Paid-production approval requires allowed commercial use and approved review status.',
    })
  }
})

const gpuExecutionPolicySchema = z.object({
  executionClass: z.literal('gpu_required'),
  requiredExecutionTarget: z.literal('google_cloud_run_gpu'),
  accelerator: z.literal('cuda'),
  cpuFallbackAllowed: z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  networkFetchAllowed: z.literal(false),
}).strict()

const cpuExecutionPolicySchema = z.object({
  executionClass: z.literal('cpu_permitted'),
  requiredExecutionTarget: z.literal('private_controlled_cpu'),
  accelerator: z.literal('none'),
  cpuFallbackAllowed: z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  networkFetchAllowed: z.literal(false),
}).strict()

const descriptorSchema = z.object({
  descriptorVersion: z.literal(
    CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
  ),
  artifactId: safeIdSchema,
  revision: safeIdSchema,
  artifactFormat: z.enum([
    'onnx',
    'safetensors',
    'pytorch_checkpoint',
    'torchscript',
    'gguf',
    'tokenizer',
    'configuration',
    'reviewed_binary',
  ]),
  artifactRole: safeIdSchema,
  modelFamily: safeIdSchema,
  byteLength: z.number().int().positive().max(
    MAXIMUM_MODEL_ARTIFACT_BYTES,
  ),
  contentSha256: digestSchema,
  consumerScopes: consumerScopesSchema,
  repositoryAdmission: z.enum([
    'controlled_internal_test',
    'reviewed_repository_candidate',
  ]),
  sourceObservationDigestSha256: digestSchema,
  reviewEvidenceDigestSha256: digestSchema,
  securityReviewDigestSha256: digestSchema,
  licensePolicy: licensePolicySchema,
  executionPolicy: z.discriminatedUnion('executionClass', [
    gpuExecutionPolicySchema,
    cpuExecutionPolicySchema,
  ]),
  callerBytesAccepted: z.literal(false),
  callerPathAccepted: z.literal(false),
  callerUrlAccepted: z.literal(false),
}).strict().superRefine((descriptor, context) => {
  if (
    descriptor.licensePolicy.paidProductionUseApproved
    && descriptor.repositoryAdmission !==
      'reviewed_repository_candidate'
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'Paid-production license evidence requires reviewed repository-candidate admission.',
    })
  }
})

const authorityBoundarySchema = z.object({
  repositoryIntegrityAuthority: z.literal(true),
  serverOwnedBytesOnly: z.literal(true),
  contentAddressedStorage: z.literal(true),
  fullChecksumOnEveryRead: z.literal(true),
  readOnlyLeaseAuthority: z.literal(true),
  runtimeDownloadAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  toolRegistryAuthority: z.literal(false),
  operationAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  assetManifestAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  modelInferenceAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const manifestDraftSchema = z.object({
  manifestVersion: z.literal(CANONICAL_MODEL_ARTIFACT_MANIFEST_VERSION),
  storageClass: z.literal(
    'private_single_host_content_addressed_model_artifact',
  ),
  artifactRecordId: z.string().regex(ARTIFACT_RECORD_PATTERN),
  descriptorDigestSha256: digestSchema,
  ingestedAt: z.string().datetime({ offset: true }),
  descriptor: descriptorSchema,
  authorityBoundary: authorityBoundarySchema,
}).strict()

const manifestSchema = manifestDraftSchema.extend({
  manifestDigestSha256: digestSchema,
}).strict()

const manifestRecordSchema = z.object({
  recordVersion: z.literal(MANIFEST_RECORD_VERSION),
  manifest: manifestSchema,
  checksumSha256: digestSchema,
}).strict()

const locatorSchema = z.object({
  locatorVersion: z.literal(CANONICAL_MODEL_ARTIFACT_LOCATOR_VERSION),
  artifactRecordId: z.string().regex(ARTIFACT_RECORD_PATTERN),
  artifactId: safeIdSchema,
  revision: safeIdSchema,
  contentSha256: digestSchema,
  manifestDigestSha256: digestSchema,
}).strict()

interface RootAuthorityState {
  readonly rootPath: string
  readonly device: number
  readonly inode: number
}

interface RepositoryState {
  readonly root: RootAuthorityState
  readonly now: () => Date
}

interface VerifiedObject {
  readonly absolutePath: string
  readonly byteLength: number
  readonly contentSha256: string
  readonly identityDigestSha256: string
}

interface ManifestRead {
  readonly manifest: CanonicalModelArtifactManifest
  readonly locator: CanonicalModelArtifactLocator
}

const rootAuthorityStates =
  new WeakMap<object, RootAuthorityState>()
const repositoryStates =
  new WeakMap<object, RepositoryState>()
const sourceReaderCapabilities =
  new WeakSet<object>()
const openedSourceReaders =
  new WeakSet<object>()

export const CANONICAL_MODEL_ARTIFACT_AUTHORITY_BOUNDARY:
  CanonicalModelArtifactAuthorityBoundary = Object.freeze({
    repositoryIntegrityAuthority: true,
    serverOwnedBytesOnly: true,
    contentAddressedStorage: true,
    fullChecksumOnEveryRead: true,
    readOnlyLeaseAuthority: true,
    runtimeDownloadAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    operationAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    modelInferenceAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionReady: false,
  })

export async function createCanonicalModelArtifactRepositoryRootAuthority(
  input: {
    readonly rootPath: string
  },
): Promise<CanonicalModelArtifactRepositoryRootAuthority> {
  if (
    typeof input.rootPath !== 'string'
    || !input.rootPath.trim()
    || !isAbsolute(input.rootPath)
    || input.rootPath.includes('\0')
    || /(?:https?:\/\/|file:\/\/|gs:\/\/|s3:\/\/)/iu.test(input.rootPath)
  ) {
    throw invalid('model_artifact_repository_root_invalid')
  }
  const requestedRoot = resolve(input.rootPath)
  await mkdir(requestedRoot, {
    recursive: true,
    mode: PRIVATE_DIRECTORY_MODE,
  })
  const requestedStat = await lstat(requestedRoot)
  if (requestedStat.isSymbolicLink() || !requestedStat.isDirectory()) {
    throw corrupt('model_artifact_repository_root_not_regular')
  }
  const rootPath = await realpath(requestedRoot)
  const handle = await open(
    rootPath,
    constants.O_RDONLY | constants.O_NOFOLLOW,
  )
  let device: number
  let inode: number
  try {
    const stat = await handle.stat()
    if (!stat.isDirectory()) {
      throw corrupt('model_artifact_repository_root_not_regular')
    }
    await handle.chmod(PRIVATE_DIRECTORY_MODE)
    device = stat.dev
    inode = stat.ino
  } finally {
    await handle.close()
  }
  const rootState = { rootPath, device, inode }
  await assertRepositoryRoot(rootState)
  for (const relativePath of [
    'objects',
    'manifests',
    'staging',
    'locks',
  ]) {
    await ensurePrivateDirectoryWithinRoot({ rootPath, relativePath })
  }
  await assertRepositoryRoot(rootState)

  const authority =
    Object.freeze<CanonicalModelArtifactRepositoryRootAuthority>({
      authorityVersion:
        CANONICAL_MODEL_ARTIFACT_REPOSITORY_ROOT_AUTHORITY_VERSION,
      authorityClass:
        'process_bound_server_injected_model_artifact_repository_root',
      storageClass:
        'symlink_safe_private_single_host_content_addressed',
      rootFingerprintSha256: sha256Value({ device, inode }),
      callerPathAccepted: false,
      browserShareable: false,
      remoteStorageAuthority: false,
      distributedLockAuthority: false,
      hostileSameUidProtectionProven: false,
      productionReady: false,
    })
  rootAuthorityStates.set(authority, rootState)
  return authority
}

export function createCanonicalModelArtifactRepository(input: {
  readonly rootAuthority:
    | CanonicalModelArtifactRepositoryRootAuthority
    | null
    | undefined
  readonly now?: () => Date
}): CanonicalModelArtifactRepositoryPort {
  const root = assertRootAuthority(input.rootAuthority)
  const now = input.now ?? (() => new Date())
  if (typeof now !== 'function') {
    throw invalid('model_artifact_repository_clock_invalid')
  }
  const repository =
    Object.freeze<CanonicalModelArtifactRepositoryPort>({
      repositoryVersion: CANONICAL_MODEL_ARTIFACT_REPOSITORY_VERSION,
      repositoryClass:
        'process_bound_private_model_artifact_repository',
      storageClass:
        'private_single_host_content_addressed_model_artifact',
      browserShareable: false,
      distributedDurabilityProven: false,
      productionReady: false,
    })
  repositoryStates.set(repository, { root, now })
  return repository
}

export function createCanonicalModelArtifactSourceReader(input: {
  readonly descriptor: CanonicalModelArtifactDescriptor
  readonly openServerOwnedByteStream: () => Promise<Readable>
}): CanonicalModelArtifactSourceReaderPort {
  if (typeof input.openServerOwnedByteStream !== 'function') {
    throw invalid('model_artifact_source_reader_function_required')
  }
  const descriptor = freezeValue(
    parseDescriptor(input.descriptor),
  )
  const reader = Object.freeze<CanonicalModelArtifactSourceReaderPort>({
    readerVersion: CANONICAL_MODEL_ARTIFACT_SOURCE_READER_VERSION,
    sourceAuthority:
      'process_bound_server_owned_model_artifact_bytes',
    descriptor,
    callerBytesAccepted: false,
    callerPathAccepted: false,
    callerUrlAccepted: false,
    runtimeDownloadAllowed: false,
    productionReady: false,
    openServerOwnedByteStream:
      input.openServerOwnedByteStream.bind(undefined),
  })
  sourceReaderCapabilities.add(reader)
  return reader
}

export async function ingestCanonicalModelArtifact(input: {
  readonly repository:
    | CanonicalModelArtifactRepositoryPort
    | null
    | undefined
  readonly sourceReader:
    | CanonicalModelArtifactSourceReaderPort
    | null
    | undefined
}): Promise<CanonicalModelArtifactIngestReceipt> {
  const state = assertRepository(input.repository)
  const reader = assertSourceReader(input.sourceReader)
  const descriptor = parseDescriptor(reader.descriptor)
  const descriptorDigestSha256 = sha256Value(descriptor)
  const artifactRecordId =
    `model-artifact-${descriptorDigestSha256}`
  await assertRepositoryRoot(state.root)

  return withPrivateCooperativeFileLockWithinRoot({
    rootPath: state.root.rootPath,
    relativePath: REPOSITORY_LOCK_PATH,
    operation: async () => {
      await assertRepositoryRoot(state.root)
      const existing = await readManifestByRecordId(
        state,
        artifactRecordId,
        true,
      )
      if (existing) {
        assertManifestMatchesDescriptor(existing.manifest, descriptor)
        const verified = await verifyObject(
          state,
          existing.manifest.descriptor,
        )
        return createIngestReceipt({
          disposition: 'idempotent_replay',
          locator: existing.locator,
          descriptorDigestSha256,
          verified,
          sourceStreamOpened: false,
          contentObjectCreated: false,
          manifestCreated: false,
        })
      }

      const objectPath = objectAbsolutePath(
        state.root.rootPath,
        descriptor.contentSha256,
      )
      const objectAlreadyExists = await derivedFileExists(
        state.root,
        objectPath,
      )
      let verified: VerifiedObject
      let sourceStreamOpened = false
      let contentObjectCreated = false
      let disposition:
        | 'created'
        | 'reused_verified_content_object'

      if (objectAlreadyExists) {
        verified = await verifyObject(state, descriptor)
        disposition = 'reused_verified_content_object'
      } else {
        sourceStreamOpened = true
        const staged = await stageSourceBytes({
          state,
          reader,
          descriptor,
        })
        try {
          contentObjectCreated = await publishStagedObject({
            state,
            descriptor,
            stagedPath: staged,
          })
        } finally {
          await rm(staged, { force: true }).catch(() => undefined)
        }
        verified = await verifyObject(state, descriptor)
        disposition = 'created'
      }

      const manifest = createManifest({
        descriptor,
        descriptorDigestSha256,
        artifactRecordId,
        ingestedAt: exactNow(state.now),
      })
      const record = {
        recordVersion: MANIFEST_RECORD_VERSION,
        manifest,
        checksumSha256: sha256Value(manifest),
      }
      const created = await writePrivateFileCreateOnlyWithinRoot({
        rootPath: state.root.rootPath,
        relativePath: manifestRelativePath(artifactRecordId),
        content: Buffer.from(`${stableStringify(record)}\n`, 'utf8'),
      })
      const committed = await readManifestByRecordId(
        state,
        artifactRecordId,
        false,
      )
      if (!committed) {
        throw corrupt('model_artifact_manifest_commit_missing')
      }
      assertManifestMatchesDescriptor(committed.manifest, descriptor)
      const readback = await verifyObject(state, descriptor)
      if (
        readback.contentSha256 !== verified.contentSha256
        || readback.byteLength !== verified.byteLength
        || readback.identityDigestSha256 !==
          verified.identityDigestSha256
      ) {
        throw corrupt('model_artifact_object_changed_during_commit')
      }
      return createIngestReceipt({
        disposition,
        locator: committed.locator,
        descriptorDigestSha256,
        verified: readback,
        sourceStreamOpened,
        contentObjectCreated,
        manifestCreated: created.created,
      })
    },
  })
}

export async function verifyCanonicalModelArtifact(input: {
  readonly repository:
    | CanonicalModelArtifactRepositoryPort
    | null
    | undefined
  readonly locator: CanonicalModelArtifactLocator
}): Promise<CanonicalModelArtifactVerificationReceipt> {
  const state = assertRepository(input.repository)
  const locator = parseLocator(input.locator)
  await assertRepositoryRoot(state.root)
  const manifestRead = await readManifestByRecordId(
    state,
    locator.artifactRecordId,
    false,
  )
  if (!manifestRead) {
    throw missing('model_artifact_manifest_not_found')
  }
  if (stableStringify(manifestRead.locator) !== stableStringify(locator)) {
    throw corrupt('model_artifact_locator_manifest_mismatch')
  }
  const verified = await verifyObject(
    state,
    manifestRead.manifest.descriptor,
  )
  const draft = {
    verificationVersion: CANONICAL_MODEL_ARTIFACT_VERIFICATION_VERSION,
    verificationClass:
      'full_no_follow_sha256_model_artifact_verification' as const,
    locator,
    manifest: manifestRead.manifest,
    verifiedAt: exactNow(state.now),
    verifiedByteLength: verified.byteLength,
    verifiedContentSha256: verified.contentSha256,
    objectIdentityDigestSha256: verified.identityDigestSha256,
    hostPathIncluded: false as const,
    bytesIncluded: false as const,
    productionReady: false as const,
  }
  return freezeValue({
    ...draft,
    verificationDigestSha256: sha256Value(draft),
  })
}

/**
 * Server-internal bridge used by the read-only lease module. The absolute
 * source path never enters the lease or its serializable receipt. The object
 * is fully rehashed before and after the process-bound consumer callback, and
 * any inode, mode, timestamp, length, or digest change fails closed.
 */
export async function withVerifiedCanonicalModelArtifactSource<T>(input: {
  readonly repository:
    | CanonicalModelArtifactRepositoryPort
    | null
    | undefined
  readonly locator: CanonicalModelArtifactLocator
  readonly operation: (input: {
    readonly absolutePath: string
    readonly manifest: CanonicalModelArtifactManifest
    readonly before: CanonicalModelArtifactVerificationReceipt
  }) => Promise<T>
}): Promise<{
  readonly result: T
  readonly before: CanonicalModelArtifactVerificationReceipt
  readonly after: CanonicalModelArtifactVerificationReceipt
}> {
  if (typeof input.operation !== 'function') {
    throw invalid('model_artifact_verified_source_operation_required')
  }
  const state = assertRepository(input.repository)
  const before = await verifyCanonicalModelArtifact({
    repository: input.repository,
    locator: input.locator,
  })
  const absolutePath = objectAbsolutePath(
    state.root.rootPath,
    before.manifest.descriptor.contentSha256,
  )
  let result: T | undefined
  let operationError: unknown
  try {
    result = await input.operation({
      absolutePath,
      manifest: before.manifest,
      before,
    })
  } catch (error) {
    operationError = error
  }
  const after = await verifyCanonicalModelArtifact({
    repository: input.repository,
    locator: input.locator,
  })
  if (
    before.manifest.manifestDigestSha256 !==
      after.manifest.manifestDigestSha256
    || before.verifiedContentSha256 !== after.verifiedContentSha256
    || before.verifiedByteLength !== after.verifiedByteLength
    || before.objectIdentityDigestSha256 !==
      after.objectIdentityDigestSha256
  ) {
    throw corrupt('model_artifact_changed_during_verified_consumption')
  }
  if (operationError !== undefined) throw operationError
  return {
    result: result as T,
    before,
    after,
  }
}

export function canonicalModelArtifactValueSha256(value: unknown): string {
  return sha256Value(value)
}

function assertRootAuthority(
  authority:
    | CanonicalModelArtifactRepositoryRootAuthority
    | null
    | undefined,
): RootAuthorityState {
  if (
    !authority
    || !rootAuthorityStates.has(authority)
    || authority.authorityVersion !==
      CANONICAL_MODEL_ARTIFACT_REPOSITORY_ROOT_AUTHORITY_VERSION
    || authority.authorityClass !==
      'process_bound_server_injected_model_artifact_repository_root'
    || authority.storageClass !==
      'symlink_safe_private_single_host_content_addressed'
    || !DIGEST_PATTERN.test(authority.rootFingerprintSha256)
    || authority.callerPathAccepted !== false
    || authority.browserShareable !== false
    || authority.remoteStorageAuthority !== false
    || authority.distributedLockAuthority !== false
    || authority.hostileSameUidProtectionProven !== false
    || authority.productionReady !== false
  ) {
    throw blocked('model_artifact_repository_root_authority_invalid')
  }
  return rootAuthorityStates.get(authority)!
}

function assertRepository(
  repository:
    | CanonicalModelArtifactRepositoryPort
    | null
    | undefined,
): RepositoryState {
  if (
    !repository
    || !repositoryStates.has(repository)
    || repository.repositoryVersion !==
      CANONICAL_MODEL_ARTIFACT_REPOSITORY_VERSION
    || repository.repositoryClass !==
      'process_bound_private_model_artifact_repository'
    || repository.storageClass !==
      'private_single_host_content_addressed_model_artifact'
    || repository.browserShareable !== false
    || repository.distributedDurabilityProven !== false
    || repository.productionReady !== false
  ) {
    throw blocked('model_artifact_repository_capability_invalid')
  }
  return repositoryStates.get(repository)!
}

function assertSourceReader(
  reader:
    | CanonicalModelArtifactSourceReaderPort
    | null
    | undefined,
): CanonicalModelArtifactSourceReaderPort {
  if (
    !reader
    || !sourceReaderCapabilities.has(reader)
    || reader.readerVersion !==
      CANONICAL_MODEL_ARTIFACT_SOURCE_READER_VERSION
    || reader.sourceAuthority !==
      'process_bound_server_owned_model_artifact_bytes'
    || reader.callerBytesAccepted !== false
    || reader.callerPathAccepted !== false
    || reader.callerUrlAccepted !== false
    || reader.runtimeDownloadAllowed !== false
    || reader.productionReady !== false
    || typeof reader.openServerOwnedByteStream !== 'function'
  ) {
    throw blocked('model_artifact_source_reader_capability_invalid')
  }
  parseDescriptor(reader.descriptor)
  return reader
}

async function stageSourceBytes(input: {
  readonly state: RepositoryState
  readonly reader: CanonicalModelArtifactSourceReaderPort
  readonly descriptor: CanonicalModelArtifactDescriptor
}): Promise<string> {
  if (openedSourceReaders.has(input.reader)) {
    throw blocked('model_artifact_source_reader_already_consumed')
  }
  openedSourceReaders.add(input.reader)
  await ensurePrivateDirectoryWithinRoot({
    rootPath: input.state.root.rootPath,
    relativePath: 'staging',
  })
  const stagedPath = resolve(
    input.state.root.rootPath,
    'staging',
    `${randomUUID()}.partial`,
  )
  const handle = await open(
    stagedPath,
    constants.O_WRONLY
      | constants.O_CREAT
      | constants.O_EXCL
      | constants.O_NOFOLLOW,
    PRIVATE_MANIFEST_MODE,
  )
  let byteLength = 0
  const hash = createHash('sha256')
  try {
    const stream = await input.reader.openServerOwnedByteStream()
    if (!(stream instanceof Readable)) {
      throw invalid('model_artifact_source_reader_stream_invalid')
    }
    for await (const chunk of stream) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      byteLength += bytes.byteLength
      if (byteLength > input.descriptor.byteLength) {
        throw invalid('model_artifact_source_exceeds_declared_length', 413)
      }
      hash.update(bytes)
      let offset = 0
      while (offset < bytes.byteLength) {
        const write = await handle.write(
          bytes,
          offset,
          bytes.byteLength - offset,
          null,
        )
        if (write.bytesWritten <= 0) {
          throw corrupt('model_artifact_staging_write_stalled')
        }
        offset += write.bytesWritten
      }
    }
    const contentSha256 = hash.digest('hex')
    if (
      byteLength !== input.descriptor.byteLength
      || contentSha256 !== input.descriptor.contentSha256
    ) {
      throw invalid('model_artifact_source_integrity_mismatch')
    }
    const stat = await handle.stat()
    if (
      !stat.isFile()
      || stat.nlink !== 1
      || stat.size !== byteLength
    ) {
      throw corrupt('model_artifact_staging_file_invalid')
    }
    await handle.chmod(IMMUTABLE_MODEL_OBJECT_MODE)
    await handle.sync()
    return stagedPath
  } catch (error) {
    await rm(stagedPath, { force: true }).catch(() => undefined)
    throw error
  } finally {
    await handle.close().catch(() => undefined)
  }
}

async function publishStagedObject(input: {
  readonly state: RepositoryState
  readonly descriptor: CanonicalModelArtifactDescriptor
  readonly stagedPath: string
}): Promise<boolean> {
  const relativePath = objectRelativePath(
    input.descriptor.contentSha256,
  )
  await ensurePrivateDirectoryWithinRoot({
    rootPath: input.state.root.rootPath,
    relativePath: dirname(relativePath),
  })
  const targetPath = resolve(input.state.root.rootPath, relativePath)
  await assertDerivedDirectoryChain(
    input.state.root,
    dirname(targetPath),
  )
  try {
    await link(input.stagedPath, targetPath)
  } catch (error) {
    if (!isNodeError(error, 'EEXIST')) throw error
    await verifyObject(input.state, input.descriptor)
    return false
  }
  const stagedStat = await lstat(input.stagedPath)
  const targetStat = await lstat(targetPath)
  if (
    stagedStat.isSymbolicLink()
    || targetStat.isSymbolicLink()
    || !stagedStat.isFile()
    || !targetStat.isFile()
    || stagedStat.dev !== targetStat.dev
    || stagedStat.ino !== targetStat.ino
    || stagedStat.nlink !== 2
    || targetStat.nlink !== 2
  ) {
    throw corrupt('model_artifact_object_publish_identity_invalid')
  }
  await rm(input.stagedPath)
  const publishedStat = await lstat(targetPath)
  if (
    !publishedStat.isFile()
    || publishedStat.isSymbolicLink()
    || publishedStat.nlink !== 1
    || (publishedStat.mode & 0o777) !== IMMUTABLE_MODEL_OBJECT_MODE
  ) {
    throw corrupt('model_artifact_object_publish_final_state_invalid')
  }
  return true
}

function createManifest(input: {
  readonly descriptor: CanonicalModelArtifactDescriptor
  readonly descriptorDigestSha256: string
  readonly artifactRecordId: string
  readonly ingestedAt: string
}): CanonicalModelArtifactManifest {
  const draft = manifestDraftSchema.parse({
    manifestVersion: CANONICAL_MODEL_ARTIFACT_MANIFEST_VERSION,
    storageClass:
      'private_single_host_content_addressed_model_artifact',
    artifactRecordId: input.artifactRecordId,
    descriptorDigestSha256: input.descriptorDigestSha256,
    ingestedAt: input.ingestedAt,
    descriptor: input.descriptor,
    authorityBoundary: CANONICAL_MODEL_ARTIFACT_AUTHORITY_BOUNDARY,
  })
  return freezeValue(manifestSchema.parse({
    ...draft,
    manifestDigestSha256: sha256Value(draft),
  }))
}

async function readManifestByRecordId(
  state: RepositoryState,
  artifactRecordId: string,
  allowMissing: boolean,
): Promise<ManifestRead | undefined> {
  if (!ARTIFACT_RECORD_PATTERN.test(artifactRecordId)) {
    throw invalid('model_artifact_record_id_invalid')
  }
  const path = manifestAbsolutePath(
    state.root.rootPath,
    artifactRecordId,
  )
  const bytes = await readVerifiedSmallFile({
    root: state.root,
    absolutePath: path,
    allowMissing,
    maximumBytes: MAXIMUM_MANIFEST_BYTES,
  })
  if (!bytes) return undefined
  let unknownRecord: unknown
  try {
    unknownRecord = JSON.parse(bytes.toString('utf8')) as unknown
  } catch {
    throw corrupt('model_artifact_manifest_json_invalid')
  }
  const parsed = manifestRecordSchema.safeParse(unknownRecord)
  if (!parsed.success) {
    throw corrupt('model_artifact_manifest_schema_invalid')
  }
  const record = parsed.data
  if (
    record.checksumSha256 !== sha256Value(record.manifest)
  ) {
    throw corrupt('model_artifact_manifest_record_checksum_invalid')
  }
  const {
    manifestDigestSha256,
    ...manifestDraft
  } = record.manifest
  if (
    manifestDigestSha256 !== sha256Value(manifestDraft)
    || record.manifest.descriptorDigestSha256 !==
      sha256Value(record.manifest.descriptor)
    || record.manifest.artifactRecordId !==
      `model-artifact-${record.manifest.descriptorDigestSha256}`
    || record.manifest.artifactRecordId !== artifactRecordId
  ) {
    throw corrupt('model_artifact_manifest_digest_invalid')
  }
  const manifest = freezeValue(
    manifestSchema.parse(record.manifest),
  )
  const locator = createLocator(manifest)
  return { manifest, locator }
}

function createLocator(
  manifest: CanonicalModelArtifactManifest,
): CanonicalModelArtifactLocator {
  return freezeValue(locatorSchema.parse({
    locatorVersion: CANONICAL_MODEL_ARTIFACT_LOCATOR_VERSION,
    artifactRecordId: manifest.artifactRecordId,
    artifactId: manifest.descriptor.artifactId,
    revision: manifest.descriptor.revision,
    contentSha256: manifest.descriptor.contentSha256,
    manifestDigestSha256: manifest.manifestDigestSha256,
  }))
}

function parseLocator(
  locator: CanonicalModelArtifactLocator,
): CanonicalModelArtifactLocator {
  const parsed = locatorSchema.safeParse(locator)
  if (!parsed.success) {
    throw invalid('model_artifact_locator_invalid')
  }
  return freezeValue(parsed.data)
}

function parseDescriptor(
  descriptor: CanonicalModelArtifactDescriptor,
): CanonicalModelArtifactDescriptor {
  const parsed = descriptorSchema.safeParse(descriptor)
  if (!parsed.success) {
    throw invalid('model_artifact_descriptor_invalid')
  }
  return freezeValue(parsed.data)
}

function assertManifestMatchesDescriptor(
  manifest: CanonicalModelArtifactManifest,
  descriptor: CanonicalModelArtifactDescriptor,
): void {
  if (
    manifest.descriptorDigestSha256 !== sha256Value(descriptor)
    || stableStringify(manifest.descriptor) !==
      stableStringify(descriptor)
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'The model-artifact record already exists with different metadata.',
      409,
      { reason: 'model_artifact_descriptor_conflict' },
    )
  }
}

async function verifyObject(
  state: RepositoryState,
  descriptor: CanonicalModelArtifactDescriptor,
): Promise<VerifiedObject> {
  const absolutePath = objectAbsolutePath(
    state.root.rootPath,
    descriptor.contentSha256,
  )
  await assertDerivedDirectoryChain(
    state.root,
    dirname(absolutePath),
  )
  let pathStat: Awaited<ReturnType<typeof lstat>>
  try {
    pathStat = await lstat(absolutePath)
  } catch (error) {
    if (isNodeError(error, 'ENOENT')) {
      throw missing('model_artifact_content_object_not_found')
    }
    throw error
  }
  assertImmutableObjectStat(pathStat)
  const handle = await open(
    absolutePath,
    constants.O_RDONLY | constants.O_NOFOLLOW,
  )
  try {
    const before = await handle.stat()
    assertImmutableObjectStat(before)
    if (
      before.dev !== pathStat.dev
      || before.ino !== pathStat.ino
      || before.size !== descriptor.byteLength
    ) {
      throw corrupt('model_artifact_object_identity_mismatch')
    }
    const hash = createHash('sha256')
    const buffer = Buffer.allocUnsafe(1024 * 1024)
    let total = 0
    while (total < before.size) {
      const read = await handle.read(
        buffer,
        0,
        Math.min(buffer.byteLength, before.size - total),
        total,
      )
      if (read.bytesRead <= 0) {
        throw corrupt('model_artifact_object_short_read')
      }
      hash.update(buffer.subarray(0, read.bytesRead))
      total += read.bytesRead
    }
    const after = await handle.stat()
    assertImmutableObjectStat(after)
    if (
      !sameFileSnapshot(before, after)
      || total !== descriptor.byteLength
      || hash.digest('hex') !== descriptor.contentSha256
    ) {
      throw corrupt('model_artifact_object_integrity_invalid')
    }
    await assertRepositoryRoot(state.root)
    await assertDerivedDirectoryChain(
      state.root,
      dirname(absolutePath),
    )
    const latest = await lstat(absolutePath)
    assertImmutableObjectStat(latest)
    if (!sameFileSnapshot(before, latest)) {
      throw corrupt('model_artifact_object_changed_during_read')
    }
    return {
      absolutePath,
      byteLength: total,
      contentSha256: descriptor.contentSha256,
      identityDigestSha256: sha256Value(fileSnapshot(before)),
    }
  } finally {
    await handle.close().catch(() => undefined)
  }
}

async function readVerifiedSmallFile(input: {
  readonly root: RootAuthorityState
  readonly absolutePath: string
  readonly allowMissing: boolean
  readonly maximumBytes: number
}): Promise<Buffer | undefined> {
  await assertDerivedDirectoryChain(
    input.root,
    dirname(input.absolutePath),
    input.allowMissing,
  )
  let pathStat: Awaited<ReturnType<typeof lstat>>
  try {
    pathStat = await lstat(input.absolutePath)
  } catch (error) {
    if (input.allowMissing && isNodeError(error, 'ENOENT')) {
      return undefined
    }
    if (isNodeError(error, 'ENOENT')) {
      throw missing('model_artifact_manifest_not_found')
    }
    throw error
  }
  if (
    pathStat.isSymbolicLink()
    || !pathStat.isFile()
    || pathStat.nlink !== 1
    || pathStat.size < 1
    || pathStat.size > input.maximumBytes
    || (pathStat.mode & 0o077) !== 0
  ) {
    throw corrupt('model_artifact_manifest_file_invalid')
  }
  const handle = await open(
    input.absolutePath,
    constants.O_RDONLY | constants.O_NOFOLLOW,
  )
  try {
    const before = await handle.stat()
    if (
      !before.isFile()
      || before.nlink !== 1
      || before.size !== pathStat.size
      || before.dev !== pathStat.dev
      || before.ino !== pathStat.ino
      || (before.mode & 0o077) !== 0
    ) {
      throw corrupt('model_artifact_manifest_identity_invalid')
    }
    const bytes = await handle.readFile()
    const after = await handle.stat()
    if (
      bytes.byteLength !== before.size
      || !sameFileSnapshot(before, after)
    ) {
      throw corrupt('model_artifact_manifest_changed_during_read')
    }
    const latest = await lstat(input.absolutePath)
    if (!sameFileSnapshot(before, latest)) {
      throw corrupt('model_artifact_manifest_changed_during_read')
    }
    return bytes
  } finally {
    await handle.close().catch(() => undefined)
  }
}

async function derivedFileExists(
  root: RootAuthorityState,
  absolutePath: string,
): Promise<boolean> {
  await assertDerivedDirectoryChain(root, dirname(absolutePath), true)
  try {
    const stat = await lstat(absolutePath)
    if (stat.isSymbolicLink() || !stat.isFile()) {
      throw corrupt('model_artifact_derived_file_not_regular')
    }
    return true
  } catch (error) {
    if (isNodeError(error, 'ENOENT')) return false
    throw error
  }
}

async function assertRepositoryRoot(
  root: RootAuthorityState,
): Promise<void> {
  const pathStat = await lstat(root.rootPath)
  if (
    pathStat.isSymbolicLink()
    || !pathStat.isDirectory()
    || pathStat.dev !== root.device
    || pathStat.ino !== root.inode
    || (pathStat.mode & 0o077) !== 0
  ) {
    throw corrupt('model_artifact_repository_root_changed')
  }
  const handle = await open(
    root.rootPath,
    constants.O_RDONLY | constants.O_NOFOLLOW,
  )
  try {
    const opened = await handle.stat()
    if (
      !opened.isDirectory()
      || opened.dev !== root.device
      || opened.ino !== root.inode
      || (opened.mode & 0o077) !== 0
    ) {
      throw corrupt('model_artifact_repository_root_changed')
    }
  } finally {
    await handle.close()
  }
}

async function assertDerivedDirectoryChain(
  root: RootAuthorityState,
  directoryPath: string,
  allowMissing = false,
): Promise<boolean> {
  await assertRepositoryRoot(root)
  const relativePath = relativeWithinRoot(root.rootPath, directoryPath)
  let current = root.rootPath
  for (const segment of relativePath.split(sep).filter(Boolean)) {
    current = resolve(current, segment)
    let pathStat: Awaited<ReturnType<typeof lstat>>
    try {
      pathStat = await lstat(current)
    } catch (error) {
      if (allowMissing && isNodeError(error, 'ENOENT')) return false
      throw error
    }
    if (
      pathStat.isSymbolicLink()
      || !pathStat.isDirectory()
      || (pathStat.mode & 0o077) !== 0
    ) {
      throw corrupt('model_artifact_repository_directory_invalid')
    }
    const handle = await open(
      current,
      constants.O_RDONLY | constants.O_NOFOLLOW,
    )
    try {
      const opened = await handle.stat()
      if (
        !opened.isDirectory()
        || opened.dev !== pathStat.dev
        || opened.ino !== pathStat.ino
      ) {
        throw corrupt(
          'model_artifact_repository_directory_identity_changed',
        )
      }
    } finally {
      await handle.close()
    }
  }
  return true
}

function relativeWithinRoot(rootPath: string, path: string): string {
  const normalizedRoot = resolve(rootPath)
  const normalizedPath = resolve(path)
  if (
    normalizedPath !== normalizedRoot
    && !normalizedPath.startsWith(`${normalizedRoot}${sep}`)
  ) {
    throw corrupt('model_artifact_path_escaped_repository_root')
  }
  return normalizedPath.slice(normalizedRoot.length + 1)
}

function assertImmutableObjectStat(stat: {
  readonly isFile: () => boolean
  readonly isSymbolicLink?: () => boolean
  readonly nlink: number
  readonly mode: number
}): void {
  if (
    stat.isSymbolicLink?.()
    || !stat.isFile()
    || stat.nlink !== 1
    || (stat.mode & 0o777) !== IMMUTABLE_MODEL_OBJECT_MODE
  ) {
    throw corrupt('model_artifact_object_not_immutable_regular_file')
  }
}

function fileSnapshot(stat: {
  readonly dev: number
  readonly ino: number
  readonly mode: number
  readonly nlink: number
  readonly size: number
  readonly mtimeMs: number
  readonly ctimeMs: number
}): Record<string, number> {
  return {
    device: stat.dev,
    inode: stat.ino,
    mode: stat.mode,
    linkCount: stat.nlink,
    byteLength: stat.size,
    modifiedAtMs: stat.mtimeMs,
    changedAtMs: stat.ctimeMs,
  }
}

function sameFileSnapshot(
  left: Parameters<typeof fileSnapshot>[0],
  right: Parameters<typeof fileSnapshot>[0],
): boolean {
  return stableStringify(fileSnapshot(left)) ===
    stableStringify(fileSnapshot(right))
}

function objectRelativePath(contentSha256: string): string {
  if (!DIGEST_PATTERN.test(contentSha256)) {
    throw invalid('model_artifact_content_digest_invalid')
  }
  return `objects/${contentSha256.slice(0, 2)}/${contentSha256}.bin`
}

function objectAbsolutePath(
  rootPath: string,
  contentSha256: string,
): string {
  return resolve(rootPath, objectRelativePath(contentSha256))
}

function manifestRelativePath(artifactRecordId: string): string {
  if (!ARTIFACT_RECORD_PATTERN.test(artifactRecordId)) {
    throw invalid('model_artifact_record_id_invalid')
  }
  const digest = artifactRecordId.slice('model-artifact-'.length)
  return `manifests/${digest.slice(0, 2)}/${digest}.json`
}

function manifestAbsolutePath(
  rootPath: string,
  artifactRecordId: string,
): string {
  return resolve(rootPath, manifestRelativePath(artifactRecordId))
}

function createIngestReceipt(input: {
  readonly disposition:
    | 'created'
    | 'reused_verified_content_object'
    | 'idempotent_replay'
  readonly locator: CanonicalModelArtifactLocator
  readonly descriptorDigestSha256: string
  readonly verified: VerifiedObject
  readonly sourceStreamOpened: boolean
  readonly contentObjectCreated: boolean
  readonly manifestCreated: boolean
}): CanonicalModelArtifactIngestReceipt {
  const draft = {
    receiptVersion: CANONICAL_MODEL_ARTIFACT_INGEST_RECEIPT_VERSION,
    disposition: input.disposition,
    locator: input.locator,
    descriptorDigestSha256: input.descriptorDigestSha256,
    verifiedContentSha256: input.verified.contentSha256,
    verifiedByteLength: input.verified.byteLength,
    sourceStreamOpened: input.sourceStreamOpened,
    contentObjectCreated: input.contentObjectCreated,
    manifestCreated: input.manifestCreated,
    callerBytesAccepted: false as const,
    callerPathAccepted: false as const,
    callerUrlAccepted: false as const,
    remoteMutationMade: false as const,
    providerCallMade: false as const,
    customerCreditsMutated: false as const,
    productionReady: false as const,
  }
  return freezeValue({
    ...draft,
    receiptDigestSha256: sha256Value(draft),
  })
}

function exactNow(now: () => Date): string {
  const value = now()
  if (
    !(value instanceof Date)
    || !Number.isFinite(value.getTime())
  ) {
    throw corrupt('model_artifact_repository_clock_returned_invalid_date')
  }
  return value.toISOString()
}

function containsControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0)
    if (code <= 31 || code === 127) return true
  }
  return false
}

function sha256Value(value: unknown): string {
  return createHash('sha256')
    .update(stableStringify(value))
    .digest('hex')
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const serialized = JSON.stringify(value)
    if (serialized === undefined) {
      throw invalid('model_artifact_canonical_value_invalid')
    }
    return serialized
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`
  }
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => (
    `${JSON.stringify(key)}:${stableStringify(record[key])}`
  )).join(',')}}`
}

function freezeValue<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const nested of Object.values(value as Record<string, unknown>)) {
      freezeValue(nested)
    }
  }
  return value
}

function isNodeError(
  error: unknown,
  code: string,
): error is NodeJS.ErrnoException {
  return error instanceof Error
    && (error as NodeJS.ErrnoException).code === code
}

function invalid(reason: string, status = 400): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    'Canonical model-artifact input is invalid.',
    status,
    { reason },
  )
}

function blocked(reason: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical model-artifact authority is unavailable or unsafe.',
    503,
    { reason, productionReady: false },
  )
}

function missing(reason: string): ApiError {
  return new ApiError(
    'UPLOAD_NOT_FINALIZED',
    'Canonical model-artifact bytes are unavailable.',
    404,
    { reason, productionReady: false },
  )
}

function corrupt(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical model-artifact repository integrity verification failed.',
    409,
    { reason, productionReady: false },
  )
}
