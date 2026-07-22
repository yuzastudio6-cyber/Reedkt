import {
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_KIND,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_RECONCILIATION_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_RUNTIME_EVIDENCE_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_TERMINAL_VERSION,
  professionalLongFormMasterAssemblyArtifactRefSchema,
  professionalLongFormMasterAssemblyAuthoritySchema,
  professionalLongFormMasterAssemblyAuthorizationSchema,
  professionalLongFormMasterAssemblyCompletionSchema,
  professionalLongFormMasterAssemblyReconciliationSchema,
  professionalLongFormMasterAssemblyRuntimeEvidenceSchema,
  professionalLongFormMasterAssemblyTerminalSchema,
  type ProfessionalLongFormMasterAssemblyArtifactRef,
  type ProfessionalLongFormMasterAssemblyAttempt,
  type ProfessionalLongFormMasterAssemblyAuthority,
  type ProfessionalLongFormMasterAssemblyAuthorization,
  type ProfessionalLongFormMasterAssemblyCompletion,
  type ProfessionalLongFormMasterAssemblyReconciliation,
  type ProfessionalLongFormMasterAssemblyRuntimeEvidence,
  type ProfessionalLongFormMasterAssemblyTerminal,
} from './professional-long-form-master-assembly-execution-contract'
import {
  professionalLongFormFirstObjectChunkQaArtifactSchema,
  professionalLongFormFirstObjectChunkQaCompletionSchema,
  type ProfessionalLongFormFirstObjectChunkQaArtifact,
} from './professional-long-form-first-object-chunk-execution-contract'
import {
  professionalLongFormContinuousProgramAudioCompletionSchema,
  professionalLongFormContinuousProgramAudioQaArtifactSchema,
  type ProfessionalLongFormContinuousProgramAudioQaArtifact,
} from './professional-long-form-continuous-program-audio-execution-contract'
import {
  professionalLongFormCrossChunkColorCompletionSchema,
  professionalLongFormCrossChunkColorValidationArtifactSchema,
  type ProfessionalLongFormCrossChunkColorValidationArtifact,
} from './professional-long-form-cross-chunk-color-continuity-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
  professionalLongFormMasterTimingCompletionSchema,
} from './professional-long-form-master-timing-execution-contract'
import type { CanonicalProfessionalLongFormCurrentChildPackageAuthority } from
  '../services/canonical-professional-long-form-child-package-promotion-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from '../services/private-edit-authority-store'

