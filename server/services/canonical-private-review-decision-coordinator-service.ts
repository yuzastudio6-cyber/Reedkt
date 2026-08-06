import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateReviewDecisionCoordinatorReceiptSchema,
  recordCanonicalPrivateReviewDecisionCoordinatorSchema,
  type CanonicalPrivateReviewDecisionCoordinatorReceipt,
  type RecordCanonicalPrivateReviewDecisionCoordinatorBody,
} from '../validation/canonical-private-review-browser-schemas'
import { createCanonicalPrivateReviewAssemblyService } from './canonical-private-review-assembly-service'
import { createCanonicalPrivateReviewDecisionService } from './canonical-private-review-decision-service'

export type RecordCanonicalPrivateReviewDecisionCoordinatorInput =
  RecordCanonicalPrivateReviewDecisionCoordinatorBody & {
    reviewAssemblyId: string
    idempotencyKey: string
  }

export function createCanonicalPrivateReviewDecisionCoordinatorService(
  context: ServiceContext,
) {
  return {
    async record(
      input: RecordCanonicalPrivateReviewDecisionCoordinatorInput,
    ): Promise<{
      receipt: CanonicalPrivateReviewDecisionCoordinatorReceipt
      warnings: string[]
    }> {
      assertPrivateReviewDecisionRuntime(context)
      const { reviewAssemblyId, idempotencyKey, ...requestBody } = input
      const parsed = recordCanonicalPrivateReviewDecisionCoordinatorSchema.safeParse(
        requestBody,
      )
      if (!parsed.success || !safeIdentity(reviewAssemblyId)) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical private-review decision identity is invalid.',
          400,
          parsed.success
            ? { reviewAssemblyId: ['Invalid private-review assembly identity.'] }
            : parsed.error.flatten(),
        )
      }

      const body = parsed.data
      const assembly = await createCanonicalPrivateReviewAssemblyService(
        context,
      ).getCompleted({
        workspaceId: body.workspaceId,
        packageRecordId: body.packageRecordId,
      })
      if (
        assembly.identity.workspaceId !== body.workspaceId ||
        assembly.identity.projectId !== body.expectedProjectId ||
        assembly.identity.editSessionId !== body.expectedEditSessionId ||
        assembly.identity.packageRecordId !== body.packageRecordId ||
        assembly.identity.reviewAssemblyId !== reviewAssemblyId ||
        assembly.manifest.manifestSha256 !== body.expectedManifestSha256 ||
        assembly.finalArtifact.sha256 !== body.expectedFinalArtifactSha256 ||
        assembly.readiness.privateReviewReady !== true
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Private-review decision expectation does not match the completed canonical assembly.',
          409,
          { requiredGate: 'exact_completed_private_review_assembly' },
        )
      }

      const decisionService = createCanonicalPrivateReviewDecisionService(context)
      const decision = body.decision === 'request_revision'
        ? await decisionService.record({
            workspaceId: body.workspaceId,
            packageRecordId: body.packageRecordId,
            reviewAssemblyId,
            purpose: 'record_canonical_private_review_decision',
            expectedManifestSha256: body.expectedManifestSha256,
            expectedFinalArtifactSha256: body.expectedFinalArtifactSha256,
            decision: 'request_revision',
            revisionIntent: body.revisionIntent,
            idempotencyKey,
          })
        : await decisionService.record({
            workspaceId: body.workspaceId,
            packageRecordId: body.packageRecordId,
            reviewAssemblyId,
            purpose: 'record_canonical_private_review_decision',
            expectedManifestSha256: body.expectedManifestSha256,
            expectedFinalArtifactSha256: body.expectedFinalArtifactSha256,
            decision: 'accept_private_internal_review',
            idempotencyKey,
          })

      const revisionRequested = decision.decision === 'request_revision'
      if (
        decision.identity.workspaceId !== body.workspaceId ||
        decision.identity.projectId !== body.expectedProjectId ||
        decision.identity.editSessionId !== body.expectedEditSessionId ||
        decision.identity.packageRecordId !== body.packageRecordId ||
        decision.identity.reviewAssemblyId !== reviewAssemblyId ||
        decision.authority.reviewManifestSha256 !== body.expectedManifestSha256 ||
        decision.authority.finalArtifactSha256 !== body.expectedFinalArtifactSha256 ||
        decision.decision !== body.decision ||
        decision.readiness.revisionRequested !== revisionRequested ||
        revisionRequested !== Boolean(decision.revisionHandoff)
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Private-review decision result does not match the exact requested review authority.',
          409,
          { requiredGate: 'exact_canonical_private_review_decision' },
        )
      }

      const receipt = canonicalPrivateReviewDecisionCoordinatorReceiptSchema.parse({
        schemaVersion: 'canonical-private-review-decision-coordinator-receipt-v1',
        source: 'canonical_private_review_decision_coordinator_service',
        purpose: 'record_canonical_private_review_decision',
        disposition: 'decision_recorded',
        identity: {
          workspaceId: decision.identity.workspaceId,
          projectId: decision.identity.projectId,
          editSessionId: decision.identity.editSessionId,
          packageRecordId: decision.identity.packageRecordId,
          reviewAssemblyId: decision.identity.reviewAssemblyId,
        },
        authority: {
          reviewManifestSha256: decision.authority.reviewManifestSha256,
          finalArtifactSha256: decision.authority.finalArtifactSha256,
          exactReviewAuthorityRevalidated: true,
          immutableApprovedSnapshotPreserved:
            decision.authority.immutableApprovedSnapshotPreserved,
          immutableReviewManifestPreserved:
            decision.authority.immutableReviewManifestPreserved,
        },
        decision: {
          value: decision.decision,
          status: decision.status,
          revisionRequested,
          requiresReplanning: decision.revisionHandoff?.requiresReplanning ?? false,
          requiresFreshEstimateAndApproval:
            decision.revisionHandoff?.requiresFreshEstimateAndApproval ?? false,
        },
        readiness: {
          privateReviewDecisionRecorded:
            decision.readiness.privateReviewDecisionRecorded,
          publicExportReady: false,
          productReady: false,
          externalBetaReady: false,
          productionReady: false,
          nextRequiredGate: decision.readiness.nextRequiredGate,
        },
        boundaries: {
          rawDecisionAuthorityReturned: false,
          artifactIdentityReturned: false,
          jobOrToolDetailsReturned: false,
          filesystemPathReturned: false,
          credentialReturned: false,
          providerCallStarted: decision.permissions.providerCall,
          publicArtifactCreated: decision.permissions.publicArtifact,
          publicDeliveryStarted: decision.permissions.publicDelivery,
          productionRenderStarted: decision.permissions.productionRender,
          revisionExecutionStarted: decision.permissions.revisionExecution,
          replacementPlanPublished: decision.permissions.replacementPlanPublication,
          customerPriceMutation: decision.permissions.customerPriceMutation,
          customerCreditMutation: decision.permissions.customerCreditMutation,
          walletMutation: decision.permissions.walletMutation,
          reservationMutation: decision.permissions.reservationMutation,
          settlementStarted: decision.permissions.settlement,
          billingStarted: decision.permissions.billing,
          deploymentStarted: decision.permissions.deployment,
        },
        persistence: {
          privateLocal: true,
          tenantScoped: true,
          distributed: false,
          productionAuthority: false,
        },
        decidedAt: decision.decidedAt,
        testOnly: true,
      })

      return {
        receipt,
        warnings: [
          revisionRequested
            ? 'The exact revision request is recorded. A fresh plan, estimate, approval, and private review are still required.'
            : 'The exact private review is accepted for this internal workspace. Public delivery remains blocked.',
          'No provider, further render, customer credit, wallet, billing, settlement, deployment, or public-delivery action started.',
        ],
      }
    },
  }
}

function assertPrivateReviewDecisionRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv === 'production' ||
    (context.env.mode !== 'local' && context.env.mode !== 'mock') ||
    (!context.env.mockOnly && !context.env.allowInternalTestExecutionWithSupabase)
  ) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Canonical private-review decisions are private-internal testing only.',
      503,
    )
  }
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}
