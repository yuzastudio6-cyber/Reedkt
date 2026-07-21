import { createHash } from 'node:crypto'
import type { PreferenceApplicationRecord } from '../../src/types/edit-reference'
import {
  EDIT_REFERENCE_PRODUCTION_LIFECYCLE_COMMAND_VERSION,
  EDIT_REFERENCE_PRODUCTION_LIFECYCLE_MUTATIONS,
  EDIT_REFERENCE_PRODUCTION_LIFECYCLE_SUBCOMMAND_KEY,
  type EditReferenceProductionLifecycleCommand,
} from '../../src/types/edit-reference-production-lifecycle-api'
import { ApiError } from '../errors/api-error'
import {
  createEditReferenceProductionApplicationLifecycleRequest,
  type EditReferenceProductionApplicationLifecycleRequest,
} from './edit-reference-production-application-lifecycle'
import {
  validateEditReferenceProductionOutputFrameAuthority,
  type EditReferenceProductionOutputFrameAuthority,
} from './edit-reference-production-output-frame-authority'
import {
  calculateEditReferenceProductionApplicationContextHash,
} from './edit-reference-production-planning-context'

export const EDIT_REFERENCE_PRODUCTION_HTTP_LIFECYCLE_BOUNDARY_VERSION =
  'edit-reference-production-http-lifecycle-boundary-v1' as const

export interface EditReferenceProductionAuthenticatedHttpAuthority {
  readonly actorUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly authenticatedUserVerified: true
  readonly workspaceMembershipVerified: true
  readonly workspaceProjectCompositeBindingVerified: true
  readonly projectEditSessionCompositeBindingVerified: true
  readonly accessCheckReceiptId: string
}

export interface EditReferenceProductionExactEditScope {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
}

export interface EditReferenceProductionPreparedLifecycleRequest {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_HTTP_LIFECYCLE_BOUNDARY_VERSION
  readonly subcommandKey: typeof EDIT_REFERENCE_PRODUCTION_LIFECYCLE_SUBCOMMAND_KEY
  readonly mountPolicy: 'exact_edit_apply_transaction_only'
  readonly request: EditReferenceProductionApplicationLifecycleRequest
  readonly commandDigestSha256: string
  readonly accessCheckReceiptId: string
  readonly actorDerivedFromAuthenticatedServerContext: true
  readonly exactEditScopeDerivedFromAuthenticatedServerContext: true
  readonly applicationReReadServerSide: true
  readonly outputFrameAuthorityAcceptedFromBrowser: false
  readonly idempotencyKeyAcceptedInBody: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly providerOrWorkerExecutionStarted: false
  readonly remoteMutationMade: false
  readonly productionReady: false
}

const COMMAND_KEYS = [
  'schemaVersion',
  'mutation',
  'workspaceId',
  'projectId',
  'editSessionId',
  'applicationId',
  'expectedCurrentApplicationId',
  'expectedReferenceRevision',
  'expectedPlanningInputRevision',
  'expectedApplicationContentDigestSha256',
  'expectedApplicationContextHashSha256',
  'expectedTargetUnderstandingPackageDigestSha256',
  'expectedOutputFrameAuthorityDigestSha256',
] as const

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/

/**
 * Converts a browser-safe CAS command into the internal RPC request only after
 * server-side auth, application, and frame-authority reads have been bound.
 * It does not call the database and cannot authorize production by itself.
 */
