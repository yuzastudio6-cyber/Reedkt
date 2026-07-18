import {
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
  professionalLongFormMasterTimingCompletionSchema,
} from './professional-long-form-master-timing-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
  professionalLongFormSourceAuthorityCompletionSchema,
} from './professional-long-form-source-authority-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_KIND,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_ARTIFACT_VERSION,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_RECONCILIATION_VERSION,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_RUNTIME_EVIDENCE_VERSION,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_TERMINAL_VERSION,
  professionalLongFormContinuousProgramAudioAuthoritySchema,
  professionalLongFormContinuousProgramAudioAuthorizationSchema,
  professionalLongFormContinuousProgramAudioCompletionSchema,
  professionalLongFormContinuousProgramAudioQaArtifactSchema,
  professionalLongFormContinuousProgramAudioReconciliationSchema,
  professionalLongFormContinuousProgramAudioRuntimeEvidenceSchema,
  professionalLongFormContinuousProgramAudioTerminalSchema,
  type ProfessionalLongFormContinuousProgramAudioArtifactRef,
  type ProfessionalLongFormContinuousProgramAudioAttempt,
  type ProfessionalLongFormContinuousProgramAudioAuthority,
  type ProfessionalLongFormContinuousProgramAudioAuthorization,
  type ProfessionalLongFormContinuousProgramAudioCompletion,
  type ProfessionalLongFormContinuousProgramAudioQaArtifact,
  type ProfessionalLongFormContinuousProgramAudioReconciliation,
  type ProfessionalLongFormContinuousProgramAudioRuntimeEvidence,
  type ProfessionalLongFormContinuousProgramAudioTerminal,
} from './professional-long-form-continuous-program-audio-execution-contract'
import type { CanonicalProfessionalLongFormCurrentChildPackageAuthority } from
  '../services/canonical-professional-long-form-child-package-promotion-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from '../services/private-edit-authority-store'
import type {
  OfflineContinuousProgramAudioQaExecutionResult,
  OfflineFfmpegContinuousProgramAudioExecutionResult,
} from '../tool-execution/media-binary-execution/offline-media-binary-types'

const audioOperation = {
  operationId: PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_RUNNER_CLASS,
  attemptCostProfileId:
    PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_COST_PROFILE_ID,
} as const

const qaOperation = {
  operationId: PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_RUNNER_CLASS,
  attemptCostProfileId:
    PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_COST_PROFILE_ID,
} as const

const commercialBoundary = {
  internalProductionCostOnly: true as const,
  customerPriceAuthorityIncluded: false as const,
  customerCreditAuthorityIncluded: false as const,
  serviceFeeAuthorityIncluded: false as const,
  approvedFourKEstimateAndReservationReused: true as const,
  secondExportEstimateCreated: false as const,
  secondExportChargeCreated: false as const,
  walletMutationAuthorized: false as const,
  billingAuthorized: false as const,
}

