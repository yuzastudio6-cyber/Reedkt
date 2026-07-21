import { createHash } from 'node:crypto'
import type { PreferenceApplicationRecord } from '../../src/types/edit-reference'
import type { PreferenceDNALayerId } from '../../src/types/preference-dna-builder'
import { ApiError } from '../errors/api-error'
import {
  calculatePreferenceApplicationContentDigest,
  calculatePreferenceApplicationTargetContextDigest,
} from './edit-reference-target-adaptation'
import {
  validateEditReferenceProductionApplicationLifecycleReceipt,
  type EditReferenceExecutionRevocationDisposition,
  type EditReferenceProductionApplicationLifecycleReceipt,
  type EditReferenceProductionApplicationLifecycleRequest,
} from './edit-reference-production-application-lifecycle'

export const EDIT_REFERENCE_PRODUCTION_PLANNING_CONTEXT_VERSION =
  'edit-reference-production-planning-context-v1' as const

export interface EditReferenceProductionPlanningGuidanceItem {
  readonly decisionId: string
  readonly sourceRuleId: string
  readonly layerId: PreferenceDNALayerId
  readonly decision: 'applied' | 'adapted'
  readonly precedence: PreferenceApplicationRecord['precedencePolicy'][number]
  readonly instruction: string
  readonly reason: string
  readonly confidence: number
}

export interface EditReferenceProductionPlanningHeldBackItem {
  readonly decisionId: string
  readonly sourceRuleId: string
  readonly layerId: PreferenceDNALayerId
  readonly decision: 'ignored' | 'blocked'
  readonly reason: string
  readonly heldBackReason: string
  readonly confidence: number
}

export interface EditReferenceProductionPlanningContext {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_PLANNING_CONTEXT_VERSION
  readonly sourceAuthority: 'canonical_application_lifecycle_rpc'
  readonly lifecycleTransactionId: string
  readonly lifecycleReceiptDigestSha256: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly dnaVersionId: string
  readonly dnaVersionNumber: number
  readonly dnaContentDigestSha256: string
  readonly applicationId: string
  readonly applicationContentDigestSha256: string
  readonly applicationContextHashSha256: string
  readonly targetContextDigestSha256: string
  readonly targetUnderstandingPackageDigestSha256: string
  readonly outputFrameConfirmationId: string
  readonly outputFrameConfirmationDigestSha256: string
  readonly committedReferenceRevision: number
  readonly committedPlanningInputRevision: number
  readonly currentUserInstruction: string
  readonly approvedConstraints: readonly string[]
  readonly guidance: readonly EditReferenceProductionPlanningGuidanceItem[]
  readonly heldBack: readonly EditReferenceProductionPlanningHeldBackItem[]
  readonly doNotCopyRules: readonly string[]
  readonly precedencePolicy: PreferenceApplicationRecord['precedencePolicy']
  readonly summary: string
  readonly runtimeSource: 'verified_live'
  readonly freshPlanAndEstimateRequired: true
  readonly approvedSnapshotPreserved: true
  readonly historicalPrivatePreviewPreserved: true
  readonly executionAuthorizationDisposition: EditReferenceExecutionRevocationDisposition
  readonly rawReferenceMediaIncluded: false
  readonly rawProviderPayloadIncluded: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly providerOrWorkerExecutionStarted: false
  readonly contextDigestSha256: string
}

type PlanningContextWithoutDigest = Omit<EditReferenceProductionPlanningContext, 'contextDigestSha256'>

const SHA256_PATTERN = /^[a-f0-9]{64}$/
const ALLOWED_DECISIONS = new Set(['applied', 'adapted', 'ignored', 'blocked'])
const EXPECTED_PRECEDENCE: PreferenceApplicationRecord['precedencePolicy'] = [
  'safety_platform_tier_frame_credit_or_approved_constraint',
  'current_user_instruction',
  'target_context',
  'approved_preference_dna',
]

