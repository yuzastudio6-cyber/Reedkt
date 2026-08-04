import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type {
  EditReferenceRecord,
  PreferenceAssetRecord,
  PreferenceEvidenceRecord,
  PreferenceSkillRunRecord,
  PreferenceStudySessionRecord,
} from '../../src/types/edit-reference'
import { EDIT_REFERENCE_SAFETY_FLAGS } from '../../src/types/edit-reference'
import {
  EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_VERSION,
  type EditReferenceLongFormStudyReviewFindingData,
  type EditReferenceLongFormStudyReviewDecision,
} from '../../src/types/edit-reference-long-form-review'
import { loadRuntimeEnv } from '../config/env'
import { createPreferenceLongFormStudySummary } from '../edit-references/edit-reference-long-form-study-binding'
import {
  createEditReferenceLongFormSemanticWindowCheckpoint,
  deriveEditReferenceLongFormSemanticWindowSubmissionKey,
  type EditReferenceLongFormSemanticWindowCheckpoint,
} from '../edit-references/edit-reference-long-form-semantic-window-checkpoint'
import { createEditReferenceLongFormSemanticWindowPlan } from '../edit-references/edit-reference-long-form-semantic-window-contract'
import {
  EDIT_REFERENCE_SEMANTIC_SPECIALISTS,
  EDIT_REFERENCE_SEMANTIC_STUDY_RESULT_VERSION,
  type EditReferenceSemanticSpecialistId,
  type EditReferenceSemanticStudyResult,
} from '../edit-references/edit-reference-semantic-study-contract'
import {
  claimEditReferenceLongFormStudyWork,
  completeEditReferenceLongFormStudyWork,
  createEditReferenceLongFormStudyPlan,
  createEditReferenceLongFormStudyRun,
  type EditReferenceLongFormStudyPlan,
  type EditReferenceLongFormStudyRunRecord,
} from '../edit-references/edit-reference-long-form-study-contract'
import type { EditReferenceLongFormStudyWorkOutput } from '../edit-references/edit-reference-long-form-study-work-output'
import type {
  EditReferenceAuditEvent,
  EditReferenceMutationContext,
  EditReferenceRepositoryScope,
} from '../edit-references/edit-reference-repository'
import { PrivateEditReferenceLongFormStudyRepository } from '../edit-references/private-edit-reference-long-form-study-repository'
import {
  clearEditReferenceRepositoryProcessStateForSmoke,
  PrivateEditReferenceRepository,
} from '../edit-references/private-edit-reference-repository'
import { createEditReferenceService } from '../services/edit-reference-service'
import type { ServiceContext } from '../types'

const createdAt = '2026-07-20T20:00:00.000Z'

