import { createHash } from 'node:crypto'
import type {
  TargetVideoUnderstandingDeclaredContext,
  TargetVideoUnderstandingEvidenceRecord,
  TargetVideoUnderstandingEvidenceStatus,
  TargetVideoUnderstandingGraphicsNeed,
  TargetVideoUnderstandingPackage,
  TargetVideoUnderstandingSkillRun,
  TargetVideoUnderstandingStatus,
  TargetVideoUnderstandingVisualOpportunity,
} from '../../src/types/edit-reference-target-video-understanding'
import {
  TARGET_VIDEO_UNDERSTANDING_PACKAGE_VERSION,
} from '../../src/types/edit-reference-target-video-understanding'
import {
  deriveEditReferenceLongFormStudyProgress,
  validateRunAgainstPlan,
  type EditReferenceLongFormStudyPlan,
  type EditReferenceLongFormStudyRunRecord,
  type EditReferenceLongFormStudyStageId,
} from './edit-reference-long-form-study-contract'
import type {
  EditReferenceLongFormGlobalPattern,
  EditReferenceLongFormGlobalReconciliationResult,
} from './edit-reference-long-form-specialist-stage-contract'
import {
  validateEditReferenceLongFormStudyWorkOutputAgainstPlan,
  type EditReferenceLongFormStudyWorkOutput,
} from './edit-reference-long-form-study-work-output'

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/

const SKILL_ID_BY_STAGE: Record<EditReferenceLongFormStudyStageId, string> = {
  ingest_integrity: 'target_video.verify_ingest_integrity',
  media_probe: 'target_video.probe_media',
  analysis_proxy: 'target_video.create_analysis_proxy',
  audio_extract: 'target_video.extract_study_audio',
  speech_transcript: 'target_video.transcribe_speech',
  scene_boundary_scan: 'target_video.scan_scene_boundaries',
  visual_sampling: 'target_video.sample_visual_timeline',
  caption_ocr: 'target_video.analyze_visible_text',
  color_motion_signals: 'target_video.analyze_color_and_motion',
  semantic_chunk_synthesis: 'target_video.understand_semantic_sections',
  global_reconciliation: 'target_video.reconcile_whole_story',
  coverage_qa: 'target_video.verify_understanding_coverage',
}

export interface CreateTargetVideoUnderstandingPackageInput {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly storageObjectRecordId: string
  readonly mediaAssetId: string
  readonly declaredContext: Omit<TargetVideoUnderstandingDeclaredContext, 'contextDigestSha256'>
  readonly plan: EditReferenceLongFormStudyPlan
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly outputs: readonly EditReferenceLongFormStudyWorkOutput[]
  readonly createdAt: string
}

