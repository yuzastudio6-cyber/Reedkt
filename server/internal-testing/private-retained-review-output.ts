import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { lstat, open, readdir } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import { ApiError } from '../errors/api-error'
import {
  createPrivateDirectoryCreateOnlyWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
  type PrivateDirectoryIdentity,
} from '../security/private-local-persistence'

export const PRIVATE_RETAINED_REVIEW_OUTPUT_SCHEMA_VERSION =
  'private-retained-review-output-inspection-v1' as const

const PRIVATE_DIRECTORY_MODE = 0o700
const PRIVATE_FILE_MODE = 0o600
const DEFAULT_MAXIMUM_FILES = 2_048
const DEFAULT_MAXIMUM_DIRECTORIES = 128
const DEFAULT_MAXIMUM_DEPTH = 8
const DEFAULT_MAXIMUM_TOTAL_BYTES = 2 * 1024 ** 4
const MAXIMUM_JSON_BYTES = 2 * 1024 * 1024
const HASH_BUFFER_BYTES = 1024 * 1024

const REQUIRED_PLAN_FILE = 'approved-edit-plan.json'
const REQUIRED_TIMELINE_FILE = 'timeline-manifest.json'
const REQUIRED_ARTIFACT_MANIFEST_FILE = 'artifact-manifest.json'
const REQUIRED_QA_FILE = 'final-qa-report.json'
const EXPECTED_PLAN_DECISION =
  'internal_testing_real_video_whole_edit_completed_ready_for_private_user_review'
const EXPECTED_QA_STATUS =
  'passed_technical_and_structured_intent_qa_pending_user_creative_review'

export type PrivateRetainedReviewOutputStatus =
  | 'private_retained_review_verified'
  | 'privacy_permissions_blocked'
  | 'artifact_integrity_blocked'
  | 'review_contract_blocked'
  | 'required_evidence_missing'
  | 'unsafe_filesystem_entry_blocked'

export interface PrivateRetainedReviewOutputInspection {
  schemaVersion: typeof PRIVATE_RETAINED_REVIEW_OUTPUT_SCHEMA_VERSION
  status: PrivateRetainedReviewOutputStatus
  privateReviewReady: boolean
  filesystemModeBoundaryVerified: boolean
  artifactIntegrityVerified: boolean
  reviewContractVerified: boolean
  userCreativeReviewRequired: true
  productReadyClaim: false
  canonicalProductPipelineReady: false
  publicDeliveryAllowed: false
  fileCount: number
  directoryCount: number
  totalBytes: number
  finalVideo: {
    fileName: string
    byteLength: number
    checksumSha256: string
  } | null
  blockingReasons: string[]
  evidenceHash: string
}

interface InspectionLimits {
  maximumFiles: number
  maximumDirectories: number
  maximumDepth: number
  maximumTotalBytes: number
}

interface TreeFileEntry {
  kind: 'file'
  relativePath: string
  mode: number
  byteLength: number
  device: number
  inode: number
  modifiedAtMs: number
}

interface TreeDirectoryEntry {
  kind: 'directory'
  relativePath: string
  mode: number
  device: number
  inode: number
}

interface RetainedReviewTree {
  files: TreeFileEntry[]
  directories: TreeDirectoryEntry[]
  totalBytes: number
}

interface InspectPrivateRetainedReviewOutputInput {
  outputRoot: string
  finalVideoFileName: string
  expectedRootIdentity?: PrivateDirectoryIdentity
  limits?: Partial<InspectionLimits>
}

export async function createPrivateRetainedReviewOutputDirectory(input: {
  outputRoot: string
}): Promise<{ outputRoot: string; identity: PrivateDirectoryIdentity }> {
  const outputRoot = normalizeOutputRoot(input.outputRoot)
  const parentRoot = dirname(outputRoot)
  if (parentRoot === outputRoot) throw invalidBoundary('private_review_output_root_invalid')
  const outputDirectoryName = basename(outputRoot)
  const created = await createPrivateDirectoryCreateOnlyWithinRoot({
    rootPath: parentRoot,
    relativePath: outputDirectoryName,
  })
  return { outputRoot: created.absolutePath, identity: created.identity }
}

