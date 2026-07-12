import { randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import { isExplicitLocalInternalTestRuntime } from '../middleware/canonical-worker-runtime'
import { isProductionToolId } from '../tool-registry'
import { resolveCompleteProfessionalToolOperationSpec } from '../tool-execution/core-registry-operations/core-registry-operation-specs'
import type { ServiceContext } from '../types'
import type {
  ApproveCanonicalEditPlanBody,
  CanonicalPlanComponentsInput,
  CanonicalWorkItemInput,
  PublishCanonicalEditPlanBody,
} from '../validation/edit-planning-authority-schemas'
import {
  canonicalPlanningHandoffPublicationBindingSchema,
  type CanonicalPlanningHandoffPublicationBinding,
} from '../validation/canonical-planning-handoff-schemas'
import {
  resolvedPlanningInputAuthorityBindingSchema,
  type ResolvedPlanningInputAuthorityBinding,
} from '../validation/planning-input-authority-binding-schemas'
import {
  approvedSourceBindingManifestSchema,
  sourceBindingManifestCandidateSchema,
  type ApprovedSourceBindingManifest,
  type SourceBindingManifestCandidate,
  type SourceMediaAuthorityExpectation,
} from '../validation/source-media-authority-schemas'
import {
  PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION,
  approveCanonicalEditPlanSchema,
  canonicalPlanComponentsSchema,
  authorityPlannedAssetManifestSchema,
  publishCanonicalEditPlanSchema,
} from '../validation/edit-planning-authority-schemas'
import { getRequiredAuthUserId, nowIso } from './service-helpers'
import { createCanonicalPrivateReviewDecisionService } from './canonical-private-review-decision-service'
import { createProjectService } from './project-service'
import {
  type AuthorityApprovedSnapshotManifest,
  type AuthorityApprovedWorkItemRecord,
  type AuthorityCreditEstimateRecord,
  type AuthorityDerivedJobRecord,
  type AuthorityJsonBlobRef,
  type AuthorityPlanRecord,
  type AuthorityPlanWorkItemRecord,
  type AuthorityPlannedAssetManifest,
  type PrivateEditAuthorityAggregate,
  mutatePrivateEditAuthorityAggregate,
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
  stableAuthorityStringify,
  walletBalanceAfter,
} from './private-edit-authority-store'
import { authorizeWorkspaceAccess } from './workspace-access-service'
import { createSourceMediaAuthorityService } from './source-media-authority-service'
import {
  resolvePlanningInputAuthorityBinding,
  revalidatePlanningInputAuthorityBinding,
  planningInputAuthorityExpectationFromResolvedBinding,
} from './planning-input-authority-binding-service'

export interface CanonicalApprovedExecutionWorkItem extends AuthorityApprovedWorkItemRecord {
  executionInput: Record<string, unknown>
  fallbackPolicy: Record<string, unknown>
}

export interface CanonicalApprovedExecutionAuthority {
  authorityRevision: number
  snapshot: AuthorityApprovedSnapshotManifest
  plan: AuthorityPlanRecord
  estimate: AuthorityCreditEstimateRecord
  reservation: PrivateEditAuthorityAggregate['reservations'][number]
  approval: PrivateEditAuthorityAggregate['approvals'][number]
  components: CanonicalPlanComponentsInput
  assetManifest: AuthorityPlannedAssetManifest
  planningInputAuthority: ResolvedPlanningInputAuthorityBinding
  planningHandoffAuthority?: CanonicalPlanningHandoffPublicationBinding
  sourceAssetManifest: ApprovedSourceBindingManifest
  workItems: CanonicalApprovedExecutionWorkItem[]
  jobs: AuthorityDerivedJobRecord[]
  testOnly: true
}

const PLAN_COMPONENT_NAMES = [
  'compiledIntent',
  'professionalEditingDirective',
  'confirmedSettings',
  'sourceSequence',
  'sourceCleanupSummary',
  'sourceCleanupPlan',
  'masterTimingPlan',
  'captionVisualCueTimingPlan',
  'soundSyncTransitionTimingPlan',
  'timingValidationPlan',
  'timingSummary',
  'segments',
  'visualAssetPlan',
  'rendererPlan',
  'toolStrategyPlan',
  'qaPlan',
  'qaSummary',
  'providerPolicy',
  'fallbackPolicy',
] as const satisfies readonly (keyof CanonicalPlanComponentsInput)[]

const SNAPSHOT_COMPONENT_NAMES = [...PLAN_COMPONENT_NAMES, 'planningInputAuthority', 'sourceMediaAuthority'] as const

export interface PublishCanonicalEditPlanInput extends PublishCanonicalEditPlanBody {
  projectId: string
  editSessionId: string
  idempotencyKey: string
  requestPath?: string
  planningHandoffBinding?: CanonicalPlanningHandoffPublicationBinding
}

export interface ApproveCanonicalEditPlanInput extends ApproveCanonicalEditPlanBody {
  editPlanId: string
  idempotencyKey: string
  requestPath?: string
}

export function canonicalPlanningHandoffPublicationRequestHash(input: {
  workspaceId: string
  projectId: string
  editSessionId: string
  handoffId: string
  handoffHash: string
  body: PublishCanonicalEditPlanBody
}): string {
  return sha256AuthorityValue({
    operation: 'publish_canonical_plan_from_persisted_handoff',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    handoffId: input.handoffId,
    handoffHash: input.handoffHash,
    planningRequestId: input.body.planningRequestId,
    revisionAuthority: input.body.revisionAuthority,
    canonicalPlan: input.body.canonicalPlan,
  })
}

export function canonicalPlanningHandoffIdempotencyKeyHash(idempotencyKey: string): string {
  return sha256AuthorityValue({ idempotencyKey })
}

export function createEditPlanningAuthorityService(context: ServiceContext) {
  return {
    async publishCanonicalPlan(input: PublishCanonicalEditPlanInput) {
      requirePrivateAuthorityRuntime(context)
      const handoffBindingResult = input.planningHandoffBinding
        ? canonicalPlanningHandoffPublicationBindingSchema.safeParse(input.planningHandoffBinding)
        : undefined
      if (handoffBindingResult && !handoffBindingResult.success) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical planning handoff publication binding is invalid.',
          400,
          handoffBindingResult.error.flatten(),
        )
      }
      const planningHandoffBinding = handoffBindingResult?.data
      const validatedBody = publishCanonicalEditPlanSchema.safeParse({
        workspaceId: input.workspaceId,
        planningRequestId: input.planningRequestId,
        planningInputAuthority: input.planningInputAuthority,
        sourceMediaAuthority: input.sourceMediaAuthority,
        revisionAuthority: input.revisionAuthority,
        canonicalPlan: input.canonicalPlan,
      })
      if (!validatedBody.success) {
        throw new ApiError('VALIDATION_FAILED', 'Canonical plan authority request validation failed.', 400, validatedBody.error.flatten())
      }
      const body = validatedBody.data
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      await createProjectService(context).getProject(input.projectId, access.workspaceId)
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      validateCanonicalPlanDraft(body.canonicalPlan.components, body.canonicalPlan.workItems, body.canonicalPlan.estimate)
      const revisionDecision = body.revisionAuthority
        ? await validateRevisionPublicationAuthority({
            context,
            workspaceId: access.workspaceId,
            projectId: input.projectId,
            editSessionId: input.editSessionId,
            revisionAuthority: body.revisionAuthority,
            compiledIntent: body.canonicalPlan.components.compiledIntent,
          })
        : undefined

      const planningInputAuthority = await resolvePlanningInputAuthorityBinding({
        context,
        scope: {
          localStorageRoot: context.env.localStorageRoot,
          ownerUserId: access.userId,
          workspaceId: access.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
        },
        expectation: body.planningInputAuthority,
        components: body.canonicalPlan.components,
      })
      const sourceMediaAuthority = await buildAndVerifySourceMediaAuthority({
        context,
        workspaceId: access.workspaceId,
        projectId: input.projectId,
        sourceSequence: body.canonicalPlan.components.sourceSequence,
        expectation: body.sourceMediaAuthority,
      })
      if (planningHandoffBinding && (
        planningHandoffBinding.canonicalPlanComponentsHash !== sha256AuthorityValue(body.canonicalPlan.components) ||
        planningHandoffBinding.sourceCandidateHash !== sourceMediaAuthority.candidateHash ||
        planningHandoffBinding.planningInputBindingHash !== planningInputAuthority.bindingHash ||
        planningHandoffBinding.publicationRequestHash !== canonicalPlanningHandoffPublicationRequestHash({
          workspaceId: access.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          handoffId: planningHandoffBinding.handoffId,
          handoffHash: planningHandoffBinding.handoffHash,
          body,
        }) ||
        planningHandoffBinding.idempotencyKeyHash !==
          canonicalPlanningHandoffIdempotencyKeyHash(idempotencyKey)
      )) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Canonical planning handoff binding does not match the revalidated publication authority.',
          409,
        )
      }
      const baseComponentRefs = await persistPlanComponents(context, body.canonicalPlan.components)
      const componentRefs: Record<string, AuthorityJsonBlobRef> = {
        ...baseComponentRefs,
        planningInputAuthority: await putPrivateAuthorityJsonBlob({
          localStorageRoot: context.env.localStorageRoot,
          value: planningInputAuthority as unknown as Record<string, unknown>,
          maxBytes: 512 * 1024,
        }),
        sourceMediaAuthority: await putPrivateAuthorityJsonBlob({
          localStorageRoot: context.env.localStorageRoot,
          value: sourceMediaAuthority as unknown as Record<string, unknown>,
          maxBytes: 2 * 1024 * 1024,
        }),
      }
      if (planningHandoffBinding) {
        componentRefs.planningHandoffAuthority = await putPrivateAuthorityJsonBlob({
          localStorageRoot: context.env.localStorageRoot,
          value: planningHandoffBinding as unknown as Record<string, unknown>,
          maxBytes: 32 * 1024,
        })
      }
      if (body.revisionAuthority && revisionDecision) {
        componentRefs.revisionAuthority = await putPrivateAuthorityJsonBlob({
          localStorageRoot: context.env.localStorageRoot,
          value: {
            schemaVersion: 'canonical-revision-publication-authority-v1',
            ...body.revisionAuthority,
            decisionStatus: revisionDecision.status,
            decision: revisionDecision.decision,
            immutableApprovedSnapshotPreserved:
              revisionDecision.authority.immutableApprovedSnapshotPreserved,
            immutableReviewManifestPreserved:
              revisionDecision.authority.immutableReviewManifestPreserved,
          },
          maxBytes: 64 * 1024,
        })
      }
      const preparedWorkItems = await persistWorkItemComponents(context, body.canonicalPlan.workItems)
      const preparedEstimateItems = await Promise.all(body.canonicalPlan.estimate.lineItems.map(async (item) => ({
        ...item,
        metadataRef: await putPrivateAuthorityJsonBlob({
          localStorageRoot: context.env.localStorageRoot,
          value: item.metadata,
          maxBytes: 32 * 1024,
        }),
      })))

      const workGraphHash = sha256AuthorityValue(preparedWorkItems.map((item) => ({
        ...item.input,
        executionInput: undefined,
        fallbackPolicy: undefined,
        executionInputRef: item.executionInputRef,
        fallbackPolicyRef: item.fallbackPolicyRef,
      })))
      const estimateCore = {
        lineItems: preparedEstimateItems.map(toAuthorityEstimateLineItem),
        fallbackAllowanceCredits: body.canonicalPlan.estimate.fallbackAllowanceCredits,
        validForSeconds: body.canonicalPlan.estimate.validForSeconds,
      }
      const estimatedCredits = preparedEstimateItems.reduce((total, item) => total + item.estimatedCredits, 0)
      const approvedMaximumCredits = estimatedCredits + body.canonicalPlan.estimate.fallbackAllowanceCredits
      const estimateHash = sha256AuthorityValue({ ...estimateCore, estimatedCredits, approvedMaximumCredits })
      const planHash = sha256AuthorityValue({
        schemaVersion: body.canonicalPlan.schemaVersion,
        componentRefs,
        workGraphHash,
      })
      const requestHash = sha256AuthorityValue({
        operation: 'publish_plan',
        requestPath: input.requestPath ?? '/v1/projects/:projectId/edit-sessions/:editSessionId/canonical-plans',
        workspaceId: access.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        planningRequestId: body.planningRequestId,
        revisionAuthority: body.revisionAuthority,
        planHash,
        estimateHash,
        actorUserId: access.userId,
      })
      const timestamp = nowIso()

      const response = await mutatePrivateEditAuthorityAggregate({
        scope: authorityScope(context, access.userId, access.workspaceId),
        planningDomainScope: planningAuthorityScope(
          context,
          access.userId,
          access.workspaceId,
          { projectId: input.projectId, editSessionId: input.editSessionId },
        ),
        now: timestamp,
        mutation: async (aggregate) => {
          const replay = findIdempotencyReplay(aggregate, 'publish_plan', idempotencyKey, requestHash)
          if (replay) return { result: replay, changed: false }

          await revalidatePlanningInputAuthorityBinding({
            context,
            scope: planningAuthorityScope(
              context,
              access.userId,
              access.workspaceId,
              { projectId: input.projectId, editSessionId: input.editSessionId },
            ),
            persistedBinding: planningInputAuthority,
            components: body.canonicalPlan.components,
          })
          await buildAndVerifySourceMediaAuthority({
            context,
            workspaceId: access.workspaceId,
            projectId: input.projectId,
            sourceSequence: body.canonicalPlan.components.sourceSequence,
            expectation: sourceExpectationFromCandidate(sourceMediaAuthority),
          })

          const duplicatePlanningRequest = aggregate.plans.find((plan) => plan.planningRequestId === body.planningRequestId)
          if (duplicatePlanningRequest) {
            throw new ApiError('IDEMPOTENCY_CONFLICT', 'Planning request ID already belongs to another canonical plan.', 409)
          }
          const approvedPlan = aggregate.plans.find((plan) =>
            plan.editSessionId === input.editSessionId && plan.status === 'approved')
          if (approvedPlan && !body.revisionAuthority) {
            throw new ApiError('PLAN_NOT_APPROVED', 'An approved edit requires an explicit revision flow before a replacement plan can be published.', 409)
          }
          if (body.revisionAuthority) {
            const priorSnapshot = aggregate.snapshots.find((snapshot) =>
              snapshot.snapshotId === body.revisionAuthority!.priorApprovedSnapshotId)
            if (
              !approvedPlan || approvedPlan.id !== body.revisionAuthority.priorApprovedPlanId ||
              approvedPlan.planVersion !== body.revisionAuthority.priorApprovedPlanVersion ||
              !priorSnapshot || priorSnapshot.planId !== approvedPlan.id ||
              aggregate.plans.some((plan) =>
                plan.revisionAuthority?.reviewDecisionId === body.revisionAuthority!.reviewDecisionId)
            ) {
              throw new ApiError(
                'IDEMPOTENCY_CONFLICT',
                'Canonical revision authority is stale, already consumed, or not bound to the active approved plan.',
                409,
              )
            }
          }

          const previousPresented = aggregate.plans.find((plan) => plan.editSessionId === input.editSessionId && plan.status === 'presented')
          if (previousPresented) {
            previousPresented.status = 'superseded'
            previousPresented.supersededAt = timestamp
            const priorEstimate = aggregate.estimates.find((estimate) => estimate.id === previousPresented.estimateId)
            if (priorEstimate?.status === 'presented') {
              priorEstimate.status = 'superseded'
              priorEstimate.supersededAt = timestamp
            }
          }

          const planId = `authority_plan_${randomUUID()}`
          const estimateId = `authority_estimate_${randomUUID()}`
          const planVersion = Math.max(
            0,
            ...aggregate.plans.filter((plan) => plan.editSessionId === input.editSessionId).map((plan) => plan.planVersion),
          ) + 1
          if (
            body.revisionAuthority &&
            planVersion !== body.revisionAuthority.priorApprovedPlanVersion + 1
          ) {
            throw new ApiError(
              'IDEMPOTENCY_CONFLICT',
              'Canonical replacement plan version is not the next immutable revision version.',
              409,
            )
          }
          const workItems: AuthorityPlanWorkItemRecord[] = preparedWorkItems.map(({ input: workItem, executionInputRef, fallbackPolicyRef }) => ({
            id: `authority_work_item_${randomUUID()}`,
            planId,
            workItemKey: workItem.workItemKey,
            workItemType: workItem.workItemType,
            workerClass: workItem.workerClass,
            executionInputRef,
            sourceSequenceItemIds: [...workItem.sourceSequenceItemIds],
            sourceCleanupDecisionIds: [...workItem.sourceCleanupDecisionIds],
            expectedOutputs: workItem.expectedOutputs.map((output) => ({
              ...output,
              segmentIds: [...output.segmentIds],
              timingIds: [...output.timingIds],
              rendererLayerIds: [...output.rendererLayerIds],
            })),
            dependencyKeys: [...workItem.dependencyKeys],
            approvedToolIds: [...workItem.approvedToolIds],
            approvedProviderRoute: workItem.approvedProviderRoute,
            providerExecutionMode: workItem.providerExecutionMode,
            fallbackPolicyRef,
            maxAttempts: workItem.maxAttempts,
            attemptTimeoutSeconds: workItem.attemptTimeoutSeconds,
            scheduledDelaySeconds: workItem.scheduledDelaySeconds,
            maximumCreditBudget: workItem.maximumCreditBudget,
            required: workItem.required,
            executionInputHash: executionInputRef.sha256,
            createdAt: timestamp,
          }))
          const estimate: AuthorityCreditEstimateRecord = {
            id: estimateId,
            planId,
            estimateVersion: 1,
            status: 'presented',
            lineItems: preparedEstimateItems.map(toAuthorityEstimateLineItem),
            estimatedCredits,
            fallbackAllowanceCredits: body.canonicalPlan.estimate.fallbackAllowanceCredits,
            approvedMaximumCredits,
            estimateHash,
            validUntil: new Date(Date.parse(timestamp) + body.canonicalPlan.estimate.validForSeconds * 1_000).toISOString(),
            createdAt: timestamp,
          }
          const plan: AuthorityPlanRecord = {
            id: planId,
            projectId: input.projectId,
            editSessionId: input.editSessionId,
            planningRequestId: body.planningRequestId,
            planVersion,
            status: 'presented',
            componentRefs,
            estimateId,
            workItemIds: workItems.map((workItem) => workItem.id),
            planHash,
            workGraphHash,
            sourceSequenceHash: componentRefs.sourceSequence.sha256,
            timingHash: sha256AuthorityValue({
              masterTimingPlan: componentRefs.masterTimingPlan,
              captionVisualCueTimingPlan: componentRefs.captionVisualCueTimingPlan,
              soundSyncTransitionTimingPlan: componentRefs.soundSyncTransitionTimingPlan,
              timingValidationPlan: componentRefs.timingValidationPlan,
              timingSummary: componentRefs.timingSummary,
            }),
            createdAt: timestamp,
            revisionAuthority: body.revisionAuthority,
          }
          aggregate.plans.push(plan)
          aggregate.estimates.push(estimate)
          aggregate.planWorkItems.push(...workItems)
          aggregate.auditEvents.push({
            id: `authority_audit_${randomUUID()}`,
            eventType: body.revisionAuthority
              ? 'canonical_revision_plan_published'
              : 'canonical_plan_published',
            actorUserId: access.userId,
            projectId: input.projectId,
            editSessionId: input.editSessionId,
            planId,
            createdAt: timestamp,
          })

          const result = canonicalAuthorityResponse(
            createPublishedPlanResponse(aggregate, plan, estimate, workItems, aggregate.revision + 1),
          )
          aggregate.idempotencyRecords.push({
            operation: 'publish_plan',
            idempotencyKey,
            requestHash,
            responseId: planId,
            secondaryResponseIds: [estimateId, ...workItems.map((workItem) => workItem.id)],
            response: result,
            completedAt: timestamp,
          })
          return { result, changed: true }
        },
      })

      return {
        authority: response,
        warnings: [
          ...(planningHandoffBinding
            ? ['Canonical plan authority includes the exact persisted and revalidated planning-handoff binding.']
            : []),
          'Canonical plan authority is private single-host internal-test persistence.',
          ...(body.revisionAuthority
            ? ['Replacement plan publication consumed one exact private-review revision handoff; fresh approval remains blocked pending reservation reconciliation.']
            : []),
          'No provider, worker, render, media, external billing, or production credit side effect was started.',
        ],
      }
    },

    async approveAndFundCanonicalPlan(input: ApproveCanonicalEditPlanInput) {
      requirePrivateAuthorityRuntime(context)
      const validatedBody = approveCanonicalEditPlanSchema.safeParse({
        workspaceId: input.workspaceId,
        expectedAuthorityRevision: input.expectedAuthorityRevision,
        expectedPlanHash: input.expectedPlanHash,
        expectedEstimateHash: input.expectedEstimateHash,
      })
      if (!validatedBody.success) {
        throw new ApiError('VALIDATION_FAILED', 'Canonical plan approval request validation failed.', 400, validatedBody.error.flatten())
      }
      const body = validatedBody.data
      const userId = getRequiredAuthUserId(context)
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      const aggregateBefore = await readPrivateEditAuthorityAggregate(authorityScope(context, userId, access.workspaceId))
      const targetPlan = aggregateBefore?.plans.find((plan) => plan.id === input.editPlanId)
      if (!targetPlan) throw new ApiError('PLAN_NOT_APPROVED', 'Canonical edit plan was not found.', 404)
      await createProjectService(context).getProject(targetPlan.projectId, access.workspaceId)
      const approvalComponents = await loadCanonicalPlanComponents(context, targetPlan.componentRefs)
      if (targetPlan.revisionAuthority) {
        await validateRevisionPublicationAuthority({
          context,
          workspaceId: access.workspaceId,
          projectId: targetPlan.projectId,
          editSessionId: targetPlan.editSessionId,
          revisionAuthority: targetPlan.revisionAuthority,
          compiledIntent: approvalComponents.compiledIntent,
        })
      }
      const approvalPlanningInputAuthority = await loadPlanningInputAuthorityBinding(context, targetPlan.componentRefs)
      const approvalSourceMediaAuthority = await loadSourceMediaAuthorityCandidate(context, targetPlan.componentRefs)
      await loadOptionalPlanningHandoffAuthority({
        context,
        componentRefs: targetPlan.componentRefs,
        components: approvalComponents,
        planningInputAuthority: approvalPlanningInputAuthority,
        sourceMediaAuthority: approvalSourceMediaAuthority,
      })
      await revalidatePlanningInputAuthorityBinding({
        context,
        scope: planningAuthorityScope(context, access.userId, access.workspaceId, targetPlan),
        persistedBinding: approvalPlanningInputAuthority,
        components: approvalComponents,
      })
      await buildAndVerifySourceMediaAuthority({
        context,
        workspaceId: access.workspaceId,
        projectId: targetPlan.projectId,
        sourceSequence: approvalComponents.sourceSequence,
        expectation: sourceExpectationFromCandidate(approvalSourceMediaAuthority),
      })

      const requestHash = sha256AuthorityValue({
        operation: 'approve_plan',
        requestPath: input.requestPath ?? '/v1/edit-plans/:editPlanId/approve',
        workspaceId: access.workspaceId,
        editPlanId: input.editPlanId,
        expectedAuthorityRevision: body.expectedAuthorityRevision,
        expectedPlanHash: body.expectedPlanHash,
        expectedEstimateHash: body.expectedEstimateHash,
        approvedByUserId: access.userId,
      })
      const timestamp = nowIso()
      const response = await mutatePrivateEditAuthorityAggregate({
        scope: authorityScope(context, access.userId, access.workspaceId),
        planningDomainScope: planningAuthorityScope(context, access.userId, access.workspaceId, targetPlan),
        now: timestamp,
        mutation: async (aggregate) => {
          const replay = findIdempotencyReplay(aggregate, 'approve_plan', idempotencyKey, requestHash)
          if (replay) return { result: replay, changed: false }
          if (aggregate.revision !== body.expectedAuthorityRevision) {
            throw new ApiError('IDEMPOTENCY_CONFLICT', 'Canonical authority revision changed; reload the plan before approval.', 409, {
              expectedAuthorityRevision: body.expectedAuthorityRevision,
              currentAuthorityRevision: aggregate.revision,
            })
          }
          const plan = requirePlan(aggregate, input.editPlanId)
          const estimate = requireEstimate(aggregate, plan.estimateId)
          await revalidatePlanningInputAuthorityBinding({
            context,
            scope: planningAuthorityScope(context, access.userId, access.workspaceId, plan),
            persistedBinding: approvalPlanningInputAuthority,
            components: approvalComponents,
          })
          await buildAndVerifySourceMediaAuthority({
            context,
            workspaceId: access.workspaceId,
            projectId: plan.projectId,
            sourceSequence: approvalComponents.sourceSequence,
            expectation: sourceExpectationFromCandidate(approvalSourceMediaAuthority),
          })
          if (plan.status !== 'presented') throw new ApiError('PLAN_NOT_APPROVED', 'Only the current presented plan can be approved.', 409)
          if (estimate.status !== 'presented') throw new ApiError('CREDIT_ESTIMATE_NOT_APPROVED', 'Only the current presented estimate can be approved.', 409)
          if (plan.planHash !== body.expectedPlanHash || estimate.estimateHash !== body.expectedEstimateHash) {
            throw new ApiError('IDEMPOTENCY_CONFLICT', 'Approved plan or estimate hash did not match the current server-owned record.', 409)
          }
          if (Date.parse(estimate.validUntil) <= Date.parse(timestamp)) {
            estimate.status = 'expired'
            throw new ApiError('CREDIT_ESTIMATE_NOT_APPROVED', 'Credit estimate expired and must be recalculated before approval.', 409)
          }
          const priorSnapshot = plan.revisionAuthority
            ? aggregate.snapshots.find((snapshot) =>
                snapshot.snapshotId === plan.revisionAuthority!.priorApprovedSnapshotId)
            : undefined
          const priorReservation = priorSnapshot
            ? aggregate.reservations.find((reservation) => reservation.id === priorSnapshot.reservationId)
            : undefined
          const priorPlan = priorSnapshot
            ? aggregate.plans.find((candidate) => candidate.id === priorSnapshot.planId)
            : undefined
          const priorEstimate = priorSnapshot
            ? aggregate.estimates.find((candidate) => candidate.id === priorSnapshot.estimateId)
            : undefined
          const releasablePriorCredits = priorReservation
            ? priorReservation.reservedCredits - priorReservation.spentCredits -
              priorReservation.releasedCredits - priorReservation.refundedCredits
            : 0
          if (plan.revisionAuthority && (
            !priorSnapshot || !priorReservation || !priorPlan || !priorEstimate ||
            priorPlan.id !== plan.revisionAuthority.priorApprovedPlanId ||
            priorPlan.status !== 'approved' || priorEstimate.status !== 'approved' ||
            !['reserved', 'partially_spent'].includes(priorReservation.status) ||
            releasablePriorCredits < 0
          )) {
            throw new ApiError(
              'CREDITS_NOT_RESERVED',
              'Prior synthetic reservation is not eligible for atomic revision reconciliation.',
              409,
              { requiredGate: 'canonical_revision_reservation_reconciliation' },
            )
          }
          const availableAfterRevisionRelease = aggregate.wallet.availableCredits + releasablePriorCredits
          if (availableAfterRevisionRelease < estimate.approvedMaximumCredits) {
            throw new ApiError('INSUFFICIENT_CREDITS', 'Internal-test wallet does not have enough credits for the approved maximum.', 409, {
              availableCredits: availableAfterRevisionRelease,
              requiredCredits: estimate.approvedMaximumCredits,
            })
          }

          const sourceWorkItems = plan.workItemIds.map((workItemId) => requirePlanWorkItem(aggregate, workItemId, plan.id))
          const approvalId = `authority_approval_${randomUUID()}`
          const snapshotId = `authority_snapshot_${randomUUID()}`
          const reservationId = `authority_reservation_${randomUUID()}`
          const approvedWorkItemIdsByKey = new Map<string, string>()
          for (const workItem of sourceWorkItems) {
            approvedWorkItemIdsByKey.set(workItem.workItemKey, `authority_approved_work_item_${randomUUID()}`)
          }
          const approvedWorkItems: AuthorityApprovedWorkItemRecord[] = sourceWorkItems.map((workItem) => {
            return {
              id: approvedWorkItemIdsByKey.get(workItem.workItemKey)!,
              snapshotId,
              sourceWorkItemId: workItem.id,
              workItemKey: workItem.workItemKey,
              workItemType: workItem.workItemType,
              workerClass: workItem.workerClass,
              executionInputRef: workItem.executionInputRef,
              sourceSequenceItemIds: [...workItem.sourceSequenceItemIds],
              sourceCleanupDecisionIds: [...workItem.sourceCleanupDecisionIds],
              expectedOutputs: workItem.expectedOutputs.map((output) => ({
                ...output,
                segmentIds: [...output.segmentIds],
                timingIds: [...output.timingIds],
                rendererLayerIds: [...output.rendererLayerIds],
              })),
              dependencyKeys: [...workItem.dependencyKeys],
              approvedToolIds: [...workItem.approvedToolIds],
              approvedProviderRoute: workItem.approvedProviderRoute,
              providerExecutionMode: workItem.providerExecutionMode,
              fallbackPolicyRef: workItem.fallbackPolicyRef,
              maxAttempts: workItem.maxAttempts,
              attemptTimeoutSeconds: workItem.attemptTimeoutSeconds,
              scheduledDelaySeconds: workItem.scheduledDelaySeconds,
              maximumCreditBudget: workItem.maximumCreditBudget,
              required: workItem.required,
              executionInputHash: workItem.executionInputHash,
              createdAt: timestamp,
            }
          })
          const approvedAssetManifest = createApprovedAssetManifest({
            snapshotId,
            plan,
            approvedWorkItems,
            timestamp,
          })
          const approvedAssetManifestRef = await putPrivateAuthorityJsonBlob({
            localStorageRoot: context.env.localStorageRoot,
            value: approvedAssetManifest as unknown as Record<string, unknown>,
            maxBytes: 2 * 1024 * 1024,
          })
          const approvedSourceAssetManifest = createApprovedSourceAssetManifest({
            snapshotId,
            sourceCandidate: approvalSourceMediaAuthority,
            approvedAt: timestamp,
          })
          const approvedSourceAssetManifestRef = await putPrivateAuthorityJsonBlob({
            localStorageRoot: context.env.localStorageRoot,
            value: approvedSourceAssetManifest as unknown as Record<string, unknown>,
            maxBytes: 2 * 1024 * 1024,
          })
          const manifestWithoutHash = {
            schemaVersion: 'private-edit-authority-approved-snapshot-v3' as const,
            snapshotId,
            workspaceId: aggregate.workspaceId,
            projectId: plan.projectId,
            editSessionId: plan.editSessionId,
            planId: plan.id,
            planVersion: plan.planVersion,
            estimateId: estimate.id,
            approvalId,
            reservationId,
            approvedByUserId: access.userId,
            approvedAt: timestamp,
            componentRefs: plan.componentRefs,
            approvedWorkItemIds: approvedWorkItems.map((workItem) => workItem.id),
            planHash: plan.planHash,
            estimateHash: estimate.estimateHash,
            workGraphHash: plan.workGraphHash,
            sourceSequenceHash: plan.sourceSequenceHash,
            timingHash: plan.timingHash,
            approvedAssetManifestRef,
            approvedAssetManifestHash: approvedAssetManifest.manifestHash,
            approvedSourceAssetManifestRef,
            approvedSourceAssetManifestHash: approvedSourceAssetManifest.manifestHash,
          }
          const snapshot: AuthorityApprovedSnapshotManifest = {
            ...manifestWithoutHash,
            snapshotHash: sha256AuthorityValue(manifestWithoutHash),
          }
          const jobIdsByKey = new Map(sourceWorkItems.map((workItem) => [workItem.workItemKey, `authority_job_${randomUUID()}`]))
          const jobs: AuthorityDerivedJobRecord[] = approvedWorkItems.map((workItem) => ({
            id: jobIdsByKey.get(workItem.workItemKey)!,
            snapshotId,
            reservationId,
            approvedWorkItemId: workItem.id,
            workItemKey: workItem.workItemKey,
            jobType: workItem.workItemType,
            workerClass: workItem.workerClass,
            executionInputRef: workItem.executionInputRef,
            sourceSequenceItemIds: [...workItem.sourceSequenceItemIds],
            sourceCleanupDecisionIds: [...workItem.sourceCleanupDecisionIds],
            expectedAssetIds: approvedAssetManifest.entries
              .filter((entry) => entry.approvedWorkItemId === workItem.id)
              .map((entry) => entry.id),
            dependencyJobIds: workItem.dependencyKeys.map((key) => jobIdsByKey.get(key)!),
            status: workItem.dependencyKeys.length === 0 ? 'ready' : 'blocked',
            maxAttempts: workItem.maxAttempts,
            attemptTimeoutSeconds: workItem.attemptTimeoutSeconds,
            scheduledFor: new Date(Date.parse(timestamp) + workItem.scheduledDelaySeconds * 1_000).toISOString(),
            createdAt: timestamp,
          }))

          if (plan.revisionAuthority && priorReservation && priorPlan && priorEstimate) {
            if (releasablePriorCredits > 0) {
              aggregate.wallet.availableCredits += releasablePriorCredits
              aggregate.wallet.reservedCredits -= releasablePriorCredits
              aggregate.wallet.ledgerSequence += 1
              priorReservation.releasedCredits += releasablePriorCredits
              priorReservation.status = 'released'
              priorReservation.updatedAt = timestamp
              aggregate.ledgerEntries.push({
                id: `authority_ledger_${randomUUID()}`,
                sequence: aggregate.wallet.ledgerSequence,
                entryType: 'release',
                sourceType: 'canonical_revision_reservation_reconciliation',
                sourceId: priorReservation.id,
                availableDelta: releasablePriorCredits,
                reservedDelta: -releasablePriorCredits,
                spentDelta: 0,
                balanceAfter: walletBalanceAfter(aggregate.wallet),
                idempotencyKey,
                createdAt: timestamp,
              })
              aggregate.reservationEvents.push({
                id: `authority_reservation_event_${randomUUID()}`,
                reservationId: priorReservation.id,
                snapshotId: priorSnapshot!.snapshotId,
                approvalId: priorSnapshot!.approvalId,
                eventType: 'released',
                credits: releasablePriorCredits,
                idempotencyKey,
                createdAt: timestamp,
              })
            }
            priorPlan.status = 'superseded'
            priorPlan.supersededAt = timestamp
            priorEstimate.status = 'superseded'
            priorEstimate.supersededAt = timestamp
          }

          aggregate.wallet.availableCredits -= estimate.approvedMaximumCredits
          aggregate.wallet.reservedCredits += estimate.approvedMaximumCredits
          aggregate.wallet.ledgerSequence += 1
          plan.status = 'approved'
          plan.approvedAt = timestamp
          estimate.status = 'approved'
          estimate.approvedAt = timestamp
          aggregate.approvals.push({
            id: approvalId,
            planId: plan.id,
            estimateId: estimate.id,
            snapshotId,
            reservationId,
            approvedByUserId: access.userId,
            approvedAt: timestamp,
            requestHash,
            idempotencyKey,
          })
          aggregate.snapshots.push(snapshot)
          aggregate.approvedWorkItems.push(...approvedWorkItems)
          aggregate.reservations.push({
            id: reservationId,
            approvalId,
            snapshotId,
            estimateId: estimate.id,
            planId: plan.id,
            projectId: plan.projectId,
            editSessionId: plan.editSessionId,
            status: 'reserved',
            reservedCredits: estimate.approvedMaximumCredits,
            spentCredits: 0,
            releasedCredits: 0,
            refundedCredits: 0,
            reservedAt: timestamp,
            expiresAt: estimate.validUntil,
            updatedAt: timestamp,
          })
          aggregate.ledgerEntries.push({
            id: `authority_ledger_${randomUUID()}`,
            sequence: aggregate.wallet.ledgerSequence,
            entryType: 'reserve',
            sourceType: 'canonical_plan_approval',
            sourceId: reservationId,
            availableDelta: -estimate.approvedMaximumCredits,
            reservedDelta: estimate.approvedMaximumCredits,
            spentDelta: 0,
            balanceAfter: walletBalanceAfter(aggregate.wallet),
            idempotencyKey,
            createdAt: timestamp,
          })
          aggregate.reservationEvents.push({
            id: `authority_reservation_event_${randomUUID()}`,
            reservationId,
            snapshotId,
            approvalId,
            eventType: 'reserved',
            credits: estimate.approvedMaximumCredits,
            idempotencyKey,
            createdAt: timestamp,
          })
          aggregate.jobs.push(...jobs)
          aggregate.auditEvents.push({
            id: `authority_audit_${randomUUID()}`,
            eventType: plan.revisionAuthority
              ? 'canonical_revision_plan_approved_and_reconciled'
              : 'canonical_plan_approved_and_funded',
            actorUserId: access.userId,
            projectId: plan.projectId,
            editSessionId: plan.editSessionId,
            planId: plan.id,
            snapshotId,
            createdAt: timestamp,
          })

          const result = canonicalAuthorityResponse(
            createApprovalResponse(
              aggregate,
              plan,
              estimate,
              snapshot,
              jobs,
              aggregate.revision + 1,
              plan.revisionAuthority && priorReservation
                ? {
                    priorSnapshotId: priorSnapshot!.snapshotId,
                    priorReservationId: priorReservation.id,
                    releasedCredits: releasablePriorCredits,
                  }
                : undefined,
            ),
          )
          aggregate.idempotencyRecords.push({
            operation: 'approve_plan',
            idempotencyKey,
            requestHash,
            responseId: approvalId,
            secondaryResponseIds: [snapshotId, reservationId, ...approvedWorkItems.map((item) => item.id), ...jobs.map((job) => job.id)],
            response: result,
            completedAt: timestamp,
          })
          return { result, changed: true }
        },
      })

      return {
        authority: response,
        warnings: [
          ...(targetPlan.revisionAuthority
            ? ['Revision approval atomically released the unused prior synthetic reservation and reserved the newly approved maximum.']
            : []),
          'Approval reserved synthetic private-internal test credits only; no paid billing, customer wallet, or external credit mutation occurred.',
          'Jobs were derived from immutable approved work items but were not claimed or executed.',
        ],
      }
    },

    async findCanonicalPlanPublicationByPlanningHandoff(
      handoffId: string,
      workspaceId: string,
    ): Promise<{
      planId: string
      projectId: string
      editSessionId: string
      planningRequestId: string
      binding: CanonicalPlanningHandoffPublicationBinding
    } | undefined> {
      requirePrivateAuthorityRuntime(context)
      const access = await authorizeWorkspaceAccess(context, workspaceId, 'read')
      const aggregate = await readPrivateEditAuthorityAggregate(
        authorityScope(context, access.userId, access.workspaceId),
      )
      if (!aggregate) return undefined
      const matches: Array<{
        plan: AuthorityPlanRecord
        binding: CanonicalPlanningHandoffPublicationBinding
      }> = []
      for (const plan of aggregate.plans) {
        const ref = plan.componentRefs.planningHandoffAuthority
        if (!ref) continue
        const value = await readPrivateAuthorityJsonBlob({
          localStorageRoot: context.env.localStorageRoot,
          ref,
        })
        if (
          !value ||
          Array.isArray(value) ||
          (value as Record<string, unknown>).handoffId !== handoffId
        ) continue
        const parsed = canonicalPlanningHandoffPublicationBindingSchema.safeParse(value)
        if (!parsed.success || ref.sha256 !== sha256AuthorityValue(parsed.data)) {
          throw new ApiError(
            'VALIDATION_FAILED',
            'Canonical planning-handoff publication binding is invalid during recovery.',
            409,
            parsed.success ? undefined : parsed.error.flatten(),
          )
        }
        matches.push({ plan, binding: parsed.data })
      }
      if (matches.length > 1) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Canonical planning handoff is bound to more than one plan publication.',
          409,
        )
      }
      const match = matches[0]
      if (!match) return undefined
      await createProjectService(context).getProject(match.plan.projectId, access.workspaceId)
      return {
        planId: match.plan.id,
        projectId: match.plan.projectId,
        editSessionId: match.plan.editSessionId,
        planningRequestId: match.plan.planningRequestId,
        binding: match.binding,
      }
    },

    async getCanonicalPlan(editPlanId: string, workspaceId: string) {
      requirePrivateAuthorityRuntime(context)
      const access = await authorizeWorkspaceAccess(context, workspaceId, 'read')
      const aggregate = await readPrivateEditAuthorityAggregate(authorityScope(context, access.userId, access.workspaceId))
      if (!aggregate) throw new ApiError('PLAN_NOT_APPROVED', 'Canonical edit authority was not found.', 404)
      const plan = requirePlan(aggregate, editPlanId)
      await createProjectService(context).getProject(plan.projectId, access.workspaceId)
      const estimate = requireEstimate(aggregate, plan.estimateId)
      const workItems = plan.workItemIds.map((id) => requirePlanWorkItem(aggregate, id, plan.id))
      return {
        authority: createPublishedPlanResponse(aggregate, plan, estimate, workItems, aggregate.revision),
        warnings: ['Canonical plan read returned immutable manifests and hashes, not raw chat or signed artifacts.'],
      }
    },

    async getApprovedSnapshot(snapshotId: string, workspaceId: string) {
      requirePrivateAuthorityRuntime(context)
      const access = await authorizeWorkspaceAccess(context, workspaceId, 'read')
      const aggregate = await readPrivateEditAuthorityAggregate(authorityScope(context, access.userId, access.workspaceId))
      const snapshot = aggregate?.snapshots.find((record) => record.snapshotId === snapshotId)
      if (!aggregate || !snapshot) throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Canonical approved snapshot was not found.', 404)
      await createProjectService(context).getProject(snapshot.projectId, access.workspaceId)
      const reservation = aggregate.reservations.find((record) => record.id === snapshot.reservationId)
      const jobs = aggregate.jobs.filter((job) => job.snapshotId === snapshot.snapshotId)
      return {
        authority: {
          authorityRevision: aggregate.revision,
          snapshot,
          reservation,
          jobs: jobs.map(safeJobSummary),
          testOnly: true,
        },
        warnings: ['Canonical approved snapshot is private single-host internal-test authority only.'],
      }
    },

    async loadApprovedExecutionAuthority(
      snapshotId: string,
      workspaceId: string,
    ): Promise<CanonicalApprovedExecutionAuthority> {
      requirePrivateAuthorityRuntime(context)
      const access = await authorizeWorkspaceAccess(context, workspaceId, 'read')
      const aggregate = await readPrivateEditAuthorityAggregate(authorityScope(context, access.userId, access.workspaceId))
      const snapshot = aggregate?.snapshots.find((record) => record.snapshotId === snapshotId)
      if (!aggregate || !snapshot) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Canonical approved snapshot was not found for execution packaging.', 404)
      }
      await createProjectService(context).getProject(snapshot.projectId, access.workspaceId)

      const lineage = requireApprovedExecutionLineage(aggregate, snapshot)
      const componentEntries = await Promise.all(PLAN_COMPONENT_NAMES.map(async (name) => [
        name,
        await readPrivateAuthorityJsonBlob({
          localStorageRoot: context.env.localStorageRoot,
          ref: snapshot.componentRefs[name]!,
        }),
      ] as const))
      const parsedComponents = canonicalPlanComponentsSchema.safeParse(Object.fromEntries(componentEntries))
      if (!parsedComponents.success) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical approved snapshot components no longer satisfy the execution authority contract.',
          409,
          parsedComponents.error.flatten(),
        )
      }
      const planningInputAuthority = await loadPlanningInputAuthorityBinding(context, snapshot.componentRefs)
      const sourceMediaAuthority = await loadSourceMediaAuthorityCandidate(context, snapshot.componentRefs)
      const planningHandoffAuthority = await loadOptionalPlanningHandoffAuthority({
        context,
        componentRefs: snapshot.componentRefs,
        components: parsedComponents.data,
        planningInputAuthority,
        sourceMediaAuthority,
      })
      await revalidatePlanningInputAuthorityBinding({
        context,
        scope: planningAuthorityScope(context, access.userId, access.workspaceId, lineage.plan),
        persistedBinding: planningInputAuthority,
        components: parsedComponents.data,
      })
      await buildAndVerifySourceMediaAuthority({
        context,
        workspaceId: access.workspaceId,
        projectId: snapshot.projectId,
        sourceSequence: parsedComponents.data.sourceSequence,
        expectation: sourceExpectationFromCandidate(sourceMediaAuthority),
      })
      const sourceAssetManifestValue = await readPrivateAuthorityJsonBlob({
        localStorageRoot: context.env.localStorageRoot,
        ref: snapshot.approvedSourceAssetManifestRef,
      })
      const parsedSourceAssetManifest = approvedSourceBindingManifestSchema.safeParse(sourceAssetManifestValue)
      if (!parsedSourceAssetManifest.success) {
        throw new ApiError('VALIDATION_FAILED', 'Canonical approved source-asset manifest is invalid.', 409, parsedSourceAssetManifest.error.flatten())
      }
      const sourceAssetManifest = parsedSourceAssetManifest.data
      assertApprovedSourceAssetManifestMatchesAuthority(
        sourceAssetManifest,
        snapshot,
        sourceMediaAuthority,
      )
      const assetManifestValue = await readPrivateAuthorityJsonBlob({
        localStorageRoot: context.env.localStorageRoot,
        ref: snapshot.approvedAssetManifestRef,
      })
      const parsedAssetManifest = authorityPlannedAssetManifestSchema.safeParse(assetManifestValue)
      if (!parsedAssetManifest.success) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical approved asset manifest no longer satisfies its authority contract.',
          409,
          parsedAssetManifest.error.flatten(),
        )
      }
      const assetManifest = parsedAssetManifest.data as AuthorityPlannedAssetManifest

      const workItems = await Promise.all(snapshot.approvedWorkItemIds.map(async (approvedWorkItemId) => {
        const workItem = aggregate.approvedWorkItems.find((record) =>
          record.id === approvedWorkItemId && record.snapshotId === snapshot.snapshotId)
        if (!workItem) {
          throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Canonical approved work item was not found for execution packaging.', 409, {
            approvedWorkItemId,
          })
        }
        const executionInput = await readPrivateAuthorityJsonBlob({
          localStorageRoot: context.env.localStorageRoot,
          ref: workItem.executionInputRef,
        })
        const fallbackPolicy = await readPrivateAuthorityJsonBlob({
          localStorageRoot: context.env.localStorageRoot,
          ref: workItem.fallbackPolicyRef,
        })
        if (Array.isArray(executionInput) || Array.isArray(fallbackPolicy)) {
          throw new ApiError('VALIDATION_FAILED', 'Canonical work-item execution and fallback inputs must be JSON objects.', 409, {
            approvedWorkItemId,
          })
        }
        return { ...workItem, executionInput, fallbackPolicy }
      }))
      const validForSeconds = Math.round(
        (Date.parse(lineage.estimate.validUntil) - Date.parse(lineage.estimate.createdAt)) / 1_000,
      )
      const reconstructedPlan = publishCanonicalEditPlanSchema.safeParse({
        workspaceId: aggregate.workspaceId,
        planningRequestId: lineage.plan.planningRequestId,
        planningInputAuthority: planningInputAuthorityExpectationFromResolvedBinding(planningInputAuthority),
        sourceMediaAuthority: sourceExpectationFromCandidate(sourceMediaAuthority),
        canonicalPlan: {
          schemaVersion: PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION,
          components: parsedComponents.data,
          estimate: {
            lineItems: lineage.estimate.lineItems.map((item) => ({
              lineKey: item.lineKey,
              label: item.label,
              category: item.category,
              estimatedCredits: item.estimatedCredits,
              removable: item.removable,
              metadata: {},
            })),
            fallbackAllowanceCredits: lineage.estimate.fallbackAllowanceCredits,
            validForSeconds,
          },
          workItems: workItems.map((workItem) => ({
            workItemKey: workItem.workItemKey,
            workItemType: workItem.workItemType,
            workerClass: workItem.workerClass,
            executionInput: workItem.executionInput,
            sourceSequenceItemIds: workItem.sourceSequenceItemIds,
            sourceCleanupDecisionIds: workItem.sourceCleanupDecisionIds,
            expectedOutputs: workItem.expectedOutputs,
            dependencyKeys: workItem.dependencyKeys,
            approvedToolIds: workItem.approvedToolIds,
            approvedProviderRoute: workItem.approvedProviderRoute,
            providerExecutionMode: workItem.providerExecutionMode,
            fallbackPolicy: workItem.fallbackPolicy,
            maxAttempts: workItem.maxAttempts,
            attemptTimeoutSeconds: workItem.attemptTimeoutSeconds,
            scheduledDelaySeconds: workItem.scheduledDelaySeconds,
            maximumCreditBudget: workItem.maximumCreditBudget,
            required: workItem.required,
          })),
        },
      })
      if (!reconstructedPlan.success) {
        throw new ApiError('VALIDATION_FAILED', 'Canonical approved execution authority could not be reconstructed safely.', 409, {
          validation: reconstructedPlan.error.flatten(),
        })
      }
      validateCanonicalPlanDraft(
        reconstructedPlan.data.canonicalPlan.components,
        reconstructedPlan.data.canonicalPlan.workItems,
        reconstructedPlan.data.canonicalPlan.estimate,
      )
      assertReconstructedAuthorityHashes({
        plan: lineage.plan,
        estimate: lineage.estimate,
        snapshot,
        workItems,
        validForSeconds,
      })
      assertApprovedAssetManifestMatchesAuthority(assetManifest, snapshot, lineage.plan, workItems)
      const jobs = snapshot.approvedWorkItemIds.map((approvedWorkItemId) => {
        const job = aggregate.jobs.find((record) =>
          record.snapshotId === snapshot.snapshotId && record.approvedWorkItemId === approvedWorkItemId)
        if (!job) {
          throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Canonical derived job was not found for an approved work item.', 409, {
            approvedWorkItemId,
          })
        }
        return job
      })
      assertDerivedJobGraphMatchesApprovedWorkItems(workItems, jobs, snapshot, assetManifest)

      return {
        authorityRevision: aggregate.revision,
        snapshot,
        plan: lineage.plan,
        estimate: lineage.estimate,
        reservation: lineage.reservation,
        approval: lineage.approval,
        components: parsedComponents.data,
        assetManifest,
        planningInputAuthority,
        planningHandoffAuthority,
        sourceAssetManifest,
        workItems,
        jobs,
        testOnly: true,
      }
    },
  }
}