export function createTargetVideoUnderstandingPackage(
  input: CreateTargetVideoUnderstandingPackageInput,
): TargetVideoUnderstandingPackage {
  validateInput(input)
  const outputByWorkItemId = validateAndIndexOutputs(input)
  const progress = deriveEditReferenceLongFormStudyProgress({ plan: input.plan, run: input.run })
  const evidence = createEvidenceRecords(input, outputByWorkItemId)
  const evidenceIdByWorkItemId = new Map(evidence.map((record) => [record.workItemId, record.evidenceId]))
  const globalOutput = outputForStage(outputByWorkItemId, 'global_reconciliation')
  const globalResult = globalOutput?.result.kind === 'global_reconciliation'
    ? globalOutput.result
    : undefined
  const coverageOutput = outputForStage(outputByWorkItemId, 'coverage_qa')
  const coverageResult = coverageOutput?.result.kind === 'coverage_qa'
    ? coverageOutput.result
    : undefined
  const transcripts = outputsForStage(outputByWorkItemId, 'speech_transcript')
    .filter((output) => output.result.kind === 'speech_transcript')
  const captionOutputs = outputsForStage(outputByWorkItemId, 'caption_ocr')
    .filter((output) => output.result.kind === 'caption_ocr')
  const sceneOutputs = outputsForStage(outputByWorkItemId, 'scene_boundary_scan')
    .filter((output) => output.result.kind === 'scene_boundary_scan')
  const colorOutputs = outputsForStage(outputByWorkItemId, 'color_motion_signals')
    .filter((output) => output.result.kind === 'color_motion_signals')
  const semanticOutputs = outputsForStage(outputByWorkItemId, 'semantic_chunk_synthesis')
    .filter((output) => output.result.kind === 'semantic_chunk_synthesis')
  const limitations = createLimitations(input, coverageResult, globalResult)
  const missingEvidence = createMissingEvidence(input, outputByWorkItemId, globalResult)
  const readyForPreferenceApplication = isReadyForPreferenceApplication(input, coverageResult)
  const status = packageStatus(input.run, globalResult, readyForPreferenceApplication)
  const skillRuns = createSkillRuns(input, evidence, outputByWorkItemId, limitations)
  const storyEvidenceIds = evidenceIdsForStages(evidence, ['semantic_chunk_synthesis', 'global_reconciliation'])
  const visualOpportunities = createVisualOpportunities(globalResult, input, evidenceIdByWorkItemId)
  const graphicsNeeds = createGraphicsNeeds(globalResult, input, evidenceIdByWorkItemId)
  const speechPresent = transcriptSpeechPresent(transcripts)
  const wordCount = transcripts.reduce((sum, output) => (
    output.result.kind === 'speech_transcript' ? sum + output.result.wordCount : sum
  ), 0)
  const sourceMode = inferSourceMode(input.plan.source.durationSeconds, input.plan.source.hasAudio, speechPresent, wordCount)
  const runtimeProvenance = createRuntimeProvenance(evidence, semanticOutputs, coverageResult)
  const confidence = createConfidence({
    readyForPreferenceApplication,
    globalResult,
    transcripts,
    captionOutputs,
    colorOutputs,
    semanticOutputs,
  })
  const declaredContext: TargetVideoUnderstandingDeclaredContext = {
    ...structuredClone(input.declaredContext),
    contextDigestSha256: calculateTargetVideoUnderstandingDeclaredContextDigest(input.declaredContext),
  }
  const completionAttestationDigestSha256 = input.run.completionAttestation
    ? sha256(stableStringify(input.run.completionAttestation))
    : null
  const unsigned: Omit<TargetVideoUnderstandingPackage, 'packageDigestSha256'> = {
    schemaVersion: TARGET_VIDEO_UNDERSTANDING_PACKAGE_VERSION,
    packageId: calculateTargetVideoUnderstandingPackageId({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      sourceStorageObjectRecordId: input.storageObjectRecordId,
      mediaChecksumSha256: input.plan.source.mediaChecksumSha256,
      planDigestSha256: input.plan.planDigestSha256,
      runRevision: input.run.revision,
      contextDigestSha256: declaredContext.contextDigestSha256,
    }),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    status,
    source: {
      storageObjectRecordId: input.storageObjectRecordId,
      mediaAssetId: input.mediaAssetId,
      checksumSha256: input.plan.source.mediaChecksumSha256,
      sizeBytes: input.plan.source.sizeBytes,
      durationSeconds: input.plan.source.durationSeconds,
      mimeType: input.plan.source.mimeType,
      hasAudio: input.plan.source.hasAudio,
      originalRemainsImmutable: true,
      uploadTransport: input.plan.ingestPolicy.uploadTransport,
      analysisProxyProfile: input.plan.normalization.profileId,
      analysisProxyMaxWidth: input.plan.normalization.maxWidth,
      analysisProxyMaxHeight: input.plan.normalization.maxHeight,
      analysisProxyMaxFrameRate: input.plan.normalization.maxFrameRate,
      studyAudioSampleRate: input.plan.normalization.studyAudioSampleRate,
      studyAudioChannels: input.plan.normalization.studyAudioChannels,
    },
    declaredContext,
    study: {
      runId: input.run.runId,
      runRevision: input.run.revision,
      planId: input.plan.planId,
      planDigestSha256: input.plan.planDigestSha256,
      state: input.run.state,
      durationClass: input.plan.durationClass,
      chunkCount: input.plan.chunks.length,
      coreChunkDurationSeconds: input.plan.coreChunkDurationSeconds,
      maximumSemanticWindowSeconds: input.plan.studyTimeStandard.maximumSemanticWindowSeconds,
      completedWorkItemCount: progress.completedWorkItemCount,
      totalWorkItemCount: progress.totalWorkItemCount,
      progressPercent: progress.progressPercent,
      temporalCoverageRatio: progress.temporalCoverageRatio,
      continuousAudioCoverageRatio: completedAudioCoverage(input, transcripts),
      etaLowerRemainingSeconds: progress.eta.lowerRemainingSeconds,
      etaUpperRemainingSeconds: progress.eta.upperRemainingSeconds,
      etaConfidence: progress.eta.confidence,
      wholeStudyMayRunForMinutesOrHours: true,
      browserSessionRequiredForCompletion: false,
      fixedWholeStudyWallClockTimeoutApplied: false,
      checkpointAfterEveryWorkItem: true,
      restartResumeRequired: true,
      partialSamplingCannotClaimFullyStudied: true,
    },
    evidenceIds: evidence.map((record) => record.evidenceId),
    evidence,
    skillRuns,
    confidence,
    sourceSummary: globalResult?.sourceStorySummary ?? technicalSourceSummary(input, progress.temporalCoverageRatio),
    storyStructure: {
      status: globalResult ? 'analyzed' : 'pending',
      summary: globalResult?.sourceStorySummary ?? 'Whole-story semantic reconciliation is still pending; only verified technical source facts are available.',
      observedPatterns: patternsFor(globalResult, ['story_structure']).map((pattern) => pattern.summary),
      technicalSceneBoundaryCandidateCount: sceneOutputs.reduce((sum, output) => (
        output.result.kind === 'scene_boundary_scan' ? sum + output.result.boundaryCount : sum
      ), 0),
      evidenceIds: storyEvidenceIds,
    },
    visualOpportunities,
    audioState: {
      status: audioEvidenceStatus(input, transcripts, globalResult),
      hasAudio: input.plan.source.hasAudio,
      speechPresent,
      sourceMode,
      transcriptSegmentCount: transcripts.reduce((sum, output) => (
        output.result.kind === 'speech_transcript' ? sum + output.result.segmentCount : sum
      ), 0),
      transcriptWordCount: wordCount,
      languageCodes: unique(transcripts.flatMap((output) => (
        output.result.kind === 'speech_transcript' && output.result.languageCode
          ? [output.result.languageCode]
          : []
      ))),
      wordTimingMode: transcriptWordTimingMode(input, transcripts),
      continuousCoverage: completedAudioCoverage(input, transcripts) === input.plan.completionStandard.continuousAudioCoverageRatio,
      qualitySummary: audioQualitySummary(input, globalResult, transcripts),
      evidenceIds: evidenceIdsForStages(evidence, ['audio_extract', 'speech_transcript', 'semantic_chunk_synthesis', 'global_reconciliation']),
    },
    captionRequirements: createCaptionRequirements(input, transcripts, captionOutputs, globalResult, evidence),
    colorState: {
      status: colorOutputs.length === input.plan.chunks.length
        ? globalResult ? 'analyzed' : 'pending'
        : 'pending',
      summary: patternsFor(globalResult, ['color_treatment']).map((pattern) => pattern.summary).join(' ')
        || (colorOutputs.length
          ? `Technical color and motion signals are verified across ${colorOutputs.length} of ${input.plan.chunks.length} planned sections; semantic color intent is pending.`
          : 'Target color evidence is pending.'),
      technicalSectionCount: colorOutputs.length,
      evidenceIds: evidenceIdsForStages(evidence, ['color_motion_signals', 'semantic_chunk_synthesis', 'global_reconciliation']),
    },
    graphicsNeeds,
    limitations,
    missingEvidence,
    runtimeProvenance: {
      ...runtimeProvenance,
      completionAttestationDigestSha256,
    },
    readyForPreferenceApplication,
    callerSourceSummaryUsedAsStudyEvidence: false,
    rawTranscriptPersisted: false,
    rawFrameBytesPersisted: false,
    rawProviderPayloadPersisted: false,
    signedUrlPersisted: false,
    localFilePathPersisted: false,
    providerCallMade: evidence.some((record) => outputByWorkItemId.get(record.workItemId)?.providerCallMade === true),
    modelCallMade: semanticOutputs.some((output) => (
      output.result.kind === 'semantic_chunk_synthesis' && output.result.synthesisRuntime.modelCallMade
    )),
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    remoteMutationMade: false,
    createdAt: input.createdAt,
    updatedAt: Date.parse(input.createdAt) > Date.parse(input.run.updatedAt)
      ? input.createdAt
      : input.run.updatedAt,
  }
  const result: TargetVideoUnderstandingPackage = {
    ...unsigned,
    packageDigestSha256: calculateTargetVideoUnderstandingPackageDigest(unsigned),
  }
  validateTargetVideoUnderstandingPackage(result)
  return result
}

