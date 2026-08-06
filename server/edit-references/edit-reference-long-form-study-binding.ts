import { createHash } from 'node:crypto'
import {
  EDIT_REFERENCE_LONG_FORM_STUDY_SUMMARY_VERSION,
  type PreferenceLongFormStudySummary,
} from '../../src/types/edit-reference'
import {
  claimEditReferenceLongFormStudyWork,
  completeEditReferenceLongFormStudyWork,
  deriveEditReferenceLongFormStudyProgress,
  type EditReferenceLongFormStudyPlan,
  type EditReferenceLongFormStudyRunRecord,
} from './edit-reference-long-form-study-contract'

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MAX_REVIEWED_SOURCE_SECONDS = 30 * 24 * 60 * 60

export interface PrepareEditReferenceLongFormStudyRunInput {
  readonly plan: EditReferenceLongFormStudyPlan
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly ingestIntegrityDigestSha256: string
  readonly mediaProbeDigestSha256: string
  readonly mediaProbeObservedWallClockMs: number
  readonly now: string
}

export function prepareEditReferenceLongFormStudyRun(
  input: PrepareEditReferenceLongFormStudyRunInput,
): EditReferenceLongFormStudyRunRecord {
  assertSha256(input.ingestIntegrityDigestSha256, 'ingest integrity digest')
  assertSha256(input.mediaProbeDigestSha256, 'media probe digest')
  if (!Number.isSafeInteger(input.mediaProbeObservedWallClockMs) || input.mediaProbeObservedWallClockMs < 1) {
    throw new Error('Long-form media probe wall-clock evidence is invalid.')
  }
  assertIso(input.now, 'long-form preflight time')

  let run = completePreflightStage({
    run: input.run,
    plan: input.plan,
    expectedStageId: 'ingest_integrity',
    claimKey: `preflight-ingest:${input.run.runId}`,
    outputDigestSha256: input.ingestIntegrityDigestSha256,
    observedWallClockMs: 1,
    now: input.now,
  })
  run = completePreflightStage({
    run,
    plan: input.plan,
    expectedStageId: 'media_probe',
    claimKey: `preflight-probe:${input.run.runId}`,
    outputDigestSha256: input.mediaProbeDigestSha256,
    observedWallClockMs: input.mediaProbeObservedWallClockMs,
    now: input.now,
  })
  return run
}

export function createPreferenceLongFormStudySummary(input: {
  readonly referenceAssetId: string
  readonly plan: EditReferenceLongFormStudyPlan
  readonly run: EditReferenceLongFormStudyRunRecord
}): PreferenceLongFormStudySummary {
  assertId(input.referenceAssetId, 'reference asset id')
  const progress = deriveEditReferenceLongFormStudyProgress({ run: input.run, plan: input.plan })
  const summary: PreferenceLongFormStudySummary = {
    schemaVersion: EDIT_REFERENCE_LONG_FORM_STUDY_SUMMARY_VERSION,
    runId: input.run.runId,
    runRevision: input.run.revision,
    planId: input.plan.planId,
    planDigestSha256: input.plan.planDigestSha256,
    sourceBindingDigestSha256: hashLongFormStudySourceBinding({
      referenceAssetId: input.referenceAssetId,
      plan: input.plan,
    }),
    referenceAssetId: input.referenceAssetId,
    state: input.run.state,
    durationClass: input.plan.durationClass,
    sourceDurationSeconds: input.plan.source.durationSeconds,
    sourceSizeBytes: input.plan.source.sizeBytes,
    sourceHasAudio: input.plan.source.hasAudio,
    chunkCount: input.plan.chunks.length,
    completedWorkItemCount: progress.completedWorkItemCount,
    totalWorkItemCount: progress.totalWorkItemCount,
    runningWorkItemCount: progress.runningWorkItemCount,
    retryWaitWorkItemCount: progress.retryWaitWorkItemCount,
    blockedWorkItemCount: progress.blockedWorkItemCount,
    progressPercent: progress.progressPercent,
    temporalCoverageRatio: progress.temporalCoverageRatio,
    fullyStudied: progress.fullyStudied,
    phaseLabel: progress.phaseLabel,
    etaLowerRemainingSeconds: progress.eta.lowerRemainingSeconds,
    etaUpperRemainingSeconds: progress.eta.upperRemainingSeconds,
    etaConfidence: progress.eta.confidence,
    operatorReviewRequired: input.run.operatorReviewRequired,
    controls: {
      canPause: ['queued', 'running'].includes(input.run.state),
      canResume: input.run.state === 'paused',
      canCancel: ['queued', 'running', 'paused', 'needs_operator_review'].includes(input.run.state),
      canRecover: input.run.state === 'needs_operator_review' && input.run.operatorReviewRequired,
      pauseCompletesCurrentBoundedStep: true,
      completedCheckpointsPreserved: true,
    },
    originalRemainsImmutable: true,
    analysisProxyProfile: input.plan.normalization.profileId,
    fullTemporalCoverageRequired: true,
    globalReconciliationRequired: true,
    coverageQaRequired: true,
    providerCallMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    remoteMutationMade: false,
    updatedAt: input.run.updatedAt,
  }
  validatePreferenceLongFormStudySummary(summary)
  return summary
}

