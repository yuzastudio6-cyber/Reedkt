import { createHash } from 'node:crypto'
import { PREFERENCE_DNA_LAYER_REGISTRY } from '../../src/backend/preference-dna/preference-dna-layer-registry'
import { createDoNotCopyPreferenceRules } from '../../src/backend/preference-dna/preference-dna-transferability-service'
import type { PreferenceDNALayerId } from '../../src/types/preference-dna-builder'
import type { EditReferenceStudyGoal } from '../../src/types/edit-reference'
import type {
  EditReferenceAggregate,
  EditReferenceRepository,
  EditReferenceRepositoryScope,
} from '../edit-references/edit-reference-repository'
import {
  EDIT_REFERENCE_PREFERENCE_DNA_REASONING_REQUEST_VERSION,
  createBlockedEditReferencePreferenceDnaReasoningResult,
  isSafeEditReferencePreferenceDnaReasoningText,
  type EditReferencePreferenceDnaReasoningRequest,
  type EditReferencePreferenceDnaReasoningResult,
} from '../edit-references/edit-reference-preference-dna-reasoning-contract'
import {
  createEditReferenceRoutedPreferenceDnaAdapter,
  hashEditReferencePreferenceDnaStructuredContext,
  type EditReferencePreferenceDnaProductionUsageAuthority,
} from '../edit-references/edit-reference-qwen-preference-dna-adapter'
import {
  getEditReferenceReasoningRouteRetryReason,
  resolveEditReferenceReasoningRouteAuthorizationFailClosed,
  resolveEditReferenceReasoningRouteProviderFailClosed,
  type EditReferenceReasoningRouteAuthorizationResolver,
  type EditReferenceReasoningRouteProviderResolver,
} from '../edit-references/edit-reference-reasoning-route-authorization'
import {
  QWEN_PREFERENCE_DNA_STRUCTURED_CONTEXT_VERSION,
  createQwenPreferenceDnaReasoningProvider,
  qwenPreferenceDnaStructuredContextSchema,
  type EditReferencePreferenceDnaReasoningProvider,
  type QwenPreferenceDnaStructuredContext,
} from './qwen-preference-dna-reasoning-provider'

export const EDIT_REFERENCE_PREFERENCE_DNA_REASONING_SERVICE_VERSION =
  'edit-reference-preference-dna-reasoning-service-v1' as const

export interface EditReferencePreferenceDnaReasoningServiceInput {
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly expectedStudyRevision: number
  readonly executionScope: 'controlled_test' | 'production'
  readonly approvedUsageEstimateId: string | null
  readonly internalCostBudgetId: string | null
  readonly immutableRateCardSnapshotId: string | null
  readonly maximumAuthorizedInternalCostMicros: string | null
}

export interface EditReferencePreferenceDnaReasoningService {
  readonly serviceVersion: typeof EDIT_REFERENCE_PREFERENCE_DNA_REASONING_SERVICE_VERSION
  readonly integrationState: 'backend_read_only_candidate_not_publicly_wired'
  readonly publicRouteAvailable: false
  readonly dnaVersionPersistenceAllowed: false
  readonly deterministicDnaReplacementAllowed: false
  synthesize(input: EditReferencePreferenceDnaReasoningServiceInput): Promise<EditReferencePreferenceDnaReasoningResult>
}

export interface EditReferencePreferenceDnaReasoningServiceOptions {
  readonly repository: EditReferenceRepository
  readonly scope: EditReferenceRepositoryScope
  readonly provider?: EditReferencePreferenceDnaReasoningProvider
  readonly resolveReasoningRouteAuthorization?: EditReferenceReasoningRouteAuthorizationResolver<EditReferencePreferenceDnaReasoningRequest>
  readonly resolveReasoningProvider?: EditReferenceReasoningRouteProviderResolver<EditReferencePreferenceDnaReasoningProvider>
  readonly productionUsageAuthority?: EditReferencePreferenceDnaProductionUsageAuthority
  readonly now?: () => string
  readonly createExecutionId?: () => string
}

export interface PreparedEditReferencePreferenceDnaReasoning {
  readonly request: EditReferencePreferenceDnaReasoningRequest
  readonly structuredContext: QwenPreferenceDnaStructuredContext
  readonly requiredLayerIds: readonly PreferenceDNALayerId[]
}

