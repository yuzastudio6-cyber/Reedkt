import { callReeditProApi, getFrontendApiClientStatus } from '../backend/api/frontend-api-client'
import type { EditPlan, PlannerInput } from '../types/reeditpro'
import type { ApprovedEditExecutionUploadedMediaSourceAssetClientInput } from './approved-edit-execution-package-client'
import type { CanonicalEditJourney } from './canonical-edit-journey'
import {
  buildCanonicalPlanningDraft,
  type CanonicalPlanningDraft,
} from './canonical-planning-draft'
import {
  apiResponseInvalidatesProjectPersistenceScope,
  invalidateProjectPersistenceScope,
  type ProjectPersistenceScope,
} from './project-persistence-scope'

type ApiFailure = {
  statusCode?: number
  error?: { code?: string; message?: string }
  warnings: string[]
}

type CanonicalPlanningHandoffApiResponse = {
  canonicalPlanningHandoff?: unknown
}

type CanonicalPublicationRequestApiResponse = {
  canonicalPlanPublicationRequest?: unknown
}

type CanonicalRevisionPlanPresentationApiResponse = {
  canonicalRevisionPlanPresentation?: unknown
}

type ExactEditPreferenceApiResponse = {
  preferenceRecord?: unknown
  changedFields?: unknown
  invalidation?: unknown
  replayed?: unknown
}

type ExactEditPreferenceValues = {
  editLevel: PlannerInput['editLevel']
  workflowType: PlannerInput['workflowType']
  cleanupPreference: NonNullable<PlannerInput['cleanupPreference']>
  visualPreference: PlannerInput['visualPreference']
  moodStyle: PlannerInput['moodStyle']
  creditPreference: PlannerInput['creditPreference']
  targetPlatform: PlannerInput['targetPlatform']
}

type ExactEditPreferenceAuthority = {
  recordRevision: number
  preferenceRevision: number
  preferenceSnapshotId: string
  values: ExactEditPreferenceValues
}

type HandoffReceipt = {
  handoffId: string
  handoffHash: string
  canonicalPlanComponentsHash: string
}

type PublicationReceipt = {
  publicationStatus: 'pending_internal_publication' | 'published' | 'superseded_by_competing_candidate'
  presentedPlan?: {
    planId: string
    planVersion: number
    planHash: string
  }
}

export type CanonicalPlanningPublicationResult = {
  status:
    | 'not_configured'
    | 'blocked'
    | 'handoff_saved_waiting_for_compiler'
    | 'candidate_saved_pending_internal_publication'
    | 'plan_published_waiting_for_approval'
    | 'access_denied'
    | 'invalid_response'
    | 'unavailable'
  message: string
  retryable: boolean
  handoffSaved: boolean
  candidateSaved: boolean
  presentedPlan?: {
    planId: string
    planVersion: number
    planHash: string
  }
  publicationBlockers: string[]
  warnings: string[]
}