export function validatePreferenceLongFormStudySummary(
  summary: PreferenceLongFormStudySummary,
): void {
  if (summary?.schemaVersion !== EDIT_REFERENCE_LONG_FORM_STUDY_SUMMARY_VERSION) {
    throw new Error('Long-form study summary version is invalid.')
  }
  for (const [label, value] of [
    ['run id', summary.runId],
    ['plan id', summary.planId],
    ['reference asset id', summary.referenceAssetId],
  ] as const) assertId(value, label)
  assertSha256(summary.planDigestSha256, 'long-form plan digest')
  assertSha256(summary.sourceBindingDigestSha256, 'long-form source binding digest')
  assertIso(summary.updatedAt, 'long-form summary updatedAt')
  if (!Number.isSafeInteger(summary.runRevision) || summary.runRevision < 1) {
    throw new Error('Long-form study summary run revision is invalid.')
  }
  if (!['queued', 'running', 'paused', 'needs_operator_review', 'completed', 'cancelled'].includes(summary.state)) {
    throw new Error('Long-form study summary state is invalid.')
  }
  if (!['short', 'standard', 'long', 'extended'].includes(summary.durationClass)) {
    throw new Error('Long-form study summary duration class is invalid.')
  }
  if (
    !Number.isFinite(summary.sourceDurationSeconds)
    || summary.sourceDurationSeconds <= 0
    || summary.sourceDurationSeconds > MAX_REVIEWED_SOURCE_SECONDS
    || !Number.isSafeInteger(summary.sourceSizeBytes)
    || summary.sourceSizeBytes <= 0
    || !Number.isSafeInteger(summary.chunkCount)
    || summary.chunkCount < 1
    || summary.chunkCount > 4_320
    || !Number.isSafeInteger(summary.completedWorkItemCount)
    || summary.completedWorkItemCount < 0
    || !Number.isSafeInteger(summary.totalWorkItemCount)
    || summary.totalWorkItemCount < 1
    || summary.completedWorkItemCount > summary.totalWorkItemCount
  ) throw new Error('Long-form study summary source or work counts are invalid.')
  for (const count of [
    summary.runningWorkItemCount,
    summary.retryWaitWorkItemCount,
    summary.blockedWorkItemCount,
  ]) {
    if (!Number.isSafeInteger(count) || count < 0 || count > summary.totalWorkItemCount) {
      throw new Error('Long-form study summary queue counts are invalid.')
    }
  }
  if (
    !Number.isFinite(summary.progressPercent)
    || summary.progressPercent < 0
    || summary.progressPercent > 100
    || !Number.isFinite(summary.temporalCoverageRatio)
    || summary.temporalCoverageRatio < 0
    || summary.temporalCoverageRatio > 1
    || !Number.isSafeInteger(summary.etaLowerRemainingSeconds)
    || summary.etaLowerRemainingSeconds < 0
    || !Number.isSafeInteger(summary.etaUpperRemainingSeconds)
    || summary.etaUpperRemainingSeconds < summary.etaLowerRemainingSeconds
    || !['planning', 'observed_low', 'observed_medium'].includes(summary.etaConfidence)
    || typeof summary.phaseLabel !== 'string'
    || summary.phaseLabel.length < 1
    || summary.phaseLabel.length > 160
  ) throw new Error('Long-form study summary progress or ETA is invalid.')
  if (
    summary.operatorReviewRequired !== (summary.state === 'needs_operator_review')
    || summary.controls.canPause !== ['queued', 'running'].includes(summary.state)
    || summary.controls.canResume !== (summary.state === 'paused')
    || summary.controls.canCancel !== ['queued', 'running', 'paused', 'needs_operator_review'].includes(summary.state)
    || summary.controls.canRecover !== (summary.state === 'needs_operator_review' && summary.operatorReviewRequired)
    || summary.controls.pauseCompletesCurrentBoundedStep !== true
    || summary.controls.completedCheckpointsPreserved !== true
    || summary.originalRemainsImmutable !== true
    || summary.analysisProxyProfile !== 'reeditpro-analysis-proxy-v1'
    || summary.fullTemporalCoverageRequired !== true
    || summary.globalReconciliationRequired !== true
    || summary.coverageQaRequired !== true
    || summary.providerCallMade !== false
    || summary.customerPriceCalculated !== false
    || summary.customerCreditsMutated !== false
    || summary.remoteMutationMade !== false
  ) throw new Error('Long-form study summary safety boundary is invalid.')
  if (summary.fullyStudied && (
    summary.state !== 'completed'
    || summary.progressPercent !== 100
    || summary.temporalCoverageRatio !== 1
    || summary.completedWorkItemCount !== summary.totalWorkItemCount
  )) throw new Error('Long-form study summary claims completion without full coverage.')
  if (summary.state === 'completed' && !summary.fullyStudied) {
    throw new Error('A completed long-form study summary must satisfy the full-study standard.')
  }
}

