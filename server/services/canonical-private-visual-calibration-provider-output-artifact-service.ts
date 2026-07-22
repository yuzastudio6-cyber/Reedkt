import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import type { CanonicalPrivatePackageWorkQueueDefinition } from
  '../edit-architecture/canonical-private-package-work-queue-authority'
import type { CanonicalProviderWorkAuthorizationV4 } from
  '../edit-architecture/canonical-provider-work-authority'
import {
  assertCanonicalVisualCalibrationProviderQaPair,
  type CanonicalVisualCalibrationObjectiveQaWorkItem,
  type CanonicalVisualCalibrationProviderPlanningWorkItem,
} from '../edit-architecture/canonical-visual-calibration-objective-qa-authority'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  canonicalVisualCalibrationProviderAttemptSourceDigest,
  projectCanonicalVisualCalibrationConsumerReceipt,
} from './canonical-private-visual-calibration-consumer-receipt-service'
import {
  persistCanonicalPrivateVisualCalibrationProviderOutputBridge,
} from './canonical-private-visual-calibration-provider-output-artifact-store'
import {
  readVerifiedPrivateCanonicalProviderCandidateForProcessingV4,
} from './private-canonical-provider-candidate-store'
import {
  readPrivateCanonicalProviderDispatchAggregate,
} from './private-canonical-provider-dispatch-store'
import type {
  CanonicalPrivatePackageWorkQueueStoreScope,
} from './private-canonical-package-work-queue-store'
import {
  createPrivateArtifactQaAuthorityService,
  type PrivateArtifactQaAuthorityAdapters,
} from './private-artifact-qa-authority-service'
import { sha256ArtifactQaValue } from './private-artifact-qa-authority-store'
import { readPrivateAuthorityJsonBlob } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'

export interface AdmitCanonicalPrivateVisualCalibrationProviderOutputInput {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  executionPackage: CanonicalApprovedEditExecutionPackage
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  authorization: CanonicalProviderWorkAuthorizationV4
  qaApprovedWorkItemId: string
  projectedAt: string
}

export interface CanonicalPrivateVisualCalibrationProviderOutputAdmission {
  schemaVersion:
    'canonical-private-visual-calibration-provider-output-admission-v1'
  providerReceiptHash: string
  providerAttemptSourceDigest: string
  providerOutputSetDigest: string
  visualCalibrationContextDigest: string
  qaApprovedWorkItemId: string
  providerJobId: string
  output: {
    outputId: string
    role: 'provider_visual_calibration_video_mp4'
    artifactId: string
    qaEvaluationId: string
    reconciliationId: string
    bridgeRecordHash: string
    contentSha256: string
    byteLength: number
    contentType: 'video/mp4'
    privateObjectIdentityHash: string
    storageEvidenceHash: string
    readbackEvidenceHash: string
  }
  admissionHash: string
  evidenceClass: 'private_injected_nonprovider_test'
  productionReady: false
  providerCallMade: false
  customerPriceIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
}