const localStorageRoot = await mkdtemp(path.join(tmpdir(), 'reeditpro-long-form-review-service-'))
try {
  const fixture = createServiceFixture()
  const ownerUserId = 'owner-long-form-review-service'
  const scope: EditReferenceRepositoryScope = {
    localStorageRoot,
    ownerUserId,
    workspaceId: fixture.plan.workspaceId,
  }
  const repository = new PrivateEditReferenceRepository()
  await seedAggregate(repository, scope, fixture)
  const longFormRepository = fakeLongFormRepository(fixture)
  const service = createEditReferenceService(
    serviceContext(localStorageRoot, ownerUserId),
    repository,
    { longFormStudyRepository: longFormRepository },
  )

  const initial = await service.getLongFormStudyReview(
    fixture.plan.workspaceId,
    fixture.plan.studySessionId,
    fixture.asset.id,
  )
  assert.equal(initial.data.reviewAuthority, 'controlled_review_only')
  assert.equal(initial.data.findings.length, 7)
  assert.equal(initial.data.findings.every((finding: EditReferenceLongFormStudyReviewFindingData) => finding.requiresUserSelection), true)
  assert.equal(initial.data.selection.status, 'needs_selection')
  assert.equal(initial.data.boundaries.automaticPreferenceDnaCreationAllowed, false)
  assert.equal(initial.data.boundaries.automaticPreferenceApplicationAllowed, false)
  assert.equal(initial.data.boundaries.approvedSnapshotMutationAllowed, false)
  assert.equal(initial.data.boundaries.planOrEstimateMutationAllowed, false)
  assert.equal(initial.data.boundaries.productionReady, false)
  assert.equal(initial.data.persistence, 'backend_local_private_segmented')
  assert.equal(initial.data.productionPersistence, 'blocked_by_migration_baseline')

  const decisions = initial.data.findings.map<EditReferenceLongFormStudyReviewDecision>((finding: EditReferenceLongFormStudyReviewFindingData) => ({
    schemaVersion: EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_VERSION,
    findingId: finding.findingId,
    decision: 'adapt',
  }))
  await assert.rejects(
    service.applyLongFormStudyReview(fixture.plan.studySessionId, fixture.asset.id, {
      workspaceId: fixture.plan.workspaceId,
      expectedStudyRevision: initial.data.studyRevision,
      expectedReviewPackageDigestSha256: initial.data.reviewPackageDigestSha256,
      decisions,
      acknowledgeAdaptNotCopy: false,
      acknowledgeFactSafetyReview: true,
    }, 'review-service-missing-adapt-ack'),
    /adapt-not-copy acknowledgement/i,
  )
  await assert.rejects(
    service.applyLongFormStudyReview(fixture.plan.studySessionId, fixture.asset.id, {
      workspaceId: fixture.plan.workspaceId,
      expectedStudyRevision: initial.data.studyRevision,
      expectedReviewPackageDigestSha256: 'f'.repeat(64),
      decisions,
      acknowledgeAdaptNotCopy: true,
      acknowledgeFactSafetyReview: true,
    }, 'review-service-stale-package'),
    /study changed before your review was saved/i,
  )

  const applied = await service.applyLongFormStudyReview(fixture.plan.studySessionId, fixture.asset.id, {
    workspaceId: fixture.plan.workspaceId,
    expectedStudyRevision: initial.data.studyRevision,
    expectedReviewPackageDigestSha256: initial.data.reviewPackageDigestSha256,
    decisions,
    acknowledgeAdaptNotCopy: true,
    acknowledgeFactSafetyReview: true,
  }, 'review-service-apply')
  assert.equal(applied.data.review.selection.status, 'selected')
  assert.equal(applied.data.review.selection.adaptedFindingCount, 7)
  assert.equal(applied.data.detail.detail.study.status, 'evidence_ready')
  assert.equal(applied.data.detail.detail.evidence.filter((record: PreferenceEvidenceRecord) => (
    record.sourceType === 'derived_skill_evidence'
    && record.provenance.skillIds.some((skillId: string) => (
      skillId.startsWith('edit_reference.long_form.review_selection.')
    ))
  )).length, 7)
  assert.equal(applied.data.detail.detail.skillRuns.filter((record: PreferenceSkillRunRecord) => (
    record.skillId.startsWith('edit_reference.long_form.review_selection.')
  )).length, 7)
  assert.equal(applied.data.detail.detail.dnaVersions.length, 0)
  assert.equal(applied.data.detail.detail.applications.length, 0)

  const replay = await service.applyLongFormStudyReview(fixture.plan.studySessionId, fixture.asset.id, {
    workspaceId: fixture.plan.workspaceId,
    expectedStudyRevision: initial.data.studyRevision,
    expectedReviewPackageDigestSha256: initial.data.reviewPackageDigestSha256,
    decisions,
    acknowledgeAdaptNotCopy: true,
    acknowledgeFactSafetyReview: true,
  }, 'review-service-apply')
  assert.equal(replay.replayed, true)
  assert.equal(replay.data.detail.detail.evidence.length, applied.data.detail.detail.evidence.length)

  const changedDecisions = decisions.map((decision: EditReferenceLongFormStudyReviewDecision, index: number) => index === 0
    ? { ...decision, decision: 'context_only' as const }
    : decision)
  await assert.rejects(
    service.applyLongFormStudyReview(fixture.plan.studySessionId, fixture.asset.id, {
      workspaceId: fixture.plan.workspaceId,
      expectedStudyRevision: applied.data.review.studyRevision,
      expectedReviewPackageDigestSha256: initial.data.reviewPackageDigestSha256,
      decisions: changedDecisions,
      acknowledgeAdaptNotCopy: true,
      acknowledgeFactSafetyReview: true,
    }, 'review-service-change-saved-selection'),
    /already saved/i,
  )

  clearEditReferenceRepositoryProcessStateForSmoke()
  const restartedRepository = new PrivateEditReferenceRepository()
  const restarted = createEditReferenceService(
    serviceContext(localStorageRoot, ownerUserId),
    restartedRepository,
    { longFormStudyRepository: longFormRepository },
  )
  const recovered = await restarted.getLongFormStudyReview(
    fixture.plan.workspaceId,
    fixture.plan.studySessionId,
    fixture.asset.id,
  )
  assert.equal(recovered.data.selection.status, 'selected')
  assert.deepEqual(recovered.data.selection.decisions, decisions)
  const audit = await restartedRepository.readAuditEvents(scope)
  assert.equal(audit.some((event: EditReferenceAuditEvent) => event.eventType === 'preference_long_form_review_selection_saved'), true)

  await assert.rejects(
    restarted.getLongFormStudyReview(
      'workspace-long-form-review-foreign',
      fixture.plan.studySessionId,
      fixture.asset.id,
    ),
    /Preference Study was not found/i,
  )
  const serialized = JSON.stringify(recovered.data)
  for (const forbidden of [
    localStorageRoot,
    '"signedUrl":',
    '"rawTranscript":',
    '"providerPayload":',
    '"authorization":',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `Review API data leaked ${forbidden}.`)
  }

  process.stdout.write(`${JSON.stringify({
    status: 'passed',
    smoke: 'edit-reference-long-form-review-service',
    authenticatedOwnerContextRequired: true,
    exactWorkspaceStudyAssetBinding: true,
    sevenFindingReadContract: true,
    explicitSelectionRequired: true,
    stalePackageRejected: true,
    adaptNotCopyAcknowledgementRequired: true,
    durableSelectionRecovered: true,
    changedSelectionRejected: true,
    tenantIsolation: true,
    dedicatedAuditEventPersisted: true,
    preferenceDnaCreated: false,
    preferenceApplied: false,
    approvedSnapshotMutated: false,
    planOrEstimateMutated: false,
    providerCallMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    productionReady: false,
  })}\n`)
} finally {
  clearEditReferenceRepositoryProcessStateForSmoke()
  await rm(localStorageRoot, { recursive: true, force: true })
}

