import type {
  CanonicalProfessionalLongFormCurrentChildPackageAuthority,
} from '../services/canonical-professional-long-form-child-package-promotion-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from '../services/private-edit-authority-store'
import {
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID,
  professionalLongFormFirstChildCompletionSchema,
} from './professional-long-form-first-child-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_AUTHORIZATION_RECEIPT_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_COMPONENT_PROFILE_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_ESTIMATE_LINE_KEY,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_EXECUTION_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_KIND,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_QA_EVIDENCE_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_RECONCILIATION_EVIDENCE_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_RUNNER_CLASS,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_TERMINAL_EVIDENCE_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_VALIDATION_ARTIFACT_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
  PROFESSIONAL_LONG_FORM_TIMING_VALIDATION_CATEGORIES,
  canonicalProfessionalLongFormCaptionVisualTimingPlanSchema,
  canonicalProfessionalLongFormMasterTimingPlanSchema,
  canonicalProfessionalLongFormSoundSyncTimingPlanSchema,
  canonicalProfessionalLongFormTimingValidationPlanSchema,
  professionalLongFormMasterTimingAuthorizationReceiptSchema,
  professionalLongFormMasterTimingCompletionSchema,
  professionalLongFormMasterTimingExecutionAuthoritySchema,
  professionalLongFormMasterTimingQaEvidenceSchema,
  professionalLongFormMasterTimingReconciliationEvidenceSchema,
  professionalLongFormMasterTimingTerminalEvidenceSchema,
  professionalLongFormMasterTimingValidationArtifactSchema,
  type CanonicalProfessionalLongFormCaptionVisualTimingPlan,
  type CanonicalProfessionalLongFormMasterTimingPlan,
  type CanonicalProfessionalLongFormSoundSyncTimingPlan,
  type CanonicalProfessionalLongFormTimingValidationPlan,
  type ProfessionalLongFormMasterTimingAuthorizationReceipt,
  type ProfessionalLongFormMasterTimingExecutionAttempt,
  type ProfessionalLongFormMasterTimingExecutionAuthority,
  type ProfessionalLongFormMasterTimingQaEvidence,
  type ProfessionalLongFormMasterTimingReconciliationEvidence,
  type ProfessionalLongFormMasterTimingTerminalEvidence,
  type ProfessionalLongFormMasterTimingValidationArtifact,
} from './professional-long-form-master-timing-execution-contract'

const exactOperation = {
  operationId: PROFESSIONAL_LONG_FORM_MASTER_TIMING_OPERATION_ID,
  runnerClass: PROFESSIONAL_LONG_FORM_MASTER_TIMING_RUNNER_CLASS,
  attemptCostProfileId: PROFESSIONAL_LONG_FORM_MASTER_TIMING_COST_PROFILE_ID,
} as const

const commercialBoundary = {
  internalProductionCostOnly: true as const,
  customerPriceAuthorityIncluded: false as const,
  customerCreditAuthorityIncluded: false as const,
  serviceFeeAuthorityIncluded: false as const,
  walletMutationAuthorized: false as const,
  billingAuthorized: false as const,
}

const timingExecutionPermissions = {
  privateLocalLease: true as const,
  oneUseInternalDispatch: true as const,
  structuredApprovedTimingValidation: true as const,
  exactComponentHashValidation: true as const,
  exactFrameTimelineValidation: true as const,
  privateValidationArtifact: true as const,
  privateQaAndReconciliation: true as const,
  mediaByteRead: false as const,
  transcriptAlignment: false as const,
  beatDetection: false as const,
  mediaDecodeOrTransform: false as const,
  render: false as const,
  providerCall: false as const,
  googleCloudDispatch: false as const,
  publicDelivery: false as const,
}

interface CanonicalTimingSegment {
  segmentId: string
  startFrame: number
  endFrameExclusive: number
  operationIds: string[]
}

export interface BuildCanonicalProfessionalLongFormTimingComponentsInput {
  fps: number
  frameRate: { numerator: number; denominator: number }
  totalFrames: number
  segments: CanonicalTimingSegment[]
  sourceCleanupPlan: unknown
  approvedHardCutCount: number
}

export interface CanonicalProfessionalLongFormTimingComponents {
  masterTimingPlan: CanonicalProfessionalLongFormMasterTimingPlan
  captionVisualCueTimingPlan: CanonicalProfessionalLongFormCaptionVisualTimingPlan
  soundSyncTransitionTimingPlan: CanonicalProfessionalLongFormSoundSyncTimingPlan
  timingValidationPlan: CanonicalProfessionalLongFormTimingValidationPlan
  timingSummary: {
    validationStatus: 'passed'
    approvalBlocked: false
    fps: number
    totalFrames: number
  }
}

export interface ProfessionalLongFormMasterTimingValidationSummary {
  timingCoverage: ProfessionalLongFormMasterTimingValidationArtifact['timingCoverage']
  hashes: ProfessionalLongFormMasterTimingValidationArtifact['hashes']
}

