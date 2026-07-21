import {
  callReeditProApi,
  getFrontendApiClientStatus,
} from '../backend/api/frontend-api-client'
import type {
  EditReferenceProductionExactEditApplyApiReceipt,
  EditReferenceProductionExactEditApplyAuthorityRead,
  EditReferenceProductionExactEditApplyOperation,
  EditReferenceProductionExactEditPreferencePatch,
  EditReferenceProductionExactEditPreferenceValues,
  EditReferenceProductionExactEditOutputFrameAuthoritySnapshot,
  EditReferenceProductionPreparedApplicationAuthority,
} from '../types/edit-reference-production-exact-edit-apply-api'
import {
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_VERSION,
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_OPERATION_VERSION,
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RECEIPT_VERSION,
  EDIT_REFERENCE_PRODUCTION_PREPARED_APPLICATION_AUTHORITY_VERSION,
} from '../types/edit-reference-production-exact-edit-apply-api'
import type { ProjectPersistenceScope } from './project-persistence-scope'
import {
  apiResponseInvalidatesProjectPersistenceScope,
  invalidateProjectPersistenceScope,
} from './project-persistence-scope'

export type ExactEditPreferenceApplyClientFailure = {
  readonly ok: false
  readonly status: 'not_configured' | 'access_denied' | 'stale' | 'blocked' | 'unavailable' | 'invalid_response'
  readonly retryable: boolean
  readonly message: string
  readonly warnings: readonly string[]
  readonly errorCode?: string
}

export type ExactEditPreferenceApplyAuthorityResult =
  | {
      readonly ok: true
      readonly authority: EditReferenceProductionExactEditApplyAuthorityRead
      readonly warnings: readonly string[]
    }
  | ExactEditPreferenceApplyClientFailure

export type ExactEditPreferenceApplyResult =
  | {
      readonly ok: true
      readonly receipt: EditReferenceProductionExactEditApplyApiReceipt
      readonly operationDigestSha256: string
      readonly warnings: readonly string[]
      readonly customerPriceCalculated: false
      readonly customerCreditsMutated: false
      readonly serviceFeeIncluded: false
      readonly providerOrWorkerExecutionStarted: false
    }
  | ExactEditPreferenceApplyClientFailure

const PREFERENCE_FIELDS = [
  'editLevel',
  'workflowType',
  'cleanupPreference',
  'visualPreference',
  'moodStyle',
  'creditPreference',
  'targetPlatform',
] as const

export async function readExactEditPreferenceApplyAuthority(input: {
  readonly scope: ProjectPersistenceScope
  readonly projectId: string
  readonly editSessionId: string
  readonly selectedApplicationId: string | null
}): Promise<ExactEditPreferenceApplyAuthorityResult> {
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return failure(
      'not_configured',
      'Current Edit Preferences can be applied when the reviewed private backend is connected.',
      false,
      runtime.warnings,
    )
  }

  const response = await callReeditProApi<undefined, { authority: unknown }>(
    'planning.exactEditPreferences.readApplyAuthority',
    undefined,
    {
      params: { projectId: input.projectId, editSessionId: input.editSessionId },
      query: {
        workspaceId: input.scope.workspaceId,
        ...(input.selectedApplicationId
          ? { selectedApplicationId: input.selectedApplicationId }
          : {}),
      },
      context: {
        workspaceId: input.scope.workspaceId,
        projectId: input.projectId,
        userId: input.scope.backendUserId ?? input.scope.userId,
      },
    },
  )
  invalidateScopeIfRequired(input.scope, response)
  if (!response.ok) return classifyFailure(response)
  if (!isExactEditApplyAuthority(response.data?.authority, input)) {
    return failure(
      'invalid_response',
      'The saved Edit Preference authority could not be matched safely to this exact edit.',
      false,
      response.warnings,
    )
  }
  return {
    ok: true,
    authority: structuredClone(response.data.authority),
    warnings: response.warnings,
  }
}

