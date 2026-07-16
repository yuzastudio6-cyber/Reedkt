import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

import { validateCanonicalToolWorkItemPayload } from '../edit-architecture/canonical-tool-payload-authority'
import { ApiError } from '../errors/api-error'
import { isExplicitLocalInternalTestRuntime } from '../middleware/canonical-worker-runtime'
import {
  normalizeProfessionalToolOperationAlias,
} from '../tool-execution/professional-tool-operation-spec-registry'
import {
  listCompleteProfessionalToolOperationSpecs,
  resolveCompleteProfessionalToolOperationSpec,
} from '../tool-execution/core-registry-operations/core-registry-operation-specs'
import type { ProfessionalToolOperationSpec } from '../tool-execution/professional-tool-operation-spec-types'
import { readPersistedOfflineNodeStructuredRuntimeAuthority } from '../tool-execution/node-runner-execution/offline-node-structured-execution-service'
import {
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  validateOfflineMediaBinaryMezzanineFinalizationPlanningPayload,
} from '../tool-execution/media-binary-execution'
import { readPersistedOfflinePythonStructuredRuntimeAuthority } from '../tool-execution/python-runner-execution/offline-python-structured-execution-service'
import { readPersistedOfflineRemotionRenderRuntimeAuthority } from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-service'
import { readPersistedOfflineLibassRuntimeAuthority } from '../tool-execution/libass-caption-execution/offline-libass-caption-service'
import { readPersistedOfflineBrowserGraphicsRuntimeAuthority } from '../tool-execution/browser-graphics-execution/offline-browser-graphics-service'
import { readPersistedOfflineAiCapabilityRuntimeAuthority } from '../tool-execution/ai-capability-execution/offline-ai-capability-service'
import { readPersistedOfflineNativeImagePipelineRuntimeAuthority } from '../tool-execution/native-image-pipeline-execution/offline-native-image-pipeline-service'
import { readPersistedOfflineNativeAudioProcessingRuntimeAuthority } from '../tool-execution/native-audio-processing-execution/offline-native-audio-processing-service'
import { readPersistedOfflineContainerPackagingValidationRuntimeAuthority } from '../tool-execution/container-packaging-validation-execution/offline-container-packaging-validation-service'
import { readPersistedOfflineVapourSynthFramePipelineRuntimeAuthority } from '../tool-execution/vapoursynth-frame-pipeline-execution/offline-vapoursynth-frame-pipeline-service'
import { readPersistedOfflineAudioFluxAnalysisRuntimeAuthority } from '../tool-execution/audioflux-analysis-execution/offline-audioflux-analysis-service'
import { readPersistedOfflineRembgBackgroundRemovalRuntimeAuthority } from '../tool-execution/rembg-background-removal-execution/offline-rembg-background-removal-service'
import { readPersistedOfflineDeepFilterNetVoiceCleanupRuntimeAuthority } from '../tool-execution/deepfilternet-voice-cleanup-execution/offline-deepfilternet-voice-cleanup-service'
import {
  createToolRuntimeEvidenceAuthority,
  verifyToolRuntimeEvidenceAuthority,
} from '../tool-runtime-evidence/tool-runtime-evidence-authority'
import type { ProductionToolRuntimeEvidenceRecord } from '../tool-runtime-evidence/tool-runtime-evidence-types'
import type { ServiceContext } from '../types'
import {
  CANONICAL_PRIVATE_TOOL_DISPATCH_RECORD_VERSION,
  CANONICAL_PRIVATE_TOOL_DISPATCH_RESPONSE_VERSION,
  authorizeCanonicalPrivateToolDispatchSchema,
  canonicalPrivateToolDispatchConsumptionAuthoritySchema,
  canonicalPrivateToolDispatchConsumptionResponseSchema,
  canonicalPrivateToolDispatchLeaseAuthoritySchema,
  canonicalPrivateToolDispatchResponseSchema,
  consumeCanonicalPrivateToolDispatchSchema,
  type AuthorizeCanonicalPrivateToolDispatchInput,
  type CanonicalPrivateToolDispatchConsumptionAuthority,
  type CanonicalPrivateToolDispatchConsumptionResponse,
  type CanonicalPrivateToolDispatchLeaseAuthority,
  type CanonicalPrivateToolDispatchRecord,
  type CanonicalPrivateToolDispatchResponse,
  type ConsumeCanonicalPrivateToolDispatchInput,
} from '../validation/canonical-private-tool-dispatch-schemas'
import type {
  CanonicalWorkerLeaseDependencyAuthority,
  CanonicalWorkerLeaseHashes,
} from '../validation/canonical-worker-lease-authority-schemas'
import { createCanonicalExecutionReadinessService } from './canonical-execution-readiness-service'
import { withCanonicalExecutionDomainLock } from './canonical-execution-domain-lock'
import { createCanonicalWorkerLeaseAuthorityService } from './canonical-worker-lease-authority-service'
import {
  createEditPlanningAuthorityService,
  type CanonicalApprovedExecutionAuthority,
  type CanonicalApprovedExecutionWorkItem,
} from './edit-planning-authority-service'
import {
  MAX_CANONICAL_PRIVATE_TOOL_DISPATCH_AUDIT_EVENTS,
  MAX_CANONICAL_PRIVATE_TOOL_DISPATCH_GRANTS,
  MAX_CANONICAL_PRIVATE_TOOL_DISPATCH_IDEMPOTENCY_RECORDS,
  canonicalPrivateToolDispatchBindingHash,
  canonicalPrivateToolDispatchImmutableHash,
  mutatePrivateCanonicalToolDispatchAggregate,
  readPrivateCanonicalToolDispatchAggregate,
  type CanonicalPrivateToolDispatchStoreScope,
} from './private-canonical-tool-dispatch-store'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityDerivedJobRecord,
  type AuthorityPlannedAssetManifestEntry,
} from './private-edit-authority-store'
import { withPlanningDomainMutationLock } from './planning-domain-mutation-lock'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'
import {
  CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_CHUNKS,
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_CHUNKS,
} from '../../src/types/canonical-private-composition-capacity'

export const CANONICAL_PRIVATE_TOOL_DISPATCH_TTL_SECONDS = 45 as const

const DISPATCH_CREDENTIAL_DOMAIN = 'reeditpro:canonical-private-tool-dispatch:v1'
const DISPATCH_IDEMPOTENCY_DOMAIN = 'reeditpro:canonical-private-tool-dispatch-idempotency:v1'
const DIRECT_FINAL_COMPOSITION_OPERATIONS = new Set([
  'render_approved_source_caption_final',
  'render_approved_source_sequence_caption_final',
  'render_approved_source_caption_track_final',
  'render_approved_source_sequence_caption_track_final',
])

export interface CanonicalPrivateToolDispatchAuthorizationResult {
  toolDispatchGrant: CanonicalPrivateToolDispatchResponse
  warnings: string[]
}

export interface CanonicalPrivateToolDispatchConsumptionResult {
  toolDispatchConsumption: CanonicalPrivateToolDispatchConsumptionResponse
  warnings: string[]
}

/**
 * Authorizes only an immutable operation identity. It never accepts execution
 * settings, artifact locations, URLs, commands, environment, secrets, costs,
 * provider payloads, or render payloads, and it never executes a tool.
 */