export function createCanonicalPrivateVisualCalibrationProviderOutputArtifactService(
  context: ServiceContext,
) {
  return {
    async admit(
      input: AdmitCanonicalPrivateVisualCalibrationProviderOutputInput,
    ): Promise<CanonicalPrivateVisualCalibrationProviderOutputAdmission> {
      const actorUserId = getRequiredAuthUserId(context)
      if (
        context.env.nodeEnv === 'production' ||
        !context.env.allowInternalTestExecutionWithSupabase ||
        actorUserId !== input.scope.ownerUserId ||
        actorUserId !== input.authorization.ownerUserId ||
        input.scope.localStorageRoot !== context.env.localStorageRoot
      ) throw unavailable('Visual provider-output admission scope is invalid.')
      const providerJob = input.executionPackage.jobs.find((candidate) =>
        candidate.id === input.authorization.queueJobId)
      const providerWorkItem = input.executionPackage.approvedWorkItems.find(
        (candidate) => candidate.id === input.authorization.approvedWorkItemId,
      )
      const qaWorkItem = input.executionPackage.approvedWorkItems.find(
        (candidate) => candidate.id === input.qaApprovedWorkItemId,
      )
      const qaJob = input.executionPackage.jobs.find((candidate) =>
        candidate.approvedWorkItemId === input.qaApprovedWorkItemId)
      if (!providerJob || !providerWorkItem || !qaWorkItem || !qaJob) {
        throw invalid('Visual provider or dependent QA work item disappeared.')
      }
      const [providerExecutionInput, qaExecutionInput] = await Promise.all([
        readPrivateAuthorityJsonBlob({
          localStorageRoot: context.env.localStorageRoot,
          ref: providerWorkItem.executionInputRef,
        }),
        readPrivateAuthorityJsonBlob({
          localStorageRoot: context.env.localStorageRoot,
          ref: qaWorkItem.executionInputRef,
        }),
      ])
      if (Array.isArray(providerExecutionInput) || Array.isArray(qaExecutionInput)) {
        throw invalid(
          'Visual provider or objective-QA execution input is not an authority object.',
        )
      }
      const { provider: providerPlanningAuthority, qa: qaAuthority } =
        assertCanonicalVisualCalibrationProviderQaPair({
          providerWorkItem: {
            ...providerWorkItem,
            executionInput: providerExecutionInput,
          } as CanonicalVisualCalibrationProviderPlanningWorkItem,
          qaWorkItem: {
          ...qaWorkItem,
          executionInput: qaExecutionInput,
          } as CanonicalVisualCalibrationObjectiveQaWorkItem,
        })
      if (
        providerPlanningAuthority.operationId !== input.authorization.operationId ||
        providerPlanningAuthority.providerRouteId !==
          input.authorization.providerRouteId ||
        providerPlanningAuthority.visualCalibrationContextDigest !==
          input.authorization.visualCalibrationContextDigest ||
        providerPlanningAuthority.maximumAuthorizedProviderCostMicros !==
          input.authorization.maximumAuthorizedProviderCostMicros ||
        providerPlanningAuthority.maximumAuthorizedInfrastructureCostMicros !==
          input.authorization.maximumAuthorizedInfrastructureCostMicros ||
        qaJob.dependencyJobIds.length !== 1 ||
        qaJob.dependencyJobIds[0] !== providerJob.id ||
        qaJob.expectedAssetIds.length !== 1 ||
        qaWorkItem.dependencyKeys.length !== 1 ||
        qaWorkItem.dependencyKeys[0] !==
          input.authorization.workItemKey ||
        qaAuthority.sourceProviderExpectedOutputId !==
          input.authorization.expectedOutputKey ||
        qaAuthority.visualCalibrationContextDigest !==
          input.authorization.visualCalibrationContextDigest
      ) throw invalid('Visual objective-QA dependency changed after approval.')
      const receipt = await projectCanonicalVisualCalibrationConsumerReceipt({
        scope: input.scope,
        executionPackage: input.executionPackage,
        queueDefinition: input.queueDefinition,
        authorization: input.authorization,
        projectedAt: input.projectedAt,
      })
      const providerAttemptSourceDigest =
        canonicalVisualCalibrationProviderAttemptSourceDigest(receipt)
      const aggregate = await readPrivateCanonicalProviderDispatchAggregate({
        scope: input.scope,
      })
      const entry = aggregate?.entries.find((candidate) =>
        candidate.grant.grantId === receipt.dispatch.grantId)
      const terminal = entry?.terminalHistory.find((candidate) =>
        candidate.terminalHash === receipt.dispatch.terminalHash)
      const attempt = entry?.attempt
      const terminalV4 = terminal?.schemaVersion ===
        'canonical-private-provider-dispatch-terminal-v4'
        ? terminal
        : undefined
      const output = terminalV4?.privateOutput
      if (
        !attempt || !terminalV4 || !output ||
        (receipt.dispatch.terminalState !== 'succeeded' &&
          receipt.dispatch.terminalState !== 'unknown_reconciled_succeeded') ||
        receipt.privateOutputs.length !== 1 ||
        receipt.privateOutput?.outputId !== output.outputId ||
        receipt.internalCost.providerCostMicros === null
      ) throw invalid('Visual provider attempt is not a completed exact MP4 source.')
      const candidate =
        await readVerifiedPrivateCanonicalProviderCandidateForProcessingV4({
          localStorageRoot: input.scope.localStorageRoot,
          authorization: input.authorization,
          dispatchAttempt: attempt,
          output,
          outputSetDigest: terminalV4.outputSetDigest,
        })
      const expectedAssetId = providerJob.expectedAssetIds[0]
      const qaExpectedAssetId = qaJob.expectedAssetIds[0]
      if (!expectedAssetId || !qaExpectedAssetId) {
        throw invalid('Visual provider or QA asset identity is missing.')
      }
      const bridge =
        await persistCanonicalPrivateVisualCalibrationProviderOutputBridge({
          localStorageRoot: input.scope.localStorageRoot,
          ownerUserId: input.scope.ownerUserId,
          workspaceId: input.scope.workspaceId,
          executionPackage: input.executionPackage,
          queueDefinition: input.queueDefinition,
          authorization: input.authorization,
          receipt,
          providerAttemptSourceDigest,
          qaPlanningAuthority: qaAuthority,
          qaApprovedWorkItemId: qaWorkItem.id,
          qaExpectedAssetId,
          outputId: output.outputId,
          outputRole: output.role,
          outputContentSha256: output.contentSha256,
          outputByteLength: output.byteLength,
          outputPrivateObjectIdentityHash: output.privateObjectIdentityHash,
          outputStorageEvidenceHash: candidate.readback.storageEvidenceHash,
          outputReadbackEvidenceHash:
            candidate.readback.sourceReadbackEvidenceHash,
          createdAt: receipt.projectedAt,
        })
      const identity = {
        workspaceId: input.scope.workspaceId,
        projectId: input.scope.projectId,
        editSessionId: input.scope.editSessionId,
        snapshotId: input.scope.approvedPlanSnapshotId,
        jobId: providerJob.id,
        expectedAssetId,
      }
      const artifactAuthority = createPrivateArtifactQaAuthorityService(
        context,
        providerOutputAdapters({
          identity,
          bridgeRecordHash: bridge.recordHash,
          receipt,
          authorization: input.authorization,
          output,
          outputStorageEvidenceHash: candidate.readback.storageEvidenceHash,
          outputReadbackEvidenceHash:
            candidate.readback.sourceReadbackEvidenceHash,
        }),
      )
      const keyHash = sha256ArtifactQaValue({
        domain: 'canonical_visual_provider_output_artifact_admission_v1',
        identity,
        providerReceiptHash: receipt.receiptHash,
        providerAttemptSourceDigest,
        outputId: output.outputId,
        bridgeRecordHash: bridge.recordHash,
      })
      const artifactResult = await artifactAuthority.recordArtifactResult({
        ...identity,
        idempotencyKey: bounded('visual-provider-output-artifact', keyHash),
        purpose: 'record_server_verified_internal_artifact_result',
      })
      const qaResult = await artifactAuthority.recordArtifactQa({
        ...identity,
        artifactId: artifactResult.artifact.artifactId,
        idempotencyKey: bounded('visual-provider-output-qa', keyHash),
        purpose: 'record_server_verified_internal_artifact_qa',
      })
      const reconciliation = await artifactAuthority.reconcileArtifact({
        ...identity,
        artifactId: artifactResult.artifact.artifactId,
        idempotencyKey: bounded('visual-provider-output-reconcile', keyHash),
        purpose: 'reconcile_server_verified_internal_artifact',
      })
      if (
        qaResult.qaEvaluation.outcome !== 'passed' ||
        reconciliation.reconciliation.decision !==
          'test_merged_not_live_authorized' ||
        !reconciliation.reconciliation.privateTestDependencySatisfied
      ) throw invalid('Visual provider output failed integrity admission.')
      const withoutHash = {
        schemaVersion:
          'canonical-private-visual-calibration-provider-output-admission-v1' as const,
        providerReceiptHash: receipt.receiptHash,
        providerAttemptSourceDigest,
        providerOutputSetDigest: receipt.outputSet.outputSetDigest,
        visualCalibrationContextDigest:
          input.authorization.visualCalibrationContextDigest,
        qaApprovedWorkItemId: qaWorkItem.id,
        providerJobId: providerJob.id,
        output: {
          outputId: output.outputId,
          role: output.role,
          artifactId: artifactResult.artifact.artifactId,
          qaEvaluationId: qaResult.qaEvaluation.qaEvaluationId,
          reconciliationId: reconciliation.reconciliation.reconciliationId,
          bridgeRecordHash: bridge.recordHash,
          contentSha256: output.contentSha256,
          byteLength: output.byteLength,
          contentType: output.mimeType,
          privateObjectIdentityHash: output.privateObjectIdentityHash,
          storageEvidenceHash: candidate.readback.storageEvidenceHash,
          readbackEvidenceHash:
            candidate.readback.sourceReadbackEvidenceHash,
        },
        evidenceClass: 'private_injected_nonprovider_test' as const,
        productionReady: false as const,
        providerCallMade: false as const,
        customerPriceIncluded: false as const,
        customerCreditsIncluded: false as const,
        serviceFeeIncluded: false as const,
      }
      return {
        ...withoutHash,
        admissionHash: sha256ArtifactQaValue(withoutHash),
      }
    },
  }
}