export function calculateEditReferenceProductionApplicationContextHash(
  application: PreferenceApplicationRecord,
): string {
  validateApplicationContentAuthority(application)
  return sha256(applicationContextCore(application))
}

export function createEditReferenceProductionPlanningContext(input: {
  readonly application: PreferenceApplicationRecord
  readonly request: EditReferenceProductionApplicationLifecycleRequest
  readonly receipt: EditReferenceProductionApplicationLifecycleReceipt
}): EditReferenceProductionPlanningContext {
  validateProductionPlanningInputs(input)
  const unsigned = createUnsignedPlanningContext(input)
  return {
    ...unsigned,
    contextDigestSha256: sha256(unsigned),
  }
}

export function validateEditReferenceProductionPlanningContext(input: {
  readonly application: PreferenceApplicationRecord
  readonly request: EditReferenceProductionApplicationLifecycleRequest
  readonly receipt: EditReferenceProductionApplicationLifecycleReceipt
  readonly planningContext: EditReferenceProductionPlanningContext
}): void {
  validateProductionPlanningInputs(input)
  const expectedUnsigned = createUnsignedPlanningContext(input)
  const { contextDigestSha256, ...actualUnsigned } = input.planningContext
  if (
    !SHA256_PATTERN.test(contextDigestSha256)
    || contextDigestSha256 !== sha256(actualUnsigned)
    || stableJson(actualUnsigned) !== stableJson(expectedUnsigned)
  ) invalid('production_planning_context_integrity_invalid')
}

function validateProductionPlanningInputs(input: {
  readonly application: PreferenceApplicationRecord
  readonly request: EditReferenceProductionApplicationLifecycleRequest
  readonly receipt: EditReferenceProductionApplicationLifecycleReceipt
}): void {
  validateEditReferenceProductionApplicationLifecycleReceipt({
    request: input.request,
    receipt: input.receipt,
  })
  validateApplicationCommittedAuthority(input.application)
  const { application, request, receipt } = input
  if (request.mutation === 'remove' || receipt.applicationStatusAfter !== 'connected') {
    invalid('removed_application_cannot_become_planning_context')
  }
  if (
    application.workspaceId !== request.workspaceId
    || application.projectId !== request.projectId
    || application.editSessionId !== request.editSessionId
    || application.editReferenceId !== request.editReferenceId
    || application.studySessionId !== request.studySessionId
    || application.dnaVersionId !== request.dnaVersionId
    || application.id !== request.applicationId
    || application.contentDigest !== request.applicationContentDigestSha256
  ) invalid('production_planning_application_lifecycle_binding_invalid')
  if (
    request.applicationContextHashSha256 !== calculateEditReferenceProductionApplicationContextHash(application)
    || request.targetUnderstandingPackageDigestSha256 !== application.targetUnderstanding?.packageDigestSha256
    || request.outputFrameConfirmation === null
  ) invalid('production_planning_application_authority_digest_invalid')
  if (request.outputFrameConfirmation.aspectRatio !== application.targetContext.aspectRatio) {
    invalid('production_planning_output_frame_target_mismatch')
  }
}

function validateApplicationCommittedAuthority(application: PreferenceApplicationRecord): void {
  validateApplicationContentAuthority(application)
  if (
    application.targetIntegrationStatus !== 'connected'
    || application.downstreamInvalidationStatus !== 'not_required'
    || application.targetEditMutationMade !== true
    || application.downstreamContextWritten !== true
  ) invalid('production_planning_application_state_invalid')
}

