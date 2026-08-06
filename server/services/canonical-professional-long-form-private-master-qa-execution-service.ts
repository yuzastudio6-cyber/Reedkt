import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  assertProfessionalLongFormPrivateMasterQaAuthority,
  buildProfessionalLongFormPrivateMasterQaArtifact,
  buildProfessionalLongFormPrivateMasterQaAuthority,
  buildProfessionalLongFormPrivateMasterQaAuthorization,
  buildProfessionalLongFormPrivateMasterQaCompletion,
  buildProfessionalLongFormPrivateMasterQaReconciliation,
  buildProfessionalLongFormPrivateMasterQaTerminal,
  professionalLongFormPrivateMasterQaResultHash,
  professionalLongFormPrivateMasterQaRuntimeReceipt,
} from '../edit-architecture/professional-long-form-private-master-qa-execution'
import {
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_WORK_ITEM_ID,
  professionalLongFormPrivateMasterQaArtifactSchema,
  professionalLongFormPrivateMasterQaAttemptSchema,
  professionalLongFormPrivateMasterQaCompletionSchema,
  professionalLongFormPrivateMasterQaReconciliationSchema,
  professionalLongFormPrivateMasterQaTerminalSchema,
  type ProfessionalLongFormPrivateMasterQaArtifact,
  type ProfessionalLongFormPrivateMasterQaAttempt,
  type ProfessionalLongFormPrivateMasterQaAuthority,
  type ProfessionalLongFormPrivateMasterQaAuthorization,
  type ProfessionalLongFormPrivateMasterQaReconciliation,
  type ProfessionalLongFormPrivateMasterQaTerminal,
} from '../edit-architecture/professional-long-form-private-master-qa-execution-contract'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
  openPrivateOfflineMediaBinaryRuntime,
  validateOfflineFfprobeStreamingExecutionRequest,
  type OfflineFfprobeExecutionResult,
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
} from './canonical-private-media-artifact-storage'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_EXECUTION_VERSION =
  'canonical-professional-long-form-private-master-qa-execution-v1' as const

type CostMeter = Awaited<ReturnType<typeof beginPrivateInternalAttemptCostEvidence>>

interface CompletedPrivateMasterQaEvidence {
  authority: ProfessionalLongFormPrivateMasterQaAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormPrivateMasterQaAuthorization
  executionAttempt: ProfessionalLongFormPrivateMasterQaAttempt
  artifact: ProfessionalLongFormPrivateMasterQaArtifact
  artifactRef: AuthorityJsonBlobRef
  reconciliation: ProfessionalLongFormPrivateMasterQaReconciliation
  reconciliationRef: AuthorityJsonBlobRef
  costEvidence: PrivateInternalAttemptCostEvidence
  terminal: ProfessionalLongFormPrivateMasterQaTerminal
  terminalRef: AuthorityJsonBlobRef
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
}

