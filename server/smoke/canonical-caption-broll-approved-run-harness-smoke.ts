import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'

import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
} from '../../src/lib/approved-edit-execution-package-client'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type {
  CaptionDependencyObservation,
  CaptionFinishDependencyKind,
} from '../../src/types/caption-finish-readiness'
import {
  CAPTIONS_SUPPORTED_JOB_TYPES,
  type CaptionsSupportedJobType,
} from
  '../../src/types/captions-specialist'
import type { PlannerInput } from '../../src/types/reeditpro'
import type { CanonicalCaptionQualificationRunReadiness } from
  '../../src/types/canonical-caption-qualification-run-readiness'
import {
  CAPTION_CURRENT_JOB_READINESS_LEDGER_V2,
} from '../captions-specialist/caption-current-job-readiness'
import {
  editSkillArtifactSchemaRegistry,
} from '../edit-skills/internal-fixture-runtime'
import { loadRuntimeEnv } from '../config/env'
import {
  createCanonicalCaptionTranscriptOwnerReadFixture,
  createCanonicalSourceAnalysisAuthorityFixture,
} from './fixtures/canonical-source-led-content-analysis-authority-fixture'
import {
  CANONICAL_CAPTION_BROLL_APPROVED_RUN_HARNESS_VERSION,
  createCanonicalCaptionBrollApprovedRunHarness,
  deriveCanonicalCaptionApprovedRunPostapprovalSource,
  deriveCanonicalCaptionBrollApprovedRunOwnerReadRequest,
  deriveCanonicalCaptionBrollApprovedRunReviewAuthority,
  type CanonicalCaptionApprovedRunScenario,
  type CanonicalCaptionBrollApprovedRunHarnessInput,
} from '../internal-testing/canonical-caption-broll-approved-run-harness'
import {
  buildCanonicalCaptionBrollApprovedRunCreativeReview,
} from '../internal-testing/canonical-caption-broll-approved-run-creative-review'
import {
  executeCanonicalCaptionApprovedJobClosure,
  executeCanonicalCaptionBrollApprovedRun,
  type CanonicalCaptionPostapprovalFinishRequirement,
  type CanonicalCaptionSupportResumeRequirement,
} from '../internal-testing/canonical-caption-broll-approved-execution-harness'
import {
  createCanonicalCaptionApprovedExecutionCoverageRepository,
  parseCanonicalCaptionApprovedExecutionCoverage,
} from '../services/canonical-caption-approved-execution-coverage-service'
import {
  assembleCanonicalCaptionApprovedExecutionCampaign,
  createCanonicalCaptionApprovedExecutionCampaignRepository,
  parseCanonicalCaptionApprovedExecutionCampaign,
} from '../services/canonical-caption-approved-execution-campaign-service'
import {
  createCanonicalCaptionPostapprovalFinishRecord,
  createCanonicalCaptionPostapprovalFinishRepository,
} from '../services/canonical-caption-postapproval-finish-service'
import {
  createCanonicalPictureLockManifest,
} from '../edit-architecture/canonical-picture-lock-manifest'
import {
  createCaptionDependencyManifest,
  createCaptionFinishReadiness,
} from '../captions-specialist/caption-finish-readiness'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  injectCanonicalCaptionVisualIntelligenceStructuralSupport,
} from '../internal-testing/canonical-caption-visual-intelligence-structural-support-fixture'
import {
  injectCanonicalCaptionTrackAllStructuralSupport,
} from '../internal-testing/canonical-caption-track-all-structural-support-fixture'
import {
  createCanonicalCaptionSoundSyncStructuralSupportFixture,
} from '../internal-testing/canonical-caption-soundsync-structural-support-fixture'
import {
  createCanonicalPrivateEditSkillArtifactStore,
} from '../services/canonical-private-edit-skill-artifact-store'
import {
  createCanonicalCaptionBrollEvidenceRepository,
} from '../services/canonical-caption-broll-support-service'
import {
  createBrollCaptionPrivateVisualReview,
  createCanonicalBrollCaptionOwnerServiceV2,
  createCanonicalBrollCaptionPrivateVisualReviewReadPort,
} from '../services/canonical-broll-caption-owner-service'
import {
  createCanonicalCaptionBrollApprovedSnapshotReadPort,
} from '../services/canonical-caption-broll-support-service'
import {
  createCanonicalCaptionDirectVisualInspectionRepository,
} from '../services/canonical-caption-direct-visual-inspection-evidence-service'
import {
  createCanonicalCaptionQualificationRunReadinessService,
} from '../services/canonical-caption-qualification-run-evidence-reader'
import {
  createCanonicalCaptionSoundSyncEvidenceRepository,
} from '../services/canonical-caption-soundsync-support-service'
import {
  createCanonicalCaptionCrossSystemExecutionInputPrivateComposition,
  createCanonicalCaptionCrossSystemSourceReadPort,
} from '../services/canonical-caption-cross-system-execution-input-service'
import {
  createCanonicalCaptionTransitionCrossSystemSourceFixture,
} from './canonical-caption-cross-system-source-fixture'
import {
  createCanonicalCaptionTerminalQualificationRequest,
} from '../services/canonical-caption-terminal-qualification-service'
import {
  createCanonicalCaptionTrackAllEvidenceRepository,
} from '../services/canonical-caption-track-all-support-service'
import {
  createCanonicalCaptionTranscriptEvidenceRepository,
} from '../services/canonical-caption-transcript-support-service'
import {
  createCanonicalCaptionVisualIntelligenceEvidenceRepository,
} from '../services/canonical-caption-visual-intelligence-support-service'
import {
  createCanonicalPrivateLocalJsonObjectPort,
} from '../services/canonical-private-local-json-object-port'
import {
  readCanonicalPrivateMediaArtifact,
} from '../services/canonical-private-media-artifact-storage'
import {
  createCanonicalCaptionPostrenderVisualIntelligenceEvidenceRepository,
} from '../services/canonical-caption-postrender-visual-intelligence-durable-store'
import {
  createExactEditPreferenceService,
} from '../services/exact-edit-preference-service'
import {
  createCanonicalSpecialistSupportResumeRepository,
} from '../services/canonical-specialist-support-resume-service'
import {
  buildCurrentPlanningInputAuthorityExpectation,
  planningInputAuthorityExpectationFromResolvedBinding,
} from '../services/planning-input-authority-binding-service'
import {
  createEditPlanningAuthorityService,
} from '../services/edit-planning-authority-service'
import {
  readPrivateEditAuthorityAggregate,
} from '../services/private-edit-authority-store'
import {
  createProjectService,
} from '../services/project-service'
import {
  createSourceMediaAuthorityService,
} from '../services/source-media-authority-service'
import { createUploadService } from '../services/upload-service'
import {
  activatePrivateOfflineLibassCaptionRuntime,
  openPrivateOfflineLibassCaptionRuntime,
  prepareOfflineLibassDockerRuntime,
} from '../tool-execution/libass-caption-execution'
import {
  activatePrivateOfflineMediaBinaryRuntime,
  prepareOfflineMediaBinaryDockerRuntime,
} from '../tool-execution/media-binary-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution'
import type {
  OfflineRemotionRenderResult,
  PrivateOfflineRemotionRenderRuntime,
} from '../tool-execution/remotion-render-execution'
import {
  brollRemotionPreviewProxyManifestSchema,
} from '../edit-skills/b-roll/b-roll-active-artifact-contracts'
import {
  brollRemotionLayerManifestSchema,
} from '../edit-skills/b-roll/b-roll-remotion-integration'
import type {
  EditSkillArtifactReference,
  EditSkillArtifactStore,
} from '../edit-skills/core'
import type { ServiceContext } from '../types'
import { ApiError } from '../errors/api-error'

const requestedEvidenceRoot =
  process.env.REEDITPRO_CAPTION_BROLL_APPROVED_EVIDENCE_ROOT?.trim() ?? ''
const requestedPrivateSourcePath =
  process.env.REEDITPRO_CAPTION_BROLL_APPROVED_SOURCE_PATH?.trim() ?? ''
const requestedPrivateSourceSha256 =
  process.env.REEDITPRO_CAPTION_BROLL_APPROVED_SOURCE_SHA256?.trim() ?? ''
const requestedReviewedPreviewSha256 =
  process.env.REEDITPRO_CAPTION_BROLL_APPROVED_REVIEWED_PREVIEW_SHA256?.trim()
    ?? ''
const requestedExactFrameReview =
  process.env.REEDITPRO_CAPTION_BROLL_APPROVED_EXACT_FRAME_REVIEW?.trim()
    === '1'
const realPrivateExecution = requestedEvidenceRoot.length > 0 ||
  requestedPrivateSourcePath.length > 0 ||
  requestedPrivateSourceSha256.length > 0
if (realPrivateExecution && (
  requestedEvidenceRoot.length === 0 ||
  requestedPrivateSourcePath.length === 0 ||
  !/^[a-f0-9]{64}$/u.test(requestedPrivateSourceSha256)
)) {
  throw new Error(
    'Real approved Caption+B-roll execution requires an evidence root, source path, and exact source SHA-256.',
  )
}
if (requestedReviewedPreviewSha256.length > 0 && (
  !realPrivateExecution ||
  !/^[a-f0-9]{64}$/u.test(requestedReviewedPreviewSha256)
)) {
  throw new Error(
    'The accepted B-roll preview must be one exact SHA-256 from this private approved run.',
  )
}
if (requestedExactFrameReview
  && requestedReviewedPreviewSha256.length === 0) {
  throw new Error(
    'Exact-frame Caption review requires the accepted preview from the same approved run.',
  )
}
const root = realPrivateExecution
  ? resolve(requestedEvidenceRoot)
  : await mkdtemp(join(tmpdir(), 'reeditpro-caption-broll-approved-run-'))
