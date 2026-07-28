import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  TargetVideoUnderstandingPackage,
  TargetVideoUnderstandingSchedule,
} from '../../src/types/edit-reference-target-video-understanding'
import type { ProjectEditSessionRecord } from '../../src/types/project-edit-session'
import type { ProjectEditSessionBundleRecord } from '../../src/types/project-edit-session-repository'
import { createEditReferenceApiClient } from '../../src/lib/edit-reference-api-client'
import {
  readTargetVideoUnderstandingForProjectEditSession,
  startTargetVideoUnderstandingForProjectEditSession,
} from '../../src/lib/project-edit-session-edit-reference-integration'
import {
  createEditReferenceTargetStudyUiView,
  shouldPollTargetVideoUnderstandingForUi,
} from '../../src/lib/edit-reference-target-study-ui'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS,
  materializeEditReferenceControlledMediaFixture,
} from '../edit-references/edit-reference-controlled-media-fixtures'
import { clearEditReferenceLongFormStudyExecutorProcessStateForSmoke } from '../edit-references/edit-reference-long-form-study-executor'
import {
  clearEditReferenceLongFormStudySchedulerProcessStateForSmoke,
  createEditReferenceLongFormStudyScheduler,
  waitForEditReferenceLongFormStudySchedulerForSmoke,
} from '../edit-references/edit-reference-long-form-study-scheduler'
import { createEditReferenceLongFormSpecialistPipelineStageExecutor } from '../edit-references/edit-reference-long-form-specialist-pipeline-stage-executor'
import { clearPrivateEditReferenceLongFormStudyRepositoryProcessStateForSmoke } from '../edit-references/private-edit-reference-long-form-study-repository'
import { clearEditReferenceRepositoryProcessStateForSmoke } from '../edit-references/private-edit-reference-repository'
import { clearPrivateTargetVideoUnderstandingRepositoryProcessStateForSmoke } from '../edit-references/private-target-video-understanding-repository'
import { createEditReferenceService } from '../services/edit-reference-service'
import { createEditReferenceTargetVideoUnderstandingService, calculateTargetVideoEditBriefDigest } from '../services/edit-reference-target-video-understanding-service'
import { createInternalEditStateService } from '../services/internal-edit-state-service'
import { createProjectEditBriefLocalService } from '../services/project-edit-brief-local-service'
import { createProjectService } from '../services/project-service'
import { createUploadService } from '../services/upload-service'
import type { ServiceContext } from '../types'
import { executeControlledLongFormChunkSpecialistStage } from './fixtures/controlled-long-form-chunk-specialist-stage-executor'

const ownerUserId = 'mock-user-runtime'
const workspaceId = 'workspace-target-understanding-smoke'