interface ServiceFixture {
  readonly plan: EditReferenceLongFormStudyPlan
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly sourceEvidence: PreferenceEvidenceRecord
  readonly asset: PreferenceAssetRecord
  readonly workOutputs: ReadonlyMap<string, EditReferenceLongFormStudyWorkOutput>
  readonly checkpoints: ReadonlyMap<string, EditReferenceLongFormSemanticWindowCheckpoint>
}

function createServiceFixture(): ServiceFixture {
  const plan = createEditReferenceLongFormStudyPlan({
    workspaceId: 'workspace-long-form-review-service',
    editReferenceId: 'edit-reference-long-form-review-service',
    studySessionId: 'study-long-form-review-service',
    source: {
      privateMediaArtifactId: 'private-media-long-form-review-service',
      mediaChecksumSha256: sha256('media:long-form-review-service'),
      durationSeconds: 600,
      sizeBytes: 4_000_000,
      mimeType: 'video/mp4',
      hasAudio: true,
    },
    includeCaptionOcr: true,
    createdAt,
  })
  const run = completeThroughSemanticWork(plan, createEditReferenceLongFormStudyRun({
    runId: 'run-long-form-review-service',
    plan,
    createdAt,
  }))
  const workOutputs = new Map<string, EditReferenceLongFormStudyWorkOutput>()
  const checkpoints = new Map<string, EditReferenceLongFormSemanticWindowCheckpoint>()

  for (const chunk of plan.chunks) {
    const visualWorkItem = run.workItems.find((item: EditReferenceLongFormStudyRunRecord['workItems'][number]) => item.chunkId === chunk.chunkId && item.stageId === 'visual_sampling')
    const sceneWorkItem = run.workItems.find((item: EditReferenceLongFormStudyRunRecord['workItems'][number]) => item.chunkId === chunk.chunkId && item.stageId === 'scene_boundary_scan')
    const semanticWorkItem = run.workItems.find((item: EditReferenceLongFormStudyRunRecord['workItems'][number]) => item.chunkId === chunk.chunkId && item.stageId === 'semantic_chunk_synthesis')
    assert(visualWorkItem && sceneWorkItem && semanticWorkItem)
    const dependencies = dependencyOutputs(plan, run.runId, chunk.chunkId, chunk.coreStartSeconds, chunk.coreEndSeconds, chunk.minimumVisualSampleCount, visualWorkItem.workItemId, sceneWorkItem.workItemId)
    workOutputs.set(visualWorkItem.workItemId, dependencies.visual)
    workOutputs.set(sceneWorkItem.workItemId, dependencies.scene)
    const semanticWindowPlan = createEditReferenceLongFormSemanticWindowPlan({
      plan,
      chunkId: chunk.chunkId,
      visualSamplingOutput: dependencies.visual,
      sceneBoundaryOutput: dependencies.scene,
    })
    for (const window of semanticWindowPlan.windows) {
      for (const specialist of EDIT_REFERENCE_SEMANTIC_SPECIALISTS) {
        const requestDigestSha256 = sha256(`${window.semanticWindowId}:${specialist.specialistId}:request`)
        const checkpoint = createEditReferenceLongFormSemanticWindowCheckpoint({
          executionScope: 'controlled_test',
          runId: run.runId,
          plan,
          workItem: semanticWorkItem,
          semanticWindowPlan,
          window,
          specialistId: specialist.specialistId,
          requestDigestSha256,
          semanticResult: semanticResult(specialist.specialistId, window.ordinal),
          evidenceOutputDigestsSha256: [dependencies.visual.outputDigestSha256, dependencies.scene.outputDigestSha256],
          attempt: controlledAttempt({
            runId: run.runId,
            workItemId: semanticWorkItem.workItemId,
            semanticWindowPlanDigestSha256: semanticWindowPlan.semanticWindowPlanDigestSha256,
            semanticWindowId: window.semanticWindowId,
            specialistId: specialist.specialistId,
            requestDigestSha256,
          }),
          createdAt,
        })
        checkpoints.set(checkpointKey(
          semanticWorkItem.workItemId,
          window.semanticWindowId,
          specialist.specialistId,
        ), checkpoint)
      }
    }
  }

  const sourceEvidence: PreferenceEvidenceRecord = {
    id: 'evidence-long-form-review-service',
    workspaceId: plan.workspaceId,
    editReferenceId: plan.editReferenceId,
    studySessionId: plan.studySessionId,
    sourceType: 'reference_video_metadata',
    category: 'all_goals',
    title: 'Private reference video',
    summary: 'A private reference supplied for generalized editing-preference study.',
    revision: 1,
    confidence: 1,
    confidenceBasis: 'metadata_verified',
    transferability: 'requires_user_review',
    mediaMetadata: { durationSeconds: 600, width: 1920, height: 1080, hasAudio: true, orientation: 'landscape' },
    provenance: {
      runtimeSource: 'user_input',
      sourceEvidenceIds: [],
      privateAssetId: plan.source.privateMediaArtifactId,
      sourceLabel: 'Private reference video',
      rightsBasis: 'user_owned',
      mediaStudyStatus: 'media_studied_local_partial',
      toolIds: [],
      skillIds: [],
      fallbackUsed: false,
      notes: ['Original media remains private and immutable.'],
    },
    createdAt,
    updatedAt: createdAt,
  }
  const assetId = 'preference-asset-long-form-review-service'
  const asset: PreferenceAssetRecord = {
    id: assetId,
    workspaceId: plan.workspaceId,
    editReferenceId: plan.editReferenceId,
    studySessionId: plan.studySessionId,
    privateAssetId: plan.source.privateMediaArtifactId,
    assetKind: 'reference_video_metadata',
    label: 'Private reference video',
    rightsBasis: 'user_owned',
    mediaStudyStatus: 'media_studied_local_partial',
    storageObjectRecordId: plan.source.privateMediaArtifactId,
    mediaAssetId: 'media-asset-long-form-review-service',
    mediaMetadata: sourceEvidence.mediaMetadata,
    longFormStudy: createPreferenceLongFormStudySummary({ referenceAssetId: assetId, plan, run }),
    createdAt,
  }
  return { plan, run, sourceEvidence, asset, workOutputs, checkpoints }
}