if (realPrivateExecution) await mkdir(root, { recursive: true })
try {
  const ownerUserId = 'owner.caption-broll.approved-run'
  const workspaceId = 'workspace.caption-broll.approved-run'
  const editSessionId = 'edit.caption-broll.approved-run'
  const admin = membershipAdmin([{ workspaceId, userId: ownerUserId }])
  const context: ServiceContext = {
    env: loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'local',
      WORKER_RUNTIME_MODE: 'local',
      STORAGE_MODE: 'local',
      SUPABASE_URL: 'https://caption-broll-approved-run.supabase.co',
      SUPABASE_ANON_KEY: 'caption-broll-approved-run-anon',
      SUPABASE_SERVICE_ROLE_KEY:
        'caption-broll-approved-run-service-role',
      API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
      REEDITPRO_INTERNAL_SERVICE_TOKEN:
        'caption-broll-approved-run-token-7Gk2Wm9Qx4Nb8Lv5',
      LOCAL_STORAGE_ROOT: root,
    }),
    clients: { admin, public: null },
    requestId: 'caption-broll-approved-run-smoke',
    auth: {
      userId: ownerUserId,
      accessToken: 'caption-broll-approved-run-private-token',
      isMockUser: false,
    },
  }
  const projectService = createProjectService(context)
  const projectName = 'Caption B-roll approved-run harness'
  const persistedProjectMatches = realPrivateExecution
    ? (await projectService.listProjects(workspaceId)).projects.filter(
        (candidate) => candidate.name === projectName,
      )
    : []
  if (persistedProjectMatches.length > 1) {
    throw new Error(
      'The approved Caption+B-roll evidence root contains more than one matching project authority.',
    )
  }
  const project = persistedProjectMatches[0] ?? (
    await projectService.createProject({ workspaceId, name: projectName })
  ).project
  const sourcePath = realPrivateExecution
    ? resolve(requestedPrivateSourcePath)
    : null
  const sourceBytes = sourcePath === null
    ? Buffer.from(
        'canonical-caption-broll-approved-run-private-source-fixture-v1:'
          + 'x'.repeat(256),
      )
    : await readFile(sourcePath)
  const sourceSha256 = sha256(sourceBytes)
  if (realPrivateExecution) {
    assert.equal(
      sourceSha256,
      requestedPrivateSourceSha256,
      'Private source bytes changed before approved execution.',
    )
  }
  const sourceMetadata = sourcePath === null
    ? {
        durationSeconds: 4,
        width: 1_920,
        height: 1_080,
        frameRateNumerator: 30,
        frameRateDenominator: 1,
        videoCodec: 'h264',
        audioCodec: 'aac',
        hasVideo: true,
        hasAudio: true,
      }
    : probePrivateSource(sourcePath)
  const upload = createUploadService(context)
  const uploadIntent = await upload.createUploadIntent({
    workspaceId,
    projectId: project.id,
    uploadPurpose: 'source_media',
    originalFileName: sourcePath === null
      ? 'caption-broll-approved-run.mp4'
      : basename(sourcePath),
    mimeType: 'video/mp4',
    expectedSizeBytes: sourceBytes.byteLength,
    checksumSha256: sourceSha256,
    idempotencyKey: 'caption-broll-approved-run-upload-intent',
  })
  if (uploadIntent.uploadIntent.status === 'signed') {
    await upload.uploadLocalObject(
      uploadIntent.uploadIntent.id,
      workspaceId,
      sourceBytes,
      'video/mp4',
      sourceBytes.byteLength,
    )
  } else if (!['uploaded', 'finalized'].includes(uploadIntent.uploadIntent.status)) {
    throw new Error(
      'The persisted Caption+B-roll source upload is not replayable from its current state.',
    )
  }
  const finalized = await upload.finalizeUploadIntent({
    workspaceId,
    uploadIntentId: uploadIntent.uploadIntent.id,
  })
  assert.equal(finalized.mediaAsset.checksumSha256, sourceSha256)
  assert.ok(finalized.mediaAsset.sizeBytes)
  if (finalized.mediaAsset.storageProvider !== 'local_private') {
    throw new Error('Approved-run fixture requires the exact local private storage owner.')
  }

  const sourceSequenceItemId = 'source.caption-broll.approved-run'
  const uploadedClipId = 'clip.caption-broll.approved-run'
  const sourceMediaAssets:
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] = [{
    mediaAssetId: finalized.mediaAsset.id,
    storageObjectRecordId: finalized.storageObjectRecord.id,
    sourceSequenceItemId,
    uploadedClipId,
    uploadedOrder: 1,
    storageProvider: 'local_private',
    storageBucket: finalized.mediaAsset.storageBucket,
    storagePath: finalized.mediaAsset.storagePath,
    fileName: finalized.mediaAsset.fileName,
    mimeType: finalized.mediaAsset.mimeType,
    byteSize: finalized.mediaAsset.sizeBytes,
    checksumSha256: sourceSha256,
    sourceMetadata: {
      probeStatus: 'probed',
      source: 'local_ffprobe',
      ...sourceMetadata,
    },
    privateArtifact: true,
    publicUrl: null,
    signedUrl: null,
  }]
  const sourceSequence = [{
    sourceSequenceItemId,
    mediaAssetId: finalized.mediaAsset.id,
    uploadedOrder: 1,
    checksumSha256: sourceSha256,
    required: true,
  }]
  const sourceCandidate = (
    await createSourceMediaAuthorityService(context).buildManifestCandidate({
      workspaceId,
      projectId: project.id,
      uploadPurpose: 'source_media',
      orderedItems: sourceSequence,
    })
  ).sourceBindingManifestCandidate
  const sourceMediaAuthority = {
    authorityRevision: sourceCandidate.authorityRevision,
    authorityChecksumSha256: sourceCandidate.authorityChecksumSha256,
    sourceSequenceHash: sourceCandidate.sourceSequenceHash,
    candidateHash: sourceCandidate.candidateHash,
  }

  const exactPreferences = createExactEditPreferenceService(context)
  const expectedPreferenceValues = {
    editLevel: 'premium' as const,
    workflowType: 'simple_clean_edit' as const,
    cleanupPreference: 'preserve_natural' as const,
    visualPreference: 'no_extra_visuals' as const,
    moodStyle: 'clean' as const,
    creditPreference: 'balanced' as const,
    targetPlatform: 'youtube' as const,
  }
  const sourcePreparationEvidenceHash = sha256(
    Buffer.from(`source-ready:${sourceCandidate.candidateHash}`),
  )
  const persistedPreferences = await exactPreferences.getCurrent(
    workspaceId,
    project.id,
    editSessionId,
  )
  let preferenceRecord = persistedPreferences.preferenceRecord
  if (preferenceRecord) {
    assert.deepEqual(preferenceRecord.values, expectedPreferenceValues)
    assert.equal(
      preferenceRecord.planning.sourcePreparation.status,
      'ready',
    )
    assert.equal(
      preferenceRecord.planning.sourcePreparation.evidenceHash,
      sourcePreparationEvidenceHash,
    )
    assert.equal(preferenceRecord.planning.frameConfirmation.status, 'confirmed')
    assert.equal(preferenceRecord.planning.frameConfirmation.aspectRatio, '16:9')
    assert.equal(
      preferenceRecord.planning.frameConfirmation.confirmationId,
      'frame.caption-broll.approved-run',
    )
  } else {
    const initialized = await exactPreferences.initialize({
      workspaceId,
      projectId: project.id,
      editSessionId,
      idempotencyKey: 'caption-broll-approved-run-preferences-initialize',
    })
    const updated = await exactPreferences.updateCurrent({
      workspaceId,
      projectId: project.id,
      editSessionId,
      expectedRevision: initialized.preferenceRecord.recordRevision,
      patch: expectedPreferenceValues,
      idempotencyKey: 'caption-broll-approved-run-preferences-update',
    })
    preferenceRecord = (
      await exactPreferences.recordPlanningEvidence({
        workspaceId,
        projectId: project.id,
        editSessionId,
        expectedRevision: updated.preferenceRecord.recordRevision,
        sourcePreparation: {
          status: 'ready',
          evidenceHash: sourcePreparationEvidenceHash,
        },
        frameConfirmation: {
          status: 'confirmed',
          aspectRatio: '16:9',
          confirmationId: 'frame.caption-broll.approved-run',
        },
        idempotencyKey: 'caption-broll-approved-run-planning-evidence',
      })
    ).preferenceRecord
  }
  let planningInputAuthority =
    await buildCurrentPlanningInputAuthorityExpectation({
      context,
      scope: {
        localStorageRoot: root,
        ownerUserId,
        workspaceId,
        projectId: project.id,
        editSessionId,
      },
    })
  if (preferenceRecord.lifecycle.locked) {
    assert.ok(preferenceRecord.lifecycle.authorityReferenceId)
    const aggregate = await readPrivateEditAuthorityAggregate({
      localStorageRoot: root,
      ownerUserId,
      workspaceId,
    })
    assert.ok(aggregate)
    const persistedSnapshots = aggregate.snapshots.filter((candidate) =>
      candidate.projectId === project.id
      && candidate.editSessionId === editSessionId
      && (
        preferenceRecord.lifecycle.phase === 'approved_snapshot'
          ? candidate.snapshotId
            === preferenceRecord.lifecycle.authorityReferenceId
          : preferenceRecord.lifecycle.phase === 'credit_reserved'
            ? candidate.reservationId
              === preferenceRecord.lifecycle.authorityReferenceId
            : false
      )
    )
    assert.equal(
      persistedSnapshots.length,
      1,
      'The locked edit preferences must resolve one exact approved snapshot.',
    )
    const persistedApprovedAuthority =
      await createEditPlanningAuthorityService(context)
        .loadApprovedExecutionAuthority(
          persistedSnapshots[0]!.snapshotId,
          workspaceId,
        )
    assert.equal(persistedApprovedAuthority.snapshot.projectId, project.id)
    assert.equal(
      persistedApprovedAuthority.snapshot.editSessionId,
      editSessionId,
    )
    planningInputAuthority =
      planningInputAuthorityExpectationFromResolvedBinding(
        persistedApprovedAuthority.planningInputAuthority,
      )
  }
  const values = preferenceRecord.values
  const plannerInput: PlannerInput = {
    projectName: 'Caption B-roll approved run',
    targetPlatform: values.targetPlatform,
    aspectRatio: '16:9',
    aspectRatioConfirmed: true,
    aspectRatioSource: 'user_selected',
    frameTemplateType: 'youtube_side_panel',
    editingCategory: 'business_brand',
    workflowType: values.workflowType,
    editLevel: values.editLevel,
    structurePreference: 'preserve_source_order',
    moodStyle: values.moodStyle,
    visualPreference: values.visualPreference,
    referenceUrl: '',
    customInstructions:
      'Use readable professional captions and one restrained source-backed B-roll composition.',
    userInstructionHistory: [
      'Use readable professional captions and one restrained source-backed B-roll composition.',
    ],
    creditPreference: values.creditPreference,
    clips: [{
      id: uploadedClipId,
      uploadedOrder: 1,
      fileName: finalized.mediaAsset.fileName,
      duration: '4',
      detectedType: 'Verified uploaded video',
      sourceRole: 'main_story',
      isImportant: true,
    }],
    sourceSequenceMode: 'single_complete_video',
    sourceOrderConfirmed: true,
    cleanupPreference: values.cleanupPreference,
    cleanupPreferenceConfirmed: true,
    preferenceDefaultsApplied: true,
    preferenceSnapshotId:
      preferenceRecord.baseline.preferenceSnapshotId,
    preferencePersistenceSource: 'authenticated_private_internal_backend',
    currentEditPreferenceAuthorityValues: structuredClone(values),
    currentEditPreferenceRecordRevision:
      preferenceRecord.recordRevision,
    currentEditPreferenceRevision:
      preferenceRecord.preferenceRevision,
    currentEditPreferencePlanningInputRevision:
      preferenceRecord.planning.planningInputRevision,
    currentEditPreferenceFingerprintSha256:
      preferenceRecord.planning.preferenceFingerprintSha256,
  }
  const sourceCleanupAuthority =
    createCanonicalSourceAnalysisAuthorityFixture({
      hasSpeech: true,
      workspaceId,
      projectId: project.id,
      editSessionId,
      sourceSequenceItemId,
      mediaAssetId: finalized.mediaAsset.id,
      uploadedOrder: 1,
      checksumSha256: sourceSha256,
      byteLength: sourceBytes.byteLength,
      durationFrames: Math.round(
        sourceMetadata.durationSeconds *
          sourceMetadata.frameRateNumerator /
          sourceMetadata.frameRateDenominator,
      ),
      transcriptText:
        realPrivateExecution
          ? "Hey guys — today. I'm launching my new AI software."
          : 'Ideas move through the frame while captions remain readable.',
    })
  context.canonicalCaptionTranscriptPlanningExpectationOwnerReadPort =
    createCanonicalCaptionTranscriptOwnerReadFixture({
      ownerUserId,
      readSourceAnalysisAuthority: () => sourceCleanupAuthority,
    })

  const approvedRunHarnessInput = {
    context,
    ownerUserId,
    workspaceId,
    projectId: project.id,
    editSessionId,
    outputId: 'output.caption-broll.approved-run',
    plannerInput,
    sourceMediaAssets,
    sourceCleanupAuthority,
    planningInputAuthority,
    sourceMediaAuthority,
    idempotencySeed: 'caption-broll-approved-run',
    approvedAt: '2026-08-07T20:00:00.000Z',
  }
  const run = await createCanonicalCaptionBrollApprovedRunHarness(
    approvedRunHarnessInput,
  )
  assert.equal(
    run.harnessVersion,
    CANONICAL_CAPTION_BROLL_APPROVED_RUN_HARNESS_VERSION,
  )
  assert.equal(run.approved.authority.snapshot.schemaVersion,
    'private-edit-authority-approved-snapshot-v3')
  assert.equal(
    run.approvedEditExecutionPackage.approvedPlanSnapshotId,
    run.approved.authority.snapshot.snapshotId,
  )
  assert.equal(
    run.approvedEditExecutionPackage.componentRefs.bRollSkill?.sha256,
    run.broll.persistedComponent.componentRefs.bRollSkill.sha256,
  )
  assert.equal(
    run.approvedExecutionAuthority.workItems.filter((item) =>
      item.executionInput.bRollAtomicAuthority !== undefined).length,
    13,
  )
  const brollToolContentTypes = new Map(
    run.approvedExecutionAuthority.workItems
      .filter((item) => item.executionInput.bRollAtomicAuthority !== undefined)
      .filter((item) => item.approvedToolIds.length > 0)
      .map((item) => [
        item.executionInput.operation,
        item.expectedOutputs[0]?.contentType,
      ]),
  )
  assert.deepEqual(brollToolContentTypes, new Map([
    ['inspect_b_roll_candidate_with_ffprobe', 'application/json'],
    ['normalize_b_roll_candidate_with_ffmpeg', 'video/x-nut'],
    [
      'prepare_b_roll_remotion_preview_proxy_with_ffmpeg',
      'video/x-matroska',
    ],
    ['render_b_roll_preview', 'video/mp4'],
  ]))
  assert.equal(
    run.approvedExecutionAuthority.workItems.filter((item) =>
      item.workerClass === 'canonical_caption_specialist_worker_v1').length,
    17,
  )
  const approvedCaptionOverlay = run.approvedExecutionAuthority.workItems.find(
    (item) => item.executionInput.operation ===
      'render_approved_caption_overlay',
  )
  assert.ok(approvedCaptionOverlay)
  assert.equal(
    (approvedCaptionOverlay.executionInput.structuredPayload as
      Record<string, unknown>).fontPackProfileId,
    realPrivateExecution
      ? 'reeditpro_reviewed_fonts_v2'
      : 'reeditpro_reviewed_fonts_v1',
  )
  assert.ok(run.approvedExecutionAuthority.captionRenderedMediaWorkBinding)
  assert.ok(run.approvedExecutionAuthority.captionPostrenderVisualQaWorkBinding)
  assert.ok(run.approvedExecutionAuthority.captionPrivateReviewDependencyBinding)
  assert.equal(run.runtimeDispatched, false)
  assert.equal(run.providerCalled, false)
  assert.equal(run.assetCreated, false)
  assert.equal(run.finalQaApproved, false)
  assert.equal(run.publicDeliveryCreated, false)
  assert.equal(run.productionAuthorityGranted, false)
  const approvedReviewAuthority =
    deriveCanonicalCaptionBrollApprovedRunReviewAuthority(run)
  assert.equal(
    approvedReviewAuthority.approvedRunLineage.approvedSnapshotRef.contentHash,
    run.approved.authority.snapshot.snapshotHash,
  )
  assert.equal(
    approvedReviewAuthority.approvedRunLineage.executionPackageRef.contentHash,
    run.approvedEditExecutionPackage.packageHash,
  )
  assert.equal(
    approvedReviewAuthority.approvedRunLineage
      .captionPlanningProjectionRef.contentHash,
    run.approvedExecutionAuthority.captionPlanningProjection
      ?.projectionDigestSha256,
  )
  assert.equal(
    approvedReviewAuthority.approvedRunLineage
      .captionRenderedMediaWorkBindingRef.contentHash,
    run.approvedExecutionAuthority.captionRenderedMediaWorkBinding
      ?.bindingDigestSha256,
  )
  assert.equal(approvedReviewAuthority.confirmedOutputFrame.width, 3_840)
  assert.equal(approvedReviewAuthority.confirmedOutputFrame.height, 2_160)
  assert.equal(approvedReviewAuthority.confirmedOutputFrame.fpsNumerator, 30)
  assert.equal(
    approvedReviewAuthority.masterTimingHash,
    run.captionRequest.masterTimingRef.contentHash,
  )
  const brollOwnerReadRequest =
    deriveCanonicalCaptionBrollApprovedRunOwnerReadRequest(run)
  assert.equal(
    brollOwnerReadRequest.canonicalScope.approvedSnapshotRef.contentHash,
    run.approved.authority.snapshot.snapshotHash,
  )
  assert.equal(
    brollOwnerReadRequest.canonicalScope.outputFrameRef.contentHash,
    approvedReviewAuthority.confirmedOutputFrame.frameRef.contentHash,
  )
  assert.equal(
    brollOwnerReadRequest.canonicalScope.masterTimingHash,
    approvedReviewAuthority.masterTimingHash,
  )
  assert.equal(
    brollOwnerReadRequest.planningConstraintRef.contentHash,
    run.broll.plan.planHash,
  )

  const soundStructuralFixture =
    createCanonicalCaptionSoundSyncStructuralSupportFixture({ context })
  context.canonicalCaptionSoundSupportInputReadPort =
    soundStructuralFixture.inputReadPort
  context.canonicalCaptionSoundSyncEvidenceRepository =
    soundStructuralFixture.evidenceRepository
  const resolveCaptionSupportRequirement = async (
    requirement: Parameters<
      NonNullable<Parameters<
        typeof executeCanonicalCaptionApprovedJobClosure
      >[0]['resolveCaptionSupportRequirement']>
    >[0],
  ) => {
    const target = requirement.supportRequestRefs[0]?.targetSkillKey
    if (target === 'visual_intelligence') {
      const fixture =
        await injectCanonicalCaptionVisualIntelligenceStructuralSupport({
          context,
          requirement,
          now: () => new Date('2026-08-07T20:05:00.000Z'),
        })
      assert.equal(fixture.structuralFixtureOnly, true)
      assert.equal(fixture.privateQualificationEvidence, false)
      return
    }
    if (target === 'track_all') {
      const fixture = await injectCanonicalCaptionTrackAllStructuralSupport({
        context,
        requirement,
      })
      assert.equal(fixture.structuralFixtureOnly, true)
      assert.equal(fixture.privateQualificationEvidence, false)
      return
    }
    if (target === 'soundsync') {
      const fixture = await soundStructuralFixture.inject(requirement)
      assert.equal(fixture.structuralFixtureOnly, true)
      assert.equal(fixture.privateQualificationEvidence, false)
      return
    }
    throw new Error(
      `Caption approved campaign has no structural owner fixture for ${target ?? 'unknown'}.`,
    )
  }
  const objectPort = createCanonicalPrivateLocalJsonObjectPort({
    localStorageRoot: root,
  })
  const crossSystemComposition =
    createCanonicalCaptionCrossSystemExecutionInputPrivateComposition({
      objectPort,
      sourceReadPort: createCanonicalCaptionCrossSystemSourceReadPort(
        async ({ call }) =>
          createCanonicalCaptionTransitionCrossSystemSourceFixture(
            call,
            `plan.${call.canonicalScope.approvedSnapshotRef?.id
              ?? 'unapproved'}`,
          )),
      prefix:
        'private-internal/captions-specialist/v1/cross-system-transition',
    })
  context.canonicalCaptionCrossSystemExecutionInputReadPort =
    crossSystemComposition.readPort
  await assert.rejects(
    () => executeCanonicalCaptionApprovedJobClosure({
      context,
      approvedRun: run,
      idempotencySeed: 'caption-broll-approved-run-execution',
      resolveCaptionSupportRequirement,
    }),
    (error: unknown) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.code, 'JOB_DEPENDENCY_NOT_READY')
      assert.equal(
        (error.details as Record<string, unknown>).requiredGate,
        'canonical_caption_postapproval_finish_binding',
      )
      assert.equal(
        (error.details as Record<string, unknown>)
          .callerSuppliedEvidenceAccepted,
        false,
      )
      return true
    },
  )
  const resolveCaptionPostapprovalFinishRequirement =
    createSourceContractPostapprovalFinishResolver({
      run,
      objectPort,
    })
  const createBrollArtifactStore = () =>
    createCanonicalPrivateEditSkillArtifactStore({
      objectPort,
      schemas: editSkillArtifactSchemaRegistry,
      prefix: 'private/edit-skills/caption-broll-approved-runtime/v1',
    })
  const postrenderVisualIntelligenceEvidenceRepository =
    createCanonicalCaptionPostrenderVisualIntelligenceEvidenceRepository({
      objectPort,
    })
  let captionOverlaySha256: string | null = null
  let remotionRuntime: PrivateOfflineRemotionRenderRuntime | null = null
  const captionExecutionResult = realPrivateExecution
    ? await (async () => {
        const inspectionRoot = join(
          root,
          'caption-broll-approved-private-inspection',
        )
        await mkdir(inspectionRoot, { recursive: true })
        const preparedLibass = await prepareOfflineLibassDockerRuntime()
        const activatedLibass =
          await activatePrivateOfflineLibassCaptionRuntime()
        assert.equal(
          activatedLibass.image.imageIdentityHash,
          preparedLibass.imageIdentityHash,
        )
        const libass = await openPrivateOfflineLibassCaptionRuntime()
        const caption = await libass.execute({
          schemaVersion: 'offline-libass-caption-execution-v1',
          toolId: 'libass',
          operationId: 'tool.libass.render_approved_caption_track.v1',
          payload: {
            captionProfileId: 'approved_ass_track_render_v1',
            fontPackProfileId: 'reeditpro_reviewed_fonts_v1',
            collisionPolicy: 'fail_on_reserved_zone_collision',
            preserveSpeechTiming: true,
            width: 640,
            height: 360,
            timestampMs: 1_500,
            fontSize: 38,
            marginV: 42,
            alignment: 2,
            caption: "I'm launching my new AI software.",
          },
        })
        assert.equal(
          caption.evidence.semanticEvidence.actualAssReadMemoryExecuted,
          true,
        )
        assert.equal(
          caption.evidence.semanticEvidence.actualAssRenderFrameExecuted,
          true,
        )
        assert.equal(
          caption.evidence.semanticEvidence.approvedFontPackUsed,
          true,
        )
        assert.equal(
          caption.evidence.semanticEvidence.transparentRgbaOverlayProduced,
          true,
        )
        const captionPath = join(inspectionRoot, 'caption-overlay.png')
        await writeFile(captionPath, caption.imageArtifact.bytes)

        await prepareOfflineMediaBinaryDockerRuntime()
        const mediaRuntime =
          await activatePrivateOfflineMediaBinaryRuntime()
        await prepareOfflineRemotionDockerRuntime()
        remotionRuntime = await activatePrivateOfflineRemotionRenderRuntime()
        const execution = await executeCanonicalCaptionBrollApprovedRun({
          context,
          approvedRun: run,
          idempotencySeed: 'caption-broll-approved-real-execution',
          resolveCaptionSupportRequirement,
          resolveCaptionPostapprovalFinishRequirement,
          createBrollArtifactStore,
          brollExecution: {
            sourceBytes,
            captionOverlay: {
              reference: {
                artifactType: 'caption_overlay_png_v1',
                sha256: caption.imageArtifact.sha256,
                byteLength: caption.imageArtifact.bytes.byteLength,
                ownerUserId,
                workspaceId,
                projectId: project.id,
              },
              bytes: caption.imageArtifact.bytes,
              reservedZoneCount: 1,
            },
            mediaRuntime,
            remotionRuntime,
            integrationInfrastructureCostMicros: 7_500,
            now: () => '2026-08-07T20:10:00.000Z',
          },
        })
        captionOverlaySha256 = caption.imageArtifact.sha256
        return execution
      })()
    : await executeCanonicalCaptionApprovedJobClosure({
        context,
        approvedRun: run,
        idempotencySeed: 'caption-broll-approved-run-execution',
        resolveCaptionSupportRequirement,
        resolveCaptionPostapprovalFinishRequirement,
      })
  const captionExecution = captionExecutionResult
  assert.equal(captionExecution.captionJobCount, 17)
  assert.ok(captionExecution.captionSupportResumeCount >= 0)
  assert.equal(captionExecution.captionPostapprovalFinishResumeCount, 1)
  assert.equal(captionExecution.preFinishCaptionJobCount, 10)
  assert.equal(captionExecution.postapprovalFinishBoundCaptionJobCount, 7)
  assert.equal(
    captionExecution.firstPostapprovalFinishResumeAfterCaptionJobCount,
    10,
  )
  assert.equal(
    captionExecution.captionApprovedExecutionCoverage
      .counts.declaredCaptionJobTypes,
    41,
  )
  assert.equal(
    captionExecution.captionApprovedExecutionCoverage
      .counts.uniqueCoveredCaptionJobTypes,
    17,
  )
  assert.equal(
    captionExecution.captionApprovedExecutionCoverage
      .counts.missingCaptionJobTypes,
    24,
  )
  assert.deepEqual(
    captionExecution.captionApprovedExecutionCoverage
      .declaredCaptionJobTypes,
    CAPTIONS_SUPPORTED_JOB_TYPES,
  )
  assert.equal(
    captionExecution.captionApprovedExecutionCoverage.disposition,
    'partial_catalog_execution_coverage',
  )
  assert.equal(
    captionExecution.captionApprovedExecutionCoverage
      .preterminalApprovedExecutionEvidenceOnly,
    true,
  )
  assert.equal(
    captionExecution.captionApprovedExecutionCoverage
      .terminalQualificationClaimed,
    false,
  )
  assert.equal(
    captionExecution.captionApprovedExecutionCoverageCreateOnlyRereadVerified,
    true,
  )
  assert.equal(
    captionExecution.captionApprovedExecutionCoverageIdenticalReplayVerified,
    true,
  )
  assert.match(
    captionExecution.captionApprovedExecutionCoveragePersistenceDisposition,
    /^(?:created|identical_replay)$/u,
  )
  const baseTranscriptOwnerReadPort =
    context.canonicalCaptionTranscriptPlanningExpectationOwnerReadPort
  let advancedApprovedExecutionCampaign: Awaited<ReturnType<
    typeof executeSourceAdvancedApprovedExecutionCampaign
  >> | null = null
  try {
    if (!realPrivateExecution) {
      advancedApprovedExecutionCampaign =
        await executeSourceAdvancedApprovedExecutionCampaign({
          objectPort,
          resolveCaptionSupportRequirement,
          baselineCoveredJobTypes:
            captionExecution.captionApprovedExecutionCoverage
              .coveredCaptionJobTypes,
          async createScenarioInput(scenario, index) {
            const scenarioEditSessionId =
              `${editSessionId}.scenario.${scenario.scenarioId}`
            const scenarioPreferenceService =
              createExactEditPreferenceService(context)
            const initialized = await scenarioPreferenceService.initialize({
              workspaceId,
              projectId: project.id,
              editSessionId: scenarioEditSessionId,
              idempotencyKey:
                `caption-approved-scenario.${scenario.scenarioId}.preferences.initialize`,
            })
            const updated = await scenarioPreferenceService.updateCurrent({
              workspaceId,
              projectId: project.id,
              editSessionId: scenarioEditSessionId,
              expectedRevision:
                initialized.preferenceRecord.recordRevision,
              patch: expectedPreferenceValues,
              idempotencyKey:
                `caption-approved-scenario.${scenario.scenarioId}.preferences.update`,
            })
            const recorded = await scenarioPreferenceService
              .recordPlanningEvidence({
                workspaceId,
                projectId: project.id,
                editSessionId: scenarioEditSessionId,
                expectedRevision: updated.preferenceRecord.recordRevision,
                sourcePreparation: {
                  status: 'ready',
                  evidenceHash: sourcePreparationEvidenceHash,
                },
                frameConfirmation: {
                  status: 'confirmed',
                  aspectRatio: '16:9',
                  confirmationId:
                    `frame.caption-approved-scenario.${scenario.scenarioId}`,
                },
                idempotencyKey:
                  `caption-approved-scenario.${scenario.scenarioId}.planning-evidence`,
              })
            const scenarioPlanningInputAuthority =
              await buildCurrentPlanningInputAuthorityExpectation({
                context,
                scope: {
                  localStorageRoot: root,
                  ownerUserId,
                  workspaceId,
                  projectId: project.id,
                  editSessionId: scenarioEditSessionId,
                },
              })
            const scenarioSourceCleanupAuthority =
              createCanonicalSourceAnalysisAuthorityFixture({
                hasSpeech: true,
                workspaceId,
                projectId: project.id,
                editSessionId: scenarioEditSessionId,
                sourceSequenceItemId,
                mediaAssetId: finalized.mediaAsset.id,
                uploadedOrder: 1,
                checksumSha256: sourceSha256,
                byteLength: sourceBytes.byteLength,
                durationFrames: Math.round(
                  sourceMetadata.durationSeconds *
                    sourceMetadata.frameRateNumerator /
                    sourceMetadata.frameRateDenominator,
                ),
                transcriptText:
                  'Ideas move through the frame while captions remain readable.',
              })
            context.canonicalCaptionTranscriptPlanningExpectationOwnerReadPort =
              createCanonicalCaptionTranscriptOwnerReadFixture({
                ownerUserId,
                readSourceAnalysisAuthority: () =>
                  scenarioSourceCleanupAuthority,
              })
            const scenarioPreferences = recorded.preferenceRecord
            return {
              ...approvedRunHarnessInput,
              editSessionId: scenarioEditSessionId,
              outputId:
                `output.caption-approved-scenario.${scenario.scenarioId}`,
              plannerInput: {
                ...structuredClone(plannerInput),
                projectName:
                  `Caption approved scenario ${scenario.scenarioId}`,
                customInstructions: [
                  plannerInput.customInstructions,
                  `Internal scenario identity: ${scenario.scenarioId}.`,
                ].join(' '),
                userInstructionHistory: [
                  ...(plannerInput.userInstructionHistory ?? []),
                  `Internal scenario identity: ${scenario.scenarioId}.`,
                ],
                preferenceSnapshotId:
                  scenarioPreferences.baseline.preferenceSnapshotId,
                currentEditPreferenceAuthorityValues:
                  structuredClone(scenarioPreferences.values),
                currentEditPreferenceRecordRevision:
                  scenarioPreferences.recordRevision,
                currentEditPreferenceRevision:
                  scenarioPreferences.preferenceRevision,
                currentEditPreferencePlanningInputRevision:
                  scenarioPreferences.planning.planningInputRevision,
                currentEditPreferenceFingerprintSha256:
                  scenarioPreferences.planning.preferenceFingerprintSha256,
              },
              sourceCleanupAuthority: scenarioSourceCleanupAuthority,
              planningInputAuthority: scenarioPlanningInputAuthority,
              idempotencySeed:
                `caption-approved-scenario.${scenario.scenarioId}`,
              approvedAt:
                `2026-08-07T20:${String(20 + index).padStart(2, '0')}:00.000Z`,
              captionScenario: scenario,
            }
          },
        })
    }
  } finally {
    context.canonicalCaptionTranscriptPlanningExpectationOwnerReadPort =
      baseTranscriptOwnerReadPort
  }
  if (advancedApprovedExecutionCampaign) {
    assert.equal(advancedApprovedExecutionCampaign.approvedRunCount, 9)
    assert.equal(advancedApprovedExecutionCampaign.coveredJobTypeCount, 30)
    assert.equal(advancedApprovedExecutionCampaign.missingJobTypeCount, 11)
    assert.equal(
      advancedApprovedExecutionCampaign.campaignIdenticalReplayVerified,
      true,
    )
    assert.equal(
      advancedApprovedExecutionCampaign.campaignExactRereadVerified,
      true,
    )
    assert.deepEqual(
      advancedApprovedExecutionCampaign.newlyCoveredJobTypes,
      [
        'resolve_multi_track_caption_scene',
        'resolve_spatial_typography',
        'resolve_subject_occluded_typography',
        'resolve_front_of_subject_typography',
        'resolve_object_anchored_typography',
        'resolve_environmental_typography',
        'resolve_hero_typography',
        'resolve_persistent_topic_typography',
        'repair_caption_scene',
        'recompose_caption_output',
        'inspect_caption_specific_result',
        'provide_typographic_transition_support',
        'prepare_caption_boundary_timing_requirements',
      ],
    )
  }
  const forgedPromotion = structuredClone(
    captionExecution.captionApprovedExecutionCoverage,
  ) as unknown as Record<string, unknown>
  forgedPromotion.terminalQualificationClaimed = true
  forgedPromotion.coverageDigestSha256 = calculateSkillContractDigest(
    forgedPromotion,
    'coverageDigestSha256',
  )
  assert.throws(() =>
    parseCanonicalCaptionApprovedExecutionCoverage(forgedPromotion))
  const duplicateOccurrence = structuredClone(
    captionExecution.captionApprovedExecutionCoverage,
  ) as unknown as Record<string, unknown>
  const duplicateOccurrences = duplicateOccurrence.jobOccurrences as unknown[]
  duplicateOccurrences.push(structuredClone(duplicateOccurrences[0]))
  duplicateOccurrence.coverageDigestSha256 = calculateSkillContractDigest(
    duplicateOccurrence,
    'coverageDigestSha256',
  )
  assert.throws(() =>
    parseCanonicalCaptionApprovedExecutionCoverage(duplicateOccurrence))
  const sceneBoundBoundaryOccurrence = structuredClone(
    captionExecution.captionApprovedExecutionCoverage,
  ) as unknown as Record<string, unknown>
  const boundaryOccurrence = (sceneBoundBoundaryOccurrence
    .jobOccurrences as Array<Record<string, unknown>>)[0]!
  boundaryOccurrence.scopeLevel = 'boundary'
  boundaryOccurrence.sceneId = 'scene.caption.boundary-regression'
  boundaryOccurrence.boundaryId = 'boundary.caption.regression'
  sceneBoundBoundaryOccurrence.coverageDigestSha256 =
    calculateSkillContractDigest(
      sceneBoundBoundaryOccurrence,
      'coverageDigestSha256',
    )
  assert.doesNotThrow(() =>
    parseCanonicalCaptionApprovedExecutionCoverage(
      sceneBoundBoundaryOccurrence))
  assert.ok(captionExecution.captionExecutions.every((item) =>
    item.initialResponse.result.qaOutcome === 'passed'
    && item.replayResponse.evidence.idempotentAdapterReplay))
  assert.equal(captionExecution.providerCallPerformedByHarness, false)
  assert.equal(captionExecution.publicDeliveryCreated, false)
  assert.equal(captionExecution.productionAuthorityGranted, false)
  const snapshot = run.approved.authority.snapshot
  const qualificationRequest =
    createCanonicalCaptionTerminalQualificationRequest({
      requestId: 'caption.broll-approved-run.qualification-readiness',
      canonicalScope: {
        ownerUserId,
        workspaceId,
        projectId: project.id,
        editSessionId,
        planVersionId: `${snapshot.planId}.v${snapshot.planVersion}`,
        approvedSnapshotRef: {
          id: snapshot.snapshotId,
          version: snapshot.schemaVersion,
          contentHash: snapshot.snapshotHash,
        },
      },
      executionPackageRef: {
        id: run.approvedEditExecutionPackage.packageRecordId,
        version: run.approvedEditExecutionPackage.schemaVersion,
        contentHash: run.approvedEditExecutionPackage.packageHash,
      },
      currentJobReadinessRef: {
        id: CAPTION_CURRENT_JOB_READINESS_LEDGER_V2.ledgerId,
        version: CAPTION_CURRENT_JOB_READINESS_LEDGER_V2.schemaVersion,
        contentHash:
          CAPTION_CURRENT_JOB_READINESS_LEDGER_V2.ledgerDigestSha256,
      },
      requiredOutputIds: [run.captionRequest.canonicalScope.outputId],
      privateInternalQualificationRun: true,
      callerSuppliedEvidenceAccepted: false,
      browserLocalCompletionAccepted: false,
      rawChatMediaBytesPathsUrlsOrCredentialsIncluded: false,
      operationOrRuntimeAuthorityGrantedToCaption: false,
      providerOrModelAuthorityGrantedToCaption: false,
      assetMutationAuthorityGrantedToCaption: false,
      finalQaApprovalAuthorityGrantedToCaption: false,
      creditOrBillingAuthorityGrantedToCaption: false,
      publicDeliveryAuthorityGrantedToCaption: false,
      productionAuthorityGrantedToCaption: false,
    })
  const qualificationReadinessService =
    createCanonicalCaptionQualificationRunReadinessService({
      context,
      supportResumeRepository:
        createCanonicalSpecialistSupportResumeRepository({
          objectPort,
          prefix: [
            'private-internal/captions-specialist/v1',
            ownerUserId,
            workspaceId,
          ].join('/'),
        }),
      transcriptEvidenceRepository:
        createCanonicalCaptionTranscriptEvidenceRepository({ objectPort }),
      visualIntelligenceEvidenceRepository:
        createCanonicalCaptionVisualIntelligenceEvidenceRepository({
          objectPort,
        }),
      trackAllEvidenceRepository:
        createCanonicalCaptionTrackAllEvidenceRepository({ objectPort }),
      soundSyncEvidenceRepository:
        createCanonicalCaptionSoundSyncEvidenceRepository({ objectPort }),
      brollEvidenceRepository:
        createCanonicalCaptionBrollEvidenceRepository({ objectPort }),
      directVisualInspectionRepository:
        createCanonicalCaptionDirectVisualInspectionRepository({ objectPort }),
    })
  const unmountedQualificationReadiness =
    await qualificationReadinessService.inspectExact({
      request: qualificationRequest,
    })
  assert.equal(
    unmountedQualificationReadiness.disposition,
    'blocked_missing_canonical_evidence',
  )
  assert.equal(
    unmountedQualificationReadiness.firstBlockerCode,
    'postrender_visual_intelligence_evidence_repository_missing',
  )
  assert.equal(unmountedQualificationReadiness.runEvidenceRef, null)
  assert.equal(unmountedQualificationReadiness.terminalStatusClaimed, false)
  context.canonicalCaptionPostrenderVisualIntelligenceEvidenceRepository =
    postrenderVisualIntelligenceEvidenceRepository
  const qualificationReadiness =
    await qualificationReadinessService.inspectExact({
      request: qualificationRequest,
    })
  assert.equal(
    qualificationReadiness.disposition,
    'blocked_missing_canonical_evidence',
  )
  assert.equal(
    qualificationReadiness.firstBlockerCode,
    'postrender_visual_intelligence_evidence_missing',
  )
  assert.equal(qualificationReadiness.runEvidenceRef, null)
  assert.equal(qualificationReadiness.terminalStatusClaimed, false)
  const inspectionPackage = realPrivateExecution
    ? await createApprovedExecutionInspectionPackage({
        root,
        sourceSha256,
        captionOverlaySha256: captionOverlaySha256!,
        execution: captionExecution as CombinedApprovedExecution,
        qualificationReadiness,
      })
    : null
  const emittedInspectionPackage = inspectionPackage as
    ApprovedExecutionInspectionPackage | null
  const creativeReviewInspectionPackage =
    emittedInspectionPackage !== null
    && requestedReviewedPreviewSha256.length > 0
      ? await createApprovedRunCreativeReviewInspectionPackage({
          root,
          run,
          execution: captionExecution as CombinedApprovedExecution,
          artifactStore: createBrollArtifactStore(),
          objectPort,
          remotionRuntime: requiredRemotionRuntime(remotionRuntime),
          baselineInspection: emittedInspectionPackage,
          acceptedPreviewSha256: requestedReviewedPreviewSha256,
          captionOverlaySha256: captionOverlaySha256!,
          renderExactConfirmedFrame: requestedExactFrameReview,
        })
      : null

  console.log(JSON.stringify({
    smoke: 'canonical_caption_broll_approved_run_harness',
    status: 'passed',
    approvedSnapshotCreated: true,
    executionPackageCreated: true,
    captionWorkItems: 17,
    captionApprovedJobsExecuted: captionExecution.captionJobCount,
    captionApprovedExecutionCoveredJobTypeCount:
      captionExecution.captionApprovedExecutionCoverage
        .counts.uniqueCoveredCaptionJobTypes,
    captionApprovedExecutionMissingJobTypeCount:
      captionExecution.captionApprovedExecutionCoverage
        .counts.missingCaptionJobTypes,
    captionApprovedExecutionCoveredJobTypes:
      captionExecution.captionApprovedExecutionCoverage
        .coveredCaptionJobTypes,
    captionApprovedExecutionMissingJobTypeIds:
      captionExecution.captionApprovedExecutionCoverage
        .missingCaptionJobTypes,
    captionApprovedExecutionCoverageRef: {
      id: captionExecution.captionApprovedExecutionCoverage.coverageId,
      version:
        captionExecution.captionApprovedExecutionCoverage.schemaVersion,
      contentHash:
        captionExecution.captionApprovedExecutionCoverage
          .coverageDigestSha256,
    },
    captionApprovedExecutionPackageRef:
      captionExecution.captionApprovedExecutionCoverage.executionPackageRef,
    captionApprovedExecutionSnapshotRef:
      captionExecution.captionApprovedExecutionCoverage
        .canonicalScope.approvedSnapshotRef,
    oneAllFeatureEditFabricated: false,
    captionApprovedExecutionCoveragePreterminalOnly: true,
    captionSupportResumeCount:
      captionExecution.captionSupportResumeCount,
    captionPostapprovalFinishResumeCount:
      captionExecution.captionPostapprovalFinishResumeCount,
    lateCaptionExecutionWithoutFinishBindingRejected: true,
    preFinishCaptionJobsExecutedBeforeLateResume:
      captionExecution.firstPostapprovalFinishResumeAfterCaptionJobCount,
    postapprovalFinishBoundCaptionJobsExecuted:
      captionExecution.postapprovalFinishBoundCaptionJobCount,
    sourceContractPictureLockFixtureRelabeledAsPrivateQualification: false,
    advancedApprovedExecutionCampaign:
      advancedApprovedExecutionCampaign === null ? null : {
        approvedRunCount:
          advancedApprovedExecutionCampaign.approvedRunCount,
        coveredJobTypeCount:
          advancedApprovedExecutionCampaign.coveredJobTypeCount,
        missingJobTypeCount:
          advancedApprovedExecutionCampaign.missingJobTypeCount,
        newlyCoveredJobTypes:
          advancedApprovedExecutionCampaign.newlyCoveredJobTypes,
        campaignRef: advancedApprovedExecutionCampaign.campaignRef,
        campaignPersistenceDisposition:
          advancedApprovedExecutionCampaign.campaignPersistenceDisposition,
        campaignIdenticalReplayVerified:
          advancedApprovedExecutionCampaign.campaignIdenticalReplayVerified,
        campaignExactRereadVerified:
          advancedApprovedExecutionCampaign.campaignExactRereadVerified,
        oneAllFeatureEditFabricated: false,
        terminalQualificationClaimed: false,
      },
    visualIntelligenceSupportEvidenceClass:
      'structural_fixture_not_private_qualification',
    brollWorkItems: 13,
    exactBrollComponentPropagation: true,
    captionDownstreamQaDependenciesBound: true,
    v5CreativeReviewAuthorityDerivedFromExactApprovedRun: true,
    qualificationReadinessFirstBlocker:
      qualificationReadiness.firstBlockerCode,
    unmountedQualificationReadinessFirstBlocker:
      unmountedQualificationReadiness.firstBlockerCode,
    qualificationReadinessDigestSha256:
      qualificationReadiness.readinessDigestSha256,
    incompleteRunPromotedToQualification: false,
    planningHarnessRuntimeDispatched: false,
    canonicalCaptionPlanningJobsExecuted: true,
    actualMediaExecutionCompleted: realPrivateExecution,
    directVisualInspectionPending: emittedInspectionPackage !== null,
    inspectionPackageSha256:
      emittedInspectionPackage?.packageSha256 ?? null,
    inspectionPackagePath: emittedInspectionPackage === null
      ? null
      : join(
          root,
          'caption-broll-approved-private-inspection',
          'inspection-package.json',
        ),
    professionalCreativeReviewRendered:
      creativeReviewInspectionPackage !== null,
    professionalCreativeReviewInspectionPackageSha256:
      creativeReviewInspectionPackage?.proxy.packageSha256 ?? null,
    professionalCreativeReviewInspectionPackagePath:
      creativeReviewInspectionPackage === null
        ? null
        : join(
            root,
            'caption-broll-approved-professional-review',
            'inspection-package.json',
          ),
    exactFrameCreativeReviewRendered:
      creativeReviewInspectionPackage?.exactFrame !== null
      && creativeReviewInspectionPackage?.exactFrame !== undefined,
    exactFrameCreativeReviewInspectionPackageSha256:
      creativeReviewInspectionPackage?.exactFrame?.packageSha256 ?? null,
    exactFrameCreativeReviewInspectionPackagePath:
      creativeReviewInspectionPackage?.exactFrame === null
      || creativeReviewInspectionPackage?.exactFrame === undefined
        ? null
        : join(
            root,
            'caption-broll-approved-exact-frame-review',
            'inspection-package.json',
          ),
    providerCalled: false,
    publicDeliveryCreated: false,
    productionAuthorityGranted: false,
  }, null, 2))
} finally {
  if (!realPrivateExecution) {
    await rm(root, { recursive: true, force: true })
  }
}