export function validateTargetVideoUnderstandingPackage(
  value: TargetVideoUnderstandingPackage,
): void {
  if (value?.schemaVersion !== TARGET_VIDEO_UNDERSTANDING_PACKAGE_VERSION) {
    throw new Error('Target-video understanding package version is invalid.')
  }
  for (const [label, id] of [
    ['package id', value.packageId],
    ['workspace id', value.workspaceId],
    ['project id', value.projectId],
    ['edit session id', value.editSessionId],
    ['Edit Reference id', value.editReferenceId],
    ['study session id', value.studySessionId],
    ['source storage record id', value.source.storageObjectRecordId],
    ['source media asset id', value.source.mediaAssetId],
  ] as const) assertId(id, label)
  assertSha256(value.source.checksumSha256, 'source checksum')
  assertSha256(value.declaredContext.editBriefDigestSha256, 'Edit Brief digest')
  assertSha256(value.declaredContext.contextDigestSha256, 'declared context digest')
  assertSha256(value.study.planDigestSha256, 'study plan digest')
  assertSha256(value.packageDigestSha256, 'package digest')
  assertIso(value.createdAt, 'package createdAt')
  assertIso(value.updatedAt, 'package updatedAt')
  if (
    !['collecting', 'needs_operator_review', 'review_required', 'ready', 'cancelled'].includes(value.status)
    || !Number.isSafeInteger(value.source.sizeBytes)
    || value.source.sizeBytes <= 0
    || !Number.isFinite(value.source.durationSeconds)
    || value.source.durationSeconds <= 0
    || !value.source.mimeType.startsWith('video/')
    || value.source.originalRemainsImmutable !== true
    || value.source.analysisProxyProfile !== 'reeditpro-analysis-proxy-v1'
    || value.source.analysisProxyMaxWidth !== 1280
    || value.source.analysisProxyMaxHeight !== 1280
    || value.source.analysisProxyMaxFrameRate !== 30
    || value.source.studyAudioSampleRate !== 16000
    || value.source.studyAudioChannels !== 1
  ) throw new Error('Target-video source or normalization authority is invalid.')
  if (
    value.evidenceIds.length !== value.evidence.length
    || new Set(value.evidenceIds).size !== value.evidenceIds.length
    || value.evidence.some((record) => !value.evidenceIds.includes(record.evidenceId))
    || new Set(value.skillRuns.map((record) => record.skillRunId)).size !== value.skillRuns.length
  ) throw new Error('Target-video evidence or skill-run identity is invalid.')
  if (!Number.isSafeInteger(value.study.runRevision) || value.study.runRevision < 1) {
    throw new Error('Target-video study revision is invalid.')
  }
  if (
    !Number.isSafeInteger(value.study.totalWorkItemCount)
    || value.study.totalWorkItemCount < 1
    || !Number.isSafeInteger(value.study.completedWorkItemCount)
    || value.study.completedWorkItemCount < 0
    || value.study.completedWorkItemCount > value.study.totalWorkItemCount
  ) throw new Error('Target-video study work-item coverage is invalid.')
  for (const record of value.evidence) validateEvidenceRecord(record)
  for (const skillRun of value.skillRuns) validateSkillRun(skillRun, value.evidenceIds)
  validateConfidence(value.confidence)
  if (
    value.readyForPreferenceApplication !== (value.status === 'ready')
    || (value.readyForPreferenceApplication && (
      value.study.state !== 'completed'
      || value.study.completedWorkItemCount !== value.study.totalWorkItemCount
      || value.study.progressPercent !== 100
      || value.study.temporalCoverageRatio !== 1
      || value.runtimeProvenance.completionAttestationDigestSha256 === null
      || value.runtimeProvenance.everyRequiredOutputVerified !== true
      || value.runtimeProvenance.everySemanticRuntimeAuthoritative !== true
      || value.runtimeProvenance.everyRequiredOutputCostAuthoritySatisfied !== true
      || value.runtimeProvenance.coverageQaPassed !== true
      || !value.evidence.some((record) => (
        record.stageId === 'global_reconciliation'
        && record.completionAuthority === 'authoritative'
      ))
      || !value.evidence.some((record) => (
        record.stageId === 'coverage_qa'
        && record.completionAuthority === 'authoritative'
      ))
      || !value.runtimeProvenance.runtimeSources.includes('verified_live')
      || value.runtimeProvenance.runtimeSources.some((source) => source === 'verified_mock' || source === 'not_run')
      || value.evidence.some((record) => (
        record.completionAuthority !== 'authoritative'
        || record.runtimeSource === 'verified_mock'
        || record.runtimeSource === 'not_run'
      ))
      || value.skillRuns.some((record) => (
        !['analyzed', 'not_applicable'].includes(record.status)
        || record.fullTemporalCoverage !== true
        || record.runtimeSources.some((source) => source === 'verified_mock' || source === 'not_run')
      ))
      || value.confidence.basis !== 'completed_authoritative_study'
      || value.storyStructure.status !== 'analyzed'
      || value.audioState.status !== 'analyzed'
      || value.captionRequirements.status !== 'analyzed'
      || value.colorState.status !== 'analyzed'
      || value.missingEvidence.some((record) => record.blocking)
      || value.limitations.some((record) => record.blocking)
    ))
  ) throw new Error('Target-video application readiness is not backed by full authoritative coverage.')
  if (
    value.callerSourceSummaryUsedAsStudyEvidence !== false
    || value.rawTranscriptPersisted !== false
    || value.rawFrameBytesPersisted !== false
    || value.rawProviderPayloadPersisted !== false
    || value.signedUrlPersisted !== false
    || value.localFilePathPersisted !== false
    || value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
    || value.remoteMutationMade !== false
  ) throw new Error('Target-video understanding safety boundary is invalid.')
  if (findForbiddenKey(value)) throw new Error('Target-video understanding package contains forbidden private or provider data.')
  if (calculateTargetVideoUnderstandingPackageDigest(value) !== value.packageDigestSha256) {
    throw new Error('Target-video understanding package digest does not match its exact content.')
  }
}