function assertReconstructedAuthorityHashes(input: {
  plan: AuthorityPlanRecord
  estimate: AuthorityCreditEstimateRecord
  snapshot: AuthorityApprovedSnapshotManifest
  workItems: CanonicalApprovedExecutionWorkItem[]
  validForSeconds: number
}): void {
  const workGraphHash = sha256AuthorityValue(input.workItems.map((workItem) => ({
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
  const estimateHash = sha256AuthorityValue({
    lineItems: input.estimate.lineItems,
    fallbackAllowanceCredits: input.estimate.fallbackAllowanceCredits,
    validForSeconds: input.validForSeconds,
    estimatedCredits: input.estimate.estimatedCredits,
    approvedMaximumCredits: input.estimate.approvedMaximumCredits,
  })
  const planHash = sha256AuthorityValue({
    schemaVersion: PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION,
    componentRefs: input.plan.componentRefs,
    workGraphHash,
  })
  const timingHash = sha256AuthorityValue({
    masterTimingPlan: input.plan.componentRefs.masterTimingPlan,
    captionVisualCueTimingPlan: input.plan.componentRefs.captionVisualCueTimingPlan,
    soundSyncTransitionTimingPlan: input.plan.componentRefs.soundSyncTransitionTimingPlan,
    timingValidationPlan: input.plan.componentRefs.timingValidationPlan,
    timingSummary: input.plan.componentRefs.timingSummary,
  })
  if (
    input.workItems.some((workItem) => workItem.executionInputHash !== workItem.executionInputRef.sha256) ||
    workGraphHash !== input.plan.workGraphHash ||
    workGraphHash !== input.snapshot.workGraphHash ||
    estimateHash !== input.estimate.estimateHash ||
    estimateHash !== input.snapshot.estimateHash ||
    planHash !== input.plan.planHash ||
    planHash !== input.snapshot.planHash ||
    input.plan.componentRefs.sourceSequence.sha256 !== input.snapshot.sourceSequenceHash ||
    timingHash !== input.plan.timingHash ||
    timingHash !== input.snapshot.timingHash
  ) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Canonical approved execution hashes could not be reconstructed from immutable authority.', 409)
  }
}

function assertApprovedAssetManifestMatchesAuthority(
  manifest: AuthorityPlannedAssetManifest,
  snapshot: AuthorityApprovedSnapshotManifest,
  plan: AuthorityPlanRecord,
  workItems: CanonicalApprovedExecutionWorkItem[],
): void {
  const { manifestHash, ...manifestWithoutHash } = manifest
  const workItemById = new Map(workItems.map((workItem) => [workItem.id, workItem]))
  const expectedEntryCount = workItems.reduce((total, workItem) => total + workItem.expectedOutputs.length, 0)
  const seenIds = new Set<string>()
  const seenOutputSlots = new Set<string>()
  let requiredAssetCount = 0
  for (const entry of manifest.entries) {
    const workItem = workItemById.get(entry.approvedWorkItemId)
    const expectedOutput = workItem?.expectedOutputs.find((output) => output.outputKey === entry.outputKey)
    const outputSlot = `${entry.approvedWorkItemId}\u0000${entry.outputKey}`
    if (
      !workItem ||
      !expectedOutput ||
      entry.snapshotId !== snapshot.snapshotId ||
      entry.workItemKey !== workItem.workItemKey ||
      seenIds.has(entry.id) ||
      seenOutputSlots.has(outputSlot) ||
      stableAuthorityStringify({
        artifactType: entry.artifactType,
        assetRole: entry.assetRole,
        required: entry.required,
        previewPlaceholderAllowed: entry.previewPlaceholderAllowed,
        contentType: entry.contentType,
        segmentIds: entry.segmentIds,
        timingIds: entry.timingIds,
        rendererLayerIds: entry.rendererLayerIds,
      }) !== stableAuthorityStringify({
        artifactType: expectedOutput.artifactType,
        assetRole: expectedOutput.assetRole,
        required: expectedOutput.required,
        previewPlaceholderAllowed: expectedOutput.previewPlaceholderAllowed,
        contentType: expectedOutput.contentType,
        segmentIds: expectedOutput.segmentIds,
        timingIds: expectedOutput.timingIds,
        rendererLayerIds: expectedOutput.rendererLayerIds,
      })
    ) {
      throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Canonical approved asset manifest lineage is invalid.', 409, {
        assetId: entry.id,
      })
    }
    seenIds.add(entry.id)
    seenOutputSlots.add(outputSlot)
    if (entry.required) requiredAssetCount += 1
  }
  if (
    manifest.schemaVersion !== 'private-edit-asset-manifest-v1' ||
    manifest.snapshotId !== snapshot.snapshotId ||
    manifest.planId !== plan.id ||
    manifest.planHash !== plan.planHash ||
    manifest.workGraphHash !== plan.workGraphHash ||
    manifest.entries.length !== expectedEntryCount ||
    manifest.requiredAssetCount !== requiredAssetCount ||
    manifest.optionalAssetCount !== manifest.entries.length - requiredAssetCount ||
    manifestHash !== snapshot.approvedAssetManifestHash ||
    manifestHash !== sha256AuthorityValue(manifestWithoutHash) ||
    snapshot.approvedAssetManifestRef.sha256 !== sha256AuthorityValue(manifest)
  ) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Canonical approved asset manifest hash or counts are invalid.', 409)
  }
}

