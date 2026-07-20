import {
  PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DISCOVERY_VERSION,
  professionalLongFormCustomerDeliveryDiscoverySchema,
  type ProfessionalLongFormCustomerDeliveryDiscovery,
} from '../../src/backend/api/professional-long-form-customer-delivery-browser-contracts'
import { ApiError } from '../errors/api-error'
import { isExplicitLocalInternalTestRuntime } from
  '../middleware/canonical-worker-runtime'
import type { ServiceContext } from '../types'
import { createCanonicalProfessionalLongFormCustomerDeliveryBrowserService } from
  './canonical-professional-long-form-customer-delivery-browser-service'
import {
  readPrivateProfessionalLongFormCustomerDeliveryDiscovery,
} from './private-professional-long-form-customer-delivery-discovery-store'
import { createProjectService } from './project-service'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export function createCanonicalProfessionalLongFormCustomerDeliveryDiscoveryService(
  context: ServiceContext,
) {
  return {
    async discover(input: {
      workspaceId: string
      projectId: string
      editSessionId: string
      approvedPlanSnapshotId: string
    }): Promise<{
      receipt: ProfessionalLongFormCustomerDeliveryDiscovery
      warnings: string[]
    }> {
      if (!isExplicitLocalInternalTestRuntime(context.env)) {
        throw new ApiError(
          'TOOL_NOT_READY',
          'Professional long-form customer-delivery discovery is private/local testing only.',
          503,
        )
      }
      if (Object.values(input).some((value) => !safeIdentity(value))) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Professional long-form customer-delivery discovery identity is invalid.',
          400,
        )
      }
      const ownerUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(
        context,
        input.workspaceId,
        'read',
      )
      if (access.userId !== ownerUserId) {
        throw new ApiError(
          'WORKSPACE_ACCESS_DENIED',
          'Professional long-form customer delivery is outside this workspace.',
          403,
        )
      }
      await createProjectService(context).getProject(
        input.projectId,
        access.workspaceId,
      )
      const current =
        await readPrivateProfessionalLongFormCustomerDeliveryDiscovery({
          localStorageRoot: context.env.localStorageRoot,
          ownerUserId,
          workspaceId: access.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          approvedPlanSnapshotId: input.approvedPlanSnapshotId,
        })
      if (!current) {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'The exact named edit does not yet have a prepared professional long-form customer delivery.',
          409,
          {
            requiredGate:
              'professional_long_form_customer_delivery_package_preparation',
          },
        )
      }

      const summary = current.queueAggregate.summary
      const attentionRequired = current.queueAggregate.entries.some((entry) => {
        const failure = entry.lastRelease?.dispatchFailure?.queueDisposition
        const timeout = entry.lastRelease?.dispatchTimeout?.queueDisposition
        return failure === 'attempts_exhausted' ||
          failure === 'user_review_required' ||
          timeout === 'attempts_exhausted'
      })
      const canInspectReview = !attentionRequired &&
        summary.leasedJobCount === 0 &&
        summary.completedJobCount >= summary.totalJobCount - 1
      const review = canInspectReview
        ? (await
            createCanonicalProfessionalLongFormCustomerDeliveryBrowserService(
              context,
            ).inspect({
              workspaceId: access.workspaceId,
              approvedPlanSnapshotId: input.approvedPlanSnapshotId,
              packageRecordId: current.record.identity.packageRecordId,
            })).receipt
        : null
      const revision = review?.decision?.value ===
        'request_customer_delivery_revision'
      const accepted = review?.decision?.value ===
        'accept_exact_private_customer_delivery' &&
        review.privateDownload !== null
      const stage = attentionRequired
        ? 'customer_delivery_attention_required' as const
        : !review
          ? 'customer_delivery_processing' as const
          : revision
            ? 'customer_delivery_revision_requested' as const
            : accepted
              ? 'customer_delivery_accepted' as const
              : 'customer_delivery_quality_review_ready' as const
      const pendingJobCount = summary.totalJobCount -
        summary.completedJobCount
      const receipt =
        professionalLongFormCustomerDeliveryDiscoverySchema.parse({
          schemaVersion:
            PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DISCOVERY_VERSION,
          source:
            'canonical_professional_long_form_customer_delivery_discovery_service',
          purpose:
            'discover_exact_private_customer_delivery_for_named_edit',
          stage,
          identity: {
            workspaceId: access.workspaceId,
            projectId: current.package.identity.projectId,
            editSessionId: current.package.identity.editSessionId,
            approvedPlanSnapshotId:
              current.package.identity.approvedPlanSnapshotId,
            packageRecordId: current.package.identity.packageRecordId,
          },
          progress: {
            totalJobCount: summary.totalJobCount,
            completedJobCount: summary.completedJobCount,
            activeJobCount: summary.leasedJobCount,
            pendingJobCount,
            completionPercent: Math.floor(
              (summary.completedJobCount * 100) / summary.totalJobCount,
            ),
            attentionRequired,
          },
          review,
          readiness: {
            exactPackageDiscovered: true,
            exactSnapshotLineageVerified: true,
            qualityReviewReady: review !== null,
            authenticatedQualityDecisionRecorded:
              review?.decision !== null && review !== null,
            revisionRequiresFreshPlanEstimateAndApproval: revision,
            authenticatedPrivateDownloadReady: accepted,
            publicDeliveryAuthorized: false,
            productReady: false,
            productionReady: false,
          },
          commercialBoundary: {
            approvedFourKEstimateAndReservationReused: true,
            customerDeliveryCoveredByOriginalApprovedEstimate: true,
            secondExportEstimateCreated: false,
            secondExportChargeCreated: false,
            exportTimeEstimatePromptAllowed: false,
            exportTimeCreditPromptAllowed: false,
            customerPriceAuthorityIncluded: false,
            customerCreditAuthorityIncluded: false,
            serviceFeeAuthorityIncluded: false,
            customerCreditsMutated: false,
            walletMutationAuthorized: false,
            settlementAuthorized: false,
            billingAuthorized: false,
          },
          boundaries: {
            discoveryInspectionOnly: true,
            rawPackageReturned: false,
            rawQueueReturned: false,
            jobIdentityReturned: false,
            leaseOrAttemptReturned: false,
            internalCostEvidenceReturned: false,
            filesystemOrStoragePathReturned: false,
            credentialReturned: false,
            providerCallStarted: false,
            renderStarted: false,
            customerCreditsMutated: false,
            publicDeliveryStarted: false,
            billingStarted: false,
            deploymentStarted: false,
          },
          persistence: {
            privateLocal: true,
            tenantScoped: true,
            distributed: false,
            databaseBacked: false,
            productionAuthority: false,
          },
          testOnly: true,
        })
      return {
        receipt,
        warnings: [
          'This discovery read is private/local and inspection-only; it cannot start jobs, rendering, provider calls, billing, deployment, or public delivery.',
          'The original approved 4K estimate and reservation cover customer delivery. No second estimate, charge, credit prompt, or wallet mutation occurred.',
        ],
      }
    },
  }
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/u.test(value) &&
    !value.includes('..')
}