const MAX_CONTEXT_CHARACTERS = 64_000
const MAX_EVIDENCE_ITEMS = 48
const MAX_EVIDENCE_SUMMARY_CHARACTERS = 700
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/

const GOAL_REQUIRED_LAYERS: Record<EditReferenceStudyGoal, readonly PreferenceDNALayerId[]> = {
  visual_language: ['visual_scene_language'],
  story_and_pacing: ['structure_story_flow', 'pacing_timing'],
  captions: ['speech_caption_behavior'],
  color: ['color_tone_space'],
  b_roll: ['broll_shot_language'],
  audio_and_sfx: ['music_soundsync', 'sfx_sound_design'],
  graphics: ['graphic_design_visualexplain', 'ui_document_card_treatment'],
}

export function createEditReferencePreferenceDnaReasoningService(
  options: EditReferencePreferenceDnaReasoningServiceOptions,
): EditReferencePreferenceDnaReasoningService {
  return {
    serviceVersion: EDIT_REFERENCE_PREFERENCE_DNA_REASONING_SERVICE_VERSION,
    integrationState: 'backend_read_only_candidate_not_publicly_wired',
    publicRouteAvailable: false,
    dnaVersionPersistenceAllowed: false,
    deterministicDnaReplacementAllowed: false,
    async synthesize(input) {
      validateEditReferencePreferenceDnaReasoningServiceInput(input)
      const aggregate = await options.repository.read(options.scope)
      const prepared = prepareEditReferencePreferenceDnaReasoning({ aggregate, scope: options.scope, input })
      const reasoningRouteAuthorization = prepared.request.executionScope === 'production'
        ? await resolveEditReferenceReasoningRouteAuthorizationFailClosed({
            resolver: options.resolveReasoningRouteAuthorization,
            request: prepared.request,
          })
        : undefined
      const provider = prepared.request.executionScope === 'production'
        ? await resolveEditReferenceReasoningRouteProviderFailClosed({
            authorization: reasoningRouteAuthorization,
            resolver: options.resolveReasoningProvider,
            qwenFallbackProvider: options.provider ?? createQwenPreferenceDnaReasoningProvider(),
          })
        : options.provider ?? createQwenPreferenceDnaReasoningProvider()
      if (prepared.request.executionScope === 'production' && (!reasoningRouteAuthorization || !provider)) {
        return createBlockedEditReferencePreferenceDnaReasoningResult({
          request: prepared.request,
          blockerCode: 'model_routing_unavailable',
          blockerMessage: 'The exact shared reasoning route or its authorized Preference DNA provider is unavailable.',
          retryAvailable: true,
          retryReason: reasoningRouteAuthorization
            ? getEditReferenceReasoningRouteRetryReason(reasoningRouteAuthorization.routeId)
            : 'Restore the exact Kimi-primary route/provider authority before retrying.',
        })
      }
      return createEditReferenceRoutedPreferenceDnaAdapter({
        provider: provider as EditReferencePreferenceDnaReasoningProvider,
        structuredContext: prepared.structuredContext,
        requiredLayerIds: prepared.requiredLayerIds,
        reasoningRouteAuthorization,
        expectedReasoningRouteId: reasoningRouteAuthorization?.routeId ?? 'qwen_3_7_fallback',
        productionUsageAuthority: options.productionUsageAuthority,
        now: options.now,
        createExecutionId: options.createExecutionId,
      }).synthesize(prepared.request)
    },
  }
}