interface ApprovedExecutionInspectionPackage {
  readonly schemaVersion:
    'caption-broll-approved-execution-inspection-package-v3'
  readonly sourceEvidenceMode: 'real_private_media'
  readonly sourceSha256: string
  readonly approvedSnapshotRef: {
    readonly id: string
    readonly version: string
    readonly contentHash: string
  }
  readonly captionApprovedJobCount: number
  readonly captionSupportResumeCount: number
  readonly brollApprovedWorkItemCount: number
  readonly canonicalCaptionReplayVerified: true
  readonly canonicalBrollRestartReplayVerified: true
  readonly captionOverlaySha256: string
  readonly previewSha256: string
  readonly previewFrameCount: number
  readonly previewFps: number
  readonly contactSheet: {
    readonly fileName: string
    readonly sha256: string
    readonly representsEveryFrame: true
  }
  readonly sampleFrames: readonly {
    readonly frameIndex: number
    readonly fileName: string
    readonly sha256: string
  }[]
  readonly captionSampleStrips: readonly {
    readonly frameIndex: number
    readonly fileName: string
    readonly sha256: string
  }[]
  readonly captionPixelCoverage: {
    readonly crop: {
      readonly x: 0
      readonly y: 260
      readonly width: 640
      readonly height: 100
    }
    readonly expectedVisiblePixelCount: number
    readonly minimumCoverageBasisPoints: number
    readonly maximumCoverageBasisPoints: number
    readonly everyFrameCoverageVerified: true
  }
  readonly qualificationReadiness: {
    readonly id: string
    readonly version: string
    readonly contentHash: string
    readonly disposition: 'blocked_missing_canonical_evidence'
    readonly firstBlockerCode:
      'postrender_visual_intelligence_evidence_missing'
    readonly terminalStatusClaimed: false
  }
  readonly structuralVisualIntelligenceFixtureExcludedFromQualification: true
  readonly directRasterInspectionRequired: true
  readonly providerCalled: false
  readonly publicDeliveryCreated: false
  readonly productionAuthorityGranted: false
  readonly packageSha256: string
}

