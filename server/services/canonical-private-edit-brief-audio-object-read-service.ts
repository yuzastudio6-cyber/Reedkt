import type { Readable } from 'node:stream'

import { ApiError } from '../errors/api-error'
import type {
  OfflineFfmpegEditBriefAudioPlanningPayload,
} from '../tool-execution/media-binary-execution'
import {
  validateOfflineFfmpegPlanningPayload,
  type OfflineMediaBinaryServerInjectedInput,
} from '../tool-execution/media-binary-execution'
import { createStorageAdapter } from '../storage/storage-adapter'
import type { ServiceContext } from '../types'
import type {
  CanonicalApprovedExecutionAuthority,
} from './edit-planning-authority-service'
import {
  assertEditBriefAudioPlanningMatchesCanonical,
} from './planning-input-authority-binding-service'
import {
  readPrivateEditBriefAuthorityAggregate,
  type PrivateEditBriefAuthorityAggregate,
} from './private-edit-brief-authority-store'
import {
  sha256ArtifactQaValue,
  stableArtifactQaStringify,
} from './private-artifact-qa-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { createUploadService } from './upload-service'
import { authorizeWorkspaceAccess } from './workspace-access-service'

const MAXIMUM_AUDIO_BYTES = 64 * 1024 * 1024
const EDIT_BRIEF_AUDIO_MIME_TYPES = new Set([
  'audio/aac',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
])

export interface CanonicalPrivateEditBriefAudioObjectReadResult {
  attachmentId: string
  markerId: string
  privateAssetId: string
  mimeType: 'audio/aac' | 'audio/mpeg' | 'audio/wav' | 'audio/x-wav'
  byteLength: number
  sha256: string
  sourceReadEvidenceHash: string
  sourceInput: OfflineMediaBinaryServerInjectedInput
}