function assertDerivedJobGraphMatchesApprovedWorkItems(
  workItems: CanonicalApprovedExecutionWorkItem[],
  jobs: AuthorityDerivedJobRecord[],
  snapshot: AuthorityApprovedSnapshotManifest,
  assetManifest: AuthorityPlannedAssetManifest,
): void {
  const jobIdByWorkItemKey = new Map(jobs.map((job) => [job.workItemKey, job.id]))
  for (const workItem of workItems) {
    const job = jobs.find((candidate) => candidate.approvedWorkItemId === workItem.id)
    const expectedDependencyJobIds = workItem.dependencyKeys.map((key) => jobIdByWorkItemKey.get(key))
    const expectedAssetIds = assetManifest.entries
      .filter((entry) => entry.approvedWorkItemId === workItem.id)
      .map((entry) => entry.id)
    if (
      !job ||
      expectedDependencyJobIds.some((id) => !id) ||
      stableAuthorityStringify(job.dependencyJobIds) !== stableAuthorityStringify(expectedDependencyJobIds) ||
      job.snapshotId !== snapshot.snapshotId ||
      job.reservationId !== snapshot.reservationId ||
      job.workItemKey !== workItem.workItemKey ||
      job.jobType !== workItem.workItemType ||
      job.workerClass !== workItem.workerClass ||
      job.executionInputRef.sha256 !== workItem.executionInputRef.sha256 ||
      stableAuthorityStringify(job.sourceSequenceItemIds) !== stableAuthorityStringify(workItem.sourceSequenceItemIds) ||
      stableAuthorityStringify(job.sourceCleanupDecisionIds) !== stableAuthorityStringify(workItem.sourceCleanupDecisionIds) ||
      stableAuthorityStringify(job.expectedAssetIds) !== stableAuthorityStringify(expectedAssetIds) ||
      job.maxAttempts !== workItem.maxAttempts ||
      job.attemptTimeoutSeconds !== workItem.attemptTimeoutSeconds ||
      job.status !== (workItem.dependencyKeys.length === 0 ? 'ready' : 'blocked')
    ) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Canonical derived job graph no longer matches immutable approved work items.', 409, {
        approvedWorkItemId: workItem.id,
      })
    }
  }
}

