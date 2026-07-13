import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  canonicalExecutionPackageRequestReceiptSchema,
  requestCanonicalExecutionPackageSchema,
  type CanonicalExecutionPackageRequestReceipt,
  type RequestCanonicalExecutionPackageBody,
} from '../validation/canonical-execution-package-request-schemas'
import { createCanonicalEditExecutionPackageService } from './canonical-edit-execution-package-service'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'

export type CanonicalExecutionPackageRequestCoordinatorResult = {
  receipt: CanonicalExecutionPackageRequestReceipt
  warnings: string[]
}

export function createCanonicalExecutionPackageRequestCoordinatorService(
  context: ServiceContext,
) {
  return {
    async request(input: RequestCanonicalExecutionPackageBody & {
      approvedPlanSnapshotId: string
      idempotencyKey: string
      requestPath?: string
    }): Promise<CanonicalExecutionPackageRequestCoordinatorResult> {
      const body = requestCanonicalExecutionPackageSchema.parse({
        workspaceId: input.workspaceId,
        expectedProjectId: input.expectedProjectId,
        expectedEditSessionId: input.expectedEditSessionId,
        expectedSnapshotHash: input.expectedSnapshotHash,
        purpose: input.purpose,
      })
      const authority = await createEditPlanningAuthorityService(
        context,
      ).loadApprovedExecutionAuthority(
        input.approvedPlanSnapshotId,
        body.workspaceId,
      )

      if (
        authority.snapshot.snapshotId !== input.approvedPlanSnapshotId ||
        authority.snapshot.projectId !== body.expectedProjectId ||
        authority.snapshot.editSessionId !== body.expectedEditSessionId ||
        authority.snapshot.snapshotHash !== body.expectedSnapshotHash
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'The approved edit identity or snapshot changed before private handoff preparation.',
          409,
          { requiredGate: 'exact_approved_snapshot_identity' },
        )
      }

      const packageService = createCanonicalEditExecutionPackageService(context)
      const existing = await packageService.findPackageBySnapshot(
        authority.snapshot.snapshotId,
        body.workspaceId,
      )
      const result = await packageService.createPackage({
        workspaceId: body.workspaceId,
        approvedPlanSnapshotId: authority.snapshot.snapshotId,
        expectedSnapshotHash: body.expectedSnapshotHash,
        purpose: 'private_internal_execution_handoff',
        idempotencyKey: input.idempotencyKey,
        requestPath: input.requestPath,
      })
      const executionPackage = result.approvedEditExecutionPackage

      if (
        executionPackage.workspaceId !== body.workspaceId ||
        executionPackage.projectId !== body.expectedProjectId ||
        executionPackage.editSessionId !== body.expectedEditSessionId ||
        executionPackage.approvedPlanSnapshotId !== authority.snapshot.snapshotId ||
        executionPackage.snapshotHash !== body.expectedSnapshotHash ||
        executionPackage.purpose !== 'private_internal_execution_handoff' ||
        executionPackage.status !== 'canonical_authority_packaged_runtime_blocked' ||
        (
          existing &&
          (
            existing.packageRecordId !== executionPackage.packageRecordId ||
            existing.packageHash !== executionPackage.packageHash
          )
        )
      ) {
        throw new ApiError(
          'APPROVED_SNAPSHOT_REQUIRED',
          'The private execution handoff did not match the exact approved edit authority.',
          409,
        )
      }

      const receipt = canonicalExecutionPackageRequestReceiptSchema.parse({
        schemaVersion: 'canonical-execution-package-request-receipt-v1',
        source: 'canonical_execution_package_request_coordinator_service',
        purpose: body.purpose,
        disposition: 'package_available',
        identity: {
          workspaceId: executionPackage.workspaceId,
          projectId: executionPackage.projectId,
          editSessionId: executionPackage.editSessionId,
        },
        executionPackage: {
          packageRecordId: executionPackage.packageRecordId,
          packageHash: executionPackage.packageHash,
          approvedPlanSnapshotId: executionPackage.approvedPlanSnapshotId,
          snapshotHash: executionPackage.snapshotHash,
          status: executionPackage.status,
          createdAt: executionPackage.createdAt,
        },
        boundaries: {
          executionPackageAvailable: true,
          approvedSnapshotMutated: false,
          creditReservationMutated: false,
          workGraphStarted: false,
          workerDispatchStarted: false,
          jobExecutionStarted: false,
          toolExecutionStarted: false,
          providerCallStarted: false,
          renderStarted: false,
          paidBillingExecuted: false,
          customerWalletMutation: false,
          publicDeliveryStarted: false,
        },
        persistence: {
          privateLocal: true,
          tenantScoped: true,
          distributed: false,
          productionAuthority: false,
        },
        rawAuthorityReturned: false,
        jobOrToolDetailsReturned: false,
        pathOrCredentialReturned: false,
        testOnly: true,
      })

      return {
        receipt,
        warnings: [
          'The exact private execution handoff is available; creation or recovery history remains in backend audit authority.',
          'The browser receives no jobs, tool manifest, worker authority, artifact path, or credential.',
          'No work graph, worker, job, tool, provider, render, billing, wallet, or public delivery action started.',
        ],
      }
    },
  }
}