export type SaveCanonicalPlanningInput = {
  scope: ProjectPersistenceScope
  projectId: string
  editSessionId: string
  plan: EditPlan
  plannerInput: PlannerInput
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  revisionJourney?: CanonicalEditJourney
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
const SHA256 = /^[a-f0-9]{64}$/
const EXACT_EDIT_PREFERENCE_KEYS = [
  'editLevel', 'workflowType', 'cleanupPreference', 'visualPreference',
  'moodStyle', 'creditPreference', 'targetPlatform',
] as const satisfies readonly (keyof ExactEditPreferenceValues)[]
const EDIT_LEVELS = ['basic', 'pro', 'premium'] as const
const WORKFLOW_TYPES = [
  'simple_clean_edit', 'social_short_viral_clip', 'talking_head_personal_brand',
  'podcast_clip', 'vlog_lifestyle', 'product_demo', 'real_estate_property_tour',
  'education_explainer', 'marketing_ad', 'testimonial_case_study', 'custom_let_ai_decide',
] as const
const CLEANUP_PREFERENCES = [
  'preserve_natural', 'light_cleanup', 'balanced_cleanup', 'tight_retention_cleanup',
  'aggressive_cleanup', 'documentary_faithful', 'tutorial_complete', 'custom',
] as const
const VISUAL_PREFERENCES = [
  'let_ai_decide', 'keep_visuals_minimal', 'balanced_visual_mix', 'more_stroke_motion',
  'more_graphic_design', 'real_motion_if_useful', 'no_extra_visuals',
] as const
const MOOD_STYLES = [
  'clean', 'premium', 'cinematic', 'energetic', 'emotional', 'educational', 'luxury',
  'funny_playful', 'corporate', 'viral_fast_paced', 'let_ai_decide',
] as const
const CREDIT_PREFERENCES = ['low_credit_cost', 'balanced', 'premium_best_result', 'let_ai_estimate'] as const
const TARGET_PLATFORMS = ['tiktok_reels_shorts', 'youtube', 'website', 'course_training', 'client_review', 'custom'] as const
const inFlightCanonicalPlanningSaves = new Map<string, Promise<CanonicalPlanningPublicationResult>>()

export function saveCanonicalPlanningForNamedEdit(
  input: SaveCanonicalPlanningInput,
): Promise<CanonicalPlanningPublicationResult> {
  const compiled = buildCanonicalPlanningDraft({
    plan: input.plan,
    plannerInput: input.plannerInput,
    sourceMediaAssets: input.sourceMediaAssets,
  })
  if (!compiled.ok) {
    return Promise.resolve({
      status: 'blocked',
      message: compiled.errors[0] ?? 'Complete the required planning confirmations before saving this plan.',
      retryable: false,
      handoffSaved: false,
      candidateSaved: false,
      publicationBlockers: compiled.errors,
      warnings: [],
    })
  }

  const exactRequestIdentity = JSON.stringify({
    source: compiled.draft.orderedSourceItems,
    components: compiled.draft.components,
    publication: compiled.draft.publication?.planningRequestIdSeed ?? null,
    revision: input.revisionJourney?.stage === 'revision_requested'
      ? input.revisionJourney.privateReviewMediaAuthority ?? null
      : null,
  })
  const requestKey = [
    input.scope.authMode,
    input.scope.userId,
    input.scope.backendUserId ?? '',
    input.scope.workspaceId,
    input.projectId,
    input.editSessionId,
    exactRequestIdentity,
  ].join('\u001f')
  const existing = inFlightCanonicalPlanningSaves.get(requestKey)
  if (existing) return existing

  const request = performCanonicalPlanningSave(input, compiled.draft)
  inFlightCanonicalPlanningSaves.set(requestKey, request)
  void request.then(
    () => clearInFlightSave(requestKey, request),
    () => clearInFlightSave(requestKey, request),
  )
  return request
}

async function performCanonicalPlanningSave(
  input: SaveCanonicalPlanningInput,
  initialDraft: CanonicalPlanningDraft,
): Promise<CanonicalPlanningPublicationResult> {
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return {
      status: 'not_configured',
      message: 'Canonical plan saving is available when the reviewed private backend is connected.',
      retryable: false,
      handoffSaved: false,
      candidateSaved: false,
      publicationBlockers: initialDraft.publicationBlockers,
      warnings: runtime.warnings,
    }
  }

  const revisionAuthority = revisionJourneyAuthority(input)
  if (input.revisionJourney && !revisionAuthority) {
    return {
      status: 'blocked',
      message: 'Refresh the saved revision before preparing its replacement plan.',
      retryable: false,
      handoffSaved: false,
      candidateSaved: false,
      publicationBlockers: initialDraft.publicationBlockers,
      warnings: [],
    }
  }

  const preferenceAuthority = await synchronizeExactEditPreferenceAuthority(
    input,
    Boolean(revisionAuthority),
  )
  if (!preferenceAuthority.ok) {
    return withDraftBlockers(preferenceAuthority.failure, initialDraft)
  }
  const authorityCompiled = buildCanonicalPlanningDraft({
    plan: input.plan,
    plannerInput: {
      ...input.plannerInput,
      preferenceSnapshotId: preferenceAuthority.authority.preferenceSnapshotId,
      currentEditPreferenceRevision: preferenceAuthority.authority.preferenceRevision,
    },
    sourceMediaAssets: input.sourceMediaAssets,
  })
  if (!authorityCompiled.ok) {
    return {
      status: 'blocked',
      message: authorityCompiled.errors[0] ?? 'The exact saved preferences no longer match this plan.',
      retryable: false,
      handoffSaved: false,
      candidateSaved: false,
      publicationBlockers: authorityCompiled.errors,
      warnings: [],
    }
  }
  const draft = authorityCompiled.draft
  const exactAuthorityIdentity = JSON.stringify({
    source: draft.orderedSourceItems,
    components: draft.components,
    publication: draft.publication?.planningRequestIdSeed ?? null,
  })
  const requestDigest = stableClientDigest(exactAuthorityIdentity)

  if (revisionAuthority) {
    return performCanonicalRevisionPlanningSave(
      input,
      draft,
      revisionAuthority,
      requestDigest,
    )
  }

  const handoffResponse = await callReeditProApi<
    {
      workspaceId: string
      purpose: 'prepare_canonical_planning_handoff'
      orderedSourceItems: CanonicalPlanningDraft['orderedSourceItems']
      canonicalPlanComponents: CanonicalPlanningDraft['components']
    },
    CanonicalPlanningHandoffApiResponse
  >(
    'planning.canonicalHandoff.create',
    {
      workspaceId: input.scope.workspaceId,
      purpose: 'prepare_canonical_planning_handoff',
      orderedSourceItems: draft.orderedSourceItems,
      canonicalPlanComponents: draft.components,
    },
    {
      params: { projectId: input.projectId, editSessionId: input.editSessionId },
      context: {
        workspaceId: input.scope.workspaceId,
        projectId: input.projectId,
        userId: input.scope.backendUserId ?? input.scope.userId,
      },
      idempotencyKey: `canonical-handoff:${requestDigest}`,
    },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(handoffResponse)) {
    invalidateProjectPersistenceScope(input.scope)
  }
  const handoffFailure = classifyApiFailure(handoffResponse, false)
  if (handoffFailure) return withDraftBlockers(handoffFailure, draft)

  const handoff = parseHandoffReceipt(
    handoffResponse.data?.canonicalPlanningHandoff,
    input.scope.workspaceId,
    input.projectId,
    input.editSessionId,
  )
  if (!handoff) {
    return result('invalid_response', 'The private backend returned an inconsistent planning handoff.', false, false, false, draft, handoffResponse.warnings)
  }

  if (!draft.publication) {
    return result(
      'handoff_saved_waiting_for_compiler',
      'Your exact planning inputs are saved. This edit still needs an execution graph that represents every planned operation.',
      false,
      true,
      false,
      draft,
      handoffResponse.warnings,
    )
  }

  const planningRequestId = safePlanningRequestId(draft.publication.planningRequestIdSeed, requestDigest)
  const publicationResponse = await callReeditProApi<
    {
      workspaceId: string
      planningRequestId: string
      expectedHandoffHash: string
      canonicalPlan: CanonicalPlanningDraft['publication'] extends infer T
        ? T extends { canonicalPlan: infer P } ? P : never
        : never
    },
    CanonicalPublicationRequestApiResponse
  >(
    'planning.canonicalPlanPresentation.create',
    {
      workspaceId: input.scope.workspaceId,
      planningRequestId,
      expectedHandoffHash: handoff.handoffHash,
      canonicalPlan: draft.publication.canonicalPlan,
    },
    {
      params: {
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        handoffId: handoff.handoffId,
      },
      context: {
        workspaceId: input.scope.workspaceId,
        projectId: input.projectId,
        userId: input.scope.backendUserId ?? input.scope.userId,
      },
      idempotencyKey: `canonical-plan-presentation:${requestDigest}`,
    },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(publicationResponse)) {
    invalidateProjectPersistenceScope(input.scope)
  }
  const publicationFailure = classifyApiFailure(publicationResponse, true)
  if (publicationFailure) {
    return {
      ...withDraftBlockers(publicationFailure, draft),
      handoffSaved: true,
    }
  }

  const publication = parsePublicationReceipt(
    publicationResponse.data?.canonicalPlanPublicationRequest,
    input.scope.workspaceId,
    input.projectId,
    input.editSessionId,
    handoff,
  )
  if (!publication) {
    return result('invalid_response', 'The private backend returned an inconsistent publication request.', false, true, false, draft, publicationResponse.warnings)
  }
  if (publication.publicationStatus === 'superseded_by_competing_candidate') {
    return result('blocked', 'A newer saved plan already replaced this publication request. Refresh the edit before continuing.', false, true, false, draft, publicationResponse.warnings)
  }
  if (publication.publicationStatus === 'published') {
    return result(
      'plan_published_waiting_for_approval',
      'The canonical plan is saved and ready for the separate approval and credit review step.',
      false,
      true,
      true,
      draft,
      [...handoffResponse.warnings, ...publicationResponse.warnings],
      publication.presentedPlan,
    )
  }
  return result(
    'candidate_saved_pending_internal_publication',
    'The exact execution candidate is saved and waiting for private internal publication checks.',
    true,
    true,
    true,
    draft,
    [...handoffResponse.warnings, ...publicationResponse.warnings],
  )
}