function requireApprovedExecutionLineage(
  aggregate: PrivateEditAuthorityAggregate,
  snapshot: AuthorityApprovedSnapshotManifest,
): {
  plan: AuthorityPlanRecord
  estimate: AuthorityCreditEstimateRecord
  reservation: PrivateEditAuthorityAggregate['reservations'][number]
  approval: PrivateEditAuthorityAggregate['approvals'][number]
} {
  const plan = aggregate.plans.find((record) => record.id === snapshot.planId)
  const estimate = aggregate.estimates.find((record) => record.id === snapshot.estimateId)
  const reservation = aggregate.reservations.find((record) => record.id === snapshot.reservationId)
  const approval = aggregate.approvals.find((record) => record.id === snapshot.approvalId)
  if (!plan || !estimate || !reservation || !approval) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Canonical approved snapshot lineage is incomplete.', 409)
  }
  const { snapshotHash, ...manifestWithoutHash } = snapshot
  const requiredComponentRefsMatch = SNAPSHOT_COMPONENT_NAMES.every((name) => {
    const planRef = plan.componentRefs[name]
    const snapshotRef = snapshot.componentRefs[name]
    return Boolean(planRef && snapshotRef && planRef.sha256 === snapshotRef.sha256 && planRef.byteLength === snapshotRef.byteLength)
  })
  const componentRefsMatch = requiredComponentRefsMatch &&
    stableAuthorityStringify(plan.componentRefs) === stableAuthorityStringify(snapshot.componentRefs)
  if (
    snapshot.schemaVersion !== 'private-edit-authority-approved-snapshot-v3' ||
    snapshot.workspaceId !== aggregate.workspaceId ||
    snapshot.projectId !== plan.projectId ||
    snapshot.editSessionId !== plan.editSessionId ||
    snapshot.planVersion !== plan.planVersion ||
    snapshot.planHash !== plan.planHash ||
    snapshot.estimateHash !== estimate.estimateHash ||
    snapshot.workGraphHash !== plan.workGraphHash ||
    snapshot.sourceSequenceHash !== plan.sourceSequenceHash ||
    snapshot.timingHash !== plan.timingHash ||
    !snapshot.approvedAssetManifestRef ||
    snapshot.approvedAssetManifestRef.sha256.length !== 64 ||
    snapshot.approvedAssetManifestHash.length !== 64 ||
    snapshotHash !== sha256AuthorityValue(manifestWithoutHash) ||
    plan.status !== 'approved' ||
    estimate.status !== 'approved' ||
    reservation.snapshotId !== snapshot.snapshotId ||
    reservation.planId !== plan.id ||
    reservation.estimateId !== estimate.id ||
    approval.snapshotId !== snapshot.snapshotId ||
    approval.planId !== plan.id ||
    approval.estimateId !== estimate.id ||
    approval.reservationId !== reservation.id ||
    !componentRefsMatch
  ) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Canonical approved snapshot lineage or integrity evidence is invalid.', 409)
  }
  const remainingReservedCredits = reservation.reservedCredits - reservation.spentCredits - reservation.releasedCredits - reservation.refundedCredits
  if (
    !['reserved', 'partially_spent'].includes(reservation.status) ||
    remainingReservedCredits <= 0 ||
    Date.parse(reservation.expiresAt) <= Date.now()
  ) {
    throw new ApiError('CREDITS_NOT_RESERVED', 'Canonical approved snapshot no longer has an active funded reservation.', 409, {
      reservationId: reservation.id,
      reservationStatus: reservation.status,
    })
  }
  return { plan, estimate, reservation, approval }
}

