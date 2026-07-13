import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateEditPreparationReceiptSchema,
  prepareCanonicalPrivateEditSchema,
  type CanonicalPrivateEditPreparationReceipt,
  type PrepareCanonicalPrivateEditBody,
} from '../validation/canonical-private-edit-preparation-schemas'
import { createCanonicalEditExecutionPackageService } from './canonical-edit-execution-package-service'
import { createCanonicalPrivateReviewAssemblyService } from './canonical-private-review-assembly-service'
import { createCanonicalPrivateWorkGraphOrchestratorService } from './canonical-private-work-graph-orchestrator-service'
import { sha256AuthorityValue } from './private-edit-authority-store'

export type CanonicalPrivateEditPreparationCoordinatorResult = {
  receipt: CanonicalPrivateEditPreparationReceipt
  warnings: string[]
}

export function createCanonicalPrivateEditPreparationCoordinatorService(
  context: ServiceContext,
) {
  return {
    async prepare(input: PrepareCanonicalPrivateEditBody & {
      packageRecordId: string
      idempotencyKey: string
    }): Promise<CanonicalPrivateEditPreparationCoordinatorResult> {
      const body = prepareCanonicalPrivateEditSchema.parse({
        workspaceId: input.workspaceId,
        expectedProjectId: input.expectedProjectId,
        expectedEditSessionId: input.expectedEditSessionId,
        expectedSnapshotId: input.expectedSnapshotId,
        expectedSnapshotHash: input.expectedSnapshotHash,
        expectedPackageHash: input.expectedPackageHash,
        purpose: input.purpose,
      })
      const packageService = createCanonicalEditExecutionPackageService(context)
      const packageResult = await packageService.getPackage(
        input.packageRecordId,
        body.workspaceId,
      )
      const executionPackage = packageResult.approvedEditExecutionPackage

      if (
        executionPackage.workspaceId !== body.workspaceId ||
        executionPackage.projectId !== body.expectedProjectId ||
        executionPackage.editSessionId !== body.expectedEditSessionId ||
        executionPackage.packageRecordId !== input.packageRecordId ||
        executionPackage.packageHash !== body.expectedPackageHash ||
        executionPackage.approvedPlanSnapshotId !== body.expectedSnapshotId ||
        executionPackage.snapshotHash !== body.expectedSnapshotHash ||
        executionPackage.purpose !== 'private_internal_execution_handoff' ||
        executionPackage.status !== 'canonical_authority_packaged_runtime_blocked'
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'The approved edit handoff changed before private preparation could start.',
          409,
          { requiredGate: 'exact_canonical_execution_package_identity' },
        )
      }

      const workGraphService = createCanonicalPrivateWorkGraphOrchestratorService(context)
      const reviewService = createCanonicalPrivateReviewAssemblyService(context)
      const existingReview = await optionalIncomplete(() => reviewService.getCompleted({
        workspaceId: body.workspaceId,
        packageRecordId: input.packageRecordId,
      }))
      const existingCompletion = await workGraphService.findRequiredCompletion({
        workspaceId: body.workspaceId,
        packageRecordId: input.packageRecordId,
      })

      if (existingReview) {
        if (!existingCompletion) {
          throw new ApiError(
            'JOB_DEPENDENCY_NOT_READY',
            'Private review exists without its required work-graph completion authority.',
            409,
          )
        }
        return readyResult({
          body,
          executionPackage,
          workGraph: existingCompletion,
          review: existingReview,
        })
      }

      const operationKey = sha256AuthorityValue({
        operation: 'prepare_canonical_private_edit_review',
        packageRecordId: input.packageRecordId,
        packageHash: body.expectedPackageHash,
        snapshotId: body.expectedSnapshotId,
        snapshotHash: body.expectedSnapshotHash,
        requestIdempotencyKey: input.idempotencyKey,
      })
      const workGraphRun = existingCompletion
        ? undefined
        : await workGraphService.run({
            workspaceId: body.workspaceId,
            packageRecordId: input.packageRecordId,
            purpose: 'run_canonical_private_work_graph',
            idempotencyKey: `canonical-private-edit:${operationKey}:graph`,
          })

      if (workGraphRun && !workGraphRun.summary.allRequiredJobsCompleted) {
        const blockedJobCount = workGraphRun.summary.capabilityBlockedJobCount +
          workGraphRun.summary.dependencyBlockedJobCount
        const retryAvailable = workGraphRun.jobs.some((job) =>
          job.status === 'failed_retry_available')
        const userReviewRequired = workGraphRun.jobs.some((job) =>
          job.status === 'failed_user_review_required')
        return blockedResult({
          body,
          executionPackage,
          totalJobCount: workGraphRun.summary.totalJobCount,
          completedJobCount: workGraphRun.summary.completedJobCount,
          blockedJobCount,
          retryAvailable,
          userReviewRequired,
          completedAt: workGraphRun.completedAt,
        })
      }

      const completedWorkGraph: CompletedWorkGraphSummary = existingCompletion ?? {
        totalJobCount: workGraphRun!.summary.totalJobCount,
        completedJobCount: workGraphRun!.summary.completedJobCount,
        allRequiredJobsCompleted: true,
        completedAt: workGraphRun!.completedAt,
      }

      const review = await reviewService.assemble({
        workspaceId: body.workspaceId,
        packageRecordId: input.packageRecordId,
        purpose: 'assemble_canonical_private_review',
        idempotencyKey: `canonical-private-edit:${operationKey}:review`,
      })
      return readyResult({
        body,
        executionPackage,
        workGraph: completedWorkGraph,
        review,
      })
    },
  }
}