export function calculateTargetVideoUnderstandingDeclaredContextDigest(
  value: Omit<TargetVideoUnderstandingDeclaredContext, 'contextDigestSha256'>,
): string {
  return sha256(stableStringify(value))
}

export function calculateTargetVideoUnderstandingPackageDigest(
  value: Omit<TargetVideoUnderstandingPackage, 'packageDigestSha256'> | TargetVideoUnderstandingPackage,
): string {
  const unsigned = structuredClone(value) as Record<string, unknown>
  delete unsigned.packageDigestSha256
  return sha256(stableStringify(unsigned))
}

export function calculateTargetVideoUnderstandingPackageId(input: {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly sourceStorageObjectRecordId: string
  readonly mediaChecksumSha256: string
  readonly planDigestSha256: string
  readonly runRevision: number
  readonly contextDigestSha256: string
}): string {
  return stableUuid({
    domain: 'target_video_understanding_package_v1',
    ...input,
  })
}

function validateInput(input: CreateTargetVideoUnderstandingPackageInput): void {
  for (const [label, id] of [
    ['workspace id', input.workspaceId],
    ['project id', input.projectId],
    ['edit session id', input.editSessionId],
    ['Edit Reference id', input.editReferenceId],
    ['study session id', input.studySessionId],
    ['storage object record id', input.storageObjectRecordId],
    ['media asset id', input.mediaAssetId],
  ] as const) assertId(id, label)
  assertIso(input.createdAt, 'package createdAt')
  assertSha256(input.declaredContext.editBriefDigestSha256, 'Edit Brief digest')
  validateRunAgainstPlan(input.run, input.plan)
  if (
    input.plan.workspaceId !== input.workspaceId
    || input.plan.editReferenceId !== input.editReferenceId
    || input.plan.studySessionId !== input.studySessionId
    || input.plan.source.privateMediaArtifactId !== input.storageObjectRecordId
    || input.declaredContext.outputFrameConfirmed !== true
  ) throw new Error('Target-video study, source, reference, or confirmed-frame binding is invalid.')
}

function validateAndIndexOutputs(
  input: CreateTargetVideoUnderstandingPackageInput,
): Map<string, EditReferenceLongFormStudyWorkOutput> {
  const indexed = new Map<string, EditReferenceLongFormStudyWorkOutput>()
  for (const output of input.outputs) {
    const workItem = input.run.workItems.find((record) => record.workItemId === output.workItemId)
    if (!workItem) throw new Error('Target-video package contains an output for an unknown work item.')
    validateEditReferenceLongFormStudyWorkOutputAgainstPlan({ output, plan: input.plan, workItem })
    if (indexed.has(output.workItemId)) throw new Error('Target-video package contains duplicate work output identity.')
    if (workItem.status !== 'completed' || workItem.outputDigestSha256 !== output.outputDigestSha256) {
      throw new Error('Target-video output is not the exact completed checkpoint authority.')
    }
    indexed.set(output.workItemId, structuredClone(output))
  }
  for (const item of input.run.workItems.filter((record) => record.required && record.status === 'completed')) {
    if (!item.outputDigestSha256) throw new Error('Completed target-video work lacks an output digest.')
    if (!['ingest_integrity', 'media_probe'].includes(item.stageId) && !indexed.has(item.workItemId)) {
      throw new Error('Target-video package omitted a completed required work output.')
    }
  }
  return indexed
}

function createEvidenceRecords(
  input: CreateTargetVideoUnderstandingPackageInput,
  outputByWorkItemId: ReadonlyMap<string, EditReferenceLongFormStudyWorkOutput>,
): TargetVideoUnderstandingEvidenceRecord[] {
  return input.run.workItems
    .filter((item) => item.status === 'completed' && item.outputDigestSha256)
    .map((item) => {
      const output = outputByWorkItemId.get(item.workItemId)
      return {
        evidenceId: stableId('target-video-evidence', {
          runId: input.run.runId,
          workItemId: item.workItemId,
          outputDigestSha256: item.outputDigestSha256,
        }),
        workItemId: item.workItemId,
        stageId: item.stageId,
        chunkId: item.chunkId,
        sourceCoverageStartSeconds: item.sourceCoverageStartSeconds,
        sourceCoverageEndSeconds: item.sourceCoverageEndSeconds,
        outputDigestSha256: item.outputDigestSha256 as string,
        runtimeSource: output?.runtimeSource ?? 'verified_local',
        completionAuthority: output?.completionAuthority ?? item.outputCompletionAuthority ?? 'incomplete',
        toolIds: output ? [...output.toolIds] : item.stageId === 'media_probe' ? ['ffprobe'] : ['ingest_integrity'],
      }
    })
}