export function assertPreferenceLongFormStudySummaryMatches(input: {
  readonly summary: PreferenceLongFormStudySummary
  readonly referenceAssetId: string
  readonly plan: EditReferenceLongFormStudyPlan
  readonly run: EditReferenceLongFormStudyRunRecord
}): void {
  validatePreferenceLongFormStudySummary(input.summary)
  const expected = createPreferenceLongFormStudySummary({
    referenceAssetId: input.referenceAssetId,
    plan: input.plan,
    run: input.run,
  })
  if (stableStringify(input.summary) !== stableStringify(expected)) {
    throw new Error('Long-form study summary no longer matches its exact private plan and checkpoint.')
  }
}

export function hashLongFormStudySourceBinding(input: {
  readonly referenceAssetId: string
  readonly plan: EditReferenceLongFormStudyPlan
}): string {
  return sha256(stableStringify({
    referenceAssetId: input.referenceAssetId,
    workspaceId: input.plan.workspaceId,
    editReferenceId: input.plan.editReferenceId,
    studySessionId: input.plan.studySessionId,
    privateMediaArtifactId: input.plan.source.privateMediaArtifactId,
    mediaChecksumSha256: input.plan.source.mediaChecksumSha256,
    sourceSizeBytes: input.plan.source.sizeBytes,
    sourceDurationSeconds: input.plan.source.durationSeconds,
    sourceMimeType: input.plan.source.mimeType,
    planId: input.plan.planId,
    planDigestSha256: input.plan.planDigestSha256,
  }))
}

function completePreflightStage(input: {
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly plan: EditReferenceLongFormStudyPlan
  readonly expectedStageId: 'ingest_integrity' | 'media_probe'
  readonly claimKey: string
  readonly outputDigestSha256: string
  readonly observedWallClockMs: number
  readonly now: string
}): EditReferenceLongFormStudyRunRecord {
  const claim = claimEditReferenceLongFormStudyWork({
    run: input.run,
    plan: input.plan,
    workerId: 'edit-reference-long-form-preflight',
    idempotencyKey: input.claimKey,
    leaseDurationMs: 60_000,
    now: input.now,
  })
  if (
    claim.disposition !== 'authorized'
    || claim.workItem?.stageId !== input.expectedStageId
    || !claim.leaseToken
  ) throw new Error(`Long-form preflight could not authorize ${input.expectedStageId}.`)
  return completeEditReferenceLongFormStudyWork({
    run: claim.run,
    plan: input.plan,
    workItemId: claim.workItem.workItemId,
    workerId: 'edit-reference-long-form-preflight',
    leaseToken: claim.leaseToken,
    outputDigestSha256: input.outputDigestSha256,
    outputRuntimeSource: 'verified_local',
    outputCompletionAuthority: 'authoritative',
    observedWallClockMs: input.observedWallClockMs,
    now: input.now,
  })
}

function assertId(value: string, label: string): void {
  if (!ID_PATTERN.test(value)) throw new Error(`Long-form ${label} is invalid.`)
}

function assertSha256(value: string, label: string): void {
  if (!SHA256_PATTERN.test(value)) throw new Error(`Long-form ${label} is invalid.`)
}

function assertIso(value: string, label: string): void {
  if (!Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} is invalid.`)
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
}
