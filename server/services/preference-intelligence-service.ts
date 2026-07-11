import { ApiError } from '../errors/api-error'
import { isExplicitLocalInternalTestRuntime } from '../middleware/canonical-worker-runtime'
import type { ServiceContext } from '../types'
import {
  addPreferenceEvidenceSchema,
  addPreferenceStudyQuestionSchema,
  answerPreferenceStudyQuestionSchema,
  appendPreferenceStudyAssistantMessageSchema,
  appendPreferenceStudyMessageSchema,
  applyPreferenceToEditSessionSchema,
  archiveReusableEditPreferenceSchema,
  approvePreferenceDnaSchema,
  buildPreferenceDnaSchema,
  clearPreferenceFromEditSessionSchema,
  createReusableEditPreferenceSchema,
  preferenceContextAudienceSchema,
  preferenceRuntimeStateSchema,
  requestPreferenceEvidenceAnalysisSchema,
  runPreferenceDnaQaSchema,
  startPreferenceStudySchema,
  updateReusableEditPreferenceSchema,
  type AddPreferenceEvidenceBody,
  type AddPreferenceStudyQuestionBody,
  type AnswerPreferenceStudyQuestionBody,
  type AppendPreferenceStudyAssistantMessageBody,
  type AppendPreferenceStudyMessageBody,
  type ApplyPreferenceToEditSessionBody,
  type ClearPreferenceFromEditSessionBody,
  type CreateReusableEditPreferenceBody,
  type PreferenceContextAudience,
  type PreferenceRuleCategory,
  type PreferenceRuntimeState,
  type StartPreferenceStudyBody,
  type UpdateReusableEditPreferenceBody,
} from '../validation/preference-intelligence-schemas'
import {
  createEmptyRulesByCategory,
  createPreferenceIntelligenceId,
  MAX_PREFERENCE_INTELLIGENCE_AUDIT_EVENTS,
  MAX_PREFERENCE_INTELLIGENCE_IDEMPOTENCY_RECORDS,
  mutatePrivatePreferenceIntelligenceAggregate,
  PREFERENCE_INSTRUCTION_PRIORITY,
  preferenceIntelligenceHash,
  readPrivatePreferenceIntelligenceAggregate,
  type PreferenceContextSummary,
  type PreferenceDnaApplicationRecord,
  type PreferenceDnaQaResultRecord,
  type PreferenceDnaRuleRecord,
  type PreferenceDnaVersionRecord,
  type PreferenceEvidenceRecord,
  type PreferenceIntelligenceScope,
  type PreferenceStudySessionRecord,
  type PrivatePreferenceIntelligenceAggregate,
  type ReusableEditPreferenceRecord,
} from './private-preference-intelligence-store'
import { createProjectService } from './project-service'
import { readPrivateEditAuthorityAggregate } from './private-edit-authority-store'
import { nowIso } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'
import { exactEditPreferenceScopeIdSchema } from '../validation/exact-edit-preference-schemas'

const UNIVERSAL_DO_NOT_COPY_RULES = [
  'Do not copy an exact shot sequence, caption wording, or scene order from reference material.',
  'Do not copy creator identity, faces, logos, brand marks, watermarks, or proprietary graphics.',
  'Do not copy copyrighted music, exact B-roll footage, products, or locations as generic style.',
  'Transfer editing principles only, and adapt every rule to the current source video and user instruction.',
] as const

const MEDIA_EVIDENCE_TYPES = new Set([
  'reference_video',
  'previous_approved_edit',
  'reference_image',
  'audio_music_example',
])

export type PreferenceIntelligenceCapability = {
  persistence: 'mock_local'
  studyReasoning: 'future_gated'
  mediaStudy: 'blocked_by_worker'
  dnaBuild: 'metadata_only'
  dnaQa: 'metadata_only'
  application: 'mock_local'
  productionReady: false
}

export const PREFERENCE_INTELLIGENCE_CAPABILITY: PreferenceIntelligenceCapability = {
  persistence: 'mock_local',
  studyReasoning: 'future_gated',
  mediaStudy: 'blocked_by_worker',
  dnaBuild: 'metadata_only',
  dnaQa: 'metadata_only',
  application: 'mock_local',
  productionReady: false,
}

type MutatingInput = { idempotencyKey: string }