function createSkillRuns(
  input: CreateTargetVideoUnderstandingPackageInput,
  evidence: readonly TargetVideoUnderstandingEvidenceRecord[],
  outputByWorkItemId: ReadonlyMap<string, EditReferenceLongFormStudyWorkOutput>,
  limitations: readonly { id: string; blocking: boolean }[],
): TargetVideoUnderstandingSkillRun[] {
  return input.plan.stages.map((stage) => {
    const items = input.run.workItems.filter((item) => item.stageId === stage.stageId)
    const stageEvidence = evidence.filter((record) => record.stageId === stage.stageId)
    const status: TargetVideoUnderstandingEvidenceStatus = !stage.required
      ? 'not_applicable'
      : items.some((item) => item.status === 'blocked')
        ? 'blocked'
        : items.length > 0 && items.every((item) => item.status === 'completed')
          ? 'analyzed'
          : 'pending'
    const runtimes = unique(stageEvidence.map((record) => record.runtimeSource))
    const semanticConfidences = items.flatMap((item) => {
      const output = outputByWorkItemId.get(item.workItemId)
      if (output?.result.kind === 'semantic_chunk_synthesis') {
        return output.result.specialistCoverage.map((record) => record.confidence)
      }
      if (output?.result.kind === 'speech_transcript') return [output.result.confidence]
      if (output?.result.kind === 'caption_ocr' && output.result.textRegionCount > 0) return [output.result.averageRegionConfidence]
      return []
    })
    return {
      skillRunId: stableId('target-video-skill-run', {
        runId: input.run.runId,
        stageId: stage.stageId,
        outputDigests: stageEvidence.map((record) => record.outputDigestSha256),
      }),
      skillId: SKILL_ID_BY_STAGE[stage.stageId],
      stageId: stage.stageId,
      status,
      runtimeSources: runtimes.length ? runtimes : ['not_run'],
      evidenceIds: stageEvidence.map((record) => record.evidenceId),
      confidence: status === 'analyzed'
        ? rounded(semanticConfidences.length ? average(semanticConfidences) : 1)
        : status === 'not_applicable' ? 1 : 0,
      fullTemporalCoverage: status === 'not_applicable' || (
        items.length > 0
        && items.every((item) => item.status === 'completed')
        && (!stage.requiresFullTemporalCoverage || coversWholeSource(items, input.plan.source.durationSeconds))
      ),
      limitationIds: limitations.filter((record) => (
        record.blocking && ['semantic_chunk_synthesis', 'global_reconciliation', 'coverage_qa'].includes(stage.stageId)
      )).map((record) => record.id),
    }
  })
}

function createLimitations(
  input: CreateTargetVideoUnderstandingPackageInput,
  coverageResult: Extract<EditReferenceLongFormStudyWorkOutput['result'], { kind: 'coverage_qa' }> | undefined,
  globalResult: EditReferenceLongFormGlobalReconciliationResult | undefined,
): Array<{ id: string; summary: string; blocking: boolean }> {
  const limitations: Array<{ id: string; summary: string; blocking: boolean }> = []
  for (const blocker of coverageResult?.blockers ?? []) {
    limitations.push({
      id: stableId('target-video-limitation', blocker),
      summary: blocker,
      blocking: true,
    })
  }
  for (const contradiction of globalResult?.unresolvedContradictions ?? []) {
    limitations.push({
      id: stableId('target-video-limitation', contradiction),
      summary: contradiction,
      blocking: true,
    })
  }
  if (!input.run.completionAttestation) {
    limitations.push({
      id: 'target-video-limitation-authoritative-completion-pending',
      summary: 'The whole-video completion attestation is pending; this package cannot drive Preference Application yet.',
      blocking: true,
    })
  }
  return dedupeById(limitations)
}

function createMissingEvidence(
  input: CreateTargetVideoUnderstandingPackageInput,
  outputByWorkItemId: ReadonlyMap<string, EditReferenceLongFormStudyWorkOutput>,
  globalResult: EditReferenceLongFormGlobalReconciliationResult | undefined,
): Array<{ id: string; domain: string; summary: string; blocking: boolean }> {
  const missing: Array<{ id: string; domain: string; summary: string; blocking: boolean }> = input.run.workItems
    .filter((item) => item.required && item.status !== 'completed')
    .map((item) => ({
      id: stableId('target-video-missing-evidence', { workItemId: item.workItemId, status: item.status }),
      domain: item.stageId,
      summary: `${item.stageId.replaceAll('_', ' ')} evidence is ${item.status.replaceAll('_', ' ')} for ${item.chunkId ?? 'the whole source'}.`,
      blocking: true,
    }))
  if (!globalResult && !input.run.workItems.some((item) => item.stageId === 'global_reconciliation' && item.status === 'completed')) {
    missing.push({
      id: 'target-video-missing-evidence-whole-story-reconciliation',
      domain: 'story_structure',
      summary: 'Whole-story reconciliation has not completed, so technical samples cannot be presented as complete story understanding.',
      blocking: true,
    })
  }
  const completedWithoutOutput = input.run.workItems.filter((item) => (
    item.required
    && item.status === 'completed'
    && !['ingest_integrity', 'media_probe'].includes(item.stageId)
    && !outputByWorkItemId.has(item.workItemId)
  ))
  for (const item of completedWithoutOutput) {
    missing.push({
      id: stableId('target-video-missing-evidence', { workItemId: item.workItemId, reason: 'output_missing' }),
      domain: item.stageId,
      summary: `The completed ${item.stageId.replaceAll('_', ' ')} checkpoint lacks its exact private output record.`,
      blocking: true,
    })
  }
  return dedupeById(missing)
}

function createVisualOpportunities(
  globalResult: EditReferenceLongFormGlobalReconciliationResult | undefined,
  input: CreateTargetVideoUnderstandingPackageInput,
  evidenceIdByWorkItemId: ReadonlyMap<string, string>,
): TargetVideoUnderstandingVisualOpportunity[] {
  return patternsFor(globalResult, ['visual_language', 'broll_pattern', 'color_treatment', 'graphics_motion'])
    .map((pattern) => ({
      opportunityId: stableId('target-video-visual-opportunity', pattern),
      category: pattern.category as TargetVideoUnderstandingVisualOpportunity['category'],
      summary: pattern.summary,
      confidence: pattern.confidence,
      evidenceIds: evidenceIdsForPattern(pattern, input, evidenceIdByWorkItemId),
    }))
}

