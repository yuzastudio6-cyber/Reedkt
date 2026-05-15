import type {
  MediaAssetRecord,
  ReferenceAssetRecord,
  ReferenceDNARecord,
  SourceClipSequenceItem,
  SourceClipSequenceRecord,
} from '../../types'
import type { AttachClipsInChatRequest } from '../contracts/chat-editor-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, findMockRecord, insertMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'

export function createMediaAsset(
  db: MockDatabase,
  input: {
    workspaceId: string
    projectId: string
    uploadedByUserId?: string
    fileName: string
    mimeType: string
    durationSeconds?: number
  },
): ServiceResult<MediaAssetRecord> {
  const mediaAsset: MediaAssetRecord = {
    id: createMockId('media'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    uploadedByUserId: input.uploadedByUserId,
    assetType: 'source_video',
    storageProvider: 'local_mock',
    storagePath: `mock://source/${input.fileName}`,
    safePreviewUrl: `mock://preview/${input.fileName}`,
    fileName: input.fileName,
    mimeType: input.mimeType,
    durationSeconds: input.durationSeconds,
    status: 'completed',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'mediaAssets', mediaAsset))
}

export function createSourceClipSequence(
  db: MockDatabase,
  input: {
    projectId: string
    chatSessionId: string
    chatMessageId?: string
  },
): ServiceResult<SourceClipSequenceRecord> {
  const sequence: SourceClipSequenceRecord = {
    id: createMockId('source-sequence'),
    projectId: input.projectId,
    chatSessionId: input.chatSessionId,
    createdFromChatMessageId: input.chatMessageId,
    sequenceName: 'User uploaded source order',
    explanation: 'Source order records how clips arrived in chat; the final edit structure is planned separately.',
    lockedByUser: false,
    status: 'completed',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { sourceOrderIsNotFinalOrder: true },
  }

  return ok(insertMockRecord(db, 'sourceClipSequences', sequence))
}

export function addClipToSourceSequence(
  db: MockDatabase,
  input: {
    sourceClipSequenceId: string
    mediaAssetId: string
    uploadedOrder: number
    userNotes?: string
  },
): ServiceResult<SourceClipSequenceItem> {
  const item: SourceClipSequenceItem = {
    id: createMockId('source-sequence-item'),
    sourceClipSequenceId: input.sourceClipSequenceId,
    mediaAssetId: input.mediaAssetId,
    uploadedOrder: input.uploadedOrder,
    userNotes: input.userNotes,
    isImportant: true,
    isOptional: false,
    possibleUses: ['source_context', 'final_edit_candidate'],
    transcriptStatus: 'not_started',
    analysisStatus: 'completed',
    metadata: { sourceOrderIsContext: true },
  }

  return ok(insertMockRecord(db, 'sourceClipSequenceItems', item))
}

export function reorderSourceClips(
  db: MockDatabase,
  sourceClipSequenceId: string,
  orderedItemIds: string[],
): ServiceResult<SourceClipSequenceItem[]> {
  const items = db.sourceClipSequenceItems.filter((item) => item.sourceClipSequenceId === sourceClipSequenceId)

  if (items.length === 0) {
    return fail('SOURCE_SEQUENCE_NOT_FOUND', `Source sequence ${sourceClipSequenceId} has no clips.`)
  }

  orderedItemIds.forEach((itemId, index) => {
    const item = items.find((candidate) => candidate.id === itemId)
    if (item) {
      item.uploadedOrder = index + 1
    }
  })

  return ok(items.sort((left, right) => left.uploadedOrder - right.uploadedOrder))
}

export function createReferenceAsset(
  db: MockDatabase,
  projectId: string,
  referenceUrl: string,
): ServiceResult<ReferenceAssetRecord> {
  const referenceAsset: ReferenceAssetRecord = {
    id: createMockId('reference-asset'),
    projectId,
    referenceUrl,
    status: 'completed',
    analyzedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { doNotCopyShotForShot: true },
  }

  return ok(insertMockRecord(db, 'referenceAssets', referenceAsset))
}

export function createReferenceDNAPlaceholder(
  db: MockDatabase,
  referenceAssetId: string,
): ServiceResult<ReferenceDNARecord> {
  const referenceAsset = findMockRecord(db, 'referenceAssets', referenceAssetId)

  if (!referenceAsset) {
    return fail('MEDIA_ASSET_NOT_FOUND', `Reference asset ${referenceAssetId} was not found.`)
  }

  const referenceDna: ReferenceDNARecord = {
    id: createMockId('reference-dna'),
    projectId: referenceAsset.projectId,
    referenceAssetId,
    topic: 'Reference edit DNA placeholder',
    openingStyle: 'clean contextual hook',
    pacing: 'premium smooth',
    musicIntro: 'subtle bed',
    beatChanges: 'story-matched',
    transitionStyle: 'clean contextual',
    captionStyle: 'readable and face-safe',
    visualEffectStyle: 'signature only if useful',
    strokeMotionUsage: 'optional per segment',
    graphicDesignUsage: 'optional per segment',
    realMotionStyleOverlayUsage: 'premium only with approval',
    moodAndTone: 'polished and respectful',
    whyReferenceWorks: 'It supports clarity without copying shots.',
    adaptationRule: 'Extract style DNA, not exact structure.',
    doNotCopyRule: 'Do not copy shot-for-shot.',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'referenceDna', referenceDna))
}

export function attachClipsInChat(
  db: MockDatabase,
  input: AttachClipsInChatRequest,
): ServiceResult<{
  mediaAssets: MediaAssetRecord[]
  sourceSequence: SourceClipSequenceRecord
  sourceSequenceItems: SourceClipSequenceItem[]
}> {
  const sequenceResult = createSourceClipSequence(db, {
    projectId: input.projectId,
    chatSessionId: input.chatSessionId,
    chatMessageId: input.chatMessageId,
  })

  if (!sequenceResult.ok) {
    return sequenceResult
  }

  const mediaAssets = input.clips.map((clip) =>
    createMediaAsset(db, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      uploadedByUserId: input.uploadedByUserId,
      fileName: clip.fileName,
      mimeType: clip.mimeType,
      durationSeconds: clip.durationSeconds,
    }),
  )

  const failedAsset = mediaAssets.find((result) => !result.ok)
  if (failedAsset && !failedAsset.ok) {
    return failedAsset
  }

  const sourceSequenceItems = mediaAssets.map((result, index) =>
    addClipToSourceSequence(db, {
      sourceClipSequenceId: sequenceResult.data.id,
      mediaAssetId: result.ok ? result.data.id : '',
      uploadedOrder: input.clips[index]?.uploadedOrder ?? index + 1,
      userNotes: input.clips[index]?.userNotes,
    }),
  )

  const failedItem = sourceSequenceItems.find((result) => !result.ok)
  if (failedItem && !failedItem.ok) {
    return failedItem
  }

  return ok({
    mediaAssets: mediaAssets.flatMap((result) => (result.ok ? [result.data] : [])),
    sourceSequence: sequenceResult.data,
    sourceSequenceItems: sourceSequenceItems.flatMap((result) => (result.ok ? [result.data] : [])),
  })
}