type ExactExecutionPackage = {
  workspaceId: string
  projectId: string
  editSessionId: string
  packageRecordId: string
  packageHash: string
  approvedPlanSnapshotId: string
  snapshotHash: string
}

type CompletedWorkGraphSummary = {
  totalJobCount: number
  completedJobCount: number
  allRequiredJobsCompleted: true
  completedAt: string
}

type ReadyPrivateReview = {
  identity: { reviewAssemblyId: string }
  manifest: { manifestSha256: string }
  finalArtifact: { sha256: string; byteLength: number }
  assembledAt: string
}

function readyResult(input: {
  body: PrepareCanonicalPrivateEditBody
  executionPackage: ExactExecutionPackage
  workGraph: CompletedWorkGraphSummary
  review: ReadyPrivateReview
}): CanonicalPrivateEditPreparationCoordinatorResult {
  return {
    receipt: receipt({
      body: input.body,
      executionPackage: input.executionPackage,
      disposition: 'private_review_ready',
      progress: {
        totalJobCount: input.workGraph.totalJobCount,
        completedJobCount: input.workGraph.completedJobCount,
        blockedJobCount: Math.max(
          0,
          input.workGraph.totalJobCount - input.workGraph.completedJobCount,
        ),
        allRequiredJobsCompleted: true,
        retryAvailable: false,
        userReviewRequired: false,
      },
      review: {
        reviewAssemblyId: input.review.identity.reviewAssemblyId,
        manifestSha256: input.review.manifest.manifestSha256,
        finalArtifactSha256: input.review.finalArtifact.sha256,
        finalArtifactByteLength: input.review.finalArtifact.byteLength,
        readyForPrivateReview: true,
      },
      completedAt: input.review.assembledAt,
    }),
    warnings: [
      'The exact approved private edit reached credential-free review assembly.',
      'Only server-derived dependency-ready jobs were eligible to run.',
      'Providers, public delivery, production rendering, customer credits, wallet mutation, billing, settlement, and deployment remained disabled.',
    ],
  }
}

function blockedResult(input: {
  body: PrepareCanonicalPrivateEditBody
  executionPackage: ExactExecutionPackage
  totalJobCount: number
  completedJobCount: number
  blockedJobCount: number
  retryAvailable: boolean
  userReviewRequired: boolean
  completedAt: string
}): CanonicalPrivateEditPreparationCoordinatorResult {
  return {
    receipt: receipt({
      body: input.body,
      executionPackage: input.executionPackage,
      disposition: 'blocked',
      progress: {
        totalJobCount: input.totalJobCount,
        completedJobCount: input.completedJobCount,
        blockedJobCount: input.blockedJobCount,
        allRequiredJobsCompleted: false,
        retryAvailable: input.retryAvailable,
        userReviewRequired: input.userReviewRequired,
      },
      review: null,
      completedAt: input.completedAt,
    }),
    warnings: [
      'Independent approved work may have completed, but required blockers prevent private-review assembly.',
      'No caller-supplied job, tool, command, path, URL, provider, price, or credential was accepted.',
      'Public delivery, production rendering, customer credits, wallet mutation, billing, settlement, and deployment remained disabled.',
    ],
  }
}

function receipt(input: {
  body: PrepareCanonicalPrivateEditBody
  executionPackage: ExactExecutionPackage
  disposition: 'private_review_ready' | 'blocked'
  progress: CanonicalPrivateEditPreparationReceipt['progress']
  review: CanonicalPrivateEditPreparationReceipt['review']
  completedAt: string
}): CanonicalPrivateEditPreparationReceipt {
  const ready = input.disposition === 'private_review_ready'
  return canonicalPrivateEditPreparationReceiptSchema.parse({
    schemaVersion: 'canonical-private-edit-preparation-receipt-v1',
    source: 'canonical_private_edit_preparation_coordinator_service',
    purpose: input.body.purpose,
    disposition: input.disposition,
    identity: {
      workspaceId: input.executionPackage.workspaceId,
      projectId: input.executionPackage.projectId,
      editSessionId: input.executionPackage.editSessionId,
      packageRecordId: input.executionPackage.packageRecordId,
      approvedPlanSnapshotId: input.executionPackage.approvedPlanSnapshotId,
    },
    authority: {
      packageHash: input.executionPackage.packageHash,
      snapshotHash: input.executionPackage.snapshotHash,
      exactApprovedAuthorityRevalidated: true,
      serverDerivedWorkGraphOnly: true,
    },
    progress: input.progress,
    review: input.review,
    readiness: {
      privateReviewReady: ready,
      nextRequiredGate: ready
        ? 'canonical_private_review_user_decision_or_revision'
        : 'canonical_job_capability_blockers',
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
    },
    boundaries: {
      approvedPrivateExecutionRequested: true,
      browserSuppliedJobsAccepted: false,
      browserSuppliedToolsAccepted: false,
      rawExecutionAuthorityReturned: false,
      jobOrToolDetailsReturned: false,
      filesystemPathReturned: false,
      credentialReturned: false,
      providerCallStarted: false,
      publicArtifactCreated: false,
      publicDeliveryStarted: false,
      productionRenderStarted: false,
      customerPriceMutation: false,
      customerCreditMutation: false,
      walletMutation: false,
      settlementStarted: false,
      billingStarted: false,
      deploymentStarted: false,
    },
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      distributed: false,
      productionAuthority: false,
    },
    completedAt: input.completedAt,
    testOnly: true,
  })
}

async function optionalIncomplete<T>(operation: () => Promise<T>): Promise<T | undefined> {
  try {
    return await operation()
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.code === 'JOB_DEPENDENCY_NOT_READY' &&
      error.status === 409 &&
      error.message ===
        'Canonical private-review assembly has not completed for this execution package.'
    ) return undefined
    throw error
  }
}
