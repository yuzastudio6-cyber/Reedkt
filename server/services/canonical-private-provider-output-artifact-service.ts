import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import type { CanonicalPrivatePackageWorkQueueDefinition } from
  '../edit-architecture/canonical-private-package-work-queue-authority'
import type { CanonicalProviderWorkAuthorizationV2 } from
  '../edit-architecture/canonical-provider-work-authority'
import {
  assertCanonicalStorytellingSpeechNormalizationWorkItem,
  type CanonicalStorytellingSpeechNormalizationWorkItem,
} from '../edit-architecture/canonical-storytelling-speech-normalization-authority'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type {
  OfflineFfmpegStorytellingSpeechTakeNormalizationPlanningPayload,
} from '../tool-execution/media-binary-execution/offline-media-binary-protocol'
import {
  projectCanonicalPrivateProviderAttemptConsumerReceiptV2,
} from './canonical-private-provider-attempt-consumer-receipt-service'
import {
  persistCanonicalPrivateProviderOutputArtifactBridgeRecord,
} from './canonical-private-provider-output-artifact-store'
import {
  readVerifiedPrivateCanonicalProviderCandidateSetForProcessingV2,
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

export interface AdmitCanonicalPrivateStorytellingSpeechProviderOutputsInput {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  executionPackage: CanonicalApprovedEditExecutionPackage
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  authorization: CanonicalProviderWorkAuthorizationV2
  normalizationWorkItemId: string
  projectedAt: string
}

export interface CanonicalPrivateStorytellingSpeechProviderOutputAdmission {
  schemaVersion: 'canonical-private-storytelling-speech-provider-output-admission-v1'
  providerReceiptHash: string
  providerOutputSetDigest: string
  sourceAuthorityDigest: string
  normalizationWorkItemId: string
  providerJobId: string
  outputs: readonly [
    CanonicalPrivateStorytellingSpeechProviderOutputAdmissionItem,
    CanonicalPrivateStorytellingSpeechProviderOutputAdmissionItem,
  ]
  evidenceClass: 'private_injected_nonprovider_test'
  productionReady: false
  providerCallMade: false
  customerPriceIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
  admissionHash: string
}

export interface CanonicalPrivateStorytellingSpeechProviderOutputAdmissionItem {
  outputOrdinal: 0 | 1
  outputId: string
  role:
    | 'provider_storytelling_speech_audio_mp3'
    | 'provider_storytelling_speech_alignment_json'
  artifactId: string
  qaEvaluationId: string
  reconciliationId: string
  bridgeRecordHash: string
  contentSha256: string
  byteLength: number
  contentType: 'audio/mpeg' | 'application/json'
}

export function createCanonicalPrivateProviderOutputArtifactService(
  context: ServiceContext,
) {
  return {
    async admitStorytellingSpeechOutputs(
      input: AdmitCanonicalPrivateStorytellingSpeechProviderOutputsInput,
    ): Promise<CanonicalPrivateStorytellingSpeechProviderOutputAdmission> {
      const actorUserId = getRequiredAuthUserId(context)
      if (
        context.env.nodeEnv === 'production' ||
        !context.env.allowInternalTestExecutionWithSupabase ||
        input.scope.localStorageRoot !== context.env.localStorageRoot ||
        input.scope.ownerUserId !== actorUserId
      ) throw unavailable('Provider-output artifact admission is private internal-test only.')
      const normalizationWorkItem = input.executionPackage.approvedWorkItems.find(
        (candidate) => candidate.id === input.normalizationWorkItemId,
      )
      if (!normalizationWorkItem) {
        throw invalid('Normalization work item is missing from the exact package.')
      }
      const normalizationExecutionInput = await readPrivateAuthorityJsonBlob({
        localStorageRoot: context.env.localStorageRoot,
        ref: normalizationWorkItem.executionInputRef,
      })
      if (Array.isArray(normalizationExecutionInput)) {
        throw invalid('Normalization execution input is not an authority object.')
      }
      const normalizationAuthority =
        assertCanonicalStorytellingSpeechNormalizationWorkItem(
          {
            ...normalizationWorkItem,
            executionInput: normalizationExecutionInput,
          } as CanonicalStorytellingSpeechNormalizationWorkItem,
        )
      const providerWorkItem = input.executionPackage.approvedWorkItems.find(
        (candidate) => candidate.id === input.authorization.approvedWorkItemId,
      )
      const providerJob = input.executionPackage.jobs.find((candidate) =>
        candidate.id === input.authorization.queueJobId)
      if (
        !providerWorkItem || !providerJob ||
        providerJob.approvedWorkItemId !== providerWorkItem.id ||
        providerWorkItem.workItemType !== 'generate_storytelling_speech_candidate' ||
        providerWorkItem.workerClass !== 'provider_worker' ||
        normalizationWorkItem.dependencyKeys.length !== 1 ||
        normalizationWorkItem.dependencyKeys[0] !== providerWorkItem.workItemKey ||
        providerJob.expectedAssetIds.length !== 2 ||
        providerWorkItem.expectedOutputs.length !== 2 ||
        providerWorkItem.expectedOutputs.some((output) =>
          output.segmentIds.length !== 1 ||
          output.segmentIds[0] !== normalizationAuthority.preparedScriptSegmentId ||
          !output.timingIds.includes(normalizationAuthority.timingAuthorityDigest)
        ) ||
        input.authorization.sourceRequestDigest !==
          normalizationAuthority.sourceAuthorityDigest
      ) throw invalid('Provider and normalization jobs lost exact segment dependency authority.')
      const receipt = await projectCanonicalPrivateProviderAttemptConsumerReceiptV2({
        scope: input.scope,
        executionPackage: input.executionPackage,
        queueDefinition: input.queueDefinition,
        authorization: input.authorization,
        projectedAt: input.projectedAt,
      })
      if (
        receipt.provider.operationId !==
          normalizationAuthority.sourceProviderOperationId ||
        receipt.dispatch.terminalState !== 'succeeded' ||
        receipt.privateOutputs.length !== 2 ||
        receipt.evidenceClass !== 'private_injected_nonprovider_test' ||
        receipt.promotionClass !== 'non_promotable_private_injected' ||
        receipt.boundaries.canonicalBackendVerifiedRuntime ||
        receipt.boundaries.promotionAuthorized || receipt.boundaries.productionReady
      ) throw unavailable('Provider output receipt is not successful private injected evidence.')
      const aggregate = await readPrivateCanonicalProviderDispatchAggregate({
        scope: input.scope,
      })
      const entry = aggregate?.entries.find((candidate) =>
        candidate.grant.grantId === receipt.dispatch.grantId)
      const attempt = entry?.attempt
      const terminal = entry?.terminalHistory.find((candidate) =>
        candidate.terminalHash === receipt.dispatch.terminalHash)
      if (
        !attempt || !terminal ||
        terminal.schemaVersion !== 'canonical-private-provider-dispatch-terminal-v2' ||
        terminal.privateOutputs.length !== 2
      ) throw invalid('Exact provider attempt and terminal output set are missing.')
      const processing =
        await readVerifiedPrivateCanonicalProviderCandidateSetForProcessingV2({
          localStorageRoot: context.env.localStorageRoot,
          authorization: input.authorization,
          dispatchAttempt: attempt,
          outputs: [terminal.privateOutputs[0]!, terminal.privateOutputs[1]!],
          outputSetDigest: terminal.outputSetDigest,
        })
      const admissions: CanonicalPrivateStorytellingSpeechProviderOutputAdmissionItem[] = []
      for (const ordinal of [0, 1] as const) {
        const candidate = processing[ordinal]
        const expectedOutput = providerWorkItem.expectedOutputs[ordinal]!
        const expectedAssetId = providerJob.expectedAssetIds[ordinal]!
        const output = candidate.readback.output
        if (
          expectedOutput.outputKey !== output.outputId ||
          expectedOutput.artifactType !== output.role ||
          expectedOutput.contentType !== output.mimeType ||
          expectedOutput.assetRole !== 'generated' ||
          !expectedOutput.required || expectedOutput.previewPlaceholderAllowed
        ) throw invalid('Provider output no longer matches the approved package asset.')
        const bridge =
          await persistCanonicalPrivateProviderOutputArtifactBridgeRecord({
            localStorageRoot: context.env.localStorageRoot,
            ownerUserId: actorUserId,
            workspaceId: input.scope.workspaceId,
            executionPackage: input.executionPackage,
            queueDefinition: input.queueDefinition,
            authorization: input.authorization,
            receipt,
            normalizationAuthority,
            outputOrdinal: ordinal,
            outputId: output.outputId,
            outputRole: output.role,
            outputContentSha256: output.contentSha256,
            outputByteLength: output.byteLength,
            outputPrivateObjectIdentityHash: output.privateObjectIdentityHash,
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
            normalizationAuthority,
            output,
            outputReadbackEvidenceHash:
              candidate.readback.sourceReadbackEvidenceHash,
          }),
        )
        const keyHash = sha256ArtifactQaValue({
          domain: 'canonical_provider_output_artifact_admission_v1',
          identity,
          providerReceiptHash: receipt.receiptHash,
          outputId: output.outputId,
          bridgeRecordHash: bridge.recordHash,
        })
        const artifactResult = await artifactAuthority.recordArtifactResult({
          ...identity,
          idempotencyKey: bounded('provider-output-artifact', keyHash),
          purpose: 'record_server_verified_internal_artifact_result',
        })
        const qaResult = await artifactAuthority.recordArtifactQa({
          ...identity,
          artifactId: artifactResult.artifact.artifactId,
          idempotencyKey: bounded('provider-output-qa', keyHash),
          purpose: 'record_server_verified_internal_artifact_qa',
        })
        const reconciliation = await artifactAuthority.reconcileArtifact({
          ...identity,
          artifactId: artifactResult.artifact.artifactId,
          idempotencyKey: bounded('provider-output-reconcile', keyHash),
          purpose: 'reconcile_server_verified_internal_artifact',
        })
        if (
          qaResult.qaEvaluation.outcome !== 'passed' ||
          reconciliation.reconciliation.decision !==
            'test_merged_not_live_authorized' ||
          !reconciliation.reconciliation.privateTestDependencySatisfied
        ) throw invalid('Provider output failed private artifact QA/reconciliation.')
        admissions.push({
          outputOrdinal: ordinal,
          outputId: output.outputId,
          role: output.role,
          artifactId: artifactResult.artifact.artifactId,
          qaEvaluationId: qaResult.qaEvaluation.qaEvaluationId,
          reconciliationId: reconciliation.reconciliation.reconciliationId,
          bridgeRecordHash: bridge.recordHash,
          contentSha256: output.contentSha256,
          byteLength: output.byteLength,
          contentType: output.mimeType,
        })
      }
      const withoutHash = {
        schemaVersion:
          'canonical-private-storytelling-speech-provider-output-admission-v1' as const,
        providerReceiptHash: receipt.receiptHash,
        providerOutputSetDigest: receipt.outputSet.outputSetDigest,
        sourceAuthorityDigest: normalizationAuthority.sourceAuthorityDigest,
        normalizationWorkItemId: normalizationWorkItem.id,
        providerJobId: providerJob.id,
        outputs: [admissions[0]!, admissions[1]!] as const,
        evidenceClass: 'private_injected_nonprovider_test' as const,
        productionReady: false as const,
        providerCallMade: false as const,
        customerPriceIncluded: false as const,
        customerCreditsIncluded: false as const,
        serviceFeeIncluded: false as const,
      }
      return { ...withoutHash, admissionHash: sha256ArtifactQaValue(withoutHash) }
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
    typeof projectCanonicalPrivateProviderAttemptConsumerReceiptV2
  >>
  normalizationAuthority:
    OfflineFfmpegStorytellingSpeechTakeNormalizationPlanningPayload
  output: Awaited<ReturnType<
    typeof readVerifiedPrivateCanonicalProviderCandidateSetForProcessingV2
  >>[number]['readback']['output']
  outputReadbackEvidenceHash: string
}): PrivateArtifactQaAuthorityAdapters {
  return {
    producedArtifact: {
      adapterKind: 'server_injected_internal_artifact_adapter',
      async collectProducedArtifact(adapterInput) {
        if (
          JSON.stringify(adapterInput.identity) !== JSON.stringify(input.identity) ||
          adapterInput.lineage.outputKey !== input.output.outputId ||
          adapterInput.lineage.artifactType !== input.output.role
        ) throw invalid('Provider output adapter lineage changed.')
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
            providerAuthorizationHash: input.receipt.identity.authorizationHash,
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
              input.normalizationAuthority.productionAuthorityHash,
            sourceAuthorityDigest:
              input.normalizationAuthority.sourceAuthorityDigest,
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
        ) throw invalid('Provider output QA adapter received a changed artifact.')
        const evidenceBase = {
          providerReceiptHash: input.receipt.receiptHash,
          outputRole: input.output.role,
          outputContentSha256: input.output.contentSha256,
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
              notesCode: 'provider_output_checksum_readback_passed',
            },
            {
              gateId: 'asset_quality_gate' as const,
              category: 'asset_integrity' as const,
              status: 'passed' as const,
              failureScope: 'none' as const,
              evidenceHash: sha256ArtifactQaValue({ ...evidenceBase, gate: 'integrity' }),
              notesCode: 'provider_output_bounded_structure_passed',
            },
          ],
          recovery: {
            state: 'none' as const,
            action: 'none' as const,
            approvedWithinSnapshot: true,
            reasonCode: 'provider_output_integrity_verified',
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
    requiredGate: 'canonical_private_storytelling_speech_provider_output_admission',
  })
}

function unavailable(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate: 'canonical_private_storytelling_speech_provider_output_admission',
  })
}