type CombinedApprovedExecution = Awaited<ReturnType<
  typeof executeCanonicalCaptionBrollApprovedRun
>>

type ApprovedRun = Awaited<ReturnType<
  typeof createCanonicalCaptionBrollApprovedRunHarness
>>

interface ApprovedRunCreativeReviewInspectionPackage {
  readonly schemaVersion:
    'caption-broll-approved-run-professional-review-inspection-package-v1'
  readonly baselinePreviewSha256: string
  readonly ownerRequestRef: {
    readonly id: string
    readonly version: string
    readonly contentHash: string
  }
  readonly ownerResultRef: {
    readonly id: string
    readonly version: string
    readonly contentHash: string
  }
  readonly inspectionSourceAuthorityRef: {
    readonly id: string
    readonly version: string
    readonly contentHash: string
  }
  readonly canonicalTranscriptRef: {
    readonly id: string
    readonly version: string
    readonly contentHash: string
  }
  readonly canonicalTranscriptEvidenceRef: {
    readonly id: string
    readonly version: string
    readonly contentHash: string
  }
  readonly outputs: readonly {
    readonly motionVariant: 'full_motion' | 'reduced_motion'
    readonly fileName: string
    readonly sha256: string
    readonly byteLength: number
    readonly width: 640
    readonly height: 360
    readonly fps: 30
    readonly durationFrames: number
    readonly reviewSpecDigestSha256: string
    readonly sampleFrames: readonly {
      readonly frameIndex: number
      readonly fileName: string
      readonly sha256: string
    }[]
  }[]
  readonly exactApprovedRunReread: true
  readonly exactBrollOwnerResultReread: true
  readonly exactCanonicalTranscriptReread: true
  readonly directRasterInspectionRequired: true
  readonly directRasterInspectionCompleted: false
  readonly finalQaApprovalGranted: false
  readonly publicDeliveryGranted: false
  readonly productionAuthorityGranted: false
  readonly packageSha256: string
}

