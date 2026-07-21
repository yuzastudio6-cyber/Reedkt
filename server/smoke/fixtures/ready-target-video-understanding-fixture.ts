import { createHash } from 'node:crypto'
import type {
  PreferenceApplicationTargetContextSnapshot,
} from '../../../src/types/edit-reference'
import type {
  TargetVideoUnderstandingEvidenceRecord,
  TargetVideoUnderstandingPackage,
} from '../../../src/types/edit-reference-target-video-understanding'
import {
  TARGET_VIDEO_UNDERSTANDING_PACKAGE_VERSION,
} from '../../../src/types/edit-reference-target-video-understanding'
import {
  calculateTargetVideoUnderstandingDeclaredContextDigest,
  calculateTargetVideoUnderstandingPackageDigest,
  validateTargetVideoUnderstandingPackage,
} from '../../edit-references/edit-reference-target-video-understanding-contract'
import {
  PrivateTargetVideoUnderstandingRepository,
} from '../../edit-references/private-target-video-understanding-repository'

export interface PersistReadyTargetVideoUnderstandingFixtureInput {
  readonly localStorageRoot: string
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly targetContext: PreferenceApplicationTargetContextSnapshot
  readonly fixtureKey: string
  readonly durationSeconds?: number
  readonly sourceBinding?: {
    readonly storageObjectRecordId: string
    readonly mediaAssetId: string
    readonly checksumSha256: string
    readonly sizeBytes: number
    readonly mimeType: string
  }
  readonly editBriefBinding?: {
    readonly id: string
    readonly revision: number
    readonly digestSha256: string
  }
  readonly omitVisualOpportunityCategories?: readonly TargetVideoUnderstandingPackage['visualOpportunities'][number]['category'][]
  readonly omitGraphicsNeeds?: boolean
}

export async function persistReadyTargetVideoUnderstandingFixture(
  input: PersistReadyTargetVideoUnderstandingFixtureInput,
): Promise<TargetVideoUnderstandingPackage> {
  const packageRecord = createReadyTargetVideoUnderstandingFixture(input)
  await new PrivateTargetVideoUnderstandingRepository().save({
    scope: {
      localStorageRoot: input.localStorageRoot,
      ownerUserId: input.ownerUserId,
      workspaceId: input.workspaceId,
    },
    package: packageRecord,
  })
  return packageRecord
}

