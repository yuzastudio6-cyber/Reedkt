import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import {
  loadPrivateFinalizedMediaAuthority,
  privateUploadMediaAuthorityValueHash,
} from '../../services/private-upload-media-authority-store'
import { createUploadService } from '../../services/upload-service'
import type { ServiceContext } from '../../types'
import type { MotionStudioProductionRow } from '../commands/types'
import { parseMotionStudioPcmWave, type MotionStudioMixStemRole } from './pcm-wave'

export interface MotionStudioUploadedAudioSelection {
  role: MotionStudioMixStemRole
  stemId: string
  mediaAssetId: string
  checksumSha256: string
  startFrame: number
  endFrame: number
  cueAuthorityId: string
  cueReason: string
  rightsEvidenceId: string
}

export interface VerifiedMotionStudioUploadedAudioInput {
  role: MotionStudioMixStemRole
  stemId: string
  mediaAssetId: string
  uploadIntentId: string
  storageObjectRecordId: string
  authorityRevision: number
  authorityChecksumSha256: string
  storageIdentityHash: string
  checksumSha256: string
  byteLength: number
  mimeType: 'audio/wav'
  audioCodec: 'pcm_s16le'
  sampleRateHertz: 48_000
  channelCount: 1 | 2
  sampleCountPerChannel: number
  durationMilliseconds: number
  startFrame: number
  endFrame: number
  cueAuthorityId: string
  cueReason: string
  rightsEvidenceId: string
  bindingHash: string
  bytes: Buffer
}

const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
// 120 seconds of 48 kHz, 16-bit stereo PCM plus a bounded RIFF header fits
// below 24 MiB. Keep the byte ceiling aligned with the registered duration.
const MAXIMUM_BYTES = 24 * 1024 * 1024

