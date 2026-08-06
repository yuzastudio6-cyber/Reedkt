import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  assertProfessionalLongFormCrossChunkColorAuthority,
  buildProfessionalLongFormCrossChunkColorAuthority,
  buildProfessionalLongFormCrossChunkColorAuthorization,
  buildProfessionalLongFormCrossChunkColorCompletion,
  buildProfessionalLongFormCrossChunkColorReconciliation,
  buildProfessionalLongFormCrossChunkColorTerminal,
  buildProfessionalLongFormCrossChunkColorValidationArtifact,
  professionalLongFormCrossChunkColorResultHash,
  type ProfessionalLongFormCrossChunkColorQaDependencyEvidence,
} from '../edit-architecture/professional-long-form-cross-chunk-color-continuity-execution'
import {
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_KIND,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_WORK_ITEM_ID,
  professionalLongFormCrossChunkColorAttemptSchema,
  professionalLongFormCrossChunkColorCompletionSchema,
  professionalLongFormCrossChunkColorReconciliationSchema,
  professionalLongFormCrossChunkColorTerminalSchema,
  professionalLongFormCrossChunkColorValidationArtifactSchema,
  type ProfessionalLongFormCrossChunkColorAttempt,
  type ProfessionalLongFormCrossChunkColorAuthority,
  type ProfessionalLongFormCrossChunkColorAuthorization,
  type ProfessionalLongFormCrossChunkColorReconciliation,
  type ProfessionalLongFormCrossChunkColorTerminal,
  type ProfessionalLongFormCrossChunkColorValidationArtifact,
} from '../edit-architecture/professional-long-form-cross-chunk-color-continuity-execution-contract'
import {
  professionalLongFormFirstObjectChunkQaArtifactSchema,
  professionalLongFormFirstObjectChunkQaCompletionSchema,
} from '../edit-architecture/professional-long-form-first-object-chunk-execution-contract'
import {
  OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_POLICY,
  OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_RECIPE,
  buildOfflineMediaBinaryCrossChunkColorContinuityRequest,
  openPrivateOfflineMediaBinaryRuntime,
  type OfflineCrossChunkColorContinuityExecutionResult,
} from '../tool-execution/media-binary-execution'
import {
  beginPrivateInternalAttemptCostEvidence,
  classifyPrivateInternalAttemptCostFailure,
  readPrivateInternalAttemptCostEvidence,
  type PrivateInternalAttemptCostEvidence,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import type { CanonicalPrivatePackageWorkQueueAggregate } from
  '../validation/canonical-private-package-work-queue-schemas'
import {
  authorizePrivateCanonicalPackageWorkQueueJob,
  beginPrivateCanonicalPackageWorkQueueExecutionAttempt,
  claimPrivateCanonicalPackageWorkQueueJob,
  heartbeatPrivateCanonicalPackageWorkQueueClaim,
} from './private-canonical-package-work-queue-store'
import {
  completePrivateCanonicalPackageWorkQueueProfessionalLongFormClaim,
} from './canonical-professional-long-form-completed-attempt-reconciliation-service'
import {
  createCanonicalProfessionalLongFormChildPackagePromotionService,
  type CanonicalProfessionalLongFormCurrentChildPackageAuthority,
} from './canonical-professional-long-form-child-package-promotion-service'
import {
  inspectCanonicalPrivateObjectChunkMediaArtifact,
  type CanonicalPrivateMediaArtifactInspection,
} from './canonical-private-media-artifact-storage'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_EXECUTION_VERSION =
  'canonical-professional-long-form-cross-chunk-color-execution-v1' as const

type CostMeter = Awaited<ReturnType<typeof beginPrivateInternalAttemptCostEvidence>>

interface CompletedColorEvidence {
  authority: ProfessionalLongFormCrossChunkColorAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormCrossChunkColorAuthorization
  executionAttempt: ProfessionalLongFormCrossChunkColorAttempt
  validationArtifact: ProfessionalLongFormCrossChunkColorValidationArtifact
  validationArtifactRef: AuthorityJsonBlobRef
  reconciliation: ProfessionalLongFormCrossChunkColorReconciliation
  reconciliationRef: AuthorityJsonBlobRef
  costEvidence: PrivateInternalAttemptCostEvidence
  terminal: ProfessionalLongFormCrossChunkColorTerminal
  terminalRef: AuthorityJsonBlobRef
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
}

export interface CanonicalProfessionalLongFormCrossChunkColorExecutionEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_EXECUTION_VERSION
  source:
    'canonical_professional_long_form_cross_chunk_color_execution_service'
  status: 'cross_chunk_color_completed_finalization_separately_gated'
  disposition: 'completed' | 'exact_replay'
  color: Omit<CompletedColorEvidence, 'queueAggregate'>
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  readiness: {
    approvedSnapshotReopenedAndVerified: true
    fundedFourKEstimateReservationReused: true
    everyObjectChunkQaCompletionReopened: true
    leaseAndOneUseDispatchVerified: true
    heartbeatAndBoundedLeaseVerified: true
    everyPrivateChunkChecksumReopened: true
    everyAdjacentBoundaryExecutedExactlyOnce: true
    pairCheckpointsPersistedCreateOnly: true
    technicalMismatchBlocksFinalization: true
    editorialMismatchRequiresReview: true
    mediaMutationPerformed: false
    attemptInternalCostVerified: true
    queueCompletionCount: number
    remainingIncompleteChildJobCount: number
    finalizationExecutionAuthorized: false
    secondExportEstimateCreated: false
    secondExportChargeCreated: false
    providerActivationAuthorized: false
    customerBillingAuthorized: false
    walletMutationAuthorized: false
    distributedDatabaseVerified: false
    liveGoogleCloudVerified: false
    publicDeliveryAuthorized: false
    productReady: false
    productionReady: false
  }
  evidenceHash: string
}