interface ApprovedRunExactFrameReviewInspectionPackage {
  readonly schemaVersion:
    'caption-broll-approved-run-exact-frame-review-inspection-package-v1'
  readonly sourceProxyReviewPackageRef: {
    readonly id: string
    readonly version: string
    readonly contentHash: string
  }
  readonly confirmedOutputFrame: {
    readonly width: 3840
    readonly height: 2160
    readonly fps: 30
    readonly exactConfirmedFrameRendered: true
  }
  readonly sourceProxyFrame: {
    readonly width: 640
    readonly height: 360
    readonly sourceProxyUpscaleRequired: true
    readonly sourceProxyAcceptedAsFinalPictureQuality: false
  }
  readonly outputs: readonly {
    readonly motionVariant: 'full_motion' | 'reduced_motion'
    readonly fileName: string
    readonly sha256: string
    readonly byteLength: number
    readonly width: 3840
    readonly height: 2160
    readonly fps: 30
    readonly durationFrames: number
    readonly exactFrameReviewDigestSha256: string
    readonly runtimeGoldenFrameScaleNumerator: 1
    readonly runtimeGoldenFrameScaleDenominator: 6
    readonly runtimeGoldenFramesAreInspectionProxies: true
    readonly exactFrameRastersMustBeExtractedFromMp4ForInspection: true
    readonly sampleFrames: readonly {
      readonly frameIndex: number
      readonly fileName: string
      readonly sha256: string
      readonly width: 640
      readonly height: 360
    }[]
  }[]
  readonly exactApprovedRunReread: true
  readonly exactConfirmedFrameMatchesApprovedRun: true
  readonly typographyAndLayoutEvaluatedAtConfirmedFrame: true
  readonly directRasterInspectionRequired: true
  readonly directRasterInspectionCompleted: false
  readonly sourceQualityQualificationClaimed: false
  readonly finalCustomerCanvasClaimed: false
  readonly finalQaApprovalGranted: false
  readonly publicDeliveryGranted: false
  readonly productionAuthorityGranted: false
  readonly packageSha256: string
}

async function executeSourceAdvancedApprovedExecutionCampaign(input: {
  objectPort: ReturnType<typeof createCanonicalPrivateLocalJsonObjectPort>
  resolveCaptionSupportRequirement: (
    requirement: CanonicalCaptionSupportResumeRequirement,
  ) => Promise<void>
  baselineCoveredJobTypes: readonly CaptionsSupportedJobType[]
  createScenarioInput: (
    scenario: CanonicalCaptionApprovedRunScenario,
    index: number,
  ) => Promise<CanonicalCaptionBrollApprovedRunHarnessInput>
}) {
  const scenarios: readonly {
    scenario: CanonicalCaptionApprovedRunScenario
    expectedNewJobTypes: readonly CaptionsSupportedJobType[]
  }[] = [{
    scenario: {
      scenarioId: 'speaker-spatial',
      mappedPresetIds: [
        'caption_speaker_identification',
        'spatial_caption_compositing',
      ],
    },
    expectedNewJobTypes: [
      'resolve_multi_track_caption_scene',
      'resolve_spatial_typography',
    ],
  }, {
    scenario: {
      scenarioId: 'persistent-topic',
      mappedPresetIds: ['persistent_topic_list_typography'],
    },
    expectedNewJobTypes: [
      'resolve_spatial_typography',
      'resolve_persistent_topic_typography',
    ],
  }, {
    scenario: {
      scenarioId: 'hero',
      mappedPresetIds: ['hero_typography_direction'],
    },
    expectedNewJobTypes: ['resolve_hero_typography'],
  }, {
    scenario: {
      scenarioId: 'subject-occluded',
      mappedPresetIds: ['subject_occluded_typography'],
    },
    expectedNewJobTypes: ['resolve_subject_occluded_typography'],
  }, {
    scenario: {
      scenarioId: 'front-of-subject',
      mappedPresetIds: ['front_of_subject_typography'],
    },
    expectedNewJobTypes: ['resolve_front_of_subject_typography'],
  }, {
    scenario: {
      scenarioId: 'object-anchored',
      mappedPresetIds: ['object_anchored_typography'],
    },
    expectedNewJobTypes: ['resolve_object_anchored_typography'],
  }, {
    scenario: {
      scenarioId: 'environmental',
      mappedPresetIds: ['environmental_typography'],
    },
    expectedNewJobTypes: ['resolve_environmental_typography'],
  }, {
    scenario: {
      scenarioId: 'caption-sound-boundary',
      mappedPresetIds: ['caption_sound_choreography'],
    },
    expectedNewJobTypes: [
      'provide_typographic_transition_support',
      'prepare_caption_boundary_timing_requirements',
    ],
  }]
  const covered = new Set<CaptionsSupportedJobType>()
  const runRefs: CaptionDomainRef[] = []
  const executeScenario = async (
    entry: (typeof scenarios)[number],
    index: number,
  ) => {
    const scenarioInput = await input.createScenarioInput(
      entry.scenario,
      index,
    )
    const run = await createCanonicalCaptionBrollApprovedRunHarness(
      scenarioInput,
    )
    const projected = run.captionPlanningProjection.projectedJobTypes
    for (const jobType of entry.expectedNewJobTypes) {
      assert.ok(projected.includes(jobType))
    }
    const execution = await executeCanonicalCaptionApprovedJobClosure({
      context: scenarioInput.context,
      approvedRun: run,
      idempotencySeed:
        `${scenarioInput.idempotencySeed}.execution`,
      resolveCaptionSupportRequirement:
        input.resolveCaptionSupportRequirement,
      resolveCaptionPostapprovalFinishRequirement:
        createSourceContractPostapprovalFinishResolver({
          run,
          objectPort: input.objectPort,
        }),
    })
    assert.equal(execution.captionJobCount, projected.length)
    assert.equal(execution.captionPostapprovalFinishResumeCount, 1)
    assert.equal(execution.captionApprovedExecutionCoverage
      .terminalQualificationClaimed, false)
    for (const jobType of execution.captionApprovedExecutionCoverage
      .coveredCaptionJobTypes) covered.add(jobType)
    runRefs.push({
      id: run.approvedEditExecutionPackage.packageRecordId,
      version: run.approvedEditExecutionPackage.schemaVersion,
      contentHash: run.approvedEditExecutionPackage.packageHash,
    })
    return { run, scenarioInput }
  }
  const sourceEntry = scenarios[0]
  if (!sourceEntry) {
    throw new Error(
      'Caption approved scenario campaign has no repair-selection source.',
    )
  }
  const {
    run: postapprovalSourceRun,
  } = await executeScenario(sourceEntry, 0)
  const postapprovalSource =
    deriveCanonicalCaptionApprovedRunPostapprovalSource(
      postapprovalSourceRun,
    )
  const postapprovalScenario: CanonicalCaptionApprovedRunScenario = {
    scenarioId: 'postapproval-repair-lifecycle',
    mappedPresetIds: ['spatial_caption_compositing'],
    postapprovalLifecycleSource: postapprovalSource,
  }
  const preparedPostapprovalInput = await input.createScenarioInput(
    postapprovalScenario,
    scenarios.length,
  )
  const postapprovalInput: CanonicalCaptionBrollApprovedRunHarnessInput = {
    ...preparedPostapprovalInput,
    outputId: postapprovalSource.sourceScope.outputId,
    captionScenario: postapprovalScenario,
  }
  const postapprovalRun =
    await createCanonicalCaptionBrollApprovedRunHarness(postapprovalInput)
  const postapprovalExpectedJobTypes = [
    'repair_caption_scene',
    'recompose_caption_output',
    'inspect_caption_specific_result',
  ] as const
  for (const jobType of postapprovalExpectedJobTypes) {
    assert.ok(
      postapprovalRun.captionPlanningProjection.projectedJobTypes.includes(
        jobType,
      ),
    )
  }
  assert.ok(postapprovalRun.captionPostapprovalJobSelectionRecord)
  assert.equal(
    postapprovalRun.captionPostapprovalJobSelectionRecord
      .privateQualificationEvidence,
    false,
  )
  const postapprovalExecution =
    await executeCanonicalCaptionApprovedJobClosure({
      context: postapprovalInput.context,
      approvedRun: postapprovalRun,
      idempotencySeed:
        `${postapprovalInput.idempotencySeed}.execution`,
      resolveCaptionSupportRequirement:
        input.resolveCaptionSupportRequirement,
      resolveCaptionPostapprovalFinishRequirement:
        createSourceContractPostapprovalFinishResolver({
          run: postapprovalRun,
          objectPort: input.objectPort,
        }),
    })
  assert.equal(
    postapprovalExecution.captionJobCount,
    postapprovalRun.captionPlanningProjection.projectedJobTypes.length,
  )
  assert.equal(
    postapprovalExecution.captionApprovedExecutionCoverage
      .terminalQualificationClaimed,
    false,
  )
  for (const jobType of postapprovalExecution
    .captionApprovedExecutionCoverage.coveredCaptionJobTypes) {
    covered.add(jobType)
  }
  runRefs.push({
    id: postapprovalRun.approvedEditExecutionPackage.packageRecordId,
    version: postapprovalRun.approvedEditExecutionPackage.schemaVersion,
    contentHash: postapprovalRun.approvedEditExecutionPackage.packageHash,
  })
  for (const [index, entry] of scenarios.slice(1).entries()) {
    await executeScenario(entry, index + 1)
  }
  const baseline = new Set(input.baselineCoveredJobTypes)
  const coveredJobTypes = CAPTIONS_SUPPORTED_JOB_TYPES.filter((jobType) =>
    covered.has(jobType))
  const newlyCoveredJobTypes = coveredJobTypes.filter((jobType) =>
    !baseline.has(jobType))
  const missingJobTypes = CAPTIONS_SUPPORTED_JOB_TYPES.filter((jobType) =>
    !covered.has(jobType))
  if (new Set(runRefs.map((ref) => ref.contentHash)).size !== runRefs.length) {
    throw new Error(
      'Caption approved scenario campaign reused an execution package.',
    )
  }
  const coverageRepository =
    createCanonicalCaptionApprovedExecutionCoverageRepository({
      objectPort: input.objectPort,
    })
  const campaign = await assembleCanonicalCaptionApprovedExecutionCampaign({
    executionPackageRefs: runRefs,
    coverageRepository,
  })
  assert.deepEqual(campaign.coveredCaptionJobTypes, coveredJobTypes)
  assert.deepEqual(campaign.missingCaptionJobTypes, missingJobTypes)
  assert.equal(campaign.counts.approvedRuns, 9)
  assert.equal(campaign.counts.distinctApprovedSnapshots, 9)
  assert.equal(campaign.counts.distinctExecutionPackages, 9)
  assert.equal(campaign.oneAllFeatureEditFabricated, false)
  assert.equal(campaign.terminalQualificationClaimed, false)
  const campaignRepository =
    createCanonicalCaptionApprovedExecutionCampaignRepository({
      objectPort: input.objectPort,
    })
  const firstPersistence = await campaignRepository.persistCreateOnly({
    campaign,
  })
  const replayPersistence = await campaignRepository.persistCreateOnly({
    campaign,
  })
  const campaignRef: CaptionDomainRef = {
    id: campaign.campaignId,
    version: campaign.schemaVersion,
    contentHash: campaign.campaignDigestSha256,
  }
  const rereadCampaign = await campaignRepository.rereadExact({ campaignRef })
  assert.ok(rereadCampaign)
  assert.deepEqual(rereadCampaign, campaign)
  assert.match(firstPersistence, /^(?:created|identical_replay)$/u)
  assert.equal(replayPersistence, 'identical_replay')
  await assert.rejects(() =>
    assembleCanonicalCaptionApprovedExecutionCampaign({
      executionPackageRefs: [runRefs[0]!],
      coverageRepository,
    }))
  await assert.rejects(() =>
    assembleCanonicalCaptionApprovedExecutionCampaign({
      executionPackageRefs: [runRefs[0]!, runRefs[0]!],
      coverageRepository,
    }))
  const crossedPackage = structuredClone(campaign)
  crossedPackage.runs[0]!.executionPackageRef = structuredClone(
    crossedPackage.runs[1]!.executionPackageRef)
  crossedPackage.campaignDigestSha256 = calculateSkillContractDigest(
    crossedPackage as unknown as Record<string, unknown>,
    'campaignDigestSha256',
  )
  assert.throws(() =>
    parseCanonicalCaptionApprovedExecutionCampaign(crossedPackage))
  const promoted = structuredClone(campaign) as unknown as Record<
    string,
    unknown
  >
  promoted.terminalQualificationClaimed = true
  promoted.campaignDigestSha256 = calculateSkillContractDigest(
    promoted,
    'campaignDigestSha256',
  )
  assert.throws(() =>
    parseCanonicalCaptionApprovedExecutionCampaign(promoted))
  return Object.freeze({
    approvedRunCount: runRefs.length,
    runRefs: Object.freeze(runRefs.map((ref) => Object.freeze(ref))),
    campaignRef: Object.freeze(campaignRef),
    campaignPersistenceDisposition: firstPersistence,
    campaignIdenticalReplayVerified: true as const,
    campaignExactRereadVerified: true as const,
    coveredJobTypes: Object.freeze(coveredJobTypes),
    newlyCoveredJobTypes: Object.freeze(newlyCoveredJobTypes),
    missingJobTypes: Object.freeze(missingJobTypes),
    coveredJobTypeCount: coveredJobTypes.length,
    missingJobTypeCount: missingJobTypes.length,
    oneAllFeatureEditFabricated: false as const,
    terminalQualificationClaimed: false as const,
  })
}

function postapprovalFinishDependencyKinds():
readonly CaptionFinishDependencyKind[] {
  return [
    'approved_snapshot', 'picture_lock', 'confirmed_output_frame',
    'canonical_transcript', 'word_timing', 'timeline', 'source_ranges',
    'shot_order', 'shot_durations', 'speed_changes', 'crop_reframe',
    'broll_layout', 'living_frame_layout', 'graphics_maps_charts',
    'lower_thirds', 'occupancy', 'near_final_visual_proxy', 'mask',
    'tracking', 'object_anchor', 'transition', 'master_timing',
    'story_timing', 'font_registry', 'caption_style', 'color_proxy',
    'sound_plan', 'renderer_runtime', 'approval_envelope', 'qa_policy',
    'source_asset_manifest', 'reservation_honored',
  ] as const
}

/**
 * Source-contract fixture only. It proves that the canonical runner pauses at
 * the late Caption boundary and resumes only after one exact shared
 * PictureLock/dependency/readiness record is create-only persisted. The
 * fixture is deliberately excluded from terminal/private qualification.
 */