export function buildProfessionalLongFormContinuousProgramAudioAuthority(input: {
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  heartbeatIntervalMilliseconds: number
}): ProfessionalLongFormContinuousProgramAudioAuthority {
  const { current } = input
  const selection = selectAudioJob(current)
  const snapshot = current.authority.snapshot
  const reservation = current.authority.reservation
  const remainingReservedCredits = remainingReservationCredits(current)
  const dependencyCompletions = exactAudioDependencies(
    current,
    selection.queueEntry,
  )
  const parentWorkItem = current.authority.workItems.find((workItem) =>
    workItem.id === current.package.identity.parentControllerApprovedWorkItemId)
  const expectedOrder = 3 + current.postApproval.bridge.binding.plan.chunks.length * 2
  if (
    input.ownerUserId !== snapshot.approvedByUserId ||
    current.authority.approval.approvedByUserId !== input.ownerUserId ||
    current.authority.approval.id !== snapshot.approvalId ||
    reservation.status !== 'reserved' || reservation.id !== snapshot.reservationId ||
    remainingReservedCredits <= 0 || !parentWorkItem ||
    selection.queueEntry.definition.canonicalOrder !== expectedOrder ||
    selection.manifestJob.kind !==
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_KIND ||
    selection.placement.workerType !== 'cpu_analysis_worker' ||
    selection.placement.resourceClassId !== 'cpu_analysis_standard_v1' ||
    selection.placement.maxAttempts !== 2 ||
    selection.placement.attemptTimeoutSeconds !== 3_600 ||
    selection.placement.privateExecutionReady ||
    selection.placement.providerExecutionMode !== 'none' ||
    selection.queueJob.definitionHash !==
      selection.queueEntry.definition.definitionHash ||
    selection.placement.placementHash !==
      selection.queueEntry.definition.placementHash ||
    stableAuthorityStringify(selection.queueEntry.definition.dependencyJobIds) !==
      stableAuthorityStringify(dependencyCompletions.map((value) => value.jobId))
  ) throw new Error(
    'Continuous program-audio lost approved snapshot, reservation, placement, or dependency authority.',
  )

  const approvedAudioPlan = buildApprovedAudioPlan(current, selection.workItem)
  const authorizedAt = latestCompletionTimestamp(
    current,
    dependencyCompletions.map((value) => value.jobId),
  )
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_AUTHORITY_VERSION,
    source:
      'server_reopened_professional_long_form_continuous_program_audio_authority' as const,
    purpose:
      'authorize_one_private_lossless_source_program_audio_assembly_and_qa' as const,
    status:
      'continuous_program_audio_authorized_independent_qa_required' as const,
    identity: {
      ownerUserId: input.ownerUserId,
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      approvedPlanId: snapshot.planId,
      approvedPlanSnapshotId: snapshot.snapshotId,
      approvedPlanSnapshotHash: snapshot.snapshotHash,
      packageRecordId: current.package.identity.packageRecordId,
      jobId: selection.manifestJob.jobId,
      approvedWorkItemId: selection.manifestJob.childWorkItemId,
      expectedOutputIdentity: selection.workItem.expectedOutputIdentity,
    },
    approval: {
      approvedByUserId: snapshot.approvedByUserId,
      approvalRecordId: current.authority.approval.id,
      approvedEstimateId: current.authority.estimate.id,
      creditReservationId: reservation.id,
      reservationStatus: 'reserved' as const,
      remainingReservedCredits,
      reservationExpiresAt: reservation.expiresAt,
      snapshotApprovedAt: snapshot.approvedAt,
    },
    approvedAudioPlan,
    lineage: {
      planningAuthorityHash: sha256AuthorityValue(current.authority),
      planHash: snapshot.planHash,
      workGraphHash: snapshot.workGraphHash,
      timingHash: snapshot.timingHash,
      objectPlanAuthorityHash:
        current.postApproval.bridge.binding.plan.authorityHash,
      bridgeAuthorityHash: current.postApproval.bridge.authorityHash,
      childJobManifestHash: current.postApproval.childJobManifest.manifestHash,
      childPackageHash: current.package.packageHash,
      childPlacementManifestHash: current.placementManifest.manifestHash,
      queueDefinitionHash: current.queueDefinition.definitionHash,
      sourceManifestHash: sha256AuthorityValue(current.authority.sourceAssetManifest),
      parentApprovedWorkItemHash: sha256AuthorityValue(parentWorkItem),
      audioJobAuthorityHash: selection.manifestJob.jobAuthorityHash,
      audioJobDefinitionHash: selection.queueJob.definitionHash,
      audioPlacementHash: selection.placement.placementHash,
      dependencyCompletions,
      dependencySetHash: sha256AuthorityValue(dependencyCompletions),
    },
    operation: {
      ...audioOperation,
      workerType: 'cpu_analysis_worker' as const,
      resourceClassId: 'cpu_analysis_standard_v1' as const,
      maximumAttempts: 2 as const,
      attemptTimeoutSeconds: 3_600 as const,
      leaseDurationMilliseconds: 300_000 as const,
      heartbeatIntervalMilliseconds: Math.max(
        1_000,
        Math.min(60_000, Math.floor(input.heartbeatIntervalMilliseconds)),
      ),
      vcpuCount: 2 as const,
      memoryGib: 4 as const,
      gpuCount: 0 as const,
    },
    permissions: {
      immutableDependencyCompletionsRequired: true as const,
      approvedPrivateSourceRead: true as const,
      exactSourceChecksumsRequired: true as const,
      fixedSourceAudioAssemblyRecipe: true as const,
      sourceAudioDecodeAllowed: true as const,
      musicGenerationOrMixingAllowed: false as const,
      sfxGenerationOrMixingAllowed: false as const,
      duckingOrNormalizationAllowed: false as const,
      privateProgramAudioCreateOnly: true as const,
      independentQaRequiredBeforeCompletion: true as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
    persistence: {
      privateLocalContentAddressed: true as const,
      queueReceiptRequiredBeforeLease: true as const,
      queueAttemptRequiredBeforeOperation: true as const,
      queueCompletionIsAuthorityCommit: true as const,
      orphanBlobsGrantExecutionAuthority: false as const,
      distributedDatabaseBacked: false as const,
      productionDurabilityProven: false as const,
    },
    authorizedAt,
  }
  return professionalLongFormContinuousProgramAudioAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormContinuousProgramAudioAuthority(input: {
  value: unknown
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  heartbeatIntervalMilliseconds: number
}): ProfessionalLongFormContinuousProgramAudioAuthority {
  const parsed = professionalLongFormContinuousProgramAudioAuthoritySchema.parse(
    input.value,
  )
  assertHashed(parsed, 'authorityHash')
  const expected = buildProfessionalLongFormContinuousProgramAudioAuthority(input)
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error('Continuous program-audio authority failed exact replay.')
  }
  return expected
}