export function createCanonicalPrivateToolDispatchAuthorityService(context: ServiceContext) {
  return {
    async authorize(
      input: AuthorizeCanonicalPrivateToolDispatchInput,
      serverLeaseAuthority: CanonicalPrivateToolDispatchLeaseAuthority,
    ): Promise<CanonicalPrivateToolDispatchAuthorizationResult> {
      const body = parseAuthorization(input)
      const leaseAuthority = parseServerLeaseAuthority(serverLeaseAuthority)
      const secret = requirePrivateDispatchRuntime(context)
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (access.userId !== actorUserId) {
        throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Tool dispatch actor does not own this authenticated workspace scope.', 403)
      }

      const domainScope = {
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: access.userId,
        workspaceId: access.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
      }
      return withCanonicalExecutionDomainLock(domainScope, () =>
        withPlanningDomainMutationLock(domainScope, async () => {
        const leaseVerification = await createCanonicalWorkerLeaseAuthorityService(context).verifyActive({
          workspaceId: body.workspaceId,
          projectId: body.projectId,
          editSessionId: body.editSessionId,
          jobId: body.jobId,
          purpose: 'private_internal_canonical_lease_verification',
          leaseId: leaseAuthority.leaseId,
          leaseCredential: leaseAuthority.leaseCredential,
        })
        const lease = leaseVerification.workerLeaseVerification.lease
        assertLeaseNotStartedForToolDispatch(lease)
        const leaseDependencyAuthority = leaseDependencyAuthorityBinding(lease.dependencyAuthority)

        const readiness = (await createCanonicalExecutionReadinessService(context).inspectJob({
          workspaceId: body.workspaceId,
          projectId: body.projectId,
          editSessionId: body.editSessionId,
          jobId: body.jobId,
          purpose: 'private_internal_dry_run_readiness',
        })).executionReadinessEnvelope
        const authority = await createEditPlanningAuthorityService(context).loadApprovedExecutionAuthority(
          readiness.job.approvedPlanSnapshotId,
          access.workspaceId,
        )
        const canonical = resolveAndVerifyCanonicalDispatchBinding({ body, lease, readiness, authority })
        const tool = resolveAndVerifyToolContract(body, canonical.workItem)
        const runtimeEvidence = resolveRuntimeEvidence(tool.spec)
        const privateRuntimeEvidence = await resolvePrivateInternalRuntimeEvidence(tool.spec)
        const timestamp = new Date().toISOString()
        const expiresAt = boundedExpiry(timestamp, [
          lease.expiresAt,
          lease.attemptDeadlineAt,
          readiness.reservation.expiresAt,
        ])
        const requestHash = dispatchRequestHash({
          actorUserId,
          body,
          leaseId: lease.leaseId,
          leaseAttemptNumber: lease.attemptNumber,
          leaseImmutableHash: lease.immutableLeaseHash,
          leaseDependencyAuthority,
          leaseExecutionFenceState: lease.executionFence.state,
          canonicalHashes: lease.canonicalHashes,
          toolOperationSpecHash: tool.specHash,
          privateRuntimeAuthorityHash: privateRuntimeEvidence.authorityHash,
          privateRuntimeImageIdentityHash: privateRuntimeEvidence.imageIdentityHash,
          expectedAsset: canonical.expectedAsset,
        })
        const keyHash = dispatchIdempotencyKeyHash(
          secret,
          'authorize',
          actorUserId,
          access.workspaceId,
          body.idempotencyKey,
        )
        const blockers = privateInternalDispatchBlockers(tool.spec, privateRuntimeEvidence)
        const scope: CanonicalPrivateToolDispatchStoreScope = {
          localStorageRoot: context.env.localStorageRoot,
          ownerUserId: access.userId,
          workspaceId: access.workspaceId,
        }

        const record = await mutatePrivateCanonicalToolDispatchAggregate<CanonicalPrivateToolDispatchRecord>({
          scope,
          now: timestamp,
          mutation: (aggregate) => {
            const replay = aggregate.idempotencyRecords.find((candidate) =>
              candidate.operation === 'authorize' && candidate.keyHash === keyHash)
            if (replay) {
              if (replay.requestHash !== requestHash) {
                throw new ApiError(
                  'IDEMPOTENCY_CONFLICT',
                  'Idempotency-Key was reused with another canonical tool-dispatch identity.',
                  409,
                )
              }
              const replayGrant = aggregate.grants.find((candidate) => candidate.id === replay.grantId)
              if (!replayGrant) throw invalidDispatchAuthority('Dispatch idempotency replay grant is missing.')
              return { result: replayGrant, changed: false }
            }

            ensureAuthorizationCapacity(aggregate)
            const binding = {
              workspaceId: body.workspaceId,
              projectId: body.projectId,
              editSessionId: body.editSessionId,
              jobId: body.jobId,
              approvedPlanSnapshotId: authority.snapshot.snapshotId,
              approvedWorkItemId: canonical.workItem.id,
              expectedAssetId: canonical.expectedAsset.id,
              requestedToolName: body.requestedToolName,
              canonicalToolId: tool.spec.canonicalToolId,
              operationId: body.operationId,
              leaseId: lease.leaseId,
              leaseAttemptNumber: lease.attemptNumber,
              leaseImmutableHash: lease.immutableLeaseHash,
              leaseDependencyAuthority,
              leaseExecutionFenceState: 'not_started' as const,
              reservationId: authority.reservation.id,
              maximumCreditBudget: canonical.workItem.maximumCreditBudget,
              remainingReservedCreditsAtDecision: canonical.remainingReservedCredits,
              expectedOutput: safeExpectedOutputBinding(canonical.expectedAsset),
            }
            const bindingHash = canonicalPrivateToolDispatchBindingHash({ binding })
            const conflictingGrant = aggregate.grants.find((candidate) =>
              canonicalPrivateToolDispatchBindingHash(candidate) === bindingHash &&
              Date.parse(candidate.expiresAt) > Date.parse(timestamp) &&
              (candidate.status === 'authorized' || candidate.status === 'denied'))
            if (conflictingGrant) {
              throw new ApiError(
                'WORKER_CLAIM_CONFLICT',
                'This exact lease attempt, work item, output, tool, and operation already has a live dispatch decision.',
                409,
              )
            }

            const grantId = `tool_dispatch_${randomUUID()}`
            const authorizationEligible = blockers.length === 0
            const credential = authorizationEligible
              ? deriveDispatchCredential(secret, {
                  grantId,
                  binding,
                  authorityRevision: authority.authorityRevision,
                  canonicalHashes: lease.canonicalHashes,
                  toolOperationSpecHash: tool.specHash,
                  runtimeEvidenceAuthorityHash: runtimeEvidence.authorityHash,
                  runtimeEvidenceRecordHash: runtimeEvidence.recordHash,
                  privateRuntimeAuthorityHash: privateRuntimeEvidence.authorityHash,
                  privateRuntimeImageIdentityHash: privateRuntimeEvidence.imageIdentityHash,
                  specPrivateInternalReady: specClaimsPrivateInternalReady(tool.spec),
                  runtimePrivateInternalReady: privateRuntimeEvidence.ready,
                  issuedAt: timestamp,
                  expiresAt,
                  decisionRequestHash: requestHash,
                })
              : undefined
            const recordWithoutHash: Omit<CanonicalPrivateToolDispatchRecord, 'immutableGrantHash'> = {
              schemaVersion: CANONICAL_PRIVATE_TOOL_DISPATCH_RECORD_VERSION,
              id: grantId,
              status: authorizationEligible ? 'authorized' : 'denied',
              binding,
              authorityRevision: authority.authorityRevision,
              canonicalHashes: { ...lease.canonicalHashes },
              toolOperationSpecHash: tool.specHash,
              runtimeEvidenceAuthorityHash: runtimeEvidence.authorityHash,
              runtimeEvidenceRecordHash: runtimeEvidence.recordHash,
              privateRuntimeAuthorityHash: privateRuntimeEvidence.authorityHash,
              privateRuntimeImageIdentityHash: privateRuntimeEvidence.imageIdentityHash,
              specPrivateInternalReady: specClaimsPrivateInternalReady(tool.spec),
              runtimePrivateInternalReady: privateRuntimeEvidence.ready,
              specProductReady: specClaimsProductReady(tool.spec),
              runtimeProductReady: runtimeClaimsProductReady(runtimeEvidence.record),
              exactOperationApproved: true,
              offlineExecutionOnly: true,
              decisionRequestHash: requestHash,
              ...(credential ? { credentialHashSha256: sha256Text(credential) } : {}),
              blockers,
              issuedAt: timestamp,
              expiresAt,
            }
            const createdRecord: CanonicalPrivateToolDispatchRecord = {
              ...recordWithoutHash,
              immutableGrantHash: canonicalPrivateToolDispatchImmutableHash(recordWithoutHash),
            }
            aggregate.grants.push(createdRecord)
            aggregate.idempotencyRecords.push({
              operation: 'authorize',
              keyHash,
              requestHash,
              grantId,
              createdAt: timestamp,
            })
            aggregate.auditEvents.push(auditEvent(createdRecord, timestamp))
            return { result: createdRecord, changed: true }
          },
        })

        assertRecordLeaseDependencyAndFenceBinding(record, lease)
        const response = buildDispatchResponse(secret, record)
        return {
          toolDispatchGrant: response,
          warnings: [
            'This is private single-host internal-test dispatch evidence, not distributed or production authority.',
            'The exact lease-v2 dependency authority and its not-started execution fence are committed to the request, immutable grant, and any derived credential.',
            ...(response.executionAuthority.dispatchAuthorized
              ? ['A short-lived single-use private dispatch credential was issued and still requires atomic consumption before a runner may start.']
              : ['Private-internal operation-spec or structured-runtime authority is incomplete, so no executable credential was issued.']),
            'No source bytes, provider, tool, artifact, render, wallet, credit-spend, settlement, cloud, or database operation occurred.',
          ],
        }
        }),
      )
    },

    async consume(
      input: ConsumeCanonicalPrivateToolDispatchInput,
      serverAuthority: CanonicalPrivateToolDispatchConsumptionAuthority,
    ): Promise<CanonicalPrivateToolDispatchConsumptionResult> {
      const body = parseConsumption(input)
      const privateAuthority = parseConsumptionAuthority(serverAuthority)
      const secret = requirePrivateDispatchRuntime(context)
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (access.userId !== actorUserId) {
        throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Tool dispatch consumer does not own this workspace scope.', 403)
      }
      const scope: CanonicalPrivateToolDispatchStoreScope = {
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: access.userId,
        workspaceId: access.workspaceId,
      }

      const domainScope = {
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: access.userId,
        workspaceId: access.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
      }
      return withCanonicalExecutionDomainLock(domainScope, () =>
        withPlanningDomainMutationLock(domainScope, async () => {
        const initialAggregate = await readPrivateCanonicalToolDispatchAggregate(scope)
        const initialRecord = initialAggregate?.grants.find((candidate) => candidate.id === body.grantId)
        assertConsumableGrantIdentity(initialRecord, body, privateAuthority.leaseId)
        verifyDispatchCredential(secret, initialRecord, privateAuthority.dispatchCredential)

        const leaseVerification = await createCanonicalWorkerLeaseAuthorityService(context).verifyActive({
          workspaceId: body.workspaceId,
          projectId: body.projectId,
          editSessionId: body.editSessionId,
          jobId: body.jobId,
          purpose: 'private_internal_canonical_lease_verification',
          leaseId: privateAuthority.leaseId,
          leaseCredential: privateAuthority.leaseCredential,
        })
        const lease = leaseVerification.workerLeaseVerification.lease
        if (initialRecord.status === 'authorized') {
          assertLeaseNotStartedForToolDispatch(lease)
        } else if (
          initialRecord.status !== 'consumed' ||
          !['not_started', 'started', 'completed'].includes(lease.executionFence.state)
        ) {
          throw new ApiError(
            'WORKER_LEASE_EXPIRED',
            'Consumed dispatch replay is not bound to a resumable lease execution fence.',
            409,
          )
        }
        if (
          lease.leaseId !== initialRecord.binding.leaseId ||
          lease.attemptNumber !== initialRecord.binding.leaseAttemptNumber ||
          lease.immutableLeaseHash !== initialRecord.binding.leaseImmutableHash ||
          stableAuthorityStringify(leaseDependencyAuthorityBinding(lease.dependencyAuthority)) !==
            stableAuthorityStringify(initialRecord.binding.leaseDependencyAuthority) ||
          initialRecord.binding.leaseExecutionFenceState !== 'not_started'
        ) {
          throw new ApiError('WORKER_LEASE_EXPIRED', 'Dispatch grant is not bound to this active lease attempt.', 409)
        }

        const readiness = (await createCanonicalExecutionReadinessService(context).inspectJob({
          workspaceId: body.workspaceId,
          projectId: body.projectId,
          editSessionId: body.editSessionId,
          jobId: body.jobId,
          purpose: 'private_internal_dry_run_readiness',
        })).executionReadinessEnvelope
        const authority = await createEditPlanningAuthorityService(context).loadApprovedExecutionAuthority(
          readiness.job.approvedPlanSnapshotId,
          access.workspaceId,
        )
        const authorizationIdentity: AuthorizeCanonicalPrivateToolDispatchInput = {
          workspaceId: body.workspaceId,
          projectId: body.projectId,
          editSessionId: body.editSessionId,
          jobId: body.jobId,
          approvedWorkItemId: initialRecord.binding.approvedWorkItemId,
          expectedAssetId: initialRecord.binding.expectedAssetId,
          requestedToolName: initialRecord.binding.requestedToolName,
          operationId: initialRecord.binding.operationId,
          purpose: 'private_internal_canonical_tool_dispatch_authorization',
          idempotencyKey: body.idempotencyKey,
        }
        const canonical = resolveAndVerifyCanonicalDispatchBinding({
          body: authorizationIdentity,
          lease,
          readiness,
          authority,
        })
        const tool = resolveAndVerifyToolContract(
          authorizationIdentity,
          canonical.workItem,
        )
        const runtimeEvidence = resolveRuntimeEvidence(tool.spec)
        const privateRuntimeEvidence = await resolvePrivateInternalRuntimeEvidence(tool.spec)
        assertCurrentGrantEvidence({
          record: initialRecord,
          lease,
          authority,
          canonical,
          toolSpecHash: tool.specHash,
          runtimeEvidenceAuthorityHash: runtimeEvidence.authorityHash,
          runtimeEvidenceRecordHash: runtimeEvidence.recordHash,
          privateRuntimeAuthorityHash: privateRuntimeEvidence.authorityHash,
          privateRuntimeImageIdentityHash: privateRuntimeEvidence.imageIdentityHash,
          specPrivateInternalReady: specClaimsPrivateInternalReady(tool.spec),
          runtimePrivateInternalReady: privateRuntimeEvidence.ready,
          specProductReady: specClaimsProductReady(tool.spec),
          runtimeProductReady: runtimeClaimsProductReady(runtimeEvidence.record),
          allowConsumedReplay: initialRecord.status === 'consumed',
        })

        const timestamp = new Date().toISOString()
        if (
          initialRecord.status === 'authorized' &&
          Date.parse(initialRecord.expiresAt) <= Date.parse(timestamp)
        ) {
          throw new ApiError('TOOL_NOT_READY', 'Canonical private tool-dispatch grant expired before consumption.', 409)
        }
        const requestHash = sha256AuthorityValue({
          operation: 'consume_canonical_private_tool_dispatch',
          actorUserId,
          request: {
            workspaceId: body.workspaceId,
            projectId: body.projectId,
            editSessionId: body.editSessionId,
            jobId: body.jobId,
            grantId: body.grantId,
            purpose: body.purpose,
          },
          leaseId: lease.leaseId,
          leaseAttemptNumber: lease.attemptNumber,
          leaseImmutableHash: lease.immutableLeaseHash,
          leaseDependencyAuthority: leaseDependencyAuthorityBinding(lease.dependencyAuthority),
          leaseExecutionFenceState: initialRecord.binding.leaseExecutionFenceState,
          immutableGrantHash: initialRecord.immutableGrantHash,
        })
        const keyHash = dispatchIdempotencyKeyHash(
          secret,
          'consume',
          actorUserId,
          access.workspaceId,
          body.idempotencyKey,
        )
        const consumption = await mutatePrivateCanonicalToolDispatchAggregate<{
          record: CanonicalPrivateToolDispatchRecord
          replayed: boolean
        }>({
          scope,
          now: timestamp,
          mutation: (aggregate) => {
            const current = aggregate.grants.find((candidate) => candidate.id === body.grantId)
            if (!current) throw new ApiError('TOOL_NOT_READY', 'Canonical tool-dispatch grant is unavailable.', 409)
            const replay = aggregate.idempotencyRecords.find((candidate) =>
              candidate.operation === 'consume' && candidate.keyHash === keyHash)
            if (replay) {
              if (replay.requestHash !== requestHash || replay.grantId !== current.id) {
                throw new ApiError(
                  'IDEMPOTENCY_CONFLICT',
                  'Idempotency-Key was reused with another dispatch-consumption identity.',
                  409,
                )
              }
              if (current.status !== 'consumed') {
                throw invalidDispatchAuthority('Dispatch-consumption replay is not in its terminal consumed state.')
              }
              return { result: { record: current, replayed: true }, changed: false }
            }
            if (
              current.status !== 'authorized' ||
              Date.parse(current.expiresAt) <= Date.parse(timestamp) ||
              stableAuthorityStringify(current) !== stableAuthorityStringify(initialRecord)
            ) {
              throw new ApiError(
                'TOOL_NOT_READY',
                'Canonical tool-dispatch grant is denied, expired, already consumed, or changed.',
                409,
              )
            }
            verifyDispatchCredential(secret, current, privateAuthority.dispatchCredential)
            ensureConsumptionCapacity(aggregate)
            current.status = 'consumed'
            current.consumedAt = timestamp
            aggregate.idempotencyRecords.push({
              operation: 'consume',
              keyHash,
              requestHash,
              grantId: current.id,
              createdAt: timestamp,
            })
            aggregate.auditEvents.push(auditEvent(current, timestamp))
            return { result: { record: current, replayed: false }, changed: true }
          },
        })
        const response = buildConsumptionResponse(consumption.record, consumption.replayed)
        return {
          toolDispatchConsumption: response,
          warnings: [
            ...(consumption.replayed
              ? ['This is an idempotent replay for the same executionAttemptId; it does not authorize a second execution start.']
              : ['The single-use dispatch credential was atomically consumed for one executionAttemptId; the consume boundary itself did not run a tool.']),
            'The runner still has no provider, source-object-read, artifact-write, render, credit-spend, wallet, or settlement authority from this response.',
            'Consumption revalidated the exact frozen lease-v2 dependency authority and required its execution fence to remain not started.',
            'This private single-host transition is not distributed or production dispatch authority.',
          ],
        }
        }),
      )
    },
  }
}