export async function applyExactEditPreferencesAndReference(input: {
  readonly scope: ProjectPersistenceScope
  readonly projectId: string
  readonly editSessionId: string
  readonly operation: EditReferenceProductionExactEditApplyOperation
  readonly idempotencyKey: string
}): Promise<ExactEditPreferenceApplyResult> {
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return failure(
      'not_configured',
      'The draft is preserved. Retry after the reviewed private backend is connected.',
      false,
      runtime.warnings,
    )
  }
  if (
    !isExactEditApplyOperation(input.operation)
    || input.operation.authority.workspaceId !== input.scope.workspaceId
    || input.operation.authority.projectId !== input.projectId
    || input.operation.authority.editSessionId !== input.editSessionId
    || !isSafeIdempotencyKey(input.idempotencyKey)
  ) {
    return failure(
      'blocked',
      'The pending Apply operation no longer matches this exact edit. Refresh its saved authority before retrying.',
      false,
    )
  }

  const response = await callReeditProApi<
    EditReferenceProductionExactEditApplyOperation,
    {
      receipt: unknown
      operationDigestSha256: unknown
      authenticatedScopeReboundServerSide: unknown
      canonicalRowsReReadInsideTransaction: unknown
      customerPriceCalculated: unknown
      customerCreditsMutated: unknown
      serviceFeeIncluded: unknown
      providerOrWorkerExecutionStarted: unknown
    }
  >(
    'planning.exactEditPreferences.applyAtomic',
    input.operation,
    {
      params: { projectId: input.projectId, editSessionId: input.editSessionId },
      context: {
        workspaceId: input.scope.workspaceId,
        projectId: input.projectId,
        userId: input.scope.backendUserId ?? input.scope.userId,
      },
      idempotencyKey: input.idempotencyKey,
    },
  )
  invalidateScopeIfRequired(input.scope, response)
  if (!response.ok) return classifyFailure(response)
  const data = response.data
  if (
    !data
    || !isExactEditApplyReceipt(data.receipt)
    || !isSha256(data.operationDigestSha256)
    || data.authenticatedScopeReboundServerSide !== true
    || data.canonicalRowsReReadInsideTransaction !== true
    || data.customerPriceCalculated !== false
    || data.customerCreditsMutated !== false
    || data.serviceFeeIncluded !== false
    || data.providerOrWorkerExecutionStarted !== false
  ) {
    return failure(
      'invalid_response',
      'The Apply response could not be verified. Keep this draft and retry with the same operation before making another change.',
      true,
      response.warnings,
    )
  }
  return {
    ok: true,
    receipt: structuredClone(data.receipt),
    operationDigestSha256: data.operationDigestSha256,
    warnings: response.warnings,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    providerOrWorkerExecutionStarted: false,
  }
}

export function createExactEditPreferenceApplyOperation(input: {
  readonly authority: EditReferenceProductionExactEditApplyAuthorityRead
  readonly values: EditReferenceProductionExactEditPreferenceValues
  readonly referenceMutation: EditReferenceProductionExactEditApplyOperation['referenceMutation']
}): EditReferenceProductionExactEditApplyOperation {
  const preferencePatch = Object.freeze(Object.fromEntries(
    PREFERENCE_FIELDS.flatMap((field) => (
      input.authority.values[field] === input.values[field]
        ? []
        : [[field, input.values[field]]]
    )),
  )) as EditReferenceProductionExactEditPreferencePatch
  return Object.freeze({
    schemaVersion: EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_OPERATION_VERSION,
    authority: structuredClone(input.authority),
    preferencePatch: Object.freeze(preferencePatch),
    referenceMutation: input.referenceMutation,
  })
}

export function createExactEditPreferenceApplyIdempotencyKey(): string {
  return `exact-edit-preferences-apply-${crypto.randomUUID()}`
}

function classifyFailure(response: {
  readonly statusCode: number
  readonly error?: { readonly code: string; readonly message: string }
  readonly warnings: readonly string[]
}): ExactEditPreferenceApplyClientFailure {
  const code = response.error?.code
  if (response.statusCode === 401 || response.statusCode === 403) {
    return failure(
      'access_denied',
      'This signed-in workspace cannot change Edit Preferences for this edit.',
      false,
      response.warnings,
      code,
    )
  }
  if (response.statusCode === 409) {
    return failure(
      'stale',
      response.error?.message
        ?? 'The saved edit changed while this draft was open. Refresh before applying it.',
      false,
      response.warnings,
      code,
    )
  }
  if (response.statusCode === 400 || response.statusCode === 422) {
    return failure(
      'blocked',
      response.error?.message ?? 'This Edit Preference draft cannot be applied safely.',
      false,
      response.warnings,
      code,
    )
  }
  return failure(
    'unavailable',
    response.error?.message
      ?? 'The draft is preserved. Retry when the saved Edit Preference service is available.',
    true,
    response.warnings,
    code,
  )
}

function failure(
  status: ExactEditPreferenceApplyClientFailure['status'],
  message: string,
  retryable: boolean,
  warnings: readonly string[] = [],
  errorCode?: string,
): ExactEditPreferenceApplyClientFailure {
  return {
    ok: false,
    status,
    retryable,
    message,
    warnings,
    ...(errorCode ? { errorCode } : {}),
  }
}

function invalidateScopeIfRequired(
  scope: ProjectPersistenceScope,
  response: Parameters<typeof apiResponseInvalidatesProjectPersistenceScope>[0],
): void {
  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(scope)
  }
}

