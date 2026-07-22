import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  assertProfessionalLongFormMasterAssemblyAuthority,
  buildProfessionalLongFormMasterAssemblyArtifactRef,
  buildProfessionalLongFormMasterAssemblyAuthority,
  buildProfessionalLongFormMasterAssemblyAuthorization,
  buildProfessionalLongFormMasterAssemblyCompletion,
  buildProfessionalLongFormMasterAssemblyReconciliation,
  buildProfessionalLongFormMasterAssemblyRuntimeEvidence,
  buildProfessionalLongFormMasterAssemblyTerminal,
  professionalLongFormMasterAssemblyResultHash,
  type ProfessionalLongFormMasterAssemblyDependencyEvidence,
} from '../edit-architecture/professional-long-form-master-assembly-execution'
import {
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_KIND,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_WORK_ITEM_ID,
  professionalLongFormMasterAssemblyAttemptSchema,
  professionalLongFormMasterAssemblyCompletionSchema,
  professionalLongFormMasterAssemblyReconciliationSchema,
  professionalLongFormMasterAssemblyRuntimeEvidenceSchema,
  professionalLongFormMasterAssemblyTerminalSchema,
  type ProfessionalLongFormMasterAssemblyAttempt,
  type ProfessionalLongFormMasterAssemblyAuthority,
  type ProfessionalLongFormMasterAssemblyAuthorization,
  type ProfessionalLongFormMasterAssemblyReconciliation,
  type ProfessionalLongFormMasterAssemblyRuntimeEvidence,
  type ProfessionalLongFormMasterAssemblyTerminal,
} from '../edit-architecture/professional-long-form-master-assembly-execution-contract'
import {
  professionalLongFormFirstObjectChunkQaArtifactSchema,
  professionalLongFormFirstObjectChunkQaCompletionSchema,
} from '../edit-architecture/professional-long-form-first-object-chunk-execution-contract'
import {
  professionalLongFormContinuousProgramAudioCompletionSchema,
  professionalLongFormContinuousProgramAudioQaArtifactSchema,
} from '../edit-architecture/professional-long-form-continuous-program-audio-execution-contract'
import {
  professionalLongFormCrossChunkColorCompletionSchema,
  professionalLongFormCrossChunkColorValidationArtifactSchema,
} from '../edit-architecture/professional-long-form-cross-chunk-color-continuity-execution-contract'
import {
  OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_RECIPE,
  OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_OUTPUT_BYTES,
  buildOfflineMediaBinaryLongFormMasterAssemblyRequest,
  offlineMediaBinaryLongFormMasterAssemblyRequestSha256,
  openPrivateOfflineMediaBinaryRuntime,
  type OfflineFfmpegLongFormMasterAssemblyExecutionResult,
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
  inspectCanonicalPrivateLongFormMasterArtifact,
  inspectCanonicalPrivateObjectChunkMediaArtifact,
  persistCanonicalPrivateLongFormMasterArtifactStream,
  type CanonicalPrivateMediaArtifactInspection,
} from './canonical-private-media-artifact-storage'
import {
  inspectCanonicalPrivateProgramAudioArtifact,
  type CanonicalPrivateProgramAudioArtifactInspection,
} from './canonical-private-program-audio-artifact-storage'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_EXECUTION_VERSION =
  'canonical-professional-long-form-master-assembly-execution-v1' as const

type CostMeter = Awaited<ReturnType<typeof beginPrivateInternalAttemptCostEvidence>>

interface CompletedMasterAssemblyEvidence {
  authority: ProfessionalLongFormMasterAssemblyAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormMasterAssemblyAuthorization
  executionAttempt: ProfessionalLongFormMasterAssemblyAttempt
  runtimeEvidence: ProfessionalLongFormMasterAssemblyRuntimeEvidence
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciliation: ProfessionalLongFormMasterAssemblyReconciliation
  reconciliationRef: AuthorityJsonBlobRef
  costEvidence: PrivateInternalAttemptCostEvidence
  terminal: ProfessionalLongFormMasterAssemblyTerminal
  terminalRef: AuthorityJsonBlobRef
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
}