export function createCanonicalProfessionalLongFormCrossChunkColorExecutionService(
  context: ServiceContext,
) {
  return {
    async execute(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormCrossChunkColorExecutionEvidence> {
      if (
        !input || typeof input !== 'object' ||
        Object.keys(input).sort().join('|') !==
          'approvedPlanSnapshotId|workspaceId'
      ) throw invalid(
        'Cross-chunk color selection is server-owned and accepts no caller chunks, thresholds, paths, commands, cost, or artifact fields.',
      )
      const ownerUserId = context.auth?.userId
      if (!ownerUserId) {
        throw new ApiError(
          'AUTH_REQUIRED',
          'Cross-chunk color execution requires authenticated authority.',
          401,
        )
      }
      const current = await currentAuthority(context, input)
      const qaDependencies = await loadQaDependencies({ context, current })
      const entry = colorEntry(current)
      let completed: CompletedColorEvidence
      let disposition: 'completed' | 'exact_replay'
      if (entry.state === 'completed') {
        completed = await loadCompleted({
          context,
          current,
          ownerUserId,
          qaDependencies,
        })
        disposition = 'exact_replay'
      } else {
        if (entry.state === 'leased') {
          throw inProgress('Cross-chunk color already has an active lease.')
        }
        completed = await executeNew({
          context,
          current,
          ownerUserId,
          qaDependencies,
        })
        disposition = 'completed'
      }
      const aggregate = completed.queueAggregate
      const completedEntry = colorEntry({ ...current, queueAggregate: aggregate })
      const chunkCount = completed.authority.approvedColorPlan.chunkCount
      const minimumCompletedCount = chunkCount * 2 + 4
      const finalization = aggregate.entries.find((candidate) =>
        candidate.definition.approvedWorkItemId ===
          'long-form-finalize-private-4k-master')
      if (
        completedEntry.state !== 'completed' ||
        completedEntry.professionalLongFormExecutionAttempt?.deliveryAttempt !==
          completedEntry.deliveryAttemptCount ||
        aggregate.summary.leasedJobCount !== 0 ||
        aggregate.summary.completedJobCount < minimumCompletedCount ||
        aggregate.summary.completedJobCount >= aggregate.summary.totalJobCount ||
        aggregate.entries.filter((candidate) => candidate.state !== 'completed')
          .some((candidate) => candidate.state !== 'queued') ||
        !finalization || finalization.state !== 'queued' ||
        finalization.professionalLongFormExecutionAuthorization ||
        finalization.professionalLongFormExecutionAttempt || finalization.completion
      ) throw invalid(
        'Cross-chunk color completion did not preserve the remaining canonical graph.',
      )
      const color = withoutAggregate(completed)
      const stablePayload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_EXECUTION_VERSION,
        source:
          'canonical_professional_long_form_cross_chunk_color_execution_service' as const,
        status:
          'cross_chunk_color_completed_finalization_separately_gated' as const,
        color,
        queueAggregate: aggregate,
        readiness: {
          approvedSnapshotReopenedAndVerified: true as const,
          fundedFourKEstimateReservationReused: true as const,
          everyObjectChunkQaCompletionReopened: true as const,
          leaseAndOneUseDispatchVerified: true as const,
          heartbeatAndBoundedLeaseVerified: true as const,
          everyPrivateChunkChecksumReopened: true as const,
          everyAdjacentBoundaryExecutedExactlyOnce: true as const,
          pairCheckpointsPersistedCreateOnly: true as const,
          technicalMismatchBlocksFinalization: true as const,
          editorialMismatchRequiresReview: true as const,
          mediaMutationPerformed: false as const,
          attemptInternalCostVerified: true as const,
          queueCompletionCount: aggregate.summary.completedJobCount,
          remainingIncompleteChildJobCount:
            aggregate.summary.totalJobCount - aggregate.summary.completedJobCount,
          finalizationExecutionAuthorized: false as const,
          secondExportEstimateCreated: false as const,
          secondExportChargeCreated: false as const,
          providerActivationAuthorized: false as const,
          customerBillingAuthorized: false as const,
          walletMutationAuthorized: false as const,
          distributedDatabaseVerified: false as const,
          liveGoogleCloudVerified: false as const,
          publicDeliveryAuthorized: false as const,
          productReady: false as const,
          productionReady: false as const,
        },
      }
      return {
        ...stablePayload,
        disposition,
        evidenceHash: sha256AuthorityValue(stablePayload),
      }
    },
  }
}

