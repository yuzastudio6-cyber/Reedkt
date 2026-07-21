import { createHash } from 'node:crypto'
import type { PreferenceApplicationRecord } from '../../src/types/edit-reference'
import {
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_COMMAND_VERSION,
  type EditReferenceProductionExactEditApplyCommand,
  type EditReferenceProductionExactEditPreferencePatch,
  type EditReferenceProductionExactEditPreferenceValues,
} from '../../src/types/edit-reference-production-exact-edit-apply-api'
import { ApiError } from '../errors/api-error'
import {
  exactEditPreferenceFieldKeys,
  exactEditPreferenceValuesSchema,
  type ExactEditPreferenceFieldKey,
} from '../validation/exact-edit-preference-schemas'
import type {
  EditReferenceProductionApplicationLifecycleRequest,
} from './edit-reference-production-application-lifecycle'
import {
  prepareEditReferenceProductionLifecycleRequest,
  validateEditReferenceProductionAuthenticatedHttpAuthority,
  type EditReferenceProductionAuthenticatedHttpAuthority,
} from './edit-reference-production-http-lifecycle-boundary'
import type {
  EditReferenceProductionOutputFrameAuthority,
} from './edit-reference-production-output-frame-authority'

export const EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_BOUNDARY_VERSION =
  'edit-reference-production-exact-edit-apply-boundary-v1' as const

export const EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RPC =
  'apply_exact_edit_preferences_and_reference_v1' as const

export type EditReferenceProductionCurrentApplicationState =
  | 'not_selected'
  | 'connected'
  | 'cleared'

/**
 * One server-side snapshot read from the future canonical exact-edit
 * preference repository. This interface is a contract only; it does not make
 * the current private/local store production-authoritative.
 */
export interface EditReferenceProductionExactEditPreferenceAuthority {
  readonly sourceAuthority:
    | 'canonical_exact_edit_preference_repository'
    | 'private_exact_edit_preference_store'
  readonly runtimeSource: 'verified_live' | 'verified_local'
  readonly authorityReadReceiptId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly recordRevision: number
  readonly preferenceRevision: number
  readonly planningInputRevision: number
  readonly preferenceFingerprintSha256: string
  readonly values: EditReferenceProductionExactEditPreferenceValues
  readonly lifecyclePhase:
    | 'planning'
    | 'approved_snapshot'
    | 'credit_reserved'
    | 'executing'
    | 'private_review'
    | 'completed_internal'
    | 'revision_handoff'
  readonly locked: boolean
  readonly currentApplicationState: EditReferenceProductionCurrentApplicationState
  readonly currentApplicationId: string | null
}

export interface EditReferenceProductionExactEditApplyRequest {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_BOUNDARY_VERSION
  readonly rpcName: typeof EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RPC
  readonly actorUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly accessCheckReceiptId: string
  readonly exactEditPreferenceAuthorityReadReceiptId: string
  readonly expectedPreferenceRecordRevision: number
  readonly expectedPreferenceRevision: number
  readonly expectedPlanningInputRevision: number
  readonly expectedPreferenceFingerprintSha256: string
  readonly preferencePatch: EditReferenceProductionExactEditPreferencePatch
  readonly changedPreferenceFields: readonly ExactEditPreferenceFieldKey[]
  readonly referenceLifecycleRequest: EditReferenceProductionApplicationLifecycleRequest | null
  readonly referenceLifecycleExecutionPolicy: 'nested_same_transaction_never_called_separately'
  readonly planningInputRevisionIncrement: 1
  readonly sourcePreparationDisposition: 'unchanged' | 'requires_repreparation'
  readonly outputFrameDisposition: 'unchanged' | 'requires_reconfirmation'
  readonly freshPlanAndEstimateRequired: true
  readonly approvedSnapshotPreserved: true
  readonly historicalPrivatePreviewPreserved: true
  readonly idempotencyKeyHashSha256: string
  readonly requestedAt: string
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly providerOrWorkerExecutionStarted: false
  readonly requestDigestSha256: string
}

export interface EditReferenceProductionPreparedExactEditApply {
  readonly request: EditReferenceProductionExactEditApplyRequest
  readonly browserCommandDigestSha256: string
  readonly authenticatedScopeReboundServerSide: true
  readonly exactEditPreferencesReReadServerSide: true
  readonly referenceLifecycleNestedOnly: true
  readonly idempotencyKeyAcceptedInBody: false
  readonly remoteMutationMade: false
  readonly productionReady: false
}

