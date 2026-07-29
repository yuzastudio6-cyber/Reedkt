import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  canonicalRevisionPlanPresentationReceiptSchema,
  presentCanonicalRevisionPlanSchema,
  type CanonicalRevisionPlanPresentationReceipt,
  type PresentCanonicalRevisionPlanBody,
} from '../validation/canonical-revision-plan-presentation-schemas'
import { createCanonicalPlanPresentationCoordinatorService } from './canonical-plan-presentation-coordinator-service'
import { createCanonicalPlanningHandoffService } from './canonical-planning-handoff-service'
import { createCanonicalPrivateReviewDecisionService } from './canonical-private-review-decision-service'
import {
  planningExactEditPreferenceAuthorityStateHash,
  readPlanningExactEditPreferenceAuthority,
} from './planning-exact-edit-preference-authority-port'
import { sha256AuthorityValue } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'

const revisionPresentationLocks = new Map<string, Promise<void>>()

export type CanonicalRevisionPlanPresentationCoordinatorResult = {
  receipt: CanonicalRevisionPlanPresentationReceipt
  warnings: string[]
}

export function createCanonicalRevisionPlanPresentationCoordinatorService(
  context: ServiceContext,
) {
  return {
    async present(input: PresentCanonicalRevisionPlanBody & {
      projectId: string
      editSessionId: string
      idempotencyKey: string
    }): Promise<CanonicalRevisionPlanPresentationCoordinatorResult> {
      const { projectId, editSessionId, idempotencyKey, ...requestBody } = input
      const parsed = presentCanonicalRevisionPlanSchema.safeParse(requestBody)
      if (
        !parsed.success ||
        !safeIdentity(projectId) ||
        !safeIdentity(editSessionId) ||
        !validIdempotencyKey(idempotencyKey)
      ) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical revision plan presentation request validation failed.',
          400,
          parsed.success
            ? { routeIdentity: ['Invalid project, edit-session, or idempotency identity.'] }
            : parsed.error.flatten(),
        )
      }
      const body = parsed.data
      const lockKey = sha256AuthorityValue({
        domain: 'canonical_revision_plan_presentation_v1',
        workspaceId: body.workspaceId,
        projectId,
        editSessionId,
        reviewAssemblyId: body.expectedReviewAssemblyId,
      })

      return withRevisionPresentationLock(lockKey, async () => {
        const decisionService = createCanonicalPrivateReviewDecisionService(context)
        const decision = await decisionService.getCompleted({
          workspaceId: body.workspaceId,
          reviewAssemblyId: body.expectedReviewAssemblyId,
        })
        const revisionHandoff = decision.revisionHandoff
        if (
          decision.identity.workspaceId !== body.workspaceId ||
          decision.identity.projectId !== projectId ||
          decision.identity.editSessionId !== editSessionId ||
          decision.identity.packageRecordId !== body.expectedPackageRecordId ||
          decision.identity.reviewAssemblyId !== body.expectedReviewAssemblyId ||
          decision.manifest.manifestSha256 !== body.expectedDecisionManifestSha256 ||
          decision.authority.finalArtifactSha256 !== body.expectedFinalArtifactSha256 ||
          decision.decision !== 'request_revision' ||
          decision.status !== 'canonical_revision_requested' ||
          !revisionHandoff ||
          decision.readiness.revisionRequested !== true ||
          revisionHandoff.requiresReplanning !== true ||
          revisionHandoff.requiresFreshEstimateAndApproval !== true ||
          revisionHandoff.revisionExecutionStarted !== false
        ) {
          throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'The replacement plan does not match the exact completed revision decision.',
            409,
            { requiredGate: 'exact_unconsumed_private_review_revision_decision' },
          )
        }

        const preferenceScope = {
          localStorageRoot: context.env.localStorageRoot,
          ownerUserId: getRequiredAuthUserId(context),
          workspaceId: body.workspaceId,
          projectId,
          editSessionId,
        }
        const preferenceBefore =
          await readPlanningExactEditPreferenceAuthority({
            context,
            scope: preferenceScope,
          })
        if (!preferenceBefore.authority.locked) {
          throw new ApiError(
            'PLAN_NOT_APPROVED',
            'A replacement plan requires the locked preference evidence from the prior approved snapshot.',
            409,
            { requiredGate: 'locked_exact_edit_preference_evidence' },
          )
        }
        const preferenceAuthorityStateHash =
          planningExactEditPreferenceAuthorityStateHash(preferenceBefore)

        const revisionAuthority = {
          reviewAssemblyId: decision.identity.reviewAssemblyId,
          reviewDecisionId: decision.identity.reviewDecisionId,
          revisionRequestId: revisionHandoff.revisionRequestId,
          decisionManifestSha256: decision.manifest.manifestSha256,
          priorApprovedSnapshotId: decision.identity.approvedPlanSnapshotId,
          priorApprovedPlanId: decision.authority.approvedPlanId,
          priorApprovedPlanVersion: decision.authority.approvedPlanVersion,
          revisionIntentHash: revisionHandoff.revisionIntentHash,
        }
        const canonicalPlan = structuredClone(body.canonicalPlan)
        canonicalPlan.components.compiledIntent = {
          ...canonicalPlan.components.compiledIntent,
          revisionIntentHash: revisionHandoff.revisionIntentHash,
          priorApprovedSnapshotId: decision.identity.approvedPlanSnapshotId,
          reviewDecisionId: decision.identity.reviewDecisionId,
        }

        const planningHandoff = await createCanonicalPlanningHandoffService(
          context,
        ).prepare({
          workspaceId: body.workspaceId,
          projectId,
          editSessionId,
          purpose: 'prepare_canonical_planning_handoff',
          orderedSourceItems: body.orderedSourceItems,
          canonicalPlanComponents: canonicalPlan.components,
        })
        const planningRequestHash = sha256AuthorityValue({
          domain: 'canonical_revision_plan_request_v1',
          revisionRequestId: revisionHandoff.revisionRequestId,
          handoffHash: planningHandoff.handoffHash,
          canonicalPlan,
        })
        const presentation = await createCanonicalPlanPresentationCoordinatorService(
          context,
        ).present({
          workspaceId: body.workspaceId,
          projectId,
          editSessionId,
          handoffId: planningHandoff.handoffId,
          planningRequestId: `canonical-revision-${planningRequestHash.slice(0, 48)}`,
          expectedHandoffHash: planningHandoff.handoffHash,
          revisionAuthority,
          canonicalPlan,
        })
        if (presentation.publicationRequest.publicationStatus !== 'published') {
          throw new ApiError(
            'JOB_DEPENDENCY_NOT_READY',
            'The replacement plan candidate is persisted but has not reached fresh approval review.',
            409,
            { requiredGate: 'canonical_revision_plan_internal_presentation' },
          )
        }
        const published = presentation.publicationRequest.publication
        if (
          published.planVersion !== revisionHandoff.minimumNextPlanVersion ||
          published.planVersion !== decision.authority.approvedPlanVersion + 1 ||
          published.planStatus !== 'presented'
        ) {
          throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'The replacement plan is not the exact next unapproved plan version.',
            409,
            { requiredGate: 'next_immutable_revision_plan_version' },
          )
        }

        const preferenceAfter =
          await readPlanningExactEditPreferenceAuthority({
            context,
            scope: preferenceScope,
          })
        if (
          !preferenceAfter.authority.locked ||
          planningExactEditPreferenceAuthorityStateHash(preferenceAfter) !==
            preferenceAuthorityStateHash
        ) {
          throw new ApiError(
            'JOB_DEPENDENCY_NOT_READY',
            'Locked Edit Preference authority changed while the replacement plan was presented.',
            409,
            { requiredGate: 'immutable_locked_preference_evidence' },
          )
        }

        const decisionAfter = await decisionService.getCompleted({
          workspaceId: body.workspaceId,
          reviewAssemblyId: body.expectedReviewAssemblyId,
        })
        if (
          decisionAfter.responseHash !== decision.responseHash ||
          decisionAfter.manifest.manifestSha256 !== decision.manifest.manifestSha256
        ) {
          throw new ApiError(
            'JOB_DEPENDENCY_NOT_READY',
            'The prior private-review revision decision changed during replacement planning.',
            409,
            { requiredGate: 'immutable_private_review_revision_decision' },
          )
        }

        const receipt = canonicalRevisionPlanPresentationReceiptSchema.parse({
          schemaVersion: 'canonical-revision-plan-presentation-receipt-v1',
          source: 'canonical_revision_plan_presentation_coordinator_service',
          purpose: body.purpose,
          disposition: 'replacement_plan_presented',
          identity: {
            workspaceId: body.workspaceId,
            projectId,
            editSessionId,
            reviewAssemblyId: body.expectedReviewAssemblyId,
          },
          replacementPlan: {
            planId: published.planId,
            planVersion: published.planVersion,
            planHash: published.planHash,
            priorPlanVersion: decision.authority.approvedPlanVersion,
            freshEstimatePresented: true,
            freshApprovalRequired: true,
          },
          authority: {
            exactRevisionDecisionRevalidated: true,
            immutablePriorSnapshotPreserved:
              decision.authority.immutableApprovedSnapshotPreserved,
            immutablePriorReviewPreserved:
              decision.authority.immutableReviewManifestPreserved,
            lockedPreferenceEvidenceReusedWithoutMutation: true,
          },
          boundaries: {
            approvalRecorded: false,
            snapshotCreated: false,
            creditReservationMutated: false,
            customerWalletMutated: false,
            workGraphStarted: false,
            toolExecutionStarted: false,
            providerCallStarted: false,
            renderStarted: false,
            billingStarted: false,
            publicDeliveryStarted: false,
          },
          persistence: {
            privateLocal: true,
            tenantScoped: true,
            distributed: false,
            productionAuthority: false,
          },
          rawRevisionAuthorityReturned: false,
          jobOrToolDetailsReturned: false,
          pathOrCredentialReturned: false,
          replayed: !presentation.newlyPresented,
          testOnly: true,
        })

        return {
          receipt,
          warnings: [
            ...presentation.warnings,
            'The backend reloaded the exact revision decision and injected its authority without returning it to the browser.',
            'The prior snapshot, private review, and locked Edit Preference evidence remain immutable.',
            'The replacement plan has a fresh estimate and still requires explicit approval; no credit, execution, render, billing, or public-delivery action started.',
          ],
        }
      })
    },
  }
}

async function withRevisionPresentationLock<T>(
  key: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = revisionPresentationLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => { release = resolve })
  revisionPresentationLocks.set(key, current)
  await previous
  try {
    return await operation()
  } finally {
    release()
    if (revisionPresentationLocks.get(key) === current) {
      revisionPresentationLocks.delete(key)
    }
  }
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}

function validIdempotencyKey(value: string): boolean {
  const normalized = value.trim()
  return normalized.length >= 8 && normalized.length <= 240 &&
    !Array.from(normalized).some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
}