export async function loadVerifiedMotionStudioUploadedAudioInput(input: {
  context: ServiceContext
  actorUserId: string
  production: MotionStudioProductionRow
  selection: MotionStudioUploadedAudioSelection
}): Promise<VerifiedMotionStudioUploadedAudioInput> {
  validateSelection(input.selection)
  const authority = await loadPrivateFinalizedMediaAuthority({
    localStorageRoot: input.context.env.localStorageRoot,
    ownerUserId: input.actorUserId,
    workspaceId: input.production.workspace_id,
  }, input.selection.mediaAssetId)
  if (!authority) blocked('Finalized private uploaded audio authority was not found.')
  const { uploadIntent, mediaAsset, storageObject } = authority
  const metadata = mediaAsset.sourceMetadata
  if (
    uploadIntent.projectId !== input.production.project_id || uploadIntent.uploadPurpose !== 'source_media' ||
    mediaAsset.projectId !== input.production.project_id || mediaAsset.assetType !== 'source_audio' ||
    mediaAsset.uploadPurpose !== 'source_media' || storageObject.projectId !== input.production.project_id ||
    storageObject.uploadPurpose !== 'source_media' || storageObject.objectPurpose !== 'source_media' ||
    mediaAsset.mimeType !== 'audio/wav' || storageObject.mimeType !== 'audio/wav' ||
    mediaAsset.checksumSha256 !== input.selection.checksumSha256 ||
    mediaAsset.checksumSha256 !== storageObject.checksumSha256 ||
    mediaAsset.sizeBytes !== storageObject.sizeBytes || mediaAsset.sizeBytes > MAXIMUM_BYTES ||
    !metadata || metadata.probeStatus !== 'probed' || !metadata.hasAudio || metadata.hasVideo ||
    metadata.audioCodec !== 'pcm_s16le' || metadata.audioSampleRateHertz !== 48_000 ||
    ![1, 2].includes(metadata.audioChannelCount ?? 0) || !metadata.durationSeconds
  ) blocked('Uploaded audio does not satisfy the exact private PCM authority.')

  const { stream, storageObjectRecord } = await createUploadService(input.context)
    .createLocalObjectStream(storageObject.id, input.production.workspace_id)
  const live = await readAndHashBoundedStream(stream, MAXIMUM_BYTES)
  if (
    live.sha256 !== mediaAsset.checksumSha256 || live.byteLength !== mediaAsset.sizeBytes ||
    storageObjectRecord.id !== storageObject.id || storageObjectRecord.projectId !== input.production.project_id
  ) blocked('Uploaded audio bytes no longer match finalized private authority.')
  const parsed = parseMotionStudioPcmWave(live.bytes)
  const probedDurationMilliseconds = Math.round(metadata.durationSeconds * 1_000)
  if (
    parsed.channelCount !== metadata.audioChannelCount ||
    Math.abs(parsed.durationMilliseconds - probedDurationMilliseconds) > 2
  ) blocked('Uploaded audio PCM facts changed after finalized media probing.')

  const storageIdentityHash = privateUploadMediaAuthorityValueHash({
    storageProvider: storageObject.storageProvider,
    bucketName: storageObject.bucketName,
    objectPath: storageObject.objectPath,
    generation: storageObject.generation,
    etag: storageObject.etag,
    metageneration: storageObject.metageneration,
  })
  const valueWithoutHash = {
    role: input.selection.role,
    stemId: input.selection.stemId,
    mediaAssetId: mediaAsset.id,
    uploadIntentId: uploadIntent.id,
    storageObjectRecordId: storageObject.id,
    authorityRevision: authority.authorityRevision,
    authorityChecksumSha256: authority.authorityChecksumSha256,
    storageIdentityHash,
    checksumSha256: mediaAsset.checksumSha256,
    byteLength: mediaAsset.sizeBytes,
    mimeType: 'audio/wav' as const,
    audioCodec: 'pcm_s16le' as const,
    sampleRateHertz: 48_000 as const,
    channelCount: parsed.channelCount,
    sampleCountPerChannel: parsed.sampleCountPerChannel,
    durationMilliseconds: parsed.durationMilliseconds,
    startFrame: input.selection.startFrame,
    endFrame: input.selection.endFrame,
    cueAuthorityId: input.selection.cueAuthorityId,
    cueReason: input.selection.cueReason,
    rightsEvidenceId: input.selection.rightsEvidenceId,
  }
  return {
    ...valueWithoutHash,
    bindingHash: privateUploadMediaAuthorityValueHash(valueWithoutHash),
    bytes: live.bytes,
  }
}

export function safeVerifiedAudioInput(
  input: VerifiedMotionStudioUploadedAudioInput,
): Omit<VerifiedMotionStudioUploadedAudioInput, 'bytes'> {
  const { bytes, ...safe } = input
  void bytes
  return safe
}

function validateSelection(selection: MotionStudioUploadedAudioSelection): void {
  if (
    !['narration', 'music', 'foley', 'exact_sfx'].includes(selection.role) ||
    !STABLE_ID.test(selection.stemId) || !STABLE_ID.test(selection.mediaAssetId) ||
    !STABLE_ID.test(selection.cueAuthorityId) || !STABLE_ID.test(selection.rightsEvidenceId) ||
    !SHA256.test(selection.checksumSha256) ||
    !Number.isSafeInteger(selection.startFrame) || !Number.isSafeInteger(selection.endFrame) ||
    selection.startFrame < 0 || selection.endFrame <= selection.startFrame || selection.endFrame > 3_600 ||
    selection.cueReason.trim().length < 8 || selection.cueReason.length > 360
  ) blocked('Uploaded audio selection is outside the strict Storytelling contract.')
}

async function readAndHashBoundedStream(stream: NodeJS.ReadableStream, maximumBytes: number) {
  const hash = createHash('sha256')
  let byteLength = 0
  const chunks: Buffer[] = []
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    byteLength += bytes.length
    if (byteLength > maximumBytes) blocked('Uploaded audio exceeds the bounded Storytelling mix input limit.')
    hash.update(bytes)
    chunks.push(bytes)
  }
  return { byteLength, sha256: hash.digest('hex'), bytes: Buffer.concat(chunks) }
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'verified_private_uploaded_storytelling_audio',
  })
}