function isExactEditApplyOperation(
  value: unknown,
): value is EditReferenceProductionExactEditApplyOperation {
  if (!isRecord(value) || !hasExactKeys(value, [
    'schemaVersion', 'authority', 'preferencePatch', 'referenceMutation',
  ])) return false
  if (
    value.schemaVersion !== EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_OPERATION_VERSION
    || !isExactEditApplyAuthority(value.authority)
    || !isPreferencePatch(value.preferencePatch)
  ) return false
  return value.referenceMutation === null
    || value.referenceMutation === 'apply'
    || value.referenceMutation === 'replace'
    || value.referenceMutation === 'remove'
}

function isExactEditApplyAuthority(
  value: unknown,
  scope?: {
    readonly scope: ProjectPersistenceScope
    readonly projectId: string
    readonly editSessionId: string
    readonly selectedApplicationId: string | null
  },
): value is EditReferenceProductionExactEditApplyAuthorityRead {
  if (!isRecord(value) || !hasExactKeys(value, [
    'schemaVersion', 'sourceAuthority', 'runtimeSource', 'authorityReadReceiptId',
    'workspaceId', 'projectId', 'editSessionId', 'recordRevision',
    'preferenceRevision', 'planningInputRevision', 'preferenceFingerprintSha256',
    'values', 'lifecyclePhase', 'locked', 'currentApplicationState',
    'currentApplicationId', 'outputFrameAuthority', 'selectedApplicationAuthority',
    'readAt', 'browserMutationAuthorityGranted',
    'productionReleaseReadinessEvaluatedSeparately',
  ])) return false
  if (
    value.schemaVersion !== EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_VERSION
    || value.sourceAuthority !== 'canonical_exact_edit_preference_repository'
    || value.runtimeSource !== 'verified_live'
    || !isSafeId(value.authorityReadReceiptId)
    || !isSafeId(value.workspaceId)
    || !isSafeId(value.projectId)
    || !isSafeId(value.editSessionId)
    || !isRevision(value.recordRevision)
    || !isRevision(value.preferenceRevision)
    || !isRevision(value.planningInputRevision)
    || !isSha256(value.preferenceFingerprintSha256)
    || !isPreferenceValues(value.values)
    || typeof value.locked !== 'boolean'
    || !isIsoDate(value.readAt)
    || value.browserMutationAuthorityGranted !== false
    || value.productionReleaseReadinessEvaluatedSeparately !== true
    || !['planning', 'approved_snapshot', 'credit_reserved', 'executing',
      'private_review', 'completed_internal', 'revision_handoff'].includes(String(value.lifecyclePhase))
    || !['not_selected', 'connected', 'cleared'].includes(String(value.currentApplicationState))
    || (value.currentApplicationId !== null && !isSafeId(value.currentApplicationId))
    || (value.currentApplicationState === 'connected') !== (value.currentApplicationId !== null)
    || (value.selectedApplicationAuthority !== null
      && !isPreparedApplicationAuthority(value.selectedApplicationAuthority))
    || (value.outputFrameAuthority !== null && !isOutputFrameAuthority(value.outputFrameAuthority))
  ) return false
  if (!scope) return true
  return value.workspaceId === scope.scope.workspaceId
    && value.projectId === scope.projectId
    && value.editSessionId === scope.editSessionId
    && (value.selectedApplicationAuthority?.applicationId ?? null)
      === scope.selectedApplicationId
}

function isPreferenceValues(value: unknown): value is EditReferenceProductionExactEditPreferenceValues {
  return isRecord(value)
    && hasExactKeys(value, PREFERENCE_FIELDS)
    && ['basic', 'pro', 'premium'].includes(String(value.editLevel))
    && [
      'simple_clean_edit', 'social_short_viral_clip', 'talking_head_personal_brand',
      'podcast_clip', 'vlog_lifestyle', 'product_demo', 'real_estate_property_tour',
      'education_explainer', 'marketing_ad', 'testimonial_case_study',
      'custom_let_ai_decide',
    ].includes(String(value.workflowType))
    && [
      'preserve_natural', 'light_cleanup', 'balanced_cleanup',
      'tight_retention_cleanup', 'aggressive_cleanup', 'documentary_faithful',
      'tutorial_complete', 'custom',
    ].includes(String(value.cleanupPreference))
    && [
      'let_ai_decide', 'keep_visuals_minimal', 'balanced_visual_mix',
      'more_stroke_motion', 'more_graphic_design', 'real_motion_if_useful',
      'no_extra_visuals',
    ].includes(String(value.visualPreference))
    && [
      'clean', 'premium', 'cinematic', 'energetic', 'emotional', 'educational',
      'luxury', 'funny_playful', 'corporate', 'viral_fast_paced', 'let_ai_decide',
    ].includes(String(value.moodStyle))
    && ['low_credit_cost', 'balanced', 'premium_best_result', 'let_ai_estimate']
      .includes(String(value.creditPreference))
    && ['tiktok_reels_shorts', 'youtube', 'website', 'course_training', 'client_review', 'custom']
      .includes(String(value.targetPlatform))
}