const root = await mkdtemp(path.join(tmpdir(), 'reeditpro-target-understanding-'))
try {
  const fixtureDefinition = EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS[0]
  assert(fixtureDefinition)
  const fixture = await materializeEditReferenceControlledMediaFixture({
    outputRoot: path.join(root, 'fixture'),
    definition: fixtureDefinition,
    timeoutMs: 60_000,
  })
  const sourceBytes = await readFile(fixture.videoPath)
  const sourceChecksum = createHash('sha256').update(sourceBytes).digest('hex')
  const env = runtimeEnv(root)
  const context = serviceContext(env)
  const project = (await createProjectService(context).createProject({
    workspaceId,
    name: 'Actual target-video understanding proof',
    description: 'A real source-media study, not caller-authored summary evidence.',
  })).project
  const editSessionId = `${project.id}-hours-safe-target-study`
  const uploadService = createUploadService(context)
  const upload = await uploadService.createUploadIntent({
    workspaceId,
    projectId: project.id,
    uploadPurpose: 'source_media',
    originalFileName: 'actual-target-source.mp4',
    mimeType: 'video/mp4',
    expectedSizeBytes: sourceBytes.length,
    checksumSha256: sourceChecksum,
  })
  await uploadService.uploadLocalObject(upload.uploadIntent.id, workspaceId, sourceBytes, 'video/mp4')
  const finalized = await uploadService.finalizeUploadIntent({
    workspaceId,
    uploadIntentId: upload.uploadIntent.id,
    sizeBytes: sourceBytes.length,
    checksumSha256: sourceChecksum,
  })
  const createdAt = '2026-07-20T12:00:00.000Z'
  const exactEditHandoff = {
    id: editSessionId,
    workspaceId,
    projectId: project.id,
    editSessionId,
    projectName: project.name,
    editName: 'Hours-safe target study',
    category: 'documentary_case_study',
    editorPath: `/projects/${encodeURIComponent(project.id)}/edits/${encodeURIComponent(editSessionId)}`,
    stage: 'source_uploaded',
    sourceFileCount: 1,
    setup: {
      aspectRatio: '16:9',
      aspectRatioConfirmed: true,
      editLevel: 'basic',
      editLevelConfirmed: true,
      targetPlatform: 'youtube',
    },
    createdAt,
    updatedAt: createdAt,
    persistence: 'browser_local_internal_testing',
  }
  const exactEditState = (await createInternalEditStateService(exactEditStateContext(root)).saveInternalEditState({
    workspaceId,
    projectId: project.id,
    editSessionId,
    idempotencyKey: 'target-understanding-exact-edit-state',
    handoff: exactEditHandoff,
  })).internalEditState
  const session: ProjectEditSessionRecord = {
    id: editSessionId,
    projectId: project.id,
    workspaceId,
    ownerUserId,
    name: 'Hours-safe target study',
    status: 'setup_ready',
    aspectRatio: '16:9',
    platformTarget: 'youtube_standard',
    sourceMediaAssetIds: [finalized.mediaAsset.id],
    selectedEditLevel: 'normal',
    doNotCopyRulesActive: true,
    messageCount: 0,
    revisionCount: 0,
    versionCount: 0,
    previewCount: 0,
    approvalStatus: 'not_requested',
    createdAt,
    updatedAt: exactEditState.updatedAt,
    mockOnly: true,
    metadata: {
      exactInternalEditStateAuthority: true,
      outputFrameConfirmed: true,
      confirmedAspectRatio: '16:9',
      confirmedPlatformTarget: 'youtube_standard',
    },
  }
  const brief = (await createProjectEditBriefLocalService(context).saveProjectEditBrief({
    workspaceId,
    projectId: project.id,
    editSessionId: session.id,
    idempotencyKey: 'target-understanding-brief-save',
    briefText: 'Study the complete source before applying the approved editing preference. Preserve meaning and source order.',
    sourceStorageObjectRecordId: finalized.storageObjectRecord.id,
    sourceMediaAssetId: finalized.mediaAsset.id,
  })).editBrief
  const editReference = (await createEditReferenceService(context).createReference({
    workspaceId,
    name: 'Approved style-study source',
    description: 'The style authority remains separate from the actual target-source evidence.',
    initialGoals: ['visual_language', 'story_and_pacing', 'captions', 'color', 'audio_and_sfx', 'graphics'],
  }, 'target-understanding-reference-create')).data.detail
  const briefDigest = calculateTargetVideoEditBriefDigest(brief)
  assert.equal(brief.contentDigestSha256, briefDigest)
  const browserBrief = { ...brief, readbackVerified: true as const }
  const browserBundle: ProjectEditSessionBundleRecord = {
    session,
    messages: [],
    sources: [{
      id: 'target-understanding-source-link',
      projectId: project.id,
      editSessionId: session.id,
      mediaAssetId: finalized.mediaAsset.id,
      sourceOrderIndex: 0,
      notes: [],
      importance: 'primary',
      durationSeconds: fixtureDefinition.durationSeconds,
      mimeType: 'video/mp4',
      mockOnly: true,
    }],
    memories: [],
    snapshots: [],
    versions: [],
    previews: [],
    revisions: [],
    events: [],
    cardModel: {
      id: session.id,
      projectId: project.id,
      name: session.name,
      status: session.status,
      aspectRatio: session.aspectRatio,
      platformTarget: session.platformTarget,
      badges: [],
      messageCount: 0,
      revisionCount: 0,
      versionCount: 0,
      lastEditedAt: session.updatedAt,
      cardShape: 'wide',
      mockOnly: true,
    },
    mockOnly: true,
    warnings: [],
  }
  const validBody = {
    workspaceId,
    editReferenceId: editReference.reference.id,
    studySessionId: editReference.study.id,
    sourceStorageObjectRecordId: finalized.storageObjectRecord.id,
    sourceMediaAssetId: finalized.mediaAsset.id,
    expectedEditBriefRevision: brief.revisionNumber,
    expectedEditBriefDigestSha256: briefDigest,
    contentType: 'documentary' as const,
    currentUserInstruction: 'Understand every section before recommending how the approved preference should adapt.',
    selectedEditLevel: 'normal' as const,
    aspectRatio: '16:9' as const,
    outputFrameConfirmed: true as const,
    platformTarget: 'youtube_standard' as const,
    storyRole: 'Long-form source that must retain its complete argument and evidence chain.',
    budgetPreference: 'balanced' as const,
    directives: {
      captions: 'adapt' as const,
      music: 'adapt' as const,
      sfx: 'adapt' as const,
      sourceOrder: 'preserve' as const,
    },
    approvedConstraints: ['Do not invent claims.', 'Do not infer content from the Edit Brief alone.'],
  }
  let runtime = await startRuntime(env)
  const route = `/v1/projects/${project.id}/edit-sessions/${session.id}/edit-reference-target-understanding`
  try {
    const requestStarted = process.hrtime.bigint()
    const started = await postTarget(runtime.baseUrl, route, 'target-understanding-start', validBody)
    const requestWallClockMs = Number((process.hrtime.bigint() - requestStarted) / 1_000_000n)
    assert.equal(started.status, 202)
    assert.equal(started.body.data.targetVideoUnderstandingPackage.status, 'collecting')
    assert.equal(started.body.data.targetVideoUnderstandingPackage.study.completedWorkItemCount, 2)
    assert.equal(started.body.data.targetVideoUnderstandingPackage.callerSourceSummaryUsedAsStudyEvidence, false)
    assert.equal(started.body.data.targetVideoUnderstandingPackage.source.originalRemainsImmutable, true)
    assert.equal(started.body.data.targetVideoUnderstandingPackage.study.browserSessionRequiredForCompletion, false)
    assert.equal(started.body.data.targetVideoUnderstandingPackage.study.fixedWholeStudyWallClockTimeoutApplied, false)
    assert.equal(started.body.data.targetVideoUnderstandingPackage.readyForPreferenceApplication, false)
    assert.equal(started.body.data.schedule.stageCapability, 'technical_only')
    assert.equal(started.body.data.schedule.technicalStagesComplete, false)
    assert.equal(started.body.data.schedule.specialistPipelineAvailable, false)
    assert.equal(started.body.data.schedule.waitingForSpecialistRuntime, false)
    assert.equal(started.body.data.schedule.scheduled, true)
    assert.equal(
      shouldPollTargetVideoUnderstandingForUi(
        started.body.data.targetVideoUnderstandingPackage,
        started.body.data.schedule,
      ),
      true,
    )
    assert(requestWallClockMs < 10_000, 'target study start must return before whole-source analysis finishes')
    const browserClient = createEditReferenceApiClient(runtime.baseUrl, async () => undefined)
    const browserReplay = await browserClient.startTargetVideoUnderstanding(
      project.id,
      session.id,
      validBody,
      'target-understanding-browser-replay',
    )
    assert(browserReplay.ok)
    assert.equal(browserReplay.data.replayed, true)
    assert.equal(browserReplay.data.targetVideoUnderstandingPackage.study.runId, started.body.data.targetVideoUnderstandingPackage.study.runId)
    const browserIntegrationStart = await startTargetVideoUnderstandingForProjectEditSession({
      bundle: browserBundle,
      currentUserInstruction: validBody.currentUserInstruction,
      editBrief: browserBrief,
      editReferenceClient: browserClient,
      editReferenceId: editReference.reference.id,
      workspaceId,
    })
    assert(browserIntegrationStart.ok)
    assert.equal(browserIntegrationStart.package.study.runId, started.body.data.targetVideoUnderstandingPackage.study.runId)
    const replay = await postTarget(runtime.baseUrl, route, 'target-understanding-start-replay', validBody)
    assert.equal(replay.body.data.replayed, true)
    assert.equal(
      replay.body.data.targetVideoUnderstandingPackage.study.runId,
      started.body.data.targetVideoUnderstandingPackage.study.runId,
    )

    const rejectedCallerSummary = await postError(
      runtime.baseUrl,
      route,
      'target-understanding-caller-summary-rejected',
      { ...validBody, sourceSummary: 'Trust this caller-written summary instead of studying the file.' },
    )
    assert.equal(rejectedCallerSummary.status, 400)
    assert.equal(rejectedCallerSummary.code, 'VALIDATION_FAILED')

    await waitForEditReferenceLongFormStudySchedulerForSmoke()
    const statusQuery = new URLSearchParams({
      workspaceId,
      editReferenceId: editReference.reference.id,
      studySessionId: editReference.study.id,
      sourceStorageObjectRecordId: finalized.storageObjectRecord.id,
      sourceMediaAssetId: finalized.mediaAsset.id,
      expectedEditBriefRevision: String(brief.revisionNumber),
      expectedEditBriefDigestSha256: briefDigest,
    })
    const advanced = await getTarget(runtime.baseUrl, `${route}?${statusQuery}`)
    assert(advanced.body.data.targetVideoUnderstandingPackage.study.completedWorkItemCount > 2)
    assert(advanced.body.data.targetVideoUnderstandingPackage.evidence.some((record) => record.stageId === 'analysis_proxy'))
    assert(advanced.body.data.targetVideoUnderstandingPackage.evidence.some((record) => record.stageId === 'visual_sampling'))
    assert.equal(advanced.body.data.targetVideoUnderstandingPackage.source.analysisProxyMaxWidth, 1280)
    assert.equal(advanced.body.data.targetVideoUnderstandingPackage.source.studyAudioSampleRate, 16000)
    assert.equal(advanced.body.data.targetVideoUnderstandingPackage.readyForPreferenceApplication, false)
    assert(advanced.body.data.targetVideoUnderstandingPackage.missingEvidence.some((record) => (
      record.domain === 'semantic_chunk_synthesis'
    )))
    assert.equal(advanced.body.data.schedule.stageCapability, 'technical_only')
    assert.equal(advanced.body.data.schedule.technicalStagesComplete, true)
    assert.equal(advanced.body.data.schedule.specialistPipelineAvailable, false)
    assert.equal(advanced.body.data.schedule.waitingForSpecialistRuntime, true)
    assert.equal(advanced.body.data.schedule.scheduled, false)
    assert.equal(advanced.body.data.schedule.reason, 'specialist_runtime_not_connected')
    assert.equal(
      shouldPollTargetVideoUnderstandingForUi(
        advanced.body.data.targetVideoUnderstandingPackage,
        advanced.body.data.schedule,
      ),
      false,
    )
    const waitingForSpecialistView = createEditReferenceTargetStudyUiView({
      kind: 'package',
      package: advanced.body.data.targetVideoUnderstandingPackage,
      schedule: advanced.body.data.schedule,
    })
    assert.equal(waitingForSpecialistView.state, 'waiting')
    assert.equal(waitingForSpecialistView.tone, 'warning')
    assert.equal(waitingForSpecialistView.statusLabel, 'Specialist runtime needed')
    assert.match(waitingForSpecialistView.title, /technical study saved/i)
    assert.match(waitingForSpecialistView.description, /GPU and model runtime/i)
    assert.equal(waitingForSpecialistView.etaLabel, undefined)
    const browserReadback = await browserClient.getTargetVideoUnderstanding(project.id, session.id, {
      workspaceId,
      editReferenceId: editReference.reference.id,
      studySessionId: editReference.study.id,
      sourceStorageObjectRecordId: finalized.storageObjectRecord.id,
      sourceMediaAssetId: finalized.mediaAsset.id,
      expectedEditBriefRevision: brief.revisionNumber,
      expectedEditBriefDigestSha256: briefDigest,
    })
    assert(browserReadback.ok)
    assert.equal(
      browserReadback.data.targetVideoUnderstandingPackage.packageDigestSha256,
      advanced.body.data.targetVideoUnderstandingPackage.packageDigestSha256,
    )
    const browserIntegrationReadback = await readTargetVideoUnderstandingForProjectEditSession({
      bundle: browserBundle,
      editBrief: browserBrief,
      editReferenceClient: browserClient,
      editReferenceId: editReference.reference.id,
      workspaceId,
    })
    assert(browserIntegrationReadback.ok)
    assert.equal(browserIntegrationReadback.package.study.runId, advanced.body.data.targetVideoUnderstandingPackage.study.runId)

    const controlledSpecialistPipeline = createEditReferenceLongFormSpecialistPipelineStageExecutor({
      executeChunkSpecialistStage: executeControlledLongFormChunkSpecialistStage,
      finalStageAuthority: { executionScope: 'controlled_test' },
    })
    const controlledScheduler = createEditReferenceLongFormStudyScheduler({
      specialistStageExecutor: controlledSpecialistPipeline,
    })
    const directService = createEditReferenceTargetVideoUnderstandingService(context, {
      studyScheduler: controlledScheduler,
    })
    const directReadInput = {
      projectId: project.id,
      editSessionId: session.id,
      workspaceId,
      editReferenceId: editReference.reference.id,
      studySessionId: editReference.study.id,
      sourceStorageObjectRecordId: finalized.storageObjectRecord.id,
      sourceMediaAssetId: finalized.mediaAsset.id,
      expectedEditBriefRevision: brief.revisionNumber,
      expectedEditBriefDigestSha256: briefDigest,
    }
    await directService.readLatest(directReadInput)
    await waitForEditReferenceLongFormStudySchedulerForSmoke()
    const controlledCompleted = await directService.readLatest(directReadInput)
    await waitForEditReferenceLongFormStudySchedulerForSmoke()
    assert.equal(controlledCompleted.package.study.progressPercent, 100)
    assert.equal(controlledCompleted.package.study.temporalCoverageRatio, 1)
    assert.equal(controlledCompleted.package.status, 'review_required')
    assert.equal(controlledCompleted.package.readyForPreferenceApplication, false)
    assert.equal(controlledCompleted.package.runtimeProvenance.everyRequiredOutputVerified, true)
    assert.equal(controlledCompleted.package.runtimeProvenance.everySemanticRuntimeAuthoritative, false)
    assert.equal(controlledCompleted.package.runtimeProvenance.everyRequiredOutputCostAuthoritySatisfied, false)
    assert.equal(controlledCompleted.package.runtimeProvenance.coverageQaPassed, false)
    assert.equal(controlledCompleted.schedule.stageCapability, 'full_specialist_pipeline')
    assert.equal(controlledCompleted.schedule.technicalStagesComplete, true)
    assert.equal(controlledCompleted.schedule.specialistPipelineAvailable, true)
    assert.equal(controlledCompleted.schedule.waitingForSpecialistRuntime, false)
    assert(controlledCompleted.package.limitations.some((record) => (
      record.blocking && /controlled|cost|authoritative/i.test(record.summary)
    )))
    assert.equal(controlledCompleted.package.providerCallMade, false)
    assert.equal(controlledCompleted.package.customerPriceCalculated, false)
    assert.equal(controlledCompleted.package.customerCreditsMutated, false)

    const controlledApplicationAttempt = await postError(
      runtime.baseUrl,
      `/v1/edit-reference-studies/${editReference.study.id}/preference-dna/dna-controlled-not-authorized/applications`,
      'controlled-target-study-application-rejected',
      {
        workspaceId,
        expectedReferenceRevision: editReference.reference.revision,
        expectedDNAContentDigest: 'd'.repeat(64),
        acknowledgeAdaptNotCopy: true,
        targetContext: {
          projectId: controlledCompleted.package.projectId,
          editSessionId: controlledCompleted.package.editSessionId,
          projectName: controlledCompleted.package.declaredContext.projectName,
          editName: controlledCompleted.package.declaredContext.editName,
          sourceMode: controlledCompleted.package.audioState.sourceMode,
          contentType: controlledCompleted.package.declaredContext.contentType,
          sourceSummary: controlledCompleted.package.sourceSummary,
          currentUserInstruction: controlledCompleted.package.declaredContext.currentUserInstruction,
          selectedEditLevel: controlledCompleted.package.declaredContext.selectedEditLevel,
          aspectRatio: controlledCompleted.package.declaredContext.aspectRatio,
          outputFrameConfirmed: true,
          platformTarget: controlledCompleted.package.declaredContext.platformTarget,
          storyRole: controlledCompleted.package.declaredContext.storyRole,
          budgetPreference: controlledCompleted.package.declaredContext.budgetPreference,
          directives: controlledCompleted.package.declaredContext.directives,
          approvedConstraints: controlledCompleted.package.declaredContext.approvedConstraints,
        },
        targetUnderstandingPackageId: controlledCompleted.package.packageId,
        targetUnderstandingPackageDigestSha256: controlledCompleted.package.packageDigestSha256,
        targetUnderstandingSourceStorageObjectRecordId: controlledCompleted.package.source.storageObjectRecordId,
        targetUnderstandingSourceMediaAssetId: controlledCompleted.package.source.mediaAssetId,
        targetUnderstandingEditBriefDigestSha256: controlledCompleted.package.declaredContext.editBriefDigestSha256,
      },
    )
    assert.equal(controlledApplicationAttempt.status, 409)
    assert.equal(controlledApplicationAttempt.code, 'VERSION_CONFLICT')
    assert.match(controlledApplicationAttempt.message, /stale, incomplete/i)

    const staleBrief = await getError(runtime.baseUrl, `${route}?${new URLSearchParams({
      ...Object.fromEntries(statusQuery),
      expectedEditBriefRevision: String(brief.revisionNumber + 1),
    })}`)
    assert.equal(staleBrief.status, 409)
    assert.equal(staleBrief.code, 'VERSION_CONFLICT')

    const storedSource = await readFile(path.join(
      root,
      finalized.storageObjectRecord.bucketName,
      finalized.storageObjectRecord.objectPath,
    ))
    assert.equal(createHash('sha256').update(storedSource).digest('hex'), sourceChecksum)

    await runtime.close()
    clearEditReferenceLongFormStudySchedulerProcessStateForSmoke()
    clearEditReferenceLongFormStudyExecutorProcessStateForSmoke()
    clearPrivateEditReferenceLongFormStudyRepositoryProcessStateForSmoke()
    clearPrivateTargetVideoUnderstandingRepositoryProcessStateForSmoke()
    clearEditReferenceRepositoryProcessStateForSmoke()
    runtime = await startRuntime(env)
    const afterRestart = await getTarget(runtime.baseUrl, `${route}?${statusQuery}`)
    assert.equal(
      afterRestart.body.data.targetVideoUnderstandingPackage.packageDigestSha256,
      controlledCompleted.package.packageDigestSha256,
    )
    assert.equal(afterRestart.body.data.targetVideoUnderstandingPackage.study.progressPercent, 100)
    assert.equal(afterRestart.body.data.targetVideoUnderstandingPackage.status, 'review_required')
    assert.equal(afterRestart.body.data.targetVideoUnderstandingPackage.readyForPreferenceApplication, false)
    assert.equal(afterRestart.body.data.targetVideoUnderstandingPackage.study.restartResumeRequired, true)
    const browserAfterRestart = await createEditReferenceApiClient(runtime.baseUrl, async () => undefined)
      .getTargetVideoUnderstanding(project.id, session.id, {
        workspaceId,
        editReferenceId: editReference.reference.id,
        studySessionId: editReference.study.id,
        sourceStorageObjectRecordId: finalized.storageObjectRecord.id,
        sourceMediaAssetId: finalized.mediaAsset.id,
        expectedEditBriefRevision: brief.revisionNumber,
        expectedEditBriefDigestSha256: briefDigest,
      })
    assert(browserAfterRestart.ok)
    assert.equal(browserAfterRestart.data.targetVideoUnderstandingPackage.packageDigestSha256, afterRestart.body.data.targetVideoUnderstandingPackage.packageDigestSha256)

    const revisedBrief = (await createProjectEditBriefLocalService(context).saveProjectEditBrief({
      workspaceId,
      projectId: project.id,
      editSessionId: session.id,
      idempotencyKey: 'target-understanding-revised-brief-save',
      briefText: 'Study the complete source again against the revised Edit Brief. Preserve every verified checkpoint under its original brief lineage.',
      sourceStorageObjectRecordId: finalized.storageObjectRecord.id,
      sourceMediaAssetId: finalized.mediaAsset.id,
    })).editBrief
    const revisedBriefDigest = calculateTargetVideoEditBriefDigest(revisedBrief)
    const revisedBody = {
      ...validBody,
      expectedEditBriefRevision: revisedBrief.revisionNumber,
      expectedEditBriefDigestSha256: revisedBriefDigest,
    }
    const revisedStart = await postTarget(
      runtime.baseUrl,
      route,
      'target-understanding-revised-brief-start',
      revisedBody,
    )
    assert.equal(revisedStart.status, 202)
    assert.equal(revisedStart.body.data.replayed, false)
    assert.notEqual(
      revisedStart.body.data.targetVideoUnderstandingPackage.study.runId,
      afterRestart.body.data.targetVideoUnderstandingPackage.study.runId,
    )
    await waitForEditReferenceLongFormStudySchedulerForSmoke()
    const revisedStatusQuery = new URLSearchParams({
      workspaceId,
      editReferenceId: editReference.reference.id,
      studySessionId: editReference.study.id,
      sourceStorageObjectRecordId: finalized.storageObjectRecord.id,
      sourceMediaAssetId: finalized.mediaAsset.id,
      expectedEditBriefRevision: String(revisedBrief.revisionNumber),
      expectedEditBriefDigestSha256: revisedBriefDigest,
    })
    const revisedAdvanced = await getTarget(
      runtime.baseUrl,
      `${route}?${revisedStatusQuery}`,
    )
    assert(revisedAdvanced.body.data.targetVideoUnderstandingPackage.study.completedWorkItemCount > 2)
    assert.equal(revisedAdvanced.body.data.targetVideoUnderstandingPackage.readyForPreferenceApplication, false)

    await createInternalEditStateService(exactEditStateContext(root)).saveInternalEditState({
      workspaceId,
      projectId: project.id,
      editSessionId,
      idempotencyKey: 'target-understanding-approval-lock',
      handoff: {
        ...exactEditHandoff,
        stage: 'plan_approved',
        approvedSnapshotId: 'approved-target-understanding-snapshot',
        updatedAt: '2026-07-20T12:00:01.000Z',
      },
    })
    const approvalLockedStart = await postError(
      runtime.baseUrl,
      route,
      'target-understanding-approval-locked-start',
      revisedBody,
    )
    assert.equal(approvalLockedStart.status, 409)
    assert.equal(approvalLockedStart.code, 'VERSION_CONFLICT')
    assert.match(approvalLockedStart.message, /approval-locked|fresh plan and estimate/i)

    const foreignContext: ServiceContext = {
      ...context,
      requestId: 'target-understanding-foreign-read',
      auth: { userId: 'foreign-target-understanding-user', isMockUser: true },
    }
    await assert.rejects(
      () => createEditReferenceTargetVideoUnderstandingService(foreignContext).readLatest({
        projectId: project.id,
        editSessionId: session.id,
        workspaceId,
        editReferenceId: editReference.reference.id,
        studySessionId: editReference.study.id,
        sourceStorageObjectRecordId: finalized.storageObjectRecord.id,
        sourceMediaAssetId: finalized.mediaAsset.id,
        expectedEditBriefRevision: revisedBrief.revisionNumber,
        expectedEditBriefDigestSha256: revisedBriefDigest,
      }),
      /authenticated project scope|workspace was not found|edit brief was not found/i,
    )

    console.log(JSON.stringify({
      status: 'passed',
      actualSourceMediaOpened: true,
      authenticatedRouteStarted: true,
      startReturnedBeforeWholeStudyFinished: true,
      startRequestWallClockMs: requestWallClockMs,
      backendContinuesWithoutBrowser: true,
      technicalStudyAdvanced: true,
      controlledSpecialistSchedulerAdvancedToCompleteCoverage: true,
      controlledCompleteCoverageStayedReviewRequired: true,
      controlledEvidenceDidNotUnlockAdaptation: true,
      controlledApplicationRouteRejected: true,
      analysisProxyMaxWidth: 1280,
      studyAudioSampleRate: 16000,
      checkpointReadbackAfterRuntimeRestart: true,
      revisedBriefCreatedFreshCheckpointedRun: true,
      strictEditBriefBinding: true,
      strictSourceIdentityBinding: true,
      idempotentStudyIdentity: true,
      callerSummaryRejected: true,
      foreignActorRejected: true,
      approvalLockedStartRejected: true,
      originalChecksumUnchanged: true,
      partialStudyClaimedReady: false,
      providerCallMade: false,
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      remoteMutationMade: false,
    }))
  } finally {
    await runtime.close().catch(() => undefined)
  }
} finally {
  await waitForEditReferenceLongFormStudySchedulerForSmoke().catch(() => undefined)
  clearEditReferenceLongFormStudySchedulerProcessStateForSmoke()
  clearEditReferenceLongFormStudyExecutorProcessStateForSmoke()
  clearPrivateEditReferenceLongFormStudyRepositoryProcessStateForSmoke()
  clearPrivateTargetVideoUnderstandingRepositoryProcessStateForSmoke()
  clearEditReferenceRepositoryProcessStateForSmoke()
  await rm(root, { recursive: true, force: true })
}