async function executeNew(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  ownerUserId: string
  qaDependencies: ProfessionalLongFormCrossChunkColorQaDependencyEvidence[]
}): Promise<CompletedColorEvidence> {
  const authority = buildProfessionalLongFormCrossChunkColorAuthority({
    ...input,
    heartbeatIntervalMilliseconds: 30_000,
  })
  assertUnexpired(authority.approval.reservationExpiresAt)
  const authorityRef = await persistAuthority({
    context: input.context,
    authority,
    verify(value) {
      return assertProfessionalLongFormCrossChunkColorAuthority({
        value,
        ownerUserId: input.ownerUserId,
        current: input.current,
        qaDependencies: input.qaDependencies,
        heartbeatIntervalMilliseconds:
          authority.operation.heartbeatIntervalMilliseconds,
      })
    },
  })
  const authorization = buildProfessionalLongFormCrossChunkColorAuthorization({
    authority,
    authorityRef,
  })
  await authorizePrivateCanonicalPackageWorkQueueJob({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    authorization,
    executionAuthority: authority,
    now: new Date().toISOString(),
  })
  const claim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    workerIdentity: 'canonical-professional-long-form-cross-chunk-color-v1',
    workerType: 'qa_worker',
    now: new Date().toISOString(),
    leaseDurationMs: authority.operation.leaseDurationMilliseconds,
  })
  if (claim.disposition !== 'claimed') {
    throw inProgress(`Cross-chunk color claim remained ${claim.disposition}.`)
  }
  const begun = await beginPrivateCanonicalPackageWorkQueueExecutionAttempt({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
    now: new Date().toISOString(),
  })
  const executionAttempt = professionalLongFormCrossChunkColorAttemptSchema
    .parse(begun.executionAttempt)
  const heartbeat = startHeartbeat({
    current: input.current,
    jobId: authority.identity.jobId,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
    leaseDurationMs: authority.operation.leaseDurationMilliseconds,
    intervalMs: authority.operation.heartbeatIntervalMilliseconds,
  })
  await heartbeat.tick()
  const heartbeatCurrent = await currentAuthority(input.context, {
    workspaceId: authority.identity.workspaceId,
    approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
  })
  const heartbeatClaim = colorEntry(heartbeatCurrent).activeClaim
  if (
    !heartbeatClaim || heartbeatClaim.claimId !== executionAttempt.claimId ||
    heartbeatClaim.deliveryAttempt !== executionAttempt.deliveryAttempt ||
    heartbeatClaim.heartbeatCount < 1 ||
    heartbeatClaim.claimHash === executionAttempt.claimHash
  ) throw invalid('Cross-chunk color heartbeat was not durably observed.')
  const queueLeaseEvidence = {
    claimId: heartbeatClaim.claimId,
    deliveryAttempt: executionAttempt.deliveryAttempt,
    initialClaimHash: executionAttempt.claimHash,
    heartbeatClaimHash: heartbeatClaim.claimHash,
    heartbeatCount: heartbeatClaim.heartbeatCount,
    heartbeatAt: heartbeatClaim.heartbeatAt,
    expiresAt: heartbeatClaim.expiresAt,
    attemptDeadlineAt: heartbeatClaim.attemptDeadlineAt,
    boundedLeaseRenewalObserved: true as const,
  }

  let costMeter: CostMeter | undefined
  let costFinalized = false
  let heartbeatStopped = false
  try {
    costMeter = await beginPrivateInternalAttemptCostEvidence({
      localStorageRoot: input.context.env.localStorageRoot,
      workspaceId: authority.identity.workspaceId,
      projectId: authority.identity.projectId,
      editSessionId: authority.identity.editSessionId,
      approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
      approvedWorkItemId: authority.identity.approvedWorkItemId,
      jobId: authority.identity.jobId,
      executionAttemptId: executionAttempt.executionAttemptId,
      retryAttempt: executionAttempt.deliveryAttempt,
      toolId: 'ffmpeg',
      operationId: PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID,
      workloadProfileId: PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COST_PROFILE_ID,
    })
    const inspectedChunks = await inspectApprovedChunks({
      context: input.context,
      authority,
    })
    const runtime = await openPrivateOfflineMediaBinaryRuntime()
    const boundaryResults: ProfessionalLongFormCrossChunkColorValidationArtifact[
      'boundaryResults'
    ] = []
    let imageIdentityHash: string | undefined
    let checkpointBytes = 0
    for (const boundary of authority.approvedColorPlan.boundaries) {
      await heartbeat.tick()
      const left = authority.approvedColorPlan.chunks[
        boundary.leftChunkIndex - 1
      ]!
      const right = authority.approvedColorPlan.chunks[
        boundary.rightChunkIndex - 1
      ]!
      const leftStored = inspectedChunks.get(left.chunkIndex)!
      const rightStored = inspectedChunks.get(right.chunkIndex)!
      const request = buildOfflineMediaBinaryCrossChunkColorContinuityRequest({
        planningPayload: {
          recipeProfileId: OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_RECIPE,
          continuityPolicyId:
            OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_POLICY,
          colorAuthorityHash: authority.approvedColorPlan.colorAuthorityHash,
          expectedEvidenceIdentity: boundary.expectedEvidenceIdentity,
          leftChunkIndex: boundary.leftChunkIndex,
          rightChunkIndex: boundary.rightChunkIndex,
          boundaryBefore: boundary.boundaryBefore,
          width: authority.approvedColorPlan.width,
          height: authority.approvedColorPlan.height,
          fps: 30,
          sampleWindowFrames: 30,
          sampleFramesPerSide: 3,
          sourcePolicy:
            'independently_qa_passed_private_vp9_bt709_chunks_v1',
          technicalSplitMismatchDisposition: 'block_finalization',
          editorialCutMismatchDisposition: 'review_required',
          mediaMutationAllowed: false,
          usesApprovedEditReservation: true,
          requiresSeparateExportEstimate: false,
          allowsAdditionalExportCharge: false,
        },
        left: {
          inputId: 'left-chunk',
          chunkId: left.chunkId,
          chunkIndex: left.chunkIndex,
          objectIdentity: left.renderArtifact.objectIdentity,
          mimeType: 'video/x-matroska',
          byteLength: leftStored.byteLength,
          sha256: leftStored.sha256,
          frameCount: left.durationFrames,
        },
        right: {
          inputId: 'right-chunk',
          chunkId: right.chunkId,
          chunkIndex: right.chunkIndex,
          objectIdentity: right.renderArtifact.objectIdentity,
          mimeType: 'video/x-matroska',
          byteLength: rightStored.byteLength,
          sha256: rightStored.sha256,
          frameCount: right.durationFrames,
        },
      })
      const result = await runtime.executeCrossChunkColorContinuityServerInjected(
        request,
        {
          left: {
            inputMode: 'private_verified_stream_v1',
            byteLength: leftStored.byteLength,
            sha256: leftStored.sha256,
            openStream: leftStored.openStream,
          },
          right: {
            inputMode: 'private_verified_stream_v1',
            byteLength: rightStored.byteLength,
            sha256: rightStored.sha256,
            openStream: rightStored.openStream,
          },
        },
      )
      assertBoundaryRuntimeResult({ authority, boundary, left, right, result })
      if (imageIdentityHash && imageIdentityHash !== result.image.imageIdentityHash) {
        throw invalid('Cross-chunk color runtime image changed within one attempt.')
      }
      imageIdentityHash = result.image.imageIdentityHash
      const resultDocumentRef = await persistExactJson({
        context: input.context,
        value: result.resultJson.document,
        parse: (value) => value as Readonly<Record<string, unknown>>,
      })
      checkpointBytes += resultDocumentRef.byteLength
      const document = result.resultJson.document
      boundaryResults.push({
        boundaryId: boundary.boundaryId,
        leftChunkIndex: boundary.leftChunkIndex,
        rightChunkIndex: boundary.rightChunkIndex,
        boundaryBefore: boundary.boundaryBefore,
        leftChunkSha256: left.renderArtifact.sha256,
        rightChunkSha256: right.renderArtifact.sha256,
        requestEnvelopeSha256: result.evidence.requestEnvelopeSha256,
        runtimeResultSha256: result.resultJson.sha256,
        resultDocumentRef,
        attestationRecordId: result.attestation.recordId,
        attestationHash: result.attestation.attestationHash,
        confinementEvidenceHash: sha256AuthorityValue(
          result.evidence.confinement,
        ),
        outcome: 'passed',
        evaluatedAt: String(document.evaluatedAt),
      })
    }
    if (!imageIdentityHash || boundaryResults.length === 0) {
      throw invalid('Cross-chunk color produced no adjacent boundary evidence.')
    }
    const evaluatedAt = boundaryResults[boundaryResults.length - 1]!.evaluatedAt
    const validationArtifact =
      buildProfessionalLongFormCrossChunkColorValidationArtifact({
        authority,
        authorization,
        executionAttempt,
        queueLeaseEvidence,
        boundaryResults,
        imageIdentityHash,
        evaluatedAt,
      })
    const validationArtifactRef = await persistExactJson({
      context: input.context,
      value: validationArtifact,
      parse: (value) =>
        professionalLongFormCrossChunkColorValidationArtifactSchema.parse(value),
    })
    const latestLeased = await currentAuthority(input.context, {
      workspaceId: authority.identity.workspaceId,
      approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
    })
    const reconciliation = buildProfessionalLongFormCrossChunkColorReconciliation({
      current: latestLeased,
      authority,
      executionAttempt,
      validationArtifactRef,
      reconciledAt: new Date().toISOString(),
    })
    const reconciliationRef = await persistExactJson({
      context: input.context,
      value: reconciliation,
      parse: (value) =>
        professionalLongFormCrossChunkColorReconciliationSchema.parse(value),
    })
    const canonicalResultHash = professionalLongFormCrossChunkColorResultHash({
      authority,
      executionAttempt,
      validationArtifactRef,
      reconciliationEvidenceRef: reconciliationRef,
    })
    const finalizedCost = await costMeter.finalize({
      status: 'completed',
      failureCategory: 'none',
      outputByteLength: checkpointBytes + validationArtifactRef.byteLength,
      linkedCanonicalOutcomeHash: canonicalResultHash,
    })
    costFinalized = true
    assertCostEvidence({
      evidence: finalizedCost.evidence,
      authority,
      executionAttemptId: executionAttempt.executionAttemptId,
      canonicalResultHash,
    })
    await heartbeat.stop()
    heartbeatStopped = true
    const terminal = buildProfessionalLongFormCrossChunkColorTerminal({
      authority,
      authorization,
      executionAttempt,
      validationArtifactRef,
      reconciliationEvidenceRef: reconciliationRef,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      completedAt: new Date().toISOString(),
    })
    const terminalRef = await persistExactJson({
      context: input.context,
      value: terminal,
      parse: (value) =>
        professionalLongFormCrossChunkColorTerminalSchema.parse(value),
    })
    const completion = buildProfessionalLongFormCrossChunkColorCompletion({
      authority,
      authorization,
      executionAttempt,
      validationArtifactRef,
      reconciliationEvidenceRef: reconciliationRef,
      terminalEvidenceRef: terminalRef,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
    })
    const definition = claim.entry.definition
    const aggregate = await completePrivateCanonicalPackageWorkQueueProfessionalLongFormClaim({
      scope: input.current.scope,
      definition: input.current.queueDefinition,
      jobId: authority.identity.jobId,
      claimId: claim.entry.activeClaim.claimId,
      claimCredential: claim.claimCredential,
      outcome: {
        jobId: definition.jobId,
        approvedWorkItemId: definition.approvedWorkItemId,
        workItemKey: definition.workItemKey,
        required: definition.required,
        dependencyJobIds: [...definition.dependencyJobIds],
        status: 'completed_private_test',
        artifactId: authority.identity.expectedOutputIdentity,
        contentType: 'application/json',
        sha256: validationArtifactRef.sha256,
        adapterReplayed: false,
        blockedDependencyJobIds: [],
        professionalLongFormExecution: completion,
      },
      now: new Date().toISOString(),
    })
    return {
      authority,
      authorityRef,
      authorization,
      executionAttempt,
      validationArtifact,
      validationArtifactRef,
      reconciliation,
      reconciliationRef,
      costEvidence: finalizedCost.evidence,
      terminal,
      terminalRef,
      queueAggregate: aggregate,
    }
  } catch (error) {
    if (!heartbeatStopped) await heartbeat.stop().catch(() => undefined)
    if (costMeter && !costFinalized) {
      await costMeter.finalize({
        status: 'failed',
        failureCategory: classifyPrivateInternalAttemptCostFailure(error),
        outputByteLength: null,
        linkedCanonicalOutcomeHash: null,
      }).catch(() => undefined)
    }
    throw error
  }
}