export async function writePrivateRetainedReviewJsonCreateOnly(input: {
  outputRoot: string
  fileName: string
  value: unknown
}): Promise<void> {
  if (
    basename(input.fileName) !== input.fileName
    || !/^[a-z0-9][a-z0-9.-]*\.json$/u.test(input.fileName)
  ) throw invalidBoundary('private_review_json_file_name_invalid')
  const content = Buffer.from(`${JSON.stringify(input.value, null, 2)}\n`, 'utf8')
  if (content.byteLength > MAXIMUM_JSON_BYTES) {
    throw invalidBoundary('private_review_json_byte_ceiling_exceeded')
  }
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: normalizeOutputRoot(input.outputRoot),
    relativePath: input.fileName,
    content,
  })
}

export async function hardenPrivateRetainedReviewOutputTree(input: {
  outputRoot: string
  expectedRootIdentity?: PrivateDirectoryIdentity
  limits?: Partial<InspectionLimits>
}): Promise<void> {
  try {
    await collectRetainedReviewTree({
      outputRoot: normalizeOutputRoot(input.outputRoot),
      expectedRootIdentity: input.expectedRootIdentity,
      limits: resolveInspectionLimits(input.limits),
      harden: true,
    })
  } catch (error) {
    if (error instanceof RetainedReviewBoundaryError) {
      throw invalidBoundary(error.reason)
    }
    throw error
  }
}

export async function finalizePrivateRetainedReviewOutput(
  input: InspectPrivateRetainedReviewOutputInput,
): Promise<PrivateRetainedReviewOutputInspection> {
  await hardenPrivateRetainedReviewOutputTree({
    outputRoot: input.outputRoot,
    expectedRootIdentity: input.expectedRootIdentity,
    limits: input.limits,
  })
  const inspection = await inspectPrivateRetainedReviewOutput(input)
  if (!inspection.privateReviewReady) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Retained private review output failed its publication boundary.',
      409,
      {
        status: inspection.status,
        blockingReasons: inspection.blockingReasons,
      },
    )
  }
  return inspection
}

/**
 * Read-only inspection. This function never chmods, creates, replaces, or
 * removes the inspected output. It can therefore classify a legacy retained
 * edit without silently changing the evidence being reviewed.
 */