type RevisionJourneyAuthority = {
  packageRecordId: string
  reviewAssemblyId: string
  expectedDecisionManifestSha256: string
  expectedFinalArtifactSha256: string
}

function revisionJourneyAuthority(
  input: SaveCanonicalPlanningInput,
): RevisionJourneyAuthority | null {
  if (!input.revisionJourney) return null
  const journey = input.revisionJourney
  const authority = journey.privateReviewMediaAuthority
  if (
    journey.identity.workspaceId !== input.scope.workspaceId ||
    journey.identity.projectId !== input.projectId ||
    journey.identity.editSessionId !== input.editSessionId ||
    journey.stage !== 'revision_requested' ||
    journey.review?.decision !== 'request_revision' ||
    journey.review.decisionStatus !== 'canonical_revision_requested' ||
    authority?.mode !== 'history' ||
    !isSafeId(authority.packageRecordId) ||
    !isSafeId(authority.reviewAssemblyId) ||
    !isSha(authority.expectedDecisionManifestSha256) ||
    !isSha(authority.expectedFinalArtifactSha256)
  ) return null
  return {
    packageRecordId: authority.packageRecordId,
    reviewAssemblyId: authority.reviewAssemblyId,
    expectedDecisionManifestSha256: authority.expectedDecisionManifestSha256,
    expectedFinalArtifactSha256: authority.expectedFinalArtifactSha256,
  }
}

async function performCanonicalRevisionPlanningSave(
  input: SaveCanonicalPlanningInput,
  draft: CanonicalPlanningDraft,
  revisionAuthority: RevisionJourneyAuthority,
  requestDigest: string,
): Promise<CanonicalPlanningPublicationResult> {
  if (!draft.publication) {
    return result(
      'blocked',
      draft.publicationBlockers[0] ??
        'The revised plan still needs an exact private execution graph before it can be presented.',
      false,
      false,
      false,
      draft,
      draft.warnings,
    )
  }

  const response = await callReeditProApi<
    {
      workspaceId: string
      expectedPackageRecordId: string
      expectedReviewAssemblyId: string
      expectedDecisionManifestSha256: string
      expectedFinalArtifactSha256: string
      purpose: 'present_canonical_revision_plan'
      orderedSourceItems: CanonicalPlanningDraft['orderedSourceItems']
      canonicalPlan: NonNullable<CanonicalPlanningDraft['publication']>['canonicalPlan']
    },
    CanonicalRevisionPlanPresentationApiResponse
  >(
    'planning.canonicalRevisionPlanPresentation.create',
    {
      workspaceId: input.scope.workspaceId,
      expectedPackageRecordId: revisionAuthority.packageRecordId,
      expectedReviewAssemblyId: revisionAuthority.reviewAssemblyId,
      expectedDecisionManifestSha256:
        revisionAuthority.expectedDecisionManifestSha256,
      expectedFinalArtifactSha256: revisionAuthority.expectedFinalArtifactSha256,
      purpose: 'present_canonical_revision_plan',
      orderedSourceItems: draft.orderedSourceItems,
      canonicalPlan: draft.publication.canonicalPlan,
    },
    {
      params: {
        projectId: input.projectId,
        editSessionId: input.editSessionId,
      },
      context: {
        workspaceId: input.scope.workspaceId,
        projectId: input.projectId,
        userId: input.scope.backendUserId ?? input.scope.userId,
      },
      idempotencyKey: `canonical-revision-plan-presentation:${requestDigest}`,
    },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(input.scope)
  }
  const failure = classifyApiFailure(response, false)
  if (failure) return withDraftBlockers(failure, draft)
  const receipt = parseRevisionPlanPresentationReceipt(
    response.data?.canonicalRevisionPlanPresentation,
    input,
    revisionAuthority,
  )
  if (!receipt) {
    return result(
      'invalid_response',
      'The revised plan response could not be matched to this exact saved revision.',
      false,
      false,
      false,
      draft,
      response.warnings,
    )
  }
  return result(
    'plan_published_waiting_for_approval',
    `Revised plan v${receipt.planVersion} and its fresh estimate are ready for review. The previous approval was not reused.`,
    false,
    true,
    true,
    draft,
    response.warnings,
    {
      planId: receipt.planId,
      planVersion: receipt.planVersion,
      planHash: receipt.planHash,
    },
  )
}