async function validateRevisionPublicationAuthority(input: {
  context: ServiceContext
  workspaceId: string
  projectId: string
  editSessionId: string
  revisionAuthority: NonNullable<PublishCanonicalEditPlanBody['revisionAuthority']>
  compiledIntent: Record<string, unknown>
}) {
  const decision = await createCanonicalPrivateReviewDecisionService(input.context).getCompleted({
    workspaceId: input.workspaceId,
    reviewAssemblyId: input.revisionAuthority.reviewAssemblyId,
  })
  const handoff = decision.revisionHandoff
  if (
    decision.decision !== 'request_revision' ||
    decision.status !== 'canonical_revision_requested' ||
    !handoff ||
    decision.identity.workspaceId !== input.workspaceId ||
    decision.identity.projectId !== input.projectId ||
    decision.identity.editSessionId !== input.editSessionId ||
    decision.identity.reviewDecisionId !== input.revisionAuthority.reviewDecisionId ||
    decision.identity.approvedPlanSnapshotId !== input.revisionAuthority.priorApprovedSnapshotId ||
    decision.manifest.manifestSha256 !== input.revisionAuthority.decisionManifestSha256 ||
    decision.authority.approvedPlanId !== input.revisionAuthority.priorApprovedPlanId ||
    decision.authority.approvedPlanVersion !== input.revisionAuthority.priorApprovedPlanVersion ||
    handoff.revisionRequestId !== input.revisionAuthority.revisionRequestId ||
    handoff.revisionIntentHash !== input.revisionAuthority.revisionIntentHash ||
    handoff.requiresReplanning !== true ||
    handoff.requiresFreshEstimateAndApproval !== true ||
    handoff.replacementPlanPublished !== false ||
    handoff.revisionExecutionStarted !== false ||
    input.compiledIntent.revisionIntentHash !== input.revisionAuthority.revisionIntentHash ||
    input.compiledIntent.priorApprovedSnapshotId !== input.revisionAuthority.priorApprovedSnapshotId ||
    input.compiledIntent.reviewDecisionId !== input.revisionAuthority.reviewDecisionId
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Replacement canonical plan is not bound to the exact completed revision handoff.',
      409,
      { requiredGate: 'exact_canonical_revision_handoff_compilation' },
    )
  }
  return decision
}

