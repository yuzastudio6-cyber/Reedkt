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

export const EDIT_REFERENCE_EVIDENCE_CATEGORIES = [
  'all_goals',
  'media_structure',
  ...EDIT_REFERENCE_STUDY_GOALS,
  'copy_safety',
] as const

export type PreferenceEvidenceCategory = typeof EDIT_REFERENCE_EVIDENCE_CATEGORIES[number]

export const EDIT_REFERENCE_MANUAL_EVIDENCE_CATEGORIES = [
  'all_goals',
  ...EDIT_REFERENCE_STUDY_GOALS,
] as const

export const EDIT_REFERENCE_EVIDENCE_SOURCE_TYPES = [
  'manual_user_evidence',
  'reference_video_metadata',
  'previous_approved_edit_snapshot',
  'derived_skill_evidence',
] as const

export type PreferenceEvidenceSourceType = typeof EDIT_REFERENCE_EVIDENCE_SOURCE_TYPES[number]

export const EDIT_REFERENCE_RIGHTS_BASES = [
  'user_owned',
  'licensed_or_authorized',
  'reference_only',
  'workspace_approved_edit',
] as const

export type PreferenceEvidenceRightsBasis = typeof EDIT_REFERENCE_RIGHTS_BASES[number]
export const EDIT_REFERENCE_MEDIA_RIGHTS_BASES = [
  'user_owned',
  'licensed_or_authorized',
  'reference_only',
] as const
export type PreferenceEvidenceTransferability = 'transferable' | 'non_transferable' | 'do_not_copy' | 'requires_user_review' | 'unknown'
export type PreferenceEvidenceConfidenceBasis = 'user_asserted' | 'metadata_verified' | 'deterministic_derived' | 'blocked'
export type PreferenceEvidenceMediaStudyStatus = 'not_applicable' | 'media_not_studied' | 'approved_edit_identity_not_verified'
export type PreferenceEvidenceStatus = 'not_complete' | 'ready_to_study' | 'evidence_ready' | 'needs_clarification'

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
export type PreferenceStudyMessageRuntimeSource = 'user_input' | 'deterministic_setup' | 'deterministic_evidence'

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

export const EDIT_REFERENCE_SAFETY_FLAGS = EDIT_REFERENCE_GATE_1_SAFETY_FLAGS

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
  evidenceStatus: PreferenceEvidenceStatus
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
  evidenceStatus: PreferenceEvidenceStatus
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
  orchestrationId?: string
  supersedesEvidenceId?: string
  sourceType: PreferenceEvidenceSourceType
  category: PreferenceEvidenceCategory
  title: string
  summary: string
  revision: number
  confidence: number
  confidenceBasis: PreferenceEvidenceConfidenceBasis
  transferability: PreferenceEvidenceTransferability
  mediaMetadata?: PreferenceEvidenceMediaMetadata
  provenance: PreferenceEvidenceProvenance
  createdAt: string
  updatedAt: string
}

export interface PreferenceEvidenceMediaMetadata {
  durationSeconds?: number
  width?: number
  height?: number
  hasAudio?: boolean
  orientation: 'portrait' | 'landscape' | 'square' | 'unknown'
}

export interface PreferenceEvidenceProvenance {
  runtimeSource: 'user_input' | 'verified_local' | 'verified_mock' | 'fallback' | 'blocked'
  sourceEvidenceIds: string[]
  skillRunId?: string
  privateAssetId?: string
  sourceLabel?: string
  projectId?: string
  editSessionId?: string
  approvedSnapshotId?: string
  rightsBasis?: PreferenceEvidenceRightsBasis
  mediaStudyStatus: PreferenceEvidenceMediaStudyStatus
  toolIds: string[]
  skillIds: string[]
  fallbackUsed: boolean
  notes: string[]
}

export interface PreferenceAssetRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  studySessionId: string
  privateAssetId: string
  assetKind: 'reference_video_metadata' | 'previous_approved_edit_snapshot'
  label: string
  rightsBasis: PreferenceEvidenceRightsBasis
  mediaStudyStatus: Exclude<PreferenceEvidenceMediaStudyStatus, 'not_applicable'>
  mediaMetadata?: PreferenceEvidenceMediaMetadata
  projectId?: string
  editSessionId?: string
  approvedSnapshotId?: string
  createdAt: string
}

export interface PreferenceSkillRunRecord {
  id: string
  workspaceId: string
  editReferenceId: string
  studySessionId: string
  orchestrationId: string
  skillId: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'blocked'
  runtimeSource: 'not_started' | 'verified_mock' | 'verified_local' | 'verified_live' | 'fallback'
  readinessAtRun: 'verified_live' | 'verified_local' | 'verified_mock' | 'degraded' | 'blocked' | 'not_implemented'
  inputEvidenceIds: string[]
  outputEvidenceIds: string[]
  toolIds: string[]
  fallbackUsed: boolean
  resultSummary: string
  warnings: string[]
  blockedReasons: string[]
  providerCallMade: false
  modelCallMade: false
  fileBytesRead: false
  externalUrlFetched: false
  mediaProcessingStarted: false
  workerJobCreated: false
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
  eventType: 'created' | 'study_created' | 'message_appended' | 'evidence_added' | 'evidence_study_completed' | 'updated' | 'archived' | 'applied' | 'replaced' | 'cleared'
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
  nextAction: 'answer_setup_questions' | 'add_reference_evidence' | 'run_evidence_study' | 'review_study_findings' | 'add_missing_evidence' | 'archived'
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

interface CreatePreferenceEvidenceBaseRequest {
  workspaceId: string
  expectedStudyRevision: number
  sourceType: Exclude<PreferenceEvidenceSourceType, 'derived_skill_evidence'>
  title: string
}

export interface CreateManualPreferenceEvidenceRequest extends CreatePreferenceEvidenceBaseRequest {
  sourceType: 'manual_user_evidence'
  category: Exclude<PreferenceEvidenceCategory, 'media_structure' | 'copy_safety'>
  summary: string
  intendedUse: Exclude<PreferenceEvidenceTransferability, 'unknown'>
  supersedesEvidenceId?: string
}

export interface CreateReferenceVideoMetadataEvidenceRequest extends CreatePreferenceEvidenceBaseRequest {
  sourceType: 'reference_video_metadata'
  sourceLabel: string
  rightsBasis: Exclude<PreferenceEvidenceRightsBasis, 'workspace_approved_edit'>
  durationSeconds?: number
  width?: number
  height?: number
  hasAudio?: boolean
}

export interface CreatePreviousApprovedEditEvidenceRequest extends CreatePreferenceEvidenceBaseRequest {
  sourceType: 'previous_approved_edit_snapshot'
  projectId: string
  editSessionId: string
  approvedSnapshotId: string
  summary?: string
  rightsBasis: 'workspace_approved_edit'
}

export type CreatePreferenceEvidenceRequest =
  | CreateManualPreferenceEvidenceRequest
  | CreateReferenceVideoMetadataEvidenceRequest
  | CreatePreviousApprovedEditEvidenceRequest

export interface RunPreferenceEvidenceStudyRequest {
  workspaceId: string
  expectedStudyRevision: number
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