async function seedAggregate(
  repository: PrivateEditReferenceRepository,
  scope: EditReferenceRepositoryScope,
  fixture: ServiceFixture,
): Promise<void> {
  const reference: EditReferenceRecord = {
    id: fixture.plan.editReferenceId,
    workspaceId: fixture.plan.workspaceId,
    name: 'Long-form reference',
    status: 'active',
    initialGoals: ['visual_language', 'story_and_pacing', 'captions', 'color', 'b_roll', 'audio_and_sfx', 'graphics'],
    currentStudyId: fixture.plan.studySessionId,
    revision: 1,
    createdAt,
    updatedAt: createdAt,
    runtimeSource: 'backend_local_private',
    evidenceStatus: 'ready_to_study',
    dnaStatus: 'not_generated',
    qaStatus: 'not_run',
  }
  const study: PreferenceStudySessionRecord = {
    id: fixture.plan.studySessionId,
    workspaceId: fixture.plan.workspaceId,
    editReferenceId: fixture.plan.editReferenceId,
    title: 'Long-form reference study',
    status: 'ready_to_study',
    initialGoals: reference.initialGoals,
    revision: 1,
    createdAt,
    updatedAt: createdAt,
    runtimeSource: 'backend_local_private',
    evidenceStatus: 'ready_to_study',
    dnaStatus: 'not_generated',
    qaStatus: 'not_run',
  }
  await repository.mutate({
    scope,
    operation: 'long_form_review_service.initialize',
    idempotencyKey: 'long-form-review-service-initialize',
    requestHash: sha256('long-form-review-service-initialize'),
    replay: () => seedDetailData(reference, study, fixture),
    mutate: ({ aggregate }: EditReferenceMutationContext) => {
      aggregate.references.push(reference)
      aggregate.studies.push(study)
      aggregate.evidence.push(fixture.sourceEvidence)
      aggregate.assets.push(fixture.asset)
      return seedDetailData(reference, study, fixture)
    },
  })
}