function createSourceContractPostapprovalFinishResolver(input: {
  run: ApprovedRun
  objectPort: ReturnType<typeof createCanonicalPrivateLocalJsonObjectPort>
}) {
  const snapshot = input.run.approved.authority.snapshot
  const projection = input.run.approvedExecutionAuthority
    .captionPlanningProjection
  if (!projection) {
    throw new Error(
      'Caption postapproval source fixture requires its planning projection.',
    )
  }
  const repository = createCanonicalCaptionPostapprovalFinishRepository({
    objectPort: input.objectPort,
    prefix: [
      'private-internal/captions-specialist/v1/postapproval-finish',
      snapshot.approvedByUserId,
      snapshot.workspaceId,
    ].join('/'),
  })
  return async (
    requirement: CanonicalCaptionPostapprovalFinishRequirement,
  ): Promise<void> => {
    const lookup = requirement.lookup
    const expectedSnapshotRef: CaptionDomainRef = {
      id: snapshot.snapshotId,
      version: snapshot.schemaVersion,
      contentHash: snapshot.snapshotHash,
    }
    if (lookup.canonicalScope.ownerUserId !== snapshot.approvedByUserId
      || lookup.canonicalScope.workspaceId !== snapshot.workspaceId
      || lookup.canonicalScope.projectId !== snapshot.projectId
      || lookup.canonicalScope.editSessionId !== snapshot.editSessionId
      || lookup.canonicalScope.planVersionId !==
        `${snapshot.planId}.v${snapshot.planVersion}`
      || !sameCaptionRef(
        lookup.canonicalScope.approvedSnapshotRef,
        expectedSnapshotRef,
      )
      || lookup.canonicalScope.outputId !== projection.outputId
      || !projection.projectedSceneIds.includes(
        lookup.canonicalScope.sceneId,
      )) {
      throw new Error(
        'Caption postapproval source fixture rejected crossed approved scope.',
      )
    }
    const frame = input.run.captionRequest.confirmedOutputFrame
    const [aspectRatioNumerator, aspectRatioDenominator] = reduceRatio(
      frame.width,
      frame.height,
    )
    const sourceFixtureRef = (
      id: string,
      version: string,
      seed: unknown,
    ): CaptionDomainRef => ({
      id,
      version,
      contentHash: calculateSkillContractDigest({
        schemaVersion: 'caption-postapproval-source-contract-seed-v1',
        seed,
        contentHash: '',
      }, 'contentHash'),
    })
    const sourceAssetManifestRef: CaptionDomainRef = {
      id: `${snapshot.snapshotId}.approved-source-asset-manifest`,
      version: 'private-edit-source-asset-manifest-v1',
      contentHash: snapshot.approvedSourceAssetManifestHash,
    }
    const brollComponentRef = snapshot.componentRefs.bRollSkill
    if (!brollComponentRef) {
      throw new Error(
        'Caption postapproval source fixture requires exact B-roll lineage.',
      )
    }
    const timelineVersionRef = sourceFixtureRef(
      `${snapshot.snapshotId}.timeline`,
      'canonical-approved-timeline-v1',
      { snapshotHash: snapshot.snapshotHash, timingHash: snapshot.timingHash },
    )
    const sourceRangesRef = sourceFixtureRef(
      `${snapshot.snapshotId}.source-ranges`,
      'canonical-approved-source-ranges-v1',
      snapshot.sourceSequenceHash,
    )
    const shotOrderRef = sourceFixtureRef(
      `${snapshot.snapshotId}.shot-order`,
      'canonical-approved-shot-order-v1',
      input.run.canonicalPlan.components.segments.map((segment) =>
        segment.segmentId),
    )
    const shotDurationsRef = sourceFixtureRef(
      `${snapshot.snapshotId}.shot-durations`,
      'canonical-approved-shot-durations-v1',
      input.run.canonicalPlan.components.segments.map((segment) => ({
        sceneId: segment.segmentId,
        startFrame: segment.startFrame,
        endFrameExclusive: segment.endFrameExclusive,
      })),
    )
    const speedChangesRef = sourceFixtureRef(
      `${snapshot.snapshotId}.speed-changes`,
      'canonical-approved-speed-changes-v1',
      { approvedPlanHash: snapshot.planHash, speedChanges: [] },
    )
    const transitionsRef = sourceFixtureRef(
      `${snapshot.snapshotId}.transitions`,
      'canonical-approved-transitions-v1',
      {
        selected: false,
        snapshotHash: snapshot.snapshotHash,
      },
    )
    const cropReframeRef = sourceFixtureRef(
      `${projection.outputId}.crop-reframe`,
      'canonical-approved-crop-reframe-v1',
      { frame: frame.confirmedOutputFrameRef, aspectRatioNumerator,
        aspectRatioDenominator },
    )
    const brollLayoutRef: CaptionDomainRef = {
      id: `${snapshot.snapshotId}.component.b-roll-skill`,
      version: 'private-edit-authority-json-blob-v1',
      contentHash: brollComponentRef.sha256,
    }
    const livingFrameLayoutRef = sourceFixtureRef(
      `${projection.outputId}.living-frame-layout`,
      'canonical-approved-living-frame-layout-v1',
      { selected: false, snapshotHash: snapshot.snapshotHash },
    )
    const graphicsMapsChartsRef = sourceFixtureRef(
      `${projection.outputId}.graphics-maps-charts`,
      'canonical-approved-graphics-maps-charts-v1',
      { selected: false, snapshotHash: snapshot.snapshotHash },
    )
    const lowerThirdsRef = sourceFixtureRef(
      `${projection.outputId}.lower-thirds`,
      'canonical-approved-lower-thirds-v1',
      { selected: false, snapshotHash: snapshot.snapshotHash },
    )
    const maskTrackingAnchorRef = sourceFixtureRef(
      `${projection.outputId}.mask-tracking-anchor`,
      'canonical-approved-mask-tracking-anchor-v1',
      { selected: false, snapshotHash: snapshot.snapshotHash },
    )
    const occupancyRef = sourceFixtureRef(
      `${projection.outputId}.occupancy`,
      'canonical-approved-occupancy-v1',
      { brollLayoutRef, captionReservation: projection.earlyPlanningBundleRef },
    )
    const nearFinalVisualProxyRef = sourceFixtureRef(
      `${projection.outputId}.source-contract-near-final-proxy`,
      'caption-source-contract-near-final-visual-proxy-v1',
      { executionPackage: lookup.executionPackageRef,
        privateQualificationEvidence: false },
    )
    const colorLookRef = sourceFixtureRef(
      `${projection.outputId}.color-look`,
      'canonical-approved-color-look-v1',
      { snapshotHash: snapshot.snapshotHash, selected: false },
    )
    const rendererPlanRef = sourceFixtureRef(
      `${projection.outputId}.renderer-plan`,
      'canonical-approved-renderer-plan-v1',
      input.run.approvedExecutionAuthority.captionRenderedMediaWorkBinding,
    )
    const pictureLock = createCanonicalPictureLockManifest({
      manifestId:
        `picture-lock.caption-source-contract.${snapshot.snapshotId}`,
      canonicalScope: {
        ownerUserId: snapshot.approvedByUserId,
        workspaceId: snapshot.workspaceId,
        projectId: snapshot.projectId,
        editSessionId: snapshot.editSessionId,
        planVersionId: `${snapshot.planId}.v${snapshot.planVersion}`,
        approvedSnapshotRef: expectedSnapshotRef,
      },
      confirmedOutputFrame: {
        outputId: projection.outputId,
        width: frame.width,
        height: frame.height,
        aspectRatioNumerator,
        aspectRatioDenominator,
        fpsNumerator: frame.fpsNumerator,
        fpsDenominator: frame.fpsDenominator,
        totalFrames: input.run.captionRequest.totalFrames,
        confirmedOutputFrameDigestSha256:
          frame.confirmedOutputFrameRef.contentHash,
      },
      timelineBindings: {
        timelineVersionRef,
        sourceRangesRef,
        shotOrderRef,
        shotDurationsRef,
        speedChangesRef,
        transitionsRef,
        masterTimingRef: input.run.captionRequest.masterTimingRef,
      },
      compositionBindings: {
        cropReframeRef,
        brollLayoutRef,
        livingFrameLayoutRef,
        graphicsMapsChartsRef,
        lowerThirdsRef,
        maskTrackingAnchorRef,
        occupancyRef,
        nearFinalVisualProxyRef,
        colorLookRef,
        rendererPlanRef,
      },
      sourceAssetManifestRef,
      lockedSceneIds: [...projection.projectedSceneIds],
      lockState: 'locked',
      approvedExceptions: [],
      lockedAt: '2026-08-07T20:06:00.000Z',
      lockedByRef: sourceFixtureRef(
        `${snapshot.snapshotId}.picture-lock-owner`,
        'canonical-edit-picture-lock-source-contract-fixture-v1',
        { snapshotHash: snapshot.snapshotHash,
          privateQualificationEvidence: false },
      ),
      immutable: true,
      sharedEditArchitectureOwner: 'canonical_edit_picture_lock',
      captionOwnsPictureLock: false,
      rawChatIncluded: false,
      mediaBytesIncluded: false,
      privateArtifact: true,
      publicDeliveryAuthorityClaimed: false,
      productionAuthorityClaimed: false,
    })
    const transcript = await readExactApprovedRunTranscript({
      run: input.run,
      objectPort: input.objectPort,
    })
    const transcriptRef: CaptionDomainRef = {
      id: transcript.transcriptRecord.canonicalTranscript.transcriptId,
      version:
        transcript.transcriptRecord.canonicalTranscript.schemaVersion,
      contentHash:
        transcript.transcriptRecord.canonicalTranscript
          .transcriptDigestSha256,
    }
    const dependencyRef = (
      kind: CaptionFinishDependencyKind,
    ): CaptionDomainRef => {
      const locked = pictureLockDependencyRef(pictureLock, kind)
      if (locked) return locked
      if (kind === 'canonical_transcript' || kind === 'word_timing') {
        return transcriptRef
      }
      if (kind === 'story_timing') {
        return input.run.captionRequest.masterTimingRef
      }
      if (kind === 'source_asset_manifest') return sourceAssetManifestRef
      return sourceFixtureRef(
        `${projection.outputId}.caption-${kind}`,
        `canonical-caption-${kind}-source-contract-v1`,
        { earlyPlanningBundleRef: projection.earlyPlanningBundleRef,
          snapshotHash: snapshot.snapshotHash, kind },
      )
    }
    const observations: CaptionDependencyObservation[] =
      postapprovalFinishDependencyKinds().map((dependencyKind) => {
        const evidenceRef = dependencyRef(dependencyKind)
        return {
          dependencyId:
            `caption.postapproval.${lookup.canonicalScope.sceneId}.${dependencyKind}`,
          dependencyKind,
          ownerKey: `canonical_owner.${dependencyKind}`,
          requiredForSceneIds: [lookup.canonicalScope.sceneId],
          requirement: 'required',
          lockedRef: evidenceRef,
          currentRef: evidenceRef,
          approvedExceptionRef: null,
          fallbackAuthorizationRef: null,
          selectedFallbackId: null,
        }
      })
    const dependencyManifest = createCaptionDependencyManifest({
      manifestId:
        `caption.postapproval.dependencies.${lookup.canonicalScope.sceneId}`,
      canonicalScope: {
        ...structuredClone(lookup.canonicalScope),
        sceneId: null,
        authorizedFrameRanges: [{
          startFrame: 0,
          endFrameExclusive: input.run.captionRequest.totalFrames,
        }],
      },
      pictureLock,
      earlyPlanningBundleRef: projection.earlyPlanningBundleRef,
      sceneIds: [lookup.canonicalScope.sceneId],
      observations,
    })
    const finishReadiness = createCaptionFinishReadiness({
      readinessId:
        `caption.postapproval.readiness.${lookup.canonicalScope.sceneId}`,
      dependencyManifest,
      pictureLock,
    })
    const record = createCanonicalCaptionPostapprovalFinishRecord({
      lookup,
      pictureLock,
      dependencyManifest,
      finishReadiness,
    })
    const disposition = await repository.persistCreateOnly({ record })
    assert.match(disposition, /^(?:created|identical_replay)$/u)
    assert.equal(record.binding.pictureLockAuthorityGrantedToCaption, false)
    assert.equal(record.binding.productionAuthorityGrantedToCaption, false)
  }
}

function pictureLockDependencyRef(
  lock: ReturnType<typeof createCanonicalPictureLockManifest>,
  kind: CaptionFinishDependencyKind,
): CaptionDomainRef | null {
  const map: Partial<Record<CaptionFinishDependencyKind, CaptionDomainRef>> = {
    approved_snapshot: lock.canonicalScope.approvedSnapshotRef,
    picture_lock: {
      id: lock.manifestId,
      version: lock.schemaVersion,
      contentHash: lock.manifestDigestSha256,
    },
    confirmed_output_frame: {
      id: lock.confirmedOutputFrame.outputId,
      version: 'canonical-confirmed-output-frame-v1',
      contentHash:
        lock.confirmedOutputFrame.confirmedOutputFrameDigestSha256,
    },
    timeline: lock.timelineBindings.timelineVersionRef,
    source_ranges: lock.timelineBindings.sourceRangesRef,
    shot_order: lock.timelineBindings.shotOrderRef,
    shot_durations: lock.timelineBindings.shotDurationsRef,
    speed_changes: lock.timelineBindings.speedChangesRef,
    crop_reframe: lock.compositionBindings.cropReframeRef,
    broll_layout: lock.compositionBindings.brollLayoutRef,
    living_frame_layout: lock.compositionBindings.livingFrameLayoutRef,
    graphics_maps_charts: lock.compositionBindings.graphicsMapsChartsRef,
    lower_thirds: lock.compositionBindings.lowerThirdsRef,
    occupancy: lock.compositionBindings.occupancyRef,
    near_final_visual_proxy: lock.compositionBindings.nearFinalVisualProxyRef,
    mask: lock.compositionBindings.maskTrackingAnchorRef,
    tracking: lock.compositionBindings.maskTrackingAnchorRef,
    object_anchor: lock.compositionBindings.maskTrackingAnchorRef,
    transition: lock.timelineBindings.transitionsRef,
    master_timing: lock.timelineBindings.masterTimingRef,
    color_proxy: lock.compositionBindings.colorLookRef,
    source_asset_manifest: lock.sourceAssetManifestRef,
  }
  return map[kind] ?? null
}