export function buildCanonicalProfessionalLongFormSourceLedTimingComponents(
  input: BuildCanonicalProfessionalLongFormTimingComponentsInput,
): CanonicalProfessionalLongFormTimingComponents {
  const segmentSetHash = sha256AuthorityValue(input.segments)
  const sourceCleanupPlanHash = sha256AuthorityValue(input.sourceCleanupPlan)
  const masterTimingPlan = canonicalProfessionalLongFormMasterTimingPlanSchema.parse({
    schemaVersion: PROFESSIONAL_LONG_FORM_MASTER_TIMING_COMPONENT_PROFILE_VERSION,
    profileId: PROFESSIONAL_LONG_FORM_MASTER_TIMING_PROFILE_ID,
    status: 'ready',
    timingBase: {
      fps: input.fps,
      frameRate: input.frameRate,
      totalFrames: input.totalFrames,
      firstFrame: 0,
      endFrameExclusive: input.totalFrames,
      executionUnit: 'frames',
      displayUnit: 'seconds',
      frameRoundingMode: 'exact_rational',
    },
    timeline: {
      segmentCount: input.segments.length,
      segmentSetHash,
      approvedHardCutCount: input.approvedHardCutCount,
      gapFreeRequired: true,
      overlapFreeRequired: true,
      fullDurationCoverageRequired: true,
    },
    sourceCleanup: {
      confirmed: true,
      sourceCleanupPlanHash,
      preserveMeaningRequired: true,
    },
    priorityHierarchy: [
      'speech_clarity',
      'story_meaning_emotion',
      'visual_readability',
      'music_beat_rhythm',
      'motion_smoothness',
      'platform_retention',
      'decorative_effects',
    ],
    rendererPolicy: {
      rendererUsesApprovedFramesOnly: true,
      finalCanvasOwnedByReeditPro: true,
      requiredAssetPlaceholdersAllowedInFinal: false,
    },
  })
  const captionVisualCueTimingPlan =
    canonicalProfessionalLongFormCaptionVisualTimingPlanSchema.parse({
      schemaVersion:
        PROFESSIONAL_LONG_FORM_MASTER_TIMING_COMPONENT_PROFILE_VERSION,
      profileId: PROFESSIONAL_LONG_FORM_MASTER_TIMING_PROFILE_ID,
      status: 'synced',
      captionItemCount: 0,
      visualCueCount: 0,
      collisionCount: 0,
      speechClarityPriority: true,
      generatedCueTimingRequested: false,
      noRandomCaptionsOrVisuals: true,
    })
  const soundSyncTransitionTimingPlan =
    canonicalProfessionalLongFormSoundSyncTimingPlanSchema.parse({
      schemaVersion:
        PROFESSIONAL_LONG_FORM_MASTER_TIMING_COMPONENT_PROFILE_VERSION,
      profileId: PROFESSIONAL_LONG_FORM_MASTER_TIMING_PROFILE_ID,
      status: 'ready',
      speechPriority: true,
      transitionPolicy: 'approved_hard_cuts_only',
      approvedHardCutCount: input.approvedHardCutCount,
      musicPlanned: false,
      sfxPlanned: false,
      duckingPlanned: false,
      beatGridMode: 'not_requested',
      realAudioAnalysisPerformed: false,
    })
  const applicable = new Set([
    'frame_confirmation',
    'timing_base',
    'source_timing',
    'final_timeline',
    'transition_safety',
    'remotion_layer_timing',
    'tier_complexity',
    'credit_impact',
    'approval_gate',
    'worker_readiness',
  ])
  const timingValidationPlan =
    canonicalProfessionalLongFormTimingValidationPlanSchema.parse({
      schemaVersion:
        PROFESSIONAL_LONG_FORM_MASTER_TIMING_COMPONENT_PROFILE_VERSION,
      profileId: PROFESSIONAL_LONG_FORM_MASTER_TIMING_PROFILE_ID,
      overallStatus: 'passed',
      approvalBlocked: false,
      frameCoverageVerified: true,
      categories: PROFESSIONAL_LONG_FORM_TIMING_VALIDATION_CATEGORIES.map(
        (category) => ({
          category,
          outcome: applicable.has(category)
            ? 'passed'
            : 'passed_not_applicable',
        }),
      ),
      timingComplexity: {
        level: 'simple',
        approvedEstimateLineKey:
          PROFESSIONAL_LONG_FORM_MASTER_TIMING_ESTIMATE_LINE_KEY,
        includedInApprovedEstimate: true,
        lowerCostAlternativesRequired: false,
      },
      workerPolicy: {
        approvedSnapshotOnly: true,
        rawChatReinterpretationAllowed: false,
        materialTimingChangeRequiresNewApproval: true,
      },
      limitations: {
        structuredPlanValidationOnly: true,
        transcriptAlignmentPerformed: false,
        beatDetectionPerformed: false,
        mediaInspectionPerformed: false,
        renderPerformed: false,
      },
    })
  return {
    masterTimingPlan,
    captionVisualCueTimingPlan,
    soundSyncTransitionTimingPlan,
    timingValidationPlan,
    timingSummary: {
      validationStatus: 'passed',
      approvalBlocked: false,
      fps: input.fps,
      totalFrames: input.totalFrames,
    },
  }
}