interface TargetRouteData {
  targetVideoUnderstandingPackage: TargetVideoUnderstandingPackage
  schedule: TargetVideoUnderstandingSchedule
  persistence: string
  replayed: boolean
  productReady: false
}

function runtimeEnv(localStorageRoot: string) {
  return loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: localStorageRoot,
    WORKER_RUNTIME_MODE: 'local',
    WORKER_INSTANCE_ID: 'target-understanding-smoke-worker',
    WORKER_HEARTBEAT_INTERVAL_SECONDS: '1',
    WORKER_CLAIM_LEASE_SECONDS: '5',
    PROVIDER_EXECUTION_ENABLED: 'false',
  })
}

function serviceContext(env: ReturnType<typeof runtimeEnv>): ServiceContext {
  return {
    env,
    clients: { admin: null, public: null },
    requestId: 'target-understanding-smoke',
    auth: { userId: ownerUserId, isMockUser: true },
  }
}

function exactEditStateContext(localStorageRoot: string): ServiceContext {
  const env = loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: localStorageRoot,
    WORKER_RUNTIME_MODE: 'local',
    PROVIDER_EXECUTION_ENABLED: 'false',
    SUPABASE_URL: 'https://target-understanding-smoke.supabase.co',
    SUPABASE_ANON_KEY: 'target-understanding-smoke-anon',
    SUPABASE_SERVICE_ROLE_KEY: 'target-understanding-smoke-service-role',
    API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
  })
  return {
    env,
    clients: {
      admin: createMembershipAdminClient([{ workspaceId, userId: ownerUserId, role: 'owner' }]),
      public: null,
    },
    requestId: 'target-understanding-exact-edit-state',
    auth: {
      userId: ownerUserId,
      accessToken: 'verified-target-understanding-smoke-token',
      isMockUser: false,
    },
  }
}