export interface CanonicalProfessionalLongFormMasterAssemblyExecutionEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_EXECUTION_VERSION
  source: 'canonical_professional_long_form_master_assembly_execution_service'
  status: 'private_4k_review_master_completed_independent_qa_separately_gated'
  disposition: 'completed' | 'exact_replay'
  assembly: Omit<CompletedMasterAssemblyEvidence, 'queueAggregate'>
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  readiness: {
    approvedSnapshotReopenedAndVerified: true
    fundedFourKEstimateReservationReused: true
    everyDependencyCompletionReopened: true
    leaseAndOneUseDispatchVerified: true
    heartbeatAndBoundedLeaseVerified: true
    everyPrivateInputChecksumReopened: true
    fixedVp9FlacStreamCopyExecuted: true
    privateMasterPersistedCreateOnly: true
    independentOutputProbeVerified: true
    attemptInternalCostVerified: true
    queueCompletionCount: number
    remainingIncompleteChildJobCount: number
    privateMasterQaExecutionAuthorized: false
    customerDeliveryMasterCreated: false
    exportExecutionAuthorized: false
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

export function createCanonicalProfessionalLongFormMasterAssemblyExecutionService(
  context: ServiceContext,
) {
  return {
    async execute(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormMasterAssemblyExecutionEvidence> {
      if (
        !input || typeof input !== 'object' ||
        Object.keys(input).sort().join('|') !==
          'approvedPlanSnapshotId|workspaceId'
      ) throw invalid(
        'Master assembly selection is server-owned and accepts no caller paths, commands, codecs, chunks, artifacts, or cost fields.',
      )
      const ownerUserId = context.auth?.userId
      if (!ownerUserId) {
        throw new ApiError(
          'AUTH_REQUIRED',
          'Private master assembly requires authenticated authority.',
          401,
        )
      }
      const current = await currentAuthority(context, input)
      const dependencies = await loadDependencies({ context, current })
      const entry = assemblyEntry(current)
      let completed: CompletedMasterAssemblyEvidence
      let disposition: 'completed' | 'exact_replay'
      if (entry.state === 'completed') {
        completed = await loadCompleted({
          context,
          current,
          ownerUserId,
          dependencies,
        })
        disposition = 'exact_replay'
      } else {
        if (entry.state === 'leased') {
          throw inProgress('Private master assembly already has an active lease.')
        }
        completed = await executeNew({
          context,
          current,
          ownerUserId,
          dependencies,
        })
        disposition = 'completed'
      }
      const aggregate = completed.queueAggregate
      const completedEntry = assemblyEntry({ ...current, queueAggregate: aggregate })
      const privateQa = aggregate.entries.find((candidate) =>
        candidate.definition.approvedWorkItemId ===
          'long-form-qa-private-4k-master')
      if (
        completedEntry.state !== 'completed' ||
        completedEntry.professionalLongFormExecutionAttempt?.deliveryAttempt !==
          completedEntry.deliveryAttemptCount ||
        aggregate.summary.leasedJobCount !== 0 ||
        aggregate.summary.completedJobCount !== aggregate.summary.totalJobCount - 1 ||
        aggregate.summary.queuedJobCount !== 1 ||
        !privateQa || privateQa.state !== 'queued' ||
        privateQa.professionalLongFormExecutionAuthorization ||
        privateQa.professionalLongFormExecutionAttempt || privateQa.completion
      ) throw invalid(
        'Private master completion did not preserve the separately gated QA job.',
      )
      const assembly = withoutAggregate(completed)
      const stablePayload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_EXECUTION_VERSION,
        source:
          'canonical_professional_long_form_master_assembly_execution_service' as const,
        status:
          'private_4k_review_master_completed_independent_qa_separately_gated' as const,
        assembly,
        queueAggregate: aggregate,
        readiness: {
          approvedSnapshotReopenedAndVerified: true as const,
          fundedFourKEstimateReservationReused: true as const,
          everyDependencyCompletionReopened: true as const,
          leaseAndOneUseDispatchVerified: true as const,
          heartbeatAndBoundedLeaseVerified: true as const,
          everyPrivateInputChecksumReopened: true as const,
          fixedVp9FlacStreamCopyExecuted: true as const,
          privateMasterPersistedCreateOnly: true as const,
          independentOutputProbeVerified: true as const,
          attemptInternalCostVerified: true as const,
          queueCompletionCount: aggregate.summary.completedJobCount,
          remainingIncompleteChildJobCount:
            aggregate.summary.totalJobCount - aggregate.summary.completedJobCount,
          privateMasterQaExecutionAuthorized: false as const,
          customerDeliveryMasterCreated: false as const,
          exportExecutionAuthorized: false as const,
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
  dependencies: ProfessionalLongFormMasterAssemblyDependencyEvidence
}): Promise<CompletedMasterAssemblyEvidence> {
  const authority = buildProfessionalLongFormMasterAssemblyAuthority({
    ...input,
    heartbeatIntervalMilliseconds: 30_000,
  })
  assertUnexpired(authority.approval.reservationExpiresAt)
  const authorityRef = await persistAuthority({
    context: input.context,
    authority,
    verify(value) {
      return assertProfessionalLongFormMasterAssemblyAuthority({
        value,
        ownerUserId: input.ownerUserId,
        current: input.current,
        dependencies: input.dependencies,
        heartbeatIntervalMilliseconds:
          authority.operation.heartbeatIntervalMilliseconds,
      })
    },
  })
  const authorization = buildProfessionalLongFormMasterAssemblyAuthorization({
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
    workerIdentity: 'canonical-professional-long-form-master-assembly-v1',
    workerType: 'render_worker',
    now: new Date().toISOString(),
    leaseDurationMs: authority.operation.leaseDurationMilliseconds,
  })
  if (claim.disposition !== 'claimed') {
    throw inProgress(`Private master assembly claim remained ${claim.disposition}.`)
  }
  const begun = await beginPrivateCanonicalPackageWorkQueueExecutionAttempt({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
    now: new Date().toISOString(),
  })
  const executionAttempt = professionalLongFormMasterAssemblyAttemptSchema
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
  const heartbeatClaim = assemblyEntry(heartbeatCurrent).activeClaim
  if (
    !heartbeatClaim || heartbeatClaim.claimId !== executionAttempt.claimId ||
    heartbeatClaim.deliveryAttempt !== executionAttempt.deliveryAttempt ||
    heartbeatClaim.heartbeatCount < 1 ||
    heartbeatClaim.claimHash === executionAttempt.claimHash
  ) throw invalid('Private master assembly heartbeat was not durably observed.')
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
      operationId: PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID,
      workloadProfileId: PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COST_PROFILE_ID,
    })
    const inspected = await inspectApprovedInputs({
      context: input.context,
      authority,
    })
    const request = buildRuntimeRequest({ authority, inspected })
    const runtime = await openPrivateOfflineMediaBinaryRuntime()
    let sinkReplayed = false
    const result = await runtime.executeLongFormMasterAssemblyServerInjected(
      request,
      {
        chunks: authority.approvedAssemblyPlan.chunks.map((chunk) => {
          const stored = inspected.chunks.get(chunk.chunkIndex)!
          return {
            inputMode: 'private_verified_stream_v1' as const,
            byteLength: stored.byteLength,
            sha256: stored.sha256,
            openStream: stored.openStream,
          }
        }),
        programAudio: {
          inputMode: 'private_verified_stream_v1' as const,
          byteLength: inspected.programAudio.byteLength,
          sha256: inspected.programAudio.sha256,
          openStream: inspected.programAudio.openStream,
        },
      },
      {
        maximumBytes:
          OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_OUTPUT_BYTES,
        async persist(value) {
          if (value.mimeType !== 'video/x-matroska') {
            throw invalid('Private master runtime returned an unsupported format.')
          }
          const persisted = await
            persistCanonicalPrivateLongFormMasterArtifactStream({
              localStorageRoot: input.context.env.localStorageRoot,
              privateObjectIdentityHash:
                authority.approvedAssemblyPlan.privateObjectIdentityHash,
              mediaFormat: 'mkv',
              stream: value.stream,
              expectedByteLength: value.expectedByteLength,
              expectedSha256: value.expectedSha256,
            })
          sinkReplayed = persisted.replayed
          return {
            byteLength: persisted.byteLength,
            sha256: persisted.sha256,
          }
        },
      },
    )
    if (sinkReplayed) {
      throw invalid('An orphan private master cannot grant execution authority.')
    }
    assertRuntimeResult({ authority, requestHash:
      offlineMediaBinaryLongFormMasterAssemblyRequestSha256(request), result })
    const storedMaster = await inspectCanonicalPrivateLongFormMasterArtifact({
      localStorageRoot: input.context.env.localStorageRoot,
      privateObjectIdentityHash:
        authority.approvedAssemblyPlan.privateObjectIdentityHash,
    })
    if (
      !storedMaster || storedMaster.mediaFormat !== 'mkv' ||
      storedMaster.byteLength !== result.resultArtifact.byteLength ||
      storedMaster.sha256 !== result.resultArtifact.sha256
    ) throw invalid('Private master changed after create-only persistence.')
    const outputArtifact = buildProfessionalLongFormMasterAssemblyArtifactRef({
      authority,
      byteLength: storedMaster.byteLength,
      sha256: storedMaster.sha256,
    })
    const outputProbe = requiredRecord(
      result.evidence.semanticEvidence.outputProbe,
      'Private master output probe is missing.',
    )
    const outputProbeRef = await persistExactJson({
      context: input.context,
      value: outputProbe,
      parse: (value) => requiredRecord(
        value,
        'Persisted private master output probe is invalid.',
      ),
    })
    const runtimeEvidence = buildProfessionalLongFormMasterAssemblyRuntimeEvidence({
      authority,
      authorization,
      executionAttempt,
      queueLeaseEvidence,
      requestEnvelopeSha256: result.evidence.requestEnvelopeSha256,
      chunkSha256s: [...result.evidence.chunkSha256s],
      programAudioSha256: result.evidence.programAudioSha256,
      outputArtifact,
      outputProbeRef,
      outputProbeHash: sha256AuthorityValue(outputProbe),
      confinementEvidenceHash: sha256AuthorityValue(result.evidence.confinement),
      imageIdentityHash: result.image.imageIdentityHash,
      attestationRecordId: result.attestation.recordId,
      attestationHash: result.attestation.attestationHash,
      completedAt: result.attestation.completedAt,
    })
    const runtimeEvidenceRef = await persistExactJson({
      context: input.context,
      value: runtimeEvidence,
      parse: (value) =>
        professionalLongFormMasterAssemblyRuntimeEvidenceSchema.parse(value),
    })
    const latestLeased = await currentAuthority(input.context, {
      workspaceId: authority.identity.workspaceId,
      approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
    })
    const reconciliation = buildProfessionalLongFormMasterAssemblyReconciliation({
      current: latestLeased,
      authority,
      executionAttempt,
      outputArtifact,
      runtimeEvidenceRef,
      reconciledAt: new Date().toISOString(),
    })
    const reconciliationRef = await persistExactJson({
      context: input.context,
      value: reconciliation,
      parse: (value) =>
        professionalLongFormMasterAssemblyReconciliationSchema.parse(value),
    })
    const canonicalResultHash = professionalLongFormMasterAssemblyResultHash({
      authority,
      executionAttempt,
      outputArtifact,
      runtimeEvidenceRef,
      reconciliationEvidenceRef: reconciliationRef,
    })
    const finalizedCost = await costMeter.finalize({
      status: 'completed',
      failureCategory: 'none',
      outputByteLength: outputArtifact.byteLength,
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
    const terminal = buildProfessionalLongFormMasterAssemblyTerminal({
      authority,
      authorization,
      executionAttempt,
      outputArtifact,
      runtimeEvidenceRef,
      reconciliationEvidenceRef: reconciliationRef,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      completedAt: new Date().toISOString(),
    })
    const terminalRef = await persistExactJson({
      context: input.context,
      value: terminal,
      parse: (value) =>
        professionalLongFormMasterAssemblyTerminalSchema.parse(value),
    })
    const completion = buildProfessionalLongFormMasterAssemblyCompletion({
      authority,
      authorization,
      executionAttempt,
      outputArtifact,
      runtimeEvidenceRef,
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
        artifactId: outputArtifact.objectIdentity,
        contentType: outputArtifact.contentType,
        sha256: outputArtifact.sha256,
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
      runtimeEvidence,
      runtimeEvidenceRef,
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
  dependencies: ProfessionalLongFormMasterAssemblyDependencyEvidence
}): Promise<CompletedMasterAssemblyEvidence> {
  const authority = buildProfessionalLongFormMasterAssemblyAuthority({
    ...input,
    heartbeatIntervalMilliseconds: 30_000,
  })
  const entry = assemblyEntry(input.current)
  const authorityRef = entry.professionalLongFormExecutionAuthorization
    ?.authorityRef
  if (!authorityRef) throw invalid('Completed private master lost authority.')
  const persistedAuthority = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: authorityRef,
  })
  const verifiedAuthority = assertProfessionalLongFormMasterAssemblyAuthority({
    value: persistedAuthority,
    ownerUserId: input.ownerUserId,
    current: input.current,
    dependencies: input.dependencies,
    heartbeatIntervalMilliseconds:
      authority.operation.heartbeatIntervalMilliseconds,
  })
  assertExact(verifiedAuthority, authority, 'Replayed master authority changed.')
  const authorization = buildProfessionalLongFormMasterAssemblyAuthorization({
    authority,
    authorityRef,
  })
  assertStoredAuthorization(entry, authorization)
  const executionAttempt = professionalLongFormMasterAssemblyAttemptSchema
    .parse(entry.professionalLongFormExecutionAttempt)
  const completion = professionalLongFormMasterAssemblyCompletionSchema.parse(
    entry.completion?.outcome.professionalLongFormExecution,
  )
  await inspectApprovedInputs({ context: input.context, authority })
  const storedMaster = await inspectCanonicalPrivateLongFormMasterArtifact({
    localStorageRoot: input.context.env.localStorageRoot,
    privateObjectIdentityHash: completion.outputArtifact.objectIdentity,
  })
  if (
    !storedMaster || storedMaster.mediaFormat !== 'mkv' ||
    storedMaster.byteLength !== completion.outputArtifact.byteLength ||
    storedMaster.sha256 !== completion.outputArtifact.sha256
  ) throw invalid('Replayed private master artifact changed.')
  const runtimeEvidence = await readParsedJson({
    context: input.context,
    ref: completion.runtimeEvidenceRef,
    parse: (value) =>
      professionalLongFormMasterAssemblyRuntimeEvidenceSchema.parse(value),
  })
  assertHashed(runtimeEvidence, 'artifactHash')
  const outputProbe = await readParsedJson({
    context: input.context,
    ref: runtimeEvidence.outputProbeRef,
    parse: (value) => requiredRecord(
      value,
      'Replayed private master output probe is invalid.',
    ),
  })
  if (sha256AuthorityValue(outputProbe) !== runtimeEvidence.outputProbeHash) {
    throw invalid('Replayed private master output probe changed.')
  }
  const expectedRuntime = buildProfessionalLongFormMasterAssemblyRuntimeEvidence({
    authority,
    authorization,
    executionAttempt,
    queueLeaseEvidence: runtimeEvidence.queueLeaseEvidence,
    requestEnvelopeSha256: runtimeEvidence.requestEnvelopeSha256,
    chunkSha256s: [...runtimeEvidence.chunkSha256s],
    programAudioSha256: runtimeEvidence.programAudioSha256,
    outputArtifact: runtimeEvidence.outputArtifact,
    outputProbeRef: runtimeEvidence.outputProbeRef,
    outputProbeHash: runtimeEvidence.outputProbeHash,
    confinementEvidenceHash: runtimeEvidence.confinementEvidenceHash,
    imageIdentityHash: runtimeEvidence.runtime.imageIdentityHash,
    attestationRecordId: runtimeEvidence.runtime.attestationRecordId,
    attestationHash: runtimeEvidence.runtime.attestationHash,
    completedAt: runtimeEvidence.completedAt,
  })
  assertExact(runtimeEvidence, expectedRuntime, 'Replayed master runtime changed.')
  const reconciliation = await readParsedJson({
    context: input.context,
    ref: completion.reconciliationEvidenceRef,
    parse: (value) =>
      professionalLongFormMasterAssemblyReconciliationSchema.parse(value),
  })
  const expectedReconciliation =
    buildProfessionalLongFormMasterAssemblyReconciliation({
      current: input.current,
      authority,
      executionAttempt,
      outputArtifact: completion.outputArtifact,
      runtimeEvidenceRef: completion.runtimeEvidenceRef,
      reconciledAt: reconciliation.reconciledAt,
      allowCompletedAssembly: true,
    })
  assertExact(
    reconciliation,
    expectedReconciliation,
    'Replayed master reconciliation changed.',
  )
  const canonicalResultHash = professionalLongFormMasterAssemblyResultHash({
    authority,
    executionAttempt,
    outputArtifact: completion.outputArtifact,
    runtimeEvidenceRef: completion.runtimeEvidenceRef,
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
      professionalLongFormMasterAssemblyTerminalSchema.parse(value),
  })
  const expectedTerminal = buildProfessionalLongFormMasterAssemblyTerminal({
    authority,
    authorization,
    executionAttempt,
    outputArtifact: completion.outputArtifact,
    runtimeEvidenceRef: completion.runtimeEvidenceRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    canonicalResultHash,
    attemptInternalCostEvidenceHash: costEvidence.evidenceHash,
    completedAt: terminal.completedAt,
  })
  assertExact(terminal, expectedTerminal, 'Replayed master terminal changed.')
  if (
    completion.canonicalResultHash !== canonicalResultHash ||
    entry.completion?.outcome.artifactId !== completion.outputArtifact.objectIdentity ||
    entry.completion.outcome.sha256 !== completion.outputArtifact.sha256 ||
    entry.deliveryAttemptCount !== executionAttempt.deliveryAttempt
  ) throw invalid('Replayed private master queue evidence changed.')
  return {
    authority,
    authorityRef,
    authorization,
    executionAttempt,
    runtimeEvidence,
    runtimeEvidenceRef: completion.runtimeEvidenceRef,
    reconciliation,
    reconciliationRef: completion.reconciliationEvidenceRef,
    costEvidence,
    terminal,
    terminalRef: completion.terminalEvidenceRef,
    queueAggregate: input.current.queueAggregate,
  }
}

async function loadDependencies(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
}): Promise<ProfessionalLongFormMasterAssemblyDependencyEvidence> {
  const chunks = [...input.current.postApproval.bridge.binding.plan.chunks]
    .sort((left, right) => left.chunkIndex - right.chunkIndex)
  if (chunks.length < 2) {
    throw inProgress('Private master assembly requires at least two chunks.')
  }
  const chunkQa: ProfessionalLongFormMasterAssemblyDependencyEvidence[
    'chunkQa'
  ] = []
  for (const chunk of chunks) {
    const entry = input.current.queueAggregate.entries.find((candidate) =>
      candidate.definition.approvedWorkItemId === `${chunk.chunkId}:qa`)
    if (!entry?.completion || entry.state !== 'completed') {
      throw inProgress(
        `Private master assembly remains blocked by chunk QA ${chunk.chunkIndex}.`,
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
    chunkQa.push({
      chunkId: chunk.chunkId,
      qaArtifactRef: completion.validationArtifactRef,
      qaArtifact,
    })
  }
  const audioEntry = input.current.queueAggregate.entries.find((candidate) =>
    candidate.definition.approvedWorkItemId ===
      'long-form-mix-continuous-program-audio')
  if (!audioEntry?.completion || audioEntry.state !== 'completed') {
    throw inProgress('Private master assembly remains blocked by program audio.')
  }
  const audioCompletion =
    professionalLongFormContinuousProgramAudioCompletionSchema.parse(
      audioEntry.completion.outcome.professionalLongFormExecution,
    )
  const audioQaArtifact = await readParsedJson({
    context: input.context,
    ref: audioCompletion.qaArtifactRef,
    parse: (value) =>
      professionalLongFormContinuousProgramAudioQaArtifactSchema.parse(value),
  })
  const colorEntry = input.current.queueAggregate.entries.find((candidate) =>
    candidate.definition.approvedWorkItemId ===
      'long-form-validate-cross-chunk-color-continuity')
  if (!colorEntry?.completion || colorEntry.state !== 'completed') {
    throw inProgress(
      'Private master assembly remains blocked by cross-chunk color continuity.',
    )
  }
  const colorCompletion = professionalLongFormCrossChunkColorCompletionSchema
    .parse(colorEntry.completion.outcome.professionalLongFormExecution)
  const colorArtifact = await readParsedJson({
    context: input.context,
    ref: colorCompletion.validationArtifactRef,
    parse: (value) =>
      professionalLongFormCrossChunkColorValidationArtifactSchema.parse(value),
  })
  return {
    chunkQa,
    programAudio: {
      qaArtifactRef: audioCompletion.qaArtifactRef,
      qaArtifact: audioQaArtifact,
    },
    crossChunkColor: {
      validationArtifactRef: colorCompletion.validationArtifactRef,
      validationArtifact: colorArtifact,
    },
  }
}

async function inspectApprovedInputs(input: {
  context: ServiceContext
  authority: ProfessionalLongFormMasterAssemblyAuthority
}): Promise<{
  chunks: Map<number, CanonicalPrivateMediaArtifactInspection>
  programAudio: CanonicalPrivateProgramAudioArtifactInspection
}> {
  const chunks = new Map<number, CanonicalPrivateMediaArtifactInspection>()
  for (const chunk of input.authority.approvedAssemblyPlan.chunks) {
    const stored = await inspectCanonicalPrivateObjectChunkMediaArtifact({
      localStorageRoot: input.context.env.localStorageRoot,
      privateObjectIdentityHash: chunk.renderArtifact.objectIdentity,
    })
    if (
      !stored || stored.mediaFormat !== 'mkv' ||
      stored.byteLength !== chunk.renderArtifact.byteLength ||
      stored.sha256 !== chunk.renderArtifact.sha256
    ) throw invalid(`Private chunk ${chunk.chunkIndex} changed after QA.`)
    chunks.set(chunk.chunkIndex, stored)
  }
  const audio = input.authority.approvedAssemblyPlan.programAudio.artifact
  const programAudio = await inspectCanonicalPrivateProgramAudioArtifact({
    localStorageRoot: input.context.env.localStorageRoot,
    privateObjectIdentityHash: audio.objectIdentity,
  })
  if (
    !programAudio || programAudio.byteLength !== audio.byteLength ||
    programAudio.sha256 !== audio.sha256
  ) throw invalid('Private program audio changed after QA.')
  return { chunks, programAudio }
}

function buildRuntimeRequest(input: {
  authority: ProfessionalLongFormMasterAssemblyAuthority
  inspected: {
    chunks: Map<number, CanonicalPrivateMediaArtifactInspection>
    programAudio: CanonicalPrivateProgramAudioArtifactInspection
  }
}) {
  const plan = input.authority.approvedAssemblyPlan
  return buildOfflineMediaBinaryLongFormMasterAssemblyRequest({
    planningPayload: {
      recipeProfileId: OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_RECIPE,
      assemblyAuthorityHash: plan.assemblyAuthorityHash,
      expectedObjectIdentity: plan.privateObjectIdentityHash,
      width: plan.width,
      height: plan.height,
      fps: 30,
      totalFrames: plan.totalFrames,
      chunks: plan.chunks.map((chunk) => ({
        chunkId: chunk.chunkId,
        chunkIndex: chunk.chunkIndex,
        chunkCount: chunk.chunkCount,
        globalStartFrame: chunk.globalStartFrame,
        globalEndFrameExclusive: chunk.globalEndFrameExclusive,
        durationFrames: chunk.durationFrames,
        objectIdentity: chunk.renderArtifact.objectIdentity,
        boundaryBefore: chunk.boundaryBefore,
      })),
      crossChunkColorValidationHash: plan.crossChunkColor.validationHash,
      continuousProgramAudioQaHash: plan.programAudio.qaArtifactHash,
      videoAssemblyPolicy: 'ordered_vp9_object_chunk_stream_copy_v1',
      audioAssemblyPolicy: 'continuous_flac_program_audio_stream_copy_v1',
      timestampPolicy:
        'normalize_from_zero_preserve_frame_and_sample_time_v1',
      compatibilityPolicy:
        'exact_vp9_bt709_4k_30fps_and_flac_48k_stereo_v1',
      outputContainer: 'matroska',
      outputVideoCodec: 'copy_vp9',
      outputAudioCodec: 'copy_flac',
      renderPurpose: 'private_4k_long_form_review_master_v1',
      usesApprovedEditReservation: true,
      requiresSeparateExportEstimate: false,
      allowsAdditionalExportCharge: false,
      mediaReencodingAllowed: false,
    },
    chunks: plan.chunks.map((chunk) => {
      const stored = input.inspected.chunks.get(chunk.chunkIndex)!
      return {
        inputId: `approved-master-chunk-${chunk.chunkIndex}`,
        chunkId: chunk.chunkId,
        chunkIndex: chunk.chunkIndex,
        objectIdentity: chunk.renderArtifact.objectIdentity,
        mimeType: 'video/x-matroska' as const,
        byteLength: stored.byteLength,
        sha256: stored.sha256,
      }
    }),
    programAudio: {
      inputId: 'approved-master-program-audio',
      objectIdentity: plan.programAudio.artifact.objectIdentity,
      mimeType: 'audio/flac',
      byteLength: input.inspected.programAudio.byteLength,
      sha256: input.inspected.programAudio.sha256,
    },
  })
}

function assertRuntimeResult(input: {
  authority: ProfessionalLongFormMasterAssemblyAuthority
  requestHash: string
  result: OfflineFfmpegLongFormMasterAssemblyExecutionResult
}): void {
  const plan = input.authority.approvedAssemblyPlan
  const semantic = input.result.evidence.semanticEvidence
  const confinement = input.result.evidence.confinement
  if (
    input.result.resultArtifact.mimeType !== 'video/x-matroska' ||
    input.result.resultArtifact.outputMode !==
      'server_committed_private_stream_v1' ||
    input.result.evidence.toolId !== 'ffmpeg' ||
    input.result.evidence.operationId !==
      PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID ||
    input.result.evidence.requestEnvelopeSha256 !== input.requestHash ||
    stableAuthorityStringify(input.result.evidence.chunkSha256s) !==
      stableAuthorityStringify(
        plan.chunks.map((chunk) => chunk.renderArtifact.sha256),
      ) ||
    input.result.evidence.programAudioSha256 !== plan.programAudio.artifact.sha256 ||
    input.result.evidence.resultSha256 !== input.result.resultArtifact.sha256 ||
    input.result.evidence.containerExitCode !== 0 || input.result.evidence.oomKilled ||
    confinement.networkMode !== 'none' ||
    confinement.readOnlyRootFilesystem !== true ||
    confinement.user !== '65532:65532' || confinement.capDropAll !== true ||
    confinement.noNewPrivileges !== true ||
    semantic.fixedRecipeExecuted !== true ||
    semantic.recipeProfileId !==
      OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_RECIPE ||
    semantic.everyPrivateInputChecksumVerified !== true ||
    semantic.chunkCount !== plan.chunkCount ||
    semantic.orderedVp9ObjectChunksStreamCopied !== true ||
    semantic.continuousFlacProgramAudioStreamCopied !== true ||
    semantic.videoOrAudioReencoded !== false ||
    semantic.completeFrameAndSampleTimelineMuxed !== true ||
    semantic.outputProbeVerified !== true ||
    semantic.originalApprovedEditReservationUsed !== true ||
    semantic.separateExportEstimateRequired !== false ||
    semantic.additionalExportChargeAllowed !== false ||
    semantic.publicDeliveryAuthorized !== false ||
    input.result.readiness.productReady || input.result.readiness.productionReady
  ) throw invalid('Confined private master assembly result failed closed.')
}

async function currentAuthority(
  context: ServiceContext,
  input: { workspaceId: string; approvedPlanSnapshotId: string },
) {
  return createCanonicalProfessionalLongFormChildPackagePromotionService(
    context,
  ).loadCurrent(input)
}

function assemblyEntry(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
) {
  const entry = current.queueAggregate.entries.find((candidate) =>
    candidate.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_WORK_ITEM_ID)
  const job = current.postApproval.childJobManifest.jobs.find((candidate) =>
    candidate.childWorkItemId ===
      PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_WORK_ITEM_ID)
  if (
    !entry || !job || job.kind !== PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_KIND ||
    entry.definition.jobId !== job.jobId
  ) throw invalid('Canonical queue lost private master assembly identity.')
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
  assertExact(verified, input.authority, 'Persisted master authority changed.')
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
  assertExact(parsed, input.value, 'Persisted private master JSON changed.')
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
    throw invalid('Private master content-addressed JSON changed.')
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
  authority: ProfessionalLongFormMasterAssemblyAuthority
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
    throw invalid('Private master internal attempt cost evidence is missing.')
  }
  assertCostEvidence({ ...input, evidence })
  return evidence
}

function assertCostEvidence(input: {
  evidence: PrivateInternalAttemptCostEvidence
  authority: ProfessionalLongFormMasterAssemblyAuthority
  executionAttemptId: string
  canonicalResultHash: string
}): void {
  const serialized = stableAuthorityStringify(input.evidence)
  if (
    input.evidence.boundary !== 'internal_production_cost_only' ||
    input.evidence.identity.toolId !== 'ffmpeg' ||
    input.evidence.identity.operationId !==
      PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID ||
    !('workloadProfileId' in input.evidence.identity) ||
    input.evidence.identity.workloadProfileId !==
      PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COST_PROFILE_ID ||
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
  ) throw invalid('Private master cost crossed a commercial boundary.')
}

function assertStoredAuthorization(
  entry: ReturnType<typeof assemblyEntry>,
  authorization: ProfessionalLongFormMasterAssemblyAuthorization,
): void {
  if (
    !entry.professionalLongFormExecutionAuthorization ||
    stableAuthorityStringify(entry.professionalLongFormExecutionAuthorization) !==
      stableAuthorityStringify(authorization)
  ) throw invalid('Stored private master authorization changed.')
}

function assertUnexpired(value: string): void {
  if (Date.parse(value) <= Date.now()) {
    throw new ApiError(
      'CREDITS_NOT_RESERVED',
      'Private master assembly requires an unexpired funded reservation.',
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
    throw invalid(`Private master ${key} checksum changed.`)
  }
}

function requiredRecord(
  value: unknown,
  message: string,
): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(message)
  }
  return value as Readonly<Record<string, unknown>>
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
    requiredGate: 'canonical_professional_long_form_master_assembly',
  })
}

function inProgress(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409)
}