function isPreferencePatch(value: unknown): value is EditReferenceProductionExactEditPreferencePatch {
  if (!isRecord(value)) return false
  const keys = Object.keys(value)
  if (keys.some((key) => !PREFERENCE_FIELDS.includes(key as typeof PREFERENCE_FIELDS[number]))) {
    return false
  }
  return isPreferenceValues({
    editLevel: 'basic',
    workflowType: 'simple_clean_edit',
    cleanupPreference: 'balanced_cleanup',
    visualPreference: 'let_ai_decide',
    moodStyle: 'clean',
    creditPreference: 'balanced',
    targetPlatform: 'youtube',
    ...value,
  })
}

function isPreparedApplicationAuthority(
  value: unknown,
): value is EditReferenceProductionPreparedApplicationAuthority {
  return isRecord(value)
    && value.schemaVersion === EDIT_REFERENCE_PRODUCTION_PREPARED_APPLICATION_AUTHORITY_VERSION
    && value.sourceAuthority === 'canonical_preference_application_repository'
    && value.runtimeSource === 'verified_live'
    && ['not_connected', 'connected'].includes(String(value.connectionState))
    && value.status === 'prepared'
    && [
      'authorityReadReceiptId', 'workspaceId', 'projectId', 'editSessionId',
      'editReferenceId', 'studySessionId', 'dnaVersionId', 'dnaQaResultId',
      'applicationId',
    ].every((key) => isSafeId(value[key]))
    && isRevision(value.applicationVersionNumber)
    && value.applicationVersionNumber >= 1
    && isRevision(value.expectedReferenceRevision)
    && value.expectedReferenceRevision >= 1
    && [
      'applicationContentDigestSha256', 'applicationContextHashSha256',
      'targetUnderstandingPackageDigestSha256',
    ].every((key) => isSha256(value[key]))
}

function isOutputFrameAuthority(
  value: unknown,
): value is EditReferenceProductionExactEditOutputFrameAuthoritySnapshot {
  return isRecord(value)
    && value.schemaVersion === 'edit-reference-production-output-frame-authority-v1'
    && value.sourceAuthority === 'canonical_exact_edit_preference_frame_confirmation'
    && value.repositoryAuthority === 'supabase_rls_transactional'
    && ['workspaceId', 'projectId', 'editSessionId', 'confirmationId']
      .every((key) => isSafeId(value[key]))
    && isRevision(value.exactEditPreferenceRecordRevision)
    && isRevision(value.planningInputRevision)
    && ['9:16', '16:9', '1:1', '4:5', '4:3'].includes(String(value.aspectRatio))
    && isIsoDate(value.confirmedAt)
    && value.browserSuppliedAuthorityAccepted === false
    && isSha256(value.authorityDigestSha256)
}

function isExactEditApplyReceipt(
  value: unknown,
): value is EditReferenceProductionExactEditApplyApiReceipt {
  return isRecord(value)
    && value.schemaVersion === EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RECEIPT_VERSION
    && value.sourceAuthority === 'canonical_exact_edit_apply_rpc'
    && value.canonicalReceiptValidatedServerSide === true
    && isSafeId(value.transactionId)
    && Array.isArray(value.changedPreferenceFields)
    && value.changedPreferenceFields.every((field) => PREFERENCE_FIELDS.includes(field))
    && (value.referenceMutation === null
      || ['apply', 'replace', 'remove'].includes(String(value.referenceMutation)))
    && isRevision(value.committedPreferenceRecordRevision)
    && isRevision(value.committedPreferenceRevision)
    && isRevision(value.committedPlanningInputRevision)
    && ['unchanged', 'requires_repreparation'].includes(String(value.sourcePreparationDisposition))
    && ['unchanged', 'requires_reconfirmation'].includes(String(value.outputFrameDisposition))
    && value.freshPlanAndEstimateRequired === true
    && value.approvedSnapshotPreserved === true
    && value.historicalPrivatePreviewPreserved === true
    && isSha256(value.transactionReceiptDigestSha256)
    && isIsoDate(value.committedAt)
    && value.productionReleaseReadinessEvaluatedSeparately === true
    && value.customerPriceCalculated === false
    && value.customerCreditsMutated === false
    && value.serviceFeeIncluded === false
    && value.providerOrWorkerExecutionStarted === false
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function isSafeId(value: unknown): value is string {
  return typeof value === 'string'
    && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/.test(value)
    && !value.includes('..')
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function isRevision(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isSafeIdempotencyKey(value: string): boolean {
  return value.length >= 16
    && value.length <= 200
    && /^[A-Za-z0-9._:-]+$/.test(value)
}