async function synchronizeExactEditPreferenceAuthority(
  input: SaveCanonicalPlanningInput,
  allowLockedExactReuse = false,
): Promise<
  | { ok: true; authority: ExactEditPreferenceAuthority }
  | { ok: false; failure: CanonicalPlanningPublicationResult }
> {
  const desiredValues = desiredExactEditPreferenceValues(input.plannerInput)
  if (!desiredValues) {
    return {
      ok: false,
      failure: preferenceSynchronizationFailure(
        'blocked',
        'Confirm the current cleanup preference before saving this plan.',
        false,
      ),
    }
  }

  const readResponse = await callReeditProApi<undefined, ExactEditPreferenceApiResponse>(
    'planning.exactEditPreferences.get',
    undefined,
    {
      params: { projectId: input.projectId, editSessionId: input.editSessionId },
      query: { workspaceId: input.scope.workspaceId },
    },
  )
  if (apiResponseInvalidatesProjectPersistenceScope(readResponse)) {
    invalidateProjectPersistenceScope(input.scope)
  }
  const readFailure = classifyApiFailure(readResponse, false)
  if (readFailure) return { ok: false, failure: readFailure }
  const readData = exactRecord(readResponse.data, ['preferenceRecord'])
  const current = parseExactEditPreferenceAuthority(
    readData?.preferenceRecord,
    input.scope.workspaceId,
    input.projectId,
    input.editSessionId,
  )
  if (!current) {
    return {
      ok: false,
      failure: preferenceSynchronizationFailure(
        'invalid_response',
        'The exact saved preferences could not be safely matched to this edit.',
        false,
        readResponse.warnings,
      ),
    }
  }
  const patch = exactEditPreferencePatch(current.values, desiredValues)
  if (current.locked && (!allowLockedExactReuse || Object.keys(patch).length > 0)) {
    return {
      ok: false,
      failure: preferenceSynchronizationFailure(
        'blocked',
        allowLockedExactReuse
          ? 'This revision changes locked Edit Preferences. Keep the approved values for this bounded revision, or start a separately authorized structural replan.'
          : 'This edit already has locked approved preference authority. Request a revision before changing it.',
        false,
        readResponse.warnings,
      ),
    }
  }
  if (current.locked) {
    return { ok: true, authority: current }
  }
  if (Object.keys(patch).length === 0) {
    return { ok: true, authority: current }
  }

  const patchIdentity = JSON.stringify({
    workspaceId: input.scope.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    expectedRevision: current.recordRevision,
    patch,
  })
  const updateResponse = await callReeditProApi<
    { workspaceId: string; expectedRevision: number; patch: Partial<ExactEditPreferenceValues> },
    ExactEditPreferenceApiResponse
  >(
    'planning.exactEditPreferences.update',
    {
      workspaceId: input.scope.workspaceId,
      expectedRevision: current.recordRevision,
      patch,
    },
    {
      params: { projectId: input.projectId, editSessionId: input.editSessionId },
      context: {
        workspaceId: input.scope.workspaceId,
        projectId: input.projectId,
        userId: input.scope.backendUserId ?? input.scope.userId,
      },
      idempotencyKey: `exact-edit-preferences:${stableClientDigest(patchIdentity)}`,
    },
  )
  if (apiResponseInvalidatesProjectPersistenceScope(updateResponse)) {
    invalidateProjectPersistenceScope(input.scope)
  }
  const updateFailure = classifyApiFailure(updateResponse, false)
  if (updateFailure) return { ok: false, failure: updateFailure }
  const updateData = recordWithAllowedKeys(
    updateResponse.data,
    ['preferenceRecord', 'changedFields', 'replayed'],
    ['invalidation'],
  )
  const changedFields = updateData?.changedFields
  const updated = parseExactEditPreferenceAuthority(
    updateData?.preferenceRecord,
    input.scope.workspaceId,
    input.projectId,
    input.editSessionId,
  )
  if (!updated || updateData?.replayed !== false && updateData?.replayed !== true ||
      !Array.isArray(changedFields) || changedFields.some((field) => !EXACT_EDIT_PREFERENCE_KEYS.includes(String(field) as keyof ExactEditPreferenceValues)) ||
      !exactPreferenceValuesEqual(updated.values, desiredValues)) {
    return {
      ok: false,
      failure: preferenceSynchronizationFailure(
        'invalid_response',
        'The updated exact preferences could not be safely verified.',
        false,
        updateResponse.warnings,
      ),
    }
  }
  return { ok: true, authority: updated }
}

