import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  assertProfessionalLongFormContinuousProgramAudioAuthority,
  buildProfessionalLongFormContinuousProgramAudioAuthority,
  buildProfessionalLongFormContinuousProgramAudioAuthorization,
  buildProfessionalLongFormContinuousProgramAudioCompletion,
  buildProfessionalLongFormContinuousProgramAudioQaArtifact,
  buildProfessionalLongFormContinuousProgramAudioReconciliation,
  buildProfessionalLongFormContinuousProgramAudioRuntimeEvidence,
  buildProfessionalLongFormContinuousProgramAudioTerminal,
  professionalLongFormContinuousProgramAudioResultHash,
} from '../edit-architecture/professional-long-form-continuous-program-audio-execution'
import {
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_KIND,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_WORK_ITEM_ID,
  professionalLongFormContinuousProgramAudioAttemptSchema,
  professionalLongFormContinuousProgramAudioCompletionSchema,
  professionalLongFormContinuousProgramAudioQaArtifactSchema,
  professionalLongFormContinuousProgramAudioReconciliationSchema,
  professionalLongFormContinuousProgramAudioRuntimeEvidenceSchema,
  professionalLongFormContinuousProgramAudioTerminalSchema,
  type ProfessionalLongFormContinuousProgramAudioArtifactRef,
  type ProfessionalLongFormContinuousProgramAudioAttempt,
  type ProfessionalLongFormContinuousProgramAudioAuthority,
  type ProfessionalLongFormContinuousProgramAudioAuthorization,
  type ProfessionalLongFormContinuousProgramAudioQaArtifact,
  type ProfessionalLongFormContinuousProgramAudioReconciliation,
  type ProfessionalLongFormContinuousProgramAudioRuntimeEvidence,
  type ProfessionalLongFormContinuousProgramAudioTerminal,
} from '../edit-architecture/professional-long-form-continuous-program-audio-execution-contract'
import {
  OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_OUTPUT_BYTES,
  OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_RECIPE,
  buildOfflineMediaBinaryContinuousProgramAudioRequest,
  openPrivateOfflineMediaBinaryRuntime,
  type OfflineContinuousProgramAudioQaExecutionResult,
  type OfflineFfmpegContinuousProgramAudioExecutionResult,
  type OfflineMediaBinaryContinuousProgramAudioRequest,
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
import { createCanonicalPrivateSourceObjectReadService } from
  './canonical-private-source-object-read-service'
import {
  inspectCanonicalPrivateProgramAudioArtifact,
  persistCanonicalPrivateProgramAudioArtifactStream,
} from './canonical-private-program-audio-artifact-storage'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_EXECUTION_VERSION =
  'canonical-professional-long-form-continuous-program-audio-execution-v1' as const

type CostMeter = Awaited<ReturnType<typeof beginPrivateInternalAttemptCostEvidence>>

interface CompletedProgramAudioEvidence {
  authority: ProfessionalLongFormContinuousProgramAudioAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormContinuousProgramAudioAuthorization
  executionAttempt: ProfessionalLongFormContinuousProgramAudioAttempt
  runtimeEvidence: ProfessionalLongFormContinuousProgramAudioRuntimeEvidence
  runtimeEvidenceRef: AuthorityJsonBlobRef
  outputArtifact: ProfessionalLongFormContinuousProgramAudioArtifactRef
  qaArtifact: ProfessionalLongFormContinuousProgramAudioQaArtifact
  qaArtifactRef: AuthorityJsonBlobRef
  reconciliation: ProfessionalLongFormContinuousProgramAudioReconciliation
  reconciliationRef: AuthorityJsonBlobRef
  assemblyCostEvidence: PrivateInternalAttemptCostEvidence
  qaCostEvidence: PrivateInternalAttemptCostEvidence
  terminal: ProfessionalLongFormContinuousProgramAudioTerminal
  terminalRef: AuthorityJsonBlobRef
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
}

export interface CanonicalProfessionalLongFormContinuousProgramAudioExecutionEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_EXECUTION_VERSION
  source:
    'canonical_professional_long_form_continuous_program_audio_execution_service'
  status:
    'continuous_program_audio_and_independent_qa_completed_remaining_graph_blocked'
  disposition: 'completed' | 'exact_replay'
  programAudio: Omit<CompletedProgramAudioEvidence, 'queueAggregate'>
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  readiness: {
    approvedSnapshotReopenedAndVerified: true
    fundedFourKEstimateReservationReused: true
    leaseAndOneUseDispatchVerified: true
    heartbeatAndBoundedLeaseVerified: true
    exactPrivateSourcesStagedAndChecksummed: true
    fixedLosslessSourceAudioAssemblyExecuted: true
    createOnlyPrivateFlacPersistenceVerified: true
    exactPersistedFlacIndependentlyProbed: true
    exactDecodedSampleCountAndDurationVerified: true
    assemblyAttemptInternalCostVerified: true
    qaAttemptInternalCostVerified: true
    queueCompletionCount: number
    remainingIncompleteChildJobCount: number
    finalizationStillDependencyBlocked: true
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

export function createCanonicalProfessionalLongFormContinuousProgramAudioExecutionService(
  context: ServiceContext,
) {
  return {
    async execute(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormContinuousProgramAudioExecutionEvidence> {
      if (
        !input || typeof input !== 'object' ||
        Object.keys(input).sort().join('|') !==
          'approvedPlanSnapshotId|workspaceId'
      ) throw invalid(
        'Program-audio selection is server-owned and accepts no caller source, range, recipe, path, command, codec, cost, or artifact fields.',
      )
      const ownerUserId = context.auth?.userId
      if (!ownerUserId) {
        throw new ApiError(
          'AUTH_REQUIRED',
          'Continuous program-audio execution requires authenticated authority.',
          401,
        )
      }
      const current = await currentAuthority(context, input)
      const entry = programAudioEntry(current)
      let completed: CompletedProgramAudioEvidence
      let disposition: 'completed' | 'exact_replay'
      if (entry.state === 'completed') {
        completed = await loadCompleted({ context, current, ownerUserId })
        disposition = 'exact_replay'
      } else {
        if (entry.state === 'leased') {
          throw inProgress('Continuous program-audio already has an active lease.')
        }
        completed = await executeNew({ context, current, ownerUserId })
        disposition = 'completed'
      }
      const aggregate = completed.queueAggregate
      const completedEntry = programAudioEntry({
        ...current,
        queueAggregate: aggregate,
      })
      if (
        completedEntry.state !== 'completed' ||
        completedEntry.professionalLongFormExecutionAttempt?.deliveryAttempt !==
          completedEntry.deliveryAttemptCount ||
        aggregate.summary.leasedJobCount !== 0 ||
        aggregate.summary.completedJobCount < 4 ||
        aggregate.summary.completedJobCount >= aggregate.summary.totalJobCount ||
        aggregate.entries.filter((candidate) => candidate.state !== 'completed')
          .some((candidate) => candidate.state !== 'queued')
      ) throw invalid(
        'Continuous program-audio completion did not preserve the remaining canonical graph.',
      )
      const programAudio = withoutAggregate(completed)
      const stablePayload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_EXECUTION_VERSION,
        source:
          'canonical_professional_long_form_continuous_program_audio_execution_service' as const,
        status:
          'continuous_program_audio_and_independent_qa_completed_remaining_graph_blocked' as const,
        programAudio,
        queueAggregate: aggregate,
        readiness: {
          approvedSnapshotReopenedAndVerified: true as const,
          fundedFourKEstimateReservationReused: true as const,
          leaseAndOneUseDispatchVerified: true as const,
          heartbeatAndBoundedLeaseVerified: true as const,
          exactPrivateSourcesStagedAndChecksummed: true as const,
          fixedLosslessSourceAudioAssemblyExecuted: true as const,
          createOnlyPrivateFlacPersistenceVerified: true as const,
          exactPersistedFlacIndependentlyProbed: true as const,
          exactDecodedSampleCountAndDurationVerified: true as const,
          assemblyAttemptInternalCostVerified: true as const,
          qaAttemptInternalCostVerified: true as const,
          queueCompletionCount: aggregate.summary.completedJobCount,
          remainingIncompleteChildJobCount:
            aggregate.summary.totalJobCount - aggregate.summary.completedJobCount,
          finalizationStillDependencyBlocked: true as const,
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
}): Promise<CompletedProgramAudioEvidence> {
  const authority = buildProfessionalLongFormContinuousProgramAudioAuthority({
    ...input,
    heartbeatIntervalMilliseconds: 30_000,
  })
  assertUnexpired(authority.approval.reservationExpiresAt)
  const authorityRef = await persistAuthority({
    context: input.context,
    authority,
    verify(value) {
      return assertProfessionalLongFormContinuousProgramAudioAuthority({
        value,
        ownerUserId: input.ownerUserId,
        current: input.current,
        heartbeatIntervalMilliseconds:
          authority.operation.heartbeatIntervalMilliseconds,
      })
    },
  })
  const authorization =
    buildProfessionalLongFormContinuousProgramAudioAuthorization({
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
    workerIdentity:
      'canonical-professional-long-form-continuous-program-audio-v1',
    workerType: 'cpu_analysis_worker',
    now: new Date().toISOString(),
    leaseDurationMs: authority.operation.leaseDurationMilliseconds,
  })
  if (claim.disposition !== 'claimed') {
    throw inProgress(`Continuous program-audio claim remained ${claim.disposition}.`)
  }
  const begun = await beginPrivateCanonicalPackageWorkQueueExecutionAttempt({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
    now: new Date().toISOString(),
  })
  const executionAttempt =
    professionalLongFormContinuousProgramAudioAttemptSchema.parse(
      begun.executionAttempt,
    )
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
  const heartbeatClaim = programAudioEntry(heartbeatCurrent).activeClaim
  if (
    !heartbeatClaim || heartbeatClaim.claimId !== executionAttempt.claimId ||
    heartbeatClaim.deliveryAttempt !== executionAttempt.deliveryAttempt ||
    heartbeatClaim.heartbeatCount < 1 ||
    heartbeatClaim.claimHash === executionAttempt.claimHash
  ) throw invalid('Continuous program-audio heartbeat was not durably observed.')
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

  let assemblyCostMeter: CostMeter | undefined
  let qaCostMeter: CostMeter | undefined
  let assemblyCostFinalized = false
  let qaCostFinalized = false
  let heartbeatStopped = false
  const qaExecutionAttemptId = `${executionAttempt.executionAttemptId}:ffprobe-qa`
  try {
    assemblyCostMeter = await beginPrivateInternalAttemptCostEvidence({
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
      operationId: PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_OPERATION_ID,
      workloadProfileId:
        PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_COST_PROFILE_ID,
    })
    const parentWorkItem = input.current.authority.workItems.find((workItem) =>
      workItem.id ===
        input.current.package.identity.parentControllerApprovedWorkItemId)
    if (!parentWorkItem) {
      throw invalid('Approved long-form controller work item is missing.')
    }
    const staged = await createCanonicalPrivateSourceObjectReadService(
      input.context,
    ).stageExactApprovedSourceSubset({
      workspaceId: authority.identity.workspaceId,
      projectId: authority.identity.projectId,
      editSessionId: authority.identity.editSessionId,
      snapshotId: authority.identity.approvedPlanSnapshotId,
      jobId: authority.identity.jobId,
      approvedWorkItem: parentWorkItem,
      approvedSourceManifest: input.current.authority.sourceAssetManifest,
      leaseId: claim.entry.activeClaim.claimId,
      executionAttemptId: executionAttempt.executionAttemptId,
      dispatchGrantId: authorization.authorizationId,
    }, authority.approvedAudioPlan.sources.map((source) =>
      source.sourceSequenceItemId))
    try {
      const request = buildRuntimeRequest(authority, staged.sources)
      const runtime = await openPrivateOfflineMediaBinaryRuntime()
      const result = await runtime.executeContinuousProgramAudioServerInjected(
        request,
        staged.sources.map((source) => source.sourceInput),
        {
          maximumBytes:
            OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_OUTPUT_BYTES,
          async persist(output) {
            if (output.mimeType !== 'audio/flac') {
              throw invalid('Program-audio runner returned the wrong media type.')
            }
            const stored =
              await persistCanonicalPrivateProgramAudioArtifactStream({
                localStorageRoot: input.context.env.localStorageRoot,
                privateObjectIdentityHash:
                  authority.approvedAudioPlan.privateObjectIdentityHash,
                stream: output.stream,
                expectedByteLength: output.expectedByteLength,
                expectedSha256: output.expectedSha256,
              })
            return { byteLength: stored.byteLength, sha256: stored.sha256 }
          },
        },
      )
      assertAssemblyRuntimeResult({ authority, stagedSources: staged.sources, result })
      const stored = await inspectCanonicalPrivateProgramAudioArtifact({
        localStorageRoot: input.context.env.localStorageRoot,
        privateObjectIdentityHash:
          authority.approvedAudioPlan.privateObjectIdentityHash,
      })
      if (
        !stored || stored.mediaFormat !== 'flac' ||
        stored.byteLength !== result.resultArtifact.byteLength ||
        stored.sha256 !== result.resultArtifact.sha256
      ) throw invalid('Program-audio changed after private persistence.')
      const outputArtifact: ProfessionalLongFormContinuousProgramAudioArtifactRef = {
        objectIdentity: authority.approvedAudioPlan.privateObjectIdentityHash,
        mediaFormat: 'flac',
        contentType: 'audio/flac',
        byteLength: stored.byteLength,
        sha256: stored.sha256,
        totalFrames: authority.approvedAudioPlan.totalFrames,
        sampleCount: authority.approvedAudioPlan.totalFrames * 1_600,
        sampleRate: 48_000,
        channels: 2,
        bitsPerRawSample: 24,
        objectVersion: 1,
        assetRole: 'processed',
        placeholderAllowed: false,
        privateLocalCreateOnly: true,
        databaseBacked: false,
        publicDeliveryAuthorized: false,
      }
      const runtimeEvidence =
        buildProfessionalLongFormContinuousProgramAudioRuntimeEvidence({
          authority,
          authorization,
          executionAttempt,
          sourceReadEvidenceHashes: staged.sources.map((source) =>
            source.sourceReadEvidenceHash),
          sourceStagingEvidenceHashes: staged.sources.map((source) =>
            source.stagingEvidenceHash),
          sourceSha256s: staged.sources.map((source) => source.sha256),
          capacityEvidenceHash: staged.capacityEvidenceHash,
          queueLeaseEvidence,
          outputArtifact,
          result,
        })
      const runtimeEvidenceRef = await persistExactJson({
        context: input.context,
        value: runtimeEvidence,
        parse: (value) =>
          professionalLongFormContinuousProgramAudioRuntimeEvidenceSchema.parse(
            value,
          ),
      })

      qaCostMeter = await beginPrivateInternalAttemptCostEvidence({
        localStorageRoot: input.context.env.localStorageRoot,
        workspaceId: authority.identity.workspaceId,
        projectId: authority.identity.projectId,
        editSessionId: authority.identity.editSessionId,
        approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
        approvedWorkItemId: authority.identity.approvedWorkItemId,
        jobId: authority.identity.jobId,
        executionAttemptId: qaExecutionAttemptId,
        retryAttempt: executionAttempt.deliveryAttempt,
        toolId: 'ffprobe',
        operationId:
          PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_OPERATION_ID,
        workloadProfileId:
          PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_COST_PROFILE_ID,
      })
      const qaResult =
        await runtime.executeContinuousProgramAudioQaServerInjected(request, {
          inputMode: 'private_verified_stream_v1',
          byteLength: stored.byteLength,
          sha256: stored.sha256,
          openStream: stored.openStream,
        })
      assertQaRuntimeResult({ authority, outputArtifact, result: qaResult })
      const rawQaResultRef = await persistExactJson({
        context: input.context,
        value: qaResult.resultJson.document,
        parse: (value) => value as Readonly<Record<string, unknown>>,
      })
      const qaRuntimeReceipt = buildQaRuntimeReceipt({
        qaExecutionAttemptId,
        result: qaResult,
      })
      const qaRuntimeEvidenceRef = await persistExactJson({
        context: input.context,
        value: qaRuntimeReceipt,
        parse: (value) => value as typeof qaRuntimeReceipt,
      })
      const qaArtifact =
        buildProfessionalLongFormContinuousProgramAudioQaArtifact({
          authority,
          executionAttempt,
          qaExecutionAttemptId,
          outputArtifact,
          rawQaResultRef,
          qaRuntimeEvidenceRef,
          result: qaResult,
        })
      const qaArtifactRef = await persistExactJson({
        context: input.context,
        value: qaArtifact,
        parse: (value) =>
          professionalLongFormContinuousProgramAudioQaArtifactSchema.parse(
            value,
          ),
      })
      const latestLeased = await currentAuthority(input.context, {
        workspaceId: authority.identity.workspaceId,
        approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
      })
      const reconciliation =
        buildProfessionalLongFormContinuousProgramAudioReconciliation({
          current: latestLeased,
          authority,
          executionAttempt,
          outputArtifact,
          runtimeEvidenceRef,
          qaArtifactRef,
          reconciledAt: new Date().toISOString(),
        })
      const reconciliationRef = await persistExactJson({
        context: input.context,
        value: reconciliation,
        parse: (value) =>
          professionalLongFormContinuousProgramAudioReconciliationSchema.parse(
            value,
          ),
      })
      const canonicalResultHash =
        professionalLongFormContinuousProgramAudioResultHash({
          authority,
          executionAttempt,
          outputArtifact,
          runtimeEvidenceRef,
          qaArtifactRef,
          reconciliationEvidenceRef: reconciliationRef,
        })
      const finalizedAssemblyCost = await assemblyCostMeter.finalize({
        status: 'completed',
        failureCategory: 'none',
        outputByteLength: outputArtifact.byteLength,
        linkedCanonicalOutcomeHash: canonicalResultHash,
      })
      assemblyCostFinalized = true
      assertCostEvidence({
        evidence: finalizedAssemblyCost.evidence,
        authority,
        executionAttemptId: executionAttempt.executionAttemptId,
        toolId: 'ffmpeg',
        operationId:
          PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_OPERATION_ID,
        workloadProfileId:
          PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_COST_PROFILE_ID,
        canonicalResultHash,
      })
      const finalizedQaCost = await qaCostMeter.finalize({
        status: 'completed',
        failureCategory: 'none',
        outputByteLength: qaArtifactRef.byteLength,
        linkedCanonicalOutcomeHash: canonicalResultHash,
      })
      qaCostFinalized = true
      assertCostEvidence({
        evidence: finalizedQaCost.evidence,
        authority,
        executionAttemptId: qaExecutionAttemptId,
        toolId: 'ffprobe',
        operationId:
          PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_OPERATION_ID,
        workloadProfileId:
          PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_COST_PROFILE_ID,
        canonicalResultHash,
      })
      await heartbeat.stop()
      heartbeatStopped = true
      const terminal =
        buildProfessionalLongFormContinuousProgramAudioTerminal({
          authority,
          authorization,
          executionAttempt,
          qaExecutionAttemptId,
          outputArtifact,
          runtimeEvidenceRef,
          qaArtifactRef,
          reconciliationEvidenceRef: reconciliationRef,
          canonicalResultHash,
          attemptInternalCostEvidenceHash:
            finalizedAssemblyCost.evidence.evidenceHash,
          qaAttemptInternalCostEvidenceHash:
            finalizedQaCost.evidence.evidenceHash,
          completedAt: new Date().toISOString(),
        })
      const terminalRef = await persistExactJson({
        context: input.context,
        value: terminal,
        parse: (value) =>
          professionalLongFormContinuousProgramAudioTerminalSchema.parse(value),
      })
      const completion =
        buildProfessionalLongFormContinuousProgramAudioCompletion({
          authority,
          authorization,
          executionAttempt,
          qaExecutionAttemptId,
          outputArtifact,
          runtimeEvidenceRef,
          qaArtifactRef,
          reconciliationEvidenceRef: reconciliationRef,
          terminalEvidenceRef: terminalRef,
          canonicalResultHash,
          attemptInternalCostEvidenceHash:
            finalizedAssemblyCost.evidence.evidenceHash,
          qaAttemptInternalCostEvidenceHash:
            finalizedQaCost.evidence.evidenceHash,
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
        outputArtifact,
        qaArtifact,
        qaArtifactRef,
        reconciliation,
        reconciliationRef,
        assemblyCostEvidence: finalizedAssemblyCost.evidence,
        qaCostEvidence: finalizedQaCost.evidence,
        terminal,
        terminalRef,
        queueAggregate: aggregate,
      }
    } finally {
      await staged.cleanup()
    }
  } catch (error) {
    if (!heartbeatStopped) await heartbeat.stop().catch(() => undefined)
    if (qaCostMeter && !qaCostFinalized) {
      await qaCostMeter.finalize({
        status: 'failed',
        failureCategory: classifyPrivateInternalAttemptCostFailure(error),
        outputByteLength: null,
        linkedCanonicalOutcomeHash: null,
      }).catch(() => undefined)
    }
    if (assemblyCostMeter && !assemblyCostFinalized) {
      await assemblyCostMeter.finalize({
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
}): Promise<CompletedProgramAudioEvidence> {
  const authority = buildProfessionalLongFormContinuousProgramAudioAuthority({
    ...input,
    heartbeatIntervalMilliseconds: 30_000,
  })
  const entry = programAudioEntry(input.current)
  const authorityRef = entry.professionalLongFormExecutionAuthorization
    ?.authorityRef
  if (!authorityRef) throw invalid('Completed program-audio lost its authority ref.')
  const persistedAuthority = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: authorityRef,
  })
  const verifiedAuthority =
    assertProfessionalLongFormContinuousProgramAudioAuthority({
      value: persistedAuthority,
      ownerUserId: input.ownerUserId,
      current: input.current,
      heartbeatIntervalMilliseconds:
        authority.operation.heartbeatIntervalMilliseconds,
    })
  assertExact(verifiedAuthority, authority, 'Replayed program-audio authority changed.')
  const authorization =
    buildProfessionalLongFormContinuousProgramAudioAuthorization({
      authority,
      authorityRef,
    })
  assertStoredAuthorization(entry, authorization)
  const executionAttempt =
    professionalLongFormContinuousProgramAudioAttemptSchema.parse(
      entry.professionalLongFormExecutionAttempt,
    )
  const completion =
    professionalLongFormContinuousProgramAudioCompletionSchema.parse(
      entry.completion?.outcome.professionalLongFormExecution,
    )
  const runtimeEvidence = await readParsedJson({
    context: input.context,
    ref: completion.runtimeEvidenceRef,
    parse: (value) =>
      professionalLongFormContinuousProgramAudioRuntimeEvidenceSchema.parse(
        value,
      ),
  })
  assertHashed(runtimeEvidence, 'artifactHash')
  const output = await inspectCanonicalPrivateProgramAudioArtifact({
    localStorageRoot: input.context.env.localStorageRoot,
    privateObjectIdentityHash: completion.outputArtifact.objectIdentity,
  })
  if (
    !output || output.byteLength !== completion.outputArtifact.byteLength ||
    output.sha256 !== completion.outputArtifact.sha256 ||
    entry.completion?.outcome.artifactId !==
      completion.outputArtifact.objectIdentity ||
    entry.completion?.outcome.sha256 !== completion.outputArtifact.sha256
  ) throw invalid('Replayed private program-audio artifact changed.')
  const qaArtifact = await readParsedJson({
    context: input.context,
    ref: completion.qaArtifactRef,
    parse: (value) =>
      professionalLongFormContinuousProgramAudioQaArtifactSchema.parse(value),
  })
  assertHashed(qaArtifact, 'qaHash')
  const rawQa = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: qaArtifact.rawQaResultRef,
  }) as Record<string, unknown>
  const qaRuntimeReceipt = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: qaArtifact.qaRuntimeEvidenceRef,
  }) as Record<string, unknown>
  assertQaReplay({ authority, completion, qaArtifact, rawQa, qaRuntimeReceipt })
  const reconciliation = await readParsedJson({
    context: input.context,
    ref: completion.reconciliationEvidenceRef,
    parse: (value) =>
      professionalLongFormContinuousProgramAudioReconciliationSchema.parse(
        value,
      ),
  })
  const expectedReconciliation =
    buildProfessionalLongFormContinuousProgramAudioReconciliation({
      current: input.current,
      authority,
      executionAttempt,
      outputArtifact: completion.outputArtifact,
      runtimeEvidenceRef: completion.runtimeEvidenceRef,
      qaArtifactRef: completion.qaArtifactRef,
      reconciledAt: reconciliation.reconciledAt,
      allowCompletedAudio: true,
    })
  assertExact(
    reconciliation,
    expectedReconciliation,
    'Replayed program-audio reconciliation changed.',
  )
  const canonicalResultHash =
    professionalLongFormContinuousProgramAudioResultHash({
      authority,
      executionAttempt,
      outputArtifact: completion.outputArtifact,
      runtimeEvidenceRef: completion.runtimeEvidenceRef,
      qaArtifactRef: completion.qaArtifactRef,
      reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    })
  const assemblyCostEvidence = await requiredCostEvidence({
    context: input.context,
    authority,
    executionAttemptId: executionAttempt.executionAttemptId,
    expectedHash: completion.attemptInternalCostEvidenceHash,
    toolId: 'ffmpeg',
    operationId: PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_OPERATION_ID,
    workloadProfileId:
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_COST_PROFILE_ID,
    canonicalResultHash,
  })
  const qaCostEvidence = await requiredCostEvidence({
    context: input.context,
    authority,
    executionAttemptId: completion.qaExecutionAttemptId,
    expectedHash: completion.qaAttemptInternalCostEvidenceHash,
    toolId: 'ffprobe',
    operationId:
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_OPERATION_ID,
    workloadProfileId:
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_COST_PROFILE_ID,
    canonicalResultHash,
  })
  const terminal = await readParsedJson({
    context: input.context,
    ref: completion.terminalEvidenceRef,
    parse: (value) =>
      professionalLongFormContinuousProgramAudioTerminalSchema.parse(value),
  })
  const expectedTerminal =
    buildProfessionalLongFormContinuousProgramAudioTerminal({
      authority,
      authorization,
      executionAttempt,
      qaExecutionAttemptId: completion.qaExecutionAttemptId,
      outputArtifact: completion.outputArtifact,
      runtimeEvidenceRef: completion.runtimeEvidenceRef,
      qaArtifactRef: completion.qaArtifactRef,
      reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: assemblyCostEvidence.evidenceHash,
      qaAttemptInternalCostEvidenceHash: qaCostEvidence.evidenceHash,
      completedAt: terminal.completedAt,
    })
  assertExact(terminal, expectedTerminal, 'Replayed program-audio terminal changed.')
  if (
    completion.canonicalResultHash !== canonicalResultHash ||
    completion.outputArtifact.sha256 !== runtimeEvidence.outputArtifact.sha256 ||
    completion.outputArtifact.sha256 !== qaArtifact.outputArtifact.sha256 ||
    entry.deliveryAttemptCount !== executionAttempt.deliveryAttempt
  ) throw invalid('Replayed program-audio queue evidence changed.')
  return {
    authority,
    authorityRef,
    authorization,
    executionAttempt,
    runtimeEvidence,
    runtimeEvidenceRef: completion.runtimeEvidenceRef,
    outputArtifact: completion.outputArtifact,
    qaArtifact,
    qaArtifactRef: completion.qaArtifactRef,
    reconciliation,
    reconciliationRef: completion.reconciliationEvidenceRef,
    assemblyCostEvidence,
    qaCostEvidence,
    terminal,
    terminalRef: completion.terminalEvidenceRef,
    queueAggregate: input.current.queueAggregate,
  }
}

function buildRuntimeRequest(
  authority: ProfessionalLongFormContinuousProgramAudioAuthority,
  stagedSources: Array<{
    sourceSequenceItemId: string
    mediaAssetId: string
    byteLength: number
    sha256: string
  }>,
): OfflineMediaBinaryContinuousProgramAudioRequest {
  const stagedBySequenceId = new Map(stagedSources.map((source) => [
    source.sourceSequenceItemId,
    source,
  ]))
  const sources = authority.approvedAudioPlan.sources.map((source) => {
    const staged = stagedBySequenceId.get(source.sourceSequenceItemId)
    if (
      !staged || staged.mediaAssetId !== source.mediaAssetId ||
      staged.byteLength !== source.byteLength || staged.sha256 !== source.sha256
    ) throw invalid('Staged source changed from approved program-audio authority.')
    return { ...source }
  })
  return buildOfflineMediaBinaryContinuousProgramAudioRequest({
    planningPayload: {
      recipeProfileId: OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_RECIPE,
      audioAuthorityHash: authority.approvedAudioPlan.audioAuthorityHash,
      expectedObjectIdentity:
        authority.approvedAudioPlan.privateObjectIdentityHash,
      frameRateNumerator: 30,
      frameRateDenominator: 1,
      totalFrames: authority.approvedAudioPlan.totalFrames,
      sampleRate: 48_000,
      channelMode: 'stereo',
      sampleFormat: 's24',
      outputContainer: 'flac',
      outputAudioCodec: 'flac',
      audioPolicy: 'approved_source_program_audio_only_v1',
      transitionPolicy: 'approved_hard_cuts_only_v1',
      timestampPolicy: 'normalize_from_zero',
      sourceQualityPolicy: 'immutable_source_master_audio_no_proxy_v1',
      musicPlanned: false,
      sfxPlanned: false,
      duckingPlanned: false,
      realAudioAnalysisPerformed: false,
      usesApprovedEditReservation: true,
      requiresSeparateExportEstimate: false,
      allowsAdditionalExportCharge: false,
      sourceSlices: authority.approvedAudioPlan.sourceSlices,
    },
    sources,
  })
}

function assertAssemblyRuntimeResult(input: {
  authority: ProfessionalLongFormContinuousProgramAudioAuthority
  stagedSources: Array<{ sha256: string }>
  result: OfflineFfmpegContinuousProgramAudioExecutionResult
}): void {
  const semantic = input.result.evidence.semanticEvidence
  if (
    input.result.evidence.toolId !== 'ffmpeg' ||
    input.result.evidence.operationId !==
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_OPERATION_ID ||
    stableAuthorityStringify(input.result.evidence.sourceSha256s) !==
      stableAuthorityStringify(input.stagedSources.map((source) => source.sha256)) ||
    input.result.evidence.resultSha256 !== input.result.resultArtifact.sha256 ||
    input.result.evidence.containerExitCode !== 0 ||
    input.result.evidence.oomKilled ||
    input.result.resultArtifact.mimeType !== 'audio/flac' ||
    semantic.fixedRecipeExecuted !== true ||
    semantic.expectedObjectIdentity !==
      input.authority.approvedAudioPlan.privateObjectIdentityHash ||
    semantic.losslessSourceAudioAssembly !== true ||
    semantic.frameToSampleMappingExact !== true ||
    semantic.outputSampleRate !== 48_000 || semantic.outputChannels !== 2 ||
    semantic.outputBitsPerRawSample !== 24 ||
    semantic.musicGeneratedOrMixed !== false ||
    semantic.sfxGeneratedOrMixed !== false ||
    semantic.duckingApplied !== false ||
    semantic.outputProbeVerified !== true ||
    semantic.originalApprovedEditReservationUsed !== true ||
    semantic.separateExportEstimateRequired !== false ||
    semantic.additionalExportChargeAllowed !== false ||
    input.result.readiness.productReady || input.result.readiness.productionReady
  ) throw invalid('Program-audio runtime evidence failed exact verification.')
}

function assertQaRuntimeResult(input: {
  authority: ProfessionalLongFormContinuousProgramAudioAuthority
  outputArtifact: ProfessionalLongFormContinuousProgramAudioArtifactRef
  result: OfflineContinuousProgramAudioQaExecutionResult
}): void {
  const document = input.result.resultJson.document
  const probe = document.outputProbe as Record<string, unknown>
  const expectedSamples = input.authority.approvedAudioPlan.totalFrames * 1_600
  if (
    input.result.evidence.toolId !== 'ffprobe' ||
    input.result.evidence.operationId !==
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_OPERATION_ID ||
    input.result.evidence.sourceSha256 !== input.outputArtifact.sha256 ||
    input.result.evidence.resultSha256 !== input.result.resultJson.sha256 ||
    input.result.evidence.containerExitCode !== 0 ||
    input.result.evidence.oomKilled ||
    probe.expectedSamples !== expectedSamples ||
    probe.actualSamples !== expectedSamples ||
    probe.decodedBytes !== expectedSamples * 6 ||
    input.result.readiness.productReady || input.result.readiness.productionReady
  ) throw invalid('Program-audio independent QA evidence failed exact verification.')
}

function buildQaRuntimeReceipt(input: {
  qaExecutionAttemptId: string
  result: OfflineContinuousProgramAudioQaExecutionResult
}) {
  const payload = {
    schemaVersion: 'continuous-program-audio-qa-runtime-receipt-v1' as const,
    source:
      'canonical_professional_long_form_continuous_program_audio_execution_service' as const,
    qaExecutionAttemptId: input.qaExecutionAttemptId,
    evidence: input.result.evidence,
    image: input.result.image,
    attestation: input.result.attestation,
    readiness: input.result.readiness,
  }
  return { ...payload, receiptHash: sha256AuthorityValue(payload) }
}

function assertQaReplay(input: {
  authority: ProfessionalLongFormContinuousProgramAudioAuthority
  completion: ReturnType<
    typeof professionalLongFormContinuousProgramAudioCompletionSchema.parse
  >
  qaArtifact: ProfessionalLongFormContinuousProgramAudioQaArtifact
  rawQa: Record<string, unknown>
  qaRuntimeReceipt: Record<string, unknown>
}): void {
  const receiptHash = input.qaRuntimeReceipt.receiptHash
  const receiptPayload = { ...input.qaRuntimeReceipt }
  delete receiptPayload.receiptHash
  const evidence = input.qaRuntimeReceipt.evidence as Record<string, unknown>
  const probe = input.rawQa.outputProbe as Record<string, unknown>
  const expectedSamples = input.authority.approvedAudioPlan.totalFrames * 1_600
  if (
    input.qaArtifact.rawQaResultRef.sha256 !== sha256AuthorityValue(input.rawQa) ||
    input.qaArtifact.qaRuntimeEvidenceRef.sha256 !==
      sha256AuthorityValue(input.qaRuntimeReceipt) ||
    receiptHash !== sha256AuthorityValue(receiptPayload) ||
    input.qaRuntimeReceipt.qaExecutionAttemptId !==
      input.completion.qaExecutionAttemptId ||
    evidence.toolId !== 'ffprobe' ||
    evidence.operationId !==
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_OPERATION_ID ||
    evidence.sourceSha256 !== input.completion.outputArtifact.sha256 ||
    probe.actualSamples !== expectedSamples ||
    probe.expectedSamples !== expectedSamples
  ) throw invalid('Replayed program-audio QA evidence changed.')
}

async function currentAuthority(
  context: ServiceContext,
  input: { workspaceId: string; approvedPlanSnapshotId: string },
) {
  return createCanonicalProfessionalLongFormChildPackagePromotionService(
    context,
  ).loadCurrent(input)
}

function programAudioEntry(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
) {
  const entry = current.queueAggregate.entries.find((candidate) =>
    candidate.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_WORK_ITEM_ID)
  const job = current.postApproval.childJobManifest.jobs.find((candidate) =>
    candidate.childWorkItemId ===
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_WORK_ITEM_ID)
  if (
    !entry || !job || job.kind !== PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_KIND ||
    entry.definition.jobId !== job.jobId
  ) throw invalid('Canonical queue lost the continuous program-audio identity.')
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
  assertExact(verified, input.authority, 'Persisted program-audio authority changed.')
  return ref
}

async function persistExactJson<T extends Readonly<Record<string, unknown>>>(input: {
  context: ServiceContext
  value: T
  parse(value: unknown): T
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.value,
  })
  const parsed = await readParsedJson({
    context: input.context,
    ref,
    parse: input.parse,
  })
  assertExact(parsed, input.value, 'Persisted program-audio JSON changed.')
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
    throw invalid('Program-audio content-addressed JSON checksum changed.')
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
    }).catch((error) => {
      failure = error
    })
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
  authority: ProfessionalLongFormContinuousProgramAudioAuthority
  executionAttemptId: string
  expectedHash: string
  toolId: 'ffmpeg' | 'ffprobe'
  operationId: string
  workloadProfileId: string
  canonicalResultHash: string
}) {
  const evidence = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: input.authority.identity.workspaceId,
    projectId: input.authority.identity.projectId,
    executionAttemptId: input.executionAttemptId,
  })
  if (!evidence || evidence.evidenceHash !== input.expectedHash) {
    throw invalid('Program-audio internal attempt cost evidence is missing.')
  }
  assertCostEvidence({ ...input, evidence })
  return evidence
}