function requirePrivateAuthorityRuntime(context: ServiceContext): void {
  if (isExplicitLocalInternalTestRuntime(context.env)) return
  throw new ApiError(
    'TOOL_NOT_READY',
    'Canonical edit authority is blocked until its transactional Supabase RPC and distributed idempotency evidence are deployed.',
    503,
    { requiredGate: 'canonical_plan_funded_credit_work_graph_rpc' },
  )
}

function authorityScope(context: ServiceContext, ownerUserId: string, workspaceId: string) {
  return { localStorageRoot: context.env.localStorageRoot, ownerUserId, workspaceId }
}

function planningAuthorityScope(
  context: ServiceContext,
  ownerUserId: string,
  workspaceId: string,
  plan: Pick<AuthorityPlanRecord, 'projectId' | 'editSessionId'>,
) {
  return {
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId,
    workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
  }
}

function requireIdempotencyKey(value: string | undefined): string {
  const normalized = value?.trim()
  if (!normalized) throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for canonical authority mutations.', 400)
  if (normalized.length > 240 || Array.from(normalized).some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })) {
    throw new ApiError('VALIDATION_FAILED', 'Idempotency-Key is invalid.', 400)
  }
  return normalized
}

async function persistPlanComponents(
  context: ServiceContext,
  components: CanonicalPlanComponentsInput,
): Promise<Record<string, AuthorityJsonBlobRef>> {
  const entries = await Promise.all(PLAN_COMPONENT_NAMES.map(async (name) => [
    name,
    await putPrivateAuthorityJsonBlob({
      localStorageRoot: context.env.localStorageRoot,
      value: components[name] as Record<string, unknown> | unknown[],
    }),
  ] as const))
  return Object.fromEntries(entries)
}

async function loadCanonicalPlanComponents(
  context: ServiceContext,
  componentRefs: Record<string, AuthorityJsonBlobRef>,
): Promise<CanonicalPlanComponentsInput> {
  const entries = await Promise.all(PLAN_COMPONENT_NAMES.map(async (name) => {
    const ref = componentRefs[name]
    if (!ref) throw new ApiError('VALIDATION_FAILED', `Canonical ${name} component reference is missing.`, 409)
    return [name, await readPrivateAuthorityJsonBlob({
      localStorageRoot: context.env.localStorageRoot,
      ref,
    })] as const
  }))
  const parsed = canonicalPlanComponentsSchema.safeParse(Object.fromEntries(entries))
  if (!parsed.success) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical plan components no longer satisfy their authority contract.', 409, parsed.error.flatten())
  }
  return parsed.data
}

async function loadPlanningInputAuthorityBinding(
  context: ServiceContext,
  componentRefs: Record<string, AuthorityJsonBlobRef>,
): Promise<ResolvedPlanningInputAuthorityBinding> {
  const ref = componentRefs.planningInputAuthority
  if (!ref) throw new ApiError('PLAN_NOT_APPROVED', 'Canonical planning-input authority binding is missing.', 409)
  const value = await readPrivateAuthorityJsonBlob({ localStorageRoot: context.env.localStorageRoot, ref })
  const parsed = resolvedPlanningInputAuthorityBindingSchema.safeParse(value)
  if (!parsed.success) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical planning-input authority binding is invalid.', 409, parsed.error.flatten())
  }
  const binding = parsed.data
  const { bindingHash, ...bindingWithoutHash } = binding
  if (
    bindingHash !== sha256AuthorityValue(bindingWithoutHash) ||
    ref.sha256 !== sha256AuthorityValue(binding)
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical planning-input authority binding hash is invalid.', 409)
  }
  return binding
}

async function loadOptionalPlanningHandoffAuthority(input: {
  context: ServiceContext
  componentRefs: Record<string, AuthorityJsonBlobRef>
  components: CanonicalPlanComponentsInput
  planningInputAuthority: ResolvedPlanningInputAuthorityBinding
  sourceMediaAuthority: SourceBindingManifestCandidate
}): Promise<CanonicalPlanningHandoffPublicationBinding | undefined> {
  const ref = input.componentRefs.planningHandoffAuthority
  if (!ref) return undefined
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  const parsed = canonicalPlanningHandoffPublicationBindingSchema.safeParse(value)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Canonical planning-handoff publication binding is invalid.',
      409,
      parsed.error.flatten(),
    )
  }
  const binding = parsed.data
  if (
    binding.canonicalPlanComponentsHash !== sha256AuthorityValue(input.components) ||
    binding.planningInputBindingHash !== input.planningInputAuthority.bindingHash ||
    binding.sourceCandidateHash !== input.sourceMediaAuthority.candidateHash ||
    ref.sha256 !== sha256AuthorityValue(binding)
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Canonical planning-handoff publication binding no longer matches immutable plan authority.',
      409,
    )
  }
  return binding
}

async function buildAndVerifySourceMediaAuthority(input: {
  context: ServiceContext
  workspaceId: string
  projectId: string
  sourceSequence: CanonicalPlanComponentsInput['sourceSequence']
  expectation: SourceMediaAuthorityExpectation
}): Promise<SourceBindingManifestCandidate> {
  if (input.sourceSequence.some((item) => !item.checksumSha256)) {
    throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'Every canonical source item requires the finalized server-computed SHA-256.', 409)
  }
  const result = await createSourceMediaAuthorityService(input.context).buildManifestCandidate({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    uploadPurpose: 'source_media',
    orderedItems: input.sourceSequence.map((item) => ({
      sourceSequenceItemId: item.sourceSequenceItemId,
      mediaAssetId: item.mediaAssetId,
      uploadedOrder: item.uploadedOrder,
      checksumSha256: item.checksumSha256!,
      required: item.required,
    })),
  })
  const candidate = result.sourceBindingManifestCandidate
  if (
    candidate.authorityRevision !== input.expectation.authorityRevision ||
    candidate.authorityChecksumSha256 !== input.expectation.authorityChecksumSha256 ||
    candidate.sourceSequenceHash !== input.expectation.sourceSequenceHash ||
    candidate.candidateHash !== input.expectation.candidateHash
  ) {
    throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'Source-media authority changed after the planner loaded it.', 409, {
      requiredFlow: 'reload_source_authority_and_replan',
    })
  }
  return candidate
}

async function loadSourceMediaAuthorityCandidate(
  context: ServiceContext,
  componentRefs: Record<string, AuthorityJsonBlobRef>,
): Promise<SourceBindingManifestCandidate> {
  const ref = componentRefs.sourceMediaAuthority
  if (!ref) throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'Canonical source-media authority binding is missing.', 409)
  const value = await readPrivateAuthorityJsonBlob({ localStorageRoot: context.env.localStorageRoot, ref })
  const parsed = sourceBindingManifestCandidateSchema.safeParse(value)
  if (!parsed.success) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical source-media authority binding is invalid.', 409, parsed.error.flatten())
  }
  const candidate = parsed.data
  const { candidateHash, ...candidateWithoutHash } = candidate
  if (
    candidateHash !== sha256AuthorityValue(candidateWithoutHash) ||
    ref.sha256 !== sha256AuthorityValue(candidate)
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical source-media authority binding hash is invalid.', 409)
  }
  return candidate
}

