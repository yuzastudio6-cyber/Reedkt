import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
} from '../../src/lib/approved-edit-execution-package-client'
import type { PlannerInput } from '../../src/types/reeditpro'
import { loadRuntimeEnv } from '../config/env'
import {
  createCanonicalSourceAnalysisAuthorityFixture,
} from './fixtures/canonical-source-led-content-analysis-authority-fixture'
import {
  CANONICAL_CAPTION_BROLL_APPROVED_RUN_HARNESS_VERSION,
  createCanonicalCaptionBrollApprovedRunHarness,
} from '../internal-testing/canonical-caption-broll-approved-run-harness'
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
import type { ServiceContext } from '../types'

const root = await mkdtemp(join(
  tmpdir(),
  'reeditpro-caption-broll-approved-run-',
))
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
  const sourceBytes = Buffer.from(
    'canonical-caption-broll-approved-run-private-source-fixture-v1:'
      + 'x'.repeat(256),
  )
  const sourceSha256 = sha256(sourceBytes)
  const upload = createUploadService(context)
  const uploadIntent = await upload.createUploadIntent({
    workspaceId,
    projectId: project.id,
    uploadPurpose: 'source_media',
    originalFileName: 'caption-broll-approved-run.mp4',
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
      durationSeconds: 4,
      width: 1_920,
      height: 1_080,
      frameRateNumerator: 30,
      frameRateDenominator: 1,
      videoCodec: 'h264',
      audioCodec: 'aac',
      hasVideo: true,
      hasAudio: true,
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
      durationFrames: 120,
      transcriptText:
        'Ideas move through the frame while captions remain readable.',
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
  assert.ok(run.approvedExecutionAuthority.captionRenderedMediaWorkBinding)
  assert.ok(run.approvedExecutionAuthority.captionPostrenderVisualQaWorkBinding)
  assert.ok(run.approvedExecutionAuthority.captionPrivateReviewDependencyBinding)
  assert.equal(run.runtimeDispatched, false)
  assert.equal(run.providerCalled, false)
  assert.equal(run.assetCreated, false)
  assert.equal(run.finalQaApproved, false)
  assert.equal(run.publicDeliveryCreated, false)
  assert.equal(run.productionAuthorityGranted, false)

  console.log(JSON.stringify({
    smoke: 'canonical_caption_broll_approved_run_harness',
    status: 'passed',
    approvedSnapshotCreated: true,
    executionPackageCreated: true,
    captionWorkItems: 17,
    brollWorkItems: 13,
    exactBrollComponentPropagation: true,
    captionDownstreamQaDependenciesBound: true,
    runtimeDispatched: false,
    providerCalled: false,
    publicDeliveryCreated: false,
    productionAuthorityGranted: false,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
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
