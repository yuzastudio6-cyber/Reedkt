import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Request } from 'express'
import type { RuntimeEnv } from './config/env'
import type { StorageAdapter } from './storage/storage-types'
import type { EditReferenceStudyChatRuntimePort } from './services/edit-reference-study-chat-runtime-port'
import type { EditReferenceExactEditApplyRuntimePort } from './services/edit-reference-exact-edit-apply-runtime-port'
import type { EditReferenceApplicationPreparationRuntimePort } from './services/edit-reference-application-preparation-runtime-port'
import type { EditReferenceLongFormStudyRuntimePort } from './services/edit-reference-production-long-form-runtime-port'
import type { EditReferenceDomainRepositoryRuntimePort } from './services/edit-reference-domain-repository-runtime-port'
import type { PlanningPreferenceApplicationAuthorityPort } from './services/planning-preference-application-authority-port'
import type { CanonicalMotionStudioStorytellingProductionAuthorityReaderPort } from './services/canonical-motion-studio-storytelling-production-authority-service'
import type { PlanningExactEditPreferenceAuthorityPort } from './services/planning-exact-edit-preference-authority-port'
import type {
  CanonicalDurableUploadTargetTransactionAdapter,
  CanonicalUploadTargetCredentialEscrow,
} from './upload-target-authority/canonical-durable-upload-target-authority'

export interface AuthContext {
  userId: string
  email?: string
  accessToken?: string
  isMockUser: boolean
  user?: User
}

export interface IdempotencyContext {
  key: string
  requestHash: string
  workspaceId: string
  replayed: boolean
}

export type ProjectAccessRole = 'viewer' | 'editor' | 'admin' | 'owner'

export interface ProjectAccessContext {
  workspaceId: string
  projectId: string
  editSessionId?: string
  briefId?: string
  markerId?: string
  role: ProjectAccessRole
  canRead: boolean
  canWrite: boolean
  canAdmin: boolean
  isMockAccess: boolean
}

export interface RequestContext {
  requestId: string
  auth?: AuthContext
  idempotency?: IdempotencyContext
  projectAccess?: ProjectAccessContext
}

export interface RuntimeClients {
  admin: SupabaseClient | null
  public: SupabaseClient | null
}

export interface RuntimeState {
  env: RuntimeEnv
  clients: RuntimeClients
  storageAdapter?: StorageAdapter
  planningPreferenceApplicationAuthorityPort?: PlanningPreferenceApplicationAuthorityPort
  planningExactEditPreferenceAuthorityPort?: PlanningExactEditPreferenceAuthorityPort
  canonicalDurableUploadTargetStatePort?: CanonicalDurableUploadTargetTransactionAdapter
  canonicalUploadTargetCredentialEscrow?: CanonicalUploadTargetCredentialEscrow
  editReferenceStudyChatRuntimePort?: EditReferenceStudyChatRuntimePort
  canonicalMotionStudioStorytellingProductionAuthorityReaderPort?:
    CanonicalMotionStudioStorytellingProductionAuthorityReaderPort
  editReferenceExactEditApplyRuntimePort?: EditReferenceExactEditApplyRuntimePort
  editReferenceApplicationPreparationRuntimePort?: EditReferenceApplicationPreparationRuntimePort
  editReferenceLongFormStudyRuntimePort?: EditReferenceLongFormStudyRuntimePort
  editReferenceDomainRepositoryRuntimePort?: EditReferenceDomainRepositoryRuntimePort
}

export type RuntimeRequest = Request & {
  context?: RequestContext
  runtime?: RuntimeState
}

export interface RouteHandlerResult<T = unknown> {
  ok: true
  data: T
  warnings?: string[]
  mockOnly?: boolean
}

export interface ServiceContext {
  env: RuntimeEnv
  clients: RuntimeClients
  requestId: string
  auth?: AuthContext
  storageAdapter?: StorageAdapter
  planningPreferenceApplicationAuthorityPort?: PlanningPreferenceApplicationAuthorityPort
  planningExactEditPreferenceAuthorityPort?: PlanningExactEditPreferenceAuthorityPort
  canonicalDurableUploadTargetStatePort?: CanonicalDurableUploadTargetTransactionAdapter
  canonicalUploadTargetCredentialEscrow?: CanonicalUploadTargetCredentialEscrow
  editReferenceStudyChatRuntimePort?: EditReferenceStudyChatRuntimePort
  canonicalMotionStudioStorytellingProductionAuthorityReaderPort?:
    CanonicalMotionStudioStorytellingProductionAuthorityReaderPort
  editReferenceExactEditApplyRuntimePort?: EditReferenceExactEditApplyRuntimePort
  editReferenceApplicationPreparationRuntimePort?: EditReferenceApplicationPreparationRuntimePort
  editReferenceLongFormStudyRuntimePort?: EditReferenceLongFormStudyRuntimePort
  editReferenceDomainRepositoryRuntimePort?: EditReferenceDomainRepositoryRuntimePort
}