export function buildProfessionalLongFormMasterTimingExecutionAuthority(
  input: {
    ownerUserId: string
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  },
): ProfessionalLongFormMasterTimingExecutionAuthority {
  const { current } = input
  const snapshot = current.authority.snapshot
  const reservation = current.authority.reservation
  const timingJob = current.postApproval.childJobManifest.jobs.find((job) =>
    job.childWorkItemId === PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID)
  const timingPlacement = current.placementManifest.placements.find((placement) =>
    placement.childWorkItemId ===
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID)
  const timingQueueJob = current.queueDefinition.jobs.find((job) =>
    job.approvedWorkItemId === PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID)
  const timingQueueEntry = current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID)
  const rootEntry = current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID)
  const rootCompletion = professionalLongFormFirstChildCompletionSchema.safeParse(
    rootEntry?.completion?.outcome.professionalLongFormExecution,
  )
  const rootCompletionEvent = current.queueAggregate.events.find((event) =>
    event.eventType === 'job_completed' &&
    event.jobId === rootEntry?.definition.jobId)
  const queueCreatedEvent = current.queueAggregate.events[0]
  const remainingReservedCredits = reservation.reservedCredits -
    reservation.spentCredits - reservation.releasedCredits -
    reservation.refundedCredits
  const refs = snapshot.componentRefs
  const masterTimingPlanRef = refs.masterTimingPlan
  const captionVisualCueTimingPlanRef = refs.captionVisualCueTimingPlan
  const soundSyncTransitionTimingPlanRef = refs.soundSyncTransitionTimingPlan
  const timingValidationPlanRef = refs.timingValidationPlan
  const timingSummaryRef = refs.timingSummary
  const summary = deriveProfessionalLongFormMasterTimingValidationSummary(current)

  if (
    input.ownerUserId !== snapshot.approvedByUserId ||
    current.authority.approval.id !== snapshot.approvalId ||
    current.authority.approval.approvedByUserId !== input.ownerUserId ||
    reservation.status !== 'reserved' ||
    reservation.id !== snapshot.reservationId ||
    remainingReservedCredits <= 0 ||
    !masterTimingPlanRef ||
    !captionVisualCueTimingPlanRef ||
    !soundSyncTransitionTimingPlanRef ||
    !timingValidationPlanRef ||
    !timingSummaryRef ||
    !timingJob ||
    timingJob.kind !== PROFESSIONAL_LONG_FORM_MASTER_TIMING_KIND ||
    timingJob.expectedOutputIdentity !== snapshot.timingHash ||
    timingJob.dependencyJobIds.length !== 1 ||
    !timingPlacement ||
    timingPlacement.kind !== PROFESSIONAL_LONG_FORM_MASTER_TIMING_KIND ||
    timingPlacement.workerType !== 'qa_worker' ||
    timingPlacement.resourceClassId !== 'qa_cpu_standard_v1' ||
    timingPlacement.maxAttempts !== 1 ||
    timingPlacement.attemptTimeoutSeconds !== 900 ||
    timingPlacement.privateExecutionReady ||
    timingPlacement.providerExecutionMode !== 'none' ||
    timingPlacement.queueDependencyJobIds.length !== 1 ||
    timingPlacement.satisfiedPromotionDependencyJobIds.length !== 0 ||
    !timingQueueJob ||
    timingQueueJob.canonicalOrder !== 2 ||
    timingQueueJob.jobId !== timingJob.jobId ||
    timingQueueJob.placementHash !== timingPlacement.placementHash ||
    timingQueueJob.expectedOutputIdentity !== snapshot.timingHash ||
    timingQueueJob.dependencyJobIds.length !== 1 ||
    timingQueueJob.dependencyJobIds[0] !== rootEntry?.definition.jobId ||
    timingQueueJob.privateExecutionReady ||
    !timingQueueEntry ||
    !rootEntry ||
    rootEntry.state !== 'completed' ||
    rootEntry.definition.canonicalOrder !== 0 ||
    !rootEntry.professionalLongFormExecutionAuthorization ||
    !rootEntry.professionalLongFormExecutionAttempt ||
    !rootEntry.completion ||
    !rootCompletion.success ||
    rootCompletion.data.authorityHash !==
      rootEntry.professionalLongFormExecutionAuthorization.authorityHash ||
    rootCompletion.data.executionAttemptId !==
      rootEntry.professionalLongFormExecutionAttempt.executionAttemptId ||
    !rootCompletionEvent ||
    queueCreatedEvent?.eventType !== 'queue_created'
  ) {
    throw new Error(
      'Professional long-form master-timing execution lost approved timing, root, or queue lineage.',
    )
  }

  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_EXECUTION_AUTHORITY_VERSION,
    source:
      'server_reopened_canonical_professional_long_form_master_timing_authority' as const,
    purpose:
      'authorize_one_private_structured_master_timing_validation_child' as const,
    status:
      'master_timing_private_execution_authorized_media_children_blocked' as const,
    identity: {
      ownerUserId: input.ownerUserId,
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      approvedPlanId: snapshot.planId,
      approvedPlanSnapshotId: snapshot.snapshotId,
      approvedPlanSnapshotHash: snapshot.snapshotHash,
      packageRecordId: current.package.identity.packageRecordId,
      jobId: timingJob.jobId,
      approvedWorkItemId: PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
      kind: PROFESSIONAL_LONG_FORM_MASTER_TIMING_KIND,
      expectedOutputIdentity: timingJob.expectedOutputIdentity,
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
    lineage: {
      planningAuthorityHash: sha256AuthorityValue(current.authority),
      planHash: snapshot.planHash,
      estimateHash: snapshot.estimateHash,
      workGraphHash: snapshot.workGraphHash,
      timingHash: snapshot.timingHash,
      bridgeAuthorityHash: current.postApproval.bridge.authorityHash,
      bridgeRef: current.postApproval.bridgeRef,
      childJobManifestHash: current.postApproval.childJobManifest.manifestHash,
      childJobManifestRef: current.postApproval.childJobManifestRef,
      childPackageHash: current.package.packageHash,
      childPackageRef: current.packageRef,
      childPlacementManifestHash: current.placementManifest.manifestHash,
      childPlacementManifestRef: current.placementManifestRef,
      queueDefinitionHash: current.queueDefinition.definitionHash,
      queueCreatedEventHash: queueCreatedEvent.eventHash,
      masterTimingPlanHash: masterTimingPlanRef.sha256,
      masterTimingPlanRef,
      captionVisualCueTimingPlanHash: captionVisualCueTimingPlanRef.sha256,
      captionVisualCueTimingPlanRef,
      soundSyncTransitionTimingPlanHash:
        soundSyncTransitionTimingPlanRef.sha256,
      soundSyncTransitionTimingPlanRef,
      timingValidationPlanHash: timingValidationPlanRef.sha256,
      timingValidationPlanRef,
      timingSummaryHash: timingSummaryRef.sha256,
      timingSummaryRef,
      segmentSetHash: sha256AuthorityValue(current.authority.components.segments),
      sourceCleanupPlanHash: sha256AuthorityValue(
        current.authority.components.sourceCleanupPlan,
      ),
      timingEstimateCoverageHash: summary.hashes.timingEstimateCoverageHash,
      timingJobAuthorityHash: timingJob.jobAuthorityHash,
      timingJobDefinitionHash: timingQueueJob.definitionHash,
      timingPlacementHash: timingPlacement.placementHash,
      rootJobId: rootEntry.definition.jobId,
      rootQueueCompletionHash: rootEntry.completion.completionHash,
      rootCanonicalResultHash: rootCompletion.data.canonicalResultHash,
      rootValidationArtifactRef: rootCompletion.data.validationArtifactRef,
      rootQaEvidenceRef: rootCompletion.data.qaEvidenceRef,
      rootReconciliationEvidenceRef:
        rootCompletion.data.reconciliationEvidenceRef,
      rootTerminalEvidenceRef: rootCompletion.data.terminalEvidenceRef,
      rootAttemptInternalCostEvidenceHash:
        rootCompletion.data.attemptInternalCostEvidenceHash,
      rootCompletionEventHash: rootCompletionEvent.eventHash,
    },
    operation: {
      ...exactOperation,
      workerType: 'qa_worker' as const,
      resourceClassId: 'qa_cpu_standard_v1' as const,
      maximumAttempts: 1 as const,
      attemptTimeoutSeconds: 900 as const,
      leaseDurationMilliseconds: 60_000 as const,
      vcpuCount: 2 as const,
      memoryGib: 4 as const,
      gpuCount: 0 as const,
    },
    permissions: {
      ...timingExecutionPermissions,
      immutableRootCompletionRequired: true as const,
      exactApprovedTimingComponentsRequired: true as const,
      timingComplexityEstimateCoverageRequired: true as const,
      directDownstreamDependencyEvidence: true as const,
      furtherChildExecution: false as const,
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
    authorizedAt: rootEntry.completion.completedAt,
  }
  return professionalLongFormMasterTimingExecutionAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormMasterTimingExecutionAuthority(
  input: {
    value: unknown
    ownerUserId: string
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  },
): ProfessionalLongFormMasterTimingExecutionAuthority {
  const parsed = professionalLongFormMasterTimingExecutionAuthoritySchema.parse(
    input.value,
  )
  assertHashedRecord(parsed, 'authorityHash')
  const expected = buildProfessionalLongFormMasterTimingExecutionAuthority(input)
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error(
      'Professional long-form master-timing execution authority failed exact replay.',
    )
  }
  return expected
}