export function prepareEditReferenceProductionLifecycleRequest(input: {
  readonly command: EditReferenceProductionLifecycleCommand
  readonly authenticated: EditReferenceProductionAuthenticatedHttpAuthority
  readonly preparedApplication: PreferenceApplicationRecord
  readonly outputFrameAuthority: EditReferenceProductionOutputFrameAuthority | null
  readonly idempotencyKeyHashSha256: string
  readonly serverRequestedAt: string
}): EditReferenceProductionPreparedLifecycleRequest {
  validateCommand(input.command)
  validateEditReferenceProductionAuthenticatedHttpAuthority(
    input.authenticated,
    input.command,
  )
  validateServerInputs(input.idempotencyKeyHashSha256, input.serverRequestedAt)
  validatePreparedApplication(input.command, input.preparedApplication)
  validateFrameAuthority(input.command, input.preparedApplication, input.outputFrameAuthority)

  const targetUnderstandingDigest = input.command.mutation === 'remove'
    ? null
    : input.preparedApplication.targetUnderstanding?.packageDigestSha256 ?? null
  const request = createEditReferenceProductionApplicationLifecycleRequest({
    mutation: input.command.mutation,
    actorUserId: input.authenticated.actorUserId,
    workspaceId: input.command.workspaceId,
    projectId: input.command.projectId,
    editSessionId: input.command.editSessionId,
    editReferenceId: input.preparedApplication.editReferenceId,
    studySessionId: input.preparedApplication.studySessionId,
    dnaVersionId: input.preparedApplication.dnaVersionId,
    applicationId: input.preparedApplication.id,
    expectedCurrentApplicationId: input.command.expectedCurrentApplicationId,
    expectedReferenceRevision: input.command.expectedReferenceRevision,
    expectedPlanningInputRevision: input.command.expectedPlanningInputRevision,
    applicationContentDigestSha256: input.preparedApplication.contentDigest,
    applicationContextHashSha256:
      calculateEditReferenceProductionApplicationContextHash(input.preparedApplication),
    targetUnderstandingPackageDigestSha256: targetUnderstandingDigest,
    outputFrameConfirmation: input.outputFrameAuthority,
    idempotencyKeyHashSha256: input.idempotencyKeyHashSha256,
    requestedAt: input.serverRequestedAt,
  })

  return Object.freeze({
    schemaVersion: EDIT_REFERENCE_PRODUCTION_HTTP_LIFECYCLE_BOUNDARY_VERSION,
    subcommandKey: EDIT_REFERENCE_PRODUCTION_LIFECYCLE_SUBCOMMAND_KEY,
    mountPolicy: 'exact_edit_apply_transaction_only' as const,
    request,
    commandDigestSha256: sha256(input.command),
    accessCheckReceiptId: input.authenticated.accessCheckReceiptId,
    actorDerivedFromAuthenticatedServerContext: true as const,
    exactEditScopeDerivedFromAuthenticatedServerContext: true as const,
    applicationReReadServerSide: true as const,
    outputFrameAuthorityAcceptedFromBrowser: false as const,
    idempotencyKeyAcceptedInBody: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    providerOrWorkerExecutionStarted: false as const,
    remoteMutationMade: false as const,
    productionReady: false as const,
  })
}

function validateCommand(command: EditReferenceProductionLifecycleCommand): void {
  assertExactKeys(command, COMMAND_KEYS, 'http_lifecycle_command_shape_invalid')
  if (
    command.schemaVersion !== EDIT_REFERENCE_PRODUCTION_LIFECYCLE_COMMAND_VERSION
    || !EDIT_REFERENCE_PRODUCTION_LIFECYCLE_MUTATIONS.includes(command.mutation)
  ) invalid('http_lifecycle_command_version_or_mutation_invalid', 400)
  for (const value of [
    command.workspaceId,
    command.projectId,
    command.editSessionId,
    command.applicationId,
  ]) {
    if (!isSafeId(value)) invalid('http_lifecycle_command_identity_invalid', 400)
  }
  if (
    command.expectedCurrentApplicationId !== null
    && !isSafeId(command.expectedCurrentApplicationId)
  ) invalid('http_lifecycle_expected_current_application_invalid', 400)
  if (
    !Number.isInteger(command.expectedReferenceRevision)
    || command.expectedReferenceRevision < 1
    || !Number.isInteger(command.expectedPlanningInputRevision)
    || command.expectedPlanningInputRevision < 0
  ) invalid('http_lifecycle_expected_revision_invalid', 400)
  for (const digest of [
    command.expectedApplicationContentDigestSha256,
    command.expectedApplicationContextHashSha256,
  ]) {
    if (!SHA256_PATTERN.test(digest)) invalid('http_lifecycle_expected_digest_invalid', 400)
  }
  const expectsTargetAuthority = command.mutation !== 'remove'
  if (
    (expectsTargetAuthority && (
      !command.expectedTargetUnderstandingPackageDigestSha256
      || !SHA256_PATTERN.test(command.expectedTargetUnderstandingPackageDigestSha256)
      || !command.expectedOutputFrameAuthorityDigestSha256
      || !SHA256_PATTERN.test(command.expectedOutputFrameAuthorityDigestSha256)
    ))
    || (!expectsTargetAuthority && (
      command.expectedTargetUnderstandingPackageDigestSha256 !== null
      || command.expectedOutputFrameAuthorityDigestSha256 !== null
    ))
  ) invalid('http_lifecycle_expected_target_authority_invalid', 400)
  if (
    (command.mutation === 'apply' && command.expectedCurrentApplicationId !== null)
    || (command.mutation === 'replace' && (
      command.expectedCurrentApplicationId === null
      || command.expectedCurrentApplicationId === command.applicationId
    ))
    || (command.mutation === 'remove'
      && command.expectedCurrentApplicationId !== command.applicationId)
  ) invalid('http_lifecycle_expected_application_transition_invalid', 400)
}