export function prepareEditReferencePreferenceDnaReasoning(input: {
  readonly aggregate: EditReferenceAggregate | null | undefined
  readonly scope: EditReferenceRepositoryScope
  readonly input: EditReferencePreferenceDnaReasoningServiceInput
}): PreparedEditReferencePreferenceDnaReasoning {
  validateEditReferencePreferenceDnaReasoningServiceInput(input.input)
  const { aggregate } = input
  if (!aggregate) throw new PreferenceDnaReasoningServiceError('The private Edit Reference study does not exist.')
  if (aggregate.workspaceId !== input.scope.workspaceId || aggregate.ownerUserId !== input.scope.ownerUserId) {
    throw new PreferenceDnaReasoningServiceError('The private Preference DNA authority does not match the actor and workspace.')
  }
  const reference = aggregate.references.find((record) => record.id === input.input.editReferenceId)
  const study = aggregate.studies.find((record) => record.id === input.input.studySessionId)
  if (!reference || !study || study.editReferenceId !== reference.id || reference.currentStudyId !== study.id) {
    throw new PreferenceDnaReasoningServiceError('The requested Preference DNA study identity is invalid.')
  }
  if (reference.status === 'archived' || study.status === 'archived') {
    throw new PreferenceDnaReasoningServiceError('Archived studies cannot request Preference DNA reasoning.')
  }
  if (study.revision !== input.input.expectedStudyRevision) {
    throw new PreferenceDnaReasoningServiceError('The Preference DNA reasoning request is stale. Reload the current study revision.')
  }
  if (study.status !== 'evidence_ready' || study.evidenceStatus !== 'evidence_ready') {
    throw new PreferenceDnaReasoningServiceError('Preference DNA reasoning requires evidence that is ready for review.')
  }

  const contextResult = buildEditReferencePreferenceDnaStructuredContext({
    aggregate,
    studyId: study.id,
  })
  const request: EditReferencePreferenceDnaReasoningRequest = {
    schemaVersion: EDIT_REFERENCE_PREFERENCE_DNA_REASONING_REQUEST_VERSION,
    workspaceId: input.scope.workspaceId,
    actorUserId: input.scope.ownerUserId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    expectedStudyRevision: study.revision,
    inputEvidenceDigestSha256: contextResult.context.inputEvidenceDigestSha256,
    structuredContextDigestSha256: hashEditReferencePreferenceDnaStructuredContext(contextResult.context),
    maxContextCharacters: MAX_CONTEXT_CHARACTERS,
    executionScope: input.input.executionScope,
    approvedUsageEstimateId: input.input.approvedUsageEstimateId,
    internalCostBudgetId: input.input.internalCostBudgetId,
    immutableRateCardSnapshotId: input.input.immutableRateCardSnapshotId,
    maximumAuthorizedInternalCostMicros: input.input.maximumAuthorizedInternalCostMicros,
    rawMediaInputAllowed: false,
    rawFrameInputAllowed: false,
    rawTranscriptInputAllowed: false,
    projectChatHistoryInputAllowed: false,
    externalUrlFetchAllowed: false,
    evidenceMutationAllowed: false,
    dnaVersionPersistenceAllowed: false,
    deterministicDnaReplacementAllowed: false,
    qaBypassAllowed: false,
    approvalMutationAllowed: false,
    targetOperationCreationAllowed: false,
    exactReferenceTransferAllowed: false,
    customerPriceCalculationAllowed: false,
    customerCreditMutationAllowed: false,
    serviceFeeCalculationAllowed: false,
  }
  return {
    request,
    structuredContext: contextResult.context,
    requiredLayerIds: requiredLayerIds(study.initialGoals),
  }
}

