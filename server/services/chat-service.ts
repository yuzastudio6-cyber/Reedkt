import type { ServiceContext } from '../types'
import { ApiError } from '../errors/api-error'
import { getMockMediaAsset } from './upload-service'
import { createMockId, getRequiredAuthUserId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'

interface CreateChatSessionInput {
  workspaceId: string
  projectId: string
  title?: string
}

interface SendChatMessageInput {
  workspaceId: string
  chatSessionId: string
  message: string
}

interface AttachClipsInput {
  workspaceId: string
  projectId?: string
  chatSessionId: string
  mediaAssetIds: string[]
}

export function createChatService(context: ServiceContext) {
  return {
    async createChatSession(input: CreateChatSessionInput) {
      const userId = getRequiredAuthUserId(context)
      if (!context.clients.admin || context.env.mockOnly) {
        return {
          chatSession: {
            id: createMockId('chat_session'),
            workspaceId: input.workspaceId,
            projectId: input.projectId,
            title: input.title ?? 'Mock edit session',
            createdByUserId: userId,
            createdAt: nowIso(),
            mockOnly: true,
          },
          warnings: [mockWarning('Chat session creation')],
        }
      }

      const { data, error } = await context.clients.admin
        .from('chat_sessions')
        .insert({
          workspace_id: input.workspaceId,
          project_id: input.projectId,
          title: input.title ?? 'Edit session',
          created_by: userId,
        })
        .select('*')
        .single()

      throwOnSupabaseError(error)
      return { chatSession: data, warnings: [] }
    },

    async sendMessage(input: SendChatMessageInput) {
      const userId = getRequiredAuthUserId(context)
      if (!context.clients.admin || context.env.mockOnly) {
        return {
          chatMessage: {
            id: createMockId('chat_message'),
            workspaceId: input.workspaceId,
            chatSessionId: input.chatSessionId,
            role: 'user',
            message: input.message,
            userId,
            createdAt: nowIso(),
            mockOnly: true,
          },
          warnings: ['Message stored as mock metadata only; no planning, generation, provider, or render work started.'],
        }
      }

      const { data, error } = await context.clients.admin
        .from('chat_messages')
        .insert({
          workspace_id: input.workspaceId,
          chat_session_id: input.chatSessionId,
          role: 'user',
          content: input.message,
          user_id: userId,
        })
        .select('*')
        .single()

      throwOnSupabaseError(error)
      return {
        chatMessage: data,
        warnings: ['Chat message recorded only; generation is never started directly from raw chat.'],
      }
    },

    async attachFinalizedClips(input: AttachClipsInput) {
      const userId = getRequiredAuthUserId(context)
      if (!context.clients.admin || context.env.mockOnly) {
        const missingAssets = input.mediaAssetIds.filter((id) => !getMockMediaAsset(id))
        if (missingAssets.length > 0) {
          throw new ApiError(
            'UPLOAD_NOT_FINALIZED',
            'Only finalized media assets can be attached as source clips in mock/local mode.',
            409,
            { missingMediaAssetIds: missingAssets },
          )
        }

        return {
          attachmentBatch: {
            id: createMockId('clip_attachment_batch'),
            workspaceId: input.workspaceId,
            projectId: input.projectId,
            chatSessionId: input.chatSessionId,
            mediaAssetIds: input.mediaAssetIds,
            sourceOrder: input.mediaAssetIds.map((mediaAssetId, index) => ({
              mediaAssetId,
              order: index + 1,
            })),
            createdAt: nowIso(),
            mockOnly: true,
          },
          warnings: ['Finalized clips attached in source order; no AI planning, provider call, or render job was started.'],
        }
      }

      const { data: chatSession, error: chatError } = await context.clients.admin
        .from('chat_sessions')
        .select('id, project_id')
        .eq('id', input.chatSessionId)
        .single()
      throwOnSupabaseError(chatError, 'CHAT_SESSION_NOT_FOUND')
      if (!chatSession) throw new ApiError('CHAT_SESSION_NOT_FOUND', 'Chat session was not found.', 404)

      const projectId = input.projectId ?? String(chatSession.project_id)
      const { data: mediaAssets, error: mediaError } = await context.clients.admin
        .from('media_assets')
        .select('id, mime_type')
        .in('id', input.mediaAssetIds)
        .eq('workspace_id', input.workspaceId)
        .eq('project_id', projectId)
      throwOnSupabaseError(mediaError)

      const foundIds = new Set((mediaAssets ?? []).map((asset) => String(asset.id)))
      const missingAssets = input.mediaAssetIds.filter((id) => !foundIds.has(id))
      if (missingAssets.length > 0) {
        throw new ApiError('MEDIA_ASSET_NOT_FOUND', 'Only finalized media assets can be attached as source clips.', 409, {
          missingMediaAssetIds: missingAssets,
        })
      }

      const canonicalPrefix = `workspaces/${input.workspaceId}/projects/${projectId}/`
      const { data: storageRecords, error: storageError } = await context.clients.admin
        .from('storage_object_records')
        .select('id, media_asset_id, object_path, status')
        .in('media_asset_id', input.mediaAssetIds)
        .eq('workspace_id', input.workspaceId)
        .eq('project_id', projectId)
        .eq('status', 'ready')
      throwOnSupabaseError(storageError)

      const storageMediaIds = new Set((storageRecords ?? [])
        .filter((record) => typeof record.object_path === 'string' && record.object_path.startsWith(canonicalPrefix))
        .map((record) => String(record.media_asset_id)))
      const missingStorage = input.mediaAssetIds.filter((id) => !storageMediaIds.has(id))
      if (missingStorage.length > 0) {
        throw new ApiError('STORAGE_OBJECT_NOT_FOUND', 'Finalized clips must have ready canonical storage records before attachment.', 409, {
          missingStorageForMediaAssetIds: missingStorage,
          canonicalPrefix,
        })
      }

      const sourceSequenceId = createMockId('source_sequence')
      const { data: sequence, error: sequenceError } = await context.clients.admin
        .from('source_clip_sequences')
        .insert({
          workspace_id: input.workspaceId,
          project_id: projectId,
          chat_session_id: input.chatSessionId,
          created_by: userId,
          name: 'Uploaded source sequence',
          metadata: { createdByRoute: 'chat_attach_finalized_clips' },
        })
        .select('id')
        .single()
      throwOnSupabaseError(sequenceError)

      const sequenceId = String(sequence?.id ?? sourceSequenceId)
      const attachmentRows = input.mediaAssetIds.map((mediaAssetId, index) => ({
        workspace_id: input.workspaceId,
        project_id: projectId,
        chat_session_id: input.chatSessionId,
        attachment_type: attachmentTypeForMediaAsset(mediaAssets?.find((asset) => String(asset.id) === mediaAssetId)?.mime_type),
        media_asset_id: mediaAssetId,
        source_order: index + 1,
        metadata: { finalizedMediaAsset: true },
      }))
      const itemRows = input.mediaAssetIds.map((mediaAssetId, index) => ({
        source_clip_sequence_id: sequenceId,
        workspace_id: input.workspaceId,
        project_id: projectId,
        media_asset_id: mediaAssetId,
        uploaded_order: index + 1,
        metadata: { attachedFromChatSessionId: input.chatSessionId },
      }))

      const { error: attachmentError } = await context.clients.admin.from('chat_attachments').insert(attachmentRows)
      throwOnSupabaseError(attachmentError)
      const { error: itemError } = await context.clients.admin.from('source_clip_sequence_items').insert(itemRows)
      throwOnSupabaseError(itemError)

      return {
        attachmentBatch: {
          id: createMockId('clip_attachment_batch'),
          workspaceId: input.workspaceId,
          projectId,
          chatSessionId: input.chatSessionId,
          mediaAssetIds: input.mediaAssetIds,
          sourceOrder: input.mediaAssetIds.map((mediaAssetId, index) => ({
            mediaAssetId,
            order: index + 1,
          })),
          createdAt: nowIso(),
          mockOnly: false,
        },
        warnings: ['Finalized clips attached in source order; no AI planning, provider call, or render job was started.'],
      }
    },
  }
}

function attachmentTypeForMediaAsset(mimeType: unknown): string {
  if (typeof mimeType === 'string' && mimeType.startsWith('audio/')) return 'source_audio'
  if (typeof mimeType === 'string' && mimeType.startsWith('image/')) return 'source_image'
  return 'source_video'
}