function assertCostEvidence(input: {
  evidence: PrivateInternalAttemptCostEvidence
  authority: ProfessionalLongFormContinuousProgramAudioAuthority
  executionAttemptId: string
  toolId: 'ffmpeg' | 'ffprobe'
  operationId: string
  workloadProfileId: string
  canonicalResultHash: string
}): void {
  const serialized = stableAuthorityStringify(input.evidence)
  if (
    input.evidence.boundary !== 'internal_production_cost_only' ||
    input.evidence.identity.toolId !== input.toolId ||
    input.evidence.identity.operationId !== input.operationId ||
    !('workloadProfileId' in input.evidence.identity) ||
    input.evidence.identity.workloadProfileId !== input.workloadProfileId ||
    input.evidence.identity.jobId !== input.authority.identity.jobId ||
    input.evidence.identity.executionAttemptId !== input.executionAttemptId ||
    input.evidence.linkedCanonicalOutcomeHash !== input.canonicalResultHash ||
    input.evidence.outcome.status !== 'completed' ||
    input.evidence.outcome.failureCategory !== 'none' ||
    input.evidence.resourceUsage.vcpuCount !== 2 ||
    input.evidence.resourceUsage.memoryGib !== 4 ||
    input.evidence.resourceUsage.gpuCount !== 0 ||
    serialized.includes('customerPrice') ||
    serialized.includes('customerCredit') ||
    serialized.includes('serviceFee') || serialized.includes('wallet') ||
    serialized.includes('billingAuthority')
  ) throw invalid('Program-audio internal cost crossed a commercial boundary.')
}