export async function inspectPrivateRetainedReviewOutput(
  input: InspectPrivateRetainedReviewOutputInput,
): Promise<PrivateRetainedReviewOutputInspection> {
  const outputRoot = normalizeOutputRoot(input.outputRoot)
  const finalVideoFileName = normalizeFinalVideoFileName(input.finalVideoFileName)
  let tree: RetainedReviewTree
  try {
    tree = await collectRetainedReviewTree({
      outputRoot,
      expectedRootIdentity: input.expectedRootIdentity,
      limits: resolveInspectionLimits(input.limits),
      harden: false,
    })
  } catch (error) {
    if (error instanceof RetainedReviewBoundaryError) {
      return buildInspection({
        status: 'unsafe_filesystem_entry_blocked',
        filesystemModeBoundaryVerified: false,
        artifactIntegrityVerified: false,
        reviewContractVerified: false,
        fileCount: 0,
        directoryCount: 0,
        totalBytes: 0,
        finalVideo: null,
        blockingReasons: [error.reason],
      })
    }
    throw error
  }

  const permissionReasons = [
    ...(tree.directories.some((entry) => entry.mode !== PRIVATE_DIRECTORY_MODE)
      ? ['private_review_directory_mode_not_0700']
      : []),
    ...(tree.files.some((entry) => entry.mode !== PRIVATE_FILE_MODE)
      ? ['private_review_file_mode_not_0600']
      : []),
  ]
  const evidenceReasons: string[] = []
  const integrityReasons: string[] = []
  const reviewReasons: string[] = []

  const fileByRelativePath = new Map(tree.files.map((entry) => [entry.relativePath, entry]))
  const requiredFiles = [
    REQUIRED_PLAN_FILE,
    REQUIRED_TIMELINE_FILE,
    REQUIRED_ARTIFACT_MANIFEST_FILE,
    REQUIRED_QA_FILE,
    finalVideoFileName,
  ]
  for (const requiredFile of requiredFiles) {
    if (!fileByRelativePath.has(requiredFile)) {
      evidenceReasons.push(`private_review_required_file_missing:${requiredFile}`)
    }
  }

  let finalVideo: PrivateRetainedReviewOutputInspection['finalVideo'] = null
  if (evidenceReasons.length === 0) {
    try {
      const plan = await readJsonRecord(outputRoot, fileByRelativePath.get(REQUIRED_PLAN_FILE)!)
      const timeline = await readJsonRecord(outputRoot, fileByRelativePath.get(REQUIRED_TIMELINE_FILE)!)
      const manifest = await readJsonRecord(
        outputRoot,
        fileByRelativePath.get(REQUIRED_ARTIFACT_MANIFEST_FILE)!,
      )
      const qa = await readJsonRecord(outputRoot, fileByRelativePath.get(REQUIRED_QA_FILE)!)

      const approvals = recordValue(plan.approvals)
      const planSource = recordValue(plan.source)
      const approvedSnapshotId = stringValue(approvals.approvedSnapshotId)
      const creditReservationId = stringValue(approvals.creditReservationId)
      if (
        plan.decision !== EXPECTED_PLAN_DECISION
        || planSource.private !== true
        || !approvedSnapshotId
        || !creditReservationId
        || timeline.approvedSnapshotId !== approvedSnapshotId
      ) reviewReasons.push('private_review_approved_plan_lineage_invalid')

      if (
        qa.status !== EXPECTED_QA_STATUS
        || qa.userCreativeReviewRequired !== true
        || qa.productReadyClaim !== false
      ) reviewReasons.push('private_review_qa_disposition_invalid')

      if (
        manifest.private !== true
        || manifest.sourceImmutable !== true
        || manifest.publicDelivery !== false
        || manifest.signedUrls !== false
        || manifest.supabaseWrites !== false
        || manifest.gcsWrites !== false
      ) integrityReasons.push('private_review_artifact_manifest_boundary_invalid')

      const finalArtifacts = Array.isArray(manifest.artifacts)
        ? manifest.artifacts.filter((candidate) =>
          isRecord(candidate) && candidate.type === 'final_export')
        : []
      if (finalArtifacts.length !== 1) {
        integrityReasons.push('private_review_final_artifact_cardinality_invalid')
      } else {
        const finalArtifact = finalArtifacts[0]
        const declaredChecksum = stringValue(finalArtifact.checksum)
        const declaredSize = numberValue(finalArtifact.sizeBytes)
        const expectedFinalPath = join(outputRoot, finalVideoFileName)
        if (
          finalArtifact.sourceOfTruth !== true
          || finalArtifact.localFilePath !== expectedFinalPath
          || !declaredChecksum
          || !/^[a-f0-9]{64}$/u.test(declaredChecksum)
          || !Number.isSafeInteger(declaredSize)
          || declaredSize <= 0
          || qa.outputChecksumSha256 !== declaredChecksum
          || qa.outputSizeBytes !== declaredSize
        ) {
          integrityReasons.push('private_review_final_artifact_manifest_lineage_invalid')
        } else {
          const finalEntry = fileByRelativePath.get(finalVideoFileName)!
          const actualChecksum = await sha256NoFollowRegularFile(outputRoot, finalEntry)
          if (
            finalEntry.byteLength !== declaredSize
            || actualChecksum !== declaredChecksum
          ) integrityReasons.push('private_review_final_artifact_content_changed')
          finalVideo = {
            fileName: finalVideoFileName,
            byteLength: finalEntry.byteLength,
            checksumSha256: actualChecksum,
          }
        }
      }
    } catch (error) {
      if (!(error instanceof RetainedReviewBoundaryError)) throw error
      integrityReasons.push(error.reason)
    }
  }

  const filesystemModeBoundaryVerified = permissionReasons.length === 0
  const artifactIntegrityVerified = evidenceReasons.length === 0 && integrityReasons.length === 0
  const reviewContractVerified = evidenceReasons.length === 0 && reviewReasons.length === 0
  const blockingReasons = [
    ...evidenceReasons,
    ...integrityReasons,
    ...reviewReasons,
    ...permissionReasons,
  ].sort()
  const status = resolveInspectionStatus({
    evidenceReasons,
    integrityReasons,
    reviewReasons,
    permissionReasons,
  })

  return buildInspection({
    status,
    filesystemModeBoundaryVerified,
    artifactIntegrityVerified,
    reviewContractVerified,
    fileCount: tree.files.length,
    directoryCount: tree.directories.length,
    totalBytes: tree.totalBytes,
    finalVideo,
    blockingReasons,
  })
}

