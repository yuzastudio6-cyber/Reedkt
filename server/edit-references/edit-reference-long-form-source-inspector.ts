import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { lstat, realpath } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import type { PreferenceEvidenceMediaMetadata } from '../../src/types/edit-reference'
import type { RuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { resolveLocalStorageObjectPath } from '../media/local-media-paths'
import { resolveLocalManagedSegmentedMediaInput } from '../storage/local-managed-segmented-object'
import {
  normalizeMediaMetadata,
  parseFFprobeJson,
} from '../workers/media/ffprobe-media-adapter'
import { runMediaAnalysisFoundation } from '../workers/media/media-analysis-foundation-runner'
import type { MediaProbeResult } from '../workers/media/media-worker-types'
import type { EditReferenceLongFormStudySourceIdentity } from './edit-reference-long-form-study-contract'

const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MAX_REVIEWED_SOURCE_SECONDS = 30 * 24 * 60 * 60
const MIN_PROBE_TIMEOUT_MS = 2 * 60 * 1_000
const MAX_PROBE_TIMEOUT_MS = 30 * 60 * 1_000
const BYTES_PER_ADDITIONAL_PROBE_MINUTE = 50 * 1024 ** 3
const execFileAsync = promisify(execFile)

export interface EditReferenceLongFormLocalMediaInput {
  readonly kind: 'regular_file' | 'managed_segmented'
  readonly ffmpegInput: string
  readonly identityFilePaths: readonly string[]
  readonly protocolWhitelist?: 'file,concat'
  readonly logicalSizeBytes: number
  readonly checksumSha256: string
  readonly segmentCount: number
}

export interface EditReferenceLongFormSourceInspection {
  readonly source: EditReferenceLongFormStudySourceIdentity
  readonly mediaMetadata: PreferenceEvidenceMediaMetadata
  readonly ingestIntegrityDigestSha256: string
  readonly mediaProbeDigestSha256: string
  readonly mediaProbeObservedWallClockMs: number
  readonly privateOriginalOpened: true
  readonly rawProbePayloadPersisted: false
  readonly originalMutated: false
}

export interface InspectEditReferenceLongFormSourceInput {
  readonly env: RuntimeEnv
  readonly storageObject: EditReferenceLongFormStorageObject
  readonly requiredObjectPurpose?: EditReferenceLongFormSourcePurpose
}

export type EditReferenceLongFormSourcePurpose = 'reference_media' | 'source_media'

export interface EditReferenceLongFormStorageObject {
  readonly id: string
  readonly workspaceId: string
  readonly projectId?: string
  readonly editReferenceId?: string
  readonly mediaAssetId?: string
  readonly bucketName: string
  readonly objectPath: string
  readonly objectPurpose: string
  readonly mimeType?: string
  readonly sizeBytes?: number
  readonly checksumSha256?: string
  readonly generation?: string
  readonly etag?: string
  readonly metageneration?: string
  readonly status: string
  readonly createdAt?: string
  readonly updatedAt?: string
}

export type EditReferenceLongFormSourceInspector = (
  input: InspectEditReferenceLongFormSourceInput,
) => Promise<EditReferenceLongFormSourceInspection>

export async function inspectEditReferenceLongFormSource(
  input: InspectEditReferenceLongFormSourceInput,
): Promise<EditReferenceLongFormSourceInspection> {
  const localMedia = await resolveVerifiedEditReferenceLongFormLocalMediaInput(input)
  const sourceOwnerId = resolveStorageOwnerId(
    input.storageObject,
    input.requiredObjectPurpose ?? 'reference_media',
  )

  const started = process.hrtime.bigint()
  try {
    const timeoutMs = deriveEditReferenceLongFormProbeTimeoutMs(input.storageObject.sizeBytes as number)
    const probe = localMedia.kind === 'managed_segmented'
      ? await probeManagedSegmentedMedia({
          ffprobeBin: input.env.ffprobeBin,
          media: localMedia,
          timeoutMs,
        })
      : (await runMediaAnalysisFoundation({
          mode: 'local_dev',
          workspaceId: input.storageObject.workspaceId,
          projectId: sourceOwnerId,
          mediaAssetId: input.storageObject.mediaAssetId as string,
          sourceStorageObjectId: input.storageObject.id,
          source: {
            sourceStorageObjectId: input.storageObject.id,
            storageBucketPurpose: 'source_media',
            storageObjectPath: input.storageObject.objectPath,
            localFilePath: localMedia.ffmpegInput,
            contentType: input.storageObject.mimeType,
            sizeBytes: input.storageObject.sizeBytes,
            isPrivate: true,
            sourceOfTruth: true,
          },
          localStorageRoot: input.env.localStorageRoot,
          outputRoot: path.join(
            input.env.localStorageRoot,
            'edit-reference-analysis',
            'probe',
            input.storageObject.id,
          ),
          ffprobeBin: input.env.ffprobeBin,
          timeoutMs,
          tasks: ['probe'],
        })).probe
    if (!probe || probe.videoStreams.length < 1) {
      throw new ApiError(
        'REFERENCE_VIDEO_STREAM_UNAVAILABLE',
        'The stored file does not contain a readable video stream. Replace it with a supported, non-corrupt video to continue.',
        422,
      )
    }
    if (
      !Number.isFinite(probe.durationSeconds)
      || probe.durationSeconds <= 0
      || probe.durationSeconds > MAX_REVIEWED_SOURCE_SECONDS
    ) {
      throw new ApiError(
        'REFERENCE_VIDEO_DURATION_OUTSIDE_REVIEWED_CAPACITY',
        'The video duration is invalid or exceeds the reviewed thirty-day timeline capacity. The original remains stored; split only when that true capacity boundary is reached.',
        422,
      )
    }
    if (probe.sizeBytes > 0 && probe.sizeBytes !== input.storageObject.sizeBytes) {
      throw new ApiError(
        'REFERENCE_VIDEO_INTEGRITY_MISMATCH',
        'The stored video size changed after finalization. ReEditPro kept the source blocked from study; verify or re-upload the exact file.',
        409,
      )
    }
    const observedWallClockMs = Math.max(1, Number((process.hrtime.bigint() - started) / 1_000_000n))
    const boundedProbe = {
      durationSeconds: probe.durationSeconds,
      width: probe.width,
      height: probe.height,
      fps: probe.fps,
      codecName: probe.codecName,
      formatName: probe.formatName,
      rotation: probe.rotation,
      aspectRatio: probe.aspectRatio,
      sizeBytes: input.storageObject.sizeBytes,
      streamCount: probe.streamCount,
      videoStreamCount: probe.videoStreams.length,
      audioStreamCount: probe.audioStreams.length,
      storageRepresentation: localMedia.kind,
      managedSegmentCount: localMedia.segmentCount,
    }
    const source: EditReferenceLongFormStudySourceIdentity = {
      privateMediaArtifactId: input.storageObject.id,
      mediaChecksumSha256: input.storageObject.checksumSha256 as string,
      durationSeconds: probe.durationSeconds,
      sizeBytes: input.storageObject.sizeBytes as number,
      mimeType: input.storageObject.mimeType as string,
      hasAudio: probe.audioStreams.length > 0,
    }
    return {
      source,
      mediaMetadata: {
        durationSeconds: probe.durationSeconds,
        width: probe.width,
        height: probe.height,
        hasAudio: probe.audioStreams.length > 0,
        orientation: orientationFor(probe.width, probe.height),
      },
      ingestIntegrityDigestSha256: sha256(stableStringify({
        storageObjectRecordId: input.storageObject.id,
        editReferenceId: input.storageObject.editReferenceId,
        projectId: input.storageObject.projectId,
        mediaAssetId: input.storageObject.mediaAssetId,
        checksumSha256: input.storageObject.checksumSha256,
        sizeBytes: input.storageObject.sizeBytes,
        mimeType: input.storageObject.mimeType,
        status: input.storageObject.status,
      })),
      mediaProbeDigestSha256: sha256(stableStringify(boundedProbe)),
      mediaProbeObservedWallClockMs: observedWallClockMs,
      privateOriginalOpened: true,
      rawProbePayloadPersisted: false,
      originalMutated: false,
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(
      'REFERENCE_VIDEO_PROBE_FAILED',
      'ReEditPro could not finish the private video check in this attempt. The original remains safely stored and unchanged; retry after the media worker recovers, or replace the file only if it is corrupt or unsupported.',
      503,
    )
  }
}

export async function resolveVerifiedEditReferenceLongFormLocalSourcePath(
  input: InspectEditReferenceLongFormSourceInput,
): Promise<string> {
  const media = await resolveVerifiedEditReferenceLongFormLocalMediaInput(input)
  if (media.kind !== 'regular_file') {
    throw new ApiError(
      'LONG_FORM_STUDY_RUNTIME_UNAVAILABLE',
      'This managed-segment source requires the long-form media-input bridge rather than one physical file path.',
      503,
    )
  }
  return media.ffmpegInput
}

export async function resolveVerifiedEditReferenceLongFormLocalMediaInput(
  input: InspectEditReferenceLongFormSourceInput,
): Promise<EditReferenceLongFormLocalMediaInput> {
  validateFinalizedStorageObject(
    input.storageObject,
    input.requiredObjectPurpose ?? 'reference_media',
  )
  if (input.env.storageMode !== 'local') {
    throw new ApiError(
      'LONG_FORM_STUDY_RUNTIME_UNAVAILABLE',
      'The private video is safely stored, but this environment has not completed controlled cloud-read verification for long-running study. ReEditPro can continue after the approved media worker is available.',
      503,
    )
  }
  const sourcePath = resolveLocalStorageObjectPath(
    input.env.localStorageRoot,
    input.storageObject.bucketName,
    input.storageObject.objectPath,
  )
  const managed = await resolveLocalManagedSegmentedMediaInput({
    completedPath: sourcePath,
    expectedSizeBytes: input.storageObject.sizeBytes as number,
    expectedChecksumSha256: input.storageObject.checksumSha256 as string,
  })
  if (managed) {
    await Promise.all([
      ...managed.backingFilePaths,
      managed.manifestPath,
    ].map((file) => verifyPrivateLocalPathBoundary({
      localStorageRoot: input.env.localStorageRoot,
      sourcePath: file,
    })))
    return {
      kind: 'managed_segmented',
      ffmpegInput: managed.ffmpegInput,
      identityFilePaths: [managed.manifestPath, ...managed.backingFilePaths],
      protocolWhitelist: 'file,concat',
      logicalSizeBytes: managed.totalBytes,
      checksumSha256: managed.checksumSha256,
      segmentCount: managed.segmentCount,
    }
  }
  await verifyPrivateLocalSourceFile({
    localStorageRoot: input.env.localStorageRoot,
    sourcePath,
    expectedSizeBytes: input.storageObject.sizeBytes as number,
  })
  return {
    kind: 'regular_file',
    ffmpegInput: sourcePath,
    identityFilePaths: [sourcePath],
    logicalSizeBytes: input.storageObject.sizeBytes as number,
    checksumSha256: input.storageObject.checksumSha256 as string,
    segmentCount: 1,
  }
}

export function deriveEditReferenceLongFormProbeTimeoutMs(sizeBytes: number): number {
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) {
    throw new Error('Long-form source size is invalid for probe timeout planning.')
  }
  const additionalMinutes = Math.ceil(sizeBytes / BYTES_PER_ADDITIONAL_PROBE_MINUTE)
  return Math.min(
    MAX_PROBE_TIMEOUT_MS,
    Math.max(MIN_PROBE_TIMEOUT_MS, MIN_PROBE_TIMEOUT_MS + additionalMinutes * 60_000),
  )
}

function validateFinalizedStorageObject(
  storageObject: EditReferenceLongFormStorageObject,
  requiredObjectPurpose: EditReferenceLongFormSourcePurpose,
): void {
  const storageOwnerId = resolveStorageOwnerId(storageObject, requiredObjectPurpose)
  // The private upload authority currently retains the Edit Reference id in the
  // legacy project-id slot as a compatibility alias. Treat only different ids
  // as an ownership conflict while the canonical database migration remains
  // fail-closed.
  const hasConflictingOwnerIdentities = Boolean(
    storageObject.projectId
    && storageObject.editReferenceId
    && storageObject.projectId !== storageObject.editReferenceId,
  )
  if (
    storageObject.status !== 'ready'
    || storageObject.objectPurpose !== requiredObjectPurpose
    || !storageOwnerId
    || hasConflictingOwnerIdentities
    || !storageObject.mediaAssetId
    || !storageObject.mimeType?.startsWith('video/')
    || !Number.isSafeInteger(storageObject.sizeBytes)
    || (storageObject.sizeBytes ?? 0) <= 0
    || !SHA256_PATTERN.test(storageObject.checksumSha256 ?? '')
  ) {
    const targetSource = requiredObjectPurpose === 'source_media'
    throw new ApiError(
      targetSource ? 'TARGET_VIDEO_NOT_FINALIZED' : 'REFERENCE_VIDEO_NOT_FINALIZED',
      targetSource
        ? 'Long-running target understanding requires the exact finalized private source video, including its verified size and checksum.'
        : 'Long-running study requires the exact finalized private reference video, including its verified size and checksum.',
      409,
    )
  }
}

function resolveStorageOwnerId(
  storageObject: EditReferenceLongFormStorageObject,
  requiredObjectPurpose: EditReferenceLongFormSourcePurpose,
): string {
  const ownerId = requiredObjectPurpose === 'source_media'
    ? storageObject.projectId
    : storageObject.editReferenceId ?? storageObject.projectId
  return ownerId ?? ''
}

async function verifyPrivateLocalSourceFile(input: {
  readonly localStorageRoot: string
  readonly sourcePath: string
  readonly expectedSizeBytes: number
}): Promise<void> {
  const sourceStat = await lstat(input.sourcePath).catch(() => {
    throw new ApiError(
      'REFERENCE_VIDEO_PRIVATE_OBJECT_UNAVAILABLE',
      'The finalized video record exists, but its private object is unavailable. Reconnect or restore the stored file and retry.',
      409,
    )
  })
  if (!sourceStat.isFile() || sourceStat.isSymbolicLink() || sourceStat.size !== input.expectedSizeBytes) {
    throw new ApiError(
      'REFERENCE_VIDEO_INTEGRITY_MISMATCH',
      'The private video no longer matches its finalized storage record. ReEditPro blocked study without changing the source.',
      409,
    )
  }
  await verifyPrivateLocalPathBoundary(input)
}

async function verifyPrivateLocalPathBoundary(input: {
  readonly localStorageRoot: string
  readonly sourcePath: string
}): Promise<void> {
  const [rootRealPath, sourceRealPath, sourceStat] = await Promise.all([
    realpath(input.localStorageRoot),
    realpath(input.sourcePath),
    lstat(input.sourcePath),
  ]).catch(() => {
    throw new ApiError(
      'REFERENCE_VIDEO_PRIVATE_OBJECT_UNAVAILABLE',
      'The finalized video record exists, but its private object is unavailable. Reconnect or restore the stored file and retry.',
      409,
    )
  })
  if (!sourceStat.isFile() || sourceStat.isSymbolicLink()) {
    throw new ApiError(
      'REFERENCE_VIDEO_INTEGRITY_MISMATCH',
      'The private video no longer matches its finalized storage record. ReEditPro blocked study without changing the source.',
      409,
    )
  }
  const relative = path.relative(rootRealPath, sourceRealPath)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new ApiError(
      'REFERENCE_VIDEO_PRIVATE_PATH_UNSAFE',
      'The private video path is outside the approved storage boundary. ReEditPro did not open it.',
      409,
    )
  }
}

