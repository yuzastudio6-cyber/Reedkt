import { z } from 'zod'

import type { CanonicalApprovedExecutionAuthority } from '../../services/edit-planning-authority-service'
import { sha256AuthorityValue } from '../../services/private-edit-authority-store'
import {
  CANONICAL_STORYTELLING_STYLE_AUTHORITY_COMPONENT_KEY,
  canonicalStorytellingStyleAuthoritySchema,
} from '../../validation/canonical-storytelling-style-authority-schemas'
import { PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION } from '../../validation/edit-planning-authority-schemas'
import { sha256CanonicalJson } from '../commands/canonical-json'

export const MOTION_STUDIO_CANONICAL_APPROVED_STORYTELLING_STYLE_BINDING_VERSION =
  'motion-studio.canonical-approved-storytelling-style-binding.v1' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const jsonBlobRefSchema = z.object({
  sha256: digestSchema,
  byteLength: z.number().int().positive().max(2 * 1024 * 1024),
}).strict()

export const canonicalApprovedStorytellingStyleBindingSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CANONICAL_APPROVED_STORYTELLING_STYLE_BINDING_VERSION,
  ),
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshot: z.object({
    snapshotId: stableIdSchema,
    snapshotHash: digestSchema,
    planId: stableIdSchema,
    planVersion: z.number().int().positive(),
    planHash: digestSchema,
    estimateId: stableIdSchema,
    estimateHash: digestSchema,
    approvalId: stableIdSchema,
    reservationId: stableIdSchema,
    approvedByUserId: stableIdSchema,
    approvedAt: z.string().datetime({ offset: true }),
  }).strict(),
  canonicalStyleComponent: z.object({
    componentKey: z.literal(CANONICAL_STORYTELLING_STYLE_AUTHORITY_COMPONENT_KEY),
    componentRef: jsonBlobRefSchema,
    componentDigest: digestSchema,
    authority: canonicalStorytellingStyleAuthoritySchema,
  }).strict(),
  approvalState: z.literal('canonical_approved_snapshot_bound'),
  decisionAuthority: z.literal('existing_plan_review'),
  previousApprovedSnapshotRemainsImmutable: z.literal(true),
  runtimeExecutionAuthorized: z.literal(false),
  providerExecutionAuthorized: z.literal(false),
  customerPriceCalculatedHere: z.literal(false),
  customerCreditsMutatedHere: z.literal(false),
  billingMutationPerformed: z.literal(false),
  canonicalAuthorityTestOnly: z.literal(true),
  productionReady: z.literal(false),
  bindingDigest: digestSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const styleAuthority = value.canonicalStyleComponent.authority
  if (
    styleAuthority.workspaceId !== value.workspaceId ||
    styleAuthority.projectId !== value.projectId ||
    styleAuthority.editSessionId !== value.editSessionId ||
    styleAuthority.productionId !== value.productionId
  ) {
    context.addIssue({
      code: 'custom',
      path: ['canonicalStyleComponent', 'authority'],
      message: 'Canonical Storytelling style binding changed its exact production scope.',
    })
  }
  if (
    value.canonicalStyleComponent.componentRef.sha256 !==
      value.canonicalStyleComponent.componentDigest ||
    sha256AuthorityValue(styleAuthority) !== value.canonicalStyleComponent.componentDigest
  ) {
    context.addIssue({
      code: 'custom',
      path: ['canonicalStyleComponent', 'componentDigest'],
      message: 'Canonical Storytelling style component digest verification failed.',
    })
  }
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.bindingDigest
  if (sha256CanonicalJson(unsigned) !== value.bindingDigest) {
    context.addIssue({
      code: 'custom',
      path: ['bindingDigest'],
      message: 'Canonical approved Storytelling style binding digest verification failed.',
    })
  }
})

export type CanonicalApprovedStorytellingStyleBinding = z.infer<
  typeof canonicalApprovedStorytellingStyleBindingSchema
>

type CanonicalStorytellingStyleExecutionAuthority = Pick<
  CanonicalApprovedExecutionAuthority,
  'snapshot' | 'plan' | 'estimate' | 'reservation' | 'approval' | 'components' |
  'workItems' | 'testOnly'
>

/**
 * Projects the one canonical approved snapshot into Motion-owned read-only
 * style authority. It creates no plan, approval, reservation, persistence,
 * execution, provider, or commercial authority.
 */