export function buildEditReferencePreferenceDnaStructuredContext(input: {
  readonly aggregate: EditReferenceAggregate
  readonly studyId: string
}): {
  readonly context: QwenPreferenceDnaStructuredContext
  readonly selectedEvidenceIds: readonly string[]
} {
  const study = input.aggregate.studies.find((record) => record.id === input.studyId)
  if (!study) throw new PreferenceDnaReasoningServiceError('The Preference DNA reasoning source is incomplete.')
  const studyEvidence = input.aggregate.evidence.filter((record) => record.studySessionId === study.id)
  const supersededIds = new Set(studyEvidence
    .map((record) => record.supersedesEvidenceId)
    .filter((value): value is string => Boolean(value)))
  const activeEvidence = studyEvidence
    .filter((record) => !supersededIds.has(record.id))
    .sort((left, right) => (
      categoryPriority(left.category) - categoryPriority(right.category)
      || right.revision - left.revision
      || right.updatedAt.localeCompare(left.updatedAt)
      || left.id.localeCompare(right.id)
    ))
  const unsafeEvidence = activeEvidence.filter((record) => (
    !isSafeEditReferencePreferenceDnaReasoningText(record.summary, MAX_EVIDENCE_SUMMARY_CHARACTERS)
  ))
  const safeEvidence = activeEvidence.filter((record) => (
    isSafeEditReferencePreferenceDnaReasoningText(record.summary, MAX_EVIDENCE_SUMMARY_CHARACTERS)
  ))
  const selectedEvidence = safeEvidence.slice(0, MAX_EVIDENCE_ITEMS)
  const copySafetyEvidence = selectedEvidence.filter((record) => (
    record.category === 'copy_safety'
    && !['blocked', 'fallback'].includes(record.provenance.runtimeSource)
    && !['do_not_copy', 'unknown'].includes(record.transferability)
  ))
  if (!copySafetyEvidence.length) {
    throw new PreferenceDnaReasoningServiceError('Preference DNA reasoning requires completed copy-safety evidence.')
  }
  if (!selectedEvidence.some((record) => record.sourceType !== 'derived_skill_evidence')) {
    throw new PreferenceDnaReasoningServiceError('Preference DNA reasoning requires active source evidence.')
  }
  const inputEvidenceRevisions = selectedEvidence
    .map((record) => ({ evidenceId: record.id, revision: record.revision }))
    .sort((left, right) => left.evidenceId.localeCompare(right.evidenceId))
  const inputEvidenceDigestSha256 = sha256(stableStringify(inputEvidenceRevisions))
  const context: QwenPreferenceDnaStructuredContext = {
    schemaVersion: QWEN_PREFERENCE_DNA_STRUCTURED_CONTEXT_VERSION,
    initialGoals: [...study.initialGoals],
    inputEvidenceDigestSha256,
    evidenceItems: selectedEvidence.map((record) => ({
      evidenceId: record.id,
      revision: record.revision,
      category: record.category,
      sourceType: record.sourceType,
      summary: record.summary,
      confidence: record.confidence,
      transferability: record.transferability,
      requiresUserReview: ['requires_user_review', 'unknown', 'do_not_copy'].includes(record.transferability),
    })),
    layerCatalog: PREFERENCE_DNA_LAYER_REGISTRY.map((layer) => ({
      layerId: layer.layerId,
      title: layer.title,
      purpose: layer.purpose,
    })),
    deterministicSafetyRules: createDoNotCopyPreferenceRules(),
    omittedEvidence: {
      supersededCount: supersededIds.size,
      unsafeCount: unsafeEvidence.length,
      lowerPriorityCount: Math.max(0, safeEvidence.length - selectedEvidence.length),
    },
    boundaries: {
      evidenceIsUntrustedData: true,
      onlyCurrentStudyEvidenceAllowed: true,
      rawMediaAllowed: false,
      rawFramesAllowed: false,
      rawTranscriptAllowed: false,
      projectChatHistoryAllowed: false,
      externalUrlFetchAllowed: false,
      exactReferenceTransferAllowed: false,
      candidatePersistenceAllowed: false,
      deterministicDnaReplacementAllowed: false,
      deterministicQaRequired: true,
      exactVersionApprovalRequired: true,
      targetSpecificApplicationRequired: true,
      customerPriceCalculationAllowed: false,
      customerCreditMutationAllowed: false,
      serviceFeeCalculationAllowed: false,
    },
  }
  const parsed = qwenPreferenceDnaStructuredContextSchema.parse(context)
  if (JSON.stringify(parsed).length > MAX_CONTEXT_CHARACTERS) {
    throw new PreferenceDnaReasoningServiceError('The bounded Preference DNA context exceeds its private limit.')
  }
  return { context: parsed, selectedEvidenceIds: selectedEvidence.map((record) => record.id) }
}

export function validateEditReferencePreferenceDnaReasoningServiceInput(
  input: EditReferencePreferenceDnaReasoningServiceInput,
): void {
  if (
    !ID_PATTERN.test(input.editReferenceId)
    || !ID_PATTERN.test(input.studySessionId)
    || !Number.isSafeInteger(input.expectedStudyRevision)
    || input.expectedStudyRevision < 1
    || !['controlled_test', 'production'].includes(input.executionScope)
  ) throw new PreferenceDnaReasoningServiceError('The bounded Preference DNA reasoning input is invalid.')
}

function requiredLayerIds(goals: readonly EditReferenceStudyGoal[]): readonly PreferenceDNALayerId[] {
  return [...new Set<PreferenceDNALayerId>([
    'transferable_rules',
    'do_not_copy_rules',
    'edit_quality_preference',
    ...goals.flatMap((goal) => GOAL_REQUIRED_LAYERS[goal]),
  ])]
}

function categoryPriority(category: string): number {
  if (category === 'copy_safety') return 0
  if (category === 'all_goals') return 1
  if (category === 'media_structure') return 2
  return 3
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export class PreferenceDnaReasoningServiceError extends Error {
  readonly code = 'EDIT_REFERENCE_PREFERENCE_DNA_REASONING_SERVICE_ERROR'
}