function createGraphicsNeeds(
  globalResult: EditReferenceLongFormGlobalReconciliationResult | undefined,
  input: CreateTargetVideoUnderstandingPackageInput,
  evidenceIdByWorkItemId: ReadonlyMap<string, string>,
): TargetVideoUnderstandingGraphicsNeed[] {
  return patternsFor(globalResult, ['graphics_motion']).map((pattern) => ({
    needId: stableId('target-video-graphics-need', pattern),
    summary: pattern.summary,
    confidence: pattern.confidence,
    evidenceIds: evidenceIdsForPattern(pattern, input, evidenceIdByWorkItemId),
  }))
}

function createCaptionRequirements(
  input: CreateTargetVideoUnderstandingPackageInput,
  transcripts: readonly EditReferenceLongFormStudyWorkOutput[],
  captionOutputs: readonly EditReferenceLongFormStudyWorkOutput[],
  globalResult: EditReferenceLongFormGlobalReconciliationResult | undefined,
  evidence: readonly TargetVideoUnderstandingEvidenceRecord[],
): TargetVideoUnderstandingPackage['captionRequirements'] {
  const analyzedCaptionOutputs = captionOutputs.filter((output) => output.result.kind === 'caption_ocr')
  const analyzedFrameCount = analyzedCaptionOutputs.reduce((sum, output) => (
    output.result.kind === 'caption_ocr' ? sum + output.result.analyzedFrameTimesSeconds.length : sum
  ), 0)
  const failedFrameCount = analyzedCaptionOutputs.reduce((sum, output) => (
    output.result.kind === 'caption_ocr' ? sum + output.result.failedFrameTimesSeconds.length : sum
  ), 0)
  const visibleTextObserved = analyzedCaptionOutputs.length === 0
    ? null
    : analyzedCaptionOutputs.some((output) => output.result.kind === 'caption_ocr' && output.result.framesWithVisibleText > 0)
  const speechPresent = transcriptSpeechPresent(transcripts)
  const directive = input.declaredContext.directives.captions
  const recommendation = directive === 'avoid'
    ? 'avoid'
    : directive === 'required'
      ? 'required'
      : speechPresent === null
        ? 'needs_clarification'
        : speechPresent
          ? 'recommended'
          : 'not_required'
  const semanticSummary = patternsFor(globalResult, ['caption_design']).map((pattern) => pattern.summary).join(' ')
  const reason = semanticSummary || (recommendation === 'recommended'
    ? 'Verified speech is present; readable target-authored captions are recommended and must follow the target transcript.'
    : recommendation === 'not_required'
      ? 'No speech was observed across the completed transcript coverage; do not invent dialogue captions.'
      : recommendation === 'avoid'
        ? 'The confirmed target directive excludes captions; retain only essential factual or accessibility text after review.'
        : recommendation === 'required'
          ? 'The confirmed target directive requires captions; wording and timing must come from target evidence.'
          : 'Transcript or caption evidence is incomplete, so caption requirements need clarification.')
  return {
    status: analyzedCaptionOutputs.length === input.plan.chunks.length && transcriptCoverageComplete(input, transcripts)
      ? globalResult ? 'analyzed' : 'pending'
      : 'pending',
    recommendation,
    visibleTextObserved,
    analyzedFrameCount,
    failedFrameCount,
    reason,
    evidenceIds: evidenceIdsForStages(evidence, ['speech_transcript', 'caption_ocr', 'semantic_chunk_synthesis', 'global_reconciliation']),
  }
}

function createRuntimeProvenance(
  evidence: readonly TargetVideoUnderstandingEvidenceRecord[],
  semanticOutputs: readonly EditReferenceLongFormStudyWorkOutput[],
  coverageResult: Extract<EditReferenceLongFormStudyWorkOutput['result'], { kind: 'coverage_qa' }> | undefined,
): Omit<TargetVideoUnderstandingPackage['runtimeProvenance'], 'completionAttestationDigestSha256'> {
  const semanticRuntimes = semanticOutputs.flatMap((output) => (
    output.result.kind === 'semantic_chunk_synthesis' ? [output.result.synthesisRuntime] : []
  ))
  return {
    runtimeSources: unique(evidence.map((record) => record.runtimeSource)),
    toolIds: unique(evidence.flatMap((record) => record.toolIds)),
    providerIds: unique(semanticRuntimes.flatMap((runtime) => runtime.providerId ? [runtime.providerId] : [])),
    modelIds: unique(semanticRuntimes.map((runtime) => runtime.modelId)),
    outputDigestsSha256: evidence.map((record) => record.outputDigestSha256),
    everyRequiredOutputVerified: coverageResult?.everyRequiredOutputVerified === true,
    everySemanticRuntimeAuthoritative: coverageResult?.everySemanticRuntimeAuthoritative === true,
    everyRequiredOutputCostAuthoritySatisfied: coverageResult?.everyRequiredOutputCostAuthoritySatisfied === true,
    coverageQaPassed: coverageResult?.qaPassed === true,
  }
}