export function validateEditReferenceProductionAuthenticatedHttpAuthority(
  authority: EditReferenceProductionAuthenticatedHttpAuthority,
  scope: EditReferenceProductionExactEditScope,
): void {
  if (
    !isSafeId(authority.actorUserId)
    || !isSafeId(authority.workspaceId)
    || !isSafeId(authority.projectId)
    || !isSafeId(authority.editSessionId)
    || !isSafeId(authority.accessCheckReceiptId)
    || authority.authenticatedUserVerified !== true
    || authority.workspaceMembershipVerified !== true
    || authority.workspaceProjectCompositeBindingVerified !== true
    || authority.projectEditSessionCompositeBindingVerified !== true
  ) invalid('http_lifecycle_authenticated_authority_invalid', 403)
  if (
    authority.workspaceId !== scope.workspaceId
    || authority.projectId !== scope.projectId
    || authority.editSessionId !== scope.editSessionId
  ) invalid('http_lifecycle_authenticated_scope_mismatch', 403)
}

function validateServerInputs(idempotencyKeyHashSha256: string, requestedAt: string): void {
  if (!SHA256_PATTERN.test(idempotencyKeyHashSha256)) {
    invalid('http_lifecycle_idempotency_hash_invalid', 400)
  }
  if (!Number.isFinite(Date.parse(requestedAt))) {
    invalid('http_lifecycle_server_time_invalid', 500)
  }
}

function validatePreparedApplication(
  command: EditReferenceProductionLifecycleCommand,
  application: PreferenceApplicationRecord,
): void {
  if (
    application.id !== command.applicationId
    || application.workspaceId !== command.workspaceId
    || application.projectId !== command.projectId
    || application.editSessionId !== command.editSessionId
  ) invalid('http_lifecycle_application_scope_invalid', 403)
  if (
    application.status !== 'prepared'
    || application.applicationVersion !== 'edit-reference-target-application-v2'
    || application.runtimeSource !== 'verified_live'
    || application.targetIdentityStatus !== 'verified_target_video_understanding'
    || !application.dnaApprovalId
    || !application.dnaQaResultId
  ) invalid('http_lifecycle_application_not_production_authoritative', 409)
  let contextHash: string
  try {
    contextHash = calculateEditReferenceProductionApplicationContextHash(application)
  } catch {
    invalid('http_lifecycle_application_integrity_invalid', 409)
  }
  if (
    application.contentDigest !== command.expectedApplicationContentDigestSha256
    || contextHash !== command.expectedApplicationContextHashSha256
  ) invalid('http_lifecycle_application_changed', 409)

  if (command.mutation === 'remove') {
    if (application.targetIntegrationStatus !== 'connected') {
      invalid('http_lifecycle_remove_application_not_connected', 409)
    }
    return
  }

  const target = application.targetUnderstanding
  if (
    application.targetIntegrationStatus !== 'not_connected'
    || !target
    || target.packageDigestSha256 !== command.expectedTargetUnderstandingPackageDigestSha256
    || !target.runtimeSources.includes('verified_live')
    || target.everyRequiredOutputVerified !== true
    || target.everySemanticRuntimeAuthoritative !== true
    || target.everyRequiredOutputCostAuthoritySatisfied !== true
    || target.coverageQaPassed !== true
    || target.callerSourceSummaryUsedAsStudyEvidence !== false
  ) invalid('http_lifecycle_target_understanding_changed_or_unverified', 409)
  if (
    (command.mutation === 'apply' && application.replacesApplicationId !== undefined)
    || (command.mutation === 'replace'
      && application.replacesApplicationId !== command.expectedCurrentApplicationId)
  ) invalid('http_lifecycle_replacement_lineage_invalid', 409)
}

function validateFrameAuthority(
  command: EditReferenceProductionLifecycleCommand,
  application: PreferenceApplicationRecord,
  authority: EditReferenceProductionOutputFrameAuthority | null,
): void {
  if (command.mutation === 'remove') {
    if (authority !== null) invalid('http_lifecycle_remove_frame_authority_forbidden', 400)
    return
  }
  if (!authority) invalid('http_lifecycle_frame_authority_missing', 409)
  validateEditReferenceProductionOutputFrameAuthority(authority)
  if (
    authority.workspaceId !== command.workspaceId
    || authority.projectId !== command.projectId
    || authority.editSessionId !== command.editSessionId
    || authority.planningInputRevision !== command.expectedPlanningInputRevision
    || authority.aspectRatio !== application.targetContext.aspectRatio
    || authority.authorityDigestSha256 !== command.expectedOutputFrameAuthorityDigestSha256
  ) invalid('http_lifecycle_frame_authority_changed', 409)
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
  if (serialized === undefined) invalid('http_lifecycle_non_canonical_value', 400)
  return serialized
}

function invalid(reason: string, status: number): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The Edit Reference lifecycle command could not be bound to verified server authority.',
    status,
    { reason, remoteMutationAttempted: false },
  )
}
