import { createHash } from 'node:crypto'
import type { ResolvedPlanningInputAuthorityBinding } from '../validation/planning-input-authority-binding-schemas'
import { ApiError } from '../errors/api-error'
import type {
  EditReferenceProductionPlanningAuthorityAppliedResolution,
  EditReferenceProductionPlanningAuthorityResolution,
} from './edit-reference-production-planning-authority'
import {
  EDIT_REFERENCE_PRODUCTION_PLANNING_CONTEXT_VERSION,
  type EditReferenceProductionPlanningContext,
} from './edit-reference-production-planning-context'

export const EDIT_REFERENCE_PRODUCTION_PLANNER_BINDING_ADAPTER_VERSION =
  'edit-reference-production-planner-binding-adapter-v1' as const

export const EDIT_REFERENCE_PRODUCTION_PLANNER_INSTRUCTION_PRIORITY = [
  'safety_legal_and_do_not_copy',
  'latest_explicit_user_instruction',
  'confirmed_edit_brief_marker',
  'approved_project_override',
  'selected_preference_dna',
  'general_defaults',
  'deterministic_fallback',
] as const

type AppliedPreferenceApplicationBinding = Extract<
  ResolvedPlanningInputAuthorityBinding['preferenceApplication'],
  { status: 'applied' }
>

export type EditReferenceProductionPlannerPreferenceApplicationBinding =
  ResolvedPlanningInputAuthorityBinding['preferenceApplication']

export interface EditReferenceProductionPlannerBindingAdapterReceipt {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_PLANNER_BINDING_ADAPTER_VERSION
  readonly sourceAuthority: 'canonical_edit_reference_production_repository'
  readonly repositoryReadRevision: number
  readonly rlsPolicyVersion: string
  readonly accessCheckReceiptId: string
  readonly lineage: {
    readonly editReferenceId: string
    readonly editReferenceName: string
    readonly studySessionId: string
    readonly dnaVersionId: string
    readonly dnaVersionNumber: number
    readonly dnaContentDigestSha256: string
    readonly dnaApprovalId: string
    readonly dnaQaResultId: string
    readonly applicationId: string
    readonly applicationVersionNumber: number
    readonly applicationContentDigestSha256: string
    readonly applicationContextHashSha256: string
    readonly lifecycleTransactionId: string
    readonly lifecycleReceiptDigestSha256: string
    readonly targetUnderstandingPackageDigestSha256: string
    readonly outputFrameConfirmationId: string
    readonly outputFrameConfirmationDigestSha256: string
    readonly planningContextDigestSha256: string
  }
  readonly preferenceApplication: AppliedPreferenceApplicationBinding
  readonly noLegacyPreferenceIntelligenceStoreRead: true
  readonly browserSuppliedPlannerContextTrusted: false
  readonly rawReferenceMediaIncluded: false
  readonly rawProviderPayloadIncluded: false
  readonly sharedPlannerMutationMade: false
  readonly providerOrWorkerExecutionStarted: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly adapterDigestSha256: string
}

type ReceiptWithoutDigest = Omit<EditReferenceProductionPlannerBindingAdapterReceipt, 'adapterDigestSha256'>

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MAX_RULES_PER_GROUP = 64
const MAX_BOUNDARY_ITEMS = 128
const MAX_RULE_LENGTH = 1_000

/**
 * Converts the canonical, tenant-verified Edit Reference application into the
 * existing planner preference-binding shape without reading the legacy
 * private-preference-intelligence store.
 *
 * The returned receipt is a reconciliation artifact only. It does not mutate
 * the shared planner, publish a plan, approve an estimate, or start execution.
 */