async function loadCompleted(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  ownerUserId: string
  qaDependencies: ProfessionalLongFormCrossChunkColorQaDependencyEvidence[]
}): Promise<CompletedColorEvidence> {
  const authority = buildProfessionalLongFormCrossChunkColorAuthority({
    ...input,
    heartbeatIntervalMilliseconds: 30_000,
  })
  const entry = colorEntry(input.current)
  const authorityRef = entry.professionalLongFormExecutionAuthorization
    ?.authorityRef
  if (!authorityRef) throw invalid('Completed cross-chunk color lost authority.')
  const persistedAuthority = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: authorityRef,
  })
  const verifiedAuthority = assertProfessionalLongFormCrossChunkColorAuthority({
    value: persistedAuthority,
    ownerUserId: input.ownerUserId,
    current: input.current,
    qaDependencies: input.qaDependencies,
    heartbeatIntervalMilliseconds:
      authority.operation.heartbeatIntervalMilliseconds,
  })
  assertExact(verifiedAuthority, authority, 'Replayed color authority changed.')
  const authorization = buildProfessionalLongFormCrossChunkColorAuthorization({
    authority,
    authorityRef,
  })
  assertStoredAuthorization(entry, authorization)
  const executionAttempt = professionalLongFormCrossChunkColorAttemptSchema
    .parse(entry.professionalLongFormExecutionAttempt)
  const completion = professionalLongFormCrossChunkColorCompletionSchema.parse(
    entry.completion?.outcome.professionalLongFormExecution,
  )
  const validationArtifact = await readParsedJson({
    context: input.context,
    ref: completion.validationArtifactRef,
    parse: (value) =>
      professionalLongFormCrossChunkColorValidationArtifactSchema.parse(value),
  })
  assertHashed(validationArtifact, 'validationHash')
  await inspectApprovedChunks({ context: input.context, authority })
  for (const boundaryResult of validationArtifact.boundaryResults) {
    const document = await readPrivateAuthorityJsonBlob({
      localStorageRoot: input.context.env.localStorageRoot,
      ref: boundaryResult.resultDocumentRef,
    }) as Record<string, unknown>
    const pair = document.pair as Record<string, unknown>
    if (
      boundaryResult.resultDocumentRef.sha256 !== sha256AuthorityValue(document) ||
      document.outcome !== 'passed' ||
      document.evaluatedAt !== boundaryResult.evaluatedAt ||
      pair.leftChunkIndex !== boundaryResult.leftChunkIndex ||
      pair.rightChunkIndex !== boundaryResult.rightChunkIndex ||
      pair.leftSha256 !== boundaryResult.leftChunkSha256 ||
      pair.rightSha256 !== boundaryResult.rightChunkSha256
    ) throw invalid('Replayed boundary checkpoint changed.')
  }
  const expectedValidation =
    buildProfessionalLongFormCrossChunkColorValidationArtifact({
      authority,
      authorization,
      executionAttempt,
      queueLeaseEvidence: validationArtifact.queueLeaseEvidence,
      boundaryResults: validationArtifact.boundaryResults,
      imageIdentityHash: validationArtifact.runtime.imageIdentityHash,
      evaluatedAt: validationArtifact.evaluatedAt,
    })
  assertExact(
    validationArtifact,
    expectedValidation,
    'Replayed cross-chunk color validation changed.',
  )
  const reconciliation = await readParsedJson({
    context: input.context,
    ref: completion.reconciliationEvidenceRef,
    parse: (value) =>
      professionalLongFormCrossChunkColorReconciliationSchema.parse(value),
  })
  const expectedReconciliation =
    buildProfessionalLongFormCrossChunkColorReconciliation({
      current: input.current,
      authority,
      executionAttempt,
      validationArtifactRef: completion.validationArtifactRef,
      reconciledAt: reconciliation.reconciledAt,
      allowCompletedColor: true,
    })
  assertExact(
    reconciliation,
    expectedReconciliation,
    'Replayed cross-chunk color reconciliation changed.',
  )
  const canonicalResultHash = professionalLongFormCrossChunkColorResultHash({
    authority,
    executionAttempt,
    validationArtifactRef: completion.validationArtifactRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
  })
  const costEvidence = await requiredCostEvidence({
    context: input.context,
    authority,
    executionAttemptId: executionAttempt.executionAttemptId,
    expectedHash: completion.attemptInternalCostEvidenceHash,
    canonicalResultHash,
  })
  const terminal = await readParsedJson({
    context: input.context,
    ref: completion.terminalEvidenceRef,
    parse: (value) =>
      professionalLongFormCrossChunkColorTerminalSchema.parse(value),
  })
  const expectedTerminal = buildProfessionalLongFormCrossChunkColorTerminal({
    authority,
    authorization,
    executionAttempt,
    validationArtifactRef: completion.validationArtifactRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    canonicalResultHash,
    attemptInternalCostEvidenceHash: costEvidence.evidenceHash,
    completedAt: terminal.completedAt,
  })
  assertExact(terminal, expectedTerminal, 'Replayed color terminal changed.')
  if (
    completion.canonicalResultHash !== canonicalResultHash ||
    entry.completion?.outcome.sha256 !== completion.validationArtifactRef.sha256 ||
    entry.deliveryAttemptCount !== executionAttempt.deliveryAttempt
  ) throw invalid('Replayed cross-chunk color queue evidence changed.')
  return {
    authority,
    authorityRef,
    authorization,
    executionAttempt,
    validationArtifact,
    validationArtifactRef: completion.validationArtifactRef,
    reconciliation,
    reconciliationRef: completion.reconciliationEvidenceRef,
    costEvidence,
    terminal,
    terminalRef: completion.terminalEvidenceRef,
    queueAggregate: input.current.queueAggregate,
  }
}