export function createPreferenceIntelligenceService(context: ServiceContext) {
  return {
    async listPreferences(workspaceIdInput: string) {
      const scope = await authorizePreferenceScope(context, workspaceIdInput, 'read')
      const aggregate = await readPrivatePreferenceIntelligenceAggregate(scope)
      return resultEnvelope({
        preferences: cloneJson((aggregate?.preferences ?? []).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))),
        aggregateRevision: aggregate?.revision ?? 0,
      })
    },

    async getPreference(workspaceIdInput: string, preferenceIdInput: string) {
      const scope = await authorizePreferenceScope(context, workspaceIdInput, 'read')
      const preferenceId = parseId(preferenceIdInput, 'preference')
      const aggregate = await requireAggregate(scope)
      const preference = requirePreference(aggregate, preferenceId)
      return resultEnvelope({
        preference: cloneJson(preference),
        versions: cloneJson(versionsForPreference(aggregate, preference.id)),
        aggregateRevision: aggregate.revision,
      })
    },

    async createPreference(input: CreateReusableEditPreferenceBody & MutatingInput) {
      const body = parseRequest(createReusableEditPreferenceSchema, input)
      const scope = await authorizePreferenceScope(context, body.workspaceId, 'write')
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const requestHash = mutationHash('create_preference', scope, body)
      const timestamp = nowIso()
      const mutation = await mutatePrivatePreferenceIntelligenceAggregate({
        scope,
        now: timestamp,
        mutation: (aggregate) => {
          const replay = inspectReplay(aggregate, 'create_preference', idempotencyKey, requestHash)
          if (replay) return { result: { preference: requirePreference(aggregate, replay.responseEntityId), replayed: true }, changed: false }
          if (aggregate.preferences.some((preference) =>
            preference.status === 'active' && normalizeName(preference.name) === normalizeName(body.name)
          )) {
            throw new ApiError('IDEMPOTENCY_CONFLICT', 'An active Edit Preference already uses this name.', 409)
          }
          assertAggregateMutationCapacity(aggregate)
          const preference: ReusableEditPreferenceRecord = {
            id: createPreferenceIntelligenceId('edit_preference'),
            ownerUserId: scope.ownerUserId,
            workspaceId: scope.workspaceId,
            name: body.name,
            description: body.description,
            status: 'active',
            revision: 1,
            createdAt: timestamp,
            updatedAt: timestamp,
          }
          aggregate.preferences.push(preference)
          appendAudit(aggregate, scope.ownerUserId, 'edit_preference_created', timestamp, { preferenceId: preference.id })
          appendIdempotency(aggregate, 'create_preference', idempotencyKey, requestHash, preference.id, timestamp)
          return { result: { preference: cloneJson(preference), replayed: false }, changed: true }
        },
      })
      return resultEnvelope(mutation)
    },

    async updatePreference(input: UpdateReusableEditPreferenceBody & MutatingInput & { preferenceId: string }) {
      const body = parseRequest(updateReusableEditPreferenceSchema, input)
      const scope = await authorizePreferenceScope(context, body.workspaceId, 'write')
      const preferenceId = parseId(input.preferenceId, 'preference')
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const requestHash = mutationHash('update_preference', scope, { preferenceId, ...body })
      const timestamp = nowIso()
      const mutation = await mutatePrivatePreferenceIntelligenceAggregate({
        scope,
        now: timestamp,
        mutation: (aggregate) => {
          const replay = inspectReplay(aggregate, 'update_preference', idempotencyKey, requestHash)
          if (replay) return { result: { preference: requirePreference(aggregate, replay.responseEntityId), replayed: true }, changed: false }
          const preference = requirePreference(aggregate, preferenceId)
          assertPreferenceRevision(preference, body.expectedRevision)
          if (preference.status === 'archived') throw new ApiError('VALIDATION_FAILED', 'Archived Edit Preferences cannot be changed.', 409)
          const nextName = body.name ?? preference.name
          const nextDescription = body.description === undefined ? preference.description : body.description ?? undefined
          if (nextName === preference.name && nextDescription === preference.description) {
            return { result: { preference: cloneJson(preference), replayed: false }, changed: false }
          }
          if (aggregate.preferences.some((candidate) =>
            candidate.id !== preference.id
            && candidate.status === 'active'
            && normalizeName(candidate.name) === normalizeName(nextName)
          )) throw new ApiError('IDEMPOTENCY_CONFLICT', 'An active Edit Preference already uses this name.', 409)
          assertAggregateMutationCapacity(aggregate)
          preference.name = nextName
          preference.description = nextDescription
          preference.revision += 1
          preference.updatedAt = timestamp
          refreshAppliedPreferenceNames(aggregate, preference)
          appendAudit(aggregate, scope.ownerUserId, 'edit_preference_updated', timestamp, { preferenceId })
          appendIdempotency(aggregate, 'update_preference', idempotencyKey, requestHash, preference.id, timestamp)
          return { result: { preference: cloneJson(preference), replayed: false }, changed: true }
        },
      })
      return resultEnvelope(mutation)
    },

    async archivePreference(input: {
      workspaceId: string
      preferenceId: string
      expectedRevision: number
      idempotencyKey: string
    }) {
      const body = parseRequest(archiveReusableEditPreferenceSchema, input)
      const scope = await authorizePreferenceScope(context, body.workspaceId, 'write')
      const preferenceId = parseId(input.preferenceId, 'preference')
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const requestHash = mutationHash('archive_preference', scope, { preferenceId, ...body })
      const timestamp = nowIso()
      const mutation = await mutatePrivatePreferenceIntelligenceAggregate({
        scope,
        now: timestamp,
        mutation: (aggregate) => {
          const replay = inspectReplay(aggregate, 'archive_preference', idempotencyKey, requestHash)
          if (replay) return { result: { preference: requirePreference(aggregate, replay.responseEntityId), replayed: true }, changed: false }
          const preference = requirePreference(aggregate, preferenceId)
          assertPreferenceRevision(preference, body.expectedRevision)
          if (preference.status === 'archived') return { result: { preference: cloneJson(preference), replayed: false }, changed: false }
          assertAggregateMutationCapacity(aggregate)
          preference.status = 'archived'
          preference.revision += 1
          preference.archivedAt = timestamp
          preference.updatedAt = timestamp
          appendAudit(aggregate, scope.ownerUserId, 'edit_preference_archived', timestamp, { preferenceId })
          appendIdempotency(aggregate, 'archive_preference', idempotencyKey, requestHash, preference.id, timestamp)
          return { result: { preference: cloneJson(preference), replayed: false }, changed: true }
        },
      })
      return resultEnvelope(mutation)
    },

    async startStudy(input: StartPreferenceStudyBody & MutatingInput & { preferenceId: string }) {
      const body = parseRequest(startPreferenceStudySchema, input)
      const scope = await authorizePreferenceScope(context, body.workspaceId, 'write')
      const preferenceId = parseId(input.preferenceId, 'preference')
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const requestHash = mutationHash('start_study', scope, { preferenceId, ...body })
      const timestamp = nowIso()
      const mutation = await mutatePrivatePreferenceIntelligenceAggregate({
        scope,
        now: timestamp,
        mutation: (aggregate) => {
          const replay = inspectReplay(aggregate, 'start_study', idempotencyKey, requestHash)
          if (replay) return { result: { study: studyView(aggregate, replay.responseEntityId), replayed: true }, changed: false }
          const preference = requireActivePreference(aggregate, preferenceId)
          assertAggregateMutationCapacity(aggregate)
          const session: PreferenceStudySessionRecord = {
            id: createPreferenceIntelligenceId('preference_study'),
            preferenceId,
            title: body.title ?? `${preference.name} study`,
            status: 'active',
            revision: 1,
            createdAt: timestamp,
            updatedAt: timestamp,
          }
          aggregate.studySessions.push(session)
          aggregate.studyMessages.push({
            id: createPreferenceIntelligenceId('preference_study_message'),
            studySessionId: session.id,
            preferenceId,
            role: 'system',
            content: 'Study persistence is active in private local testing. Provider reasoning and media analysis remain gated until runtime evidence exists.',
            runtimeState: 'mock_local',
            createdAt: timestamp,
          })
          appendAudit(aggregate, scope.ownerUserId, 'preference_study_started', timestamp, { preferenceId, studySessionId: session.id })
          appendIdempotency(aggregate, 'start_study', idempotencyKey, requestHash, session.id, timestamp)
          return { result: { study: studyView(aggregate, session.id), replayed: false }, changed: true }
        },
      })
      return resultEnvelope(mutation)
    },

    async getStudy(workspaceIdInput: string, studySessionIdInput: string) {
      const scope = await authorizePreferenceScope(context, workspaceIdInput, 'read')
      const aggregate = await requireAggregate(scope)
      return resultEnvelope({ study: studyView(aggregate, parseId(studySessionIdInput, 'study session')) })
    },

    async appendUserStudyMessage(input: AppendPreferenceStudyMessageBody & MutatingInput & { studySessionId: string }) {
      const body = parseRequest(appendPreferenceStudyMessageSchema, input)
      return mutateStudyMessage(context, {
        ...body,
        studySessionId: input.studySessionId,
        role: 'user',
        runtimeState: 'mock_local',
        idempotencyKey: input.idempotencyKey,
      })
    },

    async appendAssistantStudyMessage(input: AppendPreferenceStudyAssistantMessageBody & MutatingInput & { studySessionId: string }) {
      const body = parseRequest(appendPreferenceStudyAssistantMessageSchema, input)
      assertNonLiveCapability(body.runtimeState, 'Preference Study assistant reasoning')
      return mutateStudyMessage(context, {
        ...body,
        studySessionId: input.studySessionId,
        role: 'assistant',
        idempotencyKey: input.idempotencyKey,
      })
    },

    async addStudyQuestion(input: AddPreferenceStudyQuestionBody & MutatingInput & { studySessionId: string }) {
      const body = parseRequest(addPreferenceStudyQuestionSchema, input)
      assertNonLiveCapability(body.runtimeState, 'Preference Study question generation')
      const scope = await authorizePreferenceScope(context, body.workspaceId, 'write')
      const studySessionId = parseId(input.studySessionId, 'study session')
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const requestHash = mutationHash('add_study_question', scope, { studySessionId, ...body })
      const timestamp = nowIso()
      const mutation = await mutatePrivatePreferenceIntelligenceAggregate({
        scope,
        now: timestamp,
        mutation: (aggregate) => {
          const replay = inspectReplay(aggregate, 'add_study_question', idempotencyKey, requestHash)
          if (replay) {
            const question = aggregate.studyQuestions.find((candidate) => candidate.id === replay.responseEntityId)
            if (!question) throw missingEntity('Preference Study Question')
            return { result: { question: cloneJson(question), study: studyView(aggregate, studySessionId), replayed: true }, changed: false }
          }
          const session = requireStudySession(aggregate, studySessionId)
          assertSessionRevision(session, body.expectedSessionRevision)
          assertAggregateMutationCapacity(aggregate)
          const question = {
            id: createPreferenceIntelligenceId('preference_question'),
            studySessionId,
            preferenceId: session.preferenceId,
            prompt: body.prompt,
            category: body.category,
            responseType: body.responseType,
            options: [...body.options],
            required: body.required,
            status: 'open' as const,
            runtimeState: body.runtimeState,
            createdAt: timestamp,
          }
          aggregate.studyQuestions.push(question)
          session.revision += 1
          session.status = 'needs_user_answers'
          session.updatedAt = timestamp
          appendAudit(aggregate, scope.ownerUserId, 'preference_study_question_added', timestamp, {
            preferenceId: session.preferenceId,
            studySessionId,
          })
          appendIdempotency(aggregate, 'add_study_question', idempotencyKey, requestHash, question.id, timestamp)
          return { result: { question: cloneJson(question), study: studyView(aggregate, studySessionId), replayed: false }, changed: true }
        },
      })
      return resultEnvelope(mutation)
    },

    async answerStudyQuestion(input: AnswerPreferenceStudyQuestionBody & MutatingInput & {
      studySessionId: string
      questionId: string
    }) {
      const body = parseRequest(answerPreferenceStudyQuestionSchema, input)
      const scope = await authorizePreferenceScope(context, body.workspaceId, 'write')
      const studySessionId = parseId(input.studySessionId, 'study session')
      const questionId = parseId(input.questionId, 'study question')
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const requestHash = mutationHash('answer_study_question', scope, { studySessionId, questionId, ...body })
      const timestamp = nowIso()
      const mutation = await mutatePrivatePreferenceIntelligenceAggregate({
        scope,
        now: timestamp,
        mutation: (aggregate) => {
          const replay = inspectReplay(aggregate, 'answer_study_question', idempotencyKey, requestHash)
          if (replay) {
            const answer = aggregate.studyAnswers.find((candidate) => candidate.id === replay.responseEntityId)
            if (!answer) throw missingEntity('Preference Study Answer')
            return { result: { answer: cloneJson(answer), study: studyView(aggregate, studySessionId), replayed: true }, changed: false }
          }
          const session = requireStudySession(aggregate, studySessionId)
          assertSessionRevision(session, body.expectedSessionRevision)
          const question = aggregate.studyQuestions.find((candidate) =>
            candidate.id === questionId && candidate.studySessionId === studySessionId
          )
          if (!question) throw missingEntity('Preference Study Question')
          if (question.status === 'answered') throw new ApiError('IDEMPOTENCY_CONFLICT', 'Preference Study Question is already answered.', 409)
          assertSelectedQuestionOptions(question.options, body.selectedOptions)
          assertAggregateMutationCapacity(aggregate)
          const answer = {
            id: createPreferenceIntelligenceId('preference_answer'),
            questionId,
            studySessionId,
            preferenceId: session.preferenceId,
            answerText: body.answerText,
            selectedOptions: [...body.selectedOptions],
            createdAt: timestamp,
          }
          aggregate.studyAnswers.push(answer)
          question.status = 'answered'
          question.answeredAt = timestamp
          session.revision += 1
          session.status = hasOpenRequiredQuestions(aggregate, session.id) ? 'needs_user_answers' : 'ready_to_build'
          session.updatedAt = timestamp
          appendAudit(aggregate, scope.ownerUserId, 'preference_study_question_answered', timestamp, {
            preferenceId: session.preferenceId,
            studySessionId,
          })
          appendIdempotency(aggregate, 'answer_study_question', idempotencyKey, requestHash, answer.id, timestamp)
          return { result: { answer: cloneJson(answer), study: studyView(aggregate, studySessionId), replayed: false }, changed: true }
        },
      })
      return resultEnvelope(mutation)
    },

    async addEvidence(input: AddPreferenceEvidenceBody & MutatingInput & { studySessionId: string }) {
      const body = parseRequest(addPreferenceEvidenceSchema, input)
      const scope = await authorizePreferenceScope(context, body.workspaceId, 'write')
      const studySessionId = parseId(input.studySessionId, 'study session')
      assertEvidenceAssetAuthorityReady(body)
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const requestHash = mutationHash('add_evidence', scope, { studySessionId, ...body })
      const timestamp = nowIso()
      const mutation = await mutatePrivatePreferenceIntelligenceAggregate({
        scope,
        now: timestamp,
        mutation: (aggregate) => {
          const replay = inspectReplay(aggregate, 'add_evidence', idempotencyKey, requestHash)
          if (replay) {
            const evidence = aggregate.evidence.find((candidate) => candidate.id === replay.responseEntityId)
            if (!evidence) throw missingEntity('Preference Evidence')
            return { result: { evidence: cloneJson(evidence), study: studyView(aggregate, studySessionId), replayed: true }, changed: false }
          }
          const session = requireStudySession(aggregate, studySessionId)
          assertSessionRevision(session, body.expectedSessionRevision)
          assertAggregateMutationCapacity(aggregate)
          const mediaEvidence = MEDIA_EVIDENCE_TYPES.has(body.evidenceType)
          const evidence: PreferenceEvidenceRecord = {
            id: createPreferenceIntelligenceId('preference_evidence'),
            studySessionId,
            preferenceId: session.preferenceId,
            evidenceType: body.evidenceType,
            label: body.label,
            privateAssetId: body.privateAssetId,
            manualDescription: body.manualDescription,
            metadata: cloneJson(body.metadata),
            observations: body.observations.map((observation) => ({
              ...cloneJson(observation),
              observationId: createPreferenceIntelligenceId('preference_observation'),
            })),
            evidenceStatus: mediaEvidence ? 'registered' : 'metadata_ready',
            analysisRuntimeState: 'metadata_only',
            analysisWarnings: mediaEvidence
              ? ['Private media metadata is registered, but visual, transcript, audio, and graphic study did not run.']
              : ['Evidence is user-authored metadata; no provider analysis ran.'],
            rawFramesPersisted: false,
            fullVideoSentToReasoningModel: false,
            createdAt: timestamp,
            updatedAt: timestamp,
          }
          aggregate.evidence.push(evidence)
          session.revision += 1
          if (!hasOpenRequiredQuestions(aggregate, session.id)) session.status = 'ready_to_build'
          session.updatedAt = timestamp
          appendAudit(aggregate, scope.ownerUserId, 'preference_evidence_added', timestamp, {
            preferenceId: session.preferenceId,
            studySessionId,
          })
          appendIdempotency(aggregate, 'add_evidence', idempotencyKey, requestHash, evidence.id, timestamp)
          return { result: { evidence: cloneJson(evidence), study: studyView(aggregate, studySessionId), replayed: false }, changed: true }
        },
      })
      return resultEnvelope(mutation)
    },

    async requestEvidenceAnalysis(input: {
      workspaceId: string
      studySessionId: string
      evidenceId: string
      expectedSessionRevision: number
      idempotencyKey: string
    }) {
      const body = parseRequest(requestPreferenceEvidenceAnalysisSchema, input)
      const scope = await authorizePreferenceScope(context, body.workspaceId, 'write')
      const studySessionId = parseId(input.studySessionId, 'study session')
      const evidenceId = parseId(input.evidenceId, 'evidence')
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const requestHash = mutationHash('request_evidence_analysis', scope, { studySessionId, evidenceId, ...body })
      const timestamp = nowIso()
      const mutation = await mutatePrivatePreferenceIntelligenceAggregate({
        scope,
        now: timestamp,
        mutation: (aggregate) => {
          const replay = inspectReplay(aggregate, 'request_evidence_analysis', idempotencyKey, requestHash)
          if (replay) {
            const evidence = aggregate.evidence.find((candidate) => candidate.id === replay.responseEntityId)
            if (!evidence) throw missingEntity('Preference Evidence')
            return { result: { evidence: cloneJson(evidence), replayed: true }, changed: false }
          }
          const session = requireStudySession(aggregate, studySessionId)
          assertSessionRevision(session, body.expectedSessionRevision)
          const evidence = aggregate.evidence.find((candidate) =>
            candidate.id === evidenceId && candidate.studySessionId === studySessionId
          )
          if (!evidence) throw missingEntity('Preference Evidence')
          assertAggregateMutationCapacity(aggregate)
          evidence.evidenceStatus = MEDIA_EVIDENCE_TYPES.has(evidence.evidenceType) ? 'analysis_blocked' : 'metadata_ready'
          evidence.analysisRuntimeState = MEDIA_EVIDENCE_TYPES.has(evidence.evidenceType) ? 'blocked_by_worker' : 'metadata_only'
          evidence.analysisWarnings = MEDIA_EVIDENCE_TYPES.has(evidence.evidenceType)
            ? ['Analysis was not queued. Visual, transcript, audio, and graphic study workers are not proven in this runtime.']
            : ['Manual or metadata evidence does not require a media-analysis worker.']
          evidence.updatedAt = timestamp
          session.revision += 1
          session.updatedAt = timestamp
          appendAudit(aggregate, scope.ownerUserId, 'preference_evidence_analysis_blocked', timestamp, {
            preferenceId: session.preferenceId,
            studySessionId,
          })
          appendIdempotency(aggregate, 'request_evidence_analysis', idempotencyKey, requestHash, evidence.id, timestamp)
          return { result: { evidence: cloneJson(evidence), replayed: false }, changed: true }
        },
      })
      return resultEnvelope(mutation, ['No media-analysis job, provider call, frame extraction, transcript, or audio analysis was started.'])
    },

    async buildDna(input: {
      workspaceId: string
      studySessionId: string
      expectedSessionRevision: number
      idempotencyKey: string
    }) {
      const body = parseRequest(buildPreferenceDnaSchema, input)
      const scope = await authorizePreferenceScope(context, body.workspaceId, 'write')
      const studySessionId = parseId(input.studySessionId, 'study session')
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const requestHash = mutationHash('build_dna', scope, { studySessionId, ...body })
      const timestamp = nowIso()
      const mutation = await mutatePrivatePreferenceIntelligenceAggregate({
        scope,
        now: timestamp,
        mutation: (aggregate) => {
          const replay = inspectReplay(aggregate, 'build_dna', idempotencyKey, requestHash)
          if (replay) return { result: { dna: requireDnaVersion(aggregate, replay.responseEntityId), replayed: true }, changed: false }
          const session = requireStudySession(aggregate, studySessionId)
          assertSessionRevision(session, body.expectedSessionRevision)
          if (hasOpenRequiredQuestions(aggregate, session.id)) {
            throw new ApiError('TOOL_NOT_READY', 'Required Preference Study questions must be answered before DNA can be built.', 409)
          }
          const preference = requireActivePreference(aggregate, session.preferenceId)
          const evidence = aggregate.evidence.filter((item) => item.studySessionId === session.id)
          const observations = evidence.flatMap((item) =>
            item.observations.map((observation) => ({ evidenceId: item.id, observation }))
          )
          if (observations.length === 0) {
            throw new ApiError(
              'TOOL_NOT_READY',
              'Structured observations are required for metadata-only DNA build; automatic evidence synthesis is future-gated.',
              503,
              { requiredGate: 'qwen_preference_reasoning_or_user_structured_observations' },
            )
          }
          assertAggregateMutationCapacity(aggregate)
          const rulesByCategory = createEmptyRulesByCategory()
          for (const { evidenceId, observation } of observations) {
            rulesByCategory[observation.category].push({
              ruleId: createPreferenceIntelligenceId('preference_dna_rule'),
              category: observation.category,
              instruction: observation.instruction,
              reason: observation.reason,
              evidenceRefs: [evidenceId],
              confidence: observation.confidence,
              transferability: observation.transferability,
              conditions: [...observation.conditions],
              exceptions: [...observation.exceptions],
              prohibitedCopy: observation.prohibitedCopy,
              userApproved: false,
            })
          }
          addUniversalDoNotCopyRules(rulesByCategory)
          const allRules = Object.values(rulesByCategory).flat()
          const doNotCopyRules = uniqueStrings([
            ...UNIVERSAL_DO_NOT_COPY_RULES,
            ...allRules.filter((rule) => rule.prohibitedCopy).map((rule) => rule.instruction),
          ])
          const nonTransferableElements = uniqueStrings(
            allRules.filter((rule) => rule.transferability === 'non_transferable').map((rule) => rule.instruction),
          )
          const copyRiskWarnings = evidence
            .filter((item) => MEDIA_EVIDENCE_TYPES.has(item.evidenceType) && item.evidenceStatus !== 'analysis_complete')
            .map((item) => `${item.label}: reference media is metadata-only and was not studied by a proven worker.`)
          const nextVersion = Math.max(0, ...versionsForPreference(aggregate, preference.id).map((dna) => dna.version)) + 1
          const dna: PreferenceDnaVersionRecord = {
            id: createPreferenceIntelligenceId('preference_dna'),
            preferenceId: preference.id,
            studySessionId: session.id,
            version: nextVersion,
            status: 'ready_for_qa',
            runtimeState: 'metadata_only',
            summary: createDnaSummary(preference, rulesByCategory),
            bestUseCases: ['Source-adapted edits that benefit from the approved transferable rules.'],
            rulesByCategory,
            doNotCopyRules,
            nonTransferableElements,
            copyRiskWarnings,
            evidenceRefs: evidence.map((item) => item.id),
            evidenceCoverage: calculateEvidenceCoverage(rulesByCategory),
            confidence: averageConfidence(allRules),
            qaStatus: 'not_run',
            approvedForApplication: false,
            createdAt: timestamp,
          }
          aggregate.dnaVersions.push(dna)
          session.latestDnaVersionId = dna.id
          session.status = 'dna_draft_ready'
          session.revision += 1
          session.updatedAt = timestamp
          preference.revision += 1
          preference.updatedAt = timestamp
          appendAudit(aggregate, scope.ownerUserId, 'preference_dna_built_metadata_only', timestamp, {
            preferenceId: preference.id,
            studySessionId: session.id,
            dnaVersionId: dna.id,
          })
          appendIdempotency(aggregate, 'build_dna', idempotencyKey, requestHash, dna.id, timestamp)
          return { result: { dna: cloneJson(dna), replayed: false }, changed: true }
        },
      })
      return resultEnvelope(mutation, ['DNA was built from typed user/manual observations only; no media study or Qwen reasoning ran.'])
    },

    async runDnaQa(input: {
      workspaceId: string
      preferenceId: string
      dnaVersionId: string
      expectedPreferenceRevision: number
      idempotencyKey: string
    }) {
      const body = parseRequest(runPreferenceDnaQaSchema, input)
      const scope = await authorizePreferenceScope(context, body.workspaceId, 'write')
      const preferenceId = parseId(input.preferenceId, 'preference')
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const requestHash = mutationHash('run_dna_qa', scope, { preferenceId, ...body })
      const timestamp = nowIso()
      const mutation = await mutatePrivatePreferenceIntelligenceAggregate({
        scope,
        now: timestamp,
        mutation: (aggregate) => {
          const replay = inspectReplay(aggregate, 'run_dna_qa', idempotencyKey, requestHash)
          if (replay) {
            const qa = aggregate.qaResults.find((candidate) => candidate.id === replay.responseEntityId)
            if (!qa) throw missingEntity('Preference DNA QA Result')
            return { result: { qa: cloneJson(qa), dna: requireDnaVersion(aggregate, qa.dnaVersionId), replayed: true }, changed: false }
          }
          const preference = requirePreference(aggregate, preferenceId)
          assertPreferenceRevision(preference, body.expectedPreferenceRevision)
          const dna = requireDnaVersion(aggregate, body.dnaVersionId)
          if (dna.preferenceId !== preference.id) throw missingEntity('Preference DNA Version')
          if (dna.status === 'approved' || dna.status === 'superseded') {
            throw new ApiError('VALIDATION_FAILED', 'Approved or superseded Preference DNA is immutable.', 409)
          }
          assertAggregateMutationCapacity(aggregate)
          const qa = createDeterministicDnaQa(aggregate, dna, timestamp)
          aggregate.qaResults.push(qa)
          dna.qaStatus = qa.status
          dna.approvedForApplication = qa.approvedForApplication
          dna.status = qa.status === 'blocked' ? 'qa_blocked' : qa.status === 'warning' ? 'qa_warning' : 'qa_passed'
          preference.revision += 1
          preference.updatedAt = timestamp
          appendAudit(aggregate, scope.ownerUserId, 'preference_dna_qa_completed_metadata_only', timestamp, {
            preferenceId,
            studySessionId: dna.studySessionId,
            dnaVersionId: dna.id,
          })
          appendIdempotency(aggregate, 'run_dna_qa', idempotencyKey, requestHash, qa.id, timestamp)
          return { result: { qa: cloneJson(qa), dna: cloneJson(dna), replayed: false }, changed: true }
        },
      })
      return resultEnvelope(mutation, ['QA is deterministic metadata-only validation, not a live Qwen or media QA claim.'])
    },

    async approveDna(input: {
      workspaceId: string
      preferenceId: string
      dnaVersionId: string
      expectedPreferenceRevision: number
      expectedDnaVersion: number
      idempotencyKey: string
    }) {
      const body = parseRequest(approvePreferenceDnaSchema, input)
      const scope = await authorizePreferenceScope(context, body.workspaceId, 'write')
      const preferenceId = parseId(input.preferenceId, 'preference')
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const requestHash = mutationHash('approve_dna', scope, { preferenceId, ...body })
      const timestamp = nowIso()
      const mutation = await mutatePrivatePreferenceIntelligenceAggregate({
        scope,
        now: timestamp,
        mutation: (aggregate) => {
          const replay = inspectReplay(aggregate, 'approve_dna', idempotencyKey, requestHash)
          if (replay) {
            const responseSnapshot = replaySnapshot<{
              approval: PrivatePreferenceIntelligenceAggregate['approvals'][number]
              dna: PreferenceDnaVersionRecord
              replayed: boolean
            }>(replay)
            if (responseSnapshot) return { result: responseSnapshot, changed: false }
            const approval = aggregate.approvals.find((candidate) => candidate.id === replay.responseEntityId)
            if (!approval) throw missingEntity('Preference DNA Approval')
            return { result: { approval: cloneJson(approval), dna: requireDnaVersion(aggregate, approval.dnaVersionId), replayed: true }, changed: false }
          }
          const preference = requireActivePreference(aggregate, preferenceId)
          assertPreferenceRevision(preference, body.expectedPreferenceRevision)
          const dna = requireDnaVersion(aggregate, body.dnaVersionId)
          if (dna.preferenceId !== preference.id || dna.version !== body.expectedDnaVersion) {
            throw new ApiError('IDEMPOTENCY_CONFLICT', 'Preference DNA version changed before approval.', 409)
          }
          if (dna.status === 'approved') throw new ApiError('IDEMPOTENCY_CONFLICT', 'Preference DNA is already approved.', 409)
          const qa = latestQaForDna(aggregate, dna.id)
          if (!qa || !qa.approvedForApplication || !dna.approvedForApplication) {
            throw new ApiError('TOOL_NOT_READY', 'Preference DNA must pass QA before user approval.', 409)
          }
          assertAggregateMutationCapacity(aggregate)
          for (const prior of versionsForPreference(aggregate, preference.id)) {
            if (prior.status === 'approved') {
              prior.status = 'superseded'
              prior.supersededAt = timestamp
            }
          }
          dna.status = 'approved'
          dna.approvedAt = timestamp
          for (const rule of Object.values(dna.rulesByCategory).flat()) rule.userApproved = true
          preference.currentApprovedDnaVersionId = dna.id
          preference.revision += 1
          preference.updatedAt = timestamp
          const session = requireStudySession(aggregate, dna.studySessionId)
          session.status = 'closed'
          session.revision += 1
          session.updatedAt = timestamp
          const approval = {
            id: createPreferenceIntelligenceId('preference_dna_approval'),
            preferenceId: preference.id,
            dnaVersionId: dna.id,
            dnaVersion: dna.version,
            approvedByUserId: scope.ownerUserId,
            approvedAt: timestamp,
            qaResultId: qa.id,
          }
          aggregate.approvals.push(approval)
          appendAudit(aggregate, scope.ownerUserId, 'preference_dna_user_approved', timestamp, {
            preferenceId: preference.id,
            studySessionId: session.id,
            dnaVersionId: dna.id,
          })
          const result = { approval: cloneJson(approval), dna: cloneJson(dna), replayed: false }
          appendIdempotency(aggregate, 'approve_dna', idempotencyKey, requestHash, approval.id, timestamp, result)
          return { result, changed: true }
        },
      })
      return resultEnvelope(mutation)
    },

    async listVersions(workspaceIdInput: string, preferenceIdInput: string) {
      const scope = await authorizePreferenceScope(context, workspaceIdInput, 'read')
      const aggregate = await requireAggregate(scope)
      const preference = requirePreference(aggregate, parseId(preferenceIdInput, 'preference'))
      return resultEnvelope({ versions: cloneJson(versionsForPreference(aggregate, preference.id)) })
    },

    async applyPreference(input: ApplyPreferenceToEditSessionBody & MutatingInput & {
      projectId: string
      editSessionId: string
    }) {
      const body = parseRequest(applyPreferenceToEditSessionSchema, input)
      const applicationScope = await authorizePreferenceApplicationScope(
        context,
        body.workspaceId,
        input.projectId,
        input.editSessionId,
      )
      const scope = applicationScope.scope
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const requestHash = mutationHash('apply_preference', scope, {
        projectId: applicationScope.projectId,
        editSessionId: applicationScope.editSessionId,
        ...body,
      })
      const timestamp = nowIso()
      const mutation = await mutatePrivatePreferenceIntelligenceAggregate<{
        application: PreferenceDnaApplicationRecord
        action: 'replayed' | 'unchanged' | 'applied' | 'replaced'
        replayed: boolean
      }>({
        scope,
        planningDomainScope: {
          localStorageRoot: scope.localStorageRoot,
          ownerUserId: scope.ownerUserId,
          workspaceId: scope.workspaceId,
          projectId: applicationScope.projectId,
          editSessionId: applicationScope.editSessionId,
        },
        now: timestamp,
        mutation: async (aggregate) => {
          const replay = inspectReplay(aggregate, 'apply_preference', idempotencyKey, requestHash)
          if (replay) {
            const responseSnapshot = replaySnapshot<{
              application: PreferenceDnaApplicationRecord
              action: 'replayed' | 'unchanged' | 'applied' | 'replaced'
              replayed: boolean
            }>(replay)
            if (responseSnapshot) return { result: responseSnapshot, changed: false }
            const application = aggregate.applications.find((candidate) => candidate.id === replay.responseEntityId)
            if (!application) throw missingEntity('Preference DNA Application')
            return { result: { application: cloneJson(application), action: 'replayed' as const, replayed: true }, changed: false }
          }
          const lifecycleLock = await resolvePreferenceApplicationLifecycleLock(
            scope,
            applicationScope.projectId,
            applicationScope.editSessionId,
          )
          if (lifecycleLock) throw approvedPreferenceApplicationLockError(lifecycleLock)
          const preference = requireActivePreference(aggregate, body.preferenceId)
          if (!preference.currentApprovedDnaVersionId) {
            throw new ApiError('TOOL_NOT_READY', 'Edit Preference requires an approved DNA version before application.', 409)
          }
          const dna = requireDnaVersion(aggregate, preference.currentApprovedDnaVersionId)
          if (dna.status !== 'approved') throw new ApiError('TOOL_NOT_READY', 'Selected Preference DNA is not approved.', 409)
          const existing = findApplication(aggregate, applicationScope.projectId, applicationScope.editSessionId)
          assertApplicationVersion(existing, body.expectedApplicationVersion)
          if (
            existing?.status === 'applied'
            && existing.selectedEditPreferenceId === preference.id
            && existing.selectedPreferenceDNAId === dna.id
          ) {
            return { result: { application: cloneJson(existing), action: 'unchanged' as const, replayed: false }, changed: false }
          }
          assertAggregateMutationCapacity(aggregate)
          const action = existing?.status === 'applied' ? 'replaced' as const : 'applied' as const
          const applicationVersion = (existing?.applicationVersion ?? 0) + 1
          const summaries = buildAllContextSummaries(preference, dna, latestQaForDna(aggregate, dna.id))
          const warnings = uniqueStrings([
            ...dna.copyRiskWarnings,
            'Preference DNA must be adapted to the current source video; reference content must not be copied blindly.',
            dna.runtimeState === 'metadata_only' ? 'This DNA version was built from metadata/manual evidence, not completed media study.' : '',
          ].filter(Boolean))
          const application: PreferenceDnaApplicationRecord = {
            id: existing?.id ?? createPreferenceIntelligenceId('preference_application'),
            ownerUserId: scope.ownerUserId,
            workspaceId: scope.workspaceId,
            projectId: applicationScope.projectId,
            editSessionId: applicationScope.editSessionId,
            applicationVersion,
            status: 'applied',
            selectedEditPreferenceId: preference.id,
            selectedPreferenceDNAId: dna.id,
            source: body.source,
            tagReferenceId: body.tagReferenceId,
            preferenceWarnings: warnings,
            doNotCopyRules: [...dna.doNotCopyRules],
            preferenceSummaryForPlanner: summaries.planner,
            preferenceSummaryForMainChat: summaries.main_chat,
            preferenceSummaryForMarkerChat: summaries.marker_chat,
            preferenceSummaryForEditBrief: summaries.edit_brief,
            runtimeState: 'mock_local',
            appliedAt: timestamp,
            updatedAt: timestamp,
          }
          if (existing) replaceApplication(aggregate, existing.id, application)
          else aggregate.applications.push(application)
          aggregate.usageLogs.push({
            id: createPreferenceIntelligenceId('preference_usage'),
            preferenceId: preference.id,
            dnaVersionId: dna.id,
            applicationId: application.id,
            projectId: application.projectId,
            editSessionId: application.editSessionId,
            eventType: action,
            source: body.source,
            applicationVersion,
            createdAt: timestamp,
          })
          appendAudit(aggregate, scope.ownerUserId, `preference_${action}_to_edit_session`, timestamp, {
            preferenceId: preference.id,
            dnaVersionId: dna.id,
            applicationId: application.id,
            projectId: application.projectId,
            editSessionId: application.editSessionId,
          })
          const result = { application: cloneJson(application), action, replayed: false }
          appendIdempotency(aggregate, 'apply_preference', idempotencyKey, requestHash, application.id, timestamp, result)
          return { result, changed: true }
        },
      })
      return resultEnvelope(mutation)
    },

    async clearPreference(input: ClearPreferenceFromEditSessionBody & MutatingInput & {
      projectId: string
      editSessionId: string
    }) {
      const body = parseRequest(clearPreferenceFromEditSessionSchema, input)
      const applicationScope = await authorizePreferenceApplicationScope(
        context,
        body.workspaceId,
        input.projectId,
        input.editSessionId,
      )
      const scope = applicationScope.scope
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const requestHash = mutationHash('clear_preference', scope, {
        projectId: applicationScope.projectId,
        editSessionId: applicationScope.editSessionId,
        ...body,
      })
      const timestamp = nowIso()
      const mutation = await mutatePrivatePreferenceIntelligenceAggregate({
        scope,
        planningDomainScope: {
          localStorageRoot: scope.localStorageRoot,
          ownerUserId: scope.ownerUserId,
          workspaceId: scope.workspaceId,
          projectId: applicationScope.projectId,
          editSessionId: applicationScope.editSessionId,
        },
        now: timestamp,
        mutation: async (aggregate) => {
          const replay = inspectReplay(aggregate, 'clear_preference', idempotencyKey, requestHash)
          if (replay) {
            const responseSnapshot = replaySnapshot<{
              application: PreferenceDnaApplicationRecord
              replayed: boolean
            }>(replay)
            if (responseSnapshot) return { result: responseSnapshot, changed: false }
            const application = aggregate.applications.find((candidate) => candidate.id === replay.responseEntityId)
            if (!application) throw missingEntity('Preference DNA Application')
            return { result: { application: cloneJson(application), replayed: true }, changed: false }
          }
          const lifecycleLock = await resolvePreferenceApplicationLifecycleLock(
            scope,
            applicationScope.projectId,
            applicationScope.editSessionId,
          )
          if (lifecycleLock) throw approvedPreferenceApplicationLockError(lifecycleLock)
          const existing = findApplication(aggregate, applicationScope.projectId, applicationScope.editSessionId)
          assertApplicationVersion(existing, body.expectedApplicationVersion)
          if (existing?.status === 'cleared') {
            return { result: { application: cloneJson(existing), replayed: false }, changed: false }
          }
          assertAggregateMutationCapacity(aggregate)
          const applicationVersion = (existing?.applicationVersion ?? 0) + 1
          const priorPreferenceId = existing?.selectedEditPreferenceId
          const priorDnaId = existing?.selectedPreferenceDNAId
          const application: PreferenceDnaApplicationRecord = {
            id: existing?.id ?? createPreferenceIntelligenceId('preference_application'),
            ownerUserId: scope.ownerUserId,
            workspaceId: scope.workspaceId,
            projectId: applicationScope.projectId,
            editSessionId: applicationScope.editSessionId,
            applicationVersion,
            status: 'cleared',
            source: body.source,
            tagReferenceId: body.tagReferenceId,
            preferenceWarnings: [],
            doNotCopyRules: [],
            runtimeState: 'mock_local',
            clearedAt: timestamp,
            updatedAt: timestamp,
          }
          if (existing) replaceApplication(aggregate, existing.id, application)
          else aggregate.applications.push(application)
          aggregate.usageLogs.push({
            id: createPreferenceIntelligenceId('preference_usage'),
            preferenceId: priorPreferenceId,
            dnaVersionId: priorDnaId,
            applicationId: application.id,
            projectId: application.projectId,
            editSessionId: application.editSessionId,
            eventType: 'cleared',
            source: body.source,
            applicationVersion,
            createdAt: timestamp,
          })
          appendAudit(aggregate, scope.ownerUserId, 'preference_cleared_from_edit_session', timestamp, {
            preferenceId: priorPreferenceId,
            dnaVersionId: priorDnaId,
            applicationId: application.id,
            projectId: application.projectId,
            editSessionId: application.editSessionId,
          })
          const result = { application: cloneJson(application), replayed: false }
          appendIdempotency(aggregate, 'clear_preference', idempotencyKey, requestHash, application.id, timestamp, result)
          return { result, changed: true }
        },
      })
      return resultEnvelope(mutation)
    },

    async getApplication(
      workspaceIdInput: string,
      projectIdInput: string,
      editSessionIdInput: string,
    ) {
      const applicationScope = await authorizePreferenceApplicationScope(
        context,
        workspaceIdInput,
        projectIdInput,
        editSessionIdInput,
        'read',
      )
      const aggregate = await readPrivatePreferenceIntelligenceAggregate(applicationScope.scope)
      const application = aggregate
        ? findApplication(aggregate, applicationScope.projectId, applicationScope.editSessionId)
        : undefined
      return resultEnvelope({ application: application ? cloneJson(application) : undefined })
    },

    async getContextPackage(
      workspaceIdInput: string,
      projectIdInput: string,
      editSessionIdInput: string,
      audienceInput: PreferenceContextAudience,
    ) {
      const audience = preferenceContextAudienceSchema.parse(audienceInput)
      const applicationScope = await authorizePreferenceApplicationScope(
        context,
        workspaceIdInput,
        projectIdInput,
        editSessionIdInput,
        'read',
      )
      const aggregate = await readPrivatePreferenceIntelligenceAggregate(applicationScope.scope)
      const application = aggregate
        ? findApplication(aggregate, applicationScope.projectId, applicationScope.editSessionId)
        : undefined
      if (!application || application.status === 'cleared') {
        return resultEnvelope({
          applicationStatus: application?.status ?? 'not_selected',
          applicationVersion: application?.applicationVersion ?? 0,
          audience,
          context: undefined,
          doNotCopyRules: [] as string[],
          instructionPriority: PREFERENCE_INSTRUCTION_PRIORITY,
          boundaries: preferenceContextBoundaries(),
        })
      }
      const contextSummary = contextSummaryForAudience(application, audience)
      return resultEnvelope({
        applicationStatus: application.status,
        applicationVersion: application.applicationVersion,
        audience,
        context: cloneJson(contextSummary),
        doNotCopyRules: [...application.doNotCopyRules],
        instructionPriority: PREFERENCE_INSTRUCTION_PRIORITY,
        boundaries: preferenceContextBoundaries(),
      })
    },

    async listAppliedEdits(workspaceIdInput: string, preferenceIdInput: string) {
      const scope = await authorizePreferenceScope(context, workspaceIdInput, 'read')
      const preferenceId = parseId(preferenceIdInput, 'preference')
      const aggregate = await requireAggregate(scope)
      requirePreference(aggregate, preferenceId)
      const applications = aggregate.applications.filter((application) =>
        application.status === 'applied' && application.selectedEditPreferenceId === preferenceId
      )
      return resultEnvelope({ applications: cloneJson(applications), usageLogs: cloneJson(
        aggregate.usageLogs.filter((log) => log.preferenceId === preferenceId),
      ) })
    },
  }
}