function createConfidence(input: {
  readonly readyForPreferenceApplication: boolean
  readonly globalResult: EditReferenceLongFormGlobalReconciliationResult | undefined
  readonly transcripts: readonly EditReferenceLongFormStudyWorkOutput[]
  readonly captionOutputs: readonly EditReferenceLongFormStudyWorkOutput[]
  readonly colorOutputs: readonly EditReferenceLongFormStudyWorkOutput[]
  readonly semanticOutputs: readonly EditReferenceLongFormStudyWorkOutput[]
}): TargetVideoUnderstandingPackage['confidence'] {
  const patternConfidence = (categories: readonly EditReferenceLongFormGlobalPattern['category'][]) => {
    const values = patternsFor(input.globalResult, categories).map((pattern) => pattern.confidence)
    return rounded(values.length ? average(values) : input.globalResult ? 0.65 : 0)
  }
  const transcriptConfidence = input.transcripts.flatMap((output) => (
    output.result.kind === 'speech_transcript' ? [output.result.confidence] : []
  ))
  const captionConfidence = input.captionOutputs.flatMap((output) => (
    output.result.kind === 'caption_ocr' && output.result.textRegionCount > 0
      ? [output.result.averageRegionConfidence]
      : output.result.kind === 'caption_ocr' ? [1] : []
  ))
  const story = patternConfidence(['story_structure'])
  const visual = patternConfidence(['visual_language', 'broll_pattern'])
  const audio = rounded(transcriptConfidence.length ? average(transcriptConfidence) : 0)
  const captions = rounded(captionConfidence.length ? average(captionConfidence) : 0)
  const color = patternConfidence(['color_treatment']) || (input.colorOutputs.length ? 0.55 : 0)
  const graphics = patternConfidence(['graphics_motion'])
  const values = [story, visual, audio, captions, color, graphics].filter((value) => value > 0)
  return {
    overall: rounded(values.length ? average(values) : 0),
    story,
    visual,
    audio,
    captions,
    color,
    graphics,
    basis: input.readyForPreferenceApplication ? 'completed_authoritative_study' : 'partial_or_controlled_study',
  }
}

function isReadyForPreferenceApplication(
  input: CreateTargetVideoUnderstandingPackageInput,
  coverageResult: Extract<EditReferenceLongFormStudyWorkOutput['result'], { kind: 'coverage_qa' }> | undefined,
): boolean {
  return Boolean(
    input.run.state === 'completed'
    && input.run.completionAttestation
    && coverageResult?.qaPassed
    && coverageResult.fullyStudiedEligible
    && coverageResult.everyRequiredOutputVerified
    && coverageResult.everySemanticRuntimeAuthoritative
    && coverageResult.everyRequiredOutputCostAuthoritySatisfied,
  )
}

function packageStatus(
  run: EditReferenceLongFormStudyRunRecord,
  globalResult: EditReferenceLongFormGlobalReconciliationResult | undefined,
  ready: boolean,
): TargetVideoUnderstandingStatus {
  if (ready) return 'ready'
  if (run.state === 'cancelled') return 'cancelled'
  if (run.state === 'needs_operator_review') return 'needs_operator_review'
  if (globalResult) return 'review_required'
  return 'collecting'
}

function technicalSourceSummary(
  input: CreateTargetVideoUnderstandingPackageInput,
  temporalCoverageRatio: number,
): string {
  const minutes = rounded(input.plan.source.durationSeconds / 60)
  return `Verified private target video: ${minutes} minutes, ${input.plan.source.hasAudio ? 'audio present' : 'no audio stream'}, ${input.plan.chunks.length} planned analysis section${input.plan.chunks.length === 1 ? '' : 's'}, and ${Math.round(temporalCoverageRatio * 100)}% completed temporal coverage. Whole-story semantic reconciliation is pending.`
}

function audioQualitySummary(
  input: CreateTargetVideoUnderstandingPackageInput,
  globalResult: EditReferenceLongFormGlobalReconciliationResult | undefined,
  transcripts: readonly EditReferenceLongFormStudyWorkOutput[],
): string {
  if (!input.plan.source.hasAudio) return 'The verified target has no audio stream; speech pacing and sound quality are not applicable unless audio is added later.'
  const summaries = patternsFor(globalResult, ['speech_pacing', 'audio_sound_design']).map((pattern) => pattern.summary)
  if (summaries.length) return summaries.join(' ')
  if (transcriptCoverageComplete(input, transcripts)) {
    return 'Continuous transcript coverage is verified, but whole-source semantic audio-quality reconciliation is still pending.'
  }
  return 'Audio extraction or transcript coverage is still pending; do not infer speech quality, pauses, music, ambience, or sound-design needs yet.'
}

function audioEvidenceStatus(
  input: CreateTargetVideoUnderstandingPackageInput,
  transcripts: readonly EditReferenceLongFormStudyWorkOutput[],
  globalResult: EditReferenceLongFormGlobalReconciliationResult | undefined,
): TargetVideoUnderstandingEvidenceStatus {
  if (!input.plan.source.hasAudio) return 'not_applicable'
  if (!transcriptCoverageComplete(input, transcripts)) return 'pending'
  return globalResult ? 'analyzed' : 'pending'
}

function transcriptSpeechPresent(outputs: readonly EditReferenceLongFormStudyWorkOutput[]): boolean | null {
  if (!outputs.length) return null
  return outputs.some((output) => output.result.kind === 'speech_transcript' && output.result.speechPresent)
}

function inferSourceMode(
  durationSeconds: number,
  hasAudio: boolean,
  speechPresent: boolean | null,
  wordCount: number,
): TargetVideoUnderstandingPackage['audioState']['sourceMode'] {
  if (!hasAudio || speechPresent === false) return 'silent_visual'
  if (speechPresent === null) return 'mixed'
  const wordsPerMinuteAcrossSource = wordCount / Math.max(durationSeconds / 60, 0.001)
  return wordsPerMinuteAcrossSource >= 35 ? 'voice_first' : 'mixed'
}

function transcriptCoverageComplete(
  input: CreateTargetVideoUnderstandingPackageInput,
  transcripts: readonly EditReferenceLongFormStudyWorkOutput[],
): boolean {
  if (!input.plan.source.hasAudio) return true
  return transcripts.length === input.plan.chunks.length
    && transcripts.every((output) => output.result.kind === 'speech_transcript' && output.result.fullCoreCoverage)
}

function completedAudioCoverage(
  input: CreateTargetVideoUnderstandingPackageInput,
  transcripts: readonly EditReferenceLongFormStudyWorkOutput[],
): 0 | 1 {
  if (!input.plan.source.hasAudio) return 0
  return transcriptCoverageComplete(input, transcripts) ? 1 : 0
}