async function collectRetainedReviewTree(input: {
  outputRoot: string
  expectedRootIdentity?: PrivateDirectoryIdentity
  limits: InspectionLimits
  harden: boolean
}): Promise<RetainedReviewTree> {
  let rootStat: Awaited<ReturnType<typeof lstat>>
  try {
    rootStat = await lstat(input.outputRoot)
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ENOENT')) {
      throw new RetainedReviewBoundaryError('private_review_output_missing')
    }
    throw error
  }
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new RetainedReviewBoundaryError('private_review_output_root_not_regular_directory')
  }
  if (
    input.expectedRootIdentity
    && !sameIdentity(input.expectedRootIdentity, rootStat)
  ) throw new RetainedReviewBoundaryError('private_review_output_root_identity_changed')

  const rootHandle = await open(input.outputRoot, constants.O_RDONLY | constants.O_NOFOLLOW)
  const tree: RetainedReviewTree = { files: [], directories: [], totalBytes: 0 }
  try {
    const openedRootStat = await rootHandle.stat()
    if (!openedRootStat.isDirectory() || !sameStatIdentity(rootStat, openedRootStat)) {
      throw new RetainedReviewBoundaryError('private_review_output_root_identity_changed')
    }
    await walkRetainedReviewDirectory({
      absolutePath: input.outputRoot,
      relativePath: '.',
      depth: 0,
      handle: rootHandle,
      tree,
      limits: input.limits,
      harden: input.harden,
    })
    const latestRootStat = await lstat(input.outputRoot)
    if (
      latestRootStat.isSymbolicLink()
      || !latestRootStat.isDirectory()
      || !sameStatIdentity(openedRootStat, latestRootStat)
    ) throw new RetainedReviewBoundaryError('private_review_output_root_identity_changed')
    return tree
  } finally {
    await rootHandle.close().catch(() => undefined)
  }
}