type LeaseVerification = Awaited<ReturnType<
  ReturnType<typeof createCanonicalWorkerLeaseAuthorityService>['verifyActive']
>>['workerLeaseVerification']['lease']

type ReadinessEnvelope = Awaited<ReturnType<
  ReturnType<typeof createCanonicalExecutionReadinessService>['inspectJob']
>>['executionReadinessEnvelope']

type NotStartedLeaseVerification = LeaseVerification & {
  executionFence: { state: 'not_started' }
}

function assertLeaseNotStartedForToolDispatch(
  lease: LeaseVerification,
): asserts lease is NotStartedLeaseVerification {
  if (lease.executionFence.state !== 'not_started') {
    throw new ApiError(
      'WORKER_LEASE_EXPIRED',
      'A canonical tool-dispatch grant requires an active lease whose execution fence has not started.',
      409,
      { requiredGate: 'canonical_tool_dispatch_not_started_execution_fence' },
    )
  }
}

function leaseDependencyAuthorityBinding(
  authority: CanonicalWorkerLeaseDependencyAuthority,
) {
  return {
    state: authority.state,
    readinessHash: authority.readinessHash,
    authorityHash: authority.authorityHash,
    selectedArtifactsHash: sha256AuthorityValue(authority.selectedArtifacts),
    selectedArtifactCount: authority.selectedArtifacts.length,
    liveRuntimeEligible: false as const,
  }
}

function assertRecordLeaseDependencyAndFenceBinding(
  record: CanonicalPrivateToolDispatchRecord,
  lease: NotStartedLeaseVerification,
): void {
  if (
    stableAuthorityStringify(record.binding.leaseDependencyAuthority) !==
      stableAuthorityStringify(leaseDependencyAuthorityBinding(lease.dependencyAuthority)) ||
    record.binding.leaseExecutionFenceState !== lease.executionFence.state
  ) {
    throw invalidDispatchAuthority(
      'Dispatch decision does not match the exact lease dependency authority and not-started execution fence.',
    )
  }
}