const operation = {
  operationId: PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_RUNNER_CLASS,
  attemptCostProfileId: PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COST_PROFILE_ID,
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

export interface ProfessionalLongFormMasterAssemblyChunkQaEvidence {
  chunkId: string
  qaArtifactRef: AuthorityJsonBlobRef
  qaArtifact: ProfessionalLongFormFirstObjectChunkQaArtifact
}

export interface ProfessionalLongFormMasterAssemblyProgramAudioEvidence {
  qaArtifactRef: AuthorityJsonBlobRef
  qaArtifact: ProfessionalLongFormContinuousProgramAudioQaArtifact
}

export interface ProfessionalLongFormMasterAssemblyColorEvidence {
  validationArtifactRef: AuthorityJsonBlobRef
  validationArtifact: ProfessionalLongFormCrossChunkColorValidationArtifact
}

export interface ProfessionalLongFormMasterAssemblyDependencyEvidence {
  chunkQa: ProfessionalLongFormMasterAssemblyChunkQaEvidence[]
  programAudio: ProfessionalLongFormMasterAssemblyProgramAudioEvidence
  crossChunkColor: ProfessionalLongFormMasterAssemblyColorEvidence
}

export function buildProfessionalLongFormMasterAssemblyAuthority(input: {
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  dependencies: ProfessionalLongFormMasterAssemblyDependencyEvidence
  heartbeatIntervalMilliseconds: number
}): ProfessionalLongFormMasterAssemblyAuthority {
  const { current } = input
  const snapshot = current.authority.snapshot
  const reservation = current.authority.reservation
  const selection = selectAssemblyJob(current)
  const chunks = buildApprovedChunks(current, input.dependencies.chunkQa)
  const programAudio = buildProgramAudio(current, input.dependencies.programAudio)
  const crossChunkColor = buildCrossChunkColor(
    current,
    input.dependencies.crossChunkColor,
  )
  const masterTiming = buildMasterTiming(current)
  const dependencyCompletions = [
    ...chunks.map((chunk) => ({
      kind: 'qa_object_mezzanine_chunk' as const,
      jobId: chunk.qaJobId,
      approvedWorkItemId: chunk.qaApprovedWorkItemId,
      queueCompletionHash: chunk.queueCompletionHash,
      canonicalResultHash: chunk.qaCanonicalResultHash,
      attemptInternalCostEvidenceHash:
        chunk.qaAttemptInternalCostEvidenceHash,
    })),
    {
      kind: 'mix_continuous_program_audio' as const,
      jobId: programAudio.jobId,
      approvedWorkItemId: programAudio.approvedWorkItemId,
      queueCompletionHash: programAudio.queueCompletionHash,
      canonicalResultHash: programAudio.canonicalResultHash,
      attemptInternalCostEvidenceHash:
        programAudio.attemptInternalCostEvidenceHash,
    },
    {
      kind: 'validate_cross_chunk_color_continuity' as const,
      jobId: crossChunkColor.jobId,
      approvedWorkItemId: crossChunkColor.approvedWorkItemId,
      queueCompletionHash: crossChunkColor.queueCompletionHash,
      canonicalResultHash: crossChunkColor.canonicalResultHash,
      attemptInternalCostEvidenceHash:
        crossChunkColor.attemptInternalCostEvidenceHash,
    },
    {
      kind: 'validate_master_timing' as const,
      jobId: masterTiming.jobId,
      approvedWorkItemId: masterTiming.approvedWorkItemId,
      queueCompletionHash: masterTiming.queueCompletionHash,
      canonicalResultHash: masterTiming.canonicalResultHash,
      attemptInternalCostEvidenceHash:
        masterTiming.attemptInternalCostEvidenceHash,
    },
  ]
  const dependencyIds = dependencyCompletions.map((value) => value.jobId)
  const remainingReservedCredits = reservation.reservedCredits -
    reservation.spentCredits - reservation.releasedCredits -
    reservation.refundedCredits
  const expectedOrder = chunks.length * 2 + 5
  if (
    input.ownerUserId !== snapshot.approvedByUserId ||
    current.authority.approval.approvedByUserId !== input.ownerUserId ||
    current.authority.approval.id !== snapshot.approvalId ||
    reservation.status !== 'reserved' || reservation.id !== snapshot.reservationId ||
    remainingReservedCredits <= 0 ||
    selection.workItem.kind !== PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_KIND ||
    selection.manifestJob.kind !== PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_KIND ||
    selection.queueEntry.definition.canonicalOrder !== expectedOrder ||
    selection.placement.workerType !== 'render_worker' ||
    selection.placement.resourceClassId !== 'render_cpu_high_memory_v1' ||
    selection.placement.maxAttempts !== 2 ||
    selection.placement.attemptTimeoutSeconds !== 3_600 ||
    selection.placement.privateExecutionReady ||
    selection.placement.providerExecutionMode !== 'none' ||
    selection.queueJob.definitionHash !==
      selection.queueEntry.definition.definitionHash ||
    selection.placement.placementHash !==
      selection.queueEntry.definition.placementHash ||
    stableAuthorityStringify(selection.queueEntry.definition.dependencyJobIds) !==
      stableAuthorityStringify(dependencyIds)
  ) throw new Error(
    'Long-form master assembly lost snapshot, reservation, placement, or dependency authority.',
  )

  const approvedAssemblyPlan = buildApprovedAssemblyPlan({
    current,
    expectedOutputIdentity: selection.workItem.expectedOutputIdentity,
    chunks,
    programAudio,
    crossChunkColor,
    masterTiming,
  })
  const authorizedAt = latestCompletionTimestamp(current, dependencyIds)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_AUTHORITY_VERSION,
    source:
      'server_reopened_professional_long_form_master_assembly_authority' as const,
    purpose:
      'authorize_one_private_vp9_flac_long_form_review_master_assembly' as const,
    status:
      'private_master_assembly_authorized_all_dependencies_required' as const,
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
    approvedAssemblyPlan,
    lineage: {
      planningAuthorityHash: sha256AuthorityValue(current.authority),
      planHash: snapshot.planHash,
      workGraphHash: snapshot.workGraphHash,
      timingHash: snapshot.timingHash,
      objectPlanAuthorityHash: current.postApproval.bridge.binding.plan.authorityHash,
      bridgeAuthorityHash: current.postApproval.bridge.authorityHash,
      childJobManifestHash: current.postApproval.childJobManifest.manifestHash,
      childPackageHash: current.package.packageHash,
      childPlacementManifestHash: current.placementManifest.manifestHash,
      queueDefinitionHash: current.queueDefinition.definitionHash,
      finalizationJobAuthorityHash: selection.manifestJob.jobAuthorityHash,
      finalizationJobDefinitionHash: selection.queueJob.definitionHash,
      finalizationPlacementHash: selection.placement.placementHash,
      dependencyCompletions,
      dependencySetHash: sha256AuthorityValue(dependencyCompletions),
    },
    operation: {
      ...operation,
      workerType: 'render_worker' as const,
      resourceClassId: 'render_cpu_high_memory_v1' as const,
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
      exactQaPassedPrivateChunkRead: true as const,
      exactQaPassedPrivateProgramAudioRead: true as const,
      exactCrossChunkColorPassRequired: true as const,
      fixedVp9FlacMatroskaStreamCopyRecipe: true as const,
      mediaReencodingAllowed: false as const,
      privateMasterCreateOnly: true as const,
      independentPrivateMasterQaRequired: true as const,
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
  return professionalLongFormMasterAssemblyAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormMasterAssemblyAuthority(input: {
  value: unknown
  ownerUserId: string
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  dependencies: ProfessionalLongFormMasterAssemblyDependencyEvidence
  heartbeatIntervalMilliseconds: number
}): ProfessionalLongFormMasterAssemblyAuthority {
  const parsed = professionalLongFormMasterAssemblyAuthoritySchema.parse(
    input.value,
  )
  assertHashed(parsed, 'authorityHash')
  const expected = buildProfessionalLongFormMasterAssemblyAuthority(input)
  assertExact(parsed, expected, 'Long-form master authority failed exact replay.')
  return expected
}

export function buildProfessionalLongFormMasterAssemblyAuthorization(input: {
  authority: ProfessionalLongFormMasterAssemblyAuthority
  authorityRef: AuthorityJsonBlobRef
}): ProfessionalLongFormMasterAssemblyAuthorization {
  assertHashed(input.authority, 'authorityHash')
  assertBlobRef(input.authorityRef, input.authority)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_AUTHORIZATION_VERSION,
    source:
      'server_persisted_professional_long_form_master_assembly_authority' as const,
    authorizationId: `long-form-master-assembly-authorization-${sha256AuthorityValue({
      authorityHash: input.authority.authorityHash,
      authorityRef: input.authorityRef,
    }).slice(0, 40)}`,
    authorityRef: input.authorityRef,
    authorityHash: input.authority.authorityHash,
    queueDefinitionHash: input.authority.lineage.queueDefinitionHash,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    jobDefinitionHash: input.authority.lineage.finalizationJobDefinitionHash,
    placementHash: input.authority.lineage.finalizationPlacementHash,
    kind: PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_KIND,
    expectedOutputIdentity: input.authority.identity.expectedOutputIdentity,
    operation,
    authorizedAt: input.authority.authorizedAt,
    reservationExpiresAt: input.authority.approval.reservationExpiresAt,
    permissions: {
      privateLocalLease: true as const,
      oneUseInternalDispatch: true as const,
      exactDependencyArtifactsRead: true as const,
      fixedStreamCopyAssembly: true as const,
      createOnlyPrivateMasterPersistence: true as const,
      independentQaSeparatelyGated: true as const,
      providerCall: false as const,
      googleCloudDispatch: false as const,
      publicDelivery: false as const,
    },
    commercialBoundary,
  }
  return professionalLongFormMasterAssemblyAuthorizationSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormMasterAssemblyArtifactRef(input: {
  authority: ProfessionalLongFormMasterAssemblyAuthority
  byteLength: number
  sha256: string
}): ProfessionalLongFormMasterAssemblyArtifactRef {
  const plan = input.authority.approvedAssemblyPlan
  return professionalLongFormMasterAssemblyArtifactRefSchema.parse({
    objectIdentity: plan.privateObjectIdentityHash,
    mediaFormat: 'mkv',
    contentType: 'video/x-matroska',
    byteLength: input.byteLength,
    sha256: input.sha256,
    width: plan.width,
    height: plan.height,
    frameRateNumerator: 30,
    frameRateDenominator: 1,
    frameCount: plan.totalFrames,
    videoCodec: 'vp9',
    audioCodec: 'flac',
    sampleRate: 48_000,
    channels: 2,
    objectVersion: 1,
    assetRole: 'processed',
    renderPurpose: 'private_4k_long_form_review_master_v1',
    placeholderAllowed: false,
    privateLocalCreateOnly: true,
    databaseBacked: false,
    publicDeliveryAuthorized: false,
  })
}

export function buildProfessionalLongFormMasterAssemblyRuntimeEvidence(input: {
  authority: ProfessionalLongFormMasterAssemblyAuthority
  authorization: ProfessionalLongFormMasterAssemblyAuthorization
  executionAttempt: ProfessionalLongFormMasterAssemblyAttempt
  queueLeaseEvidence: ProfessionalLongFormMasterAssemblyRuntimeEvidence[
    'queueLeaseEvidence'
  ]
  requestEnvelopeSha256: string
  chunkSha256s: string[]
  programAudioSha256: string
  outputArtifact: ProfessionalLongFormMasterAssemblyArtifactRef
  outputProbeRef: AuthorityJsonBlobRef
  outputProbeHash: string
  confinementEvidenceHash: string
  imageIdentityHash: string
  attestationRecordId: string
  attestationHash: string
  completedAt: string
}): ProfessionalLongFormMasterAssemblyRuntimeEvidence {
  assertExecutionLineage(input)
  const plan = input.authority.approvedAssemblyPlan
  if (
    input.queueLeaseEvidence.claimId !== input.executionAttempt.claimId ||
    input.queueLeaseEvidence.initialClaimHash !== input.executionAttempt.claimHash ||
    input.queueLeaseEvidence.deliveryAttempt !==
      input.executionAttempt.deliveryAttempt ||
    input.queueLeaseEvidence.heartbeatCount < 1 ||
    stableAuthorityStringify(input.chunkSha256s) !==
      stableAuthorityStringify(plan.chunks.map((chunk) => chunk.renderArtifact.sha256)) ||
    input.programAudioSha256 !== plan.programAudio.artifact.sha256 ||
    input.outputProbeRef.sha256 !== input.outputProbeHash ||
    input.outputArtifact.objectIdentity !== plan.privateObjectIdentityHash ||
    input.outputArtifact.width !== plan.width ||
    input.outputArtifact.height !== plan.height ||
    input.outputArtifact.frameCount !== plan.totalFrames
  ) throw new Error('Long-form master runtime evidence changed from authority.')
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_RUNTIME_EVIDENCE_VERSION,
    source:
      'canonical_professional_long_form_master_assembly_ffmpeg_runner' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId: input.authority.identity.approvedPlanSnapshotId,
      jobId: input.authority.identity.jobId,
      approvedWorkItemId: input.authority.identity.approvedWorkItemId,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    operation,
    queueLeaseEvidence: input.queueLeaseEvidence,
    requestEnvelopeSha256: input.requestEnvelopeSha256,
    inputSetHash: sha256AuthorityValue({
      chunks: input.chunkSha256s,
      programAudio: input.programAudioSha256,
      crossChunkColor: plan.crossChunkColor.validationHash,
      programAudioQa: plan.programAudio.qaArtifactHash,
    }),
    chunkSha256s: input.chunkSha256s,
    programAudioSha256: input.programAudioSha256,
    crossChunkColorValidationHash: plan.crossChunkColor.validationHash,
    continuousProgramAudioQaHash: plan.programAudio.qaArtifactHash,
    outputArtifact: input.outputArtifact,
    outputProbeRef: input.outputProbeRef,
    outputProbeHash: input.outputProbeHash,
    confinementEvidenceHash: input.confinementEvidenceHash,
    runtime: {
      binaryVersion: '8.1.2' as const,
      imageIdentityHash: input.imageIdentityHash,
      attestationRecordId: input.attestationRecordId,
      attestationHash: input.attestationHash,
      networkMode: 'none' as const,
      containerExitCode: 0 as const,
      oomKilled: false as const,
    },
    checks: {
      everyDependencyCompletionReopened: 'passed' as const,
      everyPrivateInputChecksumReopened: 'passed' as const,
      exactOrderedChunkTimelineVerified: 'passed' as const,
      exactContinuousProgramAudioVerified: 'passed' as const,
      crossChunkColorPassVerified: 'passed' as const,
      vp9AndFlacStreamCopiedWithoutReencode: 'passed' as const,
      independentOutputProbeExecuted: 'passed' as const,
      privateMasterPersistedCreateOnly: 'passed' as const,
      independentPrivateMasterQaStillRequired: true as const,
    },
    completedAt: input.completedAt,
  }
  return professionalLongFormMasterAssemblyRuntimeEvidenceSchema.parse({
    ...payload,
    artifactHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormMasterAssemblyReconciliation(input: {
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  authority: ProfessionalLongFormMasterAssemblyAuthority
  executionAttempt: ProfessionalLongFormMasterAssemblyAttempt
  outputArtifact: ProfessionalLongFormMasterAssemblyArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciledAt: string
  allowCompletedAssembly?: boolean
}): ProfessionalLongFormMasterAssemblyReconciliation {
  const assemblyEntry = selectAssemblyJob(input.current).queueEntry
  const qaWorkItem = input.current.postApproval.bridge.binding.plan.workGraph
    .workItems.find((workItem) => workItem.kind === 'qa_private_4k_master')
  const qaEntry = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId === qaWorkItem?.workItemId)
  if (
    !qaWorkItem || !qaEntry || qaEntry.state !== 'queued' ||
    qaEntry.definition.dependencyJobIds.length !== 1 ||
    qaEntry.definition.dependencyJobIds[0] !== input.authority.identity.jobId ||
    qaEntry.professionalLongFormExecutionAuthorization ||
    qaEntry.professionalLongFormExecutionAttempt || qaEntry.completion ||
    (assemblyEntry.state !== 'leased' &&
      !(input.allowCompletedAssembly && assemblyEntry.state === 'completed'))
  ) throw new Error('Long-form master reconciliation lost private QA authority.')
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_RECONCILIATION_VERSION,
    source:
      'canonical_professional_long_form_master_assembly_reconciliation' as const,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorityHash: input.authority.authorityHash,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    downstreamPrivateMasterQa: {
      jobId: qaEntry.definition.jobId,
      approvedWorkItemId: qaEntry.definition.approvedWorkItemId,
      dependencyJobId: input.authority.identity.jobId,
      thisDependencySatisfied: true as const,
      everyRequiredDependencySatisfied: true as const,
      executionAuthorized: false as const,
    },
    decision:
      'private_review_master_ready_independent_private_master_qa_requires_separate_authority' as const,
    reconciledAt: input.reconciledAt,
  }
  return professionalLongFormMasterAssemblyReconciliationSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

export function professionalLongFormMasterAssemblyResultHash(input: {
  authority: ProfessionalLongFormMasterAssemblyAuthority
  executionAttempt: ProfessionalLongFormMasterAssemblyAttempt
  outputArtifact: ProfessionalLongFormMasterAssemblyArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
}): string {
  return sha256AuthorityValue({
    domain: 'professional_long_form_master_assembly_result_v1',
    authorityHash: input.authority.authorityHash,
    executionAttemptHash: input.executionAttempt.attemptHash,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
  })
}

export function buildProfessionalLongFormMasterAssemblyTerminal(input: {
  authority: ProfessionalLongFormMasterAssemblyAuthority
  authorization: ProfessionalLongFormMasterAssemblyAuthorization
  executionAttempt: ProfessionalLongFormMasterAssemblyAttempt
  outputArtifact: ProfessionalLongFormMasterAssemblyArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  completedAt: string
}): ProfessionalLongFormMasterAssemblyTerminal {
  assertExecutionLineage(input)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_TERMINAL_VERSION,
    source:
      'canonical_professional_long_form_master_assembly_execution_service' as const,
    jobId: input.authority.identity.jobId,
    approvedWorkItemId: input.authority.identity.approvedWorkItemId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    queueReceiptId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    outcome: 'completed_private_test' as const,
    independentPrivateMasterQaCompleted: false as const,
    publicDeliveryAuthorized: false as const,
    commercialBoundary,
    completedAt: input.completedAt,
  }
  return professionalLongFormMasterAssemblyTerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

export function buildProfessionalLongFormMasterAssemblyCompletion(input: {
  authority: ProfessionalLongFormMasterAssemblyAuthority
  authorization: ProfessionalLongFormMasterAssemblyAuthorization
  executionAttempt: ProfessionalLongFormMasterAssemblyAttempt
  outputArtifact: ProfessionalLongFormMasterAssemblyArtifactRef
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  terminalEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
}): ProfessionalLongFormMasterAssemblyCompletion {
  assertExecutionLineage(input)
  return professionalLongFormMasterAssemblyCompletionSchema.parse({
    schemaVersion: PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COMPLETION_VERSION,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorizationId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    outputArtifact: input.outputArtifact,
    runtimeEvidenceRef: input.runtimeEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    terminalEvidenceRef: input.terminalEvidenceRef,
  })
}

function buildApprovedChunks(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
  evidence: ProfessionalLongFormMasterAssemblyChunkQaEvidence[],
) {
  const chunks = [...current.postApproval.bridge.binding.plan.chunks]
    .sort((left, right) => left.chunkIndex - right.chunkIndex)
  const byChunk = new Map(evidence.map((value) => [value.chunkId, value]))
  if (
    chunks.length < 2 || chunks.length > 124 || evidence.length !== chunks.length ||
    byChunk.size !== chunks.length
  ) throw new Error('Long-form master requires every unique chunk QA artifact.')
  return chunks.map((chunk, index) => {
    const item = byChunk.get(chunk.chunkId)
    const entry = current.queueAggregate.entries.find((candidate) =>
      candidate.definition.approvedWorkItemId === `${chunk.chunkId}:qa`)
    if (!item || !entry?.completion || entry.state !== 'completed') {
      throw new Error('Long-form master chunk QA dependency is not completed.')
    }
    const completion = professionalLongFormFirstObjectChunkQaCompletionSchema
      .parse(entry.completion.outcome.professionalLongFormExecution)
    const qaArtifact = professionalLongFormFirstObjectChunkQaArtifactSchema
      .parse(item.qaArtifact)
    assertHashed(qaArtifact, 'qaHash')
    const boundaryBefore = chunk.sourceSlices[0]?.boundaryBefore
    if (
      chunk.chunkIndex !== index + 1 || chunk.chunkCount !== chunks.length ||
      item.qaArtifactRef.sha256 !== completion.validationArtifactRef.sha256 ||
      item.qaArtifactRef.byteLength !== completion.validationArtifactRef.byteLength ||
      qaArtifact.identity.chunkId !== chunk.chunkId ||
      qaArtifact.renderArtifact.objectIdentity !== chunk.expectedObject.objectIdentity ||
      qaArtifact.observed.frameCount !== chunk.durationFrames ||
      qaArtifact.outcome !== 'passed' ||
      (index === 0 ? boundaryBefore !== 'timeline_start' :
        !['approved_hard_cut', 'continuous_technical_split'].includes(
          String(boundaryBefore),
        ))
    ) throw new Error('Long-form master chunk QA changed from approved plan.')
    return {
      chunkId: chunk.chunkId,
      chunkIndex: chunk.chunkIndex,
      chunkCount: chunk.chunkCount,
      globalStartFrame: chunk.globalStartFrame,
      globalEndFrameExclusive: chunk.globalEndFrameExclusive,
      durationFrames: chunk.durationFrames,
      boundaryBefore: boundaryBefore!,
      qaJobId: entry.definition.jobId,
      qaApprovedWorkItemId: entry.definition.approvedWorkItemId,
      queueCompletionHash: entry.completion.completionHash,
      qaCanonicalResultHash: completion.canonicalResultHash,
      qaAttemptInternalCostEvidenceHash:
        completion.attemptInternalCostEvidenceHash,
      qaArtifactRef: item.qaArtifactRef,
      qaArtifactHash: qaArtifact.qaHash,
      renderArtifact: qaArtifact.renderArtifact,
    }
  })
}

function buildProgramAudio(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
  evidence: ProfessionalLongFormMasterAssemblyProgramAudioEvidence,
) {
  const workItem = current.postApproval.bridge.binding.plan.workGraph.workItems
    .find((value) => value.kind === 'mix_continuous_program_audio')
  const entry = current.queueAggregate.entries.find((candidate) =>
    candidate.definition.approvedWorkItemId === workItem?.workItemId)
  if (!workItem || !entry?.completion || entry.state !== 'completed') {
    throw new Error('Long-form master program audio is not completed.')
  }
  const completion = professionalLongFormContinuousProgramAudioCompletionSchema
    .parse(entry.completion.outcome.professionalLongFormExecution)
  const qaArtifact = professionalLongFormContinuousProgramAudioQaArtifactSchema
    .parse(evidence.qaArtifact)
  assertHashed(qaArtifact, 'qaHash')
  if (
    evidence.qaArtifactRef.sha256 !== completion.qaArtifactRef.sha256 ||
    evidence.qaArtifactRef.byteLength !== completion.qaArtifactRef.byteLength ||
    qaArtifact.outcome !== 'passed' ||
    stableAuthorityStringify(qaArtifact.outputArtifact) !==
      stableAuthorityStringify(completion.outputArtifact)
  ) throw new Error('Long-form master program-audio QA changed.')
  return {
    jobId: entry.definition.jobId,
    approvedWorkItemId: entry.definition.approvedWorkItemId,
    queueCompletionHash: entry.completion.completionHash,
    canonicalResultHash: completion.canonicalResultHash,
    attemptInternalCostEvidenceHash: completion.attemptInternalCostEvidenceHash,
    qaAttemptInternalCostEvidenceHash:
      completion.qaAttemptInternalCostEvidenceHash,
    qaArtifactRef: evidence.qaArtifactRef,
    qaArtifactHash: qaArtifact.qaHash,
    artifact: completion.outputArtifact,
  }
}

function buildCrossChunkColor(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
  evidence: ProfessionalLongFormMasterAssemblyColorEvidence,
) {
  const workItem = current.postApproval.bridge.binding.plan.workGraph.workItems
    .find((value) => value.kind === 'validate_cross_chunk_color_continuity')
  const entry = current.queueAggregate.entries.find((candidate) =>
    candidate.definition.approvedWorkItemId === workItem?.workItemId)
  if (!workItem || !entry?.completion || entry.state !== 'completed') {
    throw new Error('Long-form master cross-chunk color is not completed.')
  }
  const completion = professionalLongFormCrossChunkColorCompletionSchema.parse(
    entry.completion.outcome.professionalLongFormExecution,
  )
  const validation = professionalLongFormCrossChunkColorValidationArtifactSchema
    .parse(evidence.validationArtifact)
  assertHashed(validation, 'validationHash')
  if (
    evidence.validationArtifactRef.sha256 !==
      completion.validationArtifactRef.sha256 ||
    evidence.validationArtifactRef.byteLength !==
      completion.validationArtifactRef.byteLength ||
    validation.outcome !== 'passed'
  ) throw new Error('Long-form master cross-chunk color evidence changed.')
  return {
    jobId: entry.definition.jobId,
    approvedWorkItemId: entry.definition.approvedWorkItemId,
    queueCompletionHash: entry.completion.completionHash,
    canonicalResultHash: completion.canonicalResultHash,
    attemptInternalCostEvidenceHash: completion.attemptInternalCostEvidenceHash,
    validationArtifactRef: evidence.validationArtifactRef,
    validationHash: validation.validationHash,
  }
}

function buildMasterTiming(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
) {
  const entry = current.queueAggregate.entries.find((candidate) =>
    candidate.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID)
  if (!entry?.completion || entry.state !== 'completed') {
    throw new Error('Long-form master timing dependency is not completed.')
  }
  const completion = professionalLongFormMasterTimingCompletionSchema.parse(
    entry.completion.outcome.professionalLongFormExecution,
  )
  return {
    jobId: entry.definition.jobId,
    approvedWorkItemId: entry.definition.approvedWorkItemId,
    queueCompletionHash: entry.completion.completionHash,
    canonicalResultHash: completion.canonicalResultHash,
    attemptInternalCostEvidenceHash: completion.attemptInternalCostEvidenceHash,
  }
}

function buildApprovedAssemblyPlan(input: {
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  expectedOutputIdentity: string
  chunks: ReturnType<typeof buildApprovedChunks>
  programAudio: ReturnType<typeof buildProgramAudio>
  crossChunkColor: ReturnType<typeof buildCrossChunkColor>
  masterTiming: ReturnType<typeof buildMasterTiming>
}) {
  const request = input.current.postApproval.bridge.binding.plan.request
  const width = request.confirmedOutputFrame.width
  const height = request.confirmedOutputFrame.height
  if (
    request.confirmedOutputFrame.frameRate.numerator !== 30 ||
    request.confirmedOutputFrame.frameRate.denominator !== 1 ||
    request.executionPolicy.finalizationPolicy !==
      'compatible_object_mezzanine_concat_or_block_v1' ||
    input.chunks[0]?.globalStartFrame !== 0 ||
    input.chunks[input.chunks.length - 1]?.globalEndFrameExclusive !==
      request.totalFrames ||
    input.chunks.some((chunk, index) =>
      chunk.renderArtifact.contentType !== 'video/x-matroska' ||
      (index > 0 && input.chunks[index - 1]?.globalEndFrameExclusive !==
        chunk.globalStartFrame)) ||
    input.programAudio.artifact.totalFrames !== request.totalFrames ||
    input.crossChunkColor.validationHash.length !== 64
  ) throw new Error('Long-form master fixed assembly profile is not approved.')
  const assemblyAuthorityHash = sha256AuthorityValue({
    domain: 'professional_long_form_master_assembly_plan_authority_v1',
    approvedPlanSnapshotId: request.identity.approvedPlanSnapshotId,
    expectedOutputIdentity: input.expectedOutputIdentity,
    chunks: input.chunks,
    programAudio: input.programAudio,
    crossChunkColor: input.crossChunkColor,
    masterTiming: input.masterTiming,
  })
  const privateObjectIdentityHash = sha256AuthorityValue({
    domain: 'private_long_form_review_master_object_v1',
    assemblyAuthorityHash,
    expectedOutputIdentity: input.expectedOutputIdentity,
  })
  const withoutHash = {
    assemblyAuthorityHash,
    privateObjectIdentityHash,
    recipeProfileId:
      'approved_long_form_vp9_flac_matroska_master_v1' as const,
    width,
    height,
    fps: 30 as const,
    totalFrames: request.totalFrames,
    chunkCount: input.chunks.length,
    chunks: input.chunks,
    programAudio: input.programAudio,
    crossChunkColor: input.crossChunkColor,
    masterTiming: input.masterTiming,
    videoAssemblyPolicy:
      'ordered_vp9_object_chunk_stream_copy_v1' as const,
    audioAssemblyPolicy:
      'continuous_flac_program_audio_stream_copy_v1' as const,
    timestampPolicy:
      'normalize_from_zero_preserve_frame_and_sample_time_v1' as const,
    compatibilityPolicy:
      'exact_vp9_bt709_4k_30fps_and_flac_48k_stereo_v1' as const,
    outputContainer: 'matroska' as const,
    outputVideoCodec: 'copy_vp9' as const,
    outputAudioCodec: 'copy_flac' as const,
    renderPurpose: 'private_4k_long_form_review_master_v1' as const,
    mediaReencodingAllowed: false as const,
  }
  return { ...withoutHash, planHash: sha256AuthorityValue(withoutHash) }
}

function selectAssemblyJob(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
) {
  const workItem = current.postApproval.bridge.binding.plan.workGraph.workItems
    .find((item) => item.kind === PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_KIND)
  const manifestJob = current.postApproval.childJobManifest.jobs.find((job) =>
    job.childWorkItemId === workItem?.workItemId)
  const placement = current.placementManifest.placements.find((entry) =>
    entry.childWorkItemId === workItem?.workItemId)
  const queueJob = current.queueDefinition.jobs.find((job) =>
    job.approvedWorkItemId === workItem?.workItemId)
  const queueEntry = current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId === workItem?.workItemId)
  if (!workItem || !manifestJob || !placement || !queueJob || !queueEntry) {
    throw new Error('Canonical long-form master assembly job is missing.')
  }
  return { workItem, manifestJob, placement, queueJob, queueEntry }
}

function latestCompletionTimestamp(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
  jobIds: string[],
): string {
  const timestamps = jobIds.map((jobId) => {
    const completedAt = current.queueAggregate.entries.find((entry) =>
      entry.definition.jobId === jobId)?.completion?.completedAt
    if (!completedAt) throw new Error('Master assembly dependency time is missing.')
    return Date.parse(completedAt)
  })
  return new Date(Math.max(...timestamps)).toISOString()
}

function assertExecutionLineage(input: {
  authority: ProfessionalLongFormMasterAssemblyAuthority
  authorization: ProfessionalLongFormMasterAssemblyAuthorization
  executionAttempt: ProfessionalLongFormMasterAssemblyAttempt
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
  ) throw new Error('Long-form master assembly lineage changed.')
}

function assertBlobRef(ref: AuthorityJsonBlobRef, value: unknown): void {
  if (ref.sha256 !== sha256AuthorityValue(value)) {
    throw new Error('Long-form master assembly blob reference changed.')
  }
}

function assertHashed<T extends string>(
  value: Record<T, string>,
  key: T,
): void {
  const { [key]: actual, ...withoutHash } = value
  if (actual !== sha256AuthorityValue(withoutHash)) {
    throw new Error(`Long-form master assembly ${String(key)} is invalid.`)
  }
}

function assertExact(left: unknown, right: unknown, message: string): void {
  if (stableAuthorityStringify(left) !== stableAuthorityStringify(right)) {
    throw new Error(message)
  }
}