function seedDetailData(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  fixture: ServiceFixture,
) {
  return {
    detail: {
      reference,
      study,
      messages: [],
      studyChatReasoning: [],
      evidence: [fixture.sourceEvidence],
      assets: [fixture.asset],
      skillRuns: [],
      dnaVersions: [],
      dnaQaResults: [],
      applications: [],
      usageLogs: [],
      nextAction: 'run_evidence_study' as const,
      safety: EDIT_REFERENCE_SAFETY_FLAGS,
    },
    replayed: false,
  }
}

function fakeLongFormRepository(fixture: ServiceFixture): PrivateEditReferenceLongFormStudyRepository {
  return {
    persistence: 'backend_local_private_segmented',
    read: async ({ runId }: { runId: string }) => runId === fixture.run.runId
      ? { plan: structuredClone(fixture.plan), run: structuredClone(fixture.run) }
      : undefined,
    readWorkOutput: async ({ workItemId }: { workItemId: string }) => {
      const output = fixture.workOutputs.get(workItemId)
      return output ? structuredClone(output) : undefined
    },
    readSemanticWindowCheckpoint: async (input: {
      workItemId: string
      semanticWindowId: string
      specialistId: EditReferenceSemanticSpecialistId
    }) => {
      const checkpoint = fixture.checkpoints.get(checkpointKey(
        input.workItemId,
        input.semanticWindowId,
        input.specialistId,
      ))
      return checkpoint ? structuredClone(checkpoint) : undefined
    },
  } as unknown as PrivateEditReferenceLongFormStudyRepository
}