function desiredExactEditPreferenceValues(plannerInput: PlannerInput): ExactEditPreferenceValues | null {
  if (!plannerInput.cleanupPreference) return null
  return {
    editLevel: plannerInput.editLevel,
    workflowType: plannerInput.workflowType,
    cleanupPreference: plannerInput.cleanupPreference,
    visualPreference: plannerInput.visualPreference,
    moodStyle: plannerInput.moodStyle,
    creditPreference: plannerInput.creditPreference,
    targetPlatform: plannerInput.targetPlatform,
  }
}

function exactEditPreferencePatch(
  current: ExactEditPreferenceValues,
  desired: ExactEditPreferenceValues,
): Partial<ExactEditPreferenceValues> {
  const patch: Partial<ExactEditPreferenceValues> = {}
  for (const key of EXACT_EDIT_PREFERENCE_KEYS) {
    if (current[key] !== desired[key]) {
      Object.assign(patch, { [key]: desired[key] })
    }
  }
  return patch
}

function parseExactEditPreferenceAuthority(
  value: unknown,
  workspaceId: string,
  projectId: string,
  editSessionId: string,
): (ExactEditPreferenceAuthority & { locked: boolean }) | null {
  const record = exactRecord(value, [
    'schemaVersion', 'workspaceId', 'projectId', 'editSessionId', 'baseline', 'values',
    'overrideKeys', 'recordRevision', 'preferenceRevision', 'preferenceUpdatedAt', 'planning',
    'lifecycle', 'auditSummary', 'createdAt', 'updatedAt', 'privateInternalOnly',
  ])
  if (!record || record.schemaVersion !== 'private-exact-edit-preferences-v1' ||
      record.workspaceId !== workspaceId || record.projectId !== projectId || record.editSessionId !== editSessionId ||
      record.privateInternalOnly !== true || containsForbiddenPrivateMaterial(record)) return null
  const baseline = exactRecord(record.baseline, [
    'values', 'preferenceSnapshotId', 'capturedAt', 'persistenceSource', 'provenance',
  ])
  const values = parseExactEditPreferenceValues(record.values)
  const lifecycle = recordWithAllowedKeys(record.lifecycle, ['phase', 'locked'], ['authorityReferenceId', 'lockedAt'])
  const planning = recordWithAllowedKeys(
    record.planning,
    ['planningInputRevision', 'preferenceFingerprintSha256', 'replanRequired', 'reestimateRequired', 'sourcePreparation', 'frameConfirmation'],
    ['draftPlan', 'draftEstimate', 'lastInvalidation'],
  )
  const auditSummary = exactRecord(record.auditSummary, ['eventCount', 'latestEventAt'])
  if (!baseline || !parseExactEditPreferenceValues(baseline.values) || !isSafeId(baseline.preferenceSnapshotId) ||
      !values || !lifecycle || typeof lifecycle.locked !== 'boolean' || !isSafeId(lifecycle.phase) || !planning || !auditSummary ||
      !Number.isInteger(record.recordRevision) || Number(record.recordRevision) < 0 ||
      !Number.isInteger(record.preferenceRevision) || Number(record.preferenceRevision) < 0 ||
      !Array.isArray(record.overrideKeys) || record.overrideKeys.some((key) => !EXACT_EDIT_PREFERENCE_KEYS.includes(String(key) as keyof ExactEditPreferenceValues))) return null
  return {
    recordRevision: Number(record.recordRevision),
    preferenceRevision: Number(record.preferenceRevision),
    preferenceSnapshotId: baseline.preferenceSnapshotId,
    values,
    locked: lifecycle.locked,
  }
}

function parseExactEditPreferenceValues(value: unknown): ExactEditPreferenceValues | null {
  const record = exactRecord(value, [...EXACT_EDIT_PREFERENCE_KEYS])
  if (!record || !EDIT_LEVELS.includes(record.editLevel as ExactEditPreferenceValues['editLevel']) ||
      !WORKFLOW_TYPES.includes(record.workflowType as ExactEditPreferenceValues['workflowType']) ||
      !CLEANUP_PREFERENCES.includes(record.cleanupPreference as ExactEditPreferenceValues['cleanupPreference']) ||
      !VISUAL_PREFERENCES.includes(record.visualPreference as ExactEditPreferenceValues['visualPreference']) ||
      !MOOD_STYLES.includes(record.moodStyle as ExactEditPreferenceValues['moodStyle']) ||
      !CREDIT_PREFERENCES.includes(record.creditPreference as ExactEditPreferenceValues['creditPreference']) ||
      !TARGET_PLATFORMS.includes(record.targetPlatform as ExactEditPreferenceValues['targetPlatform'])) return null
  return record as ExactEditPreferenceValues
}

function exactPreferenceValuesEqual(left: ExactEditPreferenceValues, right: ExactEditPreferenceValues): boolean {
  return EXACT_EDIT_PREFERENCE_KEYS.every((key) => left[key] === right[key])
}

