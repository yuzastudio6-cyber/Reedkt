import type {
  EditReferenceDetailData,
  EditReferenceRecord,
  PreferenceApplicationRecord,
  PreferenceAssetRecord,
  PreferenceDNAQAResultRecord,
  PreferenceDNAVersionRecord,
  PreferenceEvidenceRecord,
  PreferenceSkillRunRecord,
  PreferenceStudyMessageRecord,
  PreferenceStudySessionRecord,
  PreferenceUsageLogRecord,
} from '../../src/types/edit-reference'

export const EDIT_REFERENCE_AGGREGATE_VERSION = 'edit-reference-private-v1' as const

export interface EditReferenceRepositoryScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
}

export interface EditReferenceIdempotencyRecord {
  operation: string
  key: string
  requestHash: string
  responseSnapshot: EditReferenceDetailData & { appendedMessageIds?: string[] }
  committedRevision: number
  completedAt: string
}

export interface EditReferenceAuditEvent {
  id: string
  eventType: string
  actorUserId: string
  editReferenceId?: string
  studySessionId?: string
  dnaVersionId?: string
  dnaQaResultId?: string
  aggregateRevision: number
  createdAt: string
}

export interface EditReferenceAggregate {
  schemaVersion: typeof EDIT_REFERENCE_AGGREGATE_VERSION
  ownerUserId: string
  workspaceId: string
  scopeHash: string
  revision: number
  references: EditReferenceRecord[]
  studies: PreferenceStudySessionRecord[]
  messages: PreferenceStudyMessageRecord[]
  evidence: PreferenceEvidenceRecord[]
  assets: PreferenceAssetRecord[]
  skillRuns: PreferenceSkillRunRecord[]
  dnaVersions: PreferenceDNAVersionRecord[]
  dnaQaResults: PreferenceDNAQAResultRecord[]
  applications: PreferenceApplicationRecord[]
  usageLogs: PreferenceUsageLogRecord[]
  auditEvents: EditReferenceAuditEvent[]
  idempotencyRecords: EditReferenceIdempotencyRecord[]
  createdAt: string
  updatedAt: string
  privateInternalOnly: true
}

export interface EditReferenceMutationContext {
  now: string
  actorUserId: string
  aggregate: EditReferenceAggregate
  addAuditEvent: (event: Omit<EditReferenceAuditEvent, 'id' | 'actorUserId' | 'aggregateRevision' | 'createdAt'>) => void
}

export interface EditReferenceMutationInput {
  scope: EditReferenceRepositoryScope
  operation: string
  idempotencyKey: string
  requestHash: string
  mutate: (context: EditReferenceMutationContext) => EditReferenceDetailData & { appendedMessageIds?: string[] }
}

export interface EditReferenceMutationResult {
  data: EditReferenceDetailData & { appendedMessageIds?: string[] }
  replayed: boolean
}

export interface EditReferenceRepository {
  readonly persistence: 'backend_local_private' | 'supabase_blocked'
  read(scope: EditReferenceRepositoryScope): Promise<EditReferenceAggregate | undefined>
  mutate(input: EditReferenceMutationInput): Promise<EditReferenceMutationResult>
}