async function loadQaDependencies(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
}): Promise<ProfessionalLongFormCrossChunkColorQaDependencyEvidence[]> {
  const chunks = [...input.current.postApproval.bridge.binding.plan.chunks]
    .sort((left, right) => left.chunkIndex - right.chunkIndex)
  if (chunks.length < 2) {
    throw inProgress('Cross-chunk color requires at least two approved chunks.')
  }
  const result: ProfessionalLongFormCrossChunkColorQaDependencyEvidence[] = []
  for (const chunk of chunks) {
    const entry = input.current.queueAggregate.entries.find((candidate) =>
      candidate.definition.approvedWorkItemId === `${chunk.chunkId}:qa`)
    if (!entry?.completion || entry.state !== 'completed') {
      throw inProgress(
        `Cross-chunk color remains blocked by object-chunk QA ${chunk.chunkIndex}.`,
      )
    }
    const completion = professionalLongFormFirstObjectChunkQaCompletionSchema
      .parse(entry.completion.outcome.professionalLongFormExecution)
    const qaArtifact = await readParsedJson({
      context: input.context,
      ref: completion.validationArtifactRef,
      parse: (value) =>
        professionalLongFormFirstObjectChunkQaArtifactSchema.parse(value),
    })
    assertHashed(qaArtifact, 'qaHash')
    result.push({
      chunkId: chunk.chunkId,
      qaArtifactRef: completion.validationArtifactRef,
      qaArtifact,
    })
  }
  return result
}