export function createEditReferenceProductionPlannerBindingAdapterReceipt(
  resolution: EditReferenceProductionPlanningAuthorityAppliedResolution,
): EditReferenceProductionPlannerBindingAdapterReceipt {
  validateResolution(resolution)
  const context = resolution.planningContext
  const relevantRules = buildRelevantRules(context)
  const nonTransferableElements = unique(context.heldBack.map((item) => item.instruction))
  const qaWarnings = unique(
    context.heldBack
      .filter((item) => item.decision === 'blocked')
      .map((item) => item.heldBackReason),
  )
  assertRuleCollection(nonTransferableElements, MAX_BOUNDARY_ITEMS, 'non_transferable_elements')
  assertRuleCollection(qaWarnings, MAX_BOUNDARY_ITEMS, 'qa_warnings')
  const confidence = Math.min(
    context.targetUnderstandingConfidence,
    ...context.guidance.map((item) => item.confidence),
    ...context.heldBack.map((item) => item.confidence),
  )
  const preferenceApplication: AppliedPreferenceApplicationBinding = {
    status: 'applied',
    applicationId: context.applicationId,
    applicationVersion: context.applicationVersionNumber,
    preferenceId: context.editReferenceId,
    dnaVersionId: context.dnaVersionId,
    dnaVersion: context.dnaVersionNumber,
    applicationHash: context.contextDigestSha256,
    plannerContext: {
      compact: true,
      audience: 'planner',
      preferenceId: context.editReferenceId,
      preferenceName: context.editReferenceName,
      preferenceDNAId: context.dnaVersionId,
      preferenceDNAVersion: context.dnaVersionNumber,
      runtimeState: 'verified_live',
      qaStatus: 'passed',
      confidence,
      relevantRules,
      doNotCopyRules: [...context.doNotCopyRules],
      nonTransferableElements,
      qaWarnings,
      instructionPriority: [...EDIT_REFERENCE_PRODUCTION_PLANNER_INSTRUCTION_PRIORITY],
    },
  }
  const receiptWithoutDigest: ReceiptWithoutDigest = {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_PLANNER_BINDING_ADAPTER_VERSION,
    sourceAuthority: 'canonical_edit_reference_production_repository',
    repositoryReadRevision: resolution.readRevision,
    rlsPolicyVersion: resolution.rlsPolicyVersion,
    accessCheckReceiptId: resolution.accessCheckReceiptId,
    lineage: {
      editReferenceId: context.editReferenceId,
      editReferenceName: context.editReferenceName,
      studySessionId: context.studySessionId,
      dnaVersionId: context.dnaVersionId,
      dnaVersionNumber: context.dnaVersionNumber,
      dnaContentDigestSha256: context.dnaContentDigestSha256,
      dnaApprovalId: context.dnaApprovalId,
      dnaQaResultId: context.dnaQaResultId,
      applicationId: context.applicationId,
      applicationVersionNumber: context.applicationVersionNumber,
      applicationContentDigestSha256: context.applicationContentDigestSha256,
      applicationContextHashSha256: context.applicationContextHashSha256,
      lifecycleTransactionId: context.lifecycleTransactionId,
      lifecycleReceiptDigestSha256: context.lifecycleReceiptDigestSha256,
      targetUnderstandingPackageDigestSha256: context.targetUnderstandingPackageDigestSha256,
      outputFrameConfirmationId: context.outputFrameConfirmationId,
      outputFrameConfirmationDigestSha256: context.outputFrameConfirmationDigestSha256,
      planningContextDigestSha256: context.contextDigestSha256,
    },
    preferenceApplication,
    noLegacyPreferenceIntelligenceStoreRead: true,
    browserSuppliedPlannerContextTrusted: false,
    rawReferenceMediaIncluded: false,
    rawProviderPayloadIncluded: false,
    sharedPlannerMutationMade: false,
    providerOrWorkerExecutionStarted: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  return {
    ...receiptWithoutDigest,
    adapterDigestSha256: sha256(receiptWithoutDigest),
  }
}

export function createEditReferenceProductionPlannerPreferenceApplicationBinding(
  resolution: EditReferenceProductionPlanningAuthorityResolution,
): EditReferenceProductionPlannerPreferenceApplicationBinding {
  if (resolution.status === 'not_selected') {
    validateNonAppliedResolution(resolution)
    return {
      status: 'not_selected',
      applicationVersion: 0,
      applicationHash: resolution.applicationHash,
    }
  }
  if (resolution.status === 'cleared') {
    validateNonAppliedResolution(resolution)
    return {
      status: 'cleared',
      applicationId: resolution.applicationId,
      applicationVersion: resolution.applicationVersion,
      applicationHash: resolution.applicationHash,
    }
  }
  return createEditReferenceProductionPlannerBindingAdapterReceipt(resolution).preferenceApplication
}

export function validateEditReferenceProductionPlannerBindingAdapterReceipt(
  receipt: EditReferenceProductionPlannerBindingAdapterReceipt,
): void {
  const { adapterDigestSha256, ...receiptWithoutDigest } = receipt
  if (
    receipt.schemaVersion !== EDIT_REFERENCE_PRODUCTION_PLANNER_BINDING_ADAPTER_VERSION
    || receipt.sourceAuthority !== 'canonical_edit_reference_production_repository'
    || !SHA256_PATTERN.test(adapterDigestSha256)
    || adapterDigestSha256 !== sha256(receiptWithoutDigest)
    || receipt.noLegacyPreferenceIntelligenceStoreRead !== true
    || receipt.browserSuppliedPlannerContextTrusted !== false
    || receipt.rawReferenceMediaIncluded !== false
    || receipt.rawProviderPayloadIncluded !== false
    || receipt.sharedPlannerMutationMade !== false
    || receipt.providerOrWorkerExecutionStarted !== false
    || receipt.customerPriceCalculated !== false
    || receipt.customerCreditsMutated !== false
    || receipt.serviceFeeIncluded !== false
  ) invalid('planner_binding_adapter_receipt_invalid')
  for (const value of [
    receipt.lineage.editReferenceId,
    receipt.lineage.studySessionId,
    receipt.lineage.dnaVersionId,
    receipt.lineage.dnaApprovalId,
    receipt.lineage.dnaQaResultId,
    receipt.lineage.applicationId,
    receipt.lineage.lifecycleTransactionId,
    receipt.lineage.outputFrameConfirmationId,
    receipt.rlsPolicyVersion,
    receipt.accessCheckReceiptId,
  ]) {
    if (!ID_PATTERN.test(value)) invalid('planner_binding_adapter_receipt_lineage_id_invalid')
  }
  for (const value of [
    receipt.lineage.dnaContentDigestSha256,
    receipt.lineage.applicationContentDigestSha256,
    receipt.lineage.applicationContextHashSha256,
    receipt.lineage.lifecycleReceiptDigestSha256,
    receipt.lineage.targetUnderstandingPackageDigestSha256,
    receipt.lineage.outputFrameConfirmationDigestSha256,
    receipt.lineage.planningContextDigestSha256,
  ]) {
    if (!SHA256_PATTERN.test(value)) invalid('planner_binding_adapter_receipt_lineage_digest_invalid')
  }
  if (
    receipt.preferenceApplication.applicationId !== receipt.lineage.applicationId
    || receipt.preferenceApplication.applicationVersion !== receipt.lineage.applicationVersionNumber
    || receipt.preferenceApplication.preferenceId !== receipt.lineage.editReferenceId
    || receipt.preferenceApplication.dnaVersionId !== receipt.lineage.dnaVersionId
    || receipt.preferenceApplication.dnaVersion !== receipt.lineage.dnaVersionNumber
    || receipt.preferenceApplication.applicationHash !== receipt.lineage.planningContextDigestSha256
    || receipt.preferenceApplication.plannerContext.preferenceName !== receipt.lineage.editReferenceName
    || receipt.preferenceApplication.plannerContext.qaStatus !== 'passed'
    || stableJson(receipt.preferenceApplication.plannerContext.instructionPriority)
      !== stableJson(EDIT_REFERENCE_PRODUCTION_PLANNER_INSTRUCTION_PRIORITY)
  ) invalid('planner_binding_adapter_lineage_invalid')
}

function validateResolution(resolution: EditReferenceProductionPlanningAuthorityAppliedResolution): void {
  const context = resolution.planningContext
  const { contextDigestSha256, ...contextWithoutDigest } = context
  if (
    resolution.sourceAuthority !== 'canonical_edit_reference_production_repository'
    || !Number.isInteger(resolution.readRevision)
    || resolution.readRevision < 0
    || !ID_PATTERN.test(resolution.rlsPolicyVersion)
    || !ID_PATTERN.test(resolution.accessCheckReceiptId)
    || resolution.rawReferenceMediaIncluded !== false
    || resolution.rawProviderPayloadIncluded !== false
    || context.schemaVersion !== EDIT_REFERENCE_PRODUCTION_PLANNING_CONTEXT_VERSION
    || context.sourceAuthority !== 'canonical_application_lifecycle_rpc'
    || context.runtimeSource !== 'verified_live'
    || context.rawReferenceMediaIncluded !== false
    || context.rawProviderPayloadIncluded !== false
    || context.providerOrWorkerExecutionStarted !== false
    || context.customerPriceCalculated !== false
    || context.customerCreditsMutated !== false
    || context.serviceFeeIncluded !== false
    || !SHA256_PATTERN.test(contextDigestSha256)
    || contextDigestSha256 !== sha256(contextWithoutDigest)
  ) invalid('planner_binding_adapter_resolution_invalid')
  for (const value of [
    context.workspaceId,
    context.projectId,
    context.editSessionId,
    context.editReferenceId,
    context.studySessionId,
    context.dnaVersionId,
    context.dnaApprovalId,
    context.dnaQaResultId,
    context.applicationId,
    context.lifecycleTransactionId,
    context.outputFrameConfirmationId,
  ]) {
    if (!ID_PATTERN.test(value)) invalid('planner_binding_adapter_lineage_id_invalid')
  }
  for (const value of [
    context.dnaContentDigestSha256,
    context.applicationContentDigestSha256,
    context.applicationContextHashSha256,
    context.lifecycleReceiptDigestSha256,
    context.targetUnderstandingPackageDigestSha256,
    context.outputFrameConfirmationDigestSha256,
  ]) {
    if (!SHA256_PATTERN.test(value)) invalid('planner_binding_adapter_lineage_digest_invalid')
  }
  if (
    !context.editReferenceName.trim()
    || context.editReferenceName.length > 120
    || !Number.isInteger(context.applicationVersionNumber)
    || context.applicationVersionNumber < 1
    || !Number.isInteger(context.dnaVersionNumber)
    || context.dnaVersionNumber < 1
    || !Number.isFinite(context.targetUnderstandingConfidence)
    || context.targetUnderstandingConfidence < 0
    || context.targetUnderstandingConfidence > 1
    || context.guidance.length < 1
  ) invalid('planner_binding_adapter_lineage_value_invalid')
  assertRuleCollection(context.doNotCopyRules, MAX_BOUNDARY_ITEMS, 'do_not_copy_rules')
}

function validateNonAppliedResolution(
  resolution: Exclude<EditReferenceProductionPlanningAuthorityResolution, { status: 'applied' }>,
): void {
  if (
    resolution.sourceAuthority !== 'canonical_edit_reference_production_repository'
    || !Number.isInteger(resolution.readRevision)
    || resolution.readRevision < 0
    || !ID_PATTERN.test(resolution.rlsPolicyVersion)
    || !ID_PATTERN.test(resolution.accessCheckReceiptId)
    || resolution.rawReferenceMediaIncluded !== false
    || resolution.rawProviderPayloadIncluded !== false
    || !SHA256_PATTERN.test(resolution.applicationHash)
  ) invalid('planner_binding_adapter_non_applied_resolution_invalid')
  if (resolution.status === 'not_selected') {
    if (resolution.applicationVersion !== 0) {
      invalid('planner_binding_adapter_not_selected_version_invalid')
    }
    return
  }
  if (
    !ID_PATTERN.test(resolution.applicationId)
    || !ID_PATTERN.test(resolution.lifecycleTransactionId)
    || !SHA256_PATTERN.test(resolution.lifecycleReceiptDigestSha256)
    || resolution.applicationHash !== resolution.lifecycleReceiptDigestSha256
    || !Number.isInteger(resolution.applicationVersion)
    || resolution.applicationVersion < 1
    || !Number.isInteger(resolution.committedPlanningInputRevision)
    || resolution.committedPlanningInputRevision < 1
  ) invalid('planner_binding_adapter_cleared_resolution_invalid')
}

function buildRelevantRules(context: EditReferenceProductionPlanningContext): Record<string, string[]> {
  const grouped = new Map<string, string[]>()
  for (const item of context.guidance) {
    appendUnique(grouped, item.layerId, item.instruction)
  }
  for (const constraint of context.approvedConstraints) {
    appendUnique(grouped, 'approved_constraints', constraint)
  }
  const result: Record<string, string[]> = {}
  for (const key of [...grouped.keys()].sort()) {
    const rules = grouped.get(key)!
    assertRuleCollection(rules, MAX_RULES_PER_GROUP, `relevant_rules_${key}`)
    result[key] = rules
  }
  return result
}

function appendUnique(grouped: Map<string, string[]>, key: string, value: string): void {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > MAX_RULE_LENGTH) invalid('planner_binding_adapter_rule_invalid')
  const values = grouped.get(key) ?? []
  if (!values.includes(trimmed)) values.push(trimmed)
  grouped.set(key, values)
}

function unique(values: readonly string[]): string[] {
  const result: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed || trimmed.length > MAX_RULE_LENGTH) invalid('planner_binding_adapter_rule_invalid')
    if (!result.includes(trimmed)) result.push(trimmed)
  }
  return result
}

function assertRuleCollection(
  values: readonly string[],
  maximum: number,
  field: string,
): void {
  if (
    values.length > maximum
    || values.some((value) => !value.trim() || value.length > MAX_RULE_LENGTH)
  ) invalid(`planner_binding_adapter_${field}_invalid`)
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
  if (serialized === undefined) invalid('planner_binding_adapter_non_canonical_value')
  return serialized
}

function invalid(reason: string): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The approved Edit Reference cannot be bound safely to the canonical planner.',
    503,
    { reason, remoteMutationAttempted: false },
  )
}