export function buildProfessionalLongFormMasterTimingAuthorizationReceipt(
  input: {
    authority: ProfessionalLongFormMasterTimingExecutionAuthority
    authorityRef: AuthorityJsonBlobRef
  },
): ProfessionalLongFormMasterTimingAuthorizationReceipt {
  const authority = professionalLongFormMasterTimingExecutionAuthoritySchema.parse(
    input.authority,
  )
  assertHashedRecord(authority, 'authorityHash')
  assertBlobRef(input.authorityRef, authority)
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_AUTHORIZATION_RECEIPT_VERSION,
    source:
      'server_persisted_professional_long_form_master_timing_execution_authority' as const,
    authorizationId: `long-form-timing-auth-${authority.authorityHash.slice(0, 40)}`,
    authorityRef: input.authorityRef,
    authorityHash: authority.authorityHash,
    queueDefinitionHash: authority.lineage.queueDefinitionHash,
    jobId: authority.identity.jobId,
    approvedWorkItemId: PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
    jobDefinitionHash: authority.lineage.timingJobDefinitionHash,
    placementHash: authority.lineage.timingPlacementHash,
    kind: PROFESSIONAL_LONG_FORM_MASTER_TIMING_KIND,
    expectedOutputIdentity: authority.identity.expectedOutputIdentity,
    operation: exactOperation,
    authorizedAt: authority.authorizedAt,
    reservationExpiresAt: authority.approval.reservationExpiresAt,
    permissions: timingExecutionPermissions,
    commercialBoundary,
  }
  return professionalLongFormMasterTimingAuthorizationReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function deriveProfessionalLongFormMasterTimingValidationSummary(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
): ProfessionalLongFormMasterTimingValidationSummary {
  const components = current.authority.components
  const snapshot = current.authority.snapshot
  const request = current.postApproval.bridge.binding.plan.request
  const masterTimingPlan = canonicalProfessionalLongFormMasterTimingPlanSchema.parse(
    components.masterTimingPlan,
  )
  const captionVisualCueTimingPlan =
    canonicalProfessionalLongFormCaptionVisualTimingPlanSchema.parse(
      components.captionVisualCueTimingPlan,
    )
  const soundSyncTransitionTimingPlan =
    canonicalProfessionalLongFormSoundSyncTimingPlanSchema.parse(
      components.soundSyncTransitionTimingPlan,
    )
  const timingValidationPlan =
    canonicalProfessionalLongFormTimingValidationPlanSchema.parse(
      components.timingValidationPlan,
    )
  const timingSummary = components.timingSummary
  const refs = snapshot.componentRefs
  const timingHash = sha256AuthorityValue({
    masterTimingPlan: refs.masterTimingPlan,
    captionVisualCueTimingPlan: refs.captionVisualCueTimingPlan,
    soundSyncTransitionTimingPlan: refs.soundSyncTransitionTimingPlan,
    timingValidationPlan: refs.timingValidationPlan,
    timingSummary: refs.timingSummary,
  })
  const segments = components.segments
  const segmentSetHash = sha256AuthorityValue(segments)
  const sourceCleanupPlanHash = sha256AuthorityValue(
    components.sourceCleanupPlan,
  )
  const hardCutCount = request.sourceRanges.filter((range) =>
    range.editorialBoundaryBefore === 'approved_hard_cut').length
  const estimateLine = current.authority.estimate.lineItems.find((line) =>
    line.lineKey === PROFESSIONAL_LONG_FORM_MASTER_TIMING_ESTIMATE_LINE_KEY)
  const timingEstimateCoverage = {
    lineKey: estimateLine?.lineKey,
    estimatedCredits: estimateLine?.estimatedCredits,
    metadataRef: estimateLine?.metadataRef,
  }
  const timingEstimateCoverageHash = sha256AuthorityValue(
    timingEstimateCoverage,
  )
  const expectedFps = request.confirmedOutputFrame.frameRate.numerator /
    request.confirmedOutputFrame.frameRate.denominator

  if (
    timingHash !== snapshot.timingHash ||
    request.identity.approvedTimingHash !== snapshot.timingHash ||
    refs.masterTimingPlan?.sha256 !== sha256AuthorityValue(masterTimingPlan) ||
    refs.captionVisualCueTimingPlan?.sha256 !==
      sha256AuthorityValue(captionVisualCueTimingPlan) ||
    refs.soundSyncTransitionTimingPlan?.sha256 !==
      sha256AuthorityValue(soundSyncTransitionTimingPlan) ||
    refs.timingValidationPlan?.sha256 !==
      sha256AuthorityValue(timingValidationPlan) ||
    refs.timingSummary?.sha256 !== sha256AuthorityValue(timingSummary) ||
    timingSummary.validationStatus !== 'passed' ||
    timingSummary.approvalBlocked ||
    timingSummary.fps !== expectedFps ||
    timingSummary.totalFrames !== request.totalFrames ||
    masterTimingPlan.timingBase.fps !== expectedFps ||
    masterTimingPlan.timingBase.frameRate.numerator !==
      request.confirmedOutputFrame.frameRate.numerator ||
    masterTimingPlan.timingBase.frameRate.denominator !==
      request.confirmedOutputFrame.frameRate.denominator ||
    masterTimingPlan.timingBase.totalFrames !== request.totalFrames ||
    masterTimingPlan.timingBase.endFrameExclusive !== request.totalFrames ||
    masterTimingPlan.timeline.segmentCount !== segments.length ||
    masterTimingPlan.timeline.segmentSetHash !== segmentSetHash ||
    masterTimingPlan.timeline.approvedHardCutCount !== hardCutCount ||
    masterTimingPlan.sourceCleanup.sourceCleanupPlanHash !==
      sourceCleanupPlanHash ||
    components.sourceCleanupPlan.status !== 'confirmed' ||
    components.sourceCleanupSummary.status !== 'confirmed' ||
    !components.confirmedSettings.outputFrameConfirmed ||
    !components.confirmedSettings.sourceCleanupConfirmed ||
    captionVisualCueTimingPlan.captionItemCount !== 0 ||
    captionVisualCueTimingPlan.visualCueCount !== 0 ||
    captionVisualCueTimingPlan.collisionCount !== 0 ||
    soundSyncTransitionTimingPlan.approvedHardCutCount !== hardCutCount ||
    timingValidationPlan.categories.some((entry, index) =>
      entry.category !== PROFESSIONAL_LONG_FORM_TIMING_VALIDATION_CATEGORIES[index]) ||
    new Set(timingValidationPlan.categories.map((entry) => entry.category)).size !==
      PROFESSIONAL_LONG_FORM_TIMING_VALIDATION_CATEGORIES.length ||
    !estimateLine ||
    estimateLine.estimatedCredits < 0 ||
    !/^[a-f0-9]{64}$/u.test(estimateLine.metadataRef.sha256) ||
    estimateLine.metadataRef.byteLength <= 0
  ) {
    throw new Error(
      'Professional long-form master-timing components lost frame, approval, estimate, or immutable hash authority.',
    )
  }

  let expectedStart = 0
  const segmentIds = new Set<string>()
  segments.forEach((segment, index) => {
    const range = request.sourceRanges[index]
    if (
      !range ||
      segmentIds.has(segment.segmentId) ||
      segment.segmentId !== range.segmentId ||
      segment.startFrame !== range.timelineStartFrame ||
      segment.endFrameExclusive !== range.timelineEndFrameExclusive ||
      segment.startFrame !== expectedStart ||
      segment.endFrameExclusive <= segment.startFrame ||
      segment.operationIds.length === 0
    ) {
      throw new Error(
        `Professional long-form timing segment ${index + 1} lost frame-exact source authority.`,
      )
    }
    segmentIds.add(segment.segmentId)
    expectedStart = segment.endFrameExclusive
  })
  if (
    segments.length !== request.sourceRanges.length ||
    expectedStart !== request.totalFrames
  ) {
    throw new Error(
      'Professional long-form timing segments do not provide gap-free, overlap-free full-duration coverage.',
    )
  }

  return {
    timingCoverage: {
      profileId: PROFESSIONAL_LONG_FORM_MASTER_TIMING_PROFILE_ID,
      fps: masterTimingPlan.timingBase.fps,
      frameRate: masterTimingPlan.timingBase.frameRate,
      totalFrames: masterTimingPlan.timingBase.totalFrames,
      segmentCount: segments.length,
      approvedHardCutCount: hardCutCount,
      validationCategoryCount:
        PROFESSIONAL_LONG_FORM_TIMING_VALIDATION_CATEGORIES.length,
      timingEstimateLineKey:
        PROFESSIONAL_LONG_FORM_MASTER_TIMING_ESTIMATE_LINE_KEY,
      timingEstimateCredits: estimateLine.estimatedCredits,
    },
    hashes: {
      timingComponentSetHash: sha256AuthorityValue({
        masterTimingPlan,
        captionVisualCueTimingPlan,
        soundSyncTransitionTimingPlan,
        timingValidationPlan,
        timingSummary,
      }),
      segmentTimelineHash: segmentSetHash,
      timingPriorityHash: sha256AuthorityValue(
        masterTimingPlan.priorityHierarchy,
      ),
      timingValidationCategoryHash: sha256AuthorityValue(
        timingValidationPlan.categories,
      ),
      timingEstimateCoverageHash,
    },
  }
}