function resolveAndVerifyCanonicalDispatchBinding(input: {
  body: AuthorizeCanonicalPrivateToolDispatchInput
  lease: LeaseVerification
  readiness: ReadinessEnvelope
  authority: CanonicalApprovedExecutionAuthority
}): {
  workItem: CanonicalApprovedExecutionWorkItem
  job: AuthorityDerivedJobRecord
  expectedAsset: AuthorityPlannedAssetManifestEntry
  remainingReservedCredits: number
} {
  const { body, lease, readiness, authority } = input
  const currentHashes = canonicalHashesFromReadiness(readiness)
  const scheduledFor = Date.parse(readiness.job.scheduledFor)
  if (
    stableAuthorityStringify(lease.canonicalHashes) !== stableAuthorityStringify(currentHashes) ||
    lease.workspaceId !== body.workspaceId ||
    lease.projectId !== body.projectId ||
    lease.editSessionId !== body.editSessionId ||
    lease.jobId !== body.jobId ||
    lease.approvedPlanSnapshotId !== readiness.job.approvedPlanSnapshotId ||
    lease.reservationId !== readiness.reservation.reservationId ||
    authority.authorityRevision !== readiness.authorityRevision ||
    authority.snapshot.snapshotId !== lease.approvedPlanSnapshotId ||
    authority.snapshot.snapshotHash !== readiness.authorityHashes.snapshotHash ||
    !Number.isFinite(scheduledFor) ||
    scheduledFor > Date.now()
  ) {
    throw invalidDispatchAuthority('Lease, readiness, and canonical approved authority are not coherent.')
  }

  const job = authority.jobs.find((candidate) => candidate.id === body.jobId)
  const workItem = authority.workItems.find((candidate) => candidate.id === body.approvedWorkItemId)
  const exactRootDependencyAuthority =
    readiness.readinessState === 'authority_verified_runtime_blocked' &&
    readiness.dependencyEvidenceState === 'not_required_for_root_job' &&
    readiness.gates.dependencyEvidence === 'not_required' &&
    readiness.job.canonicalGraphState === 'ready' &&
    readiness.job.dependencyJobIds.length === 0 &&
    lease.dependencyAuthority.state === 'not_required_for_root_job' &&
    lease.dependencyAuthority.selectedArtifacts.length === 0
  const exactPrivateDependentAuthority =
    readiness.readinessState === 'dependency_evidence_required_runtime_blocked' &&
    readiness.dependencyEvidenceState === 'required_results_and_qa_not_committed' &&
    readiness.gates.dependencyEvidence === 'blocked_pending_results_and_qa' &&
    readiness.job.canonicalGraphState === 'blocked' &&
    readiness.job.dependencyJobIds.length > 0 &&
    lease.dependencyAuthority.state === 'private_test_dependencies_verified' &&
    lease.dependencyAuthority.selectedArtifacts.length > 0 &&
    lease.dependencyAuthority.selectedArtifacts.every((selection) =>
      readiness.job.dependencyJobIds.includes(selection.dependencyJobId))
  if (
    !job ||
    !workItem ||
    job.snapshotId !== authority.snapshot.snapshotId ||
    job.approvedWorkItemId !== workItem.id ||
    readiness.job.approvedWorkItemId !== workItem.id ||
    readiness.job.workItemKey !== workItem.workItemKey ||
    readiness.job.executionInputHash !== workItem.executionInputHash ||
    (!exactRootDependencyAuthority && !exactPrivateDependentAuthority)
  ) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Dispatch identity does not resolve to an exact eligible root or privately dependency-verified approved work item.',
      409,
    )
  }
  if (lease.attemptNumber > workItem.maxAttempts) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Lease attempt exceeds the approved work-item attempt limit.', 409)
  }

  const expectedAsset = authority.assetManifest.entries.find((candidate) =>
    candidate.id === body.expectedAssetId &&
    candidate.snapshotId === authority.snapshot.snapshotId &&
    candidate.approvedWorkItemId === workItem.id)
  const readinessAsset = readiness.expectedAssets.find((candidate) => candidate.assetId === body.expectedAssetId)
  const expectedOutput = workItem.expectedOutputs.find((candidate) =>
    candidate.outputKey === expectedAsset?.outputKey)
  if (
    !expectedAsset ||
    !readinessAsset ||
    !expectedOutput ||
    !job.expectedAssetIds.includes(expectedAsset.id) ||
    !readiness.job.expectedAssetIds.includes(expectedAsset.id) ||
    stableAuthorityStringify(safeExpectedOutputBinding(expectedAsset)) !==
      stableAuthorityStringify(safeExpectedOutputBindingFromWorkItem(expectedOutput)) ||
    readinessAsset.outputKey !== expectedAsset.outputKey ||
    readinessAsset.artifactType !== expectedAsset.artifactType
  ) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Expected output does not belong to the exact approved work item and planned asset manifest.',
      409,
    )
  }

  if (
    workItem.approvedProviderRoute !== undefined ||
    workItem.providerExecutionMode !== 'none'
  ) {
    throw new ApiError(
      'PROVIDER_ROUTE_BLOCKED',
      'Controlled tool dispatch cannot carry or invoke an approved provider route.',
      409,
    )
  }
  const exactPrivateRemotionPreview =
    workItem.workerClass === 'render_worker' &&
    workItem.workItemType === 'render_remotion_preview' &&
    expectedAsset.assetRole === 'preview' &&
    expectedAsset.contentType === 'video/mp4' &&
    workItem.approvedToolIds.length === 1 && workItem.approvedToolIds[0] === 'remotion' &&
    body.operationId === 'tool.remotion.render_approved_composition.v1' &&
    workItem.dependencyKeys.length === 0 && workItem.sourceSequenceItemIds.length === 0
  const exactPrivateLibassCaptionOverlay =
    workItem.workerClass === 'render_worker' && workItem.workItemType === 'custom' &&
    expectedAsset.assetRole === 'processed' && expectedAsset.contentType === 'image/png' &&
    workItem.approvedToolIds.length === 1 && workItem.approvedToolIds[0] === 'libass' &&
    body.operationId === 'tool.libass.render_approved_caption_track.v1' &&
    workItem.dependencyKeys.length === 0 && workItem.sourceSequenceItemIds.length === 0
  const finalCompositionStructuredPayload = workItem.executionInput.structuredPayload as
    | Record<string, unknown>
    | undefined
  const finalCompositionCaptionCueCount = Array.isArray(
    finalCompositionStructuredPayload?.captionOverlayCues,
  )
    ? finalCompositionStructuredPayload.captionOverlayCues.length
    : 1
  const finalCompositionVoiceTrackCount =
    finalCompositionStructuredPayload?.audioPolicy === 'replace_with_approved_voice_tracks' &&
    Array.isArray(finalCompositionStructuredPayload.voiceTracks)
      ? finalCompositionStructuredPayload.voiceTracks.length
      : 0
  const finalCompositionColorSourceCount =
    finalCompositionStructuredPayload?.sourceMediaPolicy ===
      'approved_professional_color_intermediate_v1'
      ? workItem.sourceSequenceItemIds.length
      : 0
  const compositionChunkAuthority = workItem.executionInput.chunkAuthority as
    | Record<string, unknown>
    | undefined
  const sourceSliceChunkProfile = compositionChunkAuthority?.profileId ===
    CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID ||
    compositionChunkAuthority?.profileId ===
      CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID
  const sourceBoundaryChunkProfile = compositionChunkAuthority?.profileId ===
    CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID
  const exactPrivateRemotionCompositionChunk =
    workItem.workerClass === 'render_worker' && workItem.workItemType === 'custom' &&
    workItem.executionInput.operation === 'render_approved_4k_composition_chunk' &&
    expectedAsset.assetRole === 'processed' && expectedAsset.contentType === 'video/mp4' &&
    expectedAsset.artifactType === 'private_4k_composition_chunk_v1' &&
    workItem.approvedToolIds.length === 1 && workItem.approvedToolIds[0] === 'remotion' &&
    body.operationId === 'tool.remotion.render_approved_composition.v1' &&
    (sourceBoundaryChunkProfile || sourceSliceChunkProfile) &&
    Number.isSafeInteger(compositionChunkAuthority?.chunkIndex) &&
    Number.isSafeInteger(compositionChunkAuthority?.chunkCount) &&
    Number(compositionChunkAuthority?.chunkIndex) >= 1 &&
    Number(compositionChunkAuthority?.chunkIndex) <= Number(compositionChunkAuthority?.chunkCount) &&
    Number(compositionChunkAuthority?.chunkCount) >= 2 &&
    Number(compositionChunkAuthority?.chunkCount) <= (sourceSliceChunkProfile
      ? CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_CHUNKS
      : 8) &&
    (!sourceSliceChunkProfile || (
      Number.isSafeInteger(compositionChunkAuthority?.sourceStartFrame) &&
      Number.isSafeInteger(compositionChunkAuthority?.sourceEndFrameExclusive) &&
      Number(compositionChunkAuthority?.sourceStartFrame) >= 0 &&
      Number(compositionChunkAuthority?.sourceEndFrameExclusive) -
        Number(compositionChunkAuthority?.sourceStartFrame) ===
        Number(compositionChunkAuthority?.durationFrames) &&
      compositionChunkAuthority?.sourceSliceKey ===
        `source-slice-${String(compositionChunkAuthority?.chunkIndex)}-of-${String(compositionChunkAuthority?.chunkCount)}`
    )) &&
    compositionChunkAuthority?.outputKey === expectedAsset.outputKey &&
    finalCompositionCaptionCueCount >= 1 && finalCompositionCaptionCueCount <= 7 &&
    workItem.dependencyKeys.length ===
      1 + finalCompositionCaptionCueCount + finalCompositionVoiceTrackCount +
        finalCompositionColorSourceCount &&
    (finalCompositionVoiceTrackCount === 0 ||
      finalCompositionVoiceTrackCount === workItem.sourceSequenceItemIds.length) &&
    (finalCompositionColorSourceCount === 0 || (
      finalCompositionColorSourceCount === workItem.sourceSequenceItemIds.length &&
      finalCompositionVoiceTrackCount === workItem.sourceSequenceItemIds.length
    )) &&
    workItem.sourceSequenceItemIds.length >= 1 &&
    workItem.sourceSequenceItemIds.length <= 8 &&
    workItem.sourceCleanupDecisionIds.length === workItem.sourceSequenceItemIds.length
  const longFormMergeChunks = Array.isArray(finalCompositionStructuredPayload?.chunks)
    ? finalCompositionStructuredPayload.chunks
    : []
  const exactPrivateRemotionLongFormMerge =
    workItem.workerClass === 'render_worker' && workItem.workItemType === 'render_final_export' &&
    workItem.executionInput.operation === 'merge_approved_4k_composition_chunks' &&
    expectedAsset.assetRole === 'final' && expectedAsset.contentType === 'video/mp4' &&
    workItem.approvedToolIds.length === 1 && workItem.approvedToolIds[0] === 'remotion' &&
    body.operationId === 'tool.remotion.render_approved_composition.v1' &&
    finalCompositionStructuredPayload?.compositionProfileId ===
      'approved_4k_composition_chunk_merge_final_v1' &&
    (finalCompositionStructuredPayload?.longFormCapacityProfileId ===
      CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID ||
      finalCompositionStructuredPayload?.longFormCapacityProfileId ===
        CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID) &&
    longFormMergeChunks.length >= 2 &&
    longFormMergeChunks.length <= (
      finalCompositionStructuredPayload?.longFormCapacityProfileId ===
        CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID
        ? CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_CHUNKS
        : 8
    ) &&
    workItem.dependencyKeys.length === longFormMergeChunks.length &&
    workItem.sourceSequenceItemIds.length >= (
      finalCompositionStructuredPayload?.longFormCapacityProfileId ===
        CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID
        ? 1
        : 2
    ) &&
    workItem.sourceSequenceItemIds.length <= 8 &&
    workItem.sourceCleanupDecisionIds.length === workItem.sourceSequenceItemIds.length
  const exactPrivateRemotionFinalComposition =
    workItem.workerClass === 'render_worker' && workItem.workItemType === 'render_final_export' &&
    typeof workItem.executionInput.operation === 'string' &&
    DIRECT_FINAL_COMPOSITION_OPERATIONS.has(workItem.executionInput.operation) &&
    expectedAsset.assetRole === 'final' && expectedAsset.contentType === 'video/mp4' &&
    workItem.approvedToolIds.length === 1 && workItem.approvedToolIds[0] === 'remotion' &&
    body.operationId === 'tool.remotion.render_approved_composition.v1' &&
    finalCompositionCaptionCueCount >= 1 && finalCompositionCaptionCueCount <= 7 &&
    workItem.dependencyKeys.length ===
      1 + finalCompositionCaptionCueCount + finalCompositionVoiceTrackCount +
        finalCompositionColorSourceCount &&
    (finalCompositionVoiceTrackCount === 0 ||
      finalCompositionVoiceTrackCount === workItem.sourceSequenceItemIds.length) &&
    (finalCompositionColorSourceCount === 0 || (
      finalCompositionColorSourceCount === workItem.sourceSequenceItemIds.length &&
      finalCompositionVoiceTrackCount === workItem.sourceSequenceItemIds.length
    )) &&
    workItem.sourceSequenceItemIds.length >= 1 &&
    workItem.sourceSequenceItemIds.length <= 8 &&
    workItem.sourceCleanupDecisionIds.length === workItem.sourceSequenceItemIds.length
  let exactPrivateFfmpegMezzanineFinalization = false
  if (
    workItem.workerClass === 'render_worker' &&
    workItem.workItemType === 'render_final_export' &&
    workItem.executionInput.operation ===
      'finalize_approved_4k_mezzanine_chunks' &&
    expectedAsset.assetRole === 'final' &&
    expectedAsset.contentType === 'video/mp4' &&
    workItem.approvedToolIds.length === 1 &&
    workItem.approvedToolIds[0] === 'ffmpeg' &&
    body.operationId === 'tool.ffmpeg.execute_approved_media_recipe.v1'
  ) {
    const finalizerPayload =
      validateOfflineMediaBinaryMezzanineFinalizationPlanningPayload(
        workItem.executionInput.structuredPayload,
      )
    exactPrivateFfmpegMezzanineFinalization =
      finalizerPayload.capacityProfileId ===
        CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID &&
      finalizerPayload.chunks.length >= 2 &&
      finalizerPayload.chunks.length <=
        CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_CHUNKS &&
      workItem.dependencyKeys.length === finalizerPayload.chunks.length + 1 &&
      workItem.dependencyKeys[0] === 'source-trim-validation' &&
      workItem.sourceSequenceItemIds.length === 1 &&
      workItem.sourceSequenceItemIds[0] ===
        finalizerPayload.sourceSequenceItemId &&
      workItem.sourceCleanupDecisionIds.length === 1 &&
      workItem.sourceCleanupDecisionIds[0] ===
        finalizerPayload.sourceCleanupDecisionId
  }
  if (
    !exactPrivateRemotionPreview && !exactPrivateLibassCaptionOverlay &&
    !exactPrivateRemotionCompositionChunk && !exactPrivateRemotionLongFormMerge &&
    !exactPrivateRemotionFinalComposition &&
    !exactPrivateFfmpegMezzanineFinalization && (
      workItem.workerClass === 'render_worker' ||
      ['render_remotion_preview', 'render_final_export'].includes(workItem.workItemType) ||
      ['preview', 'final'].includes(expectedAsset.assetRole)
    )
  ) {
    throw new ApiError(
      'RENDER_NOT_READY',
      'Tool dispatch cannot authorize preview, final render, export, or render-worker execution.',
      409,
    )
  }

  const remainingReservedCredits = authority.reservation.reservedCredits -
    authority.reservation.spentCredits -
    authority.reservation.releasedCredits -
    authority.reservation.refundedCredits
  if (
    !['reserved', 'partially_spent'].includes(authority.reservation.status) ||
    authority.reservation.id !== readiness.reservation.reservationId ||
    remainingReservedCredits !== readiness.reservation.remainingReservedCredits ||
    remainingReservedCredits <= 0 ||
    workItem.maximumCreditBudget <= 0 ||
    workItem.maximumCreditBudget > remainingReservedCredits ||
    Date.parse(authority.reservation.expiresAt) <= Date.now()
  ) {
    throw new ApiError(
      'CREDITS_NOT_RESERVED',
      'Exact approved work-item budget is not covered by an active funded reservation.',
      409,
    )
  }
  return { workItem, job, expectedAsset, remainingReservedCredits }
}