export function createReadyTargetVideoUnderstandingFixture(
  input: Omit<PersistReadyTargetVideoUnderstandingFixtureInput, 'localStorageRoot' | 'ownerUserId'>,
): TargetVideoUnderstandingPackage {
  const durationSeconds = input.durationSeconds ?? 120
  const now = '2026-07-16T12:00:00.000Z'
  const key = normalizedKey(input.fixtureKey)
  const evidence = createEvidence(key, durationSeconds)
  const sourceBinding = input.sourceBinding ?? {
    storageObjectRecordId: `${key}-source-object`,
    mediaAssetId: `${key}-media-asset`,
    checksumSha256: sha256(`${key}:source-media`),
    sizeBytes: 10 * 1024 * 1024,
    mimeType: 'video/mp4',
  }
  const editBriefBinding = input.editBriefBinding ?? {
    id: `${key}-edit-brief`,
    revision: 1,
    digestSha256: sha256(`${key}:edit-brief`),
  }
  const evidenceIds = evidence.map((record) => record.evidenceId)
  const evidenceFor = (stageId: string) => evidence
    .filter((record) => record.stageId === stageId)
    .map((record) => record.evidenceId)
  const declaredContextWithoutDigest = {
    projectName: input.targetContext.projectName,
    editName: input.targetContext.editName,
    contentType: input.targetContext.contentType,
    currentUserInstruction: input.targetContext.currentUserInstruction,
    selectedEditLevel: input.targetContext.selectedEditLevel,
    aspectRatio: input.targetContext.aspectRatio,
    outputFrameConfirmed: true as const,
    platformTarget: input.targetContext.platformTarget,
    storyRole: input.targetContext.storyRole,
    budgetPreference: input.targetContext.budgetPreference,
    directives: structuredClone(input.targetContext.directives),
    approvedConstraints: [...input.targetContext.approvedConstraints],
    editBriefId: editBriefBinding.id,
    editBriefRevision: editBriefBinding.revision,
    editBriefDigestSha256: editBriefBinding.digestSha256,
  }
  const hasAudio = input.targetContext.sourceMode !== 'silent_visual'
  const speechPresent = input.targetContext.sourceMode !== 'silent_visual'
  const visualOpportunities: TargetVideoUnderstandingPackage['visualOpportunities'] = [
    {
      opportunityId: `${key}-visual-opportunity`,
      category: 'visual_language',
      summary: `Use only target-owned visual evidence to support ${input.targetContext.storyRole}.`,
      confidence: 0.93,
      evidenceIds: evidenceFor('visual_sampling'),
    },
    {
      opportunityId: `${key}-broll-opportunity`,
      category: 'broll_pattern',
      summary: 'Select target B-roll only when it clarifies the target story.',
      confidence: 0.92,
      evidenceIds: evidenceFor('visual_sampling'),
    },
  ]
  const unsigned: Omit<TargetVideoUnderstandingPackage, 'packageDigestSha256'> = {
    schemaVersion: TARGET_VIDEO_UNDERSTANDING_PACKAGE_VERSION,
    packageId: `target-video-understanding-${sha256(`${key}:package`).slice(0, 24)}`,
    workspaceId: input.workspaceId,
    projectId: input.targetContext.projectId,
    editSessionId: input.targetContext.editSessionId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    status: 'ready',
    source: {
      storageObjectRecordId: sourceBinding.storageObjectRecordId,
      mediaAssetId: sourceBinding.mediaAssetId,
      checksumSha256: sourceBinding.checksumSha256,
      sizeBytes: sourceBinding.sizeBytes,
      durationSeconds,
      mimeType: sourceBinding.mimeType,
      hasAudio,
      originalRemainsImmutable: true,
      uploadTransport: 'resumable_recommended',
      analysisProxyProfile: 'reeditpro-analysis-proxy-v1',
      analysisProxyMaxWidth: 1280,
      analysisProxyMaxHeight: 1280,
      analysisProxyMaxFrameRate: 30,
      studyAudioSampleRate: 16000,
      studyAudioChannels: 1,
    },
    declaredContext: {
      ...declaredContextWithoutDigest,
      contextDigestSha256: calculateTargetVideoUnderstandingDeclaredContextDigest(declaredContextWithoutDigest),
    },
    study: {
      runId: `${key}-target-study-run`,
      runRevision: 1,
      planId: `${key}-target-study-plan`,
      planDigestSha256: sha256(`${key}:target-study-plan`),
      state: 'completed',
      durationClass: durationSeconds > 3_600 ? 'extended' : durationSeconds > 900 ? 'long' : durationSeconds > 180 ? 'standard' : 'short',
      chunkCount: Math.max(1, Math.ceil(durationSeconds / 600)),
      coreChunkDurationSeconds: 600,
      maximumSemanticWindowSeconds: 120,
      completedWorkItemCount: evidence.length,
      totalWorkItemCount: evidence.length,
      progressPercent: 100,
      temporalCoverageRatio: 1,
      continuousAudioCoverageRatio: 1,
      etaLowerRemainingSeconds: 0,
      etaUpperRemainingSeconds: 0,
      etaConfidence: 'observed_medium',
      wholeStudyMayRunForMinutesOrHours: true,
      browserSessionRequiredForCompletion: false,
      fixedWholeStudyWallClockTimeoutApplied: false,
      checkpointAfterEveryWorkItem: true,
      restartResumeRequired: true,
      partialSamplingCannotClaimFullyStudied: true,
    },
    evidenceIds,
    evidence,
    skillRuns: evidence.map((record) => ({
      skillRunId: `${record.workItemId}-skill-run`,
      skillId: `target_video.${record.stageId}`,
      stageId: record.stageId,
      status: 'analyzed',
      runtimeSources: ['verified_live'],
      evidenceIds: [record.evidenceId],
      confidence: 0.94,
      fullTemporalCoverage: true,
      limitationIds: [],
    })),
    confidence: {
      overall: 0.94,
      story: 0.95,
      visual: 0.93,
      audio: 0.94,
      captions: 0.92,
      color: 0.93,
      graphics: 0.91,
      basis: 'completed_authoritative_study',
    },
    sourceSummary: input.targetContext.sourceSummary,
    storyStructure: {
      status: 'analyzed',
      summary: `Authoritative fixture evidence studied the complete target source for “${input.targetContext.editName}.”`,
      observedPatterns: [input.targetContext.storyRole],
      technicalSceneBoundaryCandidateCount: 4,
      evidenceIds: evidenceFor('global_reconciliation'),
    },
    visualOpportunities: visualOpportunities.filter((opportunity) => (
      !input.omitVisualOpportunityCategories?.includes(opportunity.category)
    )),
    audioState: {
      status: 'analyzed',
      hasAudio,
      speechPresent,
      sourceMode: input.targetContext.sourceMode,
      transcriptSegmentCount: speechPresent ? 12 : 0,
      transcriptWordCount: speechPresent ? 420 : 0,
      languageCodes: speechPresent ? ['en'] : [],
      wordTimingMode: speechPresent ? 'exact' : 'not_available',
      continuousCoverage: true,
      qualitySummary: speechPresent
        ? 'Continuous target speech coverage is available with exact target timing.'
        : 'The complete target source was verified without speech.',
      evidenceIds: evidenceFor('speech_transcript'),
    },
    captionRequirements: {
      status: 'analyzed',
      recommendation: input.targetContext.directives.captions === 'required'
        ? 'required'
        : input.targetContext.directives.captions === 'avoid'
          ? 'avoid'
          : speechPresent ? 'recommended' : 'not_required',
      visibleTextObserved: true,
      analyzedFrameCount: 24,
      failedFrameCount: 0,
      reason: 'Caption requirements were derived from the full target transcript and visible-text study.',
      evidenceIds: evidenceFor('caption_ocr'),
    },
    colorState: {
      status: 'analyzed',
      summary: 'Target color continuity and correction needs were studied across the complete source.',
      technicalSectionCount: 1,
      evidenceIds: evidenceFor('color_motion_signals'),
    },
    graphicsNeeds: input.omitGraphicsNeeds ? [] : [{
      needId: `${key}-graphics-need`,
      summary: 'Use original target-authored labels and graphics only where the target evidence requires explanation.',
      confidence: 0.91,
      evidenceIds: evidenceFor('graphics_motion'),
    }],
    limitations: [],
    missingEvidence: [],
    runtimeProvenance: {
      runtimeSources: ['verified_live'],
      toolIds: [...new Set(evidence.flatMap((record) => record.toolIds))],
      providerIds: ['controlled-authoritative-fixture-provider'],
      modelIds: ['controlled-authoritative-fixture-model'],
      outputDigestsSha256: evidence.map((record) => record.outputDigestSha256),
      completionAttestationDigestSha256: sha256(`${key}:completion-attestation`),
      everyRequiredOutputVerified: true,
      everySemanticRuntimeAuthoritative: true,
      everyRequiredOutputCostAuthoritySatisfied: true,
      coverageQaPassed: true,
    },
    readyForPreferenceApplication: true,
    callerSourceSummaryUsedAsStudyEvidence: false,
    rawTranscriptPersisted: false,
    rawFrameBytesPersisted: false,
    rawProviderPayloadPersisted: false,
    signedUrlPersisted: false,
    localFilePathPersisted: false,
    providerCallMade: true,
    modelCallMade: true,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    remoteMutationMade: false,
    createdAt: now,
    updatedAt: now,
  }
  const packageRecord: TargetVideoUnderstandingPackage = {
    ...unsigned,
    packageDigestSha256: calculateTargetVideoUnderstandingPackageDigest(unsigned),
  }
  validateTargetVideoUnderstandingPackage(packageRecord)
  return packageRecord
}