export function createCanonicalApprovedStorytellingStyleBinding(
  authority: CanonicalStorytellingStyleExecutionAuthority,
): CanonicalApprovedStorytellingStyleBinding {
  if (authority.testOnly !== true) {
    throw new Error('Canonical Storytelling style binding requires verified canonical authority.')
  }
  const styleAuthority = canonicalStorytellingStyleAuthoritySchema.parse(
    authority.components.motionStudioStorytellingStyleAuthority,
  )
  const snapshot = authority.snapshot
  const plan = authority.plan
  const componentRef = snapshot.componentRefs[
    CANONICAL_STORYTELLING_STYLE_AUTHORITY_COMPONENT_KEY
  ]
  const planComponentRef = plan.componentRefs[
    CANONICAL_STORYTELLING_STYLE_AUTHORITY_COMPONENT_KEY
  ]
  if (!componentRef || !planComponentRef) {
    throw new Error('Canonical approved snapshot is missing Storytelling style authority.')
  }
  if (
    componentRef.sha256 !== planComponentRef.sha256 ||
    componentRef.byteLength !== planComponentRef.byteLength ||
    componentRef.sha256 !== sha256AuthorityValue(styleAuthority)
  ) {
    throw new Error('Canonical Storytelling style component reference verification failed.')
  }
  assertCanonicalApprovalLineage(authority)
  if (
    styleAuthority.workspaceId !== snapshot.workspaceId ||
    styleAuthority.projectId !== snapshot.projectId ||
    styleAuthority.editSessionId !== snapshot.editSessionId
  ) {
    throw new Error('Canonical Storytelling style authority changed its approved snapshot scope.')
  }

  const base = {
    schemaVersion:
      MOTION_STUDIO_CANONICAL_APPROVED_STORYTELLING_STYLE_BINDING_VERSION,
    workspaceId: snapshot.workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    productionId: styleAuthority.productionId,
    approvedSnapshot: {
      snapshotId: snapshot.snapshotId,
      snapshotHash: snapshot.snapshotHash,
      planId: snapshot.planId,
      planVersion: snapshot.planVersion,
      planHash: snapshot.planHash,
      estimateId: snapshot.estimateId,
      estimateHash: snapshot.estimateHash,
      approvalId: snapshot.approvalId,
      reservationId: snapshot.reservationId,
      approvedByUserId: snapshot.approvedByUserId,
      approvedAt: snapshot.approvedAt,
    },
    canonicalStyleComponent: {
      componentKey: CANONICAL_STORYTELLING_STYLE_AUTHORITY_COMPONENT_KEY,
      componentRef: { ...componentRef },
      componentDigest: componentRef.sha256,
      authority: styleAuthority,
    },
    approvalState: 'canonical_approved_snapshot_bound' as const,
    decisionAuthority: 'existing_plan_review' as const,
    previousApprovedSnapshotRemainsImmutable: true as const,
    runtimeExecutionAuthorized: false as const,
    providerExecutionAuthorized: false as const,
    customerPriceCalculatedHere: false as const,
    customerCreditsMutatedHere: false as const,
    billingMutationPerformed: false as const,
    canonicalAuthorityTestOnly: true as const,
    productionReady: false as const,
    immutable: true as const,
  }
  return deepFreeze(canonicalApprovedStorytellingStyleBindingSchema.parse({
    ...base,
    bindingDigest: sha256CanonicalJson(base),
  }))
}

export function verifyCanonicalApprovedStorytellingStyleBinding(
  value: CanonicalApprovedStorytellingStyleBinding,
): boolean {
  return canonicalApprovedStorytellingStyleBindingSchema.safeParse(value).success
}