async function walkRetainedReviewDirectory(input: {
  absolutePath: string
  relativePath: string
  depth: number
  handle: Awaited<ReturnType<typeof open>>
  tree: RetainedReviewTree
  limits: InspectionLimits
  harden: boolean
}): Promise<void> {
  if (input.depth > input.limits.maximumDepth) {
    throw new RetainedReviewBoundaryError('private_review_directory_depth_exceeded')
  }
  if (input.harden) await input.handle.chmod(PRIVATE_DIRECTORY_MODE)
  const baseline = await input.handle.stat()
  if (!baseline.isDirectory()) {
    throw new RetainedReviewBoundaryError('private_review_entry_not_regular_directory')
  }
  input.tree.directories.push({
    kind: 'directory',
    relativePath: input.relativePath,
    mode: modeBits(baseline.mode),
    device: baseline.dev,
    inode: baseline.ino,
  })
  if (input.tree.directories.length > input.limits.maximumDirectories) {
    throw new RetainedReviewBoundaryError('private_review_directory_limit_exceeded')
  }

  const entries = (await readdir(input.absolutePath, { withFileTypes: true }))
    .sort((left, right) => left.name.localeCompare(right.name))
  for (const entry of entries) {
    if (basename(entry.name) !== entry.name || entry.name === '.' || entry.name === '..') {
      throw new RetainedReviewBoundaryError('private_review_entry_name_invalid')
    }
    const absoluteEntryPath = join(input.absolutePath, entry.name)
    const relativeEntryPath = input.relativePath === '.'
      ? entry.name
      : join(input.relativePath, entry.name)
    const entryStat = await lstat(absoluteEntryPath)
    if (entryStat.isSymbolicLink()) {
      throw new RetainedReviewBoundaryError('private_review_symbolic_link_refused')
    }
    if (entryStat.isDirectory()) {
      const directoryHandle = await open(
        absoluteEntryPath,
        constants.O_RDONLY | constants.O_NOFOLLOW,
      )
      try {
        const openedStat = await directoryHandle.stat()
        if (!openedStat.isDirectory() || !sameStatIdentity(entryStat, openedStat)) {
          throw new RetainedReviewBoundaryError('private_review_directory_identity_changed')
        }
        await walkRetainedReviewDirectory({
          absolutePath: absoluteEntryPath,
          relativePath: relativeEntryPath,
          depth: input.depth + 1,
          handle: directoryHandle,
          tree: input.tree,
          limits: input.limits,
          harden: input.harden,
        })
        const latestStat = await lstat(absoluteEntryPath)
        if (
          latestStat.isSymbolicLink()
          || !latestStat.isDirectory()
          || !sameStatIdentity(openedStat, latestStat)
        ) throw new RetainedReviewBoundaryError('private_review_directory_identity_changed')
      } finally {
        await directoryHandle.close().catch(() => undefined)
      }
      continue
    }
    if (!entryStat.isFile() || entryStat.nlink !== 1) {
      throw new RetainedReviewBoundaryError('private_review_entry_not_owned_regular_file')
    }
    const fileHandle = await open(absoluteEntryPath, constants.O_RDONLY | constants.O_NOFOLLOW)
    try {
      const openedStat = await fileHandle.stat()
      if (
        !openedStat.isFile()
        || openedStat.nlink !== 1
        || !sameStatIdentity(entryStat, openedStat)
      ) throw new RetainedReviewBoundaryError('private_review_file_identity_changed')
      if (input.harden) await fileHandle.chmod(PRIVATE_FILE_MODE)
      const retainedStat = await fileHandle.stat()
      if (
        !retainedStat.isFile()
        || retainedStat.nlink !== 1
        || !sameStatIdentity(openedStat, retainedStat)
      ) throw new RetainedReviewBoundaryError('private_review_file_identity_changed')
      input.tree.files.push({
        kind: 'file',
        relativePath: relativeEntryPath,
        mode: modeBits(retainedStat.mode),
        byteLength: retainedStat.size,
        device: retainedStat.dev,
        inode: retainedStat.ino,
        modifiedAtMs: retainedStat.mtimeMs,
      })
      input.tree.totalBytes += retainedStat.size
      if (input.tree.files.length > input.limits.maximumFiles) {
        throw new RetainedReviewBoundaryError('private_review_file_limit_exceeded')
      }
      if (
        !Number.isSafeInteger(input.tree.totalBytes)
        || input.tree.totalBytes > input.limits.maximumTotalBytes
      ) throw new RetainedReviewBoundaryError('private_review_total_byte_limit_exceeded')
    } finally {
      await fileHandle.close().catch(() => undefined)
    }
  }
  const latest = await input.handle.stat()
  if (
    !latest.isDirectory()
    || !sameStatIdentity(baseline, latest)
    || latest.mtimeMs !== baseline.mtimeMs
    || modeBits(latest.mode) !== modeBits(baseline.mode)
  ) throw new RetainedReviewBoundaryError('private_review_directory_changed_during_inspection')
}