export type PreferenceIntelligenceService = ReturnType<typeof createPreferenceIntelligenceService>

async function mutateStudyMessage(
  context: ServiceContext,
  input: {
    workspaceId: string
    studySessionId: string
    expectedSessionRevision: number
    content: string
    clientMessageId?: string
    role: 'user' | 'assistant'
    runtimeState: PreferenceRuntimeState
    idempotencyKey: string
  },
) {
  const scope = await authorizePreferenceScope(context, input.workspaceId, 'write')
  const studySessionId = parseId(input.studySessionId, 'study session')
  const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
  const operation = input.role === 'user' ? 'append_user_study_message' : 'append_assistant_study_message'
  const requestHash = mutationHash(operation, scope, input)
  const timestamp = nowIso()
  const mutation = await mutatePrivatePreferenceIntelligenceAggregate({
    scope,
    now: timestamp,
    mutation: (aggregate) => {
      const replay = inspectReplay(aggregate, operation, idempotencyKey, requestHash)
      if (replay) {
        const message = aggregate.studyMessages.find((candidate) => candidate.id === replay.responseEntityId)
        if (!message) throw missingEntity('Preference Study Message')
        return { result: { message: cloneJson(message), study: studyView(aggregate, studySessionId), replayed: true }, changed: false }
      }
      const session = requireStudySession(aggregate, studySessionId)
      assertSessionRevision(session, input.expectedSessionRevision)
      if (input.clientMessageId) {
        const duplicate = aggregate.studyMessages.find((message) =>
          message.studySessionId === session.id && message.clientMessageId === input.clientMessageId
        )
        if (duplicate) throw new ApiError('IDEMPOTENCY_CONFLICT', 'Preference Study client message ID already exists.', 409)
      }
      assertAggregateMutationCapacity(aggregate)
      const message = {
        id: createPreferenceIntelligenceId('preference_study_message'),
        studySessionId: session.id,
        preferenceId: session.preferenceId,
        role: input.role,
        content: input.content,
        clientMessageId: input.clientMessageId,
        runtimeState: input.runtimeState,
        createdAt: timestamp,
      }
      aggregate.studyMessages.push(message)
      session.revision += 1
      session.updatedAt = timestamp
      appendAudit(aggregate, scope.ownerUserId, `preference_study_${input.role}_message_appended`, timestamp, {
        preferenceId: session.preferenceId,
        studySessionId: session.id,
      })
      appendIdempotency(aggregate, operation, idempotencyKey, requestHash, message.id, timestamp)
      return { result: { message: cloneJson(message), study: studyView(aggregate, session.id), replayed: false }, changed: true }
    },
  })
  return resultEnvelope(mutation)
}