function assertCanonicalApprovalLineage(
  authority: CanonicalStorytellingStyleExecutionAuthority,
): void {
  const { snapshot, plan, estimate, approval, reservation } = authority
  const snapshotWithoutHash = { ...snapshot } as Record<string, unknown>
  delete snapshotWithoutHash.snapshotHash
  if (
    snapshot.schemaVersion !== 'private-edit-authority-approved-snapshot-v3' ||
    sha256AuthorityValue(snapshotWithoutHash) !== snapshot.snapshotHash
  ) {
    throw new Error('Canonical approved snapshot digest verification failed.')
  }
  if (
    plan.status !== 'approved' ||
    plan.id !== snapshot.planId ||
    plan.projectId !== snapshot.projectId ||
    plan.editSessionId !== snapshot.editSessionId ||
    plan.planVersion !== snapshot.planVersion ||
    plan.planHash !== snapshot.planHash ||
    plan.estimateId !== snapshot.estimateId ||
    plan.workGraphHash !== snapshot.workGraphHash ||
    plan.sourceSequenceHash !== snapshot.sourceSequenceHash ||
    plan.timingHash !== snapshot.timingHash ||
    sha256AuthorityValue(plan.componentRefs) !== sha256AuthorityValue(snapshot.componentRefs)
  ) {
    throw new Error('Canonical Storytelling style binding received inconsistent plan lineage.')
  }
  const workGraphHash = sha256AuthorityValue(authority.workItems.map((workItem) => ({
    workItemKey: workItem.workItemKey,
    workItemType: workItem.workItemType,
    workerClass: workItem.workerClass,
    sourceSequenceItemIds: workItem.sourceSequenceItemIds,
    sourceCleanupDecisionIds: workItem.sourceCleanupDecisionIds,
    expectedOutputs: workItem.expectedOutputs,
    dependencyKeys: workItem.dependencyKeys,
    approvedToolIds: workItem.approvedToolIds,
    approvedProviderRoute: workItem.approvedProviderRoute,
    providerExecutionMode: workItem.providerExecutionMode,
    maxAttempts: workItem.maxAttempts,
    attemptTimeoutSeconds: workItem.attemptTimeoutSeconds,
    scheduledDelaySeconds: workItem.scheduledDelaySeconds,
    maximumCreditBudget: workItem.maximumCreditBudget,
    required: workItem.required,
    executionInputRef: workItem.executionInputRef,
    fallbackPolicyRef: workItem.fallbackPolicyRef,
  })))
  const approvedWorkItemIds = authority.workItems.map((workItem) => workItem.id)
  const sourceWorkItemIds = authority.workItems.map((workItem) => workItem.sourceWorkItemId)
  if (
    workGraphHash !== plan.workGraphHash ||
    workGraphHash !== snapshot.workGraphHash ||
    sha256AuthorityValue(approvedWorkItemIds) !== sha256AuthorityValue(snapshot.approvedWorkItemIds) ||
    sha256AuthorityValue(sourceWorkItemIds) !== sha256AuthorityValue(plan.workItemIds) ||
    authority.workItems.some((workItem) => workItem.snapshotId !== snapshot.snapshotId)
  ) {
    throw new Error('Canonical Storytelling style binding received inconsistent work-graph lineage.')
  }
  const sourceSequenceRef = plan.componentRefs.sourceSequence
  const timingHash = sha256AuthorityValue({
    masterTimingPlan: plan.componentRefs.masterTimingPlan,
    captionVisualCueTimingPlan: plan.componentRefs.captionVisualCueTimingPlan,
    soundSyncTransitionTimingPlan: plan.componentRefs.soundSyncTransitionTimingPlan,
    timingValidationPlan: plan.componentRefs.timingValidationPlan,
    timingSummary: plan.componentRefs.timingSummary,
  })
  if (
    !sourceSequenceRef ||
    sourceSequenceRef.sha256 !== plan.sourceSequenceHash ||
    sourceSequenceRef.sha256 !== snapshot.sourceSequenceHash ||
    timingHash !== plan.timingHash ||
    timingHash !== snapshot.timingHash ||
    sha256AuthorityValue({
      schemaVersion: PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION,
      componentRefs: plan.componentRefs,
      workGraphHash,
    }) !== plan.planHash
  ) {
    throw new Error('Canonical Storytelling style binding received inconsistent source or timing lineage.')
  }
  const validForSeconds = Math.floor(
    (Date.parse(estimate.validUntil) - Date.parse(estimate.createdAt)) / 1_000,
  )
  const estimateHash = sha256AuthorityValue({
    lineItems: estimate.lineItems,
    fallbackAllowanceCredits: estimate.fallbackAllowanceCredits,
    validForSeconds,
    estimatedCredits: estimate.estimatedCredits,
    approvedMaximumCredits: estimate.approvedMaximumCredits,
  })
  if (
    estimate.status !== 'approved' ||
    !Number.isSafeInteger(validForSeconds) ||
    validForSeconds <= 0 ||
    estimate.id !== snapshot.estimateId ||
    estimate.planId !== snapshot.planId ||
    estimate.estimateHash !== snapshot.estimateHash ||
    estimateHash !== estimate.estimateHash
  ) {
    throw new Error('Canonical Storytelling style binding received inconsistent estimate lineage.')
  }
  if (
    approval.id !== snapshot.approvalId ||
    approval.planId !== snapshot.planId ||
    approval.estimateId !== snapshot.estimateId ||
    approval.snapshotId !== snapshot.snapshotId ||
    approval.reservationId !== snapshot.reservationId ||
    approval.approvedByUserId !== snapshot.approvedByUserId ||
    approval.approvedAt !== snapshot.approvedAt
  ) {
    throw new Error('Canonical Storytelling style binding received inconsistent approval lineage.')
  }
  if (
    reservation.id !== snapshot.reservationId ||
    reservation.approvalId !== snapshot.approvalId ||
    reservation.snapshotId !== snapshot.snapshotId ||
    reservation.estimateId !== snapshot.estimateId ||
    reservation.planId !== snapshot.planId ||
    reservation.projectId !== snapshot.projectId ||
    reservation.editSessionId !== snapshot.editSessionId
  ) {
    throw new Error('Canonical Storytelling style binding received inconsistent reservation lineage.')
  }
  const remainingReservedCredits = reservation.reservedCredits - reservation.spentCredits -
    reservation.releasedCredits - reservation.refundedCredits
  const reservationExpiresAt = Date.parse(reservation.expiresAt)
  if (
    !['reserved', 'partially_spent'].includes(reservation.status) ||
    remainingReservedCredits <= 0 ||
    !Number.isFinite(reservationExpiresAt) ||
    reservationExpiresAt <= Date.now()
  ) {
    throw new Error('Canonical Storytelling style binding requires an active funded reservation.')
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}