export function buildProfessionalLongFormContinuousProgramAudioAuthorization(
  input: {
    authority: ProfessionalLongFormContinuousProgramAudioAuthority
    authorityRef: AuthorityJsonBlobRef
  },
): ProfessionalLongFormContinuousProgramAudioAuthorization {
  assertHashed(input.authority, 'authorityHash')
  assertBlobRef(input.authorityRef, input.authority)
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_AUTHORIZATION_VERSION,
    source:
      'server_persisted_professional_long_form_continuous_program_audio_authority' as const,
    authorizationId:
      `long-form-program-audio-auth-${input.authority.authorityHash.slice(0, 40)}`,
    authorityRef: input.authorityRef,
    authorityHash: input.authority.authorityHash,
    queueDefinitionHash: input.authority.lineage.queueDefinitionHash,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    jobDefinitionHash: input.authority.lineage.audioJobDefinitionHash,
    placementHash: input.authority.lineage.audioPlacementHash,
    kind: PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_KIND,
    expectedOutputIdentity: input.authority.identity.expectedOutputIdentity,
    operation: audioOperation,
    authorizedAt: input.authority.authorizedAt,
    reservationExpiresAt: input.authority.approval.reservationExpiresAt,
    permissions: {
      privateLocalLease: true as const,
      oneUseInternalDispatch: true as const,
      approvedPrivateSourceRead: true as const,
      fixedSourceAudioAssemblyRecipe: true as const,
      createOnlyPrivateProgramAudioPersistence: true as const,
      independentQaWithinAttempt: true as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
  }
  return professionalLongFormContinuousProgramAudioAuthorizationSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormContinuousProgramAudioRuntimeEvidence(
  input: {
    authority: ProfessionalLongFormContinuousProgramAudioAuthority
    authorization: ProfessionalLongFormContinuousProgramAudioAuthorization
    executionAttempt: ProfessionalLongFormContinuousProgramAudioAttempt
    sourceReadEvidenceHashes: string[]
    sourceStagingEvidenceHashes: string[]
    sourceSha256s: string[]
    capacityEvidenceHash: string
    queueLeaseEvidence: {
      claimId: string
      deliveryAttempt: 1
      initialClaimHash: string
      heartbeatClaimHash: string
      heartbeatCount: number
      heartbeatAt: string
      expiresAt: string
      attemptDeadlineAt: string
      boundedLeaseRenewalObserved: true
    }
    outputArtifact: ProfessionalLongFormContinuousProgramAudioArtifactRef
    result: OfflineFfmpegContinuousProgramAudioExecutionResult
  },
): ProfessionalLongFormContinuousProgramAudioRuntimeEvidence {
  assertExecutionLineage(input)
  if (
    input.queueLeaseEvidence.claimId !== input.executionAttempt.claimId ||
    input.queueLeaseEvidence.initialClaimHash !==
      input.executionAttempt.claimHash ||
    input.queueLeaseEvidence.deliveryAttempt !==
      input.executionAttempt.deliveryAttempt ||
    input.queueLeaseEvidence.heartbeatCount < 1 ||
    Date.parse(input.queueLeaseEvidence.expiresAt) <=
      Date.parse(input.queueLeaseEvidence.heartbeatAt) ||
    Date.parse(input.queueLeaseEvidence.attemptDeadlineAt) <
      Date.parse(input.queueLeaseEvidence.expiresAt)
  ) throw new Error('Continuous program-audio queue heartbeat evidence changed.')
  const embeddedOutputProbe = (input.result.evidence.semanticEvidence as
    Record<string, unknown>).outputProbe
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_RUNTIME_EVIDENCE_VERSION,
    source:
      'canonical_professional_long_form_continuous_program_audio_ffmpeg_runner' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId:
        input.authority.identity.approvedPlanSnapshotId,
      jobId: input.authority.identity.jobId,
      approvedWorkItemId: input.authority.identity.approvedWorkItemId,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    operation: audioOperation,
    queueLeaseEvidence: input.queueLeaseEvidence,
    requestEnvelopeSha256: input.result.evidence.requestEnvelopeSha256,
    sourceReadEvidenceHashes: input.sourceReadEvidenceHashes,
    sourceStagingEvidenceHashes: input.sourceStagingEvidenceHashes,
    sourceSha256s: input.sourceSha256s,
    capacityEvidenceHash: input.capacityEvidenceHash,
    outputArtifact: input.outputArtifact,
    embeddedOutputProbeHash: sha256AuthorityValue(embeddedOutputProbe),
    runtime: {
      binaryVersion: input.result.evidence.binaryVersion,
      imageIdentityHash: input.result.image.imageIdentityHash,
      attestationRecordId: input.result.attestation.recordId,
      attestationHash: input.result.attestation.attestationHash,
      networkMode: input.result.evidence.confinement.networkMode,
      containerExitCode: input.result.evidence.containerExitCode,
      oomKilled: input.result.evidence.oomKilled,
    },
    checks: {
      immutableSourceBytesVerified: 'passed' as const,
      approvedSourceRangesAndHardCutsVerified: 'passed' as const,
      exactFrameToSampleMappingVerified: 'passed' as const,
      losslessFlacPersistedCreateOnly: 'passed' as const,
      noMusicSfxDuckingOrNormalization: 'passed' as const,
      independentQaStillRequired: true as const,
    },
    completedAt: input.result.attestation.completedAt,
  }
  return professionalLongFormContinuousProgramAudioRuntimeEvidenceSchema.parse({
    ...payload,
    artifactHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormContinuousProgramAudioQaArtifact(input: {
  authority: ProfessionalLongFormContinuousProgramAudioAuthority
  executionAttempt: ProfessionalLongFormContinuousProgramAudioAttempt
  qaExecutionAttemptId: string
  outputArtifact: ProfessionalLongFormContinuousProgramAudioArtifactRef
  rawQaResultRef: AuthorityJsonBlobRef
  qaRuntimeEvidenceRef: AuthorityJsonBlobRef
  result: OfflineContinuousProgramAudioQaExecutionResult
}): ProfessionalLongFormContinuousProgramAudioQaArtifact {
  const document = input.result.resultJson.document as Record<string, unknown>
  const probe = document.outputProbe as Record<string, unknown>
  const expectedSamples = input.authority.approvedAudioPlan.totalFrames * 1_600
  if (
    input.result.evidence.sourceSha256 !== input.outputArtifact.sha256 ||
    probe.expectedSamples !== expectedSamples ||
    probe.actualSamples !== expectedSamples ||
    probe.decodedBytes !== expectedSamples * 6 ||
    probe.sampleRate !== 48_000 || probe.channels !== 2 ||
    probe.bitsPerRawSample !== 24 || probe.audioCodec !== 'flac'
  ) throw new Error('Continuous program-audio QA changed exact media authority.')
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_ARTIFACT_VERSION,
    source:
      'canonical_professional_long_form_continuous_program_audio_ffprobe_qa' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId:
        input.authority.identity.approvedPlanSnapshotId,
      jobId: input.authority.identity.jobId,
      approvedWorkItemId: input.authority.identity.approvedWorkItemId,
      executionAttemptId: input.executionAttempt.executionAttemptId,
      qaExecutionAttemptId: input.qaExecutionAttemptId,
    },
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    operation: qaOperation,
    outputArtifact: input.outputArtifact,
    rawQaResultRef: input.rawQaResultRef,
    qaRuntimeEvidenceRef: input.qaRuntimeEvidenceRef,
    requestEnvelopeSha256: input.result.evidence.requestEnvelopeSha256,
    qaAttestationHash: input.result.attestation.attestationHash,
    observed: {
      container: 'flac' as const,
      audioCodec: 'flac' as const,
      streamCount: 1 as const,
      sampleRate: 48_000 as const,
      channels: 2 as const,
      channelLayout: 'stereo' as const,
      sampleFormat: 's32' as const,
      bitsPerRawSample: 24 as const,
      timeBase: '1/48000' as const,
      expectedSamples,
      actualSamples: Number(probe.actualSamples),
      decodedBytes: Number(probe.decodedBytes),
      durationSeconds: Number(probe.actualDurationSeconds),
    },
    checks: {
      exactPersistedArtifactReopened: 'passed' as const,
      independentProbeExecuted: 'passed' as const,
      exactFlacStreamShape: 'passed' as const,
      exactLosslessDecodedSampleCount: 'passed' as const,
      exactFrameToSampleDuration: 'passed' as const,
      noMediaMutation: 'passed' as const,
    },
    outcome: 'passed' as const,
    evaluatedAt: input.result.attestation.completedAt,
  }
  return professionalLongFormContinuousProgramAudioQaArtifactSchema.parse({
    ...payload,
    qaHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormContinuousProgramAudioReconciliation(
  input: {
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
    authority: ProfessionalLongFormContinuousProgramAudioAuthority
    executionAttempt: ProfessionalLongFormContinuousProgramAudioAttempt
    outputArtifact: ProfessionalLongFormContinuousProgramAudioArtifactRef
    runtimeEvidenceRef: AuthorityJsonBlobRef
    qaArtifactRef: AuthorityJsonBlobRef
    reconciledAt: string
    allowCompletedAudio?: boolean
  },
): ProfessionalLongFormContinuousProgramAudioReconciliation {
  const audioEntry = selectAudioJob(input.current).queueEntry
  const finalizationWorkItem = input.current.postApproval.bridge.binding.plan
    .workGraph.workItems.find((workItem) =>
      workItem.kind === 'finalize_private_4k_master')
  const finalizationEntry = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId === finalizationWorkItem?.workItemId)
  if (
    !finalizationWorkItem || !finalizationEntry ||
    !finalizationEntry.definition.dependencyJobIds.includes(
      input.authority.identity.jobId,
    ) || finalizationEntry.state !== 'queued' ||
    finalizationEntry.professionalLongFormExecutionAuthorization ||
    finalizationEntry.professionalLongFormExecutionAttempt ||
    finalizationEntry.completion ||
    (!input.allowCompletedAudio && audioEntry.state === 'completed')
  ) throw new Error(
    'Continuous program-audio reconciliation lost blocked finalization authority.',
  )
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_RECONCILIATION_VERSION,
    source:
      'canonical_professional_long_form_continuous_program_audio_reconciliation' as const,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorityHash: input.authority.authorityHash,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    qaArtifactRef: input.qaArtifactRef,
    downstreamFinalization: {
      jobId: finalizationEntry.definition.jobId,
      approvedWorkItemId: finalizationEntry.definition.approvedWorkItemId,
      dependencyJobId: input.authority.identity.jobId,
      thisDependencySatisfied: true as const,
      everyRequiredDependencySatisfied: false as const,
      executionAuthorized: false as const,
    },
    decision:
      'program_audio_and_qa_ready_video_chunks_color_and_finalization_remain_blocked' as const,
    reconciledAt: input.reconciledAt,
  }
  return professionalLongFormContinuousProgramAudioReconciliationSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

export function professionalLongFormContinuousProgramAudioResultHash(input: {
  authority: ProfessionalLongFormContinuousProgramAudioAuthority
  executionAttempt: ProfessionalLongFormContinuousProgramAudioAttempt
  outputArtifact: ProfessionalLongFormContinuousProgramAudioArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  qaArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
}): string {
  return sha256AuthorityValue({
    domain: 'professional_long_form_continuous_program_audio_result_v1',
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    qaArtifactRef: input.qaArtifactRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
  })
}

export function buildProfessionalLongFormContinuousProgramAudioTerminal(input: {
  authority: ProfessionalLongFormContinuousProgramAudioAuthority
  authorization: ProfessionalLongFormContinuousProgramAudioAuthorization
  executionAttempt: ProfessionalLongFormContinuousProgramAudioAttempt
  qaExecutionAttemptId: string
  outputArtifact: ProfessionalLongFormContinuousProgramAudioArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  qaArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  qaAttemptInternalCostEvidenceHash: string
  completedAt: string
}): ProfessionalLongFormContinuousProgramAudioTerminal {
  assertExecutionLineage(input)
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_TERMINAL_VERSION,
    source:
      'canonical_professional_long_form_continuous_program_audio_execution_service' as const,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    qaExecutionAttemptId: input.qaExecutionAttemptId,
    queueReceiptId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation: audioOperation,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    qaArtifactRef: input.qaArtifactRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    qaAttemptInternalCostEvidenceHash: input.qaAttemptInternalCostEvidenceHash,
    outcome: 'completed_private_test' as const,
    remainingPipelineExecutionAuthorized: false as const,
    commercialBoundary,
    completedAt: input.completedAt,
  }
  return professionalLongFormContinuousProgramAudioTerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormContinuousProgramAudioCompletion(input: {
  authority: ProfessionalLongFormContinuousProgramAudioAuthority
  authorization: ProfessionalLongFormContinuousProgramAudioAuthorization
  executionAttempt: ProfessionalLongFormContinuousProgramAudioAttempt
  qaExecutionAttemptId: string
  outputArtifact: ProfessionalLongFormContinuousProgramAudioArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  qaArtifactRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  terminalEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  qaAttemptInternalCostEvidenceHash: string
}): ProfessionalLongFormContinuousProgramAudioCompletion {
  assertExecutionLineage(input)
  return professionalLongFormContinuousProgramAudioCompletionSchema.parse({
    schemaVersion:
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_COMPLETION_VERSION,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorizationId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation: audioOperation,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    qaAttemptInternalCostEvidenceHash: input.qaAttemptInternalCostEvidenceHash,
    qaExecutionAttemptId: input.qaExecutionAttemptId,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    qaArtifactRef: input.qaArtifactRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    terminalEvidenceRef: input.terminalEvidenceRef,
  })
}

function buildApprovedAudioPlan(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
  workItem: CanonicalProfessionalLongFormCurrentChildPackageAuthority[
    'postApproval'
  ]['bridge']['binding']['plan']['workGraph']['workItems'][number],
) {
  const request = current.postApproval.bridge.binding.plan.request
  if (
    request.confirmedOutputFrame.frameRate.numerator !== 30 ||
    request.confirmedOutputFrame.frameRate.denominator !== 1 ||
    request.executionPolicy.audioPolicy !== 'single_continuous_timeline_mix_v1' ||
    request.executionPolicy.transitionPolicy !== 'approved_hard_cuts_only_v1' ||
    request.totalFrames < 1_350 || request.totalFrames > 648_000 ||
    request.sourceRanges.length < 2 || request.sourceRanges.length > 512
  ) throw new Error('Continuous program-audio fixed profile is not approved.')
  const uniqueIds = [...new Set(request.sourceRanges.map((range) =>
    range.sourceSequenceItemId))]
  const sources = uniqueIds.map((sourceSequenceItemId, index) => {
    const ranges = request.sourceRanges.filter((range) =>
      range.sourceSequenceItemId === sourceSequenceItemId)
    const first = ranges[0]!
    if (ranges.some((range) =>
      range.mediaAssetId !== first.mediaAssetId ||
      range.sourceObjectGeneration !== first.sourceObjectGeneration ||
      range.sourceSha256 !== first.sourceSha256 ||
      range.sourceByteLength !== first.sourceByteLength)) {
      throw new Error('Continuous program-audio source identity changed across ranges.')
    }
    return {
      inputId: `approved-source-${index + 1}`,
      sourceSequenceItemId,
      mediaAssetId: first.mediaAssetId,
      sourceObjectGeneration: first.sourceObjectGeneration,
      mimeType: 'video/mp4' as const,
      byteLength: first.sourceByteLength,
      sha256: first.sourceSha256,
    }
  })
  const combinedBytes = sources.reduce((sum, source) => sum + source.byteLength, 0)
  if (
    sources.length < 2 || sources.length > 8 ||
    sources.some((source) => source.byteLength > 192 * 1024 * 1024) ||
    combinedBytes > 768 * 1024 * 1024
  ) throw new Error('Continuous program-audio sources exceed the fixed runner profile.')
  const sourceSlices = request.sourceRanges.map((range, index) => ({
    sliceIndex: index + 1,
    segmentId: range.segmentId,
    sourceSequenceItemId: range.sourceSequenceItemId,
    mediaAssetId: range.mediaAssetId,
    sourceObjectGeneration: range.sourceObjectGeneration,
    sourceSha256: range.sourceSha256,
    sourceCleanupDecisionId: range.sourceCleanupDecisionId,
    sourceStartFrame: range.sourceStartFrame,
    sourceEndFrameExclusive: range.sourceEndFrameExclusive,
    timelineStartFrame: range.timelineStartFrame,
    timelineEndFrameExclusive: range.timelineEndFrameExclusive,
    boundaryBefore: range.editorialBoundaryBefore,
  }))
  const audioAuthorityHash = sha256AuthorityValue({
    domain: 'professional_long_form_continuous_program_audio_plan_v1',
    approvedPlanSnapshotId: request.identity.approvedPlanSnapshotId,
    approvedTimingHash: request.identity.approvedTimingHash,
    expectedOutputIdentity: workItem.expectedOutputIdentity,
    sources,
    sourceSlices,
  })
  const privateObjectIdentityHash = sha256AuthorityValue({
    domain: 'private_continuous_program_audio_object_v1',
    audioAuthorityHash,
    expectedOutputIdentity: workItem.expectedOutputIdentity,
  })
  const withoutHash = {
    audioAuthorityHash,
    privateObjectIdentityHash,
    totalFrames: request.totalFrames,
    frameRateNumerator: 30 as const,
    frameRateDenominator: 1 as const,
    sampleRate: 48_000 as const,
    channels: 2 as const,
    bitsPerRawSample: 24 as const,
    outputContainer: 'flac' as const,
    outputAudioCodec: 'flac' as const,
    sourceQualityPolicy:
      'immutable_source_master_audio_no_proxy_v1' as const,
    transitionPolicy: 'approved_hard_cuts_only_v1' as const,
    timestampPolicy: 'normalize_from_zero' as const,
    musicPlanned: false as const,
    sfxPlanned: false as const,
    duckingPlanned: false as const,
    realAudioAnalysisPerformed: false as const,
    sources,
    sourceSlices,
  }
  return { ...withoutHash, planHash: sha256AuthorityValue(withoutHash) }
}

function selectAudioJob(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
) {
  const workItem = current.postApproval.bridge.binding.plan.workGraph.workItems
    .find((item) => item.kind ===
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_KIND)
  const manifestJob = current.postApproval.childJobManifest.jobs.find((job) =>
    job.childWorkItemId === workItem?.workItemId)
  const placement = current.placementManifest.placements.find((entry) =>
    entry.childWorkItemId === workItem?.workItemId)
  const queueJob = current.queueDefinition.jobs.find((job) =>
    job.approvedWorkItemId === workItem?.workItemId)
  const queueEntry = current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId === workItem?.workItemId)
  if (!workItem || !manifestJob || !placement || !queueJob || !queueEntry) {
    throw new Error('Canonical continuous program-audio job is missing.')
  }
  return { workItem, manifestJob, placement, queueJob, queueEntry }
}

function exactAudioDependencies(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
  audioEntry: CanonicalProfessionalLongFormCurrentChildPackageAuthority[
    'queueAggregate'
  ]['entries'][number],
) {
  if (audioEntry.definition.dependencyJobIds.length !== 2) {
    throw new Error('Continuous program-audio requires source and timing dependencies.')
  }
  return audioEntry.definition.dependencyJobIds.map((jobId) => {
    const entry = current.queueAggregate.entries.find((candidate) =>
      candidate.definition.jobId === jobId)
    if (!entry || entry.state !== 'completed' || !entry.completion) {
      throw new Error('Continuous program-audio dependency is not completed.')
    }
    if (entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID) {
      const completion = professionalLongFormSourceAuthorityCompletionSchema.parse(
        entry.completion.outcome.professionalLongFormExecution,
      )
      return dependencyRecord('validate_private_source_authority', entry, completion)
    }
    if (entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID) {
      const completion = professionalLongFormMasterTimingCompletionSchema.parse(
        entry.completion.outcome.professionalLongFormExecution,
      )
      return dependencyRecord('validate_master_timing', entry, completion)
    }
    throw new Error('Continuous program-audio has an unexpected dependency.')
  })
}

function dependencyRecord(
  kind: 'validate_private_source_authority' | 'validate_master_timing',
  entry: CanonicalProfessionalLongFormCurrentChildPackageAuthority[
    'queueAggregate'
  ]['entries'][number],
  completion: {
    canonicalResultHash: string
    attemptInternalCostEvidenceHash: string
  },
) {
  if (!entry.completion) throw new Error('Dependency completion is missing.')
  return {
    kind,
    jobId: entry.definition.jobId,
    approvedWorkItemId: entry.definition.approvedWorkItemId,
    queueCompletionHash: entry.completion.completionHash,
    canonicalResultHash: completion.canonicalResultHash,
    attemptInternalCostEvidenceHash:
      completion.attemptInternalCostEvidenceHash,
  }
}

function latestCompletionTimestamp(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
  jobIds: string[],
): string {
  const timestamps = jobIds.map((jobId) => {
    const completedAt = current.queueAggregate.entries.find((entry) =>
      entry.definition.jobId === jobId)?.completion?.completedAt
    if (!completedAt) throw new Error('Dependency completion time is missing.')
    return Date.parse(completedAt)
  })
  return new Date(Math.max(...timestamps)).toISOString()
}

function remainingReservationCredits(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
): number {
  const reservation = current.authority.reservation
  return reservation.reservedCredits - reservation.spentCredits -
    reservation.releasedCredits - reservation.refundedCredits
}

function assertExecutionLineage(input: {
  authority: ProfessionalLongFormContinuousProgramAudioAuthority
  authorization: ProfessionalLongFormContinuousProgramAudioAuthorization
  executionAttempt: ProfessionalLongFormContinuousProgramAudioAttempt
}): void {
  assertHashed(input.authority, 'authorityHash')
  assertHashed(input.authorization, 'receiptHash')
  assertHashed(input.executionAttempt, 'attemptHash')
  if (
    input.authorization.authorityHash !== input.authority.authorityHash ||
    input.executionAttempt.authorityHash !== input.authority.authorityHash ||
    input.executionAttempt.authorizationId !== input.authorization.authorizationId ||
    input.executionAttempt.jobId !== input.authority.identity.jobId ||
    input.executionAttempt.approvedWorkItemId !==
      input.authority.identity.approvedWorkItemId
  ) throw new Error('Continuous program-audio execution lineage changed.')
}

function assertBlobRef(ref: AuthorityJsonBlobRef, value: unknown): void {
  if (ref.sha256 !== sha256AuthorityValue(value)) {
    throw new Error('Continuous program-audio authority blob reference changed.')
  }
}

function assertHashed<T extends string>(
  value: Record<T, string>,
  key: T,
): void {
  const { [key]: actual, ...withoutHash } = value
  if (actual !== sha256AuthorityValue(withoutHash)) {
    throw new Error(`Continuous program-audio ${String(key)} is invalid.`)
  }
}