function validateApplicationContentAuthority(application: PreferenceApplicationRecord): void {
  if (
    application.applicationVersion !== 'edit-reference-target-application-v2'
    || application.runtimeSource !== 'verified_live'
    || application.status !== 'prepared'
    || application.targetIdentityStatus !== 'verified_target_video_understanding'
    || application.approvedPlanMutationMade !== false
    || application.targetContext.outputFrameConfirmed !== true
  ) invalid('production_planning_application_state_invalid')
  const target = application.targetUnderstanding
  if (
    !target
    || !SHA256_PATTERN.test(application.contentDigest)
    || !SHA256_PATTERN.test(application.dnaContentDigest)
    || !SHA256_PATTERN.test(application.targetContextDigest)
    || !SHA256_PATTERN.test(target.packageDigestSha256)
    || !SHA256_PATTERN.test(target.contextDigestSha256)
    || !SHA256_PATTERN.test(target.studyPlanDigestSha256)
    || !SHA256_PATTERN.test(target.editBriefDigestSha256)
    || target.everyRequiredOutputVerified !== true
    || target.everySemanticRuntimeAuthoritative !== true
    || target.everyRequiredOutputCostAuthoritySatisfied !== true
    || target.coverageQaPassed !== true
    || target.callerSourceSummaryUsedAsStudyEvidence !== false
    || !Number.isFinite(target.confidence)
    || target.confidence < 0
    || target.confidence > 1
    || !target.evidenceIds.length
    || !target.runtimeSources.length
    || target.runtimeSources.some((source) => source !== 'verified_live')
  ) invalid('production_planning_target_understanding_invalid')
  if (
    application.targetContextDigest !== calculatePreferenceApplicationTargetContextDigest(application.targetContext)
    || application.contentDigest !== calculatePreferenceApplicationContentDigest({
      applicationVersion: application.applicationVersion,
      applicationSource: application.applicationSource,
      editReferenceId: application.editReferenceId,
      dnaVersionId: application.dnaVersionId,
      dnaVersionNumber: application.dnaVersionNumber,
      dnaContentDigest: application.dnaContentDigest,
      dnaApprovalId: application.dnaApprovalId,
      dnaQaResultId: application.dnaQaResultId,
      targetContext: application.targetContext,
      targetContextDigest: application.targetContextDigest,
      targetUnderstanding: application.targetUnderstanding,
      decisions: application.decisions,
      hintGroups: application.hintGroups,
      doNotCopyRules: application.doNotCopyRules,
      precedencePolicy: application.precedencePolicy,
      summary: application.summary,
    })
  ) invalid('production_planning_application_content_digest_invalid')
  if (
    stableJson(application.precedencePolicy) !== stableJson(EXPECTED_PRECEDENCE)
    || !application.doNotCopyRules.length
    || !application.decisions.length
    || !application.decisions.some((decision) => decision.decision === 'applied' || decision.decision === 'adapted')
    || application.decisions.some((decision) => !ALLOWED_DECISIONS.has(decision.decision))
    || application.decisions.some((decision) => (
      !decision.id.trim()
      || !decision.sourceRuleId.trim()
      || !decision.targetInstruction.trim()
      || !decision.reason.trim()
      || !Number.isFinite(decision.confidence)
      || decision.confidence < 0
      || decision.confidence > 1
    ))
    || new Set(application.decisions.map((decision) => decision.id)).size !== application.decisions.length
    || application.doNotCopyRules.some((rule) => !rule.trim())
    || !application.summary.trim()
  ) invalid('production_planning_copy_safety_or_decisions_invalid')
}