function preferenceSynchronizationFailure(
  status: CanonicalPlanningPublicationResult['status'],
  message: string,
  retryable: boolean,
  warnings: string[] = [],
): CanonicalPlanningPublicationResult {
  return {
    status,
    message,
    retryable,
    handoffSaved: false,
    candidateSaved: false,
    publicationBlockers: [],
    warnings,
  }
}

function parseHandoffReceipt(
  value: unknown,
  workspaceId: string,
  projectId: string,
  editSessionId: string,
): HandoffReceipt | null {
  const record = exactRecord(value, [
    'schemaVersion', 'source', 'identity', 'canonicalPlanComponentsHash',
    'sourceBindingManifestCandidate', 'sourceMediaAuthority', 'planningInputAuthority',
    'resolvedPlanningInputAuthority', 'readiness', 'handoffHash', 'handoffId', 'persistence',
    'noPlanPublished', 'noSnapshotCreated', 'noCreditReservation', 'noToolExecution',
    'noProviderCall', 'noRender', 'testOnly',
  ])
  if (!record || record.schemaVersion !== 'canonical-planning-handoff-response-v1' ||
      record.source !== 'canonical_planning_handoff_service' || containsForbiddenPrivateMaterial(record)) return null
  const identity = exactRecord(record.identity, ['workspaceId', 'projectId', 'editSessionId'])
  const readiness = exactRecord(record.readiness, [
    'finalizedSourceMediaVerified', 'exactEditPreferencesVerified', 'preferenceApplicationVerified',
    'editBriefVerified', 'outputFrameAndCleanupVerified', 'readyForCanonicalPlanPublication',
  ])
  const persistence = exactRecord(record.persistence, [
    'privateLocal', 'tenantScoped', 'createOnly', 'checksumProtected', 'contentAddressed',
    'distributed', 'productionAuthority',
  ])
  if (!identity || identity.workspaceId !== workspaceId || identity.projectId !== projectId || identity.editSessionId !== editSessionId ||
      !allLiteral(readiness, true) || !persistence || persistence.privateLocal !== true || persistence.tenantScoped !== true ||
      persistence.createOnly !== true || persistence.checksumProtected !== true || persistence.contentAddressed !== true ||
      persistence.distributed !== false || persistence.productionAuthority !== false ||
      record.noPlanPublished !== true || record.noSnapshotCreated !== true || record.noCreditReservation !== true ||
      record.noToolExecution !== true || record.noProviderCall !== true || record.noRender !== true || record.testOnly !== true ||
      !isSafeId(record.handoffId) || !isSha(record.handoffHash) || !isSha(record.canonicalPlanComponentsHash) ||
      !isRecord(record.sourceBindingManifestCandidate) || !isRecord(record.sourceMediaAuthority) ||
      !isRecord(record.planningInputAuthority) || !isRecord(record.resolvedPlanningInputAuthority)) return null
  return {
    handoffId: record.handoffId,
    handoffHash: record.handoffHash,
    canonicalPlanComponentsHash: record.canonicalPlanComponentsHash,
  }
}

function parsePublicationReceipt(
  value: unknown,
  workspaceId: string,
  projectId: string,
  editSessionId: string,
  handoff: HandoffReceipt,
): PublicationReceipt | null {
  const record = exactRecord(value, [
    'schemaVersion', 'source', 'identity', 'candidateHash', 'handoffHash',
    'canonicalPlanComponentsHash', 'publicationBodyHash', 'publicationRequestHash',
    'persistence', 'permissions', 'requestBodyReturned', 'pathOrCredentialReturned',
    'testOnly', 'publicationStatus', 'publication',
  ])
  if (!record || record.schemaVersion !== 'canonical-plan-publication-request-inspection-v1' ||
      record.source !== 'canonical_plan_publication_request_service' || containsForbiddenPrivateMaterial(record)) return null
  const identity = exactRecord(record.identity, ['workspaceId', 'projectId', 'editSessionId', 'handoffId', 'candidateId'])
  const persistence = exactRecord(record.persistence, [
    'privateLocal', 'tenantScoped', 'createOnly', 'checksumProtected', 'contentAddressed',
    'distributed', 'productionAuthority',
  ])
  const permissions = exactRecord(record.permissions, [
    'inspectionOnly', 'internalPublicationRequired', 'planMutation', 'snapshotCreation',
    'creditReservation', 'toolExecution', 'providerCall', 'render',
  ])
  const status = record.publicationStatus
  if (!identity || identity.workspaceId !== workspaceId || identity.projectId !== projectId ||
      identity.editSessionId !== editSessionId || identity.handoffId !== handoff.handoffId || !isSafeId(identity.candidateId) ||
      record.handoffHash !== handoff.handoffHash || record.canonicalPlanComponentsHash !== handoff.canonicalPlanComponentsHash ||
      !isSha(record.candidateHash) || !isSha(record.publicationBodyHash) || !isSha(record.publicationRequestHash) ||
      !persistence || persistence.privateLocal !== true || persistence.tenantScoped !== true || persistence.createOnly !== true ||
      persistence.checksumProtected !== true || persistence.contentAddressed !== true || persistence.distributed !== false ||
      persistence.productionAuthority !== false || !permissions || permissions.inspectionOnly !== true ||
      permissions.internalPublicationRequired !== true || permissions.planMutation !== false ||
      permissions.snapshotCreation !== false || permissions.creditReservation !== false || permissions.toolExecution !== false ||
      permissions.providerCall !== false || permissions.render !== false || record.requestBodyReturned !== false ||
      record.pathOrCredentialReturned !== false || record.testOnly !== true ||
      !['pending_internal_publication', 'published', 'superseded_by_competing_candidate'].includes(String(status)) ||
      !validPublicationProjection(status, record.publication)) return null
  if (status === 'published') {
    const published = exactRecord(record.publication, [
      'planId', 'planningRequestId', 'planVersion', 'planStatus', 'planHash',
      'internalPublicationMayBeAttempted', 'fullRevalidationRequired', 'exactReplayOnlyAfterPublication',
    ])!
    return {
      publicationStatus: 'published',
      presentedPlan: {
        planId: published.planId as string,
        planVersion: Number(published.planVersion),
        planHash: published.planHash as string,
      },
    }
  }
  return { publicationStatus: status as PublicationReceipt['publicationStatus'] }
}