function completeThroughSemanticWork(
  plan: EditReferenceLongFormStudyPlan,
  initialRun: EditReferenceLongFormStudyRunRecord,
): EditReferenceLongFormStudyRunRecord {
  let run = initialRun
  let iteration = 0
  while (run.workItems.some((item: EditReferenceLongFormStudyRunRecord['workItems'][number]) => item.stageId === 'semantic_chunk_synthesis' && item.status !== 'completed')) {
    iteration += 1
    assert(iteration < 100)
    const now = new Date(Date.parse(createdAt) + iteration * 1_000).toISOString()
    const claim = claimEditReferenceLongFormStudyWork({
      run,
      plan,
      workerId: 'worker-review-service',
      idempotencyKey: `claim-review-service-${iteration}`,
      leaseDurationMs: 60_000,
      now,
      eligibleStageIds: [
        'ingest_integrity', 'media_probe', 'analysis_proxy', 'audio_extract',
        'speech_transcript', 'scene_boundary_scan', 'visual_sampling', 'caption_ocr',
        'color_motion_signals', 'semantic_chunk_synthesis',
      ],
    })
    assert.equal(claim.disposition, 'authorized')
    assert(claim.workItem && claim.leaseToken)
    run = completeEditReferenceLongFormStudyWork({
      run: claim.run,
      plan,
      workItemId: claim.workItem.workItemId,
      workerId: 'worker-review-service',
      leaseToken: claim.leaseToken,
      outputDigestSha256: sha256(`output:${claim.workItem.workItemId}`),
      outputRuntimeSource: 'verified_mock',
      outputCompletionAuthority: 'controlled_mock',
      observedWallClockMs: 1,
      now,
    })
  }
  return run
}

function dependencyOutputs(
  plan: EditReferenceLongFormStudyPlan,
  runId: string,
  chunkId: string,
  startSeconds: number,
  endSeconds: number,
  minimumSampleCount: number,
  visualWorkItemId: string,
  sceneWorkItemId: string,
): { visual: EditReferenceLongFormStudyWorkOutput; scene: EditReferenceLongFormStudyWorkOutput } {
  const spacing = (endSeconds - startSeconds) / minimumSampleCount
  const sampleTimes = Array.from({ length: minimumSampleCount }, (_entry: unknown, index: number) => (
    Number((startSeconds + spacing * (index + 0.5)).toFixed(3))
  ))
  const boundaries = sampleTimes.filter((_time: number, index: number) => index % 2 === 1)
  const base = {
    schemaVersion: 'edit-reference-long-form-study-work-output-v5' as const,
    runId,
    planId: plan.planId,
    planDigestSha256: plan.planDigestSha256,
    chunkId,
    privateMediaArtifactId: plan.source.privateMediaArtifactId,
    mediaChecksumSha256: plan.source.mediaChecksumSha256,
    sourceCoverageStartSeconds: startSeconds,
    sourceCoverageEndSeconds: endSeconds,
    runtimeSource: 'verified_local' as const,
    completionAuthority: 'authoritative' as const,
    usage: unmeteredUsage(endSeconds - startSeconds),
    originalRemainsImmutable: true as const,
    rawProcessOutputPersisted: false as const,
    signedUrlPersisted: false as const,
    localFilePathPersisted: false as const,
    providerCallMade: false,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    remoteMutationMade: false as const,
    createdAt,
  }
  const visual = {
    ...base,
    workItemId: visualWorkItemId,
    stageId: 'visual_sampling' as const,
    toolIds: ['ffmpeg'] as const,
    artifacts: sampleTimes.map((sourceTimeSeconds: number, index: number) => ({
      role: 'visual_sample' as const,
      storageObjectPath: `frames/frame-${String(index + 1).padStart(3, '0')}.jpg`,
      contentType: 'image/jpeg' as const,
      sizeBytes: 512,
      checksumSha256: sha256(`${chunkId}:frame:${sourceTimeSeconds}`),
      sourceTimeSeconds,
    })),
    result: {
      kind: 'visual_sampling' as const,
      sampleTimesSeconds: sampleTimes,
      sampleCount: sampleTimes.length,
      minimumSampleCountSatisfied: true as const,
      adaptiveSceneSamplingRequiredForSemanticPass: true as const,
      semanticVisualAnalysisRan: false as const,
      fullCoreCoverage: true as const,
    },
    outputDigestSha256: sha256(`${chunkId}:visual-output`),
  } as unknown as EditReferenceLongFormStudyWorkOutput
  const scene = {
    ...base,
    workItemId: sceneWorkItemId,
    stageId: 'scene_boundary_scan' as const,
    toolIds: ['ffmpeg'] as const,
    artifacts: [],
    result: {
      kind: 'scene_boundary_scan' as const,
      threshold: 0.3,
      boundaryTimesSeconds: boundaries,
      boundaryCount: boundaries.length,
      technicalCandidatesOnly: true as const,
      semanticSceneAnalysisRan: false as const,
      fullCoreCoverage: true as const,
    },
    outputDigestSha256: sha256(`${chunkId}:scene-output`),
  } as unknown as EditReferenceLongFormStudyWorkOutput
  return { visual, scene }
}