export function createCanonicalPrivateEditBriefAudioObjectReadService(
  context: ServiceContext,
) {
  return {
    async readExactApprovedAttachment(input: {
      workspaceId: string
      projectId: string
      editSessionId: string
      snapshotId: string
      jobId: string
      executionAttemptId: string
      dispatchGrantId: string
      authority: CanonicalApprovedExecutionAuthority
      approvedWorkItemId: string
    }): Promise<CanonicalPrivateEditBriefAudioObjectReadResult> {
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(
        context,
        input.workspaceId,
        'write',
      )
      if (
        access.userId !== actorUserId ||
        input.authority.snapshot.snapshotId !== input.snapshotId ||
        input.authority.snapshot.workspaceId !== input.workspaceId ||
        input.authority.snapshot.projectId !== input.projectId ||
        input.authority.snapshot.editSessionId !== input.editSessionId
      ) {
        throw staleAudio(
          'Approved Edit Brief audio is outside the current execution scope.',
        )
      }

      const workItem = input.authority.workItems.find((candidate) =>
        candidate.id === input.approvedWorkItemId)
      if (
        !workItem ||
        workItem.workItemType !== 'process_audio_asset' ||
        workItem.workerClass !== 'audio_processing_worker' ||
        workItem.executionInput.operation !==
          'process_approved_edit_brief_audio_attachment' ||
        workItem.sourceSequenceItemIds.length !== 0 ||
        workItem.sourceCleanupDecisionIds.length !== 0 ||
        workItem.dependencyKeys.length !== 0 ||
        workItem.expectedOutputs.length !== 1 ||
        workItem.expectedOutputs[0]?.assetRole !== 'processed' ||
        workItem.expectedOutputs[0]?.contentType !== 'audio/wav'
      ) {
        throw staleAudio(
          'Approved Edit Brief audio work lost its exact private processing shape.',
        )
      }

      const planningPayload = validateEditBriefAudioPlanningPayload(
        workItem.executionInput.structuredPayload,
      )
      const aggregate = await readCurrentAggregate({
        context,
        ownerUserId: actorUserId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
      })
      assertEditBriefAudioPlanningMatchesCanonical(
        aggregate,
        input.authority.components,
      )
      assertAggregateMatchesPlanning(aggregate, planningPayload)

      const uploadService = createUploadService(context)
      const finalized = await uploadService.getFinalizedSourceMediaAsset(
        planningPayload.privateAssetId,
        input.workspaceId,
        input.projectId,
        'reference_media',
      )
      assertFinalizedUploadMatchesPlanning(finalized, planningPayload)

      const uploadCommitment = {
        mediaAssetId: finalized.mediaAsset.id,
        storageObjectRecordId: finalized.storageObject.id,
        storageProvider: finalized.storageObject.storageProvider,
        storageIdentityHash: privateStorageIdentityHash(finalized.storageObject),
        mimeType: finalized.mediaAsset.mimeType,
        byteLength: finalized.mediaAsset.sizeBytes,
        sha256: finalized.mediaAsset.checksumSha256,
      }
      const sourceReadEvidenceHash = sha256ArtifactQaValue({
        domain: 'canonical_private_edit_brief_audio_object_read_v1',
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        snapshotId: input.snapshotId,
        jobId: input.jobId,
        approvedWorkItemId: workItem.id,
        executionAttemptId: input.executionAttemptId,
        dispatchGrantId: input.dispatchGrantId,
        attachmentId: planningPayload.attachmentId,
        markerId: planningPayload.markerId,
        privateAssetId: planningPayload.privateAssetId,
        planningPayload,
        uploadCommitment,
      })

      const sourceInput: OfflineMediaBinaryServerInjectedInput = Object.freeze({
        inputMode: 'private_verified_stream_v1' as const,
        byteLength: uploadCommitment.byteLength,
        sha256: uploadCommitment.sha256,
        async openStream(): Promise<Readable> {
          const currentAggregate = await readCurrentAggregate({
            context,
            ownerUserId: actorUserId,
            workspaceId: input.workspaceId,
            projectId: input.projectId,
            editSessionId: input.editSessionId,
          })
          assertEditBriefAudioPlanningMatchesCanonical(
            currentAggregate,
            input.authority.components,
          )
          assertAggregateMatchesPlanning(currentAggregate, planningPayload)
          if (
            stableArtifactQaStringify(currentAggregate) !==
            stableArtifactQaStringify(aggregate)
          ) {
            throw staleAudio(
              'Edit Brief audio authority changed while the worker opened its private stream.',
            )
          }
          const current = await uploadService.getFinalizedSourceMediaAsset(
            planningPayload.privateAssetId,
            input.workspaceId,
            input.projectId,
            'reference_media',
          )
          assertFinalizedUploadMatchesPlanning(current, planningPayload)
          const currentCommitment = {
            mediaAssetId: current.mediaAsset.id,
            storageObjectRecordId: current.storageObject.id,
            storageProvider: current.storageObject.storageProvider,
            storageIdentityHash: privateStorageIdentityHash(
              current.storageObject,
            ),
            mimeType: current.mediaAsset.mimeType,
            byteLength: current.mediaAsset.sizeBytes,
            sha256: current.mediaAsset.checksumSha256,
          }
          if (
            stableArtifactQaStringify(currentCommitment) !==
            stableArtifactQaStringify(uploadCommitment)
          ) {
            throw staleAudio(
              'The finalized Edit Brief audio object changed after plan approval.',
            )
          }
          const storage = context.storageAdapter ??
            createStorageAdapter(context.env)
          const storageProvider = current.storageObject.storageProvider
          if (
            (storageProvider === 'local_private' && storage.mode !== 'local') ||
            (
              storageProvider === 'google_cloud_storage' &&
              storage.mode !== 'gcs'
            )
          ) {
            throw staleAudio(
              'The private Edit Brief audio storage provider does not match the active backend adapter.',
            )
          }
          const identity = storageProvider === 'google_cloud_storage'
            ? {
                generation: current.storageObject.generation,
                etag: current.storageObject.etag,
              }
            : undefined
          if (
            storageProvider === 'google_cloud_storage' &&
            (!identity?.generation || !identity.etag)
          ) {
            throw staleAudio(
              'The private Edit Brief audio object lacks exact GCS generation authority.',
            )
          }
          const metadata = await storage.getObjectMetadata(
            current.storageObject.bucketName,
            current.storageObject.objectPath,
            identity,
          )
          if (
            !metadata.exists ||
            metadata.sizeBytes !== current.mediaAsset.sizeBytes ||
            (
              metadata.mimeType &&
              metadata.mimeType.trim().toLowerCase() !==
                current.mediaAsset.mimeType.trim().toLowerCase()
            ) ||
            (
              metadata.integrityVerified &&
              metadata.checksumSha256 !== current.mediaAsset.checksumSha256
            ) ||
            (
              identity?.generation &&
              metadata.generation !== identity.generation
            ) ||
            (identity?.etag && metadata.etag !== identity.etag)
          ) {
            throw staleAudio(
              'The private Edit Brief audio stream lost its finalized object commitment.',
            )
          }
          return storage.createReadStream(
            current.storageObject.bucketName,
            current.storageObject.objectPath,
            identity,
          )
        },
      })

      return {
        attachmentId: planningPayload.attachmentId,
        markerId: planningPayload.markerId,
        privateAssetId: planningPayload.privateAssetId,
        mimeType: finalized.mediaAsset.mimeType as
          CanonicalPrivateEditBriefAudioObjectReadResult['mimeType'],
        byteLength: uploadCommitment.byteLength,
        sha256: uploadCommitment.sha256,
        sourceReadEvidenceHash,
        sourceInput,
      }
    },
  }
}