export interface CanonicalProfessionalLongFormPrivateMasterQaExecutionEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_EXECUTION_VERSION
  source: 'canonical_professional_long_form_private_master_qa_execution_service'
  status: 'private_review_graph_completed_delivery_and_export_separately_gated'
  disposition: 'completed' | 'exact_replay'
  qa: Omit<CompletedPrivateMasterQaEvidence, 'queueAggregate'>
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  readiness: {
    approvedSnapshotReopenedAndVerified: true
    fundedFourKEstimateReservationReused: true
    exactAssemblyCompletionReopened: true
    exactPrivateMasterChecksumReopened: true
    leaseOneUseAndHeartbeatVerified: true
    independentFullInputFfprobeExecuted: true
    exactVp9FlacMatroskaProfileVerified: true
    exactFrameColorAudioTimingVerified: true
    attemptInternalCostVerified: true
    queueCompletionCount: number
    totalChildJobCount: number
    remainingIncompleteChildJobCount: 0
    privateReviewGraphComplete: true
    customerDeliveryMasterCreated: false
    customerDeliveryMasterExecutionAuthorized: false
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

export function createCanonicalProfessionalLongFormPrivateMasterQaExecutionService(
  context: ServiceContext,
) {
  return {
    async execute(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormPrivateMasterQaExecutionEvidence> {
      if (
        !input || typeof input !== 'object' ||
        Object.keys(input).sort().join('|') !==
          'approvedPlanSnapshotId|workspaceId'
      ) throw invalid(
        'Private-master QA selection is server-owned and accepts no caller paths, commands, codecs, artifacts, thresholds, or cost fields.',
      )
      const ownerUserId = context.auth?.userId
      if (!ownerUserId) {
        throw new ApiError(
          'AUTH_REQUIRED',
          'Private-master QA requires authenticated authority.',
          401,
        )
      }
      const current = await currentAuthority(context, input)
      const entry = privateMasterQaEntry(current)
      let completed: CompletedPrivateMasterQaEvidence
      let disposition: 'completed' | 'exact_replay'
      if (entry.state === 'completed') {
        completed = await loadCompleted({ context, current, ownerUserId })
        disposition = 'exact_replay'
      } else {
        if (entry.state === 'leased') {
          throw inProgress('Private-master QA already has an active lease.')
        }
        completed = await executeNew({ context, current, ownerUserId })
        disposition = 'completed'
      }
      const aggregate = completed.queueAggregate
      const completedEntry = privateMasterQaEntry({
        ...current,
        queueAggregate: aggregate,
      })
      if (
        completedEntry.state !== 'completed' ||
        completedEntry.professionalLongFormExecutionAttempt?.deliveryAttempt !==
          completedEntry.deliveryAttemptCount ||
        aggregate.summary.completedJobCount !== aggregate.summary.totalJobCount ||
        aggregate.summary.queuedJobCount !== 0 ||
        aggregate.summary.leasedJobCount !== 0
      ) throw invalid(
        'Private-master QA did not close the exact private review graph.',
      )
      const qa = withoutAggregate(completed)
      const stablePayload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_EXECUTION_VERSION,
        source:
          'canonical_professional_long_form_private_master_qa_execution_service' as const,
        status:
          'private_review_graph_completed_delivery_and_export_separately_gated' as const,
        qa,
        queueAggregate: aggregate,
        readiness: {
          approvedSnapshotReopenedAndVerified: true as const,
          fundedFourKEstimateReservationReused: true as const,
          exactAssemblyCompletionReopened: true as const,
          exactPrivateMasterChecksumReopened: true as const,
          leaseOneUseAndHeartbeatVerified: true as const,
          independentFullInputFfprobeExecuted: true as const,
          exactVp9FlacMatroskaProfileVerified: true as const,
          exactFrameColorAudioTimingVerified: true as const,
          attemptInternalCostVerified: true as const,
          queueCompletionCount: aggregate.summary.completedJobCount,
          totalChildJobCount: aggregate.summary.totalJobCount,
          remainingIncompleteChildJobCount: 0 as const,
          privateReviewGraphComplete: true as const,
          customerDeliveryMasterCreated: false as const,
          customerDeliveryMasterExecutionAuthorized: false as const,
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
}): Promise<CompletedPrivateMasterQaEvidence> {
  const authority = buildProfessionalLongFormPrivateMasterQaAuthority({
    ...input,
    heartbeatIntervalMilliseconds: 30_000,
  })
  assertUnexpired(authority.approval.reservationExpiresAt)
  const authorityRef = await persistAuthority({
    context: input.context,
    authority,
    verify(value) {
      return assertProfessionalLongFormPrivateMasterQaAuthority({
        value,
        ownerUserId: input.ownerUserId,
        current: input.current,
        heartbeatIntervalMilliseconds:
          authority.operation.heartbeatIntervalMilliseconds,
      })
    },
  })
  const authorization = buildProfessionalLongFormPrivateMasterQaAuthorization({
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
    workerIdentity: 'canonical-professional-long-form-private-master-qa-v1',
    workerType: 'qa_worker',
    now: new Date().toISOString(),
    leaseDurationMs: authority.operation.leaseDurationMilliseconds,
  })
  if (claim.disposition !== 'claimed') {
    throw inProgress(`Private-master QA claim remained ${claim.disposition}.`)
  }
  const begun = await beginPrivateCanonicalPackageWorkQueueExecutionAttempt({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
    now: new Date().toISOString(),
  })
  const executionAttempt = professionalLongFormPrivateMasterQaAttemptSchema
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
  const heartbeatClaim = privateMasterQaEntry(heartbeatCurrent).activeClaim
  if (
    !heartbeatClaim || heartbeatClaim.claimId !== executionAttempt.claimId ||
    heartbeatClaim.deliveryAttempt !== executionAttempt.deliveryAttempt ||
    heartbeatClaim.heartbeatCount < 1 ||
    heartbeatClaim.claimHash === executionAttempt.claimHash
  ) throw invalid('Private-master QA heartbeat was not durably observed.')
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
      toolId: 'ffprobe',
      operationId: PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_OPERATION_ID,
      workloadProfileId: PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COST_PROFILE_ID,
    })
    const stored = await inspectExactMaster({ context: input.context, authority })
    const runtime = await openPrivateOfflineMediaBinaryRuntime()
    const request = validateOfflineFfprobeStreamingExecutionRequest({
      schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
      toolId: 'ffprobe',
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
      payload: {
        inspectionProfileId: 'private_long_form_master_qa_v1',
        countFrames: true,
        verifyDurationAndSync: true,
        emitMachineJsonOnly: true,
        mimeType: 'video/x-matroska',
        sourceByteLength: stored.byteLength,
        sourceSha256: stored.sha256,
        sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
      },
    })
    const result = await runtime.executeServerInjected(request, {
      inputMode: 'private_verified_stream_v1',
      byteLength: stored.byteLength,
      sha256: stored.sha256,
      openStream: stored.openStream,
    })
    const rawProbeResultRef = await persistExactJson({
      context: input.context,
      value: result.resultJson.document,
      parse: (value) => requiredRecord(
        value,
        'Persisted private-master probe document is invalid.',
      ),
    })
    const runtimeReceipt = professionalLongFormPrivateMasterQaRuntimeReceipt(
      result,
    )
    const probeRuntimeEvidenceRef = await persistExactJson({
      context: input.context,
      value: runtimeReceipt,
      parse: (value) => requiredRecord(
        value,
        'Persisted private-master runtime receipt is invalid.',
      ) as typeof runtimeReceipt,
    })
    const artifact = buildProfessionalLongFormPrivateMasterQaArtifact({
      authority,
      authorization,
      executionAttempt,
      rawProbeResultRef,
      probeRuntimeEvidenceRef,
      queueLeaseEvidence,
      result,
      evaluatedAt: new Date().toISOString(),
    })
    const artifactRef = await persistExactJson({
      context: input.context,
      value: artifact,
      parse: (value) =>
        professionalLongFormPrivateMasterQaArtifactSchema.parse(value),
    })
    const leasedCurrent = await currentAuthority(input.context, {
      workspaceId: authority.identity.workspaceId,
      approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
    })
    const reconciliation = buildProfessionalLongFormPrivateMasterQaReconciliation({
      current: leasedCurrent,
      authority,
      authorization,
      executionAttempt,
      qaArtifactRef: artifactRef,
      reconciledAt: new Date().toISOString(),
    })
    const reconciliationRef = await persistExactJson({
      context: input.context,
      value: reconciliation,
      parse: (value) =>
        professionalLongFormPrivateMasterQaReconciliationSchema.parse(value),
    })
    const canonicalResultHash = professionalLongFormPrivateMasterQaResultHash({
      authority,
      executionAttempt,
      qaArtifactRef: artifactRef,
      reconciliationEvidenceRef: reconciliationRef,
    })
    const finalizedCost = await costMeter.finalize({
      status: 'completed',
      failureCategory: 'none',
      outputByteLength: artifactRef.byteLength,
      linkedCanonicalOutcomeHash: canonicalResultHash,
    })
    costFinalized = true
    assertCostEvidence({
      evidence: finalizedCost.evidence,
      authority,
      executionAttempt,
      canonicalResultHash,
    })
    await heartbeat.stop()
    heartbeatStopped = true
    const terminal = buildProfessionalLongFormPrivateMasterQaTerminal({
      authority,
      authorization,
      executionAttempt,
      qaArtifactRef: artifactRef,
      reconciliationEvidenceRef: reconciliationRef,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      completedAt: new Date().toISOString(),
    })
    const terminalRef = await persistExactJson({
      context: input.context,
      value: terminal,
      parse: (value) =>
        professionalLongFormPrivateMasterQaTerminalSchema.parse(value),
    })
    const completion = buildProfessionalLongFormPrivateMasterQaCompletion({
      authority,
      authorization,
      executionAttempt,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      validationArtifactRef: artifactRef,
      reconciliationEvidenceRef: reconciliationRef,
      terminalEvidenceRef: terminalRef,
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
        sha256: artifactRef.sha256,
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
      artifact,
      artifactRef,
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
}): Promise<CompletedPrivateMasterQaEvidence> {
  const authority = buildProfessionalLongFormPrivateMasterQaAuthority({
    ...input,
    heartbeatIntervalMilliseconds: 30_000,
  })
  const entry = privateMasterQaEntry(input.current)
  const authorityRef = entry.professionalLongFormExecutionAuthorization
    ?.authorityRef
  if (!authorityRef) throw invalid('Completed private-master QA lost authority.')
  const persistedAuthority = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: authorityRef,
  })
  const verifiedAuthority = assertProfessionalLongFormPrivateMasterQaAuthority({
    value: persistedAuthority,
    ownerUserId: input.ownerUserId,
    current: input.current,
    heartbeatIntervalMilliseconds:
      authority.operation.heartbeatIntervalMilliseconds,
  })
  assertExact(verifiedAuthority, authority, 'Replayed private-master QA authority changed.')
  const authorization = buildProfessionalLongFormPrivateMasterQaAuthorization({
    authority,
    authorityRef,
  })
  assertStoredAuthorization(entry, authorization)
  const executionAttempt = professionalLongFormPrivateMasterQaAttemptSchema
    .parse(entry.professionalLongFormExecutionAttempt)
  const completion = professionalLongFormPrivateMasterQaCompletionSchema.parse(
    entry.completion?.outcome.professionalLongFormExecution,
  )
  await inspectExactMaster({ context: input.context, authority })
  const artifact = await readParsedJson({
    context: input.context,
    ref: completion.validationArtifactRef,
    parse: (value) =>
      professionalLongFormPrivateMasterQaArtifactSchema.parse(value),
  })
  assertHashed(artifact, 'qaHash')
  const rawProbe = await readParsedJson({
    context: input.context,
    ref: artifact.rawProbeResultRef,
    parse: (value) => requiredRecord(
      value,
      'Replayed private-master probe document is invalid.',
    ),
  })
  const runtimeReceipt = await readParsedJson({
    context: input.context,
    ref: artifact.probeRuntimeEvidenceRef,
    parse: (value) => requiredRecord(
      value,
      'Replayed private-master runtime receipt is invalid.',
    ),
  })
  const result = reconstructResult({ rawProbe, runtimeReceipt })
  const expectedArtifact = buildProfessionalLongFormPrivateMasterQaArtifact({
    authority,
    authorization,
    executionAttempt,
    rawProbeResultRef: artifact.rawProbeResultRef,
    probeRuntimeEvidenceRef: artifact.probeRuntimeEvidenceRef,
    queueLeaseEvidence: artifact.queueLeaseEvidence,
    result,
    evaluatedAt: artifact.evaluatedAt,
  })
  assertExact(artifact, expectedArtifact, 'Replayed private-master QA artifact changed.')
  const reconciliation = await readParsedJson({
    context: input.context,
    ref: completion.reconciliationEvidenceRef,
    parse: (value) =>
      professionalLongFormPrivateMasterQaReconciliationSchema.parse(value),
  })
  const expectedReconciliation =
    buildProfessionalLongFormPrivateMasterQaReconciliation({
      current: input.current,
      authority,
      authorization,
      executionAttempt,
      qaArtifactRef: completion.validationArtifactRef,
      reconciledAt: reconciliation.reconciledAt,
      allowCompletedQa: true,
    })
  assertExact(
    reconciliation,
    expectedReconciliation,
    'Replayed private-master QA reconciliation changed.',
  )
  const canonicalResultHash = professionalLongFormPrivateMasterQaResultHash({
    authority,
    executionAttempt,
    qaArtifactRef: completion.validationArtifactRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
  })
  const costEvidence = await requiredCostEvidence({
    context: input.context,
    authority,
    executionAttempt,
    expectedHash: completion.attemptInternalCostEvidenceHash,
    canonicalResultHash,
  })
  const terminal = await readParsedJson({
    context: input.context,
    ref: completion.terminalEvidenceRef,
    parse: (value) =>
      professionalLongFormPrivateMasterQaTerminalSchema.parse(value),
  })
  const expectedTerminal = buildProfessionalLongFormPrivateMasterQaTerminal({
    authority,
    authorization,
    executionAttempt,
    qaArtifactRef: completion.validationArtifactRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    canonicalResultHash,
    attemptInternalCostEvidenceHash: costEvidence.evidenceHash,
    completedAt: terminal.completedAt,
  })
  assertExact(terminal, expectedTerminal, 'Replayed private-master QA terminal changed.')
  if (
    completion.canonicalResultHash !== canonicalResultHash ||
    entry.deliveryAttemptCount !== executionAttempt.deliveryAttempt ||
    entry.completion?.outcome.sha256 !== completion.validationArtifactRef.sha256
  ) throw invalid('Replayed private-master QA queue evidence changed.')
  return {
    authority,
    authorityRef,
    authorization,
    executionAttempt,
    artifact,
    artifactRef: completion.validationArtifactRef,
    reconciliation,
    reconciliationRef: completion.reconciliationEvidenceRef,
    costEvidence,
    terminal,
    terminalRef: completion.terminalEvidenceRef,
    queueAggregate: input.current.queueAggregate,
  }
}

async function inspectExactMaster(input: {
  context: ServiceContext
  authority: ProfessionalLongFormPrivateMasterQaAuthority
}) {
  const stored = await inspectCanonicalPrivateLongFormMasterArtifact({
    localStorageRoot: input.context.env.localStorageRoot,
    privateObjectIdentityHash: input.authority.approvedMaster.objectIdentity,
  })
  if (
    !stored || stored.mediaFormat !== 'mkv' ||
    stored.byteLength !== input.authority.approvedMaster.byteLength ||
    stored.sha256 !== input.authority.approvedMaster.sha256
  ) throw invalid('Private-master QA could not reopen the exact assembled master.')
  return stored
}

async function currentAuthority(
  context: ServiceContext,
  input: { workspaceId: string; approvedPlanSnapshotId: string },
) {
  return createCanonicalProfessionalLongFormChildPackagePromotionService(
    context,
  ).loadCurrent(input)
}

function privateMasterQaEntry(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
) {
  const entry = current.queueAggregate.entries.find((candidate) =>
    candidate.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_WORK_ITEM_ID)
  const job = current.postApproval.childJobManifest.jobs.find((candidate) =>
    candidate.childWorkItemId ===
      PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_WORK_ITEM_ID)
  if (!entry || !job || job.kind !== 'qa_private_4k_master' ||
    entry.definition.jobId !== job.jobId) {
    throw invalid('Canonical queue lost private-master QA identity.')
  }
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
  assertExact(verified, input.authority, 'Persisted private-master QA authority changed.')
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
  assertExact(parsed, input.value, 'Persisted private-master QA JSON changed.')
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
    throw invalid('Private-master QA content-addressed JSON changed.')
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
  const timer = setInterval(
    () => void tick().catch(() => undefined),
    input.intervalMs,
  )
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

function reconstructResult(input: {
  rawProbe: Readonly<Record<string, unknown>>
  runtimeReceipt: Readonly<Record<string, unknown>>
}): OfflineFfprobeExecutionResult {
  const bytes = Buffer.from(stableAuthorityStringify(input.rawProbe), 'utf8')
  const result = {
    resultJson: {
      mimeType: 'application/json' as const,
      bytes,
      document: input.rawProbe,
      sha256: String(input.runtimeReceipt.resultSha256),
      byteLength: Number(input.runtimeReceipt.resultByteLength),
    },
    evidence: requiredRecord(
      input.runtimeReceipt.evidence,
      'Replayed private-master runtime evidence is invalid.',
    ),
    image: requiredRecord(
      input.runtimeReceipt.image,
      'Replayed private-master runtime image is invalid.',
    ),
    attestation: requiredRecord(
      input.runtimeReceipt.attestation,
      'Replayed private-master attestation is invalid.',
    ),
    readiness: requiredRecord(
      input.runtimeReceipt.readiness,
      'Replayed private-master readiness is invalid.',
    ),
  }
  if (
    result.resultJson.sha256 !== sha256AuthorityValue(input.rawProbe) ||
    result.resultJson.byteLength !== bytes.byteLength
  ) throw invalid('Replayed private-master result commitment changed.')
  return result as unknown as OfflineFfprobeExecutionResult
}

async function requiredCostEvidence(input: {
  context: ServiceContext
  authority: ProfessionalLongFormPrivateMasterQaAuthority
  executionAttempt: ProfessionalLongFormPrivateMasterQaAttempt
  expectedHash: string
  canonicalResultHash: string
}) {
  const evidence = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: input.authority.identity.workspaceId,
    projectId: input.authority.identity.projectId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
  })
  if (!evidence || evidence.evidenceHash !== input.expectedHash) {
    throw invalid('Private-master QA internal attempt cost evidence is missing.')
  }
  assertCostEvidence({ ...input, evidence })
  return evidence
}

