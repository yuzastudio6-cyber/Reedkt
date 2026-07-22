import { createHash } from 'node:crypto'

export const EDIT_REFERENCE_LONG_FORM_STUDY_POLICY_VERSION =
  'edit-reference-long-form-study-policy-v4' as const
export const EDIT_REFERENCE_LONG_FORM_STUDY_PLAN_VERSION =
  'edit-reference-long-form-study-plan-v5' as const
export const EDIT_REFERENCE_LONG_FORM_STUDY_RUN_VERSION =
  'edit-reference-long-form-study-run-v3' as const

export const EDIT_REFERENCE_LONG_FORM_STUDY_COMPLETION_ATTESTATION_VERSION =
  'edit-reference-long-form-study-completion-attestation-v2' as const

export const EDIT_REFERENCE_LONG_FORM_STUDY_STAGE_IDS = [
  'ingest_integrity',
  'media_probe',
  'analysis_proxy',
  'audio_extract',
  'speech_transcript',
  'scene_boundary_scan',
  'visual_sampling',
  'caption_ocr',
  'color_motion_signals',
  'semantic_chunk_synthesis',
  'global_reconciliation',
  'coverage_qa',
] as const

export type EditReferenceLongFormStudyStageId =
  typeof EDIT_REFERENCE_LONG_FORM_STUDY_STAGE_IDS[number]

export type EditReferenceLongFormDurationClass =
  | 'short'
  | 'standard'
  | 'long'
  | 'extended'

export type EditReferenceLongFormStudyRunState =
  | 'queued'
  | 'running'
  | 'paused'
  | 'needs_operator_review'
  | 'completed'
  | 'cancelled'

export const EDIT_REFERENCE_LONG_FORM_STUDY_CONTROL_ACTIONS = [
  'pause',
  'resume',
  'cancel',
  'recover',
] as const

export type EditReferenceLongFormStudyControlAction =
  typeof EDIT_REFERENCE_LONG_FORM_STUDY_CONTROL_ACTIONS[number]

export type EditReferenceLongFormStudyWorkStatus =
  | 'queued'
  | 'leased'
  | 'retry_wait'
  | 'completed'
  | 'blocked'
  | 'cancelled'

export type EditReferenceLongFormStudyRuntimeSource =
  | 'verified_local'
  | 'verified_live'
  | 'verified_mock'

export type EditReferenceLongFormStudyCompletionAuthority =
  | 'authoritative'
  | 'controlled_mock'

export interface EditReferenceLongFormStudySourceIdentity {
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly durationSeconds: number
  readonly sizeBytes: number
  readonly mimeType: string
  readonly hasAudio: boolean
}

export interface EditReferenceLongFormStudyNormalizationProfile {
  readonly profileId: 'reeditpro-analysis-proxy-v1'
  readonly originalRemainsImmutable: true
  readonly normalizationMode: 'verified_passthrough_or_transcode'
  readonly videoCodec: 'h264'
  readonly pixelFormat: 'yuv420p'
  readonly maxWidth: 1280
  readonly maxHeight: 1280
  readonly maxFrameRate: 30
  readonly constantRateFactor: 28
  readonly audioSeparatedForStudy: true
  readonly studyAudioSampleRate: 16000
  readonly studyAudioChannels: 1
}

export interface EditReferenceLongFormStudyChunkPlan {
  readonly chunkId: string
  readonly ordinal: number
  readonly coreStartSeconds: number
  readonly coreEndSeconds: number
  readonly decodeStartSeconds: number
  readonly decodeEndSeconds: number
  readonly overlapBeforeSeconds: number
  readonly overlapAfterSeconds: number
  readonly minimumVisualSampleCount: number
  readonly adaptiveSceneSamplingRequired: true
  readonly continuousAudioCoverageRequired: boolean
}

export interface EditReferenceLongFormStudyStagePlan {
  readonly stageId: EditReferenceLongFormStudyStageId
  readonly scope: 'source' | 'chunk' | 'final'
  readonly required: boolean
  readonly weightBasisPoints: number
  readonly requiresFullTemporalCoverage: boolean
  readonly maxAttemptsPerWorkItem: number
  readonly boundedWorkerCommand: true
}

export interface EditReferenceLongFormStudyPlan {
  readonly schemaVersion: typeof EDIT_REFERENCE_LONG_FORM_STUDY_PLAN_VERSION
  readonly policyVersion: typeof EDIT_REFERENCE_LONG_FORM_STUDY_POLICY_VERSION
  readonly planId: string
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly source: EditReferenceLongFormStudySourceIdentity
  readonly durationClass: EditReferenceLongFormDurationClass
  readonly ingestPolicy: {
    readonly validVideoRejectedOnlyForFileSize: false
    readonly uploadTransport: 'resumable_required' | 'resumable_recommended'
    readonly browserWholeFileBufferingAllowed: false
    readonly infrastructureCapacityCheckedSeparately: true
    readonly retryFromVerifiedOffsetRequired: true
  }
  readonly normalization: EditReferenceLongFormStudyNormalizationProfile
  readonly coreChunkDurationSeconds: number
  readonly chunkOverlapSeconds: number
  readonly chunks: readonly EditReferenceLongFormStudyChunkPlan[]
  readonly stages: readonly EditReferenceLongFormStudyStagePlan[]
  readonly completionStandard: {
    readonly requiredChunkStageCoverageRatio: 1
    readonly continuousAudioCoverageRatio: 1 | 0
    readonly requiredTemporalCoverageRatio: 1
    readonly reconciliationRequired: true
    readonly coverageQaRequired: true
    readonly partialSamplingCannotClaimFullyStudied: true
  }
  readonly progressPolicy: {
    readonly basedOnCompletedWorkOnly: true
    readonly providerProgressMayBeReportedSeparately: true
    readonly inventedPercentForbidden: true
    readonly etaRequiresObservedThroughputForHighConfidence: true
  }
  readonly studyTimeStandard: {
    readonly version: 'edit-reference-long-form-study-time-standard-v1'
    readonly standardSectionSeconds: 600
    readonly maximumTechnicalSectionSeconds: 900
    readonly maximumSemanticWindowSeconds: 120
    readonly planningLowerRealtimeFactor: 0.15 | 0.2
    readonly planningUpperRealtimeFactor: 1.25 | 1.5
    readonly planningStartupAllowanceSeconds: 120
    readonly wholeStudyMayRunForMinutesOrHours: true
    readonly browserSessionRequiredForCompletion: false
    readonly fixedWholeStudyWallClockTimeoutApplied: false
    readonly boundedWorkItemTimeoutAndHeartbeatRequired: true
  }
  readonly persistencePolicy: {
    readonly checkpointAfterEveryWorkItem: true
    readonly leaseHeartbeatRequired: true
    readonly restartResumeRequired: true
    readonly exactSourceAndPlanBindingRequired: true
  }
  readonly costPolicy: {
    readonly internalCostMeteringRequiredInProduction: true
    readonly maximumAuthorizedInternalCostRequiredInProduction: true
    readonly customerPriceCalculated: false
    readonly customerCreditsMutated: false
    readonly serviceFeeIncluded: false
  }
  readonly createdAt: string
  readonly planDigestSha256: string
}

export interface EditReferenceLongFormStudyWorkItem {
  readonly workItemId: string
  readonly stageId: EditReferenceLongFormStudyStageId
  readonly chunkId: string | null
  readonly dependencyWorkItemIds: readonly string[]
  readonly required: boolean
  readonly weightBasisPoints: number
  readonly sourceCoverageStartSeconds: number
  readonly sourceCoverageEndSeconds: number
  status: EditReferenceLongFormStudyWorkStatus
  attemptCount: number
  readonly maxAttempts: number
  additionalAttemptsAuthorized?: number
  leaseGeneration: number
  leaseOwnerIdDigestSha256?: string
  leaseTokenHashSha256?: string
  leasedAt?: string
  leaseExpiresAt?: string
  lastHeartbeatAt?: string
  nextAttemptAt?: string
  startedAt?: string
  completedAt?: string
  observedWallClockMs?: number
  outputDigestSha256?: string
  outputRuntimeSource?: EditReferenceLongFormStudyRuntimeSource
  outputCompletionAuthority?: EditReferenceLongFormStudyCompletionAuthority
  blockerCode?: string
  blockerMessage?: string
}

export interface EditReferenceLongFormStudyCompletionAttestation {
  readonly schemaVersion: typeof EDIT_REFERENCE_LONG_FORM_STUDY_COMPLETION_ATTESTATION_VERSION
  readonly coverageQaWorkItemId: string
  readonly coverageQaOutputDigestSha256: string
  readonly requiredOutputManifestDigestSha256: string
  readonly requiredWorkItemCount: number
  readonly verifiedOutputRecordCount: number
  readonly temporalCoverageRatio: 1
  readonly chunkStageCoverageRatio: 1
  readonly continuousAudioCoverageRatio: 0 | 1
  readonly everyRequiredOutputVerified: true
  readonly everySemanticRuntimeAuthoritative: true
  readonly everyRequiredOutputCostAuthoritySatisfied: true
  readonly coverageQaPassed: true
  readonly finalizedAt: string
}

