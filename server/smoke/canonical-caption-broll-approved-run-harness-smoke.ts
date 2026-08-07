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
import type { PlannerInput } from '../../src/types/reeditpro'
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
} from '../internal-testing/canonical-caption-broll-approved-run-harness'
import {
  executeCanonicalCaptionApprovedJobClosure,
  executeCanonicalCaptionBrollApprovedRun,
} from '../internal-testing/canonical-caption-broll-approved-execution-harness'
import {
  injectCanonicalCaptionVisualIntelligenceStructuralSupport,
} from '../internal-testing/canonical-caption-visual-intelligence-structural-support-fixture'
import {
  createCanonicalPrivateEditSkillArtifactStore,
} from '../services/canonical-private-edit-skill-artifact-store'
import {
  createCanonicalPrivateLocalJsonObjectPort,
} from '../services/canonical-private-local-json-object-port'
import {
  createExactEditPreferenceService,
} from '../services/exact-edit-preference-service'
import {
  buildCurrentPlanningInputAuthorityExpectation,
} from '../services/planning-input-authority-binding-service'
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
import type { ServiceContext } from '../types'

const requestedEvidenceRoot =
  process.env.REEDITPRO_CAPTION_BROLL_APPROVED_EVIDENCE_ROOT?.trim() ?? ''
const requestedPrivateSourcePath =
  process.env.REEDITPRO_CAPTION_BROLL_APPROVED_SOURCE_PATH?.trim() ?? ''
const requestedPrivateSourceSha256 =
  process.env.REEDITPRO_CAPTION_BROLL_APPROVED_SOURCE_SHA256?.trim() ?? ''
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
  const project = (await createProjectService(context).createProject({
    workspaceId,
    name: 'Caption B-roll approved-run harness',
  })).project
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
  await upload.uploadLocalObject(
    uploadIntent.uploadIntent.id,
    workspaceId,
    sourceBytes,
    'video/mp4',
    sourceBytes.byteLength,
  )
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
    patch: {
      editLevel: 'premium',
      workflowType: 'simple_clean_edit',
      cleanupPreference: 'preserve_natural',
      visualPreference: 'no_extra_visuals',
      moodStyle: 'clean',
      creditPreference: 'balanced',
      targetPlatform: 'youtube',
    },
    idempotencyKey: 'caption-broll-approved-run-preferences-update',
  })
  const sourcePreparationEvidenceHash = sha256(
    Buffer.from(`source-ready:${sourceCandidate.candidateHash}`),
  )
  const preferenceEvidence = await exactPreferences.recordPlanningEvidence({
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
  const planningInputAuthority =
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
  const values = preferenceEvidence.preferenceRecord.values
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
      preferenceEvidence.preferenceRecord.baseline.preferenceSnapshotId,
    preferencePersistenceSource: 'authenticated_private_internal_backend',
    currentEditPreferenceAuthorityValues: structuredClone(values),
    currentEditPreferenceRecordRevision:
      preferenceEvidence.preferenceRecord.recordRevision,
    currentEditPreferenceRevision:
      preferenceEvidence.preferenceRecord.preferenceRevision,
    currentEditPreferencePlanningInputRevision:
      preferenceEvidence.preferenceRecord.planning.planningInputRevision,
    currentEditPreferenceFingerprintSha256:
      preferenceEvidence.preferenceRecord.planning.preferenceFingerprintSha256,
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

  const run = await createCanonicalCaptionBrollApprovedRunHarness({
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
  })
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

  const resolveCaptionSupportRequirement = async (
    requirement: Parameters<
      NonNullable<Parameters<
        typeof executeCanonicalCaptionApprovedJobClosure
      >[0]['resolveCaptionSupportRequirement']>
    >[0],
  ) => {
    const fixture =
      await injectCanonicalCaptionVisualIntelligenceStructuralSupport({
        context,
        requirement,
        now: () => new Date('2026-08-07T20:05:00.000Z'),
      })
    assert.equal(fixture.structuralFixtureOnly, true)
    assert.equal(fixture.privateQualificationEvidence, false)
  }
  let inspectionPackage: ApprovedExecutionInspectionPackage | null = null
  const captionExecution = realPrivateExecution
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
        const remotionRuntime =
          await activatePrivateOfflineRemotionRenderRuntime()
        const objectPort = createCanonicalPrivateLocalJsonObjectPort({
          localStorageRoot: root,
        })
        const createBrollArtifactStore = () =>
          createCanonicalPrivateEditSkillArtifactStore({
            objectPort,
            schemas: editSkillArtifactSchemaRegistry,
            prefix: 'private/edit-skills/caption-broll-approved-runtime/v1',
          })
        const execution = await executeCanonicalCaptionBrollApprovedRun({
          context,
          approvedRun: run,
          idempotencySeed: 'caption-broll-approved-real-execution',
          resolveCaptionSupportRequirement,
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
        inspectionPackage = await createApprovedExecutionInspectionPackage({
          root,
          sourceSha256,
          captionOverlaySha256: caption.imageArtifact.sha256,
          execution,
        })
        return execution
      })()
    : await executeCanonicalCaptionApprovedJobClosure({
        context,
        approvedRun: run,
        idempotencySeed: 'caption-broll-approved-run-execution',
        resolveCaptionSupportRequirement,
      })
  assert.equal(captionExecution.captionJobCount, 17)
  assert.equal(captionExecution.captionSupportResumeCount, 1)
  assert.ok(captionExecution.captionExecutions.every((item) =>
    item.initialResponse.result.qaOutcome === 'passed'
    && item.replayResponse.evidence.idempotentAdapterReplay))
  assert.equal(captionExecution.providerCallPerformedByHarness, false)
  assert.equal(captionExecution.publicDeliveryCreated, false)
  assert.equal(captionExecution.productionAuthorityGranted, false)
  const emittedInspectionPackage = inspectionPackage as
    ApprovedExecutionInspectionPackage | null

  console.log(JSON.stringify({
    smoke: 'canonical_caption_broll_approved_run_harness',
    status: 'passed',
    approvedSnapshotCreated: true,
    executionPackageCreated: true,
    captionWorkItems: 17,
    captionApprovedJobsExecuted: captionExecution.captionJobCount,
    captionSupportResumeCount:
      captionExecution.captionSupportResumeCount,
    visualIntelligenceSupportEvidenceClass:
      'structural_fixture_not_private_qualification',
    brollWorkItems: 13,
    exactBrollComponentPropagation: true,
    captionDownstreamQaDependenciesBound: true,
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
    'caption-broll-approved-execution-inspection-package-v1'
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

async function createApprovedExecutionInspectionPackage(input: {
  root: string
  sourceSha256: string
  captionOverlaySha256: string
  execution: CombinedApprovedExecution
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
  for (const frameIndex of sampleIndexes) {
    const fileName = `frame-${String(frameIndex).padStart(3, '0')}.png`
    const framePath = join(inspectionRoot, fileName)
    const frameProcess = spawnSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-i', previewPath,
      '-vf', `select=eq(n\\,${frameIndex})`, '-frames:v', '1',
      '-threads', '1', '-y', framePath,
    ], { encoding: 'utf8' })
    assert.equal(frameProcess.status, 0, frameProcess.stderr)
    sampleFrames.push({
      frameIndex,
      fileName,
      sha256: sha256(await readFile(framePath)),
    })
  }
  const withoutDigest = {
    schemaVersion:
      'caption-broll-approved-execution-inspection-package-v1' as const,
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
