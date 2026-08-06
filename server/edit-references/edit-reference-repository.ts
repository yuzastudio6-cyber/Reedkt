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
import type { EditReferenceStudyChatReasoningAttemptRecord } from './edit-reference-study-chat-reasoning-attempt-contract'
import type { EditReferenceStudyChatProviderRequestRecord } from './edit-reference-study-chat-provider-request-contract'
import type { EditReferenceStudyChatProviderCheckbackRecord } from './edit-reference-study-chat-provider-checkback-contract'
import type { EditReferenceStudyChatInternalCostAuthorityRecord } from './edit-reference-study-chat-internal-cost-authority-contract'
import type { EditReferenceStudyChatProviderWorkflowRecord } from './edit-reference-study-chat-provider-workflow-contract'
import type { EditReferencePreferenceDnaReasoningAttemptRecord } from './edit-reference-preference-dna-reasoning-attempt-contract'
import type { EditReferenceDomainCommand } from './edit-reference-domain-command-contract'

export const EDIT_REFERENCE_AGGREGATE_VERSION = 'edit-reference-private-v2' as const
export const EDIT_REFERENCE_IDEMPOTENCY_RECEIPT_VERSION = 'edit-reference-idempotency-receipt-v2' as const

export interface EditReferenceRepositoryScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
}

export interface EditReferenceIdempotencyResultPointer {
  resultKind: 'edit_reference_detail'
  editReferenceId: string
  studySessionId: string
  stableResultIds: string[]
  appendedMessageIds?: string[]
  resultDigestSha256: string
}

export interface EditReferenceIdempotencyReceipt {
  receiptVersion: typeof EDIT_REFERENCE_IDEMPOTENCY_RECEIPT_VERSION
  receiptId: string
  ledgerSequence: number
  operation: string
  idempotencyKeyHashSha256: string
  requestHashSha256: string
  result: EditReferenceIdempotencyResultPointer
  committedRevision: number
  completedAt: string
}

export interface EditReferenceAuditEvent {
  id: string
  sequence: number
  eventType: string
  actorUserId: string
  editReferenceId?: string
  studySessionId?: string
  dnaVersionId?: string
  dnaQaResultId?: string
  applicationId?: string
  reasoningAttemptId?: string
  reasoningProviderRequestId?: string
  reasoningProviderCheckbackId?: string
  reasoningProviderWorkflowId?: string
  reasoningInternalCostAuthorityId?: string
  preferenceDnaReasoningAttemptId?: string
  providerObservationIdDigestSha256?: string
  providerObservationDigestSha256?: string
  aggregateRevision: number
  createdAt: string
}

export interface EditReferenceAuditState {
  eventCount: number
  lastSequence: number
}

export interface EditReferenceIdempotencyState {
  receiptCount: number
  lastSequence: number
  archivedReceiptCount: number
  compactionCount: number
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
  reasoningAttempts: EditReferenceStudyChatReasoningAttemptRecord[]
  reasoningProviderRequests: EditReferenceStudyChatProviderRequestRecord[]
  reasoningProviderCheckbacks: EditReferenceStudyChatProviderCheckbackRecord[]
  reasoningProviderWorkflows: EditReferenceStudyChatProviderWorkflowRecord[]
  reasoningInternalCostAuthorities: EditReferenceStudyChatInternalCostAuthorityRecord[]
  preferenceDnaReasoningAttempts: EditReferencePreferenceDnaReasoningAttemptRecord[]
  evidence: PreferenceEvidenceRecord[]
  assets: PreferenceAssetRecord[]
  skillRuns: PreferenceSkillRunRecord[]
  dnaVersions: PreferenceDNAVersionRecord[]
  dnaQaResults: PreferenceDNAQAResultRecord[]
  applications: PreferenceApplicationRecord[]
  usageLogs: PreferenceUsageLogRecord[]
  auditState: EditReferenceAuditState
  idempotencyState: EditReferenceIdempotencyState
  idempotencyReceipts: EditReferenceIdempotencyReceipt[]
  createdAt: string
  updatedAt: string
  privateInternalOnly: true
}

export interface EditReferenceMutationContext {
  now: string
  actorUserId: string
  aggregate: EditReferenceAggregate
  addAuditEvent: (event: Omit<EditReferenceAuditEvent, 'id' | 'sequence' | 'actorUserId' | 'aggregateRevision' | 'createdAt'>) => void
}

export interface EditReferenceMutationReplayContext {
  aggregate: EditReferenceAggregate
  receipt: EditReferenceIdempotencyReceipt
}

export interface EditReferenceMutationInput {
  scope: EditReferenceRepositoryScope
  operation: string
  idempotencyKey: string
  requestHash: string
  /**
   * Explicit server-owned command for transactional repositories. The local
   * private repository continues to execute the bounded mutation closure.
   * Canonical RPC repositories must reject mutations that omit this command
   * instead of serializing or trusting an arbitrary aggregate replacement.
   */
  command?: EditReferenceDomainCommand
  mutate: (
    context: EditReferenceMutationContext,
  ) => EditReferenceDetailData & { appendedMessageIds?: string[] } | Promise<EditReferenceDetailData & { appendedMessageIds?: string[] }>
  replay: (context: EditReferenceMutationReplayContext) => EditReferenceDetailData & { appendedMessageIds?: string[] }
}

export interface EditReferenceMutationResult {
  data: EditReferenceDetailData & { appendedMessageIds?: string[] }
  replayed: boolean
}

export interface EditReferenceCommittedMutationLookupInput {
  scope: EditReferenceRepositoryScope
  operation: string
  idempotencyKey: string
  requestHash: string
  replay: (context: EditReferenceMutationReplayContext) => EditReferenceDetailData & { appendedMessageIds?: string[] }
}

export interface EditReferenceRepository {
  readonly persistence: 'backend_local_private' | 'canonical_supabase_transactional' | 'supabase_blocked'
  read(scope: EditReferenceRepositoryScope): Promise<EditReferenceAggregate | undefined>
  readAuditEvents(scope: EditReferenceRepositoryScope): Promise<EditReferenceAuditEvent[]>
  /**
   * Server-only replay preflight for prepared commands. It prevents a lost
   * response retry from recomputing bounded analysis before the transactional
   * idempotency receipt is checked. Callback repositories need not expose it.
   */
  lookupCommittedMutation?(
    input: EditReferenceCommittedMutationLookupInput,
  ): Promise<EditReferenceMutationResult | undefined>
  mutate(input: EditReferenceMutationInput): Promise<EditReferenceMutationResult>
}