function semanticResult(
  specialistId: EditReferenceSemanticSpecialistId,
  windowOrdinal: number,
): EditReferenceSemanticStudyResult {
  const definition = EDIT_REFERENCE_SEMANTIC_SPECIALISTS.find((entry: typeof EDIT_REFERENCE_SEMANTIC_SPECIALISTS[number]) => entry.specialistId === specialistId)
  assert(definition)
  return {
    resultVersion: EDIT_REFERENCE_SEMANTIC_STUDY_RESULT_VERSION,
    specialistId,
    skillId: definition.skillId,
    status: 'completed',
    resultState: 'analyzed',
    runtimeSource: 'verified_local',
    readinessAtRun: 'verified_local',
    fallbackUsed: false,
    inputEvidenceIds: [`evidence-${specialistId}-${windowOrdinal}`],
    analysisArtifactIds: [`artifact-${specialistId}-${windowOrdinal}`],
    toolIds: [`controlled-${specialistId}-adapter`],
    summary: `Window ${windowOrdinal} produced generalized ${specialistId} observations for target adaptation.`,
    confidence: 0.82,
    warnings: [],
    blockedReasons: [],
    retryAvailable: false,
    usageEventIds: [],
    internalCostRecordIds: [],
    execution: {
      providerCallMade: false,
      modelCallMade: false,
      fileBytesRead: true,
      externalUrlFetched: false,
      mediaProcessingStarted: true,
      workerJobCreated: false,
    },
  }
}

function controlledAttempt(input: {
  runId: string
  workItemId: string
  semanticWindowPlanDigestSha256: string
  semanticWindowId: string
  specialistId: EditReferenceSemanticSpecialistId
  requestDigestSha256: string
}) {
  const submissionKey = deriveEditReferenceLongFormSemanticWindowSubmissionKey({ ...input, attemptNumber: 1 })
  return {
    attemptNumber: 1,
    submissionIdempotencyKeySha256: sha256(submissionKey),
    runtimeSource: 'verified_local' as const,
    providerCallMade: false,
    modelCallMade: false,
    workerJobCreated: false,
    temporaryInputsCleaned: true as const,
    meteredInternalCostMicros: '0',
    usageEventIds: [],
    internalCostRecordIds: [],
  }
}

function unmeteredUsage(inputMediaSeconds: number) {
  return {
    schemaVersion: 'edit-reference-long-form-study-usage-v1' as const,
    mode: 'backend_local_unmetered' as const,
    costEvidenceSource: 'unmetered_observation' as const,
    observedWallClockMs: 1,
    inputMediaSeconds,
    outputBytes: 0,
    approvedUsageEstimateId: null,
    internalCostBudgetId: null,
    maximumAuthorizedInternalCostMicros: null,
    rateCardSnapshotId: null,
    meteredProviderCostMicros: null,
    meteredInfrastructureCostMicros: null,
    meteredInternalCostMicros: null,
    usageEventIds: [],
    internalCostRecordIds: [],
    productionCostAuthoritySatisfied: false,
    actualInternalCostFinal: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
  }
}

function serviceContext(localRoot: string, ownerUserId: string): ServiceContext {
  return {
    env: loadRuntimeEnv({
      NODE_ENV: 'test',
      API_PORT: '8787',
      E2E_RUNTIME_MODE: 'local',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      STORAGE_MODE: 'local',
      LOCAL_STORAGE_ROOT: localRoot,
      PROVIDER_EXECUTION_ENABLED: 'false',
      WORKER_RUNTIME_MODE: 'mock',
    }),
    clients: { admin: null, public: null },
    requestId: 'long-form-review-service-smoke',
    auth: { userId: ownerUserId, isMockUser: true },
  }
}

function checkpointKey(
  workItemId: string,
  semanticWindowId: string,
  specialistId: EditReferenceSemanticSpecialistId,
): string {
  return `${workItemId}:${semanticWindowId}:${specialistId}`
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