async function inspectApprovedChunks(input: {
  context: ServiceContext
  authority: ProfessionalLongFormCrossChunkColorAuthority
}): Promise<Map<number, CanonicalPrivateMediaArtifactInspection>> {
  const result = new Map<number, CanonicalPrivateMediaArtifactInspection>()
  for (const chunk of input.authority.approvedColorPlan.chunks) {
    const stored = await inspectCanonicalPrivateObjectChunkMediaArtifact({
      localStorageRoot: input.context.env.localStorageRoot,
      privateObjectIdentityHash: chunk.renderArtifact.objectIdentity,
    })
    if (
      !stored || stored.mediaFormat !== 'mkv' ||
      stored.byteLength !== chunk.renderArtifact.byteLength ||
      stored.sha256 !== chunk.renderArtifact.sha256
    ) throw invalid(`Private object chunk ${chunk.chunkIndex} changed after QA.`)
    result.set(chunk.chunkIndex, stored)
  }
  return result
}

function assertBoundaryRuntimeResult(input: {
  authority: ProfessionalLongFormCrossChunkColorAuthority
  boundary: ProfessionalLongFormCrossChunkColorAuthority[
    'approvedColorPlan'
  ]['boundaries'][number]
  left: ProfessionalLongFormCrossChunkColorAuthority[
    'approvedColorPlan'
  ]['chunks'][number]
  right: ProfessionalLongFormCrossChunkColorAuthority[
    'approvedColorPlan'
  ]['chunks'][number]
  result: OfflineCrossChunkColorContinuityExecutionResult
}): void {
  const document = input.result.resultJson.document
  const pair = document.pair as Record<string, unknown>
  const semantic = input.result.evidence.semanticEvidence
  const confinements = Object.values(input.result.evidence.confinement)
  if (
    document.outcome !== 'passed' ||
    document.colorAuthorityHash !== input.authority.approvedColorPlan.colorAuthorityHash ||
    document.expectedEvidenceIdentity !== input.boundary.expectedEvidenceIdentity ||
    pair.leftChunkIndex !== input.left.chunkIndex ||
    pair.rightChunkIndex !== input.right.chunkIndex ||
    pair.leftSha256 !== input.left.renderArtifact.sha256 ||
    pair.rightSha256 !== input.right.renderArtifact.sha256 ||
    pair.boundaryBefore !== input.boundary.boundaryBefore ||
    input.result.evidence.toolId !== 'ffmpeg' ||
    input.result.evidence.operationId !==
      PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID ||
    input.result.evidence.leftChunkSha256 !== input.left.renderArtifact.sha256 ||
    input.result.evidence.rightChunkSha256 !== input.right.renderArtifact.sha256 ||
    input.result.evidence.resultSha256 !== input.result.resultJson.sha256 ||
    input.result.evidence.containerExitCode !== 0 || input.result.evidence.oomKilled ||
    confinements.length !== 4 || confinements.some((value) =>
      value.networkMode !== 'none' || value.readOnlyRootFilesystem !== true ||
      value.user !== '65532:65532' || value.capDropAll !== true ||
      value.noNewPrivileges !== true) ||
    semantic.mediaMutationPerformed !== false ||
    semantic.originalApprovedEditReservationUsed !== true ||
    semantic.separateExportEstimateRequired !== false ||
    semantic.additionalExportChargeAllowed !== false ||
    input.result.readiness.productReady || input.result.readiness.productionReady
  ) throw invalid(
    `Cross-chunk color boundary ${input.boundary.boundaryId} failed closed.`,
  )
}