function privateStorageIdentityHash(input: {
  storageProvider?: 'local_private' | 'google_cloud_storage'
  bucketName: string
  objectPath: string
  generation?: string
  etag?: string
  metageneration?: string
}): string {
  if (
    input.storageProvider !== 'local_private' &&
    input.storageProvider !== 'google_cloud_storage'
  ) {
    throw staleAudio(
      'The finalized Edit Brief audio object has no supported private storage provider.',
    )
  }
  return sha256ArtifactQaValue({
    domain: 'canonical_private_edit_brief_audio_storage_identity_v1',
    storageProvider: input.storageProvider,
    bucketName: input.bucketName,
    objectPath: input.objectPath,
    generation: input.generation ?? null,
    etag: input.etag ?? null,
    metageneration: input.metageneration ?? null,
  })
}

function validateEditBriefAudioPlanningPayload(
  value: unknown,
): OfflineFfmpegEditBriefAudioPlanningPayload {
  const payload = validateOfflineFfmpegPlanningPayload(value)
  if (
    payload.recipeProfileId !== 'approved_edit_brief_music_bed_wav_v1' &&
    payload.recipeProfileId !== 'approved_edit_brief_sfx_wav_v1'
  ) {
    throw staleAudio(
      'Approved Edit Brief audio references an unsupported processing profile.',
    )
  }
  return payload
}

async function readCurrentAggregate(input: {
  context: ServiceContext
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
}): Promise<PrivateEditBriefAuthorityAggregate> {
  const aggregate = await readPrivateEditBriefAuthorityAggregate({
    localStorageRoot: input.context.env.localStorageRoot,
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
  })
  if (!aggregate) {
    throw staleAudio(
      'The approved Edit Brief audio authority is no longer available.',
    )
  }
  return aggregate
}

function assertAggregateMatchesPlanning(
  aggregate: PrivateEditBriefAuthorityAggregate,
  payload: OfflineFfmpegEditBriefAudioPlanningPayload,
): void {
  const marker = aggregate.markers.find((candidate) =>
    candidate.id === payload.markerId)
  const attachment = aggregate.attachments.find((candidate) =>
    candidate.id === payload.attachmentId)
  if (
    !marker ||
    marker.status !== 'confirmed' ||
    marker.markerType !== payload.markerType ||
    !attachment ||
    attachment.markerId !== marker.id ||
    attachment.kind !== 'audio' ||
    attachment.privateAssetId !== payload.privateAssetId ||
    !EDIT_BRIEF_AUDIO_MIME_TYPES.has(String(attachment.mimeType)) ||
    !Number.isFinite(attachment.durationSeconds) ||
    Math.round(Number(attachment.durationSeconds) * payload.frameRate) !==
      payload.sourceDurationFrames ||
    Math.round(marker.startSeconds * payload.frameRate) !==
      payload.startFrame ||
    (
      marker.timeKind === 'range' &&
      Math.round(Number(marker.endSeconds) * payload.frameRate) !==
        payload.endFrameExclusive
    )
  ) {
    throw staleAudio(
      'The approved Edit Brief marker or attachment changed before execution.',
    )
  }
}

function assertFinalizedUploadMatchesPlanning(
  finalized: Awaited<ReturnType<
    ReturnType<typeof createUploadService>['getFinalizedSourceMediaAsset']
  >>,
  payload: OfflineFfmpegEditBriefAudioPlanningPayload,
): void {
  const mediaAsset = finalized.mediaAsset
  const storageObject = finalized.storageObject
  const metadata = mediaAsset.sourceMetadata
  if (
    mediaAsset.id !== payload.privateAssetId ||
    mediaAsset.uploadPurpose !== 'reference_media' ||
    storageObject.uploadPurpose !== 'reference_media' ||
    storageObject.objectPurpose !== 'reference_media' ||
    mediaAsset.integrityVerified !== true ||
    storageObject.integrityVerified !== true ||
    mediaAsset.checksumSource !== 'server_computed_bytes' ||
    storageObject.checksumSource !== 'server_computed_bytes' ||
    mediaAsset.checksumSha256 !== storageObject.checksumSha256 ||
    mediaAsset.sizeBytes !== storageObject.sizeBytes ||
    !EDIT_BRIEF_AUDIO_MIME_TYPES.has(mediaAsset.mimeType) ||
    !Number.isSafeInteger(mediaAsset.sizeBytes) ||
    mediaAsset.sizeBytes < 64 ||
    mediaAsset.sizeBytes > MAXIMUM_AUDIO_BYTES ||
    !metadata ||
    metadata.probeStatus !== 'probed' ||
    metadata.hasAudio !== true ||
    metadata.hasVideo !== false ||
    !Number.isFinite(metadata.durationSeconds) ||
    Math.round(Number(metadata.durationSeconds) * payload.frameRate) !==
      payload.sourceDurationFrames
  ) {
    throw staleAudio(
      'The finalized Edit Brief audio upload changed after plan approval.',
    )
  }
}

function staleAudio(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409)
}
