export const EDIT_REFERENCE_STUDY_GOALS = [
  'visual_language',
  'story_and_pacing',
  'captions',
  'color',
  'b_roll',
  'audio_and_sfx',
  'graphics',
] as const

export type EditReferenceStudyGoal = typeof EDIT_REFERENCE_STUDY_GOALS[number]

export const EDIT_REFERENCE_STUDY_LIFECYCLE_STATUSES = [
  'draft',
  'collecting_evidence',
  'ready_to_study',
  'studying',
  'needs_clarification',
  'evidence_ready',
  'dna_ready',
  'qa_blocked',
  'needs_user_review',
  'approved',
  'applied',
  'archived',
  'failed',
] as const

export type EditReferenceStudyLifecycleStatus = typeof EDIT_REFERENCE_STUDY_LIFECYCLE_STATUSES[number]
export type EditReferenceStatus = 'active' | 'archived'
export type PreferenceStudyMessageRole = 'user' | 'assistant' | 'system'
export type PreferenceStudyMessageRuntimeSource = 'user_input' | 'deterministic_setup'

export interface EditReferenceSafetyFlags {
  providerCallMade: false
  modelCallMade: false
  fileBytesRead: false
  externalUrlFetched: false
  mediaProcessingStarted: false
  workerJobCreated: false
  generationRequestCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
  supabaseReadMade: false
  supabaseWriteMade: false
  rawFramesPersisted: false
  rawProviderPayloadPersisted: false
}

export const EDIT_REFERENCE_GATE_1_SAFETY_FLAGS: EditReferenceSafetyFlags = {
  providerCallMade: false,
  modelCallMade: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  creditReservedOrSpent: false,
  supabaseReadMade: false,
  supabaseWriteMade: false,
  rawFramesPersisted: false,
  rawProviderPayloadPersisted: false,
}

export interface EditReferenceRecord {
  id: string
  workspaceId: string
  name: string
  description?: string
  status: EditReferenceStatus
  initialGoals: EditReferenceStudyGoal[]
  currentStudyId: string
  revision: number
  createdAt: string
  updatedAt: string
  runtimeSource: 'backend_local_private'
  evidenceStatus: 'not_complete'
  dnaStatus: 'not_generated'
  qaStatus: 'not_run'
}

export interface PreferenceStudySessionRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  title: string
  status: EditReferenceStudyLifecycleStatus
  initialGoals: EditReferenceStudyGoal[]
  revision: number
  createdAt: string
  updatedAt: string
  runtimeSource: 'backend_local_private'
  evidenceStatus: 'not_complete'
  dnaStatus: 'not_generated'
  qaStatus: 'not_run'
}

export interface PreferenceStudyMessageRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  studySessionId: string
  role: PreferenceStudyMessageRole
  content: string
  sequence: number
  clientMessageId?: string
  runtimeSource: PreferenceStudyMessageRuntimeSource
  createdAt: string
}

export interface PreferenceEvidenceRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  studySessionId: string
  sourceType: 'manual_user_evidence' | 'metadata_only' | 'future_media_evidence'
  createdAt: string
}

export interface PreferenceAssetRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  studySessionId: string
  privateAssetId: string
  createdAt: string
}

export interface PreferenceSkillRunRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  studySessionId: string
  skillId: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'blocked'
  runtimeSource: 'not_started' | 'verified_mock' | 'verified_local' | 'verified_live' | 'fallback'
  createdAt: string
  updatedAt: string
}

export interface PreferenceDNAVersionRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  studySessionId: string
  version: number
  status: 'draft' | 'review_required' | 'approved' | 'superseded'
  createdAt: string
}

export interface PreferenceDNAQAResultRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  dnaVersionId: string
  status: 'not_run' | 'passed' | 'blocked' | 'requires_user_review'
  createdAt: string
}

export interface PreferenceApplicationRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  dnaVersionId: string
  projectId: string
  editSessionId: string
  version: number
  status: 'applied' | 'replaced' | 'cleared'
  createdAt: string
}

export interface PreferenceUsageLogRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  eventType: 'created' | 'study_created' | 'message_appended' | 'updated' | 'archived' | 'applied' | 'replaced' | 'cleared'
  createdAt: string
}

export interface EditReferenceListItem {
  reference: EditReferenceRecord
  currentStudy: PreferenceStudySessionRecord
  messageCount: number
  applicationCount: number
}

export interface EditReferenceDetail {
  reference: EditReferenceRecord
  study: PreferenceStudySessionRecord
  messages: PreferenceStudyMessageRecord[]
  evidence: PreferenceEvidenceRecord[]
  assets: PreferenceAssetRecord[]
  skillRuns: PreferenceSkillRunRecord[]
  dnaVersions: PreferenceDNAVersionRecord[]
  dnaQaResults: PreferenceDNAQAResultRecord[]
  applications: PreferenceApplicationRecord[]
  usageLogs: PreferenceUsageLogRecord[]
  nextAction: 'answer_setup_questions' | 'add_reference_evidence' | 'archived'
  safety: EditReferenceSafetyFlags
}

export interface EditReferenceListData {
  references: EditReferenceListItem[]
  persistence: 'backend_local_private'
  productionPersistence: 'blocked_by_migration_baseline'
  safety: EditReferenceSafetyFlags
}

export interface EditReferenceDetailData {
  detail: EditReferenceDetail
  replayed: boolean
}

export interface EditReferenceMessageData extends EditReferenceDetailData {
  appendedMessageIds: string[]
}

export interface PreferenceStudyData {
  reference: EditReferenceRecord
  study: PreferenceStudySessionRecord
  messages: PreferenceStudyMessageRecord[]
  safety: EditReferenceSafetyFlags
}

export interface PreferenceStudyMessageListData {
  studyId: string
  messages: PreferenceStudyMessageRecord[]
  safety: EditReferenceSafetyFlags
}

export interface CreateEditReferenceRequest {
  workspaceId: string
  name: string
  description?: string
  initialGoals: EditReferenceStudyGoal[]
}

export interface UpdateEditReferenceRequest {
  workspaceId: string
  expectedReferenceRevision: number
  name?: string
  description?: string
  status?: 'archived'
}

export interface CreatePreferenceStudyRequest {
  workspaceId: string
  expectedReferenceRevision: number
  title: string
}

export interface UpdatePreferenceStudyRequest {
  workspaceId: string
  expectedStudyRevision: number
  title?: string
  status?: EditReferenceStudyLifecycleStatus
}

export interface AppendPreferenceStudyMessageRequest {
  workspaceId: string
  expectedStudyRevision: number
  clientMessageId: string
  content: string
}

export interface EditReferenceApiSuccess<T> {
  ok: true
  data: T
  warnings: string[]
}

export interface EditReferenceApiFailure {
  ok: false
  status: number
  code: string
  message: string
  details?: unknown
}

export type EditReferenceApiResult<T> = EditReferenceApiSuccess<T> | EditReferenceApiFailure
