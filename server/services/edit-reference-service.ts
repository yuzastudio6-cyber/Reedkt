import { randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type {
  ApproveEditReferenceDNAVersionRequest,
  AppendPreferenceStudyMessageRequest,
  CreatePreferenceEvidenceRequest,
  CreateEditReferenceRequest,
  CreatePreferenceStudyRequest,
  EditReferenceDetail,
  EditReferenceDetailData,
  EditReferenceListData,
  EditReferenceListItem,
  EditReferenceRecord,
  EditReferenceStudyGoal,
  PreferenceAssetRecord,
  PreferenceEvidenceMediaMetadata,
  PreferenceEvidenceRecord,
  PreferenceStudyMessageRecord,
  PreferenceStudyData,
  PreferenceStudyMessageListData,
  PreferenceStudySessionRecord,
  RunEditReferenceDNAQARequest,
  RunPreferenceEvidenceStudyRequest,
  SynthesizePreferenceDNARequest,
  UpdateEditReferenceRequest,
  UpdatePreferenceStudyRequest,
} from '../../src/types/edit-reference'
import { EDIT_REFERENCE_SAFETY_FLAGS } from '../../src/types/edit-reference'
import type {
  EditReferenceAggregate,
  EditReferenceRepository,
  EditReferenceRepositoryScope,
} from '../edit-references/edit-reference-repository'
import { DisabledSupabaseEditReferenceRepository } from '../edit-references/disabled-supabase-edit-reference-repository'
import {
  hashEditReferenceRequest,
  PrivateEditReferenceRepository,
} from '../edit-references/private-edit-reference-repository'
import { orchestratePreferenceEvidenceStudy } from '../edit-references/edit-reference-evidence-orchestrator'
import { synthesizeEditReferencePreferenceDNA } from '../edit-references/edit-reference-dna-synthesis'
import { runEditReferenceDNAQA } from '../edit-references/edit-reference-dna-qa'

const LOCAL_WARNING = 'Stored in the private backend-local Edit Reference repository. Production Supabase persistence remains blocked.'
const FUTURE_RUNTIME_WARNING = 'No provider, model, file-byte, media, worker, generation, render, credit, or remote Supabase operation ran.'

export interface EditReferenceServiceResult<T> {
  data: T
  warnings: string[]
  replayed?: boolean
}

export interface EditReferenceService {
  listReferences(workspaceId: string): Promise<EditReferenceServiceResult<EditReferenceListData>>
  getReference(workspaceId: string, referenceId: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  getStudy(workspaceId: string, studyId: string): Promise<EditReferenceServiceResult<PreferenceStudyData>>
  listStudyMessages(workspaceId: string, studyId: string): Promise<EditReferenceServiceResult<PreferenceStudyMessageListData>>
  createReference(input: CreateEditReferenceRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  updateReference(referenceId: string, input: UpdateEditReferenceRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  createStudy(referenceId: string, input: CreatePreferenceStudyRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  updateStudy(studyId: string, input: UpdatePreferenceStudyRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  appendMessage(studyId: string, input: AppendPreferenceStudyMessageRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData & { appendedMessageIds: string[] }>>
  addEvidence(studyId: string, input: CreatePreferenceEvidenceRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  runEvidenceStudy(studyId: string, input: RunPreferenceEvidenceStudyRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  synthesizePreferenceDNA(studyId: string, input: SynthesizePreferenceDNARequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  runPreferenceDNAQA(studyId: string, dnaVersionId: string, input: RunEditReferenceDNAQARequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  approvePreferenceDNA(studyId: string, dnaVersionId: string, input: ApproveEditReferenceDNAVersionRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
}

export function createEditReferenceService(
  context: ServiceContext,
  repositoryOverride?: EditReferenceRepository,
): EditReferenceService {
  const ownerUserId = context.auth?.userId
  if (!ownerUserId) throw new ApiError('AUTH_REQUIRED', 'Edit Reference requires an authenticated user.', 401)

  const repository = repositoryOverride ?? selectRepository(context)
  const scope = (workspaceId: string): EditReferenceRepositoryScope => ({
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId,
    workspaceId: requireWorkspaceId(workspaceId),
  })

  return {
    async listReferences(workspaceId) {
      const aggregate = await repository.read(scope(workspaceId))
      const references: EditReferenceListItem[] = aggregate
        ? aggregate.references
          .slice()
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
          .map((reference) => {
            const currentStudy = requireStudy(aggregate, reference.currentStudyId)
            return {
              reference,
              currentStudy,
              messageCount: aggregate.messages.filter((message) => message.studySessionId === currentStudy.id).length,
              applicationCount: aggregate.applications.filter((application) => application.editReferenceId === reference.id).length,
            }
          })
        : []
      return result({
        references,
        persistence: 'backend_local_private',
        productionPersistence: 'blocked_by_migration_baseline',
        safety: EDIT_REFERENCE_SAFETY_FLAGS,
      })
    },

    async getReference(workspaceId, referenceId) {
      const aggregate = await repository.read(scope(workspaceId))
      if (!aggregate) throw referenceNotFound(referenceId)
      return result(detailData(aggregate, requireReference(aggregate, referenceId)))
    },

    async getStudy(workspaceId, studyId) {
      const aggregate = await repository.read(scope(workspaceId))
      if (!aggregate) throw studyNotFound(studyId)
      const study = requireStudy(aggregate, studyId)
      return result({
        reference: requireReference(aggregate, study.editReferenceId),
        study,
        messages: studyMessages(aggregate, study.id),
        safety: EDIT_REFERENCE_SAFETY_FLAGS,
      })
    },

    async listStudyMessages(workspaceId, studyId) {
      const aggregate = await repository.read(scope(workspaceId))
      if (!aggregate) throw studyNotFound(studyId)
      requireStudy(aggregate, studyId)
      return result({ studyId, messages: studyMessages(aggregate, studyId), safety: EDIT_REFERENCE_SAFETY_FLAGS })
    },

    async createReference(input, idempotencyKey) {
      const normalized = normalizeCreateReference(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'edit_reference.create',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest(normalized),
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const referenceId = `edit-reference-${randomUUID()}`
          const studyId = `preference-study-${randomUUID()}`
          const reference: EditReferenceRecord = {
            id: referenceId,
            workspaceId: normalized.workspaceId,
            name: normalized.name,
            ...(normalized.description ? { description: normalized.description } : {}),
            status: 'active',
            initialGoals: normalized.initialGoals,
            currentStudyId: studyId,
            revision: 1,
            createdAt: now,
            updatedAt: now,
            runtimeSource: 'backend_local_private',
            evidenceStatus: 'not_complete',
            dnaStatus: 'not_generated',
            qaStatus: 'not_run',
          }
          const study = createStudyRecord(reference, studyId, `${reference.name} study`, now)
          aggregate.references.push(reference)
          aggregate.studies.push(study)
          aggregate.messages.push(...setupMessages(reference, study, now))
          aggregate.usageLogs.push(
            usageLog(reference, 'created', now),
            usageLog(reference, 'study_created', now),
          )
          addAuditEvent({ eventType: 'edit_reference_created', editReferenceId: reference.id, studySessionId: study.id })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async updateReference(referenceId, input, idempotencyKey) {
      const normalized = normalizeUpdateReference(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'edit_reference.update',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ referenceId, ...normalized }),
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const reference = requireReference(aggregate, referenceId)
          assertRevision(reference.revision, normalized.expectedReferenceRevision, 'Edit Reference')
          if (normalized.name !== undefined) reference.name = normalized.name
          if (normalized.description !== undefined) {
            if (normalized.description) reference.description = normalized.description
            else delete reference.description
          }
          if (normalized.status === 'archived') {
            reference.status = 'archived'
            const study = requireStudy(aggregate, reference.currentStudyId)
            study.status = 'archived'
            study.revision += 1
            study.updatedAt = now
          }
          reference.revision += 1
          reference.updatedAt = now
          aggregate.usageLogs.push(usageLog(reference, normalized.status === 'archived' ? 'archived' : 'updated', now))
          addAuditEvent({ eventType: normalized.status === 'archived' ? 'edit_reference_archived' : 'edit_reference_updated', editReferenceId: reference.id })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async createStudy(referenceId, input, idempotencyKey) {
      const normalized = normalizeCreateStudy(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.create',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ referenceId, ...normalized }),
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const reference = requireReference(aggregate, referenceId)
          if (reference.status === 'archived') throw new ApiError('VALIDATION_FAILED', 'Archived Edit References cannot start a new study.', 409)
          assertRevision(reference.revision, normalized.expectedReferenceRevision, 'Edit Reference')
          const study = createStudyRecord(reference, `preference-study-${randomUUID()}`, normalized.title, now)
          aggregate.studies.push(study)
          aggregate.messages.push(...setupMessages(reference, study, now))
          reference.currentStudyId = study.id
          reference.evidenceStatus = 'not_complete'
          reference.dnaStatus = 'not_generated'
          reference.qaStatus = 'not_run'
          reference.revision += 1
          reference.updatedAt = now
          aggregate.usageLogs.push(usageLog(reference, 'study_created', now))
          addAuditEvent({ eventType: 'preference_study_created', editReferenceId: reference.id, studySessionId: study.id })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async updateStudy(studyId, input, idempotencyKey) {
      const normalized = normalizeUpdateStudy(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.update',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ studyId, ...normalized }),
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          if (normalized.title !== undefined) study.title = normalized.title
          if (normalized.status !== undefined) {
            assertStudyTransition(study.status, normalized.status)
            study.status = normalized.status
          }
          study.revision += 1
          study.updatedAt = now
          const reference = requireReference(aggregate, study.editReferenceId)
          reference.updatedAt = now
          addAuditEvent({ eventType: 'preference_study_updated', editReferenceId: reference.id, studySessionId: study.id })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async appendMessage(studyId, input, idempotencyKey) {
      const normalized = normalizeAppendMessage(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.message.append',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ studyId, ...normalized }),
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          const reference = requireReference(aggregate, study.editReferenceId)
          if (reference.status === 'archived' || study.status === 'archived') {
            throw new ApiError('VALIDATION_FAILED', 'Archived studies cannot accept messages.', 409)
          }
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          const existingClientMessage = aggregate.messages.find((message) => message.clientMessageId === normalized.clientMessageId)
          if (existingClientMessage) {
            throw new ApiError('IDEMPOTENCY_CONFLICT', 'The client message ID was already used.', 409)
          }
          const sequence = nextSequence(aggregate, study.id)
          const userMessage: PreferenceStudyMessageRecord = {
            id: `preference-study-message-${randomUUID()}`,
            workspaceId: reference.workspaceId,
            editReferenceId: reference.id,
            studySessionId: study.id,
            role: 'user',
            content: normalized.content,
            sequence,
            clientMessageId: normalized.clientMessageId,
            runtimeSource: 'user_input',
            createdAt: now,
          }
          const assistantMessage: PreferenceStudyMessageRecord = {
            id: `preference-study-message-${randomUUID()}`,
            workspaceId: reference.workspaceId,
            editReferenceId: reference.id,
            studySessionId: study.id,
            role: 'assistant',
            content: deterministicAcknowledgement(reference),
            sequence: sequence + 1,
            runtimeSource: 'deterministic_setup',
            createdAt: now,
          }
          const appendedMessageIds = [userMessage.id, assistantMessage.id]
          aggregate.messages.push(userMessage, assistantMessage)
          study.revision += 1
          study.updatedAt = now
          reference.updatedAt = now
          aggregate.usageLogs.push(usageLog(reference, 'message_appended', now))
          addAuditEvent({ eventType: 'preference_study_message_appended', editReferenceId: reference.id, studySessionId: study.id })
          return { ...detailData(aggregate, reference), appendedMessageIds }
        },
      })
      if (!mutation.data.appendedMessageIds) {
        throw new ApiError('INTERNAL_ERROR', 'The stored message response is incomplete.', 500)
      }
      return result(mutation.data as EditReferenceDetailData & { appendedMessageIds: string[] }, mutation.replayed)
    },

    async addEvidence(studyId, input, idempotencyKey) {
      const normalized = normalizeCreateEvidence(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.evidence.add',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ studyId, ...normalized }),
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          const reference = requireReference(aggregate, study.editReferenceId)
          assertActiveStudy(reference, study)
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          if (normalized.sourceType === 'manual_user_evidence' && normalized.supersedesEvidenceId) {
            const superseded = aggregate.evidence.find((record) => record.id === normalized.supersedesEvidenceId)
            if (!superseded || superseded.studySessionId !== study.id || superseded.sourceType !== 'manual_user_evidence') {
              throw new ApiError('VALIDATION_FAILED', 'A correction must point to a saved creative note in this study.', 409)
            }
            if (aggregate.evidence.some((record) => record.supersedesEvidenceId === superseded.id)) {
              throw new ApiError('VERSION_CONFLICT', 'That evidence already has a newer correction. Reload before saving.', 409)
            }
          }
          const { evidence, asset } = createEvidenceRecords(reference, study, normalized, now)
          aggregate.evidence.push(evidence)
          if (asset) aggregate.assets.push(asset)
          let invalidatedDNACandidate = false
          for (const dnaVersion of aggregate.dnaVersions.filter((record) => (
            record.studySessionId === study.id
            && record.status !== 'approved'
            && record.status !== 'superseded'
          ))) {
            dnaVersion.status = 'superseded'
            dnaVersion.supersededAt = now
            invalidatedDNACandidate = true
          }
          study.status = 'ready_to_study'
          study.evidenceStatus = 'ready_to_study'
          study.dnaStatus = 'not_generated'
          study.qaStatus = 'not_run'
          study.revision += 1
          study.updatedAt = now
          reference.evidenceStatus = 'ready_to_study'
          reference.dnaStatus = 'not_generated'
          reference.qaStatus = 'not_run'
          reference.updatedAt = now
          aggregate.messages.push(evidenceSavedMessage(reference, study, evidence, now, nextSequence(aggregate, study.id)))
          aggregate.usageLogs.push(usageLog(reference, 'evidence_added', now))
          if (invalidatedDNACandidate) {
            addAuditEvent({ eventType: 'preference_dna_candidate_invalidated', editReferenceId: reference.id, studySessionId: study.id })
          }
          addAuditEvent({ eventType: 'preference_evidence_added', editReferenceId: reference.id, studySessionId: study.id })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async runEvidenceStudy(studyId, input, idempotencyKey) {
      const normalized = normalizeRunEvidenceStudy(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.evidence.run',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ studyId, ...normalized }),
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          const reference = requireReference(aggregate, study.editReferenceId)
          assertActiveStudy(reference, study)
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          if (study.status !== 'ready_to_study') {
            throw new ApiError('VALIDATION_FAILED', 'The saved evidence has already been reviewed. Add or correct evidence before running the study again.', 409)
          }
          const studyEvidence = aggregate.evidence.filter((record) => record.studySessionId === study.id)
          if (!studyEvidence.some((record) => record.sourceType !== 'derived_skill_evidence')) {
            throw new ApiError('PREFERENCE_EVIDENCE_REQUIRED', 'Add evidence before asking ReEditPro to study it.', 409)
          }
          const orchestration = orchestratePreferenceEvidenceStudy({
            workspaceId: reference.workspaceId,
            editReferenceId: reference.id,
            study,
            evidence: studyEvidence,
            now,
          })
          aggregate.evidence.push(...orchestration.derivedEvidence)
          aggregate.skillRuns.push(...orchestration.skillRuns)
          study.status = orchestration.studyStatus
          study.evidenceStatus = orchestration.evidenceStatus
          study.revision += 1
          study.updatedAt = now
          reference.evidenceStatus = orchestration.evidenceStatus
          reference.updatedAt = now
          aggregate.messages.push(studyResultMessage(reference, study, orchestration.assistantMessage, now, nextSequence(aggregate, study.id)))
          aggregate.usageLogs.push(usageLog(reference, 'evidence_study_completed', now))
          addAuditEvent({ eventType: 'preference_evidence_study_completed', editReferenceId: reference.id, studySessionId: study.id })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async synthesizePreferenceDNA(studyId, input, idempotencyKey) {
      const normalized = normalizeSynthesizePreferenceDNA(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.dna.synthesize',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ studyId, ...normalized }),
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          const reference = requireReference(aggregate, study.editReferenceId)
          assertActiveStudy(reference, study)
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          const dnaVersion = synthesizeEditReferencePreferenceDNA({
            reference,
            study,
            evidence: aggregate.evidence.filter((record) => record.studySessionId === study.id),
            skillRuns: aggregate.skillRuns.filter((record) => record.studySessionId === study.id),
            existingVersions: aggregate.dnaVersions.filter((record) => record.studySessionId === study.id),
            now,
          })
          for (const previousVersion of aggregate.dnaVersions.filter((record) => (
            record.studySessionId === study.id
            && record.status !== 'approved'
            && record.status !== 'superseded'
          ))) {
            previousVersion.status = 'superseded'
            previousVersion.supersededAt = now
          }
          aggregate.dnaVersions.push(dnaVersion)
          study.status = 'dna_ready'
          study.dnaStatus = 'review_required'
          study.qaStatus = 'not_run'
          study.revision += 1
          study.updatedAt = now
          reference.dnaStatus = 'review_required'
          reference.qaStatus = 'not_run'
          reference.updatedAt = now
          aggregate.messages.push(dnaSynthesisMessage(reference, study, dnaVersion, now, nextSequence(aggregate, study.id)))
          aggregate.usageLogs.push(usageLog(reference, 'dna_version_created', now))
          addAuditEvent({ eventType: 'preference_dna_version_created', editReferenceId: reference.id, studySessionId: study.id })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async runPreferenceDNAQA(studyId, dnaVersionId, input, idempotencyKey) {
      const normalized = normalizeRunPreferenceDNAQA(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.dna.qa.run',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ studyId, dnaVersionId, ...normalized }),
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          const reference = requireReference(aggregate, study.editReferenceId)
          assertActiveStudy(reference, study)
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          const dnaVersion = requireDNAVersion(aggregate, dnaVersionId, study)
          assertDNAContentDigest(dnaVersion.contentDigest, normalized.expectedDNAContentDigest)
          if (dnaVersion.status !== 'review_required' || dnaVersion.qaStatus !== 'not_run') {
            throw new ApiError('VALIDATION_FAILED', 'Quality review already ran or this DNA version is no longer the active review candidate.', 409)
          }
          if (aggregate.dnaQaResults.some((record) => record.dnaVersionId === dnaVersion.id)) {
            throw new ApiError('VERSION_CONFLICT', 'This exact DNA version already has a quality-review result.', 409)
          }
          const qaResult = runEditReferenceDNAQA({
            reference,
            study,
            dnaVersion,
            evidence: aggregate.evidence.filter((record) => record.studySessionId === study.id),
            now,
          })
          aggregate.dnaQaResults.push(qaResult)
          dnaVersion.qaStatus = qaResult.status
          dnaVersion.qaResultId = qaResult.id
          study.qaStatus = qaResult.status
          study.status = qaResult.status === 'blocked' ? 'qa_blocked' : 'needs_user_review'
          study.revision += 1
          study.updatedAt = now
          reference.qaStatus = qaResult.status
          reference.updatedAt = now
          aggregate.messages.push(dnaQAMessage(reference, study, qaResult, now, nextSequence(aggregate, study.id)))
          aggregate.usageLogs.push(usageLog(reference, 'dna_qa_completed', now))
          addAuditEvent({
            eventType: 'preference_dna_qa_completed',
            editReferenceId: reference.id,
            studySessionId: study.id,
            dnaVersionId: dnaVersion.id,
            dnaQaResultId: qaResult.id,
          })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async approvePreferenceDNA(studyId, dnaVersionId, input, idempotencyKey) {
      const normalized = normalizeApprovePreferenceDNA(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.dna.approve',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ studyId, dnaVersionId, ...normalized }),
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          const reference = requireReference(aggregate, study.editReferenceId)
          assertActiveStudy(reference, study)
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          const dnaVersion = requireDNAVersion(aggregate, dnaVersionId, study)
          assertDNAContentDigest(dnaVersion.contentDigest, normalized.expectedDNAContentDigest)
          const qaResult = requireDNAQAResult(aggregate, normalized.qaResultId, dnaVersion)
          if (dnaVersion.status !== 'review_required' || dnaVersion.qaResultId !== qaResult.id) {
            throw new ApiError('VALIDATION_FAILED', 'Only the active quality-reviewed DNA version can be approved.', 409)
          }
          if (qaResult.status === 'blocked' || qaResult.blockingCheckIds.length > 0) {
            throw new ApiError('VALIDATION_FAILED', 'Blocking DNA quality findings must be corrected before approval.', 409)
          }
          if (qaResult.status === 'requires_user_review' && normalized.acknowledgeQAReview !== true) {
            throw new ApiError('VALIDATION_FAILED', 'Review the quality warnings and acknowledge them before approval.', 409)
          }
          for (const previousApproved of aggregate.dnaVersions.filter((record) => (
            record.studySessionId === study.id
            && record.id !== dnaVersion.id
            && record.status === 'approved'
          ))) {
            previousApproved.status = 'superseded'
            previousApproved.supersededAt = now
          }
          dnaVersion.status = 'approved'
          dnaVersion.approval = {
            id: `preference-dna-approval-${randomUUID()}`,
            qaResultId: qaResult.id,
            acknowledgedAdaptNotCopy: true,
            acknowledgedQAReview: normalized.acknowledgeQAReview,
            approvedBy: 'authenticated_user',
            approvedAt: now,
          }
          study.status = 'approved'
          study.dnaStatus = 'approved'
          study.qaStatus = qaResult.status
          study.revision += 1
          study.updatedAt = now
          reference.dnaStatus = 'approved'
          reference.qaStatus = qaResult.status
          reference.updatedAt = now
          aggregate.messages.push(dnaApprovalMessage(reference, study, dnaVersion, now, nextSequence(aggregate, study.id)))
          aggregate.usageLogs.push(usageLog(reference, 'dna_version_approved', now))
          addAuditEvent({
            eventType: 'preference_dna_version_approved',
            editReferenceId: reference.id,
            studySessionId: study.id,
            dnaVersionId: dnaVersion.id,
            dnaQaResultId: qaResult.id,
          })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },
  }
}

function selectRepository(context: ServiceContext): EditReferenceRepository {
  const localAuthorized = context.auth?.isMockUser === true
    && context.env.allowMockWithoutSupabase
    && (context.env.mode === 'local' || context.env.mode === 'mock')
    && context.env.storageMode === 'local'
  return localAuthorized ? new PrivateEditReferenceRepository() : new DisabledSupabaseEditReferenceRepository()
}

function detailData(aggregate: EditReferenceAggregate, reference: EditReferenceRecord): EditReferenceDetailData {
  const study = requireStudy(aggregate, reference.currentStudyId)
  const detail: EditReferenceDetail = {
    reference,
    study,
    messages: studyMessages(aggregate, study.id),
    evidence: aggregate.evidence.filter((record) => record.studySessionId === study.id),
    assets: aggregate.assets.filter((record) => record.studySessionId === study.id),
    skillRuns: aggregate.skillRuns.filter((record) => record.studySessionId === study.id),
    dnaVersions: aggregate.dnaVersions.filter((record) => record.studySessionId === study.id),
    dnaQaResults: aggregate.dnaQaResults.filter((record) => aggregate.dnaVersions.some((dna) => dna.id === record.dnaVersionId && dna.studySessionId === study.id)),
    applications: aggregate.applications.filter((record) => record.editReferenceId === reference.id),
    usageLogs: aggregate.usageLogs.filter((record) => record.editReferenceId === reference.id),
    nextAction: nextActionForDetail(aggregate, reference, study),
    safety: EDIT_REFERENCE_SAFETY_FLAGS,
  }
  return { detail, replayed: false }
}

function nextActionForDetail(
  aggregate: EditReferenceAggregate,
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
): EditReferenceDetail['nextAction'] {
  if (reference.status === 'archived') return 'archived'
  if (study.status === 'evidence_ready') return 'generate_preference_dna'
  const activeDNAVersion = reference.dnaStatus === 'not_generated'
    ? undefined
    : aggregate.dnaVersions
      .filter((record) => record.studySessionId === study.id && record.status !== 'superseded')
      .sort((left, right) => right.version - left.version)[0]
  if (activeDNAVersion) {
    if (activeDNAVersion.status === 'approved') return 'prepare_target_application'
    if (activeDNAVersion.qaStatus === 'not_run') return 'run_preference_dna_qa'
    if (activeDNAVersion.qaStatus === 'blocked') return 'correct_preference_dna'
    return 'approve_preference_dna'
  }
  if (study.status === 'qa_blocked') return 'correct_preference_dna'
  if (study.status === 'needs_user_review') return 'review_study_findings'
  if (study.status === 'needs_clarification') return 'add_missing_evidence'
  const sourceEvidence = aggregate.evidence.filter((record) => record.studySessionId === study.id && record.sourceType !== 'derived_skill_evidence')
  if (sourceEvidence.length > 0) return 'run_evidence_study'
  return aggregate.messages.some((message) => message.studySessionId === study.id && message.role === 'user')
    ? 'add_reference_evidence'
    : 'answer_setup_questions'
}

function createStudyRecord(reference: EditReferenceRecord, id: string, title: string, now: string): PreferenceStudySessionRecord {
  return {
    id,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    title,
    status: 'collecting_evidence',
    initialGoals: reference.initialGoals,
    revision: 1,
    createdAt: now,
    updatedAt: now,
    runtimeSource: 'backend_local_private',
    evidenceStatus: 'not_complete',
    dnaStatus: 'not_generated',
    qaStatus: 'not_run',
  }
}

function setupMessages(reference: EditReferenceRecord, study: PreferenceStudySessionRecord, now: string): PreferenceStudyMessageRecord[] {
  return [
    {
      id: `preference-study-message-${randomUUID()}`,
      workspaceId: reference.workspaceId,
      editReferenceId: reference.id,
      studySessionId: study.id,
      role: 'system',
      content: 'This study uses only evidence you deliberately add. Saving video details does not mean the video itself has been studied.',
      sequence: 1,
      runtimeSource: 'deterministic_setup',
      createdAt: now,
    },
    {
      id: `preference-study-message-${randomUUID()}`,
      workspaceId: reference.workspaceId,
      editReferenceId: reference.id,
      studySessionId: study.id,
      role: 'assistant',
      content: setupQuestion(reference),
      sequence: 2,
      runtimeSource: 'deterministic_setup',
      createdAt: now,
    },
  ]
}

function setupQuestion(reference: EditReferenceRecord): string {
  const goals = reference.initialGoals.map(goalLabel).join(', ')
  return `What should ReEditPro learn from this reference for ${goals}? Describe the transferable choices, what must not be copied, and where those choices should or should not apply.`
}

function deterministicAcknowledgement(reference: EditReferenceRecord): string {
  return `Your direction is saved for “${reference.name}.” Study evidence is not complete, so Preference DNA and quality review remain unavailable. Add reference evidence when you are ready to continue.`
}

function evidenceSavedMessage(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  evidence: PreferenceEvidenceRecord,
  now: string,
  sequence: number,
): PreferenceStudyMessageRecord {
  const boundary = evidence.sourceType === 'reference_video_metadata'
    ? ' Only the details you entered were saved; the video itself was not studied.'
    : evidence.sourceType === 'previous_approved_edit_snapshot'
      ? ' Its identity was recorded, but no project history, snapshot content, or media was opened.'
      : ''
  return {
    id: `preference-study-message-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    role: 'assistant',
    content: `“${evidence.title}” was added to this study.${boundary} You can study the saved evidence now or add more context first.`,
    sequence,
    runtimeSource: 'deterministic_evidence',
    createdAt: now,
  }
}

function studyResultMessage(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  content: string,
  now: string,
  sequence: number,
): PreferenceStudyMessageRecord {
  return {
    id: `preference-study-message-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    role: 'assistant',
    content,
    sequence,
    runtimeSource: 'deterministic_evidence',
    createdAt: now,
  }
}

function dnaSynthesisMessage(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  dnaVersion: EditReferenceDetail['dnaVersions'][number],
  now: string,
  sequence: number,
): PreferenceStudyMessageRecord {
  return {
    id: `preference-study-message-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    role: 'assistant',
    content: `Preference DNA version ${dnaVersion.version} was prepared from ${dnaVersion.inputEvidenceRevisions.length} exact evidence records. It remains locked for quality review; nothing has been approved or applied.`,
    sequence,
    runtimeSource: 'deterministic_dna',
    createdAt: now,
  }
}

function dnaQAMessage(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  qaResult: EditReferenceDetail['dnaQaResults'][number],
  now: string,
  sequence: number,
): PreferenceStudyMessageRecord {
  const next = qaResult.status === 'blocked'
    ? 'Correct the evidence and create a new version before approval.'
    : qaResult.status === 'requires_user_review'
      ? 'Review and acknowledge the flagged limits before approving this exact version.'
      : 'The exact version can now be reviewed for approval.'
  return {
    id: `preference-study-message-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    role: 'assistant',
    content: `${qaResult.summary} ${next} No edit was changed and no production work started.`,
    sequence,
    runtimeSource: 'deterministic_dna_qa',
    createdAt: now,
  }
}

function dnaApprovalMessage(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  dnaVersion: EditReferenceDetail['dnaVersions'][number],
  now: string,
  sequence: number,
): PreferenceStudyMessageRecord {
  return {
    id: `preference-study-message-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    role: 'assistant',
    content: `Preference DNA version ${dnaVersion.version} was approved with the quality review tied to this exact version. Approval saves reusable guidance only; it has not been applied to an edit and no production work started.`,
    sequence,
    runtimeSource: 'deterministic_dna_approval',
    createdAt: now,
  }
}

function createEvidenceRecords(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  input: CreatePreferenceEvidenceRequest,
  now: string,
): { evidence: PreferenceEvidenceRecord; asset?: PreferenceAssetRecord } {
  const evidenceId = `preference-evidence-${randomUUID()}`
  if (input.sourceType === 'manual_user_evidence') {
    return {
      evidence: {
        id: evidenceId,
        workspaceId: reference.workspaceId,
        editReferenceId: reference.id,
        studySessionId: study.id,
        sourceType: input.sourceType,
        ...(input.supersedesEvidenceId ? { supersedesEvidenceId: input.supersedesEvidenceId } : {}),
        category: input.category,
        title: input.title,
        summary: input.summary,
        revision: 1,
        confidence: 0.65,
        confidenceBasis: 'user_asserted',
        transferability: input.intendedUse,
        provenance: {
          runtimeSource: 'user_input',
          sourceEvidenceIds: input.supersedesEvidenceId ? [input.supersedesEvidenceId] : [],
          mediaStudyStatus: 'not_applicable',
          toolIds: [],
          skillIds: [],
          fallbackUsed: false,
          notes: ['Saved as user-described evidence. No media or model analysis is implied.'],
        },
        createdAt: now,
        updatedAt: now,
      },
    }
  }

  const privateAssetId = `preference-private-asset-${randomUUID()}`
  if (input.sourceType === 'reference_video_metadata') {
    const mediaMetadata = normalizeMediaMetadata(input)
    const asset: PreferenceAssetRecord = {
      id: `preference-asset-${randomUUID()}`,
      workspaceId: reference.workspaceId,
      editReferenceId: reference.id,
      studySessionId: study.id,
      privateAssetId,
      assetKind: 'reference_video_metadata',
      label: input.sourceLabel,
      rightsBasis: input.rightsBasis,
      mediaStudyStatus: 'media_not_studied',
      mediaMetadata,
      createdAt: now,
    }
    return {
      asset,
      evidence: {
        id: evidenceId,
        workspaceId: reference.workspaceId,
        editReferenceId: reference.id,
        studySessionId: study.id,
        sourceType: input.sourceType,
        category: 'media_structure',
        title: input.title,
        summary: `${input.sourceLabel} metadata was supplied for this study. The media itself has not been studied.`,
        revision: 1,
        confidence: 1,
        confidenceBasis: 'metadata_verified',
        transferability: 'requires_user_review',
        mediaMetadata,
        provenance: {
          runtimeSource: 'user_input',
          sourceEvidenceIds: [],
          privateAssetId,
          sourceLabel: input.sourceLabel,
          rightsBasis: input.rightsBasis,
          mediaStudyStatus: 'media_not_studied',
          toolIds: [],
          skillIds: [],
          fallbackUsed: false,
          notes: ['No URL, path, media bytes, frames, transcript, audio, or provider payload was accepted or persisted.'],
        },
        createdAt: now,
        updatedAt: now,
      },
    }
  }

  const asset: PreferenceAssetRecord = {
    id: `preference-asset-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    privateAssetId,
    assetKind: 'previous_approved_edit_snapshot',
    label: input.title,
    rightsBasis: input.rightsBasis,
    mediaStudyStatus: 'approved_edit_identity_not_verified',
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    approvedSnapshotId: input.approvedSnapshotId,
    createdAt: now,
  }
  return {
    asset,
    evidence: {
      id: evidenceId,
      workspaceId: reference.workspaceId,
      editReferenceId: reference.id,
      studySessionId: study.id,
      sourceType: input.sourceType,
      category: 'media_structure',
      title: input.title,
      summary: input.summary ?? 'A previous approved edit identity was supplied for future private study.',
      revision: 1,
      confidence: 0.5,
      confidenceBasis: 'user_asserted',
      transferability: 'requires_user_review',
      provenance: {
        runtimeSource: 'user_input',
        sourceEvidenceIds: [],
        privateAssetId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        approvedSnapshotId: input.approvedSnapshotId,
        rightsBasis: input.rightsBasis,
        mediaStudyStatus: 'approved_edit_identity_not_verified',
        toolIds: [],
        skillIds: [],
        fallbackUsed: false,
        notes: ['Exact identity was saved. No project history, approved snapshot content, preview, or media bytes were opened.'],
      },
      createdAt: now,
      updatedAt: now,
    },
  }
}

function normalizeMediaMetadata(input: Extract<CreatePreferenceEvidenceRequest, { sourceType: 'reference_video_metadata' }>): PreferenceEvidenceMediaMetadata {
  const width = input.width
  const height = input.height
  const orientation = width && height
    ? width === height ? 'square' : width > height ? 'landscape' : 'portrait'
    : 'unknown'
  return {
    ...(input.durationSeconds === undefined ? {} : { durationSeconds: input.durationSeconds }),
    ...(width === undefined ? {} : { width }),
    ...(height === undefined ? {} : { height }),
    ...(input.hasAudio === undefined ? {} : { hasAudio: input.hasAudio }),
    orientation,
  }
}

function goalLabel(goal: EditReferenceStudyGoal): string {
  return goal.replaceAll('_', ' ')
}

function nextSequence(aggregate: EditReferenceAggregate, studyId: string): number {
  return aggregate.messages.reduce((maximum, message) => message.studySessionId === studyId ? Math.max(maximum, message.sequence) : maximum, 0) + 1
}

function usageLog(
  reference: EditReferenceRecord,
  eventType: 'created' | 'study_created' | 'message_appended' | 'evidence_added' | 'evidence_study_completed' | 'dna_version_created' | 'dna_qa_completed' | 'dna_version_approved' | 'updated' | 'archived',
  now: string,
) {
  return {
    id: `preference-usage-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    eventType,
    createdAt: now,
  } as const
}

function requireReference(aggregate: EditReferenceAggregate, referenceId: string): EditReferenceRecord {
  const reference = aggregate.references.find((candidate) => candidate.id === referenceId)
  if (!reference) throw referenceNotFound(referenceId)
  return reference
}

function requireStudy(aggregate: EditReferenceAggregate, studyId: string): PreferenceStudySessionRecord {
  const study = aggregate.studies.find((candidate) => candidate.id === studyId)
  if (!study) throw studyNotFound(studyId)
  return study
}

function requireDNAVersion(
  aggregate: EditReferenceAggregate,
  dnaVersionId: string,
  study: PreferenceStudySessionRecord,
): EditReferenceDetail['dnaVersions'][number] {
  const version = aggregate.dnaVersions.find((candidate) => candidate.id === dnaVersionId)
  if (!version || version.studySessionId !== study.id || version.editReferenceId !== study.editReferenceId) {
    throw new ApiError('VALIDATION_FAILED', 'Preference DNA version was not found in this study.', 404, { dnaVersionId })
  }
  return version
}

function requireDNAQAResult(
  aggregate: EditReferenceAggregate,
  qaResultId: string,
  dnaVersion: EditReferenceDetail['dnaVersions'][number],
): EditReferenceDetail['dnaQaResults'][number] {
  const result = aggregate.dnaQaResults.find((candidate) => candidate.id === qaResultId)
  if (!result || result.dnaVersionId !== dnaVersion.id) {
    throw new ApiError('VALIDATION_FAILED', 'Quality-review result does not belong to this DNA version.', 409, { qaResultId })
  }
  return result
}

function assertDNAContentDigest(actual: string, expected: string): void {
  if (actual !== expected) {
    throw new ApiError('VERSION_CONFLICT', 'Preference DNA changed since it was reviewed. Reload before continuing.', 409, { expected, actual })
  }
}

function assertActiveStudy(reference: EditReferenceRecord, study: PreferenceStudySessionRecord): void {
  if (reference.status === 'archived' || study.status === 'archived') {
    throw new ApiError('VALIDATION_FAILED', 'Archived studies cannot accept or analyze evidence.', 409)
  }
}

function studyMessages(aggregate: EditReferenceAggregate, studyId: string): PreferenceStudyMessageRecord[] {
  return aggregate.messages.filter((message) => message.studySessionId === studyId).sort((left, right) => left.sequence - right.sequence)
}

function studyNotFound(studyId: string): ApiError {
  return new ApiError('PREFERENCE_STUDY_NOT_FOUND', 'Preference Study was not found.', 404, { studyId })
}

function assertStudyTransition(
  current: PreferenceStudySessionRecord['status'],
  next: PreferenceStudySessionRecord['status'],
): void {
  if (current === next) return
  const gateOneTransitions: Partial<Record<PreferenceStudySessionRecord['status'], PreferenceStudySessionRecord['status'][]>> = {
    draft: ['collecting_evidence', 'archived'],
    collecting_evidence: ['ready_to_study', 'needs_clarification', 'archived'],
    ready_to_study: ['collecting_evidence', 'needs_clarification', 'archived'],
    needs_clarification: ['collecting_evidence', 'ready_to_study', 'archived'],
  }
  if (!gateOneTransitions[current]?.includes(next)) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'That Preference Study lifecycle transition is not available in Gate 1.',
      409,
      { current, requested: next },
    )
  }
}

function referenceNotFound(referenceId: string): ApiError {
  return new ApiError('EDIT_REFERENCE_NOT_FOUND', 'Edit Reference was not found.', 404, { referenceId })
}

function assertRevision(actual: number, expected: number, label: string): void {
  if (actual !== expected) {
    throw new ApiError('VERSION_CONFLICT', `${label} changed since it was loaded. Reload before saving.`, 409, { expected, actual })
  }
}

function normalizeCreateReference(input: CreateEditReferenceRequest): CreateEditReferenceRequest {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    name: requireText(input.name, 'name', 120),
    ...(input.description?.trim() ? { description: requireText(input.description, 'description', 2_000) } : {}),
    initialGoals: [...new Set(input.initialGoals)],
  }
}

function normalizeUpdateReference(input: UpdateEditReferenceRequest): UpdateEditReferenceRequest {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedReferenceRevision: input.expectedReferenceRevision,
    ...(input.name === undefined ? {} : { name: requireText(input.name, 'name', 120) }),
    ...(input.description === undefined ? {} : { description: input.description.trim().slice(0, 2_000) }),
    ...(input.status ? { status: input.status } : {}),
  }
}

function normalizeCreateStudy(input: CreatePreferenceStudyRequest): CreatePreferenceStudyRequest {
  return { workspaceId: requireWorkspaceId(input.workspaceId), expectedReferenceRevision: input.expectedReferenceRevision, title: requireText(input.title, 'title', 160) }
}

function normalizeUpdateStudy(input: UpdatePreferenceStudyRequest): UpdatePreferenceStudyRequest {
  const allowedStatuses = new Set(['draft', 'collecting_evidence', 'ready_to_study', 'needs_clarification', 'archived'])
  if (input.status && !allowedStatuses.has(input.status)) {
    throw new ApiError('VALIDATION_FAILED', 'That study status belongs to a later evidence, DNA, QA, or application gate.', 409)
  }
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedStudyRevision: input.expectedStudyRevision,
    ...(input.title === undefined ? {} : { title: requireText(input.title, 'title', 160) }),
    ...(input.status ? { status: input.status } : {}),
  }
}

function normalizeAppendMessage(input: AppendPreferenceStudyMessageRequest): AppendPreferenceStudyMessageRequest {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedStudyRevision: input.expectedStudyRevision,
    clientMessageId: requireText(input.clientMessageId, 'clientMessageId', 160),
    content: requireText(input.content, 'content', 8_000),
  }
}

function normalizeCreateEvidence(input: CreatePreferenceEvidenceRequest): CreatePreferenceEvidenceRequest {
  const workspaceId = requireWorkspaceId(input.workspaceId)
  const expectedStudyRevision = requirePositiveInteger(input.expectedStudyRevision, 'expectedStudyRevision')
  const title = requireText(input.title, 'title', 160)
  if (input.sourceType === 'manual_user_evidence') {
    return {
      workspaceId,
      expectedStudyRevision,
      sourceType: input.sourceType,
      title,
      category: input.category,
      summary: requireText(input.summary, 'summary', 4_000),
      intendedUse: input.intendedUse,
      ...(input.supersedesEvidenceId ? { supersedesEvidenceId: requireText(input.supersedesEvidenceId, 'supersedesEvidenceId', 200) } : {}),
    }
  }
  if (input.sourceType === 'reference_video_metadata') {
    return {
      workspaceId,
      expectedStudyRevision,
      sourceType: input.sourceType,
      title,
      sourceLabel: requireText(input.sourceLabel, 'sourceLabel', 240),
      rightsBasis: input.rightsBasis,
      ...(input.durationSeconds === undefined ? {} : { durationSeconds: requireNonNegativeNumber(input.durationSeconds, 'durationSeconds', 86_400) }),
      ...(input.width === undefined ? {} : { width: requirePositiveIntegerBounded(input.width, 'width', 16_384) }),
      ...(input.height === undefined ? {} : { height: requirePositiveIntegerBounded(input.height, 'height', 16_384) }),
      ...(input.hasAudio === undefined ? {} : { hasAudio: input.hasAudio }),
    }
  }
  return {
    workspaceId,
    expectedStudyRevision,
    sourceType: input.sourceType,
    title,
    projectId: requireText(input.projectId, 'projectId', 200),
    editSessionId: requireText(input.editSessionId, 'editSessionId', 200),
    approvedSnapshotId: requireText(input.approvedSnapshotId, 'approvedSnapshotId', 200),
    ...(input.summary?.trim() ? { summary: requireText(input.summary, 'summary', 2_000) } : {}),
    rightsBasis: 'workspace_approved_edit',
  }
}

function normalizeRunEvidenceStudy(input: RunPreferenceEvidenceStudyRequest): RunPreferenceEvidenceStudyRequest {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedStudyRevision: requirePositiveInteger(input.expectedStudyRevision, 'expectedStudyRevision'),
  }
}

function normalizeSynthesizePreferenceDNA(input: SynthesizePreferenceDNARequest): SynthesizePreferenceDNARequest {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedStudyRevision: requirePositiveInteger(input.expectedStudyRevision, 'expectedStudyRevision'),
  }
}

function normalizeRunPreferenceDNAQA(input: RunEditReferenceDNAQARequest): RunEditReferenceDNAQARequest {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedStudyRevision: requirePositiveInteger(input.expectedStudyRevision, 'expectedStudyRevision'),
    expectedDNAContentDigest: requireSha256(input.expectedDNAContentDigest, 'expectedDNAContentDigest'),
  }
}

function normalizeApprovePreferenceDNA(input: ApproveEditReferenceDNAVersionRequest): ApproveEditReferenceDNAVersionRequest {
  if (input.acknowledgeAdaptNotCopy !== true) {
    throw new ApiError('VALIDATION_FAILED', 'Approval requires confirmation that the reference will be adapted, not copied.', 400)
  }
  if (typeof input.acknowledgeQAReview !== 'boolean') {
    throw new ApiError('VALIDATION_FAILED', 'acknowledgeQAReview must be a boolean.', 400)
  }
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedStudyRevision: requirePositiveInteger(input.expectedStudyRevision, 'expectedStudyRevision'),
    expectedDNAContentDigest: requireSha256(input.expectedDNAContentDigest, 'expectedDNAContentDigest'),
    qaResultId: requireText(input.qaResultId, 'qaResultId', 200),
    acknowledgeAdaptNotCopy: true,
    acknowledgeQAReview: input.acknowledgeQAReview,
  }
}

function requireWorkspaceId(value: string): string {
  return requireText(value, 'workspaceId', 160)
}

function requireIdempotencyKey(value: string): string {
  return requireText(value, 'Idempotency-Key', 200)
}

function requireSha256(value: string, field: string): string {
  const normalized = value?.trim().toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be a SHA-256 digest.`, 400)
  }
  return normalized
}

function requirePositiveInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 1) throw new ApiError('VALIDATION_FAILED', `${field} must be a positive integer.`, 400)
  return value
}

function requirePositiveIntegerBounded(value: number, field: string, maximum: number): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be an integer between 1 and ${maximum}.`, 400)
  }
  return value
}

function requireNonNegativeNumber(value: number, field: string, maximum: number): number {
  if (!Number.isFinite(value) || value < 0 || value > maximum) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be between 0 and ${maximum}.`, 400)
  }
  return value
}

function requireText(value: string, field: string, maximum: number): string {
  const normalized = value?.trim()
  if (!normalized || normalized.length > maximum) {
    throw new ApiError('VALIDATION_FAILED', `${field} must contain between 1 and ${maximum} characters.`, 400)
  }
  return normalized
}

function result<T>(data: T, replayed?: boolean): EditReferenceServiceResult<T> {
  return { data, warnings: [LOCAL_WARNING, FUTURE_RUNTIME_WARNING], ...(replayed === undefined ? {} : { replayed }) }
}