async function readJsonRecord(
  outputRoot: string,
  entry: TreeFileEntry,
): Promise<Record<string, unknown>> {
  if (entry.byteLength <= 1 || entry.byteLength > MAXIMUM_JSON_BYTES) {
    throw new RetainedReviewBoundaryError('private_review_json_size_invalid')
  }
  const bytes = await readNoFollowRegularFile(outputRoot, entry)
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new RetainedReviewBoundaryError('private_review_json_invalid')
  }
  if (!isRecord(decoded)) {
    throw new RetainedReviewBoundaryError('private_review_json_shape_invalid')
  }
  return decoded
}

async function readNoFollowRegularFile(
  outputRoot: string,
  entry: TreeFileEntry,
): Promise<Buffer> {
  const handle = await open(
    join(outputRoot, entry.relativePath),
    constants.O_RDONLY | constants.O_NOFOLLOW,
  )
  try {
    const opened = await handle.stat()
    if (
      !opened.isFile()
      || opened.nlink !== 1
      || !sameTreeEntryIdentity(entry, opened)
    ) throw new RetainedReviewBoundaryError('private_review_file_identity_changed')
    const bytes = await handle.readFile()
    const latest = await handle.stat()
    if (
      bytes.byteLength !== entry.byteLength
      || !sameTreeEntryIdentity(entry, latest)
    ) throw new RetainedReviewBoundaryError('private_review_file_changed_during_read')
    return bytes
  } finally {
    await handle.close().catch(() => undefined)
  }
}

async function sha256NoFollowRegularFile(
  outputRoot: string,
  entry: TreeFileEntry,
): Promise<string> {
  const handle = await open(
    join(outputRoot, entry.relativePath),
    constants.O_RDONLY | constants.O_NOFOLLOW,
  )
  try {
    const opened = await handle.stat()
    if (
      !opened.isFile()
      || opened.nlink !== 1
      || !sameTreeEntryIdentity(entry, opened)
    ) throw new RetainedReviewBoundaryError('private_review_file_identity_changed')
    const digest = createHash('sha256')
    const buffer = Buffer.allocUnsafe(HASH_BUFFER_BYTES)
    let offset = 0
    while (offset < entry.byteLength) {
      const length = Math.min(buffer.byteLength, entry.byteLength - offset)
      const { bytesRead } = await handle.read(buffer, 0, length, offset)
      if (bytesRead <= 0) {
        throw new RetainedReviewBoundaryError('private_review_file_truncated_during_hash')
      }
      digest.update(buffer.subarray(0, bytesRead))
      offset += bytesRead
    }
    const latest = await handle.stat()
    if (!sameTreeEntryIdentity(entry, latest)) {
      throw new RetainedReviewBoundaryError('private_review_file_changed_during_hash')
    }
    return digest.digest('hex')
  } finally {
    await handle.close().catch(() => undefined)
  }
}

function buildInspection(input: Omit<PrivateRetainedReviewOutputInspection,
  | 'schemaVersion'
  | 'privateReviewReady'
  | 'userCreativeReviewRequired'
  | 'productReadyClaim'
  | 'canonicalProductPipelineReady'
  | 'publicDeliveryAllowed'
  | 'evidenceHash'
>): PrivateRetainedReviewOutputInspection {
  const payload = {
    schemaVersion: PRIVATE_RETAINED_REVIEW_OUTPUT_SCHEMA_VERSION,
    status: input.status,
    privateReviewReady: input.status === 'private_retained_review_verified',
    filesystemModeBoundaryVerified: input.filesystemModeBoundaryVerified,
    artifactIntegrityVerified: input.artifactIntegrityVerified,
    reviewContractVerified: input.reviewContractVerified,
    userCreativeReviewRequired: true as const,
    productReadyClaim: false as const,
    canonicalProductPipelineReady: false as const,
    publicDeliveryAllowed: false as const,
    fileCount: input.fileCount,
    directoryCount: input.directoryCount,
    totalBytes: input.totalBytes,
    finalVideo: input.finalVideo,
    blockingReasons: [...input.blockingReasons].sort(),
  }
  return {
    ...payload,
    evidenceHash: createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
  }
}