export function targetUnderstandingRequestFields(packageRecord: TargetVideoUnderstandingPackage) {
  return {
    targetUnderstandingPackageId: packageRecord.packageId,
    targetUnderstandingPackageDigestSha256: packageRecord.packageDigestSha256,
    targetUnderstandingSourceStorageObjectRecordId: packageRecord.source.storageObjectRecordId,
    targetUnderstandingSourceMediaAssetId: packageRecord.source.mediaAssetId,
    targetUnderstandingEditBriefDigestSha256: packageRecord.declaredContext.editBriefDigestSha256,
  }
}

function createEvidence(key: string, durationSeconds: number): TargetVideoUnderstandingEvidenceRecord[] {
  return [
    'global_reconciliation',
    'visual_sampling',
    'speech_transcript',
    'caption_ocr',
    'color_motion_signals',
    'graphics_motion',
    'coverage_qa',
  ].map((stageId) => ({
    evidenceId: `${key}-${stageId}-evidence`,
    workItemId: `${key}-${stageId}-work-item`,
    stageId,
    chunkId: null,
    sourceCoverageStartSeconds: 0,
    sourceCoverageEndSeconds: durationSeconds,
    outputDigestSha256: sha256(`${key}:${stageId}:output`),
    runtimeSource: 'verified_live',
    completionAuthority: 'authoritative',
    toolIds: [`controlled_${stageId}_fixture`],
  }))
}

function normalizedKey(value: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9._:-]+/g, '-').replace(/^-+|-+$/g, '')
  return normalized.slice(0, 80) || 'target-understanding-fixture'
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