function sameCaptionRef(
  left: CaptionDomainRef,
  right: CaptionDomainRef,
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function reduceRatio(width: number, height: number): [number, number] {
  let left = width
  let right = height
  while (right !== 0) {
    const next = left % right
    left = right
    right = next
  }
  return [width / left, height / left]
}

function requiredRemotionRuntime(
  runtime: PrivateOfflineRemotionRenderRuntime | null,
): PrivateOfflineRemotionRenderRuntime {
  if (!runtime) {
    throw new Error(
      'The approved-run professional review requires the exact activated Remotion runtime.',
    )
  }
  return runtime
}

async function createApprovedRunCreativeReviewInspectionPackage(input: {
  root: string
  run: ApprovedRun
  execution: CombinedApprovedExecution
  artifactStore: EditSkillArtifactStore
  objectPort: ReturnType<typeof createCanonicalPrivateLocalJsonObjectPort>
  remotionRuntime: PrivateOfflineRemotionRenderRuntime
  baselineInspection: ApprovedExecutionInspectionPackage
  acceptedPreviewSha256: string
  captionOverlaySha256: string
  renderExactConfirmedFrame: boolean
}): Promise<{
  proxy: ApprovedRunCreativeReviewInspectionPackage
  exactFrame: ApprovedRunExactFrameReviewInspectionPackage | null
}> {
  if (input.acceptedPreviewSha256 !==
      input.baselineInspection.previewSha256) {
    throw new Error(
      'The accepted B-roll baseline does not match this exact approved run.',
    )
  }
  const ownerRequest =
    deriveCanonicalCaptionBrollApprovedRunOwnerReadRequest(input.run)
  const artifacts = await readExactBrollCreativeReviewArtifacts({
    artifactStore: input.artifactStore,
    execution: input.execution,
    ownerUserId: ownerRequest.canonicalScope.ownerUserId,
    workspaceId: ownerRequest.canonicalScope.workspaceId,
    projectId: ownerRequest.canonicalScope.projectId,
  })
  const resultReceipt = input.execution.broll.runtimeSnapshot.resultReceipt
  if (!resultReceipt || !('preview' in resultReceipt)
    || resultReceipt.preview.sha256 !== input.acceptedPreviewSha256) {
    throw new Error(
      'The reviewed B-roll baseline crossed its canonical integration evidence.',
    )
  }
  const privateVisualReview = createBrollCaptionPrivateVisualReview({
    schemaVersion: 'b_roll_authenticated_owner_read_evidence_v1',
    reviewId: `review.caption-broll.approved.${
      input.acceptedPreviewSha256.slice(0, 32)}`,
    previewArtifactSha256: input.acceptedPreviewSha256,
    layerManifestHash: artifacts.layer.layerManifestHash,
    integrationQaHash: resultReceipt.integrationQaHash,
    reviewedFrameRange: {
      ...ownerRequest.canonicalScope.authorizedFrameRange,
    },
    inspectionMode: 'complete_time_private_visual_review',
    reviewerClass: 'qualified_visual_ai',
    disposition: 'accepted',
    visibleTextRegionRefs: [{
      id: 'caption-overlay.caption-broll.approved-run',
      version: 'caption_overlay_png_v1',
      contentHash: input.captionOverlaySha256,
    }],
    captionSafeAreaVerified: true,
    captionLayerAboveBrollVerified: true,
    sourceBytesIncluded: false,
    mediaLocatorIncluded: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
    reviewedAt: '2026-08-07T20:20:00.000Z',
  })
  const approvedSnapshotReadPort =
    createCanonicalCaptionBrollApprovedSnapshotReadPort(async ({
      approvedSnapshotRef,
    }) => {
      assert.deepEqual(
        approvedSnapshotRef,
        ownerRequest.canonicalScope.approvedSnapshotRef,
      )
      return {
        canonicalScope: structuredClone(ownerRequest.canonicalScope),
        planningConstraintRef: structuredClone(
          ownerRequest.planningConstraintRef),
      }
    })
  const privateVisualReviewReadPort =
    createCanonicalBrollCaptionPrivateVisualReviewReadPort(async (read) => {
      assert.equal(read.ownerRequestRef.id, ownerRequest.requestId)
      assert.equal(
        read.ownerRequestRef.contentHash,
        ownerRequest.requestDigestSha256,
      )
      assert.equal(
        read.previewArtifactRef.contentHash,
        input.acceptedPreviewSha256,
      )
      assert.equal(
        read.layerManifestRef.contentHash,
        artifacts.layer.layerManifestHash,
      )
      assert.equal(
        read.integrationQaRef.contentHash,
        resultReceipt.integrationQaHash,
      )
      assert.deepEqual(
        read.reviewedFrameRange,
        ownerRequest.canonicalScope.authorizedFrameRange,
      )
      return structuredClone(privateVisualReview)
    })
  const ownerService = createCanonicalBrollCaptionOwnerServiceV2({
    objectPort: input.objectPort,
    artifactStore: input.artifactStore,
    approvedSnapshotReadPort,
    privateVisualReviewReadPort,
    prefix: 'private/internal/caption-broll-approved-owner/v1',
  })
  const ownerResult = await ownerService.finalizeFromCanonicalWork({
    request: ownerRequest,
    publicAssignment: input.run.broll.assignment,
    publicPlan: input.run.broll.publicPlan,
    approvedWorkGraph: input.run.broll.publicApprovedWorkGraph,
    assignment: input.run.broll.brollAssignment,
    masterTimingProjectionBinding: input.run.broll.masterTimingBinding,
    plan: input.run.broll.plan,
    workItemResults: input.execution.broll.workResults,
  })
  const inspectionSourceAuthority =
    await ownerService.inspectionSourceAuthorityReadPort.readExact({
      ownerRequestRef: ownerResult.ownerRequestRef,
      ownerResultRef: {
        id: ownerResult.resultId,
        version: ownerResult.schemaVersion,
        contentHash: ownerResult.resultDigestSha256,
      },
    })
  if (!inspectionSourceAuthority) {
    throw new Error(
      'The exact B-roll inspection source authority is unavailable.',
    )
  }
  const storedProxy = await readCanonicalPrivateMediaArtifact({
    localStorageRoot: input.root,
    privateObjectIdentityHash: artifacts.proxy.privateObjectIdentityHash,
  })
  if (!storedProxy
    || storedProxy.sha256 !== artifacts.proxy.objectSha256
    || storedProxy.byteLength !== artifacts.proxy.byteLength) {
    throw new Error(
      'The owner-approved Remotion proxy changed before Caption review.',
    )
  }
  const transcript = await readExactApprovedRunTranscript({
    run: input.run,
    objectPort: input.objectPort,
  })
  const creativeReview =
    buildCanonicalCaptionBrollApprovedRunCreativeReview({
      reviewIdSeed: 'caption.broll.approved-run.professional-review.v1',
      approvedRunAuthority:
        deriveCanonicalCaptionBrollApprovedRunReviewAuthority(input.run),
      ownerResult,
      inspectionSourceAuthority,
      remotionLayerManifest: artifacts.layer,
      remotionProxyManifest: artifacts.proxy,
      remotionProxyBytes: storedProxy.bytes,
      transcriptRecord: transcript.transcriptRecord,
      transcriptExpectationBinding: transcript.binding,
    })
  const rendered = [] as Array<{
    motionVariant: 'full_motion' | 'reduced_motion'
    spec: typeof creativeReview.fullSpec
    result: OfflineRemotionRenderResult
  }>
  for (const variant of [
    {
      motionVariant: 'full_motion' as const,
      spec: creativeReview.fullSpec,
      request: creativeReview.fullRequest,
    },
    {
      motionVariant: 'reduced_motion' as const,
      spec: creativeReview.reducedSpec,
      request: creativeReview.reducedRequest,
    },
  ]) {
    const result = await input.remotionRuntime.execute(variant.request)
    assertApprovedRunCreativeRender({
      result,
      expectedFrames: variant.spec.inspectionFrameNumbers,
      expectedDurationFrames:
        ownerRequest.canonicalScope.authorizedFrameRange.endFrameExclusive
        - ownerRequest.canonicalScope.authorizedFrameRange.startFrameInclusive,
    })
    rendered.push({
      motionVariant: variant.motionVariant,
      spec: variant.spec,
      result,
    })
  }
  const inspectionRoot = join(
    input.root,
    'caption-broll-approved-professional-review',
  )
  await mkdir(inspectionRoot, { recursive: true, mode: 0o700 })
  const outputs = [] as Array<
    ApprovedRunCreativeReviewInspectionPackage['outputs'][number]
  >
  for (const item of rendered) {
    const prefix = item.motionVariant === 'full_motion'
      ? 'full-motion' : 'reduced-motion'
    const fileName = `${prefix}.mp4`
    await writeCreateOnlyOrExactReplay(
      join(inspectionRoot, fileName),
      item.result.artifact.bytes,
    )
    await writeCreateOnlyOrExactReplay(
      join(inspectionRoot, `${prefix}-spec.json`),
      Buffer.from(`${JSON.stringify(item.spec, null, 2)}\n`),
    )
    const sampleFrames = [] as Array<{
      frameIndex: number
      fileName: string
      sha256: string
    }>
    for (const frame of item.result.frameArtifacts) {
      const frameFileName =
        `${prefix}-frame-${String(frame.frame).padStart(3, '0')}.png`
      await writeCreateOnlyOrExactReplay(
        join(inspectionRoot, frameFileName),
        frame.bytes,
      )
      sampleFrames.push({
        frameIndex: frame.frame,
        fileName: frameFileName,
        sha256: frame.sha256,
      })
    }
    outputs.push(Object.freeze({
      motionVariant: item.motionVariant,
      fileName,
      sha256: item.result.artifact.sha256,
      byteLength: item.result.artifact.byteLength,
      width: 640 as const,
      height: 360 as const,
      fps: 30 as const,
      durationFrames: item.result.artifact.durationFrames,
      reviewSpecDigestSha256: item.spec.reviewSpecDigestSha256,
      sampleFrames: Object.freeze(sampleFrames),
    }))
  }
  const withoutDigest = {
    schemaVersion:
      'caption-broll-approved-run-professional-review-inspection-package-v1' as const,
    baselinePreviewSha256: input.acceptedPreviewSha256,
    ownerRequestRef: {
      id: ownerRequest.requestId,
      version: ownerRequest.schemaVersion,
      contentHash: ownerRequest.requestDigestSha256,
    },
    ownerResultRef: {
      id: ownerResult.resultId,
      version: ownerResult.schemaVersion,
      contentHash: ownerResult.resultDigestSha256,
    },
    inspectionSourceAuthorityRef: {
      id: inspectionSourceAuthority.authorityId,
      version: inspectionSourceAuthority.schemaVersion,
      contentHash: inspectionSourceAuthority.authorityDigestSha256,
    },
    canonicalTranscriptRef: {
      ...transcript.binding.canonicalTranscriptRef,
    },
    canonicalTranscriptEvidenceRef: {
      id: transcript.transcriptRecord.recordId,
      version: transcript.transcriptRecord.schemaVersion,
      contentHash: transcript.transcriptRecord.recordDigestSha256,
    },
    outputs: Object.freeze(outputs),
    exactApprovedRunReread: true as const,
    exactBrollOwnerResultReread: true as const,
    exactCanonicalTranscriptReread: true as const,
    directRasterInspectionRequired: true as const,
    directRasterInspectionCompleted: false as const,
    finalQaApprovalGranted: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  const inspectionPackage = Object.freeze({
    ...withoutDigest,
    packageSha256: sha256(Buffer.from(JSON.stringify(withoutDigest))),
  })
  await writeCreateOnlyOrExactReplay(
    join(inspectionRoot, 'inspection-package.json'),
    Buffer.from(`${JSON.stringify(inspectionPackage, null, 2)}\n`),
  )
  const exactFrame = input.renderExactConfirmedFrame
    ? await createApprovedRunExactFrameReviewInspectionPackage({
        root: input.root,
        remotionRuntime: input.remotionRuntime,
        creativeReview,
        proxyInspectionPackage: inspectionPackage,
      })
    : null
  return Object.freeze({ proxy: inspectionPackage, exactFrame })
}

async function createApprovedRunExactFrameReviewInspectionPackage(input: {
  root: string
  remotionRuntime: PrivateOfflineRemotionRenderRuntime
  creativeReview: ReturnType<
    typeof buildCanonicalCaptionBrollApprovedRunCreativeReview>
  proxyInspectionPackage: ApprovedRunCreativeReviewInspectionPackage
}): Promise<ApprovedRunExactFrameReviewInspectionPackage> {
  const inspectionRoot = join(
    input.root,
    'caption-broll-approved-exact-frame-review',
  )
  await mkdir(inspectionRoot, { recursive: true, mode: 0o700 })
  const outputs = [] as Array<
    ApprovedRunExactFrameReviewInspectionPackage['outputs'][number]
  >
  for (const variant of [
    {
      motionVariant: 'full_motion' as const,
      exactFrameReview: input.creativeReview.fullExactFrameReview,
      request: input.creativeReview.fullExactFrameRequest,
    },
    {
      motionVariant: 'reduced_motion' as const,
      exactFrameReview: input.creativeReview.reducedExactFrameReview,
      request: input.creativeReview.reducedExactFrameRequest,
    },
  ]) {
    const result = await input.remotionRuntime.execute(variant.request)
    assertApprovedRunCreativeRender({
      result,
      expectedFrames: variant.exactFrameReview.inspectionFrameNumbers,
      expectedDurationFrames: variant.exactFrameReview.durationFrames,
      expectedWidth: 3_840,
      expectedHeight: 2_160,
    })
    const prefix = variant.motionVariant === 'full_motion'
      ? 'full-motion-exact-frame'
      : 'reduced-motion-exact-frame'
    const fileName = `${prefix}.mp4`
    await writeCreateOnlyOrExactReplay(
      join(inspectionRoot, fileName),
      result.artifact.bytes,
    )
    await writeCreateOnlyOrExactReplay(
      join(inspectionRoot, `${prefix}-binding.json`),
      Buffer.from(
        `${JSON.stringify(variant.exactFrameReview, null, 2)}\n`),
    )
    const sampleFrames = [] as Array<{
      frameIndex: number
      fileName: string
      sha256: string
      width: 640
      height: 360
    }>
    for (const frame of result.frameArtifacts) {
      if (frame.bytes.readUInt32BE(16) !== 640
        || frame.bytes.readUInt32BE(20) !== 360) {
        throw new Error(
          'Exact-frame runtime golden must remain a bounded 640x360 inspection proxy.',
        )
      }
      const frameFileName =
        `${prefix}-frame-${String(frame.frame).padStart(3, '0')}.png`
      await writeCreateOnlyOrExactReplay(
        join(inspectionRoot, frameFileName),
        frame.bytes,
      )
      sampleFrames.push({
        frameIndex: frame.frame,
        fileName: frameFileName,
        sha256: frame.sha256,
        width: 640,
        height: 360,
      })
    }
    outputs.push(Object.freeze({
      motionVariant: variant.motionVariant,
      fileName,
      sha256: result.artifact.sha256,
      byteLength: result.artifact.byteLength,
      width: 3_840 as const,
      height: 2_160 as const,
      fps: 30 as const,
      durationFrames: result.artifact.durationFrames,
      exactFrameReviewDigestSha256:
        variant.exactFrameReview.exactFrameReviewDigestSha256,
      runtimeGoldenFrameScaleNumerator: 1 as const,
      runtimeGoldenFrameScaleDenominator: 6 as const,
      runtimeGoldenFramesAreInspectionProxies: true as const,
      exactFrameRastersMustBeExtractedFromMp4ForInspection: true as const,
      sampleFrames: Object.freeze(sampleFrames),
    }))
  }
  const withoutDigest = {
    schemaVersion:
      'caption-broll-approved-run-exact-frame-review-inspection-package-v1' as const,
    sourceProxyReviewPackageRef: {
      id: 'caption-broll-approved-run-professional-review',
      version:
        input.proxyInspectionPackage.schemaVersion,
      contentHash: input.proxyInspectionPackage.packageSha256,
    },
    confirmedOutputFrame: {
      width: 3_840 as const,
      height: 2_160 as const,
      fps: 30 as const,
      exactConfirmedFrameRendered: true as const,
    },
    sourceProxyFrame: {
      width: 640 as const,
      height: 360 as const,
      sourceProxyUpscaleRequired: true as const,
      sourceProxyAcceptedAsFinalPictureQuality: false as const,
    },
    outputs: Object.freeze(outputs),
    exactApprovedRunReread: true as const,
    exactConfirmedFrameMatchesApprovedRun: true as const,
    typographyAndLayoutEvaluatedAtConfirmedFrame: true as const,
    directRasterInspectionRequired: true as const,
    directRasterInspectionCompleted: false as const,
    sourceQualityQualificationClaimed: false as const,
    finalCustomerCanvasClaimed: false as const,
    finalQaApprovalGranted: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  const inspectionPackage = Object.freeze({
    ...withoutDigest,
    packageSha256: sha256(Buffer.from(JSON.stringify(withoutDigest))),
  })
  await writeCreateOnlyOrExactReplay(
    join(inspectionRoot, 'inspection-package.json'),
    Buffer.from(`${JSON.stringify(inspectionPackage, null, 2)}\n`),
  )
  return inspectionPackage
}

async function readExactBrollCreativeReviewArtifacts(input: {
  artifactStore: EditSkillArtifactStore
  execution: CombinedApprovedExecution
  ownerUserId: string
  workspaceId: string
  projectId: string
}) {
  const refs = input.execution.broll.workResults.flatMap((result) =>
    result.outputArtifactRefs)
  const readOne = async (artifactType: string) => {
    const matches = refs.filter((ref) => ref.artifactType === artifactType)
    if (matches.length !== 1) {
      throw new Error(`Approved B-roll run requires one ${artifactType}.`)
    }
    return input.artifactStore.readJson({
      reference: matches[0] as EditSkillArtifactReference,
      ownerUserId: input.ownerUserId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
    })
  }
  return Object.freeze({
    layer: brollRemotionLayerManifestSchema.parse(
      await readOne('b_roll_remotion_layer_manifest_v1')),
    proxy: brollRemotionPreviewProxyManifestSchema.parse(
      await readOne('b_roll_remotion_preview_proxy_manifest_v1')),
  })
}

async function readExactApprovedRunTranscript(input: {
  run: ApprovedRun
  objectPort: ReturnType<typeof createCanonicalPrivateLocalJsonObjectPort>
}) {
  const snapshot = input.run.approved.authority.snapshot
  const projection = input.run.approvedExecutionAuthority
    .captionPlanningProjection
  if (!projection
    || !('canonicalTranscriptExpectationRef' in projection)) {
    throw new Error(
      'The approved Caption run lacks its canonical transcript expectation.',
    )
  }
  const repository = createCanonicalCaptionTranscriptEvidenceRepository({
    objectPort: input.objectPort,
  })
  const result = await repository.findExactForPlanningExpectation({
    canonicalReadScope: {
      ownerUserId: snapshot.approvedByUserId,
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      planVersionId: `${snapshot.planId}.v${snapshot.planVersion}`,
      approvedSnapshotRef: {
        id: snapshot.snapshotId,
        version: snapshot.schemaVersion,
        contentHash: snapshot.snapshotHash,
      },
    },
    planningExpectationRef: projection.canonicalTranscriptExpectationRef,
  })
  if (!result) {
    throw new Error(
      'The approved Caption run cannot reread its exact canonical transcript.',
    )
  }
  return result
}

function assertApprovedRunCreativeRender(input: {
  result: OfflineRemotionRenderResult
  expectedFrames: readonly number[]
  expectedDurationFrames: number
  expectedWidth?: 640 | 3840
  expectedHeight?: 360 | 2160
}): void {
  const result = input.result
  const semantic = result.evidence.semanticEvidence
  const expectedWidth = input.expectedWidth ?? 640
  const expectedHeight = input.expectedHeight ?? 360
  if (result.artifact.mimeType !== 'video/mp4'
    || result.artifact.width !== expectedWidth
    || result.artifact.height !== expectedHeight
    || result.artifact.fps !== 30
    || result.artifact.durationFrames !== input.expectedDurationFrames
    || JSON.stringify(result.frameArtifacts.map((frame) => frame.frame))
      !== JSON.stringify(input.expectedFrames)
    || !semantic.captionRealSourceSceneGroupCompositionExecuted
    || !semantic.approvedCaptionPrivateReviewProxyBytesVerified
    || !semantic.exactSceneGroupDigestConsumed
    || !semantic.exactMotionLockDigestConsumed
    || !semantic.exactStoryTimingResolutionDigestConsumed
    || !semantic.stableAccessibleCaptionAboveVisualLayersPreserved
    || !semantic.brollOwnerSelectedMediaLineageConsumed
    || !semantic.brollOwnerLayoutOccupancyLineageConsumed
    || !semantic.brollOwnerCropTimingLineageConsumed
    || !semantic.brollOwnerVisibleTextEvidenceLineageConsumed
    || !semantic.brollFullFrameCutawayCompositionApplied
    || !semantic.requestedMotionVariantApplied
    || !semantic.frameGoldenArtifactsProduced
    || (expectedWidth === 3_840
      && !semantic.exactConfirmedOutputFrameRendered)
    || result.readiness.productReady
    || result.readiness.productionReady) {
    throw new Error(
      'The approved-run professional Caption render lacks exact bounded evidence.',
    )
  }
}

async function writeCreateOnlyOrExactReplay(
  path: string,
  bytes: Buffer,
): Promise<void> {
  try {
    await writeFile(path, bytes, { mode: 0o600, flag: 'wx' })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    assert.deepEqual(
      await readFile(path),
      bytes,
      `Private Caption evidence at ${path} cannot be replaced.`,
    )
  }
}

async function createApprovedExecutionInspectionPackage(input: {
  root: string
  sourceSha256: string
  captionOverlaySha256: string
  execution: CombinedApprovedExecution
  qualificationReadiness: CanonicalCaptionQualificationRunReadiness
}): Promise<ApprovedExecutionInspectionPackage> {
  const snapshot = input.execution.broll.runtimeSnapshot
  const resultReceipt = snapshot.resultReceipt
  if (!resultReceipt || !('preview' in resultReceipt)) {
    throw new Error(
      'Approved Caption+B-roll execution did not produce a private preview.',
    )
  }
  const preview = resultReceipt.preview
  const previewPath = join(
    input.root,
    'b-roll',
    'remotion-integrations',
    'previews',
    `${preview.previewArtifactIdentityHash}.mp4`,
  )
  const previewBytes = await readFile(previewPath)
  assert.equal(
    sha256(previewBytes),
    preview.sha256,
    'Approved private preview bytes changed before inspection extraction.',
  )
  const inspectionRoot = join(
    input.root,
    'caption-broll-approved-private-inspection',
  )
  const captionOverlayPath = join(inspectionRoot, 'caption-overlay.png')
  const captionPixelCoverage = measureCaptionPixelCoverage({
    previewPath,
    captionOverlayPath,
    expectedFrameCount: preview.frameCount,
  })
  await mkdir(inspectionRoot, { recursive: true })
  const contactSheetPath = join(inspectionRoot, 'all-frames-contact-sheet.png')
  const contactRows = Math.ceil(preview.frameCount / 8)
  const contactSheetProcess = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', previewPath,
    '-vf', `scale=320:180:flags=lanczos,tile=8x${contactRows}`,
    '-frames:v', '1', '-threads', '1', '-y', contactSheetPath,
  ], { encoding: 'utf8' })
  assert.equal(contactSheetProcess.status, 0, contactSheetProcess.stderr)
  const sampleIndexes = [...new Set([
    0,
    Math.floor((preview.frameCount - 1) / 4),
    Math.floor((preview.frameCount - 1) / 2),
    Math.floor((preview.frameCount - 1) * 3 / 4),
    preview.frameCount - 1,
  ])]
  const sampleFrames: Array<{
    frameIndex: number
    fileName: string
    sha256: string
  }> = []
  const captionSampleStrips: Array<{
    frameIndex: number
    fileName: string
    sha256: string
  }> = []
  for (const frameIndex of sampleIndexes) {
    const fileName = `frame-${String(frameIndex).padStart(3, '0')}.png`
    const framePath = join(inspectionRoot, fileName)
    const frameProcess = spawnSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-i', previewPath,
      '-vf', `select=eq(n\\,${frameIndex})`, '-frames:v', '1',
      '-vsync', '0', '-threads', '1', '-y', framePath,
    ], { encoding: 'utf8' })
    assert.equal(frameProcess.status, 0, frameProcess.stderr)
    sampleFrames.push({
      frameIndex,
      fileName,
      sha256: sha256(await readFile(framePath)),
    })
    const captionStripFileName =
      `caption-${String(frameIndex).padStart(3, '0')}.png`
    const captionStripPath = join(inspectionRoot, captionStripFileName)
    const captionStripProcess = spawnSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-i', previewPath,
      '-vf',
      `select=eq(n\\,${frameIndex}),crop=640:100:0:260,` +
        'scale=1280:200:flags=neighbor,' +
        'pad=1320:240:20:20:color=0x243047',
      '-frames:v', '1', '-vsync', '0', '-threads', '1',
      '-y', captionStripPath,
    ], { encoding: 'utf8' })
    assert.equal(captionStripProcess.status, 0, captionStripProcess.stderr)
    captionSampleStrips.push({
      frameIndex,
      fileName: captionStripFileName,
      sha256: sha256(await readFile(captionStripPath)),
    })
  }
  const withoutDigest = {
    schemaVersion:
      'caption-broll-approved-execution-inspection-package-v3' as const,
    sourceEvidenceMode: 'real_private_media' as const,
    sourceSha256: input.sourceSha256,
    approvedSnapshotRef: input.execution.approvedSnapshotRef,
    captionApprovedJobCount: input.execution.captionJobCount,
    captionSupportResumeCount: input.execution.captionSupportResumeCount,
    brollApprovedWorkItemCount: input.execution.broll.workResults.length,
    canonicalCaptionReplayVerified: true as const,
    canonicalBrollRestartReplayVerified: true as const,
    captionOverlaySha256: input.captionOverlaySha256,
    previewSha256: preview.sha256,
    previewFrameCount: preview.frameCount,
    previewFps: preview.frameRate,
    contactSheet: {
      fileName: 'all-frames-contact-sheet.png',
      sha256: sha256(await readFile(contactSheetPath)),
      representsEveryFrame: true as const,
    },
    sampleFrames,
    captionSampleStrips,
    captionPixelCoverage,
    qualificationReadiness: {
      id: input.qualificationReadiness.readinessId,
      version: input.qualificationReadiness.schemaVersion,
      contentHash: input.qualificationReadiness.readinessDigestSha256,
      disposition: 'blocked_missing_canonical_evidence' as const,
      firstBlockerCode:
        'postrender_visual_intelligence_evidence_missing' as const,
      terminalStatusClaimed: false as const,
    },
    structuralVisualIntelligenceFixtureExcludedFromQualification: true as const,
    directRasterInspectionRequired: true as const,
    providerCalled: false as const,
    publicDeliveryCreated: false as const,
    productionAuthorityGranted: false as const,
  }
  const inspectionPackage: ApprovedExecutionInspectionPackage = Object.freeze({
    ...withoutDigest,
    packageSha256: sha256(Buffer.from(JSON.stringify(withoutDigest))),
  })
  await writeFile(
    join(inspectionRoot, 'inspection-package.json'),
    `${JSON.stringify(inspectionPackage, null, 2)}\n`,
  )
  return inspectionPackage
}

