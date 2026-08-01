import { constants, createReadStream, createWriteStream } from 'node:fs'
import {
  copyFile,
  lstat,
  mkdir,
  realpath,
  rm,
  stat,
} from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import {
  basename,
  isAbsolute,
  join,
  relative,
  resolve,
} from 'node:path'
import type { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

export const LIVING_FRAME_INTERNAL_REVIEW_EXPORT_ROOT_ENV =
  'REEDITPRO_LF_ACTIVE_REVIEW_EXPORT_ROOT' as const

const REVIEW_ROOT_PREFIX =
  'reeditpro-lf-active-review-v1-' as const
const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/u
const SHA256 = /^[a-f0-9]{64}$/u

export interface LivingFrameInternalReviewExportReceipt {
  readonly exportClass:
    'process_private_non_authoritative_visual_review_copy'
  readonly runId: string
  readonly fileName: string
  readonly byteLength: number
  readonly sha256: string
  readonly createOnlyCopyUsed: true
  readonly canonicalArtifactCreated: false
  readonly qaApprovalGranted: false
  readonly privateReviewApproved: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export async function exportLivingFrameInternalReviewFile(input: {
  readonly runId: string
  readonly fileName: string
  readonly sourcePath: string
  readonly expectedByteLength?: number
  readonly expectedSha256?: string
}): Promise<LivingFrameInternalReviewExportReceipt | null> {
  const destination = await prepareDestination(input.runId, input.fileName)
  if (destination == null) return null
  const sourceInfo = await lstat(input.sourcePath)
  if (!sourceInfo.isFile() || sourceInfo.isSymbolicLink()) {
    throw new Error('Living Frame internal review source must be a regular file.')
  }
  await copyFile(
    input.sourcePath,
    destination,
    constants.COPYFILE_EXCL,
  )
  try {
    return await verifyExport({
      destination,
      runId: input.runId,
      fileName: input.fileName,
      expectedByteLength: input.expectedByteLength,
      expectedSha256: input.expectedSha256,
    })
  } catch (error) {
    await rm(destination, { force: true })
    throw error
  }
}

export async function exportLivingFrameInternalReviewStream(input: {
  readonly runId: string
  readonly fileName: string
  readonly stream: Readable
  readonly expectedByteLength: number
  readonly expectedSha256: string
}): Promise<LivingFrameInternalReviewExportReceipt | null> {
  const destination = await prepareDestination(input.runId, input.fileName)
  if (destination == null) {
    input.stream.destroy()
    return null
  }
  try {
    await pipeline(
      input.stream,
      createWriteStream(destination, {
        flags: 'wx',
        mode: 0o600,
      }),
    )
  } catch (error) {
    await rm(destination, { force: true })
    throw error
  }
  try {
    return await verifyExport({
      destination,
      runId: input.runId,
      fileName: input.fileName,
      expectedByteLength: input.expectedByteLength,
      expectedSha256: input.expectedSha256,
    })
  } catch (error) {
    await rm(destination, { force: true })
    throw error
  }
}

async function prepareDestination(
  runId: string,
  fileName: string,
): Promise<string | null> {
  const root = await resolveReviewRoot()
  if (root == null) return null
  assertSafeName(runId, 'run ID')
  assertSafeName(fileName, 'file name')
  const runRoot = join(root, runId)
  await mkdir(runRoot, {
    recursive: true,
    mode: 0o700,
  })
  const runRootInfo = await lstat(runRoot)
  if (!runRootInfo.isDirectory() || runRootInfo.isSymbolicLink()) {
    throw new Error('Living Frame internal review run root is invalid.')
  }
  const destination = join(runRoot, fileName)
  if (relative(runRoot, destination) !== fileName) {
    throw new Error('Living Frame internal review destination escaped its run root.')
  }
  return destination
}

async function resolveReviewRoot(): Promise<string | null> {
  const candidate =
    process.env[LIVING_FRAME_INTERNAL_REVIEW_EXPORT_ROOT_ENV]
  if (candidate == null || candidate.length === 0) return null
  if (!isAbsolute(candidate)) {
    throw new Error('Living Frame internal review root must be absolute.')
  }
  const resolved = resolve(candidate)
  const canonicalRoot = await realpath(resolved)
  const temporaryRoot = await realpath(resolve(tmpdir()))
  const relativeToTemporaryRoot = relative(temporaryRoot, canonicalRoot)
  if (
    relativeToTemporaryRoot.startsWith('..')
    || isAbsolute(relativeToTemporaryRoot)
    || !basename(canonicalRoot).startsWith(REVIEW_ROOT_PREFIX)
  ) {
    throw new Error('Living Frame internal review root is outside its fixed temporary boundary.')
  }
  const rootInfo = await lstat(resolved)
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
    throw new Error('Living Frame internal review root is invalid.')
  }
  return canonicalRoot
}

async function verifyExport(input: {
  readonly destination: string
  readonly runId: string
  readonly fileName: string
  readonly expectedByteLength?: number
  readonly expectedSha256?: string
}): Promise<LivingFrameInternalReviewExportReceipt> {
  if (
    input.expectedSha256 != null
    && !SHA256.test(input.expectedSha256)
  ) {
    throw new Error('Living Frame internal review expected digest is invalid.')
  }
  const destinationInfo = await stat(input.destination)
  const sha256 = await digestFile(input.destination)
  if (
    destinationInfo.size < 1
    || (
      input.expectedByteLength != null
      && destinationInfo.size !== input.expectedByteLength
    )
    || (
      input.expectedSha256 != null
      && sha256 !== input.expectedSha256
    )
  ) {
    throw new Error('Living Frame internal review export verification failed.')
  }
  return Object.freeze({
    exportClass:
      'process_private_non_authoritative_visual_review_copy' as const,
    runId: input.runId,
    fileName: input.fileName,
    byteLength: destinationInfo.size,
    sha256,
    createOnlyCopyUsed: true as const,
    canonicalArtifactCreated: false as const,
    qaApprovalGranted: false as const,
    privateReviewApproved: false as const,
    publicDeliveryReady: false as const,
    productionReady: false as const,
  })
}

async function digestFile(path: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  return hash.digest('hex')
}

function assertSafeName(value: string, label: string): void {
  if (!SAFE_NAME.test(value)) {
    throw new Error(`Living Frame internal review ${label} is invalid.`)
  }
}