export interface EditReferenceLongFormStudyRunRecord {
  readonly schemaVersion: typeof EDIT_REFERENCE_LONG_FORM_STUDY_RUN_VERSION
  readonly runId: string
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly planId: string
  readonly planDigestSha256: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  revision: number
  state: EditReferenceLongFormStudyRunState
  readonly workItems: EditReferenceLongFormStudyWorkItem[]
  operatorReviewRequired: boolean
  cancelReason?: 'owner_cancelled' | 'security_hold' | 'source_replaced'
  pausedAt?: string
  cancelledAt?: string
  completedAt?: string
  completionAttestation?: EditReferenceLongFormStudyCompletionAttestation
  operatorRecoveryCount?: number
  lastControlAction?: EditReferenceLongFormStudyControlAction
  lastControlCommandIdDigestSha256?: string
  lastControlRequestDigestSha256?: string
  lastControlAffectedWorkItemCount?: number
  lastControlActiveWorkFinishesBeforePause?: boolean
  lastControlAt?: string
  readonly createdAt: string
  updatedAt: string
  recordDigestSha256: string
  readonly privateInternalOnly: true
  readonly distributedRuntimeDeployed: false
  readonly providerExecutionAllowed: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
}

export interface ApplyEditReferenceLongFormStudyControlInput {
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly plan: EditReferenceLongFormStudyPlan
  readonly action: EditReferenceLongFormStudyControlAction
  readonly commandIdDigestSha256: string
  readonly requestDigestSha256: string
  readonly now: string
}

export interface EditReferenceLongFormStudyControlResult {
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly disposition: 'applied'
  readonly activeWorkFinishesBeforePause: boolean
  readonly recoveredWorkItemCount: number
  readonly completedCheckpointsPreserved: true
}

export interface EditReferenceLongFormStudyProgress {
  readonly runId: string
  readonly state: EditReferenceLongFormStudyRunState
  readonly completedWeightBasisPoints: number
  readonly totalWeightBasisPoints: number
  readonly progressPercent: number
  readonly completedWorkItemCount: number
  readonly totalWorkItemCount: number
  readonly runningWorkItemCount: number
  readonly retryWaitWorkItemCount: number
  readonly blockedWorkItemCount: number
  readonly temporalCoverageRatio: number
  readonly fullyStudied: boolean
  readonly eta: {
    readonly lowerRemainingSeconds: number
    readonly upperRemainingSeconds: number
    readonly confidence: 'planning' | 'observed_low' | 'observed_medium'
    readonly basedOnCompletedWorkOnly: true
  }
  readonly phaseLabel: string
}

export interface EditReferenceLongFormStudyClaimResult {
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly disposition:
    | 'authorized'
    | 'authorized_replay'
    | 'not_ready'
    | 'operator_review_required'
    | 'completed'
    | 'paused'
    | 'cancelled'
  readonly workItem: EditReferenceLongFormStudyWorkItem | null
  readonly leaseToken: string | null
}