function resolveAndVerifyToolContract(
  body: AuthorizeCanonicalPrivateToolDispatchInput,
  workItem: CanonicalApprovedExecutionWorkItem,
): { spec: ProfessionalToolOperationSpec; specHash: string } {
  const normalizedRequestedName = normalizeProfessionalToolOperationAlias(body.requestedToolName)
  const matchingCanonicalIds = new Set(listCompleteProfessionalToolOperationSpecs()
    .filter((candidate) => candidate.aliases.some((alias) =>
      normalizeProfessionalToolOperationAlias(alias) === normalizedRequestedName))
    .map((candidate) => candidate.canonicalToolId))
  const spec = resolveCompleteProfessionalToolOperationSpec(body.requestedToolName)
  if (!normalizedRequestedName || !spec || matchingCanonicalIds.size !== 1) {
    throw new ApiError('TOOL_NOT_READY', 'Requested tool identity is unknown or ambiguous.', 409)
  }
  if (spec.disposition !== 'edit_operation_candidate' || spec.policyBlocks.length > 0) {
    throw new ApiError('TOOL_NOT_READY', 'Requested tool is not callable for an approved edit operation.', 409, {
      canonicalToolId: spec.canonicalToolId,
      policyBlocks: [...spec.policyBlocks],
    })
  }
  if (!workItem.approvedToolIds.includes(spec.canonicalToolId)) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Resolved canonical tool is not approved for this exact immutable work item.',
      409,
      { canonicalToolId: spec.canonicalToolId },
    )
  }
  if (!spec.allowedOperationIds.includes(body.operationId)) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Requested operation is not the fixed operation declared by the canonical tool contract.',
      409,
    )
  }
  const approvedOperationIds = approvedOperationIdsFromExecutionInput(workItem.executionInput)
  if (!approvedOperationIds.includes(body.operationId)) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'The immutable approved work item does not freeze this exact tool operation identity.',
      409,
      { requiredGate: 'approved_work_item_exact_tool_operation_id' },
    )
  }
  validateCanonicalToolWorkItemPayload({
    spec,
    workItem,
  })
  return { spec, specHash: sha256AuthorityValue(spec) }
}

function resolveRuntimeEvidence(spec: ProfessionalToolOperationSpec): {
  authorityHash: string
  recordHash: string
  record: ProductionToolRuntimeEvidenceRecord
} {
  const report = createToolRuntimeEvidenceAuthority({ probeMode: 'disabled' })
  const verification = verifyToolRuntimeEvidenceAuthority(report)
  if (!verification.valid) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Tool runtime evidence authority did not pass its fail-closed integrity verification.',
      409,
      { issues: verification.issues },
    )
  }
  const record = report.records.find((candidate) => candidate.toolId === spec.canonicalToolId)
  if (!record) throw new ApiError('TOOL_NOT_READY', 'Canonical tool has no runtime evidence record.', 409)
  return {
    authorityHash: sha256AuthorityValue({
      domain: 'canonical_tool_dispatch_runtime_evidence_semantics_v1',
      report: stripRuntimeEvidenceObservationTimestamps(report),
    }),
    recordHash: sha256AuthorityValue(stripRuntimeEvidenceObservationTimestamps(record)),
    record,
  }
}

function stripRuntimeEvidenceObservationTimestamps(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stripRuntimeEvidenceObservationTimestamps(entry))
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== 'checkedAt' && key !== 'authorityHash')
        .map(([key, entry]) => [key, stripRuntimeEvidenceObservationTimestamps(entry)]),
    )
  }
  return value
}

interface PrivateInternalRuntimeEvidence {
  authorityHash: string
  imageIdentityHash: string
  ready: boolean
}

async function resolvePrivateInternalRuntimeEvidence(
  spec: ProfessionalToolOperationSpec,
): Promise<PrivateInternalRuntimeEvidence> {
  const missing = {
    authorityHash: sha256AuthorityValue({
      domain: 'offline_node_structured_runtime_authority_absent_v1',
      toolId: spec.canonicalToolId,
      operationId: spec.allowedOperationIds[0],
    }),
    imageIdentityHash: sha256AuthorityValue({
      domain: 'offline_node_structured_runtime_image_absent_v1',
      toolId: spec.canonicalToolId,
    }),
    ready: false,
  }
  const authority = await readPersistedOfflineNodeStructuredRuntimeAuthority()
  if (authority) {
    const exactOperationSupported = authority.supportedOperations.some((candidate) =>
      candidate.toolId === spec.canonicalToolId &&
      candidate.operationId === spec.allowedOperationIds[0])
    if (exactOperationSupported) {
      return {
        authorityHash: authority.authorityHash,
        imageIdentityHash: authority.image.imageIdentityHash,
        ready:
          authority.readiness.privateInternalExecutionReady === true &&
          authority.readiness.exactStructuredPayloadOnly === true &&
          authority.readiness.canonicalDispatchMayReference === true &&
          authority.readiness.productReady === false &&
          authority.readiness.externalBetaReady === false &&
          authority.readiness.productionReady === false,
      }
    }
  }
  const pythonAuthority = await readPersistedOfflinePythonStructuredRuntimeAuthority()
  if (pythonAuthority) {
    const pythonOperationSupported = pythonAuthority.supportedOperations.some((candidate) =>
      candidate.toolId === spec.canonicalToolId &&
      candidate.operationId === spec.allowedOperationIds[0])
    if (pythonOperationSupported) {
      return {
        authorityHash: pythonAuthority.authorityHash,
        imageIdentityHash: pythonAuthority.image.imageIdentityHash,
        ready:
          pythonAuthority.readiness.privateInternalExecutionReady === true &&
          pythonAuthority.readiness.exactStructuredPayloadOnly === true &&
          pythonAuthority.readiness.canonicalDispatchMayReference === true &&
          pythonAuthority.readiness.productReady === false &&
          pythonAuthority.readiness.externalBetaReady === false &&
          pythonAuthority.readiness.productionReady === false,
      }
    }
  }
  const mediaAuthority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
  if (mediaAuthority) {
    const mediaOperationSupported = mediaAuthority.supportedOperations.some((candidate) =>
      candidate.toolId === spec.canonicalToolId && candidate.operationId === spec.allowedOperationIds[0])
    if (mediaOperationSupported) return {
      authorityHash: mediaAuthority.authorityHash,
      imageIdentityHash: mediaAuthority.image.imageIdentityHash,
      ready:
        mediaAuthority.readiness.privateInternalExecutionReady === true &&
        mediaAuthority.readiness.exactStructuredPayloadOnly === true &&
        mediaAuthority.readiness.canonicalDispatchMayReference === true &&
        mediaAuthority.readiness.productReady === false &&
        mediaAuthority.readiness.externalBetaReady === false &&
        mediaAuthority.readiness.productionReady === false &&
        mediaAuthority.readiness.finalExportReady === false,
    }
  }
  const remotionAuthority = await readPersistedOfflineRemotionRenderRuntimeAuthority()
  if (remotionAuthority) {
    const remotionOperationSupported = remotionAuthority.supportedOperations.some((candidate) =>
      candidate.toolId === spec.canonicalToolId && candidate.operationId === spec.allowedOperationIds[0])
    if (remotionOperationSupported) return {
      authorityHash: remotionAuthority.authorityHash,
      imageIdentityHash: remotionAuthority.image.imageIdentityHash,
      ready:
        remotionAuthority.readiness.privateInternalExecutionReady === true &&
        remotionAuthority.readiness.exactStructuredPayloadOnly === true &&
        remotionAuthority.readiness.canonicalDispatchMayReference === true &&
        remotionAuthority.readiness.productReady === false &&
        remotionAuthority.readiness.externalBetaReady === false &&
        remotionAuthority.readiness.productionReady === false &&
        remotionAuthority.readiness.privateInternalFinalCompositionReady === true &&
        remotionAuthority.readiness.finalExportReady === false,
    }
  }
  const browserGraphicsAuthority = await readPersistedOfflineBrowserGraphicsRuntimeAuthority()
  if (browserGraphicsAuthority) {
    const browserOperationSupported = browserGraphicsAuthority.supportedOperations.some((candidate) =>
      candidate.toolId === spec.canonicalToolId && candidate.operationId === spec.allowedOperationIds[0])
    if (browserOperationSupported) return {
      authorityHash: browserGraphicsAuthority.authorityHash,
      imageIdentityHash: browserGraphicsAuthority.image.imageIdentityHash,
      ready:
        browserGraphicsAuthority.readiness.privateInternalExecutionReady === true &&
        browserGraphicsAuthority.readiness.exactStructuredPayloadOnly === true &&
        browserGraphicsAuthority.readiness.canonicalDispatchMayReference === true &&
        browserGraphicsAuthority.readiness.productReady === false &&
        browserGraphicsAuthority.readiness.externalBetaReady === false &&
        browserGraphicsAuthority.readiness.productionReady === false,
    }
  }
  const aiCapabilityAuthority = await readPersistedOfflineAiCapabilityRuntimeAuthority()
  if (aiCapabilityAuthority) {
    const operationSupported = aiCapabilityAuthority.supportedOperations.some((candidate) =>
      candidate.toolId === spec.canonicalToolId && candidate.operationId === spec.allowedOperationIds[0])
    if (operationSupported) return {
      authorityHash: aiCapabilityAuthority.authorityHash,
      imageIdentityHash: aiCapabilityAuthority.image.imageIdentityHash,
      ready:
        aiCapabilityAuthority.readiness.privateInternalExecutionReady === true &&
        aiCapabilityAuthority.readiness.exactStructuredPayloadOnly === true &&
        aiCapabilityAuthority.readiness.canonicalDispatchMayReference === true &&
        aiCapabilityAuthority.readiness.modelWeightsLoaded === false &&
        aiCapabilityAuthority.readiness.productReady === false &&
        aiCapabilityAuthority.readiness.externalBetaReady === false &&
        aiCapabilityAuthority.readiness.productionReady === false,
    }
  }
  const nativeImageAuthority = await readPersistedOfflineNativeImagePipelineRuntimeAuthority()
  if (nativeImageAuthority) {
    const operationSupported = nativeImageAuthority.supportedOperations.some((candidate) =>
      candidate.toolId === spec.canonicalToolId && candidate.operationId === spec.allowedOperationIds[0])
    if (operationSupported) return {
      authorityHash: nativeImageAuthority.authorityHash,
      imageIdentityHash: nativeImageAuthority.image.imageIdentityHash,
      ready:
        nativeImageAuthority.readiness.privateInternalExecutionReady === true &&
        nativeImageAuthority.readiness.exactStructuredPayloadOnly === true &&
        nativeImageAuthority.readiness.canonicalDispatchMayReference === true &&
        nativeImageAuthority.readiness.licenseReviewStillRequiredForProduction === true &&
        nativeImageAuthority.readiness.productReady === false &&
        nativeImageAuthority.readiness.externalBetaReady === false &&
        nativeImageAuthority.readiness.productionReady === false,
    }
  }
  const nativeAudioAuthority = await readPersistedOfflineNativeAudioProcessingRuntimeAuthority()
  if (nativeAudioAuthority) {
    const operationSupported = nativeAudioAuthority.supportedOperations.some((candidate) =>
      candidate.toolId === spec.canonicalToolId && candidate.operationId === spec.allowedOperationIds[0])
    if (operationSupported) return {
      authorityHash: nativeAudioAuthority.authorityHash,
      imageIdentityHash: nativeAudioAuthority.image.imageIdentityHash,
      ready:
        nativeAudioAuthority.readiness.privateInternalExecutionReady === true &&
        nativeAudioAuthority.readiness.exactStructuredPayloadOnly === true &&
        nativeAudioAuthority.readiness.canonicalDispatchMayReference === true &&
        nativeAudioAuthority.readiness.licenseReviewStillRequiredForProduction === true &&
        nativeAudioAuthority.readiness.productReady === false &&
        nativeAudioAuthority.readiness.externalBetaReady === false &&
        nativeAudioAuthority.readiness.productionReady === false,
    }
  }
  const packagingAuthority = await readPersistedOfflineContainerPackagingValidationRuntimeAuthority()
  if (packagingAuthority) {
    const operationSupported = packagingAuthority.supportedOperations.some((candidate) =>
      candidate.toolId === spec.canonicalToolId && candidate.operationId === spec.allowedOperationIds[0])
    if (operationSupported) return {
      authorityHash: packagingAuthority.authorityHash,
      imageIdentityHash: packagingAuthority.image.imageIdentityHash,
      ready:
        packagingAuthority.readiness.privateInternalExecutionReady === true &&
        packagingAuthority.readiness.exactStructuredPayloadOnly === true &&
        packagingAuthority.readiness.canonicalDispatchMayReference === true &&
        packagingAuthority.readiness.licenseReviewStillRequiredForProduction === true &&
        packagingAuthority.readiness.productReady === false &&
        packagingAuthority.readiness.externalBetaReady === false &&
        packagingAuthority.readiness.productionReady === false,
    }
  }
  const vapourSynthAuthority = await readPersistedOfflineVapourSynthFramePipelineRuntimeAuthority()
  if (vapourSynthAuthority) {
    const operationSupported = vapourSynthAuthority.supportedOperations.some((candidate) =>
      candidate.toolId === spec.canonicalToolId && candidate.operationId === spec.allowedOperationIds[0])
    if (operationSupported) return {
      authorityHash: vapourSynthAuthority.authorityHash,
      imageIdentityHash: vapourSynthAuthority.image.imageIdentityHash,
      ready:
        vapourSynthAuthority.readiness.privateInternalExecutionReady === true &&
        vapourSynthAuthority.readiness.exactStructuredPayloadOnly === true &&
        vapourSynthAuthority.readiness.canonicalDispatchMayReference === true &&
        vapourSynthAuthority.readiness.licenseReviewStillRequiredForProduction === true &&
        vapourSynthAuthority.readiness.productReady === false &&
        vapourSynthAuthority.readiness.externalBetaReady === false &&
        vapourSynthAuthority.readiness.productionReady === false,
    }
  }
  const audioFluxAuthority = await readPersistedOfflineAudioFluxAnalysisRuntimeAuthority()
  if (audioFluxAuthority) {
    const operationSupported = audioFluxAuthority.supportedOperations.some((candidate) =>
      candidate.toolId === spec.canonicalToolId && candidate.operationId === spec.allowedOperationIds[0])
    if (operationSupported) return {
      authorityHash: audioFluxAuthority.authorityHash,
      imageIdentityHash: audioFluxAuthority.image.imageIdentityHash,
      ready:
        audioFluxAuthority.readiness.privateInternalExecutionReady === true &&
        audioFluxAuthority.readiness.exactStructuredPayloadOnly === true &&
        audioFluxAuthority.readiness.canonicalDispatchMayReference === true &&
        audioFluxAuthority.readiness.licenseReviewStillRequiredForProduction === true &&
        audioFluxAuthority.readiness.productReady === false &&
        audioFluxAuthority.readiness.externalBetaReady === false &&
        audioFluxAuthority.readiness.productionReady === false,
    }
  }
  const rembgAuthority = await readPersistedOfflineRembgBackgroundRemovalRuntimeAuthority()
  if (rembgAuthority) {
    const operationSupported = rembgAuthority.supportedOperations.some((candidate) =>
      candidate.toolId === spec.canonicalToolId && candidate.operationId === spec.allowedOperationIds[0])
    if (operationSupported) return {
      authorityHash: rembgAuthority.authorityHash,
      imageIdentityHash: rembgAuthority.image.imageIdentityHash,
      ready:
        rembgAuthority.readiness.privateInternalExecutionReady === true &&
        rembgAuthority.readiness.exactStructuredPayloadOnly === true &&
        rembgAuthority.readiness.canonicalDispatchMayReference === true &&
        rembgAuthority.readiness.licenseReviewStillRequiredForProduction === true &&
        rembgAuthority.readiness.productReady === false &&
        rembgAuthority.readiness.externalBetaReady === false &&
        rembgAuthority.readiness.productionReady === false,
    }
  }
  const deepFilterNetAuthority = await readPersistedOfflineDeepFilterNetVoiceCleanupRuntimeAuthority()
  if (deepFilterNetAuthority) {
    const operationSupported = deepFilterNetAuthority.supportedOperations.some((candidate) =>
      candidate.toolId === spec.canonicalToolId && candidate.operationId === spec.allowedOperationIds[0])
    if (operationSupported) return {
      authorityHash: deepFilterNetAuthority.authorityHash,
      imageIdentityHash: deepFilterNetAuthority.image.imageIdentityHash,
      ready:
        deepFilterNetAuthority.readiness.privateInternalExecutionReady === true &&
        deepFilterNetAuthority.readiness.exactStructuredPayloadOnly === true &&
        deepFilterNetAuthority.readiness.canonicalDispatchMayReference === true &&
        deepFilterNetAuthority.readiness.modelAndLicenseReviewStillRequiredForProduction === true &&
        deepFilterNetAuthority.readiness.productReady === false &&
        deepFilterNetAuthority.readiness.externalBetaReady === false &&
        deepFilterNetAuthority.readiness.productionReady === false,
    }
  }
  const libassAuthority = await readPersistedOfflineLibassRuntimeAuthority()
  if (!libassAuthority) return missing
  const libassOperationSupported = libassAuthority.supportedOperations.some((candidate) =>
    candidate.toolId === spec.canonicalToolId && candidate.operationId === spec.allowedOperationIds[0])
  return {
    authorityHash: libassAuthority.authorityHash,
    imageIdentityHash: libassAuthority.image.imageIdentityHash,
    ready:
      libassAuthority.readiness.privateInternalExecutionReady === true &&
      libassAuthority.readiness.exactStructuredPayloadOnly === true &&
      libassAuthority.readiness.canonicalDispatchMayReference === true &&
      libassAuthority.readiness.productReady === false &&
      libassAuthority.readiness.externalBetaReady === false &&
      libassAuthority.readiness.productionReady === false &&
      libassAuthority.readiness.fullTrackOrVideoBurnInReady === false &&
      libassOperationSupported,
  }
}

