import type {
  ChatMessageRecord,
  ChatSessionRecord,
  InlineChatCardRecord,
  MediaAssetRecord,
  ProjectRecord,
  SourceClipSequenceItem,
  SourceClipSequenceRecord,
} from '../../types'
import type { MockClipInput } from '../backend-types'

export interface CreateProjectRequest {
  workspaceId: string
  userId: string
  title: string
  description?: string
}

export interface CreateProjectResponse {
  project: ProjectRecord
}

export interface CreateChatSessionRequest {
  projectId: string
  workspaceId: string
  userId: string
  title?: string
}

export interface CreateChatSessionResponse {
  chatSession: ChatSessionRecord
}

export interface SendChatMessageRequest {
  projectId: string
  chatSessionId: string
  role: ChatMessageRecord['role']
  content: string
  visibleToUser?: boolean
}

export interface SendChatMessageResponse {
  message: ChatMessageRecord
}

export interface AttachClipsInChatRequest {
  workspaceId: string
  projectId: string
  chatSessionId: string
  chatMessageId?: string
  uploadedByUserId?: string
  clips: MockClipInput[]
}

export interface AttachClipsInChatResponse {
  mediaAssets: MediaAssetRecord[]
  sourceSequence: SourceClipSequenceRecord
  sourceSequenceItems: SourceClipSequenceItem[]
}

export interface InlineChatCardResponse {
  card: InlineChatCardRecord
}