async function currentAuthority(
  context: ServiceContext,
  input: { workspaceId: string; approvedPlanSnapshotId: string },
) {
  return createCanonicalProfessionalLongFormChildPackagePromotionService(
    context,
  ).loadCurrent(input)
}

function colorEntry(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
) {
  const entry = current.queueAggregate.entries.find((candidate) =>
    candidate.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_WORK_ITEM_ID)
  const job = current.postApproval.childJobManifest.jobs.find((candidate) =>
    candidate.childWorkItemId ===
      PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_WORK_ITEM_ID)
  if (
    !entry || !job || job.kind !== PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_KIND ||
    entry.definition.jobId !== job.jobId
  ) throw invalid('Canonical queue lost cross-chunk color identity.')
  return entry
}

async function persistAuthority<T extends Record<string, unknown>>(input: {
  context: ServiceContext
  authority: T
  verify(value: unknown): T
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.authority,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  const verified = input.verify(value)
  assertExact(verified, input.authority, 'Persisted color authority changed.')
  return ref
}

async function persistExactJson<T extends Readonly<Record<string, unknown>>>(
  input: {
    context: ServiceContext
    value: T
    parse(value: unknown): T
  },
): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.value,
  })
  const parsed = await readParsedJson({
    context: input.context,
    ref,
    parse: input.parse,
  })
  assertExact(parsed, input.value, 'Persisted cross-chunk color JSON changed.')
  return ref
}

