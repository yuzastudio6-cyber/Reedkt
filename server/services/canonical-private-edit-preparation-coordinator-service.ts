import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateEditPreparationReceiptSchema,
  prepareCanonicalPrivateEditSchema,
  type CanonicalPrivateEditPreparationReceipt,
  type PrepareCanonicalPrivateEditBody,
} from '../validation/canonical-private-edit-preparation-schemas'
import type {
  CanonicalPrivateWorkGraphRunResponse,
} from '../validation/canonical-private-work-graph-run-schemas'
import { createCanonicalEditExecutionPackageService } from './canonical-edit-execution-package-service'
import { createCanonicalPrivateReviewAssemblyService } from './canonical-private-review-assembly-service'
import { createCanonicalCaptionPrivateReviewEvidenceService } from
  './canonical-caption-private-review-evidence-service'
import { createCanonicalPrivateWorkGraphOrchestratorService } from './canonical-private-work-graph-orchestrator-service'
import { getRequiredAuthUserId } from './service-helpers'
import { sha256AuthorityValue } from './private-edit-authority-store'
import { createDetachedWorkspaceAccessContext } from './workspace-access-service'

const backgroundPreparations = new Map<string, Promise<void>>()

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
        const captionReview = await readCaptionPrivateReviewEvidence({
          context,
          workspaceId: body.workspaceId,
          packageRecordId: input.packageRecordId,
        })
        if (captionReview
          && (!captionReview.privateReviewAssemblyAllowed
            || captionReview.canonicalPrivateReview.assemblyRef?.id
              !== existingReview.identity.reviewAssemblyId)) {
          throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'Canonical private review was assembled without exact accepted Caption visual evidence.',
            409,
            { requiredGate: 'canonical_caption_private_review_evidence' },
          )
        }
        return readyResult({
          body,
          executionPackage,
          workGraph: existingCompletion,
          review: existingReview,
        })
      }

      if (existingCompletion) {
        const captionReview = await readCaptionPrivateReviewEvidence({
          context,
          workspaceId: body.workspaceId,
          packageRecordId: input.packageRecordId,
        })
        if (captionReview && !captionReview.privateReviewAssemblyAllowed) {
          return blockedCaptionVisualReviewResult({
            body,
            executionPackage,
            workGraph: existingCompletion,
          })
        }
        const review = await reviewService.assemble({
          workspaceId: body.workspaceId,
          packageRecordId: input.packageRecordId,
          purpose: 'assemble_canonical_private_review',
          idempotencyKey: stableReviewIdempotencyKey(body, input.packageRecordId),
        })
        await assertCaptionPrivateReviewAssemblyReconciled({
          context,
          workspaceId: body.workspaceId,
          packageRecordId: input.packageRecordId,
          reviewAssemblyId: review.identity.reviewAssemblyId,
        })
        return readyResult({
          body,
          executionPackage,
          workGraph: existingCompletion,
          review,
        })
      }

      const latestProgress = await workGraphService.findLatestProgress({
        workspaceId: body.workspaceId,
        packageRecordId: input.packageRecordId,
      })
      const retryAvailable = Boolean(
        latestProgress?.capabilityBlockedJobCount &&
        latestProgress.capabilityBlockedJobCount > 0,
      )
      if (
        latestProgress?.runFinished &&
        !latestProgress.allRequiredJobsCompleted &&
        !retryAvailable
      ) {
        return blockedResult({
          body,
          executionPackage,
          totalJobCount: latestProgress.totalJobCount,
          completedJobCount: latestProgress.completedJobCount,
          blockedJobCount:
            latestProgress.capabilityBlockedJobCount +
            latestProgress.dependencyBlockedJobCount,
          retryAvailable: false,
          userReviewRequired: true,
          completedAt: latestProgress.updatedAt,
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
      const detachedContext = await createDetachedWorkspaceAccessContext(
        context,
        body.workspaceId,
      )
      startBackgroundPreparation({
        body,
        context: detachedContext,
        operationKey,
        packageRecordId: input.packageRecordId,
      })
      return inProgressResult({
        body,
        executionPackage,
        progress: latestProgress,
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

function inProgressResult(input: {
  body: PrepareCanonicalPrivateEditBody
  executionPackage: ExactExecutionPackage & { jobs: unknown[] }
  progress?: {
    totalJobCount: number
    completedJobCount: number
    capabilityBlockedJobCount: number
    dependencyBlockedJobCount: number
    updatedAt: string
  }
}): CanonicalPrivateEditPreparationCoordinatorResult {
  return {
    receipt: receipt({
      body: input.body,
      executionPackage: input.executionPackage,
      disposition: 'in_progress',
      progress: {
        totalJobCount: input.progress?.totalJobCount ?? input.executionPackage.jobs.length,
        completedJobCount: input.progress?.completedJobCount ?? 0,
        blockedJobCount: input.progress
          ? input.progress.capabilityBlockedJobCount +
            input.progress.dependencyBlockedJobCount
          : 0,
        allRequiredJobsCompleted: false,
        retryAvailable: false,
        userReviewRequired: false,
      },
      review: null,
      completedAt: input.progress?.updatedAt ?? new Date().toISOString(),
    }),
    warnings: [
      'The exact approved private work graph is advancing asynchronously from durable server-owned package state.',
      'The browser may disconnect and recover progress without duplicating the canonical package or approved jobs.',
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
  disposition: 'private_review_ready' | 'in_progress' | 'blocked'
  progress: CanonicalPrivateEditPreparationReceipt['progress']
  review: CanonicalPrivateEditPreparationReceipt['review']
  completedAt: string
}): CanonicalPrivateEditPreparationReceipt {
  const ready = input.disposition === 'private_review_ready'
  const inProgress = input.disposition === 'in_progress'
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
        : inProgress
          ? 'canonical_private_work_graph_advancement'
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

function startBackgroundPreparation(input: {
  body: PrepareCanonicalPrivateEditBody
  context: ServiceContext
  operationKey: string
  packageRecordId: string
}): void {
  const actorUserId = getRequiredAuthUserId(input.context)
  const taskKey = sha256AuthorityValue({
    actorUserId,
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: input.body.workspaceId,
    packageRecordId: input.packageRecordId,
    packageHash: input.body.expectedPackageHash,
    snapshotHash: input.body.expectedSnapshotHash,
  })
  if (backgroundPreparations.has(taskKey)) return

  const task = advanceBackgroundPreparation(input)
  backgroundPreparations.set(taskKey, task)
  void task.then(
    () => clearBackgroundPreparation(taskKey, task),
    () => clearBackgroundPreparation(taskKey, task),
  )
}

async function advanceBackgroundPreparation(input: {
  body: PrepareCanonicalPrivateEditBody
  context: ServiceContext
  operationKey: string
  packageRecordId: string
}): Promise<void> {
  const workGraphService = createCanonicalPrivateWorkGraphOrchestratorService(input.context)
  const reviewService = createCanonicalPrivateReviewAssemblyService(input.context)
  const workGraphRun: CanonicalPrivateWorkGraphRunResponse =
    await workGraphService.run({
      workspaceId: input.body.workspaceId,
      packageRecordId: input.packageRecordId,
      purpose: 'run_canonical_private_work_graph',
      idempotencyKey: workGraphRunIdempotencyKey(input.operationKey, 1),
    })
  if (!workGraphRun.summary.allRequiredJobsCompleted) return

  const captionReview = await readCaptionPrivateReviewEvidence({
    context: input.context,
    workspaceId: input.body.workspaceId,
    packageRecordId: input.packageRecordId,
  })
  if (captionReview && !captionReview.privateReviewAssemblyAllowed) return

  const review = await reviewService.assemble({
    workspaceId: input.body.workspaceId,
    packageRecordId: input.packageRecordId,
    purpose: 'assemble_canonical_private_review',
    idempotencyKey: stableReviewIdempotencyKey(
      input.body,
      input.packageRecordId,
    ),
  })
  await assertCaptionPrivateReviewAssemblyReconciled({
    context: input.context,
    workspaceId: input.body.workspaceId,
    packageRecordId: input.packageRecordId,
    reviewAssemblyId: review.identity.reviewAssemblyId,
  })
}

async function readCaptionPrivateReviewEvidence(input: {
  context: ServiceContext
  workspaceId: string
  packageRecordId: string
}) {
  return createCanonicalCaptionPrivateReviewEvidenceService(input.context)
    .readForPackage({
      workspaceId: input.workspaceId,
      packageRecordId: input.packageRecordId,
    })
}

async function assertCaptionPrivateReviewAssemblyReconciled(input: {
  context: ServiceContext
  workspaceId: string
  packageRecordId: string
  reviewAssemblyId: string
}): Promise<void> {
  const projection = await readCaptionPrivateReviewEvidence(input)
  if (projection
    && projection.canonicalPrivateReview.assemblyRef?.id
      !== input.reviewAssemblyId) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Canonical Caption evidence did not reconcile with private-review assembly.',
      409,
      { requiredGate: 'canonical_caption_private_review_assembly_lineage' },
    )
  }
}

function blockedCaptionVisualReviewResult(input: {
  body: PrepareCanonicalPrivateEditBody
  executionPackage: ExactExecutionPackage
  workGraph: CompletedWorkGraphSummary
}): CanonicalPrivateEditPreparationCoordinatorResult {
  return blockedResult({
    body: input.body,
    executionPackage: input.executionPackage,
    totalJobCount: input.workGraph.totalJobCount,
    completedJobCount: Math.max(0, input.workGraph.completedJobCount - 1),
    blockedJobCount: 1,
    retryAvailable: false,
    userReviewRequired: true,
    completedAt: input.workGraph.completedAt,
  })
}

function stableReviewIdempotencyKey(
  body: PrepareCanonicalPrivateEditBody,
  packageRecordId: string,
): string {
  return `canonical-private-edit:${sha256AuthorityValue({
    operation: 'assemble_canonical_private_review',
    workspaceId: body.workspaceId,
    packageRecordId,
    packageHash: body.expectedPackageHash,
    snapshotId: body.expectedSnapshotId,
    snapshotHash: body.expectedSnapshotHash,
  })}:review`
}

function clearBackgroundPreparation(taskKey: string, task: Promise<void>): void {
  if (backgroundPreparations.get(taskKey) === task) {
    backgroundPreparations.delete(taskKey)
  }
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

function workGraphRunIdempotencyKey(operationKey: string, runNumber: number): string {
  return runNumber === 1
    ? `canonical-private-edit:${operationKey}:graph`
    : `canonical-private-edit:${operationKey}:graph:approved-retry-${runNumber - 1}`
}