async function authorizePreferenceScope(
  context: ServiceContext,
  workspaceIdInput: string,
  operation: 'read' | 'write',
): Promise<PreferenceIntelligenceScope> {
  requirePreferenceIntelligenceRuntime(context)
  if (!context.auth?.isMockUser && !context.auth?.accessToken) {
    throw new ApiError('AUTH_INVALID', 'Preference intelligence requires a verified bearer-authenticated user.', 401)
  }
  const workspaceId = parseId(workspaceIdInput, 'workspace')
  const access = await authorizeWorkspaceAccess(context, workspaceId, operation)
  return {
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId: access.userId,
    workspaceId: access.workspaceId,
  }
}

async function authorizePreferenceApplicationScope(
  context: ServiceContext,
  workspaceIdInput: string,
  projectIdInput: string,
  editSessionIdInput: string,
  operation: 'read' | 'write' = 'write',
): Promise<{ scope: PreferenceIntelligenceScope; projectId: string; editSessionId: string }> {
  const scope = await authorizePreferenceScope(context, workspaceIdInput, operation)
  const projectId = parseId(projectIdInput, 'project')
  const editSessionId = parseId(editSessionIdInput, 'edit session')
  const project = (await createProjectService(context).getProject(projectId, scope.workspaceId)).project
  if (project.id !== projectId || project.workspaceId !== scope.workspaceId) throw missingEntity('Project')
  return { scope, projectId, editSessionId }
}