function sourceExpectationFromCandidate(candidate: SourceBindingManifestCandidate): SourceMediaAuthorityExpectation {
  return {
    authorityRevision: candidate.authorityRevision,
    authorityChecksumSha256: candidate.authorityChecksumSha256,
    sourceSequenceHash: candidate.sourceSequenceHash,
    candidateHash: candidate.candidateHash,
  }
}

function createApprovedSourceAssetManifest(input: {
  snapshotId: string
  sourceCandidate: SourceBindingManifestCandidate
  approvedAt: string
}): ApprovedSourceBindingManifest {
  const manifestWithoutHash = {
    schemaVersion: 'private-approved-source-binding-manifest-v1' as const,
    snapshotId: input.snapshotId,
    workspaceId: input.sourceCandidate.workspaceId,
    projectId: input.sourceCandidate.projectId,
    uploadPurpose: 'source_media' as const,
    authorityRevision: input.sourceCandidate.authorityRevision,
    authorityChecksumSha256: input.sourceCandidate.authorityChecksumSha256,
    sourceSequenceHash: input.sourceCandidate.sourceSequenceHash,
    sourceCandidateHash: input.sourceCandidate.candidateHash,
    bindings: input.sourceCandidate.bindings.map((binding) => ({ ...binding })),
    requiredBindingCount: input.sourceCandidate.requiredBindingCount,
    approvedAt: input.approvedAt,
  }
  return approvedSourceBindingManifestSchema.parse({
    ...manifestWithoutHash,
    manifestHash: sha256AuthorityValue(manifestWithoutHash),
  })
}

function assertApprovedSourceAssetManifestMatchesAuthority(
  manifest: ApprovedSourceBindingManifest,
  snapshot: AuthorityApprovedSnapshotManifest,
  candidate: SourceBindingManifestCandidate,
): void {
  const { manifestHash, ...manifestWithoutHash } = manifest
  if (
    manifest.snapshotId !== snapshot.snapshotId ||
    manifest.workspaceId !== snapshot.workspaceId ||
    manifest.projectId !== snapshot.projectId ||
    manifest.sourceCandidateHash !== candidate.candidateHash ||
    manifest.authorityRevision !== candidate.authorityRevision ||
    manifest.authorityChecksumSha256 !== candidate.authorityChecksumSha256 ||
    manifest.sourceSequenceHash !== candidate.sourceSequenceHash ||
    stableAuthorityStringify(manifest.bindings) !== stableAuthorityStringify(candidate.bindings) ||
    manifest.requiredBindingCount !== candidate.requiredBindingCount ||
    manifestHash !== snapshot.approvedSourceAssetManifestHash ||
    manifestHash !== sha256AuthorityValue(manifestWithoutHash) ||
    snapshot.approvedSourceAssetManifestRef.sha256 !== sha256AuthorityValue(manifest)
  ) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved source-asset manifest lineage or hash is invalid.', 409)
  }
}

async function persistWorkItemComponents(context: ServiceContext, workItems: CanonicalWorkItemInput[]) {
  return Promise.all(workItems.map(async (input) => ({
    input,
    executionInputRef: await putPrivateAuthorityJsonBlob({
      localStorageRoot: context.env.localStorageRoot,
      value: input.executionInput,
      maxBytes: 128 * 1024,
    }),
    fallbackPolicyRef: await putPrivateAuthorityJsonBlob({
      localStorageRoot: context.env.localStorageRoot,
      value: input.fallbackPolicy,
      maxBytes: 32 * 1024,
    }),
  })))
}

function createApprovedAssetManifest(input: {
  snapshotId: string
  plan: AuthorityPlanRecord
  approvedWorkItems: AuthorityApprovedWorkItemRecord[]
  timestamp: string
}): AuthorityPlannedAssetManifest {
  const entries = input.approvedWorkItems.flatMap((workItem) => workItem.expectedOutputs.map((output) => ({
    id: `authority_asset_${sha256AuthorityValue({
      snapshotId: input.snapshotId,
      approvedWorkItemId: workItem.id,
      outputKey: output.outputKey,
    }).slice(0, 40)}`,
    snapshotId: input.snapshotId,
    approvedWorkItemId: workItem.id,
    workItemKey: workItem.workItemKey,
    outputKey: output.outputKey,
    artifactType: output.artifactType,
    assetRole: output.assetRole,
    required: output.required,
    previewPlaceholderAllowed: output.previewPlaceholderAllowed,
    ...(output.contentType ? { contentType: output.contentType } : {}),
    segmentIds: [...output.segmentIds],
    timingIds: [...output.timingIds],
    rendererLayerIds: [...output.rendererLayerIds],
    status: 'planned' as const,
    version: 1 as const,
    createdAt: input.timestamp,
  })))
  const manifestWithoutHash = {
    schemaVersion: 'private-edit-asset-manifest-v1' as const,
    snapshotId: input.snapshotId,
    planId: input.plan.id,
    planHash: input.plan.planHash,
    workGraphHash: input.plan.workGraphHash,
    entries,
    requiredAssetCount: entries.filter((entry) => entry.required).length,
    optionalAssetCount: entries.filter((entry) => !entry.required).length,
  }
  return {
    ...manifestWithoutHash,
    manifestHash: sha256AuthorityValue(manifestWithoutHash),
  }
}

function validateCanonicalPlanDraft(
  components: CanonicalPlanComponentsInput,
  workItems: CanonicalWorkItemInput[],
  estimate: PublishCanonicalEditPlanBody['canonicalPlan']['estimate'],
): void {
  const uploadedOrders = components.sourceSequence.map((item) => item.uploadedOrder)
  const expectedOrders = components.sourceSequence.map((_, index) => index + 1)
  if (
    new Set(components.sourceSequence.map((item) => item.sourceSequenceItemId)).size !== components.sourceSequence.length ||
    new Set(components.sourceSequence.map((item) => item.mediaAssetId)).size !== components.sourceSequence.length ||
    components.sourceSequence.some((item) => !item.checksumSha256) ||
    stableAuthorityStringify(uploadedOrders) !== stableAuthorityStringify(expectedOrders)
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical source sequence must be unique and contiguous in confirmed upload order.', 400)
  }
  const sourceSequenceItemIds = new Set(components.sourceSequence.map((item) => item.sourceSequenceItemId))
  const cleanupDecisionIds = new Set<string>()
  for (const decision of components.sourceCleanupPlan.decisions) {
    if (
      cleanupDecisionIds.has(decision.decisionId) ||
      !sourceSequenceItemIds.has(decision.sourceSequenceItemId) ||
      decision.endFrameExclusive <= decision.startFrame
    ) {
      throw new ApiError('VALIDATION_FAILED', 'Canonical cleanup decisions must be unique, frame-bounded, and linked to the confirmed source sequence.', 400, {
        decisionId: decision.decisionId,
      })
    }
    cleanupDecisionIds.add(decision.decisionId)
  }
  if (components.confirmedSettings.outputFrame.fps !== components.timingSummary.fps) {
    throw new ApiError('VALIDATION_FAILED', 'Confirmed output-frame FPS must match the canonical timing base.', 400)
  }
  const segmentIds = new Set<string>()
  let previousEndFrame = 0
  for (const segment of components.segments) {
    if (segmentIds.has(segment.segmentId) || segment.endFrameExclusive <= segment.startFrame || segment.startFrame < previousEndFrame) {
      throw new ApiError('VALIDATION_FAILED', 'Canonical timeline segments must be unique, ordered, and non-overlapping.', 400)
    }
    if (segment.endFrameExclusive > components.timingSummary.totalFrames) {
      throw new ApiError('VALIDATION_FAILED', 'Canonical timeline segment exceeds the approved total frame count.', 400)
    }
    segmentIds.add(segment.segmentId)
    previousEndFrame = segment.endFrameExclusive
  }

  const workItemKeys = new Set(workItems.map((item) => item.workItemKey))
  if (workItemKeys.size !== workItems.length) throw new ApiError('VALIDATION_FAILED', 'Canonical work-item keys must be unique.', 400)
  for (const workItem of workItems) {
    if (workItem.dependencyKeys.includes(workItem.workItemKey) || workItem.dependencyKeys.some((key) => !workItemKeys.has(key))) {
      throw new ApiError('VALIDATION_FAILED', 'Canonical work graph contains a missing or self dependency.', 400, {
        workItemKey: workItem.workItemKey,
      })
    }
    if (new Set(workItem.dependencyKeys).size !== workItem.dependencyKeys.length) {
      throw new ApiError('VALIDATION_FAILED', 'Canonical work graph contains duplicate dependencies.', 400)
    }
    if (
      new Set(workItem.sourceSequenceItemIds).size !== workItem.sourceSequenceItemIds.length ||
      workItem.sourceSequenceItemIds.some((id) => !sourceSequenceItemIds.has(id)) ||
      new Set(workItem.sourceCleanupDecisionIds).size !== workItem.sourceCleanupDecisionIds.length ||
      workItem.sourceCleanupDecisionIds.some((id) => !cleanupDecisionIds.has(id))
    ) {
      throw new ApiError('VALIDATION_FAILED', 'Canonical work item references unknown or duplicate source/cleanup authority.', 400, {
        workItemKey: workItem.workItemKey,
      })
    }
    if (
      ['prepare_source_trim', 'process_video_asset'].includes(workItem.workItemType) &&
      (workItem.sourceSequenceItemIds.length === 0 || workItem.sourceCleanupDecisionIds.length === 0)
    ) {
      throw new ApiError(
        'JOB_DEPENDENCY_NOT_READY',
        'Source trim/video work requires explicit approved source bindings and cleanup decisions; full-file/default trimming is forbidden.',
        409,
        { workItemKey: workItem.workItemKey },
      )
    }
    const outputKeys = new Set(workItem.expectedOutputs.map((output) => output.outputKey))
    if (outputKeys.size !== workItem.expectedOutputs.length) {
      throw new ApiError('VALIDATION_FAILED', 'Canonical expected-output keys must be unique within a work item.', 400, {
        workItemKey: workItem.workItemKey,
      })
    }
    for (const output of workItem.expectedOutputs) {
      if (
        new Set(output.segmentIds).size !== output.segmentIds.length ||
        output.segmentIds.some((segmentId) => !segmentIds.has(segmentId)) ||
        new Set(output.timingIds).size !== output.timingIds.length ||
        new Set(output.rendererLayerIds).size !== output.rendererLayerIds.length ||
        (output.assetRole === 'final' && output.previewPlaceholderAllowed)
      ) {
        throw new ApiError('VALIDATION_FAILED', 'Canonical expected-output lineage is invalid.', 400, {
          workItemKey: workItem.workItemKey,
          outputKey: output.outputKey,
        })
      }
    }
    const unknownTools = workItem.approvedToolIds.filter((toolId) => !isProductionToolId(toolId))
    if (unknownTools.length > 0) {
      throw new ApiError('VALIDATION_FAILED', 'Canonical work item references tools outside the production registry.', 400, { unknownTools })
    }
    assertApprovedToolOperationIdentities(workItem)
    if (workItem.workItemType === 'render_final_export' && workItem.approvedToolIds.length === 0) {
      throw new ApiError(
        'TOOL_NOT_READY',
        'Required final export must freeze at least one callable renderer or media-tool operation; a provider cannot own the final canvas.',
        409,
        { workItemKey: workItem.workItemKey },
      )
    }
    if (workItem.approvedProviderRoute && !components.providerPolicy.approvedRoutes.includes(workItem.approvedProviderRoute)) {
      throw new ApiError('PROVIDER_ROUTE_BLOCKED', 'Canonical work item provider route is not in the approved route policy.', 409)
    }
    if (!workItem.approvedProviderRoute && workItem.providerExecutionMode !== 'none') {
      throw new ApiError('PROVIDER_ROUTE_BLOCKED', 'Provider execution mode requires an approved provider route.', 409)
    }
    if (workItem.workItemType === 'request_user_review') {
      throw new ApiError('PLAN_NOT_APPROVED', 'Canonical work graph cannot be approved while user review remains unresolved.', 409)
    }
  }
  assertAcyclicWorkGraph(workItems)
  for (const requiredType of ['validate_approved_snapshot', 'run_final_qa', 'render_final_export'] as const) {
    if (!workItems.some((item) => item.workItemType === requiredType && item.required)) {
      throw new ApiError('VALIDATION_FAILED', `Canonical work graph is missing required ${requiredType} authority.`, 400)
    }
  }
  const finalExportItems = workItems.filter((item) => item.workItemType === 'render_final_export' && item.required)
  if (!finalExportItems.some((item) => item.expectedOutputs.some((output) => output.assetRole === 'final' && output.required))) {
    throw new ApiError('VALIDATION_FAILED', 'Required final export work must declare a required final artifact.', 400)
  }

  const estimatedCredits = estimate.lineItems.reduce((total, item) => total + item.estimatedCredits, 0)
  const approvedMaximumCredits = estimatedCredits + estimate.fallbackAllowanceCredits
  const workBudget = workItems.reduce((total, item) => total + item.maximumCreditBudget, 0)
  if (estimatedCredits <= 0 || workBudget > approvedMaximumCredits) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical work-item budgets must fit inside the itemized approved credit maximum.', 400, {
      workBudget,
      approvedMaximumCredits,
    })
  }
  const editLevel = components.confirmedSettings.editLevel
  const veoItems = workItems.filter((item) => item.approvedProviderRoute?.toLowerCase().includes('veo'))
  if (['basic', 'pro', 'normal'].includes(editLevel) && (veoItems.length > 0 || components.providerPolicy.veoPolicy !== 'forbidden')) {
    throw new ApiError('PROVIDER_MODEL_ROLE_FORBIDDEN', 'Basic, Pro, and Normal plans cannot route to Veo.', 409)
  }
  if (veoItems.some((item) => item.providerExecutionMode !== 'final_fallback') ||
      (veoItems.length > 0 && components.providerPolicy.veoPolicy !== 'final_fallback_only')) {
    throw new ApiError('PROVIDER_MODEL_ROLE_FORBIDDEN', 'Premium Veo authority is final-fallback-only.', 409)
  }
}