function parseRevisionPlanPresentationReceipt(
  value: unknown,
  input: SaveCanonicalPlanningInput,
  expected: RevisionJourneyAuthority,
): { planId: string; planVersion: number; planHash: string } | null {
  const root = exactRecord(value, [
    'schemaVersion', 'source', 'purpose', 'disposition', 'identity',
    'replacementPlan', 'authority', 'boundaries', 'persistence',
    'rawRevisionAuthorityReturned', 'jobOrToolDetailsReturned',
    'pathOrCredentialReturned', 'replayed', 'testOnly',
  ])
  if (
    !root ||
    root.schemaVersion !== 'canonical-revision-plan-presentation-receipt-v1' ||
    root.source !== 'canonical_revision_plan_presentation_coordinator_service' ||
    root.purpose !== 'present_canonical_revision_plan' ||
    root.disposition !== 'replacement_plan_presented' ||
    root.rawRevisionAuthorityReturned !== false ||
    root.jobOrToolDetailsReturned !== false ||
    root.pathOrCredentialReturned !== false ||
    typeof root.replayed !== 'boolean' ||
    root.testOnly !== true ||
    containsForbiddenPrivateMaterial(root)
  ) return null
  const identity = exactRecord(root.identity, [
    'workspaceId', 'projectId', 'editSessionId', 'reviewAssemblyId',
  ])
  const replacementPlan = exactRecord(root.replacementPlan, [
    'planId', 'planVersion', 'planHash', 'priorPlanVersion',
    'freshEstimatePresented', 'freshApprovalRequired',
  ])
  const authority = exactRecord(root.authority, [
    'exactRevisionDecisionRevalidated', 'immutablePriorSnapshotPreserved',
    'immutablePriorReviewPreserved',
    'lockedPreferenceEvidenceReusedWithoutMutation',
  ])
  const boundaries = exactRecord(root.boundaries, [
    'approvalRecorded', 'snapshotCreated', 'creditReservationMutated',
    'customerWalletMutated', 'workGraphStarted', 'toolExecutionStarted',
    'providerCallStarted', 'renderStarted', 'billingStarted',
    'publicDeliveryStarted',
  ])
  const persistence = exactRecord(root.persistence, [
    'privateLocal', 'tenantScoped', 'distributed', 'productionAuthority',
  ])
  const priorVersion = replacementPlan?.priorPlanVersion
  const nextVersion = replacementPlan?.planVersion
  if (
    !identity ||
    identity.workspaceId !== input.scope.workspaceId ||
    identity.projectId !== input.projectId ||
    identity.editSessionId !== input.editSessionId ||
    identity.reviewAssemblyId !== expected.reviewAssemblyId ||
    !replacementPlan ||
    !isSafeId(replacementPlan.planId) ||
    !Number.isInteger(priorVersion) ||
    Number(priorVersion) < 1 ||
    !Number.isInteger(nextVersion) ||
    Number(nextVersion) !== Number(priorVersion) + 1 ||
    input.revisionJourney?.plan?.version !== Number(priorVersion) ||
    !isSha(replacementPlan.planHash) ||
    replacementPlan.freshEstimatePresented !== true ||
    replacementPlan.freshApprovalRequired !== true ||
    !allLiteral(authority, true) ||
    !allLiteral(boundaries, false) ||
    !persistence ||
    persistence.privateLocal !== true ||
    persistence.tenantScoped !== true ||
    persistence.distributed !== false ||
    persistence.productionAuthority !== false
  ) return null
  return {
    planId: replacementPlan.planId,
    planVersion: Number(nextVersion),
    planHash: replacementPlan.planHash,
  }
}

function validPublicationProjection(status: unknown, value: unknown): boolean {
  if (status === 'pending_internal_publication') {
    const publication = exactRecord(value, ['internalPublicationMayBeAttempted', 'fullRevalidationRequired', 'exactReplayOnlyAfterPublication'])
    return Boolean(publication && publication.internalPublicationMayBeAttempted === true &&
      publication.fullRevalidationRequired === true && publication.exactReplayOnlyAfterPublication === true)
  }
  if (status === 'superseded_by_competing_candidate') {
    const publication = exactRecord(value, ['internalPublicationMayBeAttempted', 'fullRevalidationRequired', 'exactReplayOnlyAfterPublication'])
    return Boolean(publication && publication.internalPublicationMayBeAttempted === false &&
      publication.fullRevalidationRequired === true && publication.exactReplayOnlyAfterPublication === false)
  }
  if (status === 'published') {
    const publication = exactRecord(value, [
      'planId', 'planningRequestId', 'planVersion', 'planStatus', 'planHash',
      'internalPublicationMayBeAttempted', 'fullRevalidationRequired', 'exactReplayOnlyAfterPublication',
    ])
    return Boolean(publication && isSafeId(publication.planId) && isSafeId(publication.planningRequestId) &&
      Number.isInteger(publication.planVersion) && Number(publication.planVersion) > 0 && isSafeId(publication.planStatus) &&
      isSha(publication.planHash) && publication.internalPublicationMayBeAttempted === false &&
      publication.fullRevalidationRequired === true && publication.exactReplayOnlyAfterPublication === true)
  }
  return false
}