const COMMAND_KEYS = [
  'schemaVersion',
  'workspaceId',
  'projectId',
  'editSessionId',
  'expectedPreferenceRecordRevision',
  'expectedPreferenceRevision',
  'expectedPlanningInputRevision',
  'expectedPreferenceFingerprintSha256',
  'preferencePatch',
  'editReferenceLifecycle',
] as const
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/

/**
 * Prepares, but never executes, the one future exact-edit Apply transaction.
 * Generic preference changes and the optional Edit Reference lifecycle are
 * bound to one expected planning revision and one idempotency identity.
 */
export function prepareEditReferenceProductionExactEditApply(input: {
  readonly command: EditReferenceProductionExactEditApplyCommand
  readonly authenticated: EditReferenceProductionAuthenticatedHttpAuthority
  readonly exactEditPreferenceAuthority: EditReferenceProductionExactEditPreferenceAuthority
  readonly preparedApplication: PreferenceApplicationRecord | null
  readonly outputFrameAuthority: EditReferenceProductionOutputFrameAuthority | null
  readonly idempotencyKeyHashSha256: string
  readonly serverRequestedAt: string
}): EditReferenceProductionPreparedExactEditApply {
  assertExactKeys(input.command, COMMAND_KEYS, 'exact_edit_apply_command_shape_invalid')
  validateEditReferenceProductionAuthenticatedHttpAuthority(
    input.authenticated,
    input.command,
  )
  validateServerInputs(input.idempotencyKeyHashSha256, input.serverRequestedAt)
  validateExactEditPreferenceAuthority(input.command, input.exactEditPreferenceAuthority)
  const patch = validatePreferencePatch(input.command.preferencePatch)
  const nextValues = exactEditPreferenceValuesSchema.parse({
    ...input.exactEditPreferenceAuthority.values,
    ...patch,
  }) as EditReferenceProductionExactEditPreferenceValues
  const changedPreferenceFields = exactEditPreferenceFieldKeys.filter(
    (field) => input.exactEditPreferenceAuthority.values[field] !== nextValues[field],
  )

  const referenceLifecycleRequest = prepareNestedReferenceLifecycle({
    ...input,
    changedPreferenceFields,
  })
  if (changedPreferenceFields.length === 0 && !referenceLifecycleRequest) {
    invalid('exact_edit_apply_has_no_effect', 409)
  }

  const sourcePreparationDisposition = changedPreferenceFields.includes('cleanupPreference')
    ? 'requires_repreparation' as const
    : 'unchanged' as const
  const outputFrameDisposition = changedPreferenceFields.includes('targetPlatform')
    ? 'requires_reconfirmation' as const
    : 'unchanged' as const
  const requestWithoutDigest = {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_BOUNDARY_VERSION,
    rpcName: EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RPC,
    actorUserId: input.authenticated.actorUserId,
    workspaceId: input.command.workspaceId,
    projectId: input.command.projectId,
    editSessionId: input.command.editSessionId,
    accessCheckReceiptId: input.authenticated.accessCheckReceiptId,
    exactEditPreferenceAuthorityReadReceiptId:
      input.exactEditPreferenceAuthority.authorityReadReceiptId,
    expectedPreferenceRecordRevision: input.command.expectedPreferenceRecordRevision,
    expectedPreferenceRevision: input.command.expectedPreferenceRevision,
    expectedPlanningInputRevision: input.command.expectedPlanningInputRevision,
    expectedPreferenceFingerprintSha256: input.command.expectedPreferenceFingerprintSha256,
    preferencePatch: patch,
    changedPreferenceFields,
    referenceLifecycleRequest,
    referenceLifecycleExecutionPolicy:
      'nested_same_transaction_never_called_separately' as const,
    planningInputRevisionIncrement: 1 as const,
    sourcePreparationDisposition,
    outputFrameDisposition,
    freshPlanAndEstimateRequired: true as const,
    approvedSnapshotPreserved: true as const,
    historicalPrivatePreviewPreserved: true as const,
    idempotencyKeyHashSha256: input.idempotencyKeyHashSha256,
    requestedAt: input.serverRequestedAt,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
    providerOrWorkerExecutionStarted: false as const,
  }
  const request: EditReferenceProductionExactEditApplyRequest = Object.freeze({
    ...requestWithoutDigest,
    requestDigestSha256: sha256(requestWithoutDigest),
  })
  return Object.freeze({
    request,
    browserCommandDigestSha256: sha256(input.command),
    authenticatedScopeReboundServerSide: true as const,
    exactEditPreferencesReReadServerSide: true as const,
    referenceLifecycleNestedOnly: true as const,
    idempotencyKeyAcceptedInBody: false as const,
    remoteMutationMade: false as const,
    productionReady: false as const,
  })
}