function privateInternalDispatchBlockers(
  spec: ProfessionalToolOperationSpec,
  runtime: PrivateInternalRuntimeEvidence,
): string[] {
  const blockers = [
    ...(!specClaimsPrivateInternalReady(spec)
      ? ['tool_operation_spec_not_private_internal_ready']
      : []),
    ...(!runtime.ready ? ['private_structured_runtime_authority_absent'] : []),
  ]
  return [...new Set(blockers)]
}

function specClaimsPrivateInternalReady(spec: ProfessionalToolOperationSpec): boolean {
  return spec.privateInternalExecutionReady === true &&
    spec.runnerTestEvidenceStatus === 'private_internal_verified' &&
    spec.entrypoint.implementationStatus === 'private_internal_runner_verified'
}

function specClaimsProductReady(spec: ProfessionalToolOperationSpec): boolean {
  return booleanField(spec, 'productReady') &&
    stringField(spec, 'runnerTestEvidenceStatus') === 'verified'
}

function runtimeClaimsProductReady(record: ProductionToolRuntimeEvidenceRecord): boolean {
  return booleanField(record.productionReadiness, 'productionReady') &&
    booleanField(record.configuration, 'productionBuildConfigurationVerified') &&
    booleanField(record.configuration, 'deployedConfigurationVerified') &&
    booleanField(record.credential, 'backendServiceIdentityVerified') &&
    booleanField(record.credential, 'privateStorageIdentityVerified') &&
    booleanField(record.network, 'sandboxEgressPolicyVerified') &&
    booleanField(record.execution, 'approvedSnapshotExecutionBindingVerified') &&
    booleanField(record.execution, 'opaqueWorkerLeaseVerified') &&
    booleanField(record.execution, 'privateArtifactExecutionVerified') &&
    booleanField(record.execution, 'actualToolOperationVerified') &&
    booleanField(record.qa, 'runtimeQaExecuted') &&
    booleanField(record.qa, 'qaArtifactLineageVerified') &&
    booleanField(record.cost, 'approvedEstimateBindingVerified') &&
    booleanField(record.cost, 'activeReservationBindingVerified') &&
    booleanField(record.cost, 'actualCostEventVerified')
}

function approvedOperationIdsFromExecutionInput(value: Record<string, unknown>): string[] {
  const identifiers = Array.isArray(value.approvedToolOperationIds)
    ? value.approvedToolOperationIds.filter((candidate): candidate is string => typeof candidate === 'string')
    : []
  return [...new Set(identifiers)]
}

function ensureAuthorizationCapacity(input: {
  grants: CanonicalPrivateToolDispatchRecord[]
  idempotencyRecords: unknown[]
  auditEvents: unknown[]
}): void {
  if (
    input.grants.length >= MAX_CANONICAL_PRIVATE_TOOL_DISPATCH_GRANTS ||
    input.idempotencyRecords.length >= MAX_CANONICAL_PRIVATE_TOOL_DISPATCH_IDEMPOTENCY_RECORDS ||
    input.auditEvents.length >= MAX_CANONICAL_PRIVATE_TOOL_DISPATCH_AUDIT_EVENTS
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CAPACITY_EXCEEDED',
      'Private canonical tool-dispatch authority reached its bounded record capacity.',
      503,
    )
  }
}

function ensureConsumptionCapacity(input: {
  idempotencyRecords: unknown[]
  auditEvents: unknown[]
}): void {
  if (
    input.idempotencyRecords.length >= MAX_CANONICAL_PRIVATE_TOOL_DISPATCH_IDEMPOTENCY_RECORDS ||
    input.auditEvents.length >= MAX_CANONICAL_PRIVATE_TOOL_DISPATCH_AUDIT_EVENTS
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CAPACITY_EXCEEDED',
      'Private canonical tool-dispatch authority has no room for an atomic terminal consumption record.',
      503,
    )
  }
}

function auditEvent(record: CanonicalPrivateToolDispatchRecord, timestamp: string) {
  return {
    id: `tool_dispatch_audit_${randomUUID()}`,
    eventType: record.status as 'authorized' | 'denied' | 'consumed' | 'expired',
    grantId: record.id,
    jobId: record.binding.jobId,
    approvedWorkItemId: record.binding.approvedWorkItemId,
    expectedAssetId: record.binding.expectedAssetId,
    canonicalToolId: record.binding.canonicalToolId,
    operationId: record.binding.operationId,
    leaseId: record.binding.leaseId,
    leaseAttemptNumber: record.binding.leaseAttemptNumber,
    createdAt: timestamp,
  }
}