function requirePreferenceIntelligenceRuntime(context: ServiceContext): void {
  if (context.env.storageMode === 'local' && isExplicitLocalInternalTestRuntime(context.env)) return
  throw new ApiError(
    'TOOL_NOT_READY',
    'Preference intelligence is blocked until canonical Supabase persistence, RLS, and distributed transaction evidence are deployed.',
    503,
    {
      requiredGates: [
        'preference_intelligence_canonical_schema',
        'two_user_two_workspace_rls_tests',
        'atomic_preference_application_rpc',
        'durable_study_and_dna_versioning',
      ],
    },
  )
}

async function resolvePreferenceApplicationLifecycleLock(
  scope: PreferenceIntelligenceScope,
  projectId: string,
  editSessionId: string,
): Promise<'credit_reserved' | 'approved_snapshot' | 'approved_plan' | undefined> {
  const authority = await readPrivateEditAuthorityAggregate({
    localStorageRoot: scope.localStorageRoot,
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
  })
  if (!authority) return undefined
  const approvedPlan = authority.plans.find((plan) =>
    plan.projectId === projectId && plan.editSessionId === editSessionId && plan.status === 'approved'
  )
  const snapshot = authority.snapshots.find((candidate) =>
    candidate.projectId === projectId && candidate.editSessionId === editSessionId
  )
  const reservation = authority.reservations.find((candidate) =>
    candidate.projectId === projectId && candidate.editSessionId === editSessionId
  )
  if (!approvedPlan && !snapshot && !reservation) return undefined
  return reservation ? 'credit_reserved' : snapshot ? 'approved_snapshot' : 'approved_plan'
}