function resolveInspectionStatus(input: {
  evidenceReasons: string[]
  integrityReasons: string[]
  reviewReasons: string[]
  permissionReasons: string[]
}): PrivateRetainedReviewOutputStatus {
  if (input.evidenceReasons.length > 0) return 'required_evidence_missing'
  if (input.integrityReasons.length > 0) return 'artifact_integrity_blocked'
  if (input.reviewReasons.length > 0) return 'review_contract_blocked'
  if (input.permissionReasons.length > 0) return 'privacy_permissions_blocked'
  return 'private_retained_review_verified'
}

function resolveInspectionLimits(input?: Partial<InspectionLimits>): InspectionLimits {
  return {
    maximumFiles: boundedLimit(
      input?.maximumFiles ?? DEFAULT_MAXIMUM_FILES,
      1,
      10_000,
      'private_review_file_limit_invalid',
    ),
    maximumDirectories: boundedLimit(
      input?.maximumDirectories ?? DEFAULT_MAXIMUM_DIRECTORIES,
      1,
      1_000,
      'private_review_directory_limit_invalid',
    ),
    maximumDepth: boundedLimit(
      input?.maximumDepth ?? DEFAULT_MAXIMUM_DEPTH,
      0,
      32,
      'private_review_depth_limit_invalid',
    ),
    maximumTotalBytes: boundedLimit(
      input?.maximumTotalBytes ?? DEFAULT_MAXIMUM_TOTAL_BYTES,
      1,
      4 * 1024 ** 4,
      'private_review_total_byte_limit_invalid',
    ),
  }
}

function normalizeOutputRoot(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || !isAbsolute(trimmed) || trimmed.includes('\0')) {
    throw invalidBoundary('private_review_output_root_invalid')
  }
  return resolve(trimmed)
}

function normalizeFinalVideoFileName(value: string): string {
  const trimmed = value.trim()
  if (
    basename(trimmed) !== trimmed
    || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.mp4$/u.test(trimmed)
  ) throw invalidBoundary('private_review_final_video_file_name_invalid')
  return trimmed
}

function boundedLimit(value: number, minimum: number, maximum: number, reason: string): number {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw invalidBoundary(reason)
  }
  return value
}

function modeBits(mode: number): number {
  return mode & 0o777
}

function sameIdentity(identity: PrivateDirectoryIdentity, stat: { dev: number; ino: number }): boolean {
  return identity.device === stat.dev && identity.inode === stat.ino
}

function sameStatIdentity(
  left: { dev: number; ino: number },
  right: { dev: number; ino: number },
): boolean {
  return left.dev === right.dev && left.ino === right.ino
}

function sameTreeEntryIdentity(
  entry: TreeFileEntry,
  stat: {
    dev: number
    ino: number
    size: number
    mode: number
    mtimeMs: number
  },
): boolean {
  return entry.device === stat.dev
    && entry.inode === stat.ino
    && entry.byteLength === stat.size
    && entry.mode === modeBits(stat.mode)
    && entry.modifiedAtMs === stat.mtimeMs
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function recordValue(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function numberValue(value: unknown): number {
  return typeof value === 'number' ? value : Number.NaN
}

function invalidBoundary(reason: string): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    'Private retained review output refused an unsafe publication boundary.',
    400,
    { reason },
  )
}

class RetainedReviewBoundaryError extends Error {
  readonly reason: string

  constructor(reason: string) {
    super(reason)
    this.reason = reason
    this.name = 'RetainedReviewBoundaryError'
  }
}

function isNodeErrorWithCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code
}