function assertApprovedToolOperationIdentities(workItem: CanonicalWorkItemInput): void {
  if (new Set(workItem.approvedToolIds).size !== workItem.approvedToolIds.length) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical work item contains duplicate approved tool identities.', 400, {
      workItemKey: workItem.workItemKey,
    })
  }

  const rawOperationIds = workItem.executionInput.approvedToolOperationIds
  if (!Array.isArray(rawOperationIds) || rawOperationIds.some((value) => typeof value !== 'string')) {
    if (workItem.approvedToolIds.length === 0 && rawOperationIds === undefined) return
    throw new ApiError(
      'VALIDATION_FAILED',
      'Every tool-backed canonical work item must freeze approvedToolOperationIds as a string array.',
      400,
      { workItemKey: workItem.workItemKey },
    )
  }
  const operationIds = rawOperationIds as string[]
  if (new Set(operationIds).size !== operationIds.length) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical work item contains duplicate tool operation identities.', 400, {
      workItemKey: workItem.workItemKey,
    })
  }
  if (workItem.approvedToolIds.length === 0) {
    if (operationIds.length > 0) {
      throw new ApiError('VALIDATION_FAILED', 'A tool-free canonical work item cannot smuggle tool operation authority.', 400, {
        workItemKey: workItem.workItemKey,
      })
    }
    return
  }

  const expectedOperationIds = workItem.approvedToolIds.map((toolId) => {
    const spec = resolveCompleteProfessionalToolOperationSpec(toolId)
    if (!spec || spec.canonicalToolId !== toolId || spec.disposition !== 'edit_operation_candidate' || spec.policyBlocks.length > 0) {
      throw new ApiError(
        'TOOL_NOT_READY',
        'Canonical work item cannot approve a planning-only, readiness-only, future, evaluation, license-blocked, or otherwise non-callable tool.',
        409,
        { workItemKey: workItem.workItemKey, toolId },
      )
    }
    return spec.allowedOperationIds[0]
  })
  const expected = [...expectedOperationIds].sort()
  const actual = [...operationIds].sort()
  if (
    expected.length !== actual.length ||
    expected.some((operationId, index) => operationId !== actual[index])
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Canonical work item tool operation identities must exactly match its approved canonical tools.',
      400,
      { workItemKey: workItem.workItemKey, expectedOperationIds: expected },
    )
  }
}

function assertAcyclicWorkGraph(workItems: CanonicalWorkItemInput[]): void {
  const byKey = new Map(workItems.map((item) => [item.workItemKey, item]))
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (key: string) => {
    if (visiting.has(key)) throw new ApiError('VALIDATION_FAILED', 'Canonical work graph contains a dependency cycle.', 400, { workItemKey: key })
    if (visited.has(key)) return
    visiting.add(key)
    for (const dependency of byKey.get(key)?.dependencyKeys ?? []) visit(dependency)
    visiting.delete(key)
    visited.add(key)
  }
  for (const key of byKey.keys()) visit(key)
}

function findIdempotencyReplay(
  aggregate: PrivateEditAuthorityAggregate,
  operation: 'publish_plan' | 'approve_plan',
  idempotencyKey: string,
  requestHash: string,
): Record<string, unknown> | undefined {
  const existing = aggregate.idempotencyRecords.find((record) =>
    record.operation === operation && record.idempotencyKey === idempotencyKey
  )
  if (!existing) return undefined
  if (existing.requestHash !== requestHash) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different canonical authority request.', 409)
  }
  return existing.response
}

function requirePlan(aggregate: PrivateEditAuthorityAggregate, planId: string): AuthorityPlanRecord {
  const plan = aggregate.plans.find((record) => record.id === planId)
  if (!plan) throw new ApiError('PLAN_NOT_APPROVED', 'Canonical edit plan was not found.', 404)
  return plan
}

function requireEstimate(aggregate: PrivateEditAuthorityAggregate, estimateId: string): AuthorityCreditEstimateRecord {
  const estimate = aggregate.estimates.find((record) => record.id === estimateId)
  if (!estimate) throw new ApiError('CREDIT_ESTIMATE_NOT_APPROVED', 'Canonical credit estimate was not found.', 404)
  return estimate
}

function requirePlanWorkItem(
  aggregate: PrivateEditAuthorityAggregate,
  workItemId: string,
  planId: string,
): AuthorityPlanWorkItemRecord {
  const workItem = aggregate.planWorkItems.find((record) => record.id === workItemId && record.planId === planId)
  if (!workItem) throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Canonical plan work item was not found.', 409)
  return workItem
}

function createPublishedPlanResponse(
  aggregate: PrivateEditAuthorityAggregate,
  plan: AuthorityPlanRecord,
  estimate: AuthorityCreditEstimateRecord,
  workItems: AuthorityPlanWorkItemRecord[],
  authorityRevision: number,
): Record<string, unknown> {
  return {
    authorityRevision,
    plan: {
      id: plan.id,
      projectId: plan.projectId,
      editSessionId: plan.editSessionId,
      planVersion: plan.planVersion,
      status: plan.status,
      planHash: plan.planHash,
      workGraphHash: plan.workGraphHash,
      sourceSequenceHash: plan.sourceSequenceHash,
      timingHash: plan.timingHash,
      componentRefs: plan.componentRefs,
      revisionAuthority: plan.revisionAuthority,
      createdAt: plan.createdAt,
      approvedAt: plan.approvedAt,
    },
    estimate: {
      id: estimate.id,
      status: estimate.status,
      estimateVersion: estimate.estimateVersion,
      estimatedCredits: estimate.estimatedCredits,
      fallbackAllowanceCredits: estimate.fallbackAllowanceCredits,
      approvedMaximumCredits: estimate.approvedMaximumCredits,
      estimateHash: estimate.estimateHash,
      validUntil: estimate.validUntil,
      lineItems: estimate.lineItems,
    },
    workItems: workItems.map((workItem) => ({
      id: workItem.id,
      workItemKey: workItem.workItemKey,
      workItemType: workItem.workItemType,
      workerClass: workItem.workerClass,
      dependencyKeys: workItem.dependencyKeys,
      approvedToolIds: workItem.approvedToolIds,
      approvedProviderRoute: workItem.approvedProviderRoute,
      providerExecutionMode: workItem.providerExecutionMode,
      maximumCreditBudget: workItem.maximumCreditBudget,
      required: workItem.required,
      executionInputRef: workItem.executionInputRef,
      sourceSequenceItemIds: workItem.sourceSequenceItemIds,
      sourceCleanupDecisionIds: workItem.sourceCleanupDecisionIds,
      expectedOutputs: workItem.expectedOutputs,
    })),
    wallet: walletBalanceAfter(aggregate.wallet),
    testOnly: true,
  }
}

function createApprovalResponse(
  aggregate: PrivateEditAuthorityAggregate,
  plan: AuthorityPlanRecord,
  estimate: AuthorityCreditEstimateRecord,
  snapshot: AuthorityApprovedSnapshotManifest,
  jobs: AuthorityDerivedJobRecord[],
  authorityRevision: number,
  revisionReconciliation?: {
    priorSnapshotId: string
    priorReservationId: string
    releasedCredits: number
  },
): Record<string, unknown> {
  const approval = aggregate.approvals.find((record) => record.snapshotId === snapshot.snapshotId)!
  const reservation = aggregate.reservations.find((record) => record.id === snapshot.reservationId)!
  return {
    authorityRevision,
    approval,
    snapshot,
    reservation,
    plan: { id: plan.id, status: plan.status, planHash: plan.planHash },
    estimate: {
      id: estimate.id,
      status: estimate.status,
      estimateHash: estimate.estimateHash,
      approvedMaximumCredits: estimate.approvedMaximumCredits,
    },
    jobs: jobs.map(safeJobSummary),
    wallet: walletBalanceAfter(aggregate.wallet),
    revisionReconciliation: revisionReconciliation
      ? {
          ...revisionReconciliation,
          newSnapshotId: snapshot.snapshotId,
          newReservationId: reservation.id,
          newlyReservedCredits: reservation.reservedCredits,
          atomicSyntheticReconciliation: true,
          customerWalletMutation: false,
          billingExecuted: false,
        }
      : undefined,
    testOnly: true,
  }
}

function safeJobSummary(job: AuthorityDerivedJobRecord) {
  return {
    id: job.id,
    approvedWorkItemId: job.approvedWorkItemId,
    workItemKey: job.workItemKey,
    jobType: job.jobType,
    workerClass: job.workerClass,
    sourceSequenceItemIds: job.sourceSequenceItemIds,
    sourceCleanupDecisionIds: job.sourceCleanupDecisionIds,
    expectedAssetIds: job.expectedAssetIds,
    dependencyJobIds: job.dependencyJobIds,
    status: job.status,
    maxAttempts: job.maxAttempts,
    attemptTimeoutSeconds: job.attemptTimeoutSeconds,
    scheduledFor: job.scheduledFor,
  }
}

function toAuthorityEstimateLineItem(item: {
  lineKey: string
  label: string
  category: string
  estimatedCredits: number
  removable: boolean
  metadataRef: AuthorityJsonBlobRef
}) {
  return {
    lineKey: item.lineKey,
    label: item.label,
    category: item.category,
    estimatedCredits: item.estimatedCredits,
    removable: item.removable,
    metadataRef: item.metadataRef,
  }
}

function canonicalAuthorityResponse(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(stableAuthorityStringify(value)) as Record<string, unknown>
}
