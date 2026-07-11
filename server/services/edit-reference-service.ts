import { randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type {
  AppendPreferenceStudyMessageRequest,
  CreateEditReferenceRequest,
  CreatePreferenceStudyRequest,
  EditReferenceDetail,
  EditReferenceDetailData,
  EditReferenceListData,
  EditReferenceListItem,
  EditReferenceRecord,
  EditReferenceStudyGoal,
  PreferenceStudyMessageRecord,
  PreferenceStudyData,
  PreferenceStudyMessageListData,
  PreferenceStudySessionRecord,
  UpdateEditReferenceRequest,
  UpdatePreferenceStudyRequest,
} from '../../src/types/edit-reference'
import { EDIT_REFERENCE_GATE_1_SAFETY_FLAGS } from '../../src/types/edit-reference'
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
        safety: EDIT_REFERENCE_GATE_1_SAFETY_FLAGS,
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
        safety: EDIT_REFERENCE_GATE_1_SAFETY_FLAGS,
      })
    },

    async listStudyMessages(workspaceId, studyId) {
      const aggregate = await repository.read(scope(workspaceId))
      if (!aggregate) throw studyNotFound(studyId)
      requireStudy(aggregate, studyId)
      return result({ studyId, messages: studyMessages(aggregate, studyId), safety: EDIT_REFERENCE_GATE_1_SAFETY_FLAGS })
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
    nextAction: reference.status === 'archived'
      ? 'archived'
      : aggregate.messages.some((message) => message.studySessionId === study.id && message.role === 'user')
        ? 'add_reference_evidence'
        : 'answer_setup_questions',
    safety: EDIT_REFERENCE_GATE_1_SAFETY_FLAGS,
  }
  return { detail, replayed: false }
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
      content: 'This study is ready for your creative direction. Reference media will be analyzed only after you add it as evidence.',
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

function goalLabel(goal: EditReferenceStudyGoal): string {
  return goal.replaceAll('_', ' ')
}

function nextSequence(aggregate: EditReferenceAggregate, studyId: string): number {
  return aggregate.messages.reduce((maximum, message) => message.studySessionId === studyId ? Math.max(maximum, message.sequence) : maximum, 0) + 1
}

function usageLog(reference: EditReferenceRecord, eventType: 'created' | 'study_created' | 'message_appended' | 'updated' | 'archived', now: string) {
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

function requireWorkspaceId(value: string): string {
  return requireText(value, 'workspaceId', 160)
}

function requireIdempotencyKey(value: string): string {
  return requireText(value, 'Idempotency-Key', 200)
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
