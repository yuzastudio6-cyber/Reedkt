import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { RuntimeEnv } from '../config/env'
import { resolveLocalStorageObjectPath } from '../media/local-media-paths'
import { runMediaAnalysisFoundation } from '../workers/media/media-analysis-foundation-runner'

export interface EditReferencePrivateStorageObject {
  id: string
  workspaceId: string
  projectId?: string
  mediaAssetId?: string
  bucketName: string
  objectPath: string
  mimeType?: string
  sizeBytes?: number
  status: string
}

export interface EditReferenceLocalMediaStudyResult {
  referenceAssetId: string
  privateAssetId: string
  sourceEvidenceId: string
  status: 'verified_local' | 'blocked'
  blockerCode?: string
  blockerMessage?: string
  durationSeconds?: number
  width?: number
  height?: number
  hasAudio?: boolean
  representativeFrameCount: number
  representativeFrameTimes: number[]
  audioExtracted: boolean
  toolIds: string[]
  fileBytesRead: boolean
  mediaProcessingStarted: boolean
  rawFramesPersisted: false
  rawProviderPayloadPersisted: false
  warnings: string[]
}

export async function runEditReferenceLocalMediaStudy(input: {
  env: RuntimeEnv
  referenceAssetId: string
  privateAssetId: string
  sourceEvidenceId: string
  storageObject: EditReferencePrivateStorageObject
}): Promise<EditReferenceLocalMediaStudyResult> {
  if (input.env.storageMode !== 'local') {
    return createBlockedEditReferenceMediaStudy(input, 'reference_media_local_runtime_unavailable', 'Private reference-media study is available only in the approved local runtime. No media bytes were opened.')
  }
  if (
    input.storageObject.status !== 'ready'
    || !input.storageObject.mediaAssetId
    || !input.storageObject.mimeType?.startsWith('video/')
  ) {
    return createBlockedEditReferenceMediaStudy(input, 'reference_media_asset_not_ready', 'The private reference asset is not a finalized video. Upload or reconnect it, then retry.')
  }

  const outputRoot = await mkdtemp(path.join(tmpdir(), 'reeditpro-reference-study-'))
  let result: EditReferenceLocalMediaStudyResult
  try {
    const sourceLocalPath = resolveLocalStorageObjectPath(
      input.env.localStorageRoot,
      input.storageObject.bucketName,
      input.storageObject.objectPath,
    )
    const foundation = await runMediaAnalysisFoundation({
      mode: 'local_dev',
      workspaceId: input.storageObject.workspaceId,
      projectId: input.storageObject.projectId ?? input.privateAssetId,
      mediaAssetId: input.storageObject.mediaAssetId,
      sourceStorageObjectId: input.storageObject.id,
      source: {
        sourceStorageObjectId: input.storageObject.id,
        storageBucketPurpose: 'source_media',
        storageObjectPath: input.storageObject.objectPath,
        localFilePath: sourceLocalPath,
        contentType: input.storageObject.mimeType,
        sizeBytes: input.storageObject.sizeBytes,
        isPrivate: true,
        sourceOfTruth: true,
      },
      outputRoot,
      tasks: ['probe', 'extract_audio', 'extract_representative_frames', 'build_analysis_report'],
      maxRepresentativeFrameCount: 4,
      timeoutMs: 30_000,
    })
    const frames = foundation.representativeFrames?.artifacts ?? []
    result = {
      referenceAssetId: input.referenceAssetId,
      privateAssetId: input.privateAssetId,
      sourceEvidenceId: input.sourceEvidenceId,
      status: foundation.probe ? 'verified_local' : 'blocked',
      ...(foundation.probe ? {} : {
        blockerCode: 'reference_media_probe_missing',
        blockerMessage: 'The local media foundation did not produce a verified probe result.',
      }),
      durationSeconds: foundation.probe?.durationSeconds,
      width: foundation.probe?.width,
      height: foundation.probe?.height,
      hasAudio: foundation.probe ? foundation.probe.audioStreams.length > 0 : undefined,
      representativeFrameCount: frames.length,
      representativeFrameTimes: frames.flatMap((frame) => typeof frame.timeSeconds === 'number' ? [frame.timeSeconds] : []),
      audioExtracted: foundation.audio?.status === 'created',
      toolIds: ['ffprobe', ...(frames.length || foundation.audio?.status === 'created' ? ['ffmpeg'] : [])],
      fileBytesRead: true,
      mediaProcessingStarted: true,
      rawFramesPersisted: false,
      rawProviderPayloadPersisted: false,
      warnings: foundation.warnings,
    }
  } catch (error) {
    result = {
      ...createBlockedEditReferenceMediaStudy(input, 'reference_media_local_study_failed', 'The private local media study could not complete. The asset remains private and can be retried.'),
      fileBytesRead: true,
      mediaProcessingStarted: true,
      toolIds: ['ffprobe', 'ffmpeg'],
      warnings: [safeErrorCategory(error)],
    }
  }

  try {
    await rm(outputRoot, { force: true, recursive: true })
  } catch {
    return {
      ...result,
      status: 'blocked',
      blockerCode: 'reference_media_ephemeral_cleanup_failed',
      blockerMessage: 'Ephemeral frame cleanup could not be verified. The study result is blocked from DNA until cleanup is confirmed and the study is retried.',
      representativeFrameCount: 0,
      representativeFrameTimes: [],
      warnings: [...result.warnings, 'Ephemeral media cleanup was not verified.'],
    }
  }
  return result
}

export function createBlockedEditReferenceMediaStudy(
  input: Pick<Parameters<typeof runEditReferenceLocalMediaStudy>[0], 'referenceAssetId' | 'privateAssetId' | 'sourceEvidenceId'>,
  blockerCode: string,
  blockerMessage: string,
): EditReferenceLocalMediaStudyResult {
  return {
    referenceAssetId: input.referenceAssetId,
    privateAssetId: input.privateAssetId,
    sourceEvidenceId: input.sourceEvidenceId,
    status: 'blocked',
    blockerCode,
    blockerMessage,
    representativeFrameCount: 0,
    representativeFrameTimes: [],
    audioExtracted: false,
    toolIds: [],
    fileBytesRead: false,
    mediaProcessingStarted: false,
    rawFramesPersisted: false,
    rawProviderPayloadPersisted: false,
    warnings: [],
  }
}

function safeErrorCategory(error: unknown): string {
  const name = error instanceof Error ? error.name : 'UnknownError'
  return `Local reference-media runtime failed (${name}); filesystem paths and raw process output were not persisted.`
}