function createMembershipAdminClient(
  workspaceMemberships: Array<{ workspaceId: string; userId: string; role: string }>,
): SupabaseClient {
  return {
    from(tableName: string) {
      if (tableName !== 'workspace_members') {
        throw new Error(`Unexpected target-understanding smoke table: ${tableName}`)
      }
      let selectedWorkspaceId = ''
      let selectedUserId = ''
      const query = {
        select() {
          return query
        },
        eq(column: string, value: string) {
          if (column === 'workspace_id') selectedWorkspaceId = value
          if (column === 'user_id') selectedUserId = value
          return query
        },
        async maybeSingle() {
          const membership = workspaceMemberships.find((candidate) => (
            candidate.workspaceId === selectedWorkspaceId && candidate.userId === selectedUserId
          ))
          return {
            data: membership
              ? {
                  workspace_id: membership.workspaceId,
                  user_id: membership.userId,
                  role: membership.role,
                }
              : null,
            error: null,
          }
        },
      }
      return query
    },
  } as unknown as SupabaseClient
}

async function startRuntime(env: ReturnType<typeof runtimeEnv>) {
  const server = createReeditProApiApp(env).listen(0, '127.0.0.1')
  await new Promise<void>((resolvePromise, reject) => {
    server.once('listening', resolvePromise)
    server.once('error', reject)
  })
  return {
    baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((resolvePromise, reject) => server.close((error) => (
      error ? reject(error) : resolvePromise()
    ))),
  }
}

async function postTarget(baseUrl: string, route: string, key: string, body: unknown) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': key },
    body: JSON.stringify(body),
  })
  const payload = await response.json() as { ok: true; data: TargetRouteData; warnings: string[] }
  assert.equal(payload.ok, true, JSON.stringify(payload))
  return { status: response.status, body: payload }
}

async function getTarget(baseUrl: string, route: string) {
  const response = await fetch(`${baseUrl}${route}`)
  const payload = await response.json() as { ok: true; data: TargetRouteData; warnings: string[] }
  assert.equal(payload.ok, true, JSON.stringify(payload))
  return { status: response.status, body: payload }
}

async function postError(baseUrl: string, route: string, key: string, body: unknown) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': key },
    body: JSON.stringify(body),
  })
  const payload = await response.json() as { error: { code: string; message: string } }
  return { status: response.status, code: payload.error.code, message: payload.error.message }
}

async function getError(baseUrl: string, route: string) {
  const response = await fetch(`${baseUrl}${route}`)
  const payload = await response.json() as { error: { code: string; message: string } }
  return { status: response.status, code: payload.error.code, message: payload.error.message }
}