function assertCostEvidence(input: {
  evidence: PrivateInternalAttemptCostEvidence
  authority: ProfessionalLongFormPrivateMasterQaAuthority
  executionAttempt: ProfessionalLongFormPrivateMasterQaAttempt
  canonicalResultHash: string
}): void {
  const serialized = stableAuthorityStringify(input.evidence)
  if (
    input.evidence.boundary !== 'internal_production_cost_only' ||
    input.evidence.identity.toolId !== 'ffprobe' ||
    input.evidence.identity.operationId !==
      PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_OPERATION_ID ||
    !('workloadProfileId' in input.evidence.identity) ||
    input.evidence.identity.workloadProfileId !==
      PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COST_PROFILE_ID ||
    input.evidence.identity.jobId !== input.authority.identity.jobId ||
    input.evidence.identity.executionAttemptId !==
      input.executionAttempt.executionAttemptId ||
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
  ) throw invalid('Private-master QA cost crossed a commercial boundary.')
}

function assertStoredAuthorization(
  entry: ReturnType<typeof privateMasterQaEntry>,
  authorization: ProfessionalLongFormPrivateMasterQaAuthorization,
): void {
  if (
    !entry.professionalLongFormExecutionAuthorization ||
    stableAuthorityStringify(entry.professionalLongFormExecutionAuthorization) !==
      stableAuthorityStringify(authorization)
  ) throw invalid('Stored private-master QA authorization changed.')
}

function assertUnexpired(value: string): void {
  if (Date.parse(value) <= Date.now()) {
    throw new ApiError(
      'CREDITS_NOT_RESERVED',
      'Private-master QA requires an unexpired funded reservation.',
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
    throw invalid(`Private-master QA ${key} checksum changed.`)
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
    requiredGate: 'canonical_professional_long_form_private_master_qa',
  })
}

function inProgress(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409)
}