export function buildProfessionalLongFormMasterTimingValidationArtifact(
  input: {
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
    authority: ProfessionalLongFormMasterTimingExecutionAuthority
    authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
    executionAttempt: ProfessionalLongFormMasterTimingExecutionAttempt
    validatedAt: string
  },
): ProfessionalLongFormMasterTimingValidationArtifact {
  assertExecutionLineage(input)
  const summary = deriveProfessionalLongFormMasterTimingValidationSummary(
    input.current,
  )
  if (
    input.authority.identity.expectedOutputIdentity !==
      input.current.authority.snapshot.timingHash ||
    input.authority.lineage.timingEstimateCoverageHash !==
      summary.hashes.timingEstimateCoverageHash ||
    input.authority.lineage.segmentSetHash !==
      summary.hashes.segmentTimelineHash
  ) {
    throw new Error(
      'Professional long-form timing validation summary lost expected-output authority.',
    )
  }
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_VALIDATION_ARTIFACT_VERSION,
    source:
      'canonical_professional_long_form_master_timing_validation_runner' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId: input.authority.identity.approvedPlanSnapshotId,
      jobId: input.authority.identity.jobId,
      approvedWorkItemId: PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    executionAuthorityId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    approvedTimingHash: input.authority.lineage.timingHash,
    timingCoverage: summary.timingCoverage,
    hashes: summary.hashes,
    validation: {
      exactApprovedComponentRefs: true as const,
      confirmedOutputFrameAndRationalRate: true as const,
      cleanupConfirmationAndMeaningPreservation: true as const,
      gapFreeOverlapFreeFullFrameCoverage: true as const,
      speechFirstPriorityHierarchy: true as const,
      captionVisualNoRandomCueBoundary: true as const,
      approvedHardCutSoundSyncBoundary: true as const,
      timingValidationApprovalGatePassed: true as const,
      timingComplexityIncludedInApprovedEstimate: true as const,
      approvedSnapshotOnlyWorkerPolicy: true as const,
      structuredMetadataOnly: true as const,
      mediaOrTranscriptAnalysisPerformed: false as const,
      renderOrProviderExecutionPerformed: false as const,
      customerCommercialAuthorityIncluded: false as const,
    },
    validatedAt: input.validatedAt,
  }
  return professionalLongFormMasterTimingValidationArtifactSchema.parse({
    ...payload,
    artifactHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormMasterTimingValidationArtifact(
  input: {
    value: unknown
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
    authority: ProfessionalLongFormMasterTimingExecutionAuthority
    authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
    executionAttempt: ProfessionalLongFormMasterTimingExecutionAttempt
  },
): ProfessionalLongFormMasterTimingValidationArtifact {
  const parsed = professionalLongFormMasterTimingValidationArtifactSchema.parse(
    input.value,
  )
  assertHashedRecord(parsed, 'artifactHash')
  const expected = buildProfessionalLongFormMasterTimingValidationArtifact({
    ...input,
    validatedAt: parsed.validatedAt,
  })
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error(
      'Professional long-form master-timing artifact failed exact replay.',
    )
  }
  return expected
}

export function buildProfessionalLongFormMasterTimingQaEvidence(input: {
  authority: ProfessionalLongFormMasterTimingExecutionAuthority
  authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
  executionAttempt: ProfessionalLongFormMasterTimingExecutionAttempt
  validationArtifact: ProfessionalLongFormMasterTimingValidationArtifact
  validationArtifactRef: AuthorityJsonBlobRef
  evaluatedAt: string
}): ProfessionalLongFormMasterTimingQaEvidence {
  assertExecutionLineage(input)
  assertBlobRef(input.validationArtifactRef, input.validationArtifact)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_MASTER_TIMING_QA_EVIDENCE_VERSION,
    source: 'canonical_professional_long_form_master_timing_qa' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId: input.authority.identity.approvedPlanSnapshotId,
      jobId: input.authority.identity.jobId,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    executionAuthorityId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    validationArtifactRef: input.validationArtifactRef,
    validationArtifactHash: input.validationArtifact.artifactHash,
    checks: {
      schemaChecksumAndComponentRefs: 'passed' as const,
      confirmedFrameAndExactRationalTimingBase: 'passed' as const,
      cleanupSegmentsAndFullFrameCoverage: 'passed' as const,
      speechCaptionVisualTransitionAudioPolicies: 'passed' as const,
      approvalGateAndEstimateCoverage: 'passed' as const,
      queueRootAttemptAndReservationBoundary: 'passed' as const,
      noMediaRenderProviderOrCommercialAuthority: 'passed' as const,
    },
    outcome: 'passed' as const,
    evaluatedAt: input.evaluatedAt,
  }
  return professionalLongFormMasterTimingQaEvidenceSchema.parse({
    ...payload,
    qaHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormMasterTimingQaEvidence(input: {
  value: unknown
  authority: ProfessionalLongFormMasterTimingExecutionAuthority
  authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
  executionAttempt: ProfessionalLongFormMasterTimingExecutionAttempt
  validationArtifact: ProfessionalLongFormMasterTimingValidationArtifact
  validationArtifactRef: AuthorityJsonBlobRef
}): ProfessionalLongFormMasterTimingQaEvidence {
  const parsed = professionalLongFormMasterTimingQaEvidenceSchema.parse(
    input.value,
  )
  assertHashedRecord(parsed, 'qaHash')
  const expected = buildProfessionalLongFormMasterTimingQaEvidence({
    ...input,
    evaluatedAt: parsed.evaluatedAt,
  })
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error(
      'Professional long-form master-timing QA evidence failed exact replay.',
    )
  }
  return expected
}

export function buildProfessionalLongFormMasterTimingReconciliationEvidence(
  input: {
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
    authority: ProfessionalLongFormMasterTimingExecutionAuthority
    authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
    executionAttempt: ProfessionalLongFormMasterTimingExecutionAttempt
    validationArtifactRef: AuthorityJsonBlobRef
    qaEvidence: ProfessionalLongFormMasterTimingQaEvidence
    qaEvidenceRef: AuthorityJsonBlobRef
    reconciledAt: string
    requireCurrentDownstreamBlockedState?: boolean
  },
): ProfessionalLongFormMasterTimingReconciliationEvidence {
  assertExecutionLineage(input)
  assertBlobRef(input.qaEvidenceRef, input.qaEvidence)
  const kindByWorkItemId = new Map(
    input.current.postApproval.childJobManifest.jobs.map((job) => [
      job.childWorkItemId,
      job.kind,
    ]),
  )
  const directDownstream = input.current.queueAggregate.entries
    .filter((entry) => entry.definition.dependencyJobIds.includes(
      input.authority.identity.jobId,
    ))
    .map((entry) => ({
      entry,
      kind: kindByWorkItemId.get(entry.definition.approvedWorkItemId),
    }))
    .filter((value): value is typeof value & {
      kind: 'render_object_mezzanine_chunk' |
        'mix_continuous_program_audio' |
        'finalize_private_4k_master'
    } => value.kind === 'render_object_mezzanine_chunk' ||
      value.kind === 'mix_continuous_program_audio' ||
      value.kind === 'finalize_private_4k_master')
    .map(({ entry, kind }) => {
      if (input.requireCurrentDownstreamBlockedState !== false && (
        entry.state !== 'queued' ||
        entry.deliveryAttemptCount !== 0 ||
        entry.professionalLongFormExecutionAuthorization ||
        entry.professionalLongFormExecutionAttempt ||
        entry.completion ||
        entry.definition.privateExecutionReady
      )) {
        throw new Error(
          'Professional long-form direct timing downstream already has execution authority.',
        )
      }
      return {
        jobId: entry.definition.jobId,
        approvedWorkItemId: entry.definition.approvedWorkItemId,
        kind,
        dependencyJobIds: [...entry.definition.dependencyJobIds],
        timingDependencyJobId: input.authority.identity.jobId,
        timingDependencySatisfiedByThisCompletion: true as const,
        executionAuthorized: false as const,
        capabilityBlocked: true as const,
      }
    })
  const renderJobCount = directDownstream.filter((entry) =>
    entry.kind === 'render_object_mezzanine_chunk').length
  const continuousAudioJobCount = directDownstream.filter((entry) =>
    entry.kind === 'mix_continuous_program_audio').length
  const finalizationJobCount = directDownstream.filter((entry) =>
    entry.kind === 'finalize_private_4k_master').length
  const expectedDirectDownstreamCount =
    input.current.postApproval.bridge.binding.plan.chunks.length + 2
  if (
    directDownstream.length !== expectedDirectDownstreamCount ||
    renderJobCount !== input.current.postApproval.bridge.binding.plan.chunks.length ||
    continuousAudioJobCount !== 1 ||
    finalizationJobCount !== 1
  ) {
    throw new Error(
      'Professional long-form timing reconciliation lost exact render, audio, or finalization dependencies.',
    )
  }
  const timingEntry = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.jobId === input.authority.identity.jobId)
  const completedAfterThisTiming =
    input.current.queueAggregate.summary.completedJobCount +
    (timingEntry?.state === 'completed' ? 0 : 1)
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_RECONCILIATION_EVIDENCE_VERSION,
    source:
      'canonical_professional_long_form_master_timing_dependency_reconciliation' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId: input.authority.identity.approvedPlanSnapshotId,
      completedJobId: input.authority.identity.jobId,
      completedWorkItemId: PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    executionAuthorityId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    validationArtifactRef: input.validationArtifactRef,
    qaEvidenceRef: input.qaEvidenceRef,
    qaOutcome: 'passed' as const,
    directDownstream,
    summary: {
      directDownstreamCount: directDownstream.length,
      renderJobCount,
      continuousAudioJobCount: 1 as const,
      finalizationJobCount: 1 as const,
      remainingQueueJobCountAfterCompletion:
        input.current.queueAggregate.summary.totalJobCount -
        completedAfterThisTiming,
      allDirectDownstreamExecutionBlocked: true as const,
      directDownstreamHash: sha256AuthorityValue(directDownstream),
    },
    decision:
      'timing_dependency_evidence_ready_downstream_operation_and_other_dependencies_blocked' as const,
    reconciledAt: input.reconciledAt,
  }
  return professionalLongFormMasterTimingReconciliationEvidenceSchema.parse({
    ...payload,
    reconciliationHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormMasterTimingReconciliationEvidence(
  input: {
    value: unknown
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
    authority: ProfessionalLongFormMasterTimingExecutionAuthority
    authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
    executionAttempt: ProfessionalLongFormMasterTimingExecutionAttempt
    validationArtifactRef: AuthorityJsonBlobRef
    qaEvidence: ProfessionalLongFormMasterTimingQaEvidence
    qaEvidenceRef: AuthorityJsonBlobRef
  },
): ProfessionalLongFormMasterTimingReconciliationEvidence {
  const parsed =
    professionalLongFormMasterTimingReconciliationEvidenceSchema.parse(
      input.value,
    )
  assertHashedRecord(parsed, 'reconciliationHash')
  const expected = buildProfessionalLongFormMasterTimingReconciliationEvidence({
    ...input,
    reconciledAt: parsed.reconciledAt,
    requireCurrentDownstreamBlockedState: false,
  })
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error(
      'Professional long-form master-timing reconciliation failed exact replay.',
    )
  }
  return expected
}

export function professionalLongFormMasterTimingCanonicalResultHash(input: {
  authority: ProfessionalLongFormMasterTimingExecutionAuthority
  executionAttempt: ProfessionalLongFormMasterTimingExecutionAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
}): string {
  return sha256AuthorityValue({
    domain: 'reeditpro:professional-long-form-master-timing-result:v1',
    authorityHash: input.authority.authorityHash,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    executionAttemptHash: input.executionAttempt.attemptHash,
    operation: exactOperation,
    validationArtifactRef: input.validationArtifactRef,
    qaEvidenceRef: input.qaEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
  })
}

export function buildProfessionalLongFormMasterTimingTerminalEvidence(input: {
  authority: ProfessionalLongFormMasterTimingExecutionAuthority
  authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
  executionAttempt: ProfessionalLongFormMasterTimingExecutionAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  completedAt: string
}): ProfessionalLongFormMasterTimingTerminalEvidence {
  assertExecutionLineage(input)
  const payload = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_TERMINAL_EVIDENCE_VERSION,
    source:
      'canonical_professional_long_form_master_timing_execution_service' as const,
    identity: {
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      approvedPlanSnapshotId: input.authority.identity.approvedPlanSnapshotId,
      jobId: input.authority.identity.jobId,
      approvedWorkItemId: PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
      executionAttemptId: input.executionAttempt.executionAttemptId,
    },
    executionAuthorityId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation: exactOperation,
    validationArtifactRef: input.validationArtifactRef,
    qaEvidenceRef: input.qaEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    outcome: 'completed_private_test' as const,
    permissions: {
      timingDependencyEvidenceCreated: true as const,
      downstreamExecutionAuthorized: false as const,
      mediaExecutionAuthorized: false as const,
      providerCallAuthorized: false as const,
      renderAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
    },
    commercialBoundary,
    completedAt: input.completedAt,
  }
  return professionalLongFormMasterTimingTerminalEvidenceSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

export function assertProfessionalLongFormMasterTimingTerminalEvidence(input: {
  value: unknown
  authority: ProfessionalLongFormMasterTimingExecutionAuthority
  authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
  executionAttempt: ProfessionalLongFormMasterTimingExecutionAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
}): ProfessionalLongFormMasterTimingTerminalEvidence {
  const parsed = professionalLongFormMasterTimingTerminalEvidenceSchema.parse(
    input.value,
  )
  assertHashedRecord(parsed, 'terminalHash')
  const expected = buildProfessionalLongFormMasterTimingTerminalEvidence({
    ...input,
    completedAt: parsed.completedAt,
  })
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error(
      'Professional long-form master-timing terminal evidence failed exact replay.',
    )
  }
  return expected
}

export function buildProfessionalLongFormMasterTimingCompletion(input: {
  authority: ProfessionalLongFormMasterTimingExecutionAuthority
  authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
  executionAttempt: ProfessionalLongFormMasterTimingExecutionAttempt
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  terminalEvidenceRef: AuthorityJsonBlobRef
}) {
  assertExecutionLineage(input)
  return professionalLongFormMasterTimingCompletionSchema.parse({
    schemaVersion: PROFESSIONAL_LONG_FORM_MASTER_TIMING_COMPLETION_VERSION,
    executionAttemptId: input.executionAttempt.executionAttemptId,
    authorizationId: input.authorization.authorizationId,
    authorityHash: input.authority.authorityHash,
    operation: exactOperation,
    canonicalResultHash: input.canonicalResultHash,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    validationArtifactRef: input.validationArtifactRef,
    qaEvidenceRef: input.qaEvidenceRef,
    reconciliationEvidenceRef: input.reconciliationEvidenceRef,
    terminalEvidenceRef: input.terminalEvidenceRef,
  })
}

function assertExecutionLineage(input: {
  authority: ProfessionalLongFormMasterTimingExecutionAuthority
  authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
  executionAttempt: ProfessionalLongFormMasterTimingExecutionAttempt
}): void {
  assertHashedRecord(input.authority, 'authorityHash')
  assertHashedRecord(input.authorization, 'receiptHash')
  assertHashedRecord(input.executionAttempt, 'attemptHash')
  if (
    input.authorization.authorityHash !== input.authority.authorityHash ||
    input.authorization.jobId !== input.authority.identity.jobId ||
    input.authorization.expectedOutputIdentity !==
      input.authority.identity.expectedOutputIdentity ||
    input.authorization.queueDefinitionHash !==
      input.authority.lineage.queueDefinitionHash ||
    input.executionAttempt.authorizationId !==
      input.authorization.authorizationId ||
    input.executionAttempt.authorityHash !== input.authority.authorityHash ||
    input.executionAttempt.jobId !== input.authority.identity.jobId ||
    stableAuthorityStringify(input.authorization.operation) !==
      stableAuthorityStringify(exactOperation) ||
    stableAuthorityStringify(input.executionAttempt.operation) !==
      stableAuthorityStringify(exactOperation)
  ) {
    throw new Error(
      'Professional long-form master-timing execution lineage is inconsistent.',
    )
  }
}

function assertBlobRef(ref: AuthorityJsonBlobRef, value: unknown): void {
  if (ref.sha256 !== sha256AuthorityValue(value) || ref.byteLength <= 0) {
    throw new Error(
      'Professional long-form master-timing content-addressed ref is invalid.',
    )
  }
}

function assertHashedRecord<T extends string>(
  value: Record<T, string> & Record<string, unknown>,
  hashKey: T,
): void {
  const payload = { ...value }
  const expected = payload[hashKey]
  delete payload[hashKey]
  if (expected !== sha256AuthorityValue(payload)) {
    throw new Error(
      `Professional long-form master-timing ${hashKey} is invalid.`,
    )
  }
}