async function readParsedJson<T>(input: {
  context: ServiceContext
  ref: AuthorityJsonBlobRef
  parse(value: unknown): T
}): Promise<T> {
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: input.ref,
  })
  const parsed = input.parse(value)
  if (input.ref.sha256 !== sha256AuthorityValue(parsed)) {
    throw invalid('Cross-chunk color content-addressed JSON changed.')
  }
  return parsed
}

function startHeartbeat(input: {
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  jobId: string
  claimId: string
  claimCredential: string
  leaseDurationMs: number
  intervalMs: number
}) {
  let stopped = false
  let failure: unknown
  let pending = Promise.resolve()
  const tick = async () => {
    if (stopped || failure) return
    pending = pending.then(async () => {
      if (stopped || failure) return
      await heartbeatPrivateCanonicalPackageWorkQueueClaim({
        scope: input.current.scope,
        definition: input.current.queueDefinition,
        jobId: input.jobId,
        claimId: input.claimId,
        claimCredential: input.claimCredential,
        now: new Date().toISOString(),
        leaseDurationMs: input.leaseDurationMs,
      })
    }).catch((error) => { failure = error })
    await pending
    if (failure) throw failure
  }
  const timer = setInterval(() => void tick().catch(() => undefined), input.intervalMs)
  timer.unref()
  return {
    tick,
    async stop() {
      stopped = true
      clearInterval(timer)
      await pending
      if (failure) throw failure
    },
  }
}

async function requiredCostEvidence(input: {
  context: ServiceContext
  authority: ProfessionalLongFormCrossChunkColorAuthority
  executionAttemptId: string
  expectedHash: string
  canonicalResultHash: string
}) {
  const evidence = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: input.authority.identity.workspaceId,
    projectId: input.authority.identity.projectId,
    executionAttemptId: input.executionAttemptId,
  })
  if (!evidence || evidence.evidenceHash !== input.expectedHash) {
    throw invalid('Cross-chunk color internal attempt cost evidence is missing.')
  }
  assertCostEvidence({ ...input, evidence })
  return evidence
}

function assertCostEvidence(input: {
  evidence: PrivateInternalAttemptCostEvidence
  authority: ProfessionalLongFormCrossChunkColorAuthority
  executionAttemptId: string
  canonicalResultHash: string
}): void {
  const serialized = stableAuthorityStringify(input.evidence)
  if (
    input.evidence.boundary !== 'internal_production_cost_only' ||
    input.evidence.identity.toolId !== 'ffmpeg' ||
    input.evidence.identity.operationId !==
      PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID ||
    !('workloadProfileId' in input.evidence.identity) ||
    input.evidence.identity.workloadProfileId !==
      PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COST_PROFILE_ID ||
    input.evidence.identity.jobId !== input.authority.identity.jobId ||
    input.evidence.identity.executionAttemptId !== input.executionAttemptId ||
    input.evidence.linkedCanonicalOutcomeHash !== input.canonicalResultHash ||
    input.evidence.outcome.status !== 'completed' ||
    input.evidence.outcome.failureCategory !== 'none' ||
    input.evidence.resourceUsage.vcpuCount !== 2 ||
    input.evidence.resourceUsage.memoryGib !== 4 ||
    input.evidence.resourceUsage.gpuCount !== 0 ||
    serialized.includes('customerPrice') || serialized.includes('customerCredit') ||
    serialized.includes('serviceFee') || serialized.includes('wallet') ||
    serialized.includes('billingAuthority')
  ) throw invalid('Cross-chunk color cost crossed a commercial boundary.')
}

function assertStoredAuthorization(
  entry: ReturnType<typeof colorEntry>,
  authorization: ProfessionalLongFormCrossChunkColorAuthorization,
): void {
  if (
    !entry.professionalLongFormExecutionAuthorization ||
    stableAuthorityStringify(entry.professionalLongFormExecutionAuthorization) !==
      stableAuthorityStringify(authorization)
  ) throw invalid('Stored cross-chunk color authorization changed.')
}

function assertUnexpired(value: string): void {
  if (Date.parse(value) <= Date.now()) {
    throw new ApiError(
      'CREDITS_NOT_RESERVED',
      'Cross-chunk color requires an unexpired funded reservation.',
      409,
    )
  }
}

function assertHashed<T extends string>(
  value: Record<T, string> & Record<string, unknown>,
  key: T,
): void {
  const payload = { ...value }
  const expected = payload[key]
  delete payload[key]
  if (expected !== sha256AuthorityValue(payload)) {
    throw invalid(`Cross-chunk color ${key} checksum changed.`)
  }
}

function assertExact(left: unknown, right: unknown, message: string): void {
  if (stableAuthorityStringify(left) !== stableAuthorityStringify(right)) {
    throw invalid(message)
  }
}

function withoutAggregate<T extends { queueAggregate: unknown }>(value: T) {
  // The mutable aggregate is returned separately from stable evidence.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { queueAggregate: _queueAggregate, ...rest } = value
  return rest
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate:
      'canonical_professional_long_form_cross_chunk_color_continuity',
  })
}

function inProgress(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409)
}