async function probeManagedSegmentedMedia(input: {
  readonly ffprobeBin: string
  readonly media: EditReferenceLongFormLocalMediaInput
  readonly timeoutMs: number
}): Promise<MediaProbeResult> {
  if (input.media.kind !== 'managed_segmented' || input.media.protocolWhitelist !== 'file,concat') {
    throw new Error('Managed source probe requires the verified segmented media input.')
  }
  const result = await execFileAsync(input.ffprobeBin, [
    '-protocol_whitelist', input.media.protocolWhitelist,
    '-v', 'error',
    '-show_format',
    '-show_streams',
    '-print_format', 'json',
    input.media.ffmpegInput,
  ], {
    timeout: input.timeoutMs,
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
  })
  const normalized = await normalizeMediaMetadata(parseFFprobeJson(String(result.stdout ?? '{}')))
  return {
    ...normalized,
    sizeBytes: input.media.logicalSizeBytes,
    rawProbeSummary: {
      ...normalized.rawProbeSummary,
      pathSummary: 'managed-segmented-private-media',
      managedSegmentCount: input.media.segmentCount,
    },
  }
}

function orientationFor(width: number, height: number): PreferenceEvidenceMediaMetadata['orientation'] {
  if (width === height) return 'square'
  return width > height ? 'landscape' : 'portrait'
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