function buildDispatchResponse(
  secret: string,
  record: CanonicalPrivateToolDispatchRecord,
): CanonicalPrivateToolDispatchResponse {
  const expiredWithoutConsumption = record.status === 'authorized' && Date.parse(record.expiresAt) <= Date.now()
  const effectiveStatus = expiredWithoutConsumption ? 'expired' as const : record.status
  const currentlyAuthorized = effectiveStatus === 'authorized'
  const credential = currentlyAuthorized ? deriveCredentialForStoredRecord(secret, record) : undefined
  const responseWithoutHash = {
    schemaVersion: CANONICAL_PRIVATE_TOOL_DISPATCH_RESPONSE_VERSION,
    source: 'canonical_private_tool_dispatch_authority' as const,
    purpose: 'private_internal_canonical_tool_dispatch_authorization' as const,
    grant: {
      grantId: record.id,
      status: effectiveStatus,
      binding: structuredClone(record.binding),
      blockers: [...record.blockers],
      issuedAt: record.issuedAt,
      expiresAt: record.expiresAt,
      singleUse: true as const,
      consumptionRequiredBeforeExecution: true as const,
      credentialIssued: currentlyAuthorized,
      immutableGrantHash: record.immutableGrantHash,
    },
    ...(credential ? { dispatchCredential: credential } : {}),
    evidence: {
      tenantAndCanonicalAuthority: 'passed' as const,
      activeOpaqueLease: 'passed' as const,
      fundedReservationAndBudget: 'passed' as const,
      exactWorkItemAndOutput: 'passed' as const,
      canonicalToolApproval: 'passed' as const,
      exactOperationContract: 'passed' as const,
      providerAndRenderBoundary: 'passed' as const,
      leaseDependencyAuthorityBinding: 'passed' as const,
      leaseExecutionFenceNotStarted: 'passed' as const,
      specProductReady: record.specProductReady,
      runtimeProductReady: record.runtimeProductReady,
      specPrivateInternalReady: record.specPrivateInternalReady,
      runtimePrivateInternalReady: record.runtimePrivateInternalReady,
      runtimeEvidenceAuthorityHash: record.runtimeEvidenceAuthorityHash,
      runtimeEvidenceRecordHash: record.runtimeEvidenceRecordHash,
      privateRuntimeAuthorityHash: record.privateRuntimeAuthorityHash,
      privateRuntimeImageIdentityHash: record.privateRuntimeImageIdentityHash,
      toolOperationSpecHash: record.toolOperationSpecHash,
      leaseCredentialReturned: false as const,
      leaseCredentialHashReturned: false as const,
      rawExecutionInputReturned: false as const,
      sourceLocationReturned: false as const,
      callerPathUrlCommandAccepted: false as const,
    },
    executionAuthority: {
      dispatchGrantRecorded: true as const,
      dispatchAuthorized: currentlyAuthorized,
      toolExecutionAuthorized: false as const,
      providerCallAuthorized: false as const,
      sourceObjectReadAuthorized: false as const,
      artifactWriteAuthorized: false as const,
      renderAuthorized: false as const,
      privatePreviewRenderAuthorized: false as const,
      privateCaptionRenderAuthorized: false as const,
      privateFinalCompositionAuthorized: false as const,
      privateCompositionChunkAuthorized: false as const,
      creditSpendAuthorized: false as const,
      walletMutationAuthorized: false as const,
      settlementAuthorized: false as const,
      noExecutionSideEffects: true as const,
    },
    persistenceEvidence: {
      privateSingleHostOnly: true as const,
      checksumProtected: true as const,
      credentialStoredAsSha256Only: true as const,
      oneActiveGrantPerExactBinding: true as const,
      dependencyAuthorityCommittedToGrant: true as const,
      notStartedExecutionFenceCommittedToGrant: true as const,
      distributedAuthority: false as const,
      productionAuthority: false as const,
    },
    testOnly: true as const,
  }
  return canonicalPrivateToolDispatchResponseSchema.parse({
    ...responseWithoutHash,
    responseHash: sha256AuthorityValue(responseWithoutHash),
  })
}

function buildConsumptionResponse(
  record: CanonicalPrivateToolDispatchRecord,
  consumptionReplayed: boolean,
): CanonicalPrivateToolDispatchConsumptionResponse {
  if (record.status !== 'consumed' || !record.consumedAt) {
    throw invalidDispatchAuthority('Dispatch consumption response requires one consumed grant.')
  }
  const responseWithoutHash = {
    schemaVersion: CANONICAL_PRIVATE_TOOL_DISPATCH_RESPONSE_VERSION,
    source: 'canonical_private_tool_dispatch_authority' as const,
    purpose: 'private_internal_canonical_tool_dispatch_consume' as const,
    consumed: true as const,
    consumedAt: record.consumedAt,
    executionAttemptId: record.id,
    consumptionReplayed,
    grant: {
      grantId: record.id,
      status: 'consumed' as const,
      binding: structuredClone(record.binding),
      issuedAt: record.issuedAt,
      expiresAt: record.expiresAt,
      immutableGrantHash: record.immutableGrantHash,
      singleUse: true as const,
      credentialReturned: false as const,
    },
    verificationEvidence: {
      tenantAndCanonicalAuthority: 'passed' as const,
      activeOpaqueLease: 'passed' as const,
      timingSafeDispatchCredentialMatch: 'passed' as const,
      immutableGrantHash: 'passed' as const,
      exactWorkItemOutputToolOperation: 'passed' as const,
      fundedReservationAndBudget: 'passed' as const,
      toolOperationSpecHash: 'passed' as const,
      runtimeEvidenceAuthorityHash: 'passed' as const,
      runtimeEvidenceRecordHash: 'passed' as const,
      privateRuntimeAuthorityHash: 'passed' as const,
      privateRuntimeImageIdentityHash: 'passed' as const,
      privateInternalReadiness: 'passed' as const,
      leaseDependencyAuthorityBinding: 'passed' as const,
      leaseExecutionFenceNotStarted: 'passed' as const,
      atomicSingleUseTransition: 'passed' as const,
      leaseCredentialReturned: false as const,
      dispatchCredentialReturned: false as const,
      credentialHashReturned: false as const,
    },
    executionAuthority: {
      dispatchGrantConsumed: true as const,
      newExecutionStartAuthorized: !consumptionReplayed,
      resumeSameIdempotentAttemptOnly: consumptionReplayed,
      toolExecutionAuthorized: !consumptionReplayed,
      executionAttemptId: record.id,
      outputPromotionRequiresCreateOnlyAttemptId: true as const,
      costEventRequiresSameIdempotentAttemptId: true as const,
      providerCallAuthorized: false as const,
      sourceObjectReadAuthorized: false as const,
      artifactWriteAuthorized: false as const,
      renderAuthorized: false as const,
      privatePreviewRenderAuthorized:
        record.binding.canonicalToolId === 'remotion' &&
        record.binding.operationId === 'tool.remotion.render_approved_composition.v1' &&
        record.binding.expectedOutput.assetRole === 'preview',
      privateCaptionRenderAuthorized:
        record.binding.canonicalToolId === 'libass' &&
        record.binding.operationId === 'tool.libass.render_approved_caption_track.v1',
      privateFinalCompositionAuthorized:
        record.binding.expectedOutput.assetRole === 'final' && (
          (record.binding.canonicalToolId === 'remotion' &&
            record.binding.operationId ===
              'tool.remotion.render_approved_composition.v1') ||
          (record.binding.canonicalToolId === 'ffmpeg' &&
            record.binding.operationId ===
              'tool.ffmpeg.execute_approved_media_recipe.v1')
        ),
      privateCompositionChunkAuthorized:
        record.binding.canonicalToolId === 'remotion' &&
        record.binding.operationId === 'tool.remotion.render_approved_composition.v1' &&
        record.binding.expectedOutput.assetRole === 'processed',
      creditSpendAuthorized: false as const,
      walletMutationAuthorized: false as const,
      settlementAuthorized: false as const,
      toolExecutionPerformedByConsume: false as const,
    },
    testOnly: true as const,
  }
  return canonicalPrivateToolDispatchConsumptionResponseSchema.parse({
    ...responseWithoutHash,
    responseHash: sha256AuthorityValue(responseWithoutHash),
  })
}

function assertConsumableGrantIdentity(
  record: CanonicalPrivateToolDispatchRecord | undefined,
  body: ConsumeCanonicalPrivateToolDispatchInput,
  leaseId: string,
): asserts record is CanonicalPrivateToolDispatchRecord {
  if (
    !record ||
    !['authorized', 'consumed'].includes(record.status) ||
    record.binding.workspaceId !== body.workspaceId ||
    record.binding.projectId !== body.projectId ||
    record.binding.editSessionId !== body.editSessionId ||
    record.binding.jobId !== body.jobId ||
    record.binding.leaseId !== leaseId ||
    (record.status === 'authorized' && Date.parse(record.expiresAt) <= Date.now()) ||
    !record.credentialHashSha256 ||
    record.blockers.length > 0 ||
    !record.specPrivateInternalReady ||
    !record.runtimePrivateInternalReady ||
    !record.exactOperationApproved ||
    !record.offlineExecutionOnly
  ) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Canonical tool-dispatch grant is unavailable, denied, expired, or outside this exact identity.',
      409,
    )
  }
}

function verifyDispatchCredential(
  secret: string,
  record: CanonicalPrivateToolDispatchRecord,
  suppliedCredential: string,
): void {
  const derivedCredential = deriveCredentialForStoredRecord(secret, record)
  if (!timingSafeHashMatches(sha256Text(derivedCredential), sha256Text(suppliedCredential))) {
    throw new ApiError('TOOL_NOT_READY', 'Canonical tool-dispatch grant is unavailable or invalid.', 409)
  }
}