function providerOutputAdapters(input: {
  identity: {
    workspaceId: string
    projectId: string
    editSessionId: string
    snapshotId: string
    jobId: string
    expectedAssetId: string
  }
  bridgeRecordHash: string
  receipt: Awaited<ReturnType<
    typeof projectCanonicalVisualCalibrationConsumerReceipt
  >>
  authorization: CanonicalProviderWorkAuthorizationV4
  output: NonNullable<Awaited<ReturnType<
    typeof readVerifiedPrivateCanonicalProviderCandidateForProcessingV4
  >>['readback']['output']>
  outputStorageEvidenceHash: string
  outputReadbackEvidenceHash: string
}): PrivateArtifactQaAuthorityAdapters {
  return {
    producedArtifact: {
      adapterKind: 'server_injected_internal_artifact_adapter',
      async collectProducedArtifact(adapterInput) {
        if (
          JSON.stringify(adapterInput.identity) !== JSON.stringify(input.identity) ||
          adapterInput.lineage.outputKey !== input.authorization.expectedOutputKey ||
          adapterInput.lineage.artifactType !== input.output.role
        ) throw invalid('Visual provider-output adapter lineage changed.')
        return {
          schemaVersion: 'server-internal-produced-artifact-evidence-v1' as const,
          evidenceOrigin: 'server_injected_internal_artifact_adapter' as const,
          evidenceClass: 'private_internal_test_attested' as const,
          artifactVersion: 1,
          attemptKind: 'initial' as const,
          content: {
            sha256: input.output.contentSha256,
            byteLength: input.output.byteLength,
            contentType: input.output.mimeType,
          },
          storageIdentity: {
            storageKind: 'private_local_test' as const,
            opaqueObjectIdentityHash: input.bridgeRecordHash,
            providerGeneration: 'private_injected_nonprovider_test',
          },
          placeholder: { isPlaceholder: false, scope: 'none' as const },
          actualRunEvidence: {
            state: 'actual_provider_attempt_receipt_verified_v1' as const,
            executionAttemptId: input.receipt.dispatch.dispatchAttemptId,
            runnerClass: 'canonical_private_provider_attempt_receipt_v2' as const,
            runnerEvidenceHash: input.receipt.receiptHash,
            startedAt: input.receipt.timing.startedAt,
            finishedAt: input.receipt.timing.completedAt,
            exitCode: 0 as const,
            toolIds: [],
            providerOperationId: input.receipt.provider.operationId,
            providerRoute: input.receipt.provider.providerRouteId,
            providerOutputRole: input.output.role,
            providerWorkAuthorityDigest:
              input.receipt.identity.authorizationHash,
            providerTerminalHash: input.receipt.dispatch.terminalHash,
            providerOutputSetDigest: input.receipt.outputSet.outputSetDigest,
            providerReceiptHash: input.receipt.receiptHash,
            providerQueueClaimId: input.receipt.queue.claimId,
            providerQueueClaimHash: input.receipt.queue.claimHash,
            providerCandidateReadbackEvidenceHash:
              input.outputReadbackEvidenceHash,
            providerCandidatePrivateObjectIdentityHash:
              input.output.privateObjectIdentityHash,
            productionAuthorityHash:
              input.authorization.visualCalibrationContext
                .storytellingProductionAuthorityRefDigest,
            sourceAuthorityDigest:
              input.authorization.visualCalibrationContextDigest,
            dispatchGrantId: input.receipt.dispatch.grantId,
            actualRunVerified: true as const,
          },
          completedAt: input.receipt.timing.completedAt,
        }
      },
    },
    artifactQa: {
      adapterKind: 'server_injected_internal_qa_adapter',
      async evaluateArtifact(adapterInput) {
        if (
          adapterInput.artifact.content.sha256 !== input.output.contentSha256 ||
          adapterInput.artifact.storageIdentity.opaqueObjectIdentityHash !==
            input.bridgeRecordHash
        ) throw invalid('Visual provider-output QA received a changed artifact.')
        const evidenceBase = {
          providerReceiptHash: input.receipt.receiptHash,
          outputContentSha256: input.output.contentSha256,
          outputStorageEvidenceHash: input.outputStorageEvidenceHash,
          outputReadbackEvidenceHash: input.outputReadbackEvidenceHash,
        }
        return {
          schemaVersion: 'server-internal-artifact-qa-evidence-v1' as const,
          evidenceOrigin: 'server_injected_internal_qa_adapter' as const,
          evidenceClass: 'private_internal_test_attested' as const,
          gateResults: [
            {
              gateId: 'asset_received_gate' as const,
              category: 'asset_integrity' as const,
              status: 'passed' as const,
              failureScope: 'none' as const,
              evidenceHash: sha256ArtifactQaValue({ ...evidenceBase, gate: 'received' }),
              notesCode: 'visual_provider_output_checksum_readback_passed',
            },
            {
              gateId: 'asset_quality_gate' as const,
              category: 'asset_integrity' as const,
              status: 'passed' as const,
              failureScope: 'none' as const,
              evidenceHash: sha256ArtifactQaValue({ ...evidenceBase, gate: 'structure' }),
              notesCode: 'visual_provider_output_bounded_mp4_passed',
            },
          ],
          recovery: {
            state: 'none' as const,
            action: 'none' as const,
            approvedWithinSnapshot: true,
            reasonCode: 'visual_provider_output_integrity_verified',
          },
          evaluatedAt: input.receipt.projectedAt,
          actualQaEvidenceState:
            'actual_provider_output_integrity_qa_verified_v1' as const,
          actualQaVerified: true,
        }
      },
    },
  }
}

function bounded(prefix: string, hash: string): string {
  return `${prefix}-${hash.slice(0, 56)}`
}

function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate:
      'canonical_private_visual_calibration_provider_output_admission',
  })
}

function unavailable(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate:
      'canonical_private_visual_calibration_provider_output_admission',
  })
}
