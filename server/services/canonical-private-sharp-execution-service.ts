import type { ZodType } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  openPrivateOfflineSharpStructuredExecutionRuntime,
  readPersistedOfflineNodeStructuredRuntimeAuthority,
  validateOfflineNodeStructuredExecutionRequest,
  validateOfflineSharpPlanningPayload,
  type OfflineSharpStructuredExecutionResult,
} from '../tool-execution/node-runner-execution'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateSharpAuthoritySchema,
  canonicalPrivateSharpResponseSchema,
  runCanonicalPrivateSharpSchema,
  type CanonicalPrivateSharpAuthority,
  type CanonicalPrivateSharpResponse,
  type RunCanonicalPrivateSharpInput,
} from '../validation/canonical-private-sharp-execution-schemas'
import type { CanonicalExpectedArtifactLineage, PersistedArtifactResult } from '../validation/private-artifact-qa-authority-schemas'
import {
  CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORK_ITEM_OPERATION,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import {
  assertCanonicalLivingFrameSharpComponentWorkItem,
} from '../edit-architecture/canonical-living-frame-sharp-component-authority'
import { createCanonicalExecutionReadinessService } from './canonical-execution-readiness-service'
import { createCanonicalPrivateDependencyArtifactReadService } from './canonical-private-dependency-artifact-read-service'
import type {
  CanonicalPrivateDependencyArtifactReadResult,
} from './canonical-private-dependency-artifact-read-service'
import { persistCanonicalPrivateImageArtifact, readCanonicalPrivateImageArtifact } from './canonical-private-image-artifact-storage'
import { createCanonicalPrivateToolDispatchAuthorityService } from './canonical-private-tool-dispatch-authority-service'
import { createCanonicalWorkerLeaseAuthorityService } from './canonical-worker-lease-authority-service'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'
import {
  createPrivateArtifactQaAuthorityService,
  type ServerInjectedArtifactQaAdapter,
  type ServerInjectedArtifactResultAdapter,
} from './private-artifact-qa-authority-service'
import { sha256ArtifactQaValue, stableArtifactQaStringify } from './private-artifact-qa-authority-store'
import { sha256AuthorityValue } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

const RUNNER_CLASS = 'offline_sharp_structured_execution_v1' as const

export function createCanonicalPrivateSharpExecutionService(context: ServiceContext) {
  return {
    async execute(
      input: RunCanonicalPrivateSharpInput,
      serverAuthority: CanonicalPrivateSharpAuthority,
    ): Promise<CanonicalPrivateSharpResponse> {
      const body = parse(runCanonicalPrivateSharpSchema, input, 'Sharp execution identity is invalid.')
      const injected = parse(canonicalPrivateSharpAuthoritySchema, serverAuthority, 'Sharp execution authority is invalid.')
      const actor = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (actor !== access.userId) throw denied('Sharp actor is outside this workspace.')
      const dispatch = (await createCanonicalPrivateToolDispatchAuthorityService(context).consume({
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, jobId: body.jobId, grantId: body.grantId,
        purpose: 'private_internal_canonical_tool_dispatch_consume',
        idempotencyKey: body.idempotencyKey,
      }, injected)).toolDispatchConsumption
      const binding = dispatch.grant.binding
      if (
        binding.canonicalToolId !== 'sharp' ||
        binding.operationId !== 'tool.sharp.prepare_approved_image_asset.v1' ||
        binding.leaseId !== injected.leaseId || binding.jobId !== body.jobId ||
        binding.workspaceId !== body.workspaceId || binding.projectId !== body.projectId ||
        binding.editSessionId !== body.editSessionId ||
        (!dispatch.executionAuthority.newExecutionStartAuthorized &&
          !dispatch.executionAuthority.resumeSameIdempotentAttemptOnly)
      ) throw denied('Consumed dispatch grant does not match Sharp execution identity.')
      const readiness = (await createCanonicalExecutionReadinessService(context).inspectJob({
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, jobId: body.jobId,
        purpose: 'private_internal_dry_run_readiness',
      })).executionReadinessEnvelope
      const planning = createEditPlanningAuthorityService(context)
      const authority = await planning.loadApprovedExecutionAuthority(readiness.job.approvedPlanSnapshotId, access.workspaceId)
      const beforeHash = sha256AuthorityValue(authority)
      const workItem = authority.workItems.find((candidate) => candidate.id === binding.approvedWorkItemId)
      const expectedAsset = authority.assetManifest.entries.find((candidate) =>
        candidate.id === binding.expectedAssetId && candidate.approvedWorkItemId === workItem?.id)
      if (!workItem || !expectedAsset) throw denied('Sharp work-item or output lineage is missing.')
      const livingFrameAlphaComponent =
        workItem.executionInput.operation ===
          CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORK_ITEM_OPERATION
      if (livingFrameAlphaComponent) {
        assertCanonicalLivingFrameSharpComponentWorkItem(
          workItem,
        )
      }
      const planningPayload = validateOfflineSharpPlanningPayload(workItem.executionInput.structuredPayload)
      const contentType = planningPayload.outputFormat === 'png'
        ? 'image/png' as const
        : planningPayload.outputFormat === 'jpeg'
          ? 'image/jpeg' as const
          : 'image/webp' as const
      if (
        expectedAsset.contentType !== contentType || binding.expectedOutput.contentType !== contentType ||
        expectedAsset.assetRole === 'final' || expectedAsset.previewPlaceholderAllowed ||
        binding.expectedOutput.outputKey !== expectedAsset.outputKey ||
        readiness.job.approvedWorkItemId !== workItem.id ||
        binding.approvedPlanSnapshotId !== authority.snapshot.snapshotId ||
        (livingFrameAlphaComponent &&
          (
            planningPayload.imageRecipeId !==
              'approved_living_frame_alpha_component_v1' ||
            planningPayload.outputFormat !== 'png'
          ))
      ) throw denied('Sharp execution is limited to the exact approved non-final image output.')
      const runtimeAuthority = await readPersistedOfflineNodeStructuredRuntimeAuthority()
      if (
        !runtimeAuthority || !runtimeAuthority.readiness.privateInternalExecutionReady ||
        runtimeAuthority.readiness.productReady ||
        !runtimeAuthority.supportedOperations.some((operation) =>
          operation.toolId === 'sharp' && operation.operationId === binding.operationId)
      ) throw denied('Sharp runtime authority changed after dispatch.')
      const runtime = await openPrivateOfflineSharpStructuredExecutionRuntime()
      if (runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash) {
        throw denied('Opened Sharp image does not match dispatch-time authority.')
      }
      const leaseService = createCanonicalWorkerLeaseAuthorityService(context)
      const begun = await leaseService.beginInternalExecution({
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, jobId: body.jobId,
        leaseId: injected.leaseId, leaseCredential: injected.leaseCredential,
        runnerClass: RUNNER_CLASS,
      })
      const executionAttemptId = begun.executionFence.executionAttemptId
      const dependencyReader =
        createCanonicalPrivateDependencyArtifactReadService(
          context,
        )
      let sourceDependency:
        CanonicalPrivateDependencyArtifactReadResult
      let maskDependency:
        CanonicalPrivateDependencyArtifactReadResult | undefined
      if (livingFrameAlphaComponent) {
        const dependencyAssets =
          workItem.dependencyKeys.map((dependencyKey) => {
            const dependencyWorkItem =
              authority.workItems.find((candidate) =>
                candidate.workItemKey === dependencyKey)
            const assets = authority.assetManifest.entries.filter(
              (candidate) =>
                candidate.approvedWorkItemId ===
                  dependencyWorkItem?.id,
            )
            if (
              !dependencyWorkItem ||
              assets.length !== 1
            ) {
              throw denied(
                'Sharp alpha-component dependency work or asset lineage is missing.',
              )
            }
            return assets[0]!
          })
        const sourceAssets = dependencyAssets.filter(
          (candidate) =>
            candidate.artifactType ===
              'approved_exact_source_frame_png'
            || candidate.artifactType ===
              'living_frame_generated_opaque_still_png',
        )
        const sourceAsset = sourceAssets[0]
        const maskAsset = dependencyAssets.find(
          (candidate) =>
            candidate.artifactType ===
              'living_frame_alpha_mask_png',
        )
        if (
          sourceAssets.length !== 1 ||
          !sourceAsset ||
          !maskAsset ||
          sourceAsset.contentType !== 'image/png' ||
          maskAsset.contentType !== 'image/png'
        ) {
          throw denied(
            'Sharp alpha-component requires one approved source-frame or generated opaque-still PNG and one rembg mask PNG.',
          )
        }
        const sourceIndex = begun.lease
          .dependencyAuthority.selectedArtifacts
          .findIndex((candidate) =>
            candidate.expectedAssetId === sourceAsset.id)
        const maskIndex = begun.lease
          .dependencyAuthority.selectedArtifacts
          .findIndex((candidate) =>
            candidate.expectedAssetId === maskAsset.id)
        if (
          sourceIndex < 0 ||
          maskIndex < 0 ||
          sourceIndex === maskIndex
        ) {
          throw denied(
            'Sharp alpha-component lease did not select both exact dependency artifacts.',
          )
        }
        const commonRead = {
          workspaceId: body.workspaceId,
          projectId: body.projectId,
          editSessionId: body.editSessionId,
          snapshotId: authority.snapshot.snapshotId,
          currentJobId: body.jobId,
          currentApprovedWorkItemId: workItem.id,
          leaseId: injected.leaseId,
          leaseCredential: injected.leaseCredential,
          executionAttemptId,
          dispatchGrantId: body.grantId,
          dependencyAuthority:
            begun.lease.dependencyAuthority,
          allowedContentTypes: ['image/png'] as const,
          maximumBytes: 16 * 1024 * 1024,
        }
        sourceDependency =
          await dependencyReader.readSingleSelectedArtifact({
            ...commonRead,
            selectedArtifactIndex: sourceIndex,
          })
        maskDependency =
          await dependencyReader.readSingleSelectedArtifact({
            ...commonRead,
            selectedArtifactIndex: maskIndex,
          })
        if (
          sourceDependency.expectedAssetId !==
            sourceAsset.id ||
          maskDependency.expectedAssetId !==
            maskAsset.id
        ) {
          throw denied(
            'Sharp alpha-component dependency bytes do not match selected asset lineage.',
          )
        }
      } else {
        sourceDependency =
          await dependencyReader.readSingleSelectedArtifact({
            workspaceId: body.workspaceId,
            projectId: body.projectId,
            editSessionId: body.editSessionId,
            snapshotId: authority.snapshot.snapshotId,
            currentJobId: body.jobId,
            currentApprovedWorkItemId: workItem.id,
            leaseId: injected.leaseId,
            leaseCredential: injected.leaseCredential,
            executionAttemptId,
            dispatchGrantId: body.grantId,
            dependencyAuthority:
              begun.lease.dependencyAuthority,
            allowedContentTypes: ['image/svg+xml'],
            maximumBytes: 2 * 1024 * 1024,
          })
      }
      const dependencyReadEvidenceHash =
        sha256AuthorityValue({
          domain:
            'canonical_private_sharp_dependency_set_v1',
          source:
            sourceDependency
              .dependencyReadEvidenceHash,
          mask:
            maskDependency
              ?.dependencyReadEvidenceHash ?? null,
        })
      const request =
        validateOfflineNodeStructuredExecutionRequest({
          toolId: 'sharp',
          operationId: binding.operationId,
          payload: livingFrameAlphaComponent
            ? {
                ...planningPayload,
                sourceMimeType:
                  sourceDependency.contentType,
                sourceByteLength:
                  sourceDependency.byteLength,
                sourceSha256:
                  sourceDependency.sha256,
                sourceBytesBase64:
                  sourceDependency.bytes
                    .toString('base64'),
                maskMimeType:
                  maskDependency!.contentType,
                maskByteLength:
                  maskDependency!.byteLength,
                maskSha256:
                  maskDependency!.sha256,
                maskBytesBase64:
                  maskDependency!.bytes
                    .toString('base64'),
              }
            : {
                ...planningPayload,
                sourceMimeType:
                  sourceDependency.contentType,
                sourceByteLength:
                  sourceDependency.byteLength,
                sourceSha256:
                  sourceDependency.sha256,
                sourceBytesBase64:
                  sourceDependency.bytes
                    .toString('base64'),
              },
        })
      const result = await runtime.execute(request)
      if (
        result.evidence.toolId !== 'sharp' || result.evidence.operationId !== binding.operationId ||
        result.imageArtifact.mimeType !== contentType || result.readiness.productReady ||
        result.evidence.semanticEvidence.sourceBytesVerified !== true ||
        (livingFrameAlphaComponent &&
          (
            result.evidence.semanticEvidence.sourceMimeType !==
              'image/png' ||
            result.evidence.semanticEvidence
              .maskBytesVerified !== true ||
            result.evidence.semanticEvidence
              .alphaDerivedFromMask !== true ||
            result.evidence.semanticEvidence
              .transparentRgbCleared !== true ||
            result.evidence.semanticEvidence
              .outputWidth !==
                planningPayload.outputWidth ||
            result.evidence.semanticEvidence
              .outputHeight !==
                planningPayload.outputHeight
          ))
      ) throw denied('Sharp result failed exact operation verification.')
      const privateObjectIdentityHash = sha256ArtifactQaValue({
        domain: 'canonical_private_sharp_image_v1', workspaceId: body.workspaceId,
        snapshotId: authority.snapshot.snapshotId, jobId: body.jobId,
        expectedAssetId: expectedAsset.id, dispatchGrantId: body.grantId,
        executionAttemptId, contentSha256: result.imageArtifact.sha256,
      })
      await persistCanonicalPrivateImageArtifact({
        localStorageRoot: context.env.localStorageRoot, privateObjectIdentityHash,
        contentType, bytes: result.imageArtifact.bytes,
        expectedSha256: result.imageArtifact.sha256,
      })
      const identity = {
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, snapshotId: authority.snapshot.snapshotId,
        jobId: body.jobId, expectedAssetId: expectedAsset.id,
      }
      const lineage: CanonicalExpectedArtifactLineage = {
        assetId: expectedAsset.id, outputKey: expectedAsset.outputKey,
        artifactType: expectedAsset.artifactType, assetRole: expectedAsset.assetRole,
        required: expectedAsset.required, previewPlaceholderAllowed: expectedAsset.previewPlaceholderAllowed,
        contentType, segmentIds: [...expectedAsset.segmentIds], timingIds: [...expectedAsset.timingIds],
        rendererLayerIds: [...expectedAsset.rendererLayerIds], approvedWorkItemId: workItem.id,
        workItemKey: workItem.workItemKey, jobType: workItem.workItemType,
        jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash,
        snapshotHash: readiness.authorityHashes.snapshotHash,
        approvedAssetManifestHash: readiness.authorityHashes.approvedAssetManifestHash,
      }
      const adapterInput: SharpAdapterInput = {
        localStorageRoot: context.env.localStorageRoot, identity, lineage,
        privateObjectIdentityHash, executionAttemptId, dispatchGrantId: body.grantId,
        runtimeAuthorityHash: runtimeAuthority.authorityHash,
        executionStartedAt: begun.executionFence.startedAt,
        result,
        dependencyReadEvidenceHash,
      }
      const artifactAuthority = createPrivateArtifactQaAuthorityService(context, adapters(adapterInput))
      const keyHash = sha256ArtifactQaValue({ domain: 'canonical_sharp_idempotency_v1', body, executionAttemptId })
      const artifactResult = await artifactAuthority.recordArtifactResult({
        ...identity, idempotencyKey: key('sharp-artifact', keyHash),
        purpose: 'record_server_verified_internal_artifact_result',
      })
      const qaResult = await artifactAuthority.recordArtifactQa({
        ...identity, artifactId: artifactResult.artifact.artifactId,
        idempotencyKey: key('sharp-qa', keyHash), purpose: 'record_server_verified_internal_artifact_qa',
      })
      const completed = await leaseService.completeInternalExecution({
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, jobId: body.jobId,
        leaseId: injected.leaseId, leaseCredential: injected.leaseCredential,
        runnerClass: RUNNER_CLASS, executionAttemptId,
      })
      const reconciliation = await artifactAuthority.reconcileArtifact({
        ...identity, artifactId: artifactResult.artifact.artifactId,
        idempotencyKey: key('sharp-reconcile', keyHash),
        purpose: 'reconcile_server_verified_internal_artifact',
      })
      if (
        qaResult.qaEvaluation.outcome !== 'passed' ||
        reconciliation.reconciliation.decision !== 'test_merged_not_live_authorized' ||
        !reconciliation.reconciliation.privateTestDependencySatisfied || !completed.executionFence.completedAt
      ) throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Sharp output failed QA or reconciliation.', 409)
      if (sha256AuthorityValue(await planning.loadApprovedExecutionAuthority(
        authority.snapshot.snapshotId, access.workspaceId,
      )) !== beforeHash) throw denied('Canonical authority changed during Sharp execution.')
      const responseWithoutHash = {
        schemaVersion: 'canonical-private-sharp-execution-response-v1' as const,
        source: 'canonical_private_sharp_execution_coordinator' as const,
        purpose: body.purpose,
        identity: { ...identity, approvedWorkItemId: workItem.id, dispatchGrantId: body.grantId },
        tool: {
          canonicalToolId: 'sharp' as const, operationId: binding.operationId,
          actualLibraryOperationCompleted: true as const, providerCallMade: false as const,
          dependencyArtifactRead: true as const,
          dependencyReadEvidenceHash,
          dependencyArtifactCount:
            maskDependency ? 2 as const : 1 as const,
          sourceArtifactId:
            sourceDependency.artifactId,
          sourceArtifactSha256:
            sourceDependency.sha256,
          maskArtifactId:
            maskDependency?.artifactId ?? null,
          maskArtifactSha256:
            maskDependency?.sha256 ?? null,
          renderExecuted: false as const, finalExportExecuted: false as const,
        },
        runtime: {
          runtimeAuthorityHash: runtimeAuthority.authorityHash,
          imageIdentityHash: runtime.image.imageIdentityHash,
          executionAttestationHash: result.attestation.attestationHash,
          requestEnvelopeSha256: result.evidence.requestEnvelopeSha256,
          resultSha256: result.evidence.imageSha256,
          privateInternalOnly: true as const, productReady: false as const,
          externalBetaReady: false as const, productionReady: false as const,
        },
        result: {
          artifactId: artifactResult.artifact.artifactId,
          qaEvaluationId: qaResult.qaEvaluation.qaEvaluationId,
          reconciliationId: reconciliation.reconciliation.reconciliationId,
          contentType, sha256: artifactResult.artifact.content.sha256,
          byteLength: artifactResult.artifact.content.byteLength,
          privateObjectIdentityHash: artifactResult.artifact.storageIdentity.opaqueObjectIdentityHash,
          qaOutcome: 'passed' as const,
          reconciliationDecision: 'test_merged_not_live_authorized' as const,
          privateTestDependencySatisfied: true as const, finalRenderAuthorized: false as const,
        },
        replay: {
          dispatchConsumptionReplayed: dispatch.consumptionReplayed,
          executionFenceBeginReplayed: begun.replayed,
          executionFenceCompleteReplayed: completed.replayed,
          artifactRecordReplayed: artifactResult.replayed, qaRecordReplayed: qaResult.replayed,
          reconciliationReplayed: reconciliation.replayed,
        },
        permissions: {
          furtherDispatch: false as const, furtherDependencyRead: false as const,
          providerCall: false as const, render: false as const, creditSpend: false as const,
          walletMutation: false as const, settlement: false as const, delivery: false as const,
        },
        completedAt: reconciliation.reconciliation.createdAt, testOnly: true as const,
      }
      return canonicalPrivateSharpResponseSchema.parse({
        ...responseWithoutHash, responseHash: sha256AuthorityValue(responseWithoutHash),
      })
    },
  }
}

interface SharpAdapterInput {
  localStorageRoot: string
  identity: { workspaceId: string; projectId: string; editSessionId: string; snapshotId: string; jobId: string; expectedAssetId: string }
  lineage: CanonicalExpectedArtifactLineage
  privateObjectIdentityHash: string
  executionAttemptId: string
  dispatchGrantId: string
  runtimeAuthorityHash: string
  executionStartedAt: string
  result: OfflineSharpStructuredExecutionResult
  dependencyReadEvidenceHash: string
}

function adapters(input: SharpAdapterInput): {
  producedArtifact: ServerInjectedArtifactResultAdapter
  artifactQa: ServerInjectedArtifactQaAdapter
} {
  return {
    producedArtifact: {
      adapterKind: 'server_injected_internal_artifact_adapter',
      async collectProducedArtifact(adapterInput) {
        assertLineage(adapterInput.identity, adapterInput.lineage, input)
        await assertStored(input)
        return {
          schemaVersion: 'server-internal-produced-artifact-evidence-v1' as const,
          evidenceOrigin: 'server_injected_internal_artifact_adapter' as const,
          evidenceClass: 'private_internal_test_attested' as const,
          artifactVersion: 1, attemptKind: 'initial' as const,
          content: {
            sha256: input.result.imageArtifact.sha256,
            byteLength: input.result.imageArtifact.byteLength,
            contentType: input.result.imageArtifact.mimeType,
          },
          storageIdentity: { storageKind: 'private_local_test' as const, opaqueObjectIdentityHash: input.privateObjectIdentityHash },
          placeholder: { isPlaceholder: false, scope: 'none' as const },
          actualRunEvidence: {
            state: 'actual_run_evidence_verified_v2' as const,
            executionAttemptId: input.executionAttemptId, runnerClass: RUNNER_CLASS,
            runnerEvidenceHash: sha256ArtifactQaValue({ evidence: input.result.evidence, dependencyReadEvidenceHash: input.dependencyReadEvidenceHash }),
            startedAt: input.executionStartedAt, finishedAt: input.result.attestation.completedAt,
            exitCode: 0 as const, toolIds: ['sharp'], actualRunVerified: true as const,
            dispatchGrantId: input.dispatchGrantId, runtimeAuthorityHash: input.runtimeAuthorityHash,
            runtimeImageIdentityHash: input.result.image.imageIdentityHash,
            executionAttestationHash: input.result.attestation.attestationHash,
          },
          completedAt: input.result.attestation.completedAt,
        }
      },
    },
    artifactQa: {
      adapterKind: 'server_injected_internal_qa_adapter',
      async evaluateArtifact(adapterInput) {
        assertLineage(adapterInput.identity, adapterInput.lineage, input)
        assertArtifact(adapterInput.artifact, input)
        await assertStored(input)
        return {
          schemaVersion: 'server-internal-artifact-qa-evidence-v1' as const,
          evidenceOrigin: 'server_injected_internal_qa_adapter' as const,
          evidenceClass: 'private_internal_test_attested' as const,
          gateResults: [{
            gateId: 'asset_received_gate' as const, category: 'asset_integrity' as const,
            status: 'passed' as const, failureScope: 'none' as const,
            evidenceHash: sha256ArtifactQaValue({ content: adapterInput.artifact.content, dependencyReadEvidenceHash: input.dependencyReadEvidenceHash }),
            notesCode: 'sharp_image_hash_size_signature_storage_match',
          }, {
            gateId: 'asset_quality_gate' as const, category: 'model_tier_policy' as const,
            status: 'passed' as const, failureScope: 'none' as const,
            evidenceHash: sha256ArtifactQaValue(input.result.evidence.semanticEvidence),
            notesCode: 'actual_sharp_semantic_qa_passed',
          }],
          recovery: { state: 'none' as const, action: 'none' as const, approvedWithinSnapshot: true, reasonCode: 'sharp_pass_no_recovery' },
          evaluatedAt: new Date().toISOString(),
          actualQaEvidenceState: 'actual_image_tool_qa_verified_v1' as const,
          actualQaVerified: true as const,
        }
      },
    },
  }
}

async function assertStored(input: SharpAdapterInput) {
  const stored = await readCanonicalPrivateImageArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.privateObjectIdentityHash,
    contentType: input.result.imageArtifact.mimeType,
  })
  if (
    !stored || stored.sha256 !== input.result.imageArtifact.sha256 ||
    stored.byteLength !== input.result.imageArtifact.byteLength ||
    !stored.bytes.equals(input.result.imageArtifact.bytes)
  ) throw denied('Sharp image bytes changed before artifact authority.')
  return stored
}
function assertLineage(identity: Record<string, unknown>, lineage: CanonicalExpectedArtifactLineage, input: SharpAdapterInput): void {
  if (stableArtifactQaStringify(identity) !== stableArtifactQaStringify(input.identity) ||
    stableArtifactQaStringify(lineage) !== stableArtifactQaStringify(input.lineage)) throw denied('Sharp adapter lineage changed.')
}
function assertArtifact(artifact: PersistedArtifactResult, input: SharpAdapterInput): void {
  if (
    artifact.content.sha256 !== input.result.imageArtifact.sha256 ||
    artifact.content.byteLength !== input.result.imageArtifact.byteLength ||
    artifact.storageIdentity.opaqueObjectIdentityHash !== input.privateObjectIdentityHash ||
    artifact.actualRunEvidence.state !== 'actual_run_evidence_verified_v2' ||
    artifact.actualRunEvidence.runnerClass !== RUNNER_CLASS ||
    artifact.actualRunEvidence.dispatchGrantId !== input.dispatchGrantId
  ) throw denied('Persisted Sharp artifact does not match actual-run evidence.')
}
function parse<T>(schema: ZodType<T>, value: unknown, message: string): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ApiError('VALIDATION_FAILED', message, 400, parsed.error.flatten())
  return parsed.data
}
function key(prefix: string, hash: string): string { return `${prefix}-${hash.slice(0, 56)}` }
function denied(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 409, { requiredGate: 'canonical_private_sharp_execution_authority' })
}