function assertCurrentGrantEvidence(input: {
  record: CanonicalPrivateToolDispatchRecord
  lease: LeaseVerification
  authority: CanonicalApprovedExecutionAuthority
  canonical: {
    workItem: CanonicalApprovedExecutionWorkItem
    expectedAsset: AuthorityPlannedAssetManifestEntry
    remainingReservedCredits: number
  }
  toolSpecHash: string
  runtimeEvidenceAuthorityHash: string
  runtimeEvidenceRecordHash: string
  privateRuntimeAuthorityHash: string
  privateRuntimeImageIdentityHash: string
  specPrivateInternalReady: boolean
  runtimePrivateInternalReady: boolean
  specProductReady: boolean
  runtimeProductReady: boolean
  allowConsumedReplay: boolean
}): void {
  const { immutableGrantHash, ...recordWithoutHash } = input.record
  if (
    immutableGrantHash !== canonicalPrivateToolDispatchImmutableHash(recordWithoutHash) ||
    input.record.authorityRevision !== input.authority.authorityRevision ||
    stableAuthorityStringify(input.record.canonicalHashes) !== stableAuthorityStringify(input.lease.canonicalHashes) ||
    stableAuthorityStringify(input.record.binding.leaseDependencyAuthority) !==
      stableAuthorityStringify(leaseDependencyAuthorityBinding(input.lease.dependencyAuthority)) ||
    (!input.allowConsumedReplay && input.lease.executionFence.state !== 'not_started') ||
    input.record.binding.leaseExecutionFenceState !== 'not_started' ||
    input.record.binding.approvedPlanSnapshotId !== input.authority.snapshot.snapshotId ||
    input.record.binding.approvedWorkItemId !== input.canonical.workItem.id ||
    input.record.binding.expectedAssetId !== input.canonical.expectedAsset.id ||
    input.record.binding.reservationId !== input.authority.reservation.id ||
    input.record.binding.maximumCreditBudget !== input.canonical.workItem.maximumCreditBudget ||
    input.canonical.remainingReservedCredits < input.record.binding.maximumCreditBudget ||
    input.record.toolOperationSpecHash !== input.toolSpecHash ||
    input.record.runtimeEvidenceAuthorityHash !== input.runtimeEvidenceAuthorityHash ||
    input.record.runtimeEvidenceRecordHash !== input.runtimeEvidenceRecordHash ||
    input.record.privateRuntimeAuthorityHash !== input.privateRuntimeAuthorityHash ||
    input.record.privateRuntimeImageIdentityHash !== input.privateRuntimeImageIdentityHash ||
    !input.specPrivateInternalReady ||
    !input.runtimePrivateInternalReady ||
    !input.record.specPrivateInternalReady ||
    !input.record.runtimePrivateInternalReady ||
    input.record.specProductReady !== input.specProductReady ||
    input.record.runtimeProductReady !== input.runtimeProductReady ||
    input.record.blockers.length > 0
  ) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Canonical tool-dispatch grant no longer matches live authority, runtime evidence, or budget.',
      409,
    )
  }
}

function deriveCredentialForStoredRecord(
  secret: string,
  record: CanonicalPrivateToolDispatchRecord,
): string {
  const credential = deriveDispatchCredential(secret, {
    grantId: record.id,
    binding: record.binding,
    authorityRevision: record.authorityRevision,
    canonicalHashes: record.canonicalHashes,
    toolOperationSpecHash: record.toolOperationSpecHash,
    runtimeEvidenceAuthorityHash: record.runtimeEvidenceAuthorityHash,
    runtimeEvidenceRecordHash: record.runtimeEvidenceRecordHash,
    privateRuntimeAuthorityHash: record.privateRuntimeAuthorityHash,
    privateRuntimeImageIdentityHash: record.privateRuntimeImageIdentityHash,
    specPrivateInternalReady: record.specPrivateInternalReady,
    runtimePrivateInternalReady: record.runtimePrivateInternalReady,
    issuedAt: record.issuedAt,
    expiresAt: record.expiresAt,
    decisionRequestHash: record.decisionRequestHash,
  })
  if (!record.credentialHashSha256 || !timingSafeHashMatches(sha256Text(credential), record.credentialHashSha256)) {
    throw invalidDispatchAuthority('Stored dispatch credential derivation is inconsistent.')
  }
  return credential
}

function deriveDispatchCredential(secret: string, value: unknown): string {
  return `rpdt_v1_${createHmac('sha256', secret)
    .update(DISPATCH_CREDENTIAL_DOMAIN)
    .update('\u0000')
    .update(stableAuthorityStringify(value))
    .digest('base64url')}`
}

function dispatchRequestHash(input: {
  actorUserId: string
  body: AuthorizeCanonicalPrivateToolDispatchInput
  leaseId: string
  leaseAttemptNumber: number
  leaseImmutableHash: string
  leaseDependencyAuthority: ReturnType<typeof leaseDependencyAuthorityBinding>
  leaseExecutionFenceState: 'not_started'
  canonicalHashes: CanonicalWorkerLeaseHashes
  toolOperationSpecHash: string
  privateRuntimeAuthorityHash: string
  privateRuntimeImageIdentityHash: string
  expectedAsset: AuthorityPlannedAssetManifestEntry
}): string {
  const bodyWithoutIdempotency = {
    workspaceId: input.body.workspaceId,
    projectId: input.body.projectId,
    editSessionId: input.body.editSessionId,
    jobId: input.body.jobId,
    approvedWorkItemId: input.body.approvedWorkItemId,
    expectedAssetId: input.body.expectedAssetId,
    requestedToolName: input.body.requestedToolName,
    operationId: input.body.operationId,
    purpose: input.body.purpose,
  }
  return sha256AuthorityValue({
    operation: 'authorize_canonical_private_tool_dispatch',
    actorUserId: input.actorUserId,
    request: bodyWithoutIdempotency,
    leaseId: input.leaseId,
    leaseAttemptNumber: input.leaseAttemptNumber,
    leaseImmutableHash: input.leaseImmutableHash,
    leaseDependencyAuthority: input.leaseDependencyAuthority,
    leaseExecutionFenceState: input.leaseExecutionFenceState,
    canonicalHashes: input.canonicalHashes,
    toolOperationSpecHash: input.toolOperationSpecHash,
    privateRuntimeAuthorityHash: input.privateRuntimeAuthorityHash,
    privateRuntimeImageIdentityHash: input.privateRuntimeImageIdentityHash,
    expectedOutput: safeExpectedOutputBinding(input.expectedAsset),
  })
}

function dispatchIdempotencyKeyHash(
  secret: string,
  operation: 'authorize' | 'consume',
  actorUserId: string,
  workspaceId: string,
  idempotencyKey: string,
): string {
  return createHmac('sha256', secret)
    .update(DISPATCH_IDEMPOTENCY_DOMAIN)
    .update('\u0000')
    .update(operation)
    .update('\u0000')
    .update(actorUserId)
    .update('\u0000')
    .update(workspaceId)
    .update('\u0000')
    .update(idempotencyKey)
    .digest('hex')
}

function boundedExpiry(issuedAt: string, upperBounds: string[]): string {
  const issuedAtMs = Date.parse(issuedAt)
  const expiresAtMs = Math.min(
    issuedAtMs + CANONICAL_PRIVATE_TOOL_DISPATCH_TTL_SECONDS * 1_000,
    ...upperBounds.map((value) => Date.parse(value)),
  )
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= issuedAtMs) {
    throw new ApiError('WORKER_LEASE_EXPIRED', 'No live lease/reservation window remains for dispatch.', 409)
  }
  return new Date(expiresAtMs).toISOString()
}

function canonicalHashesFromReadiness(readiness: ReadinessEnvelope): CanonicalWorkerLeaseHashes {
  return {
    snapshotHash: readiness.authorityHashes.snapshotHash,
    planHash: readiness.authorityHashes.planHash,
    estimateHash: readiness.authorityHashes.estimateHash,
    workGraphHash: readiness.authorityHashes.workGraphHash,
    sourceSequenceHash: readiness.authorityHashes.sourceSequenceHash,
    timingHash: readiness.authorityHashes.timingHash,
    planningInputBindingHash: readiness.authorityHashes.planningInputBindingHash,
    approvedSourceAssetManifestHash: readiness.authorityHashes.approvedSourceAssetManifestHash,
    approvedAssetManifestHash: readiness.authorityHashes.approvedAssetManifestHash,
    executionPackageHash: readiness.authorityHashes.executionPackageHash,
    jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash,
  }
}

function safeExpectedOutputBinding(entry: AuthorityPlannedAssetManifestEntry) {
  return {
    outputKey: entry.outputKey,
    artifactType: entry.artifactType,
    assetRole: entry.assetRole,
    required: entry.required,
    previewPlaceholderAllowed: entry.previewPlaceholderAllowed,
    ...(entry.contentType ? { contentType: entry.contentType } : {}),
    segmentIds: [...entry.segmentIds],
    timingIds: [...entry.timingIds],
    rendererLayerIds: [...entry.rendererLayerIds],
  }
}

function safeExpectedOutputBindingFromWorkItem(
  entry: CanonicalApprovedExecutionWorkItem['expectedOutputs'][number],
) {
  return {
    outputKey: entry.outputKey,
    artifactType: entry.artifactType,
    assetRole: entry.assetRole,
    required: entry.required,
    previewPlaceholderAllowed: entry.previewPlaceholderAllowed,
    ...(entry.contentType ? { contentType: entry.contentType } : {}),
    segmentIds: [...entry.segmentIds],
    timingIds: [...entry.timingIds],
    rendererLayerIds: [...entry.rendererLayerIds],
  }
}

function parseAuthorization(
  input: AuthorizeCanonicalPrivateToolDispatchInput,
): AuthorizeCanonicalPrivateToolDispatchInput {
  const parsed = authorizeCanonicalPrivateToolDispatchSchema.safeParse(input)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Canonical private tool-dispatch identity validation failed.',
      400,
      parsed.error.flatten(),
    )
  }
  return parsed.data
}

function parseServerLeaseAuthority(
  input: CanonicalPrivateToolDispatchLeaseAuthority,
): CanonicalPrivateToolDispatchLeaseAuthority {
  const parsed = canonicalPrivateToolDispatchLeaseAuthoritySchema.safeParse(input)
  if (!parsed.success) {
    throw new ApiError('WORKER_LEASE_EXPIRED', 'Server-injected private lease authority is invalid.', 409)
  }
  return parsed.data
}

function parseConsumption(
  input: ConsumeCanonicalPrivateToolDispatchInput,
): ConsumeCanonicalPrivateToolDispatchInput {
  const parsed = consumeCanonicalPrivateToolDispatchSchema.safeParse(input)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Canonical private tool-dispatch consumption identity validation failed.',
      400,
      parsed.error.flatten(),
    )
  }
  return parsed.data
}

function parseConsumptionAuthority(
  input: CanonicalPrivateToolDispatchConsumptionAuthority,
): CanonicalPrivateToolDispatchConsumptionAuthority {
  const parsed = canonicalPrivateToolDispatchConsumptionAuthoritySchema.safeParse(input)
  if (!parsed.success) {
    throw new ApiError('TOOL_NOT_READY', 'Server-injected dispatch-consumption authority is invalid.', 409)
  }
  return parsed.data
}

function requirePrivateDispatchRuntime(context: ServiceContext): string {
  if (!isExplicitLocalInternalTestRuntime(context.env)) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Canonical tool dispatch is blocked outside explicit private local/internal testing.',
      503,
      { requiredGate: 'distributed_transactional_dispatch_authority_and_service_identity' },
    )
  }
  const secret = context.env.internalServiceToken
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new ApiError('TOOL_NOT_READY', 'A strong server-only internal secret is required for dispatch authority.', 503)
  }
  return secret
}

function booleanField(value: unknown, key: string): boolean {
  if (!value || typeof value !== 'object') return false
  return (value as Record<string, unknown>)[key] === true
}

function stringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const result = (value as Record<string, unknown>)[key]
  return typeof result === 'string' ? result : undefined
}

function timingSafeHashMatches(leftHex: string, rightHex: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(leftHex) || !/^[a-f0-9]{64}$/.test(rightHex)) return false
  return timingSafeEqual(Buffer.from(leftHex, 'hex'), Buffer.from(rightHex, 'hex'))
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function invalidDispatchAuthority(message: string): ApiError {
  return new ApiError('APPROVED_SNAPSHOT_REQUIRED', message, 409)
}