function measureCaptionPixelCoverage(input: {
  previewPath: string
  captionOverlayPath: string
  expectedFrameCount: number
}): ApprovedExecutionInspectionPackage['captionPixelCoverage'] {
  const cropWidth = 640
  const cropHeight = 100
  const decoded = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', input.previewPath,
    '-an', '-vf', 'crop=640:100:0:260,format=rgb24',
    '-threads', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-',
  ], { encoding: 'buffer', maxBuffer: 32 * 1024 * 1024 })
  assert.equal(decoded.status, 0, decoded.stderr.toString('utf8'))
  const frameByteLength = cropWidth * cropHeight * 3
  assert.equal(
    decoded.stdout.byteLength,
    frameByteLength * input.expectedFrameCount,
  )
  const overlay = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', input.captionOverlayPath,
    '-vf', 'crop=640:100:0:260,format=rgba',
    '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-',
  ], { encoding: 'buffer', maxBuffer: 4 * 1024 * 1024 })
  assert.equal(overlay.status, 0, overlay.stderr.toString('utf8'))
  assert.equal(overlay.stdout.byteLength, cropWidth * cropHeight * 4)
  const expectedVisiblePixelOffsets: number[] = []
  for (let offset = 0; offset < overlay.stdout.byteLength; offset += 4) {
    if (overlay.stdout[offset + 3]! >= 64 && (
      overlay.stdout[offset]! +
      overlay.stdout[offset + 1]! +
      overlay.stdout[offset + 2]!
    ) >= 96) {
      expectedVisiblePixelOffsets.push(offset / 4 * 3)
    }
  }
  assert.ok(expectedVisiblePixelOffsets.length > 100)
  const coverageRatios = Array.from(
    { length: input.expectedFrameCount },
    (_, frameIndex) => {
      const start = frameIndex * frameByteLength
      let visiblePixelCount = 0
      for (const expectedOffset of expectedVisiblePixelOffsets) {
        const offset = start + expectedOffset
        const luma = decoded.stdout[offset]! * 0.2126
          + decoded.stdout[offset + 1]! * 0.7152
          + decoded.stdout[offset + 2]! * 0.0722
        if (luma >= 64) visiblePixelCount += 1
      }
      return visiblePixelCount / expectedVisiblePixelOffsets.length
    },
  )
  const minimumRatio = Math.min(...coverageRatios)
  const maximumRatio = Math.max(...coverageRatios)
  assert.ok(minimumRatio > 0.85)
  assert.ok(maximumRatio - minimumRatio < 0.03)
  return {
    crop: { x: 0, y: 260, width: 640, height: 100 },
    expectedVisiblePixelCount: expectedVisiblePixelOffsets.length,
    minimumCoverageBasisPoints: Math.floor(minimumRatio * 10_000),
    maximumCoverageBasisPoints: Math.ceil(maximumRatio * 10_000),
    everyFrameCoverageVerified: true,
  }
}

function probePrivateSource(path: string) {
  const process = spawnSync('ffprobe', [
    '-v', 'error', '-show_entries',
    'format=duration:stream=codec_type,codec_name,width,height,avg_frame_rate',
    '-of', 'json', path,
  ], { encoding: 'utf8' })
  assert.equal(process.status, 0, process.stderr)
  const value = JSON.parse(process.stdout) as {
    streams?: Array<{
      codec_type?: string
      codec_name?: string
      width?: number
      height?: number
      avg_frame_rate?: string
    }>
    format?: { duration?: string }
  }
  const video = value.streams?.find((stream) =>
    stream.codec_type === 'video')
  const audio = value.streams?.find((stream) =>
    stream.codec_type === 'audio')
  const durationSeconds = Number(value.format?.duration)
  const [frameRateNumeratorText, frameRateDenominatorText] =
    (video?.avg_frame_rate ?? '').split('/')
  const frameRateNumerator = Number(frameRateNumeratorText)
  const frameRateDenominator = Number(frameRateDenominatorText)
  if (
    !video || !video.width || !video.height ||
    !video.codec_name || !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0 || !Number.isInteger(frameRateNumerator) ||
    frameRateNumerator <= 0 || !Number.isInteger(frameRateDenominator) ||
    frameRateDenominator <= 0
  ) {
    throw new Error('Private approved source probe is incomplete.')
  }
  return {
    durationSeconds,
    width: video.width,
    height: video.height,
    frameRateNumerator,
    frameRateDenominator,
    videoCodec: video.codec_name,
    audioCodec: audio?.codec_name ?? 'none',
    hasVideo: true,
    hasAudio: audio !== undefined,
  }
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function membershipAdmin(
  memberships: ReadonlyArray<{ workspaceId: string; userId: string }>,
): SupabaseClient {
  return {
    from(tableName: string) {
      if (tableName !== 'workspace_members') {
        throw new Error(`Unexpected approved-run table: ${tableName}`)
      }
      let selectedWorkspaceId = ''
      let selectedUserId = ''
      const query = {
        select() { return query },
        eq(column: string, value: string) {
          if (column === 'workspace_id') selectedWorkspaceId = value
          if (column === 'user_id') selectedUserId = value
          return query
        },
        async maybeSingle() {
          const membership = memberships.find((candidate) =>
            candidate.workspaceId === selectedWorkspaceId &&
            candidate.userId === selectedUserId)
          return {
            data: membership ? {
              workspace_id: membership.workspaceId,
              user_id: membership.userId,
              role: 'owner',
            } : null,
            error: null,
          }
        },
      }
      return query
    },
  } as unknown as SupabaseClient
}