function transcriptWordTimingMode(
  input: CreateTargetVideoUnderstandingPackageInput,
  transcripts: readonly EditReferenceLongFormStudyWorkOutput[],
): TargetVideoUnderstandingPackage['audioState']['wordTimingMode'] {
  if (!transcriptCoverageComplete(input, transcripts)) return 'pending'
  return transcripts.every((output) => output.result.kind === 'speech_transcript' && output.result.wordTimingMode === 'exact')
    ? 'exact'
    : 'not_available'
}

function patternsFor(
  result: EditReferenceLongFormGlobalReconciliationResult | undefined,
  categories: readonly EditReferenceLongFormGlobalPattern['category'][],
): EditReferenceLongFormGlobalPattern[] {
  return result?.globalPatterns.filter((pattern) => categories.includes(pattern.category)) ?? []
}

function evidenceIdsForPattern(
  pattern: EditReferenceLongFormGlobalPattern,
  input: CreateTargetVideoUnderstandingPackageInput,
  evidenceIdByWorkItemId: ReadonlyMap<string, string>,
): string[] {
  return pattern.evidenceChunkIds.flatMap((chunkId) => {
    const item = input.run.workItems.find((candidate) => (
      candidate.stageId === 'semantic_chunk_synthesis' && candidate.chunkId === chunkId
    ))
    const id = item ? evidenceIdByWorkItemId.get(item.workItemId) : undefined
    return id ? [id] : []
  })
}

function evidenceIdsForStages(
  evidence: readonly TargetVideoUnderstandingEvidenceRecord[],
  stageIds: readonly string[],
): string[] {
  return evidence.filter((record) => stageIds.includes(record.stageId)).map((record) => record.evidenceId)
}

function outputForStage(
  outputs: ReadonlyMap<string, EditReferenceLongFormStudyWorkOutput>,
  stageId: string,
): EditReferenceLongFormStudyWorkOutput | undefined {
  return [...outputs.values()].find((output) => output.stageId === stageId)
}

function outputsForStage(
  outputs: ReadonlyMap<string, EditReferenceLongFormStudyWorkOutput>,
  stageId: string,
): EditReferenceLongFormStudyWorkOutput[] {
  return [...outputs.values()].filter((output) => output.stageId === stageId)
}

function coversWholeSource(
  items: readonly EditReferenceLongFormStudyRunRecord['workItems'][number][],
  durationSeconds: number,
): boolean {
  const ordered = [...items].sort((left, right) => left.sourceCoverageStartSeconds - right.sourceCoverageStartSeconds)
  let cursor = 0
  for (const item of ordered) {
    if (item.sourceCoverageStartSeconds > cursor + 0.001) return false
    cursor = Math.max(cursor, item.sourceCoverageEndSeconds)
  }
  return Math.abs(cursor - durationSeconds) <= 0.001
}

function validateEvidenceRecord(record: TargetVideoUnderstandingEvidenceRecord): void {
  assertId(record.evidenceId, 'target evidence id')
  assertId(record.workItemId, 'target work item id')
  assertSha256(record.outputDigestSha256, 'target evidence output digest')
  if (
    !Number.isFinite(record.sourceCoverageStartSeconds)
    || record.sourceCoverageStartSeconds < 0
    || !Number.isFinite(record.sourceCoverageEndSeconds)
    || record.sourceCoverageEndSeconds <= record.sourceCoverageStartSeconds
    || !['verified_local', 'verified_live', 'verified_mock', 'not_run'].includes(record.runtimeSource)
    || !['authoritative', 'controlled_mock', 'incomplete'].includes(record.completionAuthority)
  ) throw new Error('Target-video evidence coverage or runtime is invalid.')
}

function validateSkillRun(skillRun: TargetVideoUnderstandingSkillRun, evidenceIds: readonly string[]): void {
  assertId(skillRun.skillRunId, 'target skill run id')
  assertId(skillRun.skillId, 'target skill id')
  if (
    !['pending', 'analyzed', 'not_applicable', 'blocked'].includes(skillRun.status)
    || !validConfidence(skillRun.confidence)
    || skillRun.evidenceIds.some((id) => !evidenceIds.includes(id))
    || skillRun.runtimeSources.some((source) => !['verified_local', 'verified_live', 'verified_mock', 'not_run'].includes(source))
  ) throw new Error('Target-video skill-run authority is invalid.')
}

function validateConfidence(confidence: TargetVideoUnderstandingPackage['confidence']): void {
  if ([
    confidence.overall,
    confidence.story,
    confidence.visual,
    confidence.audio,
    confidence.captions,
    confidence.color,
    confidence.graphics,
  ].some((value) => !validConfidence(value))) throw new Error('Target-video confidence is invalid.')
}

function findForbiddenKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(findForbiddenKey)
  if (!value || typeof value !== 'object') return false
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (/^(localFilePath|signedUrl|rawTranscript|rawFrameBytes|rawProviderPayload|providerPayload|secret|apiKey)$/i.test(key)) {
      if (child !== false && child !== null && child !== undefined) return true
    }
    if (findForbiddenKey(child)) return true
  }
  return false
}

function dedupeById<T extends { id: string }>(values: readonly T[]): T[] {
  return [...new Map(values.map((value) => [value.id, value])).values()]
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)]
}

function average(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)
}

function rounded(value: number): number {
  return Number(value.toFixed(4))
}

function validConfidence(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1
}

function stableId(prefix: string, value: unknown): string {
  return `${prefix}-${sha256(stableStringify(value)).slice(0, 24)}`
}

function stableUuid(value: unknown): string {
  const hex = sha256(stableStringify(value))
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

function assertId(value: string, label: string): void {
  if (!ID_PATTERN.test(value)) throw new Error(`Target-video ${label} is invalid.`)
}

function assertSha256(value: string, label: string): void {
  if (!SHA256_PATTERN.test(value)) throw new Error(`Target-video ${label} is invalid.`)
}

function assertIso(value: string, label: string): void {
  if (!Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`Target-video ${label} is invalid.`)
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`
}