function assertStoredAuthorization(
  entry: ReturnType<typeof programAudioEntry>,
  authorization: ProfessionalLongFormContinuousProgramAudioAuthorization,
): void {
  if (
    !entry.professionalLongFormExecutionAuthorization ||
    stableAuthorityStringify(entry.professionalLongFormExecutionAuthorization) !==
      stableAuthorityStringify(authorization)
  ) throw invalid('Stored program-audio authorization changed.')
}

function assertUnexpired(value: string): void {
  if (Date.parse(value) <= Date.now()) {
    throw new ApiError(
      'CREDITS_NOT_RESERVED',
      'Continuous program-audio requires an unexpired funded reservation.',
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
    throw invalid(`Program-audio ${key} checksum changed.`)
  }
}

function assertExact(left: unknown, right: unknown, message: string): void {
  if (stableAuthorityStringify(left) !== stableAuthorityStringify(right)) {
    throw invalid(message)
  }
}

function withoutAggregate<T extends { queueAggregate: unknown }>(value: T) {
  // The aggregate is returned separately so it cannot enter the stable evidence hash.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { queueAggregate: _queueAggregate, ...rest } = value
  return rest
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate:
      'canonical_professional_long_form_continuous_program_audio_and_independent_qa',
  })
}

function inProgress(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409)
}