function approvedPreferenceApplicationLockError(
  lifecyclePhase: 'credit_reserved' | 'approved_snapshot' | 'approved_plan',
): ApiError {
  return new ApiError(
    'PLAN_NOT_APPROVED',
    'Applied Preference DNA is frozen after plan approval. Request a Chat-led revision and create a new plan version.',
    409,
    {
      requiredFlow: 'chat_led_revision_replanning_and_new_approval',
      lifecyclePhase,
    },
  )
}

function buildAllContextSummaries(
  preference: ReusableEditPreferenceRecord,
  dna: PreferenceDnaVersionRecord,
  qa: PreferenceDnaQaResultRecord | undefined,
): Record<PreferenceContextAudience, PreferenceContextSummary> {
  return {
    planner: buildContextSummary(preference, dna, qa, 'planner', [
      'visual_style', 'captions', 'color_grade', 'spacing_layout', 'motion_zoom', 'transitions', 'pacing',
      'story_structure', 'broll', 'audio', 'graphics', 'platform_export', 'accessibility_readability',
    ]),
    main_chat: buildContextSummary(preference, dna, qa, 'main_chat', [
      'visual_style', 'captions', 'color_grade', 'pacing', 'story_structure', 'broll', 'audio', 'graphics',
    ]),
    marker_chat: buildContextSummary(preference, dna, qa, 'marker_chat', [
      'visual_style', 'captions', 'pacing', 'broll', 'audio', 'graphics', 'transitions', 'accessibility_readability',
    ]),
    edit_brief: buildContextSummary(preference, dna, qa, 'edit_brief', [
      'visual_style', 'captions', 'color_grade', 'pacing', 'broll', 'audio', 'graphics', 'story_structure',
    ]),
  }
}

