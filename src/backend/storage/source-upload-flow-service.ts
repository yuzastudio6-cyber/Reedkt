import type {
  MediaAssetRecord,
  SourceClipSequenceItem,
  SourceClipSequenceRecord,
} from '../../types'
import type {
  SourceUploadFlowItem,
  SourceUploadFlowResult,
  SourceUploadOrderSummary,
  UploadPlan,
} from '../../types/upload'
import { createMediaAssetRecordFromUploadPlan } from './media-asset-service'

const MOCK_NOW = '2026-05-20T12:00:00.000Z'

export interface SourceUploadFlowInput {
  workspaceId: string
  projectId: string
  chatSessionId?: string
  sequenceName?: string
  uploads: SourceUploadFlowItem[]
}

export function createSourceUploadFlow(input: SourceUploadFlowInput): SourceUploadFlowResult {
  const uploadOrderSummary = validateSourceUploadOrder(input.uploads)
  const sortedUploads = sortUploadsBySourceOrder(input.uploads)
  const mediaAssetRecords = sortedUploads.flatMap((item) => {
    const result = createMediaAssetRecordFromUploadPlan(item.uploadPlan)
    return result.mediaAssetRecord ? [result.mediaAssetRecord] : []
  })
  const sourceSequenceRecord = createSourceClipSequenceFromUploads(input)
  const sourceSequenceItems = createSourceClipSequenceItemsFromUploads(
    sourceSequenceRecord,
    sortedUploads,
    mediaAssetRecords,
  )
  const warnings = [
    ...uploadOrderSummary.warnings,
    'Uploaded order is source sequence context only; the final edit order is decided later in the approved edit plan.',
  ]

  return {
    ok: uploadOrderSummary.ok,
    sourceSequenceRecord,
    sourceSequenceItems,
    mediaAssetRecords,
    uploadOrderSummary,
    nextStep: uploadOrderSummary.ok ? 'mock_ready' : 'fix_upload_input',
    message: uploadOrderSummary.ok
      ? 'Created a mock source upload flow that preserves uploaded order.'
      : 'Created source upload records with order warnings.',
    warnings,
  }
}

export function createSourceClipSequenceFromUploads(
  input: SourceUploadFlowInput,
): SourceClipSequenceRecord {
  return {
    id: `mock-source-sequence-${input.projectId}`,
    projectId: input.projectId,
    chatSessionId: input.chatSessionId ?? `mock-chat-session-${input.projectId}`,
    sequenceName: input.sequenceName ?? 'Uploaded source sequence',
    explanation: 'Source uploads are preserved in user-provided order for planning context.',
    lockedByUser: false,
    status: 'draft',
    createdAt: MOCK_NOW,
    updatedAt: MOCK_NOW,
    metadata: {
      workspaceId: input.workspaceId,
      uploadPlanIds: input.uploads.map((item) => item.uploadPlan.id),
      finalEditOrder: 'not_decided',
    },
  }
}

export function createSourceClipSequenceItemsFromUploads(
  sourceSequence: SourceClipSequenceRecord,
  uploads: SourceUploadFlowItem[],
  mediaAssetRecords: MediaAssetRecord[],
): SourceClipSequenceItem[] {
  return uploads.map((item, index) => {
    const mediaAssetRecord = mediaAssetRecords.find((record) =>
      record.id.startsWith(item.uploadPlan.id),
    )
    const uploadedOrder = resolveUploadedOrder(item, index)

    return {
      id: `${sourceSequence.id}-item-${String(index + 1).padStart(2, '0')}`,
      sourceClipSequenceId: sourceSequence.id,
      mediaAssetId: mediaAssetRecord?.id ?? `${item.uploadPlan.id}-media-record`,
      uploadedOrder,
      userNotes: item.userNotes,
      isImportant: item.isImportant ?? false,
      isOptional: item.isOptional ?? false,
      detectedRole: item.uploadPlan.mimeType.startsWith('audio/') ? 'source_audio' : 'source_clip',
      possibleUses: ['planning_context'],
      transcriptStatus: item.uploadPlan.mimeType.startsWith('video/') ? 'not_started' : 'not_started',
      analysisStatus: 'draft',
      metadata: {
        uploadPlanId: item.uploadPlan.id,
        storageBucket: item.uploadPlan.bucketName,
        storagePath: item.uploadPlan.objectPath,
        finalEditOrder: 'not_decided',
      },
    }
  })
}

export function validateSourceUploadOrder(
  uploads: SourceUploadFlowItem[] | UploadPlan[],
): SourceUploadOrderSummary {
  const normalized = uploads.map((item) => 'uploadPlan' in item ? item : { uploadPlan: item })
  const orders = normalized.map((item, index) => item.uploadedOrder ?? item.uploadPlan.uploadedOrder ?? index + 1)
  const explicitOrderIds = normalized.filter((item) =>
    typeof item.uploadedOrder === 'number' || typeof item.uploadPlan.uploadedOrder === 'number',
  )
  const missingOrderIds = normalized
    .filter((item) => typeof item.uploadedOrder !== 'number' && typeof item.uploadPlan.uploadedOrder !== 'number')
    .map((item) => item.uploadPlan.id)
  const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index)
  const invalidOrders = orders.filter((order) => order <= 0 || !Number.isInteger(order))
  const warnings = [
    ...(missingOrderIds.length > 0
      ? ['Some source uploads were missing explicit order; array order was used as a fallback.']
      : []),
    ...(duplicateOrders.length > 0
      ? [`Duplicate source upload order values found: ${[...new Set(duplicateOrders)].join(', ')}.`]
      : []),
    ...(invalidOrders.length > 0 ? ['Source upload order must use positive whole numbers.'] : []),
    ...(explicitOrderIds.length === 0 && normalized.length > 1
      ? ['Multiple source clips should preserve the user-visible uploaded order.']
      : []),
  ]

  return {
    ok: duplicateOrders.length === 0 && invalidOrders.length === 0,
    orderedUploadPlanIds: normalized
      .slice()
      .sort((left, right) => resolveUploadedOrder(left, 0) - resolveUploadedOrder(right, 0))
      .map((item) => item.uploadPlan.id),
    missingOrderIds,
    duplicateOrders: [...new Set(duplicateOrders)],
    warnings,
    message: warnings.length > 0
      ? 'Source upload order is usable with warnings.'
      : 'Source upload order is explicit and valid.',
  }
}

export function createUploadOrderSummary(
  uploads: SourceUploadFlowItem[] | UploadPlan[],
): string {
  const summary = validateSourceUploadOrder(uploads)
  return summary.message
}

function sortUploadsBySourceOrder(uploads: SourceUploadFlowItem[]): SourceUploadFlowItem[] {
  return uploads
    .slice()
    .sort((left, right) => resolveUploadedOrder(left, 0) - resolveUploadedOrder(right, 0))
}

function resolveUploadedOrder(item: SourceUploadFlowItem, fallbackIndex: number): number {
  return item.uploadedOrder ?? item.uploadPlan.uploadedOrder ?? fallbackIndex + 1
}