function validateExactEditPreferenceAuthority(
  command: EditReferenceProductionExactEditApplyCommand,
  authority: EditReferenceProductionExactEditPreferenceAuthority,
): void {
  if (
    command.schemaVersion !== EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_COMMAND_VERSION
    || !isSafeId(command.workspaceId)
    || !isSafeId(command.projectId)
    || !isSafeId(command.editSessionId)
    || !SHA256_PATTERN.test(command.expectedPreferenceFingerprintSha256)
    || !Number.isInteger(command.expectedPreferenceRecordRevision)
    || command.expectedPreferenceRecordRevision < 0
    || !Number.isInteger(command.expectedPreferenceRevision)
    || command.expectedPreferenceRevision < 0
    || !Number.isInteger(command.expectedPlanningInputRevision)
    || command.expectedPlanningInputRevision < 0
  ) invalid('exact_edit_apply_command_identity_or_revision_invalid', 400)
  if (
    authority.sourceAuthority !== 'canonical_exact_edit_preference_repository'
    || authority.runtimeSource !== 'verified_live'
    || !isSafeId(authority.authorityReadReceiptId)
  ) invalid('exact_edit_apply_preference_authority_not_production_verified', 503)
  if (
    authority.workspaceId !== command.workspaceId
    || authority.projectId !== command.projectId
    || authority.editSessionId !== command.editSessionId
  ) invalid('exact_edit_apply_preference_authority_scope_mismatch', 403)
  if (
    authority.recordRevision !== command.expectedPreferenceRecordRevision
    || authority.preferenceRevision !== command.expectedPreferenceRevision
    || authority.planningInputRevision !== command.expectedPlanningInputRevision
  ) invalid('exact_edit_apply_preference_authority_revision_changed', 409)
  const values = exactEditPreferenceValuesSchema.safeParse(authority.values)
  if (
    !values.success
    || authority.preferenceFingerprintSha256 !== sha256(values.data)
    || authority.preferenceFingerprintSha256 !== command.expectedPreferenceFingerprintSha256
  ) invalid('exact_edit_apply_preference_authority_fingerprint_changed', 409)
  if (authority.locked || authority.lifecyclePhase !== 'planning') {
    invalid('exact_edit_apply_preferences_locked_use_chat_revision', 409)
  }
  const currentApplicationShapeValid = authority.currentApplicationState === 'connected'
    ? authority.currentApplicationId !== null && isSafeId(authority.currentApplicationId)
    : authority.currentApplicationId === null
  if (!currentApplicationShapeValid) {
    invalid('exact_edit_apply_current_application_state_invalid', 409)
  }
}

function validatePreferencePatch(
  patch: EditReferenceProductionExactEditPreferencePatch,
): EditReferenceProductionExactEditPreferencePatch {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    invalid('exact_edit_apply_preference_patch_shape_invalid', 400)
  }
  const keys = Object.keys(patch)
  if (
    keys.some((key) => !exactEditPreferenceFieldKeys.includes(key as ExactEditPreferenceFieldKey))
    || keys.some((key) => patch[key as ExactEditPreferenceFieldKey] === undefined)
  ) invalid('exact_edit_apply_preference_patch_shape_invalid', 400)
  const parsed = exactEditPreferenceValuesSchema.partial().strict().safeParse(patch)
  if (!parsed.success) invalid('exact_edit_apply_preference_patch_invalid', 400)
  return Object.freeze({ ...parsed.data })
}