function buildContextSummary(
  preference: ReusableEditPreferenceRecord,
  dna: PreferenceDnaVersionRecord,
  qa: PreferenceDnaQaResultRecord | undefined,
  audience: PreferenceContextAudience,
  categories: PreferenceRuleCategory[],
): PreferenceContextSummary {
  const relevantRules: Partial<Record<PreferenceRuleCategory, string[]>> = {}
  for (const category of categories) {
    const instructions = dna.rulesByCategory[category]
      .filter((rule) => rule.transferability === 'transferable' && !rule.prohibitedCopy)
      .slice(0, 8)
      .map((rule) => rule.instruction)
    if (instructions.length > 0) relevantRules[category] = instructions
  }
  return {
    compact: true,
    audience,
    preferenceId: preference.id,
    preferenceName: preference.name,
    preferenceDNAId: dna.id,
    preferenceDNAVersion: dna.version,
    runtimeState: dna.runtimeState,
    qaStatus: dna.qaStatus,
    confidence: dna.confidence,
    relevantRules,
    doNotCopyRules: [...dna.doNotCopyRules],
    nonTransferableElements: [...dna.nonTransferableElements],
    qaWarnings: uniqueStrings([...(qa?.warnings ?? []), ...dna.copyRiskWarnings]),
    instructionPriority: PREFERENCE_INSTRUCTION_PRIORITY,
  }
}

function contextSummaryForAudience(
  application: PreferenceDnaApplicationRecord,
  audience: PreferenceContextAudience,
): PreferenceContextSummary {
  const summary = {
    planner: application.preferenceSummaryForPlanner,
    main_chat: application.preferenceSummaryForMainChat,
    marker_chat: application.preferenceSummaryForMarkerChat,
    edit_brief: application.preferenceSummaryForEditBrief,
  }[audience]
  if (!summary) throw new ApiError('VALIDATION_FAILED', 'Applied preference context summary is missing.', 409)
  return summary
}

function preferenceContextBoundaries() {
  return {
    includesFullStudyChat: false,
    includesRawVideo: false,
    includesRawFrames: false,
    includesMarkerInstructions: false,
    editBriefMarkersRemainSeparate: true,
  } as const
}

function createDeterministicDnaQa(
  aggregate: PrivatePreferenceIntelligenceAggregate,
  dna: PreferenceDnaVersionRecord,
  timestamp: string,
): PreferenceDnaQaResultRecord {
  const rules = Object.values(dna.rulesByCategory).flat()
  const transferableRules = rules.filter((rule) => rule.transferability === 'transferable' && !rule.prohibitedCopy)
  const blockingIssues: string[] = []
  const warnings = [...dna.copyRiskWarnings]
  if (transferableRules.length === 0) blockingIssues.push('No transferable editing rule is available.')
  if (dna.doNotCopyRules.length === 0) blockingIssues.push('Do-not-copy rules are required.')
  if (rules.some((rule) => rule.transferability === 'non_transferable' && !rule.prohibitedCopy)) {
    blockingIssues.push('A non-transferable rule is not prohibited from copying.')
  }
  if (dna.evidenceRefs.length === 0) blockingIssues.push('Preference DNA has no evidence reference.')
  if (dna.confidence < 0.5) warnings.push('Overall evidence confidence is below 0.50.')
  const mediaNotStudied = aggregate.evidence.some((evidence) =>
    dna.evidenceRefs.includes(evidence.id)
    && MEDIA_EVIDENCE_TYPES.has(evidence.evidenceType)
    && evidence.evidenceStatus !== 'analysis_complete'
  )
  if (mediaNotStudied) warnings.push('Referenced media is metadata-only and was not studied by proven visual/transcript/audio/graphic workers.')
  const duplicateInstructions = duplicateNormalizedInstructions(transferableRules)
  if (duplicateInstructions.length > 0) warnings.push('Duplicate transferable rules should be reviewed for over-specificity.')
  const status = blockingIssues.length > 0 ? 'blocked' as const : warnings.length > 0 ? 'warning' as const : 'passed' as const
  return {
    id: createPreferenceIntelligenceId('preference_dna_qa'),
    preferenceId: dna.preferenceId,
    dnaVersionId: dna.id,
    status,
    blockingIssues,
    warnings: uniqueStrings(warnings),
    needsUserReview: status !== 'passed' || dna.runtimeState !== 'real_beta_live',
    approvedForApplication: blockingIssues.length === 0,
    confidence: dna.confidence,
    runtimeState: 'metadata_only',
    createdAt: timestamp,
  }
}

function addUniversalDoNotCopyRules(
  rulesByCategory: Record<PreferenceRuleCategory, PreferenceDnaRuleRecord[]>,
): void {
  for (const instruction of UNIVERSAL_DO_NOT_COPY_RULES) {
    if (rulesByCategory.do_not_copy.some((rule) => normalizeName(rule.instruction) === normalizeName(instruction))) continue
    rulesByCategory.do_not_copy.push({
      ruleId: createPreferenceIntelligenceId('preference_dna_rule'),
      category: 'do_not_copy',
      instruction,
      reason: 'Deterministic ReEditPro transferability and copyright safety baseline.',
      evidenceRefs: [],
      confidence: 1,
      transferability: 'non_transferable',
      conditions: [],
      exceptions: [],
      prohibitedCopy: true,
      userApproved: false,
    })
  }
}

function createDnaSummary(
  preference: ReusableEditPreferenceRecord,
  rulesByCategory: Record<PreferenceRuleCategory, PreferenceDnaRuleRecord[]>,
): string {
  const categories = Object.entries(rulesByCategory)
    .filter(([category, rules]) => category !== 'do_not_copy' && rules.some((rule) => rule.transferability === 'transferable'))
    .map(([category]) => category.replaceAll('_', ' '))
  return `${preference.name}: source-adapted ${categories.slice(0, 6).join(', ') || 'editing'} rules with mandatory do-not-copy constraints.`
    .slice(0, 1_000)
}

function calculateEvidenceCoverage(
  rulesByCategory: Record<PreferenceRuleCategory, PreferenceDnaRuleRecord[]>,
): number {
  const categories = Object.entries(rulesByCategory).filter(([category]) => category !== 'do_not_copy')
  const covered = categories.filter(([, rules]) => rules.some((rule) => rule.transferability === 'transferable')).length
  return Number((covered / categories.length).toFixed(4))
}

function averageConfidence(rules: PreferenceDnaRuleRecord[]): number {
  const evidenceRules = rules.filter((rule) => rule.evidenceRefs.length > 0)
  if (evidenceRules.length === 0) return 0
  return Number((evidenceRules.reduce((total, rule) => total + rule.confidence, 0) / evidenceRules.length).toFixed(4))
}

function studyView(aggregate: PrivatePreferenceIntelligenceAggregate, studySessionId: string) {
  const session = requireStudySession(aggregate, studySessionId)
  return cloneJson({
    session,
    messages: aggregate.studyMessages.filter((message) => message.studySessionId === session.id),
    questions: aggregate.studyQuestions.filter((question) => question.studySessionId === session.id),
    answers: aggregate.studyAnswers.filter((answer) => answer.studySessionId === session.id),
    evidence: aggregate.evidence.filter((item) => item.studySessionId === session.id),
    dnaVersions: aggregate.dnaVersions.filter((dna) => dna.studySessionId === session.id),
    qaResults: aggregate.qaResults.filter((qa) =>
      aggregate.dnaVersions.some((dna) => dna.studySessionId === session.id && dna.id === qa.dnaVersionId)
    ),
  })
}

function requirePreference(
  aggregate: PrivatePreferenceIntelligenceAggregate,
  preferenceId: string,
): ReusableEditPreferenceRecord {
  const preference = aggregate.preferences.find((candidate) => candidate.id === preferenceId)
  if (!preference) throw missingEntity('Edit Preference')
  return preference
}

function requireActivePreference(
  aggregate: PrivatePreferenceIntelligenceAggregate,
  preferenceId: string,
): ReusableEditPreferenceRecord {
  const preference = requirePreference(aggregate, preferenceId)
  if (preference.status !== 'active') throw new ApiError('VALIDATION_FAILED', 'Archived Edit Preference cannot be used.', 409)
  return preference
}

function requireStudySession(
  aggregate: PrivatePreferenceIntelligenceAggregate,
  studySessionId: string,
): PreferenceStudySessionRecord {
  const session = aggregate.studySessions.find((candidate) => candidate.id === studySessionId)
  if (!session) throw missingEntity('Preference Study Session')
  return session
}

function requireDnaVersion(
  aggregate: PrivatePreferenceIntelligenceAggregate,
  dnaVersionId: string,
): PreferenceDnaVersionRecord {
  const dna = aggregate.dnaVersions.find((candidate) => candidate.id === dnaVersionId)
  if (!dna) throw missingEntity('Preference DNA Version')
  return dna
}

async function requireAggregate(scope: PreferenceIntelligenceScope): Promise<PrivatePreferenceIntelligenceAggregate> {
  const aggregate = await readPrivatePreferenceIntelligenceAggregate(scope)
  if (!aggregate) throw missingEntity('Preference Intelligence workspace')
  return aggregate
}

function versionsForPreference(
  aggregate: PrivatePreferenceIntelligenceAggregate,
  preferenceId: string,
): PreferenceDnaVersionRecord[] {
  return aggregate.dnaVersions
    .filter((dna) => dna.preferenceId === preferenceId)
    .sort((left, right) => right.version - left.version)
}

function latestQaForDna(
  aggregate: PrivatePreferenceIntelligenceAggregate,
  dnaVersionId: string,
): PreferenceDnaQaResultRecord | undefined {
  return aggregate.qaResults
    .filter((qa) => qa.dnaVersionId === dnaVersionId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]
}

function findApplication(
  aggregate: PrivatePreferenceIntelligenceAggregate,
  projectId: string,
  editSessionId: string,
): PreferenceDnaApplicationRecord | undefined {
  return aggregate.applications.find((application) =>
    application.projectId === projectId && application.editSessionId === editSessionId
  )
}