function classifyApiFailure(
  response: ApiFailure & { ok?: boolean },
  handoffSaved: boolean,
): CanonicalPlanningPublicationResult | null {
  if (response.ok) return null
  const code = response.error?.code
  if (response.statusCode === 401 || response.statusCode === 403 ||
      ['AUTH_REQUIRED', 'AUTH_INVALID', 'WORKSPACE_ACCESS_DENIED'].includes(code ?? '')) {
    return {
      status: 'access_denied',
      message: 'This plan cannot be saved outside the current signed-in workspace.',
      retryable: false,
      handoffSaved,
      candidateSaved: false,
      publicationBlockers: [],
      warnings: response.warnings,
    }
  }
  if ([
    'VALIDATION_FAILED', 'IDEMPOTENCY_CONFLICT', 'INVALID_STORED_STATE', 'INTEGRITY_CHECK_FAILED',
    'PLAN_NOT_APPROVED', 'JOB_DEPENDENCY_NOT_READY', 'UPLOAD_NOT_FINALIZED', 'TOOL_NOT_READY',
  ].includes(code ?? '')) {
    return {
      status: 'blocked',
      message: 'The saved edit state changed or no longer matches this plan. Refresh the edit and create a new plan.',
      retryable: false,
      handoffSaved,
      candidateSaved: false,
      publicationBlockers: [],
      warnings: response.warnings,
    }
  }
  if (['invalid_backend_response', 'invalid_json_response'].includes(code ?? '')) {
    return {
      status: 'invalid_response',
      message: 'The private backend response could not be safely verified.',
      retryable: false,
      handoffSaved,
      candidateSaved: false,
      publicationBlockers: [],
      warnings: response.warnings,
    }
  }
  return {
    status: 'unavailable',
    message: 'The private backend could not finish saving this plan. Your approval and credits were not changed.',
    retryable: true,
    handoffSaved,
    candidateSaved: false,
    publicationBlockers: [],
    warnings: response.warnings,
  }
}

function withDraftBlockers(
  failure: CanonicalPlanningPublicationResult,
  draft: CanonicalPlanningDraft,
): CanonicalPlanningPublicationResult {
  return { ...failure, publicationBlockers: draft.publicationBlockers }
}

function result(
  status: CanonicalPlanningPublicationResult['status'],
  message: string,
  retryable: boolean,
  handoffSaved: boolean,
  candidateSaved: boolean,
  draft: CanonicalPlanningDraft,
  warnings: string[],
  presentedPlan?: CanonicalPlanningPublicationResult['presentedPlan'],
): CanonicalPlanningPublicationResult {
  return {
    status,
    message,
    retryable,
    handoffSaved,
    candidateSaved,
    presentedPlan,
    publicationBlockers: draft.publicationBlockers,
    warnings,
  }
}

function exactRecord(value: unknown, keys: string[]): Record<string, unknown> | null {
  if (!isRecord(value)) return null
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]) ? value : null
}

function recordWithAllowedKeys(
  value: unknown,
  requiredKeys: string[],
  optionalKeys: string[],
): Record<string, unknown> | null {
  if (!isRecord(value)) return null
  const actual = Object.keys(value)
  const allowed = new Set([...requiredKeys, ...optionalKeys])
  return requiredKeys.every((key) => actual.includes(key)) && actual.every((key) => allowed.has(key))
    ? value
    : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function allLiteral(value: Record<string, unknown> | null, literal: boolean): boolean {
  return Boolean(value && Object.values(value).every((entry) => entry === literal))
}

function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 200 && value === value.trim() && SAFE_ID.test(value) && !value.includes('..')
}

function isSha(value: unknown): value is string {
  return typeof value === 'string' && SHA256.test(value)
}

function containsForbiddenPrivateMaterial(value: unknown, key = ''): boolean {
  if (key === 'pathOrCredentialReturned' || key === 'requestBodyReturned') return value !== false
  if (/^(?:secret|credential|accessToken|refreshToken|signedUrl|publicUrl|localPath|absolutePath|relativePath|sourceBytes|bytesBase64|requestBody)$/i.test(key)) return true
  if (Array.isArray(value)) return value.some((entry) => containsForbiddenPrivateMaterial(entry))
  if (isRecord(value)) return Object.entries(value).some(([childKey, child]) => containsForbiddenPrivateMaterial(child, childKey))
  return false
}

function safePlanningRequestId(seed: string, digest: string): string {
  const normalized = seed.replace(/[^A-Za-z0-9._:-]+/g, '-').replace(/\.{2,}/g, '.').slice(0, 120)
  const candidate = `browser-plan-${normalized || digest}`.replace(/[-.]+$/g, '')
  return isSafeId(candidate) ? candidate : `browser-plan-${digest}`
}

function stableClientDigest(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function clearInFlightSave(
  key: string,
  request: Promise<CanonicalPlanningPublicationResult>,
) {
  if (inFlightCanonicalPlanningSaves.get(key) === request) {
    inFlightCanonicalPlanningSaves.delete(key)
  }
}