function createUnsignedPlanningContext(input: {
  readonly application: PreferenceApplicationRecord
  readonly request: EditReferenceProductionApplicationLifecycleRequest
  readonly receipt: EditReferenceProductionApplicationLifecycleReceipt
}): PlanningContextWithoutDigest {
  const { application, request, receipt } = input
  const target = application.targetUnderstanding!
  const outputFrameConfirmation = request.outputFrameConfirmation!
  return {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_PLANNING_CONTEXT_VERSION,
    sourceAuthority: 'canonical_application_lifecycle_rpc',
    lifecycleTransactionId: receipt.transactionId,
    lifecycleReceiptDigestSha256: receipt.receiptDigestSha256,
    workspaceId: application.workspaceId,
    projectId: application.projectId,
    editSessionId: application.editSessionId,
    editReferenceId: application.editReferenceId,
    studySessionId: application.studySessionId,
    dnaVersionId: application.dnaVersionId,
    dnaVersionNumber: application.dnaVersionNumber,
    dnaContentDigestSha256: application.dnaContentDigest,
    applicationId: application.id,
    applicationContentDigestSha256: application.contentDigest,
    applicationContextHashSha256: request.applicationContextHashSha256,
    targetContextDigestSha256: application.targetContextDigest,
    targetUnderstandingPackageDigestSha256: target.packageDigestSha256,
    outputFrameConfirmationId: outputFrameConfirmation.confirmationId,
    outputFrameConfirmationDigestSha256: outputFrameConfirmation.authorityDigestSha256,
    committedReferenceRevision: receipt.committedReferenceRevision,
    committedPlanningInputRevision: receipt.committedPlanningInputRevision,
    currentUserInstruction: application.targetContext.currentUserInstruction,
    approvedConstraints: [...application.targetContext.approvedConstraints],
    guidance: application.decisions
      .filter((decision) => decision.decision === 'applied' || decision.decision === 'adapted')
      .map((decision) => ({
        decisionId: decision.id,
        sourceRuleId: decision.sourceRuleId,
        layerId: decision.layerId,
        decision: decision.decision as 'applied' | 'adapted',
        precedence: decision.precedence,
        instruction: decision.targetInstruction,
        reason: decision.reason,
        confidence: decision.confidence,
      })),
    heldBack: application.decisions
      .filter((decision) => decision.decision === 'ignored' || decision.decision === 'blocked')
      .map((decision) => ({
        decisionId: decision.id,
        sourceRuleId: decision.sourceRuleId,
        layerId: decision.layerId,
        decision: decision.decision as 'ignored' | 'blocked',
        reason: decision.reason,
        heldBackReason: decision.heldBackReason ?? decision.reason,
        confidence: decision.confidence,
      })),
    doNotCopyRules: [...application.doNotCopyRules],
    precedencePolicy: [...application.precedencePolicy] as PreferenceApplicationRecord['precedencePolicy'],
    summary: application.summary,
    runtimeSource: 'verified_live',
    freshPlanAndEstimateRequired: true,
    approvedSnapshotPreserved: true,
    historicalPrivatePreviewPreserved: true,
    executionAuthorizationDisposition: receipt.executionAuthorizationDisposition,
    rawReferenceMediaIncluded: false,
    rawProviderPayloadIncluded: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    providerOrWorkerExecutionStarted: false,
  }
}

function applicationContextCore(application: PreferenceApplicationRecord): unknown {
  return {
    schemaVersion: 'edit-reference-production-application-context-core-v1',
    workspaceId: application.workspaceId,
    projectId: application.projectId,
    editSessionId: application.editSessionId,
    editReferenceId: application.editReferenceId,
    studySessionId: application.studySessionId,
    dnaVersionId: application.dnaVersionId,
    dnaVersionNumber: application.dnaVersionNumber,
    dnaContentDigestSha256: application.dnaContentDigest,
    applicationId: application.id,
    applicationContentDigestSha256: application.contentDigest,
    targetContextDigestSha256: application.targetContextDigest,
    targetUnderstandingPackageDigestSha256: application.targetUnderstanding?.packageDigestSha256,
    currentUserInstruction: application.targetContext.currentUserInstruction,
    approvedConstraints: application.targetContext.approvedConstraints,
    decisions: application.decisions,
    doNotCopyRules: application.doNotCopyRules,
    precedencePolicy: application.precedencePolicy,
    summary: application.summary,
  }
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
  if (serialized === undefined) invalid('production_planning_non_canonical_value')
  return serialized
}

function invalid(reason: string): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The production Edit Reference planning context is incomplete or unsafe.',
    503,
    { reason, remoteMutationAttempted: false },
  )
}
