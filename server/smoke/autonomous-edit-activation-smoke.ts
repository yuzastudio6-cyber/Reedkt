import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { loadRuntimeEnv } from '../config/env'
import { createAutonomousEditPlanningService } from '../services/autonomous-edit-planning-service'
import {
  createAutonomousEditPrivateReviewService,
  waitForAutonomousPrivateReviewExecution,
} from '../services/autonomous-edit-private-review-service'
import { createProjectEditPlanService } from '../services/project-edit-plan-service'
import { createUploadService } from '../services/upload-service'
import type { ServiceContext } from '../types'
import { buildAutonomousEditPlanApprovalModel } from '../../src/lib/autonomous-edit-plan-approval'
import type { AutonomousEditPlanCandidate, ProjectSourceVideoBackendUploadResult } from '../../src/types'

const root = await mkdtemp(path.join(tmpdir(), 'reeditpro-autonomous-activation-'))
const sourcePath = path.join(root, 'synthetic-source.mp4')
const localStorageRoot = path.join(root, 'private-storage')

try {
  execFileSync(process.env.FFMPEG_BIN?.trim() || 'ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi',
    '-i', 'color=c=0x182131:s=320x568:r=30:d=3',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    sourcePath,
  ], { stdio: 'pipe' })

  Object.assign(process.env, {
    REEDITPRO_QWEN_RUNTIME_MODE: 'beta_enabled',
    QWEN_REASONING_API_KEY: 'activation-smoke-credential',
    QWEN_REASONING_BASE_URL: 'https://planner.invalid',
    QWEN_REASONING_MODEL_ID: 'qwen-activation-smoke',
    QWEN_REASONING_TRANSPORT_PROFILE: 'openai_chat_completions',
  })

  const env = loadRuntimeEnv({
    ...process.env,
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: localStorageRoot,
    WORKER_RUNTIME_MODE: 'local',
    WORKER_INSTANCE_ID: 'autonomous-activation-smoke',
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
    GOOGLE_CLOUD_PROJECT_ID: '',
    GCS_SOURCE_MEDIA_BUCKET: '',
    GCS_PREVIEWS_BUCKET: '',
  })
  const context: ServiceContext = {
    env,
    clients: { admin: null, public: null },
    requestId: 'autonomous-activation-smoke',
    auth: { userId: 'user-autonomous-smoke', isMockUser: true },
  }
  const workspaceId = 'workspace-autonomous-activation'
  const projectId = 'project-autonomous-activation'
  const editSessionId = 'edit-autonomous-activation'
  const sourceBytes = await readFile(sourcePath)
  const checksumSha256 = createHash('sha256').update(sourceBytes).digest('hex')
  const uploadService = createUploadService(context)
  const createdUpload = await uploadService.createUploadIntent({
    workspaceId,
    projectId,
    chatSessionId: editSessionId,
    uploadPurpose: 'source_media',
    originalFileName: 'synthetic-source.mp4',
    mimeType: 'video/mp4',
    expectedSizeBytes: sourceBytes.length,
    checksumSha256,
  })
  await uploadService.uploadLocalObject(createdUpload.uploadIntent.id, sourceBytes, 'video/mp4')
  const finalizedUpload = await uploadService.finalizeUploadIntent({
    workspaceId,
    uploadIntentId: createdUpload.uploadIntent.id,
    sizeBytes: sourceBytes.length,
    checksumSha256,
  })
  const finalizedMimeType = finalizedUpload.storageObjectRecord.mimeType ?? 'video/mp4'
  const finalizedSizeBytes = finalizedUpload.storageObjectRecord.sizeBytes ?? sourceBytes.length
  const referenceUpload = await uploadService.createUploadIntent({
    workspaceId,
    projectId,
    chatSessionId: editSessionId,
    uploadPurpose: 'reference_media',
    originalFileName: 'synthetic-reference.mp4',
    mimeType: 'video/mp4',
    expectedSizeBytes: sourceBytes.length,
    checksumSha256,
  })
  await uploadService.uploadLocalObject(referenceUpload.uploadIntent.id, sourceBytes, 'video/mp4')
  const finalizedReference = await uploadService.finalizeUploadIntent({
    workspaceId,
    uploadIntentId: referenceUpload.uploadIntent.id,
    sizeBytes: sourceBytes.length,
    checksumSha256,
  })

  const candidate: AutonomousEditPlanCandidate = {
    status: 'ready_for_approval',
    title: 'Evidence-led private review',
    summary: 'Shape the supplied visual sequence into a restrained private review with motivated graphics and motion.',
    userIntentSummary: 'Create a clean vertical edit with supporting motion that remains grounded in the source.',
    storyStrategy: 'Establish the visual subject, reveal one source-backed idea, and finish with a clear visual resolution.',
    segments: [{
      id: 'visual-opening',
      role: 'hook',
      sourceStartSeconds: 0,
      sourceEndSeconds: 1.5,
      objective: 'Open immediately on the supplied visual subject.',
      narrativeReason: 'The first sampled frame establishes the only source-backed subject.',
      transcriptEvidence: [],
      visualEvidence: ['visual-report: stable centered subject with clear edge space'],
      operations: [{
        operationId: 'timeline.trim',
        instruction: 'Use the opening source range without invented footage.',
        rationale: 'The opening is already visually stable and needs only precise timing.',
        skillKeys: ['clean_cuts'],
        sourceEvidenceRefs: ['visual-report', 'representative-frame-1'],
        requiredQaChecks: ['source_truth', 'cut_smoothness'],
      }, {
        operationId: 'graphics.compose',
        instruction: 'Compose one concise source-backed label in the available edge space.',
        rationale: 'The visual report identifies safe negative space for a restrained support graphic.',
        skillKeys: ['framework_diagram_design'],
        sourceEvidenceRefs: ['visual-report', 'representative-frame-1'],
        requiredQaChecks: ['source_truth', 'graphic_readability', 'safe_zone'],
        executionSpec: {
          kind: 'graphic', graphicId: 'opening-label', graphicType: 'label', title: 'Source-backed idea',
          bodyLines: [], placement: 'top_right', visualStyle: 'accent_label', accentColor: '#62e6ff',
          startOffsetSeconds: 0.15, endOffsetSeconds: 1.25,
          motion: { enter: 'fade_up', exit: 'fade', enterDurationSeconds: 0.2, exitDurationSeconds: 0.18 },
          contentEvidenceRefs: ['visual-report', 'representative-frame-1'],
        },
      }],
      captionDirection: 'No speech captions are needed because the source has no audio stream.',
      visualDirection: 'Keep the source primary and add only one concise label in verified negative space.',
      audioDirection: 'Do not invent audio for this silent source.',
      transitionDirection: 'Use a direct source-safe cut.',
      requiredQaChecks: ['source_truth', 'graphic_readability', 'safe_zone'],
    }, {
      id: 'visual-resolution',
      role: 'ending',
      sourceStartSeconds: 1.5,
      sourceEndSeconds: 2.95,
      objective: 'Resolve the short visual sequence without decorative clutter.',
      narrativeReason: 'The later sampled frame provides a stable ending state.',
      transcriptEvidence: [],
      visualEvidence: ['visual-report: stable ending frame with unchanged subject'],
      operations: [{
        operationId: 'graphics.compose',
        instruction: 'Reveal and clear the approved label with a restrained opacity-and-position transition.',
        rationale: 'Small motion supports the transition while preserving the source as the focal point.',
        skillKeys: ['motion_design_overlay'],
        sourceEvidenceRefs: ['visual-report', 'representative-frame-2'],
        requiredQaChecks: ['motion_restraint', 'safe_zone'],
        executionSpec: {
          kind: 'graphic', graphicId: 'resolution-label', graphicType: 'callout', title: 'Private review',
          bodyLines: ['Evidence remains attached'], placement: 'top_left', visualStyle: 'outline_card', accentColor: '#8f7cff',
          startOffsetSeconds: 0.1, endOffsetSeconds: 1.2,
          motion: { enter: 'slide_right', exit: 'fade', enterDurationSeconds: 0.22, exitDurationSeconds: 0.18 },
          contentEvidenceRefs: ['visual-report', 'representative-frame-2'],
        },
      }, {
        operationId: 'color.correct',
        instruction: 'Apply only neutral source correction if measured values require it.',
        rationale: 'The source should remain visually consistent without an arbitrary look.',
        skillKeys: ['color_consistency_planning'],
        sourceEvidenceRefs: ['visual-report'],
        requiredQaChecks: ['color_consistency', 'source_truth'],
        executionSpec: {
          kind: 'color', brightness: 0.008, contrast: 1.02, saturation: 1.01, gamma: 1,
          warmth: 0, preserveNaturalSkin: true, evidenceBasis: ['visual-report'],
        },
      }, {
        operationId: 'render.compose',
        instruction: 'Compose the approved source ranges and supporting layer into a private review.',
        rationale: 'The approved visual and timing decisions require one review artifact for QA.',
        skillKeys: ['motion_design_overlay'],
        sourceEvidenceRefs: ['visual-report'],
        requiredQaChecks: ['private_artifacts_only', 'final_delivery'],
      }, {
        operationId: 'qa.validate',
        instruction: 'Validate source truth, safe placement, motion restraint, and artifact privacy.',
        rationale: 'Every executed decision must remain traceable to the approved evidence.',
        skillKeys: ['source_safety_qa'],
        sourceEvidenceRefs: ['visual-report', 'representative-frame-2'],
        requiredQaChecks: ['source_truth', 'safe_zone', 'private_artifacts_only'],
      }],
      captionDirection: 'No captions are planned for the silent source.',
      visualDirection: 'Resolve the label before the final frame and leave the source unobstructed.',
      audioDirection: 'Preserve silence.',
      transitionDirection: 'Use one restrained motion resolution and no random transition.',
      requiredQaChecks: ['source_truth', 'motion_restraint', 'private_artifacts_only'],
    }],
    skillSelections: [{
      skillKey: 'clean_cuts',
      reason: 'The source needs only bounded timing refinement.',
      required: true,
      segmentIds: ['visual-opening'],
      operationIds: ['timeline.trim'],
    }, {
      skillKey: 'framework_diagram_design',
      reason: 'Verified negative space supports one concise source-backed label.',
      required: true,
      segmentIds: ['visual-opening'],
      operationIds: ['graphics.compose'],
    }, {
      skillKey: 'motion_design_overlay',
      reason: 'The supporting label needs a restrained reveal and resolution.',
      required: true,
      segmentIds: ['visual-resolution'],
      operationIds: ['graphics.compose', 'render.compose'],
    }, {
      skillKey: 'color_consistency_planning',
      reason: 'Only measured neutral correction is appropriate.',
      required: true,
      segmentIds: ['visual-resolution'],
      operationIds: ['color.correct'],
    }, {
      skillKey: 'source_safety_qa',
      reason: 'The final review must preserve source truth and privacy.',
      required: true,
      segmentIds: ['visual-resolution'],
      operationIds: ['qa.validate'],
    }],
    globalQaChecks: ['source_truth', 'safe_zone', 'motion_restraint', 'private_artifacts_only'],
    clarificationQuestions: [],
    blockers: [],
  }

  let sampledFrameCount = 0
  const visualAnalysisRoles = new Set<string>()
  const planning = await createAutonomousEditPlanningService(context, {
    visualUnderstandingProvider: {
      async analyze(input) {
        visualAnalysisRoles.add(input.analysisRole)
        sampledFrameCount = input.frameArtifacts.length
        assert.ok(sampledFrameCount > 0, 'Source analysis must produce private representative frames.')
        return {
          status: 'completed',
          summary: 'A stable centered visual subject leaves clear edge space for one restrained source-backed label.',
          visibleSubjects: ['centered visual subject'],
          visibleObjects: [],
          screenTextRegions: [],
          compositionRisks: ['keep supporting graphics outside the centered subject'],
          brollOpportunities: [],
          captionObservations: [],
          styleObservations: ['clean restrained source framing'],
          frameEvidence: input.frameArtifacts.map((frame) => ({ frameId: frame.artifactId, timeSeconds: frame.timeSeconds, summary: 'Stable centered subject.', safeZones: ['upper edges'], uncertainty: [] })),
          evidenceArtifactIds: ['visual-report', ...input.frameArtifacts.slice(0, 2).map((frame, index) => `representative-frame-${index + 1}:${frame.artifactId}`)],
          blockers: [],
          warnings: [],
        }
      },
    },
    plannerFetchImpl: async () => new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(candidate) } }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }),
  }).createPlan({
    workspaceId,
    projectId,
    editSessionId,
    idempotencyKey: 'autonomous-activation-smoke-plan',
    prompt: 'Create a restrained professional vertical edit from the uploaded source and prepare a private review.',
    source: {
      storageObjectRecordId: finalizedUpload.storageObjectRecord.id,
      mediaAssetId: finalizedUpload.mediaAsset.id,
      bucketName: finalizedUpload.storageObjectRecord.bucketName,
      objectPath: finalizedUpload.storageObjectRecord.objectPath,
      fileName: 'synthetic-source.mp4',
      mimeType: finalizedMimeType,
      sizeBytes: finalizedSizeBytes,
      checksumSha256: finalizedUpload.storageObjectRecord.checksumSha256,
    },
    referenceSource: {
      storageObjectRecordId: finalizedReference.storageObjectRecord.id,
      mediaAssetId: finalizedReference.mediaAsset.id,
      bucketName: finalizedReference.storageObjectRecord.bucketName,
      objectPath: finalizedReference.storageObjectRecord.objectPath,
      fileName: 'synthetic-reference.mp4',
      mimeType: finalizedReference.storageObjectRecord.mimeType ?? 'video/mp4',
      sizeBytes: finalizedReference.storageObjectRecord.sizeBytes ?? sourceBytes.length,
      checksumSha256: finalizedReference.storageObjectRecord.checksumSha256,
    },
    outputFrame: {
      aspectRatio: '9:16',
      platformTarget: 'internal_review',
      width: 540,
      height: 960,
      confirmed: true,
    },
    analysisMode: 'local_internal',
  })
  assert.equal(planning.status, 'completed', JSON.stringify(planning.blockers))
  assert.equal(planning.plan?.runtime.plannerSource, 'qwen_live')
  assert.equal(planning.plan?.runtime.visualUnderstandingRun, true)
  assert.equal(planning.plan?.runtime.deterministicCreativeFallbackUsed, false)
  assert.equal(planning.referenceEvidence?.status, 'completed')
  assert.equal(planning.referenceEvidence?.referenceDna?.derivedBy, 'qwen_live_with_deterministic_measurements')
  assert.deepEqual([...visualAnalysisRoles].sort(), ['reference_style_analysis', 'source_edit_planning'])
  assert.ok(planning.plan)

  const uploadResult: ProjectSourceVideoBackendUploadResult = {
    status: 'uploaded',
    uploadIntentId: createdUpload.uploadIntent.id,
    storageObjectRecordId: finalizedUpload.storageObjectRecord.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    bucketName: finalizedUpload.storageObjectRecord.bucketName,
    objectPath: finalizedUpload.storageObjectRecord.objectPath,
    fileName: 'synthetic-source.mp4',
    mimeType: finalizedMimeType,
    sizeBytes: finalizedSizeBytes,
    checksumSha256: finalizedUpload.storageObjectRecord.checksumSha256,
    uploadedAt: finalizedUpload.storageObjectRecord.createdAt,
    backendLocalUploadMade: true,
    browserFileBytesSent: true,
    fileBytesReadByBackend: true,
    storageWriteMade: true,
    supabaseWriteMade: false,
    gcsWriteMade: false,
    mediaProcessingStarted: false,
    workerJobCreated: false,
    providerCallMade: false,
    renderJobCreated: false,
    exportJobCreated: false,
    creditReservedOrSpent: false,
    productReady: false,
    warnings: [],
  }
  const approvalModel = buildAutonomousEditPlanApprovalModel({
    attemptId: planning.attemptId,
    draft: planning.plan,
    directionSource: 'chat_prompt',
    sourceVideoUploadResult: uploadResult,
  })
  assert.equal(approvalModel.canApprove, true)

  const planService = createProjectEditPlanService(context)
  const approved = await planService.createApprovedLocalEditPlan({
    workspaceId,
    projectId,
    editSessionId,
    planId: approvalModel.planId,
    title: approvalModel.title,
    summary: approvalModel.summary,
    steps: approvalModel.steps,
    operationManifest: approvalModel.operationManifest,
    planningEvidence: approvalModel.planningEvidence,
    directionSource: approvalModel.directionSource,
    skillPlan: approvalModel.skillPlan,
    creditEstimate: approvalModel.creditEstimate,
    briefLineage: {
      briefId: 'prompt-direction-autonomous-activation',
      revisionNumber: 1,
      briefFingerprint: 'prompt-direction-fingerprint',
    },
    source: {
      storageObjectRecordId: uploadResult.storageObjectRecordId,
      mediaAssetId: uploadResult.mediaAssetId,
      bucketName: uploadResult.bucketName,
      objectPath: uploadResult.objectPath,
      fileName: uploadResult.fileName,
      mimeType: uploadResult.mimeType,
      sizeBytes: uploadResult.sizeBytes,
      checksumSha256: uploadResult.checksumSha256,
    },
  })
  assert.equal(approved.localEditPlan.approvedLocalPlan.autonomousPlanSnapshot?.planId, approvalModel.planId)
  assert.notEqual(approved.localEditPlan.approvedLocalPlan.autonomousPlanSnapshot, planning.plan)

  const activated = await planService.activateApprovedLocalEditPlan(approvalModel.planId, workspaceId)
  const replay = await planService.activateApprovedLocalEditPlan(approvalModel.planId, workspaceId)
  assert.equal(activated.executionGate.status, 'execution_ready')
  assert.equal(activated.executionGate.privateArtifactsOnly, true)
  assert.equal(activated.executionGate.publicDeliveryAllowed, false)
  assert.equal(activated.executionGate.paidBillingMutationMade, false)
  assert.equal(activated.executionGate.productReady, false)
  assert.equal(activated.executionGate.approvedPlanSnapshotId, replay.executionGate.approvedPlanSnapshotId)
  assert.equal(activated.executionGate.creditReservationId, replay.executionGate.creditReservationId)
  assert.ok(activated.executionGate.userFacingWorkSummary.length > 0)
  assert.equal(JSON.stringify(activated.executionGate).includes('ffmpeg'), false)
  assert.equal(JSON.stringify(activated.executionGate).includes('qwen'), false)

  const startedReview = await createAutonomousEditPrivateReviewService(context).startExecution(approvalModel.planId, workspaceId)
  assert.equal(startedReview.execution.status, 'queued')
  const completedReview = await waitForAutonomousPrivateReviewExecution(approvalModel.planId)
  assert.equal(completedReview?.status, 'private_review_ready', completedReview?.error)
  assert.equal(completedReview?.qaSummary?.status, 'passed_technical_qa_pending_user_review')
  assert.equal(completedReview?.privateArtifactsOnly, true)
  assert.equal(completedReview?.publicDeliveryAllowed, false)
  assert.ok(completedReview?.previewStorageObjectRecordId)
  assert.ok(completedReview?.artifactManifestStorageObjectRecordId)
  assert.ok(completedReview?.qaReportStorageObjectRecordId)
  assert.equal(completedReview?.width, 540)
  assert.equal(completedReview?.height, 960)
  const canonicalPreview = await uploadService.createDownloadTarget(completedReview!.previewStorageObjectRecordId!, workspaceId)
  assert.match(canonicalPreview.downloadTarget.downloadUrl, /\/local-object/)

  console.log(JSON.stringify({
    ok: true,
    decision: 'autonomous_edit_activation_transaction_passed',
    sampledFrameCount,
    operationCount: approvalModel.operationManifest.operations.length,
    workSummaryCount: activated.executionGate.userFacingWorkSummary.length,
    checks: {
      uploadedSourceAnalyzed: true,
      privateReferenceMeasuredAndAdapted: true,
      livePlannerEvidenceRequired: true,
      canonicalPlanValidatedServerSide: true,
      estimateApproved: true,
      creditReservationCreatedOnce: true,
      immutableSnapshotValidated: true,
      privateWorkGraphCompiled: true,
      privateReviewExecutionCompleted: true,
      approvedGraphicsMotionRendered: true,
      technicalQaPassedPendingUserReview: true,
      publicDeliveryBlocked: true,
    },
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}