function replaceApplication(
  aggregate: PrivatePreferenceIntelligenceAggregate,
  applicationId: string,
  application: PreferenceDnaApplicationRecord,
): void {
  const index = aggregate.applications.findIndex((candidate) => candidate.id === applicationId)
  if (index < 0) throw missingEntity('Preference DNA Application')
  aggregate.applications[index] = application
}

function assertPreferenceRevision(preference: ReusableEditPreferenceRecord, expectedRevision: number): void {
  if (preference.revision !== expectedRevision) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Edit Preference changed after it was loaded.', 409, {
      expectedRevision,
      currentRevision: preference.revision,
    })
  }
}

function assertSessionRevision(session: PreferenceStudySessionRecord, expectedRevision: number): void {
  if (session.revision !== expectedRevision) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Preference Study Session changed after it was loaded.', 409, {
      expectedRevision,
      currentRevision: session.revision,
    })
  }
}

function assertApplicationVersion(
  application: PreferenceDnaApplicationRecord | undefined,
  expectedVersion: number,
): void {
  const currentVersion = application?.applicationVersion ?? 0
  if (currentVersion !== expectedVersion) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Edit Session preference application changed after it was loaded.', 409, {
      expectedVersion,
      currentVersion,
    })
  }
}

function hasOpenRequiredQuestions(aggregate: PrivatePreferenceIntelligenceAggregate, studySessionId: string): boolean {
  return aggregate.studyQuestions.some((question) =>
    question.studySessionId === studySessionId && question.required && question.status === 'open'
  )
}

function assertSelectedQuestionOptions(allowed: string[], selected: string[]): void {
  if (selected.some((option) => !allowed.includes(option))) {
    throw new ApiError('VALIDATION_FAILED', 'Preference Study answer selected an unknown option.', 400)
  }
}

function inspectReplay(
  aggregate: PrivatePreferenceIntelligenceAggregate,
  operation: string,
  idempotencyKey: string,
  requestHash: string,
) {
  const existing = aggregate.idempotencyRecords.find((record) =>
    record.operation === operation && record.idempotencyKey === idempotencyKey
  )
  if (!existing) return undefined
  if (existing.requestHash !== requestHash) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Preference intelligence Idempotency-Key was reused with another request.', 409)
  }
  if (existing.responseSnapshot === undefined && existing.committedAggregateRevision !== aggregate.revision) {
    throw new ApiError(
      'IDEMPOTENCY_REPLAY_UNAVAILABLE',
      'The original preference intelligence response was superseded; the mutation will not run again.',
      503,
    )
  }
  return existing
}

function replaySnapshot<T>(record: { responseSnapshot?: unknown }): T | undefined {
  if (record.responseSnapshot === undefined) return undefined
  return cloneJson(record.responseSnapshot) as T
}

function appendIdempotency(
  aggregate: PrivatePreferenceIntelligenceAggregate,
  operation: string,
  idempotencyKey: string,
  requestHash: string,
  responseEntityId: string,
  timestamp: string,
  responseSnapshot?: unknown,
): void {
  aggregate.idempotencyRecords.push({
    operation,
    idempotencyKey,
    requestHash,
    responseEntityId,
    responseSnapshot: responseSnapshot === undefined ? undefined : cloneJson(responseSnapshot),
    committedAggregateRevision: aggregate.revision + 1,
    completedAt: timestamp,
  })
}

function appendAudit(
  aggregate: PrivatePreferenceIntelligenceAggregate,
  actorUserId: string,
  eventType: string,
  timestamp: string,
  links: Partial<{
    preferenceId: string
    studySessionId: string
    dnaVersionId: string
    applicationId: string
    projectId: string
    editSessionId: string
  }>,
): void {
  aggregate.auditEvents.push({
    id: createPreferenceIntelligenceId('preference_audit'),
    eventType,
    actorUserId,
    ...links,
    aggregateRevision: aggregate.revision + 1,
    createdAt: timestamp,
  })
}

function assertAggregateMutationCapacity(aggregate: PrivatePreferenceIntelligenceAggregate): void {
  if (aggregate.auditEvents.length >= MAX_PREFERENCE_INTELLIGENCE_AUDIT_EVENTS) {
    throw new ApiError('IDEMPOTENCY_CAPACITY_EXCEEDED', 'Preference intelligence audit capacity was reached.', 503)
  }
  if (aggregate.idempotencyRecords.length >= MAX_PREFERENCE_INTELLIGENCE_IDEMPOTENCY_RECORDS) {
    throw new ApiError('IDEMPOTENCY_CAPACITY_EXCEEDED', 'Preference intelligence idempotency capacity was reached.', 503)
  }
}

function refreshAppliedPreferenceNames(
  aggregate: PrivatePreferenceIntelligenceAggregate,
  preference: ReusableEditPreferenceRecord,
): void {
  for (const application of aggregate.applications) {
    if (application.status !== 'applied' || application.selectedEditPreferenceId !== preference.id) continue
    for (const summary of [
      application.preferenceSummaryForPlanner,
      application.preferenceSummaryForMainChat,
      application.preferenceSummaryForMarkerChat,
      application.preferenceSummaryForEditBrief,
    ]) {
      if (summary) summary.preferenceName = preference.name
    }
  }
}

function assertNonLiveCapability(runtimeState: PreferenceRuntimeState, capability: string): void {
  const parsed = preferenceRuntimeStateSchema.parse(runtimeState)
  if (parsed === 'real_beta_live' || parsed === 'production_ready') {
    throw new ApiError('TOOL_NOT_READY', `${capability} cannot claim a live runtime without deployed evidence.`, 503)
  }
}

function assertEvidenceAssetAuthorityReady(body: AddPreferenceEvidenceBody): void {
  if (!body.privateAssetId && !MEDIA_EVIDENCE_TYPES.has(body.evidenceType)) return
  throw new ApiError(
    'TOOL_NOT_READY',
    'Reference media evidence is blocked until its finalized private asset and tenant lineage can be loaded server-side.',
    503,
    {
      runtimeState: 'blocked_by_persistence',
      requiredGates: [
        'tenant_bound_private_reference_asset_authority',
        'finalized_storage_object_lineage',
        'workspace_project_edit_session_asset_scope',
        'preference_media_study_worker_authorization',
      ],
    },
  )
}

function duplicateNormalizedInstructions(rules: PreferenceDnaRuleRecord[]): string[] {
  const counts = new Map<string, number>()
  for (const rule of rules) counts.set(normalizeName(rule.instruction), (counts.get(normalizeName(rule.instruction)) ?? 0) + 1)
  return [...counts.entries()].filter(([, count]) => count > 1).map(([instruction]) => instruction)
}

function mutationHash(operation: string, scope: PreferenceIntelligenceScope, value: unknown): string {
  return preferenceIntelligenceHash({
    operation,
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    value,
  })
}

function parseRequest<T>(schema: {
  safeParse: (value: unknown) =>
    | { success: true; data: T }
    | { success: false; error: { flatten: () => unknown; issues?: Array<{ code?: string; keys?: string[] }> } }
}, value: unknown): T {
  const candidate = value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : value
  if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
    delete (candidate as Record<string, unknown>).idempotencyKey
  }
  let parsed = schema.safeParse(candidate)
  if (!parsed.success && candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
    const allowedTransportFields = new Set([
      'preferenceId',
      'studySessionId',
      'questionId',
      'evidenceId',
      'projectId',
      'editSessionId',
    ])
    const removableKeys = (parsed.error.issues ?? [])
      .filter((issue) => issue.code === 'unrecognized_keys')
      .flatMap((issue) => issue.keys ?? [])
      .filter((key) => allowedTransportFields.has(key))
    if (removableKeys.length > 0) {
      for (const key of removableKeys) delete (candidate as Record<string, unknown>)[key]
      parsed = schema.safeParse(candidate)
    }
  }
  if (!parsed.success) throw new ApiError('VALIDATION_FAILED', 'Preference intelligence request validation failed.', 400, parsed.error.flatten())
  return parsed.data
}

function parseId(value: string, label: string): string {
  const parsed = exactEditPreferenceScopeIdSchema.safeParse(value)
  if (!parsed.success) throw new ApiError('VALIDATION_FAILED', `A safe ${label} ID is required.`, 400)
  return parsed.data
}

function requireIdempotencyKey(value: string | undefined): string {
  const normalized = value?.trim()
  if (!normalized) throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key is required for preference intelligence mutations.', 400)
  if (normalized.length > 240 || Array.from(normalized).some((character) => character.charCodeAt(0) <= 31 || character.charCodeAt(0) === 127)) {
    throw new ApiError('VALIDATION_FAILED', 'Preference intelligence Idempotency-Key is invalid.', 400)
  }
  return normalized
}

function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ')
}

function uniqueStrings(values: readonly string[]): string[] {
  const seen = new Set<string>()
  return values.filter((value) => {
    const normalized = normalizeName(value)
    if (!normalized || seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

function resultEnvelope<T>(data: T, extraWarnings: string[] = []) {
  return {
    ...data,
    capability: PREFERENCE_INTELLIGENCE_CAPABILITY,
    warnings: [
      ...extraWarnings,
      'Preference intelligence uses private single-host internal-test persistence.',
      'No provider, media worker, transcript, audio analysis, render, billing, credit, or production persistence is implied.',
    ],
  }
}

function missingEntity(label: string): ApiError {
  return new ApiError('PROJECT_NOT_FOUND', `${label} was not found in this authorized private scope.`, 404)
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