function prepareNestedReferenceLifecycle(input: {
  readonly command: EditReferenceProductionExactEditApplyCommand
  readonly authenticated: EditReferenceProductionAuthenticatedHttpAuthority
  readonly exactEditPreferenceAuthority: EditReferenceProductionExactEditPreferenceAuthority
  readonly preparedApplication: PreferenceApplicationRecord | null
  readonly outputFrameAuthority: EditReferenceProductionOutputFrameAuthority | null
  readonly idempotencyKeyHashSha256: string
  readonly serverRequestedAt: string
  readonly changedPreferenceFields: readonly ExactEditPreferenceFieldKey[]
}): EditReferenceProductionApplicationLifecycleRequest | null {
  const lifecycle = input.command.editReferenceLifecycle
  if (!lifecycle) {
    if (input.preparedApplication || input.outputFrameAuthority) {
      invalid('exact_edit_apply_hidden_reference_inputs_forbidden', 400)
    }
    if (
      input.exactEditPreferenceAuthority.currentApplicationState === 'connected'
      && changesReferenceStudyContext(input.changedPreferenceFields)
    ) invalid('exact_edit_apply_connected_reference_context_change_requires_remove', 409)
    return null
  }
  if (!input.preparedApplication) {
    invalid('exact_edit_apply_reference_application_missing', 409)
  }
  if (
    lifecycle.workspaceId !== input.command.workspaceId
    || lifecycle.projectId !== input.command.projectId
    || lifecycle.editSessionId !== input.command.editSessionId
    || lifecycle.expectedPlanningInputRevision !== input.command.expectedPlanningInputRevision
  ) invalid('exact_edit_apply_reference_subcommand_scope_or_revision_mismatch', 409)

  const currentApplicationId = input.exactEditPreferenceAuthority.currentApplicationId
  if (
    (lifecycle.mutation === 'apply' && (
      input.exactEditPreferenceAuthority.currentApplicationState === 'connected'
      || lifecycle.expectedCurrentApplicationId !== null
    ))
    || ((lifecycle.mutation === 'replace' || lifecycle.mutation === 'remove') && (
      input.exactEditPreferenceAuthority.currentApplicationState !== 'connected'
      || lifecycle.expectedCurrentApplicationId !== currentApplicationId
    ))
  ) invalid('exact_edit_apply_reference_compare_and_swap_changed', 409)
  if (
    lifecycle.mutation !== 'remove'
    && changesReferenceStudyContext(input.changedPreferenceFields)
  ) invalid('exact_edit_apply_reference_study_context_changed', 409)
  if (
    lifecycle.mutation !== 'remove'
    && input.outputFrameAuthority?.exactEditPreferenceRecordRevision
      !== input.command.expectedPreferenceRecordRevision
  ) invalid('exact_edit_apply_output_frame_preference_revision_changed', 409)

  return prepareEditReferenceProductionLifecycleRequest({
    command: lifecycle,
    authenticated: input.authenticated,
    preparedApplication: input.preparedApplication,
    outputFrameAuthority: input.outputFrameAuthority,
    idempotencyKeyHashSha256: input.idempotencyKeyHashSha256,
    serverRequestedAt: input.serverRequestedAt,
  }).request
}

function changesReferenceStudyContext(
  fields: readonly ExactEditPreferenceFieldKey[],
): boolean {
  return fields.includes('editLevel') || fields.includes('targetPlatform')
}

function validateServerInputs(idempotencyKeyHashSha256: string, requestedAt: string): void {
  if (!SHA256_PATTERN.test(idempotencyKeyHashSha256)) {
    invalid('exact_edit_apply_idempotency_hash_invalid', 400)
  }
  if (!Number.isFinite(Date.parse(requestedAt))) {
    invalid('exact_edit_apply_server_time_invalid', 500)
  }
}

function assertExactKeys(
  value: object,
  expected: readonly string[],
  reason: string,
): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(reason, 400)
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    invalid(reason, 400)
  }
}

function isSafeId(value: string): boolean {
  return ID_PATTERN.test(value) && !value.includes('..')
}

function sha256(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex')
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((entry) => stableJson(entry)).join(',')}]`
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`
  }
  const serialized = JSON.stringify(value)
  if (serialized === undefined) invalid('exact_edit_apply_non_canonical_value', 400)
  return serialized
}

function invalid(reason: string, status: number): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'Current Edit Preferences could not be bound to one verified exact-edit transaction.',
    status,
    { reason, remoteMutationAttempted: false },
  )
}