export interface CreateEditReferenceLongFormStudyPlanInput {
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly source: EditReferenceLongFormStudySourceIdentity
  readonly includeCaptionOcr: boolean
  readonly createdAt: string
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const VIDEO_MIME_PATTERN = /^video\/[a-z0-9.+-]+$/
const SHORT_MAX_SECONDS = 15 * 60
const STANDARD_MAX_SECONDS = 60 * 60
const LONG_MAX_SECONDS = 3 * 60 * 60
const CHUNK_OVERLAP_SECONDS = 3
const SHORT_CHUNK_SECONDS = 15 * 60
const LONG_FORM_CHUNK_SECONDS = 10 * 60
const EXTENDED_CHUNK_SECONDS = 10 * 60
const MIN_LEASE_MS = 5_000
const MAX_LEASE_MS = 15 * 60 * 1_000
const MAX_RETRY_DELAY_MS = 24 * 60 * 60 * 1_000

const STAGE_BLUEPRINTS: readonly Omit<EditReferenceLongFormStudyStagePlan, 'required'>[] = [
  stage('ingest_integrity', 'source', 500, false, 3),
  stage('media_probe', 'source', 500, false, 3),
  stage('analysis_proxy', 'chunk', 1_200, true, 4),
  stage('audio_extract', 'chunk', 600, true, 4),
  stage('speech_transcript', 'chunk', 1_400, true, 4),
  stage('scene_boundary_scan', 'chunk', 900, true, 4),
  stage('visual_sampling', 'chunk', 1_100, true, 4),
  stage('caption_ocr', 'chunk', 700, true, 4),
  stage('color_motion_signals', 'chunk', 700, true, 4),
  stage('semantic_chunk_synthesis', 'chunk', 1_300, true, 4),
  stage('global_reconciliation', 'final', 700, false, 3),
  stage('coverage_qa', 'final', 400, false, 3),
]

export function createEditReferenceLongFormStudyPlan(
  input: CreateEditReferenceLongFormStudyPlanInput,
): EditReferenceLongFormStudyPlan {
  validatePlanInput(input)
  const durationClass = classifyDuration(input.source.durationSeconds)
  const coreChunkDurationSeconds = durationClass === 'short'
    ? SHORT_CHUNK_SECONDS
    : durationClass === 'extended'
      ? EXTENDED_CHUNK_SECONDS
      : LONG_FORM_CHUNK_SECONDS
  const planId = stableId('edit-reference-study-plan', {
    workspaceId: input.workspaceId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    privateMediaArtifactId: input.source.privateMediaArtifactId,
    mediaChecksumSha256: input.source.mediaChecksumSha256,
    policyVersion: EDIT_REFERENCE_LONG_FORM_STUDY_POLICY_VERSION,
  })
  const chunks = buildChunkPlan(input.source.durationSeconds, coreChunkDurationSeconds, input.source.hasAudio)
  const stages = STAGE_BLUEPRINTS.map((blueprint): EditReferenceLongFormStudyStagePlan => ({
    ...blueprint,
    required: stageRequired(blueprint.stageId, input.source.hasAudio, input.includeCaptionOcr),
  }))
  const unsigned: Omit<EditReferenceLongFormStudyPlan, 'planDigestSha256'> = {
    schemaVersion: EDIT_REFERENCE_LONG_FORM_STUDY_PLAN_VERSION,
    policyVersion: EDIT_REFERENCE_LONG_FORM_STUDY_POLICY_VERSION,
    planId,
    workspaceId: input.workspaceId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    source: { ...input.source },
    durationClass,
    ingestPolicy: {
      validVideoRejectedOnlyForFileSize: false,
      uploadTransport: input.source.sizeBytes >= 64 * 1024 * 1024
        ? 'resumable_required'
        : 'resumable_recommended',
      browserWholeFileBufferingAllowed: false,
      infrastructureCapacityCheckedSeparately: true,
      retryFromVerifiedOffsetRequired: true,
    },
    normalization: {
      profileId: 'reeditpro-analysis-proxy-v1',
      originalRemainsImmutable: true,
      normalizationMode: 'verified_passthrough_or_transcode',
      videoCodec: 'h264',
      pixelFormat: 'yuv420p',
      maxWidth: 1280,
      maxHeight: 1280,
      maxFrameRate: 30,
      constantRateFactor: 28,
      audioSeparatedForStudy: true,
      studyAudioSampleRate: 16000,
      studyAudioChannels: 1,
    },
    coreChunkDurationSeconds,
    chunkOverlapSeconds: CHUNK_OVERLAP_SECONDS,
    chunks,
    stages,
    completionStandard: {
      requiredChunkStageCoverageRatio: 1,
      continuousAudioCoverageRatio: input.source.hasAudio ? 1 : 0,
      requiredTemporalCoverageRatio: 1,
      reconciliationRequired: true,
      coverageQaRequired: true,
      partialSamplingCannotClaimFullyStudied: true,
    },
    progressPolicy: {
      basedOnCompletedWorkOnly: true,
      providerProgressMayBeReportedSeparately: true,
      inventedPercentForbidden: true,
      etaRequiresObservedThroughputForHighConfidence: true,
    },
    studyTimeStandard: {
      version: 'edit-reference-long-form-study-time-standard-v1',
      standardSectionSeconds: 600,
      maximumTechnicalSectionSeconds: 900,
      maximumSemanticWindowSeconds: 120,
      planningLowerRealtimeFactor: durationClass === 'short' ? 0.2 : 0.15,
      planningUpperRealtimeFactor: durationClass === 'extended' ? 1.5 : 1.25,
      planningStartupAllowanceSeconds: 120,
      wholeStudyMayRunForMinutesOrHours: true,
      browserSessionRequiredForCompletion: false,
      fixedWholeStudyWallClockTimeoutApplied: false,
      boundedWorkItemTimeoutAndHeartbeatRequired: true,
    },
    persistencePolicy: {
      checkpointAfterEveryWorkItem: true,
      leaseHeartbeatRequired: true,
      restartResumeRequired: true,
      exactSourceAndPlanBindingRequired: true,
    },
    costPolicy: {
      internalCostMeteringRequiredInProduction: true,
      maximumAuthorizedInternalCostRequiredInProduction: true,
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      serviceFeeIncluded: false,
    },
    createdAt: input.createdAt,
  }
  const plan = { ...unsigned, planDigestSha256: sha256(stableStringify(unsigned)) }
  validateEditReferenceLongFormStudyPlan(plan)
  return plan
}

export function createEditReferenceLongFormStudyRun(input: {
  readonly runId: string
  readonly plan: EditReferenceLongFormStudyPlan
  readonly createdAt: string
}): EditReferenceLongFormStudyRunRecord {
  validateEditReferenceLongFormStudyPlan(input.plan)
  assertId(input.runId, 'study run id')
  assertIso(input.createdAt, 'study run createdAt')
  const workItems = createWorkItems(input.plan)
  return sealRun({
    schemaVersion: EDIT_REFERENCE_LONG_FORM_STUDY_RUN_VERSION,
    runId: input.runId,
    workspaceId: input.plan.workspaceId,
    editReferenceId: input.plan.editReferenceId,
    studySessionId: input.plan.studySessionId,
    planId: input.plan.planId,
    planDigestSha256: input.plan.planDigestSha256,
    privateMediaArtifactId: input.plan.source.privateMediaArtifactId,
    mediaChecksumSha256: input.plan.source.mediaChecksumSha256,
    revision: 1,
    state: 'queued',
    workItems,
    operatorReviewRequired: false,
    operatorRecoveryCount: 0,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    recordDigestSha256: '',
    privateInternalOnly: true,
    distributedRuntimeDeployed: false,
    providerExecutionAllowed: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  })
}

export function claimEditReferenceLongFormStudyWork(input: {
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly plan: EditReferenceLongFormStudyPlan
  readonly workerId: string
  readonly idempotencyKey: string
  readonly leaseDurationMs: number
  readonly now: string
  readonly eligibleStageIds?: readonly EditReferenceLongFormStudyStageId[]
}): EditReferenceLongFormStudyClaimResult {
  validateRunAgainstPlan(input.run, input.plan)
  assertId(input.workerId, 'study worker id')
  assertSafeToken(input.idempotencyKey, 'study claim idempotency key')
  assertLeaseDuration(input.leaseDurationMs)
  assertIso(input.now, 'study claim time')
  const eligibleStageIds = input.eligibleStageIds === undefined
    ? null
    : new Set(input.eligibleStageIds)
  if (eligibleStageIds && (
    eligibleStageIds.size < 1
    || [...eligibleStageIds].some((stageId) => !EDIT_REFERENCE_LONG_FORM_STUDY_STAGE_IDS.includes(stageId))
  )) throw new Error('Study claim eligible stage policy is invalid.')
  if (input.run.state === 'completed') return noClaim(input.run, 'completed')
  if (input.run.state === 'paused') return noClaim(input.run, 'paused')
  if (input.run.state === 'cancelled') return noClaim(input.run, 'cancelled')
  if (input.run.operatorReviewRequired) return noClaim(input.run, 'operator_review_required')

  const leaseToken = deriveLeaseToken(input.run.runId, input.idempotencyKey)
  const leaseTokenHash = sha256(leaseToken)
  const ownerDigest = sha256(input.workerId)
  const replay = input.run.workItems.find((item) => (
    item.status === 'leased'
    && (!eligibleStageIds || eligibleStageIds.has(item.stageId))
    && item.leaseTokenHashSha256 === leaseTokenHash
    && item.leaseOwnerIdDigestSha256 === ownerDigest
    && Date.parse(item.leaseExpiresAt ?? '') > Date.parse(input.now)
  ))
  if (replay) {
    return {
      run: structuredClone(input.run),
      disposition: 'authorized_replay',
      workItem: structuredClone(replay),
      leaseToken,
    }
  }

  const run = structuredClone(input.run)
  expireLeases(run, input.now)
  const completedIds = new Set(run.workItems
    .filter((item) => item.status === 'completed')
    .map((item) => item.workItemId))
  const item = run.workItems.find((candidate) => (
    (candidate.status === 'queued'
      || (candidate.status === 'retry_wait' && Date.parse(candidate.nextAttemptAt ?? '') <= Date.parse(input.now)))
    && (!eligibleStageIds || eligibleStageIds.has(candidate.stageId))
    && candidate.dependencyWorkItemIds.every((dependencyId) => completedIds.has(dependencyId))
  ))
  if (!item) {
    const settled = sealRun({ ...run, revision: run.revision + 1, updatedAt: input.now })
    return noClaim(settled, settled.operatorReviewRequired ? 'operator_review_required' : 'not_ready')
  }

  item.status = 'leased'
  item.attemptCount += 1
  item.leaseGeneration += 1
  item.leaseOwnerIdDigestSha256 = ownerDigest
  item.leaseTokenHashSha256 = leaseTokenHash
  item.leasedAt = input.now
  item.leaseExpiresAt = new Date(Date.parse(input.now) + input.leaseDurationMs).toISOString()
  item.startedAt = input.now
  delete item.nextAttemptAt
  delete item.blockerCode
  delete item.blockerMessage
  run.state = 'running'
  const sealed = sealRun({ ...run, revision: run.revision + 1, updatedAt: input.now })
  return {
    run: sealed,
    disposition: 'authorized',
    workItem: structuredClone(sealed.workItems.find((record) => record.workItemId === item.workItemId) as EditReferenceLongFormStudyWorkItem),
    leaseToken,
  }
}

export function heartbeatEditReferenceLongFormStudyWork(input: {
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly plan: EditReferenceLongFormStudyPlan
  readonly workItemId: string
  readonly workerId: string
  readonly leaseToken: string
  readonly extendLeaseDurationMs: number
  readonly now: string
}): EditReferenceLongFormStudyRunRecord {
  validateRunAgainstPlan(input.run, input.plan)
  assertLeaseDuration(input.extendLeaseDurationMs)
  assertIso(input.now, 'study heartbeat time')
  const run = structuredClone(input.run)
  const item = requireActiveLease(run, input.workItemId, input.workerId, input.leaseToken, input.now)
  item.lastHeartbeatAt = input.now
  item.leaseExpiresAt = new Date(Date.parse(input.now) + input.extendLeaseDurationMs).toISOString()
  return sealRun({ ...run, revision: run.revision + 1, updatedAt: input.now })
}

export function completeEditReferenceLongFormStudyWork(input: {
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly plan: EditReferenceLongFormStudyPlan
  readonly workItemId: string
  readonly workerId: string
  readonly leaseToken: string
  readonly outputDigestSha256: string
  readonly outputRuntimeSource: EditReferenceLongFormStudyRuntimeSource
  readonly outputCompletionAuthority: EditReferenceLongFormStudyCompletionAuthority
  readonly observedWallClockMs: number
  readonly now: string
}): EditReferenceLongFormStudyRunRecord {
  validateRunAgainstPlan(input.run, input.plan)
  assertSha256(input.outputDigestSha256, 'study output digest')
  if (!Number.isSafeInteger(input.observedWallClockMs) || input.observedWallClockMs < 1) {
    throw new Error('Study work wall-clock measurement is invalid.')
  }
  assertIso(input.now, 'study completion time')
  const run = structuredClone(input.run)
  const item = requireActiveLease(run, input.workItemId, input.workerId, input.leaseToken, input.now)
  clearLease(item)
  item.status = 'completed'
  item.completedAt = input.now
  item.observedWallClockMs = input.observedWallClockMs
  item.outputDigestSha256 = input.outputDigestSha256
  item.outputRuntimeSource = input.outputRuntimeSource
  item.outputCompletionAuthority = input.outputCompletionAuthority
  delete item.blockerCode
  delete item.blockerMessage
  // Completion is a separate, output-backed gate. A completed digest alone is
  // not enough to claim that an hours-long source was fully studied.
  if (run.state !== 'paused') {
    run.state = 'running'
    run.operatorReviewRequired = false
  }
  return sealRun({ ...run, revision: run.revision + 1, updatedAt: input.now })
}

export function finalizeEditReferenceLongFormStudyRun(input: {
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly plan: EditReferenceLongFormStudyPlan
  readonly attestation: EditReferenceLongFormStudyCompletionAttestation
}): EditReferenceLongFormStudyRunRecord {
  validateRunAgainstPlan(input.run, input.plan)
  validateCompletionAttestation(input.attestation, input.plan)
  if (input.run.state === 'completed') {
    if (stableStringify(input.run.completionAttestation) !== stableStringify(input.attestation)) {
      throw new Error('Completed long-form study has a different completion attestation.')
    }
    return structuredClone(input.run)
  }
  if (['cancelled', 'paused', 'needs_operator_review'].includes(input.run.state)) {
    throw new Error('Long-form study cannot be finalized from its current state.')
  }
  const requiredItems = input.run.workItems.filter((item) => item.required)
  if (requiredItems.some((item) => item.status !== 'completed')) {
    throw new Error('Long-form study cannot be finalized before every required work item completes.')
  }
  const coverageQa = requiredItems.find((item) => item.stageId === 'coverage_qa')
  if (
    !coverageQa
    || coverageQa.workItemId !== input.attestation.coverageQaWorkItemId
    || coverageQa.outputDigestSha256 !== input.attestation.coverageQaOutputDigestSha256
    || coverageQa.outputCompletionAuthority !== 'authoritative'
    || requiredItems.some((item) => item.outputCompletionAuthority !== 'authoritative')
    || input.attestation.requiredWorkItemCount !== requiredItems.length
    || input.attestation.verifiedOutputRecordCount !== requiredItems.filter((item) => (
      !['ingest_integrity', 'media_probe'].includes(item.stageId)
    )).length
  ) throw new Error('Long-form completion attestation does not match authoritative completed work.')
  const run = structuredClone(input.run)
  run.state = 'completed'
  run.completedAt = input.attestation.finalizedAt
  run.completionAttestation = structuredClone(input.attestation)
  run.operatorReviewRequired = false
  return sealRun({ ...run, revision: run.revision + 1, updatedAt: input.attestation.finalizedAt })
}

export function failEditReferenceLongFormStudyWork(input: {
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly plan: EditReferenceLongFormStudyPlan
  readonly workItemId: string
  readonly workerId: string
  readonly leaseToken: string
  readonly blockerCode: string
  readonly blockerMessage: string
  readonly retryDelayMs: number
  readonly now: string
}): EditReferenceLongFormStudyRunRecord {
  validateRunAgainstPlan(input.run, input.plan)
  assertSafeCode(input.blockerCode, 'study blocker code')
  assertSafeText(input.blockerMessage, 500, 'study blocker message')
  if (!Number.isSafeInteger(input.retryDelayMs) || input.retryDelayMs < 0 || input.retryDelayMs > MAX_RETRY_DELAY_MS) {
    throw new Error('Study retry delay is invalid.')
  }
  assertIso(input.now, 'study failure time')
  const run = structuredClone(input.run)
  const pauseRemainsRequested = run.state === 'paused'
  const item = requireActiveLease(run, input.workItemId, input.workerId, input.leaseToken, input.now)
  clearLease(item)
  item.blockerCode = input.blockerCode
  item.blockerMessage = input.blockerMessage
  if (item.attemptCount < maximumAuthorizedAttempts(item)) {
    item.status = 'retry_wait'
    item.nextAttemptAt = new Date(Date.parse(input.now) + input.retryDelayMs).toISOString()
    if (!pauseRemainsRequested) run.state = 'running'
  } else {
    item.status = 'blocked'
    delete item.nextAttemptAt
    run.state = 'needs_operator_review'
    run.operatorReviewRequired = true
  }
  return sealRun({ ...run, revision: run.revision + 1, updatedAt: input.now })
}

export function applyEditReferenceLongFormStudyControl(
  input: ApplyEditReferenceLongFormStudyControlInput,
): EditReferenceLongFormStudyControlResult {
  validateRunAgainstPlan(input.run, input.plan)
  if (!EDIT_REFERENCE_LONG_FORM_STUDY_CONTROL_ACTIONS.includes(input.action)) {
    throw new Error('Long-form study control action is invalid.')
  }
  assertSha256(input.commandIdDigestSha256, 'study control command id digest')
  assertSha256(input.requestDigestSha256, 'study control request digest')
  assertIso(input.now, 'study control time')
  if (input.run.state === 'completed') {
    throw new Error('A completed long-form study cannot be controlled.')
  }
  if (input.run.state === 'cancelled') {
    throw new Error('A cancelled long-form study cannot be controlled.')
  }

  const run = structuredClone(input.run)
  const completedCheckpointCount = run.workItems.filter((item) => item.status === 'completed').length
  let activeWorkFinishesBeforePause = false
  let recoveredWorkItemCount = 0

  if (input.action === 'pause') {
    if (!['queued', 'running'].includes(run.state)) {
      throw new Error('Only a queued or running long-form study can be paused.')
    }
    activeWorkFinishesBeforePause = run.workItems.some((item) => item.status === 'leased')
    run.state = 'paused'
    run.pausedAt = input.now
    run.operatorReviewRequired = false
  } else if (input.action === 'resume') {
    if (run.state !== 'paused') {
      throw new Error('Only a paused long-form study can be resumed.')
    }
    run.state = 'running'
    delete run.pausedAt
    run.operatorReviewRequired = false
  } else if (input.action === 'recover') {
    if (run.state !== 'needs_operator_review' || !run.operatorReviewRequired) {
      throw new Error('Only a long-form study awaiting recovery review can be recovered.')
    }
    for (const item of run.workItems) {
      if (item.status !== 'blocked') continue
      item.additionalAttemptsAuthorized = (item.additionalAttemptsAuthorized ?? 0) + 1
      item.status = 'queued'
      delete item.nextAttemptAt
      delete item.blockerCode
      delete item.blockerMessage
      recoveredWorkItemCount += 1
    }
    if (recoveredWorkItemCount < 1) {
      throw new Error('Long-form study recovery found no blocked work to authorize.')
    }
    run.state = 'running'
    run.operatorReviewRequired = false
    run.operatorRecoveryCount = (run.operatorRecoveryCount ?? 0) + 1
  } else {
    for (const item of run.workItems) {
      if (item.status === 'completed') continue
      clearLease(item)
      item.status = 'cancelled'
      delete item.nextAttemptAt
      delete item.blockerCode
      delete item.blockerMessage
    }
    run.state = 'cancelled'
    run.operatorReviewRequired = false
    run.cancelReason = 'owner_cancelled'
    run.cancelledAt = input.now
    delete run.pausedAt
  }

  if (run.workItems.filter((item) => item.status === 'completed').length !== completedCheckpointCount) {
    throw new Error('Long-form study control cannot alter completed checkpoints.')
  }
  run.lastControlAction = input.action
  run.lastControlCommandIdDigestSha256 = input.commandIdDigestSha256
  run.lastControlRequestDigestSha256 = input.requestDigestSha256
  run.lastControlAffectedWorkItemCount = input.action === 'recover' ? recoveredWorkItemCount : 0
  run.lastControlActiveWorkFinishesBeforePause = activeWorkFinishesBeforePause
  run.lastControlAt = input.now
  return {
    run: sealRun({ ...run, revision: run.revision + 1, updatedAt: input.now }),
    disposition: 'applied',
    activeWorkFinishesBeforePause,
    recoveredWorkItemCount,
    completedCheckpointsPreserved: true,
  }
}

export function cancelEditReferenceLongFormStudyRun(input: {
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly plan: EditReferenceLongFormStudyPlan
  readonly reason: NonNullable<EditReferenceLongFormStudyRunRecord['cancelReason']>
  readonly now: string
}): EditReferenceLongFormStudyRunRecord {
  validateRunAgainstPlan(input.run, input.plan)
  assertIso(input.now, 'study cancellation time')
  if (!['owner_cancelled', 'security_hold', 'source_replaced'].includes(input.reason)) {
    throw new Error('Study cancellation reason is invalid.')
  }
  if (input.run.state === 'completed') throw new Error('A completed long-form study cannot be cancelled.')
  if (input.run.state === 'cancelled') return structuredClone(input.run)
  const run = structuredClone(input.run)
  for (const item of run.workItems) {
    if (item.status === 'completed') continue
    clearLease(item)
    item.status = 'cancelled'
    delete item.nextAttemptAt
    delete item.blockerCode
    delete item.blockerMessage
  }
  run.state = 'cancelled'
  run.operatorReviewRequired = false
  run.cancelReason = input.reason
  run.cancelledAt = input.now
  delete run.pausedAt
  return sealRun({ ...run, revision: run.revision + 1, updatedAt: input.now })
}

export function deriveEditReferenceLongFormStudyProgress(input: {
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly plan: EditReferenceLongFormStudyPlan
}): EditReferenceLongFormStudyProgress {
  validateRunAgainstPlan(input.run, input.plan)
  const requiredItems = input.run.workItems.filter((item) => item.required)
  const completedItems = requiredItems.filter((item) => item.status === 'completed')
  const totalWeight = requiredItems.reduce((sum, item) => sum + item.weightBasisPoints, 0)
  const completedWeight = completedItems.reduce((sum, item) => sum + item.weightBasisPoints, 0)
  const progressPercent = totalWeight === 0 ? 0 : Number(((completedWeight / totalWeight) * 100).toFixed(2))
  const temporalStageIds = new Set(input.plan.stages
    .filter((stagePlan) => stagePlan.required && stagePlan.requiresFullTemporalCoverage)
    .map((stagePlan) => stagePlan.stageId))
  const temporalItems = requiredItems.filter((item) => temporalStageIds.has(item.stageId))
  const temporalSeconds = temporalItems.reduce((sum, item) => (
    sum + (item.status === 'completed' ? item.sourceCoverageEndSeconds - item.sourceCoverageStartSeconds : 0)
  ), 0)
  const requiredTemporalSeconds = temporalItems.reduce((sum, item) => (
    sum + item.sourceCoverageEndSeconds - item.sourceCoverageStartSeconds
  ), 0)
  const temporalCoverageRatio = requiredTemporalSeconds === 0
    ? 1
    : Number((temporalSeconds / requiredTemporalSeconds).toFixed(6))
  const requiredChunkStageIds = new Set(input.plan.stages
    .filter((stagePlan) => stagePlan.required && stagePlan.scope === 'chunk')
    .map((stagePlan) => stagePlan.stageId))
  const observed = completedItems.filter((item) => (
    requiredChunkStageIds.has(item.stageId)
    && typeof item.observedWallClockMs === 'number'
  ))
  const observedWeight = observed.reduce((sum, item) => sum + item.weightBasisPoints, 0)
  const observedMs = observed.reduce((sum, item) => sum + (item.observedWallClockMs ?? 0), 0)
  const remainingWeight = Math.max(0, totalWeight - completedWeight)
  const planningSeconds = planningRemainingSeconds(input.plan, progressPercent)
  const observedRemainingSeconds = observedWeight > 0
    ? Math.ceil((observedMs / observedWeight) * remainingWeight / 1_000)
    : null
  const observedStageIds = new Set(observed.map((item) => item.stageId))
  const everyRequiredChunkStageObserved = [...requiredChunkStageIds]
    .every((stageId) => observedStageIds.has(stageId))
  const eta = observedRemainingSeconds === null
    ? {
      lowerRemainingSeconds: planningSeconds.lower,
      upperRemainingSeconds: planningSeconds.upper,
      confidence: 'planning' as const,
      basedOnCompletedWorkOnly: true as const,
    }
    : {
      lowerRemainingSeconds: everyRequiredChunkStageObserved
        ? Math.max(0, Math.floor(observedRemainingSeconds * 0.65))
        : planningSeconds.lower,
      upperRemainingSeconds: everyRequiredChunkStageObserved
        ? Math.ceil(observedRemainingSeconds * 1.75)
        : Math.max(planningSeconds.upper, Math.ceil(observedRemainingSeconds * 1.75)),
      confidence: everyRequiredChunkStageObserved && observed.length >= Math.min(6, requiredItems.length)
        ? 'observed_medium' as const
        : 'observed_low' as const,
      basedOnCompletedWorkOnly: true as const,
    }
  return {
    runId: input.run.runId,
    state: input.run.state,
    completedWeightBasisPoints: completedWeight,
    totalWeightBasisPoints: totalWeight,
    progressPercent,
    completedWorkItemCount: completedItems.length,
    totalWorkItemCount: requiredItems.length,
    runningWorkItemCount: requiredItems.filter((item) => item.status === 'leased').length,
    retryWaitWorkItemCount: requiredItems.filter((item) => item.status === 'retry_wait').length,
    blockedWorkItemCount: requiredItems.filter((item) => item.status === 'blocked').length,
    temporalCoverageRatio,
    fullyStudied: input.run.state === 'completed'
      && Boolean(input.run.completionAttestation)
      && progressPercent === 100
      && temporalCoverageRatio === 1
      && requiredItems.every((item) => item.status === 'completed'),
    eta,
    phaseLabel: phaseLabel(input.run, requiredItems),
  }
}

export function validateEditReferenceLongFormStudyPlan(plan: EditReferenceLongFormStudyPlan): void {
  if (
    plan?.schemaVersion !== EDIT_REFERENCE_LONG_FORM_STUDY_PLAN_VERSION
    || plan.policyVersion !== EDIT_REFERENCE_LONG_FORM_STUDY_POLICY_VERSION
  ) throw new Error('Long-form study plan version is invalid.')
  for (const [label, value] of [
    ['plan id', plan.planId],
    ['workspace id', plan.workspaceId],
    ['Edit Reference id', plan.editReferenceId],
    ['study session id', plan.studySessionId],
  ] as const) assertId(value, label)
  validateSource(plan.source)
  assertIso(plan.createdAt, 'long-form plan createdAt')
  assertSha256(plan.planDigestSha256, 'long-form plan digest')
  if (!['short', 'standard', 'long', 'extended'].includes(plan.durationClass)) {
    throw new Error('Long-form duration class is invalid.')
  }
  if (
    plan.ingestPolicy.validVideoRejectedOnlyForFileSize !== false
    || plan.ingestPolicy.browserWholeFileBufferingAllowed !== false
    || plan.ingestPolicy.infrastructureCapacityCheckedSeparately !== true
    || plan.ingestPolicy.retryFromVerifiedOffsetRequired !== true
  ) throw new Error('Long-form ingest safety policy is invalid.')
  if (
    plan.normalization.originalRemainsImmutable !== true
    || plan.normalization.profileId !== 'reeditpro-analysis-proxy-v1'
    || plan.normalization.maxWidth !== 1280
    || plan.normalization.maxHeight !== 1280
    || plan.normalization.maxFrameRate !== 30
  ) throw new Error('Long-form normalization profile is invalid.')
  validateChunks(plan)
  validateStages(plan)
  if (
    plan.completionStandard.requiredChunkStageCoverageRatio !== 1
    || plan.completionStandard.requiredTemporalCoverageRatio !== 1
    || plan.completionStandard.reconciliationRequired !== true
    || plan.completionStandard.coverageQaRequired !== true
    || plan.completionStandard.partialSamplingCannotClaimFullyStudied !== true
    || plan.progressPolicy.basedOnCompletedWorkOnly !== true
    || plan.progressPolicy.inventedPercentForbidden !== true
    || plan.studyTimeStandard.version !== 'edit-reference-long-form-study-time-standard-v1'
    || plan.studyTimeStandard.standardSectionSeconds !== 600
    || plan.studyTimeStandard.maximumTechnicalSectionSeconds !== 900
    || plan.studyTimeStandard.maximumSemanticWindowSeconds !== 120
    || plan.studyTimeStandard.planningLowerRealtimeFactor !== (plan.durationClass === 'short' ? 0.2 : 0.15)
    || plan.studyTimeStandard.planningUpperRealtimeFactor !== (plan.durationClass === 'extended' ? 1.5 : 1.25)
    || plan.studyTimeStandard.planningStartupAllowanceSeconds !== 120
    || plan.studyTimeStandard.wholeStudyMayRunForMinutesOrHours !== true
    || plan.studyTimeStandard.browserSessionRequiredForCompletion !== false
    || plan.studyTimeStandard.fixedWholeStudyWallClockTimeoutApplied !== false
    || plan.studyTimeStandard.boundedWorkItemTimeoutAndHeartbeatRequired !== true
    || plan.persistencePolicy.checkpointAfterEveryWorkItem !== true
    || plan.persistencePolicy.restartResumeRequired !== true
    || plan.costPolicy.customerPriceCalculated !== false
    || plan.costPolicy.customerCreditsMutated !== false
    || plan.costPolicy.serviceFeeIncluded !== false
  ) throw new Error('Long-form completion, progress, persistence, or cost policy is invalid.')
  const unsigned = { ...plan } as Record<string, unknown>
  delete unsigned.planDigestSha256
  if (sha256(stableStringify(unsigned)) !== plan.planDigestSha256) {
    throw new Error('Long-form study plan digest does not match its exact content.')
  }
}

export function validateEditReferenceLongFormStudyRun(run: EditReferenceLongFormStudyRunRecord): void {
  if (run?.schemaVersion !== EDIT_REFERENCE_LONG_FORM_STUDY_RUN_VERSION) {
    throw new Error('Long-form study run version is invalid.')
  }
  for (const [label, value] of [
    ['run id', run.runId],
    ['workspace id', run.workspaceId],
    ['Edit Reference id', run.editReferenceId],
    ['study session id', run.studySessionId],
    ['plan id', run.planId],
    ['private media artifact id', run.privateMediaArtifactId],
  ] as const) assertId(value, label)
  assertSha256(run.planDigestSha256, 'run plan digest')
  assertSha256(run.mediaChecksumSha256, 'run source digest')
  assertSha256(run.recordDigestSha256, 'run record digest')
  if (!Number.isSafeInteger(run.revision) || run.revision < 1) throw new Error('Study run revision is invalid.')
  if (!['queued', 'running', 'paused', 'needs_operator_review', 'completed', 'cancelled'].includes(run.state)) {
    throw new Error('Study run state is invalid.')
  }
  assertIso(run.createdAt, 'study run createdAt')
  assertIso(run.updatedAt, 'study run updatedAt')
  if (Date.parse(run.updatedAt) < Date.parse(run.createdAt)) throw new Error('Study run timestamps are invalid.')
  if (
    run.privateInternalOnly !== true
    || run.distributedRuntimeDeployed !== false
    || run.providerExecutionAllowed !== false
    || run.customerPriceCalculated !== false
    || run.customerCreditsMutated !== false
    || run.serviceFeeIncluded !== false
  ) throw new Error('Study run safety boundary is invalid.')
  const ids = new Set<string>()
  for (const item of run.workItems) {
    validateWorkItem(item)
    if (ids.has(item.workItemId)) throw new Error('Study run work item ids are not unique.')
    ids.add(item.workItemId)
  }
  for (const item of run.workItems) {
    if (item.dependencyWorkItemIds.some((id) => !ids.has(id) || id === item.workItemId)) {
      throw new Error('Study run dependency graph is invalid.')
    }
  }
  if (run.operatorReviewRequired !== (run.state === 'needs_operator_review')) {
    throw new Error('Study run operator review state is inconsistent.')
  }
  if ((run.state === 'completed') !== Boolean(run.completedAt)) {
    throw new Error('Study run completion timestamp is inconsistent.')
  }
  if ((run.state === 'completed') !== Boolean(run.completionAttestation)) {
    throw new Error('Study run completion attestation is inconsistent.')
  }
  if (run.completionAttestation) validateCompletionAttestation(run.completionAttestation)
  if ((run.state === 'cancelled') !== Boolean(run.cancelledAt && run.cancelReason)) {
    throw new Error('Study run cancellation state is inconsistent.')
  }
  if ((run.state === 'paused') !== Boolean(run.pausedAt)) {
    throw new Error('Study run pause state is inconsistent.')
  }
  if (run.operatorRecoveryCount !== undefined && (
    !Number.isSafeInteger(run.operatorRecoveryCount)
    || run.operatorRecoveryCount < 0
    || run.operatorRecoveryCount > 1_000
  )) throw new Error('Study run operator recovery count is invalid.')
  const controlFields = [
    run.lastControlAction,
    run.lastControlCommandIdDigestSha256,
    run.lastControlRequestDigestSha256,
    run.lastControlAffectedWorkItemCount,
    run.lastControlActiveWorkFinishesBeforePause,
    run.lastControlAt,
  ]
  if (controlFields.some((value) => value !== undefined)) {
    if (
      !EDIT_REFERENCE_LONG_FORM_STUDY_CONTROL_ACTIONS.includes(run.lastControlAction as EditReferenceLongFormStudyControlAction)
      || !SHA256_PATTERN.test(run.lastControlCommandIdDigestSha256 ?? '')
      || !SHA256_PATTERN.test(run.lastControlRequestDigestSha256 ?? '')
      || !Number.isSafeInteger(run.lastControlAffectedWorkItemCount)
      || (run.lastControlAffectedWorkItemCount as number) < 0
      || typeof run.lastControlActiveWorkFinishesBeforePause !== 'boolean'
      || !isIso(run.lastControlAt)
    ) throw new Error('Study run control lineage is invalid.')
  }
  const unsigned = { ...run } as Record<string, unknown>
  delete unsigned.recordDigestSha256
  if (sha256(stableStringify(unsigned)) !== run.recordDigestSha256) {
    throw new Error('Study run digest does not match its exact checkpoint.')
  }
}

export function validateRunAgainstPlan(
  run: EditReferenceLongFormStudyRunRecord,
  plan: EditReferenceLongFormStudyPlan,
): void {
  validateEditReferenceLongFormStudyPlan(plan)
  validateEditReferenceLongFormStudyRun(run)
  if (
    run.planId !== plan.planId
    || run.planDigestSha256 !== plan.planDigestSha256
    || run.workspaceId !== plan.workspaceId
    || run.editReferenceId !== plan.editReferenceId
    || run.studySessionId !== plan.studySessionId
    || run.privateMediaArtifactId !== plan.source.privateMediaArtifactId
    || run.mediaChecksumSha256 !== plan.source.mediaChecksumSha256
  ) throw new Error('Study run is not bound to the exact source and study plan.')
  const expected = createWorkItems(plan)
  if (stableStringify(expected.map(staticWorkItemView)) !== stableStringify(run.workItems.map(staticWorkItemView))) {
    throw new Error('Study run work graph no longer matches the immutable plan.')
  }
}

function stage(
  stageId: EditReferenceLongFormStudyStageId,
  scope: EditReferenceLongFormStudyStagePlan['scope'],
  weightBasisPoints: number,
  requiresFullTemporalCoverage: boolean,
  maxAttemptsPerWorkItem: number,
): Omit<EditReferenceLongFormStudyStagePlan, 'required'> {
  return {
    stageId,
    scope,
    weightBasisPoints,
    requiresFullTemporalCoverage,
    maxAttemptsPerWorkItem,
    boundedWorkerCommand: true,
  }
}

function validatePlanInput(input: CreateEditReferenceLongFormStudyPlanInput): void {
  for (const [label, value] of [
    ['workspace id', input.workspaceId],
    ['Edit Reference id', input.editReferenceId],
    ['study session id', input.studySessionId],
  ] as const) assertId(value, label)
  validateSource(input.source)
  assertIso(input.createdAt, 'long-form plan createdAt')
  if (typeof input.includeCaptionOcr !== 'boolean') throw new Error('Caption OCR plan flag is invalid.')
}

function validateSource(source: EditReferenceLongFormStudySourceIdentity): void {
  assertId(source.privateMediaArtifactId, 'private media artifact id')
  assertSha256(source.mediaChecksumSha256, 'media checksum')
  if (!Number.isFinite(source.durationSeconds) || source.durationSeconds <= 0 || source.durationSeconds > 30 * 24 * 60 * 60) {
    throw new Error('Reference duration is invalid or exceeds the reviewed thirty-day timeline bound.')
  }
  if (!Number.isSafeInteger(source.sizeBytes) || source.sizeBytes <= 0) throw new Error('Reference size is invalid.')
  if (!VIDEO_MIME_PATTERN.test(source.mimeType)) throw new Error('Reference source must be a video MIME type.')
  if (typeof source.hasAudio !== 'boolean') throw new Error('Reference audio-presence authority is invalid.')
}

function classifyDuration(durationSeconds: number): EditReferenceLongFormDurationClass {
  if (durationSeconds <= SHORT_MAX_SECONDS) return 'short'
  if (durationSeconds <= STANDARD_MAX_SECONDS) return 'standard'
  if (durationSeconds <= LONG_MAX_SECONDS) return 'long'
  return 'extended'
}

function buildChunkPlan(
  durationSeconds: number,
  coreChunkDurationSeconds: number,
  hasAudio: boolean,
): EditReferenceLongFormStudyChunkPlan[] {
  const chunkCount = Math.ceil(durationSeconds / coreChunkDurationSeconds)
  return Array.from({ length: chunkCount }, (_, index) => {
    const coreStartSeconds = index * coreChunkDurationSeconds
    const coreEndSeconds = Math.min(durationSeconds, (index + 1) * coreChunkDurationSeconds)
    const decodeStartSeconds = Math.max(0, coreStartSeconds - CHUNK_OVERLAP_SECONDS)
    const decodeEndSeconds = Math.min(durationSeconds, coreEndSeconds + CHUNK_OVERLAP_SECONDS)
    const coreDurationSeconds = coreEndSeconds - coreStartSeconds
    return {
      chunkId: `study-chunk-${String(index + 1).padStart(5, '0')}`,
      ordinal: index + 1,
      coreStartSeconds: roundSeconds(coreStartSeconds),
      coreEndSeconds: roundSeconds(coreEndSeconds),
      decodeStartSeconds: roundSeconds(decodeStartSeconds),
      decodeEndSeconds: roundSeconds(decodeEndSeconds),
      overlapBeforeSeconds: roundSeconds(coreStartSeconds - decodeStartSeconds),
      overlapAfterSeconds: roundSeconds(decodeEndSeconds - coreEndSeconds),
      // Every <=120 second semantic window must feed all seven bounded
      // specialists. Visual Language needs representative + keyframe context,
      // while Graphics/Motion needs a second distinct motion context. Plan the
      // real shared floor here so a later stage never duplicates a frame or
      // rejects a long source because its section was undersampled.
      // Four exact samples per nominal provider window leave enough bounded
      // evidence to move a semantic boundary around an exact spoken segment
      // without turning a 120-second model limit into a source-duration limit.
      minimumVisualSampleCount: Math.max(4, Math.min(24, Math.ceil(coreDurationSeconds / 120) * 4)),
      adaptiveSceneSamplingRequired: true,
      continuousAudioCoverageRequired: hasAudio,
    }
  })
}

function stageRequired(
  stageId: EditReferenceLongFormStudyStageId,
  hasAudio: boolean,
  includeCaptionOcr: boolean,
): boolean {
  if (['audio_extract', 'speech_transcript'].includes(stageId)) return hasAudio
  if (stageId === 'caption_ocr') return includeCaptionOcr
  return true
}

function validateChunks(plan: EditReferenceLongFormStudyPlan): void {
  if (!Number.isFinite(plan.coreChunkDurationSeconds) || plan.coreChunkDurationSeconds <= 0) {
    throw new Error('Long-form core chunk duration is invalid.')
  }
  if (plan.chunkOverlapSeconds !== CHUNK_OVERLAP_SECONDS || plan.chunks.length < 1 || plan.chunks.length > 4_320) {
    throw new Error('Long-form chunk plan size or overlap is invalid.')
  }
  let expectedStart = 0
  for (const [index, chunk] of plan.chunks.entries()) {
    if (
      chunk.ordinal !== index + 1
      || chunk.chunkId !== `study-chunk-${String(index + 1).padStart(5, '0')}`
      || Math.abs(chunk.coreStartSeconds - expectedStart) > 0.001
      || chunk.coreEndSeconds <= chunk.coreStartSeconds
      || chunk.decodeStartSeconds > chunk.coreStartSeconds
      || chunk.decodeEndSeconds < chunk.coreEndSeconds
      || chunk.decodeStartSeconds < 0
      || chunk.decodeEndSeconds > plan.source.durationSeconds + 0.001
      || chunk.minimumVisualSampleCount < 4
      || chunk.minimumVisualSampleCount > 24
      || chunk.adaptiveSceneSamplingRequired !== true
    ) throw new Error('Long-form chunk plan has a gap, overlap authority error, or invalid sample floor.')
    expectedStart = chunk.coreEndSeconds
  }
  if (Math.abs(expectedStart - plan.source.durationSeconds) > 0.001) {
    throw new Error('Long-form chunk plan does not cover the complete source duration.')
  }
}

function validateStages(plan: EditReferenceLongFormStudyPlan): void {
  if (plan.stages.length !== EDIT_REFERENCE_LONG_FORM_STUDY_STAGE_IDS.length) {
    throw new Error('Long-form stage plan is incomplete.')
  }
  const ids = plan.stages.map((stagePlan) => stagePlan.stageId)
  if (new Set(ids).size !== ids.length || EDIT_REFERENCE_LONG_FORM_STUDY_STAGE_IDS.some((id) => !ids.includes(id))) {
    throw new Error('Long-form stage plan ids are invalid.')
  }
  const totalWeight = plan.stages.filter((stagePlan) => stagePlan.required)
    .reduce((sum, stagePlan) => sum + stagePlan.weightBasisPoints, 0)
  if (totalWeight <= 0 || totalWeight > 10_000) throw new Error('Long-form required stage weights are invalid.')
  for (const stagePlan of plan.stages) {
    if (
      !['source', 'chunk', 'final'].includes(stagePlan.scope)
      || !Number.isSafeInteger(stagePlan.weightBasisPoints)
      || stagePlan.weightBasisPoints < 1
      || !Number.isSafeInteger(stagePlan.maxAttemptsPerWorkItem)
      || stagePlan.maxAttemptsPerWorkItem < 1
      || stagePlan.maxAttemptsPerWorkItem > 8
      || stagePlan.boundedWorkerCommand !== true
    ) throw new Error('Long-form stage policy is invalid.')
  }
}

function createWorkItems(plan: EditReferenceLongFormStudyPlan): EditReferenceLongFormStudyWorkItem[] {
  const items: EditReferenceLongFormStudyWorkItem[] = []
  const byStageAndChunk = new Map<string, string>()
  for (const stagePlan of plan.stages) {
    const targets = stagePlan.scope === 'chunk' ? plan.chunks : [null]
    for (const chunk of targets) {
      if (!stagePlan.required) continue
      const workItemId = workId(stagePlan.stageId, chunk?.chunkId ?? null)
      const dependencyWorkItemIds = dependenciesFor(stagePlan.stageId, chunk?.chunkId ?? null, plan, byStageAndChunk)
      const itemCount = stagePlan.scope === 'chunk' ? plan.chunks.length : 1
      const start = chunk?.coreStartSeconds ?? 0
      const end = chunk?.coreEndSeconds ?? plan.source.durationSeconds
      const item: EditReferenceLongFormStudyWorkItem = {
        workItemId,
        stageId: stagePlan.stageId,
        chunkId: chunk?.chunkId ?? null,
        dependencyWorkItemIds,
        required: true,
        weightBasisPoints: Math.max(1, Math.floor(stagePlan.weightBasisPoints / itemCount)),
        sourceCoverageStartSeconds: start,
        sourceCoverageEndSeconds: end,
        status: 'queued',
        attemptCount: 0,
        maxAttempts: stagePlan.maxAttemptsPerWorkItem,
        leaseGeneration: 0,
      }
      items.push(item)
      byStageAndChunk.set(`${stagePlan.stageId}:${chunk?.chunkId ?? 'source'}`, workItemId)
    }
  }
  return items
}

function dependenciesFor(
  stageId: EditReferenceLongFormStudyStageId,
  chunkId: string | null,
  plan: EditReferenceLongFormStudyPlan,
  known: ReadonlyMap<string, string>,
): string[] {
  const source = (id: EditReferenceLongFormStudyStageId) => known.get(`${id}:source`)
  const chunk = (id: EditReferenceLongFormStudyStageId) => chunkId ? known.get(`${id}:${chunkId}`) : undefined
  const required = (...ids: Array<string | undefined>): string[] => ids.filter((id): id is string => Boolean(id))
  if (stageId === 'ingest_integrity') return []
  if (stageId === 'media_probe') return required(source('ingest_integrity'))
  if (['analysis_proxy', 'audio_extract'].includes(stageId)) {
    return required(source('media_probe'))
  }
  if (['scene_boundary_scan', 'color_motion_signals'].includes(stageId)) {
    return required(chunk('analysis_proxy'))
  }
  if (stageId === 'visual_sampling') return required(chunk('analysis_proxy'), chunk('scene_boundary_scan'))
  if (stageId === 'speech_transcript') return required(chunk('audio_extract'))
  if (stageId === 'caption_ocr') return required(chunk('visual_sampling'))
  if (stageId === 'semantic_chunk_synthesis') {
    return required(
      chunk('analysis_proxy'),
      chunk('audio_extract'),
      chunk('speech_transcript'),
      chunk('scene_boundary_scan'),
      chunk('visual_sampling'),
      chunk('caption_ocr'),
      chunk('color_motion_signals'),
    )
  }
  if (stageId === 'global_reconciliation') {
    return plan.chunks.flatMap((plannedChunk) => {
      const id = known.get(`semantic_chunk_synthesis:${plannedChunk.chunkId}`)
      return id ? [id] : []
    })
  }
  if (stageId === 'coverage_qa') return required(source('global_reconciliation'))
  return []
}

function validateWorkItem(item: EditReferenceLongFormStudyWorkItem): void {
  assertId(item.workItemId, 'study work item id')
  if (!EDIT_REFERENCE_LONG_FORM_STUDY_STAGE_IDS.includes(item.stageId)) throw new Error('Study work stage is invalid.')
  if (item.chunkId !== null) assertId(item.chunkId, 'study chunk id')
  if (!Array.isArray(item.dependencyWorkItemIds) || new Set(item.dependencyWorkItemIds).size !== item.dependencyWorkItemIds.length) {
    throw new Error('Study work dependencies are invalid.')
  }
  if (
    item.required !== true
    || !Number.isSafeInteger(item.weightBasisPoints)
    || item.weightBasisPoints < 1
    || !Number.isFinite(item.sourceCoverageStartSeconds)
    || !Number.isFinite(item.sourceCoverageEndSeconds)
    || item.sourceCoverageStartSeconds < 0
    || item.sourceCoverageEndSeconds <= item.sourceCoverageStartSeconds
    || !['queued', 'leased', 'retry_wait', 'completed', 'blocked', 'cancelled'].includes(item.status)
    || !Number.isSafeInteger(item.attemptCount)
    || item.attemptCount < 0
    || item.attemptCount > maximumAuthorizedAttempts(item)
    || !Number.isSafeInteger(item.maxAttempts)
    || item.maxAttempts < 1
    || !Number.isSafeInteger(item.leaseGeneration)
    || item.leaseGeneration < 0
    || item.leaseGeneration !== item.attemptCount
  ) throw new Error('Study work item core state is invalid.')
  if (item.additionalAttemptsAuthorized !== undefined && (
    !Number.isSafeInteger(item.additionalAttemptsAuthorized)
    || item.additionalAttemptsAuthorized < 1
    || item.additionalAttemptsAuthorized > 10
  )) throw new Error('Study work item recovery attempt authority is invalid.')
  const leaseFields = [item.leaseOwnerIdDigestSha256, item.leaseTokenHashSha256, item.leasedAt, item.leaseExpiresAt]
  if (item.status === 'leased') {
    if (
      leaseFields.some((value) => value === undefined)
      || !SHA256_PATTERN.test(item.leaseOwnerIdDigestSha256 as string)
      || !SHA256_PATTERN.test(item.leaseTokenHashSha256 as string)
      || !isIso(item.leasedAt)
      || !isIso(item.leaseExpiresAt)
      || Date.parse(item.leaseExpiresAt as string) <= Date.parse(item.leasedAt as string)
    ) throw new Error('Study work lease is invalid.')
  } else if (leaseFields.some((value) => value !== undefined)) {
    throw new Error('Inactive study work retained lease authority.')
  }
  if (item.status === 'completed') {
    if (
      !isIso(item.completedAt)
      || !SHA256_PATTERN.test(item.outputDigestSha256 ?? '')
      || !item.observedWallClockMs
      || !['verified_local', 'verified_live', 'verified_mock'].includes(item.outputRuntimeSource ?? '')
      || !['authoritative', 'controlled_mock'].includes(item.outputCompletionAuthority ?? '')
      || (item.outputRuntimeSource === 'verified_mock' && item.outputCompletionAuthority !== 'controlled_mock')
      || (item.outputRuntimeSource === 'verified_live' && item.outputCompletionAuthority !== 'authoritative')
    ) {
      throw new Error('Completed study work lacks output evidence.')
    }
  } else if (
    item.completedAt
    || item.outputDigestSha256
    || item.observedWallClockMs
    || item.outputRuntimeSource
    || item.outputCompletionAuthority
  ) {
    throw new Error('Incomplete study work retained completion evidence.')
  }
  if (item.status === 'retry_wait') {
    if (!isIso(item.nextAttemptAt) || !item.blockerCode || !item.blockerMessage) {
      throw new Error('Retryable study work lacks retry evidence.')
    }
  } else if (item.nextAttemptAt) {
    throw new Error('Non-retry study work retained retry timing.')
  }
  if (item.status === 'blocked' && (!item.blockerCode || !item.blockerMessage)) {
    throw new Error('Blocked study work lacks a safe blocker.')
  }
  if (item.lastHeartbeatAt !== undefined) assertIso(item.lastHeartbeatAt, 'study heartbeat')
  if (item.startedAt !== undefined) assertIso(item.startedAt, 'study start')
  if (item.blockerCode !== undefined) assertSafeCode(item.blockerCode, 'study blocker code')
  if (item.blockerMessage !== undefined) assertSafeText(item.blockerMessage, 500, 'study blocker message')
}

function validateCompletionAttestation(
  attestation: EditReferenceLongFormStudyCompletionAttestation,
  plan?: EditReferenceLongFormStudyPlan,
): void {
  if (attestation?.schemaVersion !== EDIT_REFERENCE_LONG_FORM_STUDY_COMPLETION_ATTESTATION_VERSION) {
    throw new Error('Long-form completion attestation version is invalid.')
  }
  assertId(attestation.coverageQaWorkItemId, 'completion coverage QA work item id')
  assertSha256(attestation.coverageQaOutputDigestSha256, 'completion coverage QA output digest')
  assertSha256(attestation.requiredOutputManifestDigestSha256, 'completion output manifest digest')
  assertIso(attestation.finalizedAt, 'completion finalization time')
  if (
    !Number.isSafeInteger(attestation.requiredWorkItemCount)
    || attestation.requiredWorkItemCount < 1
    || !Number.isSafeInteger(attestation.verifiedOutputRecordCount)
    || attestation.verifiedOutputRecordCount < 1
    || attestation.verifiedOutputRecordCount > attestation.requiredWorkItemCount
    || attestation.temporalCoverageRatio !== 1
    || attestation.chunkStageCoverageRatio !== 1
    || ![0, 1].includes(attestation.continuousAudioCoverageRatio)
    || attestation.everyRequiredOutputVerified !== true
    || attestation.everySemanticRuntimeAuthoritative !== true
    || attestation.everyRequiredOutputCostAuthoritySatisfied !== true
    || attestation.coverageQaPassed !== true
  ) throw new Error('Long-form completion attestation is incomplete or non-authoritative.')
  if (plan && attestation.continuousAudioCoverageRatio !== plan.completionStandard.continuousAudioCoverageRatio) {
    throw new Error('Long-form completion audio coverage does not match the immutable plan.')
  }
}

function requireActiveLease(
  run: EditReferenceLongFormStudyRunRecord,
  workItemId: string,
  workerId: string,
  leaseToken: string,
  now: string,
): EditReferenceLongFormStudyWorkItem {
  assertId(workItemId, 'study work item id')
  assertId(workerId, 'study worker id')
  assertSafeToken(leaseToken, 'study lease token')
  const item = run.workItems.find((candidate) => candidate.workItemId === workItemId)
  if (
    !item
    || item.status !== 'leased'
    || item.leaseOwnerIdDigestSha256 !== sha256(workerId)
    || item.leaseTokenHashSha256 !== sha256(leaseToken)
    || Date.parse(item.leaseExpiresAt ?? '') <= Date.parse(now)
  ) throw new Error('Study work lease is missing, expired, or foreign.')
  return item
}

function expireLeases(run: EditReferenceLongFormStudyRunRecord, now: string): void {
  for (const item of run.workItems) {
    if (item.status !== 'leased' || Date.parse(item.leaseExpiresAt ?? '') > Date.parse(now)) continue
    clearLease(item)
    item.blockerCode = 'worker_lease_expired'
    item.blockerMessage = 'The bounded study worker stopped heartbeating. ReEditPro retained the checkpoint and scheduled this work for recovery.'
    if (item.attemptCount < maximumAuthorizedAttempts(item)) {
      item.status = 'retry_wait'
      item.nextAttemptAt = now
    } else {
      item.status = 'blocked'
      run.state = 'needs_operator_review'
      run.operatorReviewRequired = true
    }
  }
}

function maximumAuthorizedAttempts(item: EditReferenceLongFormStudyWorkItem): number {
  return item.maxAttempts + (item.additionalAttemptsAuthorized ?? 0)
}

function clearLease(item: EditReferenceLongFormStudyWorkItem): void {
  delete item.leaseOwnerIdDigestSha256
  delete item.leaseTokenHashSha256
  delete item.leasedAt
  delete item.leaseExpiresAt
  delete item.lastHeartbeatAt
}

export function sealEditReferenceLongFormStudyRun(
  run: EditReferenceLongFormStudyRunRecord,
): EditReferenceLongFormStudyRunRecord {
  const unsigned = { ...run, recordDigestSha256: undefined } as Record<string, unknown>
  delete unsigned.recordDigestSha256
  const sealed = { ...run, recordDigestSha256: sha256(stableStringify(unsigned)) }
  validateEditReferenceLongFormStudyRun(sealed)
  return sealed
}

const sealRun = sealEditReferenceLongFormStudyRun

function noClaim(
  run: EditReferenceLongFormStudyRunRecord,
  disposition: EditReferenceLongFormStudyClaimResult['disposition'],
): EditReferenceLongFormStudyClaimResult {
  return { run: structuredClone(run), disposition, workItem: null, leaseToken: null }
}

function phaseLabel(
  run: EditReferenceLongFormStudyRunRecord,
  requiredItems: readonly EditReferenceLongFormStudyWorkItem[],
): string {
  if (run.state === 'completed') return 'Study ready for review'
  if (run.state === 'needs_operator_review') return 'Study needs recovery review'
  if (run.state === 'paused') return 'Study paused safely'
  if (run.state === 'cancelled') return 'Study cancelled'
  const active = requiredItems.find((item) => item.status === 'leased')
    ?? requiredItems.find((item) => item.status === 'retry_wait')
    ?? requiredItems.find((item) => item.status === 'queued')
  return active ? stageLabel(active.stageId) : 'Reconciling study coverage'
}

function stageLabel(stageId: EditReferenceLongFormStudyStageId): string {
  const labels: Record<EditReferenceLongFormStudyStageId, string> = {
    ingest_integrity: 'Verifying the private upload',
    media_probe: 'Inspecting media structure',
    analysis_proxy: 'Preparing the analysis copy',
    audio_extract: 'Preparing private study audio',
    speech_transcript: 'Studying speech and pacing',
    scene_boundary_scan: 'Mapping scenes across the full video',
    visual_sampling: 'Studying visual language across the full video',
    caption_ocr: 'Studying caption regions and text treatment',
    color_motion_signals: 'Studying color and motion signals',
    semantic_chunk_synthesis: 'Interpreting each story section',
    global_reconciliation: 'Reconciling the full-video story',
    coverage_qa: 'Verifying complete study coverage',
  }
  return labels[stageId]
}

function planningRemainingSeconds(
  plan: EditReferenceLongFormStudyPlan,
  progressPercent: number,
): { lower: number; upper: number } {
  const remainingRatio = Math.max(0, 1 - progressPercent / 100)
  const lowerFactor = plan.studyTimeStandard.planningLowerRealtimeFactor
  const upperFactor = plan.studyTimeStandard.planningUpperRealtimeFactor
  return {
    lower: Math.ceil(plan.source.durationSeconds * lowerFactor * remainingRatio),
    upper: Math.ceil(
      plan.source.durationSeconds * upperFactor * remainingRatio
      + plan.studyTimeStandard.planningStartupAllowanceSeconds,
    ),
  }
}

function workId(stageId: EditReferenceLongFormStudyStageId, chunkId: string | null): string {
  return `study-work:${stageId}:${chunkId ?? 'source'}`
}

function staticWorkItemView(item: EditReferenceLongFormStudyWorkItem): unknown {
  return {
    workItemId: item.workItemId,
    stageId: item.stageId,
    chunkId: item.chunkId,
    dependencyWorkItemIds: item.dependencyWorkItemIds,
    required: item.required,
    weightBasisPoints: item.weightBasisPoints,
    sourceCoverageStartSeconds: item.sourceCoverageStartSeconds,
    sourceCoverageEndSeconds: item.sourceCoverageEndSeconds,
    maxAttempts: item.maxAttempts,
  }
}

function deriveLeaseToken(runId: string, idempotencyKey: string): string {
  return `er-study-lease-${sha256(`${EDIT_REFERENCE_LONG_FORM_STUDY_RUN_VERSION}:${runId}:${idempotencyKey}`)}`
}

function stableId(prefix: string, value: unknown): string {
  return `${prefix}-${sha256(stableStringify(value)).slice(0, 32)}`
}

function roundSeconds(value: number): number {
  return Number(value.toFixed(3))
}

function assertId(value: string, label: string): void {
  if (!ID_PATTERN.test(value)) throw new Error(`${label} is invalid.`)
}

function assertSha256(value: string, label: string): void {
  if (!SHA256_PATTERN.test(value)) throw new Error(`${label} is invalid.`)
}

function assertIso(value: string, label: string): void {
  if (!isIso(value)) throw new Error(`${label} is invalid.`)
}

function isIso(value: unknown): value is string {
  return typeof value === 'string'
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value
}

function assertLeaseDuration(value: number): void {
  if (!Number.isSafeInteger(value) || value < MIN_LEASE_MS || value > MAX_LEASE_MS) {
    throw new Error('Study lease duration is invalid.')
  }
}

function assertSafeCode(value: string, label: string): void {
  if (!/^[a-z][a-z0-9_]{1,119}$/.test(value)) throw new Error(`${label} is invalid.`)
}

function assertSafeText(value: string, maxLength: number, label: string): void {
  const hasUnsafeControlCharacter = [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint < 32 && ![9, 10, 13].includes(codePoint)
  })
  if (!value || value.length > maxLength || hasUnsafeControlCharacter) {
    throw new Error(`${label} is invalid.`)
  }
}

function assertSafeToken(value: string, label: string): void {
  if (!value || value.length < 8 || value.length > 240) throw new Error(`${label} is invalid.`)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}
